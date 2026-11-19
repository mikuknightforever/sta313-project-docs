# Q1 设计说明：OW 与 ODSP 的总体趋势（v1 候选 A–D）/ Q1 Design Rationale: OW and ODSP Overall Trends (v1 candidates A–D)

状态：v1 = 四个可运行的候选版本，2026-11-12，待小组选择（tag `q1-v1`）。候选 D 已更新为 v3：v2 在图 1a 增加了可选的 3D 时空路径视图（§7.1），v3 再加了第四个正视图 "OW − ODSP over time"（§7.2）；D v1、D v2 存档在 `archive/`。另有参照面版本 1–4（§7.3）和插入面版本 5–9（§7.4，2026-11-16），都不改 D v3。网站文字为英文；本说明中英双语。做法和质量标准以 Q3 v2（[design/q3/Q3_DESIGN.md](../q3/Q3_DESIGN.md)）为准。
Status: v1 = four runnable candidates, 2026-11-12, awaiting the group's choice (tag `q1-v1`). Candidate D is now v3: v2 added an optional 3D space-time view (§7.1), v3 a fourth flat view, "OW − ODSP over time" (§7.2); D v1 and D v2 are archived in `archive/`. Reference-plane versions 1–4 (§7.3) and insight-surface versions 5–9 (§7.4) leave D v3 unchanged. Website copy is in English; this document is bilingual. Method and standards follow Q3 v2.

- 总览 / Overview: [index.html](index.html) · 运行方法 / Run: [README.md](README.md) · 参考 / References: [REFERENCES.md](REFERENCES.md)
- 当前页面 / Current pages: [A](variants/a-timeline/index.html) · [B](variants/b-change/index.html) · [C](variants/c-longview/index.html) · [D（v3）](variants/d-paths/index.html)；旧版本只在 [archive/](archive/README.md)，仅供对照。/ Older versions live only in the archive, for comparison.
- 研究问题 / Research question: *How did OW and ODSP caseload trends differ before, during, and after the COVID-19 pandemic?*
- 受众 / Audience: MCCSS 负责社会援助案件监测和政策研究的政策分析员；场景：写简报时比较疫情前、中、后两个项目的规模和走势，找出值得进一步调查的时期。/ MCCSS policy analysts preparing briefings.
- 位置 / Place in the site: Part 1 of 3，为 Q2、Q3 提供全省背景。/ Provides province-wide context for Parts 2 and 3.

---

## 0. 要求清单与冲突 / Requirements and conflicts

R1–R20 沿用 [Q3_DESIGN.md 第 0 节](../q3/Q3_DESIGN.md)（由附件 *Project* 和 *Project mock design* 整理），并已对照附件原文复查。第 10.1 节逐个候选对照。
R1–R20 are taken from Q3_DESIGN.md §0 (compiled from the attached *Project* and *Project mock design* pages) and re-checked against the attachments. Section 10.1 checks each candidate.

**发现的冲突或张力 / Conflicts and tensions found**
1. **疫情期与数据频率**：`research/RESEARCH_QUESTIONS.md` 第 3 节的 Q1 草案写的是"2017—2025 年月度数据，疫情期 2020-03 至 2022-12"；课程数据中 OW/ODSP 是**季度**数据（2003 Q1–2026 Q1），`covid_period` 字段的疫情期是 **2020-03 至 2023-05**（季度数据中最后一个 during 观测为 2023 Q1）。四个候选都按 Prompt 和数据字段处理，研究文档需要小组更新。/ The Q1 draft says monthly 2017–2025 data and a Mar 2020 – Dec 2022 pandemic period; the data are quarterly 2003–2026 with Mar 2020 – May 2023. All candidates follow the data.
2. **R10 创意 vs 清楚**：附件要求"think beyond traditional charts"，而最清楚的候选 A 恰恰是传统双折线。第 9 节的推荐因此建议以 A 为底、加入 B 的分阶段图，而不是只交 A。/ The rubric rewards novelty; the clearest candidate (A) is the most conventional.
3. **R17 篇幅**：`report.pdf` 插图 1–3 页、说明 1–2 页，三个问题共用；四个候选不可能都进报告，小组必须先选。/ The report cannot carry four candidates.
4. **历史序列口径**：Prompt 提醒 `ont-sa-historical.csv` 口径不同。数据字典（`datasets/ONT-SA/original/historical_sa_recipients_data_dictionary_1969_to_current.xlsx`）确认：1998 年 4 月起包括 OW、ODSP、Temporary Care Assistance、Assistance for Children with Severe Disabilities；1998 年以前是 General Welfare Assistance、Family Benefits、Foster Care、Handicapped Children's Benefits。所以该序列在 1998 年有**口径断点**，"1969 年以来最高"跨越了这个断点。/ The dictionary confirms the coverage and a 1998 definition break.

## 1. 数据 / Data

| 文件 / File | 内容 / Content | 频率与范围 / Frequency, coverage | 用于 / Used by |
| --- | --- | --- | --- |
| `ont-sa-characteristic-ow-ont.csv` | OW 全省案件 `cases` | 季度 2003 Q1–2026 Q1，93 期 | A B C D |
| `ont-sa-characteristic-odsp-ont.csv` | ODSP 全省案件 `cases` | 同上 | A B C D |
| `1410028701_databaseLoadingData.csv` | 安省失业率 `ont_unemployment_rate_pct` | 月度 2017-01–2025-12 | A B C D（背景 / context） |
| `ont-sa-historical.csv` | 全部社会援助案件 `ont_all_assistance_cases` | 月度 1969-01–2026-03 | 仅 C / C only |

**已用 pandas 复核的事实 / Facts recomputed in pandas**（页面上的同一数字全部由 `shared/q1-common.js` 在浏览器里计算，见 §10.3）

| 事实 / Fact | 值 / Value |
| --- | --- |
| 2019 Q4 基准 / base | OW 235,500.5；ODSP 379,015 |
| OW 最低 / lowest | 2021 Q3，178,872（指数 76.0） |
| OW 最高 / highest | 2025 Q2，292,389（指数 124.2）；2026 Q1 为 291,970（124.0） |
| OW 回到 2019 Q4 水平 / back to 2019 Q4 | 2023 Q2（指数 100.3） |
| ODSP 2019 年以后 / since 2019 | 368,176 – 381,192（指数 97.1 – 100.6），最高 2020 Q1；2026 Q1 为 379,726（100.2）。只能说"相对稳定"，不能说"没变" |
| 2019 Q4 ODSP / OW | 1.6 倍 |
| 疫情前 / pre（2003 Q1→2019 Q4，16.75 年） | OW +20.2%（195,918→235,501）；ODSP +91.9%（197,528→379,015）；年均 OW +1.1%、ODSP +4.0% |
| 疫情期 / during（2020 Q1→2023 Q1，3 年） | OW −5.2%（244,871→232,089）；ODSP −3.4%（381,192→368,176）；年均 OW −1.8%、ODSP −1.2% |
| 疫情后 / post（2023 Q2→2026 Q1，2.75 年） | OW +23.6%（236,258→291,970）；ODSP +3.1%（368,334→379,726）；年均 OW +8.0%、ODSP +1.1% |
| 同比最低 / lowest YoY | OW 2021 Q2 −20.7%；ODSP 2021 Q3 −1.9% |
| 同比最高 / highest YoY | OW 2009 Q3 +21.2%；ODSP 2007 Q2 +6.8% |
| 同向季度 / same direction | 89 个可计算同比的季度中 48 个两者同号 |
| 失业率 / unemployment | 最高 2020 年 5 月 14.2% |
| 历史序列 / historical | 2026-03 为 712,554（全序列最高）；1998 年以前最高 1994-03，692,871；2024-08 首次超过 1994 峰值；疫情：2020-02 650,624 → 2021-10 582,846（−10.4%） |
| 历史序列 − (OW + ODSP) | 21,464 – 40,858 件（2019-12：645,650 vs 2019 Q4 的 614,516） |

**数据注意事项（网站如实处理）/ Data cautions shown on the pages**
- 全省 OW `cases` 带小数（历史序列部分月份也有），原因未核实：页面只写"shown as published"，四舍五入到整数显示。
- 失业率只覆盖 2017-01 至 2025-12，与案件数共用时间轴时，2017 年以前标注 "No unemployment data before Jan 2017"。
- 历史序列从不与 OW、ODSP 堆叠、相加或拼成一条线；C 中用中性色单独成图，并标出 1998 断点和与 OW+ODSP 的差额。

## 2. 数据抽象与任务抽象 / Data and task abstraction (L1, L2)

| 属性 / Attribute | 类型 / Type |
| --- | --- |
| 季度、月份 / Quarter, month | 有序、数量型（时间）/ ordered, quantitative |
| 项目（OW、ODSP）/ Program | 类别 / categorical |
| 案件数 / Cases | 数量型 / quantitative |
| 疫情阶段 / Pandemic phase | 有序类别（before → during → after）/ ordered categorical |
| 失业率 / Unemployment rate | 数量型（%），不同测量 / quantitative, a different measure |

**派生数据 / Derived data**：指数（2019 Q4 = 100）、同比变化（与上一年同季度比，%）、相对 2019 Q4 的变化（指数 − 100）、阶段首尾变化与年均变化（(末 ÷ 首)^(1/年数) − 1）、同向季度计数、阶段内极值。

| 任务 / Task (L2) | 受众问题 / Analyst question | A | B | C | D |
| --- | --- | --- | --- | --- | --- |
| Identify trend | 两个项目各自怎么走？| 图 1a | 图 1a（变化）| 图 2a | 图 1b、路径 |
| Compare | 两个项目在哪些时期一致、分开？| 图 1a 指数 | 图 1a 共轴 + 同向条带 | 图 2a | 路径方向 |
| Find extremum | 最高、最低在何时？| 注释点 | 注释点 | 注释点（含历史峰值）| 标签点 |
| Compute derived value | 阶段变化多大？| 图 2 表 | 图 2 年均 | 叙事 + 卡片 | 图 2 表 |
| Retrieve value | 某季度具体多少？| 悬停 | 悬停 | 悬停 | 悬停 + 读数面板 |

## 3. 所有候选共用的决定与边界 / Shared decisions and boundaries

