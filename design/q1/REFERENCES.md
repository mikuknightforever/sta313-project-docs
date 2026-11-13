# Q1 参考案例 / Q1 Reference Works

只借鉴设计思路，不复制视觉风格、代码或素材。每条都写明借鉴了什么、为什么适合 Q1，以及刻意没有借鉴什么。
We borrow design ideas only, never visual style, code or assets. Each entry states what was borrowed, why it fits Q1, and what was deliberately not borrowed.

**核实说明 / How these were checked**（2026-11-12）：每个作品都用网络搜索确认了存在、作者和链接。部分原页面（NYT、FT）有付费墙，我没有直接打开，作品细节来自作者访谈或二手报道，下面逐条注明。没有找到往届 STA313 优秀项目（课程材料里没有提供），所以没有引用。没有引用具体的奖项名单（Information is Beautiful Awards、Malofiej、SND），因为没能逐条核实哪件作品获了哪个奖，不想写出无法核实的获奖信息。
Every work was confirmed by web search (existence, author, link). Some originals (NYT, FT) are paywalled and were not opened directly; details then come from author interviews or secondary coverage, as noted. No past STA313 projects were provided, so none are cited. Specific award lists are not cited because I could not verify which work won which award.

---

## A · 带注释的时间线 / Annotated timeline

### FT coronavirus trajectory tracker — John Burn-Murdoch, Financial Times (2020)
- 来源 / Source: 作者访谈 / author interview, Nightingale: <https://medium.com/nightingale/how-john-burn-murdochs-influential-dataviz-helped-the-world-understand-coronavirus-6cb4a09795ae>；作者 2020-03-21 的更新说明在线图上加入封城日期注释 / annotations added on 21 Mar 2020: <https://x.com/jburnmurdoch/status/1241463928271581185>（FT 原页面未打开 / FT page not opened）
- 借鉴 / Borrowed: 把关键事件直接注释在线上，而不是放在图例里；多条线时突出一条、其余变淡（对应 A 的图例高亮）。/ Annotate events directly on the lines; highlight one series and fade the rest.
- 为什么适合 / Why it fits: 分析员要把图放进简报，注释必须跟着图走；A 只标注当前叙事步骤涉及的点（selective labels）。
- 刻意没有借鉴 / Not borrowed: **对数坐标**。FT 用它来比较指数增长；我们的案件数不是指数增长，分析员关心的是实际水平和相对 2019 Q4 的变化，线性坐标和指数切换更合适。也没有借鉴国家多到需要配色的做法。/ Log scale (our counts are not exponential); many-country colour sets.

### How the Recession Reshaped the Economy, in 255 Charts — Jeremy Ashkenas & Alicia Parlapiano, NYT The Upshot (2014-06-05)
- 链接 / Link: <https://www.nytimes.com/interactive/2014/06/05/upshot/how-the-recession-reshaped-the-economy-in-255-charts.html>（原页面未打开，内容据二手报道 / original not opened; details from secondary coverage, e.g. <https://rethinkingvis.com/visualizations/162>）
- 借鉴 / Borrowed: 每条线表示相对危机开始时的百分比变化，即以危机前为基准的指数；读者先看到一个总体判断，再进入细节。对应 A 的"2019 Q4 = 100"指数切换和叙事步骤。/ Lines as % change from a pre-crisis base; an overall statement first, then detail.
- 为什么适合 / Why it fits: Q1 同样是"危机前、中、后"的比较，以危机前最后一期为基准最直观。
- 刻意没有借鉴 / Not borrowed: 255 条线的规模和按工资排序的二维布局；我们只有两个序列。/ The 255-line scale and the pay-sorted layout.

## B · 看变化，不看水平 / Change, not level

### Excess mortality P-scores — Our World in Data
- 链接 / Links: 图表 / chart <https://ourworldindata.org/grapher/excess-mortality-p-scores-projected-baseline>；方法说明 / explainer <https://ourworldindata.org/covid-excess-mortality>
- 借鉴 / Borrowed: 把"相对基准的变化（%）"作为主指标，0 线醒目；在图旁边用平实语言解释指标的定义和局限。对应 B 的同比变化、0 线和"Read this first"里的定义卡片。/ Change relative to a baseline as the main measure, a prominent zero line, and a plain-language definition next to the chart.
- 为什么适合 / Why it fits: B 的问题正是"两个项目的变化方向和速度在哪些时期一致"，需要一个所有读者都能理解的 0 线参照。
- 刻意没有借鉴 / Not borrowed: 国家选择器、地图标签页和按国家配色；B 只有两个项目，用小倍数并排即可，不需要选择器。/ Country picker, map tab, per-country colours.

