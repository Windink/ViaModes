// 多站点策略矩阵：在多个国内正规站点上跑同一套「注入 → 嗅探 → 起播 → 记录」流程。
// 目的不是断言，而是把各站不同的分发策略（直链 mp4 / 多码率 HLS / 加密 HLS / DASH / 分离音轨 / 强防盗链）
// 一次性摊开，看嗅探与播放的覆盖面和缺口。
// 用法：node scripts/site-matrix.mjs [--only=关键词] [--no-proxy]
import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';
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
const USE_PROXY = ARGS.includes('--use-proxy');

// 站点覆盖的分发策略是有意搭配的：
const SITES = [
    {
        key: 'ch',
        name: '某视频站点 · 点播',
        url: 'https://video.example.com/2020/05/28/VIDE30h8zPNlq5WoButIy45J200528.shtml',
        expect: '多码率 HLS + 多 CDN + blob(MSE)，强时效 token'
    },
    {
        key: 'news',
        name: '某新闻网 · 视频',
        url: 'https://news.example.org/shipin/',
        expect: '新闻站，多为直链 mp4 / 弱防护'
    },
    {
        key: 'qq',
        name: '某视频平台 · 剧集',
        url: 'https://vod.example.net/x/cover/mzc002000s9f77y.html',
        expect: 'blob + 加密 HLS/私有协议，强防盗链，需登录'
    },
    {
        key: 'show',
        name: '某综艺平台 · 综艺',
        // 某综艺平台的详情页 id 会失效（跳 404），所以从首页/榜单页自动发现一条有效详情页
        discover: {
            url: 'https://show.example.com/',
            pattern: '/b/[a-z0-9]+/\\d+\\.html'
        },
        url: '',
        expect: 'HLS + token 鉴权，blob 播放'
    },
    {
        key: 'film',
        name: '某影视平台 · 影视',
        url: 'https://film.example.com/',
        expect: 'blob + 私有协议，强反爬'
    }
];

function proxyArgs() {
    if (!USE_PROXY) return ['--no-proxy-server'];
    const p = process.env.HTTPS_PROXY || process.env.https_proxy || process.env.HTTP_PROXY || process.env.http_proxy;
    return p ? ['--proxy-server=' + p, '--proxy-bypass-list=127.0.0.1;localhost'] : [];
}

const scriptSrc = await readFile('dist/via-video-player.user.js', 'utf8');

const browser = await puppeteer.launch({
    executablePath: existsSync(BROWSERS[0]) ? BROWSERS[0] : BROWSERS[1],
    headless: 'new',
    args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required', '--mute-audio',
        '--disable-dev-shm-usage', '--window-size=412,892'].concat(proxyArgs()),
    defaultViewport: { width: 412, height: 892 }
});

const MIME_KIND = (u) => {
    if (/\.m3u8(\?|$)/i.test(u)) return 'm3u8';
    if (/\.mpd(\?|$)/i.test(u)) return 'mpd';
    if (/\.mp4(\?|$)/i.test(u)) return 'mp4';
    if (/\.(ts|m4s)(\?|$)/i.test(u)) return 'seg';
    if (/\.(mp3|m4a|aac)(\?|$)/i.test(u)) return 'audio';
    if (/\.flv(\?|$)/i.test(u)) return 'flv';
    return '';
};

const results = [];

async function gotoWithRetry(page, url, tries = 3) {
    for (let i = 1; i <= tries; i++) {
        try {
            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
            return { ok: true, tries: i, url: page.url() };
        } catch (e) {
            const msg = String(e && e.message || e).slice(0, 80);
            if (i === tries) return { ok: false, tries: i, err: msg };
            await sleep(1200);
        }
    }
    return { ok: false, tries, err: 'unknown' };
}

