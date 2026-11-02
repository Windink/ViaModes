// 验证 internalException 是否来自页面 CSP 拦截 hls.js 的 blob worker
import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises';
const WS = 'C:/Users/Administrator/.workbuddy/binaries/node/workspace/index.js';
let puppeteer;
try { puppeteer = createRequire(import.meta.url)('puppeteer-core'); } catch (e) { puppeteer = createRequire(WS)('puppeteer-core'); }
const BROWSERS = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'];
const URL_LIVE = 'https://cdn5.example.com/cda/ch1_1/index.m3u8?b=200-2100';

const browser = await puppeteer.launch({
    executablePath: existsSync(BROWSERS[0]) ? BROWSERS[0] : BROWSERS[1],
    headless: 'new',
    args: ['--no-sandbox', '--no-proxy-server', '--autoplay-policy=no-user-gesture-required', '--mute-audio'],
    defaultViewport: { width: 412, height: 892 }
});

async function run(label, { onch, bypassCsp, cfg }) {
    const page = await browser.newPage();
    if (bypassCsp) await page.setBypassCSP(true);
    let csp = '';
    const workerBlocked = [];
    page.on('console', (m) => {
        const t = m.text();
        if (/worker|CSP|Content Security/i.test(t)) workerBlocked.push(t.slice(0, 90));
    });
    if (onch) {
        await page.goto('https://video.example.com/live/ch1/', { waitUntil: 'domcontentloaded', timeout: 45000 }).catch(() => {});
        csp = await page.evaluate(() => {
            const m = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
            return m ? m.content.slice(0, 120) : '(无 meta CSP)';
        }).catch(() => '?');
    } else {
        await page.goto('https://news.example.org/', { waitUntil: 'domcontentloaded', timeout: 45000 }).catch(() => {});
    }
    const r = await page.evaluate(async (u, config) => {
        if (!window.Hls) await new Promise((res) => { const s = document.createElement('script'); s.src = 'https://fastly.jsdelivr.net/npm/hls.js@1/dist/hls.light.min.js'; s.onload = res; s.onerror = res; document.head.appendChild(s); });
        if (!window.Hls) return { err: 'no hls (CDN 被拦?)' };
        const v = document.createElement('video');
        v.muted = true; v.playsInline = true;
        v.style.cssText = 'position:fixed;left:0;top:0;width:180px;height:100px;z-index:99999;background:#000';
        document.body.appendChild(v);
        const logs = [];
        let inst;
        try {
            inst = new window.Hls(config);
        } catch (e) { return { err: 'ctor ' + e.message }; }
        inst.on(window.Hls.Events.ERROR, (e, d) => { if (d) logs.push(d.details + (d.fatal ? '(F)' : '') + (d.response ? '#' + d.response.code : '')); });
        try { inst.loadSource(u); inst.attachMedia(v); } catch (e) { return { err: 'load ' + e.message }; }
        await new Promise((r2) => setTimeout(r2, 1200));
        const pr = await v.play().then(() => 'ok').catch((e) => e.name);
        await new Promise((r2) => setTimeout(r2, 9000));
        const o = {
            playReq: pr,
            rs: v.readyState, w: v.videoWidth, h: v.videoHeight, t: +v.currentTime.toFixed(1),
            dur: isFinite(v.duration) ? Math.round(v.duration) : null,
            level: inst.currentLevel, levels: (inst.levels || []).length,
            err: v.error ? v.error.code : 0,
            logs: [...new Set(logs)].slice(0, 5)
        };
        try { inst.destroy(); } catch (e) {}
        v.remove();
        return o;
    }, URL_LIVE, cfg);
    console.log('【' + label + '】 CSP=' + csp);
    console.log('    ' + JSON.stringify(r) + (workerBlocked.length ? '  console: ' + workerBlocked[0] : ''));
    await page.close();
    await sleep(500);
}

await run('A 某电视台页+worker on', { onch: true, cfg: { enableWorker: true } });
await run('B 某电视台页+worker off', { onch: true, cfg: { enableWorker: false } });
await run('C 某电视台页+worker off+bypassCSP', { onch: true, bypassCsp: true, cfg: { enableWorker: false } });
await run('D 中新网页+worker on', { onch: false, cfg: { enableWorker: true } });
await browser.close();
