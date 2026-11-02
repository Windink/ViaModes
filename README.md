# ViaModes · Via 视频嗅探播放器

一个适用于 **Via 浏览器（Android）** 的油猴脚本（UserScript），实现「网页视频嗅探 + 全屏播放器」体验。

- 产物：`dist/via-video-player.user.js`（单文件，~490KB，内含 hls.js）
- 无需 npm 依赖，`node build.mjs` 即可从 `src/` 合并构建

## 功能

### 嗅探
- 拦截 XHR / fetch 网络请求 + DOM 扫描 + 页面文本扫描（支持站内相对地址）
- 资源计时补扫：`PerformanceObserver` + `performance.getEntriesByType('resource')`，能看到脚本注入前和页面自行加载的媒体 URL，补足油猴没有 `chrome.webRequest` 的盲区
- 识别 `mp4 / m3u8 / webm / mkv / flv / mov / avi / mp3 等音视频` 与 blob 原生流
- m3u8 自动识别主清单，合并各码率/音轨/字幕子清单；主清单 body 因 CORS/代理读不到时，也会用 `master/manifest/playlist.m3u8` 的目录登记过滤子目录变体（如 Apple `v2/prog_index.m3u8`）；同时过滤 HLS 的 fMP4 分片（`main.mp4 / init.mp4 / seg-1.mp4`），列表只留可播放的一条，不刷屏
- 自动去重，悬浮角标显示嗅探数量，可拖动换边
- 列表按「能不能播」排序，而不是按抓到的先后：直链 → 视频主清单 → 音轨清单 → `blob:`。嗅探到达顺序本身就是随机的（同一个某视频站点页面两次加载，第一条可能在视频清单和音轨清单之间跳），按到达顺序排会让用户点开就是黑屏
- 音轨清单单独标注 `m3u8·音轨`：某视频站点这类站点会同时吐出 `/asp/hls/`（视频）和 `/asp/hlsaudio/`、`/asp/audio/…/mp3/`（音轨），不标出来用户分不清为什么只有声音
- `blob:` 永远排最后：它只是页面自己 MSE 会话的句柄，脱离原上下文单独播放必然是 `readyState=0` 的白屏，不能占第一位
- 点开角标 → 底部列表：▶ 内置播放器播放 / ⭳ 下载 / ⧉ 导出给外部播放器

### 抗页面广告遮挡
- 角标、嗅探面板、播放器、toast、续播提示统一使用 CSS 最高层级 `2147483647`，并直接挂在 `<html>` 下
- 显示时优先用 `moveBefore` 原子移到 `<html>` 末尾（旧 WebView 回退 `appendChild`），同层级广告也压不过
- 角标 / 面板 / 播放器每 2.5 秒采样检测，只有实际被广告盖住才重新置顶；拖动角标或滑动面板时暂停检测，避免打断操作
- 播放器重排使用原子移动，实测不会中断 `<video>` 播放、不会重置进度

### 流畅度优化（针对“视频卡”）
- 嗅探不再在每次 DOM 变动时全量扫描整页：MutationObserver 只处理新增节点，150ms 合批、每批最多 120 个节点
- XHR/fetch 文本扫描先做 `.m3u8 / .mp4 / ...` 低成本预检，避免对每个 JSON 响应都跑大正则
- 亮度/音量手势只改画面，停手 500ms 后再写存储；关闭播放器或切后台立即落盘，避免每帧同步写 GM
- 播放进度改为每 10s 保存一次，并用内存缓存进度表，减少 GM 同步读写
- HLS 默认从低码率起播、按播放器尺寸限制清晰度；缓冲区 36s / 最大 72s / 50MB，回看缓冲压到 20s，把内存让给前向缓冲
- HLS 分片超时按状态切换：正常播放 10s（慢分片尽快失败，让 ABR 降档重试），seek 时放宽到 45s（慢 CDN 也不中途 abort）。有分片正在加载时 watchdog 不再调用 `startLoad`，避免慢 CDN 被反复中断、越等越慢
- 手动切清晰度走 `nextLevel`，等下一个分片边界平滑切换；不再用 `currentLevel`（那会立刻 flush 缓冲重拉，弱网下切完必卡几秒）
- 起播带宽估计从 500kbps 提到 2Mbps，减少前 30 秒在最低档爬坡、每次升档吃空缓冲
- 诊断面板直接输出「下载 X KB/s / 需要 Y KB/s / 负载 Z%」，并给一句结论：源限速、解码超载、还是策略偏紧
- 打开播放器时自动暂停页面里正在播放的背景 `<video>/<audio>`，关闭后恢复，避免抢带宽、抢解码器

