// 自动播放拦截真机验证（MuMu 模拟器 + Via）
//   node scripts/mumu-aplate.mjs
// 场景与判据见 e2e/aplate-android.html 头注释：
//   S1 插件播放器开着 + 手势落在我们 UI → 站点视频迟到起播必须被拦（本次修复的主场景）
//   S2 手势落在页面本身 → 放行（小窗模式点站点播放键不受影响）
//   S3 无播放器 + 页面手势 → 站点视频正常起播（基础行为回归）
//   S4 播放器开着 + 无手势 → 拦截（基础规则回归）
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
const SCENARIOS = ['S1', 'S2', 'S3', 'S4'];

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

    // adb daemon 每次进程结束被回收：连接、root 前置检查、reverse 都要在本进程内完成
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

    const total = { pass: 0, fail: 0 };
    for (const scen of SCENARIOS) {
        const pageTag = scen.toLowerCase() + Date.now();
        await fetch(BASE + '/__report/clear');
        sh(['shell', 'am force-stop mark.via']);
        await sleep(1200);
        // force-stop 可能清掉 reverse，重挂一次再拉页面
        sh(['reverse', `tcp:${PORT}`, `tcp:${PORT}`]);
        const url = `${BASE}/e2e/aplate-android-${pageTag}.html?scen=${scen}&run=${pageTag}&vvdebug=1`;
        sh(['shell', `am start -n mark.via/.Shell -a android.intent.action.VIEW -d '${url}'`]);
        console.log(`\n=== ${scen} ===  ${url}`);

        let rows = [], done = null;
        for (let i = 0; i < 200; i++) {
            await sleep(300);
            rows = readRows().filter((r) => r.run === pageTag);
            done = rows.find((r) => r.tag === 'done');
            if (done) break;
        }
        if (!done) console.log('!! 60 秒内没等到 done，只输出已收到的断言');
        for (const r of rows.filter((r) => r.tag === 'diag')) {
            console.log('  diag: ' + r.phase + (r.msg ? ' ' + r.msg : ''));
        }
        for (const o of rows.filter((r) => r.tag === 'ok')) {
            console.log((o.pass ? 'ok   - ' : 'FAIL - ') + o.name + (o.detail ? '  [' + o.detail + ']' : ''));
            if (o.pass) total.pass++; else total.fail++;
        }
        const fatal = rows.find((r) => r.tag === 'fatal');
        if (fatal) { console.log('FATAL: ' + fatal.msg); total.fail++; }
        if (!done) total.fail++;
    }

    console.log(`\n自动播放拦截真机验证: ${total.pass} passed, ${total.fail} failed`);
    if (total.fail) process.exitCode = 1;
} catch (e) {
    console.error('真机验证异常: ' + (e && (e.stack || e.message || e)));
    process.exitCode = 1;
} finally {
    if (server) { try { server.kill(); } catch (e) {} }
}
