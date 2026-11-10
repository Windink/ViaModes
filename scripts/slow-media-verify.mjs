// 慢资源起播回归：验证「只是慢」不会被判成「这个视频源播不了」。
//
// 为什么单独做一份：起播看门狗以前 12 秒一刀切，而"数据还在走"只能靠 hls 的分片事件判断，
// 直连 mp4 永远没有那两个标记 —— 于是弱网下 mp4 慢一点就被当成解码器被占满，销毁重建、
// 从 0 重下；完全没动静时还会把进度环换成一张错误卡片。这几种现场都是"CDN 慢/抖一下"，
// 真机上很常见，靠单测造不出来，必须真的限速跑一遍。
//
// 用法：
//   node scripts/slow-media-verify.mjs                 # 五个场景全跑（约 3.5 分钟）
//   SCENARIOS=stall,dead node scripts/slow-media-verify.mjs   # 只跑判死边界
//   PORT=8096 node scripts/slow-media-verify.mjs        # 本地服务端口
//
// 场景（都基于 scripts/slow-serve.mjs 的限速 + 中途停顿）：
//   steady  慢但在下：8KB/s。12s 不许报错，要续命、加载环改成「网络较慢」。
//   stall   传到一半卡住：200KB/s，60KB 处停 18s（旧版 16.7s 就弹卡片）。要求不报错、
//           不自救，数据恢复后能播起来。
//   dead    假活源：只发 1 字节然后停住。这条是反向保险——续命不能变成无限等，
//           必须在弱证据上限（45s）之后给出结论。
//   hls-manifest  HLS 清单慢：清单 13s 才下完（分片很快）。hls 在清单阶段一个分片都还没
//           开始下，只有 FRAG_* 事件时看门狗等于瞎的——这条就是为补的 MANIFEST_LOADING /
//           LEVEL_LOADING 在飞信号上的保险。
//   hls-frag      HLS 首片慢：清单很快，首个分片 16KB/s 约 15s。模拟弱网下第一片下不完。
//
// HLS 的两条用 e2e/media/hls/*.ts（10s 一段，共两段）当分片，清单在 .tmp/hls-gen/ 里按
// 本轮端口现生成——分片地址必须写成绝对地址，才能给清单和分片分别挂不同的限速参数
// （相对地址只能继承清单自己的 query，挂不到分片上）。
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';

const WS = 'C:/Users/Administrator/.workbuddy/binaries/node/workspace/index.js';
let puppeteer;
try { puppeteer = createRequire(import.meta.url)('puppeteer-core'); }
catch (e) { puppeteer = createRequire(WS)('puppeteer-core'); }

const PORT = Number(process.env.PORT || 8096);
const BASE = `http://127.0.0.1:${PORT}`;
const SLOW_PORT = 8400 + Math.floor(Math.random() * 300);
const ONLY = (process.env.SCENARIOS || '').split(',').map((s) => s.trim()).filter(Boolean);
const BROWSERS = [
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
];

// 按本轮端口现生成清单：清单慢的场景要让清单自己带 stall，分片快；分片慢的场景相反。
function hlsManifest(id, manifQuery, segQuery) {
    const dir = join(process.cwd(), '.tmp', 'hls-gen');
    mkdirSync(dir, { recursive: true });
    const lines = [
        '#EXTM3U',
        '#EXT-X-VERSION:3',
        '#EXT-X-TARGETDURATION:10',
        '#EXT-X-PLAYLIST-TYPE:VOD',
        '# 本地限速回归用：分片写绝对地址，才能单独给分片挂限速参数',
        '#EXTINF:10.000,',
        `http://127.0.0.1:${SLOW_PORT}/e2e/media/hls/seg0.ts?kbps=${segQuery}`,
        '#EXTINF:10.000,',
        `http://127.0.0.1:${SLOW_PORT}/e2e/media/hls/seg1.ts?kbps=${segQuery}`,
        '#EXT-X-ENDLIST',
        ''
    ];
    writeFileSync(join(dir, id + '.m3u8'), lines.join('\n'));
    return { file: `.tmp/hls-gen/${id}.m3u8`, query: manifQuery };
}

