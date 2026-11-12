# 安大略 CMA 边界（外部数据）/ Ontario CMA Boundaries (External Data)

本目录保存 Q2 地图使用的 2021 年人口普查都会区（CMA）边界。课程项目说明在 Datasets 部分将 “Census Metropolitan Area Boundaries” 列为推荐资源，这里使用的是 Statistics Canada 发布的同一套 2021 年边界数据。

This folder holds the 2021 Census Metropolitan Area (CMA) boundaries used for the Q2 map. The course project page lists "Census Metropolitan Area Boundaries" as a recommended resource under Datasets; these files come from the same 2021 boundary data published by Statistics Canada.

- 来源 / Source: Statistics Canada, *2021 Census Cartographic Boundary Files*, CMA layer `lcma000b21s_e` and province layer `lpr_000b21s_e`, via the official ArcGIS REST service: <https://geo.statcan.gc.ca/geo_wa/rest/services/2021/Cartographic_boundary_files/MapServer>
- 对应下载包 / Equivalent download: CMA/CA cartographic boundary file, catalogue no. 98260002 ([2021 Census Boundary files](https://www12.statcan.gc.ca/census-recensement/2021/geo/sip-pis/boundary-limites/index2021-eng.cfm?year=21)). 该下载站拒绝脚本访问，因此改用同一机构的 REST 服务获取。/ That download site rejects scripted requests, so the same data were retrieved from the agency's REST service.
- 许可 / Licence: [Open Government Licence – Canada](https://open.canada.ca/en/open-government-licence-canada)
- 获取日期 / Retrieved on: **2026-11-12**
- 坐标系 / Coordinate system: WGS84 (EPSG:4326)，坐标保留 5 位小数 / coordinates rounded to 5 decimals

## 文件 / Files

| 文件 / File | 内容 / Content | 要素 / Features | 大小 / Size |
| --- | --- | ---: | ---: |
| [ont-cma-boundaries.geojson](ont-cma-boundaries.geojson) | **网页直接使用。** 课程数据中的 15 个 CMA，已简化（容差约 50 m）。/ **Use this in the website.** The 15 CMAs in the course data, simplified (~50 m tolerance). | 15 | 163 KB |
| [ont-province-outline.geojson](ont-province-outline.geojson) | 安大略省界底图，已简化，只保留大块陆地。/ Ontario outline for a background layer, simplified, large land masses only. | 1 | 59 KB |
| [original/ont-cma-parts-2021-full.geojson](original/ont-cma-parts-2021-full.geojson) | 安大略全部 16 个 CMA 部分，原始精度，未简化。/ All 16 Ontario CMA parts at full resolution, unsimplified. | 16 | 6.7 MB |
| [fetch_cma_boundaries.py](fetch_cma_boundaries.py) | 获取与处理脚本（仅用 Python 标准库）。/ Fetch and processing script (Python standard library only). | | |

重新生成 / To regenerate, run from the repository root:

```bash
python datasets/EXTERNAL/CMA-BOUNDARIES/fetch_cma_boundaries.py
```

## 字段与连接 / Fields and Joining

`ont-cma-boundaries.geojson` 每个要素包含 / Each feature has:

| 字段 / Field | 说明 / Description |
| --- | --- |
| `cma_code` | CMA 编码，与课程 CSV 的 `cma_code` 一致 / CMA code, same as `cma_code` in the course CSVs |
| `cma` | 与课程 CSV 完全相同的标签，例如 `505 - Ottawa--Gatineau` / Label exactly as in the course CSVs |
| `cmapuid` | StatCan CMA 部分编码，例如 `35505` / StatCan CMA part ID |
| `dguid` | StatCan 地理唯一标识 / StatCan geographic unique identifier |
| `statcan_name` | StatCan 官方名称 / Official StatCan name |
| `land_area_km2` | 陆地面积（平方公里）/ Land area in km² |

按 `cma_code` 与 `ont-sa-characteristic-ow-cma.csv`、`ont-sa-characteristic-odsp-cma.csv` 连接。已核对：两份 CSV 的 15 个编码与边界文件完全一致。

Join on `cma_code` with `ont-sa-characteristic-ow-cma.csv` and `ont-sa-characteristic-odsp-cma.csv`. Verified: the 15 codes in both CSVs match the boundary file exactly.

```js
// D3
const geo = await d3.json("ont-cma-boundaries.geojson");
const byCode = new Map(rows.map(d => [d.cma_code, d]));
geo.features.forEach(f => f.properties.data = byCode.get(f.properties.cma_code));
```

```r
library(sf)
cma <- st_read("datasets/EXTERNAL/CMA-BOUNDARIES/ont-cma-boundaries.geojson")
map_data <- merge(cma, q2_table, by = "cma_code")
```

## 处理步骤 / Processing

1. 筛选 `PRUID = '35'`（安大略）且 `CMATYPE = 'B'`（CMA，不含 CA）。Ottawa–Gatineau 只保留安大略部分（`CMAPUID = 35505`），与安大略社会援助数据的范围一致。<br>Filter `PRUID = '35'` (Ontario) and `CMATYPE = 'B'` (CMAs, excluding CAs). Ottawa–Gatineau keeps only its Ontario part (`CMAPUID = 35505`), matching the scope of Ontario social-assistance data.
2. 删除 522 Belleville – Quinte West：它是 2016 年新设立的 CMA，不在课程数据中。<br>Drop 522 Belleville – Quinte West, a CMA created in 2016 that is not in the course data.
3. 由服务器投影到 WGS84 并简化：CMA 容差 0.0005°，省界容差 0.01°。<br>Reproject to WGS84 and simplify server-side: 0.0005° for CMAs, 0.01° for the province outline.
4. 省界原有约 37,000 个小岛，只保留外环面积大于 0.005 平方度的 21 块陆地。<br>The province outline has ~37,000 small islands; keep only the 21 land masses whose outer ring exceeds 0.005 square degrees.

## 解释边界 / Interpretation Limits

- 社会援助数据覆盖 2003–2026 年，地图统一使用 2021 年普查边界。CMA 范围在历次普查之间会调整，地图仅用于定位地区，不代表各年份的统计口径。网页上应注明这一点。<br>The social-assistance data span 2003–2026, but the map uses 2021 Census boundaries throughout. CMA extents change between censuses; the map locates areas and does not represent each year's statistical geography. Note this on the website.
- 安大略社会援助数据如何把案件归入 CMA，以原始数据字典为准，可能与 StatCan 边界不完全一致。<br>How the Ontario social-assistance data assign cases to CMAs follows the original data dictionary and may not align perfectly with StatCan boundaries.
- 简化后的边界只适合展示，不适合计算面积或做空间分析；需要时请用 `original/` 中的原始精度文件。<br>Simplified boundaries are for display only. Use the full-resolution file in `original/` for area calculations or spatial analysis.
