# MuMu 真机技能库

把「在 MuMu 模拟器的 Via 里验一件事」这套动作拆成 6 个职责独立的技能模块。
每个模块是一个标准 skill 目录（`SKILL.md` + 可选 `references/` `assets/`），
既能被团队成员当文档直接读，也能挂到 WorkBuddy 的技能目录里被自动加载。

## 为什么放在仓库根目录，而不是 `.workbuddy/skills/`

`.workbuddy/` 在 `.gitignore` 里（本地状态，不入库）。技能要能被 clone 下来的成员看到，
就必须落在会提交的路径上——所以放 `skills/`，需要自动加载时再链过去（见最后一节）。

## 分层与依赖

```
        mumu-device      连接 / 自检 / 端口映射 / 拉起页面
             │
   ┌─────────┼─────────┐
   ▼         ▼         ▼
mumu-deploy  mumu-verify  mumu-measure     换版 / 跑断言 / 量数字（三者互相独立）
                 ▲
                 │ 新套件从骨架起步
            mumu-harness                     上报契约 + 驱动模板

  mumu-diagnose   横向能力：上面任何一步的结论可疑时先走这里
```

依赖方向是单向的：`mumu-device` 是所有人的前置，`mumu-deploy` 负责「测的是新代码」，
`mumu-verify` 与 `mumu-measure` 互不依赖（一个出通过/失败，一个出数字），
`mumu-harness` 只被「新增套件」时需要，`mumu-diagnose` 不属于任何链路但任何链路都可能用到。

## 技能一览

| 技能 | 用途 | 输入 | 输出 | 触发 | 依赖 |
| --- | --- | --- | --- | --- | --- |
| `mumu-device` | 把 MuMu 里的 Via 变成一台可自动化的设备：连接、前置自检、端口映射、拉起指定页面、留证 | `SERIAL`（默认 `127.0.0.1:16384`）、`PORT`（默认 8099）、目标 URL、可选 `ADB` | 已连接 + 已 `reverse` + 停在目标页的 Via；失败时给出具体卡在哪一步 | 要在模拟器/Via 里打开页面、取现场 DOM、或跑任何真机脚本之前 | MuMu 已启动且 Android 起来、Via 已安装、adb、本地 `scripts/serve.mjs` |
| `mumu-deploy` | 把当前 `dist` 换版到设备里的 Via，保证「测的是刚构建的那份」 | `dist/via-video-player.user.js` 与其 `@version` | 设备内 `scripts.version` = 目标版本、`typeof(content)='text'`；或明确的失败原因 | 改了 `src/` 之后要真机验；或实测发现设备版本与 dist 不一致 | `mumu-device`、`adb root`、设备内 `sqlite3` |
| `mumu-harness` | 定义「页内自驱动 + 上报回传」这套测试台协议，并给出驱动骨架，用来新增或改造真机测试台 | 一份测试台 HTML、场景列表、断言清单 | 可被驱动汇总的 `report.log` 与「N passed, M failed」 | 新增一个真机测试台、或给已有套件补场景 | `mumu-device`、`scripts/serve.mjs` 的 `/__report` |
| `mumu-verify` | 按改动面挑对应套件跑真机回归，并给出「全过才算完」的判据 | 本次改动的功能面 | 各套件的 passed/failed 与退出码 | 每项改动完成、桌面回归通过之后 | `mumu-deploy`（版本一致）、`mumu-device` |
| `mumu-measure` | 定量测量方法学：基线、冷热轮、交替配对、中位数、预设门槛 | 基线（`SAVE=1`）与候选版本 | 中位数对比与「是否越过门槛」的结论 | 性能、耗时、帧率、每页成本这类需要数字的改动 | `mumu-device`、先存基线 |
| `mumu-diagnose` | 真机结论可疑时定位失真原因（版本没换、页面跑旧缓存、上报丢、截图不可信） | 现场：`env` 行、上报行数、截图、退出码 | 失真原因 + 处置动作，避免拿错结论改代码 | 全 FAIL、`version=none`、一条断言都没有、截图明显不对 | 其余全部 |

## 典型组合

**日常改动（最常走）**
```
mumu-deploy  →  mumu-verify（按改动面选一套或几套）  →  有 FAIL 就 mumu-diagnose
```

**新加一个真机测试台**
```
mumu-harness（抄骨架 + 写场景）  →  serve.mjs 加别名映射  →  mumu-device 打开跑通  →  mumu-verify 纳入回归
```

**要不要做某个优化（先量再决定）**
```
mumu-measure（SAVE=1 存基线）  →  改代码  →  mumu-measure（对比 + 过门槛判定）
```

**结论明显不对**
```
mumu-diagnose（版本 / 缓存 / 上报 / 截图四查）  →  修好前置后重跑，别急着改产品代码
```

## 挂到 WorkBuddy 里自动加载

技能的发现路径是项目下的 `.workbuddy/skills/<name>/SKILL.md`。把这里目录链过去即可
（Windows 用目录联接，无需管理员；clone 到新机器后重跑一次）：

```powershell
# 在项目根目录执行（Windows 目录联接，无需管理员）
$dstRoot = Join-Path (Get-Location) ".workbuddy\skills"
if (-not (Test-Path $dstRoot)) { New-Item -ItemType Directory -Path $dstRoot -Force | Out-Null }
Get-ChildItem "skills" -Directory -Filter "mumu-*" | ForEach-Object {
    $dst = Join-Path $dstRoot $_.Name
    if (-not (Test-Path $dst)) { New-Item -ItemType Junction -Path $dst -Target $_.FullName | Out-Null }
}
```

不想建链接就直接复制目录，效果一样，只是改了 `skills/` 里的内容要重新复制。
macOS / Linux 用 `ln -s ../../skills/mumu-* .workbuddy/skills/` 等价。

## 维护约定

- **不写死会变的数字**：断言条数、版本号、耗时都随版本变，只在 `references/` 里保留
  「当时的实测值 + 日期 + 设备环境」，正文写「以脚本末行输出为准」。
- **改脚本时同步改这里**：`scripts/mumu-*.mjs` 的默认值、参数名、坑变了，对应技能的
  SKILL.md 或 references 一起改；这是这套文档不腐烂的唯一办法。
- **只写踩过的坑**：每条「坑」都应该对应一次真实的错误结论。没踩过的不写，避免变成
  泛泛的 adb 教程。
- **代码片段保持可跑**：`references/` 里的命令按原样复制就能用（路径是这台开发机的默认值，
  换机器用环境变量覆盖）。
