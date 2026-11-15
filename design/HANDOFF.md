# 交接说明：可视化设计工作 / Handoff: Visualization Design Work

最后更新 / Last updated: 2026-11-14 · 分支 / Branch: `eric_roughwork`

这份文件让你在**另一台设备或一个新的 Claude 会话**里接着做 Q1–Q3 的可视化设计，不需要原来的聊天记录。新会话先读这份文件，再读下面链接的设计文档。
This file lets you continue the Q1–Q3 visualization work on **another device or in a new Claude session** without the original chat. A new session should read this file first, then the design documents linked below.

**新会话的开场提示（可以直接复制）/ Opening prompt for a new session (copy as is):**

> 我是 STA313 Newtown's group 的 Eric（GitHub 身份 SYzhao666），负责代码和可视化。先读 `design/HANDOFF.md`，严格遵守其中"工作规则"，再按需要读 `design/DESIGN_LOG.md` 和各问题的设计说明。确认读完后告诉我当前进度和待决定的问题，然后等我的任务。

---

## 1. 项目与受众 / Project and audience

- 课程项目 STA313（Newtown's group），主题：安大略省社会援助（Ontario Works, OW；Ontario Disability Support Program, ODSP）。研究框架见 [research/RESEARCH_QUESTIONS.md](../research/RESEARCH_QUESTIONS.md)。/ STA313 group project on Ontario social assistance.
- **唯一受众**：安省 MCCSS 负责社会援助案件监测和政策研究的政策分析员（写简报、找值得调查的时期和地区）。/ One audience: MCCSS policy analysts.
- 三个问题 / Three questions：
  - **Q1** 疫情前、中、后 OW 与 ODSP 的案件走势有何不同 / How OW and ODSP trends differed before, during and after the pandemic
  - **Q2** 各 CMA 单人无子女案件占比和两个项目差距的变化 / Single-person shares and the OW–ODSP gap across CMAs
  - **Q3** OW 受助时长与地区差异 / OW duration and regional differences
- 课程要求整理为 R1–R20，见 [q3/Q3_DESIGN.md](q3/Q3_DESIGN.md) 第 0 节。关键节点：Mock design 11 月 19 日，最终作品 12 月 7 日。/ Requirements R1–R20 in Q3_DESIGN.md §0; mock design due Nov 19, final Dec 7.

## 2. 当前进度 / Status

| 部分 / Part | 当前版本（稳定路径）/ Current | Tag | 设计说明 / Rationale | 待决定 / Open questions |
| --- | --- | --- | --- | --- |
| Q1 | 候选 A–C（v1）、D v3、D + 参照面 1–4；页面入口表见 [q1/README.md](q1/README.md) | `q1-v1` = `a193c19`（A–D v1）· `q1-v2` = `e836bb9`（D v2，已存档）· `q1-v3` = `eb2586e`（D v3 `14e6474` + 参照面 1–4） | [q1/Q1_DESIGN.md](q1/Q1_DESIGN.md)（D：§7、§7.1 3D、§7.2 OW − ODSP 视图、§7.3 参照面） | Q1_DESIGN §11（14 条） |
| Q2 | 候选 A–C：[q2/variants/](q2/variants/)，总览 [q2/index.html](q2/index.html) | `q2-v1` = `ab9e8dd` | [q2/Q2_DESIGN.md](q2/Q2_DESIGN.md) | Q2_DESIGN §11（10 条） |
| Q3 | v2 原型：[q3/prototype/](q3/prototype/index.html)；v1 存档在 [q3/archive/](q3/archive/README.md) | `q3-v1` = `55e5870` · `q3-v2` = `a336f1a` | [q3/Q3_DESIGN.md](q3/Q3_DESIGN.md) | Q3_DESIGN 第 9–10 节 |

- 每次迭代的记录：[DESIGN_LOG.md](DESIGN_LOG.md)。/ Iteration log.
- 外部数据：2021 年 CMA 边界 `datasets/EXTERNAL/CMA-BOUNDARIES/`（Q3 地图用，Q2 C 用来排网格位置）。/ External CMA boundaries.
- 本地预览：仓库根目录运行 `python serve.py`（不缓存的服务器），打开 <http://localhost:8000/design/q1/>、`/design/q2/`、`/design/q3/prototype/`。/ Run `python serve.py` from the repository root.
- 测试与复核脚本：[tools/README.md](../tools/README.md)。/ Check and verification scripts.

**当前推荐（都由小组最终决定）/ Current recommendations (the group decides)**
- Q1：以 A 为底，加 B 的分阶段图；D 作为可选附加。D 的 3D 只连接视图、不提供新信息，作为可选视图保留；参照面建议版本 1（OW 占比面）+ 版本 2（时间切面）。
- Q2：B（彗星图 + 分解条）为主体，加 C 的瀑布图；B 的读者测试不通过就退回 A + B 的分解条。
- Q3：v2 原型。

**最重要的待决定问题 / Key open decisions**：各问题选哪个版本；是否全站共用一个地图板块（Q3 已有比例符号地图，Q2 C 是网格地图）；D v3 的两个手机端标签问题是否回补（只在参照面版本里修了，见 Q1_DESIGN §7.3）；研究文档第 3、4 节需要按选定版本更新；`report.pdf`（R17）、在线部署（R3）、开发计划和分工（R16）还没开始。

