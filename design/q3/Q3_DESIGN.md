# Q3 设计说明：OW 受助时长与地区差异 / Q3 Design Rationale: OW Assistance Duration and Regional Differences

状态：可运行原型 v2，2026-11-12。v2 只改了图 2：热力图换成比例符号地图 + 悬停分析卡片，其余视图沿用 v1。网站文字为英文；本说明中英双语。
Status: working prototype v2, 2026-11-12. v2 changes only Figure 2: the heatmap is replaced by a proportional-symbol map with a hover analysis card; all other views are kept from v1. Website copy is in English; this document is bilingual.

- 原型 / Prototype: [prototype/index.html](prototype/index.html)（运行方法见 [README](README.md) / see the README to run it）
- 截图 / Screenshots: [screenshots/](screenshots/)
- 研究问题 / Research question: *How has the duration of Ontario Works (OW) cases changed over time, and which metropolitan areas have the highest shares of long-term cases?*

---

## 0. 要求清单 / Requirements checklist

来源：附件 *Project*（课程项目页）与 *Project mock design*（作业页）。设计和第 9 节自检都以此为准。
Sources: the attached *Project* page and *Project mock design* page. The design and the self-check in Section 9 are measured against this list.

| # | 要求 / Requirement | 来源 / Source |
| --- | --- | --- |
| R1 | 数据可视化是核心 / Data visualization is the central component | Project |
| R2 | 用交互支持探索 / Interactivity supports exploration | Project |
| R3 | 以交互网页形式在线发布 / Deployed online as an interactive web page | Project |
| R4 | 自包含：不读报告也知道怎么用 / Self-contained | Project |
| R5 | 至少一份课程数据作为主数据 / At least one course dataset as main data | Project |
| R6 | 只面向一个主要受众，目标清晰 / One primary audience with clear goals | Project |
| R7 | 编码在感知和语义上都合理 / Perceptually and semantically meaningful encodings | Mock rubric, Illustrations (4) |
| R8 | 交互分析能力丰富 / Rich analytical capability across views and questions | Mock rubric |
| R9 | 清楚、可自行导航 / Clear, self-explanatory navigation | Mock rubric |
| R10 | 有创意，超越默认图表 / Creative beyond default charts | Mock rubric |
| R11 | 文字清楚简洁 / Clear and concise writing | Mock rubric, Description (5) |
| R12 | 设计理由深入，"解释每一个像素" / Rationale in depth, every pixel | Mock rubric |
| R13 | 交互设计深入讨论 / Interaction design discussed in depth | Mock rubric |
| R14 | 使用课堂词汇 / Uses lecture vocabulary | Mock rubric |
| R15 | 视图、数据与主题和受众对齐 / Aligned with topic and audience | Mock rubric |
| R16 | 开发计划：技术与分工 / Development plan: technology and division of labour | Mock rubric |
| R17 | 报告格式：封面、插图 1–3 页、说明 1–2 页、开发计划 1 页，`report.pdf` / Report format | Mock page |
| R18 | 贡献报告 `contribution.pdf` / Contribution report | Mock page |
| R19 | 严重拼写语法错误最多扣 50% / Spelling and grammar penalty | Mock page |
| R20 | 截止：Mock 11 月 19 日；最终作品 12 月 7 日 / Deadlines | Project |

**附件与 Prompt 的张力 / Tension between the attachments and the prompts**
1. `report.pdf` 插图 1–3 页、说明 1–2 页，三个问题共用；本文件是工作底稿，Q3 写进报告时要压缩到约 1 页图 + 1/3 页文字。/ The report allows 1–3 pages of figures and 1–2 pages of text for all three questions; Q3 must be condensed to about one page of figures and a third of a page of text.
2. 只拿到了 L1–L3 讲义 PDF；L4–L7 的原则按 Prompt 描述应用，未对照原讲义核实。/ Only L1–L3 decks were attached; L4–L7 principles follow the prompts' descriptions and were not checked against the decks.
3. 课程页列出了 CMA 边界数据（Shapefile），v2 用的就是这份数据（已转换为 GeoJSON，见 `datasets/EXTERNAL/CMA-BOUNDARIES/`）。/ The course page lists the CMA boundary data; v2 uses those boundaries (converted to GeoJSON).

---

## 1. 数据抽象 / Data abstraction (L2)

| 属性 / Attribute | 类型 / Type | 说明 / Notes |
| --- | --- | --- |
| 季度 / Quarter | 有序、数量型（时间）/ Ordered, quantitative | 2003 Q1 – 2026 Q1，93 个 / 93 quarters |
| CMA | 类别，**带空间位置** / Categorical **with a spatial position** | 15 个；位置取 2021 年边界的质心 / 15; position = centroid of the 2021 boundary |
| 时长档 / Duration band | 有序 / Ordinal | 0–4、5–12、13–18、19+ 个月 |
| `cases`、`moa*` | 数量型计数 / Quantitative counts | 案件，不是人数 / cases, not people |
| 疫情阶段 / Pandemic phase | 有序类别 / Ordered categorical | pre / during / post（during = 2020-03 至 2023-05） |

