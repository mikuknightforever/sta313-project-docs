# Q3 原型 / Q3 Prototype

OW 受助时长与地区差异的可视化原型。设计理由见 [Q3_DESIGN.md](Q3_DESIGN.md)。
Prototype for OW assistance duration and regional differences. See [Q3_DESIGN.md](Q3_DESIGN.md) for the rationale.

## 运行 / Run

原型直接读取 `datasets/ONT-SA/selected/` 中的 CSV 和 `datasets/EXTERNAL/CMA-BOUNDARIES/` 中的 GeoJSON，浏览器不允许 `file://` 页面读取本地文件，因此需要在**仓库根目录**启动一个本地服务器：
The prototype reads the CSVs in `datasets/ONT-SA/selected/` and the GeoJSON boundaries in `datasets/EXTERNAL/CMA-BOUNDARIES/`. Browsers block this from `file://`, so start a local server from the **repository root**:

```bash
python -m http.server 8000
```

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

- v1（`55e5870`）：图 2 为 CMA × 季度热力图。/ Figure 2 was a CMA × quarter heatmap.
- v2：图 2 改为比例符号地图 + 悬停分析卡片，时期刷选移到第 2 步顶部。/ Figure 2 is a proportional-symbol map with a hover analysis card; the period brush moved to the top of Step 2.