## 3. 工作规则（用户的长期要求，务必遵守）/ Working rules (standing instructions)

**Git**
- 只在 `eric_roughwork` 分支工作。开始前先 `git status` 和 `git pull`，**确认 pull 成功后再做别的**（曾经因为 pull 失败后仍然提交，导致 tag 先于分支推送）。/ Work only on `eric_roughwork`; confirm `git pull` succeeded before anything else.
- 不切换、不合并到 `main`；不强推；不改写已有提交。远端有新提交时用合并（merge），不要 rebase 已推送 tag 的提交。/ Never touch `main`, never force-push or rewrite; merge, don't rebase tagged commits.
- 提交用仓库当前的 git 身份。说明格式 `中文 / English`，正文简要列出改动。**不加任何 AI 署名、Co-Authored-By 或 "Generated with" 之类的行**（PR 同样）。/ Bilingual messages; no AI attribution lines in commits or PRs.
- 只用明确的路径 `git add` 自己改过的文件；别人的未提交文件不要带进提交（例如 `design/prompts/` 下未跟踪的 prompt 文件，除非用户要求）。/ Add only your own files by explicit path.
- 推送顺序：先推分支，再推 tag。推送失败就报告原因，不要强推。已有同名 tag 就停下来问。/ Push the branch, then the tag; report failures; ask if a tag exists.
- **版本规则**（详见 DESIGN_LOG 开头）：当前版本放在稳定路径；大版本（视图形式、编码、页面结构或叙事明显变化）开始前，先存档到 `archive/<任务名>_<YYYY-MM-DD>_v<N>/` 并打附注 tag（`qN-vM`），存档内只改相对路径和一行横幅。/ Archive and tag before a major version.

**内容与设计 / Content and design**
- `datasets/` 只读。没有被要求时不改 Q1、Q2、Q3 已有版本的文件；新方案做成新版本或新文件夹。/ `datasets/` is read-only; add new versions instead of editing existing ones unless asked.
- 页面上的**每个数字都由 CSV 在浏览器里计算**，不手写；改动后用 pandas 独立复核（`tools/verify_q*.py`）。/ Every number computed from the CSVs in the browser; verify in pandas.
- 网站文字用英文，文档中英双语。/ Site copy in English, docs bilingual.
- 全站编码：OW 蓝（浅色 `#2a78d6`、深色 `#3987e5`）、ODSP 橙（浅色 `#eb6834`、深色 `#d95926`），已用 `validate_palette.js` 验证色盲安全；疫情期统一浅灰带（2020-03 至 2023-05，季度数据 2020 Q1 – 2023 Q1）；选中期用包围框；Q3 的青绿 ↔ 紫发散色只表示 Q3 的含义，别处不复用；方向能用位置表达就不用颜色；Q2 不用 3D。/ Site-wide encodings.
- 页面骨架：候选横幅、eyebrow、计算出的导语、Motivation / Appeal / Cost（/ Course basis）、"Read this first" 定义卡、编号步骤（martini glass）、图注 "Figure N."、结论卡片（The data support / do not show / Worth investigating）、Source 行、主题切换、悬停提示（触摸时点按代替悬停）。/ Page skeleton.
- 解释边界：只做描述性比较，不写因果和价值判断；案件不是人数；没有按人口调整；构成占比不是领取率；失业率只作背景；"最终缩小"不等于"一直缩小"；趋势外推只是基准。/ Interpretation limits.
- 参考作品和文献必须真实存在并核实过，**不要编造作品或链接**；没能核实就不引用。/ Never fabricate works or links.
- 交付前跑完整自检：满分要求对照（R1–R20）、L1–L7 检查点、pandas 数字复核、常见错误、1360 / 820 / 400 px × 浅色 / 深色渲染、键盘、触摸、受众三句话；结果如实报告，没做到的直接说。/ Full self-check before delivery; report honestly.
- 有不确定的地方先问，不要自己猜。/ Ask when unsure.

## 4. 已知问题 / Known issues

- D v3（`design/q1/variants/d-paths/`）在手机宽度下有两处标签重叠：滑块拖到 2021 Q3 时个别 3D 角度当前季度标签压住刻度或轴标题；"OW over time" / "ODSP over time" 视图中 "Pandemic" 与 "2026 Q1" 重叠。参照面版本（`shared/d-planes.js`）已修复，D v3 未改。/ Two phone-width label issues remain in D v3.
- `design/prompts/` 下有两个用户自己的 prompt 文件未提交（`Q1_D_plane_options_prompt.md`、`Q1_D_surface_options_prompt.md`）。/ Two untracked prompt files.
- GitHub 上不能直接打开页面（没开 GitHub Pages），只能本地预览。/ No GitHub Pages yet.
- 全省 OW 案件数带小数的原因未核实（页面写 "shown as published"）。/ Decimal OW counts unexplained.

## 5. 原来的会话记录 / Original session transcript

原会话保存在最初那台电脑上：`C:\Users\Owner\.claude\projects\c--Users-Owner-OneDrive-Desktop-2026S-sta313-project-docs\ac626fe4-1371-4a24-97af-dfacbf45214b.jsonl`。在那台电脑上用 `claude --resume` 可以回到它；需要全文时在原会话里用 `/export` 导出。本文件已经包含继续工作所需的信息。
The original transcript stays on the first machine (`claude --resume` there, or `/export`); this file holds what is needed to continue.
