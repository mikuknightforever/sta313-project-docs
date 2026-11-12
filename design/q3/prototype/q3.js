/* Q3 prototype — OW assistance duration, Ontario and 15 CMAs.
   Reads the course CSVs directly; every number in the text is computed here. */
(() => {
  "use strict";
  const DATA = "../../../datasets/ONT-SA/selected/";
  // Stack order bottom → top: the long-term band sits on the baseline (L3: only the
  // baseline layer of a stack is read on a common scale).
  const BANDS = [
    { key: "moa19", label: "19+ months", css: "var(--d19)" },
    { key: "moa1318", label: "13–18 months", css: "var(--d1318)" },
    { key: "moa512", label: "5–12 months", css: "var(--d512)" },
    { key: "moa04", label: "0–4 months", css: "var(--d04)" },
  ];
  const COVID = [new Date(2020, 2, 1), new Date(2023, 4, 31)]; // dataset definition
  const DIV_T = [-10, -6, -2, 2, 6, 10]; // pp thresholds → 7 classes
  const DIV_C = ["--v-3", "--v-2", "--v-1", "--v0", "--v1", "--v2", "--v3"].map(v => `var(${v})`);
  const DIV_L = ["≤ −10", "−10 to −6", "−6 to −2", "within ±2", "+2 to +6", "+6 to +10", "≥ +10"];

  const f1 = d3.format(".1f");
  const pct = v => `${f1(v)}%`;
  const int = v => d3.format(",.0f")(v);
  const pp = v => `${v > 0 ? "+" : v < 0 ? "−" : "±"}${f1(Math.abs(v))} pp`;
  const tip = document.getElementById("tip");

  const S = { step: 1, mode: "count", iso: null, period: null, cma: null, sort: "share", detail: "share", hover: null };
  let ONT, CMA, DATES, BY_CMA, NAMES, PERIODS, Q;

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
  ]).then(([ont, cma]) => {
    ONT = ont.sort((a, b) => a.date - b.date);
    DATES = ONT.map(d => d.date);
    Q = new Map(ONT.map(d => [d.label, d]));
    const ontBy = new Map(ONT.map(d => [+d.date, d]));
    cma.forEach(d => { d.ont = ontBy.get(+d.date).share; d.dev = d.share - d.ont; });
    CMA = cma;
    BY_CMA = d3.group(cma, d => d.code);
    NAMES = new Map(cma.map(d => [d.code, d.name]));
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
    S.cma = periodStats(S.period.range).sort((a, b) => b.share - a.share)[0].code;
    // Optional URL state (shareable views; also used for screenshots):
    // ?theme=dark&step=2&mode=share&iso=moa19&period=during&cma=535&detail=mix&sort=cases
    const U = new URLSearchParams(location.search);
    if (U.get("theme")) document.documentElement.dataset.theme = U.get("theme");
    if (U.has("step")) S.step = +U.get("step");
    if (["count", "share"].includes(U.get("mode"))) S.mode = U.get("mode");
    if (BANDS.some(b => b.key === U.get("iso"))) S.iso = U.get("iso");
    const up = PERIODS.find(p => p.id === U.get("period")); if (up) S.period = up;
    if (up && !U.has("cma")) S.cma = periodStats(up.range).sort((a, b) => b.share - a.share)[0].code;
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
  }).catch(err => {
    document.getElementById("lead").textContent =
      "Could not load the CSV files. Serve the repository root over HTTP (see README) and reopen this page.";
    console.error(err);
  });

  // ---------- derived data ----------
  const qLabel = d => ONT.find(o => +o.date === +d).label;
  const PHRASE = { latest: "in the latest quarter", post: "after the pandemic", during: "during the pandemic",
    pre: "before the pandemic", all: "across all years", custom: "in the selected period" };
  const periodPhrase = p => `${PHRASE[p.id]} (${periodText(p)})`;
  const periodText = p => {
    const a = qLabel(p.range[0]), b = qLabel(p.range[1]);
    return a === b ? a : `${a} – ${b}`;
  };
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
  const sorted = st => st.slice().sort(
    S.sort === "name" ? (a, b) => d3.ascending(a.name, b.name)
      : S.sort === "cases" ? (a, b) => b.avgCases - a.avgCases
        : (a, b) => b.share - a.share);
  const divClass = v => DIV_C[d3.bisectRight(DIV_T, v) - (DIV_T.includes(v) ? 1 : 0)] || DIV_C[3];

  // ---------- controls ----------
  function buildControls() {
    const steps = [
      { id: 1, label: "1 · 2009–2019", range: ["2009 Q2", "2019 Q4"] },
      { id: 2, label: "2 · 2019–2021", range: ["2019 Q4", "2021 Q3"] },
      { id: 3, label: "3 · 2021–2026", range: ["2021 Q3", ONT[ONT.length - 1].label] },
      { id: 0, label: "Explore all" },
    ];
    S.steps = steps;
    seg("#stepSeg", steps, s => s.label, s => S.step === s.id, s => { S.step = s.id; renderStory(); renderF1(); });
    d3.selectAll("#modeSeg button").on("click", function () { S.mode = this.dataset.mode; renderF1(); syncPressed(); });
    seg("#periodSeg", PERIODS, p => `${p.label}`, p => S.period.id === p.id, p => { S.period = p; renderRegions(); });
    d3.selectAll("#detailSeg button").on("click", function () { S.detail = this.dataset.d; renderF4(); syncPressed(); });
    d3.select("#sortSel").on("change", function () { S.sort = this.value; renderRegions(); });
    d3.select("#tableBtn").on("click", function () {
      const w = document.getElementById("tableWrap"); w.hidden = !w.hidden;
      this.setAttribute("aria-expanded", String(!w.hidden)); this.textContent = w.hidden ? "Show as table" : "Hide table";
    });
    const tb = document.getElementById("themeBtn");
    const dark = () => (document.documentElement.dataset.theme || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")) === "dark";
    const lab = () => (tb.textContent = dark() ? "Light theme" : "Dark theme");
    tb.onclick = () => { document.documentElement.dataset.theme = dark() ? "light" : "dark"; lab(); };
    lab();
    // band legend = filter (isolate one band on the baseline)
    const lg = d3.select("#bandLegend");
    lg.selectAll("button.b").data(BANDS.slice().reverse()).join("button").attr("class", "b").attr("type", "button")
      .html(b => `<i style="background:${b.css}"></i>${b.label}`)
      .on("click", (e, b) => { S.iso = S.iso === b.key ? null : b.key; renderF1(); syncPressed(); });
    lg.append("button").attr("class", "reset").attr("type", "button").text("Show all").on("click", () => { S.iso = null; renderF1(); syncPressed(); });
    syncPressed();
  }
  function seg(sel, data, label, on, click) {
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
    renderLead(); renderStory(); renderF1(); renderRegions(); renderCards();
  }
  function renderRegions() { syncPressed(); renderF2(); renderF3(); renderF4(); renderCards(); }

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
  function timeAxis(g, x, h) {
    const n = narrow();
    g.append("g").attr("class", "axis").attr("transform", `translate(0,${h})`)
      .call(d3.axisBottom(x).ticks(d3.timeYear.every(n ? 5 : 2)).tickFormat(d3.timeFormat("%Y")).tickSizeOuter(0));
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
  let hoverDate = null;
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

  // ---------- Figure 2: heatmap of difference from Ontario ----------
  function renderF2() {
    // legend
    const lg = d3.select("#divLegend"); lg.selectAll("*").remove();
    lg.append("span").attr("class", "lab").text("Lower than Ontario");
    DIV_C.forEach((c, i) => lg.append("span").attr("class", "sw").style("background", c).attr("title", DIV_L[i] + " pp"));
    lg.append("span").attr("class", "lab").text("Higher than Ontario");
    lg.append("span").attr("class", "lab").style("margin-left", "auto").text("Steps: ±2, ±6, ±10 pp; middle grey = within 2 pp");

    const w = Math.max(W("f2"), 760);
    const m = { t: 70, r: 12, b: 24, l: 178 };
    const st = sorted(periodStats(S.period.range));
    const rows = st.map(d => d.code);
    const rh = 20, ih = rows.length * rh, iw = w - m.l - m.r;
    const x = d3.scaleBand().domain(DATES.map(d => +d)).range([0, iw]).paddingInner(0.08);
    const y = d3.scaleBand().domain(rows).range([0, ih]).paddingInner(0.12);
    const svg = svgIn("f2", w, ih + m.t + m.b, "Heatmap: rows are CMAs, columns are quarters, colour is the difference from the Ontario long-term share");
    const g = svg.append("g").attr("transform", `translate(${m.l},${m.t})`);

    // overview strip with brush (Ontario long-term share as context)
    const sy = d3.scaleLinear().domain([0, 80]).range([-14, -50]);
    const sx = d => x(+d) + x.bandwidth() / 2;
    const strip = g.append("g");
    strip.append("rect").attr("x", sx(COVID[0]) - x.step() / 2).attr("width", sx(DATES.find(d => d >= new Date(2023, 2, 1))) - sx(COVID[0]) + x.step())
      .attr("y", -52).attr("height", 40).style("fill", "var(--covid)");
    strip.append("path").datum(ONT).attr("d", d3.area().x(d => sx(d.date)).y0(sy(0)).y1(d => sy(d.share)))
      .style("fill", "var(--d19)").style("opacity", .22);
    strip.append("path").datum(ONT).attr("d", d3.line().x(d => sx(d.date)).y(d => sy(d.share))).style("fill", "none").style("stroke", "var(--d19)").style("stroke-width", 1.2);
    g.append("text").attr("class", "lbl").attr("x", -8).attr("y", -36).attr("text-anchor", "end").text("Ontario 19+ share");
    g.append("text").attr("class", "lbl").attr("x", -8).attr("y", -22).attr("text-anchor", "end").style("fill", "var(--muted)").text("drag to choose ↔");
    const snap = ([p0, p1]) => {
      const c = DATES.filter(d => sx(d) >= p0 && sx(d) <= p1);
      return c.length ? [c[0], c[c.length - 1]] : null;
    };
    const brush = d3.brushX().extent([[0, -52], [iw, -12]]).on("end", e => {
      if (!e.sourceEvent) return;
      if (!e.selection) { return; }
      const r = snap(e.selection);
      if (!r) return;
      S.period = { id: "custom", label: "Custom", range: r };
      renderRegions();
    });
    const bg = strip.append("g").attr("class", "brush").call(brush);
    bg.call(brush.move, [x(+S.period.range[0]), x(+S.period.range[1]) + x.bandwidth()]);
    bg.selectAll(".selection").style("fill", "var(--sel)").style("fill-opacity", .12).style("stroke", "var(--sel)");

    // rows
    const rowG = g.selectAll("g.row").data(rows, d => d).join("g").attr("class", "row")
      .attr("transform", d => `translate(0,${y(d)})`).attr("data-cma", d => d);
    rowG.append("text").attr("class", d => d === S.cma ? "lbl-strong" : "lbl").attr("x", -8).attr("y", y.bandwidth() / 2).attr("dy", "0.32em")
      .attr("text-anchor", "end").style("cursor", "pointer").text(d => NAMES.get(d))
      .on("click", (e, d) => { S.cma = d; renderRegions(); });
    rowG.selectAll("rect.c").data(d => BY_CMA.get(d)).join("rect").attr("class", "c")
      .attr("x", d => x(+d.date)).attr("width", x.bandwidth()).attr("height", y.bandwidth()).attr("rx", 1.5)
      .style("fill", d => divClass(d.dev)).style("cursor", "pointer")
      .on("pointermove", (e, d) => showTip(e, `<div class="t">${d.name} · ${d.label}</div>` +
        tr("Long-term share", pct(d.share)) + tr("Ontario", pct(d.ont)) + tr("Difference", pp(d.dev), divClass(d.dev)) +
        tr("OW cases", int(d.cases)) + tr("Long-term cases", int(d.moa19)) + (d.cases < 3000 ? `<div class="m">Small caseload: quarter-to-quarter swings are larger.</div>` : "")))
      .on("pointerleave", hideTip)
      .on("click", (e, d) => { S.cma = d.code; renderRegions(); });

    // pandemic edges as rules (the band itself would sit hidden behind the cells)
    const c0 = x(+DATES.find(d => d >= COVID[0])), c1 = x(+DATES.filter(d => d <= COVID[1]).pop()) + x.bandwidth();
    [c0, c1].forEach(cx => g.append("line").attr("x1", cx).attr("x2", cx).attr("y1", -54).attr("y2", ih).style("stroke", "var(--ink2)").style("stroke-width", 1).style("stroke-opacity", .55));
    g.append("text").attr("class", "lbl").attr("x", (c0 + c1) / 2).attr("y", -58).attr("text-anchor", "middle").style("font-size", "11px").text("Pandemic");

    // selected period (enclosure) and selected CMA (outline)
    const p0 = x(+S.period.range[0]), p1 = x(+S.period.range[1]) + x.bandwidth();
    g.append("rect").attr("x", p0 - 2).attr("y", -3).attr("width", p1 - p0 + 4).attr("height", ih + 6).attr("rx", 3)
      .style("fill", "none").style("stroke", "var(--ink)").style("stroke-width", 1.5);
    if (y(S.cma) != null) g.append("rect").attr("x", -2).attr("y", y(S.cma) - 2).attr("width", iw + 4).attr("height", y.bandwidth() + 4).attr("rx", 3)
      .style("fill", "none").style("stroke", "var(--sel)").style("stroke-width", 2).style("pointer-events", "none");

    // x axis: years at Q1 columns
    const every = narrow() ? 4 : 2;
    const ticks = DATES.filter(d => d.getMonth() === 2 && (d.getFullYear() - 2003) % every === 0);
    g.append("g").attr("class", "axis").attr("transform", `translate(0,${ih + 2})`)
      .call(d3.axisBottom(x).tickValues(ticks.map(d => +d)).tickFormat(d => new Date(d).getFullYear()).tickSizeOuter(0))
      .call(a => a.select(".domain").remove());
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
    const r = g.selectAll("g.r").data(st, d => d.code).join("g").attr("class", "r").attr("transform", d => `translate(0,${y(d.code)})`)
      .style("cursor", "pointer").on("click", (e, d) => { S.cma = d.code; renderRegions(); })
      .on("pointermove", (e, d) => showTip(e, `<div class="t">${d.name} · ${periodText(S.period)}</div>` +
        tr("Long-term share", pct(d.share)) + tr("Lowest–highest quarter", `${pct(d.min)} – ${pct(d.max)}`) +
        tr("vs Ontario", pp(d.share - ont)) + tr("Average OW cases", int(d.avgCases)) + tr("Quarters", d.n)))
      .on("pointerleave", hideTip);
    r.append("rect").attr("x", -m.l).attr("width", w).attr("y", -y.step() * 0.1).attr("height", y.step())
      .style("fill", d => d.code === S.cma ? "var(--btn)" : "transparent");
    r.append("text").attr("class", d => d.code === S.cma ? "lbl-strong" : "lbl").attr("x", -10).attr("y", y.bandwidth() / 2).attr("dy", "0.32em").attr("text-anchor", "end").text(d => d.name).each(function () { trim(this, m.l - 14); });
    r.append("line").attr("x1", d => x(d.min)).attr("x2", d => x(d.max)).attr("y1", y.bandwidth() / 2).attr("y2", y.bandwidth() / 2)
      .style("stroke", d => d.code === S.cma ? "var(--sel)" : "var(--other)").style("stroke-width", 2).style("stroke-linecap", "round");
    r.append("circle").attr("cx", d => x(d.share)).attr("cy", y.bandwidth() / 2).attr("r", d => d.code === S.cma ? 6.5 : 5)
      .style("fill", d => d.code === S.cma ? "var(--sel)" : "var(--ink2)").style("stroke", "var(--surface)").style("stroke-width", 2);
    r.append("text").attr("class", d => d.code === S.cma ? "lbl-strong" : "lbl").attr("x", iw + 8).attr("y", y.bandwidth() / 2).attr("dy", "0.32em")
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
    g.append("rect").attr("x", x(S.period.range[0])).attr("width", Math.max(2, x(S.period.range[1]) - x(S.period.range[0])))
      .attr("height", ih).style("fill", "var(--sel)").style("fill-opacity", .12).style("stroke", "var(--sel)").style("stroke-opacity", .8);
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
        .attr("d", ([, r]) => line(r)).style("fill", "none").style("stroke", "var(--other)").style("stroke-width", 1);
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
        : "Grey lines: the other 14 CMAs. Dark line: Ontario. ") +
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
    const pre = periodStats(PERIODS.find(p => p.id === "pre").range).sort((a, b) => b.share - a.share);
    const post = periodStats(PERIODS.find(p => p.id === "post").range).sort((a, b) => b.share - a.share);
    const rank = (arr, c) => arr.findIndex(d => d.code === c) + 1;
    const mover = d3.greatest(pre, d => Math.abs(rank(pre, d.code) - rank(post, d.code)));
    const below = Array.from(BY_CMA, ([c, r]) => ({ name: NAMES.get(c), k: r.filter(d => d.dev < 0).length / r.length }))
      .filter(d => d.k >= 0.9).sort((a, b) => b.k - a.k);
    const aboveAll = ["pre", "during", "post"].map(id => {
      const p = PERIODS.find(q => q.id === id); const o = ontPeriod(p.range);
      return new Set(periodStats(p.range).filter(d => d.share > o).map(d => d.code));
    }).reduce((a, b) => new Set([...a].filter(c => b.has(c))));
    const per = periodPhrase(S.period);
    const cards = [
      { h: "The data support", li: [
        `Ontario's long-term share peaked at ${pct(peak.share)} in ${peak.label} with about as many long-term cases as in ${ref.label} (${int(ref.moa19)} vs ${int(peak.moa19)}) but fewer cases overall.`,
        `${per[0].toUpperCase() + per.slice(1)}, the highest shares were in ${names(st.slice(0, 3))}; the lowest in ${names(st.slice(-2))} (Ontario: ${pct(ont)}).`,
        `${names(below)} had a lower long-term share than Ontario in at least 90% of quarters.`,
        `Rankings shift: ${mover.name} ranked ${rank(pre, mover.code)} of 15 before the pandemic and ${rank(post, mover.code)} of 15 after it.`] },
      { h: "The data do not show", li: [
        "Why the total caseload fell in 2020–2021, or why it grew afterwards.",
        "How long a new case will last, or how likely any person is to stay on assistance.",
        "That a CMA's local services or policies caused its higher or lower share.",
        "Regional differences in need: a share of the caseload is not a rate per population."] },
      { h: "Worth investigating", li: [
        aboveAll.size ? `Above Ontario before, during and after the pandemic: ${[...aboveAll].map(c => NAMES.get(c)).join(", ")}.` : "No CMA stayed above Ontario before, during and after the pandemic.",
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
