# Q3 外部数据：CMA 失业率 / Q3 External Data: Unemployment Rate by CMA

只供 Q3 额外版本 [unemployment-prototype/](../unemployment-prototype/README.md) 使用。`datasets/` 保持只读，所以外部数据放在这里（与 `design/q1/data/` 相同的做法）。
Used only by the Q3 extra version [unemployment-prototype/](../unemployment-prototype/README.md). `datasets/` stays read-only, so external data lives here (as in `design/q1/data/`).

## 文件 / Files

| 文件 / File | 内容 / Contents |
| --- | --- |
| `1410045901_databaseLoadingData.csv` | 18 个安省 CMA 地理单元 × 190 个月（2011-01 至 2026-10）= 3,420 行；列结构与 StatCan 表格页面"下载所选数据（用于数据库加载）"的 CSV 相同 / 18 Ontario CMA geographies × 190 months = 3,420 rows, in the table viewer's database-loading CSV layout |
| `fetch_unemployment.py` | 从 StatCan Web Data Service 按向量 ID 重新生成上面的 CSV；`--check` 只下载并比较 / Rebuilds the CSV from the StatCan Web Data Service by vector ID; `--check` only downloads and compares |

## 来源 / Source

Statistics Canada, **Table 14-10-0459-01**, *Labour force characteristics by census metropolitan area, three-month moving average, seasonally adjusted*, <https://doi.org/10.25318/1410045901-eng>（DOI 已核实可打开表格页面 / DOI checked: it resolves to the table page）。本文件对应 2026-11-06 发布的数据 / data released 2026-11-06。

- 指标 / Series: Unemployment rate · Estimate · Seasonally adjusted · Percent。
- **每个月的数值是三个月移动平均**（当月和前两个月），所以 3 月的值 = 1–3 月平均 = 该季度平均。OW 季度数据用季度最后一个月标日期（Q1 = 3 月），页面因此取季度最后一个月的值代表同一季度，不再另外平均。/ **Each monthly value is a three-month moving average** (that month and the two before), so March = the January–March average = the quarter. OW quarters are dated by their last month (Q1 = March), so the page takes that month's value for the same quarter.
- 劳动力调查是抽样调查：小 CMA 的估计波动更大（例如 Belleville – Quinte West 在 0.7% 到 18.6% 之间跳动）。同一张表也提供标准误（Statistics 维度第 2–4 项），本文件没有下载。/ The LFS is a sample survey; smaller CMAs swing more. The same table publishes standard errors (Statistics members 2–4), not downloaded here.

## 与 OW 数据的对应 / Matching to the OW data

- 15 个 OW CMA 全部有序列。按 2021 CMA 编码对应：DGUID `2021S0503` + 编码。/ All 15 OW CMAs have a series, matched by 2021 CMA code.
- **Ottawa（505）用"Ottawa-Gatineau, Ontario part"（DGUID `2021S050535505`）**，因为 OW 是安省项目，OW 数据只覆盖渥太华一侧。/ **Ottawa uses the Ontario part**, because OW covers only the Ontario side.
- 文件中另有三个地理单元页面没有使用：Ottawa-Gatineau 全区、Quebec part、Belleville – Quinte West（OW 数据里没有这个 CMA）。/ Three geographies in the file are unused: the whole Ottawa–Gatineau CMA, its Quebec part, and Belleville – Quinte West (not an OW CMA).
- 与 Q1 用的全省劳动力数据（`datasets/ONT-SA/selected/1410028701_databaseLoadingData.csv`，表 14-10-0287，月度、不是移动平均、2017 年起）不是同一张表，两者不要直接比较或拼接。/ Not the same table as the Ontario-wide labour data used in Q1 (Table 14-10-0287, monthly, not a moving average, from 2017); do not compare or splice them directly.

## 这份 CSV 是怎么来的 / How this CSV was made

组员提供的是 `1410045901_databaseLoadingData-2.csv`（内容贴在聊天中，原文件不在本机）。为避免手抄 3,420 行出错，用 `fetch_unemployment.py` 按同样的 18 个向量（v1643278942 起，每次 +56）从 StatCan API 重新下载，按原文件的列和引号格式写出。核对：行数、地区数、月份范围一致；从组员文件中读出的 45 个数值逐一相同（另有 10 个写在 `unemployment-prototype/verify.py` 里每次复核）；再次运行 `--check` 与已提交文件逐字节相同。StatCan 以后修订数据时，`--check` 会报告不同。
The teammate's file `1410045901_databaseLoadingData-2.csv` was pasted into the chat (the original file was not on this machine). To avoid hand-copying 3,420 rows, `fetch_unemployment.py` downloads the same 18 vectors from the StatCan API and writes them in the original column and quoting format. Checks: same row count, areas and months; 45 values read from the teammate's file all identical (10 more are re-checked by `unemployment-prototype/verify.py`); a later `--check` run is byte-identical. If StatCan revises the series, `--check` reports a difference.

```bash
python design/q3/data/fetch_unemployment.py --check
```
