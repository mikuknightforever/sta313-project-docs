# Q3 原型 / Q3 Prototype

OW 受助时长与地区差异的可视化原型。设计理由见 [Q3_DESIGN.md](Q3_DESIGN.md)。
Prototype for OW assistance duration and regional differences. See [Q3_DESIGN.md](Q3_DESIGN.md) for the rationale.

## 运行 / Run

原型直接读取 `datasets/ONT-SA/selected/` 中的 CSV 和 `datasets/EXTERNAL/CMA-BOUNDARIES/` 中的 GeoJSON，浏览器不允许 `file://` 页面读取本地文件，因此需要在**仓库根目录**启动一个本地服务器：
The prototype reads the CSVs in `datasets/ONT-SA/selected/` and the GeoJSON boundaries in `datasets/EXTERNAL/CMA-BOUNDARIES/`. Browsers block this from `file://`, so start a local server from the **repository root**:

```bash
python serve.py
```

[`serve.py`](../../serve.py) 用法和 `python -m http.server 8000` 一样，但让浏览器每次都读取最新文件（不缓存）；以前用 `python -m http.server` 打开过的页面，换用后按一次 Ctrl+F5。/ Works like `python -m http.server 8000` but disables browser caching, so every load reads the latest files; press Ctrl+F5 once on pages opened before with `python -m http.server`.

然后打开 / Then open: <http://localhost:8000/design/q3/prototype/>

需要联网加载 D3 7.9.0（cdnjs）。/ An internet connection is needed to load D3 7.9.0 from cdnjs.

## 可分享的视图 / Shareable views

URL 参数可以直接打开某个状态 / URL parameters open a specific state:

| 参数 / Parameter | 取值 / Values |
| --- | --- |
| `theme` | `light`, `dark` |
| `step` | `1`, `2`, `3`, `0`（Explore all） |
| `mode` | `count`, `share` |
| `iso` | `moa19`, `moa1318`, `moa512`, `moa04` |
| `period` | `latest`, `post`, `during`, `pre`, `all` |
| `cma` | CMA 编码 / code, e.g. `535` |
| `detail` | `share`, `mix` |
| `sort` | `share`, `cases`, `name` |
| `from`, `to` | 自定义季度范围（覆盖 `period`）/ custom quarter range (overrides `period`), e.g. `from=2015Q1&to=2019Q4` |

`period`、`from`/`to` 同时作用于第 2 步的地图（图 2a）、分析卡片（图 2b）、图 3 和图 4。
`period` and `from`/`to` drive every Step 2 view: the map (Figure 2a), the analysis card (Figure 2b), Figure 3 and Figure 4.

例 / Examples:
- `index.html?period=during&cma=535&mode=share&iso=moa19&detail=mix`
- `index.html?from=2015Q1&to=2019Q4&cma=550`

## 文件 / Files

- `prototype/index.html`、`q3.css`、`q3.js`：原型 / the prototype
- `prototype/_frame.html`：把页面放进 400px 宽的框里，便于在桌面浏览器里预览手机布局 / wraps the page in a 400px frame to preview the phone layout in a desktop browser
- `screenshots/`：/ screenshots:
  - `desktop-light.png`、`desktop-dark.png`：1360px 全页 / full page at 1360px
  - `mobile-light.png`、`mobile-dark.png`：400px 全页 / full page at 400px
  - `hover-toronto-light.png`：鼠标悬停 Toronto 时的图 2（卡片预览 + 联动高亮）/ Figure 2 while hovering Toronto (card preview and linked highlight)
  - `mobile-tap-ottawa-light.png`：手机点按 Ottawa 后的图 2 / Figure 2 after tapping Ottawa on a phone
  - `state-share-pandemic-light.png`、`state-share-pandemic-dark.png`：占比模式、仅 19+、疫情期、Toronto、完整构成 / share mode, 19+ only, pandemic period, Toronto, full mix

## 版本 / Versions

**版本规则（Q1、Q2、Q3 通用）**：当前工作版本始终放在稳定路径（如 `design/q3/prototype/`）。**大版本**指视图形式、编码方式、页面结构或叙事有明显变化；修 bug、改文字、调间距不算。开始新的大版本之前，先把当前版本复制到 `archive/<任务名>_<YYYY-MM-DD>_v<N>/`，打附注 tag（`q1-v1`、`q2-v1`、`q3-v1`……），再开始修改；存档内只允许改相对路径和加一行存档横幅。

