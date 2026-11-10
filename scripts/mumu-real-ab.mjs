// 真实站点「有脚本 / 无脚本」对照（MuMu + Via）
//   [SITE=cctv] [PAIRS=3] node scripts/mumu-real-ab.mjs
// 前置：MuMu 已启动、Via 里已装好本脚本、adb 可连（要 e2e/sites.local.json，
// 结构见 e2e/sites.example.json）。
//
// 要回答的问题：装了脚本之后，真实站点的页面到底会不会变慢？慢多少？
// 做法：额外装一条极小的探针脚本（e2e/ab-probe.user.js），两臂都装、都用它取数；
// 唯一的变量是**主脚本的 enabled 置 0 还是 1**。探针开销两边一样，被抵消掉。
// 交替跑（无→有→无→有…），把网络与站点侧抖动摊到两臂上，最后取中位数比。
//
// 取数为什么要绕道 Via 的数据库：真实站点是 https，页面里 GM_xmlhttpRequest 打
// http://127.0.0.1 会被 WebView 的明文/混合内容策略拦掉（真机实测 readyState=4、status=0，
// 同一个探针在 http 本地页上却正常）。所以探针用 GM_setValue 写进 Via 自己的 variables 表，
// 驱动再用 adb 读库——彻底绕开网络策略。
//
// 环境变量：ADB、SERIAL（默认 127.0.0.1:16384）、PORT（默认 8099）、SITE、PAIRS（默认 3）、KEEP=1 保留探针
import { execFileSync, spawn } from 'node:child_process';
import { readFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';

const ADB = process.env.ADB || 'E:/android-tools/platform-tools/adb.exe';
const SERIAL = process.env.SERIAL || '127.0.0.1:16384';
const PORT = Number(process.env.PORT || 8099);
const BASE = `http://127.0.0.1:${PORT}`;
const ROOT = process.cwd();
const DB = '/data/data/mark.via/databases/monkey';
const PAIRS = Number(process.env.PAIRS || 3);
const PROBE_ID = 'ab-probe-viamodes';
const PROBE_LOCAL = join(ROOT, 'e2e/ab-probe.user.js');

let server = null;
function sh(args, opts = {}) {
    try {
        return execFileSync(ADB, ['-s', SERIAL, ...args], {
            encoding: 'utf8', maxBuffer: 32 * 1024 * 1024, timeout: opts.timeout || 60000
        });
    } catch (e) { return (e.stdout || '') + (e.stderr || ''); }
}
// 整条命令当一个参数传给远端 shell，避免 Git Bash 把 /data/... 当成 Windows 路径改写
function sql(q) {
    return sh(['shell', `sqlite3 ${DB} ${JSON.stringify(q)}`]).trim();
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
const med = (a) => { const s = a.slice().sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : -1; };
const fmt = (v) => (typeof v === 'number' && v >= 0 ? String(Math.round(v)) : '-');
const dropProbeKeys = () => sql("DELETE FROM variables WHERE name IN ('vvmab_last','vvmab_diag');");
function readProbe() {
    const raw = sql("SELECT value FROM variables WHERE name='vvmab_last';");
    if (!raw) return null;
    try {
        // Via 会把 GM_setValue 的字符串再序列化一层，库里存的是 "{\"url\":...}"，
        // 所以这里要解两次才能拿到对象；只解一次会得到一个字符串，字段全是 undefined。
        let v = JSON.parse(raw);
        if (typeof v === 'string') v = JSON.parse(v);
        return (v && typeof v === 'object') ? v : null;
    } catch (e) { return null; }
}

try {
    mkdirSync(join(ROOT, '.tmp'), { recursive: true });
    let siteFile;
    try { siteFile = JSON.parse(readFileSync(join(ROOT, 'e2e/sites.local.json'), 'utf8')); }
    catch (e) { throw new Error('缺少 e2e/sites.local.json（结构见 e2e/sites.example.json）'); }
    const usable = (siteFile.matrix || []).filter((s) => s.url);
    const want = process.env.SITE || usable[0].key;
    const site = usable.find((s) => s.key === want);
    if (!site) throw new Error('sites.local.json 里没有可用站点：' + want);
    console.log(await ensureServer());

    const conn = execFileSync(ADB, ['connect', SERIAL], { encoding: 'utf8', timeout: 30000 });
    console.log('adb: ' + conn.trim().split('\n').pop());
    if (sh(['shell', 'getprop sys.boot_completed']).trim() !== '1') throw new Error('模拟器还没启动完');
    if (!/package:/.test(sh(['shell', 'pm path mark.via']))) throw new Error('设备里没装 Via');
    sh(['reverse', `tcp:${PORT}`, `tcp:${PORT}`]);

    // 主脚本 = 内容最长的那条（探针只有几 KB），别靠名字认
    const mainRow = sql("SELECT _id||'|'||script_id FROM scripts ORDER BY length(content) DESC LIMIT 1;");
    if (!mainRow) throw new Error('Via 里没有已安装的脚本，先装 dist 那份');
    const mainSid = mainRow.split('|')[1];
    console.log('主脚本 id=' + mainSid.slice(0, 12) + '…  ·  站点 ' + site.key + '  ·  ' + PAIRS + ' 对');

    // 装探针：matches/run_at/flags/grant 照抄主脚本，确保同样的注入时机与权限位
    sh(['push', PROBE_LOCAL, '/data/local/tmp/ab-probe.js']);
    sql(`DELETE FROM scripts WHERE script_id='${PROBE_ID}';`);
    sql(`INSERT INTO scripts (script_id,name,version,content,matches,run_at,enabled,flags,grant) `
        + `SELECT '${PROBE_ID}','AB 探针','1',CAST(readfile('/data/local/tmp/ab-probe.js') AS TEXT),`
        + `matches,run_at,1,flags,grant FROM scripts WHERE script_id='${mainSid}';`);
    const probe = sql(`SELECT enabled||'|'||typeof(content)||'|'||length(content) FROM scripts WHERE script_id='${PROBE_ID}';`);
    console.log('探针: ' + probe + '（enabled|typeof|len）');
    if (!/^1\|text\|/.test(probe)) throw new Error('探针没装好：' + probe);

    const setMain = (on) => sql(`UPDATE scripts SET enabled=${on ? 1 : 0} WHERE script_id='${mainSid}';`);
    const rows = { off: [], on: [] };

    try {
        for (let p = 0; p < PAIRS; p++) {
            for (const arm of ['off', 'on']) {
                setMain(arm === 'on');
                sh(['shell', 'am force-stop mark.via']);
                await sleep(800);
                dropProbeKeys();   // 先清上一轮的值，再按时间戳认这一轮的
                const startAt = Date.now();
                sh(['shell', `am start -n mark.via/.Shell -a android.intent.action.VIEW -d '${site.url}'`]);
                let got = null;
                for (let k = 0; k < 60; k++) {
                    await sleep(400);
                    const v = readProbe();
                    if (v && typeof v.t === 'number' && v.t >= startAt - 1500) { got = v; break; }
                }
                if (!got) { console.log('  ' + (arm === 'off' ? '无脚本' : '有脚本') + '  没拿到探针数据（超时）'); continue; }
                rows[arm].push(got);
                console.log('  ' + (arm === 'off' ? '无脚本' : '有脚本') +
                    '  FCP=' + fmt(got.fcp) + '  DCL=' + fmt(got.dcl) + '  load=' + fmt(got.loadEnd) +
                    '  注入=' + (got.injected ? 'Y' : 'N') +
                    '  采样=' + (got.why || '?') + (got.loadFired ? ' loadY' : ' loadN') +
                    '  ' + (got.transferKb ? got.transferKb + 'KB' : ''));
            }
        }
    } finally {
        setMain(true);
        if (!process.env.KEEP) { dropProbeKeys(); sql(`DELETE FROM scripts WHERE script_id='${PROBE_ID}';`); }
        console.log('收尾：主脚本 enabled=' + sql(`SELECT enabled FROM scripts WHERE script_id='${mainSid}';`) +
            '  探针残留=' + sql(`SELECT count(*) FROM scripts WHERE script_id='${PROBE_ID}';`));
    }

    const pick = (arm, k) => rows[arm].map((r) => r[k]).filter((v) => typeof v === 'number' && v >= 0);
    // 只看页面里程碑。「首个宏任务」那条实测恒 0（探针排在主脚本之后），
    // 不能拿它冒充"脚本开销"，主脚本的代价本来就体现在 dcl / fcp / domInteractive 的臂间差上。
    const metrics = [['fcp', '首次内容绘制 FCP'], ['dcl', 'DOMContentLoaded'],
        ['domInteractive', 'DOM 可交互'], ['responseEnd', '响应结束']];

    console.log('\n=== 结果（各臂中位） ===');
    console.log('样本：无脚本 ' + rows.off.length + ' 次 / 有脚本 ' + rows.on.length + ' 次');
    const lines = [];
    for (const [k, label] of metrics) {
        const a = pick('off', k), b = pick('on', k);
        const ma = med(a), mb = med(b);
        lines.push({ k, label, off: ma, on: mb, d: (a.length && b.length) ? mb - ma : NaN });
        console.log(('  ' + label).padEnd(24, ' ') + '无脚本 ' + fmt(ma).padStart(6) + 'ms   有脚本 ' +
            fmt(mb).padStart(6) + 'ms   差 ' + (a.length && b.length ? (mb - ma >= 0 ? '+' : '') + (mb - ma).toFixed(0) + 'ms' : '-'));
    }

    const checks = [];
    const ok = (name, pass, detail) => checks.push({ name, pass, detail });
    ok('两臂都拿到了探针数据', rows.off.length > 0 && rows.on.length > 0,
        'off=' + rows.off.length + ' on=' + rows.on.length);
    ok('无脚本臂确实没注入主脚本（每轮都验）',
        rows.off.length > 0 && rows.off.every((r) => r.injected === false),
        rows.off.map((r) => r.injected).join('/') || '无样本');
    ok('有脚本臂确实注入了主脚本（每轮都验）',
        rows.on.length > 0 && rows.on.every((r) => r.injected === true),
        rows.on.map((r) => r.injected).join('/') || '无样本');
    const dclCount = rows.off.concat(rows.on).filter((r) => r.why === 'dcl').length;
    ok('多数样本落在 DCL 窗口（没被 12s 硬兜底救）', dclCount * 2 >= (rows.off.length + rows.on.length),
        'dcl=' + dclCount + '/' + (rows.off.length + rows.on.length) +
        '  ' + rows.off.map((r) => r.why).join('/') + ' | ' + rows.on.map((r) => r.why).join('/'));

    console.log('\n=== 断言 ===');
    let fail = 0;
    for (const c of checks) {
        console.log((c.pass ? 'ok   - ' : 'FAIL - ') + c.name + (c.detail ? '  [' + c.detail + ']' : ''));
        if (!c.pass) fail++;
    }
    const dDcl = lines.find((l) => l.k === 'dcl');
    const dFcp = lines.find((l) => l.k === 'fcp');
    if (dDcl && isFinite(dDcl.d)) {
        console.log('\n结论：' + site.key + ' 上开脚本后 DOMContentLoaded ' +
            (dDcl.d >= 0 ? '晚 ' : '早 ') + Math.abs(dDcl.d).toFixed(0) + 'ms' +
            (dFcp && isFinite(dFcp.d) ? '、FCP ' + (dFcp.d >= 0 ? '晚 ' : '早 ') + Math.abs(dFcp.d).toFixed(0) + 'ms' : ''));
        console.log('（页面级里程碑本身就受站点内容与网络抖动影响，交替 ' + PAIRS +
            ' 对取中位只压一部分；看量级不看末位，绝对值小于一帧就当作没有差别）');
    }
    console.log('\n真实站点有/无脚本对照: ' + (checks.length - fail) + ' passed, ' + fail + ' failed');
    if (fail) process.exitCode = 1;
} catch (e) {
    console.error('真实站点对照异常: ' + (e && (e.stack || e.message || e)));
    process.exitCode = 1;
} finally {
    if (server) { try { server.kill(); } catch (e) {} }
}
