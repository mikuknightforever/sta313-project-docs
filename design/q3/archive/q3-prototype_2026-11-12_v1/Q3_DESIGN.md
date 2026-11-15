# Q3 设计说明：OW 受助时长与地区差异 / Q3 Design Rationale: OW Assistance Duration and Regional Differences

状态：可运行原型 v1，2026-11-12，待小组评审。网站文字为英文；本说明中英双语。
Status: working prototype v1, 2026-11-12, pending group review. Website copy is in English; this document is bilingual.

- 原型 / Prototype: [prototype/index.html](prototype/index.html)（运行方法见 [README](README.md) / see the README to run it）
- 截图 / Screenshots: [screenshots/](screenshots/)
- 研究问题 / Research question: *How has the duration of Ontario Works (OW) cases changed over time, and which metropolitan areas have the highest shares of long-term cases?*

---

## 0. 要求清单 / Requirements checklist

来源：附件 *Project*（课程项目页）与 *Project mock design*（作业页）。后面的设计和第 9 节自检都以此为准。
Sources: the attached *Project* page and *Project mock design* page. The design and the self-check in Section 9 are measured against this list.

| # | 要求 / Requirement | 来源 / Source |
| --- | --- | --- |
| R1 | 数据可视化是核心 / Data visualization is the central component | Project |
| R2 | 用交互支持探索 / Interactivity supports exploration | Project |
| R3 | 以交互网页形式在线发布，不是可执行文件 / Deployed online as an interactive web page | Project |
| R4 | 自包含：不读报告也知道怎么用 / Self-contained: viewers can use it without the report | Project |
| R5 | 至少使用一份课程数据作为主数据；外部数据仅为补充 / At least one course dataset as main data | Project |
| R6 | 只面向一个主要受众，并有清晰的沟通与分析目标 / One primary audience with clear goals | Project |
| R7 | 编码在感知和语义上都合理 / Perceptually and semantically meaningful encodings | Mock rubric, Illustrations (4) |
| R8 | 交互分析能力丰富：多视图、多问题 / Rich analytical capability across views and questions | Mock rubric |
| R9 | 整体清楚、可自行导航（从哪开始、能做什么）/ Clear, self-explanatory navigation | Mock rubric |
| R10 | 有创意，超越默认的散点图、折线图、直方图 / Creative beyond default charts | Mock rubric |
| R11 | 文字清楚简洁 / Clear and concise writing | Mock rubric, Description (5) |
| R12 | 深入讨论设计理由：权衡、备选方案、每个通道、局限；"解释每一个像素" / Rationale in depth, incl. trade-offs, alternatives, every channel, limitations, every pixel | Mock rubric |
| R13 | 深入讨论交互设计 / Interaction design discussed in depth | Mock rubric |
| R14 | 使用课堂的可视化词汇 / Uses visual vocabulary from lectures | Mock rubric |
| R15 | 视图、数据维度与主题和受众对齐 / Views and data aligned with topic and audience | Mock rubric |
| R16 | 开发计划：技术与分工 / Development plan: technology and division of labour (1 pt) | Mock rubric |
| R17 | 报告格式：封面（无个人信息）、插图 1–3 页、说明 1–2 页、开发计划 1 页，单倍行距 11–12pt，`report.pdf` / Report format | Mock page |
| R18 | 贡献报告 `contribution.pdf` / Contribution report | Mock page |
| R19 | 严重拼写语法错误最多扣 50% / Spelling and grammar penalty up to 50% | Mock page |
| R20 | 截止：Mock design 11 月 19 日；最终作品与演示视频 12 月 7 日 / Deadlines | Project |

**附件与 Prompt 的冲突或张力 / Conflicts or tension between the attachments and the prompt**

1. Prompt 要求一份完整的 Q3 设计文档；但 `report.pdf` 的插图只有 1–3 页、说明只有 1–2 页，且要覆盖三个问题。本文件是工作底稿，写进报告时 Q3 需要压缩到约 1 页插图和 1/3 页文字。
   The prompt asks for a full Q3 design document, but `report.pdf` allows only 1–3 pages of illustrations and 1–2 pages of description for all three questions. This file is a working document; Q3 must be condensed to about one page of figures and a third of a page of text for the report.
2. R10 要求超越默认图表。本设计的主体（堆叠面积图、折线图）本身是常规图表；有新意的部分是派生指标热力图、带区间的排序点图、时间刷选和联动。第 9 节如实把 R10 标为"部分满足"。
   R10 asks for more than default charts. The core charts here (stacked area, line) are conventional; the novelty lies in the derived-difference heatmap, the ranged dot plot, the timeline brush and the linking. Section 9 rates R10 as partly met.
