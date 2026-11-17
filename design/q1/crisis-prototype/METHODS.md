# 分析设计与解释边界 / Analysis design and interpretation

## 1. 问题与受众 / Question and audience

受众仍为 MCCSS 社会援助案件监测与政策研究分析员。目标是区分“经济压力”“在册援助规模”和“支持相对基本生活基准的水平”。这些概念相关但不等价；原型提供描述性证据，不估计政策因果效果。

The audience remains MCCSS analysts monitoring social assistance and preparing policy research. Economic pressure, recorded caseloads, and income adequacy are related but distinct. The prototype supplies descriptive evidence, not causal policy-effect estimates.

## 2. 全省季度比较 / Provincial quarterly comparisons

课程 OW、ODSP 特征表包含 3、6、9、12 月的全省观测，2003 Q1–2026 Q1。与失业率的共同展示窗口固定为 **2017 Q1–2025 Q4**，36 季。`date` 中的每月 1 日是数据文件标签，不表示精确的季度末日或政策生效日。案件是个体／家庭案件单位，不是受益人数。OW 全省数值含小数，计算保留原精度，界面四舍五入；原字典指出包含 First Nations estimates，但不能据此确定所有小数的形成原因。

The course files contain Ontario observations for March, June, September and December. The common window is **2017 Q1–2025 Q4**, 36 quarters. First-of-month dates are file labels, not precise quarter-end or policy-event dates. Cases are case/family units, not people. Published decimal OW values are retained in calculations and rounded for display. The dictionary notes First Nations estimates; this does not fully explain every decimal value.

失业率使用 Statistics Canada 表 14-10-0287-01 中 Ontario / Total gender / ages 15+ / Estimate / Seasonally adjusted 的月度百分比。每季取三个已发布月度率的算术平均；这不是重新用季度失业人数除以劳动力人数计算的比率。不完整季度报错，缺失不置零。

Unemployment is the arithmetic mean of the three published monthly seasonally adjusted rates for Ontario, total gender, age 15+, from Statistics Canada table 14-10-0287-01. It is not a ratio recomputed from quarterly labour-force counts. Incomplete quarters fail validation; missing values are never treated as zero.

公式 / Formulas:

- `index(p,t) = 100 × cases(p,t) / cases(p,2019 Q4)`.
- `cases_yoy(p,t) = 100 × [cases(p,t) / cases(p,t−4) − 1]`.
- `unemployment_yoy(t) = quarterly_mean_rate(t) − quarterly_mean_rate(t−4)`，单位为百分点 / percentage points.

散点图只使用双方同比都有值的 2018 Q1–2025 Q4，32 季。2017 年案件同比有值，但失业率同比没有值，因此不进入联合散点。两个轴单位不同，不能相减构造保障评分。同比窗口重叠，点不独立；本版没有显著性检验或回归。

The trajectory uses the 32 quarters with both year-over-year measures, 2018 Q1–2025 Q4. Caseload YoY exists in 2017 but unemployment YoY does not. The axes have different units and are not subtracted into a score. Overlapping annual windows create dependence; no significance test or regression is fitted.

分析分期沿用项目：pre 至 2019 Q4，during 为 2020 Q1–2023 Q1，post 从 2023 Q2 开始。它们是探索标签，不是 CERB/CRB 资格期；政策事件另按官方日期标注。失业率也不表示符合 OW/ODSP 条件的人数，两个项目服务对象不同。

Project phase labels are pre through 2019 Q4, during from 2020 Q1 through 2023 Q1, and post from 2023 Q2. They are exploration labels, not CERB/CRB eligibility windows. Policy events use separate official dates. Unemployment does not count people eligible for OW or ODSP, whose populations differ.

## 3. 年度家庭情景 / Annual household examples

来源为 Maytree *Welfare in Canada* 2020、2024 版，对 Toronto 单身无子女、全年领取援助、无就业收入、私人租房并符合报告假设的家庭建模。OW 样例为 considered employable；ODSP 样例为 with a disability。总福利收入包括基本援助及联邦／省税收抵免等，不能标成仅 OW/ODSP 支付。2020 包含一次 GST/HST 疫情补贴；不含 CERB/CRB，因为模型家庭不满足相关收入假设。

