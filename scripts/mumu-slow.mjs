// 慢资源起播 · 真机验证（MuMu 模拟器 + Via）
//   node scripts/mumu-slow.mjs
//   SCENARIOS=steady,dead node scripts/mumu-slow.mjs      # 只跑指定场景
//   PORT=8099 node scripts/mumu-slow.mjs
// 前置：MuMu 已启动、Via 已装脚本且版本 = dist 当前版本（脚本会打印期望版本，不匹配直接判失败）。
//
// 为什么要在真机再跑一遍：桌面 Chromium 量的是「页面脚本 + hls.js 逻辑」，量不到 Via 的 WebView
// 触发网络请求的时机差异（真机首字节普遍更晚、分片解码更慢），也量不到 Android 上视频元素
// networkState 的抖动。起播看门狗是靠证据档位决定「续命还是判死」的，这类边界必须真机确认。
//
// 结构：页面自己按场景 drive __vv.open，采样式断言后 POST 回本地服务；本脚本负责
// 起本地两个服务（静态 serve + 限速 slow-serve）、端口映射、拉起页面、汇总上报。
// 限速资源与页面不同源，所以 slow-serve 必须带 CORS（见该文件注释）。
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
const SLOW_PORT = Number(process.env.SLOW_PORT || (8300 + Math.floor(Math.random() * 300)));
const ROOT = process.cwd();
const REPORT = join(ROOT, '.tmp/report.log');
const ONLY = (process.env.SCENARIOS || '').split(',').map((s) => s.trim()).filter(Boolean);
// 五个场景的时长合计约 190s，加上每轮开合与暖机，留 6 分钟上限
const LIMIT_S = Number(process.env.LIMIT || 380);

let server = null, slow = null;

function sh(args) {
    try {
        return execFileSync(ADB, ['-s', SERIAL, ...args], {
            encoding: 'utf8', maxBuffer: 32 * 1024 * 1024, timeout: 30000
        });
    } catch (e) { return (e.stdout || '') + (e.stderr || ''); }
}

// 清单必须按本轮端口现生成：分片写成绝对地址，才能给清单和分片挂不同的限速参数
// （相对地址只能继承清单自己的 query，挂不到分片上）。
function writeManifests() {
    const dir = join(ROOT, '.tmp', 'hls-gen');
    mkdirSync(dir, { recursive: true });
    const seg = (q) => [0, 1].map((i) =>
        `#EXTINF:10.000,\nhttp://127.0.0.1:${SLOW_PORT}/e2e/media/hls/seg${i}.ts?kbps=${q}`).join('\n');
    const body = (q) => [
        '#EXTM3U', '#EXT-X-VERSION:3', '#EXT-X-TARGETDURATION:10', '#EXT-X-PLAYLIST-TYPE:VOD',
        '# 真机限速回归用：分片写绝对地址，才能单独给分片挂限速参数',
        seg(q), '#EXT-X-ENDLIST', ''
    ].join('\n');
    writeFileSync(join(dir, 'mumu-manifest.m3u8'), body(3000));   // 清单慢的场景：分片快
    writeFileSync(join(dir, 'mumu-frag.m3u8'), body(16));         // 首片慢的场景：分片 16KB/s
}

async function waitPort(url) {
    for (let i = 0; i < 80; i++) {
        try { if ((await fetch(url)).ok) return true; } catch (e) {}
        await sleep(150);
    }
    return false;
}