- **已定决定 / Settled decisions**：默认显示案件数并提供"2019 Q4 = 100"指数切换；失业率在主图下方、共用时间轴、不用双纵轴；OW 蓝、ODSP 橙；疫情期用与 Q3 相同的浅灰带并标注 "Pandemic"；沿用 Q3 v2 的变量、字体、页面骨架（eyebrow、编号步骤、"Read this first"、结论卡片、Source 行）和交互习惯。**只有 B 改变了一项（默认不显示案件数），页面顶部和本文件都明确标出。**
- **解释边界 / Interpretation limits**：只做描述性比较；不说疫情、CERB、政策或经济"导致"变化，每个候选都有 "These data do not show why" 和 "The data do not show" 卡片；失业率只作背景；案件不是人数，不等于全部或未满足的需求；不用"改善、恶化、恢复健康"等价值判断，只用"上升、下降、回到 2019 Q4 水平"。
- **颜色 / Colour**（`validate_palette.js`）：OW / ODSP 分类对，浅色 `#2a78d6`/`#eb6834`：CVD ΔE 24.7、正常视力 33.6、对背景均 ≥ 3:1；深色 `#3987e5`/`#d95926`：CVD 26.8、正常 31.8、均 ≥ 3:1。疫情阶段的有序中性色阶（D 使用）浅色 `#acaaa2 → #75736c → #3d3c38`、深色 `#5c5b56 → #9a988f → #dddbd2`，均通过 `--ordinal` 检查（亮度单调、相邻 ΔL ≥ 0.06、浅端对比 ≥ 2:1）。失业率和历史序列用中性墨色，与项目色区分（同义同色、异义异色）。没有用颜色表示正负，所以不需要发散色阶。
- **L7 为什么不用地图 / Why no map**：Q1 只有全省一个地理单元，没有地区差异可以定位或比较；地图只会占用空间而不增加信息。地区维度留给 Q2、Q3。
- **共用代码 / Shared code**：`shared/q1.css` 从 Q3 v2 复制（没有修改 Q3），`shared/q1-common.js` 负责数据加载和所有派生事实，四个候选引用同一套计算，保证数字一致。

## 4. 候选 A：带注释的时间线 / Candidate A: annotated timeline

- **Motivation**：问题是"水平随时间怎么变"，共同尺度上的位置是最准确的通道（L3 effectiveness）。
- **Appeal**：一张可以直接放进简报的注释图：OW 的下降与反弹，旁边是平稳的 ODSP。
- **代价 / Cost**：最常见的形式，创意分低；变化快慢只能从斜率读。
- **视图与编码 / Views and encodings**
  - 图 1a：两条线（2px），横向位置 = 时间，纵向位置 = 案件数（从 0 开始）或指数（以 100 为参考线）；颜色色相 = 项目（类别 → 色相，expressiveness），右端直接标签 + 图例（不只靠颜色）。
  - 图 1b：失业率面积 + 线，中性墨色，与 1a 共用横轴和左右边距（L4-1 alignment），没有第二纵轴。
  - 图 2：阶段首尾表格（精确值，retrieve value）。
  - 注释只标当前步骤相关的点（selective labels）：疫情前步骤标 2019 Q4，疫情期标 OW 最低和 ODSP 最高，疫情后标 OW 最高。
- **交互（Card 流程）/ Interactions**：叙事步骤 = 视图层的强调（enclosure 框住该阶段）+ 文字；数量 / 指数 = **change mapping**（visual mapping 层）；2003–2026 / 2015–2026 / 2018–2024 = **navigation**（视图层的时间窗口）；图例点击 = **selection**（另一项目变淡，popout）；悬停 = **details on demand**（季度、阶段、两项目案件数和指数、季末失业率），十字线在 1a 和 1b 同步（**linked views**）；表格行点击 = 选择阶段，联动图 1。
- **放弃的方案 / Rejected**：双纵轴（两个尺度对齐是任意的）；柱状图（93 期太密，柱的面积分散注意）；每点标数字；对数坐标（不是指数增长）。

## 5. 候选 B：看变化，不看水平 / Candidate B: change, not level

- **改变的已定决定 / Settled decision changed**：主图默认显示同比变化（%），不显示案件数。理由：问题问的是走势"如何不同"，变化率让两个规模不同的项目天然处于同一尺度，不需要指数。案件数仍在悬停提示和图 2 中。页面顶部用虚线框标出。
- **Motivation**：方向和速度才是"不同"的核心；共用纵轴的两个变化面板可以直接看出哪些时期一致、哪些分开。
- **Appeal**：2021 年 OW 跌到 0 线以下很深，ODSP 贴着 0 线；下方条带标出两者同向的每一个季度。
- **代价 / Cost**：失去主图上的规模信息；同比变化噪声更大，需要定义；增长率定义尚未由小组确定。
- **视图与编码**
  - 图 1a：两个**小倍数**面板上下排列，**共用同一纵轴**（L3：用小倍数解决量级差异，而不是双纵轴），0 线为参考；线 + 浅色面积到 0 线，颜色 = 项目。每个面板标出视图内的最高、最低值。
  - 同向条带：每季一格，两者同比同号时填充中性灰（派生的二元属性），标注"在视图内 N / M 个季度同向"。
  - 图 1b：失业率，对齐时间轴。
  - 图 2：分阶段点图，OW 圆点 + ODSP 菱形（形状 + 颜色双重编码），0 线参考；默认"年均变化"（各阶段长度为 16.75、3、2.75 年，总变化不能直接比），可切换"首尾总变化"。标签在空间不足时自动改为上下排列。
- **交互**：同比 / 相对 2019 Q4 = change mapping；时间范围 = navigation；叙事步骤和图 2 行点击 = selection（阶段框联动到所有面板）；年均 / 总变化 = change mapping（数据变换层）；悬停十字线贯穿两个面板、条带和失业率图，提示中给出变化值和案件数。
- **放弃的方案**：用发散色阶给变化着色（位置已经编码正负，颜色是冗余且精度低）；把两条变化线画在同一面板（ODSP 的小幅变化会被 OW 的大幅波动压扁，读者会把重叠误读为一致）；季度环比（季节波动更大）。

## 6. 候选 C：长时段背景（focus + context）/ Candidate C: the long view

- **Motivation**：简报需要回答"疫情期间的变化在历史上算大还是小"；先给出长时段概览，再进入细节。
- **Appeal**：1969 年以来的完整记录：疫情下降只是一个小凹口，最新水平高于 1994 年峰值。
- **代价 / Cost**：引入口径不同、且在 1998 年有断点的序列，必须解释；占用更多纵向空间；需要小组同意使用历史文件。
- **视图与编码**
  - 图 1：1969–2026 月度全部社会援助案件，面积 + 线，**中性墨色**（不是项目色，避免被读成 OW 或 ODSP）；1998 年 4 月竖线标注口径变化；2003 年以前加浅底说明"没有季度 OW/ODSP 数据"；标出 1994-03 和 2026-03 两个峰值；图下说明该序列包含哪些项目、比 OW+ODSP 多 21,464–40,858 件。
  - 刷选框（只能落在 2003 年以后）决定图 2 的时间范围（overview + detail）。
  - 图 2a：OW / ODSP 双折线（数量 / 指数切换），图 2b：失业率，对齐 2a。
- **交互**：刷选 = **navigation**（视图层窗口）；按钮提供同样的范围（键盘可用，因为 d3 刷选不能用键盘操作）；拖动可以直接画新范围（为此让选框不拦截指针事件，边缘把手仍可调整）；悬停 2a/2b 时，图 1 上同步出现竖线（overview ↔ detail 联动），提示里给出同月的全部社会援助案件数并注明口径不同。
- **"1969 年以来最高"的写法**：页面写 "the most of any month since 1969"，并在同一句或紧接着说明：是案件数不是人数、没有按人口调整、1998 年项目口径改变，所以"最多案件"不等于"最高比例"。是否保留这句话列为待决定问题。
- **放弃的方案**：把历史序列和 OW、ODSP 画在同一张图（会被当成同口径比较）；把 OW+ODSP 拼接到 1998 年以前的历史序列上（口径不同）；对数坐标。

## 7. 候选 D：一条路径，两个项目（连接散点图）/ Candidate D: one path, two programs

当前页面 / Current page: [variants/d-paths/](variants/d-paths/index.html)（v3）。本节写 v1 起就有的 2D 设计，§7.1、§7.2 是 v2、v3 新增的内容。
Current page: `variants/d-paths/` (v3). This section covers the 2D design present since v1; §7.1 and §7.2 cover the v2 and v3 additions.

- **Motivation**：问题是两个序列"相对彼此"怎么动；把一个画成另一个的函数，"一起还是分开"就变成一条路径的方向。可选的 3D 视图把时间作为纵深，说明路径图和两张时间图是同一个立方体的三个面（§7.1）。
- **Appeal**：最容易记住、也最容易在简报里复述的形状：疫情前长期向右漂移，疫情中近乎垂直下降再回升；在 3D 中，同一条曲线随着立方体旋转变成每一张熟悉的图。
- **代价 / Cost**：读者不熟悉；时间沿路径而不是沿坐标轴，Haroz 等（2016）发现读者更容易弄错顺序和方向；疫情期间下降和回升的两段几乎重叠（ODSP 基本不动），需要滑块才能分开。3D 视图增加遮挡和旋转成本，所以数值只在正视图中读。
- **视图与编码**
  - 图 1a：横向位置 = ODSP，纵向位置 = OW，每季一点，按时间连线；两轴**每个指数点使用相同像素**，所以 45° 虚点线表示"同等相对增长"，路径与它的夹角可以直接比较。数量 / 指数切换只改坐标刻度（几何不变），刻度取整数案件数。线段按疫情阶段用有序中性色阶（浅 → 深）分段，不占用项目色。只标起点、2019 Q4、OW 最低点、最新一期和滑块当前季度（当前标签自动避让）。
  - 阅读说明：方向键（右 = 只有 ODSP 增长，上 = 只有 OW 增长，对角 = 两者都增长，下 = 只有 OW 下降）+ 阶段图例 + 当前季度读数面板。
  - 图 1b：同步的普通时间线（两项目指数）+ 失业率条带，竖线跟随滑块。**说明**：失业率对齐的是这条同步时间线，而不是散点图（散点图没有时间轴）——这是对已定决定的适配，列为待确认事项。
  - 图 2：每阶段净变化与路径方向（规则：变化幅度超过另一项目两倍者决定主方向）。页面上的方向词（"mostly right"、"mostly up"）都由这条规则计算得出。
