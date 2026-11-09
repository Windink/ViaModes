// 播放态模糊层真机帧率探针驱动（MuMu 模拟器 + Via）
//   node scripts/mumu-perf-play.mjs
// 前置：MuMu 已启动、Via 已安装脚本、adb 可连；本地服务由脚本自行拉起。
//
// 为什么必须有这一份：桌面 headless 走 SwiftShader 软件合成，两轮测出的
// backdrop-filter 相对开销能从 +67% 漂到 +12%，给不了结论。真机 WebView 110
// 是 60Hz vsync 的真实合成环境，模糊层若造成掉帧会直接体现为 16.7 → 33ms。
// 优化前基线（v0.1.59，默认带毛玻璃）：菜单展开 avg 22.34ms / P95 41.66ms /
// 长帧率 29.87%，关掉模糊后 16.7ms / 16.67ms / 0.21%。
// 现在产品默认低特效，探针用 glass 场景强制加回毛玻璃复现代价，
// lowfx 场景验证默认设置确实把帧率拉回来了。
//
// 环境变量：ADB、SERIAL（默认 127.0.0.1:16384）、PORT（默认 8099）
import { execFileSync, spawn } from 'node:child_process';
import { readFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';

const ADB = process.env.ADB || 'E:/android-tools/platform-tools/adb.exe';
const SERIAL = process.env.SERIAL || '127.0.0.1:16384';
const PORT = Number(process.env.PORT || 8099);
const BASE = `http://127.0.0.1:${PORT}`;
const ROOT = process.cwd();
const REPORT = join(ROOT, '.tmp/report.log');

let server = null;
function sh(args) {
    try {
        return execFileSync(ADB, ['-s', SERIAL, ...args], {
            encoding: 'utf8', maxBuffer: 32 * 1024 * 1024, timeout: 30000
        });
    } catch (e) { return (e.stdout || '') + (e.stderr || ''); }
}
async function ensureServer() {
    try { if ((await fetch(BASE + '/e2e/index.html')).ok) return '复用已运行的本地服务'; } catch (e) {}
    server = spawn(process.execPath, ['scripts/serve.mjs'], {
        cwd: ROOT, env: { ...process.env, PORT: String(PORT) }, stdio: 'ignore'
    });
    for (let i = 0; i < 60; i++) {
        try { if ((await fetch(BASE + '/e2e/index.html')).ok) return '本次启动本地服务'; } catch (e) {}
        await sleep(150);
    }
    throw new Error('本地服务没起来，检查 PORT 是否被占用');
}
function readRows() {
    let txt = '';
    try { txt = readFileSync(REPORT, 'utf8'); } catch (e) { return []; }
    return txt.trim().split('\n').filter(Boolean).map((l) => {
        try { return JSON.parse(l); } catch (e) { return null; }
    }).filter(Boolean);
}
function median(list) {
    const a = list.filter((x) => Number.isFinite(x)).slice().sort((x, y) => x - y);
    if (!a.length) return 0;
    return a.length % 2 ? a[(a.length - 1) / 2] : (a[a.length / 2 - 1] + a[a.length / 2]) / 2;
}

let rows = [];
try {
    mkdirSync(join(ROOT, '.tmp'), { recursive: true });
    console.log(await ensureServer());

    // adb daemon 在独立进程里会被回收，连接与端口映射必须在本进程内做完
    const conn = execFileSync(ADB, ['connect', SERIAL], { encoding: 'utf8', timeout: 30000 });
    console.log('adb: ' + conn.trim().split('\n').pop());
    if (sh(['shell', 'getprop sys.boot_completed']).trim() !== '1') throw new Error('模拟器还没启动完');
    if (!/package:/.test(sh(['shell', 'pm path mark.via']))) throw new Error('设备里没装 Via');
    sh(['reverse', `tcp:${PORT}`, `tcp:${PORT}`]);

    await fetch(BASE + '/__report/clear');
    const distVer = (readFileSync(join(ROOT, 'dist/via-video-player.user.js'), 'utf8')
        .match(/@version\s+([\d.]+)/) || [])[1] || '';
    const pageTag = 'r' + Date.now();
    // 每轮换一个别名路径：Via 的缓存按 URL 路径命中
    const url = `${BASE}/e2e/perf-play-android-${pageTag}.html?vvdebug=1&expect=${distVer}`;
    console.log('期望脚本版本: v' + distVer + '  ·  本轮标识 ' + pageTag);
    sh(['shell', 'am force-stop mark.via']);
    await sleep(1000);
    sh(['shell', `am start -n mark.via/.Shell -a android.intent.action.VIEW -d '${url}'`]);
    console.log('打开页面: ' + url + '\n');

    let done = false;
    for (let i = 0; i < 300; i++) {
        await sleep(300);
        rows = readRows().filter((r) => r.run === pageTag);
        if (rows.some((r) => r.tag === 'done')) { done = true; break; }
    }

    const env = rows.find((r) => r.tag === 'env') || {};
    console.log('环境：Via 脚本 v' + (env.version || '?') + ' · 视口 ' +
        (env.vw || '?') + '×' + (env.vh || '?') + ' · dpr ' + (env.dpr || '?'));

    const scenes = rows.filter((r) => r.tag === 'scene');
    const byMode = { base: [], glass: [], lowfx: [] };
    for (const s of scenes) if (byMode[s.mode]) byMode[s.mode].push(s);
    console.log('\n=== 各轮原始 ===');
    for (const s of scenes) {
        const p = s.pre || {};
        console.log(('第' + (s.round + 1) + '轮 ' + s.mode).padEnd(14) +
            String(s.frames).padStart(5) + ' 帧  avg ' + String(s.avgGap).padStart(6) + 'ms' +
            '  P95 ' + String(s.p95Gap).padStart(6) + 'ms  长帧率 ' + String(s.slowRate).padStart(5) + '%' +
            '  [' + (p.items || 0) + ' 项 / ' + (p.sheetH || 0) + 'px / blur=' + (p.blur || p.webkitBlur || '-') +
            ' / 播放=' + p.playing + ']');
    }

    const agg = {};
    for (const k of Object.keys(byMode)) {
        const rs = byMode[k];
        const m = (key, d) => +median(rs.map((r) => r[key])).toFixed(d);
        agg[k] = { frames: Math.round(median(rs.map((r) => r.frames))),
            avgGap: m('avgGap', 2), p95Gap: m('p95Gap', 2), slowRate: m('slowRate', 2) };
    }
    const pad = (s, n) => String(s).padStart(n);
    console.log('\n指标（各轮中位数）' + pad('base', 12) + pad('glass', 12) + pad('lowfx', 12));
    console.log('-'.repeat(56));
    const line = (label, key, unit) => console.log(
        label.padEnd(20) + pad(agg.base[key] + unit, 12) + pad(agg.glass[key] + unit, 12) + pad(agg.lowfx[key] + unit, 12));
    line('采样帧', 'frames', '');
    line('平均帧间隔', 'avgGap', 'ms');
    line('P95 帧间隔', 'p95Gap', 'ms');
    line('长帧率(>25ms)', 'slowRate', '%');
    console.log('-'.repeat(56));

    const rel = (a, b) => b ? +((a - b) / b * 100).toFixed(0) : 0;
    const rAvg = rel(agg.glass.avgGap, agg.lowfx.avgGap);
    const rP95 = rel(agg.glass.p95Gap, agg.lowfx.p95Gap);
    const dSlow = +(agg.glass.slowRate - agg.lowfx.slowRate).toFixed(2);
    console.log('\n毛玻璃净代价（glass − lowfx）：平均帧间隔 ' + (rAvg >= 0 ? '+' : '') + rAvg + '%' +
        ' · P95 ' + (rP95 >= 0 ? '+' : '') + rP95 + '%' +
        ' · 长帧率 ' + (dSlow >= 0 ? '+' : '') + dSlow + 'pp');

    // 真机是 60Hz，判据看「是否真的多跳帧」而不只是毫秒差
    const blurSeen = scenes.some((s) => s.mode === 'glass' &&
        /blur/.test((s.pre && (s.pre.blur || s.pre.webkitBlur)) || ''));
    console.log('glass 场景是否真的渲染了模糊：' + (blurSeen ? '是' : '否（该环境可能不支持 backdrop-filter）'));
    const lowFxOk = agg.lowfx.avgGap <= agg.glass.avgGap;
    console.log(lowFxOk
        ? '默认低特效生效：lowfx 帧间隔不高于强制毛玻璃。'
        : '!! 默认低特效未生效：lowfx 反而更慢，检查 .vv-lowfx 是否挂上。');
    const isMain = blurSeen && (dSlow >= 3 || rAvg >= 15 || rP95 >= 25);
    console.log(isMain
        ? '结论：毛玻璃造成可测掉帧，默认低特效的方向正确。'
        : '结论：本轮未测出明显掉帧，需复查探针或设备状态。');

    // 测量有效性（不设性能阈值断言，但采样本身必须可信）
    const bad = scenes.filter((s) => s.frames < 60 || !(s.pre && s.pre.playing) ||
        (s.mode !== 'base' && !(s.pre && s.pre.menuOpen && s.pre.items > 0)) ||
        (s.mode === 'glass' && !/blur/.test((s.pre && (s.pre.blur || s.pre.webkitBlur)) || '')) ||
        (s.mode === 'lowfx' && !/none/.test((s.pre && (s.pre.blur || s.pre.webkitBlur)) || '')));
    if (!done || scenes.length < 6 || bad.length) {
        console.log('\n!! 测量不完整：done=' + done + ' 场景数=' + scenes.length + ' 异常行=' + bad.length);
        for (const b of bad.slice(0, 4)) console.log('   ' + JSON.stringify(b.pre || {}) + ' frames=' + b.frames);
        process.exitCode = 1;
    }
} catch (e) {
    console.error('真机帧率探针失败: ' + (e && e.message));
    process.exit(1);
} finally {
    if (server) server.kill();
}
