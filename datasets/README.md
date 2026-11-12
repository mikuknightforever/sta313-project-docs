# 课程数据集 / Course Datasets

本目录保存教师公开数据仓库的完整文件快照，供 STA313 的 A1、A2 与 Project 使用。包括 **9 个整理后的 CSV、54 个原始数据或数据字典文件、2 个 R 整理脚本和 1 份教师 README**，共 66 个上游文件。上游文件逐字节保留；本索引和 `manifest.json` 为本仓库新增。

This directory contains a complete file snapshot of the instructor's public dataset repository for STA313 A1, A2, and the Project: **9 prepared CSVs, 54 original data or dictionary files, 2 R preparation scripts, and the instructor's README**, totaling 66 upstream files. Upstream files are preserved byte for byte; this index and `manifest.json` were added for this repository.

- 来源 / Source: [mjmoon/sta313-project-datasets](https://github.com/mjmoon/sta313-project-datasets).
- 固定版本 / Pinned commit: [`064cf60c13e7ddfbd20c5cbfd1ec220bec200d92`](https://github.com/mjmoon/sta313-project-datasets/tree/064cf60c13e7ddfbd20c5cbfd1ec220bec200d92).
- 核对日期 / Verified on: **2026-11-12**.
- 教师字段说明 / Instructor's field descriptions: [UPSTREAM_README.md](UPSTREAM_README.md).
- 完整文件清单、行列数及校验值 / Full inventory, CSV dimensions, and checksums: [manifest.json](manifest.json).

## 直接用于分析的 9 个 CSV / Nine Prepared CSVs

行数不含标题行；时间范围与行列数根据本次保存的 CSV 实际读取。覆盖范围不代表每个系列在每一期都有记录。

Row counts exclude the header. Time spans and dimensions were read from these exact CSVs. A coverage span does not imply that every series has an observation in every period.

| 文件 / File | 内容与层级 / Content and level | 实际年份范围 / Observed years | 行 / Rows | 列 / Columns |
| --- | --- | --- | ---: | ---: |
| [ont-sa-historical.csv](ONT-SA/ont-sa-historical.csv) | 全省社会援助案件与受益人数 / Ontario social-assistance cases and beneficiaries | 1969–2026 | 687 | 4 |
| [ont-sa-characteristic-odsp-cma.csv](ONT-SA/ont-sa-characteristic-odsp-cma.csv) | ODSP 案件特征，CMA 层级 / ODSP case characteristics by CMA | 2003–2026 | 1,395 | 19 |
| [ont-sa-characteristic-odsp-ont.csv](ONT-SA/ont-sa-characteristic-odsp-ont.csv) | ODSP 案件特征，全省 / ODSP case characteristics across Ontario | 2003–2026 | 93 | 17 |
| [ont-sa-characteristic-ow-cma.csv](ONT-SA/ont-sa-characteristic-ow-cma.csv) | OW 案件特征，CMA 层级 / OW case characteristics by CMA | 2003–2026 | 1,395 | 20 |
| [ont-sa-characteristic-ow-ont.csv](ONT-SA/ont-sa-characteristic-ow-ont.csv) | OW 案件特征，全省 / OW case characteristics across Ontario | 2003–2026 | 93 | 18 |
| [ont-school-demo-info.csv](ONT-SCHOOL/ont-school-demo-info.csv) | 学校信息、学生特征与成绩指标，学校层级 / School information, demographics, and achievement indicators | 2017–2018 → 2024–2025 | 39,072 | 36 |
| [ont-school-enrlmnt-elementary.csv](ONT-SCHOOL/ont-school-enrlmnt-elementary.csv) | 小学各年级入学人数，教育局层级 / Elementary enrolment by grade and school board | 2011–2012 → 2024–2025 | 1,056 | 15 |
| [ont-school-enrlmnt-secondary.csv](ONT-SCHOOL/ont-school-enrlmnt-secondary.csv) | 中学各年级入学人数，教育局层级 / Secondary enrolment by grade and school board | 2011–2012 → 2024–2025 | 1,001 | 9 |
| [ont-school-enrlmnt-secondary-courses.csv](ONT-SCHOOL/ont-school-enrlmnt-secondary-courses.csv) | 中学课程选课人数，全省 / Secondary course enrolment across Ontario | 2011–2012 → 2024–2025 | 20,240 | 6 |

## 原始文件与整理过程 / Originals and Preparation

| 内容 / Content | 位置 / Location |
| --- | --- |
| 社会援助原始 Excel 与数据字典 / Social-assistance original Excel files and data dictionaries | [ONT-SA/original/](ONT-SA/original/) |
| 学校与学生特征原始 Excel / Original school and demographic workbooks | [ONT-SCHOOL/original/demographic/](ONT-SCHOOL/original/demographic/) |
| 小学入学人数原始文本 / Original elementary-enrolment text files | [ONT-SCHOOL/original/enrollment-elementary/](ONT-SCHOOL/original/enrollment-elementary/) |
| 中学入学人数原始文本 / Original secondary-enrolment text files | [ONT-SCHOOL/original/enrollment-secondary/](ONT-SCHOOL/original/enrollment-secondary/) |
| 中学课程选课原始 Excel / Original secondary-course workbooks | [ONT-SCHOOL/original/enrollment-secondary-course/](ONT-SCHOOL/original/enrollment-secondary-course/) |
| 社会援助整理脚本 / Social-assistance preparation script | [prep-ONT-SA.R](ONT-SA/prep-ONT-SA.R) |
| 学校数据整理脚本 / School-data preparation script | [prep-ONT-SCHOOL.R](ONT-SCHOOL/prep-ONT-SCHOOL.R) |

## 外部数据 / External Data

以下数据不属于上述教师数据快照，由小组另行获取，也不计入 `manifest.json`。

The following data are not part of the instructor's snapshot above. The group obtained them separately, and they are not listed in `manifest.json`.

| 数据 / Data | 用途 / Use | 位置 / Location |
| --- | --- | --- |
| 2021 年普查 CMA 边界（Statistics Canada）/ 2021 Census CMA boundaries (Statistics Canada) | Q2 地图；按 `cma_code` 与 CMA 特征表连接 / Q2 map; joins to the CMA characteristics tables on `cma_code` | [EXTERNAL/CMA-BOUNDARIES/](EXTERNAL/CMA-BOUNDARIES/README.md) |

## 读取示例 / Loading Examples

从仓库根目录运行 / Run from the repository root:

```python
import pandas as pd

ow_cma = pd.read_csv("datasets/ONT-SA/ont-sa-characteristic-ow-cma.csv")
```

```r
ow_cma <- read.csv(
  "datasets/ONT-SA/ont-sa-characteristic-ow-cma.csv",
  check.names = FALSE
)
```

较大的 CSV 可能无法在 GitHub 页面完整预览；可使用文件页的 Raw / Download raw file，或克隆仓库后在本地读取。

GitHub may not preview large CSVs in full. Use Raw / Download raw file, or clone the repository and read the files locally.

## 使用口径与版本 / Interpretation and Versioning

- 四份社会援助特征表实际观测月份为 3、6、9、12 月，按季度观测解释；历史总量表包含月度记录。<br>The four social-assistance characteristics tables contain observations for March, June, September, and December; interpret them as quarterly observations. The historical totals file contains monthly records.
- `cases` 是案件或家庭单位，`beneficiaries` 是受益人数，两者不能混用。学校、教育局和全省数据也不能直接当作同一分析层级。<br>`cases` counts cases or family units; `beneficiaries` counts people. Keep these distinct, and distinguish school-, board-, and province-level records.
- 缺失值、隐私抑制及百分比取整说明以教师 README 和原始数据字典为准。<br>Follow the instructor's README and original dictionaries for missingness, privacy suppression, and percentage rounding.
- 分析产生的筛选或清洗结果应另存，不直接覆盖此快照；引用数据时记录上述来源版本。<br>Save analysis-specific subsets and cleaned outputs separately, and record the pinned source version when citing these data.
- 此处“完整”指上述已确认课程数据仓库在固定版本中的全部文件；不包括课程另列的可选外部资源或尚未核对的 Quercus 附件。<br>“Complete” refers to all files in the confirmed course-data repository at the pinned commit; optional external resources and unverified Quercus attachments are outside this snapshot.
