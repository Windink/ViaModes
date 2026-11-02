// 在真实浏览器里跑一遍播放器：本地 mp4（流畅对照）+ 公网 HLS（弱网策略），
// 边播边采样指标，最后落两张截图。用法：node scripts/bench.mjs
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises';

const WS = 'C:/Users/Administrator/.workbuddy/binaries/node/workspace/index.js';
let puppeteer;
try {
    puppeteer = createRequire(import.meta.url)('puppeteer-core');
} catch (e) {
    puppeteer = createRequire(WS)('puppeteer-core');
}

const PORT = Number(process.env.PORT || 8099);
const BASE = `http://127.0.0.1:${PORT}`;
const BROWSERS = [
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
];

function proxyArgs() {
    const p = process.env.HTTPS_PROXY || process.env.https_proxy || process.env.HTTP_PROXY || process.env.http_proxy;
    return p ? ['--proxy-server=' + p, '--proxy-bypass-list=127.0.0.1;localhost'] : [];
}

const server = spawn(process.execPath, ['scripts/serve.mjs'], {
    cwd: process.cwd(),
    env: { ...process.env, PORT: String(PORT) },
    stdio: ['ignore', 'pipe', 'pipe']
});
server.stdout.on('data', () => {});

async function waitServer() {
    for (let i = 0; i < 50; i++) {
        try { if ((await fetch(BASE + '/e2e/bench.html')).ok) return true; } catch (e) {}
        await sleep(150);
    }
    return false;
}

function pad(s, n) { s = String(s); while (s.length < n) s += ' '; return s; }

async function sample(page, seconds, tag) {
    const rows = [];
    for (let i = 0; i < seconds; i++) {
        const s = await page.evaluate(() => {
            const vv = window.__vv;
            const a = vv && vv.VV && vv.VV.active;
            const v = document.querySelector('.vv-player-video');
            if (!a || !v) return null;
            const inst = a.hls;
            const lv = inst && inst.levels && inst.currentLevel >= 0 ? inst.levels[inst.currentLevel] : null;
            const q = v.getVideoPlaybackQuality ? v.getVideoPlaybackQuality() : null;
            const dl = (a._fragMsSum && a._fragBytesSum) ? a._fragBytesSum / a._fragMsSum : 0;
            return {
                t: v.currentTime || 0,
                ahead: vv.bufAhead(),
                stalls: a._waitCount || 0,
                stallMs: Math.round(a._waitMs || 0),
                level: lv ? (lv.height || '?') + 'P' : '-',
                bw: inst ? Math.round((inst.bandwidthEstimate || 0) / 1000) : 0,
                dlKb: dl,
                needKb: lv && lv.bitrate ? lv.bitrate / 8000 : 0,
                drop: q ? q.droppedVideoFrames : 0,
                frames: q ? q.totalVideoFrames : 0,
                paused: v.paused,
                ready: v.readyState
            };
        });
        if (s) {
            rows.push(s);
            console.log(pad(tag, 6) + ' t=' + s.t.toFixed(1) + 's' +
                '  ahead=' + s.ahead.toFixed(1) + 's' +
                '  ' + pad(s.level, 5) +
                '  dl=' + s.dlKb.toFixed(1) + 'KB/s' +
                '  load=' + (s.dlKb && s.needKb ? Math.round(s.needKb / s.dlKb * 100) + '%' : '-') +
                '  stall=' + s.stalls + '(' + s.stallMs + 'ms)' +
                '  drop=' + s.drop + '/' + s.frames);
        }
        await sleep(1000);
    }
    return rows;
}