### How the Recession Reshaped the Economy, in 255 Charts（同上 / see above）
- 借鉴 / Borrowed: 用"变化"而不是"水平"来比较规模差别很大的序列；B 的"Change since 2019 Q4"模式就是这种思路。/ Comparing series of very different size through change, not level.

## C · 长时段背景 / The long view (focus + context)

### Focus + Context — Mike Bostock, Observable (D3 example)
- 链接 / Link: <https://observablehq.com/@d3/focus-context>（较早的版本 / earlier version: <https://bl.ocks.org/mbostock/1667367>）
- 借鉴 / Borrowed: 上方概览图上的刷选决定下方详图的时间范围（overview + detail，L5 navigation）。/ A brush on the overview sets the detail view's range.
- 为什么适合 / Why it fits: 57 年的序列和 23 年的详图尺度差别很大，概览负责"放在长时段里看"，详图负责精确比较。
- 刻意没有借鉴 / Not borrowed: 示例里概览和详图画的是**同一个**序列；C 的概览是口径不同的另一个序列，所以概览用中性色、不和 OW/ODSP 共用颜色，并在图上标出 1998 年口径变化和与 OW+ODSP 的差额。也没有借鉴面积图作为详图（两条线需要能比较）。/ The example shows the same series in both views; ours are different series, so the overview uses neutral ink, marks the 1998 break and explains the gap.

### How Much Hotter Is Your Hometown Than When You Were Born? — The New York Times (2018-08-30)
- 来源 / Source: 合作方 Climate Impact Lab 的说明 / partner FAQ: <https://impactlab.org/wp-content/uploads/2018/09/Climate-Impact-Lab-FAQ-NYT-90-degrees.pdf>；NYT 发布帖 / NYT post: <https://x.com/nytimes/status/1035482374358925312>（NYT 原页面未打开 / original not opened）
- 借鉴 / Borrowed: 把读者关心的近期变化放在很长的历史记录里看，并明确说明数据的口径和局限。对应 C 的"57 年里的疫情下降"叙事和口径说明。/ Placing a recent change within a long record, with the limits of the record stated.
- 刻意没有借鉴 / Not borrowed: 个性化输入（出生年份、城市）和对未来的预测；我们的受众和任务不需要这些。/ Personalisation and projections.

## D · 连接散点图 / Connected scatterplot (optional, creative)

### Driving Safety, in Fits and Starts — Hannah Fairfield, NYT (2012-09-17)
- 链接 / Link: <https://www.nytimes.com/interactive/2012/09/17/science/driving-safety-in-fits-and-starts.html>（原页面未打开；作品描述据 PolicyViz 和二手资料 / original not opened; described by PolicyViz, e.g. <https://jschwabish.substack.com/p/news-and-notes-from-policyviz-issue-22-09-20>）
- 借鉴 / Borrowed: 两个随时间变化的量互为坐标轴、按年份连线；在转折点标注年份，加简短的注释，引导读者沿路径阅读。对应 D 只在起点、2019 Q4、OW 最低点和最新一期加标签。/ Two time series as the two axes, joined in time order, with year labels at turning points.
- 为什么适合 / Why it fits: Q1 问的是两个项目"一起变还是分开变"，路径的方向直接回答这个问题。
- 刻意没有借鉴 / Not borrowed: 原作的视觉风格和全部注释文字；D 用全站统一的配色和字体。/ Its visual style and wording.

