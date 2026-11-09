// 选集真实浏览器验证
//   node scripts/episodes-verify.mjs
// 验证 smoke（Node vm）覆盖不到的部分：真实 DOM 里的剧集链接识别、网格渲染、
// 当前集高亮、360px 窄屏不溢出、点集数后的跳页续播标记，以及嗅探直链直接换源。
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { setTimeout as sleep } from 'node:timers/promises';
import { existsSync } from 'node:fs';

const WS = 'C:/Users/Administrator/.workbuddy/binaries/node/workspace/index.js';
let puppeteer;
try { puppeteer = createRequire(import.meta.url)('puppeteer-core'); }
catch (e) { puppeteer = createRequire(WS)('puppeteer-core'); }

const PORT = Number(process.env.PORT || 8097);
const BASE = `http://127.0.0.1:${PORT}`;
const BROWSERS = [
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
];

let pass = 0, fail = 0;
function ok(name, cond, detail) {
    if (cond) { pass++; console.log('ok  - ' + name + (detail ? '  [' + detail + ']' : '')); }
    else { fail++; console.log('FAIL - ' + name + (detail ? '  [' + detail + ']' : '')); }
}

function proxyArgs() {
    const p = process.env.HTTPS_PROXY || process.env.https_proxy || process.env.HTTP_PROXY || process.env.http_proxy;
    return p ? ['--proxy-server=' + p, '--proxy-bypass-list=127.0.0.1;localhost'] : [];
}

const server = spawn(process.execPath, ['scripts/serve.mjs'], {
    cwd: process.cwd(), env: { ...process.env, PORT: String(PORT) }, stdio: ['ignore', 'pipe', 'pipe']
});
server.stdout.on('data', () => {});
const cleanup = () => { try { server.kill(); } catch (e) {} };

