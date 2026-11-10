// 续播起播耗时 · 真机测量（MuMu 模拟器 + Via）
//   node scripts/mumu-resume.mjs              # 量一次，若存在基线就打印对比
//   SAVE=1 node scripts/mumu-resume.mjs       # 把这次结果存成基线（.tmp/resume-baseline.json）
//   ONLY=mp4 ROUNDS=3 node scripts/mumu-resume.mjs
//
// 为什么单独做：续播那 0.5 秒只在真机上量得出来（桌面 Chromium 起解码管线太快，
// 而且 seek 成本被软件合成摊薄）。量法固定成「播到设定秒数 → 关 → 再开」，
// 记录 metadata / seeking / seeked / playing 的时间点，同一份已缓存文件重复 N 轮取中位数。
// 判断「续播 seek 提前」有没有用，就看首帧中位数与 seeking 次数。
//
// 环境变量：ADB、SERIAL（默认 127.0.0.1:16384）、PORT（默认 8099）、ROUNDS、ONLY、SAVE
import { execFileSync, spawn } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';

const ADB = process.env.ADB || 'E:/android-tools/platform-tools/adb.exe';
const SERIAL = process.env.SERIAL || '127.0.0.1:16384';
const PORT = Number(process.env.PORT || 8099);
const BASE = `http://127.0.0.1:${PORT}`;
const ROOT = process.cwd();
const REPORT = join(ROOT, '.tmp/report.log');
const BASE_FILE = join(ROOT, '.tmp/resume-baseline.json');
const ROUNDS = Number(process.env.ROUNDS || 3);
const ONLY = (process.env.ONLY || '').split(',').map((s) => s.trim()).filter(Boolean);
const SAVE = !!process.env.SAVE;

let server = null;

function sh(args) {
    try {
        return execFileSync(ADB, ['-s', SERIAL, ...args], {
            encoding: 'utf8', maxBuffer: 32 * 1024 * 1024, timeout: 30000
        });
    } catch (e) { return (e.stdout || '') + (e.stderr || ''); }
}

