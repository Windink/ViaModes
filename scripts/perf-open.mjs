// 起播耗时对照：同一档弱网下，「站点自己用 hls.js」 vs 「内置播放器」到底差在哪一步。
//
// 为什么单独做一份：用户反馈「网页播放器很顺，插件播放器起播慢/卡」，但只看界面
// 分不出慢在引擎就绪、清单解析、首片下载还是解码起播；对着代码猜只会猜错方向。
// 这里在同一台机器、同一条流、同一个限速档上跑两遍，把里程碑拆开比对。
//
// 用法：node scripts/perf-open.mjs
//   PORT=8096 ROUNDS=3 MBPS=2.5 LATENCY=120 node scripts/perf-open.mjs
//   MBPS=0 表示不限速（本机带宽基准）
// 不设通过/失败阈值（机器与网络差异大），只校验测量本身有效：
// 两路都真的出了画面、里程碑都齐全，否则认为这一轮无效。
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
const ROUNDS = Math.max(1, Number(process.env.ROUNDS || 3));
const MBPS = Number(process.env.MBPS === undefined ? 2.5 : process.env.MBPS);
const LATENCY = Number(process.env.LATENCY || 120);
// SRC 用来固定单档清单：想剔掉「选档差异」这个变量、只量我们自己的开销时用它
const SRC = process.env.SRC || '';
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
        try { if ((await fetch(BASE + '/e2e/open-latency.html')).ok) return true; } catch (e) {}
        await sleep(150);
    }
    return false;
}

const med = (a) => {
    const v = a.filter((x) => Number.isFinite(x)).sort((x, y) => x - y);
    if (!v.length) return NaN;
    return v.length % 2 ? v[(v.length - 1) / 2] : Math.round((v[v.length / 2 - 1] + v[v.length / 2]) / 2);
};

const STEPS = ['engine', 'manifest', 'meta', 'data', 'frame'];
const LABEL = { engine: '引擎就绪', manifest: '清单解析', meta: '有元数据', data: '有当前数据', frame: '出画面' };

let browser;
try {
    if (!(await waitServer())) throw new Error('server not ready');
    const exe = BROWSERS.find((p) => existsSync(p)) || BROWSERS[0];
    browser = await puppeteer.launch({
        executablePath: exe,
        headless: 'new',
        args: ['--no-sandbox', '--disable-dev-shm-usage', '--autoplay-policy=no-user-gesture-required',
            '--mute-audio', '--window-size=900,700', ...proxyArgs()]
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 900, height: 700, deviceScaleFactor: 1 });
    const cdp = await page.target().createCDPSession();
    if (MBPS > 0) {
        await cdp.send('Network.enable');
        await cdp.send('Network.emulateNetworkConditions', {
            offline: false,
            latency: LATENCY,
            downloadThroughput: Math.round(MBPS * 1024 * 1024 / 8),
            uploadThroughput: Math.round(1 * 1024 * 1024 / 8)
        });
    }

    async function run(kind) {
        // 每个场景都重新加载页面：避免前一轮的 hls 实例/缓冲影响这一轮
        await page.goto(BASE + '/e2e/open-latency.html?vvdebug=1' + (SRC ? '&src=' + encodeURIComponent(SRC) : ''),
            { waitUntil: 'domcontentloaded' });
        await page.waitForFunction(() => !!(window.__bench && window.__vv && window.__vv.open), { timeout: 15000 });
        // 给脚本的 document-start 钩子和样式注入一点稳定时间，别把初始化算进起播
        await sleep(300);
        const started = await page.evaluate((k) => (k === 'ours' ? window.__bench.ourStart() : window.__bench.siteStart()), kind);
        if (started !== 'ok') return { kind, failed: started };
        await page.waitForFunction(() => window.__bench.result().failed || window.__bench.result().marks.frame !== undefined,
            { timeout: 35000, polling: 50 }).catch(() => {});
        const r = await page.evaluate(() => window.__bench.result());
        // 收尾：把这一轮的播放器/实例关干净，下一轮从零开始
        await page.evaluate(() => { try { window.__bench.closeOur(); } catch (e) {} });
        return r;
    }

    const acc = { site: [], ours: [] };
    for (let round = 1; round <= ROUNDS; round++) {
        for (const kind of ['site', 'ours']) {
            const r = await run(kind);
            acc[kind].push(r);
            const m = r.marks || {};
            console.log(`round ${round} ${kind.padEnd(4)} ` +
                STEPS.map((s) => `${s}=${m[s] === undefined ? '-' : m[s]}`).join(' ') +
                (r.level ? `  [${r.level}]` : '') + (r.failed ? `  !! ${r.failed}` : ''));
        }
    }

    console.log('\n== 中位数（ms，从按下到各里程碑）==');
    const head = STEPS.map((s) => LABEL[s].padEnd(8)).join('');
    console.log('              ' + head);
    for (const kind of ['site', 'ours']) {
        const rows = acc[kind].filter((r) => r && r.marks && r.marks.frame !== undefined);
        const line = STEPS.map((s) => {
            const v = med(rows.map((r) => r.marks[s]));
            return (Number.isFinite(v) ? String(v) : '-').padEnd(8);
        }).join('');
        console.log((kind === 'site' ? '站点 hls.js ' : '内置播放器').padEnd(14) + line + `  (有效 ${rows.length}/${acc[kind].length} 轮)`);
    }

    const okRounds = acc.site.filter((r) => r.marks && r.marks.frame !== undefined).length
        && acc.ours.filter((r) => r.marks && r.marks.frame !== undefined).length;
    const dFrame = med(acc.ours.filter((r) => r.marks && r.marks.frame !== undefined).map((r) => r.marks.frame))
        - med(acc.site.filter((r) => r.marks && r.marks.frame !== undefined).map((r) => r.marks.frame));
    console.log(`\n内置播放器比站点 hls.js 晚出画面：${Number.isFinite(dFrame) ? dFrame + 'ms' : '测不出'}`);
    console.log(okRounds ? '测量有效' : '!! 测量无效（有场景没出画面）');
    if (!okRounds) process.exitCode = 1;
} catch (e) {
    console.error('perf-open failed:', e && e.message);
    process.exitCode = 1;
} finally {
    try { if (browser) await browser.close(); } catch (e) {}
    try { server.kill(); } catch (e) {}
}
