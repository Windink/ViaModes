// 多档 HLS · ABR 选档对照（MuMu 模拟器 + Via）
//   node scripts/mumu-abr.mjs
// 前置：MuMu 已启动、Via 脚本版本 = dist；本地 8099（静态）与 8481（限速）可由本脚本自行拉起。
//
// 桌面 v0.1.64 的起播对照里留了个观察：「主清单下我们起播档反而更保守（836kbps vs 2149kbps）」。
// 这轮在真机上做多档配对：同一份 4 档主清单、同一档限速，交替跑「页面自己用裸 hls.js」与
// 「内置播放器」，量起播档 / 最终档 / 爬档轨迹，判断产品配置有没有把 ABR 带偏。
//
// 素材是真机可控的伪多档：4 个子清单声明不同 BANDWIDTH/RESOLUTION，但指向同一批本地分片、
// 同一档限速。所以 videoHeight 不会随档位变——本轮只量「选档逻辑」，不验分辨率一致性。
// 分片 URL 必须写绝对地址，否则清单的 query 会串到分片上（见 skills/mumu-harness）。
//
// 环境变量：ADB、SERIAL、PORT（默认 8099）、SLOW_PORT（默认 8481）
import { execFileSync, spawn } from 'node:child_process';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';

const ADB = process.env.ADB || 'E:/android-tools/platform-tools/adb.exe';
const SERIAL = process.env.SERIAL || '127.0.0.1:16384';
const PORT = Number(process.env.PORT || 8099);
const SLOW_PORT = Number(process.env.SLOW_PORT || 8481);
const BASE = `http://127.0.0.1:${PORT}`;
const SLOW_BASE = `http://127.0.0.1:${SLOW_PORT}`;
const ROOT = process.cwd();
const REPORT = join(ROOT, '.tmp/report.log');

// ---- 门槛：先写死再看数 ----
const LEVEL_BWS = [240000, 600000, 1500000, 3000000];
const LEVEL_RES = ['426x240', '640x360', '1280x720', '1920x1080'];
const BW_KBPS = { low: 80, high: 400 };          // slow-serve 的 kbps 实为 KB/s
const FINAL_DIFF_LIMIT = 1;                       // 同带宽两臂最终档允许差 1 档
const MAX_FRAME_LEVELS = 4;

let staticSrv = null, slowSrv = null;

function sh(args) {
    try {
        execFileSync(ADB, ['connect', SERIAL], { encoding: 'utf8', timeout: 30000 });
        return execFileSync(ADB, ['-s', SERIAL, ...args], {
            encoding: 'utf8', maxBuffer: 32 * 1024 * 1024, timeout: 30000
        });
    } catch (e) { return (e.stdout || '') + (e.stderr || ''); }
}
async function alive(url) {
    try { await fetch(url, { signal: AbortSignal.timeout(2500) }); return true; } catch (e) { return false; }
}
function readRows() {
    let txt = '';
    try { txt = readFileSync(REPORT, 'utf8'); } catch (e) { return []; }
    return txt.trim().split('\n').filter(Boolean).map((l) => {
        try { return JSON.parse(l); } catch (e) { return null; }
    }).filter(Boolean);
}
function lastValid(cur) {
    for (let i = cur.length - 1; i >= 0; i--) if (cur[i] >= 0) return cur[i];
    return -1;
}
function firstValid(cur) {
    for (const x of cur) if (x >= 0) return x;
    return -1;
}
function switches(cur) {
    let n = 0, prev = null;
    for (const x of cur) { if (x < 0) continue; if (prev !== null && x !== prev) n++; prev = x; }
    return n;
}
const bwText = (i) => (i >= 0 && i < LEVEL_BWS.length ? Math.round(LEVEL_BWS[i] / 1000) + 'k' : '档' + i);