- **交互**：滑块（`<input type=range>`，键盘原生可用）+ Play = **navigation**（时间）；叙事步骤 = selection（其他阶段变淡）；悬停散点（Delaunay 最近点）↔ 时间线竖线和读数面板联动；点击时间线把滑块移到该季度。`prefers-reduced-motion` 时播放步进放慢、无补间动画。
- **放弃的方案**：动画气泡图（Gapminder 式的气泡大小和颜色会编码多余变量）；不等比例坐标（45° 失去意义）；不加阅读说明直接展示（研究证据显示误读风险高）。

### 7.1 3D 时空路径（D 的 v2）/ 3D space-time path (D v2)

当前页面 / Current page: [variants/d-paths/](variants/d-paths/index.html)（v3，包含本节全部功能；`?view=3d` 直接打开 3D 视图）。D 的 v1（只有 2D 连接散点图）存档在 [archive/q1-d-paths_2026-11-12_v1/](archive/q1-d-paths_2026-11-12_v1/index.html)（tag `q1-v1`，旧版，仅供对照）。v2 只改了图 1a：加入一个可选的 3D 视图和两个由它"压平"得到的时间视图，其余视图、编码和联动不变。
Current page: `variants/d-paths/` (v3, includes everything in this section; `?view=3d` opens the 3D view). D v1 (2D only) is archived (tag `q1-v1`, old version, for comparison). v2 changes only Figure 1a: an optional 3D view and two time views obtained by flattening it.

**为什么用 3D / Why 3D**
- 三个变量里有一个是时间：X = ODSP、Y（向上）= OW、Z（纵深）= 时间，93 个季度连成一条空间曲线（L7 的 space-time cube）。
- 沿三个轴正视这个立方体，正好得到三张熟悉的 2D 图：沿时间轴看 = 连接散点图（OW 对 ODSP），沿 ODSP 轴看 = OW 随时间变化，沿 OW 轴看 = ODSP 随时间变化。这就是 Bach 等（2014）总结的时空立方体"压平"（flattening）操作。
- 所以 3D 的作用是**把三张 2D 图连起来**，让分析员看清它们是同一份数据的三个侧面；它是过渡，**不是读数用的**。读数一律在正视（2D）状态或读数面板中进行（L3 effectiveness：数值用共同尺度上的位置来读）。
- 交互对应 L5：视图切换 = change mapping（视角改变 visual mapping 层），旋转和预设 = navigation（视图层），3D 中的当前点、悬停和滑块与图 1b/1c 联动 = linked views。
Three variables, one of them time; the three axis-aligned projections are exactly three familiar 2D charts. 3D links them; values are read only in flat views (L3), and the interactions map to L5 change mapping, navigation and linked views; L7 space-time cube flattening.

**设计 / Design**
- **默认 2D**：页面打开时图 1a 仍是 v1 的 2D 连接散点图（刻度、标签、点的位置与 v1 完全一致，见 §10.5）。3D 通过分段按钮 `Path (OW vs ODSP) | 3D | OW over time | ODSP over time` 进入；另有"Show how the views connect"导览，自动依次转到 3D → OW over time → 3D → ODSP over time → 3D → Path，每一步一句说明。
- **正交投影**：先绕竖轴转 yaw、再转 pitch，没有透视，平行线保持平行。预设：Path（yaw 0°, pitch 0°）、OW over time（90°, 0°）、ODSP over time（90°, 90°，从下方看）、斜视 3D（38°, 24°）。
- **动画**：预设之间摄像机平滑旋转 700 ms（easeCubicInOut），`prefers-reduced-motion` 时直接切换。转到正视角的最后一帧，渲染器换成 2D 坐标轴（同样的刻度、标签、网格、疫情灰带、2019 Q4 参考线），用户看到"它转成了一张普通的图"。
- **一个渲染器**：2D 路径、3D 和两个时间视图都由同一个投影函数绘制，所以正视图在构造上就与 3D 的同一视角一致；两轴仍用"每个指数点相同像素"，45° 等速增长在 3D 中是 OW 指数 = ODSP 指数的**平面**，在时间墙上画成 45° 虚点线（与 2D 中的含义相同）。
- **斜视时帮助判断深度**：三面"远墙"（随视角自动选取离观者较远的一面）上画淡色网格和路径的投影（shadow projection）；当前季度画出到三面墙的垂直引线（drop lines），数值显示在旁边的读数面板；坐标轴和刻度标签始终正对屏幕（billboard）；线段按深度从远到近绘制（painter's order），近处遮住远处。
- **标签防碰撞**：3D 中刻度和轴标题在某些角度会挤在一起，所以每次渲染后：轴标题被推离刻度，仍有冲突的刻度标签被隐藏（贪心保留），轴标题之间也互相避让，超出图框的文字被推回框内。全部允许角度扫描通过（见 §10.5）。
- **自由旋转是辅助**：鼠标或手指拖动旋转，聚焦图后用方向键每次 5°，双击、Home 或"Reset 3D view"回到斜视预设。角度限制 yaw −20°–110°、pitch −15°–85°，不会上下颠倒。拖动和点击区分开（移动 > 3 px 才算拖动），拖动不会改变滑块。
- **沿用 D 的编码和联动**：疫情前、中、后用有序中性色阶（浅 → 深）；滑块、Play、悬停读数、和图 1b/1c 的联动竖线在所有视图中都可用；"Axes in cases / Axes as index"在 3D 和时间视图中也有效（只改刻度）。
- **技术**：D3 + SVG 自写正交投影（93 个点、三面墙和三条轴，每帧几百个元素），沿用全站 CSS 变量和深浅主题，不需要 WebGL 或 three.js。
- **手机**：400 px 下 3D 可用（触摸拖动旋转、预设按钮、导览），页面无横向滚动，所以手机上不隐藏 3D 按钮；3D 图较小，读数仍以正视图和读数面板为准。
- **可访问性**：所有按钮可用键盘操作；图 1a 可聚焦，`aria-label` 说明可以用方向键旋转、Home 复位、数值在旁边面板；读数面板和导览说明是 `aria-live`。

**代价与应对 / Costs and mitigations**（对照 Munzner "No unjustified 3D"）

| 3D 的代价 / Cost | 应对 / Mitigation | 是否抵消 / Offset? |
| --- | --- | --- |
| 深度位置难以准确判断（排名很低的通道）/ Depth is a weak channel | 不在 3D 中读数；三个正视图 + 读数面板；墙面投影把三个变量各自"摊"到一面墙上；引线标出当前点 / No reading in 3D; flat views, readout, wall shadows, drop lines | 基本抵消 / Largely |
| 点和线互相遮挡 / Occlusion | 细线、按深度绘制、墙面投影；但疫情期下降和回升两段在部分角度仍重叠 / Thin lines, painter's order, shadows; pandemic legs still overlap at some angles | 部分 / Partly |
| 透视让长度和斜率变形 / Perspective distortion | 正交投影，平行线保持平行 / Orthographic | 抵消（同一方向内）/ Yes, within one direction |
| 必须旋转才能看清 / Interaction cost | 默认 2D；四个预设一键到达；导览自动演示；Reset / Default 2D, presets, tour, reset | 部分 / Partly |
| 斜看时文字难读 / Slanted text | 标签始终正对屏幕，自动防碰撞 / Billboard labels, decluttering | 抵消 / Yes |
| 静态截图（`report.pdf`）难读 / Static images | 报告用"一张斜视图 + 三个正视投影"的小图组 / One oblique image plus three projections | 部分 / Partly |

**考虑过但放弃的方案 / Rejected**
- 透视 3D：远近大小不同，长度和斜率无法比较。/ Perspective: lengths and slopes become incomparable.
- 只能自由旋转、没有预设：用户要自己找到能读的角度，交互成本高，也无法和 2D 图一一对应。/ Free rotation only: high cost, no link to the 2D charts.
- Plotly 等现成 3D 库：体积大，WebGL 依赖，风格和深浅主题难统一，标签不能按本站规则防碰撞。/ Plotly etc.: heavy, WebGL, hard to theme.
- 直接用 3D 替代 2D：违反 L3（数值要在共同尺度的位置上读）和 "No unjustified 3D"。/ Replacing 2D with 3D violates L3.
- 3D 柱状图、曲面、光照或阴影特效：只增加装饰，不增加信息。/ 3D bars, surfaces, lighting: decoration only.

**对报告的影响 / Impact on `report.pdf`**
mock design 报告是静态的，3D 只能截图。如果小组选 D，建议用一个小图组：左边一张斜视 3D（约半栏宽），右边竖排三个正视投影（Path、OW over time、ODSP over time），共约半页；截图见 `screenshots/d3d-*.png`（浅色、深色各一套）。在"插图 1–3 页"的限制下，Q1 只有在选了 D 时才需要这半页；若 Q1 选 A 或 A+B，3D 不进报告。
The report is static. If D is chosen, use one oblique image plus three projections (about half a page); otherwise 3D stays out of the report.

### 7.2 第四个正视图：OW − ODSP（D 的 v3）/ Fourth flat view: OW − ODSP (D v3)

当前页面 / Current page: [variants/d-paths/](variants/d-paths/index.html)（v3；`?view=diff` 直接打开 OW − ODSP 视图）。D v2 存档在 [archive/q1-d-paths_2026-11-14_v2/](archive/q1-d-paths_2026-11-14_v2/index.html)（提交 `e836bb9`，tag `q1-v2`，旧版，仅供对照）。v3 只在图 1a 的视图按钮里加了 "OW − ODSP over time"，其余视图、编码和联动不变。
Current page: `variants/d-paths/` (v3; `?view=diff` opens the OW − ODSP view). D v2 is archived (commit `e836bb9`, tag `q1-v2`, old version, for comparison). v3 only adds an "OW − ODSP over time" button to Figure 1a's view buttons.

