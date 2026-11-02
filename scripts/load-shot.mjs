// 截取"加载进度显示"的实际效果图：环形进度 + 顶部细条 + 明细行。
// 用法：node scripts/load-shot.mjs
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

const PORT = Number(process.env.PORT || 8097);
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

const browser = await puppeteer.launch({
    executablePath: existsSync(BROWSERS[0]) ? BROWSERS[0] : BROWSERS[1],
    headless: 'new',
    args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required', '--mute-audio',
        '--disable-dev-shm-usage', '--window-size=412,892'].concat(proxyArgs()),
    defaultViewport: { width: 412, height: 892 }
});

try {
    for (let i = 0; i < 60; i++) {
        try { if ((await fetch(BASE + '/e2e/index.html')).ok) break; } catch (e) {}
        await sleep(150);
    }
    const page = await browser.newPage();
    await page.goto(BASE + '/e2e/index.html?vvdebug=1', { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForFunction(() => !!(window.__vv && window.__vv.VV), { timeout: 15000 });
    await page.waitForFunction(() => !!(window.Hls && window.Hls.isSupported && window.Hls.isSupported()),
        { timeout: 45000 }).catch(() => {});
    await page.waitForFunction(() => window.__vv.VV.items.some((i) => i.type === 'HLS'),
        { timeout: 30000 }).catch(() => {});

    // 1) 确定态：直接设一个 46% 并写明细（停掉自动刷新，避免被真实数据覆盖）
    await page.evaluate(() => {
        const it = window.__vv.VV.items.find((i) => i.type === 'HLS') || window.__vv.VV.items[0];
        window.__vv.open(it);
    });
    await page.waitForFunction(() => !!document.querySelector('.vv-player-video'), { timeout: 20000 });
    await sleep(600);
    await page.evaluate(() => {
        window.__vv.stopLoadTick();
        const v = document.querySelector('.vv-player-video');
        try { v.pause(); } catch (e) {}
        window.__vv.setLoadPct(46, false, '3.2 MB / 7.0 MB · 412 KB/s');
        document.querySelector('.vv-loading').classList.add('on');
        document.querySelector('.vv-player-root').classList.add('vv-loading-on');
        document.querySelector('.vv-loadbar').classList.add('on');
        document.querySelector('.vv-loadbar-fill').style.width = '46%';
    });
    await sleep(500);
    await page.screenshot({ path: 'e2e/load-pct.png' });
    console.log('screenshot -> e2e/load-pct.png');

    // 2) 不确定态（缓冲中）
    await page.evaluate(() => {
        window.__vv.setLoadPct(null, true, '268 KB/s');
        const t = document.querySelector('.vv-load-text');
        if (t) t.textContent = '缓冲中…';
    });
    await sleep(400);
    await page.screenshot({ path: 'e2e/load-indet.png' });
    console.log('screenshot -> e2e/load-indet.png');
} finally {
    try { await browser.close(); } catch (e) {}
    try { server.kill(); } catch (e) {}
}