3. 我只拿到了 L1–L3 的讲义 PDF。L4–L7 的原则按 Prompt 的描述应用，没能对照原讲义核实。
   Only the L1–L3 lecture PDFs were attached. L4–L7 principles are applied as described in the prompt and could not be checked against the original decks.

---

## 1. 数据抽象 / Data abstraction (L2)

| 属性 / Attribute | 类型 / Type | 说明 / Notes |
| --- | --- | --- |
| 季度 `date` / Quarter | 有序、数量型（时间）/ Ordered, quantitative (time) | 2003 Q1 – 2026 Q1，93 个季度 / 93 quarters |
| CMA | 类别 / Categorical | 15 个，无内在顺序 / 15 areas, no inherent order |
| 时长档 / Duration band | **有序** / **Ordinal** | 0–4、5–12、13–18、19+ 个月 / months |
| `cases`、`moa*` | 数量型（计数）/ Quantitative counts | 案件，不是人数 / cases, not people |
| 疫情阶段 / Pandemic phase | 有序类别 / Ordered categorical | pre / during / post（during = 2020-03 至 2023-05） |

**派生数据 / Derived data** ("Don't necessarily draw what you're given", L2):
- 长期占比 / Long-term share = `moa19 / cases × 100`。
- 与全省之差 / Difference from Ontario = CMA share − Ontario share（百分点 / pp）。
- 时期占比 / Period share = Σ`moa19` ÷ Σ`cases`，按时期内所有季度合并（加权，不是季度占比的简单平均）/ pooled over the quarters in a period (weighted, not a mean of quarterly shares)。
- 时期内最低、最高季度占比，平均案件数 / Lowest and highest quarterly share, average caseload in the period。

数据检查（已复核）：两个文件均无缺失；CMA 文件中四档之和逐行等于 `cases`；全省文件 2003 Q1 差 0.0755，另有 4 个季度差 1e-6；15 个 CMA 之和不等于全省（2026 Q1：224,843 vs 291,970）。
Data checks (re-run): no missing values; the four bands sum exactly to `cases` in every CMA row; the Ontario file differs by 0.0755 in 2003 Q1 and by about 1e-6 in four other quarters; the 15 CMAs do not sum to Ontario (2026 Q1: 224,843 vs 291,970).

## 2. 任务抽象 / Task abstraction (L2)

| 受众问题 / Analyst question | 任务动词 / Task | 视图 / View |
| --- | --- | --- |
| 全省时长构成如何变化？/ How did Ontario's duration mix change? | Characterize distribution; Identify trend | 图 1a / Fig 1a |
| 长期占比何时最高？为什么那时高？/ When was the long-term share highest, and what changed then? | Find extremum; Find anomalies; Compute derived value | 图 1a + 1b + 叙事步骤 / story steps |
| 某时期哪些 CMA 最高？/ Which CMAs are highest in a period? | Sort; Find extremum; Compare | 图 3 / Fig 3 |
| 排名是否长期稳定？/ Is the ranking stable over time? | Compare; Identify trend; Determine range | 图 2、图 3 区间线 / Fig 2, Fig 3 range lines |
| 某 CMA 与全省、与其他 CMA 相比如何？/ How does one CMA compare with Ontario and the others? | Compare; Retrieve value | 图 4、悬停 / Fig 4, tooltips |
| 精确数值 / Exact values | Retrieve value | 悬停提示、表格视图 / tooltips, table view |

Munzner 的 why 框架：主要动作是 *discover*（分析员探索）加 *present*（带注释的结论）；目标是 *trends*、*outliers*、*distribution* 和 *extremes*。
In Munzner's terms the action is *discover* plus *present*; targets are *trends*, *outliers*, *distribution* and *extremes*.

## 3. 页面结构 / Page structure (L6: martini glass)

1. **标题与导语 / Headline and lead**：一句话给出 take-home message（2026 Q1 为 50.1%，2021 Q3 峰值 72.9%，CMA 范围 44.2%–58.0%），全部由 CSV 实时计算。/ One-sentence take-home message, computed live from the CSV.
2. **"先读这里" / Read this first**：四个定义卡片（时长 = 迄今为止的受助时间；长期 = 19 个月以上及其分母；案件 ≠ 人；CMA ≠ 全省）。/ Four definition cards.
3. **第 1 步：全省（引导式）/ Step 1, Ontario (guided)**：三个叙事步骤 + "Explore all"。/ Three story steps plus "Explore all".
4. **第 2 步：地区（开放探索）/ Step 2, Regions (open exploration)**：图 2、3、4 联动。/ Linked Figures 2–4.
5. **第 3 步：结论边界 / Step 3, Takeaways**：能支持什么 / 不能说明什么 / 值得调查什么，随所选时期更新。/ Supports / does not show / worth investigating, updated with the selected period.