### 跳转稳定性
- 手指在播放器上时暂停置顶检测，避免广告重排触发 `touchcancel`，导致“进度条拖了但不跳”
- 进度条的 `touchend` / `touchcancel` 都会提交跳转；横滑 seek 被系统取消时也会提交预览目标
- 统一 seek 入口按 `seekable` 范围夹紧；服务器不支持 Range 时明确提示，而不是静默失败
- HLS seek 超时先重试目标位置，仍失败则回到最近正常播放的位置，不再直接跳回 0
- 慢分片（首字节 20s+）会继续等待而不是中断重来；实测跳到 367s 在约 21s 后成功，无回退、无卡死

### 多页面同时播放的治理（针对“开几个 m3u8 就全挂”）
- 手机上 Via（Android WebView）的视频解码走 MediaCodec，**同时可用的解码器实例数是硬上限**（典型 4~8 个，且分辨率越高越紧张）；Android WebView 不支持原生 HLS，每个 m3u8 页面还要额外跑一套 JS 解封装，CPU/内存开销翻倍
- 关键事实：**切后台的标签页不会释放解码器**，只有页面被销毁（关闭标签）才会还回去。解码器分配失败后 WebView 渲染进程不会重建，于是表现为“所有视频都看不了，只有重启 Via”
- 脚本用一张**跨页面播放登记表**（GM 存储，2.5s 续登、9s 过期）知道还有谁在播，两种模式可切换：
  - **单实例模式（默认）**：只有最早登记的页面在播，其余自动挂起（`stopLoad` + pause）→ 并发解码器压到 1，防耗尽
  - **多页并行模式（脚本菜单 / 播放器菜单可切换）**：允许多个页面同时播，并按并发数自动压缩每页的资源预算：

| 并发页数 | 每页缓冲 | 每页内存上限 | 清晰度上限 |
| --- | --- | --- | --- |
| 1 | 36s | 50MB | 自动 |
| 2 | 20s | 24MB | ≤480P |
| ≥3 | 12s | 12MB | ≤360P |

  解码器占用跟分辨率强相关（1080P 一路大约是 360P 的 6~8 倍），并行时主动压档是“能同时播几个”的关键，而不是让 ABR 随机撞墙
- 挂起超过 20 秒会**彻底销毁 hls.js 实例**释放 MediaCodec，而不是只暂停占着不放；回到前台自动恢复（必要时重建实例并回到原进度）
- 页面切后台时，连页面原生 `<video>/<audio>` 也一并处理（默认「标签页休眠」：摘掉 src 真正释放解码器；关掉休眠则只暂停）；页面关闭时销毁实例
- 解码持续失败时给出明确提示而不是静默卡死，并提供「重建播放实例」（菜单里也有）——实例坏掉就地重建，不用重启浏览器
- 脚本菜单新增「强制关闭播放器」：播放器层或页面被卡住时的逃生门，强制拆掉全屏层并解除 `overflow:hidden` 冻结
- 加固了 `closePlayer`：以前任何一步抛错都会导致后面的解冻与移除播放器层不执行，页面被“冻住”后看起来像整个浏览器坏了

### 标签页休眠（回收后台资源）
- 浏览器（Chrome 等）遇到多标签视频卡死时，会**丢弃后台标签页**来回收内存与解码器；Via 的 WebView 没有这套机制，脚本只能自己做一份**更精确的版本**
- 这里做的是**页面级媒体休眠**，不是整页丢弃：
  - 页面切到后台时，把页面里原生 `<video>/<audio>` 的 `src` **摘掉并 `load()`**——这一步才真正归还 MediaCodec 占用（只 `pause()` 的话元素仍然占着一个解码器）
  - 卸载前记录 `src` / `currentTime` / 是否在播放，回前台自动装回 `src`、`load()`、回到原进度并继续播
  - 页面 DOM、表单、脚本状态全部保留，只有媒体管线被回收——比浏览器"丢弃标签页"温和得多，回到前台不用重新加载页面
  - 内置播放器的 `<video>`（MSE/blob 流）不参与摘除（blob 流摘了恢复不了），它由内置播放器自己的挂起/销毁机制处理
  - DRM（`mediaKeys`）流不动，避免破坏鉴权会话
- 内置播放器在后台超过 20 秒会**彻底销毁 hls.js 实例**归还解码器，回前台自动重建并回到原进度
- 有些 WebView 壳切标签时**根本不派发 `visibilitychange`**，所以额外加了 1.5 秒的焦点轮询（`document.hasFocus()`），看到"曾有焦点→现在没有"就当作进了后台
- 脚本菜单可开关：「后台释放解码器 / 标签页休眠（当前：开/关）」，默认开启；关掉后退回"只暂停不释放"的保守行为

