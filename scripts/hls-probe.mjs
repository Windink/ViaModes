// HLS 站点探测：不注入脚本，纯监听网络，确认哪些国内正规站真的发 .m3u8。
// 用法：node scripts/hls-probe.mjs [--wait=8000]
import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises';

const WS = 'C:/Users/Administrator/.workbuddy/binaries/node/workspace/index.js';
let puppeteer;
try { puppeteer = createRequire(import.meta.url)('puppeteer-core'); } catch (e) { puppeteer = createRequire(WS)('puppeteer-core'); }

const BROWSERS = [
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
];
const ARGS = process.argv.slice(2);
const WAIT = parseInt((ARGS.find((a) => a.startsWith('--wait=')) || '').split('=')[1], 10) || 8000;
const ONLY = (ARGS.find((a) => a.startsWith('--only=')) || '').split('=')[1] || '';

const CANDIDATES = [
    { key: 'sited', name: '某卫视', url: 'https://tv-g.example.com/' },
    { key: 'siteb', name: '某卫视', url: 'https://tv-b.example.com/' },
    { key: 'siteh', name: '某新闻网(某卫视)', url: 'https://tv-h.example.com/' },
    { key: 'sitee', name: '某卫视', url: 'https://tv-e.example.com/' },
    { key: 'sitec', name: '某广电', url: 'https://tv-c.example.com/' },
    { key: 'sitef', name: '某时间(某卫视)', url: 'https://tv-f.example.com/' },
    { key: 'sitea', name: '某卫视(某卫视)', url: 'https://tv-a.example.com/' },
    { key: 'siteg', name: '某新闻云(某卫视)', url: 'http://tv-d.example.com/' },
    { key: 'sports-vod', name: '某体育平台 · 点播详情', url: 'https://sports.example.com/mgs/website/prd/detail.html?cid=708354123' },
    { key: 'ch2', name: '某视频站点 · 频道 2 直播', url: 'https://video.example.com/live/ch2/' }
];

const browser = await puppeteer.launch({
    executablePath: existsSync(BROWSERS[0]) ? BROWSERS[0] : BROWSERS[1],
    headless: 'new',
    args: ['--no-sandbox', '--no-proxy-server', '--autoplay-policy=no-user-gesture-required',
        '--mute-audio', '--disable-dev-shm-usage', '--window-size=412,892'],
    defaultViewport: { width: 412, height: 892 }
});

const out = [];
for (const site of CANDIDATES) {
    if (ONLY && !site.key.includes(ONLY)) continue;
    const page = await browser.newPage();
    const seen = { m3u8: new Set(), mpd: new Set(), mp4: new Set(), ts: 0, video: 0 };
    page.on('request', (r) => {
        const u = r.url();
        if (/\.m3u8(\?|$)/i.test(u) && seen.m3u8.size < 4) seen.m3u8.add(u.slice(0, 160));
        else if (/\.mpd(\?|$)/i.test(u) && seen.mpd.size < 3) seen.mpd.add(u.slice(0, 140));
        else if (/\.mp4(\?|$)/i.test(u) && seen.mp4.size < 3) seen.mp4.add(u.slice(0, 140));
        else if (/\.(ts|m4s)(\?|$)/i.test(u)) seen.ts++;
    });
    let st = 'fail';
    try {
        await page.goto(site.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        st = 'ok';
        await sleep(1500);
        // 尝试点一下页面里的播放按钮 / 视频区域，触发 HLS 拉流
        await page.evaluate(() => {
            const v = document.querySelector('video');
            if (v) { v.muted = true; v.play && v.play().catch(() => {}); return; }
            const cands = [...document.querySelectorAll('[class*=play],[aria-label*=播放],.play-btn,button')].slice(0, 6);
            for (const c of cands) { try { c.click(); } catch (e) {} }
        }).catch(() => {});
        await sleep(WAIT);
        seen.video = await page.evaluate(() => document.querySelectorAll('video').length).catch(() => 0);
    } catch (e) {
        st = 'fail:' + String(e && e.message || e).slice(0, 50);
    }
    const kinds = [];
    if (seen.m3u8.size) kinds.push('m3u8×' + seen.m3u8.size);
    if (seen.mpd.size) kinds.push('mpd×' + seen.mpd.size);
    if (seen.mp4.size) kinds.push('mp4×' + seen.mp4.size);
    if (seen.ts) kinds.push('ts×' + seen.ts);
    console.log('[' + (seen.m3u8.size ? 'HLS' : '  -') + '] ' + site.name.padEnd(24) + (st === 'ok' ? 'ok ' : st + ' ')
        + (kinds.join(' ') || '无媒体请求') + '  video×' + seen.video);
    if (seen.m3u8.size) [...seen.m3u8].forEach((u) => console.log('        ' + u));
    out.push({ key: site.key, name: site.name, url: site.url, status: st, m3u8: [...seen.m3u8], mpd: [...seen.mpd], mp4: [...seen.mp4], ts: seen.ts, video: seen.video });
    await page.close();
}

console.log('');
const hls = out.filter((x) => x.m3u8.length);
console.log('共 ' + out.length + ' 站，命中 m3u8 的 ' + hls.length + ' 站：' + hls.map((x) => x.key).join(', '));
await browser.close();
