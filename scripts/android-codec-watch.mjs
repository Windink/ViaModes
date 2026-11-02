// 真机 codec 释放观测：用 Via 打开自动开关页面，同时持续采样 media.metrics 里的 codec 事件。
// 判据：每轮 open 会新增 configure，每轮 close 应新增等量 destruct。
// 若 configure 涨而 destruct 不涨，就是没释放——这正是"退出后要关页签"的硬证据。
import { execFileSync } from 'node:child_process';

const ADB = process.env.ADB || 'E:/android-tools/platform-tools/adb.exe';
// 走 http + adb reverse：file:// 在 Android 11+ 会被分区存储挡成 ERR_ACCESS_DENIED。
// reverse 映射会随 adb server 重启消失，所以启动和采样必须在同一次进程里做完。
const URL0 = process.env.URL || 'http://127.0.0.1:8099/e2e/android.html?vvdebug=1';
const DURATION = Number(process.env.DURATION || 42000);
const STEP = Number(process.env.STEP || 700);

function sh(args) {
    try {
        return execFileSync(ADB, args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, timeout: 30000 });
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

// 前台窗口是不是 Via，用来确认页面真的被打开了
function fore() {
    const out = sh(['shell', 'dumpsys window | grep mCurrentFocus']);
    return /mark\.via/.test(out) ? 'via' : out.trim().slice(0, 60) || '?';
}

const base = sample();
console.log('基线: configure=' + base.cfg + ' destruct=' + base.des);
// 建立反向映射：手机的 127.0.0.1:8099 转发到这台电脑的 8099
const rev = sh(['reverse', 'tcp:8099', 'tcp:8099']).trim();
console.log('adb reverse: ' + (rev || '(ok)'));
console.log('启动页面: ' + URL0);
// 加一次性参数：Via 会缓存页面，不加时间戳的话改了参数也还是跑旧的那份
const NAV = URL0 + (URL0.includes('?') ? '&' : '?') + '_=' + Date.now();
// 先杀掉 Via 再拉起来：不这么做，am start 只会把 intent 丢给已在最前的实例，
// 页面不会真的导航到测试地址。
sh(['shell', 'am', 'force-stop', 'mark.via']);
await new Promise((r) => setTimeout(r, 1200));
// 整条命令当字符串发过去，并把 URL 用引号包住：
// 否则 URL 里的 & 会被设备端 shell 当成"放到后台"，后面的参数全被截掉。
sh(['shell', 'am start -n mark.via/.Shell -a android.intent.action.VIEW -d "' + NAV + '"']);

const t0 = Date.now();
let last = base;
let maxOpen = 0;
const timeline = [];

while (Date.now() - t0 < DURATION) {
    await new Promise((r) => setTimeout(r, STEP));
    const s = sample();
    const t = ((Date.now() - t0) / 1000).toFixed(1).padStart(5);
    const dCfg = s.cfg - base.cfg;
    const dDes = s.des - base.des;
    const open = dCfg - dDes;          // 净存活实例
    if (open > maxOpen) maxOpen = open;
    const changed = s.cfg !== last.cfg || s.des !== last.des;
    console.log(
        't=' + t + 's  cfg=' + dCfg + '  des=' + dDes + '  存活=' + open + (changed ? '   ←变化' : '')
    );
    if (changed) timeline.push({ t: +t, dCfg, dDes, open });
    last = s;
}

const end = sample();
console.log('\n=== 汇总 ===');
console.log('configure 新增: ' + (end.cfg - base.cfg));
console.log('destruct  新增: ' + (end.des - base.des));
console.log('结束时存活实例: ' + (end.cfg - end.des - (base.cfg - base.des)));
console.log('过程中最大存活: ' + maxOpen);
if (end.names.length) console.log('涉及解码器: ' + end.names.join(', '));
console.log('前台窗口: ' + fore());
console.log('\n时间线（只在变化时打点）:');
if (!timeline.length) console.log('  (没有任何 codec 事件——页面可能没打开或没起播)');
for (const p of timeline) console.log('  t=' + p.t + 's  cfg=' + p.dCfg + ' des=' + p.dDes + ' 存活=' + p.open);
