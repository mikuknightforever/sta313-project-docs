# Q1 危机响应与支持充分性：初级原型 / Crisis response and income adequacy: initial prototype

状态 / Status: **v1，供讨论的独立候选 / standalone candidate for review**。本聊天确认了 Q1 的新引导问题；不代表小组已选定全站最终方案。网站英文、说明中英双语。研究日期 / Research date: 2026-11-17.

> 重大社会危机来临时，社会援助体系能否提供足够支持？——以 COVID-19 期间的 OW 与 ODSP 为观察窗口。
>
> Can social assistance provide enough support during a major crisis? OW and ODSP during COVID-19 provide a window into that question.

本版本只深化 Q1：**经济压力 → 在册案件响应 → 特定家庭的收入充分性**。它仍是全项目的第一部分；Q2 的家庭构成与地区比较、Q3 的 OW 受助时长与地区比较保持各自范围。没有加入 A2 式预测比较，因为预测误差不能直接衡量保障是否充分。

This candidate develops Q1 through **economic pressure → recorded caseload response → income adequacy for specified household examples**. Q2 remains about family composition across CMAs; Q3 remains about OW duration composition across CMAs. Prediction-model comparisons are not part of this prototype.

## 打开 / Open

- **最方便 / Portable:** 下载 [standalone.html](standalone.html) 后用浏览器打开，不需要网络、安装依赖或运行服务器。GitHub 的文件页显示源码，请使用 Download raw file。/ Download `standalone.html` and open it in a browser. GitHub's file viewer shows source; use **Download raw file**. This portable file includes the source CSVs and computes the same values in the browser.
- **开发 / Development:** 仓库根目录运行 `python serve.py 8000`，打开 `http://localhost:8000/design/q1/crisis-prototype/`。/ Run the repository's static server, then open that path.
- [设计与方法 / Methods](METHODS.md) · [数据来源与假设 / Adequacy provenance](data/adequacy.sources.json) · [数字核对 / Numerical checks](verification.json) · [浏览器检查 / Browser checks](browser-verification.json).

## 三个视图 / Three views

1. **压力与规模 / Pressure and scale:** 全省 OW、ODSP 案件与季度平均失业率，共用时间轴。案件可以切换数量和 2019 Q4 = 100 的指数；时期按钮与季度滑块支持查值。/ Province-wide cases and unemployment share a time axis. Switch between counts and a 2019 Q4 = 100 index, filter phases, and inspect quarters.
2. **变化是否同步 / Changes together or apart:** 横轴失业率同比变化（百分点），纵轴案件同比变化（%）；切换 OW/ODSP。只解释同向与背离，不编码制度成败。/ A year-over-year trajectory compares unemployment changes with caseload changes. Quadrants describe directions, not success or failure.
3. **收入能覆盖多少基准 / Income against a benchmark:** 2020、2024 年多伦多单身家庭年度情景，显示 Maytree 总福利收入相对同版报告 MBM 的比例与金额差。用年份选择器，不画两点趋势。/ Separate annual Toronto single-adult examples compare modeled total welfare income with the report-vintage MBM benchmark. A year selector avoids implying a harmonized time series.

第三图是收入充分性的一个明确维度，不是领取率、覆盖率、未满足需求人数或整个制度的综合评分。/ Figure 3 measures one aspect of income adequacy, not take-up, population coverage, unmet-need counts, or an overall system score.

## 复现与验证 / Reproduction and checks

Python 需要 pandas；数据计算的交叉核对需要 Node。浏览器检查另外使用 Playwright 和系统 Chromium。页面本身无第三方运行依赖。

Python checks require pandas and Node; browser checks additionally use Playwright and system Chromium. The page itself has no third-party runtime dependency.

```sh
python design/q1/crisis-prototype/verify.py
python design/q1/crisis-prototype/build_standalone.py
python design/q1/crisis-prototype/verify_browser.py
```

`verify.py` 用 pandas 从原 CSV 独立重算浏览器的每季指标和四个年度情景，并逐月核对失业率筛选结果与原始 Statistics Canada 表。`build-manifest.json` 记录来源和页面文件哈希，离线页面必须在改动后重新生成。

`verify.py` independently recomputes the JavaScript quantities with pandas and checks the selected unemployment values against the raw Statistics Canada table. `build-manifest.json` records source and UI hashes. Rebuild the portable page after source edits.

验证限制：当前托管浏览器禁止 `file://` 导航，因此单文件以 HTTP 文档方式核对数据一致性及零额外网络资源请求；未声称在此环境完成本地文件打开测试。/ Verification limit: this managed browser blocks `file://` navigation. The portable document was tested over HTTP for identical results and zero additional network resources; local-file opening was not verified in this environment.

## 版本与集成 / Version and integration

新增目录保存一个并列方案；没有覆盖旧 Q1 A–D、参照面或 insight 版本，也没有改动只读 `datasets/`。此前没有本方案可归档的版本。后续对本方案的大改动应按仓库规则先归档本版，再记录新版本。

This is an additional candidate in a new directory. Existing Q1 variants and read-only datasets are preserved. There was no previous version of this candidate to archive. Archive this version before a future major redesign.

尚待小组决定：是否采用这个 Q1 叙事、是否补充更多可比年度与家庭情景、如何纳入最终全站和课程报告。/ Group decisions remain: adoption, additional comparable years or scenarios, and integration into the final site and report. No final course submission or hosted-site deployment is claimed.