**为什么 / Why**
- yaw 为 90° 时，pitch 让摄像机绕时间轴旋转，屏幕纵轴显示 OW·cos(pitch) + ODSP·sin(pitch)（单位：指数点）。0° 是 OW over time，90° 是 ODSP over time；**−45° 时是 (OW − ODSP)/√2**：等增长平面（OW 指数 = ODSP 指数）正好侧对观者，曲线的高度就是 OW 指数 − ODSP 指数。这样 3D 不只是"把三张已有的图连起来"，还能从同一个立方体里得到一张页面上原本没有、而且直接回答 Q1 问题（两个项目的走势如何不同）的派生图。
- 读法：0 = 两个项目处在各自 2019 Q4 水平的同一百分比；正值 = OW 相对更高。数据（pandas 复核）：2003 Q1 +31.1（即 2003–2019 年 ODSP 的增长远多于 OW）、2010 Q1 最高 +36.0、2019 Q4 按定义为 0、2021 Q3 最低 −22.3、2023 Q1 由负转正（+1.4）、2026 Q1 +23.8。
- 诚实地说：这张图用 2D 也能直接画（就是 A 指数模式里两条线的竖直距离）。3D 的贡献是说明它从哪里来，以及它和另外几个视图是连续的。
At yaw 90° the pitch rotates the camera about the time axis and the screen's vertical shows OW·cos(pitch) + ODSP·sin(pitch); at −45° that is (OW − ODSP)/√2, so the equal-growth plane is seen edge-on. The same chart could be drawn in 2D; the 3D shows where it comes from.

**设计 / Design**
- 按钮放在视图分段按钮的最后；预设 yaw 90°、pitch −45°；动画最后一帧换成 2D 坐标轴：横轴时间（同样的年份刻度和疫情灰带），纵轴 "OW index − ODSP index"，带符号刻度（−20、0、+20 …），0 处虚线注明 "0 = equal growth since 2019 Q4"，上下角注明 "OW relatively higher ↑ / lower ↓"。
- 纵轴范围是立方体在这个方向上的投影（−40 到 +80），和其他正视图一样由同一个投影决定，所以动画到达和直接打开完全一致；代价是 +40 以上是空的。
- **始终用指数点**：在 "Axes in cases" 模式下也不显示"案件数之差"，因为 OW 和 ODSP 的案件数相减会混合两个不同的基数；标题和提示都写明 "always in index points"。
- 自由旋转的 pitch 下限从 −15° 放宽到 −50°，手动也能转到这个视角；立方体仍不会上下颠倒。
- 导览增加一步：3D → OW − ODSP → 3D，最后仍停在 Path。读数面板在所有视图中增加一行 "OW index − ODSP index"。
- One button, preset (90°, −45°), a flat 2D axis with signed ticks and a dashed zero line; the vertical range is the cube's projection, so animated and direct arrival match; always in index points; pitch limit widened to −50°; one more tour step; one more readout row.

**放弃的方案 / Rejected**
- pitch +45° 的"合并趋势"视图（OW 和 ODSP 指数的平均）：政策含义弱，不加预设。/ The +45° "average index" view: weak meaning.
- 只缩放到数据范围，让图更大：动画最后一帧会跳变，也破坏"同一个投影"。/ Zooming to the data: the last animation frame would jump.
- 在数量模式下显示案件数之差：两个基数不同，没有意义。/ A difference of cases mixes two scales.

### 7.3 参照面版本：D + plane 1–4（2026-11-14）/ Reference-plane versions: D + plane 1–4

在不改动 D v3（`variants/d-paths/`）的前提下，做了四个并列版本，每个在 D v3 的立方体里加一种由指标定义的二维参照面。四个页面共用 `shared/d-planes.js`（从 D v3 的 `d.js` 复制后增加参照面），用 `<body data-plane="…">` 选择版本：[`variants/d-plane-share/`](variants/d-plane-share/index.html)、[`d-plane-slice/`](variants/d-plane-slice/index.html)、[`d-plane-total/`](variants/d-plane-total/index.html)、[`d-plane-level/`](variants/d-plane-level/index.html)。数字全部由 CSV 在浏览器中计算。
Four parallel versions add one indicator-defined reference plane each to D v3's cube; D v3 is unchanged. They share `shared/d-planes.js` (a fork of D v3's `d.js`).

**四个版本共用的画法 / Shared drawing rules**
- 每个面都是立方体坐标（指数单位）里的一个点集；"案件数"模式只换刻度，所以两种模式下是同一个面。/ Each plane is one set of points in the cube's index coordinates, so it is the same in both modes.
- 3D 中：半透明多边形，画在曲线**下层**，不遮挡曲线；标签正对屏幕，与其他文字冲突时换位置或不显示。/ In 3D: translucent, drawn under the path; billboard labels that give way rather than overlap.
- 正视图中：只有**侧对**观者的面才画（变成一条参考虚线），否则隐藏，避免一个面铺满整张图。/ In flat views a plane is drawn only when seen edge-on (as a reference line).
- 开关（分段按钮）= L5 filtering；曲线穿过面的季度画空心圆，悬停提示写明"Crosses the … plane here (now above/below)"；读数面板加一到两行；图下的 "Reference plane" 段落用文字列出穿越季度和距离（2D 读法）；"Read this first" 加一张定义卡。/ On/off toggle, rings at crossings with a tooltip line, extra readout rows, a written 2D reading under the chart, and a definition card.

| 版本 / Version | 一句话故事（页面上由数据生成）/ Story | 面的方程 / Plane | 曲线与面（pandas 复核）/ Curve vs plane | 稳健性 / Robustness | 2D 读法 / Flat reading |
| --- | --- | --- | --- | --- | --- |
| 1 · OW 占比面 / OW-share planes | OW's share of the two programs fell from about half in 2003 to 38% before the pandemic and 32% at the 2021 low, then rose to 44% by 2025, the highest since 2014. | 案件数：OW = k/(1−k)·ODSP；指数：OW 指数 = r·ODSP 指数，r = k/(1−k)·ODSP₀/OW₀。填充的是 k = 38.3%（2019 Q4 构成）那一面，它恰好就是等增长平面（OW 指数 = ODSP 指数），93 个季度符号完全一致；35/40/45/50% 只在后墙画射线 | 38.3% 面：2020 Q2 向下，2023 Q1 向上；占比 49.8%（2003 Q1）→ 38.3%（2019 Q4）→ 32.4%（2021 Q3 最低）→ 43.9%（2025 Q2，2014 Q2 以来最高）→ 43.5%（2026 Q1）；40%：2018 Q3 ↓、2023 Q4 ↑；35%：2020 Q4 ↓、2022 Q1 ↑ | **不依赖基期**；4 季度平滑后穿越季度约移动一个季度 | Path 视图里是标了 % 的射线；D v3 的 OW − ODSP 视图里 38.3% 面就是 0 线；读数面板 "OW share of the two" |
| 2 · 时间切面 / Time slice | Between the pandemic band's edges, OW fell by a quarter and climbed back while ODSP barely moved. | 时间 = 滑块所在季度；底面灰带 = 疫情季度（2020 Q1 – 2023 Q1） | 切面与曲线只交于当前季度；例：2021 Q3 OW 178,872、ODSP 372,545、占比 32.4%、合计 551,417；疫情期 OW 从 2020 Q1 跌 27.0% 到最低，2023 Q1 为 232,089；ODSP 一直在 2020 Q1 水平的 3.4% 以内 | 不涉及估计 | 时间视图里切面是竖直虚线（= 滑块位置），灰带同全站疫情带；数值在读数面板 |
| 3 · 合计不变面 / Constant-total plane | Combined, OW and ODSP stayed below their 2019 Q4 caseload from 2020 Q3 to 2023 Q3 and recovered in 2023 Q4, two quarters after OW alone. | 案件数：OW + ODSP = 614,516（2019 Q4 合计）；指数：0.383·OW 指数 + 0.617·ODSP 指数 = 100 | 2020 Q3 落到面下，最低 89.7（2021 Q3），2023 Q4 回到面上（OW 单独 2023 Q2）；2026 Q1 为 671,696 件（109.3） | 以 2019 年平均为参照：同样 2023 Q4；以 2020 Q1 为参照：2024 Q1 | 新增正视图 "OW + ODSP over time"（yaw 90°、pitch 58.1°）：在这个角度合计面侧对观者，曲线高度就是合计（案件数或指数，两种模式都成立）；Path 视图里是等合计线 |
| 4 · 回到 2019 Q4 水平面 / Back-to-2019 Q4 planes | OW returned to its 2019 Q4 caseload in 2023 Q2; ODSP has stayed within about 3% of its 2019 Q4 level since 2020. | OW 指数 = 100（水平面，OW 蓝）；ODSP 指数 = 100（竖直面，ODSP 橙）；可只显示其中一个 | OW：2020 Q2 ↓、2023 Q2 ↑；ODSP：2020 Q4 ↓、2026 Q1 ↑，2020 Q1 以来指数在 97.1–100.6 之间 | OW 回到 2019 年平均水平：2023 Q3；回到 2020 Q1 水平：2023 Q4 | Path 视图里是十字参考线；OW / ODSP 时间视图里各自是 "2019 Q4 level" 线 |

**可能的误读和应对 / Misreadings and safeguards**
- 版本 1：占比是"两个项目合计中的 OW 占比"，不是领取率或人口比例（定义卡写明）；射线在框外交于原点、不是平行线，所以每条都标 %；把原来的"等增长平面"标成"38.3%"，避免把基期之前的差距（例如 2010 Q1 指数差 36.0）误读成真实差距——同一季度的占比是 48.4%，比 38.3% 高 10.0 个百分点，不依赖基期。/ Share ≠ take-up; rays are labelled; the base-effect gap is replaced by a base-free share.
- 版本 2：切面只代表一个季度；疫情改画在底面灰带，不画两面整墙（在 Path 视图中整墙会正对观者、把整张图染灰）。/ The slice is one quarter; the pandemic is a floor band, not walls.
- 版本 3：合计是两个项目的案件数相加，不是人数（定义卡写明）；指数形式的权重来自 2019 Q4。/ The total adds cases, not people; the index weights come from 2019 Q4.
- 版本 4："回到疫情前"依赖选定 2019 Q4；两个面同时显示最拥挤，所以提供"只看一个面"。/ Depends on the chosen quarter; one plane at a time is offered.

**课程依据 / Course basis**：L3 effectiveness（判断"在哪一侧"是二元判断，容易；精确值在 2D 中读）· L4-1 参照结构和地标、enclosure（疫情带）、similarity（同一种疫情灰、OW 蓝、ODSP 橙）· L5 filtering（开关面）、navigation（切面跟随滑块）、change of view（版本 3 的新正视图）· L6 annotation（穿越点圆圈和文字）· L7 时空立方体操作（Bach et al., 2014）：版本 2 是 time cutting，版本 1、3、4 的面在正视图中侧对、变成参考线，是 flattening 的应用。这些面都由一个有含义的指标定义，曲线与面的关系就是结论本身，所以不是装饰。

