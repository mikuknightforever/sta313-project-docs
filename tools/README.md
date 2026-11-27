# 测试与复核工具 / Check and Verification Tools

Q1–Q3 原型页面的自动检查脚本和 pandas 复核脚本。设计文档里"渲染检查""数字复核"两节的结果都是用这些脚本得到的。
Automated page checks and pandas verification scripts for the Q1–Q3 prototypes; the "rendering check" and "number recomputation" results in the design documents come from these scripts.

## 需要 / Requirements

- Node 22 或更新（用到内置的 `fetch` 和 `WebSocket`）/ Node 22+ (built-in `fetch` and `WebSocket`)
- Microsoft Edge 或 Google Chrome（自动查找；也可以设 `BROWSER=浏览器路径`）/ Edge or Chrome (found automatically, or set `BROWSER=/path/to/browser`)
- Python 3，装有 `pandas`、`numpy`；分析脚本另需 `openpyxl` / Python 3 with `pandas`, `numpy`; the analysis scripts also need `openpyxl`

不用单独开服务器：检查脚本会先看 `HTTP_PORT`（默认 8000）上是否已有本仓库的服务器（`python serve.py`），没有就自己启动 `serve.py`，结束时关掉。
No separate server needed: a check script reuses a server for this repository on `HTTP_PORT` (default 8000) or starts `serve.py` itself and stops it at the end.

所有命令都在**仓库根目录**运行。/ Run every command from the **repository root**.

## 页面检查 / Page checks（`check_q1.mjs`、`check_q2.mjs`、`check_q3.mjs`）

无头浏览器按精确宽度打开页面，检查：页面横向滚动、SVG 出界、文字重叠、文字被裁切、控制台错误；可以截图、用真实的鼠标、键盘、触摸事件操作页面。
A headless browser opens pages at exact widths and checks page scroll, SVG overflow, overlapping and clipped text and console errors; it can take screenshots and drive real mouse, keyboard and touch events.

```bash
node tools/check_q1.mjs <目录 / dir> <前缀 / prefix> [状态 URL 参数 / state query] [任务 / tasks]
node tools/check_q2.mjs <目录 / dir> <前缀 / prefix> [状态 URL 参数 / state query] [任务 / tasks]
node tools/check_q3.mjs [all|shots|hover|keys|touch|brush|dump]
```

- `<目录>`：`variants/` 下的文件夹名（如 `d-plane-share`、`a-dumbbell`），`.` 表示总览页，`archive/...` 表示存档版本。/ A folder under `variants/`, `.` for the overview, `archive/...` for an archived version.
- 例 / Examples:
  - `node tools/check_q1.mjs d-plane-share x "" checks,keys`：三种宽度的版面检查 + 键盘 / layout at 1360, 820, 400 px plus keyboard
  - `node tools/check_q1.mjs d-paths d "view=3d" shots,thumb`：桌面、手机、浅色、深色截图 + 交互状态截图 + 缩略图（写入 `design/q1/screenshots/d-*.png`）/ screenshots into `design/q1/screenshots/`
  - `QS="theme=light&view=diff;theme=dark&view=3d" node tools/check_q1.mjs d-paths x "" checkq`：指定状态 × 三种宽度 / listed states × three widths
  - `SQ="theme=light&view=3d" node tools/check_q1.mjs d-plane-level x "" sweepfast`：3D 全部允许角度扫描（只有参照面版本有这个测试钩子）/ every allowed 3D angle (reference-plane versions only)

**常用任务 / Common tasks**

| 脚本 / Script | 任务 / Task | 作用 / What it does |
| --- | --- | --- |
| Q1、Q2 | `shots` | 桌面 1360 / 手机 400 × 浅色 / 深色截图，外加 `stateQuery` 状态截图，写进该问题的 `screenshots/` / four screenshots plus a state screenshot |
| Q1、Q2 | `checks` | 1360 / 820 / 400 px 版面检查 / layout checks at three widths |
| Q1、Q2 | `keys` | Tab 能否到达全部控件、分段按钮 Enter 是否生效 / keyboard reachability |
| Q1、Q2 | `thumb` | 总览卡片缩略图（Q1 可用 `THQ=` 指定状态）/ overview thumbnail |
| Q1 | `facts` | 导出页面计算的事实和全部文字到 `tools/out/q1_<前缀>_dump.json`，给 `verify_q1.py` 用 / dump for `verify_q1.py` |
| Q1 | `checkq` | `QS` 里每个状态 × 三种宽度 / each state in `QS` × three widths |
| Q1 | `sweepfast` | 3D 全部角度（yaw −20°–110°、pitch −50°–85°，两种宽度）/ every 3D angle |
| Q1 | `interact3d`、`diffcons`、`consistency` | D 的 3D 交互、OW − ODSP 视图和正视图的像素一致性 / D's 3D interactions and projection consistency |
| Q1 | `figshot` | 只截图 1a 到 `tools/out/` / Figure 1a shots into `tools/out/` |
| Q2 | `texts` | 导出 `STATES` 里每个状态的事实和文字到 `tools/out/q2_<前缀>_texts.json`，给 `verify_q2.py` 用 / dump for `verify_q2.py` |
| Q2 | `state`、`eval`、`hoverat` | 自定义状态截图（`NAME`、`W`、`MOB`）、执行页面 JS（`JS`）、悬停或点按（`SEL`、`FX`、`FY`、`MOB`）/ custom state shot, page JS, hover or tap |
| Q3 | `shots`、`hover`、`keys`、`touch`、`brush`、`dump` | 截图（写进 `design/q3/screenshots/`）、悬停联动、键盘、触摸、刷选、导出地图标签和卡片给 `verify_q3.py` / screenshots, hover, keys, touch, brush, dump |