for (const site of SITES) {
    if (ONLY && !site.key.includes(ONLY) && !site.name.includes(ONLY)) continue;
    const t0 = Date.now();
    console.log('');
    console.log('════════ ' + site.name + ' ════════');
    console.log('URL : ' + (site.url || '(首页自动发现)'));
    console.log('预期: ' + site.expect);

    const page = await browser.newPage();
    const errs = [];
    const media = new Map();     // kind -> Set(url)
    page.on('pageerror', (e) => errs.push(String(e && e.message || e).slice(0, 120)));
    page.on('request', (r) => {
        const u = r.url();
        const k = MIME_KIND(u.split('?')[0] + (u.includes('?') ? '?x' : ''));
        if (!k) return;
        if (!media.has(k)) media.set(k, new Set());
        const s = media.get(k);
        if (s.size < 6) s.add(u.slice(0, 150));
    });
    page.on('requestfailed', (r) => {
        const u = r.url();
        if (MIME_KIND(u)) errs.push('fail: ' + u.slice(0, 90));
    });

    await page.evaluateOnNewDocument(scriptSrc);

    // 详情页 id 会失效的站（某综艺平台等）：先在首页/榜单页找一条有效链接，再进详情页
    if (site.discover) {
        const dg = await gotoWithRetry(page, site.discover.url, 2);
        if (dg.ok) {
            await sleep(2000);
            const found = await page.evaluate((pat) => {
                const re = new RegExp(pat);
                const as = [...document.querySelectorAll('a[href]')];
                for (const a of as) {
                    const h = a.getAttribute('href') || '';
                    if (re.test(h)) return h.startsWith('http') ? h : new URL(h, location.href).href;
                }
                return '';
            }, site.discover.pattern).catch(() => '');
            if (found) {
                site.url = found;
                console.log('▶ 自动发现详情页：' + found.slice(0, 110));
            } else {
                console.log('✗ 首页没找到匹配 ' + site.discover.pattern + ' 的链接');
            }
        }
    }

    if (!site.url) {
        results.push({ key: site.key, name: site.name, url: '', page: 'fail', err: '无有效详情页', sniff: [], play: null });
        await page.close();
        continue;
    }

    const g = await gotoWithRetry(page, site.url);
    if (!g.ok) {
        console.log('✗ 页面打不开（重试 ' + g.tries + ' 次）：' + g.err);
        results.push({ key: site.key, name: site.name, url: site.url, page: 'fail', err: g.err, sniff: [], play: null });
        await page.close();
        continue;
    }
    console.log('✓ 页面已加载（第 ' + g.tries + ' 次尝试，' + ((Date.now() - t0) / 1000).toFixed(1) + 's） ' + g.url.slice(0, 100));

    // 给页面足够时间自己起播（很多站要等页面播放器初始化才会发媒体请求）
    await page.waitForFunction(() => !!(window.VV && window.VV.items !== undefined), { timeout: 15000 }).catch(() => {});
    let waited = 0;
    while (waited < 12000) {
        const n = await page.evaluate(() => {
            const b = document.querySelector('.vv-badge');
            return b ? parseInt(b.textContent.trim(), 10) || 0 : 0;
        });
        if (n > 0) break;
        await sleep(600); waited += 600;
    }

    // 抓嗅探面板内容
    const sniff = await page.evaluate(() => {
        const badge = document.querySelector('.vv-badge');
        if (badge) badge.click();
        return new Promise((res) => setTimeout(() => {
            const wrap = document.getElementById('vv-panel-wrap');
            const rows = wrap ? wrap.querySelectorAll('.vv-row') : [];
            const items = [];
            rows.forEach((r) => {
                const t = r.querySelector('.vv-tag');
                items.push({
                    type: t ? t.textContent.trim() : '?',
                    url: r.getAttribute('data-url') || ''
                });
            });
            res(items);
        }, 500));
    });
    const types = [...new Set(sniff.map((x) => x.type))];
    console.log('嗅探: ' + (sniff.length ? sniff.length + ' 条 [' + types.join(', ') + ']' : '无'));
    sniff.slice(0, 6).forEach((x) => console.log('      [' + x.type + '] ' + x.url.slice(0, 110)));

    const net = {};
    for (const [k, v] of media) net[k] = [...v];
    const netKinds = Object.keys(net);
    if (netKinds.length) console.log('网络: ' + netKinds.map((k) => k + '×' + net[k].length).join('  '));

    // 起播：按可信度挑一条（mp4 > 视频 m3u8 > 其它），并同步采集加载进度
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

            // 采样加载进度 UI
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
                if (samples.length < 60) setTimeout(tick, 150);
            };
            tick();
            await new Promise((r2) => setTimeout(r2, 9000));

            const v = document.querySelector('.vv-player-video');
            const root = document.querySelector('.vv-player-root');
            return {
                opened: !!root,
                picked: (row.querySelector('.vv-tag') || {}).textContent || '',
                pickedUrl: (row.getAttribute('data-url') || '').slice(0, 120),
                hasVideo: !!v,
                src: v ? (v.currentSrc || v.src || '').slice(0, 120) : '',
                rs: v ? v.readyState : -1,
                dur: v && isFinite(v.duration) ? +v.duration.toFixed(1) : null,
                t: v ? +(v.currentTime || 0).toFixed(1) : 0,
                paused: v ? v.paused : null,
                samples
            };
        });

        if (play && play.samples) {
            const pctSeen = play.samples.filter((s) => /%$/.test(s.num));
            const indetSeen = play.samples.filter((s) => s.indet);
            const barSeen = play.samples.filter((s) => s.barOn);
            const detSeen = [...new Set(play.samples.filter((s) => s.detail).map((s) => s.detail))];
            play.pctSamples = pctSeen.length;
            play.pctExample = pctSeen.length ? pctSeen[pctSeen.length - 1].num : '';
            play.indetSamples = indetSeen.length;
            play.barSamples = barSeen.length;
            play.detailExamples = detSeen.slice(0, 3);
            delete play.samples;

            console.log('起播: ' + (play.rs >= 2 ? '成功 rs=' + play.rs : '失败 rs=' + play.rs)
                + '  时长=' + (play.dur === null ? '?' : play.dur + 's')
                + '  进度=' + play.t + 's  暂停=' + play.paused);
            console.log('      选中 [' + play.picked + '] ' + play.pickedUrl.slice(0, 90));
            console.log('      实际源 ' + (play.src || '(blob/mse)'));
            console.log('      加载UI: 百分比 ' + play.pctSamples + ' 次' + (play.pctExample ? '(' + play.pctExample + ')' : '')
                + ' / 不确定 ' + play.indetSamples + ' 次 / 细条 ' + play.barSamples + ' 次'
                + (play.detailExamples.length ? ' / 明细 ' + play.detailExamples[0] : ''));
        }
    } else {
        console.log('起播: 跳过（无可播放条目）');
    }

    // 截图留证
    try {
        await page.screenshot({ path: `e2e/site-${site.key}.png` });
        console.log('截图: e2e/site-' + site.key + '.png');
    } catch (e) {}

    const realErrs = [...new Set(errs)].filter((x) => !/via-vp: iframe skip|AbortError|net::ERR_/.test(x)).slice(0, 4);
    if (realErrs.length) console.log('错误: ' + realErrs.join(' | '));

    results.push({
        key: site.key, name: site.name, url: site.url, page: 'ok', finalUrl: g.url,
        expect: site.expect,
        sniff, types,
        net,
        play,
        errors: realErrs,
        cost: +((Date.now() - t0) / 1000).toFixed(1)
    });
    await page.close();
}