### 交给外部播放器（VLC / mpv / N_m3u8DL）
- 站内能播、把链接复制到 VLC 就失败，本质是**链接离开了页面上下文**：缺 Referer 被防盗链挡、缺 Cookie 鉴权不过、签名已过期
- **「用外部播放器播放」**（浮层里的一等按钮，也是播放器菜单项）：生成 `intent://` 链接唤起系统选择器，把播放交给 **另一个 App 的独立进程**去解码。这是"多路并行不打架"的关键——外部播放器各有自己的 MediaCodec 配额，一个崩了也不牵连 Via 的 WebView
  - HLS 用 `application/vnd.apple.mpegurl`，另配一个 `application/x-mpegURL` 兼容按钮（不同播放器注册的 MIME 不一样）
  - 能不能唤起取决于 Via 是否放行外部应用跳转；没反应就用「导出 .m3u」
- 「⧉ 导出给外部播放器」会生成 `.m3u` 播放列表，把当前页 Referer 和 UA 写进 `#EXTVLCOPT`，外部播放器打开就能过防盗链
- 同时提供 `curl -A <UA> -e <Referer> -o xxx.m3u8 <url>`，在电脑上直接拉流或交给 N_m3u8DL-RE
- 「自检兼容性」用三种请求（裸链 / 加 Referer / 再加 Cookie）探测同一地址，状态码一比就知道缺的是哪一项，并直接给结论
- 探测优先用 `GM_xmlhttpRequest` 走 native 通道，不受页面 CORS 限制，行为最接近外部播放器

### 播放器
- 全屏自制 HTML5 播放器（不走 Via 自带播放）
- 手势：
  - 单击 显隐控制栏；双击 左侧快退、右侧快进、中间暂停
  - 左半屏上下滑 = 亮度（遮罩模拟并记忆）
  - 右半屏上下滑 = 音量（视频音量级）并记忆
  - 横向滑动 = 精确拖动进度（含预览时间）
  - 长按 = 临时 2 倍速播放
- 鼠标（桌面浏览器 / 接鼠标的平板）：移动显示控制栏，单击画面播放/暂停，拖动进度条跳转；触摸后 800ms 内忽略浏览器补发的鼠标事件，触屏手势不受影响
- 倍速 0.5x ~ 4x（记忆，重开自动应用）；m3u8 清晰度菜单显示档位 + 码率，多音轨流支持音轨切换（名称 + 语言）
- 加载/缓冲转圈提示，m3u8 弱网断流自动重连
- **加载进度显示**：
  - 中心环形进度条 + 实时百分比（确定态）
  - 拿不到确定进度时自动退化为旋转短弧（不确定态），不再"干转圈没有反馈"
  - 明细行显示 `已下载 3.2 MB / 7.0 MB · 412 KB/s`（直链）或 `268 KB/s · 已缓冲 12.4s`（m3u8）
  - 顶部细进度条：等待数据时横向推进，m3u8 缓冲不足时留在顶部提示
  - 直链按字节比计算真实百分比；m3u8 无"总大小"概念，按"已缓冲时长 / 15s 目标缓冲"换算
- **起播失败卡片**（不是黑屏）：源站 401/403（一次性鉴权、防盗链）、只有 `blob:` 流、12s 起播超时，都会弹出带原因的卡片，并给出「重试 / 外部播放器 / 返回」三个出口。像某综艺平台（`pm` token 被页面播放器先消费）、某影视平台（纯 `blob:`）这类站点在原理上就无法被第三方播放器接管，明确告知比无限转圈有用
- **进度记忆**：跨站点记住每个视频位置并自动续播。key 用视频 ID（路径里的 32 位 hex / UUID）而不是域名——多 CDN 站点（某视频站点、腾讯等）同一个视频每次刷新都换 CDN 域名，用域名做 key 会导致进度永远记不住；用 ID 还能让同一视频的视频清单 / 加密清单 / 音轨清单共享同一份进度
- **标题**：m3u8 的文件名常常没有信息量（某视频站点所有清单都叫 `main.m3u8`），这类通用名（`main/index/playlist/master/…`）会自动改用页面标题，否则标题栏就显示一个"main"
- **锁屏**防误触；控制栏 4.5 秒自动隐藏；底部菜单打开期间不自动收起，点画面任意空白处即可关闭
- **片头/片尾标记**：手动标记一次，之后自动跳过
- **连播**：自动识别 URL 数字规律（`cand.m3u8` → `cand2.m3u8`）/ 同页下一集链接，播完自动继续
- m3u8 自动加载 hls.js（已内联，失败时自动按 fastly/jsdelivr/unpkg 顺序降级）
- 画中画小窗（WebView 支持时可用）与全屏（横竖屏）
- 从播放器直接 ⭳ 交给 Via 下载（带 Referer，规避部分防盗链）