function proxyArgs() {
    const p = process.env.HTTPS_PROXY || process.env.https_proxy || process.env.HTTP_PROXY || process.env.http_proxy;
    return p ? ['--proxy-server=' + p, '--proxy-bypass-list=127.0.0.1;localhost'] : [];
}

// 三个场景的差别只在"服务怎么发数据"和"期望什么"，量法完全一致
const SCENARIOS = [
    {
        id: 'steady',
        title: '慢但在下（8KB/s，数据一直在走）',
        file: 'e2e/flower.mp4', kbps: 8, extra: '', dur: 26,
        check(c) {
            c.chk(c.err === 0, '全程不出现错误卡片');
            c.chk(c.rescue === 0, '不触发解码器自救（慢 ≠ 解码器被占满）');
            c.chk(c.ext >= 1, '12s 时按证据续命，而不是判死');
            c.chk(c.slowText, '加载环改文案为「网络较慢，仍在加载」');
        }
    },
    {
        id: 'stall',
        title: '传到一半卡住（200KB/s，60KB 处停 18s）',
        file: 'e2e/media/bb720.mp4', kbps: 200, extra: '&stallAfter=60000&stallMs=18000', dur: 34,
        check(c) {
            c.chk(c.err === 0, '卡顿期间不出现错误卡片');
            c.chk(c.rescue === 0, '不销毁重建播放实例');
            c.chk(c.ext >= 1, '卡顿期间按证据续命');
            c.chk(c.played, '数据恢复后正常出画播放');
        }
    },
    {
        id: 'dead',
        title: '假活源（发 1 字节后停住，续命不能变无限等）',
        file: 'e2e/media/bb720.mp4', kbps: 200, extra: '&stallAfter=1&stallMs=600000', dur: 56,
        check(c) {
            c.chk(c.errAt < 0 || c.errAt >= 35000, '35s 前不误报（弱证据还在宽限期内）');
            c.chk(c.err > 0, '最终给出「播不了」的结论（没有无限等）');
            c.chk(c.errAt < 0 || c.errAt <= 54000, '结论落在弱证据上限 45s 附近（≤54s）');
        }
    },
    {
        id: 'hls-manifest',
        title: 'HLS 清单慢（清单 stall 13s，分片很快）',
        type: 'HLS',
        ...hlsManifest('hls-manifest', 'kbps=1&stallAfter=1&stallMs=13000', 3000),
        dur: 28,
        check(c) {
            c.chk(c.err === 0, '清单慢不许弹「这个视频源播不了」');
            c.chk(c.rescue === 0, '不销毁重建播放实例');
            c.chk(c.ext >= 1, '12s 时按「清单在飞」续命，而不是判死');
            c.chk(c.played, '清单下完后正常出画');
        }
    },
    {
        id: 'hls-frag',
        title: 'HLS 首片慢（清单很快，首个分片 16KB/s 约 15s）',
        type: 'HLS',
        ...hlsManifest('hls-frag', 'kbps=3000', 16),
        dur: 34,
        check(c) {
            c.chk(c.err === 0, '首片慢不许弹「这个视频源播不了」');
            c.chk(c.rescue === 0, '不销毁重建播放实例');
            c.chk(c.ext >= 1, '12s 时按「分片在飞」续命');
            c.chk(c.played, '首片下完后正常出画');
        }
    }
];

const server = spawn(process.execPath, ['scripts/serve.mjs'], {
    cwd: process.cwd(), stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, PORT: String(PORT) }
});
server.stdout.on('data', () => {});
server.stderr.on('data', () => {});
const slow = spawn(process.execPath, ['scripts/slow-serve.mjs'], {
    cwd: process.cwd(), stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, SLOW_PORT: String(SLOW_PORT) }
});
slow.stdout.on('data', () => {});
slow.stderr.on('data', () => {});

