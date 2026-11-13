# Q1 候选版本 / Q1 Candidate Variants

Q1（总体趋势）的 v1 是四个候选版本，供小组比较、选择。设计理由见 [Q1_DESIGN.md](Q1_DESIGN.md)，参考案例见 [REFERENCES.md](REFERENCES.md)。
Q1 (overall trends) v1 consists of four candidate variants for the group to compare. See [Q1_DESIGN.md](Q1_DESIGN.md) for the rationale and [REFERENCES.md](REFERENCES.md) for reference works.

## 运行 / Run

页面直接读取 `datasets/ONT-SA/selected/` 中的 4 个 CSV。浏览器不允许 `file://` 页面读取本地文件，所以要在**仓库根目录**启动本地服务器：
The pages read four CSVs in `datasets/ONT-SA/selected/`. Browsers block this from `file://`, so start a server from the **repository root**:

```bash
python -m http.server 8000
```

然后打开总览页 / Then open the overview: <http://localhost:8000/design/q1/>

需要联网加载 D3 7.9.0（cdnjs）。/ D3 7.9.0 loads from cdnjs.

## 版本 / Variants

| 候选 / Variant | 一句话 / One line | 目录 / Folder | 改变已定决定？/ Changes a settled decision? |
| --- | --- | --- | --- |
| A · Annotated timeline | 双折线 + 数量/指数切换 + 叙事步骤 + 对齐的失业率条带 / two lines, cases-index toggle, story steps, aligned unemployment strip | [variants/a-timeline/](variants/a-timeline/index.html) | 否 / No |
| B · Change, not level | 同比变化小倍数（共用纵轴）+ 同向条带 + 分阶段对比 / YoY small multiples on one axis, same-direction strip, per-period comparison | [variants/b-change/](variants/b-change/index.html) | **是：主图不显示案件数 / Yes: main view is not case counts** |
| C · The long view | 1969 年以来全部社会援助的可刷选概览 + OW/ODSP 详图 / brushable all-programs overview since 1969 + OW/ODSP detail | [variants/c-longview/](variants/c-longview/index.html) | 否 / No |
| D · One path, two programs | 连接散点图（横 ODSP、纵 OW）+ 时间滑块 + 阅读说明 + 同步时间线 / connected scatterplot with slider, reading key, companion timeline | [variants/d-paths/](variants/d-paths/index.html) | 否（失业率对齐到同步时间线）/ No (unemployment aligned to the companion timeline) |

按版本规则（见 [design/DESIGN_LOG.md](../DESIGN_LOG.md)），这批候选是 Q1 v1。小组选定后，入选版本放到稳定路径 `design/q1/prototype/`（尚未建立）；在之后任何大改动之前，先给这批候选打 tag `q1-v1`。
Under the versioning rule, these candidates are Q1 v1. Once the group chooses, the selected version moves to the stable path `design/q1/prototype/` (not created yet); tag this commit `q1-v1` before any further major change.

## URL 参数 / URL parameters

所有页面都支持 `theme=light|dark`。/ Every page accepts `theme=light|dark`.

| 候选 / Variant | 参数 / Parameters |
| --- | --- |
| A | `step=1\|2\|3\|0`（0 = Explore all）, `mode=count\|index`, `range=all\|2015\|zoom`, `focus=ow\|odsp` |
| B | `step=1\|2\|3\|0`, `mode=yoy\|base`, `range=all\|2015\|zoom`, `ann=ann\|total` |
| C | `step=1\|2\|3\|0`, `mode=count\|index`, `range=all\|2015\|zoom` |
| D | `step=1\|2\|3\|0`, `mode=count\|index`, `t=2021Q3`（滑块位置 / slider position） |

例 / Examples: `variants/a-timeline/index.html?step=2&mode=index&range=zoom`, `variants/d-paths/index.html?t=2021Q3`

## 文件 / Files

- `index.html`：候选总览（卡片、比较表、推荐、待决定事项）/ overview of candidates
- `shared/q1.css`：从 Q3 v2 复制的全站变量和页面骨架，新增 OW/ODSP 颜色等 / site tokens copied from Q3 v2 plus OW/ODSP colours
- `shared/q1-common.js`：数据加载、所有派生事实（指数、同比、阶段变化、失业率、历史序列）和共用绘图函数 / data loading, every derived fact, shared helpers
- `variants/<候选>/index.html` + `<a|b|c|d>.js`：各候选 / each candidate
- `screenshots/`：每个候选的 `-desktop-light`、`-desktop-dark`（1360px）、`-mobile-light`、`-mobile-dark`（400px）、`-state`（关键交互状态）、`-thumb`（总览卡片缩略图），以及总览页截图 / per-candidate desktop, phone, interaction-state and thumbnail screenshots, plus the overview page

交互状态截图对应的 URL / State screenshots: A `step=2&mode=index&range=zoom` · B `step=0&mode=base&range=zoom&ann=total` · C `step=2&mode=index` · D `step=2&mode=index`
