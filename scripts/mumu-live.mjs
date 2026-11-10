// 直播落位守卫 · 真机验证（MuMu 模拟器 + Via）
//   node scripts/mumu-live.mjs
// 前置：MuMu 已启动、Via 已装脚本且版本 = dist 当前版本（不一致会直接判无效）。
//
// 验什么：直播窗口是滑动的，按「上次看到哪儿 / 跳过片头」落位会把落点推到窗口外。
// 桌面能验 vvStartTarget 的分支，但验不了「真机 hls.js 到底把 details.live 判成什么」——
// 这条判据成立与否决定了守卫有没有被触发，只有真机能给结论。
// 做法：现生成一份无 ENDLIST 的直播清单（分片写本机绝对地址），用 liveProbe 读现场，
// 再用点播 mp4 对照确认守卫没误伤。
//
// 环境变量：ADB、SERIAL（默认 127.0.0.1:16384）、PORT（默认 8099）
import { execFileSync, spawn } from 'node:child_process';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
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
    // daemon 会被回收：每次调用先重连，且 reverse 必须在同一轮里重建
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

// 无 #EXT-X-ENDLIST = hls.js 的 details.live === true。分片必须写绝对地址，
// 否则清单带的 query（expect / vvdebug）会串到分片请求上。
function writeLiveManifest() {
    const dir = join(ROOT, '.tmp', 'hls-gen');
    mkdirSync(dir, { recursive: true });
    const seg = [0, 1].map((i) =>
        `#EXTINF:10.000,\n${BASE}/e2e/media/hls/seg${i}.ts`).join('\n');
    const body = ['#EXTM3U', '#EXT-X-VERSION:3', '#EXT-X-TARGETDURATION:10',
        '#EXT-X-MEDIA-SEQUENCE:100', seg, ''].join('\n');
    writeFileSync(join(dir, 'live.m3u8'), body);
    return `${BASE}/.tmp/hls-gen/live.m3u8`;
}

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
    sh(['reverse', `tcp:${PORT}`, `tcp:${PORT}`]);

    const distVer = (readFileSync(join(ROOT, 'dist/via-video-player.user.js'), 'utf8')
        .match(/@version\s+([\d.]+)/) || [])[1] || '';
    const pageTag = 'r' + Date.now();
    const liveUrl = writeLiveManifest();
    const url = `${BASE}/e2e/live-android-${pageTag}.html?vvdebug=1&expect=${distVer}` +
        '&m3u8=' + encodeURIComponent(liveUrl);
    console.log('期望脚本版本 v' + distVer + '  ·  本轮标识 ' + pageTag);
    console.log('直播清单: ' + liveUrl + '\n');

    await fetch(BASE + '/__report/clear');
    sh(['shell', 'am force-stop mark.via']);
    // adbd 重启过（换版时 root）会把 reverse 清空，开页前再建一次并复核
    sh(['reverse', `tcp:${PORT}`, `tcp:${PORT}`]);
    console.log('reverse: ' + sh(['reverse', '--list']).trim().replace(/\s+/g, ' '));
    await sleep(1200);
    sh(['shell', `am start -n mark.via/.Shell -a android.intent.action.VIEW -d '${url}'`]);
    console.log('打开页面: ' + url + '\n');

    let done = false;
    for (let i = 0; i < 120; i++) {
        await sleep(500);
        if (readRows().filter((r) => r.run === pageTag).some((r) => r.tag === 'done')) { done = true; break; }
    }
    const rows = readRows().filter((r) => r.run === pageTag);
    const env = rows.find((r) => r.tag === 'env') || {};
    const oks = rows.filter((r) => r.tag === 'ok');
    const fin = rows.find((r) => r.tag === 'done');

    console.log('=== 环境 ===');
    console.log('脚本版本: v' + (env.version || 'none') + '  ·  期望 v' + (env.expect || '?') +
        '  ·  视口 ' + (env.vw || '?') + '×' + (env.vh || '?'));
    if (env.version !== env.expect) {
        console.log('!! 设备脚本版本与 dist 不一致，本轮结论无效（先换版）');
        process.exitCode = 1;
    }

    console.log('\n=== 断言 ===');
    for (const o of oks) {
        console.log((o.pass ? 'ok   - ' : 'FAIL - ') + o.name + (o.detail ? '  [' + o.detail + ']' : ''));
    }
    for (const d of rows.filter((r) => r.tag === 'diag')) {
        console.log('diag - ' + JSON.stringify(d));
    }
    const pass = oks.filter((o) => o.pass).length;
    const fail = oks.filter((o) => !o.pass).length;
    console.log(`\n直播落位守卫真机验证: ${pass} passed, ${fail} failed`);
    if (!done) { console.log('!! 没等到 done'); process.exitCode = 1; }
    if (fin && fin.err) { console.log('!! 页面侧中止：' + fin.err); process.exitCode = 1; }
    if (!oks.length) { console.log('!! 一条断言都没上报，检查脚本是否注入'); process.exitCode = 1; }
    if (fail) process.exitCode = 1;
} catch (e) {
    console.error('直播守卫真机验证异常: ' + (e && (e.stack || e.message || e)));
    process.exitCode = 1;
} finally {
    if (server) { try { server.kill(); } catch (e) {} }
}
