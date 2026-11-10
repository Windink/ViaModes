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
// MODE=hls：换 HLS 素材（默认 mux 的多档 VOD），网页臂 = 页面自己 new 插件内联的同一份
//   hls.js 挂裸 <video>，插件臂 = __vv.open(type=HLS)，比的是「网页自己的 hls.js 播放」
//   与「我们包一层之后」的差异。PHASE=churn 时播放器底下加一层一直在动的元素，
//   模拟真实站点（弹幕/广告/轮播），验证「页面在动」是不是卡顿来源。
// 环境变量：ADB、SERIAL（默认 127.0.0.1:16384）、PORT（默认 8099）、SRC、MODE、PHASE、ARMS
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
const SRC = process.env.SRC || (process.env.MODE === 'hls'
    // 480p 单档：两臂都一样，ABR 不参与，量的纯粹是「包一层之后」的差异。
    // 走 serve.mjs 的 /__hls 镜像（第一次从公网拉、之后本地缓存），
    // 否则国内拉 mux 的 1080p 分片要 20s+，两臂都卡在网络上看不出播放器差异。
    ? '/__hls?u=' + encodeURIComponent('https://test-streams.mux.dev/x36xhzz/url_6/193039199_mp4_h264_aac_hq_7.m3u8')
    : 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/1080/Big_Buck_Bunny_1080_10s_5MB.mp4');
const MODE = process.env.MODE || 'ab';
const PHASE = process.env.PHASE || 'quiet';
const ARMS = process.env.ARMS || 'page,plugin';

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

// HLS 对照的报告：按「场景（静止/页面在动）× 臂」汇总。
// 判据只看两件事——能不能出画、出画后卡不卡；档位交给 ABR，不当成失败条件
// （带宽不够时停在低档是正常行为，压画质才是 bug）。
function reportHls(rows) {
    const arms = rows.filter((r) => r.tag === 'arm');
    if (!arms.length) {
        console.log('\n!! 没收到任何臂的数据' + (rows.find((r) => r.tag === 'fatal')
            ? '：' + rows.find((r) => r.tag === 'fatal').err : ''));
        process.exitCode = 1;
        return;
    }
    const phases = [...new Set(arms.map((a) => a.phase || 'quiet'))];
    let failed = 0;
    for (const ph of phases) {
        const inPh = arms.filter((a) => (a.phase || 'quiet') === ph);
        console.log(`\n=== 场景：${ph === 'churn' ? '页面在动（弹幕/广告类）' : '页面静止'} ===`);
        for (const a of inPh) {
            console.log((`第${a.round}轮 ${a.arm}`).padEnd(18) +
                '起播 ' + String(a.ttff ?? '-').padStart(8) + 'ms' +
                '  清单 ' + String(a.manifest ?? '-').padStart(7) +
                '  首帧 ' + String(a.loadeddata ?? '-').padStart(7) +
                '  选档 ' + String((a.vh || a.lvlH || 0) + 'p').padStart(6) +
                '  [' + String(a.frames ?? 0).padStart(3) + ' 帧 / avg ' + a.avgGap +
                'ms / p95 ' + a.p95Gap + ' / 长帧 ' + a.slowRate + '%]' +
                '  估算 ' + Math.round((a.est || 0) / 1000) + 'kbps  缓冲 ' + (a.buf ?? '-') + 's' +
                (a.fatal ? '  FATAL=' + a.fatal : '') + (a.err ? '  ERR=' + a.err : ''));
            // 里程碑拆解：起播到底卡在「引擎/缓冲」还是「合成出画」，
            // 只看一个 TTFF 数字是分不出来的。
            const mile = ['rs1', 'rs2', 'rs3', 'rs4', 'loadedmetadata', 'loadeddata', 'canplay', 'playing', 'waiting']
                .filter((k) => a[k] != null)
                .map((k) => k + '=' + Math.round(a[k]));
            if (mile.length) console.log('    里程碑 ' + mile.join('  '));
        }
        const groups = [...new Set(inPh.map((a) => a.arm))];
        const m = (g, k) => +median(inPh.filter((a) => a.arm === g).map((a) => a[k])).toFixed(1);
        const pad = (s, n) => String(s).padStart(n);
        console.log('\n指标（中位数）' + groups.map((g) => pad(g, 14)).join(''));
        console.log('-'.repeat(18 + groups.length * 14));
        for (const [label, k, unit] of [['起播到首帧', 'ttff', 'ms'], ['清单解析', 'manifest', 'ms'],
            ['解码高度', 'vh', 'p'], ['出画后帧间隔', 'avgGap', 'ms'], ['长帧率', 'slowRate', '%'],
            ['缓冲余量', 'buf', 's']]) {
            console.log(label.padEnd(16) + groups.map((g) => pad(m(g, k) + unit, 14)).join(''));
        }
        const base = groups.includes('page') ? 'page' : groups[0];
        if (groups.includes('plugin') && base !== 'plugin') {
            const dT = m('plugin', 'ttff') - m(base, 'ttff');
            const dS = m('plugin', 'slowRate') - m(base, 'slowRate');
            console.log('\n起播差 ' + (dT >= 0 ? '+' : '') + dT.toFixed(0) + 'ms → ' +
                (dT > 400 ? '插件明显更慢' : dT > 150 ? '插件略慢' : '两者基本一致'));
            console.log('播放期长帧率差 ' + (dS >= 0 ? '+' : '') + dS.toFixed(2) + 'pp → ' +
                (dS > 3 ? '出画后确实更卡，往 UI 合成/解码器方向查' : '出画后不卡'));
            if (dT > 400 || dS > 3) failed++;
        }
        const bad = inPh.filter((a) => !(a.ttff > 0) || !(a.vh > 0) || a.frameHow === 'timeout');
        if (bad.length) {
            console.log('!! ' + bad.length + ' 个臂没拿到有效首帧：' +
                bad.map((b) => JSON.stringify({ arm: b.arm, r: b.round, ttff: b.ttff, how: b.frameHow })).join(' '));
            failed++;
        }
    }
    if (failed) process.exitCode = 1;
    else console.log('\n✓ 两臂都能出画，出画后的帧间隔没有实质差距');
}

// HLS 臂要比的是播放器，不是 CDN：先把本轮要用的分片拉一遍进本地缓存，
// 之后两臂都从 loopback 取，网络这一项对双方才是一致的。
async function warmHls() {
    if (MODE !== 'hls') return;
    const N = Number(process.env.WARM || 5);
    const pl = SRC.charAt(0) === '/' ? BASE + SRC : SRC;
    let txt = '';
    try {
        const r = await fetch(pl);
        if (!r.ok) throw new Error('清单 ' + r.status);
        txt = await r.text();
    } catch (e) {
        console.log('!! 预热失败：' + (e && e.message));
        return;
    }
    const segs = txt.split('\n').map((l) => l.trim()).filter((l) => l && l[0] !== '#').slice(0, N);
    if (!segs.length) { console.log('!! 清单里没有分片'); return; }
    console.log(`预热 ${segs.length} 个分片（第一次从公网拉，之后两臂都走本地缓存）…`);
    for (let i = 0; i < segs.length; i++) {
        const u = segs[i].charAt(0) === '/' ? BASE + segs[i] : segs[i];
        const t = Date.now();
        try {
            const r = await fetch(u);
            const b = await r.arrayBuffer();
            console.log(`  分片 ${i + 1}/${segs.length}  ${r.status}  ${(b.byteLength / 1024).toFixed(0)}KB  ${Date.now() - t}ms`);
        } catch (e) { console.log(`  分片 ${i + 1} 失败：${e && e.message}`); }
    }
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
    console.log('素材: ' + SRC);
    await warmHls();
    const distVer = (readFileSync(join(ROOT, 'dist/via-video-player.user.js'), 'utf8')
        .match(/@version\s+([\d.]+)/) || [])[1] || '';
    const pageTag = 'r' + Date.now();
    const pageBase = MODE === 'hls' ? 'open-ab-hls-android' : 'open-ab-android';
    const url = `${BASE}/e2e/${pageBase}-${pageTag}.html?vvdebug=1&expect=${distVer}` +
        `&src=${encodeURIComponent(SRC)}` + (MODE === 'resume' ? '&mode=resume' : '') +
        (MODE === 'hls' ? `&arms=${encodeURIComponent(ARMS)}&phase=${encodeURIComponent(PHASE)}` +
            (process.env.ROUNDS ? `&rounds=${encodeURIComponent(process.env.ROUNDS)}` : '') : '');
    console.log('期望脚本版本: v' + distVer + '  ·  本轮标识 ' + pageTag);
    console.log("");
    sh(['shell', 'am force-stop mark.via']);
    await sleep(1000);
    sh(['shell', `am start -n mark.via/.Shell -a android.intent.action.VIEW -d '${url}'`]);
    console.log('打开页面: ' + url + '\n');

    let done = false;
    let rows = [];
    const maxWait = MODE === 'hls' ? (PHASE === 'both' ? 1400 : 800) : 400;
    for (let i = 0; i < maxWait; i++) {
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
    } else if (MODE === 'hls') {
        console.log('场景: ' + PHASE + '  ·  臂: ' + ARMS);
        reportHls(rows);
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
