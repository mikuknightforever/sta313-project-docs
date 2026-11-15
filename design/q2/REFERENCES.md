# Q2 参考案例 / Q2 Reference Works

只借鉴设计思路，不复制视觉风格、代码或素材。每条都写明借鉴了什么、为什么适合 Q2，以及刻意没有借鉴什么。
We borrow design ideas only, never visual style, code or assets. Each entry states what was borrowed, why it fits Q2, and what was deliberately not borrowed.

**核实说明 / How these were checked**（2026-11-13）：每个作品都用网络搜索确认了存在、作者和链接；NPR 博客和 FT Visual Vocabulary 的 README 直接打开核对过内容，论文只核对了题目、作者、期刊和 DOI，没有通读全文。课程材料里没有往届 STA313 优秀项目，所以没有引用。没有引用具体奖项（Information is Beautiful、Malofiej、SND），因为没能逐条核实哪件作品获了哪个奖。
Every work was confirmed by web search (existence, author, link). The NPR post and the FT Visual Vocabulary README were opened and read; for the paper only title, authors, venue and DOI were checked. No past STA313 projects were provided. No award claims are made because they could not be verified item by item.

---

## A · 排序哑铃图 + 联动双折线 / Ranked dumbbell + linked lines

### Arrow and range plots — Datawrapper（博客与 Academy 教程 / blog and Academy guides）
- 链接 / Links: 发布说明 / launch post <https://www.datawrapper.de/blog/new-arrow-and-range-plots>；range plot 教程 / guide <https://academy.datawrapper.de/article/111-how-to-create-a-range-plot>；arrow plot 教程 / guide <https://www.datawrapper.de/academy/how-to-create-an-arrow-plot>
- 借鉴 / Borrowed: 每个类别一行、两个点放在同一条数量轴上、按差值排序的 range plot（哑铃图）。Datawrapper 的选择建议也是 A 和 B 分工的依据：**如果重点是两点之间的差距而不是经过的时间，用 range plot；如果重点是随时间的移动，用 arrow plot**。A 的问题是"哪里缩小最多"（差距大小），所以用哑铃；B 的问题是"谁在移动"，所以用箭头。/ One row per category, two dots on one axis, sorted; their own advice (range plot for the gap, arrow plot for movement over time) is why A uses dots and B uses arrows.
- 为什么适合 / Why it fits: 15 个 CMA 的起点和终点差距放在共同尺度上，排序后"最多 / 最少"一眼可见（L3 position on a common scale，L5 sort）。
- 刻意没有借鉴 / Not borrowed: 用两种颜色区分两个点。他们的两点常常是两个类别（如男 / 女）；我们的两点是**同一个量在两个时间**，用空心 / 实心区分，避免和 OW 蓝、ODSP 橙冲突（同色同义）。/ Two colours for the two dots; ours are one measure at two times, so hollow vs filled.

### Difference chart — Mike Bostock（D3 示例 / D3 example）
- 链接 / Links: <https://gist.github.com/mbostock/3894205>；Observable 版本列在 D3 示例集 / listed in the D3 gallery <https://observablehq.com/@d3>
- 借鉴 / Borrowed: 在两条线之间填充区域，让"两者之差"成为一个可见的形状，而不是让读者在两条线之间估算距离。A 的图 2 用斜线纹理填充 OW 线和 ODSP 线之间的区域，纹理越窄，差距越小。/ Fill the area between two lines so the difference becomes a visible shape.
- 为什么适合 / Why it fits: Q2 的第一部分要求同时看两个占比和它们的差距；纹理带把"差距随时间收窄"变成一眼可读的形状。
- 刻意没有借鉴 / Not borrowed: 按哪条线在上方用两种颜色填充。ODSP 占比在每个 CMA 每个季度都更高（1,395 / 1,395），只有一种情况，第二种颜色没有信息；另外再加一对"上 / 下"颜色会和项目色、Q3 的发散色混淆。所以用中性斜线纹理（和纯灰色的疫情带区分开）。/ Two-colour fill by sign: ODSP is always higher, so one neutral texture suffices and avoids a new colour meaning.

