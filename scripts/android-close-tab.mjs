// 真机验证「用户直接关掉正在播放的标签页」时解码器有没有被释放。
//
// 这条路径和点播放器返回完全不同：它不进 closePlayer，只能靠 pagehide / beforeunload
// 同步清理。判据是系统侧的 configure/destruct 计数——开一次就该关一次，结束必须归零。
//
// 用法：
//   node scripts/android-close-tab.mjs --mode=mp4
//   node scripts/android-close-tab.mjs --mode=hls --close-at=18000
//
// 前置：adb 已连机、Via 里**停用**了已安装的同名用户脚本（否则 Via 会往页面注入旧版，
// 页面测到的是旧代码，结论会完全反过来）；本地已跑 `node scripts/serve.mjs`。
import { spawn } from 'node:child_process';
import { execFileSync } from 'node:child_process';

const ARGS = process.argv.slice(2);
const arg = (name, def) => {
    const hit = ARGS.find((a) => a.startsWith('--' + name + '='));
    return hit ? hit.split('=')[1] : def;
};

const MODE = arg('mode', 'mp4');
const OPEN_AT = Number(arg('open-at', 4000));
const PLAY_AT = Number(arg('play-at', MODE === 'hls' ? 3000 : 2500));
const CLOSE_AT = Number(arg('close-at', MODE === 'hls' ? 18000 : 9000));
const DURATION = Number(arg('duration', MODE === 'hls' ? 48000 : 34000));

const ADB = process.env.ADB || 'E:/android-tools/platform-tools/adb.exe';
function sh(a) {
    try { return execFileSync(ADB, a, { encoding: 'utf8', maxBuffer: 64 << 20, timeout: 30000 }); }
    catch (e) { return (e.stdout || '') + (e.stderr || ''); }
}

// 先把设备唤醒到可用状态：锁屏时 WebView 会被挂起，测出来是假阴性
try { sh(['shell', 'wm', 'dismiss-keyguard']); } catch (e) {}

const URL = 'http://127.0.0.1:8099/e2e/tab-close.html?vvdebug=1&role=host' +
    '&mode=' + MODE + '&openAt=' + OPEN_AT + '&playAt=' + PLAY_AT + '&closeAt=' + CLOSE_AT;

console.log('模式: ' + MODE + '  起播后 ' + (CLOSE_AT / 1000) + 's 关标签页\n');

const child = spawn(process.execPath, ['scripts/android-codec-watch.mjs'], {
    env: { ...process.env, URL, DURATION: String(DURATION), STEP: '700' },
    stdio: ['ignore', 'pipe', 'pipe']
});
let out = '';
child.stdout.on('data', (d) => { out += d; process.stdout.write(d); });
child.stderr.on('data', (d) => { out += d; });
child.on('close', () => {
    const num = (re) => {
        const m = out.match(re);
        return m ? Number(m[1]) : -1;
    };
    const cfg = num(/configure 新增:\s*(\d+)/);
    const des = num(/destruct\s+新增:\s*(\d+)/);
    const alive = num(/结束时存活实例:\s*(\d+)/);

    console.log('\n=== 判定 ===');
    const checks = [
        ['确实起播过（configure > 0）', cfg > 0],
        ['关标签页后解码器被销毁（destruct > 0）', des > 0],
        ['创建与销毁数量一致', cfg === des],
        ['结束时存活为 0', alive === 0]
    ];
    let bad = 0;
    for (const [name, ok] of checks) {
        console.log((ok ? '  PASS  ' : '  FAIL  ') + name);
        if (!ok) bad++;
    }
    console.log(bad ? '\n结果: 有未释放的解码器' : '\n结果: 释放干净');
    process.exit(bad ? 1 : 0);
});
