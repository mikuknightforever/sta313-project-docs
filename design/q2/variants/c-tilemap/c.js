/* Q2 candidate C — tile grid map of floating-column small multiples + phase waterfall. */
(() => {
  "use strict";
  const { fmt } = Q2;
  // tile positions (column, row) on a 7 × 4 grid, placed by hand from the 2021 CMA centroids (west → east, north → south)
  const MAP = { 595: [0, 0], 580: [2, 0], 505: [6, 0], 568: [3, 1], 529: [4, 1], 521: [5, 1], 541: [1, 2], 550: [2, 2], 535: [3, 2], 532: [4, 2],
    559: [0, 3], 555: [1, 3], 543: [2, 3], 537: [3, 3], 539: [4, 3], ont: [6, 3] };
  const ARR = [{ id: "map", label: "Map" }, { id: "rank", label: "Ranked by narrowing" }];
  const S = { step: 1, i0: 0, i1: 0, sel: "ont", hl: [], arrange: "map" };
  let DATA, F, syncs = [], YDOM, YEARS;

  Q2.load("../../../../").then(d => {
    DATA = d; F = d.F; window.__facts = F;
    S.i1 = Q2.N - 1;
    const U = new URLSearchParams(location.search);
    if (U.has("step")) setStep(+U.get("step"));
    if (U.has("start") || U.has("end") || U.has("period")) { Q2.readPeriod(S, U); if (!U.has("step")) S.step = 0; }
    if (DATA.ALL.some(e => e.id === U.get("cma"))) { S.sel = U.get("cma"); if (!U.has("step")) S.step = 0; }
    if (ARR.some(a => a.id === U.get("arrange"))) S.arrange = U.get("arrange");
    const cells = DATA.ALL.flatMap(e => e.rows);
    YDOM = [Math.floor(d3.min(cells, r => r.sow) / 10) * 10, Math.ceil(d3.max(cells, r => r.sod) / 10) * 10];
    YEARS = Q2.QS.filter(r => r.quarter === 1).map(r => r.i); // one column per year: the first quarter (2003 Q1 … 2026 Q1)
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
    syncs.push(Q2.seg("#arrSeg", ARR, a => a.label, a => S.arrange === a.id, a => { S.arrange = a.id; render(); }));
    document.getElementById("f1Key").innerHTML =
      `<span><svg width="14" height="26"><rect x="4" y="2" width="6" height="22" style="fill:var(--gap);opacity:.6"/><rect x="4" y="1" width="6" height="2.5" style="fill:var(--odsp)"/><rect x="4" y="22.5" width="6" height="2.5" style="fill:var(--ow)"/></svg>` +
      `One column per year (Q1): top = ODSP share, bottom = OW share, length = gap</span>` +
      `<span><svg width="10" height="26"><rect x="4" y="5" width="2.5" height="16" style="fill:var(--ink)"/></svg>Ink columns: start and end quarter of the selected period</span>` +
      `<span><svg width="14" height="14"><rect width="14" height="14" style="fill:var(--covid)"/></svg>Pandemic</span>` +
      `<span><svg width="20" height="14"><rect x="1" y="1" width="18" height="12" rx="3" style="fill:none;stroke:var(--ink2);stroke-dasharray:3 2"/></svg>Ontario as a whole (reference, not a place)</span>`;
  }
  const pick = id => { S.sel = id; explore(); render(); };
  const sync = () => syncs.forEach(f => f());
  function render() { sync(); story(); fig1(); fig2(); Q2.table(DATA.ALL, S, pick); }

  const ent = id => DATA.ALL.find(e => e.id === id);
  function story() {
    const a = Q2.QS[S.i0].label, z = Q2.QS[S.i1].label;
    const hint = {
      1: "In every tile the last ink column is shorter than the first. Figure 2 splits Ontario's change by period.",
      2: `The four CMAs named above stay bright; switch to "Ranked by narrowing" to see the full order. Figure 2 shows ${ent(S.sel).name}.`,
      3: `In each tile both ends of the columns rise, but the blue (lower) end rises more, so the columns get shorter. Figure 2 shows ${ent(S.sel).name}.`,
      4: `The period is now ${a} → ${z}. Figure 2 shows ${ent(S.sel).name}: its single step goes up.`,
    }[S.step];
    document.getElementById("stepText").innerHTML = Q2.story(F, S.step) + (hint ? ` <span class="hint">${hint}</span>` : "");
  }

  function layout(w) {
    const R = Q2.ranked(DATA.CMAS, S.i0, S.i1), rank = new Map(R.map((r, i) => [r.e.id, i + 1]));
    // 7 columns = the map grid; narrower screens list the tiles in map order on 5 or 3 columns
    const cols = w < 620 ? 3 : w < 900 ? 5 : 7, compact = cols < 7, gap = compact ? 6 : 8, tw = (w - (cols - 1) * gap) / cols;
    const th = cols === 3 ? 132 : Math.max(132, Math.min(158, tw * 1.02)), tight = tw < 130;
    const pos = new Map();
    if (!compact && S.arrange === "map") Object.entries(MAP).forEach(([id, p]) => pos.set(id, p));
    else {
      const order = S.arrange === "map"
        ? Object.keys(MAP).filter(id => id !== "ont").sort((p, q) => MAP[p][1] - MAP[q][1] || MAP[p][0] - MAP[q][0])
        : R.map(r => r.e.id);
      const c = compact ? cols : 5; order.forEach((id, i) => pos.set(id, [i % c, Math.floor(i / c)]));
      pos.set("ont", compact ? [order.length % c, Math.floor(order.length / c)] : [5, 0]);
    }
    const rows = d3.max([...pos.values()], p => p[1]) + 1;
    return { R, rank, tw, th, gap, pos, compact, tight, h: rows * th + (rows - 1) * gap };
  }

  // Figure 1: tile grid map; each tile = one CMA's yearly floating columns (OW share → ODSP share) on a shared scale
  function fig1() {
    const w = Q2.W("f1"), L = layout(w), n = L.compact, a = Q2.QS[S.i0], z = Q2.QS[S.i1];
    document.getElementById("f1Title").textContent = `OW and ODSP single-person shares by year (Q1) in each CMA, 2003–2026; labels give the gap ${a.label} → ${z.label} and the rank by narrowing`;
    document.getElementById("f1Note").textContent = n
      ? `On narrow screens the tiles are listed in map order (north to south, west to east)${S.arrange === "rank" ? "; now ranked by narrowing" : ""}. All tiles share one vertical scale (gridlines at ${gridTicks().join(", ")}%). Tap a tile to see its values and select it.`
      : `${S.arrange === "rank" ? "Tiles are ranked by how much the gap narrowed (left to right, then down); Ontario is shown for reference." : "Tiles are equal in size and placed roughly where each CMA is (Thunder Bay is much farther north-west than shown)."} All tiles share one vertical scale (gridlines at ${gridTicks().join(", ")}%). Hover for values; click a tile to select it.`;
    const host = d3.select("#f1"); let svg = host.select("svg"), fresh = false;
    if (svg.empty()) { fresh = true; svg = host.append("svg").attr("role", "img").attr("width", w).attr("height", L.h); svg.append("g").attr("class", "tiles"); }
    svg.attr("aria-label", `Tile grid map of 15 CMAs and Ontario: yearly OW and ODSP shares, gap ${a.label} to ${z.label}`);
    const T = fresh ? 0 : Q2.dur(500);
    svg.transition().duration(T).attr("height", L.h);
    const tiles = svg.select("g.tiles").selectAll("g.tile").data(DATA.ALL, e => e.id)
      .join(en => en.append("g").attr("class", "tile").attr("tabindex", 0).attr("role", "button")
        .attr("transform", e => { const p = L.pos.get(e.id); return `translate(${p[0] * (L.tw + L.gap)},${p[1] * (L.th + L.gap)})`; }));
    tiles.attr("data-id", e => e.id).transition().duration(T)
      .attr("transform", e => { const p = L.pos.get(e.id); return `translate(${p[0] * (L.tw + L.gap)},${p[1] * (L.th + L.gap)})`; })
      .style("opacity", e => (S.hl.length && !S.hl.includes(e.id) && e.id !== S.sel && !e.ont ? 0.32 : 1));
    tiles.each(function (e) { drawTile(d3.select(this), e, L, L.tight); })
      .attr("aria-label", e => { const s = Q2.sum(e, S.i0, S.i1); return `${e.name}: gap ${fmt.f1(s.g0)} in ${a.label}, ${fmt.f1(s.g1)} in ${z.label}${e.ont ? "" : `, rank ${L.rank.get(e.id)} of 15 by narrowing`}. Press Enter to show it in Figure 2.`; })
      .on("click", (ev, e) => pick(e.id))
      .on("keydown", (ev, e) => { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); pick(e.id); Q2.refocus("#f1 g.tile", e.id); } });
  }
  const gridTicks = () => d3.range(Math.ceil(YDOM[0] / 20) * 20, YDOM[1] + 1, 20);
  function drawTile(g, e, L, n) {
    g.selectAll("*").remove();
    const s = Q2.sum(e, S.i0, S.i1), sel = e.id === S.sel, tw = L.tw, th = L.th;
    g.append("rect").attr("width", tw).attr("height", th).attr("rx", 6).style("fill", sel ? "var(--btn)" : "var(--tile)")
      .style("stroke", sel ? "var(--sel)" : e.ont ? "var(--ink2)" : "var(--ring)").style("stroke-width", sel ? 2 : 1).style("stroke-dasharray", e.ont && !sel ? "4 3" : null);
    const fs = n ? 11 : 12;
    g.append("text").attr("class", "lbl-strong").attr("x", 8).attr("y", 17).style("font-size", fs + "px").style("font-style", e.ont ? "italic" : null).text(e.short);
    g.append("text").attr("class", "lbl").attr("x", tw - 8).attr("y", n ? 33 : 17).attr("text-anchor", "end").style("font-size", "11px").style("fill", "var(--muted)")
      .text(e.ont ? "" : `#${L.rank.get(e.id)}`);
    g.append("text").attr("class", "lbl").attr("x", 8).attr("y", 33).style("font-size", "11.5px")
      .text(`${fmt.f1(s.g0)} → ${fmt.f1(s.g1)}${n ? "" : " pp"}`);
    const cx0 = 8, cx1 = tw - 8, cy0 = 42, cy1 = th - 8;
    const x = d3.scaleTime().domain([Q2.QS[0].date, Q2.QS[Q2.N - 1].date]).range([cx0 + 2, cx1 - 2]);
    const y = d3.scaleLinear().domain(YDOM).range([cy1, cy0]);
    const p = g.append("g");
    const [c0, c1] = [Math.max(+x.domain()[0], +Q2.COVID[0]), Math.min(+x.domain()[1], +Q2.COVID[1])];
    p.append("rect").attr("x", x(c0)).attr("width", x(c1) - x(c0)).attr("y", cy0).attr("height", cy1 - cy0).style("fill", "var(--covid)");
    gridTicks().forEach(v => p.append("line").attr("x1", cx0).attr("x2", cx1).attr("y1", y(v)).attr("y2", y(v)).style("stroke", "var(--grid)"));
    if (S.i0 !== 0 || S.i1 !== Q2.N - 1) p.append("rect").attr("x", x(s.a.date) - 2).attr("width", x(s.z.date) - x(s.a.date) + 4).attr("y", cy0 - 2).attr("height", cy1 - cy0 + 4)
      .style("fill", "var(--sel)").style("fill-opacity", 0.08).style("stroke", "var(--sel)").style("stroke-opacity", 0.5);
    const cw = Math.max(1.5, (cx1 - cx0) / YEARS.length - 1.6);
    YEARS.forEach(i => {
      const r = e.rows[i], px = x(r.date) - cw / 2;
      p.append("rect").attr("x", px).attr("width", cw).attr("y", y(r.sod)).attr("height", y(r.sow) - y(r.sod)).style("fill", "var(--gap)").style("opacity", 0.55);
      p.append("rect").attr("x", px).attr("width", cw).attr("y", y(r.sod) - 1.25).attr("height", 2.5).style("fill", "var(--odsp)");
      p.append("rect").attr("x", px).attr("width", cw).attr("y", y(r.sow) - 1.25).attr("height", 2.5).style("fill", "var(--ow)");
    });
    [s.a, s.z].forEach(r => p.append("rect").attr("x", x(r.date) - 1.25).attr("width", 2.5).attr("y", y(r.sod)).attr("height", y(r.sow) - y(r.sod)).style("fill", "var(--ink)"));
    const hov = p.append("rect").attr("class", "hov").attr("width", cw + 3).attr("y", cy0 - 1).attr("height", cy1 - cy0 + 2).attr("rx", 1.5)
      .style("fill", "none").style("stroke", "var(--ink)").style("display", "none");
    g.append("rect").attr("width", tw).attr("height", th).style("fill", "transparent")
      .on("pointermove pointerdown", function (ev) {
        const mx = d3.pointer(ev, this)[0], i = YEARS[d3.minIndex(YEARS, k => Math.abs(x(e.rows[k].date) - mx))], r = e.rows[i];
        hov.attr("x", x(r.date) - cw / 2 - 1.5).style("display", null);
        Q2.showTip(ev, Q2.tipQuarter(e, r) + `<div class="m">${e.ont ? "Ontario as a whole" : `Rank ${L.rank.get(e.id)} of 15 by narrowing`}, ${s.a.label} → ${s.z.label}:</div>` + Q2.tipPeriod(s));
      })
      .on("pointerleave", Q2.leave(() => { hov.style("display", "none"); Q2.hideTip(); }));
  }

  // Figure 2: waterfall — start gap, the change within each period, end gap (up = widened, down = narrowed)
  function fig2() {
    const e = ent(S.sel), s = Q2.sum(e, S.i0, S.i1), segs = Q2.segments(S.i0, S.i1);
    const w = Q2.W("f2"), n = Q2.narrow() || w < 560, m = { t: 26, r: 10, b: n ? 52 : 40, l: 40 }, iw = w - m.l - m.r, h = n ? 290 : 320, ih = h - m.t - m.b;
    document.getElementById("f2Title").textContent = `${e.name}: the gap at the start, the change within each period, and the gap at the end, ${s.a.label} → ${s.z.label}`;
    const bars = [{ t: "total", lab: ["Start", s.a.label], v0: 0, v1: s.g0, r: s.a }]
      .concat(segs.map(sg => ({ t: "step", ph: sg.ph, lab: [Q2.PH[sg.ph].label, Q2.QS[sg.a].label, `– ${Q2.QS[sg.b].label}`], v0: e.rows[sg.a].gap, v1: e.rows[sg.b].gap, s: Q2.sum(e, sg.a, sg.b) })))
      .concat([{ t: "total", lab: ["End", s.z.label], v0: 0, v1: s.g1, r: s.z }]);
    const x = d3.scaleBand().domain(d3.range(bars.length)).range([0, iw]).padding(0.32);
    const y = d3.scaleLinear().domain([0, Math.ceil(d3.max(DATA.ALL.flatMap(q => q.rows), r => r.gap) / 5) * 5]).range([ih, 0]);
    const svg = Q2.svgIn("f2", w, h, `Waterfall chart of the gap for ${e.name}`), g = svg.append("g").attr("transform", `translate(${m.l},${m.t})`);
    g.append("g").attr("class", "grid").call(d3.axisLeft(y).ticks(5).tickSize(-iw).tickFormat(""));
    g.append("g").attr("class", "axis").call(d3.axisLeft(y).ticks(5).tickSizeOuter(0));
    g.append("text").attr("class", "lbl").attr("x", -m.l + 2).attr("y", -12).style("font-size", "11px").text("Gap, ODSP share − OW share (pp)");
    g.append("line").attr("x1", 0).attr("x2", iw).attr("y1", ih).attr("y2", ih).style("stroke", "var(--axis)");
    bars.forEach((b, i) => {
      const bx = x(i), bw = x.bandwidth(), top = Math.max(b.v0, b.v1), bot = Math.min(b.v0, b.v1);
      if (i < bars.length - 1) { const lvl = b.t === "total" ? b.v1 : b.v1; g.append("line").attr("x1", bx + bw).attr("x2", x(i + 1)).attr("y1", y(lvl)).attr("y2", y(lvl)).style("stroke", "var(--ink2)").style("stroke-dasharray", "3 3"); }
      g.append("rect").attr("x", bx).attr("width", bw).attr("y", y(top)).attr("height", Math.max(1.5, y(bot) - y(top))).attr("rx", 2)
        .style("fill", b.t === "total" ? "var(--gap)" : "var(--gap-soft)").style("stroke", "var(--gap)").style("stroke-width", b.t === "total" ? 0 : 1.2);
      const up = b.v1 > b.v0;
      const txt = b.t === "total" ? (n ? fmt.f1(b.v1) : fmt.pp(b.v1)) : `${up ? "▲" : "▼"}${n ? "" : up ? " widened" : " narrowed"} ${fmt.f1(Math.abs(b.v1 - b.v0))}`;
      g.append("text").attr("class", "ann").attr("x", bx + bw / 2).attr("y", y(top) - 7).attr("text-anchor", "middle").style("font-size", n ? "10.5px" : "12px").text(txt);
      const lt = g.append("text").attr("class", "lbl").attr("text-anchor", "middle").attr("y", ih + 15).style("font-size", n ? "10.5px" : "11.5px");
      (n ? b.lab : [b.lab[0], b.lab.slice(1).join(" ")]).forEach((l, k) => lt.append("tspan").attr("x", bx + bw / 2).attr("dy", k ? "1.2em" : 0).style("font-weight", k ? null : 600).text(l));
      g.append("rect").attr("x", bx - 4).attr("width", bw + 8).attr("y", 0).attr("height", ih).style("fill", "transparent")
        .on("pointermove pointerdown", ev => Q2.showTip(ev, b.t === "total"
          ? Q2.tipQuarter(e, b.r)
          : `<div class="t">${e.name} · ${Q2.PH[b.ph].long}</div><div class="m">${b.s.a.label} → ${b.s.z.label}</div>` +
            Q2.tr("OW share", `${fmt.pct(b.s.a.sow)} → ${fmt.pct(b.s.z.sow)} (${fmt.spp(b.s.dOW)})`, "var(--ow)") +
            Q2.tr("ODSP share", `${fmt.pct(b.s.a.sod)} → ${fmt.pct(b.s.z.sod)} (${fmt.spp(b.s.dOD)})`, "var(--odsp)") + Q2.tipPeriod(b.s)))
        .on("pointerleave", Q2.leave(Q2.hideTip));
    });
    // readout with Ontario's breakdown for context
    const o = Q2.segments(S.i0, S.i1).map(sg => ({ ph: sg.ph, v: DATA.ONT.rows[sg.a].gap - DATA.ONT.rows[sg.b].gap }));
    const parts = segs.map(sg => { const v = e.rows[sg.a].gap - e.rows[sg.b].gap; return `${Q2.PH[sg.ph].long} ${v >= 0 ? "narrowed" : "widened"} ${fmt.f1(Math.abs(v))}`; });
    document.getElementById("f2Read").innerHTML = `<b>${e.name}, ${s.a.label} → ${s.z.label}:</b> gap ${fmt.f1(s.g0)} → ${fmt.f1(s.g1)} pp (${s.nar >= 0 ? "narrowed" : "widened"} ${fmt.f1(Math.abs(s.nar))}); ` +
      parts.join("; ") + "." + (e.ont ? "" : ` <span class="hint">Ontario as a whole: ${o.map(q => `${Q2.PH[q.ph].label.toLowerCase()} ${fmt.spp(-q.v)}`).join(", ")} pp change in the gap.</span>`);
  }
})();