### The Connected Scatterplot for Presenting Paired Time Series — Steve Haroz, Robert Kosara, Steven L. Franconeri, IEEE TVCG 22(9), 2016
- 链接 / Link: <https://eagereyes.org/papers/the-connected-scatterplot-for-presenting-paired-time-series>（DOI 10.1109/TVCG.2015.2502587）
- 借鉴 / Borrowed: 研究证据，而不是视觉设计。结论：读者看连接散点图时**更容易弄错顺序和方向**，但这种形式更能吸引读者。D 因此加了阅读说明（方向键）、按时期分段的明暗、时间滑块和同步的普通时间线。/ Evidence: readers confuse order and direction more often, but are drawn in; hence the reading key, phase shading, slider and companion timeline.
- 刻意没有借鉴 / Not borrowed: 不适用（是研究论文）。它也是 D 在页面上"Cost"一栏的依据。/ N/A; it is cited as D's cost on the page.

### A Review of Temporal Data Visualizations Based on Space-Time Cube Operations — Benjamin Bach, Pierre Dragicevic, Daniel Archambault, Christophe Hurter, Sheelagh Carpendale, EuroVis 2014 (STAR), pp. 23–41
- 链接 / Links: Eurographics Digital Library（DOI 10.2312/eurovisstar.20141171）<https://diglib.eg.org/handle/10.2312/eurovisstar.20141171.023-041>；University of Edinburgh 记录 / record <https://www.research.ed.ac.uk/en/publications/a-review-of-temporal-data-visualizations-based-on-space-time-cube/>
- 核实 / Checked: 2026-11-12 网络搜索确认作者、会议、页码和 DOI；论文全文未打开。/ Authors, venue, pages and DOI confirmed by search; full text not opened.
- 借鉴 / Borrowed: 把时间数据看作一个时空立方体，各种 2D 图是对它的基本操作，其中"压平"（flattening）沿某个轴投影得到 2D 图；论文把随时间变化的散点图（time-evolving scatterplots）也纳入这一框架。D v2 的三个正视预设就是三个 flattening：沿时间轴 = 连接散点图，沿 ODSP 轴 = OW 随时间，沿 OW 轴 = ODSP 随时间。/ Treat temporal data as a space-time cube; 2D charts are operations on it, flattening being an axis-aligned projection. D v2's three presets are three flattenings.
- 为什么适合 / Why it fits: 给 3D 一个功能性的理由：它不是装饰，而是让分析员看到三张 2D 图来自同一条曲线。/ It gives 3D a functional reason.
- 刻意没有借鉴 / Not borrowed: 论文综述的其他操作（切片、钻取、几何变形等）和沉浸式或透视的立方体显示；D 只用正交投影和三个压平预设，读数仍在 2D 中。/ Other cube operations and immersive or perspective displays.

### Visualization Analysis and Design — Tamara Munzner, CRC Press, 2014（课程教材来源 / the course's source text）
- 借鉴 / Borrowed: "No unjustified 3D" 的经验规则和对深度通道、遮挡、透视变形、旋转成本、斜看文字的分析；Q1_DESIGN.md §7.1 的代价表逐条对照这些代价。/ The "No unjustified 3D" rule of thumb and its costs, checked one by one in §7.1.

### Are connected scatterplots so bad? — Datawrapper blog
- 链接 / Link: <https://www.datawrapper.de/blog/connected-scatterplots>
- 借鉴 / Borrowed: 实用建议：标出关键点、引导读者沿时间阅读、不要让读者自己猜方向。/ Practical guidance: label key points and guide the reading order.

### Gapminder（Trendalyzer）— Hans Rosling（课程 L6 举过的例子 / an L6 example）
- 链接 / Link: <https://www.gapminder.org/tools/>
- 借鉴 / Borrowed: 时间滑块 + 播放按钮，让一个点沿两个变量移动；暂停后可以查看具体时期。/ A time slider with Play that moves a point through two variables.
- 刻意没有借鉴 / Not borrowed: 气泡大小和颜色编码第三、第四个变量；D 只有两个变量，多余的编码会违反 expressiveness。/ Bubble size and colour for extra variables.

---

## 所有候选共同的参考 / Shared across candidates

- 课程 L6 的 martini glass 结构（先引导、后开放探索）和 annotated chart 原则用于全部四个候选。/ The L6 martini-glass structure and annotated-chart principle apply to all four candidates.
- 全站风格来自本项目 Q3 v2（`design/q3/prototype/`），不是外部作品。/ The site style comes from this project's Q3 v2, not from an external work.
