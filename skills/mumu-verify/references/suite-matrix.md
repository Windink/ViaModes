# 真机套件明细

每个套件的：跑什么、怎么调参、输出里看哪几行、历史上怎么失败过。
命令都在项目根目录执行，共同前置是 `mumu-device`（连接 + reverse）与 `mumu-deploy`（版本对齐）。

---

## mumu-episodes · 选集

- **页面**：`e2e/episodes-android.html`（24 集同模板链接 + 外域推荐位/预告/年份/分页干扰）
- **验什么**：真实视口下的浮层布局、点击命中、当前集高亮、切集不重载页面
- **命令**：`node scripts/mumu-episodes.mjs`
- **参数**：`ADB` `SERIAL` `PORT`
- **输出关注**：`WebView 视口`（应 360×520 量级，dpr 3）、`=== 断言 ===` 的 FAIL 行、
  最后一行 `35 passed, 0 failed`
- **超时**：300 × 300ms ≈ 90s；`!! 90 秒内没等到 done` 说明页面卡住或脚本没注入
- **失败模式**：浮层被 2.5s 一次的置顶巡检盖住 → 真机表现为「界面自己关了」。
  修法是置顶前先问 `vvHasPriorityOverlay()`，遇到分享/选集浮层必须让位
- **截图**：`.tmp/episodes-android.png` 只留档。`screencap` 抓不到挂在 `documentElement`
  下的 fixed 浮层，页内 `elementFromPoint` 却命中——冲突时以 DOM 断言为准

## mumu-pip-share · 小窗 / 导出浮层

- **页面**：`e2e/pip-share-android.html`（含 TouchEvent 拖动模拟与跨巡检窗口）
- **验什么**：系统画中画不可用时的页内小窗降级、拖动与还原、跨 2.5s 置顶巡检后浮层仍可点
- **命令**：`node scripts/mumu-pip-share.mjs`
- **输出关注**：最后一行 `40 passed, 0 failed`
- **背景**：Via 的 WebView 110 `document.pictureInPictureEnabled=false`，
  `requestPictureInPicture()` 抛 `NotSupportedError`。**不要再尝试在这套 WebView 里修系统 PiP**

## mumu-quality · 画质红线

- **页面**：`e2e/quality-android.html`（5 档 HLS）
- **验什么**：两层证据 —— ① 直接读 `__vv.hlsConfig()` 的返回值（配置源头）；
  ② 打开多档 HLS 后读运行时 `VV.active.hls` 实例的 config 与 `autoLevelCapping`
- **命令**：`node scripts/mumu-quality.mjs`
- **注意**：这个脚本的 `ADB` 默认值指向 MuMu 自带的 `nx_main/adb.exe`，与本目录其它脚本不同。
  不要依赖默认值，显式传 `ADB=`
- **无网也能跑**：内联的 hls.js 仍会创建实例，配置字段与 `autoLevelCapping` 依然可读，
  核心断言不依赖外网；只有「ABR 爬到高档」这类观察需要网络
- **判据陷阱**：ABR 在带宽不足时待在低档是**正常**的，别把「分辨率高于最低档」当断言，
  否则会把正常行为判成 FAIL（见 `mumu-verify` 的「判据也会错」）

## mumu-slow · 慢资源起播

- **页面**：`e2e/slow-android.html`，五场景逐个 drive `__vv.open`
- **场景**：`steady`（慢但不误判）/ `stall`（卡顿不重建）/ `dead`（假活仍给结论）/
  `hls-manifest` / `hls-frag`；前三个是 mp4，后两个是 HLS
- **命令**：`node scripts/mumu-slow.mjs`，约 190s；`SCENARIOS=steady,dead` 只跑指定；`LIMIT=380` 改上限
- **需要两个服务**：静态 `serve.mjs` + 限速 `slow-serve.mjs`，**两个端口都要 reverse**，
  否则分片请求打不到限速服务，量出来的「慢」是假的
- **素材**：`e2e/media/hls/*.ts`（各 10s，共 476KB）；HLS 清单在 `.tmp/hls-gen/` 按端口现生成，
  **分片必须写绝对地址**，否则挂不上不同的限速参数
- **失败时先看什么**：脚本会打印「判据时间线」——`startDiag()` 的 `flow/httpCode/netFail/manif`
  就是为这件事加的。先看时间线再改代码
- **判据红线**：`dead` 只看 `_lastHttpCode >= 400`。**不要把 hls.js 的重试次数 `_netFail` 当判死依据**：
  弱网下它会按 `maxTimeToFirstByteMs` 超时重试、刷 3 次以上 NETWORK_ERROR，而请求还挂着
  （v0.1.77 前因此 12s 弹卡片、13s 又自己恢复）

## mumu-resume · 续播起播耗时

