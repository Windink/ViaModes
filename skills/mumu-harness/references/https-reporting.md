# https 站点上的上报通道

页内 `fetch('/__report')` 只对**本地 http 测试台**成立。测真实站点（https）时这套走不通，
本文件是替代方案，`e2e/ab-probe.user.js` + `scripts/mumu-real-ab.mjs` 是它的实现。

## 为什么不能直接 POST

在 https 页面里，脚本用 `GM_xmlhttpRequest` 打 `http://127.0.0.1:8099/__report`：

- WebView 的明文/混合内容策略直接拦掉，**真机实测 `readyState=4`、`status=0`**，没有任何报错
- 同一个探针在本地 http 测试页上完全正常 —— 所以这个失败只在真实站点上出现，
  很容易被误判成「探针写错了」

`fetch` 同样不行（页面上下文是 https，请求被降级为不安全请求）。

## 唯一可行通道：GM 存储 + adb 读库

```
探针脚本  --GM_setValue('vvmab_last', JSON)-->  Via 的 variables 表  <--adb 读库--  驱动
```

优点：完全绕开网络策略，也不受页面 CSP 影响。
代价：只能「覆盖式」写最后一个结果，**不适合逐条追加的时间线**——需要时间线时，
把整段采样数组塞进一个值里一次性写。

## 探针脚本的三条硬要求

```js
// @grant GM_setValue          ← 少了这行，GM_setValue 根本不存在（Via 只按脚本头授予）
```

1. **必须在脚本头声明 `@grant GM_setValue`**。不是「全局有没有」的问题，是脚本头没写就没有。
2. **装探针时 `matches` / `run_at` / `flags` / `grant` 全部照抄主脚本**，否则注入时机不同，
   两臂不可比（SQL 见 `mumu-deploy/references/db-schema.md`）。
3. **同时写一个诊断键**（如 `vvmab_diag`），记录「探针在哪一步失败了」。只有结果键时，
   读不到数据无法区分「没注入 / 注入了但没跑到 / 跑到了但没写成功」。

## 驱动侧读取

```js
const raw = sql("SELECT value FROM variables WHERE name='vvmab_last';");
let v = JSON.parse(raw);                       // 第一层：库里是 JSON 文本
if (typeof v === 'string') v = JSON.parse(v);  // 第二层：Via 对 GM_setValue 又序列化了一次
```

只解一层会拿到字符串，字段全 `undefined`——看起来像探针没写。

## 取数时机

- 等 `DOMContentLoaded` 再 +600ms 取，不要等 `load`：视频站的首屏 `load` 事件可能 20s 都不触发，
  等它的结果就是「驱动超时」而不是「页面慢」。
- 无论如何要有硬兜底（例如 12s 后强制读一次）。真实站点不可控，没有兜底的等待就是随机失败。

## 其它两个坑

| 现象 | 原因 | 处置 |
| --- | --- | --- |
| URL 上的 `?vvmab=1` 到不了页面 | 站点自己做 302 重定向，查询串被丢掉 | 不靠 URL 参数传递臂号；用「主脚本 `enabled` 值」这种设备侧状态定臂 |
| 「探针 → 首个宏任务」恒为 0 | 探针在 `document-start` 跑，这个差值没有物理意义 | 别把这种伪指标放进结果表，会让人以为探针没生效 |

## 收尾

```sql
DELETE FROM scripts WHERE script_id='ab-probe-viamodes';
DELETE FROM variables WHERE name IN ('vvmab_last','vvmab_diag');
UPDATE scripts SET enabled=1 WHERE script_id='<主脚本 id>';
```

跑完必须做这三条：探针留在设备里会一直跟着真实站点注入（用户视角是「多了个不明脚本」），
`enabled` 停在 0 会让下一次真机验证全部「脚本没生效」。