**对评分的影响 / Grading impact**（相对 D v3）

| 要求 | 1 占比面 | 2 时间切面 | 3 合计面 | 4 2019 Q4 水平面 |
| --- | --- | --- | --- | --- |
| R7 编码合理 | 加分：不依赖基期的指标，修正了等增长平面的基期误读 | 加分：给 3D 提供深度参照 | 加分：一个面加一个精确的侧对视图 | 持平：和正视图参考线重复 |
| R8 分析能力 | 加分：新指标（OW 占比） | 持平：没有新指标 | 加分：新指标（合计） | 小幅加分 |
| R9 清楚可导航 | 持平：一个开关 | 加分：3D 中更容易定位当前季度 | 小幅减分：多一个视图按钮 | 小幅减分：两个面最拥挤（可只看一个） |
| R10 创意 | 加分 | 小幅加分 | 加分 | 持平 |
| R12 理由深入 | 加分（方程、等价关系、误读说明） | 加分 | 加分 | 持平 |

**开发与测试 / Build and verification**（与 Q1 其他候选相同的方法）
- 数字：四个页面的参照面段落、定义卡、结论卡片和读数面板逐项与 pandas 重算结果核对，全部一致（穿越季度、占比、合计、水平、范围）。/ Every number checked against pandas.
- 全部允许角度：yaw −20°–110°（每 10°）× pitch −50°–85°（15 个值），1360 px 和 400 px，每个状态 420 个角度。最终代码在 3 个状态下 0 处文字重叠或出界；修改标签逻辑之前的一版在 10 个状态（4,200 个角度）下也为 0。/ Angle sweeps clean.
- 版面：每个版本 10–12 个状态（各个正视图、3D、关掉面、指数模式、滑块在 2021 Q3、版本 3 的新视图、版本 4 的单面）× 1360 / 820 / 400 px，共 132 次检查，无横向滚动、无文字重叠或裁切；无控制台错误。/ 132 layout checks clean.
- 交互：开关会清除和恢复面与圆圈；版本 4 的四个选项各显示 2 / 1 / 1 / 0 个面；切面随滑块和 Play 移动；版本 3 的导览依次经过 3D、OW、ODSP、OW − ODSP、OW + ODSP、Path 并停在 Path；从 3D 动画转到 "OW + ODSP over time" 停在 pitch 58.15°（atan(0.617/0.383)）；鼠标悬停穿越点时提示出现 "Crosses the 38.3% share plane here (now below)"；手机上点按穿越点会把滑块移到该季度，读数面板显示（例：2020 Q3，合计指数 96.5）。键盘：Tab 可到达全部控件（23–25 个），每组分段按钮（含参照面开关）Enter 可用。/ Interactions, tour, keyboard and touch tested.
- 修复了两个从 D v3 继承的标签问题（只在新版本中修复，D v3 未改）：①手机宽度、滑块拖到 2021 Q3 时，个别角度当前季度标签压住刻度或轴标题；②手机宽度的 OW / ODSP 时间视图中 "Pandemic" 与 "2026 Q1" 标签重叠。D v3 仍有这两个问题（已用同样的检查复现），是否回补列为待决定问题。/ Two label issues inherited from D v3 are fixed in the new versions only.
- 截图：`screenshots/dplane-{share,slice,total,level}-{desktop,mobile}-{light,dark}.png`、`-state.png`（版本 1、4：3D；版本 2：3D、滑块 2021 Q3；版本 3："OW + ODSP over time"）、`-thumb.png`。

**满分要求和课程原则对照（简表）/ Requirements and checkpoints (short)**：R1、R2、R4–R6、R11、R13–R15 与 D v3 相同（满足）；R3 未部署；R16–R20 同其他候选。L1/L2：新增派生量 OW 占比、合计（版本 1、3）；L3、L4-1、L5、L6、L7 见上。常见错误：没有双纵轴（版本 3 的新视图是单一纵轴）、没有彩虹色、没有饼图；3D 仍是可选视图、默认 2D、不在 3D 中读数，参照面有明确方程和含义。

**受众检查（MCCSS 政策分析员）/ Audience check**
- 版本 1：能判断两个项目的构成何时、向哪个方向变化（OW 占比 2021 Q3 最低 32.4%，2025 Q2 回到 2014 年以来最高）；能读出穿越 35%、38.3%、40% 的季度写进简报；不能把占比当作领取率，也不能据此判断原因。
- 版本 2：能在 3D 中看清当前季度在时间上的位置和疫情季度的范围；能拖动切面逐季读截面数值；不能从切面得到新指标，数值仍在面板中读。
- 版本 3：能判断两个项目合计何时回到 2019 Q4 水平（2023 Q4，比 OW 晚两个季度）；能用侧对视图直接读合计；不能把合计当作人数。
- 版本 4：能回答"各自回到疫情前水平了吗"（OW 2023 Q2 回来，ODSP 一直贴着 2019 Q4 水平）；能只看一个面；不能把"回到 2019 Q4"当作唯一基准（换基准会差 1–2 个季度）。

**图表类型与多样性 / Chart types**：参照面是现有时空立方体里的参照结构，不是新的图表类型；版本 3 新增的 "OW + ODSP over time" 是单折线时间图，与 D 自己的 "OW over time" 和 Q3 图 1b 的单折线是同一类型（由同一个投影得到，所以没有另做一种图）。

### 7.4 插入面版本：D + insight 5–9（2026-11-16）/ Insight-surface versions: D + insight 5–9

**为什么做 / Why.** 版本 1–4 的面都由 OW、ODSP 自己定义，回答"是什么"。组员建议把受众看作决策机构、把 Q1 讲成"重大公共事件中的政府应对"；用户提出用公开的政策目标画一个"目标案件数面"。核查结果：安省**没有公布** OW、ODSP 的案件数目标；减贫战略 2020–2025 的目标（2024 年每年 60,000 名受助人进入就业）是离开援助的流量，课程数据测不到。但安省财政问责办公室（FAO）每年公布案件数预测，并测算预算拨款能资助多少案件，所以版本 5 用这些公开数字。版本 6–9 是另外四种"决策视角"的叠加层。五个页面共用 `shared/d-insight.js`（从 `d-planes.js` 复制，参照面换成叠加层，由 `<body data-insight="…">` 选择）；D v3 和版本 1–4 没有改动。
Planes 1–4 describe the series; versions 5–9 add decision-oriented overlays. Ontario publishes no caseload target, but the FAO publishes projections and the caseload the budget funds (version 5). D v3 and versions 1–4 are unchanged.

**共同做法 / Shared rules**
- 每个叠加层都是立方体世界坐标（指数单位，X = ODSP、Y = OW、Z = 时间）里的点集，所以三个正视图会**自动**给出它的 2D 读法：例如版本 7 的帘幕在 "OW over time" 里就是 OW 与轨道之间的面积，在 "OW + ODSP over time" 里就是合计与合计轨道之间的差。/ Every overlay is a point set in world coordinates, so the flat views read it in 2D automatically.
- 立方体盒子包住曲线和叠加层的全部点，切换开关不会改变盒子大小；超出数据的时间（版本 5 到 2029 年、版本 8 到 2028 年）用虚线框标出 "After the data"。版本 5、6 的立方体从 2015 Q1 开始（它们的内容集中在 2018–2029 年），页面标题注明，完整路径仍在 D v3 和图 1b。/ The box holds every overlay point; time past the data is outlined; versions 5 and 6 start at 2015 Q1, as the title says.
- 3D 中叠加层画在曲线**下层**；时间窗和闸门画在远处的地面和后墙上（像曲线的阴影），不画横穿盒子的整面平面——第一版这样画时，6 个闸门在 2018–2023 年叠成一堵灰墙，已改。/ Overlays sit under the path; time windows and gates lie on the far floor and wall (an early version with full planes formed a grey wall and was replaced).
- 每个版本有：叠加层开关（L5 filtering）、定义卡、读数面板的专用行、图下的文字读法、**图 1d**（2D 表或图，给出精确数字）、结论卡片中的一句计算出的故事和一条 "do not show"。/ Each version has a toggle, a definition card, readout rows, a written reading, Figure 1d (exact numbers), and computed card lines.
- 外部数据（版本 5、6）放在 `design/q1/data/`，每行都有来源，见 [data/README.md](data/README.md)；页面在浏览器里读取并计算所有派生数字。/ External data live in `design/q1/data/` with sources.