// 每档带宽各写一套子清单 + 一份主清单；分片挂绝对地址与限速参数
function writeManifests() {
    const dir = join(ROOT, '.tmp', 'hls-gen');
    mkdirSync(dir, { recursive: true });
    const made = {};
    for (const [name, kbps] of Object.entries(BW_KBPS)) {
        const child = [];
        for (let i = 0; i < LEVEL_BWS.length; i++) {
            const fn = `abr-${name}-${i}.m3u8`;
            const segs = [0, 1].map((s) =>
                `#EXTINF:10.000,\n${SLOW_BASE}/e2e/media/hls/seg${s}.ts?kbps=${kbps}`).join('\n');
            writeFileSync(join(dir, fn), ['#EXTM3U', '#EXT-X-VERSION:3',
                '#EXT-X-TARGETDURATION:10', '#EXT-X-MEDIA-SEQUENCE:0', segs,
                '#EXT-X-ENDLIST', ''].join('\n'));
            child.push(`#EXT-X-STREAM-INF:BANDWIDTH=${LEVEL_BWS[i]},RESOLUTION=${LEVEL_RES[i]},` +
                `CODECS="avc1.42e01e,mp4a.40.2"\n${BASE}/.tmp/hls-gen/${fn}`);
        }
        const masterFn = `abr-${name}.m3u8`;
        writeFileSync(join(dir, masterFn), ['#EXTM3U', ...child, ''].join('\n'));
        made[name] = `${BASE}/.tmp/hls-gen/${masterFn}`;
    }
    return made;
}