- **页面**：`e2e/resume-android.html`（播到设定秒数 → 关 → 再开）
- **验什么**：`metadata / seeking / seeked / playing` 的时间点；同一份已缓存文件重复 N 轮取中位
- **命令**：`node scripts/mumu-resume.mjs`；`ROUNDS=3`、`ONLY=mp4`、`SAVE=1`
- **基线**：`SAVE=1` 把本轮结果写成 `.tmp/resume-baseline.json`，之后不带 `SAVE` 跑会自动打印对比。
  **测量类改动必须先存基线，否则「有没有变好」只能靠感觉**

## mumu-loading · 起播封面 + 加载 ETA

- **页面**：`e2e/loading-android.html`，六场景：`item-poster` / `no-poster` / `poster` /
  `eta-slow` / `eta-hls` / `xhr-progress`
- **验什么**：起播等待期必须铺封面、首帧一到立刻摘掉、慢网下明细给「已下载 x / 总量」与「约 Ns」、
  低特效模式下封面不许再走 `blur`
- **命令**：`node scripts/mumu-loading.mjs`；`ONLY=poster-eta` 只跑指定场景
- **限速素材现生成**：`writeEtaManifest()` 按本轮随机端口生成 `eta-frag.m3u8`
  （首片 245KB @16KB/s ≈ 15s，清单本身不限速）
- **版本不一致直接判无效**：`env.version !== env.expect` 时打印
  `!! 设备脚本版本与 dist 不一致，本轮结论无效` 并置非 0 退出码
- **输出关注**：`=== 现场诊断 ===` 里的 `eta-slow` / `eta-hls`（`firstFrameAt`、`seenEta`、`dts` 时间线）
  和 `xhr`（`n` 次进度事件、`total`）

## mumu-perf-play · 播放态帧率

- **页面**：`e2e/perf-play-android.html`（页内 rAF 采样）
- **场景**：无菜单 / 默认低特效 / 强制毛玻璃，各 4s × 2 轮
- **命令**：`node scripts/mumu-perf-play.mjs`
- **判据**：60Hz 下平均帧间隔 >25ms 判跳帧
- **基线参考**（Via 7.3.3 / WebView 110）：半屏 `blur(20px)` 平均 22.34ms、P95 41.66ms、
  长帧率 29.87%；关掉模糊 16.70 / 16.67 / 0.21%。所以产品默认开 `lowFx`
- **探针要「强制加回毛玻璃」时**，选择器必须写成 `.vv-player-root.vv-lowfx .vv-sheet.vv-sheet`
  （重复一个 class）：产品规则带 `!important` 且是三段选择器，普通 `.vv-sheet` 压不过

## mumu-hlsperf · 内联 hls.js 每页成本（一次性量化，非回归）

- **命令**：`ROUNDS=5 node scripts/mumu-hlsperf.mjs`
- **量什么**：同一份源码在设备 WebView 里「编译 + 执行」的冷/热成本、只建函数（按需编译真正要付的钱）、
  整份 dist 预解析耗时
- **两条硬要求**：计时前静置 400ms（否则冷轮漂 30~85ms，曾量出 16ms 的热态数）；
  每页成本按**冷轮**算（新页面 = 新 realm），热轮不能当成本
- **门槛写死在脚本里**：省下的时间 < 2 帧（33ms）视为噪声，那就不该为它引入一条会坏的加载路径

## mumu-open-ab · 起播耗时对照（网页 vs 插件）

- **命令**：`node scripts/mumu-open-ab.mjs`
- **模式**：`MODE=ab`（默认，mp4）/ `MODE=resume`（看完再点开同一视频，验续播位置）/
  `MODE=hls`（网页臂用同一份内联 hls.js 挂裸 `<video>`，比「包一层之后」的差异）
- `PHASE=churn`：播放器底下加一层一直在动的元素，模拟弹幕/广告/轮播，验证「页面在动」是不是卡顿来源
- `ARMS=page,plugin` 控制跑哪几臂；`SRC=` 覆盖素材
- HLS 素材走 `serve.mjs` 的 `/__hls` 镜像（第一次从公网拉、之后本地缓存），
  否则国内拉 1080p 分片要 20s+，两臂都卡在 CDN 上，量不到播放器差异

## mumu-real-ab · 真实站点有/无脚本

- **命令**：`SITE=cctv PAIRS=3 node scripts/mumu-real-ab.mjs`，`KEEP=1` 保留探针
- **前置**：`e2e/sites.local.json`（结构见 `e2e/sites.example.json`，真实站点清单不入库）
- **方法**：额外装一条极小探针（`e2e/ab-probe.user.js`），两臂都装、都用它取数；
  唯一变量是**主脚本 `enabled` 置 0 还是 1**；交替跑 N 对取中位数
- **取数**：https 页面不能 POST 到 localhost，走 `GM_setValue` + adb 读库，
  见 `mumu-harness/references/https-reporting.md`
- **收尾必做**：删探针脚本、清 `vvmab_*` 键、`enabled` 恢复 1。留在设备里会一直跟着真实站点注入
