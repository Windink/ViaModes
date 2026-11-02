// 真机多标签页 / 多播放器压测
//
// 背景：Via 是单 Activity（singleTask），`am start` 第二次只会把 intent 交给已在最前的实例，
// 所以无法用 adb 直接开多个页面。真正的路径是页面自己 `window.open`——但 Via 默认拦截弹窗，
// 必须在 Via 设置里放开「阻止弹出窗口」，否则开第二个就会被拦（页面上会提示"已拦截弹出式窗口"）。
//
// 又因为单页配额有限，一次 burst 开 10 个会被拦，所以用"链条式"：每个新页面在加载后自己开下一个。
// 实测 10 层链条可稳定打开（底部标签计数 = 10）。
//
// 用法：
//   node scripts/android-multitab.mjs --pages=10 --mode=hls --spawn=8000
//   node scripts/android-multitab.mjs --pages=10 --mode=mp4 --spawn=3000
//   node scripts/android-multitab.mjs --recover            # 后台释放 + 回前台恢复
//
// 判据：configure = 解码器创建次数，destruct = 归还次数，两者相等且净存活 0 才算干净。
import { execFileSync } from 'node:child_process';

const ADB = process.env.ADB || 'E:/android-tools/platform-tools/adb.exe';
const ARG = process.argv.slice(2);
const getArg = (k, d) => {
    const hit = ARG.find((a) => a.startsWith('--' + k + '='));
    return hit ? hit.split('=')[1] : d;
};
const PAGES = Number(getArg('pages', 10));
const MODE = getArg('mode', 'hls');
const SPAWN = Number(getArg('spawn', MODE === 'hls' ? 8000 : 3000));
const CLOSE_LAST = Number(getArg('closeLast', 22));
const DUR = Number(getArg('dur', 0));
const RECOVER = ARG.includes('--recover');
const PORT = Number(getArg('port', 8099));

function sh(args) {
    try {
        return execFileSync(ADB, args, { encoding: 'utf8', maxBuffer: 64 << 20, timeout: 30000 });
    } catch (e) {
        return (e.stdout || '') + (e.stderr || '');
    }
}
function sample() {
    const out = sh(['shell', 'dumpsys media.metrics | grep mark.via']);
    const cfg = (out.match(/message-type=configure/g) || []).length;
    const des = (out.match(/message-type=destruct/g) || []).length;
    const names = new Set();
    for (const m of out.matchAll(/componentname=(c2\.[\w.]+)/g)) names.add(m[1]);
    return { cfg, des, names: [...names] };
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// 设备重新插拔后 adb server 会重启，reverse 映射跟着消失，所以每次跑之前重建
sh(['reverse', `tcp:${PORT}`, `tcp:${PORT}`]);

let page;
if (RECOVER) {
    page = `/e2e/tab-recover.html?vvdebug=1&role=host&openAt=12000&hold=25000`;
} else {
    page = `/e2e/tab-farm.html?vvdebug=1&d=0&max=${PAGES}&spawn=${SPAWN}` +
           `&mode=${MODE}&play=1&closeAt=${CLOSE_LAST}&onlyLast=1`;
}
const URL0 = `http://127.0.0.1:${PORT}${page}&_=${Date.now()}`;

const base = sample();
console.log(`模式: ${RECOVER ? '切后台→回前台恢复' : PAGES + ' 个标签页 · ' + MODE}`);
console.log(`基线: configure=${base.cfg} destruct=${base.des}`);

// 必须等进程真正退出：只等 1s 时 intent 会被投给旧实例，新 URL 根本不打开
sh(['shell', 'am', 'force-stop', 'mark.via']);
await sleep(2800);
sh(['shell', 'am start -n mark.via/.Shell -a android.intent.action.VIEW -d "' + URL0 + '"']);

const total = DUR || (RECOVER ? 80000 : PAGES * (SPAWN + 2000) + CLOSE_LAST * 1000 + 18000);
const t0 = Date.now();
let last = base;
let maxOpen = 0;
const timeline = [];
console.log(`采样 ${Math.round(total / 1000)}s ...\n`);

while (Date.now() - t0 < total) {
    await sleep(1000);
    const s = sample();
    const t = ((Date.now() - t0) / 1000).toFixed(1).padStart(5);
    const dCfg = s.cfg - base.cfg;
    const dDes = s.des - base.des;
    const open = dCfg - dDes;
    if (open > maxOpen) maxOpen = open;
    if (s.cfg !== last.cfg || s.des !== last.des) {
        console.log(`t=${t}s  cfg=${dCfg}  des=${dDes}  存活=${open}   <-变化`);
        timeline.push({ t: +t, dCfg, dDes, open });
    }
    last = s;
}

const end = sample();
const dCfg = end.cfg - base.cfg;
const dDes = end.des - base.des;
const alive = dCfg - dDes;
console.log('\n=== 汇总 ===');
console.log(`configure 新增: ${dCfg}`);
console.log(`destruct  新增: ${dDes}`);
console.log(`结束时存活:   ${alive}`);
console.log(`过程中最大存活: ${maxOpen}`);
if (end.names.length) console.log('解码器: ' + end.names.join(', '));
console.log('\n时间线:');
for (const p of timeline) console.log(`  t=${p.t}s  cfg=${p.dCfg} des=${p.dDes} 存活=${p.open}`);
if (!timeline.length) console.log('  (没有 codec 事件：页面可能没打开 / 没起播 / 弹窗被拦)');
console.log(alive === 0 ? '\n结果: 全部归还，无残留' : `\n结果: 仍有 ${alive} 个解码器未释放`);
