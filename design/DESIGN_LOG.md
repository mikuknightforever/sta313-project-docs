# 设计决策与迭代记录 / Design Decisions and Iterations

记录可视化与交互设计过程。Q3 已有第一版设计记录，Q1、Q2 待填写。

Use this log to document visualization and interaction design. Q3 has a first design entry; Q1 and Q2 are still to be added.

| 日期 / Date | 问题或受众任务 / Question or audience task | 备选方案 / Alternatives | 采用方案及理由 / Decision and rationale | 反馈或证据 / Feedback or evidence | 局限与下一步 / Limitations and next steps | 负责人 / Lead |
| --- | --- | --- | --- | --- | --- | --- |
| 2026-11-12 | Q3：比较 OW 受助时长构成随时间的变化，找出长期案件占比高的 CMA 并判断排名是否稳定 / Q3: compare how the OW duration mix changed and find CMAs with high, persistent long-term shares | 15 色折线；饼图；四档不同色相；19+ 放在堆叠顶部；双纵轴；CMA 分级设色地图；热力图直接画占比；从 0 开始的排序柱状图；排名动画 / 15-colour lines; pie; distinct hues per band; 19+ on top; dual axis; choropleth; raw-share heatmap; zero-based bars; animated ranking | 马提尼杯结构：三个带注释的叙事步骤 → 开放探索。图 1a 堆叠面积（单色相亮度，19+ 贴基线，可切换数量/占比，图例可把任一档移到基线）+ 图 1b 长期占比折线，共用时间轴；图 2 CMA × 季度"与全省之差"热力图（绿↔紫发散，中点灰，可刷选时期）；图 3 时期排序点图（含最低–最高区间与全省参考线）；图 4 所选 CMA 详情。理由：长期占比始终用共同尺度位置编码（effectiveness），有序档用亮度（expressiveness），减去全省值才能看出地区差异 / Martini glass: three annotated steps, then exploration. Stacked area with 19+ on the baseline plus an aligned share line; difference-from-Ontario heatmap with brush; ranged dot plot; CMA detail. Long-term share always on a common-scale position; ordinal bands by lightness; subtracting Ontario reveals regional gaps | 有序色阶与发散色阶经 `validate_palette.js` 验证；所有页面数字由 CSV 计算并用 pandas 独立复核；桌面/手机、浅色/深色截图检查。尚无组员或用户反馈 / Ramps validated; every number recomputed in pandas; desktop/phone and light/dark screenshots. No group or user feedback yet | 主体图形仍较常规（创意项部分满足）；手机端热力图需横向滚动；未部署；未做地图；配色需与全站方案对齐；分工未定。见 [Q3 设计说明](q3/Q3_DESIGN.md) 第 10 节 / Core charts still conventional; heatmap scrolls on phones; not deployed; no map; palette to align with the site; labour split open. See [Q3 design rationale](q3/Q3_DESIGN.md), Section 10 | 待确认 / TBC |

将草图、图表说明、交互流程和评审反馈放在本目录，并添加相对链接。每次迭代记录选择理由与反馈，避免只保留最终截图。新增说明使用中英双语。

Store sketches, chart explanations, interaction flows, and review feedback in this folder and link them using relative paths. For every iteration, record the rationale and feedback as well as the final images. Provide new descriptions in both Chinese and English.