### 脚本菜单（Via 菜单 → 脚本）
- 嗅探结果面板 / 全局嗅探开关 / 本站开关（禁刷某站）
- 默认倍速切换 / 清除所有进度 / 关于
- 重建播放实例 / 强制关闭播放器
- 多页并行播放（开关）
- 后台释放解码器 / 标签页休眠（开关，默认开）
- **资源释放自检 / 立即强制释放播放器资源**（真机排查用；Via 没注册菜单时长按嗅探角标 0.7 秒同样能打开）

### 退出播放器时的解码器释放（真机机制）
Android WebView 上 `pause()` 只是停播，MediaCodec 仍被 media 进程持有。真正让它归还的只有
「元素还在文档里时，把 video 打回无资源状态」这一条路径，所以顺序是：

```
stopLoad → detachMedia → destroy(hls)
  → pause → srcObject=null → 摘 src → 清 <source> → load()   ← 元素必须仍在 DOM 中
  → 80ms 后二次硬释放，再移除播放器层
  → 900ms 巡检：实例池非空且播放器已关闭时再补一次
```

**先 `removeChild` 再 `load()` 是无效的**（脱离文档后 load 基本是空操作），这类写法会让解码器一直被占着，
直到整页销毁才归还——表现就是"退出播放器后卡住，关掉页签过一会才恢复"。

### 直接关掉标签页（这条路径不经过 closePlayer）

用户点标签页的 ✕ 时，`closePlayer()` 完全不会执行。此时页面已经在销毁流程里，
**定时器、微任务、异步回调都不会再跑**，所以任何"稍后再释放"的兜底都等不到。
`vvHardTeardown()` 就是为这条路准备的，全部同步完成：

```
停后台定时器/焦点轮询/加载轮询 → stopLoad+detachMedia+destroy 全部 hls 实例
  → 硬释放 VID → 遍历 DOM 里所有 video/audio 逐个硬释放 → 清池、置 _suspended
```

**真机实测（小米 14 Pro / Android 16 / WebView 143，`c2.qti.avc.decoder`）：**

- **Via 关标签页只派发 `beforeunload`，不派发 `pagehide`**。所以清理必须挂在 `beforeunload` 上，
  否则永远不会触发；`pagehide`（非 bfcache）保留作为标准路径的兜底。
- 同一页面三个时刻的状态对比（m3u8，`scripts/android-close-tab.mjs --mode=hls`）：

| 时刻 | video 有 src | paused | hls 池 | 系统 codec |
|---|---|---|---|---|
| 播放中 | true | false | 1 | 存活 1 |
| 关之前一刻 | true | false | 1 | 存活 1 |
| `beforeunload` 清理后 | **false** | **true** | **0** | **destruct=1，存活 0** |

- 清理时间戳 `VV._lastTeardown` 与 beforeunload 同一毫秒，可用来区分"是我们清的"还是"WebView 自己回收的"。
- mp4 / m3u8 两条路径各 3 轮：configure 与 destruct 数量一致，结束存活 0。

> `beforeunload` 可能被取消（页面活下来），所以这条路径不置永久标记、不清定时器；
> `pagehide`（persisted=false）才置 `_vvTornDown` 并清定时器。`pageshow` 会复位该标记，
> 否则 bfcache 恢复后再次关标签页就静默失效了。

### 真机测试的两个 Via 专有坑

1. **`document.write` 插入的 `<script>` 在 Via 里不执行**，必须 `createElement` + `appendChild`。
2. **Via 按 URL 路径缓存子资源**，`?t=` 时间戳和 `Cache-Control: no-store` 都拦不住，
   改了构建仍跑旧版。唯一可靠做法是每次换路径（服务器把 `/dist/vv-<数字>.js` 映射回产物）。
3. 另外：**Via 会把已安装的同名用户脚本注入每个页面**（iframe 不注入）。如果没在 Via 里停用它，
   页面里测到的 `window.__vv` 是 Via 注入的旧版，结论会完全反过来——接口数量对不上就是它。

### 多标签页 / 多播放器（真机实测）

单页反复开关只能证明"关闭时归还"，证明不了"多个页面同时活着时会不会把解码器池占满"。
真机上用 `scripts/android-multitab.mjs` 实测（小米 14 Pro / Android 16 / WebView 143，解码器 `c2.qti.avc.decoder`）：

| 场景 | 峰值存活 | configure / destruct | 结束存活 |
|---|---|---|---|
| 10 个标签页，各播 mp4 直链 | 1 | 10 / 10 | 0 |
| 10 个标签页，各播 m3u8（MSE） | 4 | 10 / 10 | 0 |
| 同一页 10 路 mp4 并发 | 10 | 10 / 10 | 0 |
| 切到子页 → 子页关闭 → 回前台 | 1 | 2 / 1 | 1（前台在播） |

关键结论：

