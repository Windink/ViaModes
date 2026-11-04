// 重站性能对比：同一套"重站"负载下，注入脚本 vs 不注入，量化脚本的实际开销。
//
// 为什么需要这个：用户反馈"有的站开十几个没事，有的站开一个就卡"。
// 这种描述没法直接定位——差别可能在站点自身，也可能在我们的嗅探逻辑被站点特性放大。
// 唯一能分开两者的办法：把负载固定成同一份，只切换"有没有我们的脚本"。
//
// 三类负载对应真实站点的三种形态：
//   1) 多个 MB 级 text/javascript bundle（资讯/视频站的常态）
//   2) 高频 JSON 接口（信息流、轮询、评论）
//   3) 瀑布流无限追加 + 懒加载改 src（DOM 抖动）
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises';

const WS = 'C:/Users/Administrator/.workbuddy/binaries/node/workspace/index.js';
let puppeteer;
try { puppeteer = createRequire(import.meta.url)('puppeteer-core'); }
catch (e) { puppeteer = createRequire(WS)('puppeteer-core'); }

const PORT = Number(process.env.PORT || 8096);
const BASE = `http://127.0.0.1:${PORT}`;
const RUN_MS = Number(process.env.RUN_MS || 14000);
const CPU = Number(process.env.CPU || 4);
const BROWSERS = [
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
];

function proxyArgs() {
    const p = process.env.HTTPS_PROXY || process.env.https_proxy || process.env.HTTP_PROXY || process.env.http_proxy;
    return p ? ['--proxy-server=' + p, '--proxy-bypass-list=127.0.0.1;localhost'] : [];
}

const server = spawn(process.execPath, ['scripts/serve.mjs'], {
    cwd: process.cwd(), stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, PORT: String(PORT) }
});
server.stdout.on('data', () => {});
server.stderr.on('data', () => {});

async function waitServer() {
    for (let i = 0; i < 60; i++) {
        try { const r = await fetch(BASE + '/e2e/index.html'); if (r.ok) return true; } catch (e) {}
        await sleep(150);
    }
    return false;
}

async function run(browser, noscript) {
    const page = await browser.newPage();
    page.on('pageerror', () => {});
    const cdp = await page.target().createCDPSession();
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU });
    const q = `/e2e/heavy-site.html?vvdebug=1&js=3&jskb=1200&api=12&apikb=48&nodes=120${noscript ? '&noscript=1' : ''}`;
    await page.goto(BASE + q, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await sleep(RUN_MS);
    const data = await page.evaluate(() => {
        const r = window.__perfReport();
        const out = { ...r };
        try {
            const VV = window.__vv && window.__vv.VV;
            if (VV) {
                out.items = VV.items.length;
                out.srcBlocked = VV._gateSrcBlocked || 0;
            }
            if (window.__vv && window.__vv.cost) out.cost = window.__vv.cost();
        } catch (e) {}
        return out;
    });
    await page.close();
    return data;
}

function row(label, a, b) {
    const d = (x, y) => {
        if (!x) return '—';
        return ((y - x) / x * 100).toFixed(0) + '%';
    };
    console.log(
        label.padEnd(16) +
        String(a).padStart(10) + String(b).padStart(10) + String(d(a, b)).padStart(9)
    );
}

