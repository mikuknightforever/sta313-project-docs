# Q1 外部参照数据 / Q1 external reference data

这两个小文件只给 Q1 的 "D + insight" 版本 5、6 使用（[`variants/d-insight-plans/`](../variants/d-insight-plans/index.html)、[`variants/d-insight-gates/`](../variants/d-insight-gates/index.html)）。它们**不是课程数据**，所以放在这里而不是只读的 `datasets/`。页面在浏览器里读取这两个文件，所有派生数字（误差、缺口、前后四个季度的变化）都由页面计算，并由 [`tools/verify_q1_insight.py`](../../../tools/verify_q1_insight.py) 用 pandas 独立复核。
These two small files are used only by Q1 "D + insight" versions 5 and 6. They are **not course data**, so they live here rather than in the read-only `datasets/`. The pages read them in the browser and compute every derived number; `tools/verify_q1_insight.py` re-checks them in pandas.

## `fao-caseload-plans.csv`

安省财政问责办公室（Financial Accountability Office of Ontario, FAO）对儿童、社区与社会服务厅（MCCSS）支出计划的三份审查报告中，OW 和 ODSP 的案件数（每月平均案件数，按财年 4 月–次年 3 月）。数字照抄各报告网页上图表的 accessible table；"一个案件 = 一个人或一个家庭单位"，与课程数据的定义相同。
OW and ODSP caseloads (average monthly cases, by April–March fiscal year) from three FAO reviews of the MCCSS spending plan, copied from each report's accessible tables. A case is one person or one family unit, as in the course data.

| vintage | 报告 / Report | 发布 / Published | 内容 / Series |
| --- | --- | --- | --- |
| `fao2024` | [Ministry of Children, Community and Social Services: Spending Plan Review](https://fao-on.org/en/report/fa2305-mccss/)（Figure 5.2 ODSP、5.4 OW） | 2024-06-05 | `fao_projection`：FAO 对 2023-24 至 2028-29 的预测 / FAO projection |
| `fao2025` | [MCCSS: 2025 Spending Plan Review](https://fao-on.org/en/report/estimates-2025-mccss/)（Figure 4.1、4.4） | 2025-10-23 | `fao_projection`：2025-26 至 2027-28 / FAO forecast |
| `fao2026` | [MCCSS: 2026 Spending Plan Review](https://fao-on.org/en/report/estimates-2026-mccss/)（Figure 4.2、4.4 和正文） | 2026-09-23 | `budget_funded_capacity`：2026 年预算拨款能资助的案件数（FAO 根据预算计划和 FAO 的人均津贴测算）/ caseload the 2026 Budget allocation would fund, as calculated by the FAO；`fao_shortfall`：FAO 估计的资助缺口 / FAO's funded caseload shortfall；`fao_actual`：2016-17 至 2025-26 的历史平均 / historical averages |

注意 / Notes
- "Funded case capacity" 是 FAO 的测算，**不是政府公布的案件目标**；页面这样写。/ Funded capacity is the FAO's calculation, not a government caseload target; the page says so.
- 2025 年报告说明 FAO 不能公开 2025 年预算中 OW、ODSP 的支出计划（FAO Act 第 13 条），所以没有 2025 年的"资助容量"。/ The 2025 review could not disclose the OW and ODSP spending plans, so there is no 2025 funded capacity.
- 2026 年报告的增长率（政府隐含 OW −2.7%/年、ODSP +1.4%/年；FAO OW +1.3%/年、ODSP +2.2%/年）可以由本文件的数字以 2025-26 实际为基年复算出来（−2.70%、+1.41%、+1.26%、+2.21%），用作抄录检查。/ The 2026 report's growth rates are reproduced from these numbers (base 2025-26), a check on the transcription.
- 课程数据是季末月份的快照；按财年取四个季末月份的平均，与 FAO 的 12 个月平均相差在 1% 以内（2020-21 OW −2.8%、2022-23 和 2023-24 OW +1.2% 除外，这几年变化快）。/ Course data are quarter-end snapshots; their fiscal-year means agree with the FAO's 12-month averages within 1% except in fast-changing years.

## `policy-events.csv`

版本 6 在立方体里画出的联邦收入支持窗口和省级规则变化。每一行都有来源；`date_precision = month` 表示来源只确认到月份，页面只显示月份。
The federal income-support window and provincial rule changes drawn by version 6. Every row has a source; `date_precision = month` means the source confirms only the month, and the page shows only the month.

| id | 日期 / Date | 内容 / What | 来源 / Source |
| --- | --- | --- | --- |
| CERB | 2020-03-15 – 2020-09-26 | Canada Emergency Response Benefit | [Canada Revenue Agency](https://www.canada.ca/en/revenue-agency/services/benefits/apply-for-cerb-with-cra.html)（"between March 15 and September 26, 2020"） |
| CRB | 2020-09-27 – 2021-10-23 | Canada Recovery Benefit | [Canada Revenue Agency](https://www.canada.ca/en/revenue-agency/services/benefits/recovery-benefit.html)（"between September 27, 2020 and October 23, 2021"） |
| 1 | 2018-07-31 | OW、ODSP 涨幅定为 1.5%（原计划 3%），取消基本收入试点 / rate increase set at 1.5%; basic income pilot cancelled | [Global News](https://globalnews.ca/news/4363514/ontario-tories-basic-income-social-assistance) |
| 2 | 2018-11-22 | 100 天审查后公布社会援助改革方案 / reform plan announced | [Global News](https://globalnews.ca/news/4640798/ontario-tories-social-assistance-reform) |
| 3 | 2020-04-23 | OW 对 CERB 的规定：计为劳动收入、部分豁免 / CERB counted as earned income, partly exempt | [O. Reg. 168/20](https://www.ontario.ca/laws/regulation/r20168) |
| 4 | 2022-09（月 / month） | ODSP 标准提高 5% / ODSP rates +5% | [CP24](https://www.cp24.com/news/five-per-cent-increase-in-odsp-funding-to-be-available-in-september-1.6020747)；安省减贫战略 2022 年报 / Ontario Poverty Reduction Strategy 2022 annual report |
| 5 | 2023-02-01 | ODSP 每月收入豁免由 200 加元提高到 1,000 加元 / earnings exemption $200 → $1,000 | [HALCO](https://www.halco.org/2023/news/changes-to-the-way-that-the-ontario-disability-support-program-odsp-deals-with-employment-income)（"take effect on February 1, 2023"） |
| 6 | 2023-07（月 / month） | ODSP 标准每年按通胀调整 / ODSP rates indexed to inflation | [Ontario Poverty Reduction Strategy 2022 annual report](https://www.ontario.ca/page/poverty-reduction-strategy-2022-annual-report) |

未收录 / Not included：2021 年 2 月的 "Recovery & Renewal" 社会援助转型愿景（ontario.ca 页面不允许自动读取，没能核实日期）；减贫战略 2020–2025 的就业目标（2024 年每年 60,000 名受助人进入就业）是**离开援助的流量**，课程数据里没有离开援助的人数，不能和案件存量比较，所以只在设计文档中说明。
Not included: the February 2021 "Recovery & Renewal" vision (date not verifiable from ontario.ca); the Poverty Reduction Strategy 2020–2025 employment target (60,000 recipients a year into work by 2024) is an exit flow that the course data cannot measure.

核对日期 / Checked: 2026-11-16。
