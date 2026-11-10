---
name: mumu-verify
description: 按本次改动涉及的功能面挑选对应的 MuMu 真机回归套件并给出「全过才算完成」的判据——先跑桌面 test-all 做便宜的门禁，换版后再跑真机套件（选集、小窗、慢资源、画质、续播、封面/ETA、帧率）。当一项改动写完准备验收、或不确定该跑哪几套真机回归、或真机套件出现 FAIL 需要判断是真问题还是判据问题时使用本技能；涉及真机回归、跑测试、验收、套件、mumu-episodes/mumu-pip-share/mumu-quality/mumu-slow/mumu-loading 的说法都应先走这里。
agent_created: true
---

# mumu-verify · 按改动面选套件跑回归

## 用途

真机套件有 8 套，全跑一遍接近 20 分钟。本技能的作用是**用最小的套件集合覆盖本次改动的风险**，
并且把「什么算过」定死，避免用「看着还行」代替验收。

## 何时用

- 一项改动写完，要验收
- 不确定改了这个位置该跑哪几套
- 真机套件出现 FAIL，要判断是真 bug 还是判据本身不成立

## 铁律

1. **顺序固定**：改完 → 桌面 `test-all` → 换版 → 真机相关套件 → 全过才进下一项。
   桌面跑一轮约几分钟，真机一轮十几分钟；把明显跑不通的改动直接送真机是浪费。
2. **版本必须先对齐**。设备脚本版本 ≠ `dist` 版本时，`mumu-loading` / `mumu-slow` 会直接判本轮无效，
   其它套件则会静默地用旧代码跑出新断言 —— 后者更危险。跑之前先走 `mumu-deploy`。
3. **桌面结论不能替代真机结论**。这套项目里已经反复验证过：`backdrop-filter` 在 headless
   SwiftShader 下两轮能从 +67% 漂到 +12%；Via WebView 110 没有系统画中画；
   起播首字节比桌面晚一截。凡是「真机上用户能不能看见」的问题，只有真机算数。
4. **FAIL 先怀疑判据，再怀疑代码**。判据写错的次数不比代码写错的少（见最后一节）。

## 输入

- 本次改动的功能面（改了哪个文件、影响什么行为）
- 已构建的 `dist`（`node build.mjs` 跑过）

## 输出

- 每套真机回归的 `N passed, M failed` 与控制台明细
- 退出码：任何 FAIL 或前置不成立 → 非 0
- 一句结论：全过 / 哪套没过 / 需要先修环境

## 依赖

- `mumu-deploy`（版本对齐）
- `mumu-device`（连接、自检、reverse）
- `mumu-diagnose`（结果可疑时）

## 流程

### 1. 桌面门禁

```bash
node build.mjs
node scripts/test-all.mjs        # 11 阶段：构建 → smoke → e2e → UI 矩阵 → 网页铺满 → 多布局探针
                                 #        → bench → 截图 → 加载进度截图 → 选集 → 慢资源起播
```

`test-all` 会重写 `e2e/bench-*.png`、`e2e/load-*.png`、`e2e/share-probe.png`。
这些是测试副产物，交付前还原掉，别混进功能 diff：

```bash
git checkout -- e2e/bench-mp4.png e2e/bench-hls.png e2e/load-pct.png e2e/load-indet.png e2e/share-probe.png
```

只想跑一层时单独调：`smoke.mjs`（Node vm，最快最便宜）、`e2e-verify.mjs`（真实 HLS 链路）、
`ui-verify.mjs`（91~98 项交互矩阵）、`slow-media-verify.mjs`（慢资源判据，约 3.5 分钟）。

### 2. 换版

```bash
# 走 mumu-deploy 的标准流程（CAST + 复核 typeof）
```

### 3. 按改动面挑真机套件

| 改动面 | 套件 | 为什么必须是真机 |
| --- | --- | --- |
| 选集识别 / 网格 / 切集 | `mumu-episodes` | 真实视口 360×520 下的浮层点击链路、`elementFromPoint` 命中 |
| 页内小窗 / 导出浮层 / 置顶巡检 | `mumu-pip-share` | WebView 110 不支持系统画中画，只能验降级路径；2.5s 巡检要真实点击才复现 |
| 画质档位 / ABR / 不封顶 | `mumu-quality` | 真机 hls 实例的 `autoLevelCapping` 与配置对象只有运行时能读 |
| 慢网判据 / 看门狗 / 假活源 | `mumu-slow` | 真机首字节更晚、分片解码更慢、`networkState` 会抖 |
| 续播 / seek 提前 | `mumu-resume` | 桌面解码管线太快，0.5s 级差异被软件合成摊平 |
| 起播封面 / 加载 ETA / 加载明细 | `mumu-loading` | 封面解码与 `background-image` 渲染路径、滤镜生效与否都与桌面不同 |
| 播放态帧率 / 毛玻璃 / 低特效 | `mumu-perf-play` | 60Hz 真实合成；headless 被钉成 17ms/0 掉帧，测不出 |
| 起播耗时（网页 vs 插件） | `mumu-open-ab` | 桌面没有真实 MediaCodec |
| 真实站点有/无脚本开销 | `mumu-real-ab` | 需要真实站点 + 设备侧 `enabled` 切换 |
| 内联 hls.js 每页成本 | `mumu-hlsperf` | 一次性量化，不是回归项 |

组合原则：**改的是共用底座就多跑**（`00-core.js` / `30-player.js` 的改动通常要跑 loading + slow + episodes），
**改的是单点 UI 就跑一套**（只动小窗就跑 pip-share）。拿不准时按「至少一套覆盖你改的那个行为」补齐。

### 4. 看结果

```bash
node scripts/mumu-episodes.mjs      # 35 项
node scripts/mumu-pip-share.mjs     # 40 项
node scripts/mumu-loading.mjs       # 6 场景；ONLY=poster-eta 可只跑单个
node scripts/mumu-slow.mjs          # 5 场景约 190s；SCENARIOS=steady,dead 可只跑指定
node scripts/mumu-resume.mjs        # ROUNDS=3 取中位；SAVE=1 存基线
node scripts/mumu-perf-play.mjs     # 三场景 × 2 轮
node scripts/mumu-quality.mjs
```

断言条数以各脚本最后一行输出为准（随版本增长），别拿历史数字当验收标准。
每套的场景清单与关键输出字段见 `references/suite-matrix.md`。

## 判据也会错：两条真实教训

1. **别用「分辨率高于最低档」判画质红线**。ABR 在带宽不足时本来就该待在低档（模拟器上出现过 184p），
   那是网络决定的正常行为，不是脚本压画质。正确判据是「解出了画面」+「`videoHeight` 与 ABR 所选档一致」，
   压画质由 `autoLevelCapping=-1` 与三条 `capLevel*` 断言覆盖。
2. **别用单点采样判时序**。真机采样抖动大，必须「持续满足 N 个采样」或「首次出现时刻落在窗口内」。
   否则同一份代码会一会儿过一会儿不过，最后没人再信这套回归。

判据改了要同步改桌面侧的断言（`smoke.mjs` 的 `hlsConfig` 段、`slow-media-verify.mjs` 的场景断言），
两边口径不一致时会互相打脸。

## 收尾检查

- [ ] `git status` 里只有预期的功能改动，没有测试副产物截图
- [ ] 设备脚本版本 = `dist` 版本
- [ ] 临时加的探针脚本已从设备删除，`enabled` 已恢复
- [ ] `CHANGELOG.md` 的「未发布」段写了这条改动
