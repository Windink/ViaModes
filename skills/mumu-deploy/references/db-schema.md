# Via 脚本库结构与常用 SQL

Via 把用户脚本和 GM 存储放在同一个 SQLite 库：`/data/data/mark.via/databases/monkey`。
本仓库的真机脚本只用到这里的两张表。**schema 会随 Via 版本变**，换 Via 版本后先跑一次
`.schema scripts` 与 `.schema variables` 核对，再照抄下面的语句。

## 表 `scripts`

| 列 | 用途 | 备注 |
| --- | --- | --- |
| `_id` | 自增主键 | 排序/取「最长」时用得上 |
| `script_id` | 脚本唯一 id | 同一份脚本重复安装会换 id，别写死在脚本里 |
| `name` | 显示名 | |
| `version` | 声明的版本（`@version`） | 换版时必须一起改，否则自检显示旧版本 |
| `content` | 脚本全文 | **必须是 TEXT**，写错类型脚本不注入 |
| `matches` | `@match` 列表 | 装探针时直接照抄主脚本 |
| `run_at` | 注入时机 | 同上 |
| `flags` | 权限位 | 同上 |
| `grant` | `@grant` 列表 | 同上（探针要靠它拿 `GM_setValue`） |
| `enabled` | 是否启用 | `1`/`0`，A/B 对照的唯一变量 |

## 表 `variables`

| 列 | 用途 |
| --- | --- |
| `name` | GM 存储键（`GM_setValue(k, v)` 的 k） |
| `value` | 值。**Via 会把字符串再序列化一层**，读出来要解两次 `JSON.parse` |

## 常用 SQL

下面的 `<sid>` 是主脚本 `script_id`，`<ver>` 是 `dist` 头部的 `@version`。

```sql
-- 列出所有脚本，按体积降序（主脚本永远最大，探针只有几 KB）
SELECT _id, name, version, typeof(content), length(content), enabled FROM scripts ORDER BY length(content) DESC;

-- 只取主脚本 id
SELECT script_id FROM scripts ORDER BY length(content) DESC LIMIT 1;

-- 换版（唯一正确写法，CAST 不能省）
UPDATE scripts SET content=CAST(readfile('/data/local/tmp/vv.js') AS TEXT), version='<ver>' WHERE script_id='<sid>';

-- 复核：期望 <ver>|text
SELECT version||'|'||typeof(content) FROM scripts WHERE script_id='<sid>';

-- A/B 对照：只切开关，不动内容
UPDATE scripts SET enabled=0 WHERE script_id='<sid>';   -- 无脚本臂
UPDATE scripts SET enabled=1 WHERE script_id='<sid>';   -- 恢复

-- 装一条探针：matches / run_at / flags / grant 全部照抄主脚本，
-- 保证注入时机与权限位一致，否则两臂不可比
DELETE FROM scripts WHERE script_id='ab-probe-viamodes';
INSERT INTO scripts (script_id, name, version, content, matches, run_at, enabled, flags, grant)
SELECT 'ab-probe-viamodes', 'AB 探针', '1',
       CAST(readfile('/data/local/tmp/ab-probe.js') AS TEXT),
       matches, run_at, 1, flags, grant
FROM scripts WHERE script_id='<sid>';

-- 收尾：删探针 + 清探针写进 GM 的键，避免下一轮读到脏数据
DELETE FROM scripts WHERE script_id='ab-probe-viamodes';
DELETE FROM variables WHERE name IN ('vvmab_last','vvmab_diag');
```

## 从 Node 里调用的统一写法

```js
const DB = '/data/data/mark.via/databases/monkey';

// 整条命令当一个参数传给远端 shell：
// 1) 避免 Git Bash 把 /data/... 当 Windows 路径改写
// 2) 避免 SQL 里的引号被本地 shell 先吃一层
function sql(q) {
    return sh(['shell', `sqlite3 ${DB} ${JSON.stringify(q)}`]).trim();
}
```

`sh()` 内部吞掉异常、返回 stdout+stderr，让调用方自己判——真机上的失败大多是「输出里有线索、
退出码不可靠」（比如 `sqlite3` 表不存在时仍返回 0）。

## 读 GM 存储时为什么解两次

```js
const raw = sql("SELECT value FROM variables WHERE name='vvmab_last';");
let v = JSON.parse(raw);                    // 第一层：库里存的是 JSON 文本
if (typeof v === 'string') v = JSON.parse(v); // 第二层：Via 对 GM_setValue 的字符串又序列化了一次
```

只解一层会得到一个字符串，字段全 `undefined`，看起来像「探针没写进去」。
