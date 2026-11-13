# Q1 设计说明：OW 与 ODSP 的总体趋势（v1 候选 A–D）/ Q1 Design Rationale: OW and ODSP Overall Trends (v1 candidates A–D)

状态：v1 = 四个可运行的候选版本，2026-11-12，待小组选择。网站文字为英文；本说明中英双语。做法和质量标准以 Q3 v2（[design/q3/Q3_DESIGN.md](../q3/Q3_DESIGN.md)）为准。
Status: v1 = four runnable candidates, 2026-11-12, awaiting the group's choice. Website copy is in English; this document is bilingual. Method and standards follow Q3 v2.

- 总览 / Overview: [index.html](index.html) · 运行方法 / Run: [README.md](README.md) · 参考 / References: [REFERENCES.md](REFERENCES.md)
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

- **Motivation**：问题是两个序列"相对彼此"怎么动；把一个画成另一个的函数，"一起还是分开"就变成一条路径的方向。
- **Appeal**：最容易记住、也最容易在简报里复述的形状：疫情前长期向右漂移，疫情中近乎垂直下降再回升。
- **代价 / Cost**：读者不熟悉；时间沿路径而不是沿坐标轴，Haroz 等（2016）发现读者更容易弄错顺序和方向；疫情期间下降和回升的两段几乎重叠（ODSP 基本不动），需要滑块才能分开。
- **视图与编码**
  - 图 1a：横向位置 = ODSP，纵向位置 = OW，每季一点，按时间连线；两轴**每个指数点使用相同像素**，所以 45° 虚点线表示"同等相对增长"，路径与它的夹角可以直接比较。数量 / 指数切换只改坐标刻度（几何不变），刻度取整数案件数。线段按疫情阶段用有序中性色阶（浅 → 深）分段，不占用项目色。只标起点、2019 Q4、OW 最低点、最新一期和滑块当前季度（当前标签自动避让）。
  - 阅读说明：方向键（右 = 只有 ODSP 增长，上 = 只有 OW 增长，对角 = 两者都增长，下 = 只有 OW 下降）+ 阶段图例 + 当前季度读数面板。
  - 图 1b：同步的普通时间线（两项目指数）+ 失业率条带，竖线跟随滑块。**说明**：失业率对齐的是这条同步时间线，而不是散点图（散点图没有时间轴）——这是对已定决定的适配，列为待确认事项。
  - 图 2：每阶段净变化与路径方向（规则：变化幅度超过另一项目两倍者决定主方向）。页面上的方向词（"mostly right"、"mostly up"）都由这条规则计算得出。
- **交互**：滑块（`<input type=range>`，键盘原生可用）+ Play = **navigation**（时间）；叙事步骤 = selection（其他阶段变淡）；悬停散点（Delaunay 最近点）↔ 时间线竖线和读数面板联动；点击时间线把滑块移到该季度。`prefers-reduced-motion` 时播放步进放慢、无补间动画。
- **放弃的方案**：动画气泡图（Gapminder 式的气泡大小和颜色会编码多余变量）；不等比例坐标（45° 失去意义）；不加阅读说明直接展示（研究证据显示误读风险高）。

## 8. 版本比较 / Comparison

| 维度 / Criterion | A · 时间线 | B · 变化 | C · 长时段 | D · 路径 |
| --- | --- | --- | --- | --- |
| 清楚程度（第一次看）/ Clarity | 高：最熟悉的形式 | 中：需要理解同比定义 | 中高：两个序列要解释 | 低中：依赖阅读说明 |
| 分析深度 / Analytical depth | 中：水平、指数、阶段表 | 高：方向、速度、同向季度、年均变化 | 中高：历史尺度 + 详图 | 中：只看相对运动 |
| 创意（R10）/ Creativity | 低 | 中 | 中 | 高 |
| 剩余开发量 / Remaining effort | 低 | 中 | 中（要处理口径说明）| 高（读者测试、可访问性）|
| 与 Q2/Q3 一致 / Consistency | 高：与 Q3 第 1 步同一套模式 | 中：主指标不同 | 高：刷选 + 详图同 Q3 第 2 步 | 中：独特形式 |
| 已定决定 / Settled decisions | 全部保留 | 改变"默认案件数" | 全部保留 | 保留（失业率对齐同步时间线）|
| 最大风险 / Main risk | 被评为"缺乏创意" | 读者忽略规模 | 历史序列被误读为同口径 | 读者弄错顺序或方向 |

