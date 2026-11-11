// 连播 + 选集跳页自动续播 真机验证（MuMu 模拟器 + Via）
//   node scripts/mumu-autonext.mjs
// 场景与判据见 e2e/autonext-android.html 头注释：
//   part1 开播放器 → findNext 查选集表 → 点第 2 集格子（vvEpGo 写 autoNextLast → 跳页）
//   part2 无手势 consume 自动续播（选集跳页通道端到端）→ 播完 vvNavNext 连播跳页
//   part3 无手势 consume 自动续播（连播通道端到端）→ 末集播完自动关播放器
// 三段在同一轮 run 里自驱跳页，本脚本只拉起 part1、收上报、汇总。
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

try {
    mkdirSync(join(ROOT, '.tmp'), { recursive: true });
    console.log(await ensureServer());

    // adb daemon 每次进程结束被回收：连接与 reverse 必须在本进程内完成
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

    const pageTag = 'r' + Date.now();
    await fetch(BASE + '/__report/clear');
    sh(['shell', 'am force-stop mark.via']);
    await sleep(1200);
    // force-stop 可能清掉 reverse，重挂一次再拉页面
    sh(['reverse', `tcp:${PORT}`, `tcp:${PORT}`]);
    const url = `${BASE}/e2e/autonext-android-${pageTag}.html?part=1&run=${pageTag}&vvdebug=1`;
    sh(['shell', `am start -n mark.via/.Shell -a android.intent.action.VIEW -d '${url}'`]);
    console.log('拉起 part1: ' + url);

    // part1/2 靠页面自己跳页接力，只在 part3 的 done 收官；三段播放 + 跳页给足 150s
    let rows = [], done = null, lastPart = 0;
    for (let i = 0; i < 500; i++) {
        await sleep(300);
        rows = readRows().filter((r) => r.run === pageTag);
        const boot = rows.filter((r) => r.tag === 'boot').map((r) => r.part);
        lastPart = boot.length ? Math.max(...boot) : lastPart;
        done = rows.find((r) => r.tag === 'done' && r.part === 3);
        if (done) break;
    }
    if (!done) console.log('!! 150 秒内没等到 part3 done，只输出已收到的断言（最后到 part' + lastPart + '）');

    const env = rows.find((r) => r.tag === 'boot') || {};
    console.log('\n=== 环境 ===');
    console.log('流程: part1 → part2 → part3，本轮标识 ' + pageTag);

    for (const r of rows.filter((r) => r.tag === 'diag')) {
        console.log('diag(p' + r.part + '): ' + r.phase + (r.msg ? ' ' + r.msg : ''));
    }
    const total = { pass: 0, fail: 0 };
    let curPart = 0;
    for (const o of rows.filter((r) => r.tag === 'ok')) {
        if (o.part !== curPart) { curPart = o.part; console.log('\n--- part' + curPart + ' ---'); }
        console.log((o.pass ? 'ok   - ' : 'FAIL - ') + o.name + (o.detail ? '  [' + o.detail + ']' : ''));
        if (o.pass) total.pass++; else total.fail++;
    }
    for (const f of rows.filter((r) => r.tag === 'fatal')) {
        console.log('FATAL(p' + f.part + '): ' + f.msg);
        total.fail++;
    }
    console.log(`\n连播/选集自动续播真机验证: ${total.pass} passed, ${total.fail} failed`);
    if (total.fail || !done) process.exitCode = 1;
} catch (e) {
    console.error('真机验证异常: ' + (e && (e.stack || e.message || e)));
    process.exitCode = 1;
} finally {
    if (server) { try { server.kill(); } catch (e) {} }
}
