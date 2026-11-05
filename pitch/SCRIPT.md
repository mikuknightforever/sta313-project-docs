# Pitch 逐页讲稿 / Slide-by-Slide Pitch Script

本讲稿按用户确认的 12 张有效内容页编号，重复截图与末尾空白模板不计。英文口播约 319 词，建议用时 2 分 52 秒；标题、页码与计时提示不朗读。请连同翻页和停顿排练，确认整场不超过 3 分钟。  
This script follows the 12 content slides confirmed by the user, excluding duplicate screenshots and unused blank templates. The spoken text is approximately 319 words, with a suggested duration of 2:52. Do not read headings, slide numbers, or timing cues aloud. Rehearse with transitions and pauses to confirm the three-minute limit.

讲稿已采用核实后的季度观测口径和统一的 policy analysts 受众定位。Canva 尚未自动修改；请同步文末所列的 PPT 文字。  
The script uses verified quarterly observations and the agreed policy-analyst audience. The Canva deck has not been edited; align the slide wording using the notes below.

## Slide 1 — Project Pitch

**建议时间 / Suggested timing:** 0:00–0:05

Hello everyone. Today, we’re presenting our social assistance visualization project.

## Slide 2 — Group Name

**建议时间 / Suggested timing:** 0:05–0:07

We’re Newtown’s group.

## Slide 3 — Project Question

**建议时间 / Suggested timing:** 0:07–0:21

We ask how social assistance in Ontario has changed over time, focusing on family composition and regional differences. Our project will present these patterns through an interactive website.

## Slide 4 — Target Audience

**建议时间 / Suggested timing:** 0:21–0:41

Our primary audience is social assistance policy analysts at Ontario’s Ministry of Children, Community and Social Services. They can use our website to understand trends, compare regions, and identify patterns for further investigation when preparing policy briefings.

## Slide 5 — Dataset

**建议时间 / Suggested timing:** 0:41–1:06

We use the course-provided Ontario Works, or OW, and Ontario Disability Support Program, or ODSP, case-characteristics files. These contain quarterly observations from March 2003 to March 2026, covering Ontario and fifteen census metropolitan areas, or CMAs. We examine case counts, family-type shares, and Ontario Works assistance-duration categories.

## Slide 6 — Question 1

**建议时间 / Suggested timing:** 1:06–1:23

First, how did OW and ODSP caseload trends differ before, during, and after COVID-19? Focusing on 2017 to 2025, users will select time ranges and compare the programs through an interactive line chart.

## Slide 7 — Why Question 1 Matters

**建议时间 / Suggested timing:** 1:23–1:34

This provides province-wide context and helps analysts identify periods when the programs’ trends diverged, without attributing those changes solely to COVID-19.

## Slide 8 — Question 2

**建议时间 / Suggested timing:** 1:34–1:53

Next, we look at what percentage of OW and ODSP cases involve one person without children. We track how those percentages and the gap between them changed over time across metropolitan areas.

## Slide 9 — Why Question 2 Matters

**建议时间 / Suggested timing:** 1:53–2:10

Policy analysts can compare two quarters to see where the gap narrowed, widened, or stayed steady. They can then check local trends and flag areas with persistent gaps or sharp changes for follow-up.

## Slide 10 — Question 3

**建议时间 / Suggested timing:** 2:10–2:29

Third, how has the duration composition of OW cases changed, and which regions have higher long-term shares? Long-term means nineteen or more consecutive months. Users will compare duration categories across regions and time.

## Slide 11 — Why Question 3 Matters

**建议时间 / Suggested timing:** 2:29–2:44

This helps analysts locate higher or increasing long-term shares and prioritize follow-up research, including employment-support needs. These aggregate data do not track individual outcomes or establish policy effectiveness.

## Slide 12 — Thank You

**建议时间 / Suggested timing:** 2:44–2:52

Together, our three views provide a clearer picture of Ontario’s social assistance caseloads. Thank you.

## PPT 同步修改 / Slide Wording to Align

### Target Audience — Slide 4