try {
    mkdirSync(join(ROOT, '.tmp'), { recursive: true });
    if (await alive(BASE + '/e2e/index.html')) console.log('复用已运行的静态服务');
    else {
        staticSrv = spawn(process.execPath, ['scripts/serve.mjs'], {
            cwd: ROOT, env: { ...process.env, PORT: String(PORT) }, stdio: 'ignore'
        });
        for (let i = 0; i < 60 && !(await alive(BASE + '/e2e/index.html')); i++) await sleep(150);
        if (!(await alive(BASE + '/e2e/index.html'))) throw new Error('静态服务没起来');
        console.log('本次启动静态服务');
    }
    if (await alive(SLOW_BASE + '/health')) console.log('复用已运行的限速服务');
    else {
        slowSrv = spawn(process.execPath, ['scripts/slow-serve.mjs'], {
            cwd: ROOT, env: { ...process.env, SLOW_PORT: String(SLOW_PORT) }, stdio: 'ignore'
        });
        for (let i = 0; i < 60 && !(await alive(SLOW_BASE + '/health')); i++) await sleep(150);
        if (!(await alive(SLOW_BASE + '/health'))) throw new Error('限速服务没起来');
        console.log('本次启动限速服务');
    }

    const conn = execFileSync(ADB, ['connect', SERIAL], { encoding: 'utf8', timeout: 30000 });
    console.log('adb: ' + conn.trim().split('\n').pop());
    if (sh(['shell', 'getprop sys.boot_completed']).trim() !== '1') throw new Error('模拟器还没启动完');
    if (!/package:/.test(sh(['shell', 'pm path mark.via']))) throw new Error('设备里没装 Via');

    const distVer = (readFileSync(join(ROOT, 'dist/via-video-player.user.js'), 'utf8')
        .match(/@version\s+([\d.]+)/) || [])[1] || '';
    const M = writeManifests();
    const pageTag = 'r' + Date.now();
    const url = `${BASE}/e2e/abr-android-${pageTag}.html?vvdebug=1&expect=${distVer}` +
        '&low=' + encodeURIComponent(M.low) + '&high=' + encodeURIComponent(M.high);
    console.log('期望脚本版本 v' + distVer + '  ·  本轮标识 ' + pageTag);
    console.log('主清单: low=' + M.low + '  high=' + M.high + '\n');

    await fetch(BASE + '/__report/clear');
    sh(['shell', 'am force-stop mark.via']);
    // 开页前两个端口都要映射并复核；adbd 重启会清空
    function keepReverse() {
        sh(['reverse', `tcp:${PORT}`, `tcp:${PORT}`]);
        sh(['reverse', `tcp:${SLOW_PORT}`, `tcp:${SLOW_PORT}`]);
    }
    keepReverse();
    console.log('reverse: ' + sh(['reverse', '--list']).trim().replace(/\s+/g, ' '));
    await sleep(1200);
    keepReverse();
    // 裸臂的 video 是页面自己建的，Via 会挡自动播放；点屏制造真实用户激活。
    // 坐标按设备分辨率算，落在页面下方空白区（避开地址栏与顶部 HUD）。
    const sm = /(\d+)x(\d+)/.exec(sh(['shell', 'wm size']));
    const tapX = sm ? Math.floor(Number(sm[1]) / 2) : 400;
    const tapY = sm ? Math.floor(Number(sm[2]) * 0.6) : 900;
    sh(['shell', `am start -n mark.via/.Shell -a android.intent.action.VIEW -d '${url}'`]);
    console.log('打开页面: ' + url);
    console.log('用户激活点击: (' + tapX + ', ' + tapY + ')\n');

    let done = false, seen = -1;
    const tapped = new Set();
    for (let i = 0; i < 240; i++) {           // 4 臂 × 12s + 开页 ≈ 60s，给 120s
        await sleep(500);
        // 保活：开完页不碰 adb 会让 daemon 被回收、reverse 清空，页面上报只剩 boot
        if (i % 4 === 0) keepReverse();
        const cur = readRows().filter((r) => r.run === pageTag);
        // 每个裸臂开始前页面会要一次新点击：Via 的自动播放解锁有时效，
        // 距上次交互几十秒后新建的 video 又会被 page autoplay blocked 挡掉。
        for (const g of cur.filter((r) => r.tag === 'need-gesture')) {
            if (!tapped.has(g.index)) {
                tapped.add(g.index);
                sh(['shell', `input tap ${tapX} ${tapY}`]);
                console.log('  · 给第 ' + (g.index + 1) + ' 臂补一次用户激活点击');
            }
        }
        if (cur.some((r) => r.tag === 'done')) { done = true; break; }
        const n = cur.filter((r) => r.tag === 'arm').length;
        if (n !== seen) { console.log(`  · 完成 ${n}/4 臂（${((i + 1) / 2).toFixed(0)}s）`); seen = n; }
        else if ((i + 1) % 20 === 0) console.log(`  … 等待中（${((i + 1) / 2).toFixed(0)}s，${n}/4 臂）`);
    }

    const rows = readRows().filter((r) => r.run === pageTag);
    const env = rows.find((r) => r.tag === 'env') || {};
    const oks = rows.filter((r) => r.tag === 'ok');
    const arms = rows.filter((r) => r.tag === 'arm');
    const fin = rows.find((r) => r.tag === 'done');
    const by = (kind, bw) => arms.find((a) => a.kind === kind && a.bw === bw);

    console.log('\n=== 环境 ===');
    console.log('脚本版本: v' + (env.version || 'none') + '  ·  期望 v' + (env.expect || '?') +
        '  ·  裸 hls.js ' + (env.hlsVer || '?') + '  ·  视口 ' + (env.vw || '?') + '×' + (env.vh || '?'));

    console.log('\n=== 各臂 ABR 选档（声明带宽 240k / 600k / 1500k / 3000k）===');
    console.log('臂          起播档   最终档   切档次数   首帧     autoCap   err');
    const summary = {};
    for (const a of arms) {
        const s = { start: firstValid(a.cur), final: lastValid(a.cur),
            sw: switches(a.cur), frame: a.firstFrameAt, cap: a.autoCap };
        summary[a.kind + '/' + a.bw] = s;
        console.log((a.kind + '/' + a.bw).padEnd(11) + bwText(s.start).padStart(7) +
            bwText(s.final).padStart(9) + String(s.sw).padStart(9) +
            String(s.frame).padStart(9) + String(s.cap).padStart(10) + '   ' + (a.err || 'none'));
    }
    for (const a of arms.filter((x) => x.diag)) {
        console.log('  裸臂现场 ' + a.bw + ': ' + JSON.stringify(a.diag));
    }
    console.log('\n注：4 档共用同一批本地分片与同一档限速，是「伪多档」——videoHeight 不会随档位变，');
    console.log('    本轮只量选档逻辑差异，不验分辨率一致性（那由 mumu-quality 的真实多档流覆盖）。');

    // ---- 结论 ----
    const lowDiff = summary['site/low'] && summary['ours/low']
        ? Math.abs(summary['site/low'].final - summary['ours/low'].final) : 99;
    const highDiff = summary['site/high'] && summary['ours/high']
        ? Math.abs(summary['site/high'].final - summary['ours/high'].final) : 99;
    const riseSite = summary['site/high'] && summary['site/low']
        ? summary['site/high'].final - summary['site/low'].final : -99;
    const riseOurs = summary['ours/high'] && summary['ours/low']
        ? summary['ours/high'].final - summary['ours/low'].final : -99;
    let verdict;
    // 对照臂没出画时，它的 currentLevel 只是初始值，不是 ABR 的选档结果；
    // 拿它和出画的产品臂比档位会得到「差好几档」的假结论，必须先判无效。
    const noFrame = arms.filter((a) => !(a.firstFrameAt > 0));
    if (arms.length < 4) verdict = '没拿齐四臂数据，本轮无效';
    else if (noFrame.length) verdict = '测量失真、本轮无效：' +
        noFrame.map((a) => a.kind + '/' + a.bw).join('、') + ' 没出画，' +
        '它们的 currentLevel 不是 ABR 选档结果，不能拿来做档位对照（先看上面的裸臂现场 diag）';
    else if (lowDiff > FINAL_DIFF_LIMIT || highDiff > FINAL_DIFF_LIMIT) {
        verdict = '产品臂与裸臂最终档差 ' + lowDiff + '/' + highDiff + ' 档（低/高带宽），超过 ' +
            FINAL_DIFF_LIMIT + ' 档门槛。先看是不是 vvHlsConfig 的 abrBandWidthUpFactor=0.6' +
            '（hls.js 默认 0.7）或 abrEwmaDefaultEstimate=2Mbps（默认 5Mbps）把升档压保守了；' +
            '改这两项属于画质策略变更，要单独确认，别顺手改';
    } else {
        verdict = '不改：低/高带宽下两臂最终档差 ' + lowDiff + '/' + highDiff + ' 档（门槛 ≤' +
            FINAL_DIFF_LIMIT + '），裸臂带宽升档 ' + riseSite + ' 档、产品臂 ' + riseOurs +
            ' 档，ABR 都跟着限速走了，产品配置没把选档带偏';
    }

    // ---- 断言 ----
    const checks = oks.map((o) => ({ name: o.name, pass: o.pass, detail: o.detail }));
    const ok = (name, pass, detail) => checks.push({ name, pass: !!pass, detail: String(detail || '') });
    ok('设备脚本版本与 dist 一致', env.version === env.expect, 'v' + env.version + ' vs v' + env.expect);
    ok('拿齐四臂（裸/产品 × 低/高带宽）', arms.length === 4, arms.map((a) => a.kind + '/' + a.bw).join(' '));
    ok('每臂都解析出 4 档', arms.every((a) => (a.levels || []).length === MAX_FRAME_LEVELS),
        arms.map((a) => (a.levels || []).length).join('/'));
    ok('产品臂 autoLevelCapping 恒 -1（画质红线）',
        arms.filter((a) => a.kind === 'ours').every((a) => a.autoCap === -1),
        arms.filter((a) => a.kind === 'ours').map((a) => a.autoCap).join('/'));
    ok('产品臂没有按尺寸/掉帧封顶、起播交 ABR',
        arms.filter((a) => a.kind === 'ours').every((a) => a.capToSize === false &&
            a.capOnFps === false && a.startLevelCfg === -1),
        arms.filter((a) => a.kind === 'ours').map((a) =>
            a.capToSize + '/' + a.capOnFps + '/' + a.startLevelCfg).join(' '));
    ok('四臂都解出了画面', arms.every((a) => a.firstFrameAt > 0),
        arms.map((a) => a.firstFrameAt).join('/'));
    ok('两臂都随带宽升档（ABR 真的在动）', riseSite >= 0 && riseOurs >= 0,
        'site=' + riseSite + ' ours=' + riseOurs);
    ok('页面跑到 done 且无中止', done && !(fin && fin.err), fin && fin.err ? fin.err : 'done');

    console.log('\n=== 断言 ===');
    let fail = 0;
    for (const c of checks) {
        console.log((c.pass ? 'ok   - ' : 'FAIL - ') + c.name + (c.detail ? '  [' + c.detail + ']' : ''));
        if (!c.pass) fail++;
    }
    console.log('\n结论: ' + verdict);
    console.log('多档 ABR 对照: ' + (checks.length - fail) + ' passed, ' + fail + ' failed');
    if (fail || !done) process.exitCode = 1;
} catch (e) {
    console.error('ABR 对照异常: ' + (e && (e.stack || e.message || e)));
    process.exitCode = 1;
} finally {
    for (const s of [staticSrv, slowSrv]) { if (s) { try { s.kill(); } catch (e) {} } }
}
