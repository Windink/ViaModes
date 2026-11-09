// 选集真机验证（MuMu 模拟器 + Via）
//   node scripts/mumu-episodes.mjs
// 前置：MuMu 已启动、Via 已安装且脚本已更新到当前版本（设置 → 脚本 → 更新）。
// 桌面 Chromium 测不出 Via 的 WebView 视口、地址栏/工具栏占位和真实点击链路，
// 所以这一层在模拟器的真实 Via 里跑：页面自己执行断言并 POST 回本地服务，
// 本脚本负责 adb 连接、端口映射、拉起页面、抓浮层截图、读上报并汇总。
//
// 环境变量：ADB（adb.exe 路径）、SERIAL（默认 127.0.0.1:16384）、PORT（默认 8099）
import { execFileSync, spawn, spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';

const ADB = process.env.ADB || 'E:/android-tools/platform-tools/adb.exe';
const SERIAL = process.env.SERIAL || '127.0.0.1:16384';
const PORT = Number(process.env.PORT || 8099);
const BASE = `http://127.0.0.1:${PORT}`;
const ROOT = process.cwd();
const REPORT = join(ROOT, '.tmp/report.log');
// 系统 screencap 抓的是 SurfaceFlinger 合成帧，Via 的 WebView 不一定把
// documentElement 下那层 fixed 浮层提交进去（实测截图里只有播放器，页面内
// elementFromPoint 却命中浮层格子）。所以截图只留档，结论以页面 DOM 断言为准。
const SHOT = join(ROOT, '.tmp/episodes-android.png');

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
function screenshot() {
    const r = spawnSync(ADB, ['-s', SERIAL, 'exec-out', 'screencap -p'], {
        maxBuffer: 32 * 1024 * 1024, timeout: 30000
    });
    if (r.status === 0 && r.stdout && r.stdout.length > 1000) {
        writeFileSync(SHOT, r.stdout);
        return true;
    }
    return false;
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

let rows = [];
try {
    mkdirSync(join(ROOT, '.tmp'), { recursive: true });
    console.log(await ensureServer());

    // 每次 Bash/Node 进程结束后 adb daemon 会被回收，所以连接与端口映射必须在同一进程里做完
    const conn = execFileSync(ADB, ['connect', SERIAL], { encoding: 'utf8', timeout: 30000 });
    console.log('adb: ' + conn.trim().split('\n').pop());
    const boot = sh(['shell', 'getprop sys.boot_completed']).trim();
    if (boot !== '1') throw new Error('模拟器 Android 还没启动完（sys.boot_completed=' + boot + '）');
    if (!/package:/.test(sh(['shell', 'pm path mark.via']))) throw new Error('设备里没装 Via');
    sh(['reverse', `tcp:${PORT}`, `tcp:${PORT}`]);
    console.log('adb reverse: tcp:' + PORT + ' → tcp:' + PORT);

    await fetch(BASE + '/__report/clear');

    // 期望版本从构建产物头部读，避免每次升版都要改测试台
    const distVer = (readFileSync(join(ROOT, 'dist/via-video-player.user.js'), 'utf8')
        .match(/@version\s+([\d.]+)/) || [])[1] || '';
    // 带版本号的别名路径：Via 的缓存按 URL 路径命中，改了页面也可能跑旧的
    const pageTag = 'r' + Date.now();
    const url = `${BASE}/e2e/episodes-android-${pageTag}.html?vvdebug=1&expect=${distVer}#ep=3`;
    console.log('期望脚本版本: v' + distVer + '  ·  本轮标识 ' + pageTag);
    sh(['shell', 'am force-stop mark.via']);
    await sleep(1000);
    // 整条命令当字符串发过去、URL 用单引号包住：设备端 shell 会把 & 当后台符
    sh(['shell', `am start -n mark.via/.Shell -a android.intent.action.VIEW -d '${url}'`]);
    console.log('打开页面: ' + url);

    let shotDone = false, done = false;
    for (let i = 0; i < 300; i++) {
        await sleep(300);
        // Via 会恢复上一轮的标签，那些旧页面也在上报；只认本轮 run 的行
        rows = readRows().filter((r) => r.run === pageTag);
        if (!shotDone && rows.some((r) => r.tag === 'hold')) {
            // 让 WebView 把浮层这一帧合成完再抓，否则会拍到上一帧的播放器
            await sleep(2500);
            shotDone = screenshot();
            console.log(shotDone ? '已抓取选集浮层截图' : '截图失败（继续跑断言）');
        }
        if (rows.some((r) => r.tag === 'done')) { done = true; break; }
    }
    if (!done) console.log('!! 90 秒内没等到 done，下面只输出已收到的断言');

    const env = rows.find((r) => r.tag === 'env') || {};
    console.log('\n=== 环境 ===');
    console.log('脚本版本: v' + (env.version || '?') + '  build ' + (env.build || '?'));
    console.log('WebView 视口: ' + env.vw + '×' + env.vh + '  dpr=' + env.dpr);
    console.log('UA: ' + (env.ua || '?'));

    const diags = rows.filter((r) => r.tag === 'diag');
    if (diags.length) {
        console.log('\n=== 现场诊断 ===');
        for (const d of diags) {
            const { tag, t, ...rest } = d;
            console.log(d.phase + ': ' + JSON.stringify(rest));
        }
    }

    const oks = rows.filter((r) => r.tag === 'ok');
    console.log('\n=== 断言 ===');
    for (const o of oks) {
        console.log((o.pass ? 'ok   - ' : 'FAIL - ') + o.name + (o.detail ? '  [' + o.detail + ']' : ''));
    }
    const fatal = rows.find((r) => r.tag === 'fatal');
    if (fatal) console.log('FATAL: ' + fatal.msg);
    const fin = rows.find((r) => r.tag === 'done') || {};
    console.log(`\n选集真机验证: ${fin.pass || 0} passed, ${fin.fail || 0} failed` +
        (shotDone ? `  ·  截图留档 .tmp/episodes-android.png（浮层可能未被 WebView 合成进系统截图）` : ''));
    if (!done || !fin || fin.fail || !oks.length) process.exitCode = 1;
} catch (e) {
    console.error('真机验证异常: ' + (e && (e.stack || e.message || e)));
    process.exitCode = 1;
} finally {
    if (server) { try { server.kill(); } catch (e) {} }
}
