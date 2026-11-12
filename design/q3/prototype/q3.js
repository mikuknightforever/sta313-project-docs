/* Q3 prototype — OW assistance duration, Ontario and 15 CMAs.
   Reads the course CSVs and the 2021 CMA boundaries directly; every number in the text is computed here. */
(() => {
  "use strict";
  const DATA = "../../../datasets/ONT-SA/selected/";
  const GEO = "../../../datasets/EXTERNAL/CMA-BOUNDARIES/";
  // Stack order bottom → top: the long-term band sits on the baseline (L3: only the
  // baseline layer of a stack is read on a common scale).
  const BANDS = [
    { key: "moa19", label: "19+ months", css: "var(--d19)" },
    { key: "moa1318", label: "13–18 months", css: "var(--d1318)" },
    { key: "moa512", label: "5–12 months", css: "var(--d512)" },
    { key: "moa04", label: "0–4 months", css: "var(--d04)" },
  ];
  const COVID = [new Date(2020, 2, 1), new Date(2023, 4, 31)]; // dataset definition
  // Map colour: CMA long-term share minus Ontario's, 5 classes (pp). ±2 = neutral band; ±6 ≈ 80th
  // percentile of |difference| across the five preset periods (see Q3_DESIGN.md §4).
  const DIV_VARS = ["--dv0", "--dv1", "--dv2", "--dv3", "--dv4"];
  const DIV_LABELS = ["6+ pp lower", "2–6 pp lower", "Within 2 pp", "2–6 pp higher", "6+ pp higher"];
  const DIV_WORDS = ["much lower than", "lower than", "close to", "higher than", "much higher than"];
  const divIdx = v => { const r = Math.round(v * 10) / 10; return r <= -6 ? 0 : r < -2 ? 1 : r <= 2 ? 2 : r < 6 ? 3 : 4; };
  const SHORT = { "505": "Ottawa", "539": "Niagara", "541": "Kitchener–Waterloo", "580": "Sudbury" };
  const SIZE_REF = [2000, 10000, 100000];
  const PERIOD3 = [["pre", "Before"], ["during", "During"], ["post", "After"]];

  const f1 = d3.format(".1f");
  const pct = v => `${f1(v)}%`;
  const int = v => d3.format(",.0f")(v);
  const pp = v => `${v > 0 ? "+" : v < 0 ? "−" : "±"}${f1(Math.abs(v))} pp`;
  const tip = document.getElementById("tip");
  const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  const cssVar = v => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
  const divColor = v => cssVar(DIV_VARS[divIdx(v)]);

  const S = { step: 1, mode: "count", iso: null, period: null, cma: null, sort: "share", detail: "share", hover: null };
  let ONT, CMA, DATES, BY_CMA, NAMES, PERIODS, Q, GEOJ, OUTLINE, MAP = null;

  // ---------- load ----------
  const row = d => {
    const r = { year: +d.year, month: +d.month, quarter: +d.quarter, covid: d.covid_period, cases: +d.cases };
    BANDS.forEach(b => (r[b.key] = +d[b.key]));
    r.date = new Date(r.year, r.month - 1, 1);
    r.label = `${r.year} Q${r.quarter}`;
    r.share = (r.moa19 / r.cases) * 100;
    if (d.cma) {
      r.cma = d.cma;
      const m = d.cma.match(/^(\d+)\s*-\s*(.+)$/);
      r.code = m[1];
      r.name = m[2].replace(/--/g, "–");
    }
    return r;
  };

  Promise.all([
    d3.csv(DATA + "ont-sa-characteristic-ow-ont.csv", row),
    d3.csv(DATA + "ont-sa-characteristic-ow-cma.csv", row),
    d3.json(GEO + "ont-cma-boundaries.geojson"),
    d3.json(GEO + "ont-province-outline.geojson"),
  ]).then(([ont, cma, geo, outline]) => {
    ONT = ont.sort((a, b) => a.date - b.date);
    DATES = ONT.map(d => d.date);
    Q = new Map(ONT.map(d => [d.label, d]));
    const ontBy = new Map(ONT.map(d => [+d.date, d]));
    cma.forEach(d => { d.ont = ontBy.get(+d.date).share; d.dev = d.share - d.ont; });
    CMA = cma;
    BY_CMA = d3.group(cma, d => d.code);
    NAMES = new Map(cma.map(d => [d.code, d.name]));
    // The files follow RFC 7946 (counter-clockwise outer rings); d3-geo is spherical and reads that
    // winding as "everything except the polygon". Rewind each polygon on its own (some MultiPolygons mix
    // windings), reversing any polygon larger than a hemisphere.
    const fix = poly => (d3.geoArea({ type: "Polygon", coordinates: poly }) > 2 * Math.PI ? poly.map(ring => ring.slice().reverse()) : poly);
    const rewind = fc => { fc.features.forEach(f => {
      const g = f.geometry; g.coordinates = g.type === "Polygon" ? fix(g.coordinates) : g.coordinates.map(fix);
    }); return fc; };
    GEOJ = rewind(geo); OUTLINE = rewind(outline);
    const missing = [...BY_CMA.keys()].filter(c => !geo.features.some(f => f.properties.cma_code === c));
    if (missing.length) console.error("CMAs without a boundary:", missing);
    const span = id => { const r = ONT.filter(d => d.covid === id); return [r[0].date, r[r.length - 1].date]; };
    const last = DATES[DATES.length - 1];
    PERIODS = [
      { id: "latest", label: "Latest quarter", range: [last, last] },
      { id: "post", label: "After pandemic", range: span("post") },
      { id: "during", label: "Pandemic", range: span("during") },
      { id: "pre", label: "Before pandemic", range: span("pre") },
      { id: "all", label: "All years", range: [DATES[0], last] },
    ];
    S.period = PERIODS[1];
    const topOf = range => periodStats(range).sort((a, b) => b.share - a.share)[0].code;
    S.cma = topOf(S.period.range);
    // Optional URL state (shareable views; also used for screenshots):
    // ?theme=dark&step=2&mode=share&iso=moa19&period=during&cma=535&detail=mix&sort=cases&from=2015Q1&to=2019Q4
    const U = new URLSearchParams(location.search);
    if (U.get("theme")) document.documentElement.dataset.theme = U.get("theme");
    if (U.has("step")) S.step = +U.get("step");
    if (["count", "share"].includes(U.get("mode"))) S.mode = U.get("mode");
    if (BANDS.some(b => b.key === U.get("iso"))) S.iso = U.get("iso");
    const up = PERIODS.find(p => p.id === U.get("period")); if (up) S.period = up;
    const qOf = s => s && Q.get(s.replace(/^(\d{4})\s*Q(\d)$/i, "$1 Q$2"));
    const fq = qOf(U.get("from")), tq = qOf(U.get("to"));
    if (fq && tq && fq.date <= tq.date) S.period = { id: "custom", label: "Custom", range: [fq.date, tq.date] };
    if ((up || (fq && tq)) && !U.has("cma")) S.cma = topOf(S.period.range);
    if (BY_CMA.has(U.get("cma"))) S.cma = U.get("cma");
    if (["share", "mix"].includes(U.get("detail"))) S.detail = U.get("detail");
    if (["share", "cases", "name"].includes(U.get("sort"))) { S.sort = U.get("sort"); document.getElementById("sortSel").value = S.sort; }
    buildControls();
    renderAll();
    let lastW = document.querySelector(".page").clientWidth;
    new ResizeObserver(debounce(() => {
      const w = document.querySelector(".page").clientWidth;
      if (w !== lastW) { lastW = w; renderAll(); }
    }, 120)).observe(document.querySelector(".page"));
    matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => renderAll());
  }).catch(err => {
    document.getElementById("lead").textContent =
      "Could not load the data files. Serve the repository root over HTTP (see README) and reopen this page.";
    console.error(err);
  });

  // ---------- derived data ----------
  const qLabel = d => ONT.find(o => +o.date === +d).label;
  const PHRASE = { latest: "in the latest quarter", post: "after the pandemic", during: "during the pandemic",
    pre: "before the pandemic", all: "across all years", custom: "in the selected period" };
  const periodText = p => {
    const a = qLabel(p.range[0]), b = qLabel(p.range[1]);
    return a === b ? a : `${a} – ${b}`;
  };
  const periodPhrase = p => `${PHRASE[p.id]} (${periodText(p)})`;
  const periodById = id => PERIODS.find(p => p.id === id);
  // Pooled share for a period: Σ long-term ÷ Σ cases over its quarters (weights quarters by caseload).
  function periodStats([a, b]) {
    const inR = d => d.date >= a && d.date <= b;
    return Array.from(BY_CMA, ([code, rows]) => {
      const r = rows.filter(inR);
      const lt = d3.sum(r, d => d.moa19), all = d3.sum(r, d => d.cases);
      return { code, name: NAMES.get(code), share: (lt / all) * 100, min: d3.min(r, d => d.share),
        max: d3.max(r, d => d.share), avgCases: all / r.length, n: r.length };
    });
  }
  function ontPeriod([a, b]) {
    const r = ONT.filter(d => d.date >= a && d.date <= b);
    return (d3.sum(r, d => d.moa19) / d3.sum(r, d => d.cases)) * 100;
  }
  // Period stats with difference from Ontario and rank (1 = highest share).
  function rankedStats(range) {
    const ont = ontPeriod(range);
    const st = periodStats(range).sort((a, b) => b.share - a.share);
    st.forEach((d, i) => { d.rank = i + 1; d.diff = d.share - ont; d.ont = ont; });
    return st;
  }
  const sorted = st => st.slice().sort(
    S.sort === "name" ? (a, b) => d3.ascending(a.name, b.name)
      : S.sort === "cases" ? (a, b) => b.avgCases - a.avgCases
        : (a, b) => b.share - a.share);
  const shortName = code => SHORT[code] || NAMES.get(code);
  const quartersAbove = code => BY_CMA.get(code).filter(d => d.dev > 0).length;
  function persistence() {
    const sets = PERIOD3.map(([id]) => new Set(rankedStats(periodById(id).range).filter(d => d.diff > 0).map(d => d.code)));
    const aboveAll = [...sets[0]].filter(c => sets[1].has(c) && sets[2].has(c))
      .map(c => ({ code: c, margin: d3.min(PERIOD3, ([id]) => rankedStats(periodById(id).range).find(x => x.code === c).diff) }));
    const below90 = [...BY_CMA.keys()].map(c => ({ code: c, below: DATES.length - quartersAbove(c) }))
      .filter(d => d.below / DATES.length >= 0.9).sort((a, b) => b.below - a.below);
    return { aboveAll, below90 };
  }

  // ---------- controls ----------
  function buildControls() {
    const steps = [
      { id: 1, label: "1 · 2009–2019", range: ["2009 Q2", "2019 Q4"] },
      { id: 2, label: "2 · 2019–2021", range: ["2019 Q4", "2021 Q3"] },
      { id: 3, label: "3 · 2021–2026", range: ["2021 Q3", ONT[ONT.length - 1].label] },
      { id: 0, label: "Explore all" },
    ];
    S.steps = steps;
    seg("#stepSeg", steps, s => s.label, s => { S.step = s.id; renderStory(); renderF1(); });
    d3.selectAll("#modeSeg button").on("click", function () { S.mode = this.dataset.mode; renderF1(); syncPressed(); });
    seg("#periodSeg", PERIODS, p => p.label, p => { S.period = p; renderRegions(true); });
    d3.selectAll("#detailSeg button").on("click", function () { S.detail = this.dataset.d; renderF4(); syncPressed(); });
    d3.select("#sortSel").on("change", function () { S.sort = this.value; renderF3(); applyHighlight(); });
    d3.select("#tableBtn").on("click", function () {
      const w = document.getElementById("tableWrap"); w.hidden = !w.hidden;
      this.setAttribute("aria-expanded", String(!w.hidden)); this.textContent = w.hidden ? "Show as table" : "Hide table";
    });
    const tb = document.getElementById("themeBtn");
    const dark = () => (document.documentElement.dataset.theme || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")) === "dark";
    const lab = () => (tb.textContent = dark() ? "Light theme" : "Dark theme");
    tb.onclick = () => { document.documentElement.dataset.theme = dark() ? "light" : "dark"; lab(); renderAll(); };
    lab();
    // band legend = filter (isolate one band on the baseline)
    const lg = d3.select("#bandLegend");
    lg.selectAll("button.b").data(BANDS.slice().reverse()).join("button").attr("class", "b").attr("type", "button")
      .html(b => `<i style="background:${b.css}"></i>${b.label}`)
      .on("click", (e, b) => { S.iso = S.iso === b.key ? null : b.key; renderF1(); syncPressed(); });
    lg.append("button").attr("class", "reset").attr("type", "button").text("Show all").on("click", () => { S.iso = null; renderF1(); syncPressed(); });
    syncPressed();
  }
  function seg(sel, data, label, click) {
    d3.select(sel).selectAll("button").data(data).join("button").attr("type", "button").text(label)
      .on("click", (e, d) => { click(d); syncPressed(); });
    syncPressed();
  }
  function syncPressed() {
    d3.selectAll("#stepSeg button").attr("aria-pressed", s => String(S.step === s.id));
    d3.selectAll("#modeSeg button").attr("aria-pressed", function () { return String(this.dataset.mode === S.mode); });
    d3.selectAll("#periodSeg button").attr("aria-pressed", p => String(S.period && S.period.id === p.id));
    d3.selectAll("#detailSeg button").attr("aria-pressed", function () { return String(this.dataset.d === S.detail); });
    d3.selectAll("#bandLegend button.b").attr("aria-pressed", b => String(!S.iso || S.iso === b.key));
  }

  // ---------- render orchestration ----------
  function renderAll() {
    if (!ONT) return;
    MAP = null; // rebuild map geometry at the new size / theme
    renderLead(); renderStory(); renderF1(); renderRegions(false); renderCards();
  }
  // Period changed (or first render): every Step 2 view follows S.period.
  function renderRegions(animate) {
    syncPressed();
    renderPeriodStrip(); renderMap(animate); renderTakeaway(); renderCard();
    renderF3(); renderF4(); renderCards(); applyHighlight();
  }
  function selectCMA(code) {
    S.cma = code;
    renderF3(); renderF4(); renderCard(); applyHighlight();
  }
  function setHover(code) {
    if (S.hover === code) return;
    S.hover = code;
    renderCard(); applyHighlight();
  }
  // Linked highlighting across the map, Figure 3 and Figure 4 (classes only; no re-render).
  function applyHighlight() {
    const h = S.hover, s = S.cma;
    d3.selectAll("#f2map .sym").classed("hl", d => d.code === h && h !== s).classed("sel", d => d.code === s);
    d3.selectAll("#f2map .maplbl").classed("hl", d => d.code === h).classed("sel", d => d.code === s);
    d3.selectAll("#f2map .hit").attr("aria-pressed", d => String(d.code === s));
    d3.selectAll("#f3 g.r").classed("hl", d => d.code === h && h !== s).classed("sel", d => d.code === s);
    d3.selectAll("#f4 .f4other").classed("hl", function () { return this.dataset.cma === h; })
      .filter(function () { return this.dataset.cma === h; }).raise();
  }

  function renderLead() {
    const last = ONT[ONT.length - 1], peak = d3.greatest(ONT, d => d.share);
    const lastC = CMA.filter(d => +d.date === +last.date).sort((a, b) => b.share - a.share);
    document.getElementById("lead").innerHTML =
      `In ${last.label}, <b>${pct(last.share)}</b> of Ontario's OW cases had been open for 19 months or more. ` +
      `The share peaked at <b>${pct(peak.share)}</b> in ${peak.label}. Across the 15 CMAs it ranged from ` +
      `${pct(lastC[lastC.length - 1].share)} (${lastC[lastC.length - 1].name}) to ${pct(lastC[0].share)} (${lastC[0].name}) in ${last.label}; ` +
      `Step 2 checks whether that ranking holds in other periods.`;
  }

  function renderStory() {
    const s = S.steps.find(x => x.id === S.step);
    const el = document.getElementById("stepText");
    if (!s.range) { el.innerHTML = "Explore freely: hover either chart for exact values, switch Figure 1a to shares, or click a duration band to put it on the baseline."; return; }
    const a = Q.get(s.range[0]), b = Q.get(s.range[1]);
    const seg = ONT.filter(d => d.date >= a.date && d.date <= b.date);
    const peak = d3.greatest(ONT, d => d.share), maxLt = d3.greatest(ONT, d => d.moa19);
    if (s.id === 1) {
      el.innerHTML = `<b>${a.label} → ${b.label}: the long-term share rose from ${pct(a.share)} to ${pct(b.share)}</b> (${f1(b.share / a.share)} times as high). ` +
        `Long-term cases went from ${int(a.moa19)} to ${int(b.moa19)}, while the total caseload stayed between ${int(d3.min(seg, d => d.cases))} and ${int(d3.max(seg, d => d.cases))}.`;
    } else if (s.id === 2) {
      el.innerHTML = `<b>${a.label} → ${b.label}: about the same number of long-term cases inside a smaller total.</b> ` +
        `Long-term cases: ${int(a.moa19)} → ${int(b.moa19)}. All OW cases: ${int(a.cases)} → ${int(b.cases)}. ` +
        `So the share rose to <b>${pct(b.share)}</b>${+b.date === +peak.date ? ", the highest in the series" : ""}. These data do not show why the total fell.`;
    } else {
      const lo = d3.least(ONT.filter(d => d.date > a.date), d => d.share);
      el.innerHTML = `<b>${a.label} → ${b.label}: the share fell to ${pct(lo.share)} (${lo.label}), then rose to ${pct(b.share)}.</b> ` +
        `The total grew to ${int(b.cases)} cases and long-term cases reached ${int(b.moa19)}${+b.date === +maxLt.date ? ", the most in the series" : ""}.`;
    }
  }

  // ---------- shared chart helpers ----------
  const W = id => document.getElementById(id).clientWidth;
  const narrow = () => window.innerWidth < 640;
  function svgIn(id, w, h, label) {
    const host = d3.select("#" + id); host.selectAll("*").remove();
    return host.append("svg").attr("width", w).attr("height", h).attr("role", "img").attr("aria-label", label);
  }
  function covidBand(g, x, h, withLabel) {
    g.append("rect").attr("x", x(COVID[0])).attr("width", x(COVID[1]) - x(COVID[0])).attr("y", 0).attr("height", h)
      .style("fill", "var(--covid)");
    if (withLabel) g.append("text").attr("class", "lbl").attr("x", x(COVID[0]) + 4).attr("y", 11).style("font-size", "11px").text("Pandemic");
  }
  function periodBand(g, x, h) { // the same enclosure marks the selected period in every Step 2 view (L4-1)
    g.append("rect").attr("x", x(S.period.range[0])).attr("width", Math.max(2, x(S.period.range[1]) - x(S.period.range[0])))
      .attr("height", h).style("fill", "var(--sel)").style("fill-opacity", .12).style("stroke", "var(--sel)").style("stroke-opacity", .8);
  }
  function timeAxis(g, x, h, every) {
    g.append("g").attr("class", "axis").attr("transform", `translate(0,${h})`)
      .call(d3.axisBottom(x).ticks(d3.timeYear.every(every || (narrow() ? 5 : 2))).tickFormat(d3.timeFormat("%Y")).tickSizeOuter(0));
  }
  function showTip(e, html) {
    tip.innerHTML = html; tip.hidden = false;
    const r = tip.getBoundingClientRect(), pad = 14;
    let x = e.clientX + pad, y = e.clientY + pad;
    if (x + r.width > innerWidth - 8) x = e.clientX - r.width - pad;
    if (y + r.height > innerHeight - 8) y = e.clientY - r.height - pad;
    tip.style.left = Math.max(8, x) + "px"; tip.style.top = Math.max(8, y) + "px";
  }
  const hideTip = () => (tip.hidden = true);
  const tr = (k, v, sw) => `<div class="r"><span>${sw ? `<i style="background:${sw}"></i>` : ""}${k}</span><span>${v}</span></div>`;
  const inCovid = d => d.date >= COVID[0] && d.date <= COVID[1];
  function stepRange() {
    const s = S.steps.find(x => x.id === S.step);
    return s && s.range ? [Q.get(s.range[0]), Q.get(s.range[1])] : null;
  }
  function endLabels(g, items, x0, minGap) {
    items.sort((a, b) => a.y - b.y);
    for (let i = 1; i < items.length; i++) if (items[i].y - items[i - 1].y < minGap) items[i].y = items[i - 1].y + minGap;
    items.forEach(it => g.append("text").attr("class", it.strong ? "lbl-strong" : "lbl").attr("x", x0).attr("y", it.y).attr("dy", "0.32em").text(it.t));
  }

  // ---------- Figure 1a / 1b (Ontario) ----------
  function renderF1() {
    const w = W("f1a"), n = narrow();
    const m = { t: 10, r: n ? 12 : 100, b: 22, l: 52 };
    const iw = w - m.l - m.r;
    const x = d3.scaleTime().domain(d3.extent(DATES)).range([0, iw]);
    const keys = S.iso ? [S.iso] : BANDS.map(b => b.key);
    const val = (d, k) => (S.mode === "share" ? (d[k] / d.cases) * 100 : d[k]);
    const stack = d3.stack().keys(keys).value(val)(ONT);
    const top = S.mode === "share" ? 100 : d3.max(ONT, d => d.cases);
    const h1 = n ? 200 : 230, ih1 = h1 - m.t - m.b;
    const y1 = d3.scaleLinear().domain([0, top]).nice().range([ih1, 0]);
    document.getElementById("f1aTitle").textContent = S.mode === "share"
      ? "Share of OW cases by time on assistance, Ontario (each quarter sums to 100%)"
      : "Number of OW cases by time on assistance, Ontario";

    const svg1 = svgIn("f1a", w, h1, "Stacked area chart of Ontario OW cases by duration band, 2003 to 2026");
    const g1 = svg1.append("g").attr("transform", `translate(${m.l},${m.t})`);
    covidBand(g1, x, ih1, true);
    g1.append("g").attr("class", "grid").call(d3.axisLeft(y1).ticks(5).tickSize(-iw).tickFormat(""));
    const sr = stepRange();
    if (sr) g1.append("rect").attr("x", x(sr[0].date)).attr("width", x(sr[1].date) - x(sr[0].date)).attr("height", ih1)
      .style("fill", "var(--sel)").style("fill-opacity", 0.12).style("stroke", "var(--sel)").style("stroke-opacity", .8);
    const area = d3.area().x(d => x(d.data.date)).y0(d => y1(d[0])).y1(d => y1(d[1]));
    g1.append("g").selectAll("path").data(stack).join("path").attr("d", area)
      .style("fill", s => BANDS.find(b => b.key === s.key).css).style("stroke", "var(--surface)").style("stroke-width", 1);
    g1.append("g").attr("class", "axis").call(d3.axisLeft(y1).ticks(5)
      .tickFormat(S.mode === "share" ? d => d + "%" : d => d === 0 ? "0" : d3.format(",")(d / 1000) + "k").tickSizeOuter(0));
    timeAxis(g1, x, ih1);
    if (!n) {
      const lastI = stack[0].length - 1;
      endLabels(g1, stack.map(s => ({ y: y1((s[lastI][0] + s[lastI][1]) / 2), t: BANDS.find(b => b.key === s.key).label, strong: s.key === "moa19" })), iw + 8, 14);
    }

    // 1b: long-term share line
    const h2 = n ? 150 : 170, ih2 = h2 - m.t - m.b;
    const y2 = d3.scaleLinear().domain([0, 80]).range([ih2, 0]);
    const svg2 = svgIn("f1b", w, h2, "Line chart of the Ontario long-term OW share, 2003 to 2026");
    const g2 = svg2.append("g").attr("transform", `translate(${m.l},${m.t})`);
    covidBand(g2, x, ih2, false);
    g2.append("g").attr("class", "grid").call(d3.axisLeft(y2).ticks(4).tickSize(-iw).tickFormat(""));
    if (sr) g2.append("rect").attr("x", x(sr[0].date)).attr("width", x(sr[1].date) - x(sr[0].date)).attr("height", ih2)
      .style("fill", "var(--sel)").style("fill-opacity", 0.12).style("stroke", "var(--sel)").style("stroke-opacity", .8);
    g2.append("path").datum(ONT).attr("d", d3.line().x(d => x(d.date)).y(d => y2(d.share)))
      .style("fill", "none").style("stroke", "var(--d19)").style("stroke-width", 2);
    g2.append("g").attr("class", "axis").call(d3.axisLeft(y2).ticks(4).tickFormat(d => d + "%").tickSizeOuter(0));
    timeAxis(g2, x, ih2);
    // selective direct labels: step endpoints, or peak + latest when exploring
    const peak = d3.greatest(ONT, d => d.share), last = ONT[ONT.length - 1];
    const pts = sr ? sr : [peak, last];
    pts.forEach((d, i) => {
      g2.append("circle").attr("cx", x(d.date)).attr("cy", y2(d.share)).attr("r", 4)
        .style("fill", "var(--d19)").style("stroke", "var(--surface)").style("stroke-width", 2);
      const right = x(d.date) > iw - 60;
      g2.append("text").attr("class", "ann").attr("x", x(d.date) + (right ? -6 : 6)).attr("y", y2(d.share) - 8)
        .attr("text-anchor", right ? "end" : (i === 0 && sr ? "end" : "start")).text(`${pct(d.share)} · ${d.label}`);
    });

    // linked crosshair across 1a and 1b
    const rule1 = g1.append("line").attr("y1", 0).attr("y2", ih1).style("stroke", "var(--ink2)").style("display", "none");
    const rule2 = g2.append("line").attr("y1", 0).attr("y2", ih2).style("stroke", "var(--ink2)").style("display", "none");
    const dot2 = g2.append("circle").attr("r", 4).style("fill", "var(--d19)").style("stroke", "var(--surface)").style("stroke-width", 2).style("display", "none");
    const bis = d3.bisector(d => d.date).center;
    const move = function (e) {
      const d = ONT[bis(ONT, x.invert(d3.pointer(e, this)[0]))];
      const xp = x(d.date);
      rule1.attr("x1", xp).attr("x2", xp).style("display", null);
      rule2.attr("x1", xp).attr("x2", xp).style("display", null);
      dot2.attr("cx", xp).attr("cy", y2(d.share)).style("display", null);
      showTip(e, `<div class="t">${d.label}${inCovid(d) ? " · pandemic period" : ""}</div>` +
        BANDS.map(b => tr(b.label, `${int(d[b.key])} (${pct(d[b.key] / d.cases * 100)})`, b.css)).join("") +
        tr("All OW cases", int(d.cases)) + `<div class="m">Long-term share = 19+ months ÷ all cases</div>`);
    };
    const leave = () => { rule1.style("display", "none"); rule2.style("display", "none"); dot2.style("display", "none"); hideTip(); };
    [[g1, ih1], [g2, ih2]].forEach(([g, ih]) => g.append("rect").attr("width", iw).attr("height", ih)
      .style("fill", "transparent").on("pointermove", move).on("pointerleave", leave));
  }

  // ---------- Step 2 period selector (presets + brushable Ontario strip) ----------
  function renderPeriodStrip() {
    const n = S.period.range ? DATES.filter(d => d >= S.period.range[0] && d <= S.period.range[1]).length : 0;
    document.getElementById("periodNow").textContent = `Selected: ${periodText(S.period)} · ${n} quarter${n === 1 ? "" : "s"}`;
    const w = W("periodStrip"), m = { t: 14, r: 8, b: 20, l: 8 }, h = 70, ih = h - m.t - m.b, iw = w - m.l - m.r;
    const x = d3.scaleBand().domain(DATES.map(d => +d)).range([0, iw]).paddingInner(0);
    const xc = d => x(+d) + x.bandwidth() / 2;
    const y = d3.scaleLinear().domain([0, 80]).range([ih, 0]);
    const svg = svgIn("periodStrip", w, h, "Ontario long-term share timeline; drag to choose a period");
    const g = svg.append("g").attr("transform", `translate(${m.l},${m.t})`);
    const c0 = x(+DATES.find(d => d >= COVID[0])), c1 = x(+DATES.filter(d => d <= COVID[1]).pop()) + x.bandwidth();
    g.append("rect").attr("x", c0).attr("width", c1 - c0).attr("height", ih).style("fill", "var(--covid)");
    g.append("text").attr("class", "lbl").attr("x", c0 + 3).attr("y", -3).style("font-size", "11px").text("Pandemic");
    g.append("path").datum(ONT).attr("d", d3.area().x(d => xc(d.date)).y0(y(0)).y1(d => y(d.share))).style("fill", "var(--d19)").style("opacity", .2);
    g.append("path").datum(ONT).attr("d", d3.line().x(d => xc(d.date)).y(d => y(d.share))).style("fill", "none").style("stroke", "var(--d19)").style("stroke-width", 1.4);
    const every = w < 520 ? 5 : 2;
    g.append("g").attr("class", "axis").attr("transform", `translate(0,${ih})`)
      .call(d3.axisBottom(x).tickValues(DATES.filter(d => d.getMonth() === 2 && (d.getFullYear() - 2003) % every === 0).map(d => +d))
        .tickFormat(d => new Date(d).getFullYear()).tickSizeOuter(0));
    const snap = ([p0, p1]) => { const c = DATES.filter(d => xc(d) >= p0 && xc(d) <= p1); return c.length ? [c[0], c[c.length - 1]] : null; };
    const brush = d3.brushX().extent([[0, 0], [iw, ih]]).on("end", e => {
      if (!e.sourceEvent || !e.selection) return;
      const r = snap(e.selection);
      if (!r) return;
      const preset = PERIODS.find(p => +p.range[0] === +r[0] && +p.range[1] === +r[1]);
      S.period = preset || { id: "custom", label: "Custom", range: r };
      renderRegions(true);
    });
    const bg = g.append("g").attr("class", "brush").call(brush);
    bg.call(brush.move, [x(+S.period.range[0]), x(+S.period.range[1]) + x.bandwidth()]);
    bg.selectAll(".selection").style("fill", "var(--sel)").style("fill-opacity", .14).style("stroke", "var(--sel)");
  }

  // ---------- Figure 2a: proportional-symbol map ----------
  function bboxPoints(lon0, lat0, lon1, lat1) { // densified edges: conic parallels curve
    const pts = [];
    for (let t = 0; t <= 1.0001; t += 0.1) {
      const lo = lon0 + (lon1 - lon0) * t, la = lat0 + (lat1 - lat0) * t;
      pts.push([lo, lat0], [lo, lat1], [lon0, la], [lon1, la]);
    }
    return { type: "MultiPoint", coordinates: pts };
  }
  const MAIN_BOX = [-84.9, 41.75, -74.5, 47.35];
  const TB = "595";

  function buildMapGeometry() {
    const w = W("f2map"), pad = 6;
    const box = bboxPoints(...MAIN_BOX);
    const proj = d3.geoConicConformal().parallels([43, 46.5]).rotate([79.7, 0]).fitWidth(w - 2 * pad, box);
    const b = d3.geoPath(proj).bounds(box);
    proj.translate([proj.translate()[0] + pad - b[0][0], proj.translate()[1] + pad - b[0][1]]);
    const h0 = Math.ceil(b[1][1] - b[0][1] + 2 * pad); // height of the geographic frame
    // Wide: inset and size legend sit in empty corners of the map (north of Lake Huron; New York State).
    // Narrow: they move to a band under the map so the crowded geography stays clear.
    const stacked = w < 560;
    const insetW = stacked ? 150 : Math.round(Math.min(176, Math.max(150, w * 0.26))), insetH = Math.round(insetW * 0.98);
    const inset = { x: 6, y: stacked ? h0 + 6 : 6, w: insetW, h: insetH };
    const h = stacked ? h0 + insetH + 12 : h0;
    const iproj = d3.geoConicConformal().parallels([44, 52]).rotate([85, 0])
      .fitExtent([[inset.x + 6, inset.y + 6], [inset.x + inset.w - 6, inset.y + inset.h - 30]], OUTLINE);
    const maxR = Math.max(15, Math.min(36, w * 0.055));
    const rScale = d3.scaleSqrt().domain([0, d3.max(CMA, d => d.cases)]).range([0, maxR]); // area ∝ cases
    const feats = new Map(GEOJ.features.map(f => [f.properties.cma_code, f]));
    const cent = new Map([...feats].map(([c, f]) => [c, d3.geoCentroid(f)]));
    const km = Math.round((d3.geoDistance(cent.get(TB), cent.get("535")) * 6371) / 10) * 10;
    const legendBox = { x: w - 118, y: h - 92, w: 112, h: 86 };
    MAP = { w, h, h0, proj, iproj, inset, rScale, feats, cent, km, legendBox };
  }

  function renderMap(animate) {
    if (!MAP || MAP.w !== W("f2map")) { buildMapGeometry(); d3.select("#f2map").selectAll("*").remove(); }
    const { w, h, h0, proj, iproj, inset, rScale, feats, cent, km, legendBox } = MAP;
    const host = d3.select("#f2map");
    let svg = host.select("svg");
    const fresh = svg.empty();
    if (fresh) {
      svg = host.append("svg").attr("width", w).attr("height", h).attr("role", "group")
        .attr("aria-label", "Map of the 15 CMAs. Circle area shows average OW cases; colour shows the long-term share compared with Ontario.");
      const path = d3.geoPath(proj);
      svg.append("clipPath").attr("id", "mapclip").append("rect").attr("width", w).attr("height", h);
      const base = svg.append("g").attr("clip-path", "url(#mapclip)");
      base.append("path").datum(OUTLINE).attr("d", path).style("fill", "var(--land)").style("stroke", "var(--land-line)").style("stroke-width", .8);
      base.append("g").selectAll("path").data(GEOJ.features.filter(f => f.properties.cma_code !== TB)).join("path")
        .attr("d", path).style("fill", "var(--cma-fill)").style("stroke", "var(--cma-line)").style("stroke-width", .6);
      // inset: whole province, main-map extent, Thunder Bay
      const ig = svg.append("g").attr("class", "inset");
      ig.append("rect").attr("class", "inset-box").attr("x", inset.x).attr("y", inset.y).attr("width", inset.w).attr("height", inset.h).attr("rx", 4);
      ig.append("path").datum(OUTLINE).attr("d", d3.geoPath(iproj)).style("fill", "var(--land)").style("stroke", "var(--land-line)").style("stroke-width", .6);
      ig.append("path").datum(feats.get(TB)).attr("d", d3.geoPath(iproj)).style("fill", "var(--cma-fill)").style("stroke", "var(--cma-line)").style("stroke-width", .6);
      const edge = [[MAIN_BOX[0], MAIN_BOX[1]], [MAIN_BOX[2], MAIN_BOX[1]], [MAIN_BOX[2], MAIN_BOX[3]], [MAIN_BOX[0], MAIN_BOX[3]], [MAIN_BOX[0], MAIN_BOX[1]]]
        .map(p => iproj(p));
      ig.append("path").attr("d", d3.line()(edge)).style("fill", "none").style("stroke", "var(--ink2)").style("stroke-width", 1);
      ig.append("text").attr("class", "lbl").attr("x", inset.x + 6).attr("y", inset.y + inset.h - 18).style("font-size", "10px")
        .text("All Ontario · box = main map").each(function () { trim(this, inset.w - 10); });
      ig.append("text").attr("class", "lbl").attr("x", inset.x + 6).attr("y", inset.y + inset.h - 6).style("font-size", "10px")
        .text(`≈ ${km} km NW of Toronto`).each(function () { trim(this, inset.w - 10); });
      svg.append("g").attr("class", "leaders");
      svg.append("g").attr("class", "syms");
      svg.append("g").attr("class", "labels");
      svg.append("g").attr("class", "hits");
      // size legend (reference circles, area-true)
      const lg = svg.append("g").attr("class", "size-legend").attr("transform", `translate(${legendBox.x},${legendBox.y})`);
      const bx = 34, by = legendBox.h - 6;
      lg.append("text").attr("class", "lbl").attr("x", 0).attr("y", 10).style("font-size", "11px").text("Average OW cases");
      let ly = Infinity; // label y, kept ≥ 11 px apart so small reference circles do not collide
      SIZE_REF.forEach(v => {
        const r = rScale(v), top = by - 2 * r, tx = bx + rScale(SIZE_REF[2]) + 8;
        ly = Math.min(top, ly - 11);
        lg.append("circle").attr("cx", bx).attr("cy", by - r).attr("r", r).style("fill", "none").style("stroke", "var(--ink2)").style("stroke-width", 1);
        lg.append("polyline").attr("points", `${bx},${top} ${tx - 8},${top} ${tx - 2},${ly}`).style("fill", "none").style("stroke", "var(--ink2)").style("stroke-width", .6);
        lg.append("text").attr("class", "lbl").attr("x", tx).attr("y", ly).attr("dy", "0.32em").style("font-size", "10.5px").text(d3.format(",")(v));
      });
    }

    // --- data for the selected period ---
    const st = rankedStats(S.period.range);
    const nodes = st.map(d => {
      const tb = d.code === TB, [x0, y0] = (tb ? iproj : proj)(cent.get(d.code));
      return { ...d, tb, x0, y0, x: x0, y: y0, r: rScale(d.avgCases), fill: divColor(d.diff) };
    });
    // collision avoidance for the southern cluster: pull to true centre, push apart (deterministic)
    const south = nodes.filter(n => !n.tb);
    d3.forceSimulation(south).randomSource(d3.randomLcg(42))
      .force("x", d3.forceX(d => d.x0).strength(0.45)).force("y", d3.forceY(d => d.y0).strength(0.45))
      .force("c", d3.forceCollide(d => d.r + 2.5).iterations(4)).stop().tick(320);
    south.forEach(n => { n.x = Math.max(n.r + 2, Math.min(w - n.r - 2, n.x)); n.y = Math.max(n.r + 2, Math.min(h0 - n.r - 2, n.y)); });
    // labels: greedy placement against circles, other labels, inset, legend and map edge
    const fs = narrow() ? 10.5 : 11.5;
    const meas = svg.append("text").attr("class", "maplbl").style("font-size", fs + "px");
    nodes.forEach(n => { n.text = shortName(n.code); meas.text(n.text); n.tw = meas.node().getComputedTextLength(); });
    meas.remove();
    const obstacles = [{ x: inset.x - 2, y: inset.y - 2, w: inset.w + 4, h: inset.h + 4 }, legendBox];
    placeLabels(south, obstacles, { x0: 2, y0: 2, x1: w - 2, y1: h0 - 2 }, fs);
    const tbn = nodes.find(n => n.tb);
    placeLabels([tbn], [], { x0: inset.x + 3, y0: inset.y + 3, x1: inset.x + inset.w - 3, y1: inset.y + inset.h - 28 }, fs);
    svg.attr("data-label-overlaps", countOverlaps(nodes, obstacles));
    svg.attr("data-max-shift", d3.max(south, n => Math.hypot(n.x - n.x0, n.y - n.y0)).toFixed(1));

    const dur = animate && !reduced() ? 300 : 0;
    const T = sel => (dur ? sel.transition().duration(dur) : sel);
    // leader lines to true centres (only when a circle moved noticeably)
    const moved = south.filter(n => Math.hypot(n.x - n.x0, n.y - n.y0) > Math.max(3, n.r * 0.35));
    const lead = svg.select("g.leaders").selectAll("g.ld").data(moved, d => d.code).join(en => {
      const g = en.append("g").attr("class", "ld");
      g.append("line").attr("class", "leader"); g.append("circle").attr("class", "true-pt").attr("r", 1.8);
      return g;
    });
    lead.each(function (n) {
      const dx = n.x - n.x0, dy = n.y - n.y0, d = Math.hypot(dx, dy);
      const ex = n.x - (dx / d) * n.r, ey = n.y - (dy / d) * n.r;
      const g = d3.select(this);
      T(g.select("line")).attr("x1", n.x0).attr("y1", n.y0).attr("x2", ex).attr("y2", ey);
      g.select("circle").attr("cx", n.x0).attr("cy", n.y0);
    });
    // symbols
    const order = nodes.slice().sort((a, b) => b.r - a.r); // big first so small circles stay on top
    const sym = svg.select("g.syms").selectAll("circle.sym").data(order, d => d.code)
      .join(en => en.append("circle").attr("class", "sym").attr("cx", d => d.x).attr("cy", d => d.y).attr("r", d => d.r).attr("fill", d => d.fill));
    sym.order();
    T(sym).attr("cx", d => d.x).attr("cy", d => d.y).attr("r", d => d.r).attr("fill", d => d.fill);
    // labels (+ leader for labels pushed away from their circle)
    const lab = svg.select("g.labels").selectAll("g.lab").data(nodes, d => d.code).join(en => {
      const g = en.append("g").attr("class", "lab");
      g.append("line").attr("class", "leader").style("stroke-opacity", .6);
      g.append("text").attr("class", "maplbl").attr("dy", "0.35em");
      return g;
    });
    lab.select("text").style("font-size", fs + "px").text(d => d.text).attr("text-anchor", d => d.L.anchor);
    T(lab.select("text")).attr("x", d => d.L.tx).attr("y", d => d.L.ty);
    lab.select("line").style("display", d => (d.L.far ? null : "none"));
    T(lab.select("line")).attr("x1", d => d.L.lx1).attr("y1", d => d.L.ly1).attr("x2", d => d.L.lx2).attr("y2", d => d.L.ly2);
    // hit targets: ≥ 24 px, focusable, west → east tab order
    const hitData = nodes.slice().sort((a, b) => cent.get(a.code)[0] - cent.get(b.code)[0]);
    const per = periodPhrase(S.period);
    svg.select("g.hits").selectAll("circle.hit").data(hitData, d => d.code)
      .join(en => en.append("circle").attr("class", "hit").attr("tabindex", 0).attr("role", "button")
        .on("pointerenter", (e, d) => setHover(d.code)).on("pointerleave", () => setHover(null))
        .on("focus", (e, d) => setHover(d.code)).on("blur", () => setHover(null))
        .on("click", (e, d) => selectCMA(d.code))
        .on("keydown", (e, d) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); selectCMA(d.code); } }))
      .order()
      .attr("cx", d => d.x).attr("cy", d => d.y).attr("r", d => Math.max(12, d.r + 2))
      .attr("aria-label", d => `${d.name}: long-term share ${pct(d.share)}, ${pp(d.diff)} ${d.diff >= 0 ? "above" : "below"} Ontario ${per}; rank ${d.rank} of 15; average ${int(d.avgCases)} OW cases.`);
    document.getElementById("f2Period").textContent = periodPhrase(S.period);
    renderMapLegend();
  }

  function renderMapLegend() {
    const lg = d3.select("#mapLegend"); lg.selectAll("*").remove();
    lg.append("span").attr("class", "ttl").text("Colour: long-term share minus Ontario's");
    DIV_VARS.forEach((v, i) => lg.append("span").attr("class", "k").html(`<i style="background:var(${v})"></i>${DIV_LABELS[i]}`));
    lg.append("span").text("· Area: average OW cases in the period");
  }

  // Greedy label placement: 12 directions × 6 distances; the closest position that collides with
  // nothing (circles in the same frame, placed labels, inset, legend, map edge) wins.
  function placeLabels(nodes, obstacles, bnd, fs) {
    const th = fs * 1.2, placed = [];
    const hitsCircle = b => nodes.some(n => rectCircle(b, n.x, n.y, n.r + 1.5));
    const hitsRect = b => placed.some(p => overlap(b, p)) || obstacles.some(o => overlap(b, o));
    const angles = [0, 180, -90, 90, -30, 30, -150, 150, -60, 60, -120, 120], steps = [3, 10, 20, 32, 46, 62];
    nodes.slice().sort((a, b) => b.r - a.r).forEach(n => {
      let best = null;
      outer: for (const s of steps) for (const a of angles) {
        const rad = (a * Math.PI) / 180, d = n.r + s, c = Math.cos(rad), sn = Math.sin(rad);
        const ax = n.x + c * d, ay = n.y + sn * d;
        const anchor = c > 0.35 ? "start" : c < -0.35 ? "end" : "middle";
        const x0 = anchor === "start" ? ax : anchor === "end" ? ax - n.tw : ax - n.tw / 2;
        const y0 = sn < -0.8 ? ay - th : sn > 0.8 ? ay : ay - th / 2;
        const b = { x: x0 - 1, y: y0, w: n.tw + 2, h: th };
        if (b.x < bnd.x0 || b.y < bnd.y0 || b.x + b.w > bnd.x1 || b.y + b.h > bnd.y1) continue;
        const cost = (hitsCircle(b) ? 2 : 0) + (hitsRect(b) ? 2 : 0) + s / 100;
        if (!best || cost < best.cost) best = { b, anchor, ax, ay, s, rad, cost };
        if (cost < 1) break outer;
      }
      if (!best) best = { b: { x: n.x + n.r + 3, y: n.y - th / 2, w: n.tw, h: th }, anchor: "start", ax: n.x + n.r + 3, ay: n.y, s: 3, rad: 0 };
      placed.push(best.b);
      const far = best.s >= 20;
      n.L = { anchor: best.anchor, tx: best.anchor === "start" ? best.b.x + 1 : best.anchor === "end" ? best.b.x + best.b.w - 1 : best.b.x + best.b.w / 2,
        ty: best.b.y + th / 2, box: best.b, far,
        lx1: n.x + Math.cos(best.rad) * (n.r + 1), ly1: n.y + Math.sin(best.rad) * (n.r + 1),
        lx2: n.x + Math.cos(best.rad) * (n.r + best.s - 2), ly2: n.y + Math.sin(best.rad) * (n.r + best.s - 2) };
    });
  }
  const overlap = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
  function rectCircle(b, cx, cy, r) {
    const nx = Math.max(b.x, Math.min(cx, b.x + b.w)), ny = Math.max(b.y, Math.min(cy, b.y + b.h));
    return (nx - cx) ** 2 + (ny - cy) ** 2 < r * r;
  }
  function countOverlaps(nodes, obstacles) { // QA: labels vs labels, circles, inset and legend; circles vs circles
    let k = 0;
    const south = nodes.filter(n => !n.tb);
    for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) if (overlap(nodes[i].L.box, nodes[j].L.box)) k++;
    for (const a of nodes) for (const n of (a.tb ? [a] : south)) if (rectCircle(a.L.box, n.x, n.y, n.r)) k++;
    for (const a of south) for (const o of obstacles) if (overlap(a.L.box, o)) k++;
    for (let i = 0; i < south.length; i++) for (let j = i + 1; j < south.length; j++)
      if (Math.hypot(south[i].x - south[j].x, south[i].y - south[j].y) < south[i].r + south[j].r) k++;
    return k;
  }

  // ---------- Figure 2b: analysis card (hovered CMA, otherwise the selected one) ----------
  function renderCard() {
    const code = S.hover || S.cma, preview = !!S.hover && S.hover !== S.cma;
    const st = rankedStats(S.period.range), d = st.find(x => x.code === code);
    const p3 = PERIOD3.map(([id, lab]) => { const s = rankedStats(periodById(id).range).find(x => x.code === code); return { id, lab, diff: s.diff, rank: s.rank }; });
    const above = quartersAbove(code), sw = `background:${divColor(d.diff)}`;
    const el = d3.select("#card"); el.selectAll("*").remove();
    el.append("p").attr("class", "mode").text(preview ? "Figure 2b · Preview · click the circle to select" : "Figure 2b · Selected CMA");
    el.append("h3").text(d.name);
    el.append("p").attr("class", "per").text(`Long-term share ${periodPhrase(S.period)}`);
    el.append("dl").attr("class", "stats").html(
      `<dt>Long-term share</dt><dd>${pct(d.share)}</dd>` +
      `<dt>Ontario, same period</dt><dd>${pct(d.ont)}</dd>` +
      `<dt>Difference</dt><dd><i style="${sw}"></i>${pp(d.diff)}</dd>` +
      `<dt>Rank among 15 CMAs</dt><dd>${d.rank} of 15</dd>` +
      `<dt>Average OW cases</dt><dd>${int(d.avgCases)}</dd>`);
    if (d.avgCases < 3000) el.append("p").attr("class", "warn").text("Small CMA: its share moves more from quarter to quarter, so single quarters are less reliable.");
    el.append("h4").text("Difference from Ontario, every quarter (pp)");
    cardSpark(el.append("div").attr("class", "chart spark"), code);
    el.append("h4").text("Difference by pandemic period (pp) and rank · grey = within 2 pp");
    cardPeriods(el.append("div").attr("class", "chart"), p3);
    el.append("p").attr("class", "sum").html(`<b>${summary(d, p3)}</b> Above Ontario in ${above} of ${DATES.length} quarters.`);
  }
  const joinP = arr => arr.length === 1 ? arr[0] : arr.length === 2 ? `${arr[0]} and ${arr[1]}` : `${arr.slice(0, -1).join(", ")} and ${arr[arr.length - 1]}`;
  // Same three groups as the colour scale (classes 0–1 below, 2 close, 3–4 above) so words match colours.
  function summary(d, p3) {
    const w = { pre: "before", during: "during", post: "after" };
    const cat = v => { const i = divIdx(v); return i < 2 ? "below" : i > 2 ? "above" : "close to"; };
    const groups = [];
    p3.forEach(p => { const c = cat(p.diff), g = groups.find(x => x.c === c); g ? g.p.push(w[p.id]) : groups.push({ c, p: [w[p.id]] }); });
    const a = groups.length === 1 ? `${groups[0].c[0].toUpperCase() + groups[0].c.slice(1)} Ontario before, during and after the pandemic`
      : groups.map((g, i) => (i === 0 ? `${g.c[0].toUpperCase() + g.c.slice(1)} Ontario ${joinP(g.p)} the pandemic` : `${g.c} it ${joinP(g.p)}`)).join(", ");
    const ph = PHRASE[S.period.id];
    const r = d.rank === 1 ? `highest of the 15 CMAs ${ph}` : d.rank === 15 ? `lowest of the 15 CMAs ${ph}`
      : d.rank <= 3 ? `among the three highest ${ph}` : d.rank >= 13 ? `among the three lowest ${ph}` : `ranked ${d.rank} of 15 ${ph}`;
    return `${a}; ${r}.`;
  }
  const SPARK_MAX = () => Math.ceil(d3.max(CMA, d => Math.abs(d.dev)) / 5) * 5; // shared scale across CMAs
  function cardSpark(host, code) {
    const rows = BY_CMA.get(code), w = host.node().clientWidth || 300, h = 112, m = { t: 6, r: 8, b: 18, l: 30 };
    const iw = w - m.l - m.r, ih = h - m.t - m.b, M = SPARK_MAX();
    const x = d3.scaleTime().domain(d3.extent(DATES)).range([0, iw]);
    const y = d3.scaleLinear().domain([-M, M]).range([ih, 0]);
    const svg = host.append("svg").attr("width", w).attr("height", h).attr("role", "img")
      .attr("aria-label", `${NAMES.get(code)}: long-term share minus Ontario's for every quarter, 2003 to 2026`);
    const g = svg.append("g").attr("transform", `translate(${m.l},${m.t})`);
    covidBand(g, x, ih, false);
    periodBand(g, x, ih);
    g.append("g").attr("class", "grid").call(d3.axisLeft(y).tickValues([-10, 10].filter(v => Math.abs(v) < M)).tickSize(-iw).tickFormat(""));
    const id = `sp${code}`;
    g.append("clipPath").attr("id", id + "a").append("rect").attr("width", iw).attr("height", y(0));
    g.append("clipPath").attr("id", id + "b").append("rect").attr("y", y(0)).attr("width", iw).attr("height", ih - y(0));
    const ar = d3.area().x(d => x(d.date)).y0(y(0)).y1(d => y(d.dev));
    g.append("path").datum(rows).attr("d", ar).attr("clip-path", `url(#${id}a)`).style("fill", "var(--dv3)").style("opacity", .65);
    g.append("path").datum(rows).attr("d", ar).attr("clip-path", `url(#${id}b)`).style("fill", "var(--dv1)").style("opacity", .65);
    g.append("path").datum(rows).attr("d", d3.line().x(d => x(d.date)).y(d => y(d.dev))).style("fill", "none").style("stroke", "var(--ink2)").style("stroke-width", 1.2);
    g.append("line").attr("x1", 0).attr("x2", iw).attr("y1", y(0)).attr("y2", y(0)).style("stroke", "var(--ink)").style("stroke-width", 1);
    g.append("g").attr("class", "axis").call(d3.axisLeft(y).tickValues([-10, 0, 10].filter(v => Math.abs(v) < M)).tickFormat(v => (v > 0 ? "+" : v < 0 ? "−" : "") + Math.abs(v)).tickSizeOuter(0))
      .call(a => a.select(".domain").remove());
    timeAxis(g, x, ih, 5);
    g.append("text").attr("class", "lbl").attr("x", 3).attr("y", 9).style("font-size", "10.5px").text("above Ontario");
    g.append("text").attr("class", "lbl").attr("x", 3).attr("y", ih - 4).style("font-size", "10.5px").text("below Ontario");
  }
  function cardPeriods(host, p3) {
    const w = host.node().clientWidth || 300, rh = 22, m = { t: 4, r: 8, b: 4, l: 56 };
    const h = p3.length * rh + m.t + m.b, iw = w - m.l - m.r, lblW = 92;
    const M = Math.ceil(d3.max(PERIOD3.flatMap(([id]) => rankedStats(periodById(id).range).map(d => Math.abs(d.diff)))) / 2) * 2;
    const x = d3.scaleLinear().domain([-M, M]).range([0, iw - lblW]);
    const svg = host.append("svg").attr("width", w).attr("height", h).attr("role", "img")
      .attr("aria-label", p3.map(p => `${p.lab} the pandemic: ${pp(p.diff)}, rank ${p.rank}`).join("; "));
    const g = svg.append("g").attr("transform", `translate(${m.l},${m.t})`);
    p3.forEach((p, i) => {
      const yy = i * rh, on = S.period.id === p.id;
      if (on) g.append("rect").attr("x", -m.l + 2).attr("y", yy).attr("width", w - 4).attr("height", rh - 2).attr("rx", 3).style("fill", "var(--sel)").style("fill-opacity", .12).style("stroke", "var(--sel)").style("stroke-opacity", .8);
      g.append("text").attr("class", on ? "lbl-strong" : "lbl").attr("x", -6).attr("y", yy + rh / 2 - 1).attr("dy", "0.32em").attr("text-anchor", "end").text(p.lab);
      const x0 = x(Math.min(0, p.diff)), bw = Math.max(1.5, Math.abs(x(p.diff) - x(0)));
      g.append("rect").attr("class", "sym").attr("x", x0).attr("y", yy + 4).attr("width", bw).attr("height", rh - 10).attr("rx", 2).attr("fill", divColor(p.diff));
      g.append("text").attr("class", on ? "lbl-strong" : "lbl").attr("x", iw - lblW + 6).attr("y", yy + rh / 2 - 1).attr("dy", "0.32em").text(`${pp(p.diff)} · #${p.rank}`);
    });
    g.append("line").attr("x1", x(0)).attr("x2", x(0)).attr("y1", 0).attr("y2", p3.length * rh - 2).style("stroke", "var(--ink)");
  }

  // Annotated takeaway under the map (does not need hovering).
  function renderTakeaway() {
    const { aboveAll, below90 } = persistence();
    const st = rankedStats(S.period.range), nUp = st.filter(d => d.diff > 0).length;
    const btn = c => `<button type="button" data-cma="${c}">${NAMES.get(c)}</button>`;
    const el = document.getElementById("mapTakeaway");
    el.innerHTML =
      `<b>Above Ontario in all three periods:</b> ${aboveAll.length ? joinP(aboveAll.map(d => `${btn(d.code)} (smallest margin ${pp(d.margin)})`)) : "none"}; a margin under 2 pp is within the grey band, so this is a weak pattern. ` +
      `<b>Below Ontario in at least 90% of quarters:</b> ${joinP(below90.map(d => `${btn(d.code)} (${d.below} of ${DATES.length})`))}. ` +
      `${PHRASE[S.period.id][0].toUpperCase() + PHRASE[S.period.id].slice(1)}, ${nUp} of 15 CMAs were above Ontario.`;
    d3.select(el).selectAll("button")
      .on("pointerenter focus", function () { setHover(this.dataset.cma); })
      .on("pointerleave blur", () => setHover(null))
      .on("click", function () { selectCMA(this.dataset.cma); });
  }

  // ---------- Figure 3: ranked dot plot for the period ----------
  function renderF3() {
    const st = sorted(periodStats(S.period.range)), ont = ontPeriod(S.period.range);
    document.getElementById("f3Period").textContent = periodPhrase(S.period);
    const w = W("f3"), m = { t: 40, r: 96, b: 8, l: Math.min(200, Math.max(120, w * 0.36)) }, rh = 22;
    const ih = st.length * rh, iw = w - m.l - m.r;
    // Domain follows the selected period (min of quarterly lows → max of highs) so 15 close values stay discriminable.
    const x = d3.scaleLinear().domain([Math.floor(Math.min(d3.min(st, d => d.min), ont) / 5) * 5, Math.ceil(d3.max(st, d => d.max) / 5) * 5]).range([0, iw]);
    const y = d3.scaleBand().domain(st.map(d => d.code)).range([0, ih]).padding(0.2);
    const svg = svgIn("f3", w, ih + m.t + m.b, "Dot plot of long-term share by CMA for the selected period");
    const g = svg.append("g").attr("transform", `translate(${m.l},${m.t})`);
    g.append("g").attr("class", "grid").call(d3.axisTop(x).ticks(w < 520 ? 4 : 6).tickSize(-ih).tickFormat(""));
    g.append("g").attr("class", "axis").call(d3.axisTop(x).ticks(w < 520 ? 4 : 6).tickFormat(d => d + "%").tickSizeOuter(0)).call(a => a.select(".domain").remove());
    g.append("line").attr("x1", x(ont)).attr("x2", x(ont)).attr("y1", 0).attr("y2", ih).style("stroke", "var(--ont)").style("stroke-width", 1.5);
    g.append("text").attr("class", "ann").attr("x", x(ont) + 4).attr("y", ih - 4).text(`Ontario ${pct(ont)}`);
    g.append("text").attr("class", "lbl").attr("x", iw + 16).attr("y", -26).style("font-size", "11px").text("Share ·");
    g.append("text").attr("class", "lbl").attr("x", iw + 16).attr("y", -13).style("font-size", "11px").text("avg cases");
    const sel = d => d.code === S.cma;
    const r = g.selectAll("g.r").data(st, d => d.code).join("g").attr("class", "r").attr("transform", d => `translate(0,${y(d.code)})`)
      .style("cursor", "pointer").on("click", (e, d) => selectCMA(d.code))
      .on("pointerenter", (e, d) => setHover(d.code))
      .on("pointermove", (e, d) => showTip(e, `<div class="t">${d.name} · ${periodText(S.period)}</div>` +
        tr("Long-term share", pct(d.share)) + tr("Lowest–highest quarter", `${pct(d.min)} – ${pct(d.max)}`) +
        tr("vs Ontario", pp(d.share - ont)) + tr("Average OW cases", int(d.avgCases)) + tr("Quarters", d.n)))
      .on("pointerleave", () => { hideTip(); setHover(null); });
    r.append("rect").attr("class", "bg").attr("x", -m.l).attr("width", w).attr("y", -y.step() * 0.1).attr("height", y.step());
    r.append("text").attr("class", d => sel(d) ? "lbl-strong" : "lbl").attr("x", -10).attr("y", y.bandwidth() / 2).attr("dy", "0.32em").attr("text-anchor", "end").text(d => d.name).each(function () { trim(this, m.l - 14); });
    r.append("line").attr("x1", d => x(d.min)).attr("x2", d => x(d.max)).attr("y1", y.bandwidth() / 2).attr("y2", y.bandwidth() / 2)
      .style("stroke", d => sel(d) ? "var(--sel)" : "var(--other)").style("stroke-width", 2).style("stroke-linecap", "round");
    r.append("circle").attr("cx", d => x(d.share)).attr("cy", y.bandwidth() / 2).attr("r", d => sel(d) ? 6.5 : 5)
      .style("fill", d => sel(d) ? "var(--sel)" : "var(--ink2)").style("stroke", "var(--surface)").style("stroke-width", 2);
    r.append("text").attr("class", d => sel(d) ? "lbl-strong" : "lbl").attr("x", iw + 8).attr("y", y.bandwidth() / 2).attr("dy", "0.32em")
      .text(d => `${f1(d.share)}% · ${d3.format(",.0f")(d.avgCases)}`);

    // table view (accessibility / exact values)
    const tw = d3.select("#tableWrap"); tw.selectAll("*").remove();
    const t = tw.append("table");
    t.append("caption").style("text-align", "left").style("font-size", "12px").text(`Long-term share by CMA, ${periodText(S.period)}`);
    t.append("thead").append("tr").selectAll("th").data(["CMA", "Long-term share", "Lowest quarter", "Highest quarter", "vs Ontario", "Avg OW cases"]).join("th").text(d => d);
    t.append("tbody").selectAll("tr").data(st).join("tr").selectAll("td")
      .data(d => [d.name, pct(d.share), pct(d.min), pct(d.max), pp(d.share - ont), int(d.avgCases)]).join("td").text(d => d);
  }

  // ---------- Figure 4: selected CMA detail ----------
  function renderF4() {
    const code = S.cma, rows = BY_CMA.get(code), name = NAMES.get(code);
    const w = W("f4"), n = narrow(), m = { t: 12, r: n ? 12 : 96, b: 22, l: 44 };
    const h = 250, ih = h - m.t - m.b, iw = w - m.l - m.r;
    const x = d3.scaleTime().domain(d3.extent(DATES)).range([0, iw]);
    const mix = S.detail === "mix";
    const y = d3.scaleLinear().domain([0, mix ? 100 : 80]).range([ih, 0]);
    document.getElementById("f4Title").textContent = mix ? `${name}: share of OW cases by time on assistance` : `${name}: long-term share vs Ontario and the other CMAs`;
    const svg = svgIn("f4", w, h, `${name} detail chart`);
    const g = svg.append("g").attr("transform", `translate(${m.l},${m.t})`);
    covidBand(g, x, ih, true);
    periodBand(g, x, ih);
    g.append("g").attr("class", "grid").call(d3.axisLeft(y).ticks(5).tickSize(-iw).tickFormat(""));
    const line = d3.line().x(d => x(d.date)).y(d => y(d.share));
    const labels = [];
    if (mix) {
      const st = d3.stack().keys(BANDS.map(b => b.key)).value((d, k) => d[k] / d.cases * 100)(rows);
      g.append("g").selectAll("path").data(st).join("path")
        .attr("d", d3.area().x(d => x(d.data.date)).y0(d => y(d[0])).y1(d => y(d[1])))
        .style("fill", s => BANDS.find(b => b.key === s.key).css).style("stroke", "var(--surface)").style("stroke-width", 1);
      // surface casing keeps the Ontario reference line readable on top of every band
      g.append("path").datum(ONT).attr("d", line).style("fill", "none").style("stroke", "var(--surface)").style("stroke-width", 4.5);
      g.append("path").datum(ONT).attr("d", line).style("fill", "none").style("stroke", "var(--ont)").style("stroke-width", 1.5);
      const li = rows.length - 1;
      st.forEach(s => labels.push({ y: y((s[li][0] + s[li][1]) / 2), t: BANDS.find(b => b.key === s.key).label, strong: s.key === "moa19" }));
      labels.push({ y: y(ONT[ONT.length - 1].share), t: "— Ontario 19+", strong: false });
    } else {
      g.append("g").selectAll("path").data(Array.from(BY_CMA).filter(([c]) => c !== code)).join("path")
        .attr("class", "f4other").attr("data-cma", ([c]) => c).attr("d", ([, r]) => line(r));
      g.append("path").datum(ONT).attr("d", line).style("fill", "none").style("stroke", "var(--ont)").style("stroke-width", 1.5);
      g.append("path").datum(rows).attr("d", line).style("fill", "none").style("stroke", "var(--sel)").style("stroke-width", 2.5);
      const L = rows[rows.length - 1], O = ONT[ONT.length - 1];
      labels.push({ y: y(L.share), t: `${name} ${pct(L.share)}`, strong: true }, { y: y(O.share), t: `Ontario ${pct(O.share)}`, strong: false });
    }
    g.append("g").attr("class", "axis").call(d3.axisLeft(y).ticks(5).tickFormat(d => d + "%").tickSizeOuter(0));
    timeAxis(g, x, ih);
    if (!n) endLabels(g, labels, iw + 6, 14);
    const pst = periodStats(S.period.range).find(d => d.code === code);
    document.getElementById("f4Note").textContent =
      (mix ? "Bands sum to 100% each quarter; the 19+ band sits on the baseline. Dark line: Ontario long-term share. "
        : "Grey lines: the other 14 CMAs (the one under your pointer is darkened). Dark line: Ontario. ") +
      `Shaded: selected period (${periodText(S.period)}), average ${int(pst.avgCases)} OW cases in ${name}.`;
    // hover
    const rule = g.append("line").attr("y1", 0).attr("y2", ih).style("stroke", "var(--ink2)").style("display", "none");
    const bis = d3.bisector(d => d.date).center;
    g.append("rect").attr("width", iw).attr("height", ih).style("fill", "transparent")
      .on("pointermove", function (e) {
        const d = rows[bis(rows, x.invert(d3.pointer(e, this)[0]))];
        rule.attr("x1", x(d.date)).attr("x2", x(d.date)).style("display", null);
        showTip(e, `<div class="t">${name} · ${d.label}</div>` +
          (mix ? BANDS.map(b => tr(b.label, pct(d[b.key] / d.cases * 100), b.css)).join("") : "") +
          tr("Long-term share", pct(d.share)) + tr("Ontario", pct(d.ont)) + tr("Difference", pp(d.dev)) + tr("OW cases", int(d.cases)));
      })
      .on("pointerleave", () => { rule.style("display", "none"); hideTip(); });
  }

  // ---------- Step 3 cards (all computed) ----------
  function renderCards() {
    const peak = d3.greatest(ONT, d => d.share), ref = Q.get("2019 Q4");
    const st = periodStats(S.period.range).sort((a, b) => b.share - a.share), ont = ontPeriod(S.period.range);
    const names = a => a.map(d => d.name).join(", ");
    const pre = periodStats(periodById("pre").range).sort((a, b) => b.share - a.share);
    const post = periodStats(periodById("post").range).sort((a, b) => b.share - a.share);
    const rank = (arr, c) => arr.findIndex(d => d.code === c) + 1;
    const mover = d3.greatest(pre, d => Math.abs(rank(pre, d.code) - rank(post, d.code)));
    const { aboveAll, below90 } = persistence();
    const per = periodPhrase(S.period);
    const cards = [
      { h: "The data support", li: [
        `Ontario's long-term share peaked at ${pct(peak.share)} in ${peak.label} with about as many long-term cases as in ${ref.label} (${int(ref.moa19)} vs ${int(peak.moa19)}) but fewer cases overall.`,
        `${per[0].toUpperCase() + per.slice(1)}, the highest shares were in ${names(st.slice(0, 3))}; the lowest in ${names(st.slice(-2))} (Ontario: ${pct(ont)}).`,
        `${joinP(below90.map(d => NAMES.get(d.code)))} had a lower long-term share than Ontario in at least 90% of quarters.`,
        `Rankings shift: ${mover.name} ranked ${rank(pre, mover.code)} of 15 before the pandemic and ${rank(post, mover.code)} of 15 after it.`] },
      { h: "The data do not show", li: [
        "Why the total caseload fell in 2020–2021, or why it grew afterwards.",
        "How long a new case will last, or how likely any person is to stay on assistance.",
        "That a CMA's local services or policies caused its higher or lower share.",
        "Regional differences in need: a share of the caseload is not a rate per population."] },
      { h: "Worth investigating", li: [
        aboveAll.length ? `Above Ontario before, during and after the pandemic: ${joinP(aboveAll.map(d => NAMES.get(d.code)))}${aboveAll.some(d => d.margin < 2) ? " (in at least one period by under 2 pp)" : ""}.` : "No CMA stayed above Ontario before, during and after the pandemic.",
        `Large rank changes, such as ${mover.name}, before reading any single quarter's ranking as stable.`,
        `Why the Ontario long-term share has risen again since ${d3.least(ONT.filter(d => d.date > peak.date), d => d.share).label} (compare with case counts in Figure 1a).`] },
    ];
    d3.select("#cards").selectAll("div.card").data(cards).join("div").attr("class", "card")
      .html(c => `<h3>${c.h}</h3><ul>${c.li.map(l => `<li>${l}</li>`).join("")}</ul>`);
  }

  function trim(el, max) {
    const full = el.textContent;
    if (el.getComputedTextLength() <= max) return;
    let t = full; while (t.length > 3 && el.getComputedTextLength() > max) { t = t.slice(0, -1); el.textContent = t + "…"; }
    d3.select(el).append("title").text(full);
  }
  function debounce(f, ms) { let t; return () => { clearTimeout(t); t = setTimeout(f, ms); }; }
})();