- **mp4 直链后台几乎立刻归还**（1~2 秒），因为 WebView 冻结页面时会一同回收媒体资源。
- **m3u8 走 MSE，靠 `vvEnterBackground` 里那个 20 秒定时器归还**，峰值 4 是"20 秒窗口内叠了 3 个后台页 + 1 个前台"，远低于池上限。
- **切回被冻结的页签能自动恢复播放**：`vvLeaveBackground → vvResumePlayback`，hls 实例没了就走 `vvRebuildMedia()` 重建，实测画面正常回来。
- 由此修掉一个隐患：`vvReleaseDecoder()` 原来要求 `VV.active.hls` 存在才继续，导致**直链 mp4 在后台永远不主动释放**，只能指望 WebView 冻结时顺手回收。现改为按"有没有在播"判断，直链同样摘 `src` 归还解码器。

测试方法上有两个坑（都写进脚本注释了）：

1. Via 是 singleTask，`am start` 第二次只会把 intent 交给已在最前的实例，**adb 开不出第二个页面**；只能由页面自己 `window.open`。
2. Via 默认拦截弹窗，一次 burst 开 10 个只会成功 1 个；改成**链条式**（每个新页开下一个）才能稳定开到 10 个。另外 `force-stop` 后要等 ~2.8s 再 start，否则 intent 被旧实例吃掉，看到的还是上一次的残留页。

### 开源方案借鉴
Via 不能直接安装 Chrome/Firefox 扩展，但可以借鉴成熟项目的设计，再落到油猴 API 上：

- **cat-catch**（GPL）：借鉴“主清单优先 + 子资源去重”的嗅探思路，以及只保留可播放资源的列表过滤策略；未复制其 GPL 代码。
- **hls.js**（Apache-2.0）：内联 light 构建；参考官方 API 的 `loadPolicy`、`maxBufferHole`、`nudgeOffset`、`nudgeMaxRetry`、`highBufferWatchdogPeriod`、`startFragPrefetch` 等移动端配置，并按 `NETWORK_ERROR` / `MEDIA_ERROR` 分别做 `loadSource`、`startLoad(pos)`、`recoverMediaError`、`swapAudioCodec` 恢复。
- **ArtPlayer / xgplayer**：借鉴画质/音轨菜单的信息层级（清晰度 + 码率、音轨名称 + 语言）和移动端底部 sheet 交互。
- **video.js / Plyr**：借鉴统一的 seek 入口、进度条拖动提交、错误提示和状态恢复方式。

## 安装（Via）

1. 把 `dist/via-video-player.user.js` 发到你手机（网盘/微信/QQ 均可）
   - 若 手机选不中 `.js` 文件，先把后缀改成 `.txt`
2. 打开 Via → 设置 → **通用（或 更多） → 脚本 → 右上角 + → 导入脚本**，选择上述文件
3. 或者：手机上直接打开一个 `.user.js` 结尾的文件链接，网页加载完会弹窗确认安装
4. 进入任意网页点击播放器后，右侧出现蓝紫色圆形角标即为嗅探成功
   - 菜单入口：长按 Via 菜单中的设置，把「脚本」移入菜单一处即可随时开关

> Via 版本 ≥ 4.4.2 支持油猴 API，建议 ≥ 5.x。脚本整体 < 4MB 的限制，本脚本为 ~490KB，安全。

## 实测记录（桌面 Chromium + 真实网络）

测试页：`e2e/index.html`（本地 mp4 + 真实 HLS 流 `bitdash-a.akamaihd.net` Sintel / `demo.unified-streaming.com` Tears of Steel，后者 5 档码率且支持 CORS）。

