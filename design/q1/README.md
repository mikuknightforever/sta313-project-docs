# Q1 候选版本 / Q1 Candidate Variants

Q1（总体趋势）的 v1 是四个候选版本，供小组比较、选择。设计理由见 [Q1_DESIGN.md](Q1_DESIGN.md)，参考案例见 [REFERENCES.md](REFERENCES.md)。
Q1 (overall trends) v1 consists of four candidate variants for the group to compare. See [Q1_DESIGN.md](Q1_DESIGN.md) for the rationale and [REFERENCES.md](REFERENCES.md) for reference works.

**所有页面的链接见下方 [页面入口](#页面入口--page-links)。/ All page links are in [Page links](#页面入口--page-links) below.**

## 页面入口 / Page links

先在仓库根目录启动本地服务器（见下方"运行"），再点下表的本地链接。"直达"链接会直接打开最能看出这个版本特点的视图。
Start the local server from the repository root (see "Run" below), then use the local links. "Direct" links open the view that shows each version best.

| 页面 / Page | 本地链接 / Local link | 直达 / Direct | 源代码 / Source |
| --- | --- | --- | --- |
| 总览（所有候选的卡片）/ Overview (all candidates) | <http://localhost:8000/design/q1/> | — | [index.html](index.html) |
| A · Annotated timeline | <http://localhost:8000/design/q1/variants/a-timeline/> | — | [a-timeline/index.html](variants/a-timeline/index.html) |
| B · Change, not level | <http://localhost:8000/design/q1/variants/b-change/> | — | [b-change/index.html](variants/b-change/index.html) |
| C · The long view | <http://localhost:8000/design/q1/variants/c-longview/> | — | [c-longview/index.html](variants/c-longview/index.html) |
| D v3 · One path, two programs（含 3D 和 OW − ODSP 视图 / with 3D and OW − ODSP views） | <http://localhost:8000/design/q1/variants/d-paths/> | [?view=3d](http://localhost:8000/design/q1/variants/d-paths/?view=3d) | [d-paths/index.html](variants/d-paths/index.html) |
| D + plane 1 · OW-share planes（OW 占比面） | <http://localhost:8000/design/q1/variants/d-plane-share/> | [?view=3d](http://localhost:8000/design/q1/variants/d-plane-share/?view=3d) | [d-plane-share/index.html](variants/d-plane-share/index.html) |
| D + plane 2 · Time slice（时间切面） | <http://localhost:8000/design/q1/variants/d-plane-slice/> | [?view=3d&t=2021Q3](http://localhost:8000/design/q1/variants/d-plane-slice/?view=3d&t=2021Q3) | [d-plane-slice/index.html](variants/d-plane-slice/index.html) |
| D + plane 3 · Constant-total plane（合计不变面） | <http://localhost:8000/design/q1/variants/d-plane-total/> | [?view=sum](http://localhost:8000/design/q1/variants/d-plane-total/?view=sum) | [d-plane-total/index.html](variants/d-plane-total/index.html) |
| D + plane 4 · Back-to-2019 Q4 planes（2019 Q4 水平面） | <http://localhost:8000/design/q1/variants/d-plane-level/> | [?view=3d](http://localhost:8000/design/q1/variants/d-plane-level/?view=3d) | [d-plane-level/index.html](variants/d-plane-level/index.html) |
| D + insight 5 · Plans vs path（官方预测与预算资助面）**新 / new** | <http://localhost:8000/design/q1/variants/d-insight-plans/> | [?view=ow](http://localhost:8000/design/q1/variants/d-insight-plans/?view=ow) · [?view=3d](http://localhost:8000/design/q1/variants/d-insight-plans/?view=3d) | [d-insight-plans/index.html](variants/d-insight-plans/index.html) |
| D + insight 6 · Support window and rule changes（联邦支持窗口与政策闸门）**新** | <http://localhost:8000/design/q1/variants/d-insight-gates/> | [?view=ow](http://localhost:8000/design/q1/variants/d-insight-gates/?view=ow) | [d-insight-gates/index.html](variants/d-insight-gates/index.html) |
| D + insight 7 · Pre-pandemic track（疫情前轨道与偏离帘幕）**新** | <http://localhost:8000/design/q1/variants/d-insight-trend/> | [?view=3d](http://localhost:8000/design/q1/variants/d-insight-trend/?view=3d) · [?view=sum](http://localhost:8000/design/q1/variants/d-insight-trend/?view=sum) | [d-insight-trend/index.html](variants/d-insight-trend/index.html) |
| D + insight 8 · Two-year-rule rays（两年趋势外推刺）**新** | <http://localhost:8000/design/q1/variants/d-insight-porcupine/> | [?view=ow&t=2021Q3](http://localhost:8000/design/q1/variants/d-insight-porcupine/?view=ow&t=2021Q3) | [d-insight-porcupine/index.html](variants/d-insight-porcupine/index.html) |
| D + insight 9 · 2008 recession ghost（上次危机的影子）**新** | <http://localhost:8000/design/q1/variants/d-insight-ghost/> | [?view=path](http://localhost:8000/design/q1/variants/d-insight-ghost/?view=path) | [d-insight-ghost/index.html](variants/d-insight-ghost/index.html) |
| 存档 / Archive: D v1（只有 2D / 2D only） | <http://localhost:8000/design/q1/archive/q1-d-paths_2026-11-12_v1/> | — | [q1-d-paths_2026-11-12_v1/index.html](archive/q1-d-paths_2026-11-12_v1/index.html) |
| 存档 / Archive: D v2（3D，没有 OW − ODSP 视图 / 3D, no OW − ODSP view） | <http://localhost:8000/design/q1/archive/q1-d-paths_2026-11-14_v2/> | — | [q1-d-paths_2026-11-14_v2/index.html](archive/q1-d-paths_2026-11-14_v2/index.html) |

## 运行 / Run

页面直接读取 `datasets/ONT-SA/selected/` 中的 4 个 CSV。浏览器不允许 `file://` 页面读取本地文件，所以要在**仓库根目录**启动本地服务器：
The pages read four CSVs in `datasets/ONT-SA/selected/`. Browsers block this from `file://`, so start a server from the **repository root**:

```bash
python serve.py
```

[`serve.py`](../../serve.py) 在仓库根目录，用法和 `python -m http.server 8000` 一样，但会告诉浏览器不要缓存，**每次都读取最新文件**：`git pull` 之后普通刷新就能看到最新版本。端口被占用时，先在原来的终端按 Ctrl+C 关掉旧的服务器，或运行 `python serve.py 8001`（链接里的 8000 也换成 8001）。
[`serve.py`](../../serve.py) (repository root) works like `python -m http.server 8000` but tells the browser not to cache, so **every load reads the latest files** and a normal refresh after `git pull` shows the latest version. If the port is busy, stop the old server with Ctrl+C, or run `python serve.py 8001` (and use 8001 in the links).

然后打开上方 [页面入口](#页面入口--page-links) 表里的链接，例如总览页 <http://localhost:8000/design/q1/>。/ Then use the links in [Page links](#页面入口--page-links) above, e.g. the overview <http://localhost:8000/design/q1/>.

这些本地链接只有在本地服务器运行时才能打开；在 GitHub 上点表格里的 `index.html` 只会显示源代码。如果以前用 `python -m http.server` 打开过这些页面，浏览器里可能还存着旧文件：换成 `serve.py` 后，在每个打开过的页面上按一次 **Ctrl+F5**（Mac：Cmd+Shift+R），以后就不用再按了。
The local links work only while the local server is running; on GitHub, the `index.html` links in the table show source code. If you opened these pages before with `python -m http.server`, your browser may still hold old copies: after switching to `serve.py`, press **Ctrl+F5** (Mac: Cmd+Shift+R) once on each page you had opened; after that it is not needed.

需要联网加载 D3 7.9.0（cdnjs）。/ D3 7.9.0 loads from cdnjs.

## 版本 / Variants

| 候选 / Variant | 一句话 / One line | 目录 / Folder | 改变已定决定？/ Changes a settled decision? |
| --- | --- | --- | --- |
| A · Annotated timeline | 双折线 + 数量/指数切换 + 叙事步骤 + 对齐的失业率条带 / two lines, cases-index toggle, story steps, aligned unemployment strip | [variants/a-timeline/](variants/a-timeline/index.html) | 否 / No |
| B · Change, not level | 同比变化小倍数（共用纵轴）+ 同向条带 + 分阶段对比 / YoY small multiples on one axis, same-direction strip, per-period comparison | [variants/b-change/](variants/b-change/index.html) | **是：主图不显示案件数 / Yes: main view is not case counts** |
| C · The long view | 1969 年以来全部社会援助的可刷选概览 + OW/ODSP 详图 / brushable all-programs overview since 1969 + OW/ODSP detail | [variants/c-longview/](variants/c-longview/index.html) | 否 / No |
| D · One path, two programs | 连接散点图（横 ODSP、纵 OW）+ 时间滑块 + 阅读说明 + 同步时间线；当前为 v3：可切换到正交 3D 时空路径、两个时间视图和 OW − ODSP 视图 / connected scatterplot with slider, reading key, companion timeline; now v3: optional orthographic 3D space-time view, two time views and an OW − ODSP view | [variants/d-paths/](variants/d-paths/index.html)（v3，当前 / current） | 否（失业率对齐到同步时间线）/ No (unemployment aligned to the companion timeline) |
| D + plane 1 · OW-share planes | D v3 + OW 占比面（38.3% = 2019 Q4 构成，即等增长平面；后墙 35–50% 射线）/ D v3 plus planes of constant OW share | [variants/d-plane-share/](variants/d-plane-share/index.html) | 否 / No |
| D + plane 2 · Time slice | D v3 + 跟随滑块的时间切面 + 底面疫情灰带 / D v3 plus a time slice that follows the slider and a pandemic floor band | [variants/d-plane-slice/](variants/d-plane-slice/index.html) | 否 / No |
| D + plane 3 · Constant-total plane | D v3 + OW + ODSP = 2019 Q4 合计的平面 + 侧对视图 "OW + ODSP over time" / D v3 plus a constant-total plane and its edge-on view | [variants/d-plane-total/](variants/d-plane-total/index.html) | 否 / No |
| D + plane 4 · Back-to-2019 Q4 planes | D v3 + OW、ODSP 各自的 2019 Q4 水平面，可只看一个 / D v3 plus each program's 2019 Q4-level plane | [variants/d-plane-level/](variants/d-plane-level/index.html) | 否 / No |
| D + insight 5–9 | D v3 + 讲"决策与重大公共事件"的叠加层：官方预测与预算资助容量、联邦支持窗口与政策闸门、疫情前轨道、两年趋势外推、2008 年衰退影子。比较见下方 [插入面备选方案](#插入面备选方案--insight-surface-options) / D v3 plus overlays for a "decisions and major public events" story; compared below | `variants/d-insight-*/` | 否；版本 5、6 引入外部参照数据（[data/](data/README.md)）/ No; versions 5 and 6 add external reference data |

按版本规则（见 [design/DESIGN_LOG.md](../DESIGN_LOG.md)），这批候选是 Q1 v1。小组选定后，入选版本放到稳定路径 `design/q1/prototype/`（尚未建立）；在之后任何大改动之前，先给这批候选打 tag `q1-v1`。
Under the versioning rule, these candidates are Q1 v1. Once the group chooses, the selected version moves to the stable path `design/q1/prototype/` (not created yet); tag this commit `q1-v1` before any further major change.

## 插入面备选方案 / Insight-surface options

**背景 / Background.** 参照面版本 1–4 的面都由 OW、ODSP 两个序列自己定义（占比、合计、2019 Q4 水平、时间切面），能说明"是什么"，但讲不出"决策者该关心什么"。组员建议把受众当作决策机构、把 Q1 讲成"重大公共事件中政府的应对"；你提出用公开的政策目标画一个"目标案件数面"，和实际曲线对比。核查后：**安省没有公布 OW、ODSP 的案件数目标**（减贫战略 2020–2025 的目标是"每年 60,000 名受助人进入就业"，是离开援助的流量，课程数据测不到）；但**安省财政问责办公室（FAO）每年公布案件数预测，并测算预算拨款能资助多少案件**。所以版本 5 用的是这些真实公开的数字。版本 6–9 是另外四种"决策视角"的面，全部做成可运行页面，D v3 和版本 1–4 都没有改。
Planes 1–4 are defined by the two series themselves. The group suggested telling Q1 as "how government responded to a major public event"; you suggested drawing a policy-target surface. Ontario publishes no OW/ODSP caseload target (the poverty strategy's target is an exit flow the data cannot measure), but the FAO publishes caseload projections and the caseload the budget funds, so version 5 uses those. Versions 6–9 are four more decision-oriented overlays. D v3 and versions 1–4 are unchanged.

| # | 叠加层 / Overlay | 面的形式 / Surface | 一句话故事（页面上由数据计算）/ Story (computed on the page) | 数据 / Data | 最好看的视图 / Best view |
| --- | --- | --- | --- | --- | --- |
| 5 | **Plans vs path** 官方预测与预算资助 | 预测轨迹 + 资助缺口带（直纹面）/ forecast trajectories + a ruled "gap" ribbon | The 2026 Budget funds 246,430 OW cases for 2026-27: 15.5% fewer than the 2025-26 average and 56,534 fewer than the FAO estimates, a gap 86% as large as OW's whole pandemic drop. FAO's June 2024 projection missed OW by at most 1.0% but was 3.1% too high for ODSP in 2025-26. | 课程数据 + FAO 三份报告 / + FAO | OW over time、3D |
| 6 | **Support window and rule changes** 联邦支持窗口与政策闸门 | 时间窗（地面 + 后墙的斜线带）+ 编号闸门线 / hatched time window + numbered gates | OW fell through the federal support window (CERB, then CRB) and was lowest in 2021 Q3, the last quarter-end before the CRB ended; 2021 Q4 brought OW's second-largest quarterly rise since 2003 Q1 (+8.4%). ODSP moved ≤ 0.3% after each 2022–23 ODSP change. | 课程数据 + 联邦 / 省政府来源 / + official dates | OW over time |
| 7 | **Pre-pandemic track** 疫情前轨道 | 趋势轨道 + 曲线与轨道之间的帘幕（直纹面）/ track + curtain | In 2026 Q1 ODSP was 82,406 cases (17.8%) below the track of its 2015–19 growth and OW 68,199 (30.5%) above its own; together they were only 14,207 off, so the total hides two opposite departures. | 只用课程数据 / course data only | 3D、**OW + ODSP over time**（帘幕几乎消失）|
| 8 | **Two-year-rule rays** 两年趋势外推 | 从曲线发出的预测射线（"豪猪图"）/ forecast rays from the path | Continuing the last two years' growth for two more years missed OW by 9.8% on average from origins before 2018, but by +15.7% from 2019 Q4 and −44.3% from 2021 Q3. | 只用课程数据 | OW over time（拖滑块）|
| 9 | **2008 recession ghost** 2008 年衰退影子 | 2008 Q3–2014 Q4 的路径平移到 2019 Q4 / ghost path | Six quarters after 2008 Q3 OW was up 28.3%; six quarters after 2019 Q4 it was down 20.8%. 25 quarters on, OW ends at a similar level (120.6 vs 124.0), while ODSP, up 34.4% after 2008, is flat (100.2). | 课程数据（+ 衰退日期来源）| **Path**、3D |

**比较 / Comparison**（★ 越多越好 / more ★ is better）

| # | 决策者叙事 / Decision story | 新信息 / New information | 一眼能懂 / Clarity | 误读风险 / Misreading risk | 依赖外部数据 / External data | 开发与维护 / Effort |
| --- | --- | --- | --- | --- | --- | --- |
| 5 Plans | ★★★ 直接回答"计划和现实差多少" | ★★★ 页面上原来没有的数字 | ★★ OW 正视图很清楚，3D 稍挤 | 中：容易把"资助容量"读成目标（定义卡已写明） | 是，需每年更新 | 中 |
| 6 Gates | ★★★ 组员提出的"应对能力"叙事 | ★★ 时间对齐，不是新指标 | ★★★ | 中高：容易被读成因果（页面多处写明 "dates line up; not cause"） | 是（日期） | 低 |
| 7 Track | ★★★ "回到正常了吗" + 合计掩盖差异 | ★★★ 两个方向相反的缺口 | ★★★ | 中：轨道不是反事实；窗口改变大小不改变方向（Figure 1d） | 否 | 低 |
| 8 Rays | ★★ 规划方法的教训 | ★★ | ★★ 需要先理解规则 | 中：规则是我们构造的基准，不是机构方法 | 否 | 低 |
| 9 Ghost | ★★ "这次像 2008 吗" | ★★★ ODSP 没有像 2008 年后那样增长 | ★★★ Path 视图非常直观 | 低中：一次历史经验不是预测 | 否 | 低 |

**我的建议（由小组决定）/ My recommendation (the group decides)**
- 如果只选一个：**版本 7（疫情前轨道）**。只用课程数据，"ODSP 比轨道低约 8.2 万件、OW 高约 6.8 万件、合计只差 1.4 万件"正好把 Q1 的主线（总量掩盖两个项目的不同）变成一个可以看见的面，换拟合窗口方向不变。/ If only one: version 7.
- 如果按"决策叙事"串起来：**6 → 7 → 5**：冲击来时发生了什么（联邦支持窗口）→ 现在离"正常"多远（轨道）→ 计划假设接下来怎样（FAO 与预算）。三个都用同一个立方体和同一套开关，可以合并成 D 的三个叙事步骤；合并时只保留一个叠加层开关，避免控件过多。/ For a decision narrative: 6 → 7 → 5 as three story steps in one D page.
- 版本 9 适合作为一个"Worth investigating"旁注（FAO 2024 年本身就用了 2008 年后的经验做类比）；版本 8 偏方法论，适合放进报告的设计理由而不是主页面。版本 1（占比面）仍然是最好的"不依赖基期"的参照面，可以和 7 并存。/ Keep 9 as a side note, 8 for the rationale; plane 1 can sit alongside 7.

**考虑过但没有做的 / Considered, not built**
- 失业率推算的 OW 面（用 2017–2019 的 OW–失业率关系外推）：违反"失业率只作背景"的已定决定，且疫情前只有 12 个季度可拟合。数据里确实可以看到关系断开（疫情前 r = 0.82，2022 年后 r = 0.97，全期 r = −0.01），写进版本 6 的"值得调查"更稳妥。/ Unemployment-implied OW: breaks the settled "context only" decision; 12 pre-pandemic quarters.
- 累计偏离面（OW 低于 2019 Q4 水平的"案件·季度"面积，疫情期 −334,634，之后 +473,443）：和参照面 4、版本 7 重复，面积是较弱的通道。/ Cumulative case-quarters: duplicates plane 4 and version 7.
- 每千名劳动力或每千人的案件数：劳动力数据只从 2017 年开始，人口数据不在课程数据里。/ Per labour force or per capita: LFS starts in 2017; no population data.
- 减贫战略就业目标、2021 年 Recovery & Renewal：见 [data/README.md](data/README.md)。/ See the data README.

**待小组决定 / Open questions**：选哪一个或哪几个（或按 6 → 7 → 5 合并）；是否接受版本 5、6 引入的外部参照数据（R5 仍满足：课程数据是主体，外部数字只作参照，每个都有来源）；版本 5 的 FAO 数字每年会更新，最终提交前是否再核对一次。设计理由详见 [Q1_DESIGN.md](Q1_DESIGN.md) §7.4。
Which overlay(s), or merge 6 → 7 → 5; whether to accept the external reference data of versions 5 and 6; re-check the FAO numbers before submission. Rationale: Q1_DESIGN.md §7.4.

## URL 参数 / URL parameters

所有页面都支持 `theme=light|dark`。/ Every page accepts `theme=light|dark`.

| 候选 / Variant | 参数 / Parameters |
| --- | --- |
| A | `step=1\|2\|3\|0`（0 = Explore all）, `mode=count\|index`, `range=all\|2015\|zoom`, `focus=ow\|odsp` |
| B | `step=1\|2\|3\|0`, `mode=yoy\|base`, `range=all\|2015\|zoom`, `ann=ann\|total` |
| C | `step=1\|2\|3\|0`, `mode=count\|index`, `range=all\|2015\|zoom` |
| D | `step=1\|2\|3\|0`, `mode=count\|index`, `t=2021Q3`（滑块位置 / slider position）, `view=path\|3d\|ow\|odsp\|diff`（图 1a 视图；`diff` = OW − ODSP over time / Figure 1a view）, `yaw=…&pitch=…`（仅 3D 的自由角度，pitch −50° 到 85° / free angle, 3D only） |

| D + plane 1–4 | 与 D 相同，另加 `plane=on\|off`（版本 1–3）或 `plane=both\|ow\|odsp\|off`（版本 4）；版本 3 另有 `view=sum`（OW + ODSP over time）/ as D, plus `plane=…`; version 3 also `view=sum` |
| D + insight 5–9 | 与 D 相同，`plane=` 选叠加层：版本 5 `all\|fao\|budget\|off`、6 `both\|fed\|prov\|off`、7 `curtain\|alt\|line\|off`、8 `all\|cur\|off`、9 `rungs\|line\|off`；版本 7 另有 `view=sum`。版本 5、6 的立方体从 2015 Q1 开始 / as D, `plane=` picks the overlay option; version 7 also `view=sum`; versions 5 and 6 start the cube at 2015 Q1 |

例 / Examples: `variants/d-plane-share/index.html?view=3d`, `variants/d-plane-total/index.html?view=sum&mode=index`, `variants/a-timeline/index.html?step=2&mode=index&range=zoom`, `variants/d-paths/index.html?t=2021Q3`, `variants/d-paths/index.html?view=3d`

## 文件 / Files

- `index.html`：候选总览（卡片、比较表、推荐、待决定事项）/ overview of candidates
- `shared/q1.css`：从 Q3 v2 复制的全站变量和页面骨架，新增 OW/ODSP 颜色等 / site tokens copied from Q3 v2 plus OW/ODSP colours
- `shared/q1-common.js`：数据加载、所有派生事实（指数、同比、阶段变化、失业率、历史序列）和共用绘图函数 / data loading, every derived fact, shared helpers
- `variants/<候选>/index.html` + `<a|b|c|d>.js`：各候选 / each candidate
- `screenshots/`：每个候选的 `-desktop-light`、`-desktop-dark`（1360px）、`-mobile-light`、`-mobile-dark`（400px）、`-state`（关键交互状态）、`-thumb`（总览卡片缩略图），以及总览页截图 / per-candidate desktop, phone, interaction-state and thumbnail screenshots, plus the overview page

交互状态截图对应的 URL / State screenshots: A `step=2&mode=index&range=zoom` · B `step=0&mode=base&range=zoom&ann=total` · C `step=2&mode=index` · D `view=3d`

D 的 3D 截图 / D 3D screenshots: `d3d-3d-{light,dark}.png`（斜视 / oblique）, `d3d-path-…`, `d3d-ow-…`, `d3d-odsp-…`, `d3d-diff-…`（四个正视预设，`diff` 为 v3 新增 / the four front presets, `diff` new in v3）, `d3d-3d-mobile-{light,dark}.png`（400px）。

参照面版本截图 / Reference-plane screenshots: `dplane-{share,slice,total,level}-{desktop,mobile}-{light,dark}.png`、`-state.png`、`-thumb.png`。

插入面版本 / Insight versions: `shared/d-insight.js`（从 `shared/d-planes.js` 复制，参照面换成五种叠加层，由 `<body data-insight="…">` 选择）、`data/`（版本 5、6 的外部参照数据和来源）；截图 `dins-{plans,gates,trend,porcupine,ghost}-{desktop,mobile}-{light,dark}.png`、`-state.png`（5：3D；6：OW over time；7：3D；8：OW over time、滑块 2021 Q3；9：Path）、`-thumb.png`。数字复核：[`tools/verify_q1_insight.py`](../../tools/verify_q1_insight.py)。
Insight versions: `shared/d-insight.js` (a fork of `d-planes.js`), `data/` (external reference data and sources for versions 5 and 6), screenshots `dins-*`, and the pandas check `tools/verify_q1_insight.py`.

## 版本 / Versions

候选 A–D 的 v1 已打 tag `q1-v1`（`a193c19`）。D 现在是 v3（v2 加了可选 3D 视图，v3 加了 OW − ODSP 视图）；D v1 存档在 [`archive/q1-d-paths_2026-11-12_v1/`](archive/q1-d-paths_2026-11-12_v1/index.html)，D v2 存档在 [`archive/q1-d-paths_2026-11-14_v2/`](archive/q1-d-paths_2026-11-14_v2/index.html)（tag `q1-v2`）。版本索引见 [`archive/README.md`](archive/README.md)。
The v1 candidates are tagged `q1-v1`. D is now v3 (v2 added the 3D view, v3 the OW − ODSP view); D v1 and D v2 (tag `q1-v2`) are archived. See the version index.

D v3 之上另有四个并列的参照面版本（`variants/d-plane-*/`，共用 `shared/d-planes.js`），D v3 本身未改；这次提交打 tag `q1-v3`。/ Four parallel reference-plane versions build on D v3 (unchanged); this commit is tagged `q1-v3`.

2026-11-16 又加了五个插入面版本（`variants/d-insight-*/`，共用 `shared/d-insight.js`），同样不改 D v3 和版本 1–4。/ Five insight-surface versions (2026-11-16) also leave D v3 and versions 1–4 unchanged.