| 版本 / Version | 叠加层的定义 / Definition | 与曲线的关系（pandas 复核）/ Relation to the path | 稳健性 / Robustness | 2D 读法 / Flat reading |
| --- | --- | --- | --- | --- |
| 5 · Plans vs path | FAO 2024 年 6 月、2025 年 10 月的预测；2026 年预算的"资助案件容量"（FAO 测算）和 FAO 2026 年估计（容量 + FAO 估计的缺口）。按财年中点放进立方体；两条 2026 年线之间的直纹面 = 资助缺口 | 2024 年预测 OW 误差 −0.2% / +0.7% / +1.0%（2023-24 至 2025-26），ODSP +0.0% / +1.4% / +3.1%；2025 年预测 2025-26 OW +7.6%、ODSP +2.5%；2026-27 资助 OW 246,430 件 = 2025-26 平均 291,605 的 −15.5%，比 FAO 估计少 56,534 件（OW 疫情跌幅 65,998 件的 86%）；OW 同比 ≤ −15.5% 只出现在 2021 Q1–Q3 | 误差以 FAO 自己的财年实际为准（同一来源）；本页四个季末月份的财年平均与 FAO 的 12 个月平均相差 ≤ 1%（2020-21 OW −2.8%、2022-23 和 2023-24 OW +1.2% 除外） | OW / ODSP 时间视图中是普通的"预测 vs 实际"图；图 1d 按财年列出全部数字 |
| 6 · Support window and rule changes | 联邦收入支持窗口：CERB（2020-03-15 – 09-26）、CRB（2020-09-27 – 2021-10-23）；6 个省级 OW / ODSP 规则变化（编号闸门）。每个变化与"变化前最后一个季末"比较前后四个季度 | OW 从 2019 Q4 的 235,501 降到窗口内最低 178,872（2021 Q3，CRB 结束前最后一个季末），同期 ODSP −1.7%；2021 Q4 OW +8.4%，是 2003 年以来第二大的季度增幅（仅次于 2009 Q1 +9.4%）；CRB 结束后四个季度 OW +21.2%（之前四个季度 −16.0%）；2022–2023 年三次 ODSP 变化之后，ODSP 四个季度内变化 ≤ 0.3% | 不涉及估计；季度数据只能对齐到季末，日期精度在 CSV 中注明（两条只确认到月份） | 时间视图中是斜线带和竖直虚线；图 1d 列出每个变化的前后变化和来源，点按钮把滑块移到该季度（L5 navigation） |
| 7 · Pre-pandemic track | 2015 Q1 – 2019 Q4 对数线性趋势（ODSP +3.1%/年、OW −1.2%/年）延伸到 2026 Q1；轨道与曲线同季度点之间的直纹面 = 帘幕；新增正视图 "OW + ODSP over time"（yaw 90°、pitch 58.1°） | 2026 Q1：ODSP 比轨道低 82,406 件（−17.8%），OW 高 68,199 件（+30.5%），合计只差 −14,207 件；OW 2021 Q3 最低（−24.2%），2023 Q1 回到轨道上方 | 拟合窗口 2010–2019、2017–2019：ODSP 低 15.3–21.3%，OW 高 24.8–45.2%——方向不变，大小随窗口变化（图 1d 并列三种窗口） | OW、ODSP 时间视图中帘幕就是缺口面积；合计视图中帘幕几乎消失（"合计掩盖了相反的偏离"）；图 1b 加了两条虚线轨道 |
| 8 · Two-year-rule rays | 从每个季度出发，把过去 8 个季度的增长率再延续 8 个季度，得到一条射线；灰色射线从每个 Q4 出发，黑色射线从滑块季度出发，虚线连到 8 个季度后的实际值 | 77 个起点（2005 Q1 – 2024 Q1）：OW 平均误差 12.8%（2018 年以前的起点 9.8%），ODSP 2.4%；最大 OW −44.3%（从 2021 Q3 预测 2023 Q3），最大 ODSP +7.6%（从 2020 Q1）；从 2019 Q4 出发 OW +15.7%、ODSP +6.8% | 规则是本页构造的简单基准，不是任何机构的方法；射线离开盒子处用小圆圈标出，数值在读数面板 | 图 1d 是按起点季度画的误差折线（OW、ODSP 两条，0 线、疫情带）；图 1b 显示当前射线 |
| 9 · 2008 recession ghost | 2008 Q3 – 2014 Q4 两个项目的相对变化，从 2019 Q4 重新起步（锚点 = C.D. Howe 商业周期委员会所定 2008 年 10 月、2020 年 2 月两个峰值之前的最后一个季末） | +6 季度：2008 年后 OW +28.3%，2019 年后 −20.8%；+25 季度：OW 120.6 vs 124.0（相近），ODSP 134.4 vs 100.2；原 2008–2014 段用粗灰线标出 | 一次历史经验只是对照；FAO 2024 年报告本身用"2008-09 衰退后的经验"类比 OW 的走势 | Path 视图最直观（影子向右、实际垂直）；图 1d 列出同一季度数的成对指数 |

**可能的误读和应对 / Misreadings and safeguards**
- 版本 5："funded case capacity" 被读成政府目标——定义卡、结论卡和数据说明都写明是 FAO 的测算；FAO 的财年平均和本页季末快照口径不同——误差只和 FAO 自己的实际比较，并写出两种平均的差。/ Capacity is not a target; misses use the FAO's own actuals.
- 版本 6：日期对齐被读成因果——定义卡、图下文字、图 1d 注释和 "do not show" 卡片都写明 "dates line up; they do not show cause"；联邦窗口用斜线纹理而不是颜色，避免和疫情灰带、OW 蓝、ODSP 橙冲突。/ Alignment is not cause; hatching, not a new colour.
- 版本 7：轨道被读成"没有疫情会怎样"——写明是描述性参照、不是反事实，并给出三种拟合窗口。/ A track is not a counterfactual.
- 版本 8：规则被读成官方预测方法——写明是本页的简单基准；版本 5 才是官方预测。/ The rule is our benchmark.
- 版本 9：影子被读成预测——写明是一次历史经验的对照，锚点的选择有来源。/ The ghost is a comparison.

**课程依据 / Course basis**：L2 派生数据（轨道、缺口、规则误差、影子）· L3 判断"在哪一侧、离多远"在 3D 中只做定性，精确值在正视图和图 1d · L4-1 参照结构与地标（预测线、轨道、影子）、enclosure（联邦窗口）· L5 filtering（开关）、navigation（图 1d 按钮、滑块选射线起点）、change of view（版本 7 的合计视图）· L6 annotation（直接标签、来源）· L7 时空立方体：版本 6 是 time cutting 的应用（时间窗和闸门），版本 5、8、9 的轨迹与曲线共享时间轴，正视图是 flattening（Bach et al., 2014）。叠加层都有明确定义，曲线与它的关系就是结论本身，不是装饰。

**对评分的影响 / Grading impact**（相对 D v3）

| 要求 | 5 Plans | 6 Gates | 7 Track | 8 Rays | 9 Ghost |
| --- | --- | --- | --- | --- | --- |
| R5 课程数据为主 | 持平（外部数字只作参照，有来源）| 持平（同左）| 加分（只用课程数据）| 加分 | 加分 |
| R7 编码合理 | 加分：预测与实际同一坐标 | 加分：纹理 + 位置，不加新颜色 | 加分：缺口 = 长度 / 面积 | 持平 | 加分 |
| R8 分析能力 | 加分（新数字：误差、缺口）| 加分（前后变化）| 加分（相反缺口、合计）| 加分（误差）| 加分 |
| R9 清楚可导航 | 小幅减分（线多，3D 稍挤）| 持平 | 持平 | 小幅减分（要先理解规则）| 持平 |
| R10 创意 | 加分 | 加分 | 加分 | 加分 | 加分 |
| R12 理由深入 | 加分 | 加分 | 加分 | 加分 | 加分 |
| R15 与受众对齐 | 加分（预算与规划）| 加分（决策与事件）| 加分 | 持平 | 加分 |

**开发与测试 / Build and verification**（2026-11-16，与 §7.3 相同的方法）
- 数字：`tools/verify_q1_insight.py` 用 pandas 从课程 CSV 和 `design/q1/data/` 独立重算 64 项（误差、缺口、轨道、规则误差、影子、前后变化、图 1d 表格），按页面的格式比对页面导出文字：**64 / 64 一致**。外部数字的抄录用 2026 年报告的增长率复算检查（见 [data/README.md](data/README.md)）。/ 64 of 64 numbers match pandas.
- 版面：5 个页面 × 48–57 个状态（每个视图、每个开关选项、深色、指数模式、滑块 2021 Q3 / 2019 Q4、步骤 2）× 1360 / 820 / 400 px，共 261 个状态 0 处横向滚动、文字重叠或裁切；第一轮在版本 5、6（立方体从 2015 Q1 开始）的 400 px 正视图里发现 17 处标签重叠（参考线标签与数据标签、"Pandemic" 与 "OW relatively higher"），已改为数据标签优先、参考标签让位后复测为 0。/ 261 states clean after fixing 17 phone-width overlaps.
- 3D：每个页面两组全角度扫描（yaw −20°–110°、pitch −50°–85°，1360 和 400 px，浅色默认 + 深色指数模式滑块 2021 Q3），共 4,200 个角度 0 处问题。/ 4,200 angles clean.
- 交互：图 1d 的 8 个按钮都把滑块移到对应季度并保留焦点；开关切到 None 时清除全部叠加元素并注明；版本 7 从 3D 动画到 "OW + ODSP over time" 停在 pitch 58.15°，与直接打开逐点相差 0 px；版本 8 拖动滑块时射线、读数和图 1d 竖线同步；版本 5 只画 2015 Q1 以后的 45 个点，滑块下限为 2015 Q1；悬停提示出现各版本的专用行。键盘：Tab 可到达全部控件（24–41 个），四组分段按钮 Enter 可用。截图 `screenshots/dins-*`（浅色、深色、手机、交互状态、缩略图）0 处问题，无控制台错误。/ Interactions, keyboard and screenshots checked.
- 没有做的：真人读者测试（与 D 的其他版本一样，列为待决定事项）。/ Not done: a reader test.

**考虑过但没有做 / Considered, not built**：失业率推算的 OW 面（违反"失业率只作背景"；疫情前只有 12 个季度；但关系断开这一点——疫情前 r = 0.82、2022 年后 r = 0.97、全期 r = −0.01——可作为值得调查的问题）；累计偏离面积（OW 低于 2019 Q4 水平的累计 −334,634 案件·季度、之后 +473,443，和版本 4、7 重复，面积是较弱的通道）；每千名劳动力案件数（劳动力数据只从 2017 年开始，没有人口数据）；减贫战略就业目标和 2021 年 Recovery & Renewal（见 [data/README.md](data/README.md)）。

**顺带发现 / Side finding**：数据字典（`characteristics_data_dictionary_en.xlsx`，OW 页）写明全省 OW 案件数 "Includes estimates for First Nations cases"。这很可能就是 §1 中"全省 OW `cases` 带小数、原因未核实"的原因（估计值不是整数），建议小组确认后更新页面上的 "shown as published" 说明。/ The dictionary says province-wide OW cases include estimates for First Nations cases, which likely explains the decimals.

## 8. 版本比较 / Comparison

| 维度 / Criterion | A · 时间线 | B · 变化 | C · 长时段 | D · 路径 |
| --- | --- | --- | --- | --- |
| 清楚程度（第一次看）/ Clarity | 高：最熟悉的形式 | 中：需要理解同比定义 | 中高：两个序列要解释 | 低中：依赖阅读说明 |
| 分析深度 / Analytical depth | 中：水平、指数、阶段表 | 高：方向、速度、同向季度、年均变化 | 中高：历史尺度 + 详图 | 中：只看相对运动 |
| 创意（R10）/ Creativity | 低 | 中 | 中 | 高 |
| 剩余开发量 / Remaining effort | 低 | 中 | 中（要处理口径说明）| 高（读者测试、可访问性；3D 已实现但需要读者测试）|
| 与 Q2/Q3 一致 / Consistency | 高：与 Q3 第 1 步同一套模式 | 中：主指标不同 | 高：刷选 + 详图同 Q3 第 2 步 | 中：独特形式 |
| 已定决定 / Settled decisions | 全部保留 | 改变"默认案件数" | 全部保留 | 保留（失业率对齐同步时间线）|
| 最大风险 / Main risk | 被评为"缺乏创意" | 读者忽略规模 | 历史序列被误读为同口径 | 读者弄错顺序或方向；3D 被当成读数视图 |

