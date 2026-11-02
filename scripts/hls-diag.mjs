// 诊断：真实 HLS 站点上，hls.js 引擎到底卡在哪一步
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
    args: ['--no-sandbox', '--no-proxy-server', '--autoplay-policy=no-user-gesture-required', '--mute-audio', '--disable-dev-shm-usage'],
    defaultViewport: { width: 412, height: 892 }
});
const page = await browser.newPage();
const netFail = [];
page.on('requestfailed', (r) => netFail.push(r.url().slice(0, 100) + ' :: ' + (r.failure() ? r.failure().errorText : '?')));
page.on('request', (r) => { if (/hls\.(light\.)?min\.js/.test(r.url())) console.log('→ 请求 hls.js: ' + r.url()); });
await page.evaluateOnNewDocument(scriptSrc);
await page.goto('https://video.example.com/live/ch1/', { waitUntil: 'domcontentloaded', timeout: 40000 });
await sleep(4000);

const env = await page.evaluate(() => ({
    nativeHls: (() => { const v = document.createElement('video'); return v.canPlayType('application/vnd.apple.mpegurl') || '(空)'; })(),
    hasHls: !!window.Hls,
    mse: !!(window.MediaSource && MediaSource.isTypeSupported('video/mp4; codecs="avc1.42E01E"')),
    cfg: window.__vv && window.__vv.cfg ? JSON.stringify(window.__vv.cfg).slice(0, 200) : ''
}));
console.log('环境: 原生HLS=' + env.nativeHls + '  window.Hls=' + env.hasHls + '  MSE=' + env.mse);

// 手动触发一次 hls.js 加载，看耗时与结果
const loadRes = await page.evaluate(() => new Promise((res) => {
    const t0 = Date.now();
    const s = document.createElement('script');
    s.src = 'https://fastly.jsdelivr.net/npm/hls.js@1/dist/hls.light.min.js';
    s.onload = () => res({ ok: true, ms: Date.now() - t0, hasHls: !!window.Hls });
    s.onerror = () => res({ ok: false, ms: Date.now() - t0, err: 'script onerror' });
    document.head.appendChild(s);
    setTimeout(() => res({ ok: false, ms: Date.now() - t0, err: 'timeout 15s' }), 15000);
}));
console.log('直连 jsdelivr: ' + JSON.stringify(loadRes));

// 播放第一条 m3u8，抓 hls.js 的具体报错
const detail = await page.evaluate(async () => {
    const out = { steps: [] };
    const rows = (() => { const b = document.querySelector('.vv-badge'); if (b) b.click(); return null; })();
    await new Promise((r) => setTimeout(r, 600));
    const wrap = document.getElementById('vv-panel-wrap');
    const rs = wrap ? [...wrap.querySelectorAll('.vv-row')] : [];
    out.rows = rs.map((r) => (r.querySelector('.vv-tag') || {}).textContent);
    const row = rs.find((r) => /m3u8/.test((r.querySelector('.vv-tag') || {}).textContent || ''));
    if (!row) return out;
    const url = row.getAttribute('data-url');
    out.url = url.slice(0, 100);
    // 用 hls.js 直接拉，捕获错误
    if (!window.Hls) { out.steps.push('window.Hls 缺失'); return out; }
    const inst = new window.Hls({ enableWorker: true, lowLatencyMode: false });
    out.steps.push('实例已建');
    const logs = [];
    inst.on(window.Hls.Events.ERROR, (e, d) => {
        logs.push(d.type + '/' + d.details + ' fatal=' + d.fatal + ' ' + (d.response ? 'http=' + d.response.code : '') + ' ' + (d.url || '').slice(0, 60));
    });
    inst.on(window.Hls.Events.MANIFEST_PARSED, () => logs.push('MANIFEST_PARSED levels=' + inst.levels.length));
    inst.on(window.Hls.Events.FRAG_LOADED, () => logs.push('FRAG_LOADED'));
    const v = document.createElement('video');
    v.muted = true;
    v.style.cssText = 'position:fixed;left:0;top:0;width:200px;height:120px;z-index:99999;background:#000';
    document.body.appendChild(v);
    inst.loadSource(url);
    inst.attachMedia(v);
    await v.play().catch((e) => logs.push('play reject ' + e.name));
    await new Promise((r) => setTimeout(r, 8000));
    out.logs = logs.slice(0, 14);
    out.rs = v.readyState;
    out.err = v.error ? v.error.code + '/' + v.error.message : '';
    out.dur = isFinite(v.duration) ? v.duration : null;
    out.t = v.currentTime;
    v.remove();
    try { inst.destroy(); } catch (e) {}
    return out;
});
console.log('播放诊断: ' + JSON.stringify(detail, null, 2));
console.log('失败请求: ' + (netFail.slice(0, 8).join('\n          ') || '无'));
await browser.close();