let browser;
try {
    if (!await waitServer()) throw new Error('本地服务器未启动');
    console.log('服务就绪', BASE);

    browser = await puppeteer.launch({
        executablePath: existsSync(BROWSERS[0]) ? BROWSERS[0] : BROWSERS[1],
        headless: 'new',
        args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required', '--mute-audio',
            '--disable-dev-shm-usage', '--enable-unsafe-swiftshader'].concat(proxyArgs()),
        defaultViewport: { width: 412, height: 892, deviceScaleFactor: 1 }
    });

    const page = await browser.newPage();
    const errs = [];
    page.on('pageerror', (e) => errs.push(String(e && e.message || e)));

    await page.goto(BASE + '/e2e/bench.html?vvdebug=1', { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForFunction(() => !!(window.__vv && window.__vv.VV), { timeout: 15000 });
    console.log('脚本已注入，调试句柄可用\n');

    // ---------- 第一轮：本地 mp4 ----------
    console.log('=== 第一轮：本地 mp4（无网络瓶颈）===');
    await page.waitForFunction(() => window.__vv.VV.items.some((i) => i.type === 'MP4'), { timeout: 15000 })
        .catch(() => {});
    const mp4Open = await page.evaluate(() => {
        const it = window.__vv.VV.items.find((i) => i.type === 'MP4');
        if (!it) return null;
        window.__vv.open(it);
        return it.url;
    });
    console.log('打开 mp4:', mp4Open);
    await page.waitForFunction(() => {
        const v = document.querySelector('.vv-player-video');
        return v && v.readyState >= 2 && !v.paused;
    }, { timeout: 20000 });
    // 样本视频只有 5.1s，播完会触发连播逻辑退出播放器，这里循环播放保证采样期间一直在播
    await page.evaluate(() => {
        const v = document.querySelector('.vv-player-video');
        v.loop = true;
        v.currentTime = 0.5;
        v.play().catch(() => {});
    });
    const mp4Rows = await sample(page, 5, 'mp4');

    // 唤出控制栏再截图
    await page.mouse.move(206, 500);
    await sleep(300);
    await page.mouse.move(210, 480);
    await sleep(300);
    await page.screenshot({ path: 'e2e/bench-mp4.png' });
    console.log('截图: e2e/bench-mp4.png\n');
    await page.evaluate(() => window.__vv.close());
    await sleep(800);

    // ---------- 第二轮：公网 HLS ----------
    console.log('=== 第二轮：公网 HLS（弱网，看策略行为）===');
    const started = await page.evaluate(() => window.__startHls());
    console.log('页面 HLS 启动:', started);
    await page.waitForFunction(() => window.__vv.VV.items.some((i) => i.type === 'HLS'), { timeout: 30000 })
        .catch(() => {});
    const hlsOpen = await page.evaluate(() => {
        const it = window.__vv.VV.items.find((i) => i.type === 'HLS');
        if (!it) return null;
        window.__vv.open(it);
        return it.url;
    });
    console.log('打开 m3u8:', hlsOpen);
    const hlsUp = await page.waitForFunction(() => {
        const a = window.__vv.VV.active;
        return !!(a && a.hls && a.hls.levels && a.hls.levels.length);
    }, { timeout: 30000 }).then(() => true).catch(() => false);
    console.log('hls.js 实例:', hlsUp ? '已就绪' : '超时');

    if (hlsUp) {
        await page.evaluate(() => { const v = document.querySelector('.vv-player-video'); v.play().catch(() => {}); });
        // 公网源慢，起播可能要十几秒，等到真的出画面再采样
        const playing = await page.waitForFunction(() => {
            const v = document.querySelector('.vv-player-video');
            return v && v.currentTime > 0.5 && v.readyState >= 3;
        }, { timeout: 90000, polling: 500 }).then(() => true).catch(() => false);
        console.log('起播:', playing ? '已出画面' : '超时（源太慢）');

        const hlsRows = await sample(page, 12, 'hls');
        const diag = await page.evaluate(() => window.__vv.diag());
        await page.mouse.move(206, 500);
        await sleep(400);
        await page.screenshot({ path: 'e2e/bench-hls.png' });
        console.log('截图: e2e/bench-hls.png');

        console.log('\n--- 诊断文本 ---');
        console.log(diag);

        // 汇总
        const last = hlsRows[hlsRows.length - 1] || {};
        const sum = (k) => hlsRows.reduce((n, r) => n + (r[k] || 0), 0);
        console.log('\n=== 汇总 ===');
        console.log('mp4 : 卡顿 ' + (mp4Rows.length ? mp4Rows[mp4Rows.length - 1].stalls : 0) + ' 次，' +
            '丢帧 ' + (mp4Rows.length ? mp4Rows[mp4Rows.length - 1].drop : 0) + '，' +
            '缓冲均值 ' + (mp4Rows.reduce((n, r) => n + r.ahead, 0) / (mp4Rows.length || 1)).toFixed(1) + 's');
        console.log('hls : 卡顿 ' + (last.stalls || 0) + ' 次，丢帧 ' + (last.drop || 0) + '，' +
            '缓冲均值 ' + (hlsRows.reduce((n, r) => n + r.ahead, 0) / (hlsRows.length || 1)).toFixed(1) + 's，' +
            '下载均值 ' + (sum('dlKb') / (hlsRows.length || 1)).toFixed(1) + 'KB/s');
    }

    if (errs.length) console.log('\n运行时错误:', errs.slice(0, 5));
    else console.log('\n运行时错误: 无');
} catch (e) {
    console.error('BENCH ERROR:', e && e.message);
    process.exitCode = 1;
} finally {
    try { if (browser) await browser.close(); } catch (e) {}
    try { server.kill(); } catch (e) {}
}