**派生数据 / Derived data**（L2 "Don't necessarily draw what you're given"）：
- 长期占比 / Long-term share = `moa19 / cases × 100`
- 时期加权占比 / Pooled period share = Σ`moa19` ÷ Σ`cases`（时期内所有季度；按案件数加权）
- 与全省之差 / Difference from Ontario = CMA 时期占比 − 全省同期占比（pp）
- 差值分级 / Difference class（5 级，见 §4.2）
- 时期排名 / Rank among 15 CMAs（1 = 最高）
- 时期平均案件数 / Average OW cases in the period（决定圆面积）
- 高于全省的季度数 / Quarters above Ontario（93 个季度中 `dev > 0` 的个数）
- 三个时期的差值和排名 / Difference and rank before, during and after the pandemic

数据检查（已复核）：两个 CSV 无缺失；CMA 四档之和逐行等于 `cases`；15 个 CMA 之和不等于全省；15 个 `cma_code` 与边界文件完全对应（页面加载时检查，缺失会在控制台报错）。
Checks: no missing values; bands sum to `cases` in every CMA row; CMAs do not sum to Ontario; all 15 `cma_code` values match the boundary file (checked on load).

## 2. 任务抽象 / Task abstraction (L2)

| 受众问题 / Analyst question | 任务 / Task | 视图 / View |
| --- | --- | --- |
| 全省时长构成如何变化？/ How did Ontario's mix change? | Characterize distribution; Identify trend | 图 1a |
| 长期占比何时最高？/ When was the share highest? | Find extremum; Find anomalies | 图 1a + 1b + 叙事 |
| 某个 CMA 在哪里？/ Where is a CMA? | **Locate** | 图 2a 地图 |
| 哪些地区高于或低于全省？有无地理规律？/ Which areas are above or below Ontario; any geographic pattern? | **Compare; Identify spatial pattern** | 图 2a |
| 选中地区的具体情况 / Details for one area | **Retrieve value; details on demand** | 图 2b 卡片 |
| 高低是否持久？/ Does the gap persist? | Identify trend; Compare across periods | 图 2b 小图和时期条；地图下方结论 |
| 精确排名 / Exact ranking | Sort; Find extremum | 图 3 |
| 长期走势 / Long-run trajectory | Identify trend; Compare | 图 4 |

## 3. 页面结构 / Page structure (L6: martini glass)

1. 标题与导语（take-home message，由 CSV 计算）/ Headline and computed lead.
2. "Read this first" 四个定义 / Four definitions.
3. **第 1 步 全省（杯颈，引导式）**：三个叙事步骤 + 图 1a/1b。/ Step 1, guided (the stem).
4. **第 2 步 地区（杯口，开放探索）**：共用的时期选择器 → 图 2a 地图 + 图 2b 卡片 → 地图下方结论 → 图 3、图 4。/ Step 2, open exploration (the bowl).
5. **第 3 步 结论边界**。/ Step 3, takeaways and limits.

## 4. 各视图 / Views

图 1a、1b、3、4 和叙事步骤与 v1 相同，理由见 §4.4 的简要回顾；v2 只在图 3、图 4 上加了联动高亮。
Figures 1a, 1b, 3, 4 and the story steps are unchanged from v1 (summary in §4.4); v2 only adds linked highlighting to Figures 3 and 4.

### 4.1 第 2 步共用的时期选择器 / Shared period selector for Step 2
- 五个预设按钮（Latest quarter / After pandemic / Pandemic / Before pandemic / All years）+ 全省长期占比小面积图上的 `d3.brushX` 刷选，吸附到季度。v1 的刷选在热力图顶部，v2 移到地图上方，成为整个第 2 步的时期选择器。
  Five presets plus a quarter-snapping brush on a small Ontario area chart; moved from the top of the old heatmap to above the map so it drives all of Step 2.
- 刷选结果若正好等于某个预设，按钮自动点亮；否则显示 "Selected: 2015 Q1 – 2019 Q3 · 19 quarters"。
- 切换时期：地图颜色、圆面积和位置以 300 ms 过渡（`prefers-reduced-motion` 时为 0），图 2b、图 3、图 4、地图下方结论和第 3 步卡片同时更新。
- Card 流程 / Pipeline：改变 **data transformation** 层（筛选季度、重新汇总）。属于 **filtering** + **navigation**（在时间轴上移动视窗）。

### 4.2 图 2a：比例符号地图 / Figure 2a: proportional-symbol map
- **任务**：locate、compare（与全省）、发现地理分布规律、选择要细看的地区。精确排名交给图 3，走势交给图 4。
- **标记 / Marks**：每个 CMA 一个圆（point mark），放在其 2021 年边界的质心。
- **通道 / Channels**（L3，两个可分离通道 / separable channels）：
  - **面积** = 所选时期平均 OW 案件数。`d3.scaleSqrt`，按面积缩放（不是半径）；值域固定为全部季度的最大案件数（130,393），所以切换时期时大小可比。右下角 3 个参考圆：2,000 / 10,000 / 100,000，标签至少相隔 11 px。Toronto 约 12 万件，圆很大；Guelph 约 2 千件，圆很小。分析员可以直接看出小地区为什么波动大。
  - **颜色** = 时期加权长期占比 − 全省同期占比（pp），**5 级发散色阶**，中点中性灰。颜色只负责"方向 + 粗略大小"；精确值在卡片里和图 3 中用位置读。
