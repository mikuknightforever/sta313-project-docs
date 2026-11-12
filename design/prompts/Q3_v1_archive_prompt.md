# Q3 v1 存档 Prompt（给 Claude Code）

> 使用方式：在仓库根目录打开 Claude Code 会话，把下面分隔线以下的内容发过去。这一步要在开始 Q1 之前完成。

---

## 任务

给 STA313 小组项目 Q3 的 **v1（热力图版本）** 做一份可运行的存档，同时建立“每个大版本都保留”的规则，后面 Q1、Q2 都照这个规则做。**不要改动当前的 Q3 v2。**

## 现状

- 分支 `eric_roughwork` 上有两个 Q3 大版本，都已推送，还没有 tag：
  - **v1** `55e5870`：图 2 是 CMA × 季度热力图。
  - **v2** `a336f1a`：图 2 改为比例符号地图 + 悬停分析卡片，是当前的工作版本，位于 `design/q3/prototype/`。
- v2 用同名文件覆盖了 v1 的截图、`Q3_DESIGN.md` 和 `README.md`。所以 v1 的完整内容只在提交 `55e5870` 里，必须从那里取回。

## 要做的事

### 1. 恢复 v1 到存档目录
- 存档目录：`design/q3/archive/q3-prototype_2026-11-12_v1/`，命名沿用仓库规则 `任务名_YYYY-MM-DD_vN`。
- 从 `55e5870` 取回 `design/q3/` 下的全部内容，放进这个目录，保持原有结构：
  - `prototype/`（`index.html`、`q3.css`、`q3.js`、`_frame.html`）
  - `screenshots/`（v1 的 6 张截图）
  - `Q3_DESIGN.md`（v1 设计说明）
  - `README.md`（v1）
- 推荐做法：`git archive --format=tar 55e5870 design/q3 | tar -x -C <临时目录>`，再把内容移到存档目录。
- **注意 Windows 环境**：不要用 PowerShell 的 `>` 重定向 `git show` 的输出，它会改编码并损坏 PNG。用 Git Bash，或者上面的 `git archive` 方式。
- 不要用 `git checkout` 或 `git restore` 把旧文件恢复到原位置，那会覆盖 v2。

### 2. 存档内只允许两处修改
1. **数据路径**：存档后目录深了两层，把存档版 `q3.js` 中的 `const DATA = "../../../datasets/ONT-SA/selected/";` 改成 `"../../../../../datasets/ONT-SA/selected/"`（从 `design/q3/archive/<版本>/prototype/` 回到仓库根目录要上 5 层）。改完要实际打开验证。
2. **存档横幅**：在存档版 `index.html` 顶部加一行很小的提示，例如 “Archived version v1 (2026-11-12, commit 55e5870): Figure 2 was a CMA × quarter heatmap. Current version →”，链接到 `../../../prototype/`。样式用页面现有的 CSS 变量，深浅主题都要清楚可读。

除此之外，存档内的代码、文字和截图都保持 v1 原样，不要顺手修 bug，也不要改格式。

### 3. 存档说明
- 在存档版 `README.md` 顶部加一段中英双语说明：来源提交、日期、这个版本的主要特点、上面两处修改，以及被 v2 取代的原因（链接到当前 `design/q3/Q3_DESIGN.md` 第 6 节“放弃的方案”）。运行方法：仓库根目录执行 `python -m http.server 8000`，打开 `http://localhost:8000/design/q3/archive/q3-prototype_2026-11-12_v1/prototype/`。
- 新建 `design/q3/archive/README.md`，用表格列出版本索引：版本 / 日期 / 提交 / tag / 主要变化 / 目录 / 截图。v1 指向存档目录，v2 指向当前的 `design/q3/prototype/`。

### 4. 写下版本规则（Q1、Q2 也要遵守）
在 `design/q3/README.md` 的“版本”一节，以及 `design/DESIGN_LOG.md` 顶部说明里，各加一段简短的中英双语规则：
- 当前工作版本始终放在稳定路径（例如 `design/q3/prototype/`）。
- **大版本**指视图形式、编码方式、页面结构或叙事有明显变化；修 bug、改文字、调间距不算。
- 开始新的大版本之前，先把当前版本复制到 `archive/<任务名>_<YYYY-MM-DD>_v<N>/`，打 tag，再开始修改。
- tag 命名：`q1-v1`、`q2-v1`、`q3-v1`……
- 在 DESIGN_LOG 中给 Q3 v1 那一行加上存档目录的链接。

### 5. 打 tag
- 附注 tag：`q3-v1` 指向 `55e5870`（说明：“Q3 v1: CMA × quarter heatmap for Figure 2”），`q3-v2` 指向 `a336f1a`（说明：“Q3 v2: proportional-symbol map and hover analysis card”）。
- 如果本地或远程已经有同名 tag，停下来问我，不要覆盖。

## 分支与提交要求（按之前的做法）
- 在 `eric_roughwork` 分支上工作。先执行 `git status` 和 `git pull`，确认和远程同步。工作区里允许的未提交文件只有 `design/prompts/` 下的 prompt 文件，可以一起提交；如果还有其他未提交改动，先停下来问我。
- 不要切换到 `main`，不要合并到 `main`，不要强推，不要改写已有提交。
- 不要修改 `datasets/`，不要修改 `design/q3/prototype/` 和 `design/q3/screenshots/`（当前 v2）。
- 提交用仓库当前配置的 git 身份。提交说明格式：`存档 Q3 v1 热力图版本并建立版本规则 / Archive Q3 v1 heatmap version and add versioning rule`，正文简要列出改动。**不要加任何 AI 署名或 Co-Authored-By 之类的行。**
- 验证通过后，推送分支和两个 tag：`git push origin eric_roughwork`，然后 `git push origin q3-v1 q3-v2`。推送失败就报告原因，不要强推。

## 完成前自检（结果报告给我）
1. 存档版页面能打开：四个图都正常显示，热力图和时间刷选能用，控制台没有报错。截一张图，和存档里的 v1 截图对比，除了横幅外应基本一致。
2. 当前 v2 页面 `http://localhost:8000/design/q3/prototype/` 照常运行，没有任何变化。
3. `git diff --stat` 确认没有改动 `datasets/`、`design/q3/prototype/` 和 `design/q3/screenshots/`。
4. 存档里的 6 张 PNG 能正常打开，大小和 `git show 55e5870:<路径>` 的原文件一致（可以比较哈希）。
5. `git tag -n` 和 `git ls-remote --tags origin` 能看到 `q3-v1`、`q3-v2`，并指向正确的提交。
6. 列出新增和修改的文件。
