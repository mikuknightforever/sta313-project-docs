# Q1 版本索引 / Q1 Version Index

当前工作版本在稳定路径（候选阶段为 [`design/q1/variants/`](../variants/)，选定后为 `design/q1/prototype/`）；旧的大版本放在本目录，命名为 `<任务名>_<YYYY-MM-DD>_v<N>/`。版本规则见 [`design/DESIGN_LOG.md`](../../DESIGN_LOG.md)。
The current working versions live at stable paths (`design/q1/variants/` during the candidate stage, `design/q1/prototype/` once chosen); earlier major versions live here as `<task>_<YYYY-MM-DD>_v<N>/`.

| 版本 / Version | 日期 / Date | 提交 / Commit | Tag | 主要变化 / Main change | 目录 / Folder | 截图 / Screenshots |
| --- | --- | --- | --- | --- | --- | --- |
| Q1 v1（候选 A–D）/ candidates A–D | 2026-11-12 | `a193c19` | `q1-v1` | 四个候选：A 时间线、B 变化、C 长时段、D 连接散点图 / Four candidates | 整批见 tag `q1-v1`；A、B、C 仍在 [`variants/`](../variants/) 且未改动 / whole batch at tag `q1-v1`; A–C unchanged in `variants/` | [`screenshots/`](../screenshots/) |
| D v1（存档）/ D v1 (archived) | 2026-11-12 | `a193c19` | `q1-v1` | 只有 2D 连接散点图 / 2D connected scatterplot only | [`archive/q1-d-paths_2026-11-12_v1/`](q1-d-paths_2026-11-12_v1/index.html) | [D v1 screenshots](q1-d-paths_2026-11-12_v1/screenshots/) |
| D v2（当前）/ D v2 (current) | 2026-11-12 | 本次提交 / this commit | — | 图 1a 增加可选的正交 3D 时空路径视图和两个时间视图，带预设、动画、导览 / Optional orthographic 3D space-time view and two time views | [`variants/d-paths/`](../variants/d-paths/index.html) | `screenshots/d-*.png`、`screenshots/d3d-*.png` |

**D v1 存档说明 / About the D v1 archive**：从 `a193c19` 取回 `variants/d-paths/`（`index.html`、`d.js`），并把 `shared/q1.css`、`shared/q1-common.js` 复制到同一目录，页面改为引用目录内的副本，这样以后修改 `shared/` 不会影响存档。只改了这两处引用和一行存档横幅；数据根路径层级不变（`../../../../`），已实际打开验证。`screenshots/` 是 v1 当时的 6 张截图（与 `a193c19` 逐字节相同）。
Restored from `a193c19`; the shared CSS and JS were copied in and the page points at the copies. Only those references and a banner changed. The six v1 screenshots are byte-identical to `a193c19`.

运行 / Run: 在仓库根目录 `python -m http.server 8000`，打开 <http://localhost:8000/design/q1/archive/q1-d-paths_2026-11-12_v1/>。
