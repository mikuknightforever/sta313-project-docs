# Q2 候选版本 / Q2 Candidate Variants

Q2（家庭构成与地区差异）的 v1 是三个候选版本，供小组比较、选择。三个版本之间没有重复的图表类型。设计理由见 [Q2_DESIGN.md](Q2_DESIGN.md)，参考案例见 [REFERENCES.md](REFERENCES.md)。
Q2 (family composition and regional differences) v1 consists of three candidate variants for the group to compare; no chart type is repeated across them. See [Q2_DESIGN.md](Q2_DESIGN.md) for the rationale and [REFERENCES.md](REFERENCES.md) for reference works.

## 运行 / Run

页面直接读取 `datasets/ONT-SA/selected/` 中的 4 个 CSV（OW、ODSP 的 CMA 文件和全省文件）。浏览器不允许 `file://` 页面读取本地文件，所以要在**仓库根目录**启动本地服务器：
The pages read four CSVs in `datasets/ONT-SA/selected/`. Browsers block this from `file://`, so start a server from the **repository root**:

```bash
python serve.py
```

[`serve.py`](../../serve.py) 用法和 `python -m http.server 8000` 一样，但让浏览器每次都读取最新文件（不缓存）；以前用 `python -m http.server` 打开过的页面，换用后按一次 Ctrl+F5。/ Works like `python -m http.server 8000` but disables browser caching, so every load reads the latest files; press Ctrl+F5 once on pages opened before with `python -m http.server`.

然后打开总览页 / Then open the overview: <http://localhost:8000/design/q2/>

需要联网加载 D3 7.9.0（cdnjs）。/ D3 7.9.0 loads from cdnjs.

## 版本 / Variants

