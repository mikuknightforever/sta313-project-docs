/* Q1 candidate C — the long view: 1969–2026 overview (brushable) + OW/ODSP detail. */
(() => {
  "use strict";
  const { fmt } = Q1;
  const QSTART = new Date(2003, 0, 1), END = new Date(2026, 2, 31), BREAK = new Date(1998, 3, 1);
  const RANGES = [
    { id: "all", label: "2003–2026 (all OW/ODSP data)", from: QSTART, to: END },
    { id: "2015", label: "2015–2026", from: new Date(2015, 0, 1), to: END },
    { id: "zoom", label: "Pandemic zoom 2018–2024", from: new Date(2017, 9, 1), to: new Date(2024, 11, 31) },
  ];
  const S = { step: 1, mode: "count", from: QSTART, to: END, hover: null };
  let DATA, F; const syncs = [];

  Q1.load("../../../../").then(d => {
    DATA = d; F = d.F; window.__facts = F;
    const U = new URLSearchParams(location.search);
    if (["count", "index"].includes(U.get("mode"))) S.mode = U.get("mode");
    if (U.has("step")) setStep(+U.get("step"));
    const r = RANGES.find(x => x.id === U.get("range")); if (r) { S.from = r.from; S.to = r.to; }
    Q1.themeButton(render);
    build(); render(); Q1.onResize(render);
    document.body.dataset.ready = "1";
  }).catch(Q1.fail);

  const steps = [{ id: 1, label: "1 · The long record", r: "all" }, { id: 2, label: "2 · The pandemic dip", r: "zoom" }, { id: 3, label: "3 · Since 2015", r: "2015" }, { id: 0, label: "Explore all" }];
  function setStep(id) { S.step = id; const s = steps.find(x => x.id === id); if (s && s.r) { const r = RANGES.find(x => x.id === s.r); S.from = r.from; S.to = r.to; } }
  function build() {
    steps[0].label = `1 · ${F.hLast.date.getFullYear() - F.hFirst.date.getFullYear()} years`; // computed span of the long series
    syncs.push(Q1.seg("#stepSeg", steps, s => s.label, s => S.step === s.id, s => { setStep(s.id); render(); }));
    syncs.push(Q1.seg("#modeSeg", [{ id: "count", label: "Number of cases" }, { id: "index", label: "Index, 2019 Q4 = 100" }], m => m.label, m => S.mode === m.id, m => { S.mode = m.id; render(); }));
    syncs.push(Q1.seg("#rangeSeg", RANGES, r => r.label, r => +S.from === +r.from && +S.to === +r.to, r => { S.from = r.from; S.to = r.to; S.step = 0; render(); }));
  }
  function render() { syncs.forEach(f => f()); lead(); story(); overview(); detail(); cards(); }
  const mon = d3.timeFormat("%b %Y");
  const dipPct = () => (F.hLow.cases / F.hPre.cases - 1) * 100;

  function lead() {
    document.getElementById("lead").innerHTML =
      `Across all social assistance programs, Ontario had <b>${fmt.int(F.hLast.cases)}</b> cases in ${mon(F.hLast.date)}, the most of any month since ${F.hFirst.date.getFullYear()} ` +
      `(the previous peak was ${fmt.int(F.h1994.cases)} in ${mon(F.h1994.date)}). The pandemic dip, from ${fmt.int(F.hPre.cases)} (${mon(F.hPre.date)}) to ${fmt.int(F.hLow.cases)} (${mon(F.hLow.date)}), ` +
      `was ${fmt.sp(dipPct())}. Within it, OW and ODSP moved very differently.`;
  }
  function story() {
    const el = document.getElementById("stepText"), P = F.phase;
    if (S.step === 1) el.innerHTML = `<b>The long series passed its ${F.h1994.date.getFullYear()} peak in ${mon(F.hAbove94.date)} and reached ${fmt.int(F.hMax.cases)} in ${mon(F.hMax.date)}.</b> ` +
      `This counts cases, not people, is not adjusted for population, and the programs it covers changed in 1998, so "the most cases" is not "the highest rate".`;
    else if (S.step === 2) el.innerHTML = `<b>All social assistance cases fell ${fmt.f1(Math.abs(dipPct()))}% between ${mon(F.hPre.date)} and ${mon(F.hLow.date)}.</b> ` +
      `Inside that total, OW fell to ${fmt.int(F.owMin.ow)} (${F.owMin.label}, index ${fmt.f1(F.owMin.iow)}) while ODSP stayed between index ${fmt.f1(F.odsp19.lo.iod)} and ${fmt.f1(F.odsp19.hi.iod)}. These data do not show why.`;
    else if (S.step === 3) {
      const r = DATA.Q.filter(d => d.year >= 2015), larger = r.every(d => d.odsp > d.ow);
      el.innerHTML = `<b>${larger ? "Since 2015 ODSP has had more cases than OW in every quarter" : "Since 2015 the larger program has changed"}; ` +
        `after the pandemic OW grew ${fmt.pct(P.post.ow)} (${P.post.a.label} – ${P.post.z.label}) and ODSP ${fmt.sp(P.post.odsp)}.</b> ` +
        `In ${F.last.label} the gap was ${fmt.int(F.last.odsp - F.last.ow)} cases.`;
    }
    else el.innerHTML = "Explore freely: drag across Figure 1 to choose any years from 2003 on; switch Figure 2 to the index to compare relative change.";
  }

  function overview() {
    const H = DATA.H, n = Q1.narrow(), w = Q1.W("f1"), m = { t: 16, r: n ? 12 : 24, b: 22, l: 56 }, iw = w - m.l - m.r, h = n ? 190 : 220, ih = h - m.t - m.b;
    const x = d3.scaleTime().domain([H[0].date, END]).range([0, iw]);
    const y = d3.scaleLinear().domain([0, F.hMax.cases * 1.12]).nice().range([ih, 0]);
    const svg = Q1.svgIn("f1", w, h, "Area chart of all Ontario social assistance cases by month, 1969 to 2026, with a brush to choose years");
    const g = svg.append("g").attr("transform", `translate(${m.l},${m.t})`);
    g.append("rect").attr("x", 0).attr("width", x(QSTART)).attr("height", ih).style("fill", "var(--btn)").style("opacity", .6);
    g.append("text").attr("class", "lbl").attr("x", x(QSTART) - 6).attr("y", ih - 8).attr("text-anchor", "end").style("font-size", "11px").text(n ? "before OW/ODSP data" : "Before 2003: no quarterly OW / ODSP data");
    Q1.covidBand(g, x, ih, false);
    g.append("g").attr("class", "grid").call(d3.axisLeft(y).ticks(4).tickSize(-iw).tickFormat(""));
    g.append("path").datum(H).attr("d", d3.area().x(d => x(d.date)).y0(ih).y1(d => y(d.cases))).style("fill", "var(--ur-fill)");
    g.append("path").datum(H).attr("d", d3.line().x(d => x(d.date)).y(d => y(d.cases))).style("fill", "none").style("stroke", "var(--ur)").style("stroke-width", 1.4);
    // definition break, April 1998
    g.append("line").attr("x1", x(BREAK)).attr("x2", x(BREAK)).attr("y1", 0).attr("y2", ih).style("stroke", "var(--ink)").style("stroke-width", 1);
    g.append("text").attr("class", "ann").attr("x", x(BREAK) - 5).attr("y", ih * 0.62).attr("text-anchor", "end").style("font-size", "11px").style("font-weight", "500")
      .text(n ? "1998: programs change" : "Apr 1998: OW and ODSP replace earlier programs →");
    g.append("g").attr("class", "axis").call(d3.axisLeft(y).ticks(4).tickFormat(fmt.k).tickSizeOuter(0));
    Q1.timeAxis(g, x, ih);
    [F.h1994, F.hMax].forEach(d => {
      g.append("circle").attr("cx", x(d.date)).attr("cy", y(d.cases)).attr("r", 3.5).style("fill", "var(--ur)").style("stroke", "var(--surface)").style("stroke-width", 2);
      g.append("text").attr("class", "ann").attr("x", x(d.date) - 6).attr("y", y(d.cases) - 8).attr("text-anchor", "end")
        .text(n ? `${fmt.k(Math.round(d.cases / 1000) * 1000)} · ${d.date.getFullYear()}` : `${fmt.int(d.cases)} · ${mon(d.date)}`);
    });
    // brush → detail window (L5 navigation); snapped to months, clamped to the OW/ODSP coverage
    const brush = d3.brushX().extent([[x(QSTART), 0], [iw, ih]]).on("end", e => {
      if (!e.sourceEvent || !e.selection) return;
      let [a, b] = e.selection.map(x.invert).map(d3.timeMonth.round);
      if (b - a < 365 * 864e5) b = d3.timeMonth.offset(a, 12);
      S.from = a < QSTART ? QSTART : a; S.to = b > END ? END : b; S.step = 0; render();
    });
    const bg = g.append("g").attr("class", "brush").call(brush);
    bg.call(brush.move, [x(S.from), x(S.to)]);
    // let drags pass through the selection so dragging anywhere draws a new range (the default range fills the
    // whole brushable area, so "move the selection" would do nothing); the edge handles still resize it
    bg.selectAll(".selection").style("fill", "var(--sel)").style("fill-opacity", .12).style("stroke", "var(--sel)").style("pointer-events", "none");
    S.ovRule = g.append("line").attr("y1", 0).attr("y2", ih).style("stroke", "var(--ink2)").style("display", "none").style("pointer-events", "none");
    S.ovX = x;
    document.getElementById("f1note").textContent =
      `Since April 1998 this series counts OW, ODSP, Temporary Care Assistance and Assistance for Children with Severe Disabilities, so it runs ${fmt.int(F.gapLo)}–${fmt.int(F.gapHi)} cases above OW + ODSP ` +
      `(${fmt.int(F.h1912)} vs ${fmt.int(F.gap19.d.ow + F.gap19.d.odsp)} in Dec 2019 / 2019 Q4). Before 1998 it counted different programs (General Welfare Assistance, Family Benefits and others). ` +
      `Grey band: pandemic period. Shaded box: years shown in Figure 2.`;
  }

  function detail() {
    const Q = DATA.Q, UR = DATA.UR, n = Q1.narrow(), idx = S.mode === "index";
    const w = Q1.W("f2a"), m = { t: 12, r: n ? 14 : 110, b: 22, l: 56 }, iw = w - m.l - m.r, h1 = n ? 230 : 280, ih1 = h1 - m.t - m.b;
    const x = d3.scaleTime().domain([S.from, S.to]).range([0, iw]);
    const rows = Q.filter(d => d.date >= S.from && d.date <= S.to);
    const kO = idx ? "iow" : "ow", kD = idx ? "iod" : "odsp";
    document.getElementById("f2Title").textContent = (idx ? "OW and ODSP cases as an index, 2019 Q4 = 100" : "OW and ODSP cases, Ontario, quarterly") + ` · ${S.from.getFullYear()}–${S.to.getFullYear()}`;
    const svg = Q1.svgIn("f2a", w, h1, "Line chart of OW and ODSP cases for the chosen years");
    const g = svg.append("g").attr("transform", `translate(${m.l},${m.t})`);
    if (rows.length < 2) { g.append("text").attr("class", "lbl").attr("x", iw / 2).attr("y", ih1 / 2).attr("text-anchor", "middle").text("Choose at least two quarters from 2003 on."); return; }
    const lo = d3.min(rows, d => Math.min(d[kO], d[kD])), hi = d3.max(rows, d => Math.max(d[kO], d[kD]));
    const y = d3.scaleLinear().domain(idx ? [Math.floor(lo / 10) * 10 - 5, Math.ceil(hi / 10) * 10 + 5] : [0, hi * 1.08]).nice().range([ih1, 0]);
    Q1.covidBand(g, x, ih1, true);
    g.append("g").attr("class", "grid").call(d3.axisLeft(y).ticks(5).tickSize(-iw).tickFormat(""));
    if (idx) { g.append("line").attr("x1", 0).attr("x2", iw).attr("y1", y(100)).attr("y2", y(100)).style("stroke", "var(--ink2)");
      g.append("text").attr("class", "lbl").attr("x", 4).attr("y", y(100) - 5).style("font-size", "11px").text("2019 Q4 = 100"); }
    const line = k => d3.line().x(d => x(d.date)).y(d => y(d[k]));
    g.append("path").datum(rows).attr("class", "ln-odsp").attr("d", line(kD));
    g.append("path").datum(rows).attr("class", "ln-ow").attr("d", line(kO));
    g.append("g").attr("class", "axis").call(d3.axisLeft(y).ticks(5).tickFormat(idx ? d3.format("d") : fmt.k).tickSizeOuter(0));
    Q1.timeAxis(g, x, ih1);
    const L = rows[rows.length - 1], val = (d, k) => (idx ? fmt.f1(d[k]) : fmt.int(d[k]));
    if (!n) Q1.endLabels(g, [{ y: y(L[kO]), t: `OW ${val(L, kO)}`, fill: "var(--ow)" }, { y: y(L[kD]), t: `ODSP ${val(L, kD)}`, fill: "var(--odsp)" }], iw + 8, 15);
    [[F.owMin, "ow", 18, "OW low"], [F.owMax, "ow", -12, "OW high"]].forEach(([d, p, dy, t]) => {
      if (d.date < S.from || d.date > S.to) return;
      const px = x(d.date), py = y(d[kO]), right = px > iw * 0.62;
      g.append("circle").attr("cx", px).attr("cy", py).attr("r", 4).style("fill", `var(--${p})`).style("stroke", "var(--surface)").style("stroke-width", 2);
      g.append("text").attr("class", "ann").attr("x", px + (right ? -7 : 7)).attr("y", py + dy).attr("text-anchor", right ? "end" : "start").text(`${t} ${val(d, kO)} · ${d.label}`);
    });
    // Figure 2b unemployment, aligned to 2a
    const h2 = n ? 100 : 110, ih2 = h2 - m.t - m.b, urRows = UR.filter(d => d.date >= S.from && d.date <= S.to);
    const y2 = d3.scaleLinear().domain([0, Math.ceil(F.urMax.ur / 5) * 5]).range([ih2, 0]);
    const g2 = Q1.svgIn("f2b", w, h2, "Ontario unemployment rate by month for the chosen years").append("g").attr("transform", `translate(${m.l},${m.t})`);
    Q1.covidBand(g2, x, ih2, false);
    if (S.from < F.urFirst.date) g2.append("text").attr("class", "lbl").attr("x", Math.max(0, x(F.urFirst.date) - 6)).attr("y", ih2 / 2).attr("text-anchor", "end").style("font-size", "11px")
      .text(S.to < F.urFirst.date ? "No unemployment data for these years" : n ? "no data before 2017" : "No unemployment data before Jan 2017");
    g2.append("g").attr("class", "grid").call(d3.axisLeft(y2).ticks(3).tickSize(-iw).tickFormat(""));
    g2.append("path").datum(urRows).attr("d", d3.area().x(d => x(d.date)).y0(ih2).y1(d => y2(d.ur))).style("fill", "var(--ur-fill)");
    g2.append("path").datum(urRows).attr("d", d3.line().x(d => x(d.date)).y(d => y2(d.ur))).style("fill", "none").style("stroke", "var(--ur)").style("stroke-width", 1.5);
    g2.append("g").attr("class", "axis").call(d3.axisLeft(y2).tickValues(y2.ticks(3).filter(v => v > 0)).tickFormat(d => d + "%").tickSizeOuter(0));
    Q1.timeAxis(g2, x, ih2);
    // crosshair across 2a, 2b and a marker in Figure 1 (overview ↔ detail link)
    const rl = [g.append("line").attr("y1", 0).attr("y2", ih1), g2.append("line").attr("y1", 0).attr("y2", ih2)].map(l => l.style("stroke", "var(--ink2)").style("display", "none"));
    const bis = d3.bisector(d => d.date).center;
    const move = function (e) {
      const d = rows[bis(rows, x.invert(d3.pointer(e, this)[0]))], px = x(d.date), u = Q1.urAt(UR, d.date);
      const hv = DATA.H.find(hh => +hh.date === +d.date);
      rl.forEach(l => l.attr("x1", px).attr("x2", px).style("display", null));
      S.ovRule.attr("x1", S.ovX(d.date)).attr("x2", S.ovX(d.date)).style("display", null);
      Q1.showTip(e, `<div class="t">${d.label} · ${Q1.phaseOf(d).long}</div>` +
        Q1.tr("OW cases", `${fmt.int(d.ow)} (index ${fmt.f1(d.iow)})`, "var(--ow)") + Q1.tr("ODSP cases", `${fmt.int(d.odsp)} (index ${fmt.f1(d.iod)})`, "var(--odsp)") +
        Q1.tr("All social assistance, same month", hv ? fmt.int(hv.cases) : "n/a") + Q1.tr("Unemployment, quarter-end month", u ? fmt.pct(u.ur) : "no data") +
        `<div class="m">The all-programs total covers more programs than OW + ODSP. Counts shown as published.</div>`);
    };
    const leave = () => { rl.forEach(l => l.style("display", "none")); S.ovRule.style("display", "none"); Q1.hideTip(); };
    g.append("rect").attr("width", iw).attr("height", ih1).style("fill", "transparent").on("pointermove", move).on("pointerleave", leave);
    g2.append("rect").attr("width", iw).attr("height", ih2).style("fill", "transparent").on("pointermove", move).on("pointerleave", leave);
    document.getElementById("f2note").textContent = `Showing ${rows[0].label} – ${L.label} (${rows.length} quarters). Grey band: pandemic period. Index: each program relative to its own 2019 Q4 level.`;
  }

  function cards() {
    const P = F.phase;
    const c = [
      { h: "The data support", li: [
        `All social assistance cases reached ${fmt.int(F.hMax.cases)} in ${mon(F.hMax.date)}, above the ${mon(F.h1994.date)} peak of ${fmt.int(F.h1994.cases)}, in a series whose program coverage changed in 1998.`,
        `The pandemic dip in the total (${fmt.sp(dipPct())}, ${mon(F.hPre.date)} – ${mon(F.hLow.date)}) coincided with OW falling to index ${fmt.f1(F.owMin.iow)} while ODSP stayed between ${fmt.f1(F.odsp19.lo.iod)} and ${fmt.f1(F.odsp19.hi.iod)}.`,
        `After the pandemic OW grew ${fmt.sp(P.post.ow)} and ODSP ${fmt.sp(P.post.odsp)} (${P.post.a.label} – ${P.post.z.label}).`] },
      { h: "The data do not show", li: [
        "Whether a record number of cases is a record share of Ontarians: the counts are not adjusted for population.",
        "How many people were helped: a case can include several people.",
        "Why caseloads changed: the pandemic, CERB, policy or the economy are not measured here.",
        "A like-for-like comparison with the 1990s: the programs counted changed in 1998."] },
      { h: "Worth investigating", li: [
        "Caseloads per population (needs population data the course files do not include).",
        `What the other programs in the total (${fmt.int(F.gapLo)}–${fmt.int(F.gapHi)} cases) contributed over time.`,
        `Why OW and ODSP diverged during ${P.during.a.label} – ${P.during.z.label}.`] },
    ];
    d3.select("#cards").selectAll("div.card").data(c).join("div").attr("class", "card").html(d => `<h3>${d.h}</h3><ul>${d.li.map(l => `<li>${l}</li>`).join("")}</ul>`);
  }
})();