// 续播用的 HLS：分片写绝对地址（页就在同一端口上，设备也是这个 origin）
function writeManifest() {
    const dir = join(ROOT, '.tmp', 'hls-gen');
    mkdirSync(dir, { recursive: true });
    const lines = ['#EXTM3U', '#EXT-X-VERSION:3', '#EXT-X-TARGETDURATION:10', '#EXT-X-PLAYLIST-TYPE:VOD'];
    for (const i of [0, 1]) {
        lines.push('#EXTINF:10.000,', `http://127.0.0.1:${PORT}/e2e/media/hls/seg${i}.ts`);
    }
    lines.push('#EXT-X-ENDLIST', '');
    writeFileSync(join(dir, 'resume.m3u8'), lines.join('\n'));
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

const median = (a) => {
    const s = a.slice().sort((x, y) => x - y);
    return s.length ? s[Math.floor(s.length / 2)] : -1;
};
const avg = (a) => (a.length ? Math.round(a.reduce((x, y) => x + y, 0) / a.length) : -1);

try {
    mkdirSync(join(ROOT, '.tmp'), { recursive: true });
    writeManifest();
    if (!(await waitPort(BASE + '/e2e/index.html'))) {
        server = spawn(process.execPath, ['scripts/serve.mjs'], {
            cwd: ROOT, env: { ...process.env, PORT: String(PORT) }, stdio: 'ignore'
        });
        if (!(await waitPort(BASE + '/e2e/index.html'))) throw new Error('本地服务没起来');
        console.log('本次启动本地服务');
    } else {
        console.log('复用已运行的本地服务');
    }

    const conn = execFileSync(ADB, ['connect', SERIAL], { encoding: 'utf8', timeout: 30000 });
    console.log('adb: ' + conn.trim().split('\n').pop());
    if (sh(['shell', 'getprop sys.boot_completed']).trim() !== '1') throw new Error('模拟器还没启动完');
    if (!/package:/.test(sh(['shell', 'pm path mark.via']))) throw new Error('设备里没装 Via');
    sh(['reverse', `tcp:${PORT}`, `tcp:${PORT}`]);

    const distVer = (readFileSync(join(ROOT, 'dist/via-video-player.user.js'), 'utf8')
        .match(/@version\s+([\d.]+)/) || [])[1] || '';
    const pageTag = 'r' + Date.now();
    const url = `${BASE}/e2e/resume-android-${pageTag}.html?vvdebug=1&expect=${distVer}` +
        `&tag=${pageTag}&rounds=${ROUNDS}` + (ONLY.length ? '&only=' + ONLY.join(',') : '');
    console.log('期望脚本版本 v' + distVer + '  ·  本轮标识 ' + pageTag + '  ·  ' + ROUNDS + ' 轮');

    await fetch(BASE + '/__report/clear');
    sh(['shell', 'am force-stop mark.via']);
    await sleep(1200);
    sh(['shell', `am start -n mark.via/.Shell -a android.intent.action.VIEW -d '${url}'`]);
    console.log('打开页面: ' + url + '\n');

    // 每场景 = seed(约 10s) + N 轮 × (打开约 3s + 关 1.2s)，两个场景留 240s
    let done = false;
    for (let i = 0; i < 600; i++) {
        await sleep(500);
        if (readRows().filter((r) => r.run === pageTag).some((r) => r.tag === 'done')) { done = true; break; }
    }
    const rows = readRows().filter((r) => r.run === pageTag);
    const env = rows.find((r) => r.tag === 'env') || {};
    const rounds = rows.filter((r) => r.tag === 'round');
    const fatal = rows.find((r) => r.tag === 'fatal');

    console.log('=== 环境 ===');
    console.log('脚本版本: v' + (env.version || 'none') + '  ·  期望 v' + (env.expect || '?') +
        '  ·  视口 ' + (env.vw || '?') + '×' + (env.vh || '?') + ' dpr=' + (env.dpr || '?'));
    if (env.version !== env.expect) console.log('!! 设备脚本版本与 dist 不一致，本轮结论无效');

    const summary = {};
    for (const id of [...new Set(rounds.map((r) => r.id))]) {
        const rs = rounds.filter((r) => r.id === id);
        const seed = rows.find((r) => r.tag === 'seed' && r.id === id) || {};
        const meta = rs.map((r) => r.first.loadedmetadata);
        const frame = rs.map((r) => r.first.playing);
        const seeked = rs.map((r) => (r.first.seeked >= 0 ? r.first.seeked - r.first.loadedmetadata : 0));
        const seeks = rs.map((r) => r.seeks);
        summary[id] = {
            seeds: seed.at,
            ctAtMeta: rs.map((r) => r.ctAtMeta),
            metaMedian: median(meta), metaAvg: avg(meta),
            frameMedian: median(frame), frameAvg: avg(frame),
            seekAfterMetaMedian: median(seeked),
            seeksMedian: median(seeks),
            rounds: rs.length
        };
        console.log(`\n▶ ${id}  （预置位置 ${seed.at}s，${rs.length} 轮）`);
        for (const r of rs) {
            console.log(`  第${r.round}轮  ct@meta=${r.ctAtMeta}  metadata=${r.first.loadedmetadata}ms` +
                `  首帧=${r.first.playing}ms  seeking=${r.seeks} 次` +
                (r.first.seeked >= 0 ? `  seeked=+${r.first.seeked - r.first.loadedmetadata}ms` : '') +
                `  早落位=${r.early || 0}s${r.srcFrag ? '（#t=）' : ''}`);
        }
        console.log(`  中位数：metadata ${summary[id].metaMedian}ms（均 ${summary[id].metaAvg}ms）` +
            `  ·  首帧 ${summary[id].frameMedian}ms（均 ${summary[id].frameAvg}ms）` +
            `  ·  metadata→seeked ${summary[id].seekAfterMetaMedian}ms  ·  seek ${summary[id].seeksMedian} 次`);
    }

    if (SAVE) {
        // 存的是设备上真正在跑的版本：dist 是 0.1.78 但设备还没换版时，
        // 记成 0.1.78 会让后面的对比以为"改过了"，把没改的基线当成改动后的结果
        writeFileSync(BASE_FILE, JSON.stringify({ version: env.version, dist: distVer, at: new Date().toISOString(), summary }, null, 2));
        console.log('\n已存基线 → .tmp/resume-baseline.json（设备 v' + env.version + ' / dist v' + distVer + '）');
    } else {
        try {
            const base = JSON.parse(readFileSync(BASE_FILE, 'utf8'));
            console.log('\n=== 与基线对比（基线 v' + base.version + ' @ ' + base.at.slice(0, 19) + '）===');
            for (const id of Object.keys(summary)) {
                const b = base.summary[id];
                if (!b) continue;
                const d = summary[id].frameMedian - b.frameMedian;
                console.log(`${id}: 首帧 ${b.frameMedian}ms → ${summary[id].frameMedian}ms` +
                    `（${d > 0 ? '+' : ''}${d}ms）  ·  metadata ${b.metaMedian} → ${summary[id].metaMedian}ms`);
            }
        } catch (e) {}
    }

    if (fatal) console.log('\nFATAL: ' + fatal.msg);
    if (!done) { console.log('\n!! 没等到 done'); process.exitCode = 1; }
    if (!rounds.length) { console.log('\n!! 一轮都没上报，检查脚本是否注入'); process.exitCode = 1; }
} catch (e) {
    console.error('续播真机测量异常: ' + (e && (e.stack || e.message || e)));
    process.exitCode = 1;
} finally {
    if (server) { try { server.kill(); } catch (e) {} }
}