| 项目 | 结果 |
| --- | --- |
| mp4 直链播放 / 原生控制条关闭 / 标题 | 通过 |
| m3u8 主清单嗅探、子清单合并、hls.js 播放 | 通过（bitdash 8 档 / unified 5 档码率，含倍速） |
| 资源计时独立嗅探 | 通过（`responseType=arraybuffer` 的 XHR 不走文本钩子，仅靠 PerformanceObserver 也能入列） |
| HLS fMP4 分片过滤 | 通过（Apple fMP4 测试流只保留主清单，`main.mp4` / `prog_index.m3u8` 不再刷屏） |
| 画质菜单 | 通过（自动·当前高度 + 5 档清晰度/码率，切换后 chip 更新） |
| HLS 慢分片 seek | 通过（unified 流跳到 367s，分片首字节约 21s，最终成功；无回退、无中断） |
| 倍速记忆、锁屏/解锁、横滑 seek | 通过 |
| 鼠标操作 | 通过（播放中移动鼠标显示控制栏；单击画面暂停/播放；拖动进度条 70% → 3.54s） |
| 进度条拖动 / 横滑 seek / 双击快进快退 | 通过（含拖动中注入全屏广告、`touchcancel` 场景仍能提交跳转） |
| 服务器不支持 Range 的 mp4 | 通过（提示“该视频不支持跳转”，不会假装跳转） |
| 关闭后续播（刷新后仍续播） | 通过（mp4 稳定；HLS 弱网下会重试，仍失败则提示并回到最近位置） |
| 抗广告遮挡：向 `<html>` 注入全屏假广告 | 通过（角标 / 面板 / 播放器均在 ~3.2s 内恢复置顶） |
| 角标拖拽换边 / 面板触摸滚动不被置顶打断 | 通过 |
| 动态新增 `<video>` 节点嗅探 | 通过（角标数量 3 → 4，无需刷新） |
| 播放器打开时暂停页面背景媒体 / 关闭后恢复 | 通过（背景 `<video>` 暂停，关闭后继续播放） |
| 亮度/音量手势写入防抖 | 通过（手势中不写存储，停手 500ms 或关闭播放器时落盘） |
| HLS 续播卡在未缓冲分片时的自动恢复 | 通过（45s 超时重试；有分片在加载时只等待，必要时兜底到最近位置） |
| 分片超时动态切换 | 通过（seek 中 45000ms，恢复播放后自动回到 10000ms） |
| 慢网远程 seek | 通过（实测 13KB/s 带宽下跳到未缓冲位置仍能落地） |
| 卡顿根因判定 | 通过（真实 HLS 源，诊断输出「下载 13KB/s，播放要 62KB/s → 源或 CDN 限速」） |
| 手动切档不 flush 缓冲 | 通过（`nextLevel` 进入手动模式，`currentLevel` 保持不动） |
| 外链自检识别防盗链 | 通过（本地 `/guard/stream.m3u8` 强制校验 Referer：裸链 403、带 Referer 200，判定为「防盗链」） |
| 导出 .m3u 带页面上下文 | 通过（含 `#EXTVLCOPT:http-referrer` 与 UA，末行为原始链接） |
| 外部播放器浮层 | 通过（6 个按钮，含「用外部播放器播放」） |
| intent 链接格式 | 通过（`intent://` + scheme + ACTION_VIEW + 正确 MIME，查询串保留、分号转义） |
| 跨页面播放锁 | 通过（别页占权时本页自动挂起并暂停，对方退出后自动恢复） |
| 多页并行模式 | 通过（并发 2 时不挂起、缓冲压到 20s/24MB、清晰度限 ≤480P；回到单页恢复 36s 与自动档） |
| 实例原地重建 | 通过（`重建播放实例` 后 hls 实例重新就绪，进度保留） |
| 强制关闭逃生门 | 通过（拆掉播放器全屏层 + 解除 `overflow:hidden` 冻结） |
| 标签页休眠 | 通过（后台摘掉页面原生 `<video>` 的 src 并记下进度，回前台装回 src 且内置播放器 video 不受影响） |
| UI 交互功能矩阵 | 通过（91 项：角标/面板/单击显隐控制栏/双击快进快退/横滑 seek/左右竖滑亮度音量/长按加速/倍速 8 档/画质切档/锁屏/进度条拖动/更多菜单 12 项/菜单点空白关闭与不自动收栏/关闭后解冻与页面媒体恢复/进度记忆续播/下载链接/加载进度 19 项） |
| 加载进度显示 | 通过（环形进度 0/50/100% 与 dashoffset 严格对应、超 100% 钳位、不确定态切动画、明细行写字节与速度、缓冲时显示遮罩与顶部细条、恢复播放后收起） |
| 起播失败卡片 | 通过（结构 retry/ext/close、能显示标题与原因、出现时收起加载遮罩、能关闭；看门狗可挂起/可解除不误报） |
| 无未捕获 JS 报错 / 无控制台 error | 通过 |

截图：`e2e/screenshot-badge.jpg`（角标）、`e2e/screenshot-panel.jpg`（列表）、`e2e/screenshot-mp4.jpg`、`e2e/screenshot-hls.jpg`、`e2e/share-probe.png`（外链自检）、`e2e/bench-mp4.png`、`e2e/bench-hls.png`、`e2e/load-pct.png`（加载进度确定态）、`e2e/load-indet.png`（不确定态）。

### 真实站点实测（某视频站点点播页，国内正规平台）

目标：`video.example.com/2020/05/28/VIDE30h8zPNlq5WoButIy45J200528.shtml`（《一诺无悔》第 1 集，45:23）。这是国内典型的真实场景：页面自己用 MSE + `blob:` 播放，m3u8 走多 CDN 轮换，且一次吐出视频主清单 / 加密清单 / 音轨等多条清单。

