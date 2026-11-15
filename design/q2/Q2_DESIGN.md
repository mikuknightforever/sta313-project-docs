# Q2 设计说明：单人无子女案件占比与两个项目的差距（v1 候选 A–C）/ Q2 Design Rationale: Single-Person Shares and the OW–ODSP Gap (v1 candidates A–C)

状态：v1 = 三个可运行的候选版本，2026-11-13，待小组选择（tag `q2-v1`）。三个版本之间**没有重复的图表类型**（§7）。网站文字为英文；本说明中英双语。做法和质量标准以 Q3 v2（[design/q3/Q3_DESIGN.md](../q3/Q3_DESIGN.md)）和 Q1 候选（[design/q1/Q1_DESIGN.md](../q1/Q1_DESIGN.md)）为准。
Status: v1 = three runnable candidates, 2026-11-13, awaiting the group's choice. No chart type is repeated across the three (§7). Website copy is in English; this document is bilingual. Method and standards follow Q3 v2 and the Q1 candidates.

- 总览 / Overview: [index.html](index.html) · 运行方法 / Run: [README.md](README.md) · 参考 / References: [REFERENCES.md](REFERENCES.md)
- 研究问题 / Research question: *How have the shares of cases involving a single person without children changed over time in OW and ODSP across CMAs, and where has the gap between the two programs narrowed the most?*
- 受众 / Audience: MCCSS 负责社会援助案件监测和政策研究的政策分析员；任务：比较各 CMA 的单人无子女案件占比和两个项目差距的变化，找出值得进一步调查的地区。/ MCCSS policy analysts comparing shares and gap changes across CMAs to find areas worth investigating.
- 位置 / Place in the site: Part 2 of 3，介于 Q1（全省总量）和 Q3（OW 受助时长）之间。/ Between Part 1 (province-wide totals) and Part 3 (OW duration).

---

## 0. 要求清单与冲突 / Requirements and conflicts

R1–R20 沿用 [Q3_DESIGN.md 第 0 节](../q3/Q3_DESIGN.md)（由附件 *Project* 和 *Project mock design* 整理）。这次会话里没有重新收到附件原文，所以以 Q3 第 0 节的整理为准；L4–L7 的原则按 Prompt 的描述应用（与 Q3、Q1 相同的限制）。第 10.1 节逐个版本对照。
R1–R20 are taken from Q3_DESIGN.md §0. The attachments were not re-sent in this session, so the Q3 list is used as is; L4–L7 principles follow the prompt (the same limitation as Q3 and Q1). Section 10.1 checks each version.

**发现的冲突或张力 / Conflicts and tensions found**
1. **研究文档的可视化草案 vs 小组基线**：`research/RESEARCH_QUESTIONS.md` 第 4 节写的是"双折线图 + **排序柱状图**"；Prompt 说小组已定的基线是"**哑铃图**（起点差距 vs 终点差距，按缩小幅度排序）+ 选中地区的双折线"。A 按 Prompt 用哑铃图。哑铃图比柱状图多显示起点和终点两个水平（柱状图只显示缩小幅度一个数）。研究文档需要小组更新。/ The research draft says "ranked bar chart"; the prompt's baseline is a dumbbell. A follows the prompt; the research doc needs updating.
2. **研究文档的交互草案里有"选择援助项目"**：三个版本都不提供"只看 OW 或只看 ODSP"的筛选，因为问题本身是两个项目之间的关系，去掉一个项目就无法回答"差距"。列为待确认事项。/ The draft lists a program filter; none of the versions offers one, because the question is about the relationship between the two programs.
3. **差距的定义**：研究文档定义为"两者占比之差的**绝对值**"；Prompt 定义为 ODSP − OW。已核实 1,395 个 CMA-季度中 ODSP 占比全部高于 OW，两种定义的数值完全相同，所以没有冲突；页面写作 "ODSP share − OW share" 并说明"never reverses"。/ |ODSP − OW| equals ODSP − OW in all 1,395 CMA-quarters.
4. **R17 篇幅**：`report.pdf` 插图 1–3 页、说明 1–2 页，三个问题共用；三个候选不可能都进报告，小组必须先选。/ The report cannot carry three candidates.
5. **第二张地图**：Q3 已经有比例符号地图；C 是网格地图。两张地图编码不同（§6、§7），是否改成全站共用一个地图板块列为待决定问题（§11）。/ C would be the site's second map; open question.

## 1. 数据 / Data

| 文件 / File | 内容 / Content | 范围 / Coverage | 用于 / Used by |
| --- | --- | --- | --- |
| `ont-sa-characteristic-ow-cma.csv` | OW：`cases`、`fts`（单人无子女） | 15 个 CMA × 93 个季度（2003 Q1–2026 Q1），无缺失 | A B C |
| `ont-sa-characteristic-odsp-cma.csv` | ODSP：同上 | 同上 | A B C |
| `ont-sa-characteristic-ow-ont.csv`、`…-odsp-ont.csv` | 全省参考 / Ontario reference | 93 个季度 | A B C |
| `datasets/EXTERNAL/CMA-BOUNDARIES/` | 2021 年 CMA 边界 | 只用于排网格位置（质心），页面不加载 | 仅 C 的网格设计 / C's grid layout only |

数据检查（pandas，已复核）：OW 与 ODSP 按 `cma` + `date` 匹配得到 1,395 行；两个项目中 `fts + ftsp + ftc = cases` 每行成立，`fts` 与 `fs1` 完全相同。页面加载时也检查 15 个 CMA 的季度是否与全省一致，不一致会在控制台报错。
Checks: 1,395 matched rows; components sum to `cases` and `fts` = `fs1` in every row; the page also checks that every CMA has the same 93 quarters.

**已用 pandas 复核的事实 / Facts recomputed in pandas**（页面上的同一数字全部由 `shared/q2-common.js` 在浏览器里计算，见 §10.5）