Maytree's 2020 and 2024 editions model unattached Toronto adults receiving assistance all year, with no employment income and private-market rent under the reports' assumptions. OW uses an employable-adult example; ODSP uses a disability example. **Total welfare income includes other government transfers and credits, not just OW/ODSP payments.** The 2020 examples include a one-time GST/HST pandemic top-up and exclude CERB/CRB under the model's income assumptions.

公式 / Formulas:

- `benchmark_ratio = 100 × total_welfare_income / report_vintage_single_person_MBM`.
- `dollar_difference = MBM − total_welfare_income`.

MBM 是基本生活篮子收入基准，不是实际每户开支。两年均保留 2018-base 的报告口径与发布时基准，不接入最新网页改用的 2023-base。各版估算与来源状态见数据说明；两年不连接为趋势、不插补、不计算改善／恶化排名。2024 的门槛金额由 LCF 表和 ISAC PDF 明示核对，并以 Maytree 方法确认 Toronto 和基准版本；未用舍入比例反推金额。

MBM is a basket-based income benchmark, not each household's observed spending. Both snapshots preserve the editions' 2018-base benchmarks, rather than mixing the latest webpage's 2023-base revision. Publication-vintage estimation and provenance are documented in the source file. There is no connected trend, interpolation or improvement ranking. The 2024 threshold is explicitly corroborated in the LCF table and ISAC PDF, with geography/base checked against Maytree; it is not back-calculated from a rounded ratio.

MBM 通常比较可支配收入，Maytree 这里比较总福利收入，可能低估不足程度；共同单人 MBM 不含残障额外费用。低于 100% 只表明该样例的总收入低于所选门槛，不能推断覆盖率、全部领取者的状况或整体政策效果。ODSP 比例较高不构成项目表现排名。

MBM normally concerns disposable income; using total welfare income may understate inadequacy. The common single-person benchmark does not include additional disability costs. A value below 100% indicates a shortfall for the specified example against that benchmark, not population coverage or overall policy effectiveness. A higher ODSP ratio is not a performance ranking.

## 4. 图表与交互理由 / Visual and interaction rationale

- 数量／指数切换分别支持规模与相对变化比较；共同时间轴避免任意双纵轴对齐。/ Counts and indices answer scale and relative-change questions; aligned panels avoid a dual-axis comparison.
- 同比散点用位置表达方向和幅度，项目分开查看，不用红绿编码好坏。/ YoY positions encode direction and magnitude, with separate program views and no success/failure colour coding.
- 充分性以共同的 100% 参照比较同年两种情景。年份选择器保留独立快照，不制造可比时间趋势。/ A shared 100% reference compares the two same-year examples; a year selector preserves separate snapshots.
- 时期选择、项目切换、滑块与数据表分别支持筛选、比较、查值与可访问阅读。/ Phase filters, program switches, a quarter slider and tables support filtering, comparison, value retrieval and accessible reading.

课程对照：可视化与交互为核心（R1/R2），页面自包含（R4），课程数据为主（R5），单一受众（R6），位置编码与解释边界支持 R7/R8/R12/R13/R15；L2 数据／任务抽象、L3 位置通道、L4 对齐与色相、L5 linked views / selection、L6 引导后探索均有对应。没有空间研究任务，因此 Q1 不加地图。R3 公开部署、R16 全组开发分工、R17/R18 最终报告与贡献材料不由此原型完成；没有把初稿称为最终交付或真人受众测试。

The candidate addresses the visualization, interaction, self-contained explanation, course-data and audience requirements. Position, alignment, consistent program hues, linked selections and guided exploration support L2–L6 principles. Q1 has no spatial task requiring a map. Public deployment, the team's development allocation, and final report/contribution documents remain separate deliverables. No human usability test is claimed.