async function ensureServer() {
    if (await waitPort(BASE + '/e2e/index.html')) return '复用已运行的本地服务';
    server = spawn(process.execPath, ['scripts/serve.mjs'], {
        cwd: ROOT, env: { ...process.env, PORT: String(PORT) }, stdio: 'ignore'
    });
    if (!(await waitPort(BASE + '/e2e/index.html'))) throw new Error('本地服务没起来，检查 PORT 是否被占用');
    return '本次启动本地服务';
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
    writeManifests();
    console.log(await ensureServer());
    slow = spawn(process.execPath, ['scripts/slow-serve.mjs'], {
        cwd: ROOT, stdio: 'ignore', env: { ...process.env, SLOW_PORT: String(SLOW_PORT) }
    });
    if (!(await waitPort(`http://127.0.0.1:${SLOW_PORT}/health`))) throw new Error('限速服务没起来（端口 ' + SLOW_PORT + '）');
    console.log('限速服务: 127.0.0.1:' + SLOW_PORT);

    // 每次进程结束 adb daemon 会被回收，连接与映射必须在同一进程里做完
    const conn = execFileSync(ADB, ['connect', SERIAL], { encoding: 'utf8', timeout: 30000 });
    console.log('adb: ' + conn.trim().split('\n').pop());
    if (sh(['shell', 'getprop sys.boot_completed']).trim() !== '1') throw new Error('模拟器 Android 还没启动完');
    if (!/package:/.test(sh(['shell', 'pm path mark.via']))) throw new Error('设备里没装 Via');
    // 页面和限速资源各占一个端口，两个都要映射（adbd 重启后这里重建）
    sh(['reverse', `tcp:${PORT}`, `tcp:${PORT}`]);
    sh(['reverse', `tcp:${SLOW_PORT}`, `tcp:${SLOW_PORT}`]);
    console.log(`adb reverse: tcp:${PORT}、tcp:${SLOW_PORT} → 本机`);

    const installed = (sh(['shell', 'sqlite3 /data/data/mark.via/databases/monkey ' +
        "'select version from scripts where _id=1'"]).trim().split('\n').pop() || '').trim();
    const distVer = (readFileSync(join(ROOT, 'dist/via-video-player.user.js'), 'utf8')
        .match(/@version\s+([\d.]+)/) || [])[1] || '';
    console.log('设备脚本 v' + (installed || '?') + '  ·  dist v' + distVer);

    await fetch(BASE + '/__report/clear');
    const pageTag = 'r' + Date.now();
    const url = `${BASE}/e2e/slow-android-${pageTag}.html?vvdebug=1&expect=${distVer}&slow=${SLOW_PORT}` +
        (ONLY.length ? '&only=' + ONLY.join(',') : '');
    console.log('本轮标识 ' + pageTag + '  ·  场景 ' + (ONLY.length ? ONLY.join(',') : '全部'));
    sh(['shell', 'am force-stop mark.via']);
    await sleep(1200);
    // 整条命令当字符串发、URL 用单引号包住：设备端 shell 会把 & 当后台符
    sh(['shell', `am start -n mark.via/.Shell -a android.intent.action.VIEW -d '${url}'`]);
    console.log('打开页面: ' + url + '\n');

    let done = false;
    const t0 = Date.now();
    for (let i = 0; i < LIMIT_S * 2; i++) {
        await sleep(500);
        const rows = readRows().filter((r) => r.run === pageTag);
        if (rows.some((r) => r.tag === 'done')) { done = true; break; }
    }
    const rows = readRows().filter((r) => r.run === pageTag);
    const env = rows.find((r) => r.tag === 'env') || {};
    const fin = rows.find((r) => r.tag === 'done');
    const fatal = rows.find((r) => r.tag === 'fatal');
    const scenes = rows.filter((r) => r.tag === 'scene');
    const oks = rows.filter((r) => r.tag === 'ok');

    console.log('=== 环境 ===');
    console.log('脚本版本: v' + (env.version || 'none') + '  ·  期望 v' + (env.expect || '?') +
        '  ·  视口 ' + (env.vw || '?') + '×' + (env.vh || '?') + ' dpr=' + (env.dpr || '?'));
    console.log('UA: ' + (env.ua || '?'));
    if (env.version !== env.expect) {
        console.log('!! 设备脚本版本与 dist 不一致，本轮结论无效（先换版再跑）');
        process.exitCode = 1;
    }

    for (const sc of scenes) {
        console.log(`\n▶ ${sc.id} · ${sc.label}  —— ${sc.pass} pass / ${sc.fail} fail`);
        for (const o of oks.filter((x) => x.id === sc.id)) {
            console.log((o.pass ? '  ok   - ' : '  FAIL - ') + o.name);
        }
        console.log(`  现场：错误卡 ${sc.err} 次` +
            (sc.errAt >= 0 ? `（首次 ${(sc.errAt / 1000).toFixed(1)}s「${sc.errText}」）` : '') +
            `；续命 ${sc.ext} 次；自救 ${sc.rescue}；最高证据档 ${sc.flow}；出画 ${sc.played ? 'Y' : 'N'}`);
        console.log(`  收尾：rx=${sc.lastRx} ns=${sc.lastNs} 加载环「${sc.lastLtx}」`);
        // 失败时把状态变化时间线摊开：光看最终数字分不清是证据没建立，还是续命没生效
        if (sc.fail && Array.isArray(sc.tl)) {
            console.log('  判据时间线（状态变化才打）：');
            for (const x of sc.tl) {
                console.log(`    ${String(x[0]).padStart(4)}s rx=${x[1]} ns=${x[2]}` +
                    ` 清单在飞=${x[3]} 分片在飞=${x[4]} 证据=${x[5]} 续命=${x[6]} 错误卡=${x[7]}` +
                    ` 到账=${x[8] < 0 ? '-' : x[8] + 's前'}`);
            }
        }
    }

    const pass = oks.filter((o) => o.pass).length;
    const fail = oks.filter((o) => !o.pass).length;
    console.log(`\n慢资源真机验证: ${pass} passed, ${fail} failed` +
        `  ·  ${scenes.length} 个场景  ·  用时 ${Math.round((Date.now() - t0) / 1000)}s`);
    if (fatal) console.log('FATAL: ' + fatal.msg);
    if (!done) { console.log('!! 没等到 done（超时 ' + LIMIT_S + 's）'); process.exitCode = 1; }
    if (fin && fin.aborted) { console.log('!! 页面侧中止：' + (fin.err || '?')); process.exitCode = 1; }
    if (!scenes.length) { console.log('!! 一个场景都没上报，检查脚本是否注入'); process.exitCode = 1; }
    if (fail) process.exitCode = 1;
} catch (e) {
    console.error('慢资源真机验证异常: ' + (e && (e.stack || e.message || e)));
    process.exitCode = 1;
} finally {
    if (server) { try { server.kill(); } catch (e) {} }
    if (slow) { try { slow.kill(); } catch (e) {} }
}