| 事实 / Fact | 值 / Value |
| --- | --- |
| 全省 2003 Q1 → 2026 Q1 / Ontario | OW 占比 49.5% → 69.7%（+20.1 pp），ODSP 76.4% → 81.1%（+4.6 pp），差距 26.9 → 11.4 pp（缩小 15.5），92 个季度变化中 43 个扩大；分阶段缩小 9.5 / 2.5 / 3.5 |
| 15 个 CMA 是否全部缩小 / all narrowed? | 是，缩小 9.8–24.0 pp |
| 最多 / most | Oshawa 24.0（36.0 → 12.0），Hamilton 21.7（34.5 → 12.9），Brantford 21.1（31.4 → 10.3） |
| 最少 / least | Ottawa–Gatineau 9.8（24.6 → 14.8）；它也是 2026 Q1 差距最大的 CMA |
| 哪个项目在变 / which program | OW 占比上升 15.0–26.9 pp；ODSP 占比变化 −2.1 到 +8.2 pp；ODSP 下降的只有 Windsor（−2.1）和 Oshawa（−0.1）；ODSP 上升最多的 Kingston（+8.2），其 OW 上升 20.9 |
| 不是一直缩小 / not steady | 每个 CMA 的 92 个季度变化中有 36–46 个扩大（Thunder Bay 36；Guelph、St. Catharines–Niagara 46） |
| 分阶段 / by phase（2003 Q1 → 2019 Q4 → 2023 Q1 → 2026 Q1） | 15 个 CMA 都是疫情前缩小最多；疫情期间 Guelph（扩大 1.7）和 Thunder Bay（扩大 1.4）扩大；疫情后全部缩小 |
| 没有反转 / no reversal | ODSP 占比高于 OW：1,395 / 1,395 个 CMA-季度 |
| 极值 / extremes | 最大差距 Oshawa 2003 Q3 36.7 pp；最小 Peterborough 2026 Q1 9.1 pp |
| 小 CMA / small CMAs | 2026 Q1 OW 案件最少：Guelph 2,045、Thunder Bay 2,057、Brantford 2,606 |

各 CMA 全部数值（2003 Q1 → 2026 Q1）/ All CMAs:

| CMA | 差距 / Gap | 缩小 / Narrowed | ΔOW | ΔODSP | 扩大季度 / Widening quarters | 疫情前 / 中 / 后 |
| --- | --- | ---: | ---: | ---: | ---: | --- |
| Oshawa | 36.0 → 12.0 | 24.0 | +23.9 | −0.1 | 40 | 16.8 / 2.8 / 4.3 |
| Hamilton | 34.5 → 12.9 | 21.7 | +24.2 | +2.6 | 43 | 14.5 / 2.7 / 4.5 |
| Brantford | 31.4 → 10.3 | 21.1 | +26.9 | +5.8 | 39 | 15.0 / 1.2 / 4.9 |
| Windsor | 32.2 → 11.4 | 20.8 | +18.8 | −2.1 | 39 | 13.3 / 4.4 / 3.2 |
| Barrie | 30.3 → 9.9 | 20.4 | +24.7 | +4.3 | 42 | 16.1 / 1.4 / 2.9 |
| Thunder Bay | 32.4 → 12.8 | 19.7 | +23.7 | +4.1 | 36 | 16.1 / −1.4 / 5.0 |
| London | 30.2 → 12.0 | 18.2 | +20.3 | +2.1 | 44 | 11.3 / 3.9 / 3.0 |
| St. Catharines–Niagara | 28.4 → 11.7 | 16.7 | +22.1 | +5.4 | 46 | 15.4 / 0.2 / 1.1 |
| Peterborough | 25.8 → 9.1 | 16.7 | +20.9 | +4.3 | 39 | 12.2 / 1.0 / 3.4 |
| Kitchener–Cambridge–Waterloo | 29.4 → 12.7 | 16.7 | +19.1 | +2.4 | 41 | 9.8 / 2.6 / 4.2 |
| Toronto | 27.1 → 10.8 | 16.4 | +19.2 | +2.8 | 41 | 9.0 / 3.0 / 4.4 |
| Guelph | 26.3 → 11.6 | 14.8 | +19.7 | +5.0 | 46 | 9.6 / −1.7 / 6.9 |
| Greater Sudbury | 24.1 → 11.3 | 12.8 | +19.0 | +6.2 | 41 | 6.4 / 5.7 / 0.6 |
| Kingston | 23.8 → 11.2 | 12.7 | +20.9 | +8.2 | 45 | 10.5 / 1.1 / 1.1 |
| Ottawa–Gatineau | 24.6 → 14.8 | 9.8 | +15.0 | +5.2 | 45 | 4.8 / 0.7 / 4.3 |

St. Catharines–Niagara、Peterborough、Kitchener–Cambridge–Waterloo 一位小数都是 16.7，页面按未取整的值排序（16.75、16.70、16.67）。/ Three CMAs show 16.7; the page sorts on unrounded values.

## 2. 数据抽象与任务抽象 / Data and task abstraction (L1, L2)

| 属性 / Attribute | 类型 / Type |
| --- | --- |
| CMA | 类别，**带空间位置** / categorical **with a spatial position**（15 个；C 用 2021 年边界质心排网格） |
| 季度 / Quarter | 有序、数量型（时间）/ ordered, quantitative（93 个） |
| 项目（OW、ODSP）/ Program | 类别 / categorical（2 个） |
| `cases`、`fts` | 数量型计数（案件，不是人数）/ quantitative counts (cases, not people) |
| 疫情阶段 / Phase | 有序类别 / ordered categorical（before → during → after） |

**派生数据 / Derived data**（L2）：占比 = 100 × `fts` / `cases`（每个项目、CMA、季度）；差距 = ODSP 占比 − OW 占比（pp）；缩小幅度 = 起始差距 − 结束差距（起止季度由用户选择，默认 2003 Q1、2026 Q1）；两个项目的贡献：缩小幅度 = ΔOW − ΔODSP（B 的分解）；阶段分段：在 2019 Q4（疫情前最后一季）和 2023 Q1（疫情期最后一季）切开（C 的瀑布图）；扩大季度数（相邻季度差距增大的次数）；排名。

| 任务 / Task (L2) | 分析员的问题 / Analyst question | A | B | C |
| --- | --- | --- | --- | --- |
| Identify trend | 两个占比随时间怎么走？| 图 2 双折线 | 滑块 / Play 让箭头随时间伸长 | 图 1 每格逐年浮动柱 |
| Compare | 两个项目的差距在各 CMA 之间如何不同？| 图 1 共同尺度 | 图 1 到 45° 线的距离、图 2 | 图 1 柱长（共用纵轴） |
| Sort / Find extremum | 哪里缩小最多、最少？| 图 1 排序 + 注释 | 图 2 排序 + 注释 | 排名徽标、"Ranked"排列 |
| Compute derived value | 缩小了多少？哪个项目贡献？| 读数句 | 图 2 分解 | 瀑布图 + 提示 |
| Identify trend by period | 什么时候缩小、哪里扩大过？| 预设 "During" + 图 2 | 预设 + 图 2 中 0 左侧的刻度 | 图 2 瀑布台阶 |
| Locate | CMA 在哪里？| —（不需要）| — | 图 1 网格位置 |
| Retrieve value | 某季度的占比和案件数？| 悬停 / 表 1 | 悬停 / 表 1 | 悬停 / 表 1 |

## 3. 所有候选共用的决定与边界 / Shared decisions and boundaries