| 候选 / Variant | 一句话 / One line | 目录 / Folder | 采用小组基线？/ Uses the agreed baseline? |
| --- | --- | --- | --- |
| A · Ranked dumbbell + linked lines | 起止差距的排序哑铃图 + 选中 CMA 的双折线（差距纹理带）/ ranked dumbbell of start and end gaps + dual lines with a hatched gap for the selected CMA | [variants/a-dumbbell/](variants/a-dumbbell/index.html) | 是 / Yes |
| B · Arrows in share space + decomposition | OW 占比 × ODSP 占比空间里的彗星图（结束季度滑块 + Play）+ 分歧堆叠的贡献分解条 / comets in OW-share × ODSP-share space with an end-quarter slider, plus diverging decomposition bars | [variants/b-arrows/](variants/b-arrows/index.html) | **否：页面已说明原因 / No: reason stated on the page** |
| C · Tile grid map + phase waterfall | 按地理排列的网格地图（每格逐年浮动柱）+ 选中 CMA 的分阶段瀑布图 / tile grid map of yearly floating columns + phase waterfall for the selected CMA | [variants/c-tilemap/](variants/c-tilemap/index.html) | **否：页面已说明原因 / No: reason stated on the page** |
| D · Two clouds + zipper（**额外版本 / extra version，2026-11-18**） | 每年一列的点云：每个 CMA 一个蓝点（OW 占比）、一个橙点（ODSP 占比）；悬停把该 CMA 的两点"拉链"连起来（齿长 = 差距）并在固定卡片中预览、点击选中（交互同 Q3）；全省差距刷选条；起止差距斜线图 / yearly dot clouds of every CMA's OW and ODSP shares, a zipper and Q3-style card on hover, a brushable period strip and a start → end slopegraph | [variants/d-clouds/](variants/d-clouds/index.html) | **否：页面已说明原因 / No: reason stated on the page** |
| D2 · D + "100 cases" opening（**额外版本 / extra version，2026-11-18**） | D 加一个全省开场：每个项目一张 10 × 10 方格图（每格 = 每 100 个案件中的 1 个，部分填色表示小数），OW 方格里的斜纹是差距；进入视野时自动播放一次，跟随所选时期 / D plus an Ontario opening of two 10 × 10 waffles that play through the selected period | [variants/d2-clouds-waffle/](variants/d2-clouds-waffle/index.html) | **否：页面已说明原因 / No: reason stated on the page** |
| E · Scroll story（**额外版本 / extra version，2026-11-18**） | 滚动讲故事：同一组点在七个场景之间变形（全省两点 → 两条线 → 15 个 CMA 的点云 → 中位数线 → 各 CMA 差距线收敛 → 疫情例外 → 探索），宽屏图表固定在右侧、手机固定在上方，1–7 号按钮可直接跳转；之后接 D 的完整探索区 / a seven-scene scroll story with one set of dots, scene buttons, then D's explorer | [variants/e-scroll/](variants/e-scroll/index.html) | **否：页面已说明原因 / No: reason stated on the page** |
| F · Map over time + tested outlook（**额外版本 / extra version，2026-11-18**） | CMA 填色地图（中性灰阶，5 pp 一级；可切换等大方格）随季度滑块 / Play 变化，2026 Q2 – 2030 Q4 为斜纹展望；三条规则（收敛、不变、10 年趋势）各附回测误差和可能范围；卡片交互同 Q3；表 1 回测、表 2 2030 Q4 展望 / a choropleth over time with a tested three-rule outlook | [variants/f-heatmap/](variants/f-heatmap/index.html) | **否：页面已说明原因 / No: reason stated on the page** |
| G · Spike and arrow map（**额外版本 / extra version，2026-11-18**） | F 的页面，图 1a 改为中性 CMA 形状上的尖刺（高度 = 差距）；切换后变成上 / 下箭头（比一年前的变化）/ F's page with spikes (height = gap) on neutral shapes, or arrows for the change against a year earlier | [variants/g-spikes/](variants/g-spikes/index.html) | **否：页面已说明原因 / No: reason stated on the page** |
| H · Hexagons with their own lines（**额外版本 / extra version，2026-11-18**） | 15 个等大六边形（C 的网格），填色 = 分级或变化，印出数值，每格一条 2003–2030 小折线 / equal hexagons with printed values and a sparkline each | [variants/h-hexes/](variants/h-hexes/index.html) | **否：页面已说明原因 / No: reason stated on the page** |
| I · Six moments side by side（**额外版本 / extra version，2026-11-18**） | 六张小地图并排：2003 Q1、2019 Q4、2021 Q1、2023 Q1、2026 Q1、2030 Q4，悬停联动描边 / six small maps of key moments with linked highlighting | [variants/i-multiples/](variants/i-multiples/index.html) | **否：页面已说明原因 / No: reason stated on the page** |
| J · Bivariate map（**额外版本 / extra version，2026-11-18**） | 3 × 3 色键：亮度 = 差距大小，色相 = 比一年前缩小 / 不变 / 扩大，名字后 ▲ / ▼ / • / a bivariate map of size and change | [variants/j-bivariate/](variants/j-bivariate/index.html) | **否：页面已说明原因 / No: reason stated on the page** |
| K · 3D prism map（**额外版本 / extra version，2026-11-18**） | 倾斜地图上每个 CMA 升高到与差距成比例的高度，可切换平视；作为对照 / extruded CMAs on a tilted map with a Flat view, kept as a contrast | [variants/k-prisms/](variants/k-prisms/index.html) | **否：页面已说明原因 / No: reason stated on the page** |

D、D2、E、F 是 2026-11-18 在 v1 之后加的并列额外版本（设计理由见 [Q2_DESIGN.md](Q2_DESIGN.md) §12–§15），不改 A–C；D2、E 复制 D 的文件再加自己的部分，D 本身不变。G–K 是 F 的五种地图形式（§16），共用 `shared/q2-maplab.js` / `shared/q2-maplab.css`，只有图 1a 不同，F 本身不变。/ D, D2, E and F are parallel extra versions added after v1 (§12–§15); A–C are unchanged, and D2 and E copy D's files rather than changing them. G–K are five map forms of F (§16) sharing one engine; only Figure 1a differs, and F is unchanged.

按版本规则（见 [design/DESIGN_LOG.md](../DESIGN_LOG.md)），这批候选是 Q2 v1，tag `q2-v1`。小组选定后，入选版本放到稳定路径 `design/q2/prototype/`（尚未建立）。
Under the versioning rule these candidates are Q2 v1 (tag `q2-v1`). The chosen version will move to the stable path `design/q2/prototype/` (not created yet).

## URL 参数 / URL parameters

A–E 都支持 / A–E accept:

| 参数 / Parameter | 值 / Values |
| --- | --- |
| `theme` | `light` \| `dark` |
| `step` | `1`–`4` 叙事步骤 / story steps，`0` = Explore |
| `period` | `all` \| `pre` \| `during` \| `post`（预设 / presets） |
| `start`, `end` | 季度，如 / quarter, e.g. `2010Q1`, `2023Q1`（覆盖 `period` / override `period`） |
| `cma` | CMA 代码，如 / code, e.g. `532`（Oshawa）、`550`（Guelph），或 `ont`（全省 / Ontario） |

