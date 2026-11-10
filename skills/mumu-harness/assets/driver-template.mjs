// 真机测试台驱动骨架（MuMu + Via）
//   复制为 scripts/mumu-<name>.mjs 后改：PAGE（别名前缀）、LIMIT（轮询次数）、汇总文案
//
// 配套页面：e2e/<name>-android.html —— 页内自驱动、采样式断言、POST /__report
// 配套服务：scripts/serve.mjs —— 必须为 /e2e/<name>-android-<任意>.html 加别名映射
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
const PAGE = '<name>';            // ← TODO：与 serve.mjs 里的别名前缀一致
const POLLS = 360;                // 轮询次数 × 500ms = 最长等待
const SLOW_PORT = Number(process.env.SLOW_PORT || (8300 + Math.floor(Math.random() * 300)));

let server = null, slow = null;

function sh(args) {
    try {
        return execFileSync(ADB, ['-s', SERIAL, ...args], {
            encoding: 'utf8', maxBuffer: 32 * 1024 * 1024, timeout: 30000
        });
    } catch (e) { return (e.stdout || '') + (e.stderr || ''); }  // 输出里才有线索，别抛
}

async function waitPort(url, tries = 80) {
    for (let i = 0; i < tries; i++) {
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

try {
    mkdirSync(join(ROOT, '.tmp'), { recursive: true });

    // ① 本地服务：已起就复用，没起就自己拉
    if (await waitPort(BASE + '/e2e/index.html')) {
        console.log('复用已运行的本地服务');
    } else {
        server = spawn(process.execPath, ['scripts/serve.mjs'], {
            cwd: ROOT, env: { ...process.env, PORT: String(PORT) }, stdio: 'ignore'
        });
        if (!(await waitPort(BASE + '/e2e/index.html'))) throw new Error('本地服务没起来（检查 PORT）');
        console.log('本次启动本地服务');
    }

    // ② 需要限速服务时才起（不需要就删掉这一段与 finally 里的 slow.kill）
    slow = spawn(process.execPath, ['scripts/slow-serve.mjs'], {
        cwd: ROOT, stdio: 'ignore', env: { ...process.env, SLOW_PORT: String(SLOW_PORT) }
    });
    if (!(await waitPort(`http://127.0.0.1:${SLOW_PORT}/health`))) throw new Error('限速服务没起来');
    console.log('限速服务: 127.0.0.1:' + SLOW_PORT);

    // ③ 设备：daemon 随进程回收，连接与映射必须在同一进程里做完
    const conn = execFileSync(ADB, ['connect', SERIAL], { encoding: 'utf8', timeout: 30000 });
    console.log('adb: ' + conn.trim().split('\n').pop());
    if (sh(['shell', 'getprop sys.boot_completed']).trim() !== '1') throw new Error('模拟器还没启动完');
    if (!/package:/.test(sh(['shell', 'pm path mark.via']))) throw new Error('设备里没装 Via');
    sh(['reverse', `tcp:${PORT}`, `tcp:${PORT}`]);
    sh(['reverse', `tcp:${SLOW_PORT}`, `tcp:${SLOW_PORT}`]);

    // ④ 期望版本从产物读，避免每次升版改测试台；不一致时页面侧会判本轮无效
    const distVer = (readFileSync(join(ROOT, 'dist/via-video-player.user.js'), 'utf8')
        .match(/@version\s+([\d.]+)/) || [])[1] || '';

    // ⑤ 一次性路径：Via 按 URL 路径命中缓存，?t= 与 no-store 都拦不住
    const pageTag = 'r' + Date.now();
    const url = `${BASE}/e2e/${PAGE}-android-${pageTag}.html?vvdebug=1&expect=${distVer}&slow=${SLOW_PORT}`;
    console.log('期望脚本版本 v' + distVer + '  ·  本轮标识 ' + pageTag);

    await fetch(BASE + '/__report/clear');
    sh(['shell', 'am force-stop mark.via']);
    await sleep(1200);
    // 整条命令当一个参数、URL 用单引号：设备端 sh 会把 & 当后台分隔符
    sh(['shell', `am start -n mark.via/.Shell -a android.intent.action.VIEW -d '${url}'`]);
    console.log('打开页面: ' + url + '\n');

    // ⑥ 轮询到 done；只认本轮 run
    let done = false;
    for (let i = 0; i < POLLS; i++) {
        await sleep(500);
        // 保活：开完页若再不碰 adb，本机 daemon 会被回收、reverse 跟着清空，
        // 页面后续 fetch('/__report') 全部静默失败，上报里只剩一条 boot。
        // 每 2 秒重建一次映射，顺便把 daemon 拽住（长窗口套件尤其需要）。
        if (i % 4 === 0) {
            sh(['reverse', `tcp:${PORT}`, `tcp:${PORT}`]);
            sh(['reverse', `tcp:${SLOW_PORT}`, `tcp:${SLOW_PORT}`]);
        }
        if (readRows().filter((r) => r.run === pageTag).some((r) => r.tag === 'done')) { done = true; break; }
    }
    const rows = readRows().filter((r) => r.run === pageTag);
    const env = rows.find((r) => r.tag === 'env') || {};
    const oks = rows.filter((r) => r.tag === 'ok');
    const fin = rows.find((r) => r.tag === 'done');
    const fatal = rows.find((r) => r.tag === 'fatal');
    const diags = rows.filter((r) => r.tag === 'diag');

    // ⑦ 汇总
    console.log('=== 环境 ===');
    console.log('脚本版本: v' + (env.version || 'none') + '  ·  期望 v' + (env.expect || '?') +
        '  ·  视口 ' + (env.vw || '?') + '×' + (env.vh || '?') + ' dpr=' + (env.dpr || '?'));
    if (env.version !== env.expect) {
        console.log('!! 设备脚本版本与 dist 不一致，本轮结论无效（先换版）');
        process.exitCode = 1;
    }

    if (diags.length) {
        console.log('\n=== 现场诊断 ===');
        for (const d of diags) {
            const { tag, t, run, ...rest } = d;
            console.log(d.phase + ': ' + JSON.stringify(rest));
            if (Array.isArray(d.dts) && d.dts.length) console.log('  时间线: ' + d.dts.join('  →  '));
        }
    }

    console.log('\n=== 断言 ===');
    for (const o of oks) {
        console.log((o.pass ? 'ok   - ' : 'FAIL - ') + o.name + (o.detail ? '  [' + o.detail + ']' : ''));
    }

    const pass = oks.filter((o) => o.pass).length;
    const fail = oks.filter((o) => !o.pass).length;
    console.log(`\n<名称>真机验证: ${pass} passed, ${fail} failed`);
    if (fatal) console.log('FATAL: ' + fatal.msg);
    if (!done) { console.log('!! 没等到 done'); process.exitCode = 1; }
    if (fin && fin.aborted) { console.log('!! 页面侧中止：' + (fin.err || '?')); process.exitCode = 1; }
    if (!oks.length) { console.log('!! 一条断言都没上报，检查脚本是否注入'); process.exitCode = 1; }
    if (fail) process.exitCode = 1;
} catch (e) {
    console.error('真机验证异常: ' + (e && (e.stack || e.message || e)));
    process.exitCode = 1;
} finally {
    if (server) { try { server.kill(); } catch (e) {} }
    if (slow) { try { slow.kill(); } catch (e) {} }
}