- **分级阈值 / Class thresholds**：≤ −6、−6 至 −2、±2 以内、+2 至 +6、≥ +6 pp。理由：±2 是 Prompt 规定的"接近"带（覆盖 39% 的时期 × CMA 值）；在 5 个预设时期 × 15 个 CMA 共 75 个差值中，|差值| 中位数 2.6、第 75 百分位 5.2、第 90 百分位 7.3，6 pp 约在第 83 百分位，使外侧两级只收"明显"的差距，同时各时期的外侧级大多不为空（各时期分布见 §9.3）。约 50% 的占比上，6 pp 相当于约 12% 的相对差距。分级用四舍五入到 0.1 后的值，保证颜色与卡片中显示的数字一致。
  Thresholds ±2 and ±6 pp: ±2 is the prescribed neutral band (39% of values); 6 pp is about the 83rd percentile of |difference| over 75 period × CMA values, so outer classes hold only clear gaps while staying populated. Classes use the value rounded to 0.1 so colours match the printed numbers.
- **颜色选择 / Palette**：青绿（低于全省）↔ 紫（高于全省），中点灰。见 §5。
- **底图 / Base**：安省陆地浅色 + 发丝线；CMA 多边形只作浅灰底图，**不按数据填色**。
- **构图 / Framing**：主图聚焦南部（经度 −84.9 至 −74.5，纬度 41.75 至 47.35，含 Sudbury）。投影 `d3.geoConicConformal`（Lambert 等角圆锥，标准纬线 43° 和 46.5°，中央经线 −79.7°），`fitWidth` 后按边界高度定 SVG 高度；边界框沿边加密取点，因为圆锥投影下纬线是弧线。
- **Thunder Bay 插图 / Inset**：整个安省的小图（同一投影族，标准纬线 44°/52°），用方框标出主图范围，Thunder Bay 的圆用**同样的颜色和面积比例**；注明"≈ 900 km NW of Toronto"（两地 CMA 质心的大圆距离，页面计算）。宽屏放在主图左上角（休伦湖以北的空白区），窄屏（< 560 px）和尺寸图例一起移到地图下方的一条带里，避免压住南部。
- **避让 / Overlap**：南部 14 个圆用 `d3.forceSimulation`：`forceX`/`forceY` 拉回真实位置（强度 0.45），`forceCollide`（半径 + 2.5 px），固定随机种子（`d3.randomLcg(42)`）保证每次相同。移动超过 max(3 px, 0.35r) 的圆画一条细引线和一个小点指向真实中心。**实测**：因为按面积缩放后小 CMA 的圆很小，实际重叠很轻，最大位移只有 0–4.5 px（见 §9.5），所以引线很少出现。地图说明如实写成 "nudged apart (a few pixels at most)"。
- **标签 / Labels**：15 个都有，用文字颜色（不用符号颜色），带表面色描边。简称：Ottawa、Niagara、Kitchener–Waterloo、Sudbury，其余用全名；全名在卡片、图 3 和 aria-label 中。贪心放置：12 个方向 × 6 个距离，取第一个不与任何圆、已放标签、插图、尺寸图例和地图边缘冲突的位置；距离较远时加一条淡引线。页面把冲突数写入 `data-label-overlaps`，自检时读取（5 个时期 × 3 种宽度均为 0）。
- **交互**：
  - 悬停、键盘聚焦或手机点按一个圆 → 图 2b 显示该 CMA；同时在图 3 高亮对应行、图 4 加深对应灰线（**linked highlighting**，只改 view 层的样式，不重绘）。
  - 点击或 Enter/空格 → 设为选中 CMA（**selection**），图 3、图 4、卡片更新。
  - 反向：悬停图 3 的行，地图上对应的圆加粗描边。
  - 选中的圆：3 px 文字色描边 + 标签加粗；悬停的圆：2.5 px 描边。其余不变（**popout**，只用一个强通道）。
  - 可访问性：每个圆有 ≥ 24 px 的透明点击圈（实测最小 24 px），`tabindex=0`、`role=button`、`aria-pressed`；Tab 顺序从西到东（Thunder Bay、Windsor、London……Ottawa）；`aria-label` 例："Peterborough: long-term share 59.0%, +12.1 pp above Ontario after the pandemic (2023 Q2 – 2026 Q1); rank 1 of 15; average 2,766 OW cases."
- **地图说明（页面原文）**：*"One circle per CMA at the centre of its 2021 Census boundary. Where two circles would overlap they are nudged apart (a few pixels at most); if a circle moves noticeably, a thin line leads back to its true centre. Grey shapes are CMA boundaries (2021 Census), shown for location only: they do not reflect each year's reporting geography. Thunder Bay is shown in the inset."*

