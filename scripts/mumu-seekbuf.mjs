// 回看缓冲 · 真机验证（MuMu 模拟器 + Via）
//   node scripts/mumu-seekbuf.mjs
//   PORT=8299 node scripts/mumu-seekbuf.mjs
// 前置：MuMu 已启动、Via 已装脚本且版本 = dist 当前版本（不匹配直接判本轮无效）。
//
// 验证目标：跳到远处（480s）再跳回 8s，不重新下载分片、立即续播。
// 素材：e2e/media/hls/seg0/seg1.ts（各 10s）加 #EXT-X-DISCONTINUITY 重复拼成 ~600s，
// hls.js 对 discontinuity 自动配 timestampOffset（直播环窗口的既有用法）。
// 清单按本轮端口现生成、分片写绝对地址（与慢网台同一套约定）。
//
// 环境变量：ADB、SERIAL、PORT（默认 8299，独立端口避免复用没有 seekbuf 别名的旧服务）
import { execFileSync, spawn } from 'node:child_process';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';

const ADB = process.env.ADB || 'E:/android-tools/platform-tools/adb.exe';
const SERIAL = process.env.SERIAL || '127.0.0.1:16384';
const PORT = Number(process.env.PORT || 8299);
const BASE = `http://127.0.0.1:${PORT}`;
const ROOT = process.cwd();
const REPORT = join(ROOT, '.tmp/report.log');
const LIMIT_S = Number(process.env.LIMIT || 240);

let server = null;

function sh(args) {
    try {
        return execFileSync(ADB, ['-s', SERIAL, ...args], {
            encoding: 'utf8', maxBuffer: 32 * 1024 * 1024, timeout: 30000
        });
    } catch (e) { return (e.stdout || '') + (e.stderr || ''); }
}

// 清单按本轮端口 + 唯一 tag 现生成：分片写绝对地址（挂端口的 reverse），
// 路径带 tag 避开续播进度记忆（vvVideoKey 按 host+path，query 无关）
function writeManifest(tag) {
    const dir = join(ROOT, '.tmp', 'hls-gen');
    mkdirSync(dir, { recursive: true });
    const PAIRS = 30; // 30 × 20s = 600s
    const lines = ['#EXTM3U', '#EXT-X-VERSION:3', '#EXT-X-TARGETDURATION:10',
        '#EXT-X-PLAYLIST-TYPE:VOD',
        '# 回看缓冲真机验证台：seg0/seg1 各 10s，重复 30 次，每对之间 discontinuity'];
    for (let p = 0; p < PAIRS; p++) {
        if (p > 0) lines.push('#EXT-X-DISCONTINUITY');
        for (let i = 0; i < 2; i++)
            lines.push('#EXTINF:10.000,',
                `${BASE}/e2e/media/hls/seg${i}.ts?d=${p}_${i}`);
    }
    lines.push('#EXT-X-ENDLIST', '');
    const file = join(dir, `seekbuf-${tag}.m3u8`);
    writeFileSync(file, lines.join('\n'));
    return file;
}

