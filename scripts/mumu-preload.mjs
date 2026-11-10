// 3 秒预载补扫开销 · 真机量化（MuMu 模拟器 + Via）
//   node scripts/mumu-preload.mjs
// 前置：MuMu 已启动、Via 已装脚本且版本 = dist 当前版本（不一致结论直接判无效）。
//
// 只出数、不改产品代码：页面里循环调 __vv.stopPagePreload()，量不同页面规模下的
// 稳态单次耗时（含「站点把 src 反复装回」的最坏情况），再用 rAF 交替 A/B 看
// 3 秒一跳会不会造成可观测掉帧。门槛写死在下面 VERDICT 段，跑完先给结论再看改不改。
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

// ---- 判定门槛：先写死，再看数（避免事后挑一个「刚好能过」的阈值）----
const FRAME_MS = 16.7;        // 60Hz 一帧
const HALF_FRAME_MS = 8;      // 半帧：单次补扫超过它就算有可观测的主线程占用
const DUTY_LIMIT = 0.005;     // 8ms / 3000ms ≈ 0.27%，放宽到 0.5%
const LONG_FRAME_MS = 25;     // 真机帧率探针统一的跳帧判据
const GUARD_PERIOD_MS = 3000;

let server = null;

function sh(args) {
    // daemon 会被回收：每次调用先重连；adbd 重启过则 reverse 要重建
    try {
        execFileSync(ADB, ['connect', SERIAL], { encoding: 'utf8', timeout: 30000 });
        return execFileSync(ADB, ['-s', SERIAL, ...args], {
            encoding: 'utf8', maxBuffer: 32 * 1024 * 1024, timeout: 30000
        });
    } catch (e) { return (e.stdout || '') + (e.stderr || ''); }
}
async function waitPort(url) {
    for (let i = 0; i < 80; i++) {
        try { if ((await fetch(url)).ok) return true; } catch (e) {}
        await sleep(150);
    }
    return false;
}
function readRows() {
    let txt = '';
    try { txt = readFileSync(REPORT, 'utf8'); } catch (e) { return []; }
    return txt.trim().split('\n').filter(Boolean).map((l) => {
        try { return JSON.parse(l); } catch (e) { return null; }
    }).filter(Boolean);
}
function median(a) {
    const b = a.slice().sort((x, y) => x - y);
    return b.length ? b[Math.floor(b.length / 2)] : 0;
}
const fmt = (x) => (typeof x === 'number' ? x.toFixed(3) : String(x));

