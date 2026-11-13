/* Q1 candidate B — change, not level (challenges the "counts by default" decision). */
(() => {
  "use strict";
  const { fmt } = Q1;
  const RANGES = [
    { id: "all", label: "2004–2026", from: new Date(2004, 0, 1), to: new Date(2026, 2, 31) },
    { id: "2015", label: "2015–2026", from: new Date(2015, 0, 1), to: new Date(2026, 2, 31) },
    { id: "zoom", label: "Pandemic zoom 2018–2024", from: new Date(2017, 9, 1), to: new Date(2024, 11, 31) },
  ];
  const MODES = [{ id: "yoy", label: "Year-over-year change" }, { id: "base", label: "Change since 2019 Q4" }];
  const S = { step: 2, mode: "yoy", range: "all", ann: "ann" };
  let DATA, F; const syncs = [];

  Q1.load("../../../../").then(d => {
    DATA = d; F = d.F; window.__facts = F;
    const U = new URLSearchParams(location.search);
    if (U.has("step")) S.step = +U.get("step");
    if (MODES.some(m => m.id === U.get("mode"))) S.mode = U.get("mode");
    if (RANGES.some(r => r.id === U.get("range"))) S.range = U.get("range");
    if (["ann", "total"].includes(U.get("ann"))) S.ann = U.get("ann");
    Q1.themeButton(render);
    build(); render(); Q1.onResize(render);
    document.body.dataset.ready = "1";
  }).catch(Q1.fail);

  const steps = [{ id: 1, label: "1 · Before", ph: "pre" }, { id: 2, label: "2 · During", ph: "during" }, { id: 3, label: "3 · After", ph: "post" }, { id: 0, label: "Explore all" }];
  function build() {
    syncs.push(Q1.seg("#stepSeg", steps, s => s.label, s => S.step === s.id, s => { S.step = s.id; render(); }));
    syncs.push(Q1.seg("#modeSeg", MODES, m => m.label, m => S.mode === m.id, m => { S.mode = m.id; render(); }));
    syncs.push(Q1.seg("#rangeSeg", RANGES, r => r.label, r => S.range === r.id, r => { S.range = r.id; render(); }));
    syncs.push(Q1.seg("#annSeg", [{ id: "ann", label: "Average annual change" }, { id: "total", label: "Total change, first to last quarter" }],
      a => a.label, a => S.ann === a.id, a => { S.ann = a.id; render(); }));
  }
  const stepPhase = () => { const s = steps.find(x => x.id === S.step); return s && s.ph ? F.phase[s.ph] : null; };
  function render() { syncs.forEach(f => f()); lead(); story(); panels(); phases(); cards(); }

  function lead() {
    document.getElementById("lead").innerHTML =
      `The two caseloads moved in the same direction (both up or both down on a year earlier) in <b>${F.same} of ${F.nYoY}</b> quarters. ` +
      `The sharpest split came during the pandemic: in ${F.yowMin.label} OW was <b>${fmt.sp(F.yowMin.yow)}</b> on a year earlier, ` +
      `while ODSP's largest fall was ${fmt.sp(F.yodMin.yod)} (${F.yodMin.label}).`;
  }
  function story() {
    const el = document.getElementById("stepText"), P = F.phase;
    if (S.step === 1) el.innerHTML = `<b>${P.pre.a.label} → ${P.pre.z.label}: ODSP grew every year; OW swung between growth and decline.</b> ` +
      `Averaged per year, ODSP grew ${fmt.sp(P.pre.odspAnn)} and OW ${fmt.sp(P.pre.owAnn)}. OW's fastest rise was ${fmt.sp(F.yowMax.yow)} in ${F.yowMax.label}.`;
    else if (S.step === 2) el.innerHTML = `<b>${P.during.a.label} → ${P.during.z.label}: both fell, but by very different amounts.</b> ` +
      `OW reached ${fmt.sp(F.yowMin.yow)} on a year earlier (${F.yowMin.label}); ODSP never fell more than ${fmt.f1(Math.abs(F.yodMin.yod))}% (${F.yodMin.label}). These data do not show why.`;
    else if (S.step === 3) el.innerHTML = `<b>${P.post.a.label} → ${P.post.z.label}: OW grew fast again, ODSP slowly.</b> ` +
      `Averaged per year, OW ${fmt.sp(P.post.owAnn)} and ODSP ${fmt.sp(P.post.odspAnn)}.`;
    else el.innerHTML = "Explore freely: switch to change since 2019 Q4, zoom in, or hover for the counts behind each change.";
  }

  function panels() {
    const Q = DATA.Q, UR = DATA.UR, R = RANGES.find(r => r.id === S.range), n = Q1.narrow(), yoy = S.mode === "yoy";
    const kO = yoy ? "yow" : "cow", kD = yoy ? "yod" : "cod";
    Q.forEach(d => { d.cow = d.iow - 100; d.cod = d.iod - 100; });
    const rows = Q.filter(d => d.date >= R.from && d.date <= R.to && d[kO] != null);
    const w = Q1.W("f1a"), m = { t: 8, r: n ? 14 : 96, b: 6, l: 52 }, iw = w - m.l - m.r;
    const x = d3.scaleTime().domain([R.from, R.to]).range([0, iw]);
    const M = Math.ceil(d3.max(rows, d => Math.max(Math.abs(d[kO]), Math.abs(d[kD]))) / 5) * 5;
    const ph = n ? 130 : 150, gap = 26, stripH = 16, axisH = 22;
    const h = m.t + ph * 2 + gap + stripH + 18 + axisH;
    const y = d3.scaleLinear().domain([-M, M]).range([ph, 0]); // shared by both panels
    document.getElementById("f1aTitle").textContent = yoy
      ? "Year-over-year change in cases (%), same scale for both programs"
      : "Change since 2019 Q4 (%), i.e. index − 100, same scale for both programs";
    const svg = Q1.svgIn("f1a", w, h, "Small multiples of OW and ODSP caseload change, sharing one vertical scale");
    const g = svg.append("g").attr("transform", `translate(${m.l},${m.t})`);
    const ph0 = stepPhase();
    const P = [{ k: "ow", key: kO, t: "OW" }, { k: "odsp", key: kD, t: "ODSP" }];
    P.forEach((p, i) => {
      const gp = g.append("g").attr("transform", `translate(0,${i * (ph + gap)})`);
      Q1.covidBand(gp, x, ph, i === 0);
      if (ph0) Q1.encl(gp, x, Math.max(+ph0.a.date, +R.from), Math.min(+ph0.z.date, +R.to), ph);
      gp.append("g").attr("class", "grid").call(d3.axisLeft(y).ticks(4).tickSize(-iw).tickFormat(""));
      gp.append("path").datum(rows).attr("d", d3.area().x(d => x(d.date)).y0(y(0)).y1(d => y(d[p.key]))).style("fill", `var(--${p.k})`).style("opacity", .16);
      gp.append("path").datum(rows).attr("class", `ln-${p.k}`).attr("d", d3.line().x(d => x(d.date)).y(d => y(d[p.key])));
      gp.append("line").attr("x1", 0).attr("x2", iw).attr("y1", y(0)).attr("y2", y(0)).style("stroke", "var(--ink)").style("stroke-width", 1);
      gp.append("g").attr("class", "axis").call(d3.axisLeft(y).ticks(4).tickFormat(v => (v > 0 ? "+" : v < 0 ? "−" : "") + Math.abs(v) + "%").tickSizeOuter(0));
      gp.append("text").attr("class", "lbl-strong").attr("x", 6).attr("y", 26).style("fill", `var(--${p.k})`).style("font-size", "13px").text(p.t);
      // selective annotations: each panel's lowest and highest value in view
      const lo = d3.least(rows, d => d[p.key]), hi = d3.greatest(rows, d => d[p.key]);
      [[lo, 16], [hi, -9]].forEach(([d, dy]) => {
        const px = x(d.date), right = px > iw * 0.6;
        gp.append("circle").attr("cx", px).attr("cy", y(d[p.key])).attr("r", 3.5).style("fill", `var(--${p.k})`).style("stroke", "var(--surface)").style("stroke-width", 2);
        gp.append("text").attr("class", "ann").attr("x", px + (right ? -6 : 6)).attr("y", Math.max(10, Math.min(ph - 3, y(d[p.key]) + dy))).attr("text-anchor", right ? "end" : "start")
          .text(`${fmt.sp(d[p.key])} · ${d.label}`);
      });
    });
    // agreement strip: quarters where both year-over-year changes have the same sign
    const yr = Q.filter(d => d.date >= R.from && d.date <= R.to && d.yow != null);
    const sy = 2 * ph + gap + 6, step = iw / Math.max(1, (R.to - R.from) / (91.3 * 864e5));
    const st = g.append("g").attr("transform", `translate(0,${sy})`);
    st.selectAll("rect").data(yr).join("rect").attr("x", d => x(d.date) - step / 2).attr("width", Math.max(1, step - 1)).attr("height", stripH)
      .style("fill", d => (Math.sign(d.yow) === Math.sign(d.yod) ? "var(--agree)" : "transparent")).style("stroke", "var(--axis)").style("stroke-width", .5);
    const nSame = yr.filter(d => Math.sign(d.yow) === Math.sign(d.yod)).length;
    st.append("text").attr("class", "lbl").attr("x", 0).attr("y", stripH + 13).style("font-size", "11px")
      .text(`Filled = both moved the same way on a year earlier (${nSame} of ${yr.length} quarters in view)`);
    const xa = g.append("g").attr("transform", `translate(0,${sy + stripH + 18})`);
    Q1.timeAxis(xa, x, 0);
    if (!n) P.forEach((p, i) => { const L = rows[rows.length - 1];
      g.append("text").attr("class", "lbl-strong").attr("x", iw + 8).attr("y", i * (ph + gap) + y(L[p.key])).attr("dy", "0.32em").style("fill", `var(--${p.k})`).text(`${p.t} ${fmt.sp(L[p.key])}`); });
    document.getElementById("f1note").textContent = (yoy ? "Year-over-year change starts in 2004 Q1 (it needs a quarter one year earlier). " : "Change since 2019 Q4 = index − 100. ") +
      "Grey band: pandemic period. The strip uses year-over-year change in both modes.";

    // Figure 1b, unemployment
    const h2 = n ? 100 : 110, m2 = { t: 10, b: 22 }, ih2 = h2 - m2.t - m2.b;
    const urRows = UR.filter(d => d.date >= R.from && d.date <= R.to);
    const y2 = d3.scaleLinear().domain([0, Math.ceil(F.urMax.ur / 5) * 5]).range([ih2, 0]);
    const g2 = Q1.svgIn("f1b", w, h2, "Ontario unemployment rate by month").append("g").attr("transform", `translate(${m.l},${m2.t})`);
    Q1.covidBand(g2, x, ih2, false);
    if (ph0) Q1.encl(g2, x, Math.max(+ph0.a.date, +R.from), Math.min(+ph0.z.date, +R.to), ih2);
    if (R.from < F.urFirst.date) g2.append("text").attr("class", "lbl").attr("x", Math.max(0, x(F.urFirst.date) - 6)).attr("y", ih2 / 2).attr("text-anchor", "end").style("font-size", "11px").text(n ? "no data before 2017" : "No unemployment data before Jan 2017");
    g2.append("g").attr("class", "grid").call(d3.axisLeft(y2).ticks(3).tickSize(-iw).tickFormat(""));
    g2.append("path").datum(urRows).attr("d", d3.area().x(d => x(d.date)).y0(ih2).y1(d => y2(d.ur))).style("fill", "var(--ur-fill)");
    g2.append("path").datum(urRows).attr("d", d3.line().x(d => x(d.date)).y(d => y2(d.ur))).style("fill", "none").style("stroke", "var(--ur)").style("stroke-width", 1.5);
    g2.append("g").attr("class", "axis").call(d3.axisLeft(y2).tickValues(y2.ticks(3).filter(v => v > 0)).tickFormat(d => d + "%").tickSizeOuter(0));
    Q1.timeAxis(g2, x, ih2);
    // linked crosshair through both panels, the strip and Figure 1b
    const rl = g.append("line").attr("y1", 0).attr("y2", sy + stripH).style("stroke", "var(--ink2)").style("display", "none");
    const r2 = g2.append("line").attr("y1", 0).attr("y2", ih2).style("stroke", "var(--ink2)").style("display", "none");
    const bis = d3.bisector(d => d.date).center;
    const move = function (e) {
      const d = rows[bis(rows, x.invert(d3.pointer(e, this)[0]))], px = x(d.date), u = Q1.urAt(UR, d.date);
      rl.attr("x1", px).attr("x2", px).style("display", null); r2.attr("x1", px).attr("x2", px).style("display", null);
      Q1.showTip(e, `<div class="t">${d.label} · ${Q1.phaseOf(d).long}</div>` +
        Q1.tr("OW, year-over-year", d.yow == null ? "n/a" : fmt.sp(d.yow), "var(--ow)") + Q1.tr("ODSP, year-over-year", d.yod == null ? "n/a" : fmt.sp(d.yod), "var(--odsp)") +
        Q1.tr("OW cases (index)", `${fmt.int(d.ow)} (${fmt.f1(d.iow)})`) + Q1.tr("ODSP cases (index)", `${fmt.int(d.odsp)} (${fmt.f1(d.iod)})`) +
        Q1.tr("Unemployment, quarter-end month", u ? fmt.pct(u.ur) : "no data") + `<div class="m">Index: 2019 Q4 = 100. OW counts shown as published.</div>`);
    };
    const leave = () => { rl.style("display", "none"); r2.style("display", "none"); Q1.hideTip(); };
    g.append("rect").attr("width", iw).attr("height", sy + stripH).style("fill", "transparent").on("pointermove", move).on("pointerleave", leave);
    g2.append("rect").attr("width", iw).attr("height", ih2).style("fill", "transparent").on("pointermove", move).on("pointerleave", leave);
  }

  // Figure 2: dot plot per period, OW circle / ODSP diamond (shape + colour, never colour alone)
  function phases() {
    const ann = S.ann === "ann", rows = Q1.PHASES.map(p => F.phase[p.id]);
    const vO = p => (ann ? p.owAnn : p.ow), vD = p => (ann ? p.odspAnn : p.odsp);
    document.getElementById("f2Title").textContent = ann ? "Average annual change in cases, by period (%)" : "Total change in cases from the first to the last quarter of each period (%)";
    document.getElementById("f2note").textContent = ann
      ? `Average annual change = (last ÷ first)^(1 / years) − 1, where years = quarters between the first and last observation ÷ 4. It lets a ${rows[0].years}-year period be compared with a ${rows[1].years}-year one.`
      : `Total change = (last ÷ first − 1) × 100. The periods last ${rows[0].years}, ${rows[1].years} and ${rows[2].years} years, so totals are not comparable down the column.`;
    const w = Q1.W("f2"), n = Q1.narrow(), m = { t: 24, r: 16, b: 26, l: n ? 92 : 210 }, rh = 52, iw = w - m.l - m.r, h = m.t + rows.length * rh + m.b;
    const lo = d3.min(rows, p => Math.min(vO(p), vD(p), 0)), hi = d3.max(rows, p => Math.max(vO(p), vD(p), 0));
    const x = d3.scaleLinear().domain([Math.floor(lo / 5) * 5 - (ann ? 0 : 5), Math.ceil(hi / 5) * 5 + 5]).range([0, iw]);
    const svg = Q1.svgIn("f2", w, h, "Dot plot of OW and ODSP change in each pandemic period");
    const g = svg.append("g").attr("transform", `translate(${m.l},${m.t})`);
    g.append("g").attr("class", "grid").call(d3.axisTop(x).ticks(6).tickSize(-rows.length * rh).tickFormat(""));
    g.append("g").attr("class", "axis").call(d3.axisTop(x).ticks(6).tickFormat(v => (v > 0 ? "+" : v < 0 ? "−" : "") + Math.abs(v) + "%").tickSizeOuter(0)).call(a => a.select(".domain").remove());
    g.append("line").attr("x1", x(0)).attr("x2", x(0)).attr("y1", 0).attr("y2", rows.length * rh).style("stroke", "var(--ink)");
    const sel = stepPhase();
    const r = g.selectAll("g.row").data(rows).join("g").attr("class", "row").attr("transform", (p, i) => `translate(0,${i * rh})`)
      .attr("tabindex", 0).attr("role", "button").attr("data-ph", p => p.id).style("cursor", "pointer")
      .attr("aria-label", p => `${Q1.cap(p.long)}: OW ${fmt.sp(vO(p))}, ODSP ${fmt.sp(vD(p))}. Press Enter to mark this period.`)
      .on("click", (e, p) => { S.step = steps.find(s => s.ph === p.id).id; render(); })
      .on("keydown", (e, p) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); S.step = steps.find(s => s.ph === p.id).id; render();
        const r = document.querySelector(`#f2 g.row[data-ph="${p.id}"]`); if (r) r.focus(); } })
      .on("pointermove", (e, p) => Q1.showTip(e, `<div class="t">${Q1.cap(p.long)} · ${p.a.label} – ${p.z.label}</div>` +
        Q1.tr("OW", `${fmt.int(p.a.ow)} → ${fmt.int(p.z.ow)}`, "var(--ow)") + Q1.tr("ODSP", `${fmt.int(p.a.odsp)} → ${fmt.int(p.z.odsp)}`, "var(--odsp)") +
        Q1.tr("Total change", `OW ${fmt.sp(p.ow)} · ODSP ${fmt.sp(p.odsp)}`) + Q1.tr("Per year", `OW ${fmt.sp(p.owAnn)} · ODSP ${fmt.sp(p.odspAnn)}`) + Q1.tr("Length", `${p.years} years`)))
      .on("pointerleave", Q1.hideTip);
    r.append("rect").attr("x", -m.l + 2).attr("y", 2).attr("width", w - 4).attr("height", rh - 4).attr("rx", 4)
      .style("fill", p => (sel && sel.id === p.id ? "var(--sel)" : "transparent")).style("fill-opacity", .12)
      .style("stroke", p => (sel && sel.id === p.id ? "var(--sel)" : "none"));
    r.append("text").attr("class", p => (sel && sel.id === p.id ? "lbl-strong" : "lbl")).attr("x", -10).attr("y", rh / 2 - (n ? 6 : 0)).attr("dy", "0.32em").attr("text-anchor", "end")
      .text(p => (n ? p.label : `${Q1.cap(p.long)}`));
    if (n) r.append("text").attr("class", "lbl").attr("x", -10).attr("y", rh / 2 + 9).attr("dy", "0.32em").attr("text-anchor", "end").style("font-size", "10.5px").text(p => `${p.years} yrs`);
    else r.append("text").attr("class", "lbl").attr("x", -10).attr("y", rh / 2 + 15).attr("dy", "0.32em").attr("text-anchor", "end").style("font-size", "11px").text(p => `${p.a.label} – ${p.z.label}`);
    r.append("line").attr("x1", p => x(vO(p))).attr("x2", p => x(vD(p))).attr("y1", rh / 2).attr("y2", rh / 2).style("stroke", "var(--axis)").style("stroke-width", 2);
    r.append("circle").attr("cx", p => x(vO(p))).attr("cy", rh / 2).attr("r", 6).style("fill", "var(--ow)").style("stroke", "var(--surface)").style("stroke-width", 2);
    r.append("path").attr("d", d3.symbol(d3.symbolDiamond, 110)).attr("transform", p => `translate(${x(vD(p))},${rh / 2})`).style("fill", "var(--odsp)").style("stroke", "var(--surface)").style("stroke-width", 2);
    // labels: the program further right is labelled on the right, the other on the left, so they never collide
    r.each(function (p) {
      const a = vO(p), b = vD(p), row = d3.select(this), oRight = a >= b;
      const tO = row.append("text").attr("class", "ann").attr("x", x(a) + (oRight ? 10 : -10)).attr("y", rh / 2).attr("dy", "0.32em").attr("text-anchor", oRight ? "start" : "end").style("fill", "var(--ow)").text(`OW ${fmt.sp(a)}`);
      const tD = row.append("text").attr("class", "ann").attr("x", x(b) + (oRight ? -10 : 10)).attr("y", rh / 2).attr("dy", "0.32em").attr("text-anchor", oRight ? "end" : "start").style("fill", "var(--odsp)").text(`ODSP ${fmt.sp(b)}`);
      const out = t => { const bb = t.node().getBBox(); return bb.x < 2 || bb.x + bb.width > iw - 2; };
      if (out(tO) || out(tD)) { // not enough room beside the marks: stack labels above (OW) and below (ODSP)
        const place = (t, v, dy) => { const wv = t.node().getComputedTextLength(); t.attr("text-anchor", "middle").attr("y", rh / 2 + dy)
          .attr("x", Math.max(wv / 2 + 2, Math.min(iw - wv / 2 - 2, x(v)))); };
        place(tO, a, -14); place(tD, b, 15);
      }
    });
  }

  function cards() {
    const P = F.phase;
    const c = [
      { h: "The data support", li: [
        `The two caseloads moved the same way on a year earlier in ${F.same} of ${F.nYoY} quarters.`,
        `During the pandemic OW's year-over-year change fell to ${fmt.sp(F.yowMin.yow)} (${F.yowMin.label}); ODSP's lowest was ${fmt.sp(F.yodMin.yod)} (${F.yodMin.label}).`,
        `Per year, OW grew ${fmt.sp(P.post.owAnn)} after the pandemic against ${fmt.sp(P.pre.owAnn)} before it; ODSP ${fmt.sp(P.post.odspAnn)} against ${fmt.sp(P.pre.odspAnn)}.`] },
      { h: "The data do not show", li: [
        "Why either caseload changed: the pandemic, benefits such as CERB, policy or the economy are not measured here.",
        "How many people were helped, or how need changed: cases are not people and are not adjusted for population.",
        "Whether a faster growth rate is a problem: these are descriptive rates of change, not targets.",
        "That unemployment drove caseloads: it is shown for context only."] },
      { h: "Worth investigating", li: [
        `The quarters in which the programs moved in opposite directions (${F.nYoY - F.same} of ${F.nYoY}).`,
        `What lies behind OW's fast growth after the pandemic (${fmt.sp(P.post.owAnn)} a year).`,
        "Which growth-rate definition the site should use (year-over-year, per-year average, or change since 2019 Q4)."] },
    ];
    d3.select("#cards").selectAll("div.card").data(c).join("div").attr("class", "card").html(d => `<h3>${d.h}</h3><ul>${d.li.map(l => `<li>${l}</li>`).join("")}</ul>`);
  }
})();