**Versioning rule (applies to Q1, Q2 and Q3)**: the current working version always lives at a stable path (e.g. `design/q3/prototype/`). A **major version** is a clear change in view form, encoding, page structure or narrative; bug fixes, wording and spacing do not count. Before starting a new major version, copy the current one to `archive/<task>_<YYYY-MM-DD>_v<N>/` and add an annotated tag (`q1-v1`, `q2-v1`, `q3-v1`, …), then start editing; inside an archive, only relative paths and a one-line archive banner may change.

- v1（`55e5870`，tag `q3-v1`）：图 2 为 CMA × 季度热力图。可运行存档 / runnable archive: [archive/q3-prototype_2026-11-12_v1/](archive/q3-prototype_2026-11-12_v1/README.md)。/ Figure 2 was a CMA × quarter heatmap.
- v2（`a336f1a`，tag `q3-v2`，当前 / current）：图 2 改为比例符号地图 + 悬停分析卡片，时期刷选移到第 2 步顶部。/ Figure 2 is a proportional-symbol map with a hover analysis card; the period brush moved to the top of Step 2.
- 版本索引 / Version index: [archive/README.md](archive/README.md)

**额外版本（并列，不替换当前版本）/ Extra version (parallel, does not replace the current one)**

- [blocks-tiles/](blocks-tiles/index.html)（2026-11-26，**版本 A · 浮雕方格 / relief tiles**）：图 2a 改为等轴测方块（组员提出的形式），其余与 v2 相同。每个 CMA 一块，放在近似地图位置的等大方格上；底板 = 全省长期占比，方块按与全省的差（pp）升高或下陷；顶面颜色 = 同一差值的 5 级（v2 的青绿 ↔ 紫）。可旋转 90°、切换俯视。**形状可切换为地图（Shape → Map）**：每个 CMA 画成 2021 年人口普查边界（北向朝上倾斜，同 Q2 的 K、N），低于全省的地区变成陷进陆地的坑，Thunder Bay 放在西北角；URL 参数 `shape=map`。打开 <http://localhost:8000/design/q3/blocks-tiles/>。/ Figure 2a as relief tiles: blocks rise above or sink into a plate at Ontario's level by the CMA's difference; Shape → Map draws the real CMA boundaries instead.
- [blocks-treemap/](blocks-treemap/index.html)（2026-11-26，**版本 B · 方块树图 / block treemap**，最接近组员给的例子）：底面积 = 时期内平均 OW 案件数（与 v2 圆面积相同的含义），高度 = 长期占比（从 0 起），每块上的虚线 = 全省占比，顶面颜色 = 与全省的差；底面 × 高度正好是平均长期案件数。**形状可切换为地图（Shape → Map）**：用 2021 年人口普查边界代替树图，高度、虚线和颜色不变，此时底面只表示位置（不再是案件数，底面 × 高度也不再是长期案件数）；URL 参数 `shape=map`。打开 <http://localhost:8000/design/q3/blocks-treemap/>。/ Footprint = average OW cases, height = long-term share, dashed line = Ontario, colour = difference; footprint × height = average long-term cases; Shape → Map uses the real CMA boundaries instead (footprint = location only).
  两个版本共用 [blocks-shared/](blocks-shared/)（`q3-blocks.js` 是 v2 `q3.js` 的副本，只换了图 2a、卡片一行模式文字、高亮描边和三个 URL 参数 `view=top`、`turn=0–3`、`shape=map`）和全站几何文件 [`design/shared/iso-blocks.js`](../shared/iso-blocks.js)；v2 本身不变。检查：`python tools/check_q3_blocks.py`、`python tools/verify_q3_blocks.py`。设计理由见 [Q3_DESIGN.md](Q3_DESIGN.md) §12。/ Both share blocks-shared/ (a copy of v2's script with only Figure 2a changed) and the site-wide geometry; v2 is unchanged.
- [unemployment-prototype/](unemployment-prototype/README.md)（2026-11-18）：v2 + CMA 失业率。图 2b 卡片底部加失业率区块，新增图 5a（失业率 × 长期占比散点图）和图 5b（选中 CMA 的失业率走势），交互与地图相同（悬停预览、点击选中、跟随时期选择）。数据为 StatCan 表 14-10-0459-01，放在 [data/](data/README.md)。打开 <http://localhost:8000/design/q3/unemployment-prototype/>。/ v2 plus local unemployment rates: a card block in Figure 2b, Figure 5a (unemployment × long-term share) and Figure 5b (the selected CMA over time), with the map's interaction logic. Data in `data/`.
