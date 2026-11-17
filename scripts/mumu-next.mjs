// 「下一集」原地换集 真机验证（MuMu 模拟器 + Via）
//   node scripts/mumu-next.mjs
// 前置：MuMu 已启动、Via 已装且脚本已换成当前版本（本脚本会自己把 dist 写进 Via 的脚本库）。
//
// 桌面侧（scripts/next-inplace-verify.mjs）用 fetch 走通「取回下一集页面 → 解析片源」，
// 真机走的是另一条实现：Via 里取页靠 GM_xmlhttpRequest，Referer 与 CORS 行为都和浏览器
// fetch 不同。这一层就是为了在真实 WebView 里把这条链路跑一遍：
//   · 页面自己点「下一集」并断言，POST /__report 回来；
//   · 驱动负责 adb 连接、端口映射、换版、拉起页面、汇总。
//
// 环境变量：ADB、SERIAL（默认 127.0.0.1:16384）、PORT（默认 8099）、NO_DEPLOY=1 跳过换版
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
            encoding: 'utf8', maxBuffer: 32 * 1024 * 1024, timeout: 60000
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
// 把 dist 直接写进 Via 的脚本库，省掉「设置 → 脚本 → 更新」那几步。
// 关键：sqlite3 的 readfile() 返回 BLOB，必须先 CAST 成 TEXT，
// 否则 Via 加载时抛 "Unable to convert BLOB to string"，脚本根本不注入。
function deploy(ver) {
    const dist = join(ROOT, 'dist/via-video-player.user.js');
    sh(['push', dist, '/data/local/tmp/vv.js']);
    sh(['shell', 'chmod', '644', '/data/local/tmp/vv.js']);
    const sql = `UPDATE scripts SET content=CAST(readfile('/data/local/tmp/vv.js') AS TEXT), version='${ver}' WHERE _id=1`;
    sh(['shell', `sqlite3 /data/data/mark.via/databases/monkey "${sql}"`]);
    const chk = sh(['shell', `sqlite3 /data/data/mark.via/databases/monkey "select version,typeof(content) from scripts where _id=1"`]);
    return chk.trim();
}

try {
    mkdirSync(join(ROOT, '.tmp'), { recursive: true });
    console.log(await ensureServer());

    // adb daemon 每次进程结束会被回收：连接与 reverse 必须在本进程内完成
    const conn = execFileSync(ADB, ['connect', SERIAL], { encoding: 'utf8', timeout: 30000 });
    console.log('adb: ' + conn.trim().split('\n').pop());
    if (sh(['shell', 'getprop sys.boot_completed']).trim() !== '1') {
        throw new Error('模拟器 Android 还没启动完');
    }
    if (!/package:/.test(sh(['shell', 'pm path mark.via']))) throw new Error('设备里没装 Via');

    const distVer = (readFileSync(join(ROOT, 'dist/via-video-player.user.js'), 'utf8')
        .match(/@version\s+([\d.]+)/) || [])[1] || '';
    console.log('期望脚本版本: v' + distVer);

    if (!process.env.NO_DEPLOY) {
        sh(['root']);
        await sleep(1200);
        execFileSync(ADB, ['connect', SERIAL], { encoding: 'utf8', timeout: 30000 });
        const chk = deploy(distVer);
        console.log('脚本库: ' + chk);
        if (!chk.includes('text')) throw new Error('脚本库里 content 不是 TEXT（CAST 没生效），Via 会加载失败: ' + chk);
        if (!chk.includes(distVer)) throw new Error('脚本库里版本不是 ' + distVer + ': ' + chk);
    }

    sh(['reverse', `tcp:${PORT}`, `tcp:${PORT}`]);
    console.log('adb reverse: tcp:' + PORT + ' → tcp:' + PORT);
    await fetch(BASE + '/__report/clear');

    const pageTag = 'r' + Date.now();
    const url = `${BASE}/e2e/nextpage-android-${pageTag}.html?vvdebug=1&run=${pageTag}&expect=${distVer}`;
    sh(['shell', 'am force-stop mark.via']);
    await sleep(1200);
    // force-stop 可能清掉 reverse，重挂一次再拉页面
    sh(['reverse', `tcp:${PORT}`, `tcp:${PORT}`]);
    sh(['shell', `am start -n mark.via/.Shell -a android.intent.action.VIEW -d '${url}'`]);
    console.log('打开页面: ' + url);

    let rows = [], done = null;
    for (let i = 0; i < 400; i++) {
        await sleep(300);
        rows = readRows().filter((r) => r.run === pageTag);
        done = rows.find((r) => r.tag === 'done');
        if (done) break;
    }
    if (!done) console.log('!! 120 秒内没等到 done，只输出已收到的断言');

    const env = rows.find((r) => r.tag === 'env') || {};
    console.log('\n=== 环境 ===');
    console.log('脚本版本: v' + (env.version || '?') + '  build ' + (env.build || '?'));
    console.log('WebView 视口: ' + env.vw + '×' + env.vh + '  dpr=' + env.dpr);

    for (const d of rows.filter((r) => r.tag === 'diag')) {
        console.log('diag(' + d.phase + '): ' + d.msg);
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
    console.log(`\n下一集原地换集真机验证: ${total.pass} passed, ${total.fail} failed`);
    if (total.fail || !done) process.exitCode = 1;
} catch (e) {
    console.error('真机验证异常: ' + (e && (e.stack || e.message || e)));
    process.exitCode = 1;
} finally {
    if (server) { try { server.kill(); } catch (e) {} }
}