### 4.3 图 2b：悬停分析卡片 / Figure 2b: hover analysis card
- 位置：桌面在地图右侧的固定面板（不浮在地图上，不挡数据）；窄屏在地图下方。无悬停时显示选中的 CMA，从不为空。顶部标明 "Figure 2b · Selected CMA" 或 "Figure 2b · Preview · click the circle to select"。
- 内容全部实时计算 / All computed live：
  1. 名称、所选时期。
  2. 长期占比、全省同期值、差值（带正负号 pp，旁边是同一色阶的色点）、15 个 CMA 中的排名、平均案件数；平均案件数 < 3,000 时提示 "Small CMA: its share moves more from quarter to quarter…"。
  3. **差值小图**：93 个季度的"该 CMA − 全省"折线，0 线为参考，高于 0 的部分填浅紫、低于 0 的填浅青绿（与地图同色同义，L4-1 similarity）；纵轴固定为 ±20 pp（全部季度最大 |差值| 16.3 向上取整到 5），15 个地区可比（repetition）；所选时期用全站统一的半透明框，疫情期用灰带。**这一项代替了 v1 热力图中这一行的信息，但用位置编码**。
  4. **三个时期对比**：疫情前、中、后的差值条（从 0 线出发，横轴固定 ±14 pp）+ 排名；条形颜色用同一色阶；与所选时期相同的一行加框。这是 L6 的 **contrast**。
  5. "Above Ontario in N of 93 quarters"。
  6. 自动生成的描述句，用与颜色**相同的三组**（高于 / 接近 / 低于，阈值 ±2 pp），所以文字和颜色一致，例如：*"Close to Ontario before the pandemic, above it during and after; highest of the 15 CMAs after the pandemic."*（Peterborough）、*"Above Ontario before the pandemic, close to it during, below it after; among the three lowest after the pandemic."*（Toronto）。句子只描述数据，没有原因、政策或个人概率的措辞。

### 4.4 地图下方的结论 / Annotated takeaway under the map (L6)
不用悬停也能看到"是否持久"的答案（页面原文，由数据生成）：
*"**Above Ontario in all three periods:** Peterborough (smallest margin +0.4 pp) and Oshawa (smallest margin +0.1 pp); a margin under 2 pp is within the grey band, so this is a weak pattern. **Below Ontario in at least 90% of quarters:** Barrie (93 of 93), Guelph (87 of 93) and Brantford (84 of 93). After the pandemic, 11 of 15 CMAs were above Ontario."*
- 名字是按钮：悬停或聚焦 → 地图高亮对应圆、卡片预览；点击 → 选中。
- 为什么写出最小差距：复核数字时发现"三个时期都高于全省"的两个 CMA 在某个时期只高 0.1–0.4 pp，落在灰色"接近"带里。v2 初稿的标题"Persistently higher"会夸大这个结论，已改成字面事实并标注它是弱规律。相反，"至少 90% 的季度低于全省"是强规律。
  Why margins are printed: the two "above in all three periods" CMAs clear Ontario by only 0.1–0.4 pp in one period, inside the grey band, so the earlier label "Persistently higher" overstated it.

### 4.5 保留的视图（简要）/ Kept views (summary)
- **图 1a**：堆叠面积，单色相亮度区分有序时长档，19+ 贴基线（只有基线层能按共同尺度读）；数量/占比切换（change mapping）；图例可把任一档移到基线（filtering）；与 1b 联动十字线。
- **图 1b**：全省长期占比折线，与 1a 共轴对齐；只标叙事端点。
- **叙事步骤**：2009–2019、2019–2021（数量 vs 占比的 contrast）、2021–2026；全部由数据生成，不提政策原因。
- **图 3**：时期排序点图 + 最低–最高季度区间线 + 全省参考线；轴随时期缩放；排序可切换；表格视图。v2 新增：悬停行 → 地图和图 4 联动高亮。
- **图 4**：选中 CMA 粗线 + 全省 + 其余 14 条灰线；或完整构成堆叠图。v2 新增：在地图或图 3 悬停的 CMA，对应灰线加深并置顶。

## 5. 颜色与全站一致性 / Colour and cross-site consistency

- 全站约定不变：OW = 蓝，ODSP = 橙；Q3 时长四档用蓝色深浅。
- **v2 发散色阶：青绿（低于全省）↔ 紫（高于全省），中点灰**。

| 主题 / Theme | 6+ 低 | 2–6 低 | ±2 | 2–6 高 | 6+ 高 |
| --- | --- | --- | --- | --- | --- |
| 浅色 / Light | `#0b6e68` | `#56b8aa` | `#e3e1da` | `#a585d6` | `#5e2f94` |
| 深色 / Dark | `#7ad6c7` | `#2a7a71` | `#46453f` | `#7a58b6` | `#c2a2f0` |

