# adb 操作手册（MuMu + Via 专版）

只写这台环境里真出过问题的部分。通用 adb 教程不在这里。

## 环境常量

| 项 | 值 |
| --- | --- |
| MuMu 安装目录 | `E:\Program Files\Netease\MuMu` |
| 主程序 | `nx_main\MuMuNxMain.exe` |
| 实例控制 | `nx_main\mumu-cli.exe control -v 0 -ver 15 launch` |
| adb 可执行 | `E:/android-tools/platform-tools/adb.exe`（也可用 `E:/Program Files/Netease/MuMu/nx_main/adb.exe`） |
| 设备序列号 | `127.0.0.1:16384` |
| 被测包名 | `mark.via`（主 Activity `.Shell`） |
| 脚本数据库 | `/data/data/mark.via/databases/monkey` |

`mumu-quality.mjs` 的 `ADB` 默认值指向 MuMu 自带那份，其余脚本指向 `android-tools`。
两者都能连，但**不要依赖默认值**：调用时显式传 `ADB=`，否则换台机器就跑不起来。

## 启动链路

```bash
# 1) 主程序（没起的话先拉起来，否则 mumu-cli 找不到实例）
"E:/Program Files/Netease/MuMu/nx_main/MuMuNxMain.exe" &

# 2) 启动 Android 15 实例
"E:/Program Files/Netease/MuMu/nx_main/mumu-cli.exe" control -v 0 -ver 15 launch

# 3) 等 Android 起完再连，太早连会 connect 成功但所有 shell 命令超时
adb -s 127.0.0.1:16384 wait-for-device
adb -s 127.0.0.1:16384 shell getprop sys.boot_completed   # 期望 1
```

## 端口映射

```bash
adb -s 127.0.0.1:16384 reverse tcp:8099 tcp:8099
adb -s 127.0.0.1:16384 reverse --list
```

- `reverse` 让设备用 `127.0.0.1:8099` 访问开发机的服务，页面里的 URL 因此对本机与设备都成立。
- **`reverse` 的生命周期绑在 adb daemon 上**，daemon 随调用进程结束被回收 → 每次新进程都要重做。
- 慢资源套件会同时映射两个端口（静态 8099 + 限速 8300+），两个都要 `reverse`，
  否则分片请求打不到限速服务，量出来的「慢」是假的。

## 打开页面（唯一正确写法）

```bash
adb -s 127.0.0.1:16384 shell am force-stop mark.via
sleep 1.2
adb -s 127.0.0.1:16384 shell "am start -n mark.via/.Shell -a android.intent.action.VIEW -d 'http://127.0.0.1:8099/e2e/xxx-r1712345678.html?vvdebug=1'"
```

三条要点，缺一条就会白测一轮：

1. **整条 shell 命令是一个参数**，URL 用单引号。设备端 `sh` 把 `&` 当后台分隔符，
   `?id=A&max=8&mode=hls` 只有 `?id=A` 能到页面，`mode` 退回默认、`vvdebug` 没开，
   现象和「脚本没注入」一模一样。
2. **先 `force-stop` 再 `am start`**。Via 是 singleTask，进程活着时第二次 `am start`
   只是把 intent 交给已在前台的实例，不会重新加载页面。
3. **页面路径带一次性后缀**。Via 的 WebView 缓存按 URL 路径命中，`?t=` 时间戳和
   `Cache-Control: no-store` 都拦不住；`serve.mjs` 用 `xxx-<任意>.html → xxx.html`
   的别名映射把新路径映射回真实文件，缓存就永远命中不了。

## Via 只允许一个前台标签

`am start` 每调一次都会新开一个标签页（并把它压到最前），但 Via 声明了 singleTask，
**用 adb 开不出第二个标签**——想验证多标签只能让页面自己 `window.open`。
反过来，被压到后台的标签会被 Chromium 冻结：`setInterval` 不跑、`fetch` 发不出、DOM 不重绘。
表现为「视频永远 `rs=0`、页面计数器停在 1」，极像「脚本把视频搞坏了」。

判据：底部工具栏标签数必须是 **1**，或上报里 `hidden === false`。

## 截图的能力边界

```bash
adb -s 127.0.0.1:16384 exec-out "screencap -p" > .tmp/shot.png
```

`exec-out` 后面的远程路径整条包成一个参数，否则 Git Bash 会把 `/data/...` 改写成 `D:/data/...`。

`screencap` 抓 SurfaceFlinger 合成帧：Via 的 WebView 不一定把挂在 `documentElement`
下、`z-index:2147483647` 的 fixed 浮层提交进去。实测截图里只有播放器画面，页内
`elementFromPoint` 却命中浮层格子——**所以画面类结论以页内 DOM 断言为准，截图只留档**。
要截图取证，先让页面进入「hold」态并等 2.5s（让 WebView 把这一帧合成完），否则会拍到上一帧。

## 排查顺序

```
connect 失败        → 模拟器没起 / 端口不是 16384 / 两份 adb 版本冲突（先 adb kill-server 再 connect）
connect 成功但全部超时 → Android 还没起完（等 boot_completed=1）
页面 404            → reverse 没做 / PORT 与 serve.mjs 不一致 / serve.mjs 已退出
页面白屏但 200      → force-stop 后没等够 / URL 被 & 截断
参数像是丢了        → 回到「打开页面」三条要点
脚本没生效          → 先 mumu-deploy 换版，再看 mumu-diagnose
```

## 模拟器的能力边界

x86_64 镜像只有 AOSP 软件解码器（`c2.android.*`），MediaCodec 实例数几乎不受限。
所以「十个页签里只有前台能播」这个**症状不会复现**——模拟器只能证明「我们有没有交还解码器」，
不能证明「真机配额够不够」。后者要看真机的 `dumpsys media.metrics`（cfg/des 计数）。
凡是涉及「设备解码器上限」的结论，不要用 MuMu 的结果当证据。