### Visual Vocabulary — Financial Times（Chart Doctor）
- 链接 / Link: <https://github.com/Financial-Times/chart-doctor/tree/main/visual-vocabulary>（README 已打开核对 / README read）
- 借鉴 / Borrowed: 按"数据关系"选图的框架。FT 把"显示多个类别的变化或范围"的点图列在 Distribution，把有序点图列在 Ranking。A 的哑铃图同时承担这两个任务。/ The relationship-first framework: dot plots for change or range across categories, ordered dots for ranking.
- 刻意没有借鉴 / Not borrowed: FT 的视觉风格和配色。/ FT styling and colours.

## B · 占比空间里的箭头 + 分解条形图 / Arrows in share space + decomposition bars

### Visualizing Statistical Mix Effects and Simpson's Paradox — Zan Armstrong, Martin Wattenberg, IEEE TVCG 20(12):2132–2141, 2014（InfoVis 2014）
- 链接 / Links: DOI <https://doi.org/10.1109/tvcg.2014.2346297>；Google Research 页面 / page <https://research.google/pubs/pub42901/>
- 核实 / Checked: 题目、作者、期刊、页码和 DOI 经搜索确认；论文提出的 **comet chart（彗星图）** 由摘要和二手资料确认，全文未通读。/ Title, authors, venue and DOI confirmed; the comet chart confirmed from the abstract and secondary sources.
- 借鉴 / Borrowed: 彗星符号：**细尾在起点、粗头在终点**，在二维数量空间中同时显示许多类别在两个时间点之间的变化。论文报告这种图在约 6–100 个类别时效果最好，B 只有 15 个 CMA + 全省。B 的图 1 用同样的符号：每个 CMA 一颗彗星，从起始季度指向结束季度。/ The comet glyph (thin tail at the start, thick head at the end) for many segments changing between two times in 2D; the paper found it works best for about 6–100 segments, and B has 16.
- 为什么适合 / Why it fits: Q2 关心"差距缩小是哪个项目在动"。把 OW 占比放横轴、ODSP 占比放纵轴，彗星的**方向**就是答案：水平 = 只有 OW 变，竖直 = 只有 ODSP 变；离 45° 线的距离就是差距。
- 刻意没有借鉴 / Not borrowed: 原作的坐标含义（横轴是权重、纵轴是数值，用于分析混合效应）和用颜色编码权重变化。B 的两轴是两个项目的占比，颜色不编码任何变量（彗星用中性墨色，只有选中的变深）。/ The original axes (weight vs value) and colour-coded weight change.

