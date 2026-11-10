// hls.js 内联执行成本 · 真机量化（MuMu + Via）
//   [ROUNDS=3] node scripts/mumu-hlsperf.mjs
// 前置：MuMu 已启动、Via 已安装脚本、adb 可连；本地服务由脚本自行拉起。
//
// 要回答的问题：vendor 里 386KB 的 hls.js 以 IIFE 形式在 document-start 直接执行，
// 等于每开一个页面就完整解析编译一遍，而绝大多数页面根本不播 m3u8。
// 这件事曾经改成按需编译（c34207d）又整体回退（c384204）——回退是因为实际使用中出问题，
// 不是因为量过不划算。所以这里先把数字量出来，再决定要不要重做：
//   1) 同一份源码在这台设备的 WebView 里「编译 + 执行」要多少毫秒（冷 / 中位 / 热）；
//   2) 只建函数不执行（按需编译在非 HLS 页面上真正要付的钱）要多少毫秒；
//   3) 页面首个脚本的时刻 = 整份 dist（含 vendor）跑完的时间，用来看 vendor 占多大比重。
// 判定门槛写在末尾：省下来的每页耗时不值钱时，就不该再引入那套复杂度。
//
// 环境变量：ADB、SERIAL（默认 127.0.0.1:16384）、PORT（默认 8099）、ROUNDS（默认 3）
import { execFileSync, spawn } from 'node:child_process';
import { readFileSync, mkdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';

const ADB = process.env.ADB || 'E:/android-tools/platform-tools/adb.exe';
const SERIAL = process.env.SERIAL || '127.0.0.1:16384';
const PORT = Number(process.env.PORT || 8099);
const BASE = `http://127.0.0.1:${PORT}`;
const ROOT = process.cwd();
const REPORT = join(ROOT, '.tmp/report.log');
const ROUNDS = Number(process.env.ROUNDS || 5);

// 判定门槛（写死在脚本里，避免"量完再挑一个顺眼的阈值"）：
// 每页省下的时间 = 冷执行中位数 - 只建函数中位数。真机 60Hz 下一帧 16.7ms，
// 省不到 2 帧（33ms）就是用户感知不到的噪声，那就不该为它多一条会坏的加载路径。
const FRAME_MS = 16.7;
const NOISE_MS = FRAME_MS * 2;

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
const med = (arr) => {
    const s = arr.slice().sort((a, b) => a - b);
    return s.length ? s[Math.floor(s.length / 2)] : 0;
};

try {
    mkdirSync(join(ROOT, '.tmp'), { recursive: true });
    console.log(await ensureServer());

    const conn = execFileSync(ADB, ['connect', SERIAL], { encoding: 'utf8', timeout: 30000 });
    console.log('adb: ' + conn.trim().split('\n').pop());
    if (sh(['shell', 'getprop sys.boot_completed']).trim() !== '1') throw new Error('模拟器还没启动完');
    if (!/package:/.test(sh(['shell', 'pm path mark.via']))) throw new Error('设备里没装 Via');
    sh(['reverse', `tcp:${PORT}`, `tcp:${PORT}`]);

    await fetch(BASE + '/__report/clear');
    const vendorBytes = statSync(join(ROOT, 'vendor/hls.light.min.js')).size;
    const distVer = (readFileSync(join(ROOT, 'dist/via-video-player.user.js'), 'utf8')
        .match(/@version\s+([\d.]+)/) || [])[1] || '';
    console.log('脚本版本 v' + distVer + '  ·  vendor ' + vendorBytes + ' 字节  ·  ' + ROUNDS + ' 轮\n');

    const runs = [];
    for (let r = 0; r < ROUNDS; r++) {
        const tag = 'r' + Date.now() + '-' + r;
        const url = `${BASE}/e2e/hlsperf-android-${tag}.html?vvdebug=1&expect=${distVer}`;
        sh(['shell', 'am force-stop mark.via']);
        await sleep(900);
        sh(['shell', `am start -n mark.via/.Shell -a android.intent.action.VIEW -d '${url}'`]);
        let got = null;
        for (let i = 0; i < 200; i++) {
            await sleep(300);
            const rows = readRows().filter((x) => x.run === tag);
            const fin = rows.find((x) => x.tag === 'done');
            if (fin) { got = { perf: rows.find((x) => x.tag === 'perf') || {}, done: fin }; break; }
        }
        if (!got || !got.perf.med) {
            console.log('第 ' + (r + 1) + ' 轮没拿到数据：' + ((got && got.done && got.done.err) || 'timeout'));
            continue;
        }
        runs.push(got.perf);
        console.log('第 ' + (r + 1) + ' 轮  cold=' + got.perf.cold + 'ms  med=' + got.perf.med +
            'ms  warm=' + got.perf.warm + 'ms  compileOnly=' + (got.perf.compile || []).join('/') +
            'ms  整份dist=' + got.perf.distMs + 'ms' + (got.perf.distErr ? '(抛错:' + got.perf.distErr.slice(0, 60) + ')' : '') +
            '  pageStart=' + got.perf.pageStart + 'ms  ' + (got.perf.hlsVer || '?'));
        // 每轮都确认读到的确实是那份 vendor，不是缓存里的别的东西
        if (got.perf.bytes !== vendorBytes) {
            console.log('  !! vendor 字节不符：页面读到 ' + got.perf.bytes + '，仓库是 ' + vendorBytes);
        }
    }
    if (!runs.length) throw new Error('三轮都没拿到数据');

    const colds = runs.map((x) => x.cold);
    const meds = runs.map((x) => x.med);
    const comps = [].concat(...runs.map((x) => x.compile || []));
    const starts = runs.map((x) => x.pageStart);
    const dists = runs.map((x) => x.distMs).filter((x) => typeof x === 'number' && x > 0);
    // 每个新页面都是新的 realm，所以「每页真实成本」要按冷轮算；
    // 同一 realm 里再执行一次会走已编译代码，那是热态，只能当参考。
    const coldMed = med(colds);
    const execMed = med(meds), compMed = med(comps), startMed = med(starts), distMed = med(dists);
    const distErr = (runs.find((x) => x.distErr) || {}).distErr || '';
    const saveMs = coldMed - compMed;

    console.log('\n=== 结果 ===');
    console.log('设备 WebView : ' + (runs[0].uaVer || '?') + '  ·  hls.js ' + (runs[0].hlsVer || '?'));
    console.log('vendor 体积  : ' + vendorBytes + ' 字节（页面读到的长度 ' + runs[0].bytes + '）');
    console.log('冷执行       : ' + colds.join(' / ') + ' ms   中位 ' + coldMed + ' ms  ← 每页真实成本');
    console.log('热执行       : ' + meds.join(' / ') + ' ms   中位 ' + execMed + ' ms（同 realm 重复执行，仅参考）');
    console.log('只建函数     : ' + comps.join(' / ') + ' ms   中位 ' + compMed + ' ms（按需编译在非 HLS 页要付的钱）');
    console.log('dist 预解析  : ' + (dists.length ? dists.join(' / ') + ' ms   中位 ' + distMed + ' ms（整份 838KB 只预解析）' : '取不到' + (distErr ? '（' + distErr + '）' : '')));
    console.log('Via 首脚本   : ' + starts.join(' / ') + ' ms（含打开流程，不当脚本耗时用）');
    console.log('每页可省     : 约 ' + Math.round(saveMs) + ' ms（' +
        (saveMs / FRAME_MS).toFixed(1) + ' 帧 @60Hz）');

    const checks = [];
    const ok = (name, pass, detail) => checks.push({ name, pass, detail });
    ok('三轮都读到了同一份 vendor（字节一致）', runs.every((x) => x.bytes === vendorBytes),
        'bytes=' + runs.map((x) => x.bytes).join('/') + ' expect=' + vendorBytes);
    ok('hls.js 版本为 1.7.3（量的是产品里内联的那份）', runs.every((x) => x.hlsVer === '1.7.3'),
        runs.map((x) => x.hlsVer).join('/'));
    ok('执行确实发生了（耗时 > 0）', coldMed > 0, 'cold=' + coldMed + 'ms warm=' + execMed + 'ms');
    ok('页面首脚本时刻已包含 dist 执行（> 0）', startMed > 0, startMed + 'ms');
    ok('拿到了整份 dist 的预解析耗时（体积本身的开销对照）', distMed > 0,
        distMed > 0 ? distMed + 'ms' : '取不到' + (distErr ? '：' + distErr : ''));
    // 冷轮离散度：同一台设备上 30ms 和 85ms 的差别不是测量误差就是负载抖动，
    // 这时候任何「单轮结论」都不可信，必须先说清楚。
    const spread = colds.length ? (Math.max(...colds) - Math.min(...colds)) / Math.max(1, coldMed) : 0;
    if (spread > 0.8) console.log('（冷轮离散度 ' + (spread * 100).toFixed(0) + '%：模拟器负载抖动大，结论按中位看待）');

    // 结论（不是断言通过与否，而是给出该不该做的判断）
    let verdict;
    if (saveMs <= NOISE_MS) {
        verdict = '不重做按需编译：省 ' + Math.round(saveMs) + 'ms/页，不到两帧（' +
            Math.round(NOISE_MS) + 'ms），用户感知不到，不值得再引入一条会坏的加载路径';
    } else {
        verdict = '收益真实（每页省 ' + Math.round(saveMs) + 'ms ≈ ' +
            (saveMs / FRAME_MS).toFixed(1) + ' 帧），但是否重做要看能否避开上一版 c34207d 的坑';
    }

    console.log('\n=== 断言 ===');
    let fail = 0;
    for (const c of checks) {
        console.log((c.pass ? 'ok   - ' : 'FAIL - ') + c.name + (c.detail ? '  [' + c.detail + ']' : ''));
        if (!c.pass) fail++;
    }
    console.log('\n结论: ' + verdict);
    console.log('hls.js 内联执行成本量化: ' + (checks.length - fail) + ' passed, ' + fail + ' failed');
    if (fail) process.exitCode = 1;
} catch (e) {
    console.error('真机量化异常: ' + (e && (e.stack || e.message || e)));
    process.exitCode = 1;
} finally {
    if (server) { try { server.kill(); } catch (e) {} }
}
