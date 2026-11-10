# 症状对照表

按「先出现什么」排序。每条给出：怎么确认、什么原因、一行处置。
所有 `sqlite3` 命令都要加前缀 `adb -s 127.0.0.1:16384 shell`，库路径
`/data/data/mark.via/databases/monkey`。

---

## 一、数据没进来

### `env.version` = `none`，`__vv` 不存在

```bash
# 确认：
... shell "sqlite3 <DB> \"SELECT version||'|'||typeof(content) FROM scripts WHERE script_id='<sid>';\""
```

| 输出 | 原因 |
| --- | --- |
| `0.1.88|blob` | 写入时漏了 `CAST(readfile(...) AS TEXT)`，Via 抛 `Unable to convert BLOB to string`，脚本不注入 |
| `0.1.88|text` 但仍 none | 页面是旧缓存，加载的 HTML 里没有脚本注入点；换一次性路径重开 |
| 空 | 主脚本被删（`pm clear mark.via` 会连脚本一起删） |

### 一条 `ok` 都没上报

```bash
wc -l .tmp/report.log && tail -3 .tmp/report.log   # 本轮的 run 标识有没有出现过
```

依次排除：页面 404（`reverse` 没做 / `PORT` 不一致 / `serve` 已退出）→ 白屏（`force-stop` 后没等够）→
参数丢失（`&` 被设备 shell 截断）→ 脚本未注入（见上一条）。

### 页面 404 但 Via 显示得挺正常

`adb reverse tcp:8099 tcp:8099` 没做，或做的端口和 `serve.mjs` 的 `PORT` 不一致。
`reverse` 生命期绑在 adb daemon 上，**每个新进程都要重做**。

### 断言数变多、出现上一轮的条目

驱动没按 `run` 过滤。Via 会恢复上次的标签，那些页面也在 POST。
`.filter(r => r.run === pageTag)` 一行解决。

### 驱动卡满超时，没有任何 `done`

页面侧抛了未捕获异常，但没发 `done`。页面里包 `try/catch` → `fatal` + `done({aborted:true})`，
驱动看到 `aborted` 立刻退出，不必等满轮询上限。

---

## 二、跑的是旧东西

### 断言名 / `diag` 字段和刚写的代码对不上

Via 的 WebView **按 URL 路径**命中缓存，`?t=`、`no-store`、`Pragma` 全都拦不住。

处置：一次性路径后缀 + `serve.mjs` 别名映射 + **重启 serve**（映射只在启动时生效，否则 404）。

### 新别名路径 404

`serve.mjs` 没重启。所有别名规则都在 `http.createServer` 开头一次性写好，改完必须重启进程。

### 版本号变了但行为没变

`force-stop` 之后才重新读库。只关页面不杀进程，注入的仍是旧脚本。

### 改了 `build.mjs` 的 header 文案，用户收不到更新

版本哈希只算 `body`（vendor + `MODULES` 合并结果），不算脚本头。纯 header 文案会写进产物但
`@version` 不动。要升版本必须改 `src/`。

---

## 三、现象比原来更怪

### 页面计数器停在 1、`setInterval` 不跑、视频永远 `rs=0`

`am start` 新开的是**后台标签**，被 Chromium 冻结：定时器不触发、`fetch` 发不出、DOM 不重绘。

判据：底部工具栏标签数必须是 **1**，或上报里 `hidden === false`。
改测内容优先「改文件 + 点地址栏刷新」，不要反复 `am start`。

### 想开第二个页面，结果只是把第一个切到前台

Via 是 singleTask，adb 开不出第二个标签。只能由页面自己 `window.open`。

### `via-vp: already loaded` 出现在 `onerror` 里

同一份脚本被注入了两次，第二个实例被重入 guard 截断。正常现象，不用改。
但**它会让「脚本执行成本」类测量失真**：对照组只能量到整份 dist 的预解析，量不到执行。

### 点了浮层，界面自己关了

2.5s 一次的置顶巡检把浮层盖住了。置顶前要先问 `vvHasPriorityOverlay()`，
遇到分享/选集浮层或页内小窗必须让位。

### 系统画中画调用失败

Via 的 WebView 110 `document.pictureInPictureEnabled=false`，
`requestPictureInPicture()` 抛 `NotSupportedError`。这不是 bug，产品已降级成页内悬浮小窗
（`vvMiniWindow`）。**不要在这套 WebView 里修系统 PiP**。

---

## 四、判据本身不成立

### 断言全过，但截图明显不对

`adb screencap` 抓 SurfaceFlinger 合成帧，Via 的 WebView 不一定把挂在 `documentElement` 下的
fixed 浮层提交进去。实测截图里只有播放器、页内 `elementFromPoint` 却命中浮层格子。
**以 DOM 断言为准**，截图只留档。要留档就先发 `hold` 再等 2.5s。

### 画质断言 FAIL，但日志显示 ABR 正在正常降档

判据把「按设计会变的自适应行为」当成了劣化。ABR 在带宽不足时待低档是正确的。
判据改成「解出了画面」+「`videoHeight` 与所选档一致」，压画质由 `autoLevelCapping=-1`
与三条 `capLevel*` 断言覆盖。

### 慢资源测出来「不慢」

只 `reverse` 了一个端口。慢资源套件要同时映射静态服务与限速服务，
否则分片请求打不到限速服务，量出来的「慢」是假的。

### 同一份代码两次跑出相反结果

单点采样/窗口太短。真机的时序抖动远大于桌面，改采样式断言，并把窗口做成可覆盖参数
（`?wait=`）先确认「是不是没等够」。

### 起播耗时/帧率数字一次一个样

参见 `mumu-measure`：没静置、把热轮当冷轮、没交替配对、用平均值代替中位数。

---

## 五、真实站点专属

### https 页面里 `GM_xmlhttpRequest` 返回 `status=0`

WebView 的明文/混合内容策略拦掉了到 `http://127.0.0.1` 的请求，`readyState=4` 但无响应体。
同一个探针在本地 http 页上完全正常——只在真实站点出现，很容易误判成探针写错。
改走 GM 存储 + adb 读库，见 `mumu-harness/references/https-reporting.md`。

### 从库里读出来的 GM 值字段全 `undefined`

Via 对 `GM_setValue` 的字符串又序列化了一层，要 `JSON.parse` 两次。

### 探针脚本装上了但 `GM_setValue` 不存在

脚本头少了 `// @grant GM_setValue`。Via 只按脚本头授予，不是「全局有没有」的问题。

### URL 上的 `?vvmab=1` 到不了页面

站点自己做 302 重定向，查询串被丢掉。别靠 URL 参数传递臂号，用设备侧状态（`enabled`）定臂。