## 9. 推荐（最终由小组决定）/ Recommendation (the group decides)

**以 A 为底，加入 B 的图 2（分阶段年均变化）。** A 最清楚、保留全部已定决定、与 Q3 一致；B 的分阶段图补上 A 缺少的一点——在长度相差很大的阶段之间公平地比较变化速度。两者合并后，创意分仍不算高，所以可选地：
- 如果小组同意使用历史文件并接受口径说明，把 C 的概览缩成 A 上方的一条背景带（"放在长时段里看"）；
- D 作为"换一种方式看"的附加视图，而不是主图，除非组内快速测试显示读者能正确读出顺序和方向。

**Use A as the base and add B's Figure 2 (average annual change per period).** Optionally add C's overview as a compact context strip if the historical file is approved, and keep D as an extra view rather than the main one unless a quick reader test shows it is read correctly.

## 10. 自检 / Self-check

### 10.1 满分要求对照 / Grading requirements

"满足 / 部分 / 未"= Met / Partly / Not met。证据指具体视图或文字。

| 要求 / Requirement | A | B | C | D |
| --- | --- | --- | --- | --- |
| R1 可视化为核心 | 满足：图 1a/1b/2 | 满足 | 满足 | 满足 |
| R2 交互支持探索 | 满足：步骤、切换、范围、高亮、悬停、表格联动 | 满足：另有年均/总变化切换、阶段点击 | 满足：刷选 + 按钮 + 联动竖线 | 满足：滑块、播放、散点↔时间线联动 |
| R3 在线发布 | 未：未部署 | 未 | 未 | 未 |
| R4 自包含 | 满足：定义卡、副标题、图注 | 满足：另有变化定义 | 满足：口径说明在图下 | 部分：依赖阅读说明，未做读者测试 |
| R5 课程数据为主 | 满足 | 满足 | 满足（历史序列也是课程数据） | 满足 |
| R6 单一受众 | 满足 | 满足 | 满足 | 满足 |
| **R7 编码合理** | 满足：共同尺度位置、色相 = 类别、无双纵轴 | 满足：共轴小倍数、形状+颜色 | 满足：不同序列分图、中性色 | 满足：等比例坐标、阶段有序色阶 |
| **R8 分析能力** | 部分：水平与阶段，变化速度只能读斜率 | 满足：方向、速度、同向、年均 | 满足：历史尺度 + 详图 | 部分：只有相对运动 |
| **R9 清楚可导航** | 满足 | 满足 | 满足 | 部分：形式陌生 |
| **R10 创意** | 未/部分：常规双折线 | 部分：同向条带、年均点图 | 部分：focus + context 常见但有口径处理 | 满足：连接散点图 + 引导阅读 |
| R11 文字清楚 | 满足 | 满足 | 满足 | 满足 |
| **R12 理由深入** | 满足：§4 | 满足：§5 | 满足：§6 | 满足：§7 |
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
| L3 discriminability | 满足：2 色 | 满足 | 满足 | 部分：93 点，下降与回升两段重叠 |
| L3 popout | 满足：图例高亮 | 满足：阶段框 | 满足：刷选框 | 满足：当前点黑描边 |
| L4-1 对齐、接近 | 满足 | 满足 | 满足 | 满足（时间线对齐失业率） |
| L4-1 similarity | 满足 | 满足 | 满足 | 满足 |
| L4-1 enclosure | 满足：阶段框、疫情带 | 满足 | 满足 | 满足 |
| L4-2 分类色经工具验证 | 满足（§3） | 满足 | 满足 | 满足（另验证有序色阶） |
| L4-2 正负用发散色阶 | 不适用 | 不适用（正负用位置） | 不适用 | 不适用 |
| L4-2 无彩虹 | 满足 | 满足 | 满足 | 满足 |
| L5 change mapping | 满足：数量/指数 | 满足：同比/相对基准、年均/总 | 满足 | 满足（只改刻度） |
| L5 navigation / filtering | 满足：范围按钮 | 满足 | 满足：刷选 + 按钮 | 满足：滑块 |
| L5 selection + details on demand | 满足 | 满足 | 满足 | 满足：读数面板 |
| L5 linked views | 满足：1a↔1b 十字线 | 满足：贯穿全部面板 | 满足：详图↔概览 | 满足：散点↔时间线 |
| L6 叙事结构 | 满足：martini glass | 满足 | 满足：先远后近 | 满足：步骤 + 播放 |
| L6 annotated chart | 满足 | 满足 | 满足 | 满足 |
| L6 contrast | 满足：三阶段 | 满足：年均对比 | 满足：历史 vs 疫情 | 满足：方向对比 |
| L6 开头/中间/结尾 | 满足 | 满足 | 满足 | 满足 |
| L7 不用地图的理由 | 满足（§3） | 满足 | 满足 | 满足 |