- **已定决定 / Settled decisions**：OW 蓝、ODSP 橙，全站一致；疫情期用与 Q1、Q3 相同的浅灰带；沿用全站 CSS 变量、字体、页面骨架（eyebrow、编号步骤、"Read this first"、结论卡片、Source 行）和交互习惯（分段按钮、悬停提示、主题切换）。**A 采用小组基线（哑铃图 + 双折线）；B、C 没有采用，页面顶部虚线框和本文件 §5、§6 写明原因。**
- **解释边界 / Interpretation limits**（三个版本相同，写在定义卡片和结论卡片里）：占比描述的是在册案件的家庭构成，不是当地单身人口领取援助的比例；差距缩小不代表需求趋同或政策见效，数据不能说明 OW 占比为什么上升；只说"结束时比开始时小"（"smaller at the end"），不说"一直缩小"，第 4 个叙事步骤专门说明"Smaller by the end does not mean smaller every quarter"；"没有反转"只表示每个 CMA 每个季度 ODSP 占比都高于 OW；案件不是人数；小 CMA 波动更大，所以每个悬停提示都显示分子和分母（例如 "960 of 1,447"），结论卡片点名案件最少的三个 CMA；不用价值判断，不写因果。
- **颜色 / Colour**（`validate_palette.js`）：OW / ODSP 与 Q1 完全相同，浅色 `#2a78d6`/`#eb6834`：CVD ΔE 24.7、正常视力 33.6、对背景均 ≥ 3:1；深色 `#3987e5`/`#d95926`：CVD 26.8、正常 31.8、均 ≥ 3:1。**差距一律用中性灰**（`--gap` 浅色 `#8a8880`、深色 `#8f8d85`）：它不是项目、也不是方向，所以不给色相。验证器对它报"chroma 低于类别色下限"，这是有意的（它本来就是灰色），对背景对比 ≥ 3:1，与 OW / ODSP 的 CVD ΔE ≥ 9.6。A 的差距带用中性斜线纹理，与纯色的疫情灰带区分。**没有使用任何发散色阶**：缩小 / 扩大一律用位置表达（A 的点左右、B 的 0 左右、C 的台阶上下），因此不会和 Q3 地图的青绿 ↔ 紫色冲突。
- **共用组件（不是图表）/ Shared components (not charts)**：四个叙事步骤 + Explore（L6 martini glass）、时期选择器（四个预设 + 起止季度下拉框）、读数句、表 1（全部 CMA 的精确值，也是可访问的表格视图，点击行即选择）、结论卡片、悬停提示。所有数字和叙事文字由 `shared/q2-common.js` 计算，三个版本说的是同一组事实。
- **触摸 / Touch**：点按 = 悬停 + 选择；触摸时提示不会在抬起手指时消失，点到图外或滑动页面才关闭（滚动锚定引起的 scroll 事件不会误关）。
- **共用代码 / Shared code**：`shared/q2.css` 从 Q1 复制（Q1 又是从 Q3 v2 复制），新增 `--gap`、`--gap-soft`、`--tile` 和几个组件样式；没有修改 Q1、Q3。
- **3D**：不用（Q1 D 已试过）。**饼图、双纵轴、彩虹色阶、choropleth**：不用。

## 4. 候选 A：排序哑铃图 + 联动双折线（小组基线）/ Candidate A: ranked dumbbell + linked lines (baseline)

- **Motivation**：问题的第二部分是排序任务，哑铃图把每个 CMA 的起点和终点差距放在同一条数量轴上（L3 position on a common scale），按缩小幅度排序后"最多 / 最少"一眼可见；第一部分由选中 CMA 的双折线回答（什么时候、哪个项目在变）。
- **Appeal**：所有实心点都在空心点左边，一句话就能复述；排好序的列表可以直接放进简报。
- **代价 / Cost**：最熟悉、创意分低；没有地理；哑铃只显示差距大小，看不出是哪个项目在动，必须看第二张图；图 2 的双折线与 Q1 A 是同一种图。
- **课程依据 / Course basis**：L2 派生数据（差距、缩小幅度）· L3 共同尺度位置、排序、popout · L4-1 proximity（两图并排）、connectedness（哑铃连线）、enclosure（选中行底色、疫情带）· L5 sort、selection、navigation、details on demand、linked views · L6 martini glass、annotated chart。
- **视图与编码 / Views and encodings**
  - **图 1 排序哑铃图**：每行一个 CMA（全省在最上方、用分隔线和斜体隔开，作参考）；横向位置 = 差距（pp，0–40，固定刻度，换时期时点会滑动而不会换尺度）；空心点 = 起始季度、实心点 = 结束季度（同一个量的两个时间，不用项目色）；灰色连线 = 两者之差。排序可选：缩小幅度（默认）/ 结束差距 / 名称（spatial arrangement）。只注释：缩小最多和最少的行、扩大的行（"widened 1.7"）、选中行的两个数值（selective labels）。
  - **图 2 双折线 + 差距纹理**：横 = 时间，纵 = 占比（%，所有 CMA 共用同一纵轴，换地区可比）；蓝线 = OW，橙线 = ODSP，图例 + 右端直接标签（不只靠颜色）；两线之间是中性斜线纹理（Bostock 的 difference chart 思路）；所选时期的起止季度用虚线竖线 + 墨色括线标出，并写上 "start gap 36.0 pp" / "end gap 12.0 pp"（标签自动避让、出界时换边）。下方读数句给出 ΔOW、ΔODSP、缩小幅度、"mostly through the OW share"、扩大季度数。
- **交互（Card 流程）/ Interactions**：叙事步骤 = 一次设置时期、选中地区和高亮集合（**view** 层强调 + 文字）；时期预设和起止下拉框 = **filtering / navigation**（**data transformation** 层：重新计算差距和排序），点平滑移动 450 ms；排序 = **spatial arrangement**（**visual mapping** 层：行的位置），行以动画重排；点击行（或键盘 Enter）= **selection**，联动图 2 和表 1（**linked views**），焦点留在原行；悬停行 = **details on demand**（两个占比的起止值、差距、缩小幅度、扩大季度数、结束季度的案件数）；悬停图 2 = 十字线 + 当季占比（含分子 / 分母）+ 与上一季相比扩大还是缩小。
- **放弃的方案 / Rejected**：研究草案的排序柱状图（只显示一个数，丢掉起止水平）；把两个点涂成 OW / ODSP 色（两个点是时间不是项目，会误导）；在每行写出数值（anti-pattern，数值放到表 1）；双折线上叠加全省线（4 条线太乱，全省作为图 1 第一行可直接选中）；15 个 CMA 的 30 条线叠在一起（discriminability）。

## 5. 候选 B：占比空间里的彗星图 + 分解条形图 / Candidate B: comets in share space + decomposition bars

