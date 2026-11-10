---
name: mumu-harness
description: 定义并为「真机测试台」生成配套驱动——页面在 Via 里自驱动、自己采样式断言，把每条结果以 run 标识 POST 回本地 serve.mjs，驱动侧轮询 done 后汇总成 N passed / M failed。当需要新增一个 MuMu 真机测试台、给已有套件补场景、或把手工点击的验证固化成可重复回归时使用本技能；涉及测试台、真机断言、页内自驱动、/__report、上报、report.log、driver 的说法都应先走这里。
agent_created: true
---

# mumu-harness · 真机测试台协议与驱动骨架

## 用途

真机上的每一层验证（选集、小窗、慢资源、画质、帧率、封面/ETA）都是同一套结构：
**页面自己跑、自己判、把结果送回开发机；驱动只负责把设备弄到位、拉起页面、收结果**。
本技能把这套结构固化，新增一个真机套件时照抄即可，不必重新发明。

## 何时用

- 要新增一个「只能在真机上看」的验证（布局占位、真实点击链路、WebView 特有能力差异）
- 已有套件要加场景/加断言
- 手工点了一遍觉得没问题，想把它变成能反复跑的回归

## 为什么是「页内自驱动」而不是外部驱动

Via 的每个标签是一个独立 WebView，桌面自动化（Playwright/puppeteer）连不进去；
adb 能做的只有「打开页面、截图、读文件」。所以能读到页内状态的唯一途径是**页面自己上报**。
同理，断言也必须在页内跑——从外部看只有一个画面，看不出 `elementFromPoint` 命中了谁。

## 三段结构

```
e2e/<name>-android.html          页内：场景循环 → 采样式断言 → send() 上报 → done
        │  POST /__report
        ▼
scripts/serve.mjs                .tmp/report.log（一行一个 JSON）
        │  读文件 + 过滤 run
        ▼
scripts/mumu-<name>.mjs          驱动：自检设备 → 拉起页面 → 轮询 done → 打印汇总 → 退出码
```

## 上报契约

页面每次 `send()` 自动补两个字段：`run`（本轮标识，从 `location.pathname` 提取）与 `t`（时间戳）。
驱动只认 `run === pageTag` 的行——Via 会恢复上一轮的标签，那些旧页面也在上报，不隔离就会串数据。

| `tag` | 含义 | 驱动怎么用 |
| --- | --- | --- |
| `env` | 环境快照：`version` / `expect` / 视口 / dpr / UA | 版本不等直接判本轮无效（这是最有效的防错） |
| `ok` | 一条断言：`{name, pass, detail}` | 汇总成 passed / failed |
| `diag` | 现场诊断：`{phase, dts:[...], ...}` | 失败时打印时间线，是唯一能复查的证据 |
| `scene` | 场景开始/结束标记 | 定位失败落在哪个场景 |
| `hold` | 页面进入待截图态 | 驱动看到就等 2.5s 抓图 |
| `fatal` | 页面侧未捕获异常 | 打印栈，配合 `done(aborted)` 让驱动立刻退出 |
| `done` | 本轮结束：`{pass, fail}` | 驱动唯一的退出条件 |

页内实现要点（照抄 `e2e/loading-android.html` 顶部十几行即可）：

```js
var RUN = (/loading-android-([A-Za-z0-9._-]+)\.html/.exec(location.pathname) || [])[1] || '';
function send(o) {
  o.run = RUN; o.t = Date.now();
  try { fetch('/__report', { method: 'POST', body: JSON.stringify(o) }); } catch (e) {}
}
```

## 断言规范（决定这份测试台有没有用）

1. **采样式，不是「睡完再断言」**。每 300~500ms 采一次状态，断言建立在「某段时间内持续满足」
   或「首次出现的时刻」上。真机的时序抖动远大于桌面，单点采样必然假阳性/假阴性。
2. **每条断言独立**，失败不 `throw`、不中止后续场景；最后统一 `done`。一条失败就中断，
   等于每轮只能看到一个 bug。
3. **失败必须带时间线**。`diag.dts` 记录关键节点的文案/状态快照。没有时间线的 FAIL 只能重跑，
   而重跑未必复现。
4. **判据选稳定的量**。会漂的量不能当断言依据——例如「分辨率高于最低档」就不能判画质红线：
   ABR 在带宽不足时本来就该待在低档，那是网络决定的正常行为，会把正常结果判成 FAIL。
   正确判据是「解出了画面」+「`videoHeight` 与 ABR 所选档一致」。
5. **观察窗口可覆盖**。留一个 `?wait=` 之类的参数，默认值给足（真机比桌面慢一截），
   排查时可临时拉长而不必改代码。
6. **超时必须双向兜底**：页面侧异常也发 `done(aborted)`，驱动侧有轮询上限。

## 驱动骨架

`assets/driver-template.mjs` 是可直接复制改名的完整骨架，含：前置自检 → 端口映射 →
读 dist 版本 → 生成一次性路径 → `force-stop` + `am start` → 轮询 `done` → 打印 → 退出码。
新建套件时：

1. 复制为 `scripts/mumu-<name>.mjs`，改 `pageTag` 前缀、超时上限、汇总文案
2. 在 `scripts/serve.mjs` 加一条别名映射（`/e2e/<name>-android-<任意>.html → /e2e/<name>-android.html`）
3. 设备侧版本要与 dist 一致（`mumu-deploy`），否则 `env` 行会直接判无效

> `serve.mjs` 的别名规则**只在启动时生效**，加完必须重启服务，否则新路径 404。

## 输出

- `.tmp/report.log`：一行一个 JSON，可直接 `tail` 看实时进度
- 驱动控制台：`=== 环境 ===` / `=== 断言 ===` / `N passed, M failed`
- 退出码：任何 FAIL、没有断言、没等到 `done`、版本不一致 → 非 0

## 依赖

- `scripts/serve.mjs` 的 `/__report`（追加）与 `/__report/clear`（清空）
- `mumu-device`（连接、自检、reverse、拉起）
- `mumu-deploy`（版本一致）

## 已知坑

| 现象 | 原因 | 处置 |
| --- | --- | --- |
| 断言数量对不上、出现上一轮的条目 | 没按 `run` 过滤 | 驱动侧 `.filter(r => r.run === pageTag)` |
| 一条上报都没有 | 脚本没注入（多为 BLOB 或没换版） | 先 `mumu-deploy`，再看 `mumu-diagnose` |
| 驱动卡满超时 | 页面侧抛异常但没发 `done` | 包 `try/catch` → `fatal` + `done(aborted)` |
| 改了测试页却还是旧断言 | Via 按 URL 路径缓存 | 每轮换一次性后缀 + serve 别名映射 |
| 截图是空白/上一帧 | 没等合成 / 浮层不进系统截图 | 先发 `hold`，等 2.5s 再抓；结论仍以 DOM 断言为准 |
| 真实站点（https）上报收不到 | `GM_xmlhttpRequest` 打 `http://127.0.0.1` 被混合内容策略拦掉 | 走 GM 存储 + adb 读库，见 `references/https-reporting.md` |