## 9. 推荐（最终由小组决定）/ Recommendation (the group decides)

**以 A 为底，加入 B 的图 2（分阶段年均变化）。** A 最清楚、保留全部已定决定、与 Q3 一致；B 的分阶段图补上 A 缺少的一点——在长度相差很大的阶段之间公平地比较变化速度。两者合并后，创意分仍不算高，所以可选地：
- 如果小组同意使用历史文件并接受口径说明，把 C 的概览缩成 A 上方的一条背景带（"放在长时段里看"）；
- D 作为"换一种方式看"的附加视图，而不是主图，除非组内快速测试显示读者能正确读出顺序和方向。D 的 3D 视图只作为可选的过渡视图和导览保留，不作默认，也不用来读数。

**Use A as the base and add B's Figure 2 (average annual change per period).** Optionally add C's overview as a compact context strip if the historical file is approved, and keep D as an extra view rather than the main one unless a quick reader test shows it is read correctly.

## 10. 自检 / Self-check

### 10.1 满分要求对照 / Grading requirements

"满足 / 部分 / 未"= Met / Partly / Not met。证据指具体视图或文字。

| 要求 / Requirement | A | B | C | D |
| --- | --- | --- | --- | --- |
| R1 可视化为核心 | 满足：图 1a/1b/2 | 满足 | 满足 | 满足 |
| R2 交互支持探索 | 满足：步骤、切换、范围、高亮、悬停、表格联动 | 满足：另有年均/总变化切换、阶段点击 | 满足：刷选 + 按钮 + 联动竖线 | 满足：滑块、播放、散点↔时间线联动；v2 另有四个视图、旋转、导览 |
| R3 在线发布 | 未：未部署 | 未 | 未 | 未 |
| R4 自包含 | 满足：定义卡、副标题、图注 | 满足：另有变化定义 | 满足：口径说明在图下 | 部分：依赖阅读说明，未做读者测试 |
| R5 课程数据为主 | 满足 | 满足 | 满足（历史序列也是课程数据） | 满足 |
| R6 单一受众 | 满足 | 满足 | 满足 | 满足 |
| **R7 编码合理** | 满足：共同尺度位置、色相 = 类别、无双纵轴 | 满足：共轴小倍数、形状+颜色 | 满足：不同序列分图、中性色 | 满足：等比例坐标、阶段有序色阶；3D 只作过渡，读数在正视图（与 v1 持平，另多两张有效的时间图） |
| **R8 分析能力** | 部分：水平与阶段，变化速度只能读斜率 | 满足：方向、速度、同向、年均 | 满足：历史尺度 + 详图 | 部分：只有相对运动 |
| **R9 清楚可导航** | 满足 | 满足 | 满足 | 部分：形式陌生；3D 增加控件，但默认 2D 不变、有导览（与 v1 持平） |
| **R10 创意** | 未/部分：常规双折线 | 部分：同向条带、年均点图 | 部分：focus + context 常见但有口径处理 | 满足：连接散点图 + 引导阅读 + 可解释的时空立方体（变好） |
| R11 文字清楚 | 满足 | 满足 | 满足 | 满足 |
| **R12 理由深入** | 满足：§4 | 满足：§5 | 满足：§6 | 满足：§7、§7.1 |
| **R13 交互理由** | 满足：Card 流程逐项 | 满足 | 满足 | 满足 |
| **R14 课堂词汇** | 满足 | 满足 | 满足 | 满足 |
| R15 与主题和受众对齐 | 满足 | 满足 | 满足 | 满足 |
| R16 开发计划 | 部分：技术已定，分工未写 | 同左 | 同左 | 同左 |
| R17 报告格式 | 未开始（需先选版本） | 同左 | 同左 | 同左 |
| R18 贡献报告 | 不在本任务范围 | 同左 | 同左 | 同左 |
| R19 拼写语法 | 需最终校对 | 同左 | 同左 | 同左 |
| R20 截止 | 进行中（Mock 11/19） | 同左 | 同左 | 同左 |

### 10.2 课程原则检查点 / Lecture checkpoints

| 检查点 / Checkpoint | A | B | C | D |
| --- | --- | --- | --- | --- |
| L1/L2 数据抽象 | 满足（§2） | 满足 | 满足（另有历史序列口径） | 满足 |
| L2 任务抽象 | 满足（§2 表） | 满足 | 满足 | 满足 |
| L2 派生数据 | 满足：指数、阶段变化 | 满足：同比、年均、同向 | 满足：指数、差额、下降幅度 | 满足：指数、方向规则 |
| L3 共同尺度位置 | 满足 | 满足（共轴） | 满足 | 满足（两轴等比例） |
| L3 量级差异不用双纵轴 | 满足：指数切换 | 满足：小倍数 + 变化率 | 满足：分图 | 满足：指数等比例 |
| L3 expressiveness | 满足：色相 = 项目 | 满足：另加形状 | 满足：中性色 = 不同序列 | 满足：阶段用亮度 |
| L3 discriminability | 满足：2 色 | 满足 | 满足 | 部分：93 点，下降与回升两段重叠（3D 中部分角度也重叠） |
| L3 No unjustified 3D | 不适用 | 不适用 | 不适用 | 基本满足：3D 只连接三个正视投影、正交、不读数；代价表见 §7.1 |
| L3 popout | 满足：图例高亮 | 满足：阶段框 | 满足：刷选框 | 满足：当前点黑描边 |
| L4-1 对齐、接近 | 满足 | 满足 | 满足 | 满足（时间线对齐失业率） |
| L4-1 similarity | 满足 | 满足 | 满足 | 满足 |
| L4-1 enclosure | 满足：阶段框、疫情带 | 满足 | 满足 | 满足 |
| L4-2 分类色经工具验证 | 满足（§3） | 满足 | 满足 | 满足（另验证有序色阶） |
| L4-2 正负用发散色阶 | 不适用 | 不适用（正负用位置） | 不适用 | 不适用 |
| L4-2 无彩虹 | 满足 | 满足 | 满足 | 满足 |
| L5 change mapping | 满足：数量/指数 | 满足：同比/相对基准、年均/总 | 满足 | 满足（只改刻度；视角切换改变 visual mapping） |
| L5 navigation / filtering | 满足：范围按钮 | 满足 | 满足：刷选 + 按钮 | 满足：滑块、旋转、预设视角 |
| L5 selection + details on demand | 满足 | 满足 | 满足 | 满足：读数面板 |
| L5 linked views | 满足：1a↔1b 十字线 | 满足：贯穿全部面板 | 满足：详图↔概览 | 满足：散点/3D/时间视图↔时间线 |
| L6 叙事结构 | 满足：martini glass | 满足 | 满足：先远后近 | 满足：步骤 + 播放 + 视图导览 |
| L6 annotated chart | 满足 | 满足 | 满足 | 满足 |
| L6 contrast | 满足：三阶段 | 满足：年均对比 | 满足：历史 vs 疫情 | 满足：方向对比 |
| L6 开头/中间/结尾 | 满足 | 满足 | 满足 | 满足 |
| L7 不用地图的理由 | 满足（§3） | 满足 | 满足 | 满足 |
| L7 space-time cube | 不适用 | 不适用 | 不适用 | 满足：3D 是时空立方体，三个预设是 flattening 投影 |

### 10.3 数字复核 / Number recomputation
方法：每个候选在浏览器里计算的全部事实（`window.__facts`）导出为 JSON，用 pandas 从原始 CSV 独立重算，逐字段比较（相对误差 1e-9）。再从每个页面的全部可见文字和 SVG 文字中提取数字，与 pandas 结果按页面的格式（千分位、一位小数、带符号百分比）比对。
Method: export every fact each page computes, recompute independently in pandas and compare field by field; then extract every number from the visible text and SVG labels and match it against pandas values formatted the way the page formats them.

| 候选 / Variant | 事实字段不一致 / Fact mismatches | 文字中的数字 / Numbers in text | 未解释 / Unexplained |
| --- | --- | --- | --- |
| A | 0 | 115 | 0（235,501 是 235,500.5 在 JS 中四舍五入，Python 银行家舍入为 235,500） |
| B | 0 | 105 | 0（16.75 = 疫情前阶段年数 67 ÷ 4） |
| C | 0 | 117 | 0（"1998,"、"2026,"、"692,871," 只是正则多抓了逗号） |
| D | 0 | 105 | 0（v2：读数面板、注释和三种视图的标签） |

坐标刻度、年份、"2019 Q4 = 100"、45° 不计入。页面上的覆盖范围标签（如 "Jan 2017 – Dec 2025"、"2003 Q1 – 2026 Q1"）是静态文字，与 Q3 相同做法，已核对与数据一致。

### 10.4 常见错误检查 / Anti-pattern check
双纵轴：四个都没有（A/C 指数切换，B 小倍数，D 等比例散点）。彩虹色阶、饼图：无。3D：只有 D v2 的**可选**视图，按 §7.1 的理由使用（正交、默认 2D、不读数、无透视、无 3D 柱或曲面、无光照阴影）。截断的柱状图坐标轴：不用柱状图；A/C 的数量模式从 0 开始，指数模式以 100 为参考并在标题中写明。只靠颜色区分：每个候选都有图例 + 直接标签，B 另加形状。每个点都标数字：无（selective labels）。因果或价值判断措辞：已搜索 caus / because / due to / improve / worsen / recover 等，只出现在"The data do not show"卡片的否定句和 A 的"Context, not cause"标题中。历史序列与 OW/ODSP 混成一条线：无（只在 C 中单独成图）。

