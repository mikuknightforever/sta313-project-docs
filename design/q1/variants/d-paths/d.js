/* Q1 candidate D — connected scatterplot (x = ODSP, y = OW) with a slider and a companion timeline. */
(() => {
  "use strict";
  const { fmt } = Q1;
  const PH = { pre: "var(--ph0)", during: "var(--ph1)", post: "var(--ph2)" };
  const S = { step: 0, mode: "count", t: 0, hover: null, timer: null };
  let DATA, F, Q; const syncs = [];

  Q1.load("../../../../").then(d => {
    DATA = d; F = d.F; Q = d.Q; window.__facts = F;
    S.t = Q.length - 1;
    const U = new URLSearchParams(location.search);
    if (["count", "index"].includes(U.get("mode"))) S.mode = U.get("mode");
    if (U.has("step")) setStep(+U.get("step"));
    if (U.has("t")) { const i = Q.findIndex(r => r.label.replace(" ", "") === U.get("t")); if (i >= 0) S.t = i; }
    Q1.themeButton(render);
    build(); render(); Q1.onResize(render);
    document.body.dataset.ready = "1";
  }).catch(Q1.fail);

  const steps = [{ id: 1, label: "1 · Before", ph: "pre" }, { id: 2, label: "2 · During", ph: "during" }, { id: 3, label: "3 · After", ph: "post" }, { id: 0, label: "Explore all" }];
  function setStep(id) { S.step = id; const s = steps.find(x => x.id === id); S.t = s && s.ph ? Q.indexOf(F.phase[s.ph].z) : Q.length - 1; }
  function build() {
    syncs.push(Q1.seg("#stepSeg", steps, s => s.label, s => S.step === s.id, s => { stop(); setStep(s.id); render(); }));
    syncs.push(Q1.seg("#modeSeg", [{ id: "count", label: "Axes in cases" }, { id: "index", label: "Axes as index, 2019 Q4 = 100" }], m => m.label, m => S.mode === m.id, m => { S.mode = m.id; render(); }));
    const sl = document.getElementById("tSlider"); sl.max = Q.length - 1;
    sl.addEventListener("input", () => { stop(); S.t = +sl.value; S.step = 0; syncs.forEach(f => f()); story(); scatter(); timeline(); });
    document.getElementById("playBtn").onclick = () => (S.timer ? stop() : play());
    keys();
  }
  function play() {
    if (S.t >= Q.length - 1) S.t = 0;
    S.step = 0; document.getElementById("playBtn").textContent = "Pause";
    S.timer = setInterval(() => { S.t++; if (S.t >= Q.length - 1) { S.t = Q.length - 1; stop(); } scatter(); timeline(); story(); syncs.forEach(f => f()); }, Q1.reduced() ? 700 : 220);
  }
  function stop() { if (S.timer) clearInterval(S.timer); S.timer = null; const b = document.getElementById("playBtn"); if (b) b.textContent = "Play"; }
  function render() { syncs.forEach(f => f()); lead(); story(); scatter(); timeline(); table(); cards(); }
  const stepPhase = () => { const s = steps.find(x => x.id === S.step); return s && s.ph ? F.phase[s.ph] : null; };
  // Net direction of the path over a period: the program whose index changed more than twice as much sets it.
  function dirOf(p) {
    const dO = p.z.iow - p.a.iow, dD = p.z.iod - p.a.iod, word = (v, nm) => `${nm} ${v >= 0 ? "up" : "down"}`;
    if (Math.abs(dD) > 2 * Math.abs(dO)) return { main: dD >= 0 ? "right" : "left", text: `mostly ${dD >= 0 ? "right" : "left"} (${word(dD, "ODSP")})` };
    if (Math.abs(dO) > 2 * Math.abs(dD)) return { main: dO >= 0 ? "up" : "down", text: `mostly ${dO >= 0 ? "up" : "down"} (${word(dO, "OW")})` };
    return { main: "diagonal", text: `diagonal (${word(dO, "OW")}, ${word(dD, "ODSP")})` };
  }

  function lead() {
    const P = F.phase;
    document.getElementById("lead").innerHTML =
      `From ${P.pre.a.label} to ${P.pre.z.label} the path moved ${dirOf(P.pre).text.replace(/ \(.*/, "")}: ODSP grew <b>${fmt.pct(P.pre.odsp)}</b>, OW ${fmt.pct(P.pre.ow)}. ` +
      `During the pandemic OW fell to index <b>${fmt.f1(F.owMin.iow)}</b> (${F.owMin.label}) while ODSP stayed between ${fmt.f1(F.odsp19.lo.iod)} and ${fmt.f1(F.odsp19.hi.iod)}, so the path dropped nearly vertically; ` +
      `after it, the path moved ${dirOf(P.post).text.replace(/ \(.*/, "")} to OW ${fmt.f1(F.last.iow)} in ${F.last.label}.`;
  }
  function story() {
    const el = document.getElementById("stepText"), P = F.phase, c = Q[S.t];
    document.getElementById("tOut").textContent = c.label;
    document.getElementById("tSlider").value = S.t;
    if (S.step === 1) el.innerHTML = `<b>${P.pre.a.label} → ${P.pre.z.label}: ${dirOf(P.pre).text}.</b> ODSP grew ${fmt.pct(P.pre.odsp)} and OW ${fmt.pct(P.pre.ow)} (index ${fmt.f1(P.pre.a.iod)} → ${fmt.f1(P.pre.z.iod)} across, ${fmt.f1(P.pre.a.iow)} → ${fmt.f1(P.pre.z.iow)} up).`;
    else if (S.step === 2) el.innerHTML = `<b>${P.during.a.label} → ${P.during.z.label}: down, then back up, almost vertically.</b> OW fell to ${fmt.int(F.owMin.ow)} (${F.owMin.label}, index ${fmt.f1(F.owMin.iow)}); ODSP's index varied by ${fmt.f1(F.odsp19.hi.iod - F.odsp19.lo.iod)} points at most. These data do not show why.`;
    else if (S.step === 3) el.innerHTML = `<b>${P.post.a.label} → ${P.post.z.label}: ${dirOf(P.post).text}.</b> OW grew ${fmt.pct(P.post.ow)} and ODSP ${fmt.sp(P.post.odsp)}.`;
    else el.innerHTML = `Showing the path up to <b>${c.label}</b> (${Q1.phaseOf(c).long}). Drag the slider, press Play, or hover a dot.`;
  }

  function scales(w) {
    const n = Q1.narrow(), m = { t: 14, r: 18, b: 40, l: 62 };
    const xd = [Math.floor(d3.min(Q, d => d.iod) / 10) * 10, Math.ceil(d3.max(Q, d => d.iod) / 5) * 5 + 5];
    const yd = [Math.floor(d3.min(Q, d => d.iow) / 10) * 10, Math.ceil(d3.max(Q, d => d.iow) / 10) * 10];
    const iwMax = w - m.l - m.r, ihMax = n ? 360 : 440;
    const k = Math.min(iwMax / (xd[1] - xd[0]), ihMax / (yd[1] - yd[0])); // equal pixels per index point on both axes
    const iw = k * (xd[1] - xd[0]), ih = k * (yd[1] - yd[0]);
    return { m, iw, ih, x: d3.scaleLinear().domain(xd).range([0, iw]), y: d3.scaleLinear().domain(yd).range([ih, 0]) };
  }
  function scatter() {
    const w = Q1.W("f1a"), { m, iw, ih, x, y } = scales(w), idx = S.mode === "index", b = F.base, c = Q[S.t], sp = stepPhase();
    document.getElementById("f1aTitle").textContent = idx ? "OW index (up) against ODSP index (across), 2019 Q4 = 100, one dot per quarter"
      : "OW cases (up) against ODSP cases (across), one dot per quarter (axes use the same scale per index point)";
    const svg = Q1.svgIn("f1a", m.l + iw + m.r, m.t + ih + m.b, "Connected scatterplot of OW cases against ODSP cases by quarter, 2003 to 2026");
    const g = svg.append("g").attr("transform", `translate(${m.l},${m.t})`);
    // axes: same geometry in both modes; count mode just relabels ticks (index × 2019 Q4 value ÷ 100)
    // count mode uses count scales with the same pixel geometry (index × 2019 Q4 value ÷ 100), so ticks are round counts
    const xa = idx ? x : d3.scaleLinear().domain(x.domain().map(v => (v * b.odsp) / 100)).range(x.range());
    const ya = idx ? y : d3.scaleLinear().domain(y.domain().map(v => (v * b.ow) / 100)).range(y.range());
    const xt = xa.ticks(5), yt = ya.ticks(5).filter(v => v > ya.domain()[0]); // drop the corner tick so the two axes never collide
    const tf = idx ? d3.format("d") : fmt.k;
    g.append("g").attr("class", "grid").call(d3.axisLeft(ya).tickValues(yt).tickSize(-iw).tickFormat(""));
    g.append("g").attr("class", "grid").attr("transform", `translate(0,${ih})`).call(d3.axisBottom(xa).tickValues(xt).tickSize(-ih).tickFormat(""));
    g.append("g").attr("class", "axis").call(d3.axisLeft(ya).tickValues(yt).tickFormat(tf).tickSizeOuter(0));
    g.append("g").attr("class", "axis").attr("transform", `translate(0,${ih})`).call(d3.axisBottom(xa).tickValues(xt).tickFormat(tf).tickSizeOuter(0));
    g.append("text").attr("class", "lbl-strong").attr("x", iw).attr("y", ih + 34).attr("text-anchor", "end").style("fill", "var(--odsp)").text(idx ? "ODSP index →" : "ODSP cases →");
    g.append("text").attr("class", "lbl-strong").attr("transform", "rotate(-90)").attr("x", 0).attr("y", -48).attr("text-anchor", "end").style("fill", "var(--ow)").text(idx ? "OW index →" : "OW cases →");
    // guides: 2019 Q4 cross-hairs and the 45° equal-growth line through it
    g.append("line").attr("x1", x(100)).attr("x2", x(100)).attr("y1", 0).attr("y2", ih).style("stroke", "var(--axis)");
    g.append("line").attr("x1", 0).attr("x2", iw).attr("y1", y(100)).attr("y2", y(100)).style("stroke", "var(--axis)");
    const lo = Math.max(x.domain()[0], y.domain()[0]), hi = Math.min(x.domain()[1], y.domain()[1]);
    g.append("line").attr("x1", x(lo)).attr("y1", y(lo)).attr("x2", x(hi)).attr("y2", y(hi)).style("stroke", "var(--ink2)").style("stroke-dasharray", "2 4").style("stroke-width", 1.2);
    g.append("text").attr("class", "lbl").attr("x", x(lo) + 6).attr("y", y(lo) - 6).style("font-size", "11px").text("equal growth");
    // future path as faint context, travelled path coloured by period (ordinal neutral ramp)
    const segs = Q.slice(1).map((d, i) => ({ a: Q[i], b: d, i: i + 1 }));
    g.append("g").selectAll("line").data(segs).join("line")
      .attr("x1", s => x(s.a.iod)).attr("y1", s => y(s.a.iow)).attr("x2", s => x(s.b.iod)).attr("y2", s => y(s.b.iow))
      .style("stroke", s => (s.i <= S.t ? PH[s.b.phase] : "var(--grid)")).style("stroke-width", s => (s.i <= S.t ? 2.2 : 1.2))
      .style("opacity", s => (sp && s.b.phase !== sp.id && s.i <= S.t ? 0.3 : 1)).style("stroke-linecap", "round");
    g.append("g").selectAll("circle").data(Q.slice(0, S.t + 1)).join("circle").attr("cx", d => x(d.iod)).attr("cy", d => y(d.iow)).attr("r", 2.4)
      .style("fill", d => PH[d.phase]).style("opacity", d => (sp && d.phase !== sp.id ? 0.3 : 1));
    // selective labels: start, 2019 Q4, OW low, latest (within the travelled path)
    const lab = [[Q[0], "start", 8, 4], [b, "end", -8, -6], [F.owMin, "start", 8, 12], [F.last, "start", 8, 0]];
    const fixed = lab.filter(([d]) => Q.indexOf(d) <= S.t && d !== c).map(([d, anchor, dx, dy]) =>
      g.append("text").attr("class", "ann").attr("x", x(d.iod) + dx).attr("y", y(d.iow) + dy).attr("dy", "0.32em").attr("text-anchor", anchor).style("font-weight", 500).text(d.label));
    // current quarter (slider): first of four positions that collides with no fixed label wins
    g.append("circle").attr("cx", x(c.iod)).attr("cy", y(c.iow)).attr("r", 6).style("fill", PH[c.phase]).style("stroke", "var(--ink)").style("stroke-width", 2);
    const cur = g.append("text").attr("class", "ann").text(c.label);
    const hit = (a, b) => a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
    const boxes = () => fixed.map(t => t.node().getBBox());
    const pos = [[10, -10, "start"], [-10, -10, "end"], [10, 18, "start"], [-10, 18, "end"]];
    let ok = false;
    for (const [dx, dy, anc] of pos) {
      cur.attr("x", x(c.iod) + dx).attr("y", y(c.iow) + dy).attr("text-anchor", anc);
      const bb = cur.node().getBBox();
      if (bb.x >= 0 && bb.x + bb.width <= iw && !boxes().some(b => hit(bb, b))) { ok = true; break; }
    }
    if (!ok) { cur.attr("x", x(c.iod) + 10).attr("y", y(c.iow) - 10).attr("text-anchor", "start"); const bb = cur.node().getBBox(); fixed.forEach(t => { if (hit(bb, t.node().getBBox())) t.remove(); }); }
    // hover: nearest dot (Delaunay), linked to the timeline
    const hov = g.append("circle").attr("r", 7).style("fill", "none").style("stroke", "var(--ink2)").style("stroke-width", 1.5).style("display", "none");
    const del = d3.Delaunay.from(Q, d => x(d.iod), d => y(d.iow));
    g.append("rect").attr("width", iw).attr("height", ih).style("fill", "transparent")
      .on("pointermove", function (e) { const [mx, my] = d3.pointer(e, this), d = Q[del.find(mx, my)];
        hov.attr("cx", x(d.iod)).attr("cy", y(d.iow)).style("display", null); S.hover = d; tipFor(e, d); timelineHover(d); readout(d); })
      .on("pointerleave", () => { hov.style("display", "none"); S.hover = null; Q1.hideTip(); timelineHover(null); readout(Q[S.t]); })
      .on("click", function (e) { const [mx, my] = d3.pointer(e, this); S.t = del.find(mx, my); S.step = 0; stop(); syncs.forEach(f => f()); story(); scatter(); timeline(); });
    readout(c);
  }
  function tipFor(e, d) {
    const u = Q1.urAt(DATA.UR, d.date);
    Q1.showTip(e, `<div class="t">${d.label} · ${Q1.phaseOf(d).long}</div>` + Q1.tr("OW cases", `${fmt.int(d.ow)} (index ${fmt.f1(d.iow)})`, "var(--ow)") +
      Q1.tr("ODSP cases", `${fmt.int(d.odsp)} (index ${fmt.f1(d.iod)})`, "var(--odsp)") + Q1.tr("Unemployment, quarter-end month", u ? fmt.pct(u.ur) : "no data") +
      `<div class="m">Index: 2019 Q4 = 100. OW counts shown as published.</div>`);
  }
  function readout(d) {
    const i = Q.indexOf(d), p = Q[i - 1], ch = (k) => (p ? fmt.sp((d[k] / p[k] - 1) * 100) : "n/a");
    document.getElementById("readout").innerHTML = `<div class="q">${d.label}</div><div>${Q1.cap(Q1.phaseOf(d).long)}</div><dl>` +
      `<dt>OW cases</dt><dd style="color:var(--ow)">${fmt.int(d.ow)}</dd><dt>OW index</dt><dd>${fmt.f1(d.iow)}</dd><dt>OW vs previous quarter</dt><dd>${ch("ow")}</dd>` +
      `<dt>ODSP cases</dt><dd style="color:var(--odsp)">${fmt.int(d.odsp)}</dd><dt>ODSP index</dt><dd>${fmt.f1(d.iod)}</dd><dt>ODSP vs previous quarter</dt><dd>${ch("odsp")}</dd></dl>`;
  }
  function keys() {
    const arrow = (dx, dy) => `<svg width="34" height="22" aria-hidden="true"><defs><marker id="ah${dx}${dy}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,0L10,5L0,10z" fill="currentColor"/></marker></defs>` +
      `<line x1="${17 - dx * 11}" y1="${11 + dy * 8}" x2="${17 + dx * 11}" y2="${11 - dy * 8}" stroke="currentColor" stroke-width="2" marker-end="url(#ah${dx}${dy})"/></svg>`;
    document.getElementById("dirKey").innerHTML = [[1, 0, "Right: only ODSP grew"], [0, 1, "Up: only OW grew"], [1, 1, "Diagonal: both grew"], [0, -1, "Down: only OW fell"]]
      .map(([dx, dy, t]) => `<div class="row" style="color:var(--ink2)">${arrow(dx, dy)}<span>${t}</span></div>`).join("");
    document.getElementById("phKey").innerHTML = Q1.PHASES.map(p => `<div class="row"><svg width="34" height="10" aria-hidden="true"><line x1="2" x2="32" y1="5" y2="5" stroke="${PH[p.id]}" stroke-width="3" stroke-linecap="round"/></svg><span>${Q1.cap(p.long)}</span></div>`).join("");
  }

  let TL = null;
  function timeline() {
    const w = Q1.W("f1b"), n = Q1.narrow(), m = { t: 10, r: n ? 12 : 70, b: 22, l: 56 }, iw = w - m.l - m.r, h = n ? 130 : 150, ih = h - m.t - m.b;
    const x = d3.scaleTime().domain([Q[0].date, Q[Q.length - 1].date]).range([0, iw]);
    const y = d3.scaleLinear().domain([Math.floor(d3.min(Q, d => Math.min(d.iow, d.iod)) / 10) * 10, Math.ceil(d3.max(Q, d => Math.max(d.iow, d.iod)) / 10) * 10]).range([ih, 0]);
    const g = Q1.svgIn("f1b", w, h, "OW and ODSP index over time").append("g").attr("transform", `translate(${m.l},${m.t})`);
    Q1.covidBand(g, x, ih, true);
    const sp = stepPhase(); if (sp) Q1.encl(g, x, sp.a.date, sp.z.date, ih);
    g.append("g").attr("class", "grid").call(d3.axisLeft(y).ticks(4).tickSize(-iw).tickFormat(""));
    g.append("line").attr("x1", 0).attr("x2", iw).attr("y1", y(100)).attr("y2", y(100)).style("stroke", "var(--ink2)");
    g.append("path").datum(Q).attr("class", "ln-odsp").attr("d", d3.line().x(d => x(d.date)).y(d => y(d.iod)));
    g.append("path").datum(Q).attr("class", "ln-ow").attr("d", d3.line().x(d => x(d.date)).y(d => y(d.iow)));
    g.append("g").attr("class", "axis").call(d3.axisLeft(y).ticks(4).tickSizeOuter(0));
    Q1.timeAxis(g, x, ih);
    if (!n) Q1.endLabels(g, [{ y: y(F.last.iow), t: "OW", fill: "var(--ow)" }, { y: y(F.last.iod), t: "ODSP", fill: "var(--odsp)" }], iw + 8, 14);
    const c = Q[S.t];
    g.append("line").attr("x1", x(c.date)).attr("x2", x(c.date)).attr("y1", 0).attr("y2", ih).style("stroke", "var(--ink)").style("stroke-width", 2);
    const hl = g.append("line").attr("y1", 0).attr("y2", ih).style("stroke", "var(--ink2)").style("display", "none");
    // unemployment strip, same x scale
    const h2 = n ? 90 : 100, ih2 = h2 - m.t - m.b, UR = DATA.UR;
    const y2 = d3.scaleLinear().domain([0, Math.ceil(F.urMax.ur / 5) * 5]).range([ih2, 0]);
    const g2 = Q1.svgIn("f1c", w, h2, "Ontario unemployment rate by month").append("g").attr("transform", `translate(${m.l},${m.t})`);
    Q1.covidBand(g2, x, ih2, false);
    if (sp) Q1.encl(g2, x, sp.a.date, sp.z.date, ih2);
    g2.append("text").attr("class", "lbl").attr("x", x(F.urFirst.date) - 6).attr("y", ih2 / 2).attr("text-anchor", "end").style("font-size", "11px").text(n ? "no data before 2017" : "No unemployment data before Jan 2017");
    g2.append("g").attr("class", "grid").call(d3.axisLeft(y2).ticks(3).tickSize(-iw).tickFormat(""));
    g2.append("path").datum(UR).attr("d", d3.area().x(d => x(d.date)).y0(ih2).y1(d => y2(d.ur))).style("fill", "var(--ur-fill)");
    g2.append("path").datum(UR).attr("d", d3.line().x(d => x(d.date)).y(d => y2(d.ur))).style("fill", "none").style("stroke", "var(--ur)").style("stroke-width", 1.5);
    g2.append("g").attr("class", "axis").call(d3.axisLeft(y2).tickValues(y2.ticks(3).filter(v => v > 0)).tickFormat(d => d + "%").tickSizeOuter(0));
    Q1.timeAxis(g2, x, ih2);
    g2.append("line").attr("x1", x(c.date)).attr("x2", x(c.date)).attr("y1", 0).attr("y2", ih2).style("stroke", "var(--ink)").style("stroke-width", 2);
    const hl2 = g2.append("line").attr("y1", 0).attr("y2", ih2).style("stroke", "var(--ink2)").style("display", "none");
    TL = { x, hl, hl2 };
    const bis = d3.bisector(d => d.date).center;
    const pick = function (e) { return Q[bis(Q, x.invert(d3.pointer(e, this)[0]))]; };
    [[g, ih], [g2, ih2]].forEach(([gg, hh]) => gg.append("rect").attr("width", iw).attr("height", hh).style("fill", "transparent")
      .on("pointermove", function (e) { const d = pick.call(this, e); tipFor(e, d); timelineHover(d); readout(d); scatterHover(d); })
      .on("pointerleave", () => { Q1.hideTip(); timelineHover(null); readout(Q[S.t]); scatterHover(null); })
      .on("click", function (e) { S.t = Q.indexOf(pick.call(this, e)); S.step = 0; stop(); syncs.forEach(f => f()); story(); scatter(); timeline(); }));
  }
  function timelineHover(d) {
    if (!TL) return;
    [TL.hl, TL.hl2].forEach(l => (d ? l.attr("x1", TL.x(d.date)).attr("x2", TL.x(d.date)).style("display", null) : l.style("display", "none")));
  }
  function scatterHover(d) {
    const { x, y } = scales(Q1.W("f1a")), svg = d3.select("#f1a svg g");
    svg.selectAll(".tl-hover").remove();
    if (d) svg.append("circle").attr("class", "tl-hover").attr("cx", x(d.iod)).attr("cy", y(d.iow)).attr("r", 7).style("fill", "none").style("stroke", "var(--ink2)").style("stroke-width", 1.5);
  }

  function table() {
    const host = d3.select("#phaseTable"); host.selectAll("*").remove();
    const t = host.append("div").attr("class", "tbl-wrap").append("table");
    t.append("thead").append("tr").selectAll("th").data(["Period", "OW change", "ODSP change", "OW index", "ODSP index", "Path direction"]).join("th").text(d => d);
    const sp = stepPhase();
    t.append("tbody").selectAll("tr").data(Q1.PHASES.map(p => F.phase[p.id])).join("tr").attr("tabindex", 0).style("cursor", "pointer")
      .style("background", p => (sp && sp.id === p.id ? "var(--btn)" : null))
      .on("click", (e, p) => { stop(); setStep(steps.find(s => s.ph === p.id).id); render(); })
      .on("keydown", (e, p) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); stop(); setStep(steps.find(s => s.ph === p.id).id); render();
        const r = document.querySelector(`#phaseTable tr[data-ph="${p.id}"]`); if (r) r.focus(); } })
      .attr("data-ph", p => p.id)
      .selectAll("td").data(p => [`${Q1.cap(p.long)} (${p.a.label} – ${p.z.label})`, fmt.sp(p.ow), fmt.sp(p.odsp), `${fmt.f1(p.a.iow)} → ${fmt.f1(p.z.iow)}`, `${fmt.f1(p.a.iod)} → ${fmt.f1(p.z.iod)}`, dirOf(p).text])
      .join("td").text(d => d);
  }

  function cards() {
    const P = F.phase;
    const c = [
      { h: "The data support", li: [
        `Before the pandemic ODSP grew far more than OW (${fmt.sp(P.pre.odsp)} vs ${fmt.sp(P.pre.ow)}): net direction ${dirOf(P.pre).text}.`,
        `During the pandemic OW fell to index ${fmt.f1(F.owMin.iow)} (${F.owMin.label}) while ODSP stayed between ${fmt.f1(F.odsp19.lo.iod)} and ${fmt.f1(F.odsp19.hi.iod)}: the path is almost vertical.`,
        `After the pandemic OW grew ${fmt.sp(P.post.ow)} and ODSP ${fmt.sp(P.post.odsp)}, ending at index ${fmt.f1(F.last.iow)} and ${fmt.f1(F.last.iod)}.`] },
      { h: "The data do not show", li: [
        "Why the programs moved differently: the pandemic, CERB, policy or the economy are not measured here.",
        "How many people were helped, or how need changed: cases are not people and are not adjusted for population.",
        "That unemployment drove caseloads: it is shown for context only."] },
      { h: "Worth investigating", li: [
        `Why the path turned from rightward to vertical after ${F.base.label}.`,
        "Whether readers find the path easier or harder than two lines (test with the group before choosing this form)."] },
    ];
    d3.select("#cards").selectAll("div.card").data(c).join("div").attr("class", "card").html(d => `<h3>${d.h}</h3><ul>${d.li.map(l => `<li>${l}</li>`).join("")}</ul>`);
  }
})();