- **为什么不再用绿 ↔ 紫**：绿色容易被读成"好"，而长期占比低并不代表好。青绿偏蓝，好坏含义弱于纯绿；但它仍是蓝绿色，这个风险没有完全消除（见 §10）。
- **为什么不用 Prompt 建议之外的其他组合**：
  - 紫红 ↔ 青绿：实测在第二色盲（deutan）下两端几乎重合（弱级 CVD ΔE 4.5），放弃。
  - 赭/金 ↔ 紫：色盲区分最好，但金色接近 ODSP 橙（CVD ΔE 6.5–7.7），也像"警告"状态色，放弃。
- **验证结果**（`validate_palette.js`，OKLab ΔE×100，Machado 2009 模拟）：

| 检查 / Check | 浅色 / Light | 深色 / Dark |
| --- | --- | --- |
| 两端镜像（强级）CVD / 正常视力 | 14.1 / 21.5 | 9.6 / 18.4 |
| 两端镜像（弱级）CVD / 正常视力 | 10.0 / 19.0 | 11.5 / 18.9 |
| 相邻级最差 CVD / 正常视力 | 15.5 / 21.2 | 13.8 / 16.0 |
| 与 ODSP 橙最差 正常视力 | 22.8 | 25.6 |
| 与 OW 蓝（`#2a78d6`/`#3987e5`）最差 CVD / 正常视力 | 7.4 / 15.6 | 8.6 / 14.0 |
| 与 OW 最浅蓝（19+ 以外的浅档）最差 正常视力 | 11.9 | 10.1 |

  相邻级和镜像级都达到 CVD ≥ 8、正常视力 ≥ 15 的目标。与 OW 蓝色系的距离有几项低于 15：这些颜色从不出现在同一张图里（地图上没有蓝色，小图的折线用中性墨色），而且每个圆都有图例、卡片数值、表格和 aria-label 作补偿。浅色主题中灰色中点和两个弱级对背景对比度 < 3:1（1.27–2.95），所以所有圆都加了 1 px 深色描边。
  Adjacent and mirrored steps meet the CVD ≥ 8 and normal ≥ 15 targets. Some distances to the OW blues fall below 15; those colours never share a chart, and legend, card values, table and aria-labels provide relief. Light-mode neutral and weak steps are below 3:1 against the surface, so every circle has a 1 px dark outline.
- 同一套颜色用于：地图圆、地图图例、卡片差值色点、差值小图的正负填色、三时期条形。颜色在 JS 中从 CSS 变量读取（切换主题时重绘），保证一致。
- 疫情期统一用浅灰带；所选时期在时期选择器、卡片小图、三时期条形、图 4 中用同一种半透明框（enclosure）。

## 6. 考虑过但放弃的方案 / Alternatives considered and rejected

| 方案 / Alternative | 放弃原因 / Why rejected |
| --- | --- |
| **v1 图 2：CMA × 季度热力图（15 × 93 = 1,395 格）** / **v1 heatmap** | ① 地区差异只能靠颜色读，而颜色是精度很低的通道（L3 effectiveness）；7 个色级 × 1,395 格，相邻颜色难以分辨（L3 discriminability）。② 小 CMA 每季都在跳，格子像噪点，"是否持续偏高"反而读不出来。③ 行按所选时期排序，画面却显示全部 93 个季度，排序依据和画面范围对不上。④ 手机上必须横向滚动。⑤ 绿色容易被读成"好"，但长期占比低不代表好。/ Colour-only reading of 1,395 cells; noisy small CMAs; sort basis ≠ displayed range; horizontal scrolling on phones; green reads as "good". |
| 全省单幅地图 / One full-province map | 14 个 CMA 挤在南部约 1/10 的画面里，Thunder Bay 独占西北，大部分画面是空的；改为南部主图 + 插图。/ 14 CMAs crowd a tenth of the frame; replaced by a southern main map plus an inset. |
| 按 CMA 多边形填色（choropleth）/ Choropleth | CMA 面积与案件数无关：Sudbury、Thunder Bay、Ottawa 面积大、案件少，会被过度强调，Guelph 几乎看不见（L7）。/ Area unrelated to caseload; large rural CMAs dominate. |
| 条形符号地图（glyph map，每个 CMA 一个小条形或小折线）/ Glyph map | 15 个小图挤在南部会互相重叠，单个小图太小读不出数值；把完整走势放进卡片小图更清楚。/ Glyphs overlap in the south and are too small to read; the card sparkline does this better. |
| Tile grid / Dorling 地图 / Tile grid or Dorling map | 去掉了真实地理位置，而 locate 是这张图的主要任务之一；分析员熟悉真实地图。/ Loses true position, which the locate task needs. |
| 圆按半径缩放 / Radius-scaled circles | 面积按平方增长，会把 Toronto 夸大约 60 倍；改为 `scaleSqrt` 面积缩放。/ Squares the visual difference. |
| 地图上直接用 7 级色阶 / 7 classes on the map | 只有 15 个符号，7 级会让多数级别只有 0–1 个圆；5 级足够区分方向和大小（L4-2）。/ Too many classes for 15 symbols. |
| 悬停时用浮动提示 / Floating tooltip on the map | 会挡住周围的圆（GTA 很密）；改为固定在旁边的卡片面板。/ Would cover neighbouring circles. |
| 紫红 ↔ 青绿；赭金 ↔ 紫 / Magenta↔teal; ochre↔violet | 见 §5：前者色盲下重合，后者接近 ODSP 橙。/ See §5. |
| 15 色折线、饼图、四档不同色相、19+ 在堆叠顶部、双纵轴、从 0 开始的排序柱、排名动画、彩虹色阶 | 同 v1：违反 discriminability / expressiveness / effectiveness，或制造虚假相关。/ As in v1. |

