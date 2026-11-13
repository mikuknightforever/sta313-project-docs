/* Q2 candidate A — ranked dumbbell + linked dual lines with a gap band (the group's agreed baseline). */
(() => {
  "use strict";
  const { fmt } = Q2;
  const SORTS = [{ id: "nar", label: "Narrowed by" }, { id: "g1", label: "Gap at end" }, { id: "name", label: "Name" }];
  const S = { step: 1, i0: 0, i1: 0, sel: "ont", hl: [], sort: "nar" };
  let DATA, F, syncs = [], YDOM, XMAX;

  Q2.load("../../../../").then(d => {
    DATA = d; F = d.F; window.__facts = F;
    S.i1 = Q2.N - 1;
    const U = new URLSearchParams(location.search);
    if (U.has("step")) setStep(+U.get("step"));
    if (U.has("start") || U.has("end") || U.has("period")) { Q2.readPeriod(S, U); if (!U.has("step")) S.step = 0; }
    if (DATA.ALL.some(e => e.id === U.get("cma"))) { S.sel = U.get("cma"); if (!U.has("step")) S.step = 0; }
    if (SORTS.some(s => s.id === U.get("sort"))) S.sort = U.get("sort");
    const cells = DATA.ALL.flatMap(e => e.rows);
    YDOM = [Math.floor(d3.min(cells, r => r.sow) / 10) * 10, Math.ceil(d3.max(cells, r => r.sod) / 10) * 10];
    XMAX = Math.ceil(d3.max(cells, r => r.gap) / 5) * 5;
    Q2.themeButton(render);
    document.getElementById("lead").innerHTML = Q2.lead(F);
    Q2.renderCards(F);
    build(); render(); Q2.onResize(() => { d3.select("#f1").selectAll("*").remove(); render(); });
    document.body.dataset.ready = "1";
  }).catch(Q2.fail);

  function setStep(id) {
    S.step = id; const st = Q2.stepState(F, id);
    if (st) { S.i0 = st.i0; S.i1 = st.i1; S.sel = st.sel; S.hl = st.hl; } else S.hl = [];
  }
  const explore = () => { S.step = 0; S.hl = []; };
  function build() {
    syncs.push(Q2.seg("#stepSeg", Q2.STEPS, s => s.label, s => S.step === s.id, s => { setStep(s.id); render(); }));
    syncs.push(Q2.periodControl(S, () => { explore(); render(); }));
    syncs.push(Q2.seg("#sortSeg", SORTS, s => s.label, s => S.sort === s.id, s => { S.sort = s.id; render(); }));
    document.getElementById("hatchKey").innerHTML = `<svg width="18" height="12"><defs><pattern id="hk" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="5" style="stroke:var(--gap);stroke-width:1.4"/></pattern></defs><rect width="18" height="12" rx="2" style="fill:url(#hk)"/></svg>Gap between them`;
  }
  const pick = id => { S.sel = id; explore(); render(); };
  const sync = () => syncs.forEach(f => f());
  function render() { sync(); story(); fig1(); fig2(); Q2.table(DATA.ALL, S, id => pick(id)); }

  const ent = id => DATA.ALL.find(e => e.id === id);
  function story() {
    const a = Q2.QS[S.i0].label, z = Q2.QS[S.i1].label;
    const hint = {
      1: "In Figure 1 every end dot (●) sits left of its start dot (○). Figure 2 shows Ontario's two lines drawing closer.",
      2: `Figure 1 is sorted by how much the gap narrowed; the top and bottom CMAs are labelled. Figure 2 shows ${ent(S.sel).name}.`,
      3: `Figure 2 shows ${ent(S.sel).name}: both lines rise, and the blue OW line rises more steeply, so the hatched gap thins.`,
      4: `The period is now ${a} → ${z}. A row whose end dot sits right of its start dot widened.`,
    }[S.step];
    document.getElementById("stepText").innerHTML = Q2.story(F, S.step) + (hint ? ` <span class="hint">${hint}</span>` : "");
  }

  function order(R) {
    if (S.sort === "g1") R.sort((p, q) => q.g1 - p.g1);
    if (S.sort === "name") R.sort((p, q) => d3.ascending(p.e.name, q.e.name));
    return R;
  }
  const ROW = 24, cy = i => (i === 0 ? ROW / 2 : 46 + (i - 1) * ROW);

  // Figure 1: ranked dumbbell — start gap (○) and end gap (●) on one common position scale
  function fig1() {
    const w = Q2.W("f1"), n = Q2.narrow() || w < 470, lw = n ? 112 : 190;
    const m = { t: 6, r: 14, b: 40, l: lw }, iw = w - m.l - m.r, ih = cy(15) + ROW / 2 + 4, h = m.t + ih + m.b;
    const R = Q2.ranked(DATA.CMAS, S.i0, S.i1), rank = new Map(R.map((r, i) => [r.e.id, i + 1]));
    const rows = [Q2.sum(DATA.ONT, S.i0, S.i1), ...order([...R])];
    const a = Q2.QS[S.i0].label, z = Q2.QS[S.i1].label;
    document.getElementById("f1Title").textContent = `Gap between the ODSP and OW shares in ${a} (○) and ${z} (●), by CMA, sorted by ${SORTS.find(s => s.id === S.sort).label.toLowerCase()}`;
    document.getElementById("f1Key").innerHTML =
      `<span><svg width="12" height="12"><circle cx="6" cy="6" r="4.5" style="fill:var(--surface);stroke:var(--ink2);stroke-width:2"/></svg>Gap in ${a} (start)</span>` +
      `<span><svg width="12" height="12"><circle cx="6" cy="6" r="5" style="fill:var(--ink)"/></svg>Gap in ${z} (end)</span>` +
      `<span><svg width="22" height="6"><line x1="2" x2="20" y1="3" y2="3" style="stroke:var(--gap);stroke-width:3;stroke-linecap:round"/></svg>Change between them</span>`;
    const x = d3.scaleLinear().domain([0, XMAX]).range([0, iw]);
    const host = d3.select("#f1"); let svg = host.select("svg"), fresh = false;
    if (svg.empty()) {
      fresh = true;
      svg = host.append("svg").attr("role", "img");
      const g = svg.append("g").attr("class", "root");
      g.append("g").attr("class", "grid"); g.append("line").attr("class", "sep"); g.append("g").attr("class", "rows");
      g.append("g").attr("class", "axis x"); g.append("text").attr("class", "lbl xt"); g.append("g").attr("class", "ann");
    }
    svg.attr("width", w).attr("height", h).attr("aria-label", `Ranked dumbbell chart of the gap in ${a} and ${z} for Ontario and 15 CMAs`);
    const g = svg.select("g.root").attr("transform", `translate(${m.l},${m.t})`);
    g.select("g.grid").call(d3.axisBottom(x).ticks(n ? 4 : 8).tickSize(ih).tickFormat("")).attr("transform", "translate(0,0)");
    g.select("line.sep").attr("x1", -lw + 4).attr("x2", iw).attr("y1", ROW + 5).attr("y2", ROW + 5).style("stroke", "var(--axis)");
    g.select("g.axis.x").attr("transform", `translate(0,${ih})`).call(d3.axisBottom(x).ticks(n ? 4 : 8).tickSizeOuter(0));
    g.select("text.xt").attr("x", iw).attr("y", ih + 32).attr("text-anchor", "end").text("Gap: ODSP share − OW share (percentage points)");
    const T = fresh ? 0 : Q2.dur(450), dim = r => S.hl.length && !S.hl.includes(r.e.id) && r.e.id !== S.sel && !r.e.ont;
    const rg = g.select("g.rows").selectAll("g.row").data(rows, r => r.e.id).join(enter => {
      const e = enter.append("g").attr("class", "row").attr("transform", (r, i) => `translate(0,${cy(i)})`);
      e.append("rect").attr("class", "bg").attr("x", -lw).attr("y", -ROW / 2).attr("height", ROW).attr("rx", 4);
      e.append("text").attr("class", "name").attr("x", -8).attr("dy", "0.32em").attr("text-anchor", "end");
      e.append("line").attr("class", "conn").style("stroke", "var(--gap)").style("stroke-width", 3).style("stroke-linecap", "round");
      e.append("circle").attr("class", "s").attr("r", 4.5).style("fill", "var(--surface)").style("stroke", "var(--ink2)").style("stroke-width", 2);
      e.append("circle").attr("class", "e").attr("r", 5).style("fill", "var(--ink)");
      e.append("rect").attr("class", "row-hit").attr("x", -lw).attr("y", -ROW / 2).attr("height", ROW).style("fill", "transparent")
        .attr("tabindex", 0).attr("role", "button");
      return e;
    });
    rg.select("rect.bg").attr("width", lw + iw).style("fill", r => (r.e.id === S.sel ? "var(--btn)" : "transparent"));
    rg.select("text.name").attr("class", r => "name " + (r.e.id === S.sel || r.e.ont ? "lbl-strong" : "lbl")).text(r => (n ? r.e.short : r.e.name))
      .style("font-style", r => (r.e.ont ? "italic" : null));
    rg.transition().duration(T).attr("transform", (r, i) => `translate(0,${cy(i)})`).style("opacity", r => (dim(r) ? 0.32 : 1));
    rg.select("line.conn").transition().duration(T).attr("x1", r => x(r.g0)).attr("x2", r => x(r.g1));
    rg.select("circle.s").transition().duration(T).attr("cx", r => x(r.g0));
    rg.select("circle.e").transition().duration(T).attr("cx", r => x(r.g1));
    rg.select("rect.row-hit").attr("width", lw + iw).attr("data-id", r => r.e.id)
      .attr("aria-label", r => `${r.e.name}: gap ${fmt.f1(r.g0)} in ${a}, ${fmt.f1(r.g1)} in ${z}. Press Enter to show it in Figure 2.`)
      .on("pointermove pointerdown", (e, r) => Q2.showTip(e, `<div class="t">${r.e.name}${r.e.ont ? "" : ` <span class="badge">#${rank.get(r.e.id)} of ${R.length}</span>`}</div>` +
        Q2.tr("OW share", `${fmt.pct(r.a.sow)} → ${fmt.pct(r.z.sow)} (${fmt.spp(r.dOW)})`, "var(--ow)") +
        Q2.tr("ODSP share", `${fmt.pct(r.a.sod)} → ${fmt.pct(r.z.sod)} (${fmt.spp(r.dOD)})`, "var(--odsp)") + Q2.tipPeriod(r) +
        Q2.tr(`Cases, ${z}`, `OW ${fmt.int(r.z.owC)} · ODSP ${fmt.int(r.z.odC)}`)))
      .on("pointerleave", Q2.leave(Q2.hideTip))
      .on("click", (e, r) => pick(r.e.id))
      .on("keydown", (e, r) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(r.e.id); Q2.refocus("#f1 rect.row-hit", r.e.id); } });
    // selective annotations (L6): the most and least narrowing, rows that widened, and the selected row's two values
    const ann = g.select("g.ann"); ann.selectAll("*").remove();
    const pos = new Map(rows.map((r, i) => [r.e.id, i]));
    const notes = [];
    R.forEach((r, k) => {
      let t = null;
      if (r.nar < 0) t = `widened ${fmt.f1(-r.nar)}`;
      else if (k === 0) t = n ? `most · ${fmt.f1(r.nar)}` : `narrowed most · ${fmt.f1(r.nar)} pp`;
      else if (k === R.length - 1) t = n ? `least · ${fmt.f1(r.nar)}` : `least · ${fmt.f1(r.nar)} pp`;
      if (t) notes.push({ r, t });
    });
    const sel = rows.find(r => r.e.id === S.sel);
    const put = (r, t) => {
      const i = pos.get(r.e.id), hi = Math.max(x(r.g0), x(r.g1)), lo = Math.min(x(r.g0), x(r.g1));
      const el = ann.append("text").attr("class", "ann").attr("y", cy(i)).attr("dy", "0.32em").text(t).style("font-weight", 500).style("font-size", "11.5px");
      const tw = el.node().getComputedTextLength();
      if (hi + 9 + tw <= iw) el.attr("x", hi + 9); else if (lo - 9 - tw >= 0) el.attr("x", lo - 9).attr("text-anchor", "end"); else el.remove();
    };
    if (sel) put(sel, `${fmt.f1(sel.g0)} → ${fmt.f1(sel.g1)}`);
    notes.filter(o => o.r.e.id !== S.sel).forEach(o => put(o.r, o.t));
    ann.style("opacity", 0).transition().delay(T).duration(Q2.dur(150)).style("opacity", 1);
  }

  // Figure 2: OW and ODSP shares for the selected area, the gap hatched between them
  function fig2() {
    const e = ent(S.sel), rows = e.rows, n = Q2.narrow() || Q2.W("f2") < 470;
    const w = Q2.W("f2"), m = { t: 14, r: n ? 12 : 78, b: 24, l: 40 }, iw = w - m.l - m.r, h = n ? 250 : 320, ih = h - m.t - m.b;
    document.getElementById("f2Title").textContent = `${e.name}: share of cases that are a single person without children, OW and ODSP, quarterly`;
    const x = d3.scaleTime().domain([rows[0].date, rows[rows.length - 1].date]).range([0, iw]);
    const y = d3.scaleLinear().domain(YDOM).range([ih, 0]);
    const svg = Q2.svgIn("f2", w, h, `Line chart of the OW and ODSP single-person shares for ${e.name}, with the gap between them hatched`);
    Q2.hatch(svg, "hatchA");
    const g = svg.append("g").attr("transform", `translate(${m.l},${m.t})`);
    Q2.covidBand(g, x, ih, true);
    g.append("g").attr("class", "grid").call(d3.axisLeft(y).ticks(5).tickSize(-iw).tickFormat(""));
    g.append("path").datum(rows).attr("d", d3.area().x(r => x(r.date)).y0(r => y(r.sow)).y1(r => y(r.sod))).style("fill", "url(#hatchA)").style("opacity", 0.8);
    g.append("path").datum(rows).attr("class", "ln-odsp").attr("d", d3.line().x(r => x(r.date)).y(r => y(r.sod)));
    g.append("path").datum(rows).attr("class", "ln-ow").attr("d", d3.line().x(r => x(r.date)).y(r => y(r.sow)));
    g.append("g").attr("class", "axis").call(d3.axisLeft(y).ticks(5).tickFormat(v => v + "%").tickSizeOuter(0));
    Q2.timeAxis(g, x, ih);
    const L = rows[rows.length - 1];
    if (!n) {
      const it = [{ y: y(L.sod), t: `ODSP ${fmt.pct(L.sod)}` }, { y: y(L.sow), t: `OW ${fmt.pct(L.sow)}` }].sort((p, q) => p.y - q.y);
      if (it[1].y - it[0].y < 15) it[1].y = it[0].y + 15;
      it.forEach(o => g.append("text").attr("class", "lbl-strong").attr("x", iw + 8).attr("y", o.y).attr("dy", "0.32em").text(o.t));
    }
    // start and end of the selected period: dashed rules + an ink bracket over the gap, labelled with its size
    const s = Q2.sum(e, S.i0, S.i1), xa = x(s.a.date), xz = x(s.z.date), close = xz - xa < 120, placed = [];
    [[s.a, xa, close ? "end" : "start"], [s.z, xz, close ? "start" : "end"]].forEach(([r, px, anc], k) => {
      g.append("line").attr("x1", px).attr("x2", px).attr("y1", 0).attr("y2", ih).style("stroke", "var(--ink2)").style("stroke-dasharray", "3 3");
      g.append("line").attr("x1", px).attr("x2", px).attr("y1", y(r.sod)).attr("y2", y(r.sow)).style("stroke", "var(--ink)").style("stroke-width", 2.5);
      const t = g.append("text").attr("class", "ann").attr("y", (y(r.sod) + y(r.sow)) / 2).attr("dy", "0.32em").text(`${k ? "end" : "start"} gap ${fmt.f1(r.gap)} pp`);
      const tw = t.node().getComputedTextLength(), fits = a => (a === "start" ? px + 6 + tw <= iw - 2 : px - 6 - tw >= 2);
      if (!fits(anc)) anc = anc === "start" ? "end" : "start"; // flip to the side with room
      t.attr("text-anchor", anc).attr("x", px + (anc === "start" ? 6 : -6));
      const b = t.node().getBBox(); // keep the two labels apart
      const o = placed.find(q => b.x < q.x + q.width && b.x + b.width > q.x && b.y < q.y + q.height && b.y + b.height > q.y);
      if (o) t.attr("y", +t.attr("y") + (b.y < o.y ? -(b.y + b.height - o.y + 3) : o.y + o.height - b.y + 3));
      placed.push(t.node().getBBox());
    });
    const verb = s.nar >= 0 ? "narrowed" : "widened", more = Math.abs(s.dOW) >= Math.abs(s.dOD) ? "OW" : "ODSP";
    document.getElementById("f2Read").innerHTML = `<b>${e.name}, ${s.a.label} → ${s.z.label}:</b> OW share ${fmt.pct(s.a.sow)} → ${fmt.pct(s.z.sow)} (${fmt.spp(s.dOW)} pp), ` +
      `ODSP share ${fmt.pct(s.a.sod)} → ${fmt.pct(s.z.sod)} (${fmt.spp(s.dOD)} pp). The gap ${verb} by <b>${fmt.pp(Math.abs(s.nar))}</b> ` +
      `(${fmt.f1(s.g0)} → ${fmt.f1(s.g1)}), mostly through the ${more} share; it widened in ${s.widen} of ${s.steps} quarterly changes.`;
    // crosshair + tooltip (details on demand)
    const rule = g.append("line").attr("y1", 0).attr("y2", ih).style("stroke", "var(--ink2)").style("display", "none");
    const dots = ["sow", "sod"].map(k => g.append("circle").attr("r", 4).style("fill", `var(--${k === "sow" ? "ow" : "odsp"})`).style("stroke", "var(--surface)").style("stroke-width", 2).style("display", "none"));
    const bis = d3.bisector(r => r.date).center;
    const move = function (ev) {
      const r = rows[bis(rows, x.invert(d3.pointer(ev, this)[0]))], px = x(r.date), p = rows[r.i - 1];
      rule.attr("x1", px).attr("x2", px).style("display", null);
      dots[0].attr("cx", px).attr("cy", y(r.sow)).style("display", null); dots[1].attr("cx", px).attr("cy", y(r.sod)).style("display", null);
      Q2.showTip(ev, Q2.tipQuarter(e, r) + (p ? Q2.tr("Since previous quarter", `${r.gap > p.gap ? "widened" : "narrowed"} ${fmt.f1(Math.abs(r.gap - p.gap))} pp`) : "") +
        `<div class="m">${Q2.PH[r.phase] ? Q2.PH[r.phase].long : ""}</div>`);
    };
    g.append("rect").attr("width", iw).attr("height", ih).style("fill", "transparent").on("pointermove pointerdown", move)
      .on("pointerleave", Q2.leave(() => { rule.style("display", "none"); dots.forEach(c => c.style("display", "none")); Q2.hideTip(); }));
  }
})();
