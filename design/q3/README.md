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
