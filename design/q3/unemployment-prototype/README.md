# Q3 额外版本：加入 CMA 失业率 / Q3 Extra Version: Local Unemployment Rates

状态 / Status: **供小组讨论的并列版本**（2026-11-18）。以 Q3 v2（[`../prototype/`](../prototype/index.html)，未改动）为底，加入组员提出的"失业率图，交互逻辑与地图一样"。不替换当前版本，是否采用由小组决定。网站英文，说明中英双语。
**Parallel version for group review** (2026-11-18), built on Q3 v2 (`../prototype/`, unchanged) to add a teammate's request: an unemployment-rate chart with the same interaction logic as the map. It does not replace the current version; the group decides whether to adopt it.

## 打开 / Open

仓库根目录运行 `python serve.py`，然后打开 <http://localhost:8000/design/q3/unemployment-prototype/>。需要联网加载 D3 7.9.0（cdnjs）。URL 参数与 v2 相同（`theme`、`period`、`from`/`to`、`cma` 等，见 [../README.md](../README.md)），例如 `?period=pre&cma=505`。
Run `python serve.py` from the repository root and open the URL above. URL parameters are the same as v2, e.g. `?period=pre&cma=505`.

## 加了什么 / What was added

图 1–4 与 v2 完全相同。新增三处，全部跟随第 2 步顶部的时期选择，并和地图共用同一个"悬停 = 预览、点击 = 选中"的逻辑：
Figures 1–4 are identical to v2. Three additions, all driven by the Step 2 period selector and sharing the map's "hover = preview, click = select" logic:

1. **图 2b 卡片底部"Local unemployment rate · background"**（地图选取部分）：所悬停或选中 CMA 在该时期的平均失业率、在 15 个 CMA 中的排名（1 = 最高）。时期早于 2011 年时注明只用了哪些季度，并给出同一段季度的长期占比。/ **A block at the bottom of the Figure 2b card** (the map-selection panel): the CMA's average unemployment rate in the period and its rank among 15; when the period starts before 2011 it names the quarters used and gives the long-term share for those same quarters.
2. **图 5a 散点图：失业率 × 长期占比**，每个 CMA 一个点。悬停、触摸或 Tab 到点 → 卡片预览、地图圆圈和图 3 行同时高亮；点击或 Enter → 选中，图 3、4、5b 和卡片一起切换（点不重绘，键盘焦点保留）。横线 = 同一段季度的全省长期占比。下方结论条给出三个疫情时期的 Spearman 等级相关。/ **Figure 5a scatter: unemployment × long-term share**, one dot per CMA, with the same hover / tap / Tab preview and click / Enter selection as the map; the line is Ontario's long-term share over the same quarters; a takeaway gives Spearman rank correlations for the three pandemic periods.
3. **图 5b 折线图**：选中 CMA 的月度失业率（2011-01 至 2026-10），其余 14 个 CMA 为灰线，悬停地图或图 5a 时对应灰线加深；阴影 = 所选时期中有失业率数据的季度。与图 4 的做法一致。/ **Figure 5b line chart**: the selected CMA's monthly rate against the other 14 in grey (darkened on hover elsewhere), with the selected period shaded, mirroring Figure 4.

另外：定义卡片加一条"Unemployment rate = background only"；第 3 步三张卡片各加一条（相关系数、不能推出因果、值得调查的 CMA）；Source 行加 StatCan 表；顶部一行横幅说明这是额外版本。
Also: one more definition card; one bullet in each Step 3 card; the StatCan table in the source line; a one-line banner.

## 关键设计决定 / Key decisions

- **两个轴用同一段季度**：失业率从 2011 Q1 开始，"Before pandemic"和"All years"在图 5a、卡片和相关系数里都只用 2011 Q1 起的季度（例如疫情前 = 2011 Q1 – 2019 Q4，68 个季度中的 36 个），并写在图注里。地图、图 3、图 4 仍用整个时期，与 v2 一致。/ **Both axes use the same quarters**: rates start in 2011 Q1, so pre-pandemic and all-years comparisons use 2011 Q1 onward, stated in the captions. The map and Figures 3–4 keep the full period.
- **季度对齐**：表中每月是三个月移动平均，季度最后一个月的值 = 该季度平均；OW 季度也以最后一个月标日期。/ **Quarter alignment**: each month is a three-month moving average, so the quarter's last month equals the quarter.
- **Ottawa 用安省部分**（OW 只覆盖安省一侧）。/ **Ottawa uses the Ontario part.**
- **不新增颜色**：图 5a 的点用中性灰、选中用 v2 的选中色，不复用 Q3 的青绿 ↔ 紫（那是"与全省之差"），也不给失业率设色阶。没有全省失业率参考线，因为这张表只有 CMA。/ **No new colours**: neutral dots plus v2's selection colour; the teal ↔ violet scale keeps its single meaning; no Ontario unemployment line because this table has CMAs only.
- **不用双纵轴**：失业率和长期占比放在散点图的两个轴上，时间走势单独一张图。/ **No dual axis.**
- **解释边界**：失业率只作背景（全站规则）。页面写明它数的是劳动力中的人，不是 OW 案件；相关系数只是描述；三个时期的方向不同（+0.44、+0.14、−0.44），所以"失业率本身不能解释哪些 CMA 长期占比更高"。/ **Interpretation**: background only; it counts people, not cases; correlations are descriptive; the direction changes between periods.

