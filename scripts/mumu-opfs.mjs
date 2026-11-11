// OPFS 播放缓存真机验证（MuMu 模拟器 + Via）
//   node scripts/mumu-opfs.mjs
// 场景与判据见 e2e/opfs-android.html 头注释：
//   round A（part=full）：两轮 open 同一 URL —— 第一轮全 MISS 写缓存、第二轮命中；
//   中途 force-stop Via；
//   round B（part=persist）：索引从磁盘恢复（entries>0）且命中（hits>=1），
//   验证的是 OPFS 真持久化，不是内存 Map。
// 环境变量：ADB、SERIAL、PORT
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
    } catch (e) {
        return (e.stdout || '') + (e.stderr || '');
    }
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

async function runRound(part, label) {
    const pageTag = 'r' + Date.now();
    await fetch(BASE + '/__report/clear');
    sh(['shell', 'am force-stop mark.via']);
    await sleep(1200);
    sh(['reverse', `tcp:${PORT}`, `tcp:${PORT}`]);
    const url = `${BASE}/e2e/opfs-android-${pageTag}.html?part=${part}&run=${pageTag}&vvdebug=1`;
    sh(['shell', `am start -n mark.via/.Shell -a android.intent.action.VIEW -d '${url}'`]);
    console.log(`\n=== ${label} ===`);
    console.log('打开页面: ' + url);

    let rows = [], done = null;
    for (let i = 0; i < 280; i++) {
        await sleep(300);
        rows = readRows().filter((r) => r.run === pageTag);
        done = rows.find((r) => r.tag === 'done');
        if (done) break;
    }
    if (!done) console.log('!! 84 秒内没等到 done，只输出已收到的断言');

    for (const r of rows.filter((r) => r.tag === 'diag')) {
        console.log('diag: ' + r.phase + (r.msg ? ' ' + r.msg : ''));
    }
    const total = { pass: 0, fail: 0 };
    for (const o of rows.filter((r) => r.tag === 'ok')) {
        console.log((o.pass ? 'ok   - ' : 'FAIL - ') + o.name + (o.detail ? '  [' + o.detail + ']' : ''));
        if (o.pass) total.pass++; else total.fail++;
    }
    for (const f of rows.filter((r) => r.tag === 'fatal')) {
        console.log('FATAL: ' + f.msg);
        total.fail++;
    }
    return total;
}

try {
    mkdirSync(join(ROOT, '.tmp'), { recursive: true });
    console.log(await ensureServer());

    const conn = execFileSync(ADB, ['connect', SERIAL], { encoding: 'utf8', timeout: 30000 });
    console.log('adb: ' + conn.trim().split('\n').pop());
    if (sh(['shell', 'getprop sys.boot_completed']).trim() !== '1') {
        throw new Error('模拟器 Android 还没启动完');
    }
    if (!/package:/.test(sh(['shell', 'pm path mark.via']))) throw new Error('设备里没装 Via');
    sh(['reverse', `tcp:${PORT}`, `tcp:${PORT}`]);

    const distVer = (readFileSync(join(ROOT, 'dist/via-video-player.user.js'), 'utf8')
        .match(/@version\s+([\d.]+)/) || [])[1] || '';
    console.log('期望脚本版本: v' + distVer);

    const a = await runRound('full', 'round A：写入 + 同进程命中');
    // force-stop 后索引必须从磁盘（OPFS index.json）恢复，而不是靠内存 Map
    const b = await runRound('persist', 'round B：跨进程持久化命中');

    console.log(`\nOPFS 缓存真机验证: ${a.pass + b.pass} passed, ${a.fail + b.fail} failed`);
    if (a.fail || b.fail) process.exitCode = 1;
} catch (e) {
    console.error('真机验证异常: ' + (e && (e.stack || e.message || e)));
    process.exitCode = 1;
} finally {
    if (server) { try { server.kill(); } catch (e) {} }
}