- **没有采用基线的原因 / Why not the baseline**（页面上同样写明）："This version does not use the agreed dumbbell baseline, because a dumbbell shows only the size of the gap; it cannot show whether the OW share rose or the ODSP share fell." 排名保留在图 2。
- **Motivation**：差距缩小可以发生在 OW 占比上升时，也可以发生在 ODSP 占比下降时（算术关系，不是原因）。把每个 CMA 放进"OW 占比 × ODSP 占比"空间，一个标记同时给出两个占比和差距；分解条形图把缩小幅度拆成两个项目的贡献。
- **Appeal**：15 颗彗星都朝着"占比相等"的 45° 线移动，而且几乎是水平的。这张图不用一句话就说出"OW 在动，ODSP 几乎没动"。
- **代价 / Cost**：读者不熟悉，要先学会读对角参考线；中间路径只能靠滑块看到（同时画出就是 Q1 D 的连接散点图）；中间区域的彗星互相重叠；手机上纵向比例被拉伸（页面会说明）；图 1 没有时间轴，无法用全站统一的疫情灰带，只能在滑块读数中写出阶段（"2021 Q3 · pandemic"），以及通过 "During" 预设和步骤 4 进入疫情期。
- **课程依据 / Course basis**：L2 派生数据（贡献分解）· L3 两轴等比例、方向 = 哪个项目（expressiveness）、发散条以 0 为基线 · L4-1 connectedness（彗星）、similarity（OW 蓝 / ODSP 橙在两图一致）· L5 navigation（滑块 + Play）、selection、linked views、details on demand · L6 contrast（OW 与 ODSP 的贡献）、annotated chart。
- **视图与编码 / Views and encodings**
  - **图 1 彗星图**：横 = OW 占比，纵 = ODSP 占比，**两轴每个百分点像素相同**（桌面），所以 45° 线 = 两个占比相等（差距 0），平行虚线 = 差距 10 / 20 / 30 / 40 pp 不变；每个 CMA 一颗彗星（Armstrong & Wattenberg 2014）：细尾在起始季度、圆头在结束季度；彗星越靠近 45° 线，差距越小；彗星越平，越是只有 OW 在变。彗星用中性墨色（它是地区，不是项目）；选中的变黑变粗（popout），叙事步骤高亮的保持不透明，其他变淡；全省是空心彗星。标签只给选中、高亮、缩小最多 / 最少和全省，放在不与其他标签和参考线标签冲突的位置，放不下就不显示（悬停仍可查）。窄屏（< 640 px）纵向拉伸以保持可读，平行虚线仍然精确，页面注释改为说明这一点。读数句用规则描述方向：一个项目的变化不到另一个的 1/4 时说"nearly horizontal / vertical"，否则说"up and to the right"等，并说明是朝向还是远离 45° 线。
  - **图 2 分歧堆叠条形图**：每行一个 CMA，按缩小幅度排序（全省在最上方）；缩小幅度 = ΔOW − ΔODSP。蓝段 = OW 占比变化，橙段 = ODSP 占比变化，**每段画在它推动差距的方向**：OW 上升推向右（缩小），ODSP 上升推向左（扩大），ODSP 下降则接在右边；黑色刻度 = 净缩小幅度。横轴从 0 两侧展开，顶部写 "← widens the gap / narrows the gap →"；横轴范围对同一个起始季度固定，Play 时不会缩放。选中行写出净值。
- **交互（Card 流程）**：结束季度滑块（`<input type=range>`，方向键原生可用，读数同时写出所处阶段）和 Play = **navigation**（**data transformation** 层：结束季度改变 → 重新计算所有彗星和条），彗星随时间伸长，这是 B 回答"随时间如何变化"的方式；时期预设和下拉框 = **filtering**；悬停彗星附近（沿每颗彗星采样点的 Delaunay 最近点，26 px 内）= **details on demand**，点击 = **selection**；图 2 行悬停 / 点击 / Enter 同样选择，联动图 1 和表 1（**linked views**）；叙事步骤 = view 层强调。`prefers-reduced-motion` 时 Play 变慢、没有补间。
- **放弃的方案 / Rejected**：同时画出每个 CMA 的完整路径（就是 Q1 D 的连接散点图，类型重复，15 条路径也无法辨认）；一维排序箭头行（与 A 的哑铃同一种布局）；不等比例坐标作为默认（45° 失去"差距不变"的含义）；用颜色表示缩小 / 扩大（位置已表达，且会与 Q3 发散色冲突）；用两个独立的条（OW 变化、ODSP 变化）而不分解（净值要读者自己减）。

## 6. 候选 C：网格地图 + 分阶段瀑布图 / Candidate C: tile grid map + phase waterfall

- **没有采用基线的原因 / Why not the baseline**（页面上同样写明）："This version does not use the agreed dumbbell baseline, because a ranked list removes geography and shows only two moments in time." 排名保留在 "Ranked by narrowing" 排列和表 1。
- **Motivation**：分析员要找"值得进一步调查的地区"。等大的格子按大致地理位置排列，保留了地理，又不让面积大的 CMA 主导画面；每个格子带着完整的 2003–2026 记录。瀑布图回答选中 CMA "什么时候"缩小。
- **Appeal**：安大略被画成 16 个小面板，每个面板的柱子都从左到右变短；瀑布图里 Guelph 在疫情期那一级向上的台阶最容易被记住。
- **代价 / Cost**：小面板精度低于一张大图；格子位置是近似的（Thunder Bay 实际远在西北）；每格每年只画一根柱（第一季度），季度内的波动看不到（悬停可查）；网站会有第二张地图；开发量最大。
- **课程依据 / Course basis**：L3 共用纵轴的小倍数、位置和长度 · L4-1 proximity（地理邻近）、alignment（共用纵轴和时间轴）、enclosure（所选时期框）· L5 spatial arrangement（地图 / 排序两种排列）、selection、filtering、linked views、details on demand · L6 contrast（扩大的台阶）、annotated chart · **L7 等面积 + 图形符号（tile grid map）而不是 choropleth**。
- **视图与编码 / Views and encodings**
  - **图 1 网格地图**：7 × 4 网格，位置按 2021 年 CMA 质心手工排列（经度 → 列，纬度 → 行），全省放在右下角并用虚线框标为 "reference, not a place"。每格：名称、所选时期的 "起始差距 → 结束差距"、按缩小幅度的排名（#1–#15）；格内每年一根**浮动柱**（该年第一季度，2003 Q1 … 2026 Q1，第一根和最后一根正好是默认起止季度）：柱底 = OW 占比（蓝色端帽），柱顶 = ODSP 占比（橙色端帽），柱长 = 差距；所有格子共用纵轴（网格线 40 / 60 / 80%）；墨色细柱 = 所选时期的起止季度（精确季度，不限于第一季度）；疫情灰带；非默认时期时加时期框。"Ranked by narrowing" 把同一组格子动画重排成 5 列排名。窄屏按地图顺序（北 → 南、西 → 东）排成 5 列或 3 列。
  - **为什么用网格地图、为什么不用 choropleth（L7）**：CMA 面积相差约 10 倍（Toronto 约 5,900 km²，Guelph 约 600 km²，边界文件 `land_area_km2`），choropleth 会让大面积地区主导视觉，而且只能用颜色读数（精度低）；我们要比较的占比与面积无关。网格地图让每个 CMA 面积相同，格内还能放时间序列。**与 Q3 地图的关系**：Q3 图 2a 是底图上的比例符号地图，圆面积 = 案件数，颜色 = 与全省之差；C 是没有底图的等大格子，格内是小图。两者回答不同的问题，但"一个网站两张地图"是否合适，列为待决定问题。
  - **图 2 瀑布图**：起始差距（实心中性柱，从 0 开始）→ 时期内每个阶段的变化（浅色浮动柱，向下 = 缩小、向上 = 扩大，配 ▲ / ▼ 和 "narrowed 16.8" 文字）→ 结束差距；阶段在 2019 Q4 和 2023 Q1 切开，只画所选时期覆盖的阶段；虚线连接相邻台阶。读数句列出每个阶段的变化，并给出全省同期的分阶段变化作对照。