建议替换 / Suggested replacement:

> Ontario Social Assistance Policy Analysts  
> Ministry of Children, Community and Social Services

第 7 页正文中的 policymakers 同步改为 policy analysts。  
Also replace policymakers with policy analysts in the body of slide 7.

### Dataset — Slide 5

可直接替换的英文 / Ready-to-paste English:

**Primary data:** Government of Ontario OW and ODSP case-characteristics datasets, provided through STA313.

**KEY DIMENSIONS**

- **Time:** Quarterly observations, March 2003–March 2026. Q1 focuses on 2017–2025.
- **Geography:** Ontario-wide and 15 Census Metropolitan Areas (CMAs).
- **Programs:** Ontario Works (OW) and Ontario Disability Support Program (ODSP).
- **Measures:** Caseload counts, single-person-without-children case shares, and OW assistance-duration shares.
- **Key variables:** `year`, `month`, `cma_code`, `cma`, `cases`, `fts`; OW duration categories `moa04`, `moa512`, `moa1318`, `moa19`.

原页的 Monthly observations 应改为 Quarterly observations；只写 Ontario provincial level 不能涵盖 Q2、Q3；KEY DIMENTIONS 改为 KEY DIMENSIONS。  
Replace Monthly observations with Quarterly observations, include CMA coverage for Q2 and Q3, and correct KEY DIMENTIONS to KEY DIMENSIONS.

### Question 3 — Slide 10

建议明确研究当前案件的时长构成 / Suggested wording to clarify duration composition:

> How has the duration composition of Ontario Works (OW) cases changed over time, and which metropolitan areas have the highest shares of long-term cases?

第 11 页提到的就业支持需求是后续调查方向，现有数据不直接证明服务不足或政策效果。  
Employment-support needs on slide 11 are a topic for subsequent investigation; the data do not establish service inadequacy or policy effectiveness.

## 数据核查依据 / Data Verification

核查版本 / Dataset commit: [`064cf60c13e7ddfbd20c5cbfd1ec220bec200d92`](https://github.com/mjmoon/sta313-project-datasets/tree/064cf60c13e7ddfbd20c5cbfd1ec220bec200d92/ONT-SA)

| 文件 / File | 行数 / Rows | 时间与覆盖 / Dates and coverage |
| --- | ---: | --- |
| `ont-sa-characteristic-ow-ont.csv` | 93 | 2003-03 至 2026-03；全省 / March 2003–March 2026; Ontario |
| `ont-sa-characteristic-odsp-ont.csv` | 93 | 2003-03 至 2026-03；全省 / March 2003–March 2026; Ontario |
| `ont-sa-characteristic-ow-cma.csv` | 1,395 | 同期 93 个日期，15 个 CMA / Same 93 dates; 15 CMAs |
| `ont-sa-characteristic-odsp-cma.csv` | 1,395 | 同期 93 个日期，15 个 CMA / Same 93 dates; 15 CMAs |

四份文件的 `month` 取值均仅为 3、6、9、12，即季度观测；不能将含有 month 字段等同于每月都有数据。`moa19` 表示连续领取援助 19 个月及以上的 OW 案件，定义见[课程数据说明](https://github.com/mjmoon/sta313-project-datasets/blob/064cf60c13e7ddfbd20c5cbfd1ec220bec200d92/README.md)。  
All four files have observations only in months 3, 6, 9, and 12. The presence of a month column does not imply monthly observations. The course data dictionary defines `moa19` as OW cases with at least 19 consecutive months on assistance.

## 交付状态 / Delivery Status

逐页英文讲稿已上传本目录：[PDF（script.pdf）](script.pdf)、[可编辑 Word](script.docx)；尚未提交到 MarkUs。若用两名主讲，可考虑第 7 页之后交接，具体人选由小组决定。  
The numbered English script is stored here as [script.pdf](script.pdf), with an [editable Word version](script.docx). It has not been submitted to MarkUs. If two people present, a possible handover is after slide 7; the group decides the speakers.
