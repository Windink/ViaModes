// 播放态性能基准：内置播放器打开后，量化大面积 backdrop-filter 的每帧重算代价。
//
// 为什么单独做一份：scripts/perf-heavy.mjs 只测「重站 + 嗅探」的稳态开销，
// 那份压测里根本没有打开内置播放器，测不到 .vv-sheet 的 blur(20px) 半屏浮层。
// 视频画面每帧都在变，模糊层要跟着每帧重采样，这个开销只在播放态出现。
//
// 三个场景只切换一个变量，且都保持控制栏可见（否则自动收起会引入第二个变量）：
//   base   播放器播放中，菜单收起 —— 参照系
//   lowfx  播放器 + 更多菜单展开，用产品默认（.vv-lowfx 已关掉大面积模糊）
//   glass  播放器 + 更多菜单展开，强制把 .vv-sheet 的 blur(20px) 加回来
// glass − lowfx 就是毛玻璃的净代价，同时能验证默认低特效确实把帧率拉回来了。
//
// 用法：node scripts/perf-playback.mjs
//   PORT=8097 RUN_MS=5000 ROUNDS=2 CPU=4 node scripts/perf-playback.mjs
// 两个必要的测量前提：
//   1) headless 的 rAF 默认被 60Hz 钉住，三场景都会是 17ms / 0 掉帧，什么都测不出来，
//      所以启动参数里解除帧率节流与 vsync，让帧间隔反映真实合成代价；
//   2) headless 没有真实显示，视频帧未必进合成树，模糊层下方若是一片静止像素就不会重算。
//      插入一个只做 transform 动画的底层渐变，强制每帧都有变化的像素供 blur 重采样。
// 不设性能阈值断言（不同机器/合成后端差异大），只校验测量本身有效：
// 视频确实在播、菜单确实展开、computed style 确实按预期、采样帧数够。
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises';

const WS = 'C:/Users/Administrator/.workbuddy/binaries/node/workspace/index.js';
let puppeteer;
try { puppeteer = createRequire(import.meta.url)('puppeteer-core'); }
catch (e) { puppeteer = createRequire(WS)('puppeteer-core'); }

const PORT = Number(process.env.PORT || 8097);
const BASE = `http://127.0.0.1:${PORT}`;
const RUN_MS = Number(process.env.RUN_MS || 5000);
const ROUNDS = Math.max(1, Number(process.env.ROUNDS || 2));
const CPU = Number(process.env.CPU || 4);
// 关掉它就能复现「原始测量」：所有场景都被 60Hz 钉成 17ms
const FREE_FPS = process.env.FREE_FPS !== '0';
const BROWSERS = [
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
];

function proxyArgs() {
    const p = process.env.HTTPS_PROXY || process.env.https_proxy || process.env.HTTP_PROXY || process.env.http_proxy;
    return p ? ['--proxy-server=' + p, '--proxy-bypass-list=127.0.0.1;localhost'] : [];
}

const server = spawn(process.execPath, ['scripts/serve.mjs'], {
    cwd: process.cwd(), stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, PORT: String(PORT) }
});
server.stdout.on('data', () => {});
server.stderr.on('data', () => {});

async function waitServer() {
    for (let i = 0; i < 60; i++) {
        try { if ((await fetch(BASE + '/e2e/bench.html')).ok) return true; } catch (e) {}
        await sleep(150);
    }
    return false;
}

function median(list) {
    const a = list.filter((x) => Number.isFinite(x)).slice().sort((x, y) => x - y);
    if (!a.length) return 0;
    return a.length % 2 ? a[(a.length - 1) / 2] : (a[a.length / 2 - 1] + a[a.length / 2]) / 2;
}