- **交互（Card 流程）**：点击格子 / Enter = **selection**，联动瀑布图和表 1；排列切换 = **spatial arrangement**（visual mapping 层，500 ms 动画）；时期预设和下拉框 = **filtering**（格内标签、排名、墨色柱、时期框、瀑布图同时更新）；悬停格子 = 最近一年的占比（含分子 / 分母）+ 该 CMA 的时期汇总；悬停台阶 = 该阶段 OW、ODSP 各自的变化和扩大季度数；叙事步骤 = view 层强调（其他格子变淡）。
- **放弃的方案 / Rejected**：choropleth（见上）；格内用迷你面积图画差距（与 Q3 的堆叠面积、A 的纹理带都是面积标记，容易被算作重复；浮动柱还能同时显示两个占比）；每季度一根柱（每格 93 根，桌面每根约 1 px，变成面积）；六边形格子（矩形绘图区更好放小图）；在真实底图上放小图（小 CMA 挤在南部，重叠）；用绿 / 红表示台阶方向。

## 7. 图表类型清单与多样性 / Chart-type inventory and diversity

图表类型按"标记 + 空间布局"区分。共用组件（叙事步骤、时期选择器、读数句、表 1、结论卡片、悬停提示）不是图表。
Chart type = mark + spatial layout. Shared components are not charts.

| 版本 / Version | 图 / Figure | 图表类型 / Chart type | 标记 / Marks | 通道 / Channels | 回答 / Answers | 与 Q1、Q3 重复？/ Overlap with Q1, Q3 |
| --- | --- | --- | --- | --- | --- | --- |
| A | 图 1 | 排序哑铃图 / ranked dumbbell | 点 ×2（空心 / 实心）+ 连线 | 横向位置 = 差距；纵向位置 = 排序后的 CMA；填充 = 起 / 终 | ②（及起止水平）| **相近**：Q3 图 3"带区间的排序点图"也是每行点 + 线段的排序布局。区别：Q3 的线段是最低–最高区间，A 的两端是两个时间点的观测值。保留原因：小组已定基线 |
| A | 图 2 | 双折线 + 差距纹理带 / dual lines with hatched gap band | 线 ×2 + 纹理面积 | 横 = 时间；纵 = 占比；色相 = 项目；纹理宽度 = 差距 | ① | **重复**：Q1 A 也是双折线（项目色相同）。保留原因：基线；读两个占比随时间变化最准确的形式；加了差距带 |
| B | 图 1 | 占比空间彗星图 / comet (arrow) plot in share space | 锥形彗星 + 起点点；45° 与等差距参考线 | 横 = OW 占比；纵 = ODSP 占比（等比例）；方向 = 哪个项目在变；到 45° 线距离 = 差距；时间 = 滑块 | ① + ② | **思路相近、类型不同**：Q1 D 的连接散点图也让两个量互为坐标轴，但 D 是一个实体经过 93 个季度的路径；B 是 15 条起 → 止的直线，没有中间路径 |
| B | 图 2 | 分歧堆叠条形图 / diverging stacked bars | 条（两段）+ 净值刻度 | 位置 / 长度（0 为基线）；色相 = 项目；0 的左右 = 扩大 / 缩小 | ② + 哪个项目 | 无 / none |
| C | 图 1 | 网格地图小倍数（浮动柱）/ tile grid map of floating-column small multiples | 等大方格 + 格内浮动柱（端帽）| 格位置 = 大致地理；柱底 / 柱顶 = OW / ODSP 占比；柱长 = 差距；格内横向 = 年份 | ① + ② | **同为地图、类型不同**：Q3 图 2a 是底图上的比例符号地图（面积圆）；C 是等大格子。待决定：是否全站共用一个地图板块 |
| C | 图 2 | 瀑布图 / waterfall | 浮动条 + 虚线连接 | 纵向位置 / 长度；台阶方向 = 扩大 / 缩小 | ②（什么时候）| 无 / none |

**A、B、C 之间 / Across A, B, C**：六种类型互不相同。最接近的三对：A 图 1（每行两个点）与 C 图 1（浮动柱也编码一个区间）——标记不同（点对 vs 矩形），布局不同（排序的类别行 vs 地理网格中的时间序列）；B 图 2 与 C 图 2 都用条——布局不同（每个类别从同一个 0 向两侧展开 vs 沿阶段顺序首尾相接的浮动条）；A 图 2 与 C 图 1 都显示两个占比随时间变化——标记不同（连续线 vs 逐年浮动柱）。
Six distinct types; the closest pairs differ in mark and layout as explained.

## 8. 版本比较 / Comparison

| 维度 / Criterion | A · 哑铃 + 折线 | B · 彗星 + 分解 | C · 网格地图 + 瀑布 |
| --- | --- | --- | --- |
| 清楚程度（第一次看）/ Clarity | 高：最熟悉 | 中：要学会读 45° 和平行线 | 中高：小图多，但每格结构相同 |
| 分析深度 / Analytical depth | 中：排序 + 一个地区的完整趋势 | 高：两个占比、差距、贡献分解、时间滑块 | 中高：全部地区的完整趋势 + 分阶段 + 地理 |
| 创意（R10）/ Creativity | 低 | 高 | 高 |
| 剩余开发量 / Remaining effort | 低 | 中（读者测试、重叠处理）| 中高（第二张地图的取舍、网格位置的确认）|
| 与 Q1、Q3 的一致性 / Consistency | 高：与 Q1 A 同一套模式 | 中：形式新，配色和骨架一致 | 中：与 Q3 都有地图，但编码不同 |
| 视觉多样性（对全站）/ Diversity for the site | 低：双折线与 Q1 A 重复 | 高：全站唯一的彗星图和分解图 | 中高：全站唯一的网格地图和瀑布图，但又是地图 |
| 已定决定 / Settled decisions | 全部保留 | 不用基线（页面已说明）| 不用基线（页面已说明）|
| 最大风险 / Main risk | 被评为"缺乏创意" | 读者看不懂对角线、彗星重叠 | 与 Q3 地图功能重叠；小面板精度低 |