| 项目 | 结果 |
| --- | --- |
| 资源嗅探 | 通过（5 条：视频主清单 ×2、加密清单、音轨 ×2、`blob:`；首条为可播视频清单） |
| HLS 播放 | 通过（hls.js + MSE，`readyState=4`，片长 2723.5s） |
| 起播加载进度 | 通过（652ms 不确定态 → 1573ms「3.1 MB/s」→ 1682ms「21%」+「3.1 MB/s · 已缓冲 3.2s」→ 起播收遮罩） |
| 标题 | 通过（从 m3u8 文件名 `main` 纠正为页面标题《一诺无悔》第1集） |
| 拖到 30% seek | 通过（目标 817.1s → 实际 819.4s） |
| 倍速 | 通过（8 档：0.5x~4x，选 2x 生效） |
| 画质切换 | 通过（多档主清单 4 档：270P/360P/720P/720P；单档媒体清单不出画质项，属正常） |
| 关闭 → 重开续播 | 通过（关闭前 821s → 重开后 824s） |

复现：`node scripts/real-site-test.mjs`（需外网；`PORT=` 可指定本地服务端口，`PICK=n` 指定播放第 n 条）。

这一轮实测直接揪出并修掉了 4 个真实缺陷（详见「功能 → 嗅探」里的说明）：`blob:` 抢占列表第一位、音轨清单被当成视频、进度 key 含 CDN 域名导致跨会话记不住进度、标题直接显示 `main`。

### 多站点分发策略实测（`node scripts/site-matrix.mjs`）

不同站点的分发方式差别很大，逐个跑一遍看覆盖面和缺口：

| 站点 | 分发策略 | 嗅探 | 内置播放 | 说明 |
| --- | --- | --- | --- | --- |
| 某视频站点 | 多码率 HLS + 多 CDN 冗余 + `blob:`(MSE) | 5 条（含音轨清单） | ✅ `rs=4` | 画质 4 档可切；进度用缓冲时长算 |
| 某新闻网 | 直链 `mp4`（对象存储 CDN） | 4 条 | ✅ `rs=4` | 字节进度可用，起播最快 |
| 某视频平台 | `mp4` + `vkey` 时效直链、加密 HLS、`blob:` | 8 条 | ✅ `rs=4` | `vkey` 有时效但窗口内可复用 |
| 某综艺平台 | HLS + **一次性 `pm` token** + 三 CDN 冗余 | 5 条 | ❌ `rs=0` | 页面播放器先消费了 token，第三方再请求必 403 |
| 某影视平台 | **仅 `blob:`**（MSE 会话句柄） | 1 条 | ❌ `rs=0` | 离开页面上下文拿不到数据 |

结论：**直链 / HLS 类（3/5）能直接接管播放；一次性鉴权与纯 `blob:` 类（2/5）在原理上就做不到**。
对这 2 类站点，现在的行为不再是"黑屏 + 无限转圈"，而是弹出**起播失败卡片**：

- 标题「这个视频源播不了」+ 具体原因（`HTTP 403 拒绝第三方播放` / `这是页面自己 MSE 会话的句柄（blob）` / `起播超时`）
- 三个出口按钮：**重试** / **外部播放器** / **返回**
- 触发条件：HLS 拿到 401/403 立即弹（不再无意义重试）；直链 `MEDIA_ERR_SRC_NOT_SUPPORTED` 或 `blob:` 立即弹；其余情况 12s 看门狗兜底


> 抗遮挡测试方法：向 `<html>` 末尾注入 `position:fixed; z-index:2147483647` 的全屏假广告，插件界面会在一轮检测内重新置顶。
>
> 实测环境到 Apple test streams 的 hls.js XHR 受 CORS/代理限制（原生 `<video>` 能播，但 hls.js 拉不到清单），属环境问题；HLS 播放/seek 用 CORS 可用的 unified-streaming 与 bitdash 验证。Via 真机上以实际站点为准。

## 已知限制（同油猴生态的共性）

| 限制 | 说明 |
| --- | --- |
| blob 原生流 | B 站等站点的加密流不可导出下载，只能页内播放 |
| m3u8 下载 | Via 无 m3u8 转 mp4 能力，请用导出的 `.m3u` 或 `curl` 交给 N_m3u8DL-RE / ffmpeg |
| 防盗链 | 页内播放自带页面上下文，不受影响；复制裸链给外部播放器多半会被拒，需用「导出 .m3u」带上 Referer |
| 一次性签名 | 部分站点的 token 只能用一次或几分钟内失效，导出后立刻用，过期只能回页面重新嗅探 |
| mp4 跳转 | 服务器需支持 HTTP Range；不支持时播放器会提示“该视频不支持跳转”，只能从头播放或下载 |
| iframe | Via 不支持给 iframe 注入脚本，跨域 iframe 里的视频嗅不到 |
| 亮度 | WebView 无系统级亮度权限，用黑色遮罩模拟 |
| 音量 | iOS WebView 不监听 JS 音量调整（受系统静音开关影响）；安卓 WebView 一般可用 |
| 浏览器顶层弹层 | 使用 `dialog.showModal()` / popover top layer 的广告不受 z-index 控制，本方案无法压过；普通 fixed/absolute 广告可以覆盖 |
| 卡顿归因 | 诊断里的「负载 = 播放消耗 ÷ 下载速率」。≥100% 是源/CDN 限速，换播放策略没用；<60% 仍卡才查软解与策略 |
| 解码器耗尽 | Android WebView 的 MediaCodec 实例数是硬上限，多开 m3u8 页面会耗尽；**关掉其他标签页**（不是切后台）就能归还解码器，不必重启 Via。脚本已把并发收敛到 1、在挂起时释放解码器、并在后台自动休眠回收资源，但无法突破系统上限 |

