// 真实网站测试：把构建好的用户脚本注入真实网页，验证嗅探 + 播放 + 加载进度。
// 用法：node scripts/real-site-test.mjs [url]
// 默认用 MDN 的 <video> 元素示例页（直链 mp4，页面自带 video 标签）。
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { setTimeout as sleep } from 'node:timers/promises';

const WS = 'C:/Users/Administrator/.workbuddy/binaries/node/workspace/index.js';
let puppeteer;
try {
    puppeteer = createRequire(import.meta.url)('puppeteer-core');
} catch (e) {
    puppeteer = createRequire(WS)('puppeteer-core');
}

const PORT = Number(process.env.PORT || 8098);
const BASE = `http://127.0.0.1:${PORT}`;
const BROWSERS = [
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
];

const SITES = [
    // 某视频站点（ch）点播页：国内正规平台，真实多码率 HLS（main.m3u8 内含 2000/1200/450 三档），
    // 页面用 MSE + blob: 播放，是 Via 上最典型的场景，也能验画质切换。
    { name: '某视频站点 · 视频点播（多码率 HLS）', url: 'https://video.example.com/2020/05/28/VIDE30h8zPNlq5WoButIy45J200528.shtml' },
    // 某新闻网：主流新闻门户，页面直接带 <video>
    { name: '某新闻网 · 首页视频', url: 'https://news.example.org/' },
    // 某媒体网站视频频道
    { name: '某媒体网站 · 视频频道', url: 'http://media.example.org/' }
];

const site = process.argv[2] ? { name: process.argv[2], url: process.argv[2] } : SITES[0];

function proxyArgs() {
    // 本机有全局代理（127.0.0.1:58426），媒体 CDN 走代理会 ERR_TUNNEL_CONNECTION_FAILED，
    // 所以真实站点测试默认绕过代理；需要时用 USE_PROXY=1 打开。
    if (process.env.USE_PROXY === '1') {
        const p = process.env.HTTPS_PROXY || process.env.https_proxy || process.env.HTTP_PROXY || process.env.http_proxy;
        return p ? ['--proxy-server=' + p, '--proxy-bypass-list=127.0.0.1;localhost'] : [];
    }
    return ['--no-proxy-server'];
}

const server = spawn(process.execPath, ['scripts/serve.mjs'], {
    cwd: process.cwd(), env: { ...process.env, PORT: String(PORT) }, stdio: ['ignore', 'pipe', 'pipe']
});
server.stdout.on('data', () => {});

const scriptSrc = await readFile('dist/via-video-player.user.js', 'utf8');

const browser = await puppeteer.launch({
    executablePath: existsSync(BROWSERS[0]) ? BROWSERS[0] : BROWSERS[1],
    headless: 'new',
    args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required', '--mute-audio',
        '--disable-dev-shm-usage', '--window-size=412,892'].concat(proxyArgs()),
    defaultViewport: { width: 412, height: 892 }
});

