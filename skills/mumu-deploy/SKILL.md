---
name: mumu-deploy
description: 把刚构建出来的 dist 换版到 MuMu 设备里的 Via，保证真机验证跑的确实是这一份代码——写入必须用 CAST(readfile(...) AS TEXT) 避免存成 BLOB，写完要复核 typeof(content)='text' 与版本号，并用一次性路径别名绕开 Via 按 URL 路径命中的缓存。当改了 src/ 之后要在 MuMu 真机验证、或实测发现设备脚本版本与 dist 不一致、或需要临时禁用主脚本做 A/B 对照时使用本技能；涉及换版、更新脚本、enabled、monkey 库、scripts 表、BLOB 的说法都应先走这里。
agent_created: true
---

# mumu-deploy · 把 dist 换版到设备

## 用途

真机验证只有一条铁律：**设备里跑的必须是刚构建的那份**。版本不一致时所有断言都无效，
而 Via 的更新链路有三层缓存会让「我明明更新了」变成假象。本技能给出一条确定性的换版路径。

## 何时用

- 改完 `src/`、跑过 `node build.mjs`，要上真机验证
- 真机上报里 `env.version` 与 `dist` 的 `@version` 不一致（多数套件会直接判本轮无效）
- 要临时把主脚本 `enabled=0` 做「有/无脚本」对照（`mumu-real-ab` 就是这么做的）
- UI 路径「设置 → 脚本 → 更新」点了没反应/点了还是旧版

## 输入

| 参数 | 默认 | 说明 |
| --- | --- | --- |
| dist 产物 | `dist/via-video-player.user.js` | 版本从文件头 `@version` 读，不要手填 |
| `ADB` / `SERIAL` | 同 `mumu-device` | |
| 设备库路径 | `/data/data/mark.via/databases/monkey` | 表 `scripts` / `variables` |

## 输出

- 设备内 `scripts.version` = dist 的 `@version`
- `typeof(content)` = `text`（不是 `blob`）
- 重新打开页面后，页内 `__vv.VV.version` 与之相同
- 失败时明确是「写进去成了 BLOB」还是「版本没变」

## 依赖

- `mumu-device`（连接 + reverse 已就绪）
- `adb root` 可用（要读写 `mark.via` 的私有目录）
- 设备内自带 `sqlite3`
- 已跑过 `node build.mjs`（它会按产物哈希自增 `@version`）

## 标准流程

### 1. 先构建

```bash
node build.mjs
grep -m1 '@version' dist/via-video-player.user.js     # 记下版本号，后面要用它核对
```

`@version` 由产物哈希自动递增，**不要手改 `.version`**——Via 的更新判断依赖它。

### 2. 提权并重新建链

```bash
adb -s 127.0.0.1:16384 root
# adb root 会重建 adbd，之前的 reverse 全部失效，必须重做
adb -s 127.0.0.1:16384 reverse tcp:8099 tcp:8099
```

### 3. 推文件（注意路径转换）

```bash
MSYS_NO_PATHCONV=1 adb -s 127.0.0.1:16384 push dist/via-video-player.user.js /data/local/tmp/vv.js
```

不加 `MSYS_NO_PATHCONV=1`，Git Bash 会把 `/data/local/tmp/vv.js` 改写成 `D:/data/local/tmp/vv.js`，
push 报「no such directory」，看起来像设备没权限。

### 4. 定位主脚本

不要靠名字认，按内容长度取最长的那条（几 KB 的探针脚本不算）：

```bash
adb -s 127.0.0.1:16384 shell "sqlite3 /data/data/mark.via/databases/monkey \"SELECT _id||'|'||script_id||'|'||length(content) FROM scripts ORDER BY length(content) DESC LIMIT 3;\""
```

### 5. 写入（关键：`CAST(... AS TEXT)`）

```bash
adb -s 127.0.0.1:16384 shell "sqlite3 /data/data/mark.via/databases/monkey \"UPDATE scripts SET content=CAST(readfile('/data/local/tmp/vv.js') AS TEXT), version='0.1.88' WHERE script_id='e94c8fb634427275544a60c73a70e3ac';\""
```

**漏掉 `CAST(... AS TEXT)` 是这套流程里最贵的坑**：`readfile()` 返回 BLOB，赋给 TEXT 列
也按 BLOB 存。Via 加载脚本时抛 `Unable to convert BLOB to string`，**脚本根本不会注入**，
`__vv` 挂不上，真机 `env.version=none`——现象和「页面没加载」几乎一样，很容易往产品代码上找错。

### 6. 复核（不可跳过）

```bash
adb -s 127.0.0.1:16384 shell "sqlite3 /data/data/mark.via/databases/monkey \"SELECT script_id,version,typeof(content),length(content) FROM scripts ORDER BY length(content) DESC LIMIT 2;\""
```

期望 `TEXT` + 目标版本号 + 长度接近 dist 体积（dist ≈ 800KB）。看到 `blob` 就回到第 5 步。

### 7. 让新内容生效

```bash
adb -s 127.0.0.1:16384 shell am force-stop mark.via
# 再用 mumu-device 的方式打开页面
```

`force-stop` 后重新注入才读库；只关页面不杀进程，脚本仍是旧的。

### 8. 页内确认

页面里读 `__vv.VV.version`（测试台会作为 `tag:'env'` 上报）。与 dist 不一致时，
`mumu-loading` / `mumu-slow` 这类套件会直接把本轮判为无效——这是刻意设计的，
不要绕过它去解释断言。

## 另一条路：UI 更新

Via 里「设置 → 脚本 → 更新」也能换版，但脚本的 `download_url` 会**按 URL 路径命中缓存**：
旧路径永远拿旧版。要走这条路必须把下载地址换成一个新的 `/dist/vv-<新数字>.js` 别名
（`serve.mjs` 把它映射回真实产物），**并且重启本地服务**——`serve.mjs` 的别名规则只在启动时生效，
改了规则不重启，新别名直接 404。

日常迭代优先用写库这条路，比点菜单快且不留缓存。

## 已知坑

| 现象 | 原因 | 处置 |
| --- | --- | --- |
| `env.version=none`、`__vv` 不存在 | content 存成了 BLOB | 用 `CAST(readfile(...) AS TEXT)`，复核 `typeof` |
| 版本号对了但行为没变 | 页面还是旧缓存 / 没 force-stop | 换一次性页面路径 + 杀进程重开 |
| 新别名 404 | `serve.mjs` 没重启 | 重启服务再试 |
| 「更新」按钮点了没反应 | `@version` 没变，Via 判定无新版 | 改 `src/` 让哈希变；纯 header 文案不会升版本 |
| 脚本被整份删掉 | 跑过 `pm clear mark.via` | 别用 `pm clear`；删了要重走「设置 → 脚本 → ＋ → 下载脚本」 |
| A/B 后主脚本没恢复 | `enabled` 停在 0 | 收尾时 `UPDATE scripts SET enabled=1`，并删掉探针脚本 |

## 验收

```bash
# 一条命令同时看版本与类型
adb -s 127.0.0.1:16384 shell "sqlite3 /data/data/mark.via/databases/monkey \"SELECT version||'|'||typeof(content) FROM scripts WHERE script_id='<主脚本 id>';\""
```

输出形如 `0.1.88|text` 才算换版成功。表结构与完整 SQL 见 `references/db-schema.md`。