## 开发

```
src/
  00-core.js     共享核心（状态、存储、媒体识别、HLS 主/子清单与分片过滤、push/扫描、toast）
  10-sniffer.js  XHR/fetch 钩子 + MutationObserver + DOM 扫描 + 资源计时（PerformanceObserver）
  11-style.js    全部 CSS（模板字符串）
  20-ui.js       悬浮角标 + 嗅探列表面板 + 下载/复制
  30-player.js   播放器骨架（DOM、控制栏、加载 hls、生命週期）
  31-player-x.js 手势、进度拖动、倍速/画质/菜单 sheet、连播检测
  32-share.js    外部播放器导出（.m3u / curl）与链接兼容性自检
  33-multiplayer.js 跨页面播放登记表、并行资源预算、标签页休眠（回收后台解码器）、实例重建/强制关闭
  40-menu.js     脚本菜单命令、连播页面跳转消费
  50-boot.js     启动流程（DOM ready 后初始化）
vendor/hls.light.min.js   构建时内联（网络不可达时自动降级为 CDN 懒加载）
build.mjs        合并 → dist/via-video-player.user.js → node --check
scripts/smoke.mjs  Node vm 烟雾测试（解析/推流/HLS 过滤/列表排序/进度 key/标题/seek/配置/外链导出/播放登记表/标签页休眠/关标签页清理 140 项断言）
scripts/serve.mjs  E2E 静态服务器（含 mp4/m3u8 MIME 与 Range；`?noRange=1` 模拟不可跳转；`/guard/*` 强制 Referer）
scripts/e2e-verify.mjs  无头 Chrome 真实链路验证（起服务器→嗅探→播放→seek→切档→诊断→外链自检，48 项）
scripts/ui-verify.mjs  UI/交互层功能矩阵（真实 Touch/Mouse 事件：手势/倍速/画质/锁屏/菜单交互/进度记忆/加载进度/失败卡片，91 项）
scripts/test-all.mjs  一键跑全套（构建→smoke→e2e→UI 矩阵→bench→截图→加载进度截图）
scripts/real-site-test.mjs  注入真实站点（默认某视频站点点播页）验证嗅探/播放/加载进度/seek/倍速/画质/续播
scripts/site-matrix.mjs  多站点分发策略矩阵（某电视台/中新/腾讯/某综艺平台/某影视平台），逐站出「嗅探→起播→进度UI」结论
scripts/bench.mjs  性能基准（本地 mp4 对照 + 公网 HLS），落两张截图
scripts/share-shot.mjs  截图「外部播放器」浮层与自检结果
scripts/load-shot.mjs  截图「加载进度」确定态与不确定态
e2e/             真实网络测试页 + 实测截图 + 本地 mp4
```

```
node build.mjs            # 构建并语法校验
node scripts/smoke.mjs    # 烟雾测试（140 项）
node scripts/e2e-verify.mjs   # 无头 Chrome 真机链路验证（需 puppeteer-core）
node scripts/ui-verify.mjs    # UI 交互功能矩阵（91 项）
node scripts/test-all.mjs     # 一键跑全套（7 阶段）
node scripts/real-site-test.mjs  # 真实站点实测（默认某视频站点，需外网）
node scripts/serve.mjs    # 另开终端，然后浏览器打开 http://localhost:8099/e2e/
```

真机（需 adb 连接、Via 已放开弹窗拦截）：

```
node scripts/android-multitab.mjs --pages=10 --mode=hls --spawn=8000
node scripts/android-multitab.mjs --pages=10 --mode=mp4
node scripts/android-multitab.mjs --recover      # 后台释放 + 回前台恢复
node scripts/android-close-tab.mjs --mode=mp4     # 直接关标签页时是否释放
node scripts/android-close-tab.mjs --mode=hls     # 同上，走 MSE 路径
```

`e2e-verify.mjs` 会自动起本地服务器、驱动无头 Chrome 走完整链路，并在 URL 带 `?vvdebug=1` 时
用到 `window.__vv` 调试句柄（`VV` / `hlsConfig` / `hlsSeekMode` / `diag`），不影响普通用户。

## License

MIT
