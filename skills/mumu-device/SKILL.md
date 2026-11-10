---
name: mumu-device
description: 把 MuMu 模拟器里的 Via 浏览器变成一台可自动化设备——adb 连接、前置自检（Android 是否启动完、Via 是否装好、端口映射是否建立）、把指定测试页在 Via 里拉起、必要时抓系统截图留证。当任务需要在 Android 模拟器或真实 Via 环境里打开页面、读取页内现场状态，或准备运行 scripts/mumu-*.mjs 真机脚本时使用本技能；涉及 MuMu、模拟器、adb、Via、真机、端口映射、adb reverse 的说法都应先走这里。
agent_created: true
---

# mumu-device · 设备接入与页面拉起

## 用途

把所有真机脚本里重复的那段「先把设备弄成可用状态」固化下来：连上 adb、确认设备真的可用、
把本地端口映射进去、用正确的方式让 Via 打开目标页面。任何真机验证、测量、取证动作都从这里起步。

## 何时用

- 准备跑 `scripts/mumu-*.mjs` 任何一个真机脚本，怀疑环境有问题
- 需要在 Via 里打开某个测试页，读回页内 DOM 现场
- 上一次跑出来「一条上报都没有」「版本是 none」「页面计数器停在 1」，要从环境查起
- 要在模拟器里手工点一遍功能，需要截图留档

## 输入

| 参数 | 默认 | 说明 |
| --- | --- | --- |
| `SERIAL` | `127.0.0.1:16384` | MuMu 的 adb 端口固定是 16384 |
| `PORT` | `8099` | 本地静态服务端口，必须与 `serve.mjs` 一致 |
| `ADB` | `E:/android-tools/platform-tools/adb.exe` | adb 路径，见下方「两处默认值不一致」 |
| 目标 URL | — | 本机 `http://127.0.0.1:<PORT>/e2e/...`，设备侧走 reverse 回环 |

## 输出

- 已连接、`sys.boot_completed=1`、Via 已安装、端口已 `reverse` 的设备
- 停在目标页面的 Via（前台只有一个标签）
- 失败时的具体卡点（哪一步、原始输出）

## 依赖

- MuMu 已启动，Android 已起到桌面（`getprop sys.boot_completed` 返回 `1`）
- Via 已安装在设备里（包名 `mark.via`）
- 本地 `scripts/serve.mjs` 已起（多数 `mumu-*.mjs` 会自己拉起，手工操作要自己开）
- `mumu-deploy` 换过版（否则页面跑的是旧脚本，见 `mumu-diagnose`）

## 标准流程

### 1. 启动模拟器（没起时才需要）

```bash
# 先拉起主程序，再让 mumu-cli 启动 Android 15 实例
"E:/Program Files/Netease/MuMu/nx_main/MuMuNxMain.exe" &
"E:/Program Files/Netease/MuMu/nx_main/mumu-cli.exe" control -v 0 -ver 15 launch
```

### 2. 连接 + 三段自检

**每个 Node/Bash 进程都要重新连一次**——daemon 会随进程结束被回收，`reverse` 也随之失效。

```js
const ADB = process.env.ADB || 'E:/android-tools/platform-tools/adb.exe';
const SERIAL = process.env.SERIAL || '127.0.0.1:16384';
const PORT = Number(process.env.PORT || 8099);

function sh(args) {
    try {
        return execFileSync(ADB, ['-s', SERIAL, ...args], {
            encoding: 'utf8', maxBuffer: 32 * 1024 * 1024, timeout: 30000
        });
    } catch (e) { return (e.stdout || '') + (e.stderr || ''); }   // 吞异常，看输出自己判
}

execFileSync(ADB, ['connect', SERIAL], { encoding: 'utf8', timeout: 30000 });
if (sh(['shell', 'getprop sys.boot_completed']).trim() !== '1') throw new Error('模拟器还没启动完');
if (!/package:/.test(sh(['shell', 'pm path mark.via']))) throw new Error('设备里没装 Via');
sh(['reverse', `tcp:${PORT}`, `tcp:${PORT}`]);
```