async function waitPort(url) {
    for (let i = 0; i < 80; i++) {
        try { if ((await fetch(url)).ok) return true; } catch (e) {}
        await sleep(150);
    }
    return false;
}

// 页内：记录播放器 video 的真实事件，并把判据/DOM 状态采样回宿主
const PAGE_HOOK = function () {
    window.__ev = [];
    window.__hook = function () {
        var root = document.querySelector('.vv-player-root');
        var v = root && root.querySelector('video');
        if (!v || v.__hooked) return;
        v.__hooked = 1;
        ['loadstart', 'loadedmetadata', 'loadeddata', 'progress', 'playing', 'waiting', 'error']
            .forEach(function (n) {
                v.addEventListener(n, function () {
                    window.__ev.push({ t: Math.round(performance.now()), n: n, rx: v.readyState, ns: v.networkState });
                });
            });
    };
    window.__hook();
};

let browser;
const rows = [];
let failed = 0;

try {
    const okServe = await waitPort(BASE + '/e2e/index.html');
    const okSlow = await waitPort(`http://127.0.0.1:${SLOW_PORT}/health`);
    if (!okServe || !okSlow) throw new Error('服务没起来（serve / slow-serve）');

    const exe = BROWSERS.find((p) => existsSync(p)) || BROWSERS[0];
    browser = await puppeteer.launch({
        executablePath: exe,
        headless: 'new',
        args: ['--no-sandbox', '--disable-dev-shm-usage', '--autoplay-policy=no-user-gesture-required',
            '--mute-audio', '--proxy-bypass-list=127.0.0.1;localhost', ...proxyArgs()]
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 412, height: 860 });

    for (const sc of SCENARIOS) {
        if (ONLY.length && !ONLY.includes(sc.id)) continue;
        console.log('\n▶ ' + sc.title);

        await page.goto(BASE + '/e2e/index.html?vvdebug=1', { waitUntil: 'domcontentloaded' });
        await page.waitForFunction(() => !!(window.__vv && window.__vv.open), { timeout: 15000 });
        await sleep(300);
        const qs = sc.query || `kbps=${sc.kbps}${sc.extra}`;
        const media = `http://127.0.0.1:${SLOW_PORT}/${sc.file}?${qs}`;
        const kind = sc.type || 'MP4';
        const t0 = await page.evaluate((hookSrc, u, k) => {
            (0, eval)('(' + hookSrc + ')')();
            const t = performance.now();
            try { window.__vv.open({ url: u, type: k }); } catch (e) {}
            return t;
        }, PAGE_HOOK.toString(), media, kind);

        const samples = [];
        const until = Date.now() + sc.dur * 1000;
        while (Date.now() < until) {
            const s = await page.evaluate((t0) => {
                window.__hook();
                var root = document.querySelector('.vv-player-root');
                var v = root && root.querySelector('video');
                var eb = root && root.querySelector('.vv-err');
                var ld = root && root.querySelector('.vv-loading');
                var d = window.__vv.startDiag();
                return {
                    el: Math.round(performance.now() - t0),
                    rx: v ? v.readyState : -1,
                    ns: v ? v.networkState : -1,
                    paused: v ? !!v.paused : null,
                    err: eb && eb.className.indexOf('on') >= 0 ? 1 : 0,
                    errText: eb ? ((eb.querySelector('.vv-err-t') || {}).textContent || '') : '',
                    ltx: ld ? ((ld.querySelector('.vv-load-text') || {}).textContent || '') : '',
                    ldet: ld ? ((ld.querySelector('.vv-load-detail') || {}).textContent || '') : '',
                    lon: ld ? (ld.className.indexOf('on') >= 0 ? 1 : 0) : -1,
                    // 续命 / 自救 / 证据档位：判定过程本身也要能看见，不然只能靠猜
                    ext: d.ext, rescue: d.rescue, flow: d.flow, wdogAge: d.wdogAge,
                    manif: d.manif ? 1 : 0, loading: d.loading ? 1 : 0, netAgo: d.netAgo,
                    httpCode: d.httpCode, netFail: d.netFail
                };
            }, t0).catch(() => null);
            if (s) samples.push(s);
            await sleep(250);
        }
        const evs = await page.evaluate(() => window.__ev || []);
        await page.evaluate(() => { try { window.__vv.close(); } catch (e) {} });

        rows.push({ sc, samples, evs });
        const errs = samples.filter((s) => s.err === 1);
        const firstErr = errs[0];
        const played = evs.some((e) => e.n === 'playing') || samples.some((s) => s.rx >= 2 && !s.paused);
        const ctx = {
            err: errs.length,
            errAt: firstErr ? firstErr.el : -1,
            errText: firstErr ? firstErr.errText : '',
            rescue: Math.max(0, ...samples.map((s) => s.rescue || 0)),
            ext: Math.max(0, ...samples.map((s) => s.ext || 0)),
            maxFlow: Math.max(0, ...samples.map((s) => s.flow || 0)),
            played,
            slowText: samples.some((s) => s.el > 12000 && s.ltx.indexOf('网络较慢') >= 0 && s.lon === 1)
        };

        // 逐条断言 + 一行关键现场，跑挂了能直接从输出定位
        const out = [];
        ctx.chk = (cond, msg) => {
            const ok = !!cond;
            if (!ok) failed++;
            out.push(`${ok ? '✔' : '✘'} ${msg}`);
        };
        sc.check(ctx);
        for (const line of out) console.log('  ' + line);
        // 有失败时打一条「判据时间线」：只看最终数字分不清是证据没建立、
        // 还是证据建立了但续命逻辑没生效
        if (out.some((l) => l.startsWith('✘'))) {
            console.log('  判据时间线（状态变化才打）：');
            let prev = '';
            for (const s of samples) {
                const key = [s.rx, s.ns, s.manif, s.loading, s.flow, s.ext, s.err].join('|');
                if (key === prev) continue;
                prev = key;
                console.log(`    ${String((s.el / 1000).toFixed(1)).padStart(5)}s rx=${s.rx} ns=${s.ns}` +
                    ` 清单在飞=${s.manif} 分片在飞=${s.loading} 证据=${s.flow} 续命=${s.ext}` +
                    ` 到账=${s.netAgo < 0 ? '-' : ((s.netAgo / 1000).toFixed(1) + 's前')} 错误卡=${s.err}` +
                    ` http=${s.httpCode || 0} netFail=${s.netFail || 0}`);
            }
        }
        console.log(`  现场：错误卡 ${ctx.err} 次` + (ctx.errAt >= 0 ? `（首次 ${(ctx.errAt / 1000).toFixed(1)}s「${ctx.errText}」）` : '') +
            `；续命 ${ctx.ext} 次；自救 ${ctx.rescue}；最高证据档 ${ctx.maxFlow}；出画 ${ctx.played ? 'Y' : 'N'}`);
        const last = samples[samples.length - 1] || {};
        // rx=-1 说明播放器已经不在了：短片（10s）播完会自动关，不是异常
        const alive = last.rx === -1 ? 'rx=-1（播放器已关闭，短片播完会自动关）' : `rx=${last.rx} ns=${last.ns}`;
        console.log(`  收尾：${alive} 加载环=${last.lon} 「${last.ltx}」${last.ldet || ''}`);
    }

    console.log(`\n慢资源起播回归：${failed === 0 ? '全部通过' : failed + ' 项失败'}`);
    if (failed) process.exitCode = 1;
} catch (e) {
    console.error('slow-media-verify failed:', e && e.message);
    process.exitCode = 1;
} finally {
    try { if (browser) await browser.close(); } catch (e) {}
    try { server.kill(); } catch (e) {}
    try { slow.kill(); } catch (e) {}
}
