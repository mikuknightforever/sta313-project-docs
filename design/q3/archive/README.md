# Q3 版本索引 / Q3 Version Index

每个大版本都保留一份可运行的副本。当前工作版本在稳定路径 [`design/q3/prototype/`](../prototype/)；旧的大版本放在本目录，命名为 `<任务名>_<YYYY-MM-DD>_v<N>/`。规则见 [`design/q3/README.md`](../README.md#版本--versions)。

Every major version keeps a runnable copy. The current working version lives at the stable path [`design/q3/prototype/`](../prototype/); earlier major versions live in this folder as `<task>_<YYYY-MM-DD>_v<N>/`. See the rule in [`design/q3/README.md`](../README.md#版本--versions).

| 版本 / Version | 日期 / Date | 提交 / Commit | Tag | 主要变化 / Main change | 目录 / Folder | 截图 / Screenshots |
| --- | --- | --- | --- | --- | --- | --- |
| v1 | 2026-11-12 | `55e5870` | `q3-v1` | 首版：图 2 为 CMA × 季度热力图（7 级绿↔紫），顶部时间刷选；图 1a/1b、图 3、图 4、叙事步骤 / First version: Figure 2 is a CMA × quarter heatmap with a timeline brush; Figures 1a/1b, 3, 4 and story steps | [`archive/q3-prototype_2026-11-12_v1/`](q3-prototype_2026-11-12_v1/README.md) | [v1 screenshots](q3-prototype_2026-11-12_v1/screenshots/) |
| v2（当前 / current） | 2026-11-12 | `a336f1a` | `q3-v2` | 图 2 改为比例符号地图 + 悬停分析卡片（5 级青绿↔紫），时间刷选移到第 2 步顶部，地图 ↔ 图 3 ↔ 图 4 联动 / Figure 2 becomes a proportional-symbol map with a hover analysis card; shared period brush; linked highlighting | [`design/q3/prototype/`](../prototype/) | [v2 screenshots](../screenshots/) |

运行任一版本：在仓库根目录执行 `python -m http.server 8000`，然后打开对应目录下的 `prototype/`，例如 <http://localhost:8000/design/q3/archive/q3-prototype_2026-11-12_v1/prototype/>（v1）或 <http://localhost:8000/design/q3/prototype/>（当前版本）。

To run any version, start `python -m http.server 8000` from the repository root and open that version's `prototype/` folder, e.g. the v1 or current URLs above.