try {
    mkdirSync(join(ROOT, '.tmp'), { recursive: true });
    if (await waitPort(BASE + '/e2e/index.html')) {
        console.log('复用已运行的本地服务');
    } else {
        server = spawn(process.execPath, ['scripts/serve.mjs'], {
            cwd: ROOT, env: { ...process.env, PORT: String(PORT) }, stdio: 'ignore'
        });
        if (!(await waitPort(BASE + '/e2e/index.html'))) throw new Error('本地服务没起来（检查 PORT）');
        console.log('本次启动本地服务');
    }

    const conn = execFileSync(ADB, ['connect', SERIAL], { encoding: 'utf8', timeout: 30000 });
    console.log('adb: ' + conn.trim().split('\n').pop());
    if (sh(['shell', 'getprop sys.boot_completed']).trim() !== '1') throw new Error('模拟器还没启动完');
    if (!/package:/.test(sh(['shell', 'pm path mark.via']))) throw new Error('设备里没装 Via');

    const distVer = (readFileSync(join(ROOT, 'dist/via-video-player.user.js'), 'utf8')
        .match(/@version\s+([\d.]+)/) || [])[1] || '';
    const pageTag = 'r' + Date.now();
    const url = `${BASE}/e2e/preload-android-${pageTag}.html?vvdebug=1&expect=${distVer}`;
    console.log('期望脚本版本 v' + distVer + '  ·  本轮标识 ' + pageTag);

    await fetch(BASE + '/__report/clear');
    sh(['shell', 'am force-stop mark.via']);
    // 换版时 adb root 会清掉 reverse，开页前再建一次并复核
    sh(['reverse', `tcp:${PORT}`, `tcp:${PORT}`]);
    console.log('reverse: ' + sh(['reverse', '--list']).trim().replace(/\s+/g, ' '));
    await sleep(1200);
    sh(['shell', `am start -n mark.via/.Shell -a android.intent.action.VIEW -d '${url}'`]);
    console.log('打开页面: ' + url + '\n');

    // 边跑边打：整套约 40 秒，静默等待会被误判成卡死
    let done = false, seenM = -1, seenR = -1;
    for (let i = 0; i < 200; i++) {
        await sleep(500);
        // 这台设备的 adb daemon 会随 adb 进程结束被回收，reverse 跟着清空：
        // 开完页再不碰 adb 的话，页面后续所有 fetch('/__report') 都会静默失败，
        // 上报里只剩开页那一刻的 boot，Via 甚至会被一起带回桌面。
        // 所以等待期间每 2 秒重建一次映射，顺便把 daemon 拽住。
        if (i % 4 === 0) sh(['reverse', `tcp:${PORT}`, `tcp:${PORT}`]);
        const cur = readRows().filter((r) => r.run === pageTag);
        if (cur.some((r) => r.tag === 'done')) { done = true; break; }
        const nm = cur.filter((r) => r.tag === 'measure').length;
        const nr = cur.filter((r) => r.tag === 'raf').length;
        if (nm !== seenM || nr !== seenR) {
            console.log(`  · 进度：规模测量 ${nm}/4，rAF 臂 ${nr}/4（${((i + 1) / 2).toFixed(0)}s）`);
            seenM = nm; seenR = nr;
        } else if ((i + 1) % 20 === 0) {
            console.log(`  … 等待中（${((i + 1) / 2).toFixed(0)}s，规模 ${nm}/4，rAF ${nr}/4）`);
        }
    }

    const rows = readRows().filter((r) => r.run === pageTag);
    const env = rows.find((r) => r.tag === 'env') || {};
    const oks = rows.filter((r) => r.tag === 'ok');
    const measures = rows.filter((r) => r.tag === 'measure');
    const rafs = rows.filter((r) => r.tag === 'raf');
    const fin = rows.find((r) => r.tag === 'done');

    console.log('\n=== 环境 ===');
    console.log('脚本版本: v' + (env.version || 'none') + '  ·  期望 v' + (env.expect || '?') +
        '  ·  视口 ' + (env.vw || '?') + '×' + (env.vh || '?') + ' dpr=' + (env.dpr || '?') +
        '  ·  计时精度 ' + fmt(env.res) + 'ms');

    console.log('\n=== 单次补扫主线程耗时（ms，热扫 = 50 次循环的均值 / 5 组中位）===');
    console.log('元素数   冷扫     常态热扫   最坏热扫   最坏P95   占空比');
    for (const m of measures) {
        const duty = (m.busyMed / GUARD_PERIOD_MS) * 100;
        console.log(String(m.n).padStart(5) + '   ' + fmt(m.cold).padStart(7) + '   ' +
            fmt(m.idleMed).padStart(8) + '   ' + fmt(m.busyMed).padStart(8) + '   ' +
            fmt(m.busyP95).padStart(7) + '   ' + duty.toFixed(3) + '%');
    }

    // 冷扫数值会随新增元素数涨到几十毫秒，但它不是 3 秒定时器的开销，得单说出来，
    // 否则读者会以为「量出了 44ms 还判不改」是漏看了。
    console.log('\n注：冷扫是「站点新建媒体被第一次按住」的一次性成本（含 vvDetachMedia → load()），');
    console.log('    随新增元素数线性增长，与 3 秒补扫周期无关；换成 MutationObserver 或拉长周期也省不掉。');
    console.log('    判定要不要动定时器，看的是常态/最坏热扫与 rAF 长帧增量。');

    console.log('\n=== rAF 长帧 A/B（每臂 7s，>' + LONG_FRAME_MS + 'ms 判跳帧）===');
    for (const r of rafs) {
        console.log('  第 ' + (r.pair + 1) + ' 对 · ' + String(r.phase).padEnd(3) +
            '  长帧 ' + String(r.long).padStart(3) + '/' + r.total +
            '  中位 ' + fmt(r.med) + 'ms  最大 ' + fmt(r.max) + 'ms');
    }
    const offs = rafs.filter((r) => r.phase === 'off');
    const ons = rafs.filter((r) => r.phase === 'on');
    const deltas = offs.map((o, i) => (ons[i] ? ons[i].long - o.long : null)).filter((x) => x !== null);
    const delta = deltas.length ? median(deltas) : null;

    // ---- 结论：拿最大规模的最坏热扫 + rAF 配对增量一起判 ----
    const worst = measures.length ? measures[measures.length - 1] : null;
    const busy = worst ? worst.busyMed : Infinity;
    const duty = busy / GUARD_PERIOD_MS;
    const coldMax = measures.length ? Math.max(...measures.map((m) => m.cold)) : 0;
    const coldNote = '（冷扫 ' + fmt(coldMax) + 'ms ≈ ' + (coldMax / FRAME_MS).toFixed(1) +
        ' 帧是站点批量建元素的一次性成本，不属于补扫周期）';
    let verdict;
    if (!worst) {
        verdict = '没拿到测量数据，本轮无效';
    } else if (busy >= HALF_FRAME_MS || duty >= DUTY_LIMIT || (delta !== null && delta > 1)) {
        verdict = '值得考虑优化：最大规模最坏热扫 ' + fmt(busy) + 'ms（' +
            (busy / FRAME_MS).toFixed(2) + ' 帧）、占空比 ' + (duty * 100).toFixed(3) +
            '%、长帧增量 ' + delta + '。优先把 vvPreHeldIndexOf 的线性查找换成元素标记 / WeakSet，' +
            '或缩小 querySelectorAll 的扫描范围，别直接加长补扫周期（会漏掉站点后建的预载）';
    } else {
        verdict = '不改：最大规模最坏热扫 ' + fmt(busy) + 'ms（不到半帧 ' + HALF_FRAME_MS +
            'ms）、3 秒周期占空比 ' + (duty * 100).toFixed(3) + '%、rAF 长帧增量 ' + delta +
            '。3 秒补扫在真机上量不出可观测代价，为它加复杂度不划算' + coldNote;
    }

    // ---- 断言：数据完整性 + 环境，结论本身不参与 pass/fail ----
    const checks = oks.map((o) => ({ name: o.name, pass: o.pass, detail: o.detail }));
    const ok = (name, pass, detail) => checks.push({ name, pass: !!pass, detail: String(detail || '') });
    ok('设备脚本版本与 dist 一致', env.version === env.expect, 'v' + env.version + ' vs v' + env.expect);
    ok('四个规模都拿到测量数据', measures.length === 4, measures.map((m) => m.n).join('/'));
    ok('每组热扫都拿到 5 个样本', measures.every((m) => (m.idle || []).length === 5 &&
        (m.busy || []).length === 5), measures.map((m) => (m.busy || []).length).join('/'));
    ok('最坏热扫耗时非负且随规模不下降', worst && worst.busyMed >= 0 &&
        (!measures[0] || worst.busyMed >= measures[0].busyMed - 0.1),
        measures.map((m) => m.n + ':' + fmt(m.busyMed)).join(' '));
    ok('rAF 拿到完整两对 A/B', offs.length === 2 && ons.length === 2,
        'off=' + offs.length + ' on=' + ons.length);
    ok('每臂都采到至少 60 帧', rafs.length === 4 && rafs.every((r) => r.total >= 60),
        rafs.map((r) => r.total).join('/'));
    ok('页面跑到 done 且无中止', done && !(fin && fin.err), fin && fin.err ? fin.err : 'done');

    console.log('\n=== 断言 ===');
    let fail = 0;
    for (const c of checks) {
        console.log((c.pass ? 'ok   - ' : 'FAIL - ') + c.name + (c.detail ? '  [' + c.detail + ']' : ''));
        if (!c.pass) fail++;
    }
    console.log('\n结论: ' + verdict);
    console.log('预载补扫开销量化: ' + (checks.length - fail) + ' passed, ' + fail + ' failed');
    if (fail || !done) process.exitCode = 1;
} catch (e) {
    console.error('预载补扫量化异常: ' + (e && (e.stack || e.message || e)));
    process.exitCode = 1;
} finally {
    if (server) { try { server.kill(); } catch (e) {} }
}
