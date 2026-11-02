# 研究问题工作表 / Research Question Worksheet

10 月 31 日会议安排：每人于次日提出至少一个问题，团队筛选约四个。项目主题和主要受众尚未定案。

At the October 31 meeting, each member was asked to propose at least one question by the following day. The team will select approximately four. The topic and primary audience are not yet finalized.

## 受众与范围 / Audience and Scope

| 项目 / Item | 当前记录 / Current record |
| --- | --- |
| 主要受众 / Primary audience | 待确定 / TBD |
| 受众需要了解或完成的任务 / Audience needs and tasks | 待确定 / TBD |
| 沟通与分析目标 / Communication and analytical goals | 待确定 / TBD |
| 数据主题、时间范围、分析层级 / Data topic, time span, and analytical level | 待确定 / TBD |
| 背景资料及支持链接 / Background and supporting references | 待补充 / To be added |

## 候选问题 / Candidate Questions

| 编号 / ID | 提出者 / Author | 研究问题 / Question | 对受众的价值 / Audience value | 数据、字段、层级 / Data, fields, level | 局限与可行性 / Limitations and feasibility | 团队结论 / Decision |
| --- | --- | --- | --- | --- | --- | --- |
| Q1 | Yongjun Du（Richard） | 安大略省不同家庭类型的社会援助领取率是否存在差异？ / Do social assistance receipt rates differ across family types in Ontario? | 比较受助覆盖差异，为政策讨论提供描述性证据 / Describe differences in assistance coverage to inform policy discussions | OW、ODSP 月度家庭类型案件数；补充可比家庭单位总量；省级或 CMA 层级待选 / Monthly OW and ODSP case counts by family type, supplemented with comparable population totals; provincial or CMA level TBD | 需核对外部分母口径；研究关联，不能据此推断因果 / External denominators require validation; association does not establish causation | Richard 于 2026-11-01 提出，待小组讨论 / Proposed by Richard on 2026-11-01; pending group discussion |

| 编号 / ID | 提出者 / Author | 研究问题 / Question | 对受众的价值 / Audience value | 数据、字段、层级 / Data, fields, level | 局限与可行性 / Limitations and feasibility | 团队结论 / Decision |
| --- | --- | --- | --- | --- | --- | --- |
| Q2 | Jingyi Ruan（Alice） | COVID-19 疫情前、疫情期间及疫情后，Ontario Works 和 ODSP 的社会援助案件数量变化趋势有何不同？ / How did Ontario Works (OW) and Ontario Disability Support Program (ODSP) caseload trends change before, during, and after the COVID-19 pandemic? | 帮助政策分析人员了解不同阶段社会援助案件数量的变化，并比较两个项目的趋势 / Help Ontario social policy analysts understand changes in social assistance caseloads across different periods and compare trends between programs.  Target Audience: Ontario government policy analysts working on social assistance programs| OW 和 ODSP 省级月度案件数据；`year`, `month`, `cases`；拟比较 2017–2025 年 / Monthly Ontario-level OW and ODSP case counts, 2017–2025 | 疫情同期还存在其他经济和政策变化，因此无法将案件数量变化直接归因于疫情；需检查数据完整性 / Other economic and policy changes occurred during the pandemic period, so changes cannot be attributed solely to COVID-19; data completeness must be checked | Proposed on November 1, 2026; pending group discussion |
### Q1 家庭类型与社会援助领取率 / Family Type and Assistance Receipt Rates

**提出者与状态 / Author and status：** Yongjun Du（Richard），2026-11-01。已同意为此问题补充外部数据；作为候选问题提交，主要受众、时间范围、地区层级及最终选题由小组讨论确定。<br>Proposed by Yongjun Du (Richard) on November 1, 2026, with supplementary external data planned. This remains a candidate question; the group will determine the primary audience, time span, geographic level, and final selection.

**拟比较的指标 / Proposed measure：** 在同一时点、地区和可比统计口径下，某类家庭的领取率 = 该类型受助案件数 ÷ 该类型可比家庭或援助单位总数。OW 与 ODSP 分开计算和展示。这里的领取率指当前领取援助的比例，不是申请成功率或未来开始领取的概率。<br>For a matched reference period, geography, and statistical unit, the receipt rate is the number of assistance cases of a given family type divided by the total number of comparable family or benefit units of that type. Analyze OW and ODSP separately. This measures current receipt, not application success or the probability of starting assistance in the future.

**课程数据 / Course data：** 使用 OW、ODSP 的省级或 CMA 月度 case-characteristics 文件，结合 `year`、`month`、地区字段及以下家庭类型字段；`cases` 为受助案件总数。<br>Use the provincial or CMA monthly OW and ODSP case-characteristics files, including `year`, `month`, geographic fields, the following family-type fields, and total `cases`.

| 字段 / Field | 受助案件分类 / Assistance case category |
| --- | --- |
| `fts` | 单人、无子女 / Single, without children |
| `ftsp` | 单亲家庭 / Single parent |
| `ftc` | 夫妻或伴侣家庭，有或无子女合计 / Couple, with or without children combined |

**外部数据与口径核对 / External data and comparability：**

