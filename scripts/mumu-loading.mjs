// 起播封面 + 加载 ETA · 真机验证（MuMu 模拟器 + Via）
//   node scripts/mumu-loading.mjs
//   ONLY=poster-eta node scripts/mumu-loading.mjs
// 前置：MuMu 已启动、Via 已装脚本且版本 = dist 当前版本（不一致会直接判无效）。
//
// 验什么：起播等待期画面是纯黑，必须先铺封面；首帧一到要摘掉；慢网下加载明细要给
// 「已下载 x / 总量」与「约 Ns」；低特效模式下封面不许再走 blur（一次全屏重采样）。
// 这些全是"看得见但量不到"的东西，只能真机看 DOM：桌面 Chromium 的封面解码与
// background-image 渲染路径跟 Via 的 WebView 不一样，布局/滤镜生效与否也对不上。
//
// 环境变量：ADB、SERIAL（默认 127.0.0.1:16384）、PORT（默认 8099）、SLOW_PORT、ONLY
import { execFileSync, spawn } from 'node:child_process';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';

const ADB = process.env.ADB || 'E:/android-tools/platform-tools/adb.exe';
const SERIAL = process.env.SERIAL || '127.0.0.1:16384';
const PORT = Number(process.env.PORT || 8099);
const BASE = `http://127.0.0.1:${PORT}`;
const SLOW_PORT = Number(process.env.SLOW_PORT || (8300 + Math.floor(Math.random() * 300)));
const ROOT = process.cwd();
const REPORT = join(ROOT, '.tmp/report.log');
const ONLY = (process.env.ONLY || '').split(',').map((s) => s.trim()).filter(Boolean);

let server = null, slow = null;

