// 诊断：某电视台直播主清单的码率与编码
import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';
const WS = 'C:/Users/Administrator/.workbuddy/binaries/node/workspace/index.js';
let puppeteer;
try { puppeteer = createRequire(import.meta.url)('puppeteer-core'); } catch (e) { puppeteer = createRequire(WS)('puppeteer-core'); }
const BROWSERS = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'];
const browser = await puppeteer.launch({
    executablePath: existsSync(BROWSERS[0]) ? BROWSERS[0] : BROWSERS[1],
    headless: 'new', args: ['--no-sandbox', '--no-proxy-server', '--mute-audio']
});
const page = await browser.newPage();
await page.goto('https://video.example.com/live/ch1/', { waitUntil: 'domcontentloaded', timeout: 40000 });
const txt = await page.evaluate(async () => {
    const u = 'https://cdn1.example.com/cda/ch1_1/index.m3u8?b=200-2100';
    try { const r = await fetch(u); return { status: r.status, body: (await r.text()).slice(0, 1500) }; }
    catch (e) { return { err: String(e).slice(0, 120) }; }
});
console.log('主清单 status=' + txt.status);
console.log(txt.body || txt.err);
// 再看 hls.js 解析出的每档 codec
const lv = await page.evaluate(async () => {
    const u = 'https://cdn1.example.com/cda/ch1_1/index.m3u8?b=200-2100';
    if (!window.Hls) {
        await new Promise((res) => { const s = document.createElement('script'); s.src = 'https://fastly.jsdelivr.net/npm/hls.js@1/dist/hls.light.min.js'; s.onload = res; s.onerror = res; document.head.appendChild(s); });
    }
    if (!window.Hls) return 'no hls';
    return await new Promise((res) => {
        const inst = new window.Hls();
        inst.on(window.Hls.Events.MANIFEST_PARSED, () => {
            res(inst.levels.map((l) => ({ i: l.index, bw: l.bitrate, v: l.videoCodec, a: l.audioCodec, res: l.width + 'x' + l.height })));
            try { inst.destroy(); } catch (e) {}
        });
        inst.on(window.Hls.Events.ERROR, (e, d) => res('err ' + d.details));
        inst.loadSource(u);
        setTimeout(() => res('timeout'), 12000);
    });
});
console.log('码率档: ' + JSON.stringify(lv, null, 1));
await browser.close();
