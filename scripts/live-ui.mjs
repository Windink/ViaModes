// 直播 UI 专项：时长文案、进度条、拖动是否被拦住
import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { setTimeout as sleep } from 'node:timers/promises';
const WS = 'C:/Users/Administrator/.workbuddy/binaries/node/workspace/index.js';
let puppeteer;
try { puppeteer = createRequire(import.meta.url)('puppeteer-core'); } catch (e) { puppeteer = createRequire(WS)('puppeteer-core'); }
const BROWSERS = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'];
const scriptSrc = await readFile('dist/via-video-player.user.js', 'utf8');

const browser = await puppeteer.launch({
    executablePath: existsSync(BROWSERS[0]) ? BROWSERS[0] : BROWSERS[1],
    headless: 'new',
    args: ['--no-sandbox', '--no-proxy-server', '--mute-audio', '--autoplay-policy=no-user-gesture-required'],
    defaultViewport: { width: 412, height: 892 }
});
const page = await browser.newPage();
await page.evaluateOnNewDocument(scriptSrc);
await page.goto('https://video.example.com/live/ch1/', { waitUntil: 'domcontentloaded', timeout: 45000 }).catch(() => {});
await sleep(3500);

await page.evaluate(async () => {
    const badge = document.querySelector('.vv-badge');
    if (badge) badge.click();
    await new Promise((r) => setTimeout(r, 700));
    const wrap = document.getElementById('vv-panel-wrap');
    const rows = wrap ? [...wrap.querySelectorAll('.vv-row')] : [];
    const row = rows.find((r) => /m3u8/.test((r.querySelector('.vv-tag') || {}).textContent || '')) || rows[0];
    if (row) {
        const btn = [...row.querySelectorAll('button')].find((b) => /▶|播放/.test(b.textContent + b.title)) || row.querySelectorAll('button')[0];
        if (btn) btn.click();
    }
});
// 等起播
let started = false;
for (let i = 0; i < 40; i++) {
    await sleep(400);
    started = await page.evaluate(() => { const v = document.querySelector('.vv-player-video'); return !!v && v.readyState >= 2 && v.currentTime > 0.5; });
    if (started) break;
}
console.log('起播: ' + (started ? 'yes' : 'no'));

// 点中间唤出控制栏
await page.evaluate(() => {
    const root = document.querySelector('.vv-player-root');
    if (root) root.click();
});
await sleep(400);

const ui = await page.evaluate(() => {
    const t = (sel) => { const e = document.querySelector(sel); return e ? e.textContent.trim() : '(缺)'; };
    const w = (sel) => { const e = document.querySelector(sel); return e ? e.style.width : '(缺)'; };
    const v = document.querySelector('.vv-player-video');
    const ctrl = document.querySelector('.vv-ctrl');
    return {
        dur: t('#vv-dur'), cur: t('#vv-cur'),
        fillW: w('.vv-prog-fill'), dotL: (() => { const e = document.querySelector('.vv-prog-dot'); return e ? e.style.left : '(缺)'; })(),
        ctrlVisible: ctrl ? getComputedStyle(ctrl).opacity : '(缺)',
        duration: isFinite(v.duration) ? v.duration : 'Infinity',
        live: v.duration === Infinity
    };
});
console.log('控制栏: ' + JSON.stringify(ui));

// 拖动进度条：直播应被拦住（currentTime 不许乱跳）
const before = await page.evaluate(() => document.querySelector('.vv-player-video').currentTime);
const dragRes = await page.evaluate(async () => {
    const bar = document.querySelector('.vv-prog');
    if (!bar) return { err: 'no bar' };
    const r = bar.getBoundingClientRect();
    const opts = { bubbles: true, cancelable: true, clientX: r.left + r.width * 0.9, clientY: r.top + r.height / 2 };
    bar.dispatchEvent(new MouseEvent('mousedown', opts));
    bar.dispatchEvent(new MouseEvent('mousemove', opts));
    bar.dispatchEvent(new MouseEvent('mouseup', opts));
    await new Promise((res) => setTimeout(res, 300));
    const v = document.querySelector('.vv-player-video');
    return { barW: Math.round(r.width), t: v.currentTime, w: v.videoWidth, rs: v.readyState };
});
const after = dragRes.t;
console.log('拖动: ' + JSON.stringify(dragRes) + '  位移=' + (after === undefined ? '?' : (after - before).toFixed(1)) + 's（直播应≈0）');

await page.screenshot({ path: 'e2e/hls-live-ui.png' });
console.log('截图: e2e/hls-live-ui.png');
await browser.close();
