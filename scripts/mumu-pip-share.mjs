// 小窗 / 导出浮层真机验证（MuMu 模拟器 + Via）
//   node scripts/mumu-pip-share.mjs
// 前置：MuMu 已启动、Via 已安装且脚本已更新到当前版本（设置 → 脚本 → 更新）。
// 桌面 Chromium 里系统画中画是可用的，测不出 Via WebView 110 的 NotSupportedError；
// 嗅探面板 2.5 秒一次的置顶巡检也需要真实点击链路才能复现「浮层被盖住」。
//
// 环境变量：ADB（adb.exe 路径）、SERIAL（默认 127.0.0.1:16384）、PORT（默认 8099）
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
    console.log('adb reverse: tcp:' + PORT + ' → tcp:' + PORT);

    await fetch(BASE + '/__report/clear');
    const distVer = (readFileSync(join(ROOT, 'dist/via-video-player.user.js'), 'utf8')
        .match(/@version\s+([\d.]+)/) || [])[1] || '';
    // 每轮换一个别名路径：Via 的缓存按 URL 路径命中
    const pageTag = 'r' + Date.now();
    const url = `${BASE}/e2e/pip-share-android-${pageTag}.html?vvdebug=1&expect=${distVer}`;
    console.log('期望脚本版本: v' + distVer + '  ·  本轮标识 ' + pageTag);
    sh(['shell', 'am force-stop mark.via']);
    await sleep(1000);
    sh(['shell', `am start -n mark.via/.Shell -a android.intent.action.VIEW -d '${url}'`]);
    console.log('打开页面: ' + url);

    let done = false;
    for (let i = 0; i < 240; i++) {
        await sleep(300);
        rows = readRows().filter((r) => r.run === pageTag);
        if (rows.some((r) => r.tag === 'done')) { done = true; break; }
    }

    const oks = rows.filter((r) => r.tag === 'ok');
    const diags = rows.filter((r) => r.tag === 'diag');
    console.log('\n=== 断言 ===');
    for (const r of oks) {
        console.log((r.pass ? 'ok   - ' : 'FAIL - ') + r.name +
            (r.detail ? '  [' + String(r.detail).slice(0, 110) + ']' : ''));
    }
    for (const d of diags) {
        console.log('diag - ' + JSON.stringify({ phase: d.phase, pipEnabled: d.pipEnabled,
            msg: d.msg, ua: d.ua }));
    }
    const fin = rows.find((r) => r.tag === 'done');
    const pass = fin ? fin.pass : oks.filter((r) => r.pass).length;
    const fail = fin ? fin.fail : oks.filter((r) => !r.pass).length;
    console.log(`\n小窗 / 导出浮层真机验证: ${pass} passed, ${fail} failed`);
    if (!done) console.log('!! 没收到本轮 done，页面可能被 Via 的系统下载界面挂起');
    process.exit(fail || !done ? 1 : 0);
} catch (e) {
    console.error('真机验证失败: ' + (e && e.message));
    process.exit(1);
} finally {
    if (server) server.kill();
}
