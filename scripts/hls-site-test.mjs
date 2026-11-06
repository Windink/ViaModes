// m3u8 专项实测：只跑 HLS 站点（直播 / 点播 / 多码率），验证嗅探 → 起播 → 进度 UI 全链路。
// 用法：node scripts/hls-site-test.mjs [--only=关键词]
import { createRequire } from 'node:module';
import { existsSync, mkdirSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { setTimeout as sleep } from 'node:timers/promises';

const WS = 'C:/Users/Administrator/.workbuddy/binaries/node/workspace/index.js';
let puppeteer;
try { puppeteer = createRequire(import.meta.url)('puppeteer-core'); } catch (e) { puppeteer = createRequire(WS)('puppeteer-core'); }

const BROWSERS = [
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
];
const ARGS = process.argv.slice(2);
const ONLY = (ARGS.find((a) => a.startsWith('--only=')) || '').split('=')[1] || '';

// 站点清单不入库（避免公开仓库点名具体平台）：从 e2e/sites.local.json 的 hls 段读取。
// 结构见 e2e/sites.example.json；复制一份填好 URL 即可。
const SITE_FILE = new URL('../e2e/sites.local.json', import.meta.url);
if (!existsSync(SITE_FILE)) {
    console.error('缺少 e2e/sites.local.json。请复制 e2e/sites.example.json 并填入要实测的站点 URL。');
    process.exit(1);
}
const SITES = JSON.parse(await readFile(SITE_FILE, 'utf8')).hls;
mkdirSync('e2e/local', { recursive: true });

const scriptSrc = await readFile('dist/via-video-player.user.js', 'utf8');

const browser = await puppeteer.launch({
    executablePath: existsSync(BROWSERS[0]) ? BROWSERS[0] : BROWSERS[1],
    headless: 'new',
    args: ['--no-sandbox', '--no-proxy-server', '--autoplay-policy=no-user-gesture-required',
        '--mute-audio', '--disable-dev-shm-usage', '--window-size=412,892'],
    defaultViewport: { width: 412, height: 892 }
});

const results = [];

for (const site of SITES) {
    if (ONLY && !site.key.includes(ONLY) && !site.name.includes(ONLY)) continue;
    const t0 = Date.now();
    console.log('');
    console.log('════════ ' + site.name + ' ════════');
    console.log('URL : ' + site.url);
    console.log('预期: ' + site.expect);

    const page = await browser.newPage();
    const errs = [];
    const net = { m3u8: new Set(), ts: 0, mp4: 0 };
    page.on('pageerror', (e) => errs.push(String(e && e.message || e).slice(0, 100)));
    page.on('request', (r) => {
        const u = r.url();
        if (/\.m3u8(\?|$)/i.test(u) && net.m3u8.size < 5) net.m3u8.add(u.slice(0, 150));
        else if (/\.(ts|m4s)(\?|$)/i.test(u)) net.ts++;
        else if (/\.mp4(\?|$)/i.test(u)) net.mp4++;
    });
    await page.evaluateOnNewDocument(scriptSrc);

    let ok = false;
    try {
        await page.goto(site.url, { waitUntil: 'domcontentloaded', timeout: 40000 });
        ok = true;
    } catch (e) {
        console.log('✗ 页面打不开：' + String(e && e.message || e).slice(0, 70));
    }

    if (!ok) {
        results.push({ key: site.key, name: site.name, url: site.url, page: 'fail', sniff: [], play: null });
        await page.close();
        continue;
    }
    await page.waitForFunction(() => !!document.querySelector('.vv-badge'), { timeout: 20000 }).catch(() => {});
    // 等页面自己的播放器拉流（直播站首帧较慢）
    let waited = 0;
    while (waited < 15000) {
        const n = await page.evaluate(() => {
            const b = document.querySelector('.vv-badge');
            return b ? parseInt(b.textContent.trim(), 10) || 0 : 0;
        });
        if (n > 0) break;
        await sleep(700); waited += 700;
    }

    const sniff = await page.evaluate(() => {
        const badge = document.querySelector('.vv-badge');
        if (badge) badge.click();
        return new Promise((res) => setTimeout(() => {
            const wrap = document.getElementById('vv-panel-wrap');
            const rows = wrap ? wrap.querySelectorAll('.vv-row') : [];
            const items = [];
            rows.forEach((r) => {
                const t = r.querySelector('.vv-tag');
                items.push({ type: t ? t.textContent.trim() : '?', url: r.getAttribute('data-url') || '' });
            });
            res(items);
        }, 600));
    });
    const types = [...new Set(sniff.map((x) => x.type))];
    console.log('嗅探: ' + (sniff.length ? sniff.length + ' 条 [' + types.join(', ') + ']' : '无'));
    sniff.slice(0, 6).forEach((x) => console.log('      [' + x.type + '] ' + x.url.slice(0, 108)));
    console.log('网络: m3u8×' + net.m3u8.size + '  ts×' + net.ts + '  mp4×' + net.mp4);

    let play = null;
    if (sniff.length) {
        play = await page.evaluate(async () => {
            const wrap = document.getElementById('vv-panel-wrap');
            const rows = wrap ? [...wrap.querySelectorAll('.vv-row')] : [];
            if (!rows.length) return { opened: false };
            const rank = (t) => {
                const s = (t || '').toLowerCase();
                if (s === 'mp4' || s === 'm4v') return 0;
                if (s.indexOf('音轨') >= 0 || s === '音频') return 8;
                if (s.indexOf('原生流') >= 0) return 9;
                if (s.indexOf('m3u8') >= 0) return 1;
                return 5;
            };
            let idx = 0, best = 99;
            rows.forEach((r, i) => {
                const t = (r.querySelector('.vv-tag') || {}).textContent || '';
                const rk = rank(t);
                if (rk < best) { best = rk; idx = i; }
            });
            const row = rows[idx];
            const btns = row.querySelectorAll('button');
            let btn = null;
            btns.forEach((b) => { if (!btn && /▶|播放/.test(b.textContent + b.title)) btn = b; });
            if (!btn) btn = btns[btns.length - 1];
            if (btn) btn.click();

            const samples = [];
            const tick = () => {
                const ld = document.querySelector('.vv-loading');
                const num = ld ? ld.querySelector('.vv-lr-num') : null;
                const det = ld ? ld.querySelector('.vv-load-detail') : null;
                const bar = document.querySelector('.vv-loadbar');
                const v = document.querySelector('.vv-player-video');
                samples.push({
                    on: ld ? ld.classList.contains('on') : false,
                    indet: ld ? ld.classList.contains('indet') : false,
                    num: num ? num.textContent.trim() : '',
                    detail: det ? det.textContent.trim() : '',
                    barOn: bar ? bar.classList.contains('on') : false,
                    rs: v ? v.readyState : -1,
                    t: v ? +(v.currentTime || 0).toFixed(1) : 0
                });
                if (samples.length < 70) setTimeout(tick, 150);
            };
            tick();
            await new Promise((r2) => setTimeout(r2, 10000));

            const v = document.querySelector('.vv-player-video');
            const root = document.querySelector('.vv-player-root');
            const err = document.querySelector('.vv-err');
            return {
                opened: !!root,
                errShown: err ? (err.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 70) : '',
                picked: (row.querySelector('.vv-tag') || {}).textContent || '',
                pickedUrl: (row.getAttribute('data-url') || '').slice(0, 110),
                hasVideo: !!v,
                src: v ? (v.currentSrc || v.src || '').slice(0, 110) : '',
                rs: v ? v.readyState : -1,
                dur: v && isFinite(v.duration) ? +v.duration.toFixed(1) : null,
                t: v ? +(v.currentTime || 0).toFixed(1) : 0,
                paused: v ? v.paused : null,
                errCode: v && v.error ? v.error.code : 0,
                samples
            };
        });

        if (play && play.samples) {
            const pct = play.samples.filter((s) => /%$/.test(s.num));
            const ind = play.samples.filter((s) => s.indet);
            const bar = play.samples.filter((s) => s.barOn);
            const det = [...new Set(play.samples.filter((s) => s.detail).map((s) => s.detail))];
            play.pctSamples = pct.length;
            play.pctExample = pct.length ? pct[pct.length - 1].num : '';
            play.indetSamples = ind.length;
            play.barSamples = bar.length;
            play.details = det.slice(0, 3);
            play.timeline = play.samples.filter((s, i) => i % 7 === 0).map((s) => (s.on ? (s.indet ? '~' : s.num) : 'off')).join(' ');
            delete play.samples;

            console.log('起播: ' + (play.rs >= 2 ? '成功 rs=' + play.rs : '失败 rs=' + play.rs)
                + '  时长=' + (play.dur === null ? 'live/?' : play.dur + 's')
                + '  进度=' + play.t + 's  暂停=' + play.paused
                + (play.errCode ? '  err=' + play.errCode : ''));
            console.log('      选中 [' + play.picked + '] ' + play.pickedUrl.slice(0, 88));
            console.log('      实际源 ' + (play.src || '(blob/mse)'));
            console.log('      加载UI: 百分比 ' + play.pctSamples + ' 次' + (play.pctExample ? '(' + play.pctExample + ')' : '')
                + ' / 不确定 ' + play.indetSamples + ' 次 / 细条 ' + play.barSamples + ' 次');
            if (play.details.length) console.log('      明细 ' + play.details[0]);
            console.log('      时序 ' + play.timeline);
            if (play.errShown) console.log('      错误卡 ' + play.errShown);
        }
    } else {
        console.log('起播: 跳过（无条目）');
    }

    try {
        await page.screenshot({ path: 'e2e/local/hls-' + site.key + '.png' });
        console.log('截图: e2e/hls-' + site.key + '.png');
    } catch (e) {}

    const realErrs = [...new Set(errs)].filter((x) => !/AbortError|net::ERR_|play\(\) request/i.test(x)).slice(0, 3);
    if (realErrs.length) console.log('页面错误: ' + realErrs.join(' | '));

    results.push({
        key: site.key, name: site.name, url: site.url, page: 'ok', expect: site.expect,
        sniff, types, net: { m3u8: [...net.m3u8], ts: net.ts, mp4: net.mp4 },
        play, errors: realErrs, cost: +((Date.now() - t0) / 1000).toFixed(1)
    });
    await page.close();
}

console.log('');
console.log('################ m3u8 站点实测 ################');
const pad = (s, n) => {
    const w = [...String(s)].reduce((a, c) => a + (c.charCodeAt(0) > 127 ? 2 : 1), 0);
    return String(s) + ' '.repeat(Math.max(0, n - w));
};
console.log(pad('站点', 22) + pad('嗅探', 22) + pad('起播', 12) + pad('进度UI', 16) + '备注');
console.log('-'.repeat(96));
for (const r of results) {
    if (r.page !== 'ok') { console.log(pad(r.name, 22) + '页面失败'); continue; }
    const sniffTxt = r.sniff.length ? r.sniff.length + '条 ' + r.types.join('/') : '无';
    const playTxt = r.play && r.play.rs >= 2 ? 'rs=' + r.play.rs : 'rs=' + (r.play ? r.play.rs : '-');
    const uiTxt = r.play ? (r.play.pctSamples ? '确定' : r.play.indetSamples ? '不确定' : '无') : '-';
    const note = r.play && r.play.dur === null ? 'live(无时长)' : '';
    console.log(pad(r.name, 22) + pad(sniffTxt, 22) + pad(playTxt, 12) + pad(uiTxt, 16) + note);
}
await writeFile('e2e/local/hls-sites.json', JSON.stringify(results, null, 2), 'utf8');
console.log('');
console.log('明细: e2e/hls-sites.json');
await browser.close();