async function waitPort(url, tries = 120) {
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

// app 总内存（TOTAL PSS），单位 kB；拿不到返回 null
function meminfo() {
    const out = sh(['shell', 'dumpsys meminfo mark.via']);
    const m = /TOTAL\s+(\d+)/.exec(out);
    return m ? Number(m[1]) : null;
}

async function main() {
    mkdirSync(join(ROOT, '.tmp'), { recursive: true });
    console.log('清单: .tmp/hls-gen/seekbuf-<tag>.m3u8（600s，每轮唯一路径）');

    // 本台固定自己起服务：8299 上即使有旧进程也先杀（别名规则可能过期）
    const ls = sh([]); // 占位避免未用告警
    void ls;
    server = spawn(process.execPath, ['scripts/serve.mjs'], {
        cwd: ROOT, env: { ...process.env, PORT: String(PORT) }, stdio: 'ignore'
    });
    if (!(await waitPort(BASE + '/e2e/index.html'))) throw new Error('本地服务没起来（端口 ' + PORT + '）');
    console.log('本地服务: ' + BASE);

    const conn = execFileSync(ADB, ['connect', SERIAL], { encoding: 'utf8', timeout: 30000 });
    console.log('adb: ' + conn.trim().split('\n').pop());
    if (sh(['shell', 'getprop sys.boot_completed']).trim() !== '1') throw new Error('模拟器还没启动完');
    if (!/package:/.test(sh(['shell', 'pm path mark.via']))) throw new Error('设备里没装 Via');
    sh(['reverse', `tcp:${PORT}`, `tcp:${PORT}`]);

    const installed = (sh(['shell', 'sqlite3 /data/data/mark.via/databases/monkey ' +
        "'select version from scripts where _id=1'"]).trim().split('\n').pop() || '').trim();
    const distVer = (readFileSync(join(ROOT, 'dist/via-video-player.user.js'), 'utf8')
        .match(/@version\s+([\d.]+)/) || [])[1] || '';
    console.log('设备脚本 v' + (installed || '?') + '  ·  dist v' + distVer);
    if (installed !== distVer) {
        console.log('!! 设备脚本与 dist 版本不一致，本轮结论无效（先换版）');
        process.exitCode = 1;
        return;
    }
    const mem0 = meminfo();
    console.log('meminfo 起始: ' + (mem0 ? (mem0 / 1024).toFixed(1) + 'MB' : '?'));

    await fetch(BASE + '/__report/clear');
    const pageTag = 'r' + Date.now();
    // 清单用每轮唯一的路径：续播进度按 host+path 做 key（vvVideoKey 刻意忽略 query），
    // 固定路径会被上一轮的进度记忆带飞起播位置
    writeManifest(pageTag);
    const url = `${BASE}/e2e/seekbuf-android-${pageTag}.html?vvdebug=1&list=seekbuf-${pageTag}`;
    console.log('打开页面: ' + url);
    sh(['shell', 'am force-stop mark.via']);
    await sleep(1200);
    sh(['shell', `am start -n mark.via/.Shell -a android.intent.action.VIEW -d '${url}'`]);

    let memFar = null, memBack = null;
    const t0 = Date.now();
    let done = false;
    while (Date.now() - t0 < LIMIT_S * 1000) {
        await sleep(500);
        const rows = readRows().filter((r) => r.run === pageTag);
        if (!memFar && rows.some((r) => r.tag === 'memphase' && r.name === 'after-far-seek')) {
            memFar = meminfo();
            console.log('meminfo 跳远缓冲稳定后: ' + (memFar ? (memFar / 1024).toFixed(1) + 'MB' : '?'));
        }
        if (rows.some((r) => r.tag === 'done')) {
            memBack = meminfo();
            done = true;
            break;
        }
        // adb reverse 保活（daemon 被回收时映射会丢）
        if ((Date.now() - t0) % 10000 < 500) {
            execFileSync(ADB, ['connect', SERIAL], { encoding: 'utf8', timeout: 15000 });
            sh(['reverse', `tcp:${PORT}`, `tcp:${PORT}`]);
        }
    }
    if (!done) {
        const rows = readRows().filter((r) => r.run === pageTag);
        const fatal = rows.find((r) => r.tag === 'fatal');
        console.log('FAIL: 超时没有等到 done。' + (fatal ? 'fatal=' + fatal.msg : '最后上报：' +
            JSON.stringify(rows[rows.length - 1] || {})));
        process.exitCode = 1;
        return;
    }
    const rows = readRows().filter((r) => r.run === pageTag);
    const fin = rows.find((r) => r.tag === 'done');
    const oks = rows.filter((r) => r.tag === 'ok');
    const fatal = rows.find((r) => r.tag === 'fatal');
    console.log('\n=== 断言 ===');
    for (const o of oks) console.log((o.pass ? '  ✓ ' : '  ✗ ') + o.name + (o.detail ? '  [' + o.detail + ']' : ''));
    if (fatal) console.log('  fatal: ' + fatal.msg);
    console.log('\nmeminfo: 起始 ' + (mem0 ? (mem0 / 1024).toFixed(1) : '?') + 'MB → 跳远后 ' +
        (memFar ? (memFar / 1024).toFixed(1) : '?') + 'MB → 回跳后 ' + (memBack ? (memBack / 1024).toFixed(1) : '?') + 'MB');
    const pass = fin && fin.pass && oks.length && oks.every((o) => o.pass);
    console.log(pass ? '\nRESULT: PASS' : '\nRESULT: FAIL');
    if (!pass) process.exitCode = 1;
}

main().catch((e) => { console.error('驱动异常: ' + (e && e.message)); process.exitCode = 1; });