### Arrow plot — Datawrapper（见 A / see A）
- 借鉴 / Borrowed: "两点之间经过了时间，就用箭头而不是点"的原则。/ Use arrows when time passes between the two values.
- 刻意没有借鉴 / Not borrowed: 一维的排序箭头行。那和 A 的哑铃图是同一种"每行两个端点"的布局，会违反"不重复图表类型"的规则；B 把箭头放进二维占比空间。/ The one-dimensional row layout (same layout type as A's dumbbell).

### Visual Vocabulary — Financial Times：Deviation（偏差）
- 借鉴 / Borrowed: FT 把 diverging bar / diverging stacked bar 列为"能同时处理正值和负值"的偏差图。B 的图 2 用分歧堆叠条：差距变化 = OW 占比变化 − ODSP 占比变化，两个部分各自画在它推动差距的方向（右 = 缩小，左 = 扩大），黑色刻度标出净值。/ Diverging (stacked) bars for positive and negative parts; each part drawn on the side it pushes the gap, with a net tick.
- 刻意没有借鉴 / Not borrowed: 用"好 / 坏"语义的红绿色表示正负。方向由位置表达，颜色只表示项目（OW 蓝、ODSP 橙）。/ Good/bad red-green colouring; position carries direction, colour carries program.

## C · 网格地图 + 分阶段瀑布图 / Tile grid map + phase waterfall

### Let's Tesselate: Hexagons for Tile Grid Maps — Danny DeBelius, NPR Visuals Team blog, 2015-05-11
- 链接 / Link: <https://blog.apps.npr.org/2015/05/11/hex-tile-maps.html>（已打开核对作者和日期 / opened to confirm author and date）
- 借鉴 / Borrowed: 网格地图（tile grid map）的核心理由：每个地区用**同样大小**的格子，避免面积大的地区在视觉上占优（choropleth 的失衡问题）；以及作者指出的**方格的行列便于横向、纵向扫读**。/ Equal tiles avoid the visual imbalance of choropleths; square grids scan easily by row and column.
- 为什么适合 / Why it fits: 15 个 CMA 的面积相差很大（Toronto 约 5,900 km²，Guelph 约 600 km²），真实地图上 Toronto、Ottawa、Sudbury 会主导画面，Guelph、Brantford 几乎看不见；但分析员关心的是每个地区的占比和差距，与面积无关（L7：等面积 + 图形符号）。
- 刻意没有借鉴 / Not borrowed: 六边形。每个格子里要放一个小图，矩形绘图区更好对齐；15 个地区的邻接关系也不需要六边形的额外边。/ Hexagons: each tile holds a small chart, which needs a rectangular plotting area.

### geofacet — Ryan Hafen（R 包 / R package）
- 链接 / Links: <https://hafen.github.io/geofacet/>；介绍文章 / introduction <https://ryanhafen.com/blog/geofacet/>
- 借鉴 / Borrowed: "地理分面"：每个地区一张小图（small multiple），小图按大致地理位置排在网格中，而不是按字母或数值排序。C 的图 1 就是这种布局，网格是我们根据 2021 年 CMA 边界的质心手工排的（`datasets/EXTERNAL/CMA-BOUNDARIES/`）。/ Geographic faceting: one small chart per region, arranged on a grid that approximates geography; our grid was laid out by hand from the 2021 CMA centroids.
- 为什么适合 / Why it fits: 同时回答"在哪里"（位置）和"什么时候"（每格的时间序列）。
- 刻意没有借鉴 / Not borrowed: R / ggplot2 的代码和现成网格；页面用 D3 自己绘制，并加入"按缩小幅度排列"的切换，让同一组格子也能当排序图用。/ The R code and ready-made grids; we draw in D3 and add a "ranked" arrangement.

### Visual Vocabulary — Financial Times：Waterfall（瀑布图）
- 借鉴 / Borrowed: FT 把瀑布图列在 Part-to-whole（"适合部分组成为负值的情况"）和 Flow。C 的图 2：起点差距 → 疫情前、中、后各自的变化 → 终点差距；扩大的阶段是向上的台阶。/ Waterfall for a total whose parts can be negative.
- 为什么适合 / Why it fits: "最终缩小"由几个方向不同的阶段组成（Guelph、Thunder Bay 疫情期间扩大），瀑布图让这一点无法被忽略（L6 contrast）。
- 刻意没有借鉴 / Not borrowed: 用绿色 / 红色表示增减。台阶方向（上 / 下）+ ▲▼ 符号 + 文字标签表达方向，填充色保持中性。/ Green/red for up/down.

---

## 所有候选共同的参考 / Shared across candidates

- 课程 L6 的 martini glass 结构（四个引导步骤 → Explore）和 annotated chart 原则用于全部三个候选。/ L6 martini glass and annotated charts apply to all three.
- 课程 L7 关于 choropleth 的问题（面积主导视觉、颜色读数不精确）是 C 用网格地图、A 和 B 不用地图的依据。/ L7's critique of choropleths.
- 全站风格来自本项目 Q3 v2 和 Q1（`design/q3/prototype/`、`design/q1/shared/`），不是外部作品。/ The site style comes from this project's Q3 v2 and Q1.