function sh(args) {
    try {
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

// HLS 慢分片清单：分片必须写本机慢端口的绝对地址，才能只给分片挂限速
// （相对地址只会继承清单自己的 query，挂不到分片上）。端口每轮不同，所以现生成。
function writeEtaManifest() {
    const dir = join(ROOT, '.tmp', 'hls-gen');
    mkdirSync(dir, { recursive: true });
    const seg = [0, 1].map((i) =>
        `#EXTINF:10.000,\nhttp://127.0.0.1:${SLOW_PORT}/e2e/media/hls/seg${i}.ts?kbps=16`).join('\n');
    const body = ['#EXTM3U', '#EXT-X-VERSION:3', '#EXT-X-TARGETDURATION:10', '#EXT-X-PLAYLIST-TYPE:VOD',
        '# ETA 真机用：首片约 245KB @16KB/s ≈ 15s，清单本身不限速', seg, '#EXT-X-ENDLIST', ''].join('\n');
    writeFileSync(join(dir, 'eta-frag.m3u8'), body);
    return `http://127.0.0.1:${SLOW_PORT}/.tmp/hls-gen/eta-frag.m3u8?kbps=3000`;
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
    slow = spawn(process.execPath, ['scripts/slow-serve.mjs'], {
        cwd: ROOT, stdio: 'ignore', env: { ...process.env, SLOW_PORT: String(SLOW_PORT) }
    });
    if (!(await waitPort(`http://127.0.0.1:${SLOW_PORT}/health`))) throw new Error('限速服务没起来');
    console.log('限速服务: 127.0.0.1:' + SLOW_PORT);

    const conn = execFileSync(ADB, ['connect', SERIAL], { encoding: 'utf8', timeout: 30000 });
    console.log('adb: ' + conn.trim().split('\n').pop());
    if (sh(['shell', 'getprop sys.boot_completed']).trim() !== '1') throw new Error('模拟器还没启动完');
    if (!/package:/.test(sh(['shell', 'pm path mark.via']))) throw new Error('设备里没装 Via');
    sh(['reverse', `tcp:${PORT}`, `tcp:${PORT}`]);
    sh(['reverse', `tcp:${SLOW_PORT}`, `tcp:${SLOW_PORT}`]);

    const distVer = (readFileSync(join(ROOT, 'dist/via-video-player.user.js'), 'utf8')
        .match(/@version\s+([\d.]+)/) || [])[1] || '';
    const pageTag = 'r' + Date.now();
    const etaM3u8 = writeEtaManifest();
    const url = `${BASE}/e2e/loading-android-${pageTag}.html?vvdebug=1&expect=${distVer}&slow=${SLOW_PORT}` +
        '&m3u8=' + encodeURIComponent(etaM3u8) +
        (ONLY.length ? '&only=' + ONLY.join(',') : '');
    console.log('期望脚本版本 v' + distVer + '  ·  本轮标识 ' + pageTag);
    console.log('ETA 清单: ' + etaM3u8);

    await fetch(BASE + '/__report/clear');
    sh(['shell', 'am force-stop mark.via']);
    await sleep(1200);
    sh(['shell', `am start -n mark.via/.Shell -a android.intent.action.VIEW -d '${url}'`]);
    console.log('打开页面: ' + url + '\n');

    let done = false;
    for (let i = 0; i < 360; i++) {
        await sleep(500);
        if (readRows().filter((r) => r.run === pageTag).some((r) => r.tag === 'done')) { done = true; break; }
    }
    const rows = readRows().filter((r) => r.run === pageTag);
    const env = rows.find((r) => r.tag === 'env') || {};
    const oks = rows.filter((r) => r.tag === 'ok');
    const fin = rows.find((r) => r.tag === 'done');
    const fatal = rows.find((r) => r.tag === 'fatal');
    const diag = rows.filter((r) => r.tag === 'diag');

    console.log('=== 环境 ===');
    console.log('脚本版本: v' + (env.version || 'none') + '  ·  期望 v' + (env.expect || '?') +
        '  ·  视口 ' + (env.vw || '?') + '×' + (env.vh || '?') + ' dpr=' + (env.dpr || '?'));
    if (env.version !== env.expect) {
        console.log('!! 设备脚本版本与 dist 不一致，本轮结论无效（先换版）');
        process.exitCode = 1;
    }

    console.log('\n=== 断言 ===');
    for (const o of oks) {
        console.log((o.pass ? 'ok   - ' : 'FAIL - ') + o.name + (o.detail ? '  [' + o.detail + ']' : ''));
    }
    for (const d of diag) {
        console.log('diag - ' + JSON.stringify({ phase: d.phase, firstFrameAt: d.firstFrameAt,
            seenEta: d.seenEta, seenDetail: d.seenDetail, total: d.total, loaded: d.loaded,
            spd: d.spd, aheadRate: d.aheadRate,
            live: d.liveMs ? `${d.liveLoaded}/${d.liveTotal}B @${d.liveMs}ms` : undefined,
            nProg: d.nProg, hooked: d.hooked, firstProg: d.firstProg, hookErr: d.hookErr,
            liveSamples: d.liveSamples, atFrame: d.atFrame }));
        if (Array.isArray(d.dts) && d.dts.length) console.log('  明细时间线: ' + d.dts.join('  →  '));
    }
    const pass = oks.filter((o) => o.pass).length;
    const fail = oks.filter((o) => !o.pass).length;
    console.log(`\n起播封面 + 加载 ETA 真机验证: ${pass} passed, ${fail} failed`);
    if (fatal) console.log('FATAL: ' + fatal.msg);
    if (!done) { console.log('!! 没等到 done'); process.exitCode = 1; }
    if (fin && fin.aborted) { console.log('!! 页面侧中止：' + (fin.err || '?')); process.exitCode = 1; }
    if (!oks.length) { console.log('!! 一条断言都没上报，检查脚本是否注入'); process.exitCode = 1; }
    if (fail) process.exitCode = 1;
} catch (e) {
    console.error('起播封面真机验证异常: ' + (e && (e.stack || e.message || e)));
    process.exitCode = 1;
} finally {
    if (server) { try { server.kill(); } catch (e) {} }
    if (slow) { try { slow.kill(); } catch (e) {} }
}
