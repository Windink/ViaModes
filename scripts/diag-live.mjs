// 用真实脚本（dist）播放某电视台直播，并监听 addSourceBuffer 与 hls 错误
import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { setTimeout as sleep } from 'node:timers/promises';
const WS = 'C:/Users/Administrator/.workbuddy/binaries/node/workspace/index.js';
let puppeteer;
try { puppeteer = createRequire(import.meta.url)('puppeteer-core'); } catch (e) { puppeteer = createRequire(WS)('puppeteer-core'); }
const BROWSERS = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'];
const scriptSrc = await readFile('dist/via-video-player.user.js', 'utf8');
const TARGET = process.argv[2] || 'https://video.example.com/live/ch1/';

const browser = await puppeteer.launch({
    executablePath: existsSync(BROWSERS[0]) ? BROWSERS[0] : BROWSERS[1],
    headless: 'new',
    args: ['--no-sandbox', '--no-proxy-server', '--mute-audio', '--autoplay-policy=no-user-gesture-required'],
    defaultViewport: { width: 412, height: 892 }
});
const page = await browser.newPage();
await page.evaluateOnNewDocument(scriptSrc);
await page.goto(TARGET, { waitUntil: 'domcontentloaded', timeout: 45000 }).catch(() => {});
await sleep(3500);

// 在页面里装监听（脚本的 patch 会在 vvLoadMedia 时才装，这里先记录原始行为）
await page.evaluate(() => {
    window.__abLog = [];
    const MS = window.MediaSource;
    const cur = MS.prototype.addSourceBuffer;
    MS.prototype.addSourceBuffer = function (mime) {
        try {
            const sb = cur.call(this, mime);
            window.__abLog.push({ mime, r: 'ok', supported: MS.isTypeSupported(mime) });
            return sb;
        } catch (e) {
            window.__abLog.push({ mime, r: e.name, supported: MS.isTypeSupported(mime) });
            throw e;
        }
    };
});

const res = await page.evaluate(async () => {
    const badge = document.querySelector('.vv-badge');
    if (badge) badge.click();
    await new Promise((r) => setTimeout(r, 700));
    const wrap = document.getElementById('vv-panel-wrap');
    const rows = wrap ? [...wrap.querySelectorAll('.vv-row')] : [];
    const row = rows.find((r) => /m3u8/.test((r.querySelector('.vv-tag') || {}).textContent || '')) || rows[0];
    if (!row) return { step: 'no row' };
    const btn = [...row.querySelectorAll('button')].find((b) => /▶|播放/.test(b.textContent + b.title)) || row.querySelectorAll('button')[0];
    if (btn) btn.click();

    const tl = [];
    for (let i = 0; i < 55; i++) {
        await new Promise((r) => setTimeout(r, 250));
        const root = document.querySelector('.vv-player-root');
        const v = document.querySelector('.vv-player-video');
        if (v) {
            const b = v.buffered;
            tl.push({ t: +v.currentTime.toFixed(1), rs: v.readyState, w: v.videoWidth, n: b ? b.length : 0, dur: isFinite(v.duration) ? Math.round(v.duration) : 'inf', err: v.error ? v.error.code : 0 });
        }
    }
    return {
        hlsVer: window.Hls ? window.Hls.version : 'none',
        abLog: window.__abLog || [],
        last: tl[tl.length - 1],
        mid: tl[20],
        firstProgress: tl.findIndex((x) => x.rs >= 2),
        errBox: (() => { const e = document.querySelector('.vv-err'); return e ? e.textContent.replace(/\s+/g, ' ').slice(0, 60) : ''; })()
    };
});
console.log(JSON.stringify(res, null, 1));
await page.screenshot({ path: 'e2e/diag-live.png' });
await browser.close();
