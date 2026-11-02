// 截图用：打开"外部播放器"浮层，点自检，看判定结果
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises';

const WS = 'C:/Users/Administrator/.workbuddy/binaries/node/workspace/index.js';
let puppeteer;
try { puppeteer = createRequire(import.meta.url)('puppeteer-core'); }
catch (e) { puppeteer = createRequire(WS)('puppeteer-core'); }

const PORT = Number(process.env.PORT || 8098);
const BASE = `http://127.0.0.1:${PORT}`;
const BROWSERS = [
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
];

const server = spawn(process.execPath, ['scripts/serve.mjs'], {
    cwd: process.cwd(),
    env: { ...process.env, PORT: String(PORT) },
    stdio: ['ignore', 'pipe', 'pipe']
});
server.stdout.on('data', () => {});
const cleanup = () => { try { server.kill(); } catch (e) {} };

let browser;
try {
    for (let i = 0; i < 50; i++) {
        try { if ((await fetch(BASE + '/e2e/index.html')).ok) break; } catch (e) {}
        await sleep(150);
    }
    browser = await puppeteer.launch({
        executablePath: existsSync(BROWSERS[0]) ? BROWSERS[0] : BROWSERS[1],
        headless: 'new',
        args: ['--no-sandbox', '--mute-audio', '--disable-dev-shm-usage'],
        defaultViewport: { width: 412, height: 892 }
    });
    const page = await browser.newPage();
    await page.goto(BASE + '/e2e/index.html?vvdebug=1', { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForFunction(() => !!(window.__vv && window.__vv.shareOpen), { timeout: 20000 });

    await page.evaluate(() => {
        window.__vv.shareOpen({ url: location.origin + '/guard/stream.m3u8', type: 'HLS', name: '演示流' });
    });
    await page.waitForSelector('#vv-share-wrap .vv-share-btn');
    // 点"自检兼容性"（第 4 个按钮）
    await page.evaluate(() => {
        const btns = document.querySelectorAll('#vv-share-wrap .vv-share-btn');
        btns[btns.length - 1].click();
    });
    await page.waitForFunction(() => {
        const v = document.querySelector('#vv-share-wrap .vv-share-verdict');
        return v && v.textContent.length > 4;
    }, { timeout: 20000 });
    await sleep(400);
    await page.screenshot({ path: 'e2e/share-probe.png' });
    const text = await page.evaluate(() => document.querySelector('#vv-share-wrap').innerText);
    console.log('--- 浮层文本 ---\n' + text);
    console.log('\nscreenshot -> e2e/share-probe.png');
} catch (e) {
    console.error('SHARE SHOT ERROR:', e && e.message);
    process.exitCode = 1;
} finally {
    try { if (browser) await browser.close(); } catch (e) {}
    cleanup();
}