先窄后宽（杯颈 → 杯口）：先用注释讲清楚一个发现，再开放全部控件。
Narrow then wide (the stem, then the bowl): one annotated finding first, then all controls.

## 4. 各视图 / Views

### 图 1a：全省时长构成 / Figure 1a: Ontario duration mix
- **任务**：Characterize distribution、Identify trend。
- **标记 / Marks**：面积（堆叠）/ areas (stacked)。
- **通道 / Channels**：横向位置 = 时间；纵向位置 = 案件数或占比；颜色**亮度** = 时长档（有序）。
- **关键决定 / Key decision**：19+ 放在**最底层贴基线**。L3 指出堆叠图里只有贴基线的那一层可以按"共同尺度上的位置"读取，其他层只能读长度差。最重要的属性因此用上了最强的通道（effectiveness）。
  The 19+ band sits **on the baseline**: in a stack only the baseline layer is read as position on a common scale (L3), so the most important attribute gets the strongest channel.
- **颜色 / Colour**：单色相蓝色，亮度有序，0–4 最浅、19+ 最深（浅色主题）；深色主题中反转，19+ 最亮，保持"最重要 = 与背景对比最强"。两套都用 `validate_palette.js --ordinal` 验证：亮度单调、相邻 ΔL ≥ 0.06、最浅一档对背景 ≥ 2:1、色相跨度 ≤ 4°。
  One blue hue, ordered by lightness (expressiveness: ordinal data → ordered channel, never unordered hues). Dark theme flips the anchor so 19+ stays highest-contrast. Both ramps pass the ordinal validator.
- **交互 / Interaction**：
  - "Number of cases / Share of cases" 切换 = **change mapping**（Card 流程中改变 visual mapping 层）。数量视图显示总量变化，占比视图显示构成，各自回答不同问题，而不是用双纵轴硬塞进一张图。
  - 图例即筛选器：点击某一档，只显示该档并贴到基线 = **filtering**（改变 transformed data 层）。用户因此可以在共同基线上比较**任意**一档，解决了堆叠图中间层无法精确比较的问题。
  - 悬停十字线同时在 1a 和 1b 出现（**linked views**）；提示显示四档的数量和占比、总案件数。
  - The count/share toggle is *change mapping*; the legend doubles as a filter that moves any band onto the baseline (*filtering*); a linked crosshair spans 1a and 1b.
- **方向标签 / Direct labels**：右端直接标注四档名称（桌面宽度），19+ 加粗；手机宽度只用图例，避免拥挤。

### 图 1b：全省长期占比 / Figure 1b: Ontario long-term share
- 单条折线（2px），与 1a **共用时间轴并上下对齐**（格式塔：接近、对齐）。纵轴固定 0–80%，不截断。
- 只标注少数点（selective labels）：当前叙事步骤的起止点，或"Explore all"时的峰值和最新值。从不在每个点上标数字。
- 1a 显示数量，1b 显示占比：这就是讲故事中的 **juxtaposition**。2021 年数量图上 19+ 层几乎不动，而占比图出现峰值，并排即可看出"数量 vs 占比"。

### 叙事步骤 / Story steps (L6: annotated chart, contrast)
三个步骤分别高亮一段时期（enclosure：带边框的半透明区块），文字全部由数据生成：
Each step highlights a period (enclosure) with text generated from the data:

1. **2009 Q2 → 2019 Q4**：长期占比 27.6% → 55.2%（2.0 倍）；长期案件 63,374 → 130,096；总量在 229,377–264,834 之间。
2. **2019 Q4 → 2021 Q3**：长期案件 130,096 → 130,444（基本不变）；总案件 235,501 → 178,872；占比升至 72.9%，全序列最高。**"These data do not show why the total fell."**
3. **2021 Q3 → 2026 Q1**：占比降到 45.1%（2024 Q4）后回升到 50.1%；总量 291,970，长期案件 146,242，为全序列最多。

第 2 步是 **contrast**（2019 Q4 vs 2021 Q3）。解释只用数量与占比的关系，不提 CERB、申请量或任何政策原因。
Step 2 is a *contrast* pattern. The explanation uses only counts versus share; no CERB, applications or policy causes.

