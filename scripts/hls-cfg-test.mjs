// 配置对照实验：在某电视台直播页面上，用不同 hls.js 参数播放同一条直播流
import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';
const WS = 'C:/Users/Administrator/.workbuddy/binaries/node/workspace/index.js';
let puppeteer;
try { puppeteer = createRequire(import.meta.url)('puppeteer-core'); } catch (e) { puppeteer = createRequire(WS)('puppeteer-core'); }
const BROWSERS = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'];
const browser = await puppeteer.launch({
    executablePath: existsSync(BROWSERS[0]) ? BROWSERS[0] : BROWSERS[1],
    headless: 'new',
    args: ['--no-sandbox', '--no-proxy-server', '--autoplay-policy=no-user-gesture-required', '--mute-audio'],
    defaultViewport: { width: 412, height: 892 }
});

const URL_LIVE = 'https://cdn5.example.com/cda/ch1_1/index.m3u8?b=200-2100';

const CASES = [
    ['默认 {}', {}],
    ['完整 vvHlsConfig', {
        enableWorker: true, lowLatencyMode: false, capLevelToPlayerSize: true, capLevelOnFPSDrop: true,
        startLevel: 0, startFragPrefetch: true, testBandwidth: false, abrBandWidthUpFactor: 0.6,
        backBufferLength: 20, maxBufferLength: 36, maxMaxBufferLength: 72, maxBufferSize: 50 * 1000 * 1000,
        maxBufferHole: 0.5, nudgeOffset: 0.2, nudgeMaxRetry: 6, highBufferWatchdogPeriod: 2,
        maxFragLookUpTolerance: 0.5, abrEwmaDefaultEstimate: 2000000
    }],
    ['完整 但 worker off', {
        enableWorker: false, lowLatencyMode: false, capLevelToPlayerSize: true, startLevel: 0,
        backBufferLength: 20, maxBufferLength: 36, abrEwmaDefaultEstimate: 2000000
    }],
    ['完整 但 startLevel=-1/buf10', {
        enableWorker: true, lowLatencyMode: false, startLevel: -1, maxBufferLength: 10,
        backBufferLength: 20, abrEwmaDefaultEstimate: 2000000
    }],
    ['完整 但 capLevelToPlayerSize off', {
        enableWorker: true, startLevel: 0, capLevelToPlayerSize: false, maxBufferLength: 36,
        backBufferLength: 20, abrEwmaDefaultEstimate: 2000000
    }]
];

for (const [label, cfg] of CASES) {
    const page = await browser.newPage();
    await page.goto('https://video.example.com/live/ch1/', { waitUntil: 'domcontentloaded', timeout: 40000 });
    const r = await page.evaluate(async (u, config) => {
        if (!window.Hls) await new Promise((res) => { const s = document.createElement('script'); s.src = 'https://fastly.jsdelivr.net/npm/hls.js@1/dist/hls.light.min.js'; s.onload = res; s.onerror = res; document.head.appendChild(s); });
        if (!window.Hls) return { err: 'no hls' };
        const v = document.createElement('video');
        v.muted = true; v.playsInline = true;
        v.style.cssText = 'position:fixed;left:0;top:0;width:180px;height:100px;z-index:99999;background:#000';
        document.body.appendChild(v);
        const inst = new window.Hls(config);
        const logs = [];
        inst.on(window.Hls.Events.ERROR, (e, d) => { if (d) logs.push(d.details + (d.fatal ? '(F)' : '') + (d.response ? '#' + d.response.code : '')); });
        inst.loadSource(u);
        inst.attachMedia(v);
        await v.play().catch(() => {});
        await new Promise((r2) => setTimeout(r2, 11000));
        const o = {
            rs: v.readyState, w: v.videoWidth, h: v.videoHeight, t: +v.currentTime.toFixed(1),
            dur: isFinite(v.duration) ? Math.round(v.duration) : null,
            level: inst.currentLevel, levels: (inst.levels || []).length,
            err: v.error ? v.error.code : 0,
            logs: [...new Set(logs)].slice(0, 6)
        };
        try { inst.destroy(); } catch (e) {}
        v.remove();
        return o;
    }, URL_LIVE, cfg);
    console.log(label.padEnd(26) + ' ' + JSON.stringify(r));
    await page.close();
}
await browser.close();