## 7. 网站文字与解释边界 / Website copy and interpretation boundaries

- 定义卡片、叙事步骤、第 3 步卡片沿用 v1（"These data do not show why the total fell." 等）。
- v2 新增文字：地图说明（§4.2）、结论条（§4.4）、卡片描述句（§4.3）、小地区提示。
- 页面**没有**出现：CERB、新申请减少、"people are staying on assistance longer"、任何因果或政策效果措辞。卡片描述句只有"above / close to / below Ontario"和排名两类描述。
- 地图局限写在页面上：边界为 2021 年人口普查 CMA，仅用于定位；不代表每年的统计口径。

## 8. 技术说明 / Technical notes

- 原生 HTML/CSS/JavaScript + D3 v7.9.0（cdnjs）。读取 `datasets/ONT-SA/selected/` 的两个 CSV 和 `datasets/EXTERNAL/CMA-BOUNDARIES/` 的两个 GeoJSON；所有数字由浏览器计算。
- **GeoJSON 环绕方向**：边界文件遵循 RFC 7946（外环逆时针），而 d3-geo 是球面几何，会把它理解为"除该多边形以外的整个地球"。页面加载时**逐个多边形**检查，面积大于半球的就反转（有的 MultiPolygon 混合了两种方向，所以不能整体反转）。
- 力导向布局使用固定随机种子，结果可复现；标签放置为确定性贪心算法。
- URL 状态：`theme`、`step`、`mode`、`iso`、`period`、`cma`、`detail`、`sort`，v2 新增 `from`/`to`（如 `from=2015Q1&to=2019Q4`）用于分享自定义刷选范围。
- 删除了只服务于热力图的代码（7 级色阶、热力图渲染、横向滚动样式）。
- 需要用 HTTP 服务器打开（`file://` 会阻止读取数据）。

## 9. 自检 / Self-check (v2)

### 9.1 对照评分要求 / Against the grading requirements

| 要求 / Requirement | 改版后的证据 / Evidence | 结果 / Result |
| --- | --- | --- |
| R1 可视化为核心 | 四组图 + 地图 + 卡片；文字只做定义和注释 | 满足 / Met |
| R2 交互支持探索 | 叙事步骤、数量/占比、图例筛选、时期按钮 + 刷选、地图悬停/点击/键盘、结论名字联动、图 3 排序与悬停、图 4 切换、表格 | 满足 / Met |
| R3 在线发布 | 可静态托管，**尚未部署** | 未满足 / Not yet (Dec 7) |
| R4 自包含 | 定义卡、第 2 步操作说明（"hover, tap or Tab…"）、地图说明、图例、卡片模式提示 | 满足 / Met；建议找组外同学试用 / test with a cold reader |
| R5 课程数据为主 | 课程 OW CSV 为全部数据来源；边界只用于定位 | 满足 / Met |
| R6 单一受众 | 全部任务对应 MCCSS 分析员（§2） | 满足 / Met |
| **R7 编码合理** | 地图：面积 = 规模（scaleSqrt）、颜色 = 方向和粗略大小，两个可分离通道；精确比较都放在位置通道（卡片小图、时期条、图 3）；色阶经工具验证（§5） | 满足 / Met |
| **R8 分析能力** | locate、compare、空间规律、details on demand、跨时期持久性、排名、走势都有对应视图（§2）；四个视图联动 | 满足 / Met |
| **R9 清楚可导航** | 编号步骤；第 2 步副标题说明三种操作；卡片标明 Preview / Selected；结论条不悬停也能读 | 基本满足 / Mostly met：第 2 步信息量大，第一次看需要时间 |
| **R10 创意** | 比例符号地图 + 同步的分析卡片（差值小图 + 三时期 contrast）+ 刷选驱动的联动 + 插图；比 v1 热力图更有分析深度 | 基本满足 / Mostly met：比例符号地图本身是常规地图形式，新意在于组合与联动，而非单个图形 |
| R11 文字清楚 | 网站英文已自查 | 基本满足 / Mostly met（报告需精简） |
| **R12 理由深入** | §4.2–4.4 逐通道、阈值、投影、插图、避让、标签、颜色；§6 十余个放弃方案；§5 验证数据 | 满足 / Met（需压缩进报告） |
| **R13 交互理由** | 每个交互对应 Card 流程层和 L5 方法（§4、§9.2） | 满足 / Met |
| **R14 课堂词汇** | effectiveness、expressiveness、discriminability、separability、popout、proximity、enclosure、connectedness、martini glass、contrast、repetition、details on demand、proportional symbol | 满足 / Met |
| R15 与主题和受众对齐 | 只用 OW；面向案件监测分析员 | 满足 / Met |
| R16 开发计划 | 技术已定；**分工未写** | 部分满足 / Partly met |
| R17 报告格式 | 本文件不是 `report.pdf` | 未开始 / Not started |
| R18 贡献报告 | 不在本任务范围 | 未开始 / Not started |
| R19 拼写语法 | 网站英文已通读 | 需最终校对 / final proofread |
| R20 截止 | Mock 11/19 | 进行中 / In progress |