### 10.3 数字复核 / Number recomputation
方法：每个候选在浏览器里计算的全部事实（`window.__facts`）导出为 JSON，用 pandas 从原始 CSV 独立重算，逐字段比较（相对误差 1e-9）。再从每个页面的全部可见文字和 SVG 文字中提取数字，与 pandas 结果按页面的格式（千分位、一位小数、带符号百分比）比对。
Method: export every fact each page computes, recompute independently in pandas and compare field by field; then extract every number from the visible text and SVG labels and match it against pandas values formatted the way the page formats them.

| 候选 / Variant | 事实字段不一致 / Fact mismatches | 文字中的数字 / Numbers in text | 未解释 / Unexplained |
| --- | --- | --- | --- |
| A | 0 | 115 | 0（235,501 是 235,500.5 在 JS 中四舍五入，Python 银行家舍入为 235,500） |
| B | 0 | 105 | 0（16.75 = 疫情前阶段年数 67 ÷ 4） |
| C | 0 | 117 | 0（"1998,"、"2026,"、"692,871," 只是正则多抓了逗号） |
| D | 0 | 101 | 0 |

坐标刻度、年份、"2019 Q4 = 100"、45° 不计入。页面上的覆盖范围标签（如 "Jan 2017 – Dec 2025"、"2003 Q1 – 2026 Q1"）是静态文字，与 Q3 相同做法，已核对与数据一致。

### 10.4 常见错误检查 / Anti-pattern check
双纵轴：四个都没有（A/C 指数切换，B 小倍数，D 等比例散点）。彩虹色阶、3D、饼图：无。截断的柱状图坐标轴：不用柱状图；A/C 的数量模式从 0 开始，指数模式以 100 为参考并在标题中写明。只靠颜色区分：每个候选都有图例 + 直接标签，B 另加形状。每个点都标数字：无（selective labels）。因果或价值判断措辞：已搜索 caus / because / due to / improve / worsen / recover 等，只出现在"The data do not show"卡片的否定句和 A 的"Context, not cause"标题中。历史序列与 OW/ODSP 混成一条线：无（只在 C 中单独成图）。