### 图 2：与全省之差的热力图 / Figure 2: difference-from-Ontario heatmap
- **任务**：Compare、Identify trend、判断排名是否稳定（Prompt 明确要求）。
- **标记**：矩形单元格（15 行 × 93 列）。**通道**：行 = CMA（空间区域，类别）；列 = 季度（位置，有序）；颜色 = 与全省之差（发散）。
- **为什么画差值而不是占比本身**：所有 CMA 的占比都随全省一起起落（2009 年约 28%，2021 年约 73%），直接上色时颜色只会显示全省趋势，看不出地区差异。减去全省值后，共同趋势被去掉，"一贯偏高 / 一贯偏低"一眼可见（派生数据，L2）。
  Why the difference, not the share: every CMA rises and falls with Ontario, so colouring raw shares would mostly repaint the provincial trend. Subtracting Ontario removes the common trend so persistent regional gaps pop out.
- **颜色 / Colour**：发散色阶，绿（低于全省）↔ 紫（高于全省），**中点为中性灰**（± 2 个百分点内）。7 个分级，阈值 ±2 / ±6 / ±10 pp（数据 5%–95% 分位约 −10.8 到 +6.5 pp）。L4-2：分级而非连续，因为超过约 7 级相邻颜色就分不清；中点无色相。
  - 为什么不用蓝 ↔ 橙：全站 OW = 蓝、ODSP = 橙，复用会被误读为"项目"。绿 ↔ 紫在两套主题中都保持冷暖分立，且不与项目色冲突。
  - 色盲检查：同级的绿紫两端经 `validate_palette.js` 计算，CVD ΔE 9.3–16.7（≥ 8），正常视力 ΔE 16.0–29.4（≥ 15）。工具对其中几对给出 FAIL，原因是浅色或深色端低于"分类色"的亮度带；这一项检查不适用于发散色阶的浅端（工具文档说明顺序色阶跑分类检查会"按设计失败"）。最浅一级对背景对比度低于 3:1，因此提供悬停数值和表格作为补偿通道。
  - CVD check: mirrored steps separate by CVD ΔE 9.3–16.7 and normal-vision ΔE 16.0–29.4. The validator flags band and contrast failures on the light ends, which is expected for a ramp; the tooltip and table provide the relief channel.
- **行排序 / Row order**：按所选时期的占比从高到低排序（**spatial arrangement**），与图 3 的排序一致。
- **时间刷选 / Timeline brush**：顶部是全省长期占比的小面积图作为上下文（overview），在上面拖动即可选择任意时间段（**navigation / filtering**），并吸附到季度。所选时期在热力图上用黑框圈出（enclosure）。
- **疫情期**：在热力图中改为两条竖线，因为背景带会被单元格完全遮住；在其他时间轴上仍用浅灰背景带。语义一致，载体随图形调整。
- 点击行名或单元格 = 选中该 CMA（**selection**），联动图 3、图 4。
- 小地区提示：案件数 < 3,000 的单元格在悬停中提示"小样本波动较大"。

### 图 3：所选时期的排序点图 / Figure 3: ranked dot plot for the period
- **任务**：Sort、Find extremum、Compare（与全省）、Determine range。
- **标记**：点 + 横线。**通道**：横向位置（共同尺度，最强通道）= 时期占比；横线长度 = 时期内最低到最高季度；纵向位置 = 排名。
- 竖线 = 全省同期占比（参考线，带直接标签）。
- **为什么用点而不是柱**：柱子的长度从 0 开始才有意义；15 个值集中在 40%–65% 之间，从 0 画柱会把差别压扁，截断柱又会误导。点图可以把轴放在数据范围上而不失真，并能加区间线显示稳定性。
  Why dots, not bars: bars must start at zero, which would flatten 15 values packed between 40% and 65%; a truncated bar axis misleads. Dots allow a data-range axis and room for the range line.
- 横轴随时期重新缩放（标签注明）；右侧列出精确值和平均案件数，**案件数让分析员看到 Guelph（约 2 千）和 Toronto（约 12 万）规模不同**。
- 排序可切换为占比 / 案件数 / 名称（spatial arrangement）。"Show as table" 提供可访问的表格视图。
- 选中的 CMA 用深色点、加粗标签和浅色行底突出（**popout**：只用一个强通道组合，其他行保持灰色）。

### 图 4：所选 CMA 详情 / Figure 4: selected CMA detail
- 默认 "Long-term share"：所选 CMA 粗线 + 全省深灰线 + 其余 14 个 CMA 细灰线（**highlight + grey out**，L3 discriminability：不用 15 种颜色）。
- 切换 "Full duration mix"：该 CMA 的 100% 堆叠面积图（19+ 贴基线）+ 全省长期占比参考线（白色描边保证在任何色带上可读）。
- 所选时期用同样的半透明区块标出，与图 1、图 2 一致（格式塔：相似）。