// ===== 汇总 =====
console.log('');
console.log('################ 站点策略矩阵 ################');
console.log('');
const pad = (s, n) => {
    const w = [...String(s)].reduce((a, c) => a + (c.charCodeAt(0) > 127 ? 2 : 1), 0);
    return String(s) + ' '.repeat(Math.max(0, n - w));
};
console.log(pad('站点', 20) + pad('页面', 6) + pad('嗅探', 20) + pad('起播', 10) + pad('进度UI', 10) + '备注');
console.log('-'.repeat(96));
for (const r of results) {
    if (r.page !== 'ok') {
        console.log(pad(r.name, 20) + pad('失败', 6) + pad('-', 20) + pad('-', 10) + pad('-', 10) + (r.err || '').slice(0, 40));
        continue;
    }
    const sniffTxt = r.sniff.length ? r.sniff.length + ' 条 ' + (r.types.join('/').slice(0, 14)) : '无';
    const playTxt = r.play && r.play.rs >= 2 ? 'rs=' + r.play.rs : (r.play ? 'rs=' + r.play.rs : '-');
    const uiTxt = r.play ? (r.play.pctSamples ? '确定' : r.play.indetSamples ? '不确定' : '无') : '-';
    const dash = (r.net && r.net.mpd) ? 'DASH源! ' : '';
    console.log(pad(r.name, 20) + pad('ok', 6) + pad(sniffTxt, 20) + pad(playTxt, 10) + pad(uiTxt, 10) + dash);
}

await writeFile('e2e/site-matrix.json', JSON.stringify(results, null, 2), 'utf8');
console.log('');
console.log('明细已写入 e2e/site-matrix.json');
await browser.close();