let code = 0;
try {
    for (let i = 0; i < 60; i++) {
        try { if ((await fetch(BASE + '/e2e/index.html')).ok) break; } catch (e) {}
        await sleep(150);
    }

    console.log('目标站点：' + site.name);
    console.log('URL    ：' + site.url);
    console.log('');

    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e && e.message || e)));
    page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

    // 注入：油猴脚本要在 document-start 跑，这里用 addInitScript 抢在页面脚本前
    await page.evaluateOnNewDocument(scriptSrc);
    await page.goto(site.url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    console.log('✓ 页面已加载：' + page.url());

    // 等脚本初始化
    await page.waitForFunction(() => !!(window.VV && window.VV.items !== undefined),
        { timeout: 20000 }).catch(() => {});
    const hasVV = await page.evaluate(() => !!(window.VV && window.VV.items));
    console.log('✓ 脚本已注入（window.VV ' + (hasVV ? '存在' : '未挂载，走的是 IIFE 隔离') + '）');

    // 脚本包在 IIFE 里，调试句柄只在 ?vvdebug=1 时挂 window.__vv。
    // 真实站点 URL 不方便加参数，这里直接用 DOM 观察加载进度 UI。
    await sleep(4000);

    const sniffed = await page.evaluate(() => {
        // 角标上的计数是嗅探结果数
        const badge = document.querySelector('.vv-badge');
        return {
            badgeText: badge ? badge.textContent.trim() : '',
            badgeShown: badge ? getComputedStyle(badge).opacity !== '0' : false
        };
    });
    console.log('✓ 嗅探角标：' + (sniffed.badgeText ? '计数 ' + sniffed.badgeText : '未出现'));
    if (!sniffed.badgeText) console.log('  （该站可能没有 <video>/媒体请求被钩到）');

    // 打开嗅探面板看抓到了什么
    const panel = await page.evaluate(() => {
        const badge = document.querySelector('.vv-badge');
        if (!badge) return { opened: false };
        badge.click();
        return new Promise((res) => setTimeout(() => {
            const wrap = document.getElementById('vv-panel-wrap');
            const rows = wrap ? wrap.querySelectorAll('.vv-row') : [];
            const items = [];
            rows.forEach((r) => {
                const t = r.querySelector('.vv-tag');
                const a = r.querySelector('a');
                items.push({
                    type: t ? t.textContent.trim() : '?',
                    url: r.getAttribute('data-url') || (a ? (a.getAttribute('href') || '') : '')
                });
            });
            res({
                opened: !!(wrap && wrap.classList.contains('open')),
                count: items.length,
                items
            });
        }, 600));
    });
    console.log('✓ 嗅探到 ' + panel.count + ' 条资源：');
    (panel.items || []).slice(0, 6).forEach((it) => console.log('    [' + it.type + '] ' + it.url));

    // 关闭面板，播放第一条
    await page.evaluate(() => {
        const wrap = document.getElementById('vv-panel-wrap');
        if (wrap) wrap.classList.remove('open');
    });

    // 播放：默认按类型挑（mp4 > m3u8 > 其它），也可用 PICK=<序号> 指定
    const PICK = process.env.PICK || '';
    const played = await page.evaluate(async (pick) => {
        // 关键：加载进度只在"起播瞬间"出现几秒，必须从点播放按钮那一刻就开始采样，
        // 否则等 clicked 之后再轮询就已经错过全过程了。
        const samples = [];
        const t0 = performance.now();
        const tick = () => {
            const ld = document.querySelector('.vv-loading');
            const num = ld ? ld.querySelector('.vv-lr-num') : null;
            const det = ld ? ld.querySelector('.vv-load-detail') : null;
            const bar = document.querySelector('.vv-loadbar');
            const fill = bar ? bar.querySelector('.vv-loadbar-fill') : null;
            const fg = ld ? ld.querySelector('.vv-lr-fg') : null;
            const v = document.querySelector('.vv-player-video');
            samples.push({
                ms: Math.round(performance.now() - t0),
                on: ld ? ld.classList.contains('on') : false,
                indet: ld ? ld.classList.contains('indet') : false,
                num: num ? num.textContent.trim() : '',
                detail: det ? det.textContent.trim() : '',
                barOn: bar ? bar.classList.contains('on') : false,
                barW: fill ? fill.style.width : '',
                off: fg ? fg.style.strokeDashoffset : '',
                rs: v ? v.readyState : -1,
                t: v ? +(v.currentTime || 0).toFixed(2) : 0
            });
        };
        const timer = setInterval(tick, 120);
        tick();

        const badge = document.querySelector('.vv-badge');
        if (badge) badge.click();
        await new Promise((r) => setTimeout(r, 400));
        const wrap = document.getElementById('vv-panel-wrap');
        const rows = wrap ? wrap.querySelectorAll('.vv-row') : [];
        if (!rows.length) { clearInterval(timer); return { started: false, samples }; }
        let pickIdx = -1, pickType = '';
        if (pick !== '' && /^\d+$/.test(pick)) {
            pickIdx = Math.min(rows.length - 1, parseInt(pick, 10));
            pickType = (rows[pickIdx].getAttribute('data-type') || '');
        } else {
            rows.forEach((r, i) => {
                const ty = (r.getAttribute('data-type') || '').toLowerCase();
                if (ty === 'mp4' && pickType !== 'mp4') { pickIdx = i; pickType = ty; }
                else if (pickIdx < 0 && (ty === 'm3u8' || ty === 'hls')) { pickIdx = i; pickType = ty; }
                else if (pickIdx < 0) { pickIdx = i; pickType = ty; }
            });
        }
        const row = rows[pickIdx];
        const btns = row.querySelectorAll('button');
        let playBtn = null;
        btns.forEach((b) => { if (!playBtn && /▶|播放/.test(b.textContent + b.title)) playBtn = b; });
        if (!playBtn) playBtn = btns[btns.length - 1];
        if (playBtn) playBtn.click();

        // 起播观察窗口：12 秒（覆盖首屏缓冲 + 首次缓冲到位）
        await new Promise((r) => setTimeout(r, 12000));
        clearInterval(timer);

        const root = document.querySelector('.vv-player-root');
        const v = document.querySelector('.vv-player-video');
        return {
            started: !!root,
            pickedType: pickType,
            pickedUrl: (row.getAttribute('data-url') || '').slice(0, 110),
            hasVideo: !!v,
            src: v ? (v.currentSrc || v.src || '').slice(0, 110) : '',
            readyState: v ? v.readyState : -1,
            samples
        };
    }, PICK);
    console.log('✓ 播放器已打开：' + played.started + '  选中类型：' + played.pickedType);
    console.log('  嗅探到的 URL：' + played.pickedUrl);
    console.log('  实际播放源  ：' + (played.src || '(m3u8)') + '  readyState=' + played.readyState);

    const samples = played.samples || [];

    // 汇总
    const withPct = samples.filter((s) => /^\d+%$/.test(s.num));
    const withDetail = samples.filter((s) => s.detail);
    const barSeen = samples.filter((s) => s.barOn);
    const indetSeen = samples.filter((s) => s.indet);
    const spinnerSeen = samples.filter((s) => s.on);

    console.log('');
    console.log('—— 起播阶段加载进度时间线（' + samples.length + ' 次采样 / 12s）——');
    // 只打印"有变化"的几个关键时刻，避免刷屏
    let lastKey = '';
    samples.forEach((s) => {
        const key = s.on + '|' + s.indet + '|' + s.num + '|' + s.detail + '|' + s.barW + '|' + s.rs;
        if (key === lastKey) return;
        lastKey = key;
        const flag = s.on ? (s.indet ? '不确定' : '确定') : '隐藏';
        console.log('  ' + String(s.ms).padStart(5) + 'ms  遮罩:' + flag
            + '  ' + (s.num || '--').padStart(4)
            + '  条:' + (s.barOn ? (s.barW || 'indet') : 'off')
            + '  rs=' + s.rs + ' t=' + s.t
            + (s.detail ? '  「' + s.detail + '」' : ''));
    });

    console.log('');
    console.log('—— 加载进度统计 ——');
    console.log('  出现加载遮罩     ：' + (spinnerSeen.length ? spinnerSeen.length + ' 次' : '未出现'));
    console.log('  出现百分比       ：' + (withPct.length ? withPct.length + ' 次，样例 ' + withPct.map((x) => x.num).filter((v, i, a) => a.indexOf(v) === i).slice(0, 8).join(' / ') : '未出现'));
    console.log('  出现不确定态     ：' + (indetSeen.length ? indetSeen.length + ' 次' : '未出现'));
    console.log('  顶部细条显示     ：' + (barSeen.length ? barSeen.length + ' 次，宽度样例 ' + barSeen.map((x) => x.barW).filter((v, i, a) => v && a.indexOf(v) === i).slice(0, 6).join(' / ') : '未出现'));
    console.log('  明细行内容       ：' + (withDetail.length ? [...new Set(withDetail.map((x) => x.detail))].slice(0, 4).join(' | ') : '未出现'));

    // 加载态截图：暂停后派发真实的 waiting 事件，走上真实的"缓冲中"路径
    await page.evaluate(async () => {
        const v = document.querySelector('.vv-player-video');
        try { v.pause(); } catch (e) {}
        if (v) v.dispatchEvent(new Event('waiting'));
        await new Promise((r2) => setTimeout(r2, 800));
    });
    await page.screenshot({ path: 'e2e/real-site-load.png' });
    console.log('');
    console.log('screenshot -> e2e/real-site-load.png');
    // 恢复播放，后面的验收（seek/倍速）都在真实播放态下做
    await page.evaluate(() => {
        const v = document.querySelector('.vv-player-video');
        if (v) { try { v.play(); } catch (e) {} }
    });
    await sleep(600);

    const finalState = await page.evaluate(() => {
        const v = document.querySelector('.vv-player-video');
        const ld = document.querySelector('.vv-loading');
        return {
            rs: v ? v.readyState : -1,
            paused: v ? v.paused : null,
            t: v ? v.currentTime : null,
            dur: v ? v.duration : null,
            loadingOn: ld ? ld.classList.contains('on') : null,
            num: ld ? (ld.querySelector('.vv-lr-num') || {}).textContent : ''
        };
    });
    console.log('最终状态：readyState=' + finalState.rs + ' paused=' + finalState.paused
        + ' t=' + (finalState.t ? finalState.t.toFixed(1) : '?') + '/' + (finalState.dur ? finalState.dur.toFixed(1) : '?')
        + ' 加载遮罩=' + (finalState.loadingOn ? '显示' : '已隐藏'));

    // 播放界面截图：必须在 seek 之前拍。seek 后 hls.js 正在换分片，
    // 这时画面可能是未解码完的绿块（真实观感），会让人误判播放器坏了。
    await page.evaluate(async () => {
        const root = document.querySelector('.vv-player-root');
        if (!root) return;
        const r = root.getBoundingClientRect();
        const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        const mk = (type) => {
            const t = new Touch({ identifier: 1, target: root, clientX: cx, clientY: cy });
            return new TouchEvent(type, {
                bubbles: true, cancelable: true,
                touches: type === 'touchend' ? [] : [t], changedTouches: [t]
            });
        };
        if (!root.classList.contains('cs-on')) {
            root.dispatchEvent(mk('touchstart'));
            await new Promise((r2) => setTimeout(r2, 60));
            root.dispatchEvent(mk('touchend'));
        }
        await new Promise((r2) => setTimeout(r2, 700));
    });
    await page.screenshot({ path: 'e2e/real-site-play.png' });
    console.log('screenshot -> e2e/real-site-play.png');

    // ==================== 真实站点功能验收 ====================
    console.log('');
    console.log('—— 真实站点功能验收 ——');

    // 1) seek：直接把进度条拖到 30%
    const seekRes = await page.evaluate(async () => {
        const v = document.querySelector('.vv-player-video');
        const dur = v ? v.duration : 0;
        if (!dur || !isFinite(dur)) return { skip: true };
        const target = dur * 0.3;
        v.currentTime = target;
        await new Promise((r) => setTimeout(r, 2500));
        return { target: +target.toFixed(1), got: +(v.currentTime || 0).toFixed(1), rs: v.readyState, dur: +dur.toFixed(1) };
    });
    if (seekRes.skip) console.log('  seek            ：跳过（时长未就绪）');
    else console.log('  seek 到 30%     ：' + (Math.abs(seekRes.got - seekRes.target) < 6 ? '成功' : '偏差较大')
        + '  目标 ' + seekRes.target + 's → 实际 ' + seekRes.got + 's（片长 ' + seekRes.dur + 's，rs=' + seekRes.rs + '）');

    // 2) 唤出控制栏（真实单击）后看倍速 chip 与菜单
    const speedRes = await page.evaluate(async () => {
        const root = document.querySelector('.vv-player-root');
        if (!root) return { skip: true };
        const r = root.getBoundingClientRect();
        const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        const mk = (type) => {
            const t = new Touch({ identifier: 1, target: root, clientX: cx, clientY: cy });
            return new TouchEvent(type, {
                bubbles: true, cancelable: true,
                touches: type === 'touchend' ? [] : [t],
                changedTouches: [t]
            });
        };
        root.dispatchEvent(mk('touchstart'));
        await new Promise((r2) => setTimeout(r2, 60));
        root.dispatchEvent(mk('touchend'));
        await new Promise((r2) => setTimeout(r2, 400));
        const csOn = root.classList.contains('cs-on');
        const chip = document.getElementById('vv-speed-chip');
        if (!chip) return { csOn, skip: true };
        chip.click();
        await new Promise((r2) => setTimeout(r2, 250));
        const sheet = document.getElementById('vv-sheet');
        const rows = sheet ? sheet.querySelectorAll('.vv-sheet-item') : [];
        const labels = [];
        for (let i = 0; i < rows.length; i++) labels.push(rows[i].textContent.trim());
        let picked = '';
        for (let i = 0; i < rows.length; i++) {
            if (/2x/.test(rows[i].textContent)) { rows[i].click(); picked = '2x'; break; }
        }
        await new Promise((r2) => setTimeout(r2, 400));
        const v = document.querySelector('.vv-player-video');
        const rate = v ? v.playbackRate : -1;
        // 恢复 1x，避免影响后续
        if (v) v.playbackRate = 1;
        return { csOn, labels, picked, rate, chipText: chip.textContent.trim() };
    });
    if (speedRes.skip) console.log('  倍速            ：跳过（控制栏或 chip 不可用，csOn=' + speedRes.csOn + '）');
    else {
        console.log('  单击唤出控制栏  ：' + (speedRes.csOn ? '成功' : '失败'));
        console.log('  倍速菜单        ：' + speedRes.labels.length + ' 档 → ' + speedRes.labels.join(' '));
        console.log('  选 2x 生效      ：' + (speedRes.rate === 2 ? '成功' : '失败 rate=' + speedRes.rate));
    }

    // 3) 画质档位（多码率 HLS 才有）
    const qRes = await page.evaluate(async () => {
        const root = document.querySelector('.vv-player-root');
        if (!root) return { skip: true };
        const btns = root.querySelectorAll('.vv-cs-bottom .vv-csbtn');
        const moreBtn = root.querySelector('.vv-cs-bottom [data-act="more"]');
        if (!moreBtn) return { skip: true, reason: '没有更多按钮' };
        moreBtn.click();
        await new Promise((r2) => setTimeout(r2, 300));
        const sheet = document.getElementById('vv-sheet');
        let rows = sheet ? sheet.querySelectorAll('.vv-sheet-item') : [];
        let qIdx = -1, qText = '';
        for (let i = 0; i < rows.length; i++) if (/画质/.test(rows[i].textContent)) { qIdx = i; qText = rows[i].textContent.trim(); break; }
        if (qIdx < 0) return { skip: true, reason: '菜单里没有画质项' };
        rows[qIdx].click();
        await new Promise((r2) => setTimeout(r2, 350));
        rows = sheet ? sheet.querySelectorAll('.vv-sheet-item') : [];
        const labels = [];
        for (let i = 0; i < rows.length; i++) labels.push(rows[i].textContent.trim());
        return { skip: false, menuLabel: qText, labels };
    });
    if (qRes.skip) console.log('  画质切换        ：跳过（' + (qRes.reason || '') + '）');
    else {
        console.log('  更多菜单画质项  ：「' + qRes.menuLabel + '」');
        console.log('  可选画质档位    ：' + qRes.labels.length + ' 档 → ' + qRes.labels.join(' '));
    }

    // 4) 关闭 → 重开：进度记忆
    const memo = await page.evaluate(async () => {
        const v = document.querySelector('.vv-player-video');
        const before = v ? v.currentTime : 0;
        const root = document.querySelector('.vv-player-root');
        // 先收起菜单
        const sheet = document.getElementById('vv-sheet');
        if (sheet) sheet.classList.remove('open');
        // 点左上角返回键关闭
        const top = root ? root.querySelectorAll('.vv-cs-top .vv-csbtn') : [];
        let closeBtn = null;
        for (const b of top) if (/←|返回|关闭|✕|×/.test(b.textContent + b.title)) closeBtn = b;
        if (!closeBtn && top.length) closeBtn = top[0];
        if (closeBtn) closeBtn.click();
        await new Promise((r2) => setTimeout(r2, 900));
        const closedOk = !document.querySelector('.vv-player-root');
        // 读本地进度表，看究竟存了什么 key
        let savedKeys = [];
        try {
            const raw = localStorage.getItem('via.vp.progress');
            if (raw) savedKeys = Object.keys(JSON.parse(raw)).slice(-4);
        } catch (e) {}
        // 重新打开同一条
        const badge = document.querySelector('.vv-badge');
        if (badge) badge.click();
        await new Promise((r2) => setTimeout(r2, 600));
        const wrap = document.getElementById('vv-panel-wrap');
        const rows = wrap ? wrap.querySelectorAll('.vv-row') : [];
        let playBtn = null;
        let openedUrl = '';
        if (rows.length) {
            const btns = rows[0].querySelectorAll('button');
            btns.forEach((b) => { if (!playBtn && /▶|播放/.test(b.textContent + b.title)) playBtn = b; });
            if (!playBtn) playBtn = btns[btns.length - 1];
            openedUrl = (rows[0].getAttribute('data-url') || '').slice(0, 120);
        }
        if (playBtn) playBtn.click();
        await new Promise((r2) => setTimeout(r2, 4000));
        const v2 = document.querySelector('.vv-player-video');
        return {
            before: +before.toFixed(1),
            closedOk,
            savedKeys,
            openedUrl,
            after: v2 ? +(v2.currentTime || 0).toFixed(1) : null,
            rs: v2 ? v2.readyState : -1
        };
    });
    const resumed = memo.after !== null && Math.abs(memo.after - memo.before) < 30 && memo.after > 5;
    console.log('  关闭播放器      ：' + (memo.closedOk ? '成功' : '失败'));
    console.log('  进度表已存 key  ：' + (memo.savedKeys.length ? memo.savedKeys.join(' | ') : '(空)'));
    console.log('  重开用的资源    ：' + (memo.openedUrl || '?'));
    console.log('  重开续播        ：' + (resumed ? '成功' : '未续播')
        + '  关闭前 ' + memo.before + 's → 重开后 ' + (memo.after === null ? '?' : memo.after + 's') + '（rs=' + memo.rs + '）');
    // 注：播放界面截图已在 seek 之前拍过（见上方），这里不再重复截。

    console.log('');
    console.log(errors.length ? '未捕获错误：\n  ' + errors.slice(0, 5).join('\n  ') : '✓ 无未捕获 JS 错误');
} catch (e) {
    console.log('测试异常: ' + (e && e.message || e));
    code = 1;
} finally {
    try { await browser.close(); } catch (e) {}
    try { server.kill(); } catch (e) {}
}
process.exit(code);
