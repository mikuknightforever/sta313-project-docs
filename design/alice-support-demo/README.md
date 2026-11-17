# 社区支持网络交互演示 / The Shape of Support

Alice 的网站设计演示，供小组讨论外观、转场和分析页布局。当前为独立草案，尚未合并为最终项目网站。  
A standalone design prototype for group review of visual style, transitions, and analytical page layouts. This is a draft, not the final project website.

## 打开演示 / Open the demo

1. 打开 [index.html](index.html)，点击 GitHub 文件右上角的 **Download raw file**。  
   Open `index.html` and click **Download raw file** in GitHub’s file toolbar.
2. 保存后，用 Chrome、Edge 或 Safari 打开下载的 HTML 文件。  
   Open the downloaded HTML file in Chrome, Edge, or Safari.
3. 点击 **Enter the landscape** 进入；图表位于问题介绍下方，**View analysis ↓** 可跳至图表。底部切换三套配色。  
   Click **Enter the landscape**. Charts appear below the introduction; **View analysis ↓** jumps to them. Use the bottom picker to switch palettes.

**GitHub 的文件预览只显示代码，不会运行网页。此版本需要下载后打开；没有发布在线站点。**  
**GitHub’s file preview displays source code, not the running page. Download and open this version; no live site has been deployed.**

无需安装依赖、启动服务器或额外下载数据；样式、脚本和数据已包含在一个文件中。  
No dependencies, server, or separate data downloads are required. Styles, scripts, and data are embedded.

## 转场更新 / Transition update

- **Opening → Q1**：保留约 4.2 秒的镜头推进、章节编号和开门动画。  
  Keeps the approximately 4.2-second opening camera journey, chapter marker, and architectural reveal.
- **Q1 ↔ Q2 ↔ Q3**：约 0.8 秒，采用短距离内容滑动和轻微镜头移动，直接显示下一组图表；不重复 opening 的门框、放大或长停顿。  
  Approximately 0.8 seconds, with a short content slide and subtle camera movement straight into the next analytical view. No repeated opening doorway, zoom-in, or long pause.
- **结尾与返回全景 / Closing and overview**：约 1.2 秒的简短全景移动。  
  A brief approximately 1.2-second overview movement.
- 三种配色同步；减少动态效果设置下直接切换。已验证长开场、Q1→Q2 和 Q2→Q3 的区别。  
  Applies to all three palettes; reduced-motion mode switches directly. Verified the distinct opening, Q1→Q2, and Q2→Q3 behavior.

## 包含内容 / Included

- 冰蓝雾灰、雾紫杏白、暖纸色杂志专题；深浅色切换。  
  Ice blue, lilac/apricot, and warm editorial palettes, with light/dark mode.
- 首页 → Q1 → Q2 → Q3 → 结尾；镜头推进、章节门框展开、图表揭示，以及前后跳转。  
  Opening → Q1 → Q2 → Q3 → closing, with camera movement, architectural transitions, chart reveals, and chapter navigation.
- Q1：全省 OW / ODSP 季度案件走势，案件数与指数切换、起始季度及季度读数。  
  Ontario OW/ODSP trends, counts/index switch, start-period selection, and quarterly values.
- Q2：15 个 CMA 的单人无子女案件占比差距、地区详情与原始案件数。  
  Single-person/no-children share gaps across 15 CMAs, selected-area detail, and underlying case counts.
- Q3：全省及 CMA 的 OW 四档受助时长构成，可选地区及季度。  
  Four-band OW duration composition for Ontario and CMAs, with geography/quarter controls.

## 数据与解释 / Data and interpretation

嵌入数据来自本仓库的四份 selected CSV，覆盖 2003 Q1–2026 Q1，共 93 个季度及 15 个 CMA：  
Embedded values come from these selected CSVs, covering 93 quarters from 2003 Q1 through 2026 Q1 and 15 CMAs:

- [OW Ontario](../../datasets/ONT-SA/selected/ont-sa-characteristic-ow-ont.csv)
- [ODSP Ontario](../../datasets/ONT-SA/selected/ont-sa-characteristic-odsp-ont.csv)
- [OW CMA](../../datasets/ONT-SA/selected/ont-sa-characteristic-ow-cma.csv)
- [ODSP CMA](../../datasets/ONT-SA/selected/ont-sa-characteristic-odsp-cma.csv)

- 案件数不是人数；页面显示值可能四舍五入，底层保留原有数值。  
  Cases are not people. Display values may be rounded; underlying published values are retained.
- Q1 指数以 2019 Q4 = 100；灰色带对应季度样本中的 2020 Q1–2023 Q1。  
  Q1 indexing uses 2019 Q4 = 100; the gray band covers quarterly observations from 2020 Q1 through 2023 Q1.
- Q2 差距 = ODSP 占比 − OW 占比，单位为百分点；首尾缩小不代表每个季度都缩小。  
  Q2 gap = ODSP share minus OW share, in percentage points; endpoint narrowing is not necessarily monotonic.
- Q3 100% 构成以四个时长档之和为分母；不据此推断个人依赖或因果。  
  Q3 composition uses the sum of the four duration bands; it does not establish individual dependence or causality.
- 房屋及网面是装饰性概念图，不编码真实户数、地理位置或项目效果。  
  Houses and the woven surface are decorative, not encodings of household counts, geography, or program effects.

## 验证 / Validation

已检查导出后的配色切换、转场和图表显示；设计开发中也检查了 Q1 案件数/指数切换、Q2 地区与起始季度选择，以及 Q3 地区与季度联动。原 CSV 未修改。  
Checked palette switching, transitions, and chart rendering in the exported page. During development, checked Q1 counts/index switching, Q2 geography/start-quarter controls, and Q3 geography/quarter controls. Source CSVs were not modified.

更新日期 / Updated: 2026-11-16.
