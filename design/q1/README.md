# Q1 候选版本 / Q1 Candidate Variants

Q1（总体趋势）的 v1 是四个候选版本，供小组比较、选择。设计理由见 [Q1_DESIGN.md](Q1_DESIGN.md)，参考案例见 [REFERENCES.md](REFERENCES.md)。
Q1 (overall trends) v1 consists of four candidate variants for the group to compare. See [Q1_DESIGN.md](Q1_DESIGN.md) for the rationale and [REFERENCES.md](REFERENCES.md) for reference works.

**所有页面的链接见下方 [页面入口](#页面入口--page-links)。/ All page links are in [Page links](#页面入口--page-links) below.**

## 页面入口 / Page links

先在仓库根目录启动本地服务器（见下方"运行"），再点下表的本地链接。"直达"链接会直接打开最能看出这个版本特点的视图。
Start the local server from the repository root (see "Run" below), then use the local links. "Direct" links open the view that shows each version best.

| 页面 / Page | 本地链接 / Local link | 直达 / Direct | 源代码 / Source |
| --- | --- | --- | --- |
| 总览（所有候选的卡片）/ Overview (all candidates) | <http://localhost:8000/design/q1/> | — | [index.html](index.html) |
| A · Annotated timeline | <http://localhost:8000/design/q1/variants/a-timeline/> | — | [a-timeline/index.html](variants/a-timeline/index.html) |
| B · Change, not level | <http://localhost:8000/design/q1/variants/b-change/> | — | [b-change/index.html](variants/b-change/index.html) |
| C · The long view | <http://localhost:8000/design/q1/variants/c-longview/> | — | [c-longview/index.html](variants/c-longview/index.html) |
| D v3 · One path, two programs（含 3D 和 OW − ODSP 视图 / with 3D and OW − ODSP views） | <http://localhost:8000/design/q1/variants/d-paths/> | [?view=3d](http://localhost:8000/design/q1/variants/d-paths/?view=3d) | [d-paths/index.html](variants/d-paths/index.html) |
| D + plane 1 · OW-share planes（OW 占比面） | <http://localhost:8000/design/q1/variants/d-plane-share/> | [?view=3d](http://localhost:8000/design/q1/variants/d-plane-share/?view=3d) | [d-plane-share/index.html](variants/d-plane-share/index.html) |
| D + plane 2 · Time slice（时间切面） | <http://localhost:8000/design/q1/variants/d-plane-slice/> | [?view=3d&t=2021Q3](http://localhost:8000/design/q1/variants/d-plane-slice/?view=3d&t=2021Q3) | [d-plane-slice/index.html](variants/d-plane-slice/index.html) |
| D + plane 3 · Constant-total plane（合计不变面） | <http://localhost:8000/design/q1/variants/d-plane-total/> | [?view=sum](http://localhost:8000/design/q1/variants/d-plane-total/?view=sum) | [d-plane-total/index.html](variants/d-plane-total/index.html) |
| D + plane 4 · Back-to-2019 Q4 planes（2019 Q4 水平面） | <http://localhost:8000/design/q1/variants/d-plane-level/> | [?view=3d](http://localhost:8000/design/q1/variants/d-plane-level/?view=3d) | [d-plane-level/index.html](variants/d-plane-level/index.html) |
| 存档 / Archive: D v1（只有 2D / 2D only） | <http://localhost:8000/design/q1/archive/q1-d-paths_2026-11-12_v1/> | — | [q1-d-paths_2026-11-12_v1/index.html](archive/q1-d-paths_2026-11-12_v1/index.html) |
| 存档 / Archive: D v2（3D，没有 OW − ODSP 视图 / 3D, no OW − ODSP view） | <http://localhost:8000/design/q1/archive/q1-d-paths_2026-11-14_v2/> | — | [q1-d-paths_2026-11-14_v2/index.html](archive/q1-d-paths_2026-11-14_v2/index.html) |

## 运行 / Run

页面直接读取 `datasets/ONT-SA/selected/` 中的 4 个 CSV。浏览器不允许 `file://` 页面读取本地文件，所以要在**仓库根目录**启动本地服务器：
The pages read four CSVs in `datasets/ONT-SA/selected/`. Browsers block this from `file://`, so start a server from the **repository root**:

```bash
python serve.py
```

[`serve.py`](../../serve.py) 在仓库根目录，用法和 `python -m http.server 8000` 一样，但会告诉浏览器不要缓存，**每次都读取最新文件**：`git pull` 之后普通刷新就能看到最新版本。端口被占用时，先在原来的终端按 Ctrl+C 关掉旧的服务器，或运行 `python serve.py 8001`（链接里的 8000 也换成 8001）。
[`serve.py`](../../serve.py) (repository root) works like `python -m http.server 8000` but tells the browser not to cache, so **every load reads the latest files** and a normal refresh after `git pull` shows the latest version. If the port is busy, stop the old server with Ctrl+C, or run `python serve.py 8001` (and use 8001 in the links).

然后打开上方 [页面入口](#页面入口--page-links) 表里的链接，例如总览页 <http://localhost:8000/design/q1/>。/ Then use the links in [Page links](#页面入口--page-links) above, e.g. the overview <http://localhost:8000/design/q1/>.

这些本地链接只有在本地服务器运行时才能打开；在 GitHub 上点表格里的 `index.html` 只会显示源代码。如果以前用 `python -m http.server` 打开过这些页面，浏览器里可能还存着旧文件：换成 `serve.py` 后，在每个打开过的页面上按一次 **Ctrl+F5**（Mac：Cmd+Shift+R），以后就不用再按了。
The local links work only while the local server is running; on GitHub, the `index.html` links in the table show source code. If you opened these pages before with `python -m http.server`, your browser may still hold old copies: after switching to `serve.py`, press **Ctrl+F5** (Mac: Cmd+Shift+R) once on each page you had opened; after that it is not needed.

需要联网加载 D3 7.9.0（cdnjs）。/ D3 7.9.0 loads from cdnjs.

## 版本 / Variants

| 候选 / Variant | 一句话 / One line | 目录 / Folder | 改变已定决定？/ Changes a settled decision? |
| --- | --- | --- | --- |
| A · Annotated timeline | 双折线 + 数量/指数切换 + 叙事步骤 + 对齐的失业率条带 / two lines, cases-index toggle, story steps, aligned unemployment strip | [variants/a-timeline/](variants/a-timeline/index.html) | 否 / No |
| B · Change, not level | 同比变化小倍数（共用纵轴）+ 同向条带 + 分阶段对比 / YoY small multiples on one axis, same-direction strip, per-period comparison | [variants/b-change/](variants/b-change/index.html) | **是：主图不显示案件数 / Yes: main view is not case counts** |
| C · The long view | 1969 年以来全部社会援助的可刷选概览 + OW/ODSP 详图 / brushable all-programs overview since 1969 + OW/ODSP detail | [variants/c-longview/](variants/c-longview/index.html) | 否 / No |
| D · One path, two programs | 连接散点图（横 ODSP、纵 OW）+ 时间滑块 + 阅读说明 + 同步时间线；当前为 v3：可切换到正交 3D 时空路径、两个时间视图和 OW − ODSP 视图 / connected scatterplot with slider, reading key, companion timeline; now v3: optional orthographic 3D space-time view, two time views and an OW − ODSP view | [variants/d-paths/](variants/d-paths/index.html)（v3，当前 / current） | 否（失业率对齐到同步时间线）/ No (unemployment aligned to the companion timeline) |
| D + plane 1 · OW-share planes | D v3 + OW 占比面（38.3% = 2019 Q4 构成，即等增长平面；后墙 35–50% 射线）/ D v3 plus planes of constant OW share | [variants/d-plane-share/](variants/d-plane-share/index.html) | 否 / No |
| D + plane 2 · Time slice | D v3 + 跟随滑块的时间切面 + 底面疫情灰带 / D v3 plus a time slice that follows the slider and a pandemic floor band | [variants/d-plane-slice/](variants/d-plane-slice/index.html) | 否 / No |
| D + plane 3 · Constant-total plane | D v3 + OW + ODSP = 2019 Q4 合计的平面 + 侧对视图 "OW + ODSP over time" / D v3 plus a constant-total plane and its edge-on view | [variants/d-plane-total/](variants/d-plane-total/index.html) | 否 / No |
| D + plane 4 · Back-to-2019 Q4 planes | D v3 + OW、ODSP 各自的 2019 Q4 水平面，可只看一个 / D v3 plus each program's 2019 Q4-level plane | [variants/d-plane-level/](variants/d-plane-level/index.html) | 否 / No |

按版本规则（见 [design/DESIGN_LOG.md](../DESIGN_LOG.md)），这批候选是 Q1 v1。小组选定后，入选版本放到稳定路径 `design/q1/prototype/`（尚未建立）；在之后任何大改动之前，先给这批候选打 tag `q1-v1`。
Under the versioning rule, these candidates are Q1 v1. Once the group chooses, the selected version moves to the stable path `design/q1/prototype/` (not created yet); tag this commit `q1-v1` before any further major change.

## URL 参数 / URL parameters

所有页面都支持 `theme=light|dark`。/ Every page accepts `theme=light|dark`.

| 候选 / Variant | 参数 / Parameters |
| --- | --- |
| A | `step=1\|2\|3\|0`（0 = Explore all）, `mode=count\|index`, `range=all\|2015\|zoom`, `focus=ow\|odsp` |
| B | `step=1\|2\|3\|0`, `mode=yoy\|base`, `range=all\|2015\|zoom`, `ann=ann\|total` |
| C | `step=1\|2\|3\|0`, `mode=count\|index`, `range=all\|2015\|zoom` |
| D | `step=1\|2\|3\|0`, `mode=count\|index`, `t=2021Q3`（滑块位置 / slider position）, `view=path\|3d\|ow\|odsp\|diff`（图 1a 视图；`diff` = OW − ODSP over time / Figure 1a view）, `yaw=…&pitch=…`（仅 3D 的自由角度，pitch −50° 到 85° / free angle, 3D only） |

| D + plane 1–4 | 与 D 相同，另加 `plane=on\|off`（版本 1–3）或 `plane=both\|ow\|odsp\|off`（版本 4）；版本 3 另有 `view=sum`（OW + ODSP over time）/ as D, plus `plane=…`; version 3 also `view=sum` |

例 / Examples: `variants/d-plane-share/index.html?view=3d`, `variants/d-plane-total/index.html?view=sum&mode=index`, `variants/a-timeline/index.html?step=2&mode=index&range=zoom`, `variants/d-paths/index.html?t=2021Q3`, `variants/d-paths/index.html?view=3d`

## 文件 / Files

- `index.html`：候选总览（卡片、比较表、推荐、待决定事项）/ overview of candidates
- `shared/q1.css`：从 Q3 v2 复制的全站变量和页面骨架，新增 OW/ODSP 颜色等 / site tokens copied from Q3 v2 plus OW/ODSP colours
- `shared/q1-common.js`：数据加载、所有派生事实（指数、同比、阶段变化、失业率、历史序列）和共用绘图函数 / data loading, every derived fact, shared helpers
- `variants/<候选>/index.html` + `<a|b|c|d>.js`：各候选 / each candidate
- `screenshots/`：每个候选的 `-desktop-light`、`-desktop-dark`（1360px）、`-mobile-light`、`-mobile-dark`（400px）、`-state`（关键交互状态）、`-thumb`（总览卡片缩略图），以及总览页截图 / per-candidate desktop, phone, interaction-state and thumbnail screenshots, plus the overview page

交互状态截图对应的 URL / State screenshots: A `step=2&mode=index&range=zoom` · B `step=0&mode=base&range=zoom&ann=total` · C `step=2&mode=index` · D `view=3d`

D 的 3D 截图 / D 3D screenshots: `d3d-3d-{light,dark}.png`（斜视 / oblique）, `d3d-path-…`, `d3d-ow-…`, `d3d-odsp-…`, `d3d-diff-…`（四个正视预设，`diff` 为 v3 新增 / the four front presets, `diff` new in v3）, `d3d-3d-mobile-{light,dark}.png`（400px）。

参照面版本截图 / Reference-plane screenshots: `dplane-{share,slice,total,level}-{desktop,mobile}-{light,dark}.png`、`-state.png`、`-thumb.png`。

## 版本 / Versions

候选 A–D 的 v1 已打 tag `q1-v1`（`a193c19`）。D 现在是 v3（v2 加了可选 3D 视图，v3 加了 OW − ODSP 视图）；D v1 存档在 [`archive/q1-d-paths_2026-11-12_v1/`](archive/q1-d-paths_2026-11-12_v1/index.html)，D v2 存档在 [`archive/q1-d-paths_2026-11-14_v2/`](archive/q1-d-paths_2026-11-14_v2/index.html)（tag `q1-v2`）。版本索引见 [`archive/README.md`](archive/README.md)。
The v1 candidates are tagged `q1-v1`. D is now v3 (v2 added the 3D view, v3 the OW − ODSP view); D v1 and D v2 (tag `q1-v2`) are archived. See the version index.

D v3 之上另有四个并列的参照面版本（`variants/d-plane-*/`，共用 `shared/d-planes.js`），D v3 本身未改；这次提交打 tag `q1-v3`。/ Four parallel reference-plane versions build on D v3 (unchanged); this commit is tagged `q1-v3`.