### 第 3 步卡片 / Step 3 cards
三栏："The data support / The data do not show / Worth investigating"。所有句子由数据实时生成，随所选时期更新（例如"after the pandemic (2023 Q2 – 2026 Q1), the highest shares were in Peterborough, Thunder Bay, Kingston"）。

## 5. 全站一致性 / Cross-site consistency
- OW = 蓝；Q3 只有 OW，所以四档用蓝色深浅；页面不出现项目切换。ODSP 橙色保留给 Q1/Q2。
- 疫情期在所有时间轴上统一用浅灰背景带并标注"Pandemic"（热力图例外，见上）。
- 时间轴统一为 2003 Q1 – 2026 Q1 的季度刻度，年份标签。
- 颜色、字体、表面色使用 CSS 变量，可直接替换为最终网站选定的配色方案（`sta313-project-web` 的 palettes.json）。

## 6. 考虑过但放弃的方案 / Alternatives considered and rejected

| 方案 / Alternative | 放弃原因 / Why rejected |
| --- | --- |
| 15 色折线图 / 15-colour line chart | 超出可区分的类别数（L3 discriminability）；改用高亮 + 灰色和小倍数的热力图 / Exceeds discriminable hues; replaced by highlight-and-grey plus the heatmap |
| 饼图或环形图显示时长构成 / Pie or donut for the mix | 只能显示一个时间点；角度和面积精度低（L3 排名）/ One time point only; angle and area rank low |
| 四档用不同色相 / Distinct hues for bands | 违反 expressiveness：有序数据不能用无序通道 / Violates expressiveness for ordinal data |
| 19+ 放在堆叠顶部 / 19+ on top of the stack | 顶层无共同基线，最重要的指标反而最难读 / The top layer has no common baseline |
| 数量与占比画在双纵轴上 / Dual axis for count and share | 两个尺度的对齐是任意的，会制造虚假相关；改为上下对齐的两张图 / Arbitrary scale alignment; replaced by two aligned charts |
| CMA 分级设色地图 / Choropleth of CMAs | 面积与案件数无关，大面积 CMA（Sudbury、Thunder Bay）被过度强调（L7）；第一版不做地图 / Area unrelated to caseload; no map in v1 |
| 热力图直接画占比 / Heatmap of raw share | 颜色主要显示全省共同趋势，地区差异被淹没 / Colour would mostly repeat the provincial trend |
| 从 0 开始的排序柱状图 / Zero-based ranked bars | 差异被压扁；截断柱有误导性 / Differences flattened; truncated bars mislead |
| 动画播放季度排名（bar chart race）/ Animated ranking | 动画需要记忆前后帧，不利于精确比较；热力图把所有季度同时摊开 / Animation forces memory; the heatmap shows all quarters at once |
| 彩虹色阶 / Rainbow scale | 无感知顺序，色盲不友好（L4-2）/ No perceptual order; CVD-unsafe |

## 7. 网站文字与解释边界 / Website copy and interpretation boundaries

网站使用的关键英文措辞（均在页面中）：
Key English copy used on the page:

- "Each quarter counts the OW cases open at that moment, grouped by how long each case has received assistance continuously *so far*. It is a snapshot of the current caseload, not how long a new case will last, and not the chance that a person stays on assistance."
- "The 0–4 month group is not the same as new applications."
- "A case (benefit unit) can include a spouse and children. All counts on this page are cases."
- "Regional figures cover 15 census metropolitan areas (CMAs). They do not add up to the Ontario total… Ontario values are shown as published."
- "These data do not show why the total fell."
- 不能说明 / Does not show: why the caseload fell or grew; how long a new case will last; that local services or policies caused a CMA's share; regional differences in need (a share of the caseload is not a rate per population).

页面中**没有**出现：CERB、新申请减少、"people are staying on assistance longer"、任何因果或政策效果措辞。全省 `cases` 带小数的原因未解释，只说明"shown as published"。
The page does **not** mention CERB, falling applications, "people are staying longer", or any causal or policy-effect wording. The decimal Ontario `cases` are not explained, only described as "shown as published".

## 8. 技术说明 / Technical notes
- 原生 HTML/CSS/JavaScript + D3 v7.9.0（cdnjs）。理由：网站框架尚未确定（候选为原生、React、Shiny、Streamlit），原生 D3 可以直接迁移到原生或 React 路线；Prompt 推荐 D3 或 Vega-Lite；课程页列出 D3 有 TA 支持。热力图刷选、联动高亮和自定义堆叠顺序在 D3 中最直接。
  Plain HTML/CSS/JS with D3 7.9.0. The site framework is not settled; D3 ports directly to the native or React routes, matches the prompt's recommendation, and is TA-supported. Brushing, linking and the custom stack order are most direct in D3.
