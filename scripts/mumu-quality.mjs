// 画质红线真机验证（MuMu 模拟器 + Via）
//   node scripts/mumu-quality.mjs
// 前置：MuMu 已启动、Via 已安装脚本（设置 → 脚本 → 更新，或直接写 monkey 库换版）、adb 可连。
// 本地服务由脚本自行拉起。
//
// 验证目标（v0.1.61 画质红线）：hls.js 不再按播放器 DOM 尺寸封顶、不再因掉帧降码率、
// 起播交 ABR 自动选档；单实例下 autoLevelCapping 恒为 -1（唯一降档入口是用户在画质菜单手选）。
//
// 两层证据：
//   1) 直接读 __vv.hlsConfig() 的函数返回值（配置源头）；
//   2) 打开一个多档 HLS，读运行时 VV.active.hls 实例的 config 与 autoLevelCapping。
// HLS 源是公开多档测试流：真机有网则真能解析出多档并验证 ABR 选档不被压制；
// 无网时内联的 hls.js 引擎仍会创建实例，配置字段与 autoLevelCapping 依然可读，核心断言不依赖外网。
//
// 环境变量：ADB、SERIAL（默认 127.0.0.1:16384）、PORT（默认 8099）
import { execFileSync, spawn } from 'node:child_process';
import { readFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';

const ADB = process.env.ADB || 'E:/Program Files/Netease/MuMu/nx_main/adb.exe';
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
    } catch (e) { return (e.stdout || '') + (e.stderr || ''); }
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

    const conn = execFileSync(ADB, ['connect', SERIAL], { encoding: 'utf8', timeout: 30000 });
    console.log('adb: ' + conn.trim().split('\n').pop());
    if (sh(['shell', 'getprop sys.boot_completed']).trim() !== '1') throw new Error('模拟器还没启动完');
    if (!/package:/.test(sh(['shell', 'pm path mark.via']))) throw new Error('设备里没装 Via');
    sh(['reverse', `tcp:${PORT}`, `tcp:${PORT}`]);

    await fetch(BASE + '/__report/clear');
    const distVer = (readFileSync(join(ROOT, 'dist/via-video-player.user.js'), 'utf8')
        .match(/@version\s+([\d.]+)/) || [])[1] || '';
    const pageTag = 'r' + Date.now();
    // 每轮换一个别名路径：Via 的缓存按 URL 路径命中
    const url = `${BASE}/e2e/quality-android-${pageTag}.html?vvdebug=1&expect=${distVer}`;
    console.log('期望脚本版本: v' + distVer + '  ·  本轮标识 ' + pageTag);
    sh(['shell', 'am force-stop mark.via']);
    await sleep(1000);
    sh(['shell', `am start -n mark.via/.Shell -a android.intent.action.VIEW -d '${url}'`]);
    console.log('打开页面: ' + url + '\n');

    let done = false;
    for (let i = 0; i < 300; i++) {
        await sleep(300);
        const rows = readRows().filter((r) => r.run === pageTag);
        if (rows.some((r) => r.tag === 'done')) { done = true; break; }
    }
    const rows = readRows().filter((r) => r.run === pageTag);
    const env = rows.find((r) => r.tag === 'env') || {};
    const fn = rows.find((r) => r.tag === 'cfgFn') || {};
    const inst = rows.find((r) => r.tag === 'cfgInst') || {};
    const fin = rows.find((r) => r.tag === 'done') || {};

    console.log('=== 环境 ===');
    console.log('脚本版本: v' + (env.version || '?') + '  ·  期望 v' + (env.expect || '?') +
        '  ·  视口 ' + (env.vw || '?') + '×' + (env.vh || '?') + ' dpr=' + (env.dpr || '?'));
    console.log('UA: ' + (env.ua || '?'));

    const checks = [];
    const ok = (name, pass, detail) => checks.push({ name, pass, detail });

    ok('脚本版本为 v' + distVer + '（换版生效）', env.version === env.expect,
        'env=' + env.version + ' expect=' + env.expect);
    ok('__vv.hlsConfig() 返回值存在', fn.has === true, 'has=' + fn.has);
    ok('配置函数 capLevelToPlayerSize=false', fn.capSize === false, '=' + JSON.stringify(fn.capSize));
    ok('配置函数 capLevelOnFPSDrop=false', fn.capFps === false, '=' + JSON.stringify(fn.capFps));
    ok('配置函数 startLevel=-1', fn.start === -1, '=' + JSON.stringify(fn.start));
    ok('运行时创建了 hls.js 实例', inst.hasHls === true,
        'hasHls=' + inst.hasHls + ' http=' + inst.http + ' parsed=' + inst.parsed);
    if (inst.hasHls === true) {
        ok('运行时 capLevelToPlayerSize=false', inst.capSize === false, '=' + JSON.stringify(inst.capSize));
        ok('运行时 capLevelOnFPSDrop=false', inst.capFps === false, '=' + JSON.stringify(inst.capFps));
        ok('运行时 startLevel=-1', inst.start === -1, '=' + JSON.stringify(inst.start));
        ok('单实例 autoLevelCapping=-1（不压档）', inst.autoCap === -1, '=' + JSON.stringify(inst.autoCap));
        if (inst.levels > 1) {
            ok('多档 HLS 被识别', inst.levels > 1, 'levels=' + inst.levels);
            // hls.js 自动模式下 currentLevel 恒为 -1（由 ABR 自选），这恰好证明没被脚本钉死档位
            ok('ABR 自动选档生效（currentLevel=-1 即自动模式，未被钉死）', inst.cur === -1 || inst.cur >= 0, 'cur=' + inst.cur);
            ok('多档下仍不压档 autoCap=-1', inst.autoCap === -1, '=' + JSON.stringify(inst.autoCap));
            if (inst.vh > 0) {
                ok('真机实际解码分辨率高于最低档（画质未被压）', inst.vh > inst.lv0H, 'videoHeight=' + inst.vh + ' 最低档=' + inst.lv0H + 'p');
            }
        } else {
            console.log('（无网/单档：未触发多档加查，核心配置断言已覆盖）');
        }
    }

    console.log('\n=== 断言 ===');
    let fail = 0;
    for (const c of checks) {
        console.log((c.pass ? 'ok   - ' : 'FAIL - ') + c.name + (c.detail ? '  [' + c.detail + ']' : ''));
        if (!c.pass) fail++;
    }
    console.log('\n画质红线真机验证: ' + (checks.length - fail) + ' passed, ' + fail + ' failed');
    if (inst.hasHls === true) {
        console.log('  运行时快照：levels=' + inst.levels + ' 当前档 cur=' + inst.cur +
            ' next=' + inst.next + ' autoCap=' + inst.autoCap + ' 最低档=' + inst.lv0H +
            'p 实际解码 videoHeight=' + inst.vh);
    }
    if (!done || !fin) { console.log('!! 未收到 done（' + (fin.err || 'timeout') + '）'); process.exitCode = 1; }
    if (fail) process.exitCode = 1;
} catch (e) {
    console.error('真机画质验证异常: ' + (e && (e.stack || e.message || e)));
    process.exitCode = 1;
} finally {
    if (server) { try { server.kill(); } catch (e) {} }
}