## 9. 推荐（最终由小组决定）/ Recommendation (the group decides)

**以 B 为主体，把 C 的瀑布图作为选中 CMA 的"什么时候"视图。** 理由：
- B 是唯一直接回答"差距缩小是哪个项目在动"的版本。对政策分析员来说，"OW 占比上升了 15.0–26.9 pp，ODSP 只变了 −2.1 到 +8.2 pp"比排名本身更值得写进简报，而图 2 同时给出排名。
- B 的形式在全站独一无二（Q1 是折线 / 散点，Q3 是面积 / 地图 / 点图），创意分（R10）和视觉多样性最高，而且每个新颖之处都有功能理由（45° = 差距 0，方向 = 哪个项目）。
- B 的弱点是"随时间"只能靠滑块看，C 的瀑布图正好补上：疫情前、中、后各缩小多少，哪里扩大过，与 Q1、Q3 的疫情三阶段框架一致。
- 条件：先找 2–3 位组外同学试读 B 的图 1（重点：能否说出 45° 线的含义、能否读出"几乎水平 = OW 在变"）。如果试读失败，退回 **A + B 的图 2**（基线 + 分解条），清楚程度最高、风险最低。
- C 的网格地图只在小组决定"全站共用一个地图板块"之后再考虑，否则网站会有两张功能部分重叠的地图。

**Use B as the main view and add C's waterfall as the "when" view for the selected CMA.** B is the only version that answers which program moved, and it adds the most novelty to the site with functional reasons. C's waterfall covers B's weak spot (time). If a quick reader test of B fails, fall back to A plus B's decomposition bars. Consider C's tile map only if the group wants a site-wide map panel.

## 10. 自检 / Self-check

"满足 / 部分 / 未"= Met / Partly / Not met。证据指具体视图或文字。

### 10.1 满分要求对照 / Grading requirements

**A · 排序哑铃图 + 联动双折线**

| 要求 / Requirement | 证据 / Evidence | 结果 / Result |
| --- | --- | --- |
| R1 可视化为核心 | 图 1、图 2 是页面主体，表 1 为辅 | 满足 |
| R2 交互支持探索 | 叙事步骤、时期预设 + 起止下拉框、排序、选择、悬停、表格联动 | 满足 |
| R3 在线发布 | 尚未部署 | 未 |
| R4 自包含 | "Read this first" 四张定义卡、步骤副标题、图例、图注、读数句 | 满足 |
| R5 课程数据为主 | 只用课程的 4 个 CSV | 满足 |
| R6 单一受众 | 文字和任务面向 MCCSS 分析员（§2） | 满足 |
| **R7 编码合理** | 差距用共同尺度位置；起 / 终用空心 / 实心而不是项目色；项目用色相；差距纹理中性；无双纵轴 | 满足 |
| **R8 分析能力** | 任意时期的排序 + 单个地区的完整趋势；但"哪个项目在动"只在读数句和图 2 中，不能跨地区比较 | 部分 |
| **R9 清楚可导航** | 编号步骤、martini glass、默认状态即有结论 | 满足 |
| **R10 创意** | 哑铃 + 双折线都是常规形式；纹理差距带和联动是小的加分 | 未 / 部分 |
| R11 文字清楚 | 短句、计算出的导语和读数句 | 满足 |
| **R12 理由深入** | §4（视图、编码、交互、放弃方案）、§7 | 满足 |
| **R13 交互理由** | §4 按 Card 流程逐项说明作用层 | 满足 |
| **R14 课堂词汇** | expressiveness、effectiveness、popout、enclosure、selection、navigation、details on demand、martini glass 等 | 满足 |
| R15 与主题和受众对齐 | 直接回答研究问题的两部分（§10.4） | 满足 |
| R16 开发计划 | 技术已定（D3 + 静态页面），分工未写 | 部分 |
| R17 报告格式 | 未开始（需先选版本） | 未 |
| R18 贡献报告 | 不在本任务范围 | — |
| R19 拼写语法 | 已自查，需最终校对 | 部分 |
| R20 截止 | 进行中（Mock 11/19） | 进行中 |

**B · 彗星图 + 分解条形图**

| 要求 / Requirement | 证据 / Evidence | 结果 / Result |
| --- | --- | --- |
| R1 | 图 1、图 2 | 满足 |
| R2 | 叙事步骤、时期、结束季度滑块 + Play、两图互相选择、悬停 | 满足 |
| R3 | 尚未部署 | 未 |
| R4 | 定义卡（含"Narrowed by = OW 变化 − ODSP 变化"）、图例（彗星、全省、45° 线、等差距线）、图注说明怎么读方向 | 部分：对角参考线需要学习，未做读者测试 |
| R5 | 同上 | 满足 |
| R6 | 同上 | 满足 |
| **R7** | 等比例坐标使 45° = 差距 0；方向编码"哪个项目"；分解条以 0 为基线；颜色只表示项目；手机上拉伸时页面说明 | 满足 |
| **R8** | 两个占比、差距、贡献分解、任意起止、逐季滑块，跨地区直接比较 | 满足 |
| **R9** | 步骤 + 图例 + 读数句；但第一次看需要时间 | 部分 |
| **R10** | 二维彗星图 + 分解条，全站唯一，且有功能理由 | 满足 |
| R11 | 读数句用规则生成方向描述 | 满足 |
| **R12** | §5、§7 | 满足 |
| **R13** | §5 Card 流程（滑块改变 data transformation 层等） | 满足 |
| **R14** | 同上，另有 connectedness、change over time via navigation | 满足 |
| R15 | 回答两部分（§10.4） | 满足 |
| R16–R20 | 同 A | 同 A |

**C · 网格地图 + 瀑布图**

| 要求 / Requirement | 证据 / Evidence | 结果 / Result |
| --- | --- | --- |
| R1 | 图 1、图 2 | 满足 |
| R2 | 叙事步骤、时期、地图 / 排序排列、选择、悬停 | 满足 |
| R3 | 尚未部署 | 未 |
| R4 | 定义卡、图例（浮动柱、墨色柱、疫情、全省格）、图注说明网格位置是近似的 | 满足 |
| R5 | 同上（边界文件只用于排网格，不在页面加载） | 满足 |
| R6 | 同上 | 满足 |
| **R7** | 等大格子 + 共用纵轴；柱长 = 差距；台阶方向 = 扩大 / 缩小；不是 choropleth | 满足 |
| **R8** | 全部地区的完整趋势 + 地理 + 分阶段 + 排序；但每格每年只有一根柱，精确读数要靠悬停 | 满足 |
| **R9** | 步骤 + 图例；格子多，第一眼信息量大 | 满足 |
| **R10** | 网格地图小倍数 + 瀑布图，全站唯一 | 满足 |
| R11 | 同上 | 满足 |
| **R12** | §6（含 L7 理由）、§7 | 满足 |
| **R13** | §6 Card 流程 | 满足 |
| **R14** | 同上，另有 tile grid map、equal-area | 满足 |
| R15 | 回答两部分（§10.4） | 满足 |
| R16–R20 | 同 A | 同 A |