三段缺一不可：不检查 boot 就 `am start` 会得到一个空页面；不检查 `pm path` 会以为是
「脚本没注入」；不 `reverse` 则页面 404 但 Via 照常显示一个白屏，看起来像脚本坏了。

### 3. 拉起页面

```bash
adb -s 127.0.0.1:16384 shell am force-stop mark.via
# 等 ~1.2s 让进程真的退掉
adb -s 127.0.0.1:16384 shell "am start -n mark.via/.Shell -a android.intent.action.VIEW -d 'http://127.0.0.1:8099/e2e/xxx.html?vvdebug=1'"
```

- **整条 shell 命令当一个参数传**，URL 用单引号包住：设备端 `sh` 会把 `&` 当后台分隔符，
  `?a=1&b=2` 只传过去 `?a=1`，页面参数静默丢失（`vvdebug` 没开、场景退回默认）。
- 先 `force-stop` 再 `am start`：Via 是 singleTask，进程在的时候第二次 `am start` 只把
  intent 交给已在前台的实例，不会重开页面 → 你以为刷新了，其实还是旧页。
- 页面路径带一次性后缀（`xxx-<r时间戳>.html`）绕开 Via 按路径命中的缓存，见 `mumu-deploy`。

### 4. 留证（可选）

```bash
adb -s 127.0.0.1:16384 exec-out "screencap -p" > .tmp/shot.png
```

**截图只留档，不作结论**。`screencap` 抓的是 SurfaceFlinger 合成帧，Via 的 WebView 不一定把
挂在 `documentElement` 下的 fixed 浮层提交进去——实测截图里只有播放器、页内 `elementFromPoint`
却命中浮层格子。判定一律用页内 DOM 断言（见 `mumu-harness`）。

## 输出到下游

交付给 `mumu-deploy` / `mumu-verify` / `mumu-measure` 的是同一个东西：**一个可复现的起点**。
所以每一步失败都要抛出人能读懂的原因，不要静默继续——静默继续的代价是后面所有断言都失真。

## 已知坑（都会让结论完全失真）

| 现象 | 原因 | 处置 |
| --- | --- | --- |
| 第二个进程里 `reverse` 莫名失效 | adb daemon 随进程回收 | 每个进程开头 `adb connect` + `reverse` 各做一次 |
| `cat /data/data/...` 输出成 `D:/data/...` 或报文件不存在 | Git Bash 把 `exec-out` 后的 `/data/...` 当 Windows 路径改写 | 整条命令当一个参数传：`exec-out "cat /data/..."`；`push` 时加 `MSYS_NO_PATHCONV=1` |
| 页面参数丢了一半 | `&` 被设备 shell 当命令分隔符 | 整条 `am start` 包成一个参数，URL 用单引号 |
| `am start` 后页面计数器停在 1、`setInterval` 不跑 | 新开的是后台标签，被 Chromium 冻结 | 判据：底部工具栏标签数必须是 1，或上报里 `hidden=false`；改测内容优先「改文件 + 点刷新」而不是反复 `am start` |
| 想开第二个 Via 页面但只把第一个切到前台 | Via 声明 singleTask，adb 开不出第二个标签 | 只能由页面自己 `window.open`（见 `e2e/mumu-tab.html` 的链条式开页） |
| `ADB` 默认值在两处脚本里不一样 | `mumu-quality.mjs` 默认指向 MuMu 自带的 `nx_main/adb.exe`，其余指向 `android-tools/platform-tools/adb.exe` | 不要依赖默认值，调用时显式 `ADB=...`；两台 adb 都能连 16384 |

更多命令级细节（含 `dumpsys`、`am force-stop` 时序、端口占用排查）见
`references/adb-playbook.md`。

## 验收

- `adb connect` 输出 `connected to 127.0.0.1:16384`
- `getprop sys.boot_completed` = `1`
- `pm path mark.via` 含 `package:`
- `adb reverse --list` 含 `tcp:8099 tcp:8099`
- 设备侧浏览器里能看到页面内容（不是白屏/404）
- 页面内 `__vv.VV.version` 与 `dist` 的 `@version` 一致（不一致 → `mumu-deploy`）