注意：Q1 的 `views` 和 `mob3d` 会重写 D 的 `d3d-*.png` 截图，只在更新 D 时使用；`shots` 会覆盖对应前缀的截图。
Note: Q1's `views` and `mob3d` rewrite D's `d3d-*.png` screenshots; `shots` overwrites the screenshots for its prefix.

环境变量 / Environment: `HTTP_PORT`（默认 8000）、`CDP_PORT`（Q1 9335、Q2 9336、Q3 9333；同时跑两个脚本时要不同）、`BROWSER`、`PYTHON`。

## 数字复核 / Number verification

先用检查脚本导出页面内容，再用 pandas 从原始 CSV 独立重算并逐项比较。/ Dump the pages, then recompute everything from the CSVs in pandas.

```bash
# Q1 A–D
for v in "a-timeline a" "b-change b" "c-longview c" "d-paths d"; do set -- $v; node tools/check_q1.mjs $1 $2 "" facts; done
python tools/verify_q1.py

# Q1 D + insight 5–9（插入面版本：叠加层的全部数字 / every overlay number）
for m in plans gates trend porcupine ghost; do node tools/check_q1.mjs d-insight-$m ins-$m "" facts; done
python tools/verify_q1_insight.py

# Q2 A–C（6 个页面状态 / six page states）
ST="theme=light;theme=light&step=2;theme=light&step=3;theme=light&step=4;theme=light&step=0&period=pre&cma=532;theme=light&step=0&period=post&cma=505"
for v in "a-dumbbell a" "b-arrows b" "c-tilemap c"; do set -- $v; STATES="$ST" node tools/check_q2.mjs $1 $2 "" texts; done
python tools/verify_q2.py

# Q3 v2
node tools/check_q3.mjs dump
python tools/verify_q3.py
```

预期结果 / Expected: 事实字段全部 0 处不一致。Q1 A、B、C 会列出几个"unexplained"数字（235,501 的四舍五入、16.75 年、正则多抓的逗号），已在 `design/q1/Q1_DESIGN.md` §10.3 逐条说明；Q2 0 个未解释；Q3 95 项 0 处不一致。
All fact fields match. Q1 A, B and C list a few "unexplained" numbers that Q1_DESIGN.md §10.3 explains one by one; Q2 has none; Q3 checks 95 items with 0 mismatches.

Q3 失业率额外版本的检查脚本在它自己的目录里（Python Playwright + 本机 Edge，以及只用标准库的数字复核），用法见 [design/q3/unemployment-prototype/README.md](../design/q3/unemployment-prototype/README.md)。/ The Q3 unemployment extra version keeps its own checks (Python Playwright + installed Edge, and a standard-library number check) in its folder.

```bash
python design/q3/unemployment-prototype/verify_browser.py
python design/q3/unemployment-prototype/verify.py
```

Q2 额外版本 D、D2、E、F、G–N 和 Q3 的方块版本也一样（先跑浏览器检查导出页面内容，再用标准库复核数字）。G–K 共用一套脚本，可只跑其中几个（如 `g k`）；`--no-shots` 跳过截图。/ Q2 extra versions D, D2, E, F and G–K work the same way; G–K share one pair of scripts.

```bash
python design/q2/variants/d-clouds/verify_browser.py
python design/q2/variants/d-clouds/verify.py
python design/q2/variants/d2-clouds-waffle/verify_browser.py   # D2 = D + 开场 / D + the opening
python design/q2/variants/d2-clouds-waffle/verify.py
python design/q2/variants/e-scroll/verify_browser.py           # E = 滚动故事 + D 的探索区 / scroll story + D's explorer
python design/q2/variants/e-scroll/verify.py
python design/q2/variants/f-heatmap/verify_browser.py          # F = 热力地图 + 展望 / map over time + outlook
python design/q2/variants/f-heatmap/verify.py
python tools/check_q2_maplab.py                                # G–N = F 的地图形式 / map forms of F（G–K 14 项，L、M、N 16 项）
python tools/verify_q2_maplab.py                               # 每个标记的数值文字和颜色级别 + 全部文字 / every mark and every sentence
python tools/check_q3_blocks.py                                # Q3 方块版本 A、B / Q3 block versions（13 项 × 2，含地图形状和与 v2 逐字比较）
python tools/verify_q3_blocks.py                               # 每块的占比、差值、颜色、案件数、标签；高度同一比例、面积成比例
```

## 分析脚本 / Analysis（`tools/analysis/`）

- `q1_reference_planes.py`：Q1 参照面的全部数字和稳健性（换基期、平滑、趋势外推窗口），对应 `Q1_DESIGN.md` §7.3。/ All numbers and robustness checks for the Q1 reference planes.
- `q1_cases_vs_other_variables.py`：案件数与失业率、劳动力、构成、CMA、每案人数的组合分析（3D 是否值得升维的讨论）。/ Cases combined with unemployment, labour force, composition, CMAs and people per case.

```bash
python tools/analysis/q1_reference_planes.py
python tools/analysis/q1_cases_vs_other_variables.py
```

## 提交前建议 / Before committing a page change

1. 改了哪个页面，就对它跑 `checks,keys`，以及相关状态的 `checkq`；3D 相关改动加 `sweepfast` 或 `interact3d`。/ `checks,keys` and `checkq` for the page you changed; `sweepfast` or `interact3d` for 3D changes.
2. 页面上的数字有变化时，重新导出并运行对应的 `verify_q*.py`。/ Re-dump and re-verify when numbers change.
3. 截图有变化时用 `shots` 重拍，并更新文档里提到的截图。/ Retake screenshots with `shots`.
