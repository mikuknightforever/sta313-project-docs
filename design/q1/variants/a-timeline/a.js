/* Q1 candidate A — annotated timeline (baseline: follows every settled decision). */
(() => {
  "use strict";
  const { fmt } = Q1;
  const RANGES = [
    { id: "all", label: "2003–2026", from: new Date(2003, 0, 1), to: new Date(2026, 2, 31) },
    { id: "2015", label: "2015–2026", from: new Date(2015, 0, 1), to: new Date(2026, 2, 31) },
    { id: "zoom", label: "Pandemic zoom 2018–2024", from: new Date(2018, 0, 1), to: new Date(2024, 11, 31) },
  ];
  const S = { step: 1, mode: "count", range: "all", focus: null };
  let DATA, F, syncs = [];

  Q1.load("../../../../").then(d => {
    DATA = d; F = d.F; window.__facts = F;
    const U = new URLSearchParams(location.search);
    if (U.has("step")) S.step = +U.get("step");
    if (["count", "index"].includes(U.get("mode"))) S.mode = U.get("mode");
    if (RANGES.some(r => r.id === U.get("range"))) S.range = U.get("range");
    if (["ow", "odsp"].includes(U.get("focus"))) S.focus = U.get("focus");
    Q1.themeButton(render);
    build(); render(); Q1.onResize(render);
    document.body.dataset.ready = "1";
  }).catch(Q1.fail);

  const steps = () => [
    { id: 1, label: "1 · Before", ph: "pre" }, { id: 2, label: "2 · During", ph: "during" },
    { id: 3, label: "3 · After", ph: "post" }, { id: 0, label: "Explore all" }];
  function build() {
    syncs.push(Q1.seg("#stepSeg", steps(), s => s.label, s => S.step === s.id, s => { S.step = s.id; render(); }));
    syncs.push(Q1.seg("#modeSeg", [{ id: "count", label: "Number of cases" }, { id: "index", label: "Index, 2019 Q4 = 100" }],
      m => m.label, m => S.mode === m.id, m => { S.mode = m.id; render(); }));
    syncs.push(Q1.seg("#rangeSeg", RANGES, r => r.label, r => S.range === r.id, r => { S.range = r.id; render(); }));
    const lg = d3.select("#legend").selectAll("button").data([{ k: "ow", t: "OW" }, { k: "odsp", t: "ODSP" }]).join("button")
      .attr("type", "button").html(d => `<i style="background:var(--${d.k})"></i>${d.t}`)
      .on("click", (e, d) => { S.focus = S.focus === d.k ? null : d.k; render(); });
    syncs.push(() => lg.attr("aria-pressed", d => String(!S.focus || S.focus === d.k)));
  }
  const sync = () => syncs.forEach(f => f());
  function render() { sync(); lead(); story(); chart(); table(); cards(); }

  function lead() {
    const L = F.last;
    document.getElementById("lead").innerHTML =
      `In ${L.label}, Ontario had <b>${fmt.int(L.ow)}</b> OW cases and <b>${fmt.int(L.odsp)}</b> ODSP cases. ` +
      `Against 2019 Q4, OW was at <b>${fmt.f1(L.iow)}</b> and ODSP at <b>${fmt.f1(L.iod)}</b> (2019 Q4 = 100). ` +
      `During the pandemic OW fell to ${fmt.f1(F.owMin.iow)} (${F.owMin.label}); ODSP stayed between ${fmt.f1(F.odsp19.lo.iod)} and ${fmt.f1(F.odsp19.hi.iod)} after 2019.`;
  }
  function story() {
    const el = document.getElementById("stepText"), P = F.phase;
    if (S.step === 1) { const p = P.pre;
      el.innerHTML = `<b>${p.a.label} → ${p.z.label}: ODSP grew by ${fmt.pct(p.odsp)}, OW by ${fmt.pct(p.ow)}.</b> ` +
        `ODSP went from ${fmt.int(p.a.odsp)} to ${fmt.int(p.z.odsp)} cases and OW from ${fmt.int(p.a.ow)} to ${fmt.int(p.z.ow)}. ` +
        `By ${F.base.label} ODSP was ${fmt.f1(F.ratio19)} times the size of OW.`;
    } else if (S.step === 2) { const p = P.during;
      el.innerHTML = `<b>${p.a.label} → ${p.z.label}: OW fell to its lowest level, ${fmt.int(F.owMin.ow)} cases in ${F.owMin.label} ` +
        `(index ${fmt.f1(F.owMin.iow)}); ODSP stayed between ${fmt.int(F.odsp19.lo.odsp)} and ${fmt.int(F.odsp19.hi.odsp)}.</b> ` +
        `Unemployment peaked at ${fmt.pct(F.urMax.ur)} in ${d3.timeFormat("%B %Y")(F.urMax.date)}. These data do not show why the caseloads moved.`;
    } else if (S.step === 3) { const p = P.post;
      el.innerHTML = `<b>${p.a.label} → ${p.z.label}: OW rose by ${fmt.pct(p.ow)} to ${fmt.int(p.z.ow)} cases (index ${fmt.f1(p.z.iow)}); ` +
        `ODSP changed by ${fmt.sp(p.odsp)} (index ${fmt.f1(p.z.iod)}).</b> ` +
        `OW was back at or above its ${F.base.label} level from ${F.owBack.label}; its highest quarter was ${F.owMax.label} (${fmt.int(F.owMax.ow)}).`;
    } else el.innerHTML = "Explore freely: switch to the index, zoom to 2018–2024, or hover for exact values in any quarter.";
  }
  const stepPhase = () => { const s = steps().find(x => x.id === S.step); return s && s.ph ? F.phase[s.ph] : null; };

  function chart() {
    const Q = DATA.Q, UR = DATA.UR, R = RANGES.find(r => r.id === S.range), n = Q1.narrow();
    const w = Q1.W("f1a"), m = { t: 12, r: n ? 14 : 110, b: 22, l: 56 }, iw = w - m.l - m.r;
    const h1 = n ? 240 : 300, ih1 = h1 - m.t - m.b;
    const x = d3.scaleTime().domain([R.from, R.to]).range([0, iw]);
    const rows = Q.filter(d => d.date >= R.from && d.date <= R.to);
    const idx = S.mode === "index", kO = idx ? "iow" : "ow", kD = idx ? "iod" : "odsp";
    const lo = d3.min(rows, d => Math.min(d[kO], d[kD])), hi = d3.max(rows, d => Math.max(d[kO], d[kD]));
    const y = d3.scaleLinear().domain(idx ? [Math.floor(lo / 10) * 10 - 5, Math.ceil(hi / 10) * 10 + 5] : [0, hi * 1.08]).nice().range([ih1, 0]);
    document.getElementById("f1aTitle").textContent = idx
      ? "OW and ODSP cases as an index, 2019 Q4 = 100 (each program relative to its own 2019 Q4 level)"
      : "OW and ODSP cases, Ontario (number of cases, quarterly)";
    const svg = Q1.svgIn("f1a", w, h1, "Line chart of Ontario OW and ODSP cases by quarter");
    const g = svg.append("g").attr("transform", `translate(${m.l},${m.t})`);
    Q1.covidBand(g, x, ih1, true);
    const ph = stepPhase();
    if (ph) Q1.encl(g, x, Math.max(+ph.a.date, +R.from), Math.min(+ph.z.date, +R.to), ih1);
    g.append("g").attr("class", "grid").call(d3.axisLeft(y).ticks(5).tickSize(-iw).tickFormat(""));
    if (idx) { g.append("line").attr("x1", 0).attr("x2", iw).attr("y1", y(100)).attr("y2", y(100)).style("stroke", "var(--ink2)").style("stroke-width", 1);
      g.append("text").attr("class", "lbl").attr("x", 4).attr("y", y(100) - 5).style("font-size", "11px").text("2019 Q4 = 100"); }
    const line = k => d3.line().x(d => x(d.date)).y(d => y(d[k]));
    g.append("path").datum(rows).attr("class", "ln-odsp" + (S.focus === "ow" ? " dim" : "")).attr("d", line(kD));
    g.append("path").datum(rows).attr("class", "ln-ow" + (S.focus === "odsp" ? " dim" : "")).attr("d", line(kO));
    g.append("g").attr("class", "axis").call(d3.axisLeft(y).ticks(5).tickFormat(idx ? d3.format("d") : fmt.k).tickSizeOuter(0));
    Q1.timeAxis(g, x, ih1);
    const L = rows[rows.length - 1], val = (d, k) => (idx ? fmt.f1(d[k]) : fmt.int(d[k]));
    if (!n) Q1.endLabels(g, [{ y: y(L[kO]), t: `OW ${val(L, kO)}`, fill: "var(--ow)" }, { y: y(L[kD]), t: `ODSP ${val(L, kD)}`, fill: "var(--odsp)" }], iw + 8, 15);
    // selective annotations (L6 annotated chart): only the points the current step is about
    const pts = [];
    const add = (d, prog, t, dy) => { if (d.date >= R.from && d.date <= R.to) pts.push({ d, prog, k: prog === "ow" ? kO : kD, t, dy }); };
    const pre = F.phase.pre.z;
    if (S.step === 1) { add(pre, "odsp", `ODSP ${val(pre, kD)}`, -12); add(pre, "ow", `OW ${val(pre, kO)}`, 18); }
    else if (S.step === 2) { add(F.owMin, "ow", `OW low ${val(F.owMin, kO)} · ${F.owMin.label}`, 18); add(F.odspMax, "odsp", `ODSP high ${val(F.odspMax, kD)} · ${F.odspMax.label}`, -12); }
    else if (S.step === 3) { add(F.owMax, "ow", `OW high ${val(F.owMax, kO)} · ${F.owMax.label}`, -12); }
    else { add(F.owMin, "ow", `OW low · ${F.owMin.label}`, 18); add(F.owMax, "ow", `OW high · ${F.owMax.label}`, -12); }
    pts.forEach(p => {
      const px = x(p.d.date), py = y(p.d[p.k]), right = px > iw * 0.62;
      g.append("circle").attr("cx", px).attr("cy", py).attr("r", 4).style("fill", `var(--${p.prog})`).style("stroke", "var(--surface)").style("stroke-width", 2);
      g.append("text").attr("class", "ann").attr("x", px + (right ? -7 : 7)).attr("y", py + p.dy).attr("text-anchor", right ? "end" : "start").text(p.t);
    });

    // Figure 1b: unemployment strip on the same x scale (no dual axis)
    const h2 = n ? 110 : 120, ih2 = h2 - m.t - m.b;
    const urRows = UR.filter(d => d.date >= R.from && d.date <= R.to);
    const y2 = d3.scaleLinear().domain([0, Math.ceil(F.urMax.ur / 5) * 5]).range([ih2, 0]);
    const svg2 = Q1.svgIn("f1b", w, h2, "Line chart of the Ontario unemployment rate by month");
    const g2 = svg2.append("g").attr("transform", `translate(${m.l},${m.t})`);
    Q1.covidBand(g2, x, ih2, false);
    if (ph) Q1.encl(g2, x, Math.max(+ph.a.date, +R.from), Math.min(+ph.z.date, +R.to), ih2);
    if (R.from < F.urFirst.date) {
      g2.append("text").attr("class", "lbl").attr("x", Math.max(0, x(F.urFirst.date) - 6)).attr("y", ih2 / 2).attr("text-anchor", "end").style("font-size", "11px")
        .text(n ? "no data before 2017" : "No unemployment data before Jan 2017");
    }
    g2.append("g").attr("class", "grid").call(d3.axisLeft(y2).ticks(3).tickSize(-iw).tickFormat(""));
    g2.append("path").datum(urRows).attr("d", d3.area().x(d => x(d.date)).y0(ih2).y1(d => y2(d.ur))).style("fill", "var(--ur-fill)");
    g2.append("path").datum(urRows).attr("d", d3.line().x(d => x(d.date)).y(d => y2(d.ur))).style("fill", "none").style("stroke", "var(--ur)").style("stroke-width", 1.5);
    g2.append("g").attr("class", "axis").call(d3.axisLeft(y2).tickValues(y2.ticks(3).filter(v => v > 0)).tickFormat(d => d + "%").tickSizeOuter(0));
    Q1.timeAxis(g2, x, ih2);
    if (F.urMax.date >= R.from && F.urMax.date <= R.to) {
      const px = x(F.urMax.date), right = px > iw * 0.62;
      g2.append("text").attr("class", "ann").attr("x", px + (right ? -6 : 6)).attr("y", y2(F.urMax.ur) + 4).attr("text-anchor", right ? "end" : "start")
        .text(`${fmt.pct(F.urMax.ur)} · ${d3.timeFormat("%b %Y")(F.urMax.date)}`);
    }
    // linked crosshair across 1a and 1b (L5 linked views, details on demand)
    const rule = [g, g2].map((gg, i) => gg.append("line").attr("y1", 0).attr("y2", i ? ih2 : ih1).style("stroke", "var(--ink2)").style("display", "none"));
    const dots = ["ow", "odsp"].map(k => g.append("circle").attr("r", 4).style("fill", `var(--${k})`).style("stroke", "var(--surface)").style("stroke-width", 2).style("display", "none"));
    const bis = d3.bisector(d => d.date).center;
    const move = function (e) {
      const d = rows[bis(rows, x.invert(d3.pointer(e, this)[0]))]; const px = x(d.date);
      rule.forEach(r => r.attr("x1", px).attr("x2", px).style("display", null));
      dots[0].attr("cx", px).attr("cy", y(d[kO])).style("display", null); dots[1].attr("cx", px).attr("cy", y(d[kD])).style("display", null);
      const u = Q1.urAt(UR, d.date);
      Q1.showTip(e, `<div class="t">${d.label} · ${Q1.phaseOf(d).long}</div>` +
        Q1.tr("OW cases", `${fmt.int(d.ow)} (index ${fmt.f1(d.iow)})`, "var(--ow)") +
        Q1.tr("ODSP cases", `${fmt.int(d.odsp)} (index ${fmt.f1(d.iod)})`, "var(--odsp)") +
        Q1.tr("Unemployment, quarter-end month", u ? fmt.pct(u.ur) : "no data") +
        `<div class="m">Index: 2019 Q4 = 100. OW counts shown as published.</div>`);
    };
    const leave = () => { rule.forEach(r => r.style("display", "none")); dots.forEach(c => c.style("display", "none")); Q1.hideTip(); };
    [[g, ih1], [g2, ih2]].forEach(([gg, ih]) => gg.append("rect").attr("width", iw).attr("height", ih).style("fill", "transparent").on("pointermove", move).on("pointerleave", leave));
  }

  function table() {
    const P = F.phase, rows = Q1.PHASES.map(p => P[p.id]);
    const host = d3.select("#phaseTable"); host.selectAll("*").remove();
    const t = host.append("div").attr("class", "tbl-wrap").append("table");
    t.append("caption").style("text-align", "left").style("font-size", "12px").style("color", "var(--ink2)").text("Number of cases; change between the first and last quarter of each period");
    const hd = t.append("thead");
    hd.append("tr").html(`<th></th><th colspan="3" style="text-align:center;color:var(--ow)">OW</th><th colspan="3" style="text-align:center;color:var(--odsp)">ODSP</th>`);
    hd.append("tr").selectAll("th").data(["Period", "First", "Last", "Change", "First", "Last", "Change"]).join("th").text(d => d);
    t.append("tbody").selectAll("tr").data(rows).join("tr")
      .attr("tabindex", 0).style("cursor", "pointer")
      .style("background", p => (stepPhase() && stepPhase().id === p.id ? "var(--btn)" : null))
      .on("click", (e, p) => { S.step = steps().find(s => s.ph === p.id).id; render(); })
      .on("keydown", (e, p) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); S.step = steps().find(s => s.ph === p.id).id; render(); refocus(p.id); } })
      .attr("data-ph", p => p.id)
      .selectAll("td").data(p => [`${Q1.cap(p.long)} (${p.a.label} – ${p.z.label})`, fmt.int(p.a.ow), fmt.int(p.z.ow), fmt.sp(p.ow), fmt.int(p.a.odsp), fmt.int(p.z.odsp), fmt.sp(p.odsp)])
      .join("td").text(d => d);
  }

  // keyboard users keep their place: re-rendering rebuilds the rows, so focus the same row again
  const refocus = id => { const r = document.querySelector(`#phaseTable tr[data-ph="${id}"]`); if (r) r.focus(); };
  function cards() {
    const P = F.phase;
    const c = [
      { h: "The data support", li: [
        `Before the pandemic ODSP grew much faster than OW (${fmt.sp(P.pre.odsp)} vs ${fmt.sp(P.pre.ow)}, ${P.pre.a.label} – ${P.pre.z.label}).`,
        `During the pandemic OW fell to ${fmt.f1(F.owMin.iow)} (${F.owMin.label}, 2019 Q4 = 100) while ODSP stayed between ${fmt.f1(F.odsp19.lo.iod)} and ${fmt.f1(F.odsp19.hi.iod)}.`,
        `After the pandemic OW rose ${fmt.sp(P.post.ow)} and reached ${fmt.f1(F.last.iow)} in ${F.last.label}; ODSP changed ${fmt.sp(P.post.odsp)}.`] },
      { h: "The data do not show", li: [
        "Why either caseload changed: the pandemic, benefits such as CERB, policy or the economy are not measured here.",
        "How many people were helped: a case can include several people.",
        "Need: caseloads are not adjusted for population and do not measure unmet need.",
        "That unemployment drove caseloads: the two series are shown side by side for context only."] },
      { h: "Worth investigating", li: [
        `Why OW and ODSP moved differently in ${P.during.a.label} – ${P.during.z.label}.`,
        `What lies behind OW's rise from ${F.owMin.label} to ${F.owMax.label} (${fmt.int(F.owMin.ow)} → ${fmt.int(F.owMax.ow)}).`,
        "How regional patterns compare: see Part 2 (family composition) and Part 3 (OW duration)."] },
    ];
    d3.select("#cards").selectAll("div.card").data(c).join("div").attr("class", "card").html(d => `<h3>${d.h}</h3><ul>${d.li.map(l => `<li>${l}</li>`).join("")}</ul>`);
  }
})();