### 9.2 课程原则检查点 / Lecture checkpoints

| 检查点 / Checkpoint | 结果 / Result | 理由 / Reason |
| --- | --- | --- |
| L2 数据抽象（CMA = 带空间位置的类别；差值、加权占比、高于全省季度数为派生数据） | 满足 / Met | §1 |
| L2 任务抽象（locate、compare、find extremum、identify trend、retrieve value） | 满足 / Met | §2，每项对应视图 |
| L3 重要比较用位置 | 满足 / Met | 卡片小图、时期条、图 3 都用共同尺度位置；地图颜色只负责方向和粗略大小 |
| L3 颜色与面积可分离 | 满足 / Met | 面积 = 规模，颜色 = 差值，两者语义独立，可分别关注 |
| L3 选中/悬停 popout | 满足 / Met | 只加粗描边（3 / 2.5 px），其余不变 |
| L4-1 proximity | 满足 / Met | 卡片紧挨地图；窄屏紧接其下 |
| L4-1 similarity | 满足 / Met | 同一色阶用于地图、图例、色点、小图填色、时期条 |
| L4-1 enclosure | 满足 / Met | 所选时期在选择器、小图、时期条、图 4 用同一种框 |
| L4-1 connectedness | 部分满足 / Partly met | 引线和小点已实现，但实际位移很小，引线很少出现（实测 0–4.5 px） |
| L4-2 发散色阶、灰色中点、无彩虹、≤ 5–7 级 | 满足 / Met | 5 级，中点灰 |
| L4-2 色盲安全并实测 | 基本满足 / Mostly met | 相邻级和镜像级全部达标；与 OW 蓝色系的距离部分 < 15（不同图），浅端对比度 < 3:1，用描边和数值补偿 |
| L5 Card 流程 | 满足 / Met | 时期 = data transformation；数量/占比 = visual mapping；悬停高亮 = view |
| L5 selection / filtering / navigation / linked views / details on demand | 满足 / Met | 点击选中；时期筛选；刷选导航；地图↔图 3↔图 4 联动；卡片 |
| L6 martini glass 杯口 | 满足 / Met | 第 2 步是开放探索 |
| L6 annotated chart | 满足 / Met | 地图下方由数据生成的结论条 |
| L6 contrast / repetition | 满足 / Met | 三时期对比；15 个地区同一套编码、小图同一纵轴 |
| L7 为什么不用 choropleth | 满足 / Met | §4.2、§6 |
| L7 为什么用比例符号、这个投影 | 满足 / Met | §4.2 |
| L7 重叠与远处的 Thunder Bay | 满足 / Met | 力导向避让 + 插图（同色同比例） |
| L7 地图局限（2021 边界） | 满足 / Met | 页面说明 + §7 |

### 9.3 数字复核 / Number recomputation
页面显示的每个地图和卡片数字都从 DOM 导出（5 个时期 × 15 个圆的 aria-label、15 张卡片、5 条结论、插图距离），再用 pandas 独立重算比对：**95 项，0 个不一致**。v1 的叙事和第 3 步数字沿用 v1 复核结果，代码未改。
Every map and card number was exported from the DOM and recomputed independently in pandas: **95 items, 0 mismatches**.

