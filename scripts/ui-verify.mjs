// UI / 交互层功能矩阵测试：真实浏览器 + 真实事件
// 覆盖：角标、嗅探面板、播放器 DOM、单击/双击/横滑/竖滑手势、亮度音量、
//       倍速菜单、画质菜单、锁屏、进度条拖动、页面冻结、进度记忆续播、
//       关闭恢复、下载/复制按钮、面板操作。
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { setTimeout as sleep } from 'node:timers/promises';
import { existsSync } from 'node:fs';

const WS = 'C:/Users/Administrator/.workbuddy/binaries/node/workspace/index.js';
let puppeteer;
try { puppeteer = createRequire(import.meta.url)('puppeteer-core'); }
catch (e) { puppeteer = createRequire(WS)('puppeteer-core'); }

const PORT = Number(process.env.PORT || 8089);
const BASE = `http://127.0.0.1:${PORT}`;
const BROWSERS = [
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
];

let pass = 0, fail = 0;
const failures = [];
function ok(name, cond, detail) {
    if (cond) { pass++; console.log('ok  - ' + name + (detail ? '  [' + detail + ']' : '')); }
    else { fail++; failures.push(name); console.log('FAIL - ' + name + (detail ? '  [' + detail + ']' : '')); }
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
        args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required', '--mute-audio',
            '--disable-dev-shm-usage', '--window-size=412,892'].concat(proxyArgs()),
        defaultViewport: { width: 412, height: 892 }
    });

    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e && e.message || e)));
    page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

    // ============ A. 角标与嗅探 ============
    await page.goto(BASE + '/e2e/index.html?vvdebug=1', { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForFunction(() => !!(window.__vv && window.__vv.VV), { timeout: 15000 });
    ok('调试句柄挂载', true);

    // 页面自带 hls.js 走 CDN，可能很慢；等它就绪，HLS 才会被嗅探到
    await page.waitForFunction(() => !!(window.Hls && window.Hls.isSupported && window.Hls.isSupported()),
        { timeout: 45000 }).catch(() => {});
    await page.waitForFunction(() => window.__vv.VV.items.some((i) => i.type === 'HLS'),
        { timeout: 30000 }).catch(() => {});

    const badge = await page.evaluate(async () => {
        for (let i = 0; i < 40; i++) {
            const b = document.getElementById('vv-badge');
            if (b && /vv-badge/.test(b.className)) return { has: true, text: b.textContent };
            await new Promise((r) => setTimeout(r, 250));
        }
        const b = document.getElementById('vv-badge');
        return { has: !!(b && /vv-badge/.test(b.className)), text: b ? b.textContent : '' };
    });
    ok('嗅探角标出现', badge.has, badge.text);

    const items = await page.evaluate(() => window.__vv.VV.items.map((i) => i.type));
    ok('嗅探到多种资源', items.length >= 2, items.join(','));
    ok('HLS 被识别为 HLS', items.indexOf('HLS') >= 0, items.join(','));

    // ============ B. 嗅探面板 ============
    const panel = await page.evaluate(() => {
        window.__vv.openPanel();
        const w = document.getElementById('vv-panel-wrap');
        const rows = w ? w.querySelectorAll('.vv-row') : [];
        const titles = [];
        for (let i = 0; i < rows.length; i++) {
            const n = rows[i].querySelector('.vv-row-name');
            titles.push(n ? n.textContent : '');
        }
        const acts = rows.length ? rows[0].querySelectorAll('.vv-btn-mini, .vv-btn-play') : [];
        return {
            open: !!(w && /open/.test(w.className)),
            count: rows.length,
            titles: titles,
            actBtns: acts.length,
            badgeHidden: !!(document.getElementById('vv-badge') && !/show/.test(document.getElementById('vv-badge').className)),
            title: w ? (w.querySelector('.vv-head-title') || {}).textContent : ''
        };
    });
    ok('面板能打开', panel.open);
    ok('面板列出嗅探结果', panel.count >= 2, panel.count + ' 行: ' + panel.titles.join(' / '));
    ok('面板标题带计数', /\d/.test(panel.title || ''), panel.title);
    ok('每行有下载/复制/播放按钮', panel.actBtns === 3, String(panel.actBtns));
    ok('面板打开时角标隐藏', panel.badgeHidden);

    await page.evaluate(() => { const w = document.getElementById('vv-panel-wrap'); if (w) w.classList.remove('open'); });

    // ============ C. 从面板播放 ============
    const played = await page.evaluate(async () => {
        const w = document.getElementById('vv-panel-wrap');
        const row = w ? w.querySelector('.vv-row') : null;
        const btn = row ? row.querySelector('.vv-btn-play') : null;
        if (!btn) return { skip: true };
        btn.click();
        await new Promise((r) => setTimeout(r, 1200));
        return { active: !!window.__vv.VV.playerActive };
    });
    ok('点面板 ▶ 能起播', played.active || played.skip, JSON.stringify(played));

    // ============ D. 播放器 DOM 结构 ============
    await page.evaluate(() => {
        const it = window.__vv.VV.items.find((i) => i.type === 'HLS') || window.__vv.VV.items[0];
        window.__vv.open(it);
    });
    await page.waitForFunction(() => {
        const v = document.querySelector('.vv-player-video');
        return !!(v && v.readyState >= 1);
    }, { timeout: 45000 }).catch(() => {});
    const dom = await page.evaluate(() => {
        const q = (s) => document.querySelector(s);
        const root = q('.vv-player-root');
        return {
            root: !!root,
            video: !!q('.vv-player-video'),
            topbar: !!q('.vv-cs-top'),
            bottom: !!q('.vv-cs-bottom'),
            prog: !!q('.vv-prog'),
            center: !!q('.vv-center-play'),
            lockmark: !!q('.vv-lockmark'),
            title: (q('#vv-title') || {}).textContent || '',
            dur: (q('#vv-dur') || {}).textContent || '',
            time: (q('.vv-time') || {}).textContent || '',
            frozen: document.documentElement.style.overflow === 'hidden' || document.body.style.overflow === 'hidden',
            hasSpeedChip: !!q('#vv-speed-chip'),
            hasLockBtn: !!q('#vv-lock-btn'),
            hasNextBtn: !!q('#vv-next-btn')
        };
    });
    ok('播放器根节点存在', dom.root);
    ok('视频元素存在', dom.video);
    ok('上下控制栏存在', dom.topbar && dom.bottom);
    ok('进度条存在', dom.prog);
    ok('中央播放按钮存在', dom.center);
    ok('锁屏标记存在', dom.lockmark);
    ok('标题已填充', (dom.title || '').length > 0, dom.title);
    ok('时长已显示', /\d+:\d\d/.test(dom.dur || ''), dom.dur);
    ok('播放时页面被冻结', dom.frozen);
    ok('倍速 chip / 锁屏键 / 下一集键存在', dom.hasSpeedChip && dom.hasLockBtn && dom.hasNextBtn);

    // ============ D2. 加载进度显示 ============
    const loadDom = await page.evaluate(() => {
        const q = (s) => document.querySelector(s);
        return {
            loading: !!q('.vv-loading'),
            ring: !!q('.vv-lr'),
            ringFg: !!q('.vv-lr-fg'),
            ringNum: !!q('.vv-lr-num'),
            detail: !!q('.vv-load-detail'),
            loadbar: !!q('.vv-loadbar'),
            loadFill: !!q('.vv-loadbar-fill')
        };
    });
    ok('加载遮罩存在', loadDom.loading);
    ok('环形进度 SVG 存在', loadDom.ring && loadDom.ringFg);
    ok('环形中心百分比容器存在', loadDom.ringNum);
    ok('加载明细行存在', loadDom.detail);
    ok('顶部细进度条存在', loadDom.loadbar && loadDom.loadFill);

    // 百分比映射：stroke-dashoffset 应随进度递减
    const ringCalc = await page.evaluate(() => {
        const fg = document.querySelector('.vv-lr-fg');
        const num = document.querySelector('.vv-lr-num');
        const C = 119.4;
        const out = {};
        window.__vv.setLoadPct(0, false, '测试');
        out.p0 = { txt: num.textContent, off: parseFloat(fg.style.strokeDashoffset || 'NaN') };
        window.__vv.setLoadPct(50, false, '测试');
        out.p50 = { txt: num.textContent, off: parseFloat(fg.style.strokeDashoffset || 'NaN') };
        window.__vv.setLoadPct(100, false, '测试');
        out.p100 = { txt: num.textContent, off: parseFloat(fg.style.strokeDashoffset || 'NaN') };
        window.__vv.setLoadPct(150, false, '测试');
        out.pOver = { txt: num.textContent, off: parseFloat(fg.style.strokeDashoffset || 'NaN') };
        out.C = C;
        return out;
    });
    ok('进度 0% 显示 0%', ringCalc.p0.txt === '0%', ringCalc.p0.txt);
    ok('进度 50% 显示 50%', ringCalc.p50.txt === '50%', ringCalc.p50.txt);
    ok('进度 100% 显示 100%', ringCalc.p100.txt === '100%', ringCalc.p100.txt);
    ok('进度超过 100% 被钳到 100%', ringCalc.pOver.txt === '100%', ringCalc.pOver.txt);
    ok('环形 offset 与百分比匹配（50%≈半圈）',
        Math.abs(ringCalc.p50.off - ringCalc.C * 0.5) < 1.5,
        'off=' + ringCalc.p50.off);
    ok('环形满圈 offset 为 0', Math.abs(ringCalc.p100.off) < 0.5, 'off=' + ringCalc.p100.off);

    // 不确定态：不给百分比 → 只剩动画
    const indet = await page.evaluate(() => {
        const num = document.querySelector('.vv-lr-num');
        const ld = document.querySelector('.vv-loading');
        const bar = document.querySelector('.vv-loadbar');
        window.__vv.setLoadPct(null, true, '');
        return {
            txt: num.textContent,
            indet: ld.classList.contains('indet'),
            barIndet: bar.classList.contains('indet')
        };
    });
    ok('不确定态不显示百分比', indet.txt === '', JSON.stringify(indet.txt));
    ok('不确定态加 indet 类', indet.indet && indet.barIndet);

    // 明细行能写入内容
    const detail = await page.evaluate(() => {
        window.__vv.setLoadPct(30, false, '1.2 MB / 4.0 MB · 300 KB/s');
        const d = document.querySelector('.vv-load-detail');
        return d.textContent;
    });
    ok('加载明细显示字节/速度', /MB\/s|KB\/s/.test(detail || ''), detail);

    // 缓冲时（waiting）应显示遮罩 + 顶部细条
    // 先暂停真实视频，避免真实网络抖动触发的 playing/canplay 把提示抢走
    const waiting = await page.evaluate(async () => {
        const v = document.querySelector('.vv-player-video');
        try { v.pause(); } catch (e) {}
        await new Promise((r) => setTimeout(r, 200));
        v.dispatchEvent(new Event('waiting'));
        await new Promise((r) => setTimeout(r, 400));
        const ld = document.querySelector('.vv-loading');
        const bar = document.querySelector('.vv-loadbar');
        const res = {
            on: ld.classList.contains('on'),
            barOn: bar.classList.contains('on'),
            text: (ld.querySelector('.vv-load-text') || {}).textContent || '',
            num: (ld.querySelector('.vv-lr-num') || {}).textContent || ''
        };
        v.dispatchEvent(new Event('playing'));
        await new Promise((r) => setTimeout(r, 300));
        res.afterHide = !ld.classList.contains('on');
        res.afterBarHide = !bar.classList.contains('on');
        return res;
    });
    ok('缓冲时显示加载遮罩', waiting.on, waiting.text);
    ok('缓冲时显示顶部细进度条', waiting.barOn);
    ok('缓冲提示文案为"缓冲中"', /缓冲/.test(waiting.text), waiting.text);
    ok('恢复播放后隐藏加载遮罩', waiting.afterHide);
    ok('恢复播放后隐藏顶部细条', waiting.afterBarHide);

    // ============ D2. 起播失败卡片（源站 403 / 只有 blob 时的出口）============
    const errcard = await page.evaluate(async () => {
        const box = document.querySelector('.vv-err');
        const before = box ? box.classList.contains('on') : null;
        const btns = box ? [...box.querySelectorAll('.vv-err-btn')].map((b) => b.getAttribute('data-a')) : [];
        window.__vv.showErr('源站返回 HTTP 403，拒绝第三方播放。', '这个视频源播不了');
        await new Promise((r) => setTimeout(r, 120));
        const shown = box.classList.contains('on');
        const title = (box.querySelector('.vv-err-t') || {}).textContent || '';
        const msg = (box.querySelector('.vv-err-m') || {}).textContent || '';
        const loadingHidden = !document.querySelector('.vv-loading').classList.contains('on');
        window.__vv.hideErr();
        await new Promise((r) => setTimeout(r, 120));
        const hidden = !box.classList.contains('on');
        return { before, btns, shown, title, msg, loadingHidden, hidden };
    });
    ok('失败卡片结构存在（重试/外部播放器/返回）', errcard.before === false
        && errcard.btns.join(',') === 'retry,ext,close', errcard.btns.join(','));
    ok('能显示失败卡片', errcard.shown);
    ok('失败卡片有标题与原因', /播不了/.test(errcard.title) && /403/.test(errcard.msg), errcard.title + ' | ' + errcard.msg.slice(0, 40));
    ok('失败卡片出现时收起加载遮罩', errcard.loadingHidden);
    ok('能关闭失败卡片', errcard.hidden);

    // 看门狗：起播 12s 无画面才触发；拿到画面后必须解除（不能误报）
    const wdog = await page.evaluate(async () => {
        window.__vv.armWatchdog();
        const armed = !!window.__vv.VV._startWdog;
        window.__vv.disarmWatchdog();
        const disarmed = !!window.__vv.VV._startWdog;
        return { armed, disarmed };
    });
    ok('起播看门狗能挂起', wdog.armed);
    ok('起播看门狗能解除（正常播放不误报）', wdog.disarmed === false);

    // ============ E. 手势：单击显隐控制栏 ============
    const singleTap = await page.evaluate(async () => {
        const root = document.querySelector('.vv-player-root');
        const r = root.getBoundingClientRect();
        const x = r.left + r.width / 2, y = r.top + r.height / 2;
        const mk = (type) => {
            const t = new Touch({ identifier: 1, target: root, clientX: x, clientY: y });
            root.dispatchEvent(new TouchEvent(type, {
                bubbles: true, cancelable: true,
                touches: type === 'touchend' ? [] : [t],
                changedTouches: [t]
            }));
        };
        // 强制进入"控制栏隐藏"状态，再单击一次应该显示出来
        root.classList.remove('cs-on');
        await new Promise((r2) => setTimeout(r2, 100));
        mk('touchstart'); mk('touchend');
        await new Promise((r2) => setTimeout(r2, 500));
        const shown = root.classList.contains('cs-on');
        // 再单击一次应该隐藏
        mk('touchstart'); mk('touchend');
        await new Promise((r2) => setTimeout(r2, 500));
        const hidden = !root.classList.contains('cs-on');
        return { shown, hidden };
    });
    ok('单击画面唤出控制栏', singleTap.shown);
    ok('再单击隐藏控制栏', singleTap.hidden);

    // ============ F. 手势：双击快进/快退 ============
    const dbl = await page.evaluate(async () => {
        const root = document.querySelector('.vv-player-root');
        const v = document.querySelector('.vv-player-video');
        const r = root.getBoundingClientRect();
        const tap = (x) => {
            const t = new Touch({ identifier: 2, target: root, clientX: x, clientY: r.top + r.height / 2 });
            root.dispatchEvent(new TouchEvent('touchstart', { bubbles: true, cancelable: true, touches: [t], changedTouches: [t] }));
            root.dispatchEvent(new TouchEvent('touchend', { bubbles: true, cancelable: true, touches: [], changedTouches: [t] }));
        };
        // 先确保在播放
        if (v.paused) v.play();
        await new Promise((r2) => setTimeout(r2, 400));
        const t0 = v.currentTime;
        tap(r.right - 40);   // 右半屏 → 快进
        await new Promise((r2) => setTimeout(r2, 120));
        tap(r.right - 40);
        await new Promise((r2) => setTimeout(r2, 1200));
        const t1 = v.currentTime;
        const tip = (document.querySelector('.vv-seek-tip') || {}).textContent || '';
        return { t0, t1, tip, fwd: t1 > t0 + 1 };
    });
    ok('双击右半屏快进', dbl.fwd, 't0=' + dbl.t0.toFixed(1) + ' → t1=' + dbl.t1.toFixed(1) + ' tip=' + dbl.tip);

    const dblBack = await page.evaluate(async () => {
        const root = document.querySelector('.vv-player-root');
        const v = document.querySelector('.vv-player-video');
        const r = root.getBoundingClientRect();
        const tap = (x) => {
            const t = new Touch({ identifier: 3, target: root, clientX: x, clientY: r.top + r.height / 2 });
            root.dispatchEvent(new TouchEvent('touchstart', { bubbles: true, cancelable: true, touches: [t], changedTouches: [t] }));
            root.dispatchEvent(new TouchEvent('touchend', { bubbles: true, cancelable: true, touches: [], changedTouches: [t] }));
        };
        const t0 = v.currentTime;
        tap(r.left + 40);
        await new Promise((r2) => setTimeout(r2, 120));
        tap(r.left + 40);
        await new Promise((r2) => setTimeout(r2, 1200));
        return { t0, t1: v.currentTime };
    });
    ok('双击左半屏快退', dblBack.t1 < dblBack.t0, 't0=' + dblBack.t0.toFixed(1) + ' → t1=' + dblBack.t1.toFixed(1));

    // ============ G. 手势：横向滑动 seek ============
    const swipe = await page.evaluate(async () => {
        const root = document.querySelector('.vv-player-root');
        const v = document.querySelector('.vv-player-video');
        // 播放器若已意外关闭，不要抛异常炸掉整个套件，交给断言去报
        if (!root || !v) return { t0: 0, t1: 0, tip: '', missing: true };
        const r = root.getBoundingClientRect();
        const y = r.top + r.height / 2;
        const mkT = (id, x) => new Touch({ identifier: id, target: root, clientX: x, clientY: y });
        const t0 = v.currentTime;
        let a = mkT(10, r.left + 60);
        root.dispatchEvent(new TouchEvent('touchstart', { bubbles: true, cancelable: true, touches: [a], changedTouches: [a] }));
        let b = mkT(10, r.left + r.width - 60);
        root.dispatchEvent(new TouchEvent('touchmove', { bubbles: true, cancelable: true, touches: [b], changedTouches: [b] }));
        await new Promise((r2) => setTimeout(r2, 80));
        const tip = (document.querySelector('.vv-seek-tip') || {}).textContent || '';
        root.dispatchEvent(new TouchEvent('touchend', { bubbles: true, cancelable: true, touches: [], changedTouches: [b] }));
        await new Promise((r2) => setTimeout(r2, 1500));
        return { t0, t1: v.currentTime, tip };
    });
    ok('横滑显示跳转提示', /→/.test(swipe.tip || ''), swipe.tip + (swipe.missing ? ' [播放器已关闭]' : ''));
    ok('横滑后真的跳转了', Math.abs(swipe.t1 - swipe.t0) > 3, 't0=' + swipe.t0.toFixed(1) + ' → t1=' + swipe.t1.toFixed(1));

    // ============ H. 手势：竖滑亮度/音量 ============
    const bright = await page.evaluate(async () => {
        const root = document.querySelector('.vv-player-root');
        const r = root.getBoundingClientRect();
        const x = r.left + 40;               // 左半屏 → 亮度
        const y0 = r.top + r.height * 0.6;
        const mkT = (id, yy) => new Touch({ identifier: id, target: root, clientX: x, clientY: yy });
        let a = mkT(20, y0);
        root.dispatchEvent(new TouchEvent('touchstart', { bubbles: true, cancelable: true, touches: [a], changedTouches: [a] }));
        let b = mkT(20, y0 - 180);
        root.dispatchEvent(new TouchEvent('touchmove', { bubbles: true, cancelable: true, touches: [b], changedTouches: [b] }));
        await new Promise((r2) => setTimeout(r2, 60));
        const tip = (document.querySelector('.vv-ges-tip') || {}).textContent || '';
        const mask = (document.querySelector('.vv-bright') || {}).style || {};
        root.dispatchEvent(new TouchEvent('touchend', { bubbles: true, cancelable: true, touches: [], changedTouches: [b] }));
        return { tip, opacity: mask.opacity, bg: mask.background || '' };
    });
    ok('左半屏竖滑显示亮度提示', /亮度/.test(bright.tip || ''), bright.tip);
    ok('亮度遮罩有实际效果', !!bright.opacity || !!bright.bg, 'opacity=' + bright.opacity);

    const vol = await page.evaluate(async () => {
        const root = document.querySelector('.vv-player-root');
        const v = document.querySelector('.vv-player-video');
        v.volume = 0.4;                        // 先给一个非满值，才能验证手势是否生效
        const r = root.getBoundingClientRect();
        const x = r.right - 40;              // 右半屏 → 音量
        const y0 = r.top + r.height * 0.6;
        const mkT = (id, yy) => new Touch({ identifier: id, target: root, clientX: x, clientY: yy });
        let a = mkT(30, y0);
        root.dispatchEvent(new TouchEvent('touchstart', { bubbles: true, cancelable: true, touches: [a], changedTouches: [a] }));
        let b = mkT(30, y0 - 180);            // 向上滑 → 增大音量
        root.dispatchEvent(new TouchEvent('touchmove', { bubbles: true, cancelable: true, touches: [b], changedTouches: [b] }));
        await new Promise((r2) => setTimeout(r2, 60));
        const tip = (document.querySelector('.vv-ges-tip') || {}).textContent || '';
        const volume = v.volume;
        root.dispatchEvent(new TouchEvent('touchend', { bubbles: true, cancelable: true, touches: [], changedTouches: [b] }));
        return { tip, volume };
    });
    ok('右半屏竖滑显示音量提示', /音量/.test(vol.tip || ''), vol.tip);
    ok('音量数值确实变了', vol.volume > 0.45, 'volume=' + vol.volume);

    // ============ I. 长按临时倍速 ============
    const longPress = await page.evaluate(async () => {
        const root = document.querySelector('.vv-player-root');
        const v = document.querySelector('.vv-player-video');
        if (v.paused) v.play();
        await new Promise((r2) => setTimeout(r2, 300));
        const r = root.getBoundingClientRect();
        const t = new Touch({ identifier: 40, target: root, clientX: r.left + r.width / 2, clientY: r.top + r.height / 2 });
        root.dispatchEvent(new TouchEvent('touchstart', { bubbles: true, cancelable: true, touches: [t], changedTouches: [t] }));
        await new Promise((r2) => setTimeout(r2, 800));
        const rate = v.playbackRate;
        const tip = (document.querySelector('.vv-ges-tip') || {}).textContent || '';
        root.dispatchEvent(new TouchEvent('touchend', { bubbles: true, cancelable: true, touches: [], changedTouches: [t] }));
        await new Promise((r2) => setTimeout(r2, 120));
        return { rate, tip, restored: v.playbackRate };
    });
    ok('长按临时加速', longPress.rate >= 2, 'rate=' + longPress.rate + ' tip=' + longPress.tip);
    ok('松手恢复原倍速', longPress.restored < 2, 'restored=' + longPress.restored);

    // ============ J. 倍速菜单 ============
    const speed = await page.evaluate(async () => {
        const chip = document.getElementById('vv-speed-chip');
        if (!chip) return { skip: true };
        chip.click();
        await new Promise((r2) => setTimeout(r2, 250));
        const sheet = document.getElementById('vv-sheet');
        const rows = sheet ? sheet.querySelectorAll('.vv-sheet-item') : [];
        const labels = [];
        for (let i = 0; i < rows.length; i++) labels.push(rows[i].textContent);
        // 点 2x
        let clicked = false;
        for (let i = 0; i < rows.length; i++) {
            if (/2x/.test(rows[i].textContent)) { rows[i].click(); clicked = true; break; }
        }
        await new Promise((r2) => setTimeout(r2, 300));
        const v = document.querySelector('.vv-player-video');
        return {
            labels, clicked,
            rate: v ? v.playbackRate : -1,
            chipText: document.getElementById('vv-speed-chip').textContent
        };
    });
    ok('倍速菜单列出 8 档', (speed.labels || []).length === 8, (speed.labels || []).join(' '));
    ok('倍速菜单含 0.5x~4x', /0\.5x/.test((speed.labels || []).join(' ')) && /4x/.test((speed.labels || []).join(' ')));
    ok('选 2x 后播放速率生效', speed.rate === 2, 'rate=' + speed.rate);
    ok('倍速 chip 同步显示', /2x/.test(speed.chipText || ''), speed.chipText);

    // ============ J2. 菜单的关闭方式与停留时长 ============
    const sheetBehavior = await page.evaluate(async () => {
        const root = document.querySelector('.vv-player-root');
        const chip = document.getElementById('vv-speed-chip');
        if (!root || !chip) return { skip: true };
        // 把自动收起压到 600ms，方便在测试里验证"菜单开着就不该收起"
        const oldHide = window.__vv.VV.cfg.autoHide;
        window.__vv.VV.cfg.autoHide = 600;

        const isOpen = () => {
            const s = document.getElementById('vv-sheet');
            return !!(s && s.classList.contains('open'));
        };
        const csOn = () => root.classList.contains('cs-on');

        chip.click();
        await new Promise((r2) => setTimeout(r2, 100));
        const csAtOpen = csOn();

        // 超过 autoHide 时间：菜单开着，控制栏不应被抽走
        await new Promise((r2) => setTimeout(r2, 900));
        const sheetAfterWait = isOpen();
        const csAfterWait = csOn();

        // 点画面空白：菜单应立刻关闭，而不是等 300ms 双击判定
        const r = root.getBoundingClientRect();
        const x = r.left + r.width / 2, y = r.top + Math.round(r.height * 0.25);
        const mk = (type) => {
            const t = new Touch({ identifier: 3, target: root, clientX: x, clientY: y });
            root.dispatchEvent(new TouchEvent(type, {
                bubbles: true, cancelable: true,
                touches: type === 'touchend' ? [] : [t],
                changedTouches: [t]
            }));
        };
        mk('touchstart'); mk('touchend');
        await new Promise((r2) => setTimeout(r2, 80));
        const closedByTap = !isOpen();
        const csAfterClose = csOn();

        window.__vv.VV.cfg.autoHide = oldHide;
        return { csAtOpen, sheetAfterWait, csAfterWait, closedByTap, csAfterClose };
    });
    if (!sheetBehavior.skip) {
        ok('打开菜单时控制栏可见', sheetBehavior.csAtOpen);
        ok('菜单开着时控制栏不自动收起', sheetBehavior.sheetAfterWait && sheetBehavior.csAfterWait,
            'sheet=' + sheetBehavior.sheetAfterWait + ' cs=' + sheetBehavior.csAfterWait);
        ok('点画面空白立即关闭菜单', sheetBehavior.closedByTap);
        ok('关菜单后控制栏仍在', sheetBehavior.csAfterClose);
    }

    // ============ K. 画质菜单（在「更多」菜单里）===========
    const quality = await page.evaluate(async () => {
        const root = document.querySelector('.vv-player-root');
        const moreBtn = root.querySelector('.vv-cs-bottom [data-act="more"]');
        if (!moreBtn) return { skip: true };
        moreBtn.click();
        await new Promise((r2) => setTimeout(r2, 250));
        const sheet = document.getElementById('vv-sheet');
        let rows = sheet ? sheet.querySelectorAll('.vv-sheet-item') : [];
        // 找到「画质：xxx」那一项并点开它。必须锚定行首的 label：
        // 别的功能项说明文案里也可能出现「画质」二字，宽松匹配会点错菜单。
        let qIdx = -1;
        for (let i = 0; i < rows.length; i++) if (/^\s*画质[:：]/.test(rows[i].textContent)) { qIdx = i; break; }
        if (qIdx < 0) return { labels: [], noQuality: true };
        const qLabel = rows[qIdx].textContent;
        rows[qIdx].click();
        await new Promise((r2) => setTimeout(r2, 300));
        rows = sheet ? sheet.querySelectorAll('.vv-sheet-item') : [];
        const labels = [];
        for (let i = 0; i < rows.length; i++) labels.push(rows[i].textContent);
        // 选一个具体档位（非自动）
        let picked = '';
        for (let i = 0; i < rows.length; i++) {
            if (/\d+P/.test(rows[i].textContent)) { picked = rows[i].textContent; rows[i].click(); break; }
        }
        await new Promise((r2) => setTimeout(r2, 600));
        const inst = window.__vv.VV.active.hls;
        // 注意：不能用 nextLevel 判断 —— hls.js 切档完成后会在内部把它归位。
        // 可靠信号是 manualLevel（手动档索引）与 autoLevelEnabled（是否还在自动档）。
        return {
            qLabel, labels, picked,
            manual: inst ? inst.manualLevel : null,
            auto: inst ? inst.autoLevelEnabled : null,
            qIndex: window.__vv.VV.active.qIndex,
            cur: inst ? inst.currentLevel : -1
        };
    });
    ok('更多菜单里有「画质」项', /^\s*画质[:：]/.test(quality.qLabel || ''), quality.qLabel);
    ok('画质菜单列出档位', (quality.labels || []).some((l) => /\d+P/.test(l)), (quality.labels || []).join(' | '));
    ok('画质菜单含「自动」', (quality.labels || []).some((l) => /自动/.test(l)), (quality.labels || []).join(' | '));
    ok('选档后切到手动模式', quality.auto === false && quality.manual >= 0,
        'manual=' + quality.manual + ' auto=' + quality.auto + ' qIndex=' + quality.qIndex);
    ok('脚本记录了所选档位', quality.qIndex >= 0, 'qIndex=' + quality.qIndex);

    // ============ L. 锁屏 ============
    const lock = await page.evaluate(async () => {
        const btn = document.getElementById('vv-lock-btn');
        btn.click();
        await new Promise((r2) => setTimeout(r2, 200));
        const root = document.querySelector('.vv-player-root');
        const mark = document.querySelector('.vv-lockmark');
        return {
            locked: !!window.__vv.VV.active.locked,
            cls: root.className,
            markVisible: mark ? getComputedStyle(mark).display !== 'none' : false
        };
    });
    ok('锁屏生效', lock.locked && /locked/.test(lock.cls), lock.cls);
    ok('解锁按钮出现', lock.markVisible);

    await page.evaluate(async () => {
        const mark = document.querySelector('.vv-lockmark');
        if (mark) mark.click();
        await new Promise((r2) => setTimeout(r2, 200));
    });
    const unlocked = await page.evaluate(() => !!window.__vv.VV.active.locked === false);
    ok('可解锁', unlocked);

    // ============ M. 进度条拖动 ============
    // 前置：脚本用「距上次触摸 > 800ms」区分鼠标与手指（vvIsMouseLike），
    // 上面的用例刚派发过触摸事件，必须等过这个窗口，否则鼠标拖动会被当成手指忽略。
    await page.evaluate(async () => {
        if (!document.querySelector('.vv-player-root').classList.contains('cs-on')) {
            const root = document.querySelector('.vv-player-root');
            const v = document.querySelector('.vv-player-video');
            if (v && v.paused) await v.play().catch(() => {});
            const r = root.getBoundingClientRect();
            const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
            const mk = (type) => {
                const t = new Touch({ identifier: 1, target: root, clientX: cx, clientY: cy });
                return new TouchEvent(type, {
                    bubbles: true, cancelable: true,
                    touches: type === 'touchend' ? [] : [t], changedTouches: [t]
                });
            };
            root.dispatchEvent(mk('touchstart'));
            await new Promise((r2) => setTimeout(r2, 50));
            root.dispatchEvent(mk('touchend'));
        }
        await new Promise((r2) => setTimeout(r2, 900));
    });
    const dragReady = await page.evaluate(() => {
        const root = document.querySelector('.vv-player-root');
        const prog = document.querySelector('.vv-prog');
        return { csOn: root.classList.contains('cs-on'), w: prog.getBoundingClientRect().width };
    });
    ok('拖动前控制栏可见且进度条有宽度', dragReady.csOn && dragReady.w > 4, 'cs-on=' + dragReady.csOn + ' w=' + Math.round(dragReady.w));    const drag = await page.evaluate(async () => {
        const prog = document.querySelector('.vv-prog');
        const root = document.querySelector('.vv-player-root');
        const v = document.querySelector('.vv-player-video');
        if (!prog || !root || !v) return { t0: 0, t1: 0, leftPct: '', seekTip: '', dur: 0, missing: true };
        const r = prog.getBoundingClientRect();
        const t0 = v.currentTime;
        const x = r.left + r.width * 0.7;
        const at = (el, type, cx) => el.dispatchEvent(new MouseEvent(type, {
            bubbles: true, cancelable: true, clientX: cx, clientY: r.top + r.height / 2
        }));
        at(prog, 'mousedown', x);
        // 拖动中的 mousemove 监听挂在 ROOT 上。
        // 等一拍让拖动态建立，然后派发 mousemove 并【同一个 tick 内】读游标位置：
        // 中间若 await，timeupdate / rAF 会把游标刷回真实播放进度，造成偶发 FAIL。
        await new Promise((r2) => setTimeout(r2, 80));
        at(root, 'mousemove', x);
        const dot = document.querySelector('.vv-prog-dot');
        const leftPct = dot ? dot.style.left : '';
        const seekTip = (document.querySelector('.vv-seek-tip') || {}).textContent || '';
        // 再补一次移动，确保拖动分支确实持续生效（松手后跳转用）
        at(root, 'mousemove', x + 2);
        at(root, 'mouseup', x);
        await new Promise((r2) => setTimeout(r2, 1500));
        return { t0, t1: v.currentTime, leftPct, seekTip, dur: v.duration };
    });
    // 拖动到 70% 处，游标应落在 70% 附近（容差放宽到 ±8，避免容器宽度取整误差）
    const leftNum = parseFloat(drag.leftPct || '');
    ok('拖动进度条时游标跟随', isFinite(leftNum) && leftNum >= 62 && leftNum <= 78, drag.leftPct + ' tip=' + drag.seekTip);
    ok('松手后跳到目标位置', drag.t1 > drag.t0 + 2, 't0=' + drag.t0.toFixed(1) + ' → t1=' + drag.t1.toFixed(1));

    // ============ N. 更多菜单（⋯）===========
    const more = await page.evaluate(async () => {
        const root = document.querySelector('.vv-player-root');
        const moreBtn = root.querySelector('.vv-cs-bottom [data-act="more"]');
        if (!moreBtn) return { skip: true };
        moreBtn.click();
        await new Promise((r2) => setTimeout(r2, 250));
        const sheet = document.getElementById('vv-sheet');
        const rows = sheet ? sheet.querySelectorAll('.vv-sheet-item') : [];
        const labels = [];
        for (let i = 0; i < rows.length; i++) labels.push(rows[i].textContent);
        return { labels };
    });
    ok('更多菜单能打开', (more.labels || []).length >= 5, (more.labels || []).join(' | '));
    ok('更多菜单含「用外部播放器播放」', (more.labels || []).some((l) => /外部播放器/.test(l)), (more.labels || []).join(' | '));
    ok('更多菜单含「重建播放实例」', (more.labels || []).some((l) => /重建播放实例/.test(l)), (more.labels || []).join(' | '));

    // ============ O. 关闭播放器：解冻 + 恢复页面媒体 ============
    // 先让页面原生视频播起来，播放器打开时应被暂停，关闭后应恢复。
    // 上一段（菜单 / 画质 / 拖动）结束时播放器还开着，而播放器开着期间页面媒体是
    // 被有意收起的（没有 src）。这里必须先关掉、等它把页面视频装回去，
    // 否则"先播起来"这一步根本不成立（src 为空时 play() 不会有结果）。
    await page.evaluate(async () => {
        try { if (window.__vv && window.__vv.VV.playerActive) window.__vv.close(); } catch (e) {}
        await new Promise((r2) => setTimeout(r2, 1800));
    });
    // 注意：这里必须给 play() 兜一个超时。元素没地址时 play() 可能一直 pending，
    // await 会挂死整个用例（表现为 CDP protocol timeout，看不出是哪一步）。
    const preO = await page.evaluate(() => {
        const v = document.getElementById('v1');
        return {
            src: v ? (v.getAttribute('src') || null) : null,
            cur: v ? String(v.currentSrc || '').slice(0, 48) : '',
            paused: v ? v.paused : null,
            rs: v ? v.readyState : -1,
            held: (window.__vv.VV._pageMedia || []).length
        };
    });
    await page.evaluate(async () => {
        const v = document.getElementById('v1');
        try { v.muted = true; await Promise.race([v.play().catch(() => {}), new Promise((r2) => setTimeout(r2, 3000))]); } catch (e) {}
        await new Promise((r2) => setTimeout(r2, 600));
    });
    const pageMedia = await page.evaluate(async () => {
        const v = document.getElementById('v1');
        return { playing: !v.paused };
    });
    ok('页面原生视频本来在播放', pageMedia.playing, JSON.stringify(preO));

    await page.evaluate(async () => {
        window.__vv.open(window.__vv.VV.items[0]);
        await new Promise((r2) => setTimeout(r2, 1500));
    });
    const pausedByPlayer = await page.evaluate(() => {
        const v = document.getElementById('v1');
        return v.paused;
    });
    ok('播放器打开时页面原生视频被暂停', pausedByPlayer);

    const closed = await page.evaluate(async () => {
        window.__vv.close();
        // 页面原生视频的恢复被有意延到 700ms 之后：退出时先把解码器还给系统，
        // 立刻 play() 会撞上"解码器忙"，页面视频黑着不动。这里等够它启动。
        await new Promise((r2) => setTimeout(r2, 1100));
        return {
            active: !!window.__vv.VV.playerActive,
            rootLeft: !!document.getElementById('vv-player-root'),
            overflow: document.documentElement.style.overflow || '',
            pageVideoPaused: document.getElementById('v1') ? document.getElementById('v1').paused : null
        };
    });
    ok('关闭后 playerActive 复位', !closed.active);
    ok('播放器层被移除', !closed.rootLeft);
    ok('页面解冻（overflow 清空）', closed.overflow !== 'hidden', 'overflow=' + JSON.stringify(closed.overflow));
    ok('页面原生视频恢复播放', closed.pageVideoPaused === false, 'paused=' + closed.pageVideoPaused);

    // ============ P. 进度记忆 ============
    // 用公网 HLS（12 分钟，足够长；本地 flower.mp4 只有 5 秒，不适合测续播）
    // 播到 10 秒左右再关，确保进度落盘（保存门槛 t >= 4s）
    const resumeUrl = await page.evaluate(async () => {
        const it = window.__vv.VV.items.find((x) => x.type === 'HLS');
        window.__vv.open(it);
        // 等 hls.js 真正能播（有缓冲），再设置进度
        for (let i = 0; i < 40; i++) {
            await new Promise((r2) => setTimeout(r2, 500));
            const v = document.querySelector('.vv-player-video');
            if (v && v.readyState >= 2 && v.duration > 60) break;
        }
        const v = document.querySelector('.vv-player-video');
        if (v) { try { v.currentTime = 10; } catch (e) {} }
        await new Promise((r2) => setTimeout(r2, 2000));
        window.__vv.close();
        await new Promise((r2) => setTimeout(r2, 500));
        return it.url;
    });
    const saved = await page.evaluate(() => {
        const p = window.__vv.VV._pmap || {};
        return { keys: Object.keys(p).length, all: p };
    });
    ok('进度写入存储', saved.keys >= 1, JSON.stringify(saved.all).slice(0, 140));

    // 重新打开同一个 URL，验证自动续播
    const resume = await page.evaluate(async (u) => {
        const it = window.__vv.VV.items.find((x) => x.url === u);
        if (!it) return { skip: true };
        window.__vv.open(it);
        for (let i = 0; i < 30; i++) {
            await new Promise((r2) => setTimeout(r2, 500));
            const v = document.querySelector('.vv-player-video');
            if (v && v.currentTime > 6) return { t: v.currentTime, ready: v.readyState };
        }
        const v = document.querySelector('.vv-player-video');
        return { t: v ? v.currentTime : -1, ready: v ? v.readyState : -1 };
    }, resumeUrl);
    ok('重开后自动续播到原位置', resume.t > 6 && resume.t < 40, 't=' + resume.t + ' ready=' + resume.ready);

    // ============ Q. 下载 / 复制 按钮（用本地 mp4，HLS 走的是"导出"分支）============
    // ⭳ 下载的是"当前正在播放的视频"，所以先切到 mp4
    await page.evaluate(async () => {
        const mp4 = window.__vv.VV.items.find((x) => x.type === 'MP4');
        if (mp4) { window.__vv.open(mp4); await new Promise((r2) => setTimeout(r2, 1500)); }
    });
    const dl = await page.evaluate(async () => {
        const out = { clicked: false, err: null, captured: null };
        const orig = HTMLAnchorElement.prototype.click;
        HTMLAnchorElement.prototype.click = function () {
            if (this.download) out.captured = { name: this.download, href: (this.href || '').slice(0, 60) };
            else orig.call(this);
        };
        try {
            const mp4 = window.__vv.VV.items.find((x) => x.type === 'MP4');
            const root = document.querySelector('.vv-player-root');
            // 顶部 ⭳ 按钮下载的是当前正在播放的视频
            const b = root.querySelector('.vv-cs-top [data-act="download"]');
            if (b) { b.click(); out.clicked = true; }
            await new Promise((r2) => setTimeout(r2, 900));
        } catch (e) { out.err = String(e && e.message); }
        HTMLAnchorElement.prototype.click = orig;
        return out;
    });
    ok('⭳ 下载按钮可触发', dl.clicked, dl.err || '');
    ok('下载产生带文件名的链接', !!(dl.captured && dl.captured.name), JSON.stringify(dl.captured));

    // ============ Q2. 切后台 = 立刻交还解码器（多页签播不动的核心修复）============
    // 真机上 Via 切标签时不一定会派发 visibilitychange，所以脚本里另加了 rAF 心跳兜底；
    // 这里直接改 document.hidden 造一个"后台"，验证的是【释放动作】本身。
    await page.evaluate(() => {
        Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
        Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
        document.dispatchEvent(new Event('visibilitychange'));
    });
    const readBg = () => page.evaluate(() => {
        const v = document.querySelector('.vv-player-video');
        return {
            srcLen: window.__vv.videoSrcLen(),
            srcAttr: v ? v.getAttribute('src') : 'no-el',
            cur: v ? (v.currentSrc || '') : 'no-el',
            pool: window.__vv.hlsPool(),
            hidden: window.__vv.tabHidden(),
            suspended: !!(window.__vv.VV.active && window.__vv.VV.active._suspended),
            released: !!(window.__vv.VV.active && window.__vv.VV.active._mediaReleased)
        };
    });
    // 进后台先只挂起，解码器留 1.2 秒宽限：系统弹窗（下载、分享、权限框）会让页面
    // 隐藏一两秒又回来，这段时间拆掉播放实例就得整条重建，用户会看到一次播放中断。
    await sleep(700);
    const soonState = await readBg();
    ok('切后台：判定为后台', soonState.hidden === true, JSON.stringify(soonState));
    ok('切后台宽限内：只挂起、不拆播放实例',
        soonState.suspended && !soonState.released && soonState.srcLen > 0,
        JSON.stringify(soonState));

    // 宽限过了、人还没回来：按原样彻底交还。tick 是 900ms 一轮，留足余量
    await sleep(1800);
    const bgState = await readBg();
    ok('切后台超过宽限：播放器 video 的 src 被摘掉（解码器让出）', bgState.srcLen === 0, 'srcLen=' + bgState.srcLen);
    ok('切后台超过宽限：hls 实例池清空', bgState.pool === 0, 'pool=' + bgState.pool);
    ok('切后台超过宽限：播放管线标记为已释放', bgState.suspended && bgState.released, JSON.stringify(bgState));

    // 回到前台：应该整条重建并接着播
    await page.evaluate(() => {
        delete document.hidden;
        delete document.visibilityState;
        document.dispatchEvent(new Event('visibilitychange'));
    });
    await sleep(2600);
    const fgState = await page.evaluate(() => {
        const v = document.querySelector('.vv-player-video');
        return {
            srcLen: window.__vv.videoSrcLen(),
            paused: v ? v.paused : null,
            t: v ? v.currentTime : -1,
            hidden: window.__vv.tabHidden()
        };
    });
    ok('回前台：判定为前台', fgState.hidden === false, JSON.stringify(fgState));
    ok('回前台：播放管线重建（src 回来了）', fgState.srcLen > 0, 'srcLen=' + fgState.srcLen);
    ok('回前台：自动继续播放', fgState.paused === false, 'paused=' + fgState.paused + ' t=' + fgState.t);

    // ============ R. 无未捕获错误 ============
    const fatal = errors.filter((e) => !/favicon|net::ERR|Failed to load resource/i.test(e));
    ok('无未捕获运行时错误', fatal.length === 0, fatal.slice(0, 3).join(' | '));

    console.log('\n=== UI 功能矩阵 ===');
    console.log(`passed ${pass}, failed ${fail}`);
    if (failures.length) console.log('失败项: ' + failures.join(' / '));
} catch (e) {
    console.log('测试异常:', e && e.stack || e);
    fail++;
} finally {
    try { if (browser) await browser.close(); } catch (e) {}
    cleanup();
}
process.exit(fail ? 1 : 0);