### 10.5 渲染检查 / Rendering check
用 Chrome DevTools Protocol 驱动无头 Edge（精确 1360 px 和 400 px 视口、真实鼠标和键盘事件）：
- 截图：每个候选桌面浅色/深色、手机浅色/深色、一个交互状态，外加总览页（见 `screenshots/`）。
- 页面横向滚动：四个候选和总览在 1360 / 820 / 400 px 均为 0（A、D 的表格在自己的容器内滚动）。
- SVG 文字重叠：所有页面、三种宽度均为 0（修复过：A 失业率"0%"与年份、B 窄屏标签、C 的 1998 标签、D 坐标角和当前标签）。
- 控制台：无错误。
- 键盘：Tab 可到达每个可聚焦控件（A 16、B 16、C 11、D 13 个，另加"Read this first"折叠）；每组分段按钮用 Enter 切换成功；D 的滑块用方向键移动到 2021 Q1，路径和读数面板同步；表格行（A、D）和 B 图 2 的行都可 Tab 到达并用 Enter 选择，重绘后焦点留在同一行。
- 交互：真实鼠标悬停四个候选主图时提示出现、失业率条带的十字线同步；C 拖动刷选得到 2015 Q4 – 2022 Q3（28 个季度），详图更新。
- **D v2 的 3D**：
  - 投影一致性：三个正视预设在数量和指数两种模式下，93 个点与坐标轴刻度推出的位置相差 ≤ 0.5 px（d3 坐标轴的半像素偏移），刻度拟合残差 0；Path 预设与存档的 v1 2D 图刻度标签、坐标范围完全相同（数量：ODSP 189,507.5–416,916.5、OW 164,850–306,151；指数：50–110、70–130）；从 3D 经动画转到 "OW over time" 与直接打开的结果完全一致（标签相同，点位移 0 px）。时间视图与图 1b 共用 2003-03 至 2026-03 的时间轴和年份刻度；纵轴不同是有意的（图 1b 同时显示两个项目，范围 50–130）。截图：`screenshots/d3d-{3d,path,ow,odsp}-{light,dark}.png`、`d3d-3d-mobile-{light,dark}.png`。
  - 交互：拖动 60 px → yaw +24°、pitch −9°，滑块不变；极端拖动停在 110° / 85°；Home 复位到 38° / 24°；方向键每次 5°；3D 中 Play 推进当前点；悬停显示提示并联动图 1b 竖线；切换视图时动画中间帧为斜视、最后一帧为正视 2D；导览依次经过 3D、OW、ODSP、Path 并停在 Path；`prefers-reduced-motion` 时直接切换；手机触摸拖动旋转。
  - 全部允许角度扫描：yaw −20°–110°、pitch −15°–85°（每 10°），1360 px 和 400 px 共 308 个角度，文字重叠、文字出界、横向滚动均为 0（修复过：起点标签压住刻度、手机上轴标题出界、斜视时刻度互相挤压）。
  - 键盘：D 共 19 个可聚焦控件全部可 Tab 到达，视图按钮可用 Enter 切换；存档版 D v1 独立打开无错误。
- **D v3 的 OW − ODSP 视图**（2026-11-14）：
  - 投影一致性：数量和指数两种模式、1360 px 和 400 px 下，93 个点与坐标轴刻度推出的位置相差 ≤ 0.5 px，刻度拟合残差 0；从 3D 经动画到达与直接打开完全一致（点位移 0 px，相机停在 90° / −45°）。
  - 读数面板的差值与 pandas 一致（抽查 2003 Q1 +31.1、2010 Q1 +36.0、2021 Q3 −22.3、2023 Q1 +1.4、2026 Q1 +23.8）；原有数字复核 0 处不一致。
  - 新放开的角度 pitch −50°–−20°（每 10°）× yaw −20°–110°，两种宽度共 112 个角度，文字重叠、出界、横向滚动均为 0；差值视图 6 个状态 × 1360 / 820 / 400 px 无问题；五个视图浅色、深色均无文字重叠（修复过：0 线说明压住 "2019 Q4" 标签）。
  - 交互：导览依次经过 3D、OW、ODSP、OW − ODSP、Path 并停在 Path；拖动、Home、方向键、Play、悬停联动、减少动画、手机触摸旋转与 v2 相同；Tab 可到达 20 个控件，视图按钮可用 Enter 切换；无控制台错误。截图：`screenshots/d3d-diff-{light,dark}.png`。存档版 D v2 独立打开无错误。

### 10.6 受众检查 / Audience check（MCCSS 政策分析员 / an MCCSS analyst）
- **A**：能判断疫情期间 OW 下降而 ODSP 基本平稳、之后 OW 回升并超过 2019 Q4 水平；能把带注释的图和阶段表直接放进简报并查任意季度的数值；不能判断变化的原因，也看不出两项目变化速度的精确差别。
- **B**：能判断两个项目在哪些季度同向、哪些反向，以及疫情后 OW 的年均增长远快于此前；能按阶段比较年均变化并选出值得调查的季度；不能直接看到案件规模（要看提示或图 2），也不能判断增长"好不好"。
- **C**：能判断疫情期间全部社会援助的下降幅度在 1969 年以来的记录中有多大，以及最新水平高于 1994 年峰值；能在长时段里任选年份细看 OW 和 ODSP；不能判断案件占人口的比例是否创新高，也不能跨 1998 年做同口径比较。
- **D**：能判断疫情前 ODSP 增长远多于 OW、疫情中几乎只有 OW 在变；能逐季移动、对照普通时间线核实，并在 3D 中看到路径和两张时间图是同一条曲线；不能精确读出某段时间的变化幅度（要看读数面板或正视图），而且第一次看可能误读方向，3D 中还可能误判远近。
- **D 的 3D 冷启动（5 秒）**：能看出一条曲线在盒子里从后左走到前右，前右有一段很深的下探后升到最高，三条轴的名字。可能误读：把墙上的淡色投影当成另外几条数据线；把伸向远墙的引线当成路径的一部分；分不清下探那段在早期路径的前面还是后面（深度模糊）；把高低差误读为时间趋势，或不确定时间是朝向观者还是远离。页面的图注、引线说明和"Read values in the flat views"提示针对这些误读，但没有做过真人测试。

### 10.7 版本之间 / Across variants
- **是否真的不同**：A = 时间轴上的水平（双折线）；B = 时间轴上的变化率（共轴小倍数 + 同向条带 + 阶段点图）；C = 两个尺度的时间轴（概览 + 详图，另一个序列）；D = 无时间轴的二维路径（散点连线），v2 另可展开为时空立方体。视图形式、叙事结构和主要编码各不相同，不只是换颜色或布局。
- **是否与 Q3 风格一致**：四个都使用同一份 `shared/q1.css`（复制自 Q3 v2 的变量和骨架）、相同的字体、eyebrow、编号步骤、"Read this first"、结论卡片、Source 行、疫情灰带、选中期包围框、悬停提示和主题切换。

## 11. 待小组决定 / Open questions for the group

1. **选哪个版本**，或按 §9 组合；选定后放入稳定路径 `design/q1/prototype/`。四个候选的 v1 已打 tag `q1-v1`（`a193c19`）。/ Which variant or combination; the v1 batch is tagged `q1-v1`.
2. **增长率定义**：同比变化、阶段年均变化、还是相对 2019 Q4 的变化？/ Growth-rate definition.
3. **是否使用历史序列**，以及是否允许写"1969 年以来最多"（案件数、未按人口调整、1998 年口径变化）。/ Whether to use the historical series and the "most since 1969" wording.
4. **疫情期定义**：更新 `RESEARCH_QUESTIONS.md` 第 3 节，使其与数据的 2020-03 至 2023-05 一致。/ Update the Q1 draft's pandemic period.
5. **B 改变的已定决定**（默认显示变化率）是否接受；**D 的失业率对齐方式**（对齐同步时间线而非散点图）是否接受。/ Accept B's change and D's adaptation?
6. **全站共用样式**：是否把 Q1/Q3 共用的 CSS 变量和工具函数抽成一个全站文件（目前 Q1 是复制的，以免改动 Q3）。/ Extract a site-wide stylesheet and helpers?
7. **D 的读者测试**：如果考虑 D，先找 2–3 位组外同学试读。/ Reader test before choosing D.
8. 全省 OW `cases` 带小数的原因仍未核实。/ Decimal OW counts still unverified.
9. **D 的 3D 视图**：保留为可选视图和导览（我的建议），还是撤掉以保持 D 简单？如果保留，是否把它也做进组内读者测试（重点看 §10.6 列出的误读）？/ Keep D's 3D as an optional view (recommended) or drop it; include it in the reader test?
10. **报告**：如果选 D，是否在 `report.pdf` 中用"斜视 3D + 三个正视投影"的半页小图组？/ Use the half-page 3D figure group in the report if D is chosen?
11. **OW − ODSP 视图**（D v3）：保留吗？另外，是否把同一张差值图作为普通 2D 图也加进 A（它直接回答"走势如何不同"，不依赖 3D）？/ Keep D v3's difference view, and add the same chart to A as a plain 2D figure?
12. **参照面版本**（§7.3）：选哪一个或哪几个并入 D（我的建议：版本 1 占比面 + 版本 2 时间切面；版本 3 作为开关里的备选），还是都不加。并入时先给 D v3 存档。/ Which plane version(s) to merge into D, if any.
13. **D v3 的两个标签问题**（§7.3 "开发与测试"）：是否把新版本中的修复回补到 D v3（属于 bug 修复，不算大版本）？/ Back-port the two label fixes to D v3?
14. **新增的派生指标**：版本 1 的 OW 占比和版本 3 的合计都由两个项目的案件数计算，没有引入外部变量；是否同意把它们写进 Q1 的指标范围和报告？/ Accept OW share and the combined total as Q1 measures?
15. **插入面版本**（§7.4）：选哪一个或哪几个（我的建议：只选版本 7；或按 6 → 7 → 5 合并成 D 的三个叙事步骤，只保留一个叠加层开关）。/ Which insight overlay(s), if any.
16. **外部参照数据**：是否接受版本 5（FAO 报告）和版本 6（政策日期）引入的外部数字；FAO 每年更新，最终提交前再核对一次。/ Accept the sourced external numbers of versions 5 and 6?
17. **OW 小数的原因**：数据字典写明全省 OW 案件数包括第一民族案件的估计值（§7.4 顺带发现），是否据此更新第 8 条和页面上的 "shown as published"。/ Use the dictionary note to explain the decimal OW counts?