- 直接读取 `datasets/ONT-SA/selected/` 的两个 CSV；所有数字、注释和结论句都在浏览器中计算，没有手写统计数字。
- 视图状态可写入 URL（`?period=during&cma=535&mode=share&iso=moa19&detail=mix&theme=dark`），便于分享具体视图，截图也用它生成。
- 需要用 HTTP 服务器打开（`file://` 会阻止读取 CSV）。部署时把 CSV 与页面一起发布即可。

## 9. 自检 / Self-check

### 9.1 对照评分要求 / Against the grading requirements

| 要求 / Requirement | 证据 / Evidence | 结果 / Result |
| --- | --- | --- |
| R1 可视化为核心 / Visualization central | 四个图 + 叙事，文字只做定义和注释 / Four figures; text only defines and annotates | 满足 / Met |
| R2 交互支持探索 / Interactivity | 叙事步骤、数量/占比切换、图例筛选、时期按钮 + 刷选、排序、选中 CMA、详情切换、表格 / Steps, toggle, legend filter, period + brush, sort, selection, detail toggle, table | 满足 / Met |
| R3 在线发布 / Deployed online | 原型可静态托管，但**尚未部署** / Static-hostable, **not yet deployed** | 未满足（时间节点在 12 月）/ Not yet |
| R4 自包含 / Self-contained | "Read this first" 定义、每个图下的说明、步骤提示、操作提示 / Definitions, figure notes, step hints | 满足 / Met；建议做一次无指导用户测试 / test with a cold reader |
| R5 课程数据为主 / Course data as main | 只用课程 OW CSV / Course OW CSVs only | 满足 / Met |
| R6 单一受众 / One audience | 全部任务对应 MCCSS 分析员（第 2 节）/ All tasks map to MCCSS analysts | 满足 / Met |
| R7 编码合理 / Meaningful encodings | 第 4 节逐通道说明；有序色阶与发散色阶经工具验证 / Section 4; ramps validated | 满足 / Met |
| R8 分析能力 / Analytical capability | 回答 6 类任务（第 2 节），四个联动视图 / Six task types, four linked views | 满足 / Met |
| R9 清楚可导航 / Navigable | 编号步骤 1–3、"从这里开始"的叙事、控件就在图上方 / Numbered steps, guided start, controls above charts | 基本满足 / Mostly met：控件较多，第一次看可能需要时间 / many controls |
| R10 创意 / Creativity | 派生差值热力图 + 时间刷选、区间点图、可切换基线的堆叠图；但主体仍是常规图表 / Derived heatmap with brush, ranged dots, re-baselining stack; core charts conventional | 部分满足 / Partly met |
| R11 文字清楚 / Clear writing | 网站英文已自查；报告需再精简 / Copy reviewed; report needs trimming | 基本满足 / Mostly met |
| R12 理由深入 / Rationale in depth | 第 4、6 节；网格、标签、注释、参考线均有说明 / Sections 4 and 6 incl. grid, labels, annotations | 满足 / Met（需压缩进报告 / must be condensed） |
| R13 交互理由 / Interaction rationale | 第 4 节每个交互对应 Card 流程层 / Each interaction mapped to a pipeline stage | 满足 / Met |
| R14 课堂词汇 / Lecture vocabulary | 全文使用 expressiveness、effectiveness、discriminability、popout、martini glass 等 / Used throughout | 满足 / Met |
| R15 与主题和受众对齐 / Alignment | 只用 OW 数据，面向案件监测分析员 / OW only, for caseload analysts | 满足 / Met |
| R16 开发计划 / Development plan | 技术已定（第 8 节）；**分工未写** / Tech stated; **division of labour missing** | 部分满足 / Partly met — 需小组决定 / group decision |
| R17 报告格式 / Report format | 本文件不是 `report.pdf` / This is not the report | 未开始 / Not started |
| R18 贡献报告 / Contribution report | 不在本任务范围 / Out of scope | 未开始 / Not started |
| R19 拼写语法 / Spelling | 网站英文已通读 / Copy read through | 需最终校对 / final proofread needed |
| R20 截止 / Deadlines | Mock 11/19 前需完成报告 / Report due Nov 19 | 进行中 / In progress |

### 9.2 对照 L1–L7 原则 / Against L1–L7 principles

