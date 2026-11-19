/* Q2 extra version E — Figure 1, a scroll story with one set of dots in seven scenes (end of file), followed by
   version D's explorer (copied from ../d-clouds/d.js; changes marked "E": no story-step buttons, figure numbers 2a, 2b, 3).
   Version D — two clouds and a zipper.
   Figure 1a: one dot per CMA per year (first quarter) for the OW share (blue) and the ODSP share (orange), packed
   sideways only to avoid overlap (a beeswarm per year). Hovering a dot "zips" that CMA's two dots together: each grey
   tooth is that year's gap. Figure 1b: a fixed analysis card, as in Part 3 (hover = preview, click = select).
   A brushable strip of Ontario's gap sets the period for everything. Figure 2: start → end gap slopes for every CMA.
   Every number is computed here or in shared/q2-common.js from the course CSVs. */
(() => {
  "use strict";
  const { fmt } = Q2;
  const S = { step: 0, i0: 0, i1: 0, sel: "ont", hl: [], hover: null }; // E: no story-step buttons; the scroll story replaces them
  let DATA, F, D, YEARS, YDOM, GDOM, L1 = null;
  const syncs = [];
  const ent = id => DATA.ALL.find(e => e.id === id);

  Q2.load("../../../../").then(d => {
    DATA = d; F = d.F;
    S.i1 = Q2.N - 1;
    D = cloudFacts();
    window.__facts = F; window.__d = D;
    const U = new URLSearchParams(location.search);
    if (U.has("start") || U.has("end") || U.has("period")) { Q2.readPeriod(S, U); if (!U.has("step")) S.step = 0; }
    if (DATA.ALL.some(e => e.id === U.get("cma"))) { S.sel = U.get("cma"); if (!U.has("step")) S.step = 0; }
    Q2.themeButton(render);
    document.getElementById("h1").textContent = `The gap between OW and ODSP narrowed in ${F.allNarrow ? "every CMA" : `${F.nNarrow} of ${F.n} CMAs`}`; // E
    document.getElementById("lead").innerHTML = Q2.lead(F);
    Q2.renderCards(F);
    build(); render(); scInit(); // E: the scroll story
    Q2.onResize(() => { L1 = null; render(); scResize(); });
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
  function render() { sync(); strip(); fig1(); card(); fig2(); Q2.table(DATA.ALL, S, pick); } // E: no story()

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
      `Ontario as a whole is not one of the dots; select it in Figure 3 or Table 1 to see its zipper with hollow markers. Keyboard: use the names in Figure 3 or the rows in Table 1.`;
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
    el.append("p").attr("class", "mode").text(preview ? "Figure 2b · Preview · click to select" : e.ont ? "Figure 2b · Ontario as a whole (reference)" : "Figure 2b · Selected CMA");
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

  // ======================= E: Figure 1, the scroll story — one set of dots, seven scenes =======================
  // A scene changes when its step text crosses a line in the viewport (the middle on desktop, lower on phones, where
  // the text shows below the pinned chart), or with the numbered buttons. Every scene is a complete state, so
  // scrolling back works. The same 720 dots (15 CMAs × 24 years × OW / ODSP) move between scenes: hidden at Ontario's
  // values (scenes 1–2), packed into the two clouds (3, 4, 7), collapsed to each CMA-year's gap (5), then replaced by
  // each CMA's quarterly gap line (5–6).
  const SCN = [
    { id: "start", label: "Ontario at the start" }, { id: "time", label: "Ontario over time" }, { id: "clouds", label: "Every CMA" },
    { id: "moved", label: "Which program moved" }, { id: "gaps", label: "The gaps converged" }, { id: "steady", label: "Not every quarter" },
    { id: "explore", label: "Your turn" }];
  const SC = { k: 0, L: null, ob: null, lock: 0, mode: null };
  const GAPSC = k => k === 4 || k === 5;

  function scInit() {
    d3.select("#scSteps").selectAll("div.step").data(SCN).join("div").attr("class", "step").attr("data-scene", (d, k) => k)
      .html((d, k) => `<div class="step-card"><p class="snum">Scene ${k + 1} of ${SCN.length}</p>${stepText(k)}</div>`);
    d3.select("#scChips").selectAll("button").data(SCN).join("button").attr("type", "button").text((d, k) => k + 1)
      .attr("aria-label", (d, k) => `Scene ${k + 1}: ${d.label}`).attr("title", d => d.label)
      .on("click", (ev, d) => {
        const k = SCN.indexOf(d);
        SC.lock = Date.now() + (Q2.reduced() ? 150 : 1100); // let the scroll finish without stepping through the scenes in between
        // put the step where the observer looks: centred on wide screens; just below the pinned chart on phones
        const el = document.querySelector(`#scSteps .step[data-scene="${k}"]`), phone = window.innerWidth <= 820, r = el.getBoundingClientRect();
        const top = r.top + window.scrollY - (phone ? window.innerHeight * 0.66 : window.innerHeight / 2 - r.height / 2);
        window.scrollTo({ top, behavior: Q2.reduced() ? "auto" : "smooth" });
        scGo(k);
      });
    scLayout(); scGo(0, true); scObserve();
    document.body.dataset.story = "1";
  }
  function scObserve() {
    const mode = window.innerWidth <= 820 ? "phone" : "wide";
    if (SC.ob && SC.mode === mode) return;
    if (SC.ob) SC.ob.disconnect();
    SC.mode = mode;
    const trig = mode === "phone" ? 74 : 50; // % of the viewport height where a step takes over
    SC.ob = new IntersectionObserver(ents => {
      if (Date.now() < SC.lock) return;
      ents.forEach(e => { if (e.isIntersecting) scGo(+e.target.dataset.scene); });
    }, { rootMargin: `-${trig}% 0px -${99 - trig}% 0px` });
    document.querySelectorAll("#scSteps .step").forEach(s => SC.ob.observe(s));
  }
  function scResize() { scLayout(); scGo(SC.k, true); scObserve(); }

  // step texts: every number computed from the CSVs (whole period, Ontario and the 15 CMAs)
  function stepText(k) {
    const o = F.ont, a = o.a, z = o.z, f = D.first, l = D.last, top = F.top, low = F.least;
    const e0 = d3.extent(F.rank, r => r.g0), e1 = d3.extent(F.rank, r => r.g1);
    if (k === 0) return `<h3>Start with Ontario</h3><p>In ${a.label}, <b>${fmt.f1(a.sow)}</b> of every 100 OW cases were a single person without children. In ODSP it was <b>${fmt.f1(a.sod)}</b> of every 100: a gap of <b>${fmt.f1(o.g0)}</b> percentage points.</p>`;
    if (k === 1) {
      const both = o.dOW > 0 && o.dOD > 0;
      return `<h3>${both ? (o.dOW > 2 * o.dOD ? "Both shares rose, OW much more" : "Both shares rose") : "The two shares moved"}</h3>` +
        `<p>By ${z.label} the OW share was <b>${fmt.pct(z.sow)}</b> (${fmt.spp(o.dOW)} pp) and the ODSP share <b>${fmt.pct(z.sod)}</b> (${fmt.spp(o.dOD)} pp). ` +
        `The gap ${o.g1 < o.g0 ? "shrank" : "grew"} to <b>${fmt.f1(o.g1)}</b> pp; the hatched band between the lines is the gap.</p>`;
    }
    if (k === 2) return `<h3>Now every CMA</h3><p>Each dot is one of the ${F.n} CMAs in one year (its first quarter): blue for OW, orange for ODSP. ` +
      (D.sep === D.nQ ? `The two clouds never overlap: in all ${D.nQ} quarters the lowest ODSP share was above the highest OW share. ` : `The clouds were apart in ${D.sep} of ${D.nQ} quarters. `) +
      `The space between them went from <b>${fmt.f1(f.space)}</b> pp to <b>${fmt.f1(l.space)}</b> pp.</p>`;
    if (k === 3) {
      const dO = l.medOW - f.medOW, dD = l.medOD - f.medOD;
      return `<h3>${dO > 2 * Math.abs(dD) ? "The OW cloud did the moving" : "Both clouds moved"}</h3><p>The middle (median) CMA's OW share went from <b>${fmt.pct(f.medOW)}</b> to <b>${fmt.pct(l.medOW)}</b> (${fmt.spp(dO)} pp); ` +
        `its ODSP share from ${fmt.pct(f.medOD)} to ${fmt.pct(l.medOD)} (${fmt.spp(dD)} pp). ` +
        (F.dOW[0] > 0 ? `The OW share rose in every CMA (${fmt.f1(F.dOW[0])}–${fmt.f1(F.dOW[1])} pp); ` : `Across CMAs the OW share changed ${fmt.spp(F.dOW[0])} to ${fmt.spp(F.dOW[1])} pp; `) +
        `the ODSP share changed ${fmt.spp(F.dOD[0])} to ${fmt.spp(F.dOD[1])} pp.</p>`;
    }
    if (k === 4) return `<h3>${F.allNarrow ? "Every gap narrowed, and they converged" : "How the gaps changed"}</h3><p>Each line is one CMA's gap, every quarter; dashed is Ontario. ` +
      `In ${a.label} the gaps spanned ${fmt.f1(e0[0])}–${fmt.f1(e0[1])} pp; by ${z.label}, ${fmt.f1(e1[0])}–${fmt.f1(e1[1])} pp. ` +
      `<b>${top.e.name}</b> narrowed the most (${fmt.f1(top.g0)} → ${fmt.f1(top.g1)}); <b>${low.e.name}</b> the least (${fmt.f1(low.g0)} → ${fmt.f1(low.g1)})${F.endWidest.e === low.e ? " and kept the widest gap" : ""}.</p>`;
    if (k === 5) {
      const s1 = F.segs[1];
      return `<h3>Smaller by the end, not every quarter</h3><p>Each CMA's gap widened in ${F.widen[0]}–${F.widen[1]} of its ${F.steps} quarter-to-quarter changes. ` +
        (F.durWiden.length ? `During the pandemic (${s1.A.label} – ${s1.B.label}) it widened in ${F.durWiden.map(p => `<b>${p.e.name}</b> (${fmt.spp(-p.during)} pp)`).join(" and ")}.`
          : `During the pandemic (${s1.A.label} – ${s1.B.label}) it did not widen in any CMA.`) + `</p>`;
    }
    return `<h3>Your turn</h3><p>Below: every CMA and any period. Hover a dot to zip one CMA's two shares together, click to select it, and drag the strip to change the period.</p><p><a class="go" href="#explore">Go to the explorer ↓</a></p>`;
  }
  function scCaption(k) {
    const a = F.ont.a, z = F.ont.z;
    return [`Ontario as a whole, ${a.label}: share of cases that are a single person without children`,
      `Ontario as a whole, every quarter ${a.label} – ${z.label}; hatched band = the gap`,
      "Every CMA, every year (first quarter): OW shares (blue) and ODSP shares (orange); thin lines = Ontario as a whole",
      "Every CMA, every year: the black lines join the median CMA's share in each year (solid = OW, dashed = ODSP)",
      "Every CMA's gap (ODSP share − OW share), every quarter; dashed = Ontario; grey area = lowest to highest CMA gap",
      "Every CMA's gap, every quarter, with the pandemic highlighted; dashed = Ontario",
      "Every CMA, every year (first quarter): OW shares (blue) and ODSP shares (orange)"][k];
  }

  function scLayout() {
    const host = document.getElementById("scChart");
    d3.select(host).selectAll("*").remove();
    const w = host.clientWidth, h = Math.max(240, host.clientHeight), n = w < 560;
    const m = { t: 24, r: n ? 90 : 132, b: 26, l: n ? 34 : 50 }, iw = w - m.l - m.r, ih = h - m.t - m.b;
    const x = d3.scaleBand().domain(YEARS).range([0, iw]).paddingInner(0.04).paddingOuter(0.02);
    const xc = i => x(i) + x.bandwidth() / 2, f0 = Q2.QS[YEARS[0]].date;
    const xt = dt => xc(YEARS[0]) + (dt.getFullYear() - f0.getFullYear() + (dt.getMonth() - f0.getMonth()) / 12) * x.step();
    const yS = d3.scaleLinear().domain(YDOM).range([ih, 0]), yG = d3.scaleLinear().domain([0, GDOM[1]]).range([ih, 0]);
    let r = n ? 2.4 : 3.4, sw;
    const rMin = n ? 1.6 : 2.2;
    for (;;) { sw = swarm(x, yS, r); if (sw.ok || r <= rMin) break; r = Math.round((r - 0.1) * 10) / 10; }
    SC.L = { w, h, n, m, iw, ih, x, xc, xt, yS, yG, r, dots: sw.list };
    window.__scLayout = { r, fits: sw.ok, w, h };
    scDraw();
  }
  const scLab = (g, x, y, t, cls, anchor) => g.append("text").attr("class", "scl " + (cls || "")).attr("x", x).attr("y", y).attr("text-anchor", anchor || "start").text(t);
  function scBracket(g, x, y0, y1) {
    g.append("path").attr("class", "sc-brk").attr("d", `M${x - 4},${y0}H${x}V${y1}H${x - 4}`);
  }
  function scDraw() {
    const L = SC.L, ONT = DATA.ONT.rows, a = ONT[0], z = ONT[Q2.N - 1], i0 = YEARS[0], i1 = YEARS[YEARS.length - 1], bw = L.x.bandwidth();
    const svg = Q2.svgIn("scChart", L.w, L.h, scCaption(SC.k));
    Q2.hatch(svg, "scHatch");
    const g = svg.append("g").attr("class", "scplot").attr("transform", `translate(${L.m.l},${L.m.t})`);
    const pc = YEARS.filter(i => Q2.QS[i].date >= Q2.COVID[0] && Q2.QS[i].date <= Q2.COVID[1]);
    g.append("rect").attr("class", "sc-covid").attr("x", L.x(pc[0]) - 2).attr("width", L.x(pc[pc.length - 1]) + bw - L.x(pc[0]) + 4).attr("height", L.ih).style("fill", "var(--covid)");
    g.append("rect").attr("class", "sc-covid-q").attr("x", L.xt(Q2.COVID[0])).attr("width", L.xt(Q2.COVID[1]) - L.xt(Q2.COVID[0])).attr("height", L.ih).style("fill", "var(--covid)");
    // two y-axes on the same side: share (scenes 1–4, 7) and gap (scenes 5–6); only one is shown at a time
    const tS = d3.range(Math.ceil(YDOM[0] / 10) * 10, YDOM[1] + 0.01, 10), tG = d3.range(0, GDOM[1] + 0.01, 10);
    g.append("g").attr("class", "grid sc-gS").call(d3.axisLeft(L.yS).tickValues(tS).tickSize(-L.iw).tickFormat(""));
    g.append("g").attr("class", "axis sc-gS").call(d3.axisLeft(L.yS).tickValues(tS).tickFormat(v => v + "%").tickSizeOuter(0));
    g.append("g").attr("class", "grid sc-gG").call(d3.axisLeft(L.yG).tickValues(tG).tickSize(-L.iw).tickFormat(""));
    g.append("g").attr("class", "axis sc-gG").call(d3.axisLeft(L.yG).tickValues(tG).tickFormat(v => (L.n ? v : v + " pp")).tickSizeOuter(0));
    g.append("g").attr("class", "axis sc-gX").attr("transform", `translate(0,${L.ih})`)
      .call(d3.axisBottom(L.x).tickValues(YEARS.filter(i => (Q2.QS[i].year - 2003) % (L.n ? 5 : 3) === 0)).tickFormat(i => Q2.QS[i].year).tickSizeOuter(0));
    scLab(g, -L.m.l, -10, L.n ? "Share of cases (%)" : "Share of cases that are a single person without children (%)", "sc-gS").style("font-size", "11px");
    scLab(g, -L.m.l, -10, L.n ? "Gap (pp)" : "Gap: ODSP share − OW share (percentage points)", "sc-gG").style("font-size", "11px");

    // Ontario: two lines, the hatched gap band, start and end dots
    const go = g.append("g").attr("class", "sc-ont");
    go.append("path").attr("class", "sc-band").datum(ONT).attr("d", d3.area().x(r => L.xt(r.date)).y0(r => L.yS(r.sow)).y1(r => L.yS(r.sod))).style("fill", "url(#scHatch)");
    ["ow", "od"].forEach(p => {
      const ln = go.append("path").attr("class", `sc-ln ${p}`).datum(ONT).attr("d", d3.line().x(r => L.xt(r.date)).y(r => L.yS(p === "ow" ? r.sow : r.sod)));
      const len = ln.node().getTotalLength(); ln.attr("stroke-dasharray", `${len} ${len}`).attr("data-len", len);
      go.append("circle").attr("class", `sc-a ${p}`); go.append("circle").attr("class", `sc-z ${p}`);
    });
    // median CMA in each year
    const gm = g.append("g").attr("class", "sc-med");
    ["ow", "od"].forEach(p => {
      const d = d3.line()(YEARS.map(i => [L.xc(i), L.yS(d3.median(DATA.CMAS, c => (p === "ow" ? c.rows[i].sow : c.rows[i].sod)))]));
      gm.append("path").attr("class", "sc-mhalo").attr("d", d); gm.append("path").attr("class", `sc-mln ${p}`).attr("d", d);
    });
    // the 720 dots
    g.append("g").attr("class", "sc-dots").selectAll("circle").data(L.dots).join("circle").attr("class", d => `scd ${d.p}`).attr("data-id", d => d.e.id);
    // gap lines (every quarter) and the lowest–highest envelope
    const gg = g.append("g").attr("class", "sc-gaps");
    const env = Q2.QS.map(q => ({ date: q.date, lo: d3.min(DATA.CMAS, c => c.rows[q.i].gap), hi: d3.max(DATA.CMAS, c => c.rows[q.i].gap) }));
    gg.append("path").attr("class", "sc-env").datum(env).attr("d", d3.area().x(d => L.xt(d.date)).y0(d => L.yG(d.lo)).y1(d => L.yG(d.hi)));
    const gl = d3.line().x(r => L.xt(r.date)).y(r => L.yG(r.gap));
    gg.selectAll("path.sc-gl.c").data(DATA.CMAS).join("path").attr("class", "sc-gl c").attr("data-id", e => e.id).attr("d", e => gl(e.rows));
    gg.append("path").attr("class", "sc-gl ont").datum(ONT).attr("d", gl);
    gg.append("g").attr("class", "sc-marks");

    // annotations, one group per scene
    const A = SCN.map((s, k) => g.append("g").attr("class", "sc-ann").attr("data-k", k));
    const cx0 = L.iw * 0.42, sub = L.n ? "11px" : "12px";
    // scene 1: the two Ontario values at the start, large
    scLab(A[0], cx0, L.yS(a.sod) - 34, a.label, "yr", "middle");
    scLab(A[0], cx0 + 18, L.yS(a.sod) + 9, fmt.pct(a.sod), "big od"); scLab(A[0], cx0 + 18, L.yS(a.sod) + 32, "ODSP", "").style("font-size", sub);
    scLab(A[0], cx0 + 18, L.yS(a.sow) + 9, fmt.pct(a.sow), "big ow"); scLab(A[0], cx0 + 18, L.yS(a.sow) + 32, "Ontario Works (OW)", "").style("font-size", sub);
    scBracket(A[0], cx0 - 18, L.yS(a.sod) + 6, L.yS(a.sow) - 6);
    scLab(A[0], cx0 - 26, (L.yS(a.sow) + L.yS(a.sod)) / 2 + 4, `gap ${fmt.f1(a.gap)} pp`, "b", "end");
    // scene 2: start values, end values, the gap at both ends (inside the hatched band)
    scLab(A[1], L.xc(i0) - 3, L.yS(a.sow) + 18, fmt.pct(a.sow), "ow").style("font-weight", 650);
    scLab(A[1], L.xc(i0) - 3, L.yS(a.sod) - 10, fmt.pct(a.sod), "od").style("font-weight", 650);
    scLab(A[1], L.iw + 10, L.yS(z.sod) + 4, `${fmt.pct(z.sod)} ODSP`, "od").style("font-weight", 650);
    scLab(A[1], L.iw + 10, L.yS(z.sow) + 4, `${fmt.pct(z.sow)} OW`, "ow").style("font-weight", 650);
    scLab(A[1], L.xc(YEARS[1]), (L.yS(ONT[YEARS[1]].sow) + L.yS(ONT[YEARS[1]].sod)) / 2 + 4, `gap ${fmt.f1(a.gap)} pp`, "b");
    scLab(A[1], L.xt(z.date) - 8, (L.yS(z.sow) + L.yS(z.sod)) / 2 + 4, `${fmt.f1(z.gap)} pp`, "b", "end");
    // scene 3: cloud labels and the space between the clouds at both ends (as Figure 2a)
    const k0 = Math.min(3, YEARS.length - 1), span = YEARS.slice(k0, k0 + 5);
    const odTop = d3.max(span, i => d3.max(DATA.CMAS, c => c.rows[i].sod)), owBot = d3.min(span, i => d3.min(DATA.CMAS, c => c.rows[i].sow));
    scLab(A[2], L.x(span[0]), L.yS(odTop) - 9, "ODSP share", "od").style("font-weight", 650);
    scLab(A[2], L.x(span[0]), L.yS(owBot) + 19, "OW share", "ow").style("font-weight", 650);
    [[YEARS[0], D.first, 1], [YEARS[YEARS.length - 1], D.last, -1]].forEach(([i, s, side]) => {
      const bx = side > 0 ? L.x(i) + bw + 1 : L.x(i) - 1, y0 = L.yS(s.maxOW), y1 = L.yS(s.minOD);
      A[2].append("path").attr("class", "sc-brk").attr("d", `M${bx - 3},${y0 - 2}H${bx + 3}M${bx},${y0 - 2}V${y1 + 2}M${bx - 3},${y1 + 2}H${bx + 3}`).style("stroke-dasharray", "3 2");
      const t = scLab(A[2], bx + side * 5, (y0 + y1) / 2 + (side > 0 && !L.n ? -3 : 4), "", "", side > 0 ? "start" : "end");
      t.append("tspan").attr("class", "b").style("font-weight", 650).style("fill", "var(--ink)").text(`${fmt.f1(s.space)} pp`);
      if (side > 0 && !L.n) t.append("tspan").attr("x", bx + 5).attr("dy", "1.25em").text("between the clouds");
    });
    // scene 4: the median lines, labelled at the right with start → end
    const lastI = YEARS[YEARS.length - 1], firstI = YEARS[0], mO = i => d3.median(DATA.CMAS, c => c.rows[i].sow), mD = i => d3.median(DATA.CMAS, c => c.rows[i].sod);
    const mlab = (v0, v1, y, name, cls) => { const t = scLab(A[3], L.iw + 10, y - 3, name, "b " + cls); t.append("tspan").attr("x", L.iw + 10).attr("dy", "1.2em").style("font-weight", 400).style("fill", "var(--ink2)").text(L.n ? `→ ${fmt.pct(v1)}` : `${fmt.pct(v0)} → ${fmt.pct(v1)}`); };
    mlab(mD(firstI), mD(lastI), L.yS(mD(lastI)), "ODSP median", "od"); mlab(mO(firstI), mO(lastI), L.yS(mO(lastI)), "OW median", "ow");
    // scene 5: spread at both ends; the CMAs that narrowed most and least, labelled at the right
    const e0 = { lo: env[0].lo, hi: env[0].hi }, e1 = { lo: env[env.length - 1].lo, hi: env[env.length - 1].hi };
    scLab(A[4], L.xt(Q2.QS[0].date) + 2, L.yG(e0.hi) - 8, `${fmt.f1(e0.lo)}–${fmt.f1(e0.hi)} pp`, "b");
    scLab(A[4], L.xt(Q2.QS[Q2.N - 1].date), L.yG(e1.lo) + 18, `${fmt.f1(e1.lo)}–${fmt.f1(e1.hi)} pp`, "b", "end");
    const endLabels = (grp, ents, second) => {
      const ys = dodge(ents.map(e => L.yG(e.rows[Q2.N - 1].gap)), 30, 8, L.ih - 24);
      ents.forEach((e, j) => { const t = scLab(grp, L.iw + 10, ys[j] - 3, L.n ? e.short.split("–")[0] : e.short, "b"); t.append("tspan").attr("x", L.iw + 10).attr("dy", "1.2em").style("font-weight", 400).text(second(e)); });
    };
    endLabels(A[4], [F.top.e, F.least.e], e => { const s = Q2.sum(e, 0, Q2.N - 1); return `${fmt.f1(s.g0)} → ${fmt.f1(s.g1)}`; });
    // scene 6: the pandemic, and the CMAs whose gap widened during it (markers at its first and last quarter)
    scLab(A[5], L.xt(Q2.COVID[0]) + 3, 12, "Pandemic", "b");
    const dw = F.durWiden.map(p => p.e), s1 = F.segs[1];
    endLabels(A[5], dw, e => `${fmt.spp(-F.durWiden.find(p => p.e === e).during)} pp${L.n ? "" : " (pandemic)"}`);
    dw.forEach(e => [s1.a, s1.b].forEach(i => A[5].append("circle").attr("class", "sc-mark").attr("cx", L.xt(Q2.QS[i].date)).attr("cy", L.yG(e.rows[i].gap)).attr("r", 3.5)));
    scGo(SC.k, true);
  }

  function scGo(k, instant) {
    const L = SC.L, g = d3.select("#scChart g.scplot");
    SC.k = k;
    if (!L || g.empty()) return;
    const T = instant ? 0 : Q2.dur(750), ONT = DATA.ONT.rows, a = ONT[0], z = ONT[Q2.N - 1], i0 = YEARS[0], i1 = YEARS[YEARS.length - 1], cx0 = L.iw * 0.42;
    const tr = sel => sel.interrupt().transition().duration(T).ease(d3.easeCubicInOut);
    const gapK = GAPSC(k);
    tr(g.selectAll(".sc-gS")).style("opacity", gapK ? 0 : 1);
    tr(g.selectAll(".sc-gG")).style("opacity", gapK ? 1 : 0);
    tr(g.selectAll(".sc-gX")).style("opacity", k === 0 ? 0 : 1);
    // pandemic band: by quarter where lines run every quarter (scenes 2, 5, 6), by yearly column for the clouds (3, 4, 7)
    tr(g.select(".sc-covid")).style("opacity", k === 2 || k === 3 || k === 6 ? 1 : 0);
    tr(g.select(".sc-covid-q")).style("opacity", k === 1 || gapK ? 1 : 0);
    g.select(".sc-covid-q").classed("hot", k === 5);
    // Ontario
    g.selectAll(".sc-a").each(function () {
      const p = this.classList.contains("ow") ? "sow" : "sod";
      tr(d3.select(this)).attr("cx", k === 0 ? cx0 : L.xc(i0)).attr("cy", L.yS(a[p])).attr("r", k === 0 ? 11 : 5).style("opacity", k <= 1 ? 1 : 0);
    });
    g.selectAll(".sc-z").each(function () {
      const p = this.classList.contains("ow") ? "sow" : "sod";
      tr(d3.select(this)).attr("cx", L.xc(i1)).attr("cy", L.yS(z[p])).attr("r", 5).style("opacity", k === 1 ? 1 : 0);
    });
    g.selectAll(".sc-ln").each(function () {
      const len = +this.dataset.len;
      tr(d3.select(this)).duration(k === 1 && !instant ? Q2.dur(1500) : T).attr("stroke-dashoffset", k === 0 ? len : 0)
        .style("opacity", k === 1 ? 1 : k === 2 ? 0.5 : k === 0 ? 1 : 0).style("stroke-width", k === 2 ? "1.4px" : null);
    });
    tr(g.select(".sc-band")).delay(k === 1 && !instant ? Q2.dur(700) : 0).style("opacity", k === 1 ? 1 : 0);
    // dots: hidden at Ontario's values (1–2), clouds (3, 4, 7), each CMA-year's gap (5–6)
    const dots = g.selectAll("circle.scd").classed("g", gapK);
    const pos = d => (k <= 1 ? [L.xc(d.r.i), L.yS(d.p === "ow" ? ONT[d.r.i].sow : ONT[d.r.i].sod)] : gapK ? [L.xc(d.r.i), L.yG(d.r.gap)] : [d.px, d.py]);
    const op = k === 2 || k === 6 ? 0.85 : k === 3 ? 0.35 : 0;
    const t1 = dots.interrupt().transition().duration(T).ease(d3.easeCubicInOut)
      .delay(d => (k === 2 && !instant ? YEARS.indexOf(d.r.i) * Q2.dur(18) : 0))
      .attr("cx", d => pos(d)[0]).attr("cy", d => pos(d)[1]).attr("r", L.r)
      .style("opacity", k === 4 && T ? 0.75 : op);
    if (k === 4 && T) t1.transition().duration(Math.round(T * 0.6)).style("opacity", 0);
    // medians
    tr(g.select(".sc-med")).style("opacity", k === 3 ? 1 : 0);
    // gap lines: after the dots have collapsed onto them
    const hl = k === 4 ? [F.top.e.id, F.least.e.id] : k === 5 ? F.durWiden.map(p => p.e.id) : [];
    g.selectAll("path.sc-gl.c").classed("hl", function () { return hl.includes(this.dataset.id); }).filter(function () { return hl.includes(this.dataset.id); }).raise();
    tr(g.select(".sc-gaps")).delay(k === 4 && T ? Math.round(T * 0.9) : 0).style("opacity", gapK ? 1 : 0);
    tr(g.select(".sc-env")).style("opacity", k === 4 ? 1 : k === 5 ? 0.5 : 0);
    // annotations of this scene only
    g.selectAll("g.sc-ann").each(function () { const on = +this.dataset.k === k; this.dataset.on = on ? "1" : "0"; tr(d3.select(this)).delay(on && T ? Math.round(T * 0.6) : 0).style("opacity", on ? 1 : 0); });
    // chrome
    d3.selectAll("#scChips button").attr("aria-pressed", (d, j) => String(j === k));
    d3.selectAll("#scSteps .step").classed("on", function () { return +this.dataset.scene === k; });
    document.getElementById("scCap").innerHTML = `<b>Figure 1 · scene ${k + 1} of ${SCN.length}.</b> ${scCaption(k)}`;
    d3.select("#scChart svg").attr("aria-label", `Scene ${k + 1}: ${scCaption(k)}`);
    window.__scene = k;
  }
})();