// 采样器必须早于播放器打开安装：rAF 链与 longtask 观测都要覆盖整个测量窗口。
async function installSampler(page) {
    await page.evaluate(() => {
        const pb = { gaps: [], last: 0, long: 0, longN: 0, maxLong: 0 };
        window.__pb = pb;
        try {
            new PerformanceObserver(function (list) {
                const es = list.getEntries();
                for (let i = 0; i < es.length; i++) {
                    if (es[i].duration < 50) continue;
                    pb.long += es[i].duration;
                    pb.longN++;
                    if (es[i].duration > pb.maxLong) pb.maxLong = es[i].duration;
                }
            }).observe({ entryTypes: ['longtask'] });
        } catch (e) {}

        function beat(t) {
            // 解除 vsync 后能跑到 1000+ fps，用时间窗截断而不是固定帧数上限，
            // 否则 gaps 数组写满就把窗口后段丢掉了。
            if (pb.last && t <= pb.until && pb.gaps.length < 20000) pb.gaps.push(+(t - pb.last).toFixed(2));
            pb.last = t;
            requestAnimationFrame(beat);
        }
        requestAnimationFrame(beat);

        window.__pbReset = function (windowMs) {
            pb.gaps.length = 0; pb.last = 0; pb.long = 0; pb.longN = 0; pb.maxLong = 0;
            pb.until = performance.now() + (windowMs || 5000);
        };
        window.__pbReport = function () {
            const g = pb.gaps.slice().sort((x, y) => x - y);
            let sum = 0, over8 = 0;
            // 解除 vsync 后基准帧间隔 <1ms，仍用 50ms 判掉帧会永远是 0；
            // 8ms 已相当于基准的十倍，用来数「异常长帧」才有分辨力。
            for (let i = 0; i < g.length; i++) { sum += g[i]; if (g[i] > 8) over8++; }
            let mem = 0;
            try { mem = performance.memory ? performance.memory.usedJSHeapSize : 0; } catch (e) {}
            return {
                frames: g.length,
                avgGap: g.length ? +(sum / g.length).toFixed(1) : 0,
                p95Gap: g.length ? g[Math.min(g.length - 1, Math.floor(g.length * 0.95))] : 0,
                slowRate: g.length ? +(over8 / g.length * 100).toFixed(2) : 0,
                long: Math.round(pb.long),
                longN: pb.longN,
                heapMB: mem ? +(mem / 1048576).toFixed(1) : 0
            };
        };
    });
}

// 在播放器里垫一层只走 transform 的动态像素：不动布局、不触发重绘，
// 但让 .vv-sheet 背后的画面每帧都在变，模糊层必须跟着重采样。
async function installMotion(page) {
    await page.evaluate(() => {
        if (document.getElementById('pb-motion-layer')) return;
        const st = document.createElement('style');
        st.id = 'pb-motion';
        st.textContent = '#pb-motion-layer{position:absolute;inset:0;z-index:2;pointer-events:none;overflow:hidden}' +
            '#pb-motion-layer::after{content:"";position:absolute;left:-15%;top:18%;width:55%;height:64%;' +
            'background:radial-gradient(circle,rgba(90,160,255,.55),transparent 70%);' +
            'animation:pbMove 1.1s linear infinite alternate}' +
            '@keyframes pbMove{from{transform:translateX(0)}to{transform:translateX(190%)}}';
        document.documentElement.appendChild(st);
        const root = document.getElementById('vv-player-root');
        if (root) {
            const d = document.createElement('div');
            d.id = 'pb-motion-layer';
            root.appendChild(d);
        }
    });
}