| 数字 / Figure | 值 / Value | 方法 / Method |
| --- | --- | --- |
| 疫情后（2023 Q2–2026 Q1）全省 | 46.9% | Σmoa19 ÷ Σcases |
| Peterborough 疫情后 | 59.0%，+12.1 pp，第 1，平均 2,766 件；三时期 +0.4 (#3) / +5.6 (#2) / +12.1 (#1)；93 季中 53 季高于全省 | 同上 / pooled |
| Toronto 疫情后 | 44.6%，−2.3 pp，第 14，平均 120,786 件；三时期 +3.7 (#1) / +1.6 (#4) / −2.3 (#14)；82 季高于全省 | 同上 |
| 三个时期都高于全省 | Peterborough（最小差距 +0.4 pp）、Oshawa（+0.1 pp） | 三个时期加权差值均 > 0 |
| ≥ 90% 季度低于全省 | Barrie 93/93、Guelph 87/93、Brantford 84/93 | 季度 dev < 0 的个数 |
| 疫情后高于全省的 CMA 数 | 11 / 15 | 加权差值 > 0 |
| 各时期 5 级分布（低→高） | latest 0/2/7/5/1；post 0/2/4/5/4；during 1/4/7/2/1；pre 4/4/5/2/0；all 2/4/7/2/0 | 四舍五入到 0.1 后分级 |
| 阈值依据 / Threshold basis | 75 个绝对差值：中位数 2.6，P75 5.2，P90 7.3；≤ 6 占 82.7%，≤ 2 占 38.7% | 5 个预设时期 × 15 CMA |
| 小图纵轴 / 时期条横轴 | ±20 pp / ±14 pp | 最大季度绝对差值 16.3 → 取整到 5；最大时期绝对差值 12.1 → 取整到 2 |
| 尺寸比例上限 | 130,393 件 | 全部季度最大 CMA 案件数 |
| Thunder Bay 与 Toronto | 页面 ≈ 900 km；pandas 901 km | CMA 质心大圆距离（页面四舍五入到 10 km） |

### 9.4 常见错误检查 / Anti-pattern check
- Choropleth：无（多边形只作底图）。彩虹色阶：无。双纵轴：无。
- 只靠颜色区分：地图有颜色图例和尺寸图例，15 个标签都在；卡片同时显示数值。
- 符号或标签重叠：5 个时期 × 3 种宽度（1360 / 820 / 400 px）实测 0 个冲突（含圆 vs 圆、标签 vs 标签、标签 vs 圆、标签 vs 插图/图例）。
- 圆按半径缩放：否，`scaleSqrt` 按面积。
- 因果或政策措辞：无（§7）。
- 悬停卡片挡住数据：否，卡片是旁边的固定面板；地图上没有浮动提示。

### 9.5 渲染检查 / Rendering check
用 Chrome DevTools Protocol 驱动无头 Edge（精确 400 px 视口、真实鼠标/键盘/触摸事件）：
- 截图：桌面 1360 px 浅色/深色、手机 400 px 浅色/深色、交互状态浅色/深色、**悬停 Toronto**、手机点按 Ottawa。
- 手机 400 px：页面 `scrollWidth − clientWidth = 0`，地图溢出 0，**页面和地图都不需要横向滚动**。
- 控制台：无错误（唯一的 404 是浏览器自动请求的 `/favicon.ico`，页面已加空图标）。
- 悬停 Toronto：卡片切换为 Toronto（Preview），图 3 的 Toronto 行和图 4 的 Toronto 线同时高亮；移开后回到 Peterborough。悬停图 3 的 Kingston 行，地图上 Kingston 高亮。
- 键盘：Tab 依次经过 15 个 CMA（西→东），卡片跟随焦点；Enter 选中 Ottawa–Gatineau，图 4 标题随之更新。
- 手机点按 Ottawa：卡片显示 Ottawa–Gatineau（Selected），位于地图下方。
- 刷选：在时间轴上拖动得到 2015 Q1 – 2019 Q3，地图、卡片、图 3 标题同步更新，预设按钮取消点亮；`from`/`to` URL 参数可复现。
- 最小点击区域 24 px；力导向最大位移 0–4.5 px。

### 9.6 受众检查 / Audience check
1. **能判断**：长期占比持续偏低的是 GTA 周边的三个较小 CMA（Barrie、Guelph、Brantford，至少 90% 的季度低于全省），这是强而持久的规律；"三个时期都偏高"（Peterborough、Oshawa）只是弱规律，因为某个时期只高 0.1–0.4 pp。/ Can conclude: Barrie, Guelph and Brantford are persistently below Ontario; "above in all three periods" is weak.
2. **能做**：在地图上定位任一 CMA，悬停查看它的差值走势和三时期排名，结合圆的大小判断小样本波动，再点选进入图 3、图 4 深入，并用 URL 分享具体视图。/ Can do: locate, inspect, weigh small-sample noise, drill down, share a view.
3. **不能判断**：地区差异的原因、地方政策是否有效、各地需求高低（这里只有在册案件的构成，不是人口比率）；地图上的距离和边界也不代表统计口径随年份的变化。/ Cannot conclude causes, policy effects or need.

## 10. 待小组决定的问题 / Open questions for the group

1. **网站框架**：原生 D3 还是 React？/ Native D3 or React?
2. **全站配色**：中性表面色是否与 `sta313-project-web` 最终配色方案对齐？/ Align with the site palette.
3. **发散色阶**：青绿 ↔ 紫是否被接受？青绿仍偏绿色，是否会被读成"好"？Q2 的差距图是否用同一套？/ Accept teal↔violet; reuse in Q2?
4. **5 级阈值 ±2 / ±6 pp** 是否接受？/ Accept the thresholds?
5. **简称**：Ottawa、Niagara、Kitchener–Waterloo、Sudbury 是否可以？/ Accept the short names?
6. **插图**：窄屏时插图移到地图下方，是否接受？/ Accept the inset placement on phones?
7. **研究问题措辞**：建议改为 "How has the duration *composition* of the OW caseload changed…"。/ Reword the question.
8. **开发分工**（R16）与 `report.pdf` 中 Q3 的篇幅。/ Division of labour and report space.
9. **全省 `cases` 带小数**的原因仍未核实。/ Decimal Ontario `cases` still unverified.
