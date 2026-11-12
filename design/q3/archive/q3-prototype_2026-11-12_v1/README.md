> **存档版本 / Archived version — Q3 v1（2026-11-12）**
>
> - **来源 / Source**：提交 `55e5870`（tag `q3-v1`），分支 `eric_roughwork`。内容从该提交的 `design/q3/` 原样取回。/ Restored verbatim from `design/q3/` in commit `55e5870` (tag `q3-v1`).
> - **主要特点 / What this version is**：图 2 为 CMA × 季度热力图（15 行 × 93 列，7 级绿↔紫发散色阶，显示各 CMA 长期占比减全省值），顶部是全省小面积图 + 时间刷选；其余为图 1a/1b、图 3 排序点图、图 4 CMA 详情和叙事步骤。/ Figure 2 is a CMA × quarter heatmap (15 × 93 cells, 7-class green↔purple difference from Ontario) with a brushable Ontario strip on top, plus Figures 1a/1b, 3, 4 and the story steps.
> - **存档时只改了两处 / Only two changes were made when archiving**：
>   1. `prototype/q3.js` 的数据路径从 `../../../datasets/ONT-SA/selected/` 改为 `../../../../../datasets/ONT-SA/selected/`，因为存档目录深了两层。/ The data path in `prototype/q3.js` gained two `../` because the folder is two levels deeper.
>   2. `prototype/index.html` 顶部加了一行存档横幅，链接到当前版本。/ A one-line archive banner linking to the current version was added at the top of `prototype/index.html`.
>
>   其余代码、文字和截图保持 v1 原样（`screenshots/` 是 v1 当时的截图，没有横幅）。下面的 v1 原文中的路径指向当时的位置 `design/q3/prototype/`，现在那里是 v2。/ Everything else is unchanged; the screenshots predate the banner. Paths in the original text below refer to `design/q3/prototype/`, which now holds v2.
> - **被取代的原因 / Why it was superseded**：热力图只能靠颜色读 1,395 个格子、小地区像噪点、排序依据与画面范围不符、手机上要横向滚动、绿色容易被读成"好"。详见当前设计说明 [`design/q3/Q3_DESIGN.md` 第 6 节"放弃的方案"](../../Q3_DESIGN.md#6-考虑过但放弃的方案--alternatives-considered-and-rejected)。/ Colour-only reading of 1,395 cells, noisy small CMAs, sort basis ≠ displayed range, horizontal scrolling on phones, green read as "good". See Section 6 of the [current design rationale](../../Q3_DESIGN.md#6-考虑过但放弃的方案--alternatives-considered-and-rejected).
> - **运行 / Run**：在仓库根目录执行 / from the repository root run `python -m http.server 8000`，然后打开 / then open <http://localhost:8000/design/q3/archive/q3-prototype_2026-11-12_v1/prototype/>。
> - 版本索引 / Version index: [../README.md](../README.md)

---

# Q3 原型 / Q3 Prototype

OW 受助时长与地区差异的可视化原型。设计理由见 [Q3_DESIGN.md](Q3_DESIGN.md)。
Prototype for OW assistance duration and regional differences. See [Q3_DESIGN.md](Q3_DESIGN.md) for the rationale.

## 运行 / Run

原型直接读取 `datasets/ONT-SA/selected/` 中的 CSV，浏览器不允许 `file://` 页面读取本地文件，因此需要在**仓库根目录**启动一个本地服务器：
The prototype reads the CSVs in `datasets/ONT-SA/selected/`. Browsers block this from `file://`, so start a local server from the **repository root**:

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

例 / Example: `index.html?period=during&cma=535&mode=share&iso=moa19&detail=mix`

## 文件 / Files

- `prototype/index.html`、`q3.css`、`q3.js`：原型 / the prototype
- `prototype/_frame.html`：把页面放进 400px 宽的框里，用于生成手机截图 / wraps the page in a 400px frame for phone screenshots
- `screenshots/`：桌面与手机、浅色与深色、交互状态截图 / desktop and phone, light and dark, interaction-state screenshots