| 原则 / Principle | 结果 / Result | 理由 / Reason |
| --- | --- | --- |
| L1 人在回路、外部表征 / Human in the loop | 满足 / Met | 分析员自己选时期和地区，图代替表格做比较 / Analysts choose; charts replace tables |
| L2 数据抽象 / Data abstraction | 满足 / Met | 第 1 节，区分有序与类别 / Section 1 |
| L2 任务抽象 / Task abstraction | 满足 / Met | 第 2 节，每个视图对应任务 / Section 2 |
| L2 派生数据 / Derive | 满足 / Met | 差值、加权时期占比、区间 / Difference, pooled share, range |
| L3 Expressiveness | 满足 / Met | 有序档 → 亮度；CMA → 空间区域，不用有序编码 / Ordinal → lightness; CMA → region |
| L3 Effectiveness | 满足 / Met | 长期占比始终在共同尺度位置上：1b、19+ 贴基线、图 3 点位置 / Always on a common-scale position |
| L3 Discriminability | 满足 / Met | 不用 15 色；排序、过滤、高亮、热力图分行；发散色阶 7 级 / No 15 hues; sort, filter, highlight, rows; 7 classes |
| L3 Separability / popout | 满足 / Met | 选中 CMA 只用深色 + 加粗，其余灰 / One strong cue |
| L4-1 接近、对齐、相似、包围 / Gestalt | 满足 / Met | 1a/1b 对齐共轴；所选时期在三张图中同一种包围框；同义同色 / Aligned axes; same enclosure; same colour, same meaning |
| L4-1 自下而上引导 / Bottom-up attention | 基本满足 / Mostly met | 19+ 最深色并贴基线、标签加粗；但页面信息量较大 / Strongest mark on key band; page is dense |
| L4-2 颜色三通道 / Hue, lightness, saturation | 满足 / Met | 时长 = 亮度；差值 = 色相（方向）+ 亮度（大小）/ Duration = lightness; difference = hue + lightness |
| L4-2 无彩虹、发散中点灰 / No rainbow, grey midpoint | 满足 / Met | 已验证 / Validated |
| L4-2 色盲安全并实测 / CVD tested | 基本满足 / Mostly met | 有序色阶通过；发散两端 CVD ΔE ≥ 9.3；浅端对比度 < 3:1，靠悬停和表格补偿 / Light ends rely on tooltip and table |
| L5 Card 流程 / Pipeline | 满足 / Met | 第 4 节 / Section 4 |
| L5 selection / filtering / arrangement / change mapping / navigation | 满足 / Met | 均已实现 / All implemented |
| L5 多视图联动 / Linked views | 满足 / Met | 1a↔1b 十字线；图 2↔3↔4 选中与时期 / Crosshair; selection and period |
| L5 details on demand | 满足 / Met | 提示含季度、占比、案件数、全省值 / Tooltip has quarter, share, cases, Ontario |
| L6 Martini glass / annotated chart | 满足 / Met | 叙事步骤 → Explore all → 开放探索 / Steps → explore |
| L6 contrast / juxtaposition / repetition | 满足 / Met | 2019 Q4 vs 2021 Q3；数量图与占比图并排；每个 CMA 一行同一编码 / As listed |
| L6 开头、中间、结尾 / Beginning, middle, end | 满足 / Met | 定义 → 发现 → 结论卡片 / Definitions → findings → cards |
| L7 地图 / Maps | 不适用 / N/A (v1) | 第一版不做地图；不用 choropleth / No map in v1 |

### 9.3 数字复核 / Number recomputation
所有页面数字均由 `q3.js` 从 CSV 计算，另用 pandas 独立重算，结果一致：
Every number is computed by `q3.js` from the CSV and was recomputed independently in pandas with matching results:

| 数字 / Figure | 值 / Value | 方法 / Method |
| --- | --- | --- |
| 全省长期占比 2026 Q1 | 50.1% | moa19 / cases |
| 峰值 / Peak | 72.9%，2021 Q3 | max over 93 quarters |
| 最低 / Minimum | 27.6%，2009 Q2 | min over 93 quarters |
| 2019 Q4 | 55.2%；长期 130,096；总量 235,501* | 同上 / as above |
| 2021 Q3 | 长期 130,444；总量 178,872 | |
| 峰后最低 / Post-peak low | 45.1%，2024 Q4 | min after 2021 Q3 |
| 2026 Q1 总量与长期 | 291,970；146,242（全序列最多）| |
| 2026 Q1 CMA 最高/最低 | Peterborough 58.0%；Barrie 44.2% | |
| 疫情后（2023 Q2–2026 Q1）前三、后二 | Peterborough 59.0、Thunder Bay 54.6、Kingston 53.5；Toronto 44.6、Barrie 43.1；全省 46.9 | Σmoa19 / Σcases per CMA |
| 疫情期（2020 Q1–2023 Q1）前三 | Oshawa 65.4、Peterborough 64.6、Kitchener–Cambridge–Waterloo 64.2；全省 59.0 | pooled |
| ≥ 90% 季度低于全省 | Barrie 100%、Guelph 93.5%、Brantford 90.3% | share of quarters with dev < 0 |
| 排名变化最大 | Toronto：疫情前第 1，疫情后第 14 | pooled share rank, pre vs post |
| 三个时期均高于全省 | Peterborough、Oshawa | pooled share > Ontario pooled share |

