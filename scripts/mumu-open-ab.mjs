// 起播对照真机探针（MuMu + Via）
//   node scripts/mumu-open-ab.mjs
//   SRC="https://.../Big_Buck_Bunny_1080_10s_5MB.mp4" node scripts/mumu-open-ab.mjs
//
// 为什么要有这一份：用户反馈「网页播放器很顺，插件播放器又慢又卡」，而桌面 headless
// 测出来的差距只有 20–100ms，和环境不符。桌面走 SwiftShader、也没有真实的 MediaCodec，
// 起播这种事只能在真机 WebView 上看。
//
// 做法：同一路 mp4，先让页面自己的 <video> 播一遍，再用内置播放器播一遍，
// 各量「点下去 → 出第一帧」以及出画后 3 秒的 rAF 帧间隔；两轮交替顺序抵消缓存偏差。
//
// 前置：MuMu 已启动、Via 已装脚本、adb 可连；本地服务由脚本自行拉起。
// MODE=resume：只跑「看完再点开同一个视频」的复核，验续播位置修复。
// 环境变量：ADB、SERIAL（默认 127.0.0.1:16384）、PORT（默认 8099）、SRC、MODE
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
const SRC = process.env.SRC || 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/1080/Big_Buck_Bunny_1080_10s_5MB.mp4';
const MODE = process.env.MODE || 'ab';

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
function median(list) {
    const a = list.filter((x) => Number.isFinite(x)).slice().sort((x, y) => x - y);
    if (!a.length) return 0;
    return a.length % 2 ? a[(a.length - 1) / 2] : (a[a.length / 2 - 1] + a[a.length / 2]) / 2;
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
    const url = `${BASE}/e2e/open-ab-android-${pageTag}.html?vvdebug=1&expect=${distVer}` +
        `&src=${encodeURIComponent(SRC)}` + (MODE === 'resume' ? '&mode=resume' : '');
    console.log('期望脚本版本: v' + distVer + '  ·  本轮标识 ' + pageTag);
    console.log('素材: ' + SRC + '\n');
    sh(['shell', 'am force-stop mark.via']);
    await sleep(1000);
    sh(['shell', `am start -n mark.via/.Shell -a android.intent.action.VIEW -d '${url}'`]);
    console.log('打开页面: ' + url + '\n');

    let done = false;
    let rows = [];
    for (let i = 0; i < 400; i++) {
        await sleep(300);
        rows = readRows().filter((r) => r.run === pageTag);
        if (rows.some((r) => r.tag === 'done')) { done = true; break; }
    }

    const env = rows.find((r) => r.tag === 'env') || {};
    console.log('环境：Via 脚本 v' + (env.version || '?') + ' · 视口 ' +
        (env.vw || '?') + '×' + (env.vh || '?') + ' · dpr ' + (env.dpr || '?'));

    if (MODE === 'resume') {
        const rs = rows.filter((r) => r.tag === 'resume');
        if (!rs.length) {
            console.log('\n!! 没收到 resume 结果' + (rows.find((r) => r.tag === 'fatal') ? '：' + rows.find((r) => r.tag === 'fatal').err : ''));
            process.exitCode = 1;
        } else {
            const r = rs[0];
            console.log('\n=== 看完再打开（同一 URL） ===');
            console.log('第一遍自己播完后关闭: ' + (r.closedBySelf ? '是' : '否'));
            console.log('第二遍 3.2s 后: 仍在播放器=' + r.active + ' 暂停=' + r.paused +
                ' 位置=' + r.cur + 's / 时长=' + r.dur + 's');
            console.log(r.ok ? '✓ 从 0 重新开始，没有「点开就自己关」' : '✗ 仍然异常：' + JSON.stringify(r));
            if (!r.ok) process.exitCode = 1;
        }
    } else {
    const arms = rows.filter((r) => r.tag === 'arm');
    const nats = arms.filter((a) => a.arm === 'native');
    const plugs = arms.filter((a) => a.arm === 'plugin');

    console.log('\n=== 各轮原始 ===');
    for (const a of arms) {
        console.log(('第' + a.round + '轮 ' + a.arm).padEnd(16) +
            '起播 ' + String(a.ttff).padStart(8) + 'ms' +
            '  元数据 ' + String(a.loadedmetadata ?? '-').padStart(7) +
            '  首帧数据 ' + String(a.loadeddata ?? '-').padStart(7) +
            '  canplay ' + String(a.canplay ?? '-').padStart(7) +
            '  [' + (a.vw || 0) + '×' + (a.vh || 0) + ' / ' + a.frames + ' 帧 / avg ' + a.avgGap +
            'ms / 长帧 ' + a.slowRate + '%]' + (a.err ? ' ERR=' + a.err : ''));
        // 插件臂的状态轨迹：判断「一直没出画」到底是没起播、还是节点不在渲染树里
        if (a.arm === 'plugin' && a.trace && a.trace.length) {
            const t = a.trace;
            const pick = [t[0], t[Math.floor(t.length / 4)], t[Math.floor(t.length / 2)],
                t[Math.floor(t.length * 3 / 4)], t[t.length - 1]];
            console.log('   轨迹 ' + pick.map((x) => `t=${x.t} rs=${x.rs} paused=${x.p} ct=${x.ct} dom=${x.dom} vis=${x.vis} act=${x.act}`).join('  |  '));
        }
    }
    if (!nats.length || !plugs.length) {
        console.log('\n!! 数据不完整：原生 ' + nats.length + ' 轮 / 插件 ' + plugs.length + ' 轮');
        const fatal = rows.find((r) => r.tag === 'fatal');
        if (fatal) console.log('   fatal: ' + fatal.err);
        process.exitCode = 1;
    } else {
        const m = (rs, k) => +median(rs.map((r) => r[k])).toFixed(1);
        const nm = (k) => m(nats, k), pm = (k) => m(plugs, k);
        const pad = (s, n) => String(s).padStart(n);
        console.log('\n指标（中位数）' + pad('原生', 12) + pad('内置播放器', 14) + pad('差值', 12));
        console.log('-'.repeat(50));
        const line = (label, k, unit) => {
            const a = nm(k), b = pm(k);
            console.log(label.padEnd(18) + pad(a + unit, 12) + pad(b + unit, 14) +
                pad((b - a >= 0 ? '+' : '') + +(b - a).toFixed(1) + unit, 12));
        };
        line('起播到首帧', 'ttff', 'ms');
        line('解码尺寸(高)', 'vh', 'px');
        line('出画后帧间隔', 'avgGap', 'ms');
        line('P95 帧间隔', 'p95Gap', 'ms');
        line('长帧率', 'slowRate', '%');
        console.log('-'.repeat(50));

        const dTtff = pm('ttff') - nm('ttff');
        const title = dTtff > 400 ? '插件明显更慢' : dTtff > 150 ? '插件略慢' : '两者基本一致';
        console.log('\n起播差 ' + (dTtff >= 0 ? '+' : '') + dTtff.toFixed(0) + 'ms → ' + title);
        const dSlow = pm('slowRate') - nm('slowRate');
        console.log('播放期长帧率差 ' + (dSlow >= 0 ? '+' : '') + dSlow.toFixed(2) + 'pp' +
            (dSlow > 3 ? ' → 出画后确实更卡，往 UI 合成/解码器方向查' : ' → 出画后不卡，问题只在起播段'));

        // 插件臂必须真的是冷起播：元素出现得太早往往意味着复用了上一轮的旧节点
        const bad = plugs.filter((p) => !(p.ttff > 0) || !(p.vh > 0) || p.frameHow === 'timeout');
        if (bad.length) {
            console.log('!! 插件臂有 ' + bad.length + ' 轮没拿到有效首帧：' +
                bad.map((b) => JSON.stringify({ r: b.round, ttff: b.ttff, vh: b.vh, how: b.frameHow, err: b.err })).join(' '));
            process.exitCode = 1;
        }
    }
    }
    if (!done) { console.log('!! 页面没跑完（未收到 done），结果可能不全'); process.exitCode = 1; }
} catch (e) {
    console.error('起播对照探针失败: ' + (e && e.message));
    process.exit(1);
} finally {
    if (server) server.kill();
}