async function prepare(page, mode) {
    return page.evaluate((mode) => {
        // 产品默认已是低特效，所以改成「强制把毛玻璃加回来」这一种干预；
        // 顶栏小胶囊 (blur 8px) 三个场景都留着，免得把「关掉所有模糊」误当成结论。
        let st = document.getElementById('pb-glass');
        if (mode === 'glass') {
            if (!st) {
                st = document.createElement('style');
                st.id = 'pb-glass';
                // 产品规则是 .vv-player-root.vv-lowfx .vv-sheet + !important，
                // 这里必须重复一个 class 把优先级顶上去，否则强制毛玻璃根本没生效。
                st.textContent = '.vv-player-root.vv-lowfx .vv-sheet.vv-sheet{' +
                    'backdrop-filter:blur(20px)!important;' +
                    '-webkit-backdrop-filter:blur(20px)!important}';
                document.documentElement.appendChild(st);
            }
        } else if (st) st.parentNode.removeChild(st);

        const sheet = document.getElementById('vv-sheet');
        if (mode === 'base') {
            if (sheet) { sheet.classList.remove('open'); sheet.innerHTML = ''; }
        } else {
            const btn = document.querySelector('.vv-player-root [data-act="more"]');
            if (sheet && !sheet.classList.contains('open') && btn) btn.click();
        }

        // 控制栏 3s 会自动收起；三个场景都钉住 cs-on，保证变量只剩「菜单 + 模糊」。
        if (!window.__pbKeepCs) {
            window.__pbKeepCs = setInterval(function () {
                const r = document.getElementById('vv-player-root');
                if (r) r.classList.add('cs-on');
            }, 800);
        }

        const s = document.getElementById('vv-sheet');
        const cs = s ? getComputedStyle(s) : null;
        const v = document.querySelector('.vv-player-video');
        return {
            menuOpen: !!(s && s.classList.contains('open')),
            items: s ? s.querySelectorAll('.vv-sheet-item').length : 0,
            blur: cs ? (cs.backdropFilter || cs.webkitBackdropFilter || '') : '',
            sheetH: s ? Math.round(s.getBoundingClientRect().height) : 0,
            playing: !!(v && !v.paused && v.readyState >= 2),
            t: v ? +v.currentTime.toFixed(2) : -1
        };
    }, mode);
}