\* 原值 235,500.5；JavaScript 四舍五入为 235,501，Python 的银行家舍入为 235,500。/ Raw value 235,500.5, rounded half-up in JS.

### 9.4 常见错误检查 / Anti-pattern check
双纵轴：无。彩虹色阶：无。3D：无。饼图/环形图：无。柱状图截断：不用柱状图；点图轴范围已注明随时期缩放。仅靠颜色区分类别：CMA 用行名或直接标签，时长档有图例和端点标签。每个点都标数字：无，只标叙事端点。因果或政策措辞：无（见第 7 节）。
Dual axis: none. Rainbow: none. 3D: none. Pie/donut: none. Truncated bars: no bars; the dot-plot axis states that it rescales. Colour-only identity: CMAs are labelled by row or direct label; bands have a legend and end labels. A number on every point: no. Causal or policy wording: none.

### 9.5 渲染检查 / Rendering check
截图见 [screenshots/](screenshots/)：桌面 1360px 浅色/深色、手机 400px 浅色/深色、交互状态（占比模式 + 仅 19+、疫情期、Toronto、完整构成）浅色/深色。
- 控制台：无 JavaScript 错误（只有 Edge 对 CDN 的跟踪保护提示）。
- 400px 宽度：页面 `scrollWidth` = 385，无横向溢出；热力图在自己的横向滚动容器内（最小宽 760px）。
- 已修复：图 4 构成视图中全省线在深色带上看不见（加了表面色描边）；图 3 表头与刻度重叠；图 2 "Pandemic" 标签拥挤。
- 未解决：手机上热力图需要横向滚动，行名列占用较宽；第一版可接受。
- Console: no JS errors. 400px: no horizontal overflow; the heatmap scrolls inside its own container. Fixed: invisible Ontario line on dark bands, a header/tick overlap, a crowded label. Open: the heatmap needs horizontal scrolling on phones.

### 9.6 受众检查 / Audience check
站在 MCCSS 分析员的角度 / From an MCCSS analyst's point of view:
1. **能判断 / Can conclude**：2021 年长期占比的峰值来自总案件数下降而长期案件数基本不变；Barrie、Guelph、Brantford 几乎一直低于全省，Peterborough 近年最高，而 Toronto 的排名在疫情前后变化很大，单一季度的排名不能当作稳定结论。
2. **能做 / Can do**：选出值得深入调查的地区（例如三个时期都高于全省的 Peterborough 和 Oshawa），并把具体视图链接放进简报。
3. **不能判断 / Cannot conclude**：为什么案件数变化、新案件会持续多久、地方政策是否有效、各地需求高低，因为这里只有在册案件的构成。

## 10. 待小组决定的问题 / Open questions for the group

1. **网站框架**：原生 D3 还是 React？本原型可直接迁移，但需要统一。/ Framework: native D3 or React?
2. **全站配色**：本原型用中性表面色 + 蓝色系，需与 `sta313-project-web` 最终选定的配色方案对齐。/ Align with the site palette.
3. **发散色阶**：绿 ↔ 紫是否被组员接受？Q2 的"差距"图是否也用同一套，避免同一网站两套发散色？/ Accept green↔purple, and share it with Q2?
4. **疫情期在热力图上用竖线**，其他图用背景带：是否接受这个例外？/ Accept the vertical-rule exception?
5. **是否加地图**：如果加，建议比例符号或 tile grid，不用 choropleth；边界数据已在 `datasets/EXTERNAL/CMA-BOUNDARIES/`。/ Add a map?
6. **研究问题措辞**："duration … changed" 建议改为 "How has the duration *composition* of the OW caseload changed"，避免读成"人们领取时间变长"。/ Reword the question.
7. **开发分工**（R16）和 `report.pdf` 中 Q3 的篇幅分配。/ Division of labour and report space.
8. **全省 `cases` 带小数的原因**仍未核实。/ Why Ontario `cases` have decimals is unverified.