## 数据 / Data

[`../data/`](../data/README.md)：Statistics Canada 表 14-10-0459-01，按向量 ID 从 StatCan API 重建（与组员文件核对一致），见那里的 README。/ Rebuilt from the StatCan API and checked against the teammate's file; see that README.

## 验证 / Checks（2026-11-18）

```bash
python design/q3/unemployment-prototype/verify_browser.py   # 需要 pip install playwright，使用本机 Edge / needs Playwright + installed Edge
python design/q3/unemployment-prototype/verify.py           # 只用标准库 / standard library only
python design/q3/data/fetch_unemployment.py --check         # 数据是否仍与 StatCan 一致 / data still match StatCan
```

- **数字复核** [`verification.json`](verification.json)：Python 从 CSV 独立重算页面上显示的全部失业率相关数字（10 个状态：5 个预设时期、自定义 2015–2019、2005–2009 无数据、Ottawa、Toronto、Windsor），**299 项 0 处不一致**。这台电脑的 Windows 应用程序控制阻止了 pandas 的 DLL，所以这里用标准库 `csv` + `statistics`（Spearman 用 `statistics.correlation(method="ranked")`），没有用 pandas。/ **299 checks, 0 mismatches**, recomputed with the standard library because Windows Application Control blocked pandas on this machine.
- **浏览器检查** [`browser-verification.json`](browser-verification.json)：1360 / 820 / 400 px × 浅色 / 深色 × 两个时期共 12 种版面：无横向滚动、无控制台错误、图 5a/5b 无文字重叠、15 个点标签都不遮挡其他点；真实鼠标悬停（卡片预览 + 地图、图 3、图 5b 联动）、点击选中（图 2a、3、4、5a、5b 同步）、地图悬停联动图 5a/5b、图 5b 提示框、键盘（15 个点都能 Tab 到，Enter 选中后焦点保留）、刷选到 2005–2009 显示无数据提示、400 px 触摸点按选中，**12 项全部通过**。/ 12 layouts and real mouse, keyboard, brush and touch tests: **all 12 checks pass**.
- **继承的问题（未改）**：图 4 在 1360 / 820 px 选中 Peterborough 时，右端标签"Peterborough 58.0%"超出图框右边。代码与 v2 相同，v2 也有这个问题；为保持本版本 = v2 + 新增，这里没有单独修。/ **Inherited, not changed**: Figure 4's end label overflows its frame at 1360 / 820 px for Peterborough, as in v2.
- 没有做：读者测试；Node 版 `tools/check_q3.mjs`（这台电脑没有 Node）。/ Not done: a reader test; the Node checks (no Node on this machine).

## 截图 / Screenshots（`screenshots/`）

- `desktop-light.png`、`desktop-dark.png`：1360 px 全页 / full page; `mobile-light.png`、`mobile-dark.png`：400 px 全页
- `hover-5a-light.png`、`hover-5a-card-light.png`：悬停图 5a 的 Thunder Bay 时的图 5 和卡片预览 / hovering Thunder Bay in Figure 5a
- `mobile-tap-windsor-light.png`：手机点按 Windsor 后的图 5 / Figure 5 after tapping Windsor
- `state-pre-ottawa-dark.png`、`state-pre-ottawa-card-dark.png`：疫情前、Ottawa、深色（显示 2011 起的季度说明）/ pre-pandemic, Ottawa, dark

## 待小组决定 / Open questions

1. 组员说的"交互逻辑和这个一样"是否就是这种联动视图？另一种理解是**地图本身可切换为按失业率着色**（同一张地图，换一个颜色编码）。那需要一套新的失业率色阶，并且一张地图有两种颜色含义，所以这里没有采用；如果组员要的是这个，可以再做。/ Is this what the teammate meant? The alternative — a colour toggle on the map itself — would need a second colour scale with a second meaning on one map, so it was not chosen here; it can be built if wanted.
2. 是否把图 5 并入稳定版本（那将是 Q3 的大版本，需要先存档 v2 并打 tag `q3-v3`）？/ Merge into the stable version? That would be a major version: archive v2 and tag `q3-v3` first.
3. 是否显示标准误或置信区间（同一张表有标准误）？小 CMA 的月度值波动很大。/ Show standard errors (available in the same table)?
4. 第 3 步是否保留相关系数这一条，还是只留在图 5a 下方？/ Keep the correlation bullet in Step 3?