### 10.5 渲染检查 / Rendering check
用 Chrome DevTools Protocol 驱动无头 Edge（精确 1360 px 和 400 px 视口、真实鼠标和键盘事件）：
- 截图：每个候选桌面浅色/深色、手机浅色/深色、一个交互状态，外加总览页（见 `screenshots/`）。
- 页面横向滚动：四个候选和总览在 1360 / 820 / 400 px 均为 0（A、D 的表格在自己的容器内滚动）。
- SVG 文字重叠：所有页面、三种宽度均为 0（修复过：A 失业率"0%"与年份、B 窄屏标签、C 的 1998 标签、D 坐标角和当前标签）。
- 控制台：无错误。
- 键盘：Tab 可到达每个可聚焦控件（A 16、B 16、C 11、D 13 个，另加"Read this first"折叠）；每组分段按钮用 Enter 切换成功；D 的滑块用方向键移动到 2021 Q1，路径和读数面板同步；表格行（A、D）和 B 图 2 的行都可 Tab 到达并用 Enter 选择，重绘后焦点留在同一行。
- 交互：真实鼠标悬停四个候选主图时提示出现、失业率条带的十字线同步；C 拖动刷选得到 2015 Q4 – 2022 Q3（28 个季度），详图更新。

### 10.6 受众检查 / Audience check（MCCSS 政策分析员 / an MCCSS analyst）
- **A**：能判断疫情期间 OW 下降而 ODSP 基本平稳、之后 OW 回升并超过 2019 Q4 水平；能把带注释的图和阶段表直接放进简报并查任意季度的数值；不能判断变化的原因，也看不出两项目变化速度的精确差别。
- **B**：能判断两个项目在哪些季度同向、哪些反向，以及疫情后 OW 的年均增长远快于此前；能按阶段比较年均变化并选出值得调查的季度；不能直接看到案件规模（要看提示或图 2），也不能判断增长"好不好"。
- **C**：能判断疫情期间全部社会援助的下降幅度在 1969 年以来的记录中有多大，以及最新水平高于 1994 年峰值；能在长时段里任选年份细看 OW 和 ODSP；不能判断案件占人口的比例是否创新高，也不能跨 1998 年做同口径比较。
- **D**：能判断疫情前 ODSP 增长远多于 OW、疫情中几乎只有 OW 在变；能逐季移动、对照普通时间线核实；不能精确读出某段时间的变化幅度（要看读数面板），而且第一次看可能误读方向。

### 10.7 版本之间 / Across variants
- **是否真的不同**：A = 时间轴上的水平（双折线）；B = 时间轴上的变化率（共轴小倍数 + 同向条带 + 阶段点图）；C = 两个尺度的时间轴（概览 + 详图，另一个序列）；D = 无时间轴的二维路径（散点连线）。视图形式、叙事结构和主要编码各不相同，不只是换颜色或布局。
- **是否与 Q3 风格一致**：四个都使用同一份 `shared/q1.css`（复制自 Q3 v2 的变量和骨架）、相同的字体、eyebrow、编号步骤、"Read this first"、结论卡片、Source 行、疫情灰带、选中期包围框、悬停提示和主题切换。

## 11. 待小组决定 / Open questions for the group

1. **选哪个版本**，或按 §9 组合；选定后放入稳定路径 `design/q1/prototype/`，并在之后任何大改动之前给这批候选打 tag `q1-v1`。/ Which variant or combination; tag this batch `q1-v1` before further major changes.
2. **增长率定义**：同比变化、阶段年均变化、还是相对 2019 Q4 的变化？/ Growth-rate definition.
3. **是否使用历史序列**，以及是否允许写"1969 年以来最多"（案件数、未按人口调整、1998 年口径变化）。/ Whether to use the historical series and the "most since 1969" wording.
4. **疫情期定义**：更新 `RESEARCH_QUESTIONS.md` 第 3 节，使其与数据的 2020-03 至 2023-05 一致。/ Update the Q1 draft's pandemic period.
5. **B 改变的已定决定**（默认显示变化率）是否接受；**D 的失业率对齐方式**（对齐同步时间线而非散点图）是否接受。/ Accept B's change and D's adaptation?
6. **全站共用样式**：是否把 Q1/Q3 共用的 CSS 变量和工具函数抽成一个全站文件（目前 Q1 是复制的，以免改动 Q3）。/ Extract a site-wide stylesheet and helpers?
7. **D 的读者测试**：如果考虑 D，先找 2–3 位组外同学试读。/ Reader test before choosing D.
8. 全省 OW `cases` 带小数的原因仍未核实。/ Decimal OW counts still unverified.