let browser;
try {
    for (let i = 0; i < 60; i++) {
        try { if ((await fetch(BASE + '/e2e/index.html')).ok) break; } catch (e) {}
        await sleep(150);
    }
    browser = await puppeteer.launch({
        executablePath: existsSync(BROWSERS[0]) ? BROWSERS[0] : BROWSERS[1],
        headless: 'new',
        args: ['--no-sandbox', '--mute-audio', '--disable-dev-shm-usage', '--window-size=412,892'].concat(proxyArgs()),
        defaultViewport: { width: 412, height: 892 }
    });
    const page = await browser.newPage();
    await page.goto(BASE + '/e2e/episodes.html?vvdebug=1#ep=3', { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForFunction(() => !!(window.__vv && window.__vv.epOpen), { timeout: 15000 });
    ok('调试句柄挂载', true);

    // ---- 识别：24 集 + 干扰链接，当前集 = 3 ----
    const scan = await page.evaluate(() => {
        const d = window.__vv.epScan(true);
        return {
            page: d.page.length,
            nums: d.page.map((p) => p.num),
            current: d.current.page,
            media: d.media.length,
            linkCands: d.linkCands,
            diag: window.__vv.epDiag()
        };
    });
    ok('剧集链接认出 24 集', scan.page === 24, String(scan.page));
    ok('集号 1..24 连续', scan.nums.join(',') === Array.from({ length: 24 }, (_, i) => i + 1).join(','), scan.nums.join(','));
    ok('分页候选没混进最终列表', scan.diag.linkCands > 24 && scan.page === 24,
        '候选 ' + scan.diag.linkCands + ' / 最终 ' + scan.page);
    ok('当前集判定为第 3 集', scan.current === 3, String(scan.current));
    ok('诊断报出模板分组与最终集数', scan.diag.topGroups.length > 0 && scan.diag.page === 24,
        '组 ' + scan.diag.topGroups.length + ' / 集 ' + scan.diag.page);

    // ---- 播放器顶栏一级入口 ----
    await page.evaluate(() => {
        window.__vv.open({ url: location.origin + '/e2e/flower.mp4', name: 'probe', type: 'MP4' });
    });
    await sleep(350);
    const bar = await page.evaluate(() => {
        const acts = Array.from(document.querySelectorAll('.vv-top-acts .vv-csbtn'))
            .map((b) => b.getAttribute('data-act'));
        return { acts: acts, epLabel: (document.getElementById('vv-ep-btn') || {}).title || '' };
    });
    ok('顶栏五枚按钮且选集排第一', bar.acts.join(',') === 'episodes,pip,fs,webfs,download', bar.acts.join(','));
    ok('选集按钮有可读名称', /选集/.test(bar.epLabel), bar.epLabel);

    // ---- 面板渲染、层级、控制栏不自动收起 ----
    const opened = await page.evaluate(() => {
        window.__vv.epOpen();
        const w = document.getElementById('vv-ep-wrap');
        const root = document.querySelector('.vv-player-root');
        const cells = w ? Array.from(w.querySelectorAll('.vv-ep-cell[data-kind="page"]')) : [];
        const on = w ? w.querySelector('.vv-ep-cell.on') : null;
        return {
            open: !!w && w.classList.contains('open'),
            topMost: document.documentElement.lastElementChild === w,
            cells: cells.length,
            onNum: on ? on.getAttribute('data-num') : '',
            secs: w ? Array.from(w.querySelectorAll('.vv-ep-sec')).map((x) => x.textContent) : [],
            epOpenClass: root ? root.classList.contains('ep-open') : false,
            csTimer: root ? root._csTimer : -1,
            title: w ? w.querySelector('.vv-ep-title').textContent : ''
        };
    });
    ok('选集浮层打开', opened.open);
    ok('浮层压在播放器之上', opened.topMost);
    ok('24 个集数格子', opened.cells === 24, String(opened.cells));
    ok('当前集高亮第 3 集', opened.onNum === '3', String(opened.onNum));
    ok('标题含总集数', /24/.test(opened.title), opened.title);
    ok('有「本页剧集」分组', opened.secs.some((s) => /本页剧集/.test(s)), opened.secs.join(' / '));
    ok('挑集时控制栏不启动自动收起', opened.epOpenClass && opened.csTimer === 0,
        'ep-open=' + opened.epOpenClass + ' / timer=' + opened.csTimer);

    // ---- 360px 窄屏不溢出 ----
    await sleep(200);
    await page.setViewport({ width: 360, height: 740 });
    const narrow = await page.evaluate(() => {
        const box = document.querySelector('.vv-ep');
        const cells = document.querySelector('.vv-ep-cells');
        const r = box ? box.getBoundingClientRect() : null;
        const cols = cells ? getComputedStyle(cells).gridTemplateColumns.split(' ').length : 0;
        return { right: r ? r.right : 9999, vw: window.innerWidth, cols: cols };
    });
    ok('360px 窄屏选集面板不溢出', narrow.right <= narrow.vw + 1,
        `右缘 ${Math.round(narrow.right)} / ${narrow.vw}`);
    ok('窄屏每行至少 4 集', narrow.cols >= 4, String(narrow.cols));

    // ---- 关闭按钮：浮层退场、播放器状态复位 ----
    const closed = await page.evaluate(() => {
        const btn = document.querySelector('.vv-ep-btn[aria-label="关闭"]');
        if (btn) btn.click();
        const w = document.getElementById('vv-ep-wrap');
        const root = document.querySelector('.vv-player-root');
        return {
            open: !!w && w.classList.contains('open'),
            epClass: root ? root.classList.contains('ep-open') : false,
            cells: w ? w.querySelectorAll('.vv-ep-cell').length : -1
        };
    });
    ok('关闭后浮层收起且格子清空', !closed.open && closed.cells === 0, JSON.stringify(closed));
    ok('关闭后播放器 ep-open 状态摘净', closed.epClass === false);

    // ---- 点第 5 集：跳页 + 自动续播标记 ----
    const go5 = await page.evaluate(() => {
        window.__vv.epOpen();
        const c = document.querySelector('.vv-ep-cell[data-kind="page"][data-num="5"]');
        if (c) c.click();
        let stored = null;
        try { stored = JSON.parse(localStorage.getItem('via.vp.autoNextLast') || 'null'); } catch (e) {}
        return {
            hash: location.hash,
            stored: stored,
            playerActive: window.__vv.VV.playerActive,
            epOpen: !!window.__vv.VV._epOpen,
            wrapOpen: (function () {
                const w = document.getElementById('vv-ep-wrap');
                return w ? w.classList.contains('open') : false;
            })(),
            rootHidden: (function () {
                const r = document.querySelector('.vv-player-root');
                return !r || r.style.display === 'none';   // DOM 节点 80ms 后才摘，同步只看隐藏态
            })()
        };
    });
    ok('点第 5 集切到该集地址', go5.hash === '#ep=5', go5.hash);
    ok('写入「选集自动续播」标记', !!go5.stored && go5.stored.why === 'ep' && go5.stored.num === 5,
        JSON.stringify(go5.stored));
    ok('跳页前关掉播放器', go5.playerActive === false && go5.rootHidden,
        'active=' + go5.playerActive + ' / rootHidden=' + go5.rootHidden);
    ok('跳页前选集浮层已收起', go5.epOpen === false && go5.wrapOpen === false,
        JSON.stringify({ ep: go5.epOpen, wrap: go5.wrapOpen }));

    // 播放器 root 是延迟 80ms 才从 DOM 摘掉的，等它走完再测换源（否则 getElementById 命中旧 root）
    await sleep(240);

    // ---- 嗅探到的媒体直链：单独成组，点它不跳页直接换源 ----
    const media = await page.evaluate(() => {
        const V = window.__vv.VV;
        V.items.length = 0; V.seen = {};
        for (let i = 1; i <= 3; i++) {
            V.items.push({ url: location.origin + '/e2e/ep' + i + '.mp4', type: 'MP4', name: 'ep' + i });
        }
        window.__vv.epOpen();
        const w = document.getElementById('vv-ep-wrap');
        const secs = Array.from(w.querySelectorAll('.vv-ep-sec')).map((x) => x.textContent);
        const cells = w.querySelectorAll('.vv-ep-cell[data-kind="media"]');
        const hashBefore = location.hash;
        const c = w.querySelector('.vv-ep-cell[data-kind="media"][data-num="2"]');
        if (c) c.click();
        return {
            secs: secs,
            cells: cells.length,
            hashBefore: hashBefore,
            hashAfter: location.hash,
            activeUrl: V.active && V.active.item ? V.active.item.url : '',
            title: (document.getElementById('vv-title') || {}).textContent || ''
        };
    });
    ok('嗅探直链单独成组', media.secs.some((s) => /嗅探到的视频/.test(s)), media.secs.join(' / '));
    ok('直链组 3 集', media.cells === 3, String(media.cells));
    ok('点直链不跳页', media.hashAfter === media.hashBefore, media.hashBefore + ' → ' + media.hashAfter);
    ok('点直链直接换源', /\/e2e\/ep2\.mp4$/.test(media.activeUrl), media.activeUrl);
    ok('换源后标题带集数', /第 2 集/.test(media.title), media.title);

    // ---- 收尾：浮层关闭后不残留 ----
    const final = await page.evaluate(() => {
        window.__vv.epClose();
        const w = document.getElementById('vv-ep-wrap');
        return { open: !!w && w.classList.contains('open'), epOpen: !!window.__vv.VV._epOpen };
    });
    ok('收尾后浮层与状态都干净', !final.open && !final.epOpen, JSON.stringify(final));
} catch (e) {
    fail++;
    console.log('FAIL - 验证脚本异常: ' + (e && e.stack || e));
} finally {
    if (browser) { try { await browser.close(); } catch (e) {} }
    cleanup();
}

console.log(`\nepisodes verify: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
