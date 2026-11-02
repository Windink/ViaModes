// 真机体检：确认 adb 链路、Via 是否装上、以及 media.codec 的统计口径能不能用。
// 这一步只读不写，不会在手机上装任何东西。
import { execFileSync } from 'node:child_process';

const ADB = process.env.ADB || 'E:/android-tools/platform-tools/adb.exe';

function sh(args) {
    try {
        return execFileSync(ADB, args, {
            encoding: 'utf8',
            maxBuffer: 32 * 1024 * 1024,
            timeout: 30000
        }).trim();
    } catch (e) {
        const out = (e.stdout || '') + (e.stderr || '');
        return '__ERR__ ' + (out || e.message).toString().slice(0, 400);
    }
}

const devOut = sh(['devices', '-l']);
console.log('=== adb devices ===');
console.log(devOut || '(空)');

const lines = devOut.split(/\r?\n/).filter((l) => /^\S+\s+(device|unauthorized|offline)/.test(l));
if (!lines.length) {
    console.log('\n没有检测到设备。');
    console.log('请检查：数据线是数据线不是充电线 / USB 调试已开 / 手机上点了「允许 USB 调试」。');
    process.exit(2);
}
if (lines.some((l) => /\sunauthorized/.test(l))) {
    console.log('\n设备已连上但未授权。看手机屏幕，点「允许 USB 调试」并勾选「始终允许」。');
    process.exit(3);
}
if (lines.some((l) => /\soffline/.test(l))) {
    console.log('\n设备处于 offline。拔插一次数据线，或 adb kill-server 后重试。');
    process.exit(4);
}

const one = lines[0].split(/\s+/)[0];
console.log('目标设备: ' + one + '\n');

console.log('=== 设备信息 ===');
for (const k of ['ro.product.brand', 'ro.product.model', 'ro.build.version.release', 'ro.build.version.sdk', 'ro.product.cpu.abi']) {
    console.log('  ' + k.padEnd(26) + sh(['shell', 'getprop', k]));
}

console.log('\n=== WebView 实现 ===');
const wv = sh(['shell', 'dumpsys', 'webviewupdate']);
for (const key of ['Current WebView package', 'Valid package']) {
    const m = wv.split(/\r?\n/).filter((l) => l.includes(key));
    if (m.length) m.forEach((l) => console.log('  ' + l.trim()));
}
if (wv.startsWith('__ERR__')) console.log('  (dumpsys webviewupdate 不可用)');

console.log('\n=== Via 是否安装 ===');
const pkgs = sh(['shell', 'pm', 'list', 'packages']);
const via = pkgs.split(/\r?\n/).filter((p) => /via/i.test(p));
console.log(via.length ? via.map((v) => '  ' + v.replace('package:', '')).join('\n') : '  没找到含 "via" 的包');

console.log('\n=== codec 统计口径探测 ===');
const dump = sh(['shell', 'dumpsys', 'media.codec']);
if (dump.startsWith('__ERR__')) {
    console.log('  dumpsys media.codec 不可用: ' + dump.slice(0, 120));
} else {
    const total = dump.length;
    const counts = {
        'CodecInstance': (dump.match(/CodecInstance/g) || []).length,
        'codec instance (不区分大小写)': (dump.match(/codec instance/gi) || []).length,
        'Name: ': (dump.match(/^\s*Name: /gm) || []).length,
        'allocated/active 关键字': (dump.match(/\b(allocated|active|released|free)\b/gi) || []).length
    };
    console.log('  dumpsys 输出长度: ' + total + ' 字符');
    for (const [k, v] of Object.entries(counts)) console.log('  ' + k.padEnd(30) + v);
    console.log('\n  --- 前 25 行，用来确认格式 ---');
    dump.split(/\r?\n/).slice(0, 25).forEach((l) => console.log('  | ' + l));
}

console.log('\n=== dumpsys media.metrics 里的 codec 记录（若有）===');
const mm = sh(['shell', 'dumpsys', 'media.metrics']);
if (!mm.startsWith('__ERR__')) {
    const hit = mm.split(/\r?\n/).filter((l) => /codec|decoder/i.test(l)).slice(0, 12);
    console.log(hit.length ? hit.map((l) => '  ' + l.trim()).join('\n') : '  (无 codec 相关行)');
} else {
    console.log('  不可用');
}

console.log('\n体检完成。把上面的 codec 统计部分发我，我据此定采样口径。');
