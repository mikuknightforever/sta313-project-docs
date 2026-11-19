/* Q2 extra version D — two clouds and a zipper.
   Figure 1a: one dot per CMA per year (first quarter) for the OW share (blue) and the ODSP share (orange), packed
   sideways only to avoid overlap (a beeswarm per year). Hovering a dot "zips" that CMA's two dots together: each grey
   tooth is that year's gap. Figure 1b: a fixed analysis card, as in Part 3 (hover = preview, click = select).
   A brushable strip of Ontario's gap sets the period for everything. Figure 2: start → end gap slopes for every CMA.
   Every number is computed here or in shared/q2-common.js from the course CSVs. */
(() => {
  "use strict";
  const { fmt } = Q2;
  const S = { step: 1, i0: 0, i1: 0, sel: "ont", hl: [], hover: null };
  let DATA, F, D, YEARS, YDOM, GDOM, L1 = null;
  const syncs = [];
  const ent = id => DATA.ALL.find(e => e.id === id);

  Q2.load("../../../../").then(d => {
    DATA = d; F = d.F;
    S.i1 = Q2.N - 1;
    D = cloudFacts();
    window.__facts = F; window.__d = D;
    const U = new URLSearchParams(location.search);
    if (U.has("step")) setStep(+U.get("step"));
    if (U.has("start") || U.has("end") || U.has("period")) { Q2.readPeriod(S, U); if (!U.has("step")) S.step = 0; }
    if (DATA.ALL.some(e => e.id === U.get("cma"))) { S.sel = U.get("cma"); if (!U.has("step")) S.step = 0; }
    Q2.themeButton(render);
    document.getElementById("h1").textContent = `Two clouds: OW climbed toward ODSP in ${D.rising === F.n ? "every CMA" : `${D.rising} of ${F.n} CMAs`}`;
    document.getElementById("lead").innerHTML = Q2.lead(F);
    Q2.renderCards(F);
    build(); render();
    Q2.onResize(() => { L1 = null; render(); });
    document.body.dataset.ready = "1";
  }).catch(Q2.fail);

  // ---------- facts only this version uses (the clouds as groups of CMAs) ----------
  function cloudFacts() {
    const C = DATA.CMAS, all = DATA.ALL.flatMap(e => e.rows);
    YEARS = Q2.QS.filter(r => r.quarter === 1).map(r => r.i); // one column per year: its first quarter (2003 Q1 … 2026 Q1)
    YDOM = [Math.floor(d3.min(all, r => r.sow) / 5) * 5, Math.ceil(d3.max(all, r => r.sod) / 5) * 5];
    GDOM = [Math.floor(d3.min(all, r => r.gap) / 5) * 5, Math.ceil(d3.max(all, r => r.gap) / 5) * 5];
    // per quarter: highest OW share and lowest ODSP share among the 15 CMAs ("space between the clouds") and medians
    const space = Q2.QS.map(q => {
      const i = q.i, owHi = d3.greatest(C, c => c.rows[i].sow), odLo = d3.least(C, c => c.rows[i].sod);
      return { i, label: q.label, maxOW: owHi.rows[i].sow, minOD: odLo.rows[i].sod, space: odLo.rows[i].sod - owHi.rows[i].sow,
        owHi: owHi.name, odLo: odLo.name, medOW: d3.median(C, c => c.rows[i].sow), medOD: d3.median(C, c => c.rows[i].sod) };
    });
    const whole = C.map(c => Q2.sum(c, 0, Q2.N - 1));
    return {
      space, nQ: space.length, sep: space.filter(s => s.space > 0).length,
      first: space[YEARS[0]], last: space[YEARS[YEARS.length - 1]], minSpace: d3.least(space, s => s.space),
      rising: whole.filter(s => s.dOW > 0 && s.nar > 0).length,
    };
  }

  function setStep(id) {
    S.step = id; const st = Q2.stepState(F, id);
    if (st) { S.i0 = st.i0; S.i1 = st.i1; S.sel = st.sel; S.hl = st.hl; } else S.hl = [];
  }
  const explore = () => { S.step = 0; S.hl = []; };
  const pick = id => { S.sel = id; S.hover = null; explore(); render(); };
  function setHover(id) { if (S.hover === id) return; S.hover = id; focus1(); card(); focus2(); }

  function build() {
    syncs.push(Q2.seg("#stepSeg", Q2.STEPS, s => s.label, s => S.step === s.id, s => { setStep(s.id); S.hover = null; render(); }));
    syncs.push(Q2.periodControl(S, () => { explore(); render(); }));
    const dot = c => `<svg width="12" height="12"><circle cx="6" cy="6" r="4.5" style="fill:var(--${c});stroke:var(--surface)"/></svg>`;
    document.getElementById("f1Key").innerHTML =
      `<span>${dot("ow")}OW share: one CMA in one year</span><span>${dot("odsp")}ODSP share</span>` +
      `<span><svg width="30" height="22"><path d="M3 4 L27 7 M3 19 L27 14" style="stroke:var(--ink);stroke-width:1.5;fill:none"/>` +
      `<path d="M7 4.5 V18.5 M15 5.5 V16.5 M23 6.5 V15" style="stroke:var(--ink2);stroke-width:1.3"/></svg>Zipper: one CMA's dots joined; each tooth = that year's gap</span>` +
      `<span><svg width="8" height="22"><path d="M4 3 V19" style="stroke:var(--ink);stroke-width:2.6"/></svg>Start and end quarter of the period</span>` +
      `<span><svg width="12" height="12"><circle cx="6" cy="6" r="4" style="fill:var(--surface);stroke:var(--ink);stroke-width:1.5"/></svg>Ontario as a whole (when selected)</span>` +
      `<span><svg width="14" height="14"><rect width="14" height="14" style="fill:var(--covid)"/></svg>Pandemic</span>`;
  }
  const sync = () => syncs.forEach(f => f());
  function render() { sync(); story(); strip(); fig1(); card(); fig2(); Q2.table(DATA.ALL, S, pick); }

  function story() {
    const e = ent(S.sel), a = Q2.QS[S.i0].label, z = Q2.QS[S.i1].label, m = F.odMax;
    const hint = {
      1: `In Figure 1a the blue cloud rises much more than the orange one, so the space between them shrinks from ${fmt.f1(D.first.space)} pp (${D.first.label}) to ${fmt.f1(D.last.space)} pp (${D.last.label}). The zipper with hollow markers is Ontario as a whole.`,
      2: `The zipper is ${e.name}; the other CMAs named above are outlined in Figure 1a and darker in Figure 2.`,
      3: m.dOD > 0 && m.dOW > m.dOD ? `Follow ${e.name}'s zipper: its upper (ODSP) thread rises too, but its lower (OW) thread rises more, so the teeth get shorter.` : `The zipper is ${e.name}.`,
      4: `The period is now ${a} → ${z}. Figure 1b shows ${e.name}${F.durWiden.length && F.durWiden[0].e === e ? `: its "During" bar is on the widened side` : ""}.`,
    }[S.step];
    document.getElementById("stepText").innerHTML = Q2.story(F, S.step) + (hint ? ` <span class="hint">${hint}</span>` : "");
  }

  // ---------- period strip: Ontario's gap, brushable (as Part 3's period selector) ----------
  function strip() {
    const QS = Q2.QS, w = Q2.W("periodStrip"), m = { t: 14, r: 8, b: 20, l: 8 }, h = 70, ih = h - m.t - m.b, iw = w - m.l - m.r;
    const x = d3.scaleBand().domain(QS.map(r => r.i)).range([0, iw]).paddingInner(0), xc = i => x(i) + x.bandwidth() / 2;
    const y = d3.scaleLinear().domain([0, GDOM[1]]).range([ih, 0]);
    const svg = Q2.svgIn("periodStrip", w, h, "Ontario's gap between the ODSP and OW shares, every quarter; drag to choose a period");
    const g = svg.append("g").attr("transform", `translate(${m.l},${m.t})`);
    const pq = QS.filter(r => r.date >= Q2.COVID[0] && r.date <= Q2.COVID[1]);
    g.append("rect").attr("x", x(pq[0].i)).attr("width", x(pq[pq.length - 1].i) + x.bandwidth() - x(pq[0].i)).attr("height", ih).style("fill", "var(--covid)");
    g.append("text").attr("class", "lbl").attr("x", x(pq[0].i) + 3).attr("y", -3).style("font-size", "11px").text("Pandemic");
    const rows = DATA.ONT.rows;
    g.append("path").datum(rows).attr("d", d3.area().x(r => xc(r.i)).y0(ih).y1(r => y(r.gap))).style("fill", "var(--gap-soft)");
    g.append("path").datum(rows).attr("d", d3.line().x(r => xc(r.i)).y(r => y(r.gap))).style("fill", "none").style("stroke", "var(--gap)").style("stroke-width", 1.4);
    const every = w < 520 ? 5 : 2;
    g.append("g").attr("class", "axis").attr("transform", `translate(0,${ih})`)
      .call(d3.axisBottom(x).tickValues(QS.filter(r => r.quarter === 1 && (r.year - 2003) % every === 0).map(r => r.i)).tickFormat(i => QS[i].year).tickSizeOuter(0));
    const brush = d3.brushX().extent([[0, 0], [iw, ih]]).on("end", e => {
      if (!e.sourceEvent) return;
      const c = e.selection ? QS.filter(r => xc(r.i) >= e.selection[0] && xc(r.i) <= e.selection[1]) : [];
      if (c.length < 2) { strip(); return; } // a click or a one-quarter sliver keeps the current period
      S.i0 = c[0].i; S.i1 = c[c.length - 1].i; explore(); S.hover = null; render();
    });
    const bg = g.append("g").attr("class", "brush").call(brush);
    bg.call(brush.move, [x(S.i0), x(S.i1) + x.bandwidth()]);
    bg.selectAll(".selection").style("fill", "var(--sel)").style("fill-opacity", 0.14).style("stroke", "var(--sel)");
  }

  // ---------- Figure 1a: two clouds ----------
  function layout1() {
    const w = Q2.W("f1");
    if (L1 && L1.w === w) return L1;
    const n = w < 560, m = { t: 34, r: n ? 8 : 104, b: 26, l: n ? 32 : 40 }, h = n ? 600 : 540, iw = w - m.l - m.r, ih = h - m.t - m.b;
    const x = d3.scaleBand().domain(YEARS).range([0, iw]).paddingInner(0.04).paddingOuter(0.02);
    const y = d3.scaleLinear().domain(YDOM).range([ih, 0]);
    const xc = i => x(i) + x.bandwidth() / 2, f0 = Q2.QS[YEARS[0]].date;
    // continuous time on the same axis: column centres are each year's first quarter (March)
    const xt = dt => xc(YEARS[0]) + (dt.getFullYear() - f0.getFullYear() + (dt.getMonth() - f0.getMonth()) / 12) * x.step();
    // largest dot radius whose swarm stays inside its own year's column (dots may overlap by up to a fifth of a diameter)
    let r = n ? 3 : 4.2, sw;
    const rMin = n ? 2 : 2.4;
    for (;;) { sw = swarm(x, y, r); if (sw.ok || r <= rMin) break; r = Math.round((r - 0.1) * 10) / 10; }
    const dotBy = new Map(sw.list.map(d => [`${d.e.id}|${d.p}|${d.r.i}`, d]));
    L1 = { w, n, m, h, iw, ih, x, y, xc, xt, r, dots: sw.list, dotBy, del: d3.Delaunay.from(sw.list, d => d.px, d => d.py), fits: sw.ok };
    window.__layout = { r, fits: sw.ok, step: x.step(), maxOff: d3.max(sw.list, d => Math.abs(d.off)) }; // read by the checks
    return L1;
  }
  // beeswarm inside each year's column: height = value; a dot moves sideways (nearest free spot) only to limit overlap
  function swarm(x, y, r) {
    const list = [], half = x.step() / 2 - r * 0.6, gap2 = (2 * r * 0.8) ** 2, step = r * 0.5;
    let ok = true;
    YEARS.forEach(i => ["ow", "od"].forEach(p => {
      const cx = x(i) + x.bandwidth() / 2, placed = [];
      DATA.CMAS.map(e => ({ e, r: e.rows[i], p, v: p === "ow" ? e.rows[i].sow : e.rows[i].sod }))
        .sort((a, b) => a.v - b.v || d3.ascending(a.e.id, b.e.id))
        .forEach(d => {
          d.py = y(d.v);
          let off = 0;
          for (let k = 0; k < 60; k++) {
            const cand = k === 0 ? [0] : [k * step, -k * step];
            const hit = cand.find(o => placed.every(q => (q.off - o) ** 2 + (q.py - d.py) ** 2 >= gap2));
            if (hit !== undefined) { off = hit; break; }
          }
          if (Math.abs(off) > half + 0.01) ok = false;
          d.off = off; d.px = cx + off; placed.push(d); list.push(d);
        });
    }));
    return { list, ok };
  }

  function fig1() {
    const L = layout1(), a = Q2.QS[S.i0], z = Q2.QS[S.i1], whole = S.i0 === 0 && S.i1 === Q2.N - 1;
    document.getElementById("f1Title").textContent = `Share of cases that are a single person without children, OW (blue) and ODSP (orange): every CMA, every year (first quarter), ${Q2.QS[YEARS[0]].year}–${Q2.QS[YEARS[YEARS.length - 1]].year}`;
    document.getElementById("f1Note").textContent =
      `One dot per CMA per year (that year's first quarter). A dot's height is its value; dots in the same year are pushed sideways only so they overlap as little as possible, so sideways position means nothing. ` +
      `Hover or tap a dot to zip that CMA's blue and orange dots together: each grey tooth is its gap that year, and the thick teeth mark the exact start and end quarters of the period (${a.label}, ${z.label}). ` +
      `Ontario as a whole is not one of the dots; select it in Figure 2 or Table 1 to see its zipper with hollow markers. Keyboard: use the names in Figure 2 or the rows in Table 1.`;
    const f = D.first, l = D.last, dOW = l.medOW - f.medOW, dOD = l.medOD - f.medOD;
    document.getElementById("f1Take").innerHTML =
      `<b>The clouds never overlap.</b> In ${D.sep === D.nQ ? `all ${D.nQ}` : `${D.sep} of ${D.nQ}`} quarters the lowest ODSP share among the ${F.n} CMAs was above the highest OW share. ` +
      `The space between the clouds went from ${fmt.f1(f.space)} pp in ${f.label} to ${fmt.f1(l.space)} pp in ${l.label}` +
      (D.minSpace.i !== l.i ? ` (narrowest: ${fmt.f1(D.minSpace.space)} pp in ${D.minSpace.label})` : "") +
      `${dOW > 2 * Math.abs(dOD) ? ", mostly because the OW cloud rose" : ""}: the median CMA's OW share went from ${fmt.pct(f.medOW)} to ${fmt.pct(l.medOW)}, its ODSP share from ${fmt.pct(f.medOD)} to ${fmt.pct(l.medOD)}.`;

    const svg = Q2.svgIn("f1", L.w, L.h, `Two clouds of dots, one column per year ${Q2.QS[YEARS[0]].year} to ${Q2.QS[YEARS[YEARS.length - 1]].year}: OW shares of ${F.n} CMAs in blue below, ODSP shares in orange above; the space between them shrinks from ${fmt.f1(f.space)} to ${fmt.f1(l.space)} percentage points.`);
    const g = svg.append("g").attr("class", "plot").attr("transform", `translate(${L.m.l},${L.m.t})`);
    const bw = L.x.bandwidth();
    // pandemic: the yearly columns whose first quarter falls in it
    const pc = YEARS.filter(i => Q2.QS[i].date >= Q2.COVID[0] && Q2.QS[i].date <= Q2.COVID[1]);
    g.append("rect").attr("x", L.x(pc[0]) - 2).attr("width", L.x(pc[pc.length - 1]) + bw - L.x(pc[0]) + 4).attr("height", L.ih).style("fill", "var(--covid)");
    g.append("text").attr("class", "lbl").attr("x", L.x(pc[0]) - 1).attr("y", -5).style("font-size", "11px").text("Pandemic");
    if (!whole) g.append("rect").attr("x", L.xt(a.date) - bw / 2 - 2).attr("width", L.xt(z.date) - L.xt(a.date) + bw + 4).attr("y", -2).attr("height", L.ih + 4)
      .style("fill", "var(--sel)").style("fill-opacity", 0.07).style("stroke", "var(--sel)").style("stroke-opacity", 0.55);
    const ticks = d3.range(Math.ceil(YDOM[0] / 10) * 10, YDOM[1] + 0.01, 10);
    g.append("g").attr("class", "grid").call(d3.axisLeft(L.y).tickValues(ticks).tickSize(-L.iw).tickFormat(""));
    g.append("g").attr("class", "axis").call(d3.axisLeft(L.y).tickValues(ticks).tickFormat(v => v + "%").tickSizeOuter(0));
    const every = L.n ? 5 : 2;
    g.append("g").attr("class", "axis").attr("transform", `translate(0,${L.ih})`)
      .call(d3.axisBottom(L.x).tickValues(YEARS.filter(i => (Q2.QS[i].year - 2003) % every === 0)).tickFormat(i => Q2.QS[i].year).tickSizeOuter(0));
    g.append("text").attr("class", "lbl").attr("x", -L.m.l).attr("y", -20).style("font-size", "11px").text(L.n ? "Share of cases (%)" : "Share of cases that are a single person without children (%)");

    g.append("g").attr("class", "dots").selectAll("circle").data(L.dots).join("circle")
      .attr("class", d => `dot ${d.p}`).attr("data-id", d => d.e.id).attr("cx", d => d.px).attr("cy", d => d.py).attr("r", L.r);

    // direct labels for the two clouds (no legend lookup needed), placed where no dots are
    const k0 = Math.min(3, YEARS.length - 1), span = YEARS.slice(k0, k0 + 5);
    const odTop = d3.max(span, i => d3.max(DATA.CMAS, c => c.rows[i].sod)), owBot = d3.min(span, i => d3.min(DATA.CMAS, c => c.rows[i].sow));
    g.append("text").attr("class", "plbl").attr("x", L.x(span[0])).attr("y", L.y(odTop) - 9).style("fill", "var(--odsp)").text("ODSP share");
    g.append("text").attr("class", "plbl").attr("x", L.x(span[0])).attr("y", L.y(owBot) + 19).style("fill", "var(--ow)").text("OW share");

    // the space between the clouds at the first and last column
    const gut = g.append("g").attr("class", "gutter");
    [[YEARS[0], f, 1], [YEARS[YEARS.length - 1], l, -1]].forEach(([i, s, side]) => {
      // bracket on the inner edge of the column (clear of the zipper tooth), label just inside the plot
      const bx = side > 0 ? L.x(i) + bw + 1 : L.x(i) - 1, y0 = L.y(s.maxOW), y1 = L.y(s.minOD);
      gut.append("line").attr("x1", bx).attr("x2", bx).attr("y1", y0 - 2).attr("y2", y1 + 2).style("stroke-dasharray", "3 2");
      [y0 - 2, y1 + 2].forEach(yy => gut.append("line").attr("class", "cap").attr("x1", bx - 3).attr("x2", bx + 3).attr("y1", yy).attr("y2", yy));
      const t = gut.append("text").attr("class", "glbl").attr("text-anchor", side > 0 ? "start" : "end").attr("x", bx + side * 5).attr("y", (y0 + y1) / 2 + (side > 0 && !L.n ? -3 : 4));
      t.append("tspan").attr("class", "big").text(`${fmt.f1(s.space)} pp`);
      if (side > 0 && !L.n) t.append("tspan").attr("x", bx + 5).attr("dy", "1.25em").text("between the clouds");
    });

    g.append("g").attr("class", "zips");
    g.append("g").attr("class", "zl");
    // one hit area for the whole plot: the nearest dot (Delaunay) within reach is the one under the pointer
    const near = ev => { const [mx, my] = d3.pointer(ev, g.node()), d = L.dots[L.del.find(mx, my)]; return Math.hypot(d.px - mx, d.py - my) <= Math.max(12, L.r * 3.2) ? d : null; };
    const show = ev => { const d = near(ev); if (!d) { setHover(null); Q2.hideTip(); return; }
      setHover(d.e.id);
      Q2.showTip(ev, Q2.tipQuarter(d.e, d.r) + `<div class="m">${d.p === "ow" ? "Blue dot = OW share" : "Orange dot = ODSP share"} · ${d.e.id === S.sel ? "selected" : "click to select"}</div>`); };
    g.append("rect").attr("class", "hitzone").attr("x", -6).attr("y", -6).attr("width", L.iw + 12).attr("height", L.ih + 12)
      .on("pointermove", show).on("pointerdown", ev => { if (ev.pointerType === "touch") show(ev); })
      .on("click", ev => { const d = near(ev); if (d) pick(d.e.id); })
      .on("pointerleave", Q2.leave(() => { setHover(null); Q2.hideTip(); }));
    focus1();
  }

  // zipper(s) and outlines for the focused CMA — redrawn on hover without rebuilding the clouds
  function focus1() {
    const L = L1, g = d3.select("#f1 g.plot");
    if (!L || g.empty()) return;
    const prev = S.hover && S.hover !== S.sel ? S.hover : null, zid = S.hover || S.sel;
    g.select("g.dots").classed("focus", !!prev);
    g.selectAll("g.dots circle.dot").classed("on", d => d.e.id === zid).classed("hl", d => S.hl.includes(d.e.id) && d.e.id !== zid);
    const gz = g.select("g.zips"); gz.selectAll("*").remove();
    const zl = g.select("g.zl"); zl.selectAll("*").remove();
    if (prev) zipper(gz, ent(S.sel), "ghost", L);
    const e = ent(zid);
    zipper(gz, e, prev ? "prev" : "sel", L);
    if (!L.n) { // name in the right margin, next to the last column
      const li = YEARS[YEARS.length - 1], r = e.rows[li], yy = (L.y(r.sow) + L.y(r.sod)) / 2;
      const t = zl.append("text").attr("class", "zlbl").attr("x", L.iw + 10).attr("y", yy - 3);
      t.append("tspan").text(e.short);
      t.append("tspan").attr("x", L.iw + 10).attr("dy", "1.2em").style("font-weight", 400).style("font-size", "11px").text(`${fmt.f1(r.gap)} pp, ${Q2.QS[li].label}`);
    }
  }
  function zipper(host, e, cls, L) {
    const at = i => {
      const r = e.rows[i];
      if (!e.ont && Q2.QS[i].quarter === 1) { const a = L.dotBy.get(`${e.id}|ow|${i}`), b = L.dotBy.get(`${e.id}|od|${i}`); return { i, xo: a.px, yo: a.py, xd: b.px, yd: b.py }; }
      const xx = L.xt(r.date); return { i, xo: xx, yo: L.y(r.sow), xd: xx, yd: L.y(r.sod) };
    };
    const pts = YEARS.map(at), z = host.append("g").attr("class", "zip " + cls);
    z.selectAll("line.tooth").data(pts).join("line").attr("class", "tooth").attr("x1", p => p.xo).attr("x2", p => p.xd).attr("y1", p => p.yo).attr("y2", p => p.yd);
    z.append("path").attr("class", "thread").attr("d", d3.line()(pts.map(p => [p.xo, p.yo])));
    z.append("path").attr("class", "thread").attr("d", d3.line()(pts.map(p => [p.xd, p.yd])));
    if (cls !== "ghost") [S.i0, S.i1].map(at).forEach(p => z.append("line").attr("class", "tooth end").attr("x1", p.xo).attr("x2", p.xd).attr("y1", p.yo).attr("y2", p.yd));
    if (e.ont) z.selectAll("circle").data(pts.flatMap(p => [[p.xo, p.yo], [p.xd, p.yd]])).join("circle").attr("class", "ont").attr("cx", d => d[0]).attr("cy", d => d[1]).attr("r", L.r);
    else z.selectAll("circle").data(pts.flatMap(p => [["ow", p.xo, p.yo], ["od", p.xd, p.yd]])).join("circle")
      .attr("class", d => `dot ${d[0]} on`).attr("cx", d => d[1]).attr("cy", d => d[2]).attr("r", L.r + 0.6);
  }

  // ---------- Figure 1b: card ----------
  const chg = v => (Math.abs(v) < 0.05 ? "did not change" : `${v > 0 ? "rose" : "fell"} ${fmt.f1(Math.abs(v))} pp`);
  function card() {
    const id = S.hover || S.sel, e = ent(id), preview = !!S.hover && S.hover !== S.sel;
    const s = Q2.sum(e, S.i0, S.i1), R = Q2.ranked(DATA.CMAS, S.i0, S.i1), rank = R.findIndex(r => r.e.id === id) + 1;
    const el = d3.select("#card"); el.selectAll("*").remove();
    el.append("p").attr("class", "mode").text(preview ? "Figure 1b · Preview · click to select" : e.ont ? "Figure 1b · Ontario as a whole (reference)" : "Figure 1b · Selected CMA");
    el.append("h3").text(e.name);
    el.append("p").attr("class", "per").text(`${s.a.label} → ${s.z.label} · ${s.steps} quarterly changes`);
    el.append("dl").attr("class", "stats").html(
      `<dt>Gap</dt><dd>${fmt.f1(s.g0)} → ${fmt.f1(s.g1)} pp</dd>` +
      `<dt>${s.nar >= 0 ? "Narrowed by" : "Widened by"}</dt><dd>${fmt.pp(Math.abs(s.nar))}</dd>` +
      `<dt>Rank by narrowing</dt><dd>${e.ont ? "reference, not ranked" : `${rank} of ${R.length}`}</dd>` +
      `<dt>OW share</dt><dd><i style="background:var(--ow)"></i>${fmt.f1(s.a.sow)} → ${fmt.pct(s.z.sow)} (${fmt.spp(s.dOW)})</dd>` +
      `<dt>ODSP share</dt><dd><i style="background:var(--odsp)"></i>${fmt.f1(s.a.sod)} → ${fmt.pct(s.z.sod)} (${fmt.spp(s.dOD)})</dd>` +
      `<dt>Gap widened in</dt><dd>${s.widen} of ${s.steps} changes</dd>` +
      `<dt>OW cases, ${s.z.label}</dt><dd>${fmt.int(s.z.owC)}</dd><dt>ODSP cases, ${s.z.label}</dt><dd>${fmt.int(s.z.odC)}</dd>`);
    el.append("h4").text(e.ont ? "Gap every quarter (pp)" : "Gap every quarter (pp) · dotted line = Ontario");
    spark(el.append("div").attr("class", "chart spark"), e);
    el.append("h4").text("Change in the gap by period (pp)");
    phaseBars(el.append("div").attr("class", "chart"), e);
    el.append("p").attr("class", "sum").html(`<b>${s.nar >= 0 ? "Narrowed" : "Widened"} by ${fmt.f1(Math.abs(s.nar))} pp:</b> the OW share ${chg(s.dOW)} and the ODSP share ${chg(s.dOD)}.` +
      (s.nar > 0 && s.dOW > 0 && Math.abs(s.dOD) < s.dOW / 4 ? " The change came mostly from the OW share." : ""));
    // the warning's space is always kept at the bottom (hidden when not needed) so the card, and Figure 2 below it, never jump on hover
    const small = !e.ont && s.z.owC < 3000;
    el.append("p").attr("class", "warn").style("visibility", small ? null : "hidden").attr("aria-hidden", small ? null : "true")
      .text(`Small caseload (${fmt.int(s.z.owC)} OW cases in ${s.z.label}): its shares move more from quarter to quarter, so single quarters are less reliable.`);
  }
  function spark(host, e) {
    const w = host.node().clientWidth || 300, h = 104, m = { t: 6, r: 8, b: 18, l: 26 }, iw = w - m.l - m.r, ih = h - m.t - m.b;
    const x = d3.scaleTime().domain([Q2.QS[0].date, Q2.QS[Q2.N - 1].date]).range([0, iw]);
    const y = d3.scaleLinear().domain(GDOM).range([ih, 0]);
    const svg = host.append("svg").attr("width", w).attr("height", h).attr("role", "img").attr("aria-label", `${e.name}: gap between the ODSP and OW shares, every quarter 2003 to 2026`);
    const g = svg.append("g").attr("transform", `translate(${m.l},${m.t})`);
    Q2.covidBand(g, x, ih, false);
    Q2.encl(g, x, Q2.QS[S.i0].date, Q2.QS[S.i1].date, ih);
    const tv = d3.range(Math.ceil(GDOM[0] / 10) * 10, GDOM[1] + 0.01, 10);
    g.append("g").attr("class", "grid").call(d3.axisLeft(y).tickValues(tv).tickSize(-iw).tickFormat(""));
    g.append("g").attr("class", "axis").call(d3.axisLeft(y).tickValues(tv).tickSizeOuter(0)).call(a => a.select(".domain").remove());
    const ln = d3.line().x(r => x(r.date)).y(r => y(r.gap));
    if (!e.ont) g.append("path").datum(DATA.ONT.rows).attr("d", ln).style("fill", "none").style("stroke", "var(--ink2)").style("stroke-width", 1.2).style("stroke-dasharray", "2 3");
    g.append("path").datum(e.rows).attr("d", ln).style("fill", "none").style("stroke", "var(--ink)").style("stroke-width", 1.5);
    Q2.timeAxis(g, x, ih);
  }
  function phaseBars(host, e) {
    const segs = Q2.segments(S.i0, S.i1).map(sg => ({ ...sg, v: e.rows[sg.a].gap - e.rows[sg.b].gap, s: Q2.sum(e, sg.a, sg.b) }));
    // one scale for every area and the same periods, so cards can be compared
    const mx = d3.max(DATA.ALL, q => d3.max(Q2.segments(S.i0, S.i1), sg => Math.abs(q.rows[sg.a].gap - q.rows[sg.b].gap)));
    const M = Math.max(5, Math.ceil(mx / 5) * 5);
    const w = host.node().clientWidth || 300, rowH = 22, m = { t: 18, r: 8, b: 4, l: 56 }, h = m.t + segs.length * rowH + m.b, iw = w - m.l - m.r;
    const x = d3.scaleLinear().domain([-M, M]).range([0, iw]); // right = narrowed (as in candidate B)
    const svg = host.append("svg").attr("width", w).attr("height", h).attr("role", "img").attr("aria-label", `${e.name}: change in the gap in each period`);
    const g = svg.append("g").attr("transform", `translate(${m.l},${m.t})`);
    g.append("text").attr("class", "lbl").attr("x", 0).attr("y", -6).style("font-size", "10.5px").text("← widened");
    g.append("text").attr("class", "lbl").attr("x", iw).attr("y", -6).attr("text-anchor", "end").style("font-size", "10.5px").text("narrowed →");
    g.append("line").attr("x1", x(0)).attr("x2", x(0)).attr("y1", -2).attr("y2", segs.length * rowH).style("stroke", "var(--ink2)");
    segs.forEach((sg, k) => {
      const yy = k * rowH + 3, bh = rowH - 8, v = sg.v;
      const row = g.append("g");
      row.append("title").text(`${Q2.PH[sg.ph].long}: ${Q2.QS[sg.a].label} → ${Q2.QS[sg.b].label}`);
      row.append("text").attr("class", "lbl").attr("x", -m.l).attr("y", yy + bh - 2).style("font-size", "11.5px").text(Q2.PH[sg.ph].label);
      row.append("rect").attr("x", Math.min(x(0), x(v))).attr("width", Math.max(1.5, Math.abs(x(v) - x(0)))).attr("y", yy).attr("height", bh).attr("rx", 2).style("fill", "var(--gap)");
      row.append("text").attr("class", "lbl").attr("x", v >= 0 ? x(0) - 5 : x(0) + 5).attr("text-anchor", v >= 0 ? "end" : "start").attr("y", yy + bh - 2).style("font-size", "11px")
        .text(`${Math.abs(v) < 0.05 ? "no change" : v > 0 ? "narrowed" : "widened"} ${fmt.f1(Math.abs(v))}`);
    });
  }

  // ---------- Figure 2: start → end gap slopes ----------
  function ranks(v) {
    const o = v.map((x, i) => [x, i]).sort((a, b) => a[0] - b[0]), r = new Array(v.length);
    for (let i = 0; i < o.length;) { let j = i; while (j + 1 < o.length && o[j + 1][0] === o[i][0]) j++; for (let k = i; k <= j; k++) r[o[k][1]] = (i + j) / 2 + 1; i = j + 1; }
    return r;
  }
  function spearman(a, b) {
    const ra = ranks(a), rb = ranks(b), ma = d3.mean(ra), mb = d3.mean(rb);
    let sxy = 0, sxx = 0, syy = 0;
    ra.forEach((x, i) => { const dx = x - ma, dy = rb[i] - mb; sxy += dx * dy; sxx += dx * dx; syy += dy * dy; });
    return sxy / Math.sqrt(sxx * syy);
  }
  const rd = v => Math.round(v * 10) / 10; // as displayed (1 dp), so differences match the printed values
  const s2 = v => `${v >= 0 ? "+" : "−"}${Math.abs(v).toFixed(2)}`;
  // spread labels vertically: overlapping labels merge into clusters centred on their points
  function dodge(ts, gap, lo, hi) {
    const ord = ts.map((t, i) => i).sort((a, b) => ts[a] - ts[b] || a - b);
    let cl = ord.map(i => ({ ids: [i], mean: ts[i] }));
    const top = c => c.mean - (c.ids.length - 1) * gap / 2;
    for (let again = true; again;) {
      again = false;
      for (let k = 0; k < cl.length - 1; k++) {
        const A = cl[k], B = cl[k + 1];
        if (top(A) + A.ids.length * gap > top(B) + 1e-9) { const ids = A.ids.concat(B.ids); cl.splice(k, 2, { ids, mean: d3.mean(ids, i => ts[i]) }); again = true; break; }
      }
    }
    const out = new Array(ts.length);
    cl.forEach(c => { const t0 = Math.max(lo, Math.min(top(c), hi - (c.ids.length - 1) * gap)); c.ids.forEach((i, j) => (out[i] = t0 + j * gap)); });
    for (let k = 1; k < ord.length; k++) out[ord[k]] = Math.max(out[ord[k]], out[ord[k - 1]] + gap);
    return out;
  }
  function fig2() {
    const w = Q2.W("f2"), n = w < 560, a = Q2.QS[S.i0], z = Q2.QS[S.i1];
    const m = { t: 40, r: n ? 116 : 160, b: 8, l: n ? 44 : 160 }, h = 460, iw = w - m.l - m.r, ih = h - m.t - m.b;
    document.getElementById("f2Title").textContent = `Every CMA's gap at the start and end of the period, ${a.label} → ${z.label}: the steeper a line falls, the more the gap narrowed`;
    const y = d3.scaleLinear().domain(GDOM).range([ih, 0]);
    const rows = DATA.ALL.map(e => ({ e, s: Q2.sum(e, S.i0, S.i1) }));
    const svg = Q2.svgIn("f2", w, h, `Slope chart: gap between the ODSP and OW shares in ${a.label} and ${z.label} for ${F.n} CMAs and Ontario`);
    const g = svg.append("g").attr("transform", `translate(${m.l},${m.t})`);
    d3.range(Math.ceil(GDOM[0] / 10) * 10, GDOM[1] + 0.01, 10).forEach(v => {
      g.append("line").attr("x1", 0).attr("x2", iw).attr("y1", y(v)).attr("y2", y(v)).style("stroke", "var(--grid)");
      g.append("text").attr("class", "lbl").attr("x", iw / 2).attr("y", y(v) - 3).attr("text-anchor", "middle").style("font-size", "10.5px").style("fill", "var(--muted)").text(`${v} pp`);
    });
    [[0, a.label, "start"], [iw, z.label, "end"]].forEach(([xx, lab, k]) => {
      g.append("line").attr("x1", xx).attr("x2", xx).attr("y1", 0).attr("y2", ih).style("stroke", "var(--axis)");
      g.append("text").attr("class", "lbl-strong").attr("x", xx).attr("y", -24).attr("text-anchor", "middle").text(lab);
      g.append("text").attr("class", "lbl").attr("x", xx).attr("y", -10).attr("text-anchor", "middle").style("font-size", "11px").text(`${k} gap`);
    });
    const lg = 16, ly0 = dodge(rows.map(r => y(r.s.g0)), lg, 6, ih - 4), ly1 = dodge(rows.map(r => y(r.s.g1)), lg, 6, ih - 4);
    const gl = g.append("g"), gt = g.append("g");
    rows.forEach((r, k) => {
      const id = r.e.id, y0 = y(r.s.g0), y1 = y(r.s.g1);
      const ln = gl.append("g").attr("class", "srow").attr("data-id", id);
      ln.append("path").attr("class", "sl" + (r.e.ont ? " ont" : "")).attr("d", `M0,${y0}L${iw},${y1}`);
      ln.append("circle").attr("class", "sdot").attr("cx", 0).attr("cy", y0).attr("r", 2.6);
      ln.append("circle").attr("class", "sdot").attr("cx", iw).attr("cy", y1).attr("r", 2.6);
      // invisible wide stroke so a line is easy to hover
      ln.append("path").attr("d", `M0,${y0}L${iw},${y1}`).style("stroke", "transparent").style("stroke-width", 10).style("fill", "none").style("cursor", "pointer");
      [[-3, y0, -11, ly0[k]], [iw + 3, y1, iw + 11, ly1[k]]].forEach(([x0, ya, x1, yb]) => gt.append("path").attr("class", "lead-ln").attr("data-id", id).attr("d", `M${x0},${ya}L${x1},${yb}`));
      gt.append("text").attr("class", "slbl l" + (r.e.ont ? " ont" : "")).attr("data-id", id).attr("x", -14).attr("y", ly0[k] + 4).attr("text-anchor", "end")
        .text(n ? fmt.f1(r.s.g0) : `${r.e.short} ${fmt.f1(r.s.g0)}`);
      gt.append("text").attr("class", "slbl r" + (r.e.ont ? " ont" : "")).attr("data-id", id).attr("x", iw + 14).attr("y", ly1[k] + 4)
        .attr("tabindex", 0).attr("role", "button")
        .attr("aria-label", `${r.e.name}: gap ${fmt.f1(r.s.g0)} in ${a.label}, ${fmt.f1(r.s.g1)} in ${z.label}, ${r.s.nar >= 0 ? "narrowed" : "widened"} ${fmt.f1(Math.abs(r.s.nar))} percentage points. Press Enter to select it.`)
        .text(`${fmt.f1(r.s.g1)} ${r.e.short}`);
    });
    const hit = sel => sel.on("pointerenter", function () { setHover(this.dataset.id || this.closest("[data-id]").dataset.id); })
      .on("pointerleave", Q2.leave(() => setHover(null)))
      .on("click", function () { pick(this.dataset.id || this.closest("[data-id]").dataset.id); });
    hit(gl.selectAll("g.srow")); hit(gt.selectAll("text.slbl"));
    gt.selectAll("text.slbl.r").on("focus", function () { setHover(this.dataset.id); }).on("blur", () => setHover(null))
      .on("keydown", function (ev) { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); const id = this.dataset.id; pick(id); Q2.refocus("#f2 text.slbl.r", id); } });
    focus2();
    // read-out: spread at start and end, extremes, and whether wide gaps narrowed more
    const R = Q2.ranked(DATA.CMAS, S.i0, S.i1), e0 = d3.extent(R, r => r.g0), e1 = d3.extent(R, r => r.g1);
    const rho = spearman(R.map(r => r.g0), R.map(r => r.nar)), top = R[0], low = R[R.length - 1];
    const nw = r => `${r.nar >= 0 ? "narrowed" : "widened"} ${fmt.f1(Math.abs(r.nar))} pp`;
    document.getElementById("f2Read").innerHTML = `<b>${a.label} → ${z.label}:</b> the ${F.n} CMAs' gaps spanned ${fmt.f1(e0[0])}–${fmt.f1(e0[1])} pp at the start and ${fmt.f1(e1[0])}–${fmt.f1(e1[1])} pp at the end ` +
      `(a range of ${fmt.f1(rd(e0[1]) - rd(e0[0]))} pp, then ${fmt.f1(rd(e1[1]) - rd(e1[0]))} pp). ${top.e.name} ${nw(top)}, the most; ${low.e.name} ${nw(low)}, the least. ` +
      `Rank correlation between the start gap and the narrowing: ${s2(rho)}${Math.abs(rho) >= 0.5 ? (rho > 0 ? ": CMAs with wider gaps at the start narrowed more." : ": CMAs with wider gaps at the start narrowed less.") : "."}`;
    document.getElementById("f2Note").textContent = `Each line joins a CMA's gap in the start quarter (left) and the end quarter (right); dotted = Ontario as a whole. Names are spread out to stay readable; thin leader lines point to the exact value. ` +
      `A gap that starts wide has more room to come down, and single quarters in small CMAs bounce, which adds to any "wide gaps narrowed more" pattern; the chart does not show why any gap changed. Hover a line or name to preview it; click it, or Tab to a name on the right and press Enter, to select it.`;
  }
  function focus2() {
    const prev = S.hover && S.hover !== S.sel ? S.hover : null;
    const cls = id => (id === S.sel ? "on" : id === prev ? "prev" : S.hl.includes(id) ? "hl" : "");
    d3.selectAll("#f2 g.srow").each(function () {
      const id = this.dataset.id, c = cls(id), g = d3.select(this);
      g.select("path.sl").classed("on", c === "on").classed("prev", c === "prev").classed("hl", c === "hl");
      g.selectAll("circle.sdot").classed("on", c === "on").classed("prev", c === "prev").classed("hl", c === "hl");
      if (c) g.raise();
    });
    d3.selectAll("#f2 text.slbl").each(function () { const c = cls(this.dataset.id); d3.select(this).classed("on", c === "on").classed("prev", c === "prev").classed("hl", c === "hl"); });
  }
})();