let browser;
try {
    if (!await waitServer()) throw new Error('server 未启动');
    browser = await puppeteer.launch({
        executablePath: existsSync(BROWSERS[0]) ? BROWSERS[0] : BROWSERS[1],
        headless: 'new',
        args: ['--no-sandbox', '--mute-audio', '--window-size=420,900',
            '--autoplay-policy=no-user-gesture-required', '--js-flags=--expose-gc']
            .concat(proxyArgs()),
        defaultViewport: { width: 420, height: 900 }
    });

    // 先各跑一次热身，避免"首次模块编译"算进对比里
    await run(browser, true);
    await run(browser, false);

    const plain = await run(browser, true);
    const withUs = await run(browser, false);

    console.log('\n负载：3×1.2MB JS bundle + 12 个/秒 48KB JSON + 120 节点/秒瀑布流');
    console.log('CPU 降速 ' + CPU + 'x，各跑 ' + (RUN_MS / 1000) + 's\n');
    console.log('指标'.padEnd(16) + '无脚本'.padStart(10) + '有脚本'.padStart(10) + '变化'.padStart(9));
    console.log('-'.repeat(45));
    row('长任务总时长(ms)', plain.long, withUs.long);
    row('长任务次数', plain.longN, withUs.longN);
    row('最长单次(ms)', plain.maxLong, withUs.maxLong);
    row('P95 帧间隔(ms)', plain.p95Gap, withUs.p95Gap);
    row('平均帧间隔(ms)', plain.avgGap, withUs.avgGap);
    row('掉帧率(%)', plain.jankRate, withUs.jankRate);
    row('JS 堆(MB)', plain.heapMB, withUs.heapMB);
    console.log('-'.repeat(45));
    console.log('脚本侧：嗅探条目 ' + (withUs.items ?? '—') +
        ' · 拦下装源 ' + (withUs.srcBlocked ?? '—'));
    if (withUs.cost) {
        const c = withUs.cost;
        console.log('  DOM 节点处理 ' + c.moNodes + ' / 丢弃 ' + c.moDropped +
            ' / 队列余 ' + c.moQueue);
        console.log('  响应体：读取 ' + c.bodyRead + ' 次，跳过 ' + c.bodySkip + ' 次（约 ' + c.bodySkipMb + 'MB）');
        console.log('  去重表：seen ' + c.seen + ' / perf ' + c.perfSeen);
    }

    // ---- 长任务误判检查 ----
    // 重页面被自己的脚本卡住 2 秒时 rAF 会断，旧逻辑（1.6s 阈值）会把它读成"用户切走了"，
    // 接着拆解码器 + 拦建源，站点永久停在加载圈上。这一组专门盯这个。
    {
        const p2 = await browser.newPage();
        p2.on('pageerror', () => {});
        const cdp2 = await p2.target().createCDPSession();
        await cdp2.send('Emulation.setCPUThrottlingRate', { rate: CPU });
        await p2.goto(BASE + '/e2e/heavy-site.html?vvdebug=1&stall=1&js=0&api=2&nodes=20&jskb=50',
            { waitUntil: 'domcontentloaded', timeout: 60000 });
        await sleep(21000);
        const m = await p2.evaluate(() => {
            const VV = window.__vv && window.__vv.VV;
            const v = document.getElementById('siteVideo');
            const f = window.__vv && window.__vv.front ? window.__vv.front() : {};
            return {
                stalls: window.__perf.stalls || 0,
                bg: VV ? !!VV._bg : null,
                bgCount: VV ? (VV._bgCount || 0) : null,
                gateSrc: VV ? (VV._gateSrcBlocked || 0) : null,
                pipelines: f.pipelines,
                paused: v ? v.paused : null,
                hasSrc: v ? !!(v.currentSrc || v.getAttribute('src')) : null,
                readyState: v ? v.readyState : null,
                played: window.__perf.played || 0,
                playErr: window.__perf.playErr || '',
                gateBlocked: VV ? (VV._gateBlocked || 0) : null
            };
        });
        await p2.close();
        console.log('\n长任务误判检查（每 6s 卡主线程 2s，共 21s）');
        console.log('  卡顿次数 ' + m.stalls +
            ' · 被判后台 ' + (m.bgCount ?? '—') + ' 次' +
            ' · 拦下建源 ' + (m.gateSrc ?? '—') + ' 次');
        console.log('  页面视频 paused=' + m.paused + ' readyState=' + m.readyState +
            ' 有源=' + m.hasSrc + ' 管线=' + m.pipelines +
            ' 起播=' + (m.played ? 'ok' : ('失败:' + (m.playErr || '?'))) +
            ' 拦起播 ' + m.gateBlocked + ' 次');
        // 判据不看 paused：无头环境里 muted 自动播也常被拒，paused 反映的是浏览器策略不是我们的行为。
        // 真正要确认的是"页面还在前台、源没被摘、管线还在"。
        const good = m.stalls >= 2 && (m.bgCount === 0) && m.gateSrc === 0 &&
            m.pipelines >= 1 && m.hasSrc === true;
        console.log(good ? '  ✓ 本页卡住没有被误判成后台，播放未中断'
            : '  ✗ 卡顿被误判为后台（会导致站点永久 loading）');
    }
} finally {
    if (browser) await browser.close().catch(() => {});
    server.kill();
}