### 10.2 课程原则检查点 / Lecture checkpoints

| 检查点 / Checkpoint | A | B | C |
| --- | --- | --- | --- |
| L1/L2 数据抽象（CMA 类别带位置、时间有序、占比和差距数量型） | 满足（§2） | 满足 | 满足（另用到位置） |
| L2 任务抽象 | 满足（§2 表） | 满足 | 满足 |
| L2 派生数据 | 满足：占比、差距、缩小幅度、扩大季度 | 满足：另有贡献分解 | 满足：另有阶段分段 |
| L3 最重要的比较用位置或长度 | 满足：差距 = 共同尺度位置 | 满足：差距 = 到 45° 线距离；缩小 = 条长 | 满足：差距 = 共用纵轴上的柱长；阶段变化 = 台阶长度 |
| L3 expressiveness（项目用色相；方向用位置） | 满足：起 / 终用空心 / 实心 | 满足：方向用位置和角度 | 满足：方向用台阶上下 |
| L3 discriminability（15 个 CMA 不用 15 种颜色） | 满足：排序 + 高亮加灰 | 满足：高亮加灰 + 标签 | 满足：分面 + 高亮加灰 |
| L3 popout | 满足：选中行底色 + 粗体 | 满足：选中彗星变黑变粗 | 满足：选中格深色边框 |
| L4-1 proximity / alignment | 满足：两图并排、共用时期 | 满足：两图上下，同一选中 | 满足：地理邻近、共用纵轴和时间轴 |
| L4-1 similarity（同义同色，全站一致） | 满足 | 满足 | 满足 |
| L4-1 enclosure | 满足：选中行、疫情带 | 部分：选中行底色；图 1 没有时间轴，所以没有疫情灰带，改为在滑块读数里标出结束季度所处阶段（before / pandemic / after） | 满足：时期框、疫情带、全省虚线框 |
| L4-1 connectedness | 满足：哑铃连线、折线 | 满足：彗星 | 满足：瀑布虚线连接 |
| L4-2 分类色经工具验证（浅色、深色） | 满足（§3） | 满足 | 满足 |
| L4-2 发散色阶 | 不适用（未使用） | 不适用 | 不适用 |
| L4-2 无彩虹 | 满足 | 满足 | 满足 |
| L5 selection | 满足 | 满足 | 满足 |
| L5 filtering / navigation | 满足：时期 | 满足：时期 + 滑块 / Play | 满足：时期 |
| L5 spatial arrangement | 满足：三种排序 | 部分：图 2 按时期自动重排，没有手动排序 | 满足：地图 / 排序 |
| L5 details on demand | 满足（含案件数） | 满足 | 满足 |
| L5 linked views | 满足：图 1 ↔ 图 2 ↔ 表 1 | 满足 | 满足 |
| L6 叙事结构 | 满足：martini glass（4 步 + Explore） | 满足 | 满足 |
| L6 annotated chart | 满足：最多 / 最少 / 扩大的行 | 满足：选中、高亮、最多 / 最少的彗星 | 满足：排名徽标、台阶标签 |
| L6 contrast | 满足：起点 vs 终点 | 满足：OW vs ODSP 的贡献 | 满足：缩小的台阶 vs 扩大的台阶 |
| L6 take-home message | 满足：计算出的导语 + 结论卡片 | 满足 | 满足 |
| L7 地图 | 不适用（不用地图，排序任务不需要位置） | 不适用 | 满足：§6 说明为什么用网格地图、为什么不用 choropleth、与 Q3 地图的关系 |

### 10.3 多样性检查 / Diversity check
- A、B、C 之间：六种图表类型无重复（§7 清单）。
- 与 Q1、Q3 重复或相近：A 图 2 双折线与 Q1 A 重复（基线要求）；A 图 1 与 Q3 图 3 排序点图布局相近（基线要求）；B 图 1 与 Q1 D 共享"两个量互为坐标轴"的思路，但标记和布局不同；C 图 1 与 Q3 图 2a 都是地图，编码不同（待决定）。B 图 2 和 C 图 2 与 Q1、Q3 都不重复。

### 10.4 问题覆盖检查 / Question coverage

| 版本 / Version | ① 两个占比如何随时间变化 / How shares changed | ② 差距在哪里缩小最多 / Where the gap narrowed most |
| --- | --- | --- |
| A | 图 2：选中 CMA 的两条占比线（季度）+ 读数句；步骤 3 | 图 1：排序哑铃 + 注释；步骤 2 |
| B | 图 1：起止两个占比的位置，滑块 / Play 逐季推进；读数句描述方向；步骤 3、4 | 图 2：按缩小幅度排序 + 净值；图 1 到 45° 线的距离；步骤 2 |
| C | 图 1：每个 CMA 逐年两个占比（柱底 / 柱顶）；图 2 分阶段 | 图 1：排名徽标 + "Ranked" 排列 + 起止差距标签；步骤 2 |

三个版本都回答了两部分。

### 10.5 数字复核 / Number recomputation
方法：每个版本在浏览器里计算的全部事实（`window.__facts`）导出为 JSON，用 pandas 从原始 CSV 独立重算（脚本独立编写，不读 JS），逐字段比较（相对误差 1e-9），包括全省、15 个 CMA 的起止差距、缩小幅度、ΔOW、ΔODSP、扩大季度数、三个阶段、排序、极值、小 CMA。再从每个页面 6 个状态（默认、步骤 2、3、4、"Before the pandemic" + Oshawa、"After" + Ottawa–Gatineau）的全部可见文字和 SVG 文字中提取数字，与 pandas 结果按页面格式（一位小数、千分位）比对。
Method: export every fact, recompute independently in pandas, compare field by field; then match every number in the visible text and SVG labels of six page states against pandas values.

| 版本 / Version | 事实字段不一致 / Fact mismatches | 文字中的数字（6 个状态）/ Numbers in text | 未解释 / Unexplained |
| --- | --- | --- | --- |
| A | 0 | 1,631 | 0 |
| B | 0 | 1,674 | 0 |
| C | 0 | 1,841 | 0 |

说明：全省 OW 2019 Q4 案件数在源文件中是 235,500.5，页面（JavaScript）四舍五入为 235,501，Python 的 `round` 用银行家舍入得到 235,500，两者都正确，复核脚本两种都接受。坐标刻度、年份、Q1–Q4、排名 #1–#15 不计入。
The Ontario OW count 235,500.5 rounds to 235,501 in JavaScript and 235,500 in Python; both accepted.