- 拟从 Statistics Canada 人口普查或其他官方家庭统计中寻找各类家庭的总体数量；具体数据表与可行年份尚待查找和核实。<br>Seek family-type population totals in Statistics Canada census data or other official family statistics; specific tables and usable years remain to be identified and checked.
- 先核对援助 case（个人或家庭单位）与外部 household / census family 的定义，以及家庭类型、地区边界和参考时间。不能直接把 `fts` 当作“独居人口”；`ftc` 也不能拆分有子女与无子女夫妻家庭。<br>Match assistance cases (individuals or family units) to external household or census-family definitions, family categories, geographic boundaries, and reference dates. Do not equate `fts` with people living alone; `ftc` cannot distinguish couples with children from couples without children.
- 月度案件数可能重复包含同一受助单位，不能相加为全年独立受助家庭数；时间范围和汇总方式应在核实分母后确定。<br>Monthly counts can repeatedly include the same benefit unit and must not be summed as annual unique recipient families. Choose the study period and temporal aggregation after validating denominators.
- 领取率差异仍是描述性关联。收入、就业、年龄、残障状况及项目资格规则可能影响比较，不能仅凭这些汇总数据断言家庭类型“导致”领取援助。<br>Differences in receipt rates remain descriptive associations. Income, employment, age, disability, and eligibility rules may affect comparisons; aggregate data alone cannot establish that family type causes assistance receipt.

**分母不可比时的备选表述 / Fallback if comparable denominators are unavailable：** 不同家庭类型在 OW 与 ODSP 受助案件中的占比如何随地区和时间变化？这时以该类型案件数除以受助总案件数，回答受助构成，而非各类家庭的领取率。<br>How does the family-type composition of OW and ODSP cases vary across regions and over time? Divide each family-type count by total assistance cases to describe recipient composition, rather than family-type receipt rates.

## 数据与选择依据 / Data and Selection Rationale

课程数据入口：[sta313-project-datasets](https://github.com/mjmoon/sta313-project-datasets)。选定数据后，记录文件路径、版本或访问日期、字段含义、缺失值处理和局限。

Course datasets: [sta313-project-datasets](https://github.com/mjmoon/sta313-project-datasets). After selecting data, record file paths, version or access date, field definitions, missing-value handling, and limitations.

比较问题时，检查数据能否回答问题、时间和地理层级是否一致，以及交互能帮助受众完成什么探索。汇总数据中的关联不能直接解释为个人层面的因果关系。

When comparing questions, check whether the data can answer them, whether temporal and geographic levels align, and how interaction will help the audience explore the data. Associations in aggregate data do not establish individual-level causation.

## 最终选择及理由 / Final Selection and Rationale

待全组讨论后填写。记录保留和放弃问题的原因；Pitch 后可调整的范围需向教授确认。

Complete after group discussion. Record why questions were retained or dropped. Confirm with the professor what changes are permitted after the pitch.、

### Q2 疫情前后安大略省社会援助案件变化 / Social Assistance Caseload Trends Before, During, and After COVID-19

**提出者与状态 / Author and status：** [Your Name]，2026-11-01。作为候选问题提交，主要受众、研究时间范围及最终选题由小组讨论确定。

Proposed by [Your Name] on November 1, 2026. This remains a candidate question; the group will determine the primary audience, study period, and final selection.

**研究问题 / Research question：** COVID-19 疫情前、疫情期间及疫情后，Ontario Works（OW）和 Ontario Disability Support Program（ODSP）的案件数量变化趋势有何不同？

How did Ontario Works (OW) and Ontario Disability Support Program (ODSP) caseload trends differ before, during, and after the COVID-19 pandemic?

**对受众的价值 / Audience value：** 帮助安大略省社会政策分析人员了解不同阶段社会援助案件数量的变化，并比较两个援助项目的趋势，为未来的社会援助服务规划提供参考。

Help Ontario social policy analysts understand changes in social assistance caseloads across different periods and compare trends between the two programs to inform future service planning.

**拟比较的指标 / Proposed measures：** 比较 OW 和 ODSP 的月度案件数量，以及相对于基准时期的百分比变化。拟研究 2017–2025 年的数据。

Compare monthly OW and ODSP caseloads and percentage changes relative to a selected baseline period, using data from 2017 to 2025.

**课程数据 / Course data：** 使用 `ont-sa-characteristic-ow-ont.csv` 和 `ont-sa-characteristic-odsp-ont.csv`，主要字段包括 `year`、`month` 和 `cases`。

Use the Ontario-level monthly OW and ODSP case-characteristics datasets, including `year`, `month`, and `cases`.

**拟采用的交互式可视化 / Proposed interactive visualization：** 使用交互式折线图展示月度案件数量变化，允许用户选择援助项目及时间范围，并比较疫情前、疫情期间和疫情后的趋势。

Use interactive line charts with program and time-period filters to explore and compare caseload trends.

**局限与可行性 / Limitations and feasibility：**

- 案件数量变化可能受到经济状况、政策调整和其他因素影响，不能直接归因于 COVID-19。
- 月度案件数可能重复包含同一受助单位，不能相加解释为全年独立受助人数。
- 主要分析可以使用课程提供的数据完成，最终时间范围和缺失值处理将在数据检查后确定。

Caseload changes may reflect economic conditions, policy changes, and other factors rather than COVID-19 alone. Monthly counts may include repeated cases and should not be interpreted as unique annual recipients. The proposed analysis is feasible using the course datasets, subject to data validation.

**团队结论 / Team decision：** 2026-11-01 提出，待小组讨论。

Proposed on November 1, 2026; pending group discussion.