另外 / In addition: A `sort=nar|g1|name`；C `arrange=map|rank`。B 的结束季度就是 `end`。D 的刷选条写回 `start` / `end` 对应的下拉框（不写入 URL）。/ B's slider is `end`; D's brush drives the same start / end selectors.

例 / Examples: `variants/a-dumbbell/index.html?step=4`, `variants/b-arrows/index.html?end=2012Q4&cma=559`, `variants/c-tilemap/index.html?period=during&arrange=rank&cma=550`, `variants/d-clouds/index.html?period=during&cma=550`, `variants/d2-clouds-waffle/index.html?period=during`（开场从 2019 Q4 播到 2023 Q1 / the opening plays 2019 Q4 → 2023 Q1）。E 不接受 `step`（滚动故事取代了叙事步骤按钮）/ E has no `step` parameter。F 用自己的参数 / F has its own: `t`（季度，如 `2019Q4`、`2030Q4`）、`cma`、`view=map|tiles`、`rule=conv|naive|trend`、`theme`。G–K 同 F，但没有 `view`；G、H、I、K 另有 `show=level|yoy`（差距大小 / 比一年前的变化）/ G–K as F without `view`; G, H, I and K add `show=level|yoy`。例 / e.g. `variants/g-spikes/index.html?t=2021Q1&show=yoy`

## 文件 / Files

- `index.html`：候选总览（卡片、图表类型清单、比较表、推荐、待决定事项）/ overview of candidates
- `shared/q2.css`：从 Q1（再上溯到 Q3 v2）复制的全站变量和页面骨架，新增中性"差距"颜色和组件样式 / site tokens copied from Q1 plus the neutral gap colour and components
- `shared/q2-common.js`：数据加载、所有派生事实（占比、差距、缩小幅度、阶段、排序）、共用的导语 / 叙事 / 结论文字、时期选择器、表 1 和绘图工具 / data loading, every derived fact, shared text, period control, Table 1, helpers
- `variants/<候选>/index.html` + `<a|b|c|d>.js`：各候选；D2 是 `d2.js` + `d2.css`（D 的副本加开场）；E 是 `e.js` + `e.css`（滚动故事 + D 的探索区）；F 是 `f.js` + `f.css`（地图、展望和回测，地图代码沿用 Q3）；G–K 是 `shared/q2-maplab.js` + `shared/q2-maplab.css`（从 F 移植的共用引擎：时间控制、卡片、图 2、表格、展望）加各自的 `g.js` … `k.js`（只画图 1a），检查脚本在 `tools/check_q2_maplab.py`、`tools/verify_q2_maplab.py`；D、D2 各有 `d.css` / `d2.css` 和自己的检查脚本 `verify_browser.py`（Playwright + 本机 Edge：版面、交互、截图）、`verify.py`（只用标准库，从 CSV 重算页面上的全部数字）/ each candidate; D also has `d.css` and its own checks
- `screenshots/`：每个候选的 `-desktop-light`、`-desktop-dark`（1360px）、`-mobile-light`、`-mobile-dark`（400px）、`-state`（关键交互状态）、`-thumb`（总览卡片缩略图），以及 `overview-desktop-light.png` / per-candidate screenshots plus the overview page

交互状态截图对应的 URL / State screenshots: A `step=4` · B `step=0&start=2003Q1&end=2012Q4&cma=559` · C `step=0&period=during&arrange=rank&cma=550` · D `step=0&period=during&cma=550`；D 另有 `d-hover-light.png`（悬停 Toronto 时的图 1：拉链预览 + 卡片 + 提示）/ D also has a hover screenshot · D2 同 D，截图前缀 `d2-`，另有 `d2-opening-light.png`（开场自动播放结束时）/ D2 as D with prefix `d2-`, plus the opening after autoplay · E：`e-scene-1/3/5/6-light.png`（宽屏故事场景）、`e-scene-5-mobile-light.png`（手机）、`e-state.png`（探索区，疫情期 + Guelph）、`e-hover-light.png` 等 / E: scene screenshots, phone, explorer · F：`f-desktop-*`、`f-mobile-*`、`f-hover-light.png`、`f-outlook-light.png`（2030 Q4）、`f-tiles-light.png`、`f-figure2-light.png`、`f-tables-light.png`
