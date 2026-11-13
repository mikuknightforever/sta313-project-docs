# Q2 候选版本 / Q2 Candidate Variants

Q2（家庭构成与地区差异）的 v1 是三个候选版本，供小组比较、选择。三个版本之间没有重复的图表类型。设计理由见 [Q2_DESIGN.md](Q2_DESIGN.md)，参考案例见 [REFERENCES.md](REFERENCES.md)。
Q2 (family composition and regional differences) v1 consists of three candidate variants for the group to compare; no chart type is repeated across them. See [Q2_DESIGN.md](Q2_DESIGN.md) for the rationale and [REFERENCES.md](REFERENCES.md) for reference works.

## 运行 / Run

页面直接读取 `datasets/ONT-SA/selected/` 中的 4 个 CSV（OW、ODSP 的 CMA 文件和全省文件）。浏览器不允许 `file://` 页面读取本地文件，所以要在**仓库根目录**启动本地服务器：
The pages read four CSVs in `datasets/ONT-SA/selected/`. Browsers block this from `file://`, so start a server from the **repository root**:

```bash
python -m http.server 8000
```

然后打开总览页 / Then open the overview: <http://localhost:8000/design/q2/>

需要联网加载 D3 7.9.0（cdnjs）。/ D3 7.9.0 loads from cdnjs.

## 版本 / Variants

| 候选 / Variant | 一句话 / One line | 目录 / Folder | 采用小组基线？/ Uses the agreed baseline? |
| --- | --- | --- | --- |
| A · Ranked dumbbell + linked lines | 起止差距的排序哑铃图 + 选中 CMA 的双折线（差距纹理带）/ ranked dumbbell of start and end gaps + dual lines with a hatched gap for the selected CMA | [variants/a-dumbbell/](variants/a-dumbbell/index.html) | 是 / Yes |
| B · Arrows in share space + decomposition | OW 占比 × ODSP 占比空间里的彗星图（结束季度滑块 + Play）+ 分歧堆叠的贡献分解条 / comets in OW-share × ODSP-share space with an end-quarter slider, plus diverging decomposition bars | [variants/b-arrows/](variants/b-arrows/index.html) | **否：页面已说明原因 / No: reason stated on the page** |
| C · Tile grid map + phase waterfall | 按地理排列的网格地图（每格逐年浮动柱）+ 选中 CMA 的分阶段瀑布图 / tile grid map of yearly floating columns + phase waterfall for the selected CMA | [variants/c-tilemap/](variants/c-tilemap/index.html) | **否：页面已说明原因 / No: reason stated on the page** |

按版本规则（见 [design/DESIGN_LOG.md](../DESIGN_LOG.md)），这批候选是 Q2 v1，tag `q2-v1`。小组选定后，入选版本放到稳定路径 `design/q2/prototype/`（尚未建立）。
Under the versioning rule these candidates are Q2 v1 (tag `q2-v1`). The chosen version will move to the stable path `design/q2/prototype/` (not created yet).

## URL 参数 / URL parameters

三个版本都支持 / All three accept:

| 参数 / Parameter | 值 / Values |
| --- | --- |
| `theme` | `light` \| `dark` |
| `step` | `1`–`4` 叙事步骤 / story steps，`0` = Explore |
| `period` | `all` \| `pre` \| `during` \| `post`（预设 / presets） |
| `start`, `end` | 季度，如 / quarter, e.g. `2010Q1`, `2023Q1`（覆盖 `period` / override `period`） |
| `cma` | CMA 代码，如 / code, e.g. `532`（Oshawa）、`550`（Guelph），或 `ont`（全省 / Ontario） |

另外 / In addition: A `sort=nar|g1|name`；C `arrange=map|rank`。B 的结束季度就是 `end`。/ B's slider is `end`.

例 / Examples: `variants/a-dumbbell/index.html?step=4`, `variants/b-arrows/index.html?end=2012Q4&cma=559`, `variants/c-tilemap/index.html?period=during&arrange=rank&cma=550`

## 文件 / Files

- `index.html`：候选总览（卡片、图表类型清单、比较表、推荐、待决定事项）/ overview of candidates
- `shared/q2.css`：从 Q1（再上溯到 Q3 v2）复制的全站变量和页面骨架，新增中性"差距"颜色和组件样式 / site tokens copied from Q1 plus the neutral gap colour and components
- `shared/q2-common.js`：数据加载、所有派生事实（占比、差距、缩小幅度、阶段、排序）、共用的导语 / 叙事 / 结论文字、时期选择器、表 1 和绘图工具 / data loading, every derived fact, shared text, period control, Table 1, helpers
- `variants/<候选>/index.html` + `<a|b|c>.js`：各候选 / each candidate
- `screenshots/`：每个候选的 `-desktop-light`、`-desktop-dark`（1360px）、`-mobile-light`、`-mobile-dark`（400px）、`-state`（关键交互状态）、`-thumb`（总览卡片缩略图），以及 `overview-desktop-light.png` / per-candidate screenshots plus the overview page

交互状态截图对应的 URL / State screenshots: A `step=4` · B `step=0&start=2003Q1&end=2012Q4&cma=559` · C `step=0&period=during&arrange=rank&cma=550`
