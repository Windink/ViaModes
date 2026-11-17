// 「下一集」原地换集验证（真实浏览器）
//   node scripts/next-inplace-verify.mjs
//
// 以前点「下一集」，只要下一集是另一个页面，就直接 location.href 整页跳走：
// 广告、首屏脚本、播放器重建全来一遍，用户的观感就是"点一下，视频没了，等半天"。
// 这里验证改完之后的行为：留在当前页，把下一集那一页取回来解析片源，
// 在当前播放器里换源并自动开播，标题/当前集数同步更新，连点能连续往下走。
//
// 用例是 e2e/nextpage/ep1.html（三集各自独立页面，片源写在各自的 HTML 里）。
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { setTimeout as sleep } from 'node:timers/promises';
import { existsSync, readFileSync } from 'node:fs';

const WS = 'C:/Users/Administrator/.workbuddy/binaries/node/workspace/index.js';
let puppeteer;
try { puppeteer = createRequire(import.meta.url)('puppeteer-core'); }
catch (e) { puppeteer = createRequire(WS)('puppeteer-core'); }

const PORT = Number(process.env.PORT || 8098);
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
        try { if ((await fetch(BASE + '/e2e/nextpage/ep1.html')).ok) break; } catch (e) {}
        await sleep(150);
    }
    browser = await puppeteer.launch({
        executablePath: existsSync(BROWSERS[0]) ? BROWSERS[0] : BROWSERS[1],
        headless: 'new',
        args: ['--no-sandbox', '--mute-audio', '--disable-dev-shm-usage', '--window-size=412,892',
            '--autoplay-policy=no-user-gesture-required'].concat(proxyArgs()),
        defaultViewport: { width: 412, height: 892 }
    });
    const page = await browser.newPage();
    let navs = 0;
    page.on('framenavigated', (f) => { if (f === page.mainFrame()) navs++; });
    // 测试台本身不引脚本（真机用的是设备上安装的脚本），桌面侧在这里注入同一份产物
    await page.evaluateOnNewDocument(readFileSync('dist/via-video-player.user.js', 'utf8'));
    await page.goto(BASE + '/e2e/nextpage/ep1.html?vvdebug=1', { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForFunction(() => !!(window.__vv && window.__vv.VV), { timeout: 15000 });
    ok('调试句柄挂载', true);

    // ---- 打开第 1 集 ----
    await page.evaluate(() => {
        window.__vv.open({ url: location.origin + '/e2e/media/bb1080.mp4', name: 'bb1080', type: 'MP4' });
    });
    await page.waitForFunction(() => !!(window.__vv.VV && window.__vv.VV.playerActive), { timeout: 10000 });

    const scan = await page.evaluate(() => {
        const d = window.__vv.epScan(true);
        return { page: d.page.length, cur: d.current.page, title: (document.getElementById('vv-title') || {}).textContent || '' };
    });
    ok('选集表认出 3 集', scan.page === 3, String(scan.page));
    ok('当前集 = 第 1 集', scan.cur === 1, String(scan.cur));

    // findNext 在 open +1400ms 才跑，轮询等到下一集被认出来
    let nextInfo = null;
    for (let i = 0; i < 40; i++) {
        nextInfo = await page.evaluate(() => {
            const A = window.__vv.VV.active || {};
            const b = document.getElementById('vv-next-btn');
            return {
                nextPage: A.nextPage || '',
                epNum: A.nextEp ? A.nextEp.num : -1,
                btnHidden: !b || b.style.display === 'none'
            };
        });
        if (/ep2\.html/.test(nextInfo.nextPage)) break;
        await sleep(250);
    }
    ok('findNext 认出下一集是第 2 集的那一页', /\/e2e\/nextpage\/ep2\.html/.test(nextInfo.nextPage), nextInfo.nextPage);
    ok('nextEp 带上了集号', nextInfo.epNum === 2, String(nextInfo.epNum));
    ok('「下一集」按钮点亮', nextInfo.btnHidden === false);

    // ---- 点「下一集」：应留在本页换源 ----
    const before = await page.evaluate(() => {
        window.__navMark = 'm' + Math.random().toString(36).slice(2);
        return { href: location.href, mark: window.__navMark };
    });
    const navsBefore = navs;
    await page.evaluate(() => { document.getElementById('vv-next-btn').click(); });

    let switched = null;
    for (let i = 0; i < 40; i++) {
        switched = await page.evaluate(() => {
            const A = window.__vv.VV.active || {};
            const t = document.getElementById('vv-title');
            return {
                href: location.href,
                mark: window.__navMark || '',
                active: window.__vv.VV.playerActive,
                url: A.item ? A.item.url : '',
                epNum: A.epNum === undefined ? -1 : A.epNum,
                curEp: window.__vv.VV._curEp ? window.__vv.VV._curEp.num : -1,
                title: t ? t.textContent : '',
                busy: !!A._nextBusy
            };
        });
        if (/bb720\.mp4$/.test(switched.url) && switched.busy === false) break;
        await sleep(250);
    }
    ok('原地换到下一集片源（bb720）', /\/e2e\/media\/bb720\.mp4$/.test(switched.url), switched.url);
    ok('地址栏没变', switched.href === before.href, before.href + ' → ' + switched.href);
    ok('页面没有重新加载（导航标记还在）', switched.mark === before.mark, before.mark + ' → ' + switched.mark);
    ok('没有产生任何页面导航', navs === navsBefore, 'navs ' + navsBefore + ' → ' + navs);
    ok('播放器一直开着', switched.active === true);
    ok('标题同步成第 2 集', /第\s*2\s*集/.test(switched.title), switched.title);
    ok('活动条目带上集号', switched.epNum === 2, String(switched.epNum));
    ok('当前集状态同步成 2', switched.curEp === 2, String(switched.curEp));

    // 换源后要真的在播，而不是停在黑屏/暂停
    let playing = null;
    for (let i = 0; i < 30; i++) {
        playing = await page.evaluate(() => {
            const v = document.querySelector('.vv-player-root video');
            return v ? { paused: v.paused, t: v.currentTime, src: v.currentSrc || v.src || '' } : null;
        });
        if (playing && playing.paused === false && playing.t > 0.2) break;
        await sleep(300);
    }
    ok('换集后自动开始播放', !!playing && playing.paused === false && playing.t > 0.2,
        playing ? ('paused=' + playing.paused + ' t=' + playing.t.toFixed(2)) : 'no video');
    ok('播放器里确实在放第 2 集的片源', !!playing && /bb720\.mp4/.test(playing.src), playing && playing.src);

    const stored = await page.evaluate(() => { try { return window.__vv.get('autoNextLast', null); } catch (e) { return 'err'; } });
    ok('没有写「跳页续播」标记（说明没走跳页那条路）', stored === null, JSON.stringify(stored));

    // 选集面板的当前集高亮必须跟着换集走：地址还停在 ep1，只能靠 VV._curEp
    const panel = await page.evaluate(() => {
        window.__vv.epOpen();
        const w = document.getElementById('vv-ep-wrap');
        const on = w ? w.querySelector('.vv-ep-cell.on') : null;
        const nums = w ? Array.from(w.querySelectorAll('.vv-ep-cell[data-kind="page"]')).map((x) => x.getAttribute('data-num')) : [];
        const res = { onNum: on ? on.getAttribute('data-num') : '', nums: nums.join(',') };
        window.__vv.epClose();
        return res;
    });
    ok('选集面板高亮第 2 集', panel.onNum === '2', 'on=' + panel.onNum + ' / 格子 ' + panel.nums);

    // ---- 再点一次：连续往下走，仍然不跳页 ----
    await sleep(1700);   // 等换源后的 findNext 重新算出第 3 集
    const next3 = await page.evaluate(() => {
        const A = window.__vv.VV.active || {};
        return { nextPage: A.nextPage || '', epNum: A.nextEp ? A.nextEp.num : -1 };
    });
    ok('换集后 findNext 接着认出第 3 集', /\/e2e\/nextpage\/ep3\.html/.test(next3.nextPage), next3.nextPage);

    const before2 = await page.evaluate(() => ({ href: location.href, mark: window.__navMark }));
    await page.evaluate(() => { document.getElementById('vv-next-btn').click(); });
    let second = null;
    for (let i = 0; i < 40; i++) {
        second = await page.evaluate(() => {
            const A = window.__vv.VV.active || {};
            return {
                href: location.href,
                mark: window.__navMark || '',
                url: A.item ? A.item.url : '',
                epNum: A.epNum === undefined ? -1 : A.epNum,
                title: (document.getElementById('vv-title') || {}).textContent || '',
                active: window.__vv.VV.playerActive
            };
        });
        if (/flower\.mp4$/.test(second.url)) break;
        await sleep(250);
    }
    ok('连续第二次「下一集」也换了片源', /\/e2e\/flower\.mp4$/.test(second.url), second.url);
    ok('第二次换集同样没跳页', second.href === before2.href && second.mark === before2.mark && second.active,
        second.href);
    ok('第二次换集标题变成第 3 集', /第\s*3\s*集/.test(second.title) && second.epNum === 3,
        'ep=' + second.epNum + ' / ' + second.title);

    // ---- 取页失败时不许偷偷跳页 ----
    const failed = await page.evaluate(() => new Promise((res) => {
        const before = location.href;
        const mark = window.__navMark;
        // 指向一个不存在的页面：解析不出片源，也不能退回 location.href
        try { window.__vv.nextFromPage(location.origin + '/e2e/nextpage/not-exist.html', { kind: 'page', num: 9, href: '#', el: null }); } catch (e) {}
        setTimeout(() => {
            res({ href: location.href, mark: window.__navMark, before: before, markBefore: mark,
                active: window.__vv.VV.playerActive, url: (window.__vv.VV.active || {}).item ? window.__vv.VV.active.item.url : '' });
        }, 2500);
    }));
    ok('拿不到下一集片源时留在原页', failed.href === failed.before && failed.mark === failed.markBefore, failed.href);
    ok('失败时播放器与当前片源不受影响', failed.active === true && /flower\.mp4$/.test(failed.url), failed.url);
} catch (e) {
    fail++;
    console.log('FAIL - 验证脚本异常: ' + (e && e.stack || e));
} finally {
    if (browser) { try { await browser.close(); } catch (e) {} }
    cleanup();
}

console.log(`\nnext-inplace verify: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