### 10.6 常见错误检查 / Anti-pattern check
- choropleth：无（C 用等大网格，§6 说明理由）。彩虹色阶、饼图、3D：无。
- 双纵轴：无（B 的两个轴是两个变量的散点空间，不是同一图上叠两个纵轴）。
- 截断的柱状图坐标轴：C 瀑布图的总量柱从 0 开始；C 图 1 的浮动柱表示一个区间（OW 占比到 ODSP 占比），不是从基线量起的长度，所以纵轴不从 0 开始是合理的，柱长仍是同一尺度上的 pp；B 图 2 以 0 为基线。
- 只靠颜色区分：每张图都有图例；A 图 2 有直接标签；B 图 2 的方向写在轴上；彗星和柱的端点用位置而不是颜色区分。
- 每个点都标数字：无（selective labels；精确值在表 1 和提示中）。
- 标签重叠：渲染检查为 0（§10.7）。
- 因果或价值判断：已搜索 caus / because / due to / improve / worsen / better / worse，只出现在 B、C 页面顶部"does not use the agreed dumbbell baseline, because…"的设计说明中（解释设计选择，不是解释数据）；B 的 Motivation 写作"can shrink when one share rises"，避免读成因果。
- 把"最终缩小"写成"一直缩小"：页面统一写 "smaller at the end"，步骤 4 和结论卡片明确说扩大季度数。
- 同一颜色两种含义：OW 蓝、ODSP 橙、中性灰 = 差距或非项目元素，与 Q1、Q3 一致；没有使用 Q3 的青绿 ↔ 紫色。

### 10.7 渲染检查 / Rendering check
用 Chrome DevTools Protocol 驱动无头 Edge（精确视口宽度、真实鼠标、键盘和触摸事件）：
- 截图（`screenshots/`）：每个版本桌面 1360 px 浅色 / 深色、手机 400 px 浅色 / 深色、一个关键交互状态（A：步骤 4 疫情期；B：结束季度 2012 Q4 + Windsor；C：疫情期 + 排名排列 + Guelph），以及总览页缩略图。
- 页面横向滚动、SVG 出界、文字重叠、文字被裁切：三个版本在 1360 / 820 / 400 px 均为 0；另外 C 在 1360、1000、900、820、700、620、520、400 px 的地图和排名两种排列，A、B 在 1100、980、700、520、400 px 的三个状态下均为 0（修复过：A 起止差距标签与右端标签相撞、B 对角线标签与轴标题相撞、B 窄屏"equal shares"标签出界、C 中等宽度名称与排名相撞——改为 5 列布局、C 手机瀑布图标签相撞）。表 1 在自己的容器内横向滚动。
- 控制台：无错误、无警告。
- 键盘：Tab 可到达每个可聚焦控件（A 48、B 47、C 47 个）；每组分段按钮用 Enter 切换成功；A 图 1 的行、B 图 2 的行、C 的格子、表 1 的行都能用 Enter 选择，重绘后焦点留在原处；B 的滑块用方向键移动。
- 鼠标：A 图 1 行、图 2 十字线；B 彗星（最近点）和分解条；C 格子和瀑布台阶，提示都正确出现。B 的 Play 1.2 秒内从 2003 Q1 推进到 2006 Q3，Pause 后滑块拖到 2013 Q1，结束季度下拉框同步。C 的排列切换后格子移到排名位置，图注改为排名说明。
- 触摸（400 px）：A、B、C 每个主图点按都显示提示并选中地区（修复过：触摸抬起时的 pointerleave 会立刻关闭提示；重绘后的滚动锚定 scroll 事件也会误关提示，改为只在真正滑动时关闭）。

### 10.8 受众检查 / Audience check（MCCSS 政策分析员 / an MCCSS analyst）
- **A**：能判断 15 个 CMA 的差距在 2026 Q1 都比 2003 Q1 小，Oshawa 最多、Ottawa–Gatineau 最少，并看清选中地区两个占比何时变化；能任选起止季度重新排序，把排序图和表 1 放进简报；不能一眼比较各地区是哪个项目在推动变化，也不能判断变化的原因。
- **B**：能判断差距缩小几乎都来自 OW 占比上升（彗星几乎水平，蓝段远长于橙段），并找出 ODSP 占比下降（Windsor、Oshawa）或上升最多（Kingston）的地区；能用滑块逐季查看任一时期，并按缩小幅度排序；不能同时看到每个地区的完整路径，第一次看可能需要先读图例，也不能判断变化的原因。
- **C**：能判断各地区在什么位置、整个时期的两个占比如何走，以及选中地区在疫情前、中、后各缩小或扩大了多少（例如 Guelph 疫情期扩大）；能切换到排名排列选出值得调查的地区，并与全省的分阶段变化对照；不能从小面板读出精确值（要悬停或看表 1），格子位置也只是近似地理。

## 11. 待小组决定 / Open questions for the group

1. **选哪个版本**，或按 §9 组合（我的建议：B + C 的瀑布图；试读失败则 A + B 的图 2）；选定后放入稳定路径 `design/q2/prototype/`。这批候选是 Q2 v1，tag `q2-v1`。/ Which version or combination.
2. **是否全站共用一个地图板块**：Q3 已有比例符号地图；如果选 C，网站会有两张地图。选项：(a) 两张都保留（回答不同问题）；(b) 做一个全站共用的地图板块，可切换 Q2 / Q3 指标；(c) Q2 不用地图（选 A 或 B）。/ A site-wide map panel?
3. **更新研究文档第 4 节**：草案写"排序柱状图"，基线是哑铃图；最终应写成选定版本的图。/ Update the research draft.
4. **研究草案中的"选择援助项目"交互**：三个版本都不提供（问题本身是两个项目的关系），是否同意？/ Drop the program filter?
5. **默认时期和阶段切点**：默认 2003 Q1 → 2026 Q1；阶段在 2019 Q4、2023 Q1 切开（"During" 的变化从 2019 Q4 算起，包含进入疫情第一季的变化）。是否同意？/ Default period and phase cut points.
6. **C 的逐年柱用每年第一季度**（第一根和最后一根正好是默认起止季度），而不是年平均。是否同意？/ Annual Q1 sampling in C.
7. **B 在手机上拉伸纵向比例**（页面已说明，平行线仍然精确），是否接受？/ B's vertical stretch on phones.
8. **B 的读者测试**：如果考虑 B，先找 2–3 位组外同学试读图 1。/ Reader test for B.
9. **小 CMA 的波动**：目前显示原始季度值并在提示中给出案件数；是否需要可选的四季度移动平均？/ Optional smoothing for small CMAs?
10. **全站共用样式**：CSS 变量和工具函数现在在 Q1、Q2 各复制一份，是否抽成一个全站文件？/ A site-wide stylesheet and helpers?