let browser;
let bad = 0;
try {
    if (!await waitServer()) throw new Error('本地服务器未启动');
    browser = await puppeteer.launch({
        executablePath: existsSync(BROWSERS[0]) ? BROWSERS[0] : BROWSERS[1],
        headless: 'new',
        args: ['--no-sandbox', '--mute-audio', '--window-size=420,900',
            '--autoplay-policy=no-user-gesture-required', '--disable-dev-shm-usage',
            '--enable-unsafe-swiftshader', '--js-flags=--expose-gc']
            .concat(FREE_FPS ? ['--disable-frame-rate-limit', '--disable-gpu-vsync'] : [])
            .concat(proxyArgs()),
        defaultViewport: { width: 420, height: 900, deviceScaleFactor: 1 }
    });

    const page = await browser.newPage();
    page.on('pageerror', () => {});
    const cdp = await page.target().createCDPSession();
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU });

    await page.goto(BASE + '/e2e/bench.html?vvdebug=1', { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForFunction(() => !!(window.__vv && window.__vv.VV), { timeout: 15000 });
    await installSampler(page);

    await page.waitForFunction(() => window.__vv.VV.items.some((i) => i.type === 'MP4'), { timeout: 15000 })
        .catch(() => {});
    await page.evaluate(() => {
        const it = window.__vv.VV.items.find((i) => i.type === 'MP4');
        if (it) window.__vv.open(it);
    });
    await page.waitForFunction(() => {
        const v = document.querySelector('.vv-player-video');
        return v && v.readyState >= 2 && !v.paused;
    }, { timeout: 20000 });
    // 样本只有 5.1s，不循环会播完触发连播退出，采样窗口里就没画面了
    await page.evaluate(() => {
        const v = document.querySelector('.vv-player-video');
        v.loop = true;
        v.currentTime = 0.5;
        v.play().catch(() => {});
    });
    await installMotion(page);
    await sleep(600);
    console.log('内置播放器已起播（本地 mp4 循环 + 动态底层像素），CPU 降速 ' + CPU + 'x，' +
        '帧率节流 ' + (FREE_FPS ? '已解除' : '保留 60Hz') + '，每场景 ' +
        (RUN_MS / 1000) + 's × ' + ROUNDS + ' 轮\n');

    const data = { base: [], glass: [], lowfx: [] };
    for (let round = 0; round < ROUNDS; round++) {
        // 轮换顺序，抵消「先跑的场景吃到冷缓存/预热」带来的系统性偏差
        const order = round % 2 === 0 ? ['base', 'glass', 'lowfx'] : ['lowfx', 'glass', 'base'];
        for (const mode of order) {
            const pre = await prepare(page, mode);
            const good = pre.playing && (mode === 'base' ? !pre.menuOpen :
                (pre.menuOpen && pre.items > 0 && pre.sheetH > 100)) &&
                (mode !== 'glass' || /blur/.test(pre.blur)) &&
                (mode !== 'lowfx' || /none/.test(pre.blur));
            if (!good) {
                bad++;
                console.log('  ✗ 场景 ' + mode + ' 状态异常：' + JSON.stringify(pre));
            } else {
                console.log('  · 第 ' + (round + 1) + ' 轮 ' + mode.padEnd(7) +
                    ' 菜单项 ' + pre.items + ' / 高 ' + pre.sheetH + 'px / blur=' + pre.blur);
            }
            await sleep(500); // 让展开动画与样式重算落地，别算进采样窗口
            await page.evaluate((ms) => window.__pbReset(ms), RUN_MS);
            await sleep(RUN_MS);
            const r = await page.evaluate(() => window.__pbReport());
            data[mode].push(r);
            if (r.frames < 30) { bad++; console.log('  ✗ 场景 ' + mode + ' 采样帧数不足：' + r.frames); }
        }
    }

    const agg = {};
    for (const k of Object.keys(data)) {
        const rows = data[k];
        const m = (key, digits) => +median(rows.map((r) => r[key])).toFixed(digits);
        agg[k] = {
            frames: Math.round(median(rows.map((r) => r.frames))),
            avgGap: m('avgGap', 1),
            p95Gap: m('p95Gap', 1),
            slowRate: m('slowRate', 2),
            long: Math.round(median(rows.map((r) => r.long))),
            heapMB: m('heapMB', 1)
        };
    }

    const pad = (s, n) => String(s).padStart(n);
    console.log('\n指标（各轮中位数）' + pad('base', 10) + pad('glass', 10) + pad('lowfx', 10));
    console.log('-'.repeat(52));
    const line = (label, key, unit) => console.log(
        label.padEnd(20) + pad(agg.base[key] + unit, 10) + pad(agg.glass[key] + unit, 10) + pad(agg.lowfx[key] + unit, 10));
    line('采样帧', 'frames', '');
    line('平均帧间隔', 'avgGap', 'ms');
    line('P95 帧间隔', 'p95Gap', 'ms');
    line('长帧率(>8ms)', 'slowRate', '%');
    line('长任务总时长', 'long', 'ms');
    line('JS 堆', 'heapMB', 'MB');
    console.log('-'.repeat(52));

    const rel = (a, b) => b ? +((a - b) / b * 100).toFixed(0) : 0;
    const rAvg = rel(agg.glass.avgGap, agg.lowfx.avgGap);
    const rP95 = rel(agg.glass.p95Gap, agg.lowfx.p95Gap);
    const dP95 = +(agg.glass.p95Gap - agg.lowfx.p95Gap).toFixed(1);
    const dLong = Math.round(agg.glass.long - agg.lowfx.long);
    console.log('\n毛玻璃净代价（glass − lowfx）：平均帧间隔 ' + (rAvg >= 0 ? '+' : '') + rAvg + '%' +
        ' · P95 ' + (dP95 >= 0 ? '+' : '') + dP95 + 'ms (' + (rP95 >= 0 ? '+' : '') + rP95 + '%)' +
        ' · 长任务 ' + (dLong >= 0 ? '+' : '') + dLong + 'ms');
    // 帧间隔是 1ms 量级，绝对阈值没有意义；用相对增幅，且两项指标要同向。
    const isMain = rAvg >= 25 && rP95 >= 25;
    console.log(isMain
        ? '结论：强制毛玻璃明显拖慢合成，默认低特效的方向是对的（真机定量见 mumu-perf-play）。'
        : '结论：桌面 headless 未测出稳定差异，以真机 mumu-perf-play 的结论为准。');
    console.log('注意：headless Chrome 走 SwiftShader 软件合成，与 Via WebView 110 的真实 GPU 行为不同；');
    console.log('      结论以「同环境同场景的相对差值」为准，不等于真机绝对帧率。');
    if (bad) { console.log('\n测量有效性问题 ' + bad + ' 处'); process.exitCode = 1; }
} catch (e) {
    console.error('PERF-PLAYBACK ERROR:', e && e.message);
    process.exitCode = 1;
} finally {
    try { if (browser) await browser.close(); } catch (e) {}
    try { server.kill(); } catch (e) {}
}
