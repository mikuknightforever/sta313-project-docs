/* Q2 extra version H — Figure 1a as equal hexagons in rough map positions (candidate C's grid, odd rows offset), one per
   CMA. Fill = gap class (gap-size mode) or change against a year earlier (change mode); the number is printed; a small line
   inside each hexagon shows that CMA's whole gap record (and the outlook, dashed) with a dot at the chosen quarter.
   Everything else is the shared map-lab engine (shared/q2-maplab.js). */
(() => {
  "use strict";
  let M = null;
  const GDOM = [5, 40];                                    // the small lines share one scale (pp)
  MapLab.start({ modes: ["level", "yoy"], fig1: { render, update, note } });

  function hexPath(R) { return d3.range(6).map(k => { const a = Math.PI / 180 * (60 * k - 30); return [R * Math.cos(a), R * Math.sin(a)]; }); }
  function render(A) {
    const w = Q2.W("f1");
    if (M && M.w === w) return;
    const n = w < 560, ids = Object.keys(A.TILE), pos = new Map();
    let R, cols;
    if (!n) { cols = 7; R = Math.min(70, (w - 8) / (7.5 * Math.sqrt(3))); ids.forEach(id => pos.set(id, A.TILE[id])); }
    else { cols = 3; R = Math.min(62, (w - 8) / (3.5 * Math.sqrt(3))); ids.slice().sort((p, q) => A.TILE[p][1] - A.TILE[q][1] || A.TILE[p][0] - A.TILE[q][0]).forEach((id, i) => pos.set(id, [i % cols, Math.floor(i / cols)])); }
    const hw = Math.sqrt(3) * R, rows = d3.max([...pos.values()], p => p[1]) + 1, h = Math.ceil((rows - 1) * 1.5 * R + 2 * R + 6);
    const xy = id => { const [c, r] = pos.get(id); return [4 + hw / 2 + (c + (r % 2 ? 0.5 : 0)) * hw, 3 + R + r * 1.5 * R]; };
    const svg = Q2.svgIn("f1", w, h, "Fifteen equal hexagons, one per CMA in rough map positions, each with its gap record");
    svg.attr("role", "group");
    A.hatch(svg);
    const order = ids.slice().sort((p, q) => pos.get(p)[1] - pos.get(q)[1] || pos.get(p)[0] - pos.get(q)[0]);
    const hex = d3.line()(hexPath(R - 1.5)) + "Z", inner = R * 0.78;
    const x = d3.scaleLinear().domain([0, A.NT - 1]).range([-inner, inner]), y = d3.scaleLinear().domain(GDOM).range([R * 0.62, R * 0.08]);
    const g = svg.selectAll("g.hex").data(order).join("g").attr("class", "hex").attr("data-id", id => id).attr("transform", id => `translate(${xy(id)})`);
    g.append("path").attr("class", "mk").attr("data-id", id => id).attr("d", hex);
    g.append("path").attr("class", "hatchov").attr("d", hex);
    g.append("text").attr("class", "hn").attr("text-anchor", "middle").attr("y", -R * 0.5).style("font-size", (n ? 11 : Math.max(10.5, Math.min(12.5, R * 0.19))) + "px").text(id => A.TILENAME[id] || A.ent(id).short);
    g.append("text").attr("class", "hv").attr("text-anchor", "middle").attr("y", -R * 0.08).style("font-size", Math.max(14, Math.min(20, R * 0.3)) + "px");
    g.append("path").attr("class", "spk");
    g.append("path").attr("class", "spk out");
    g.append("circle").attr("class", "spd").attr("r", Math.max(2.5, R * 0.05));
    const top = svg.append("g").attr("class", "outl").style("pointer-events", "none");
    top.append("path").attr("class", "mk hov outl").attr("d", hex).style("fill", "none");
    top.append("path").attr("class", "mk on outl").attr("d", hex).style("fill", "none");
    A.interactive(svg.selectAll("g.hex"));
    M = { w, svg, x, y, R, xy };
  }
  function update(A) {
    if (!M) return;
    const t = A.S.t, out = A.isOut(t), { svg, x, y } = M, yc = v => y(Math.max(GDOM[0], Math.min(GDOM[1], v)));
    svg.selectAll("g.hex").each(function (id) {
      const g = d3.select(this), s = A.shown(id, t), ink = A.inkVar(s.c), e = A.ent(id);
      g.select("path.mk").style("fill", A.fillVar(s.c)).attr("data-t", t).attr("data-v", s.txt).attr("data-c", s.c)
        .classed("on", id === A.S.sel).classed("hov", id === A.S.hover && A.S.hover !== A.S.sel);
      g.select("path.hatchov").style("display", out ? null : "none");
      g.selectAll("text").style("fill", ink);
      g.select("text.hv").text(A.S.mode === "yoy" ? (s.none ? "—" : `${s.txt} ${A.r1(s.v) > 0 ? "▲" : A.r1(s.v) < 0 ? "▼" : ""}`.trim()) : s.txt);
      const data = e.rows.map((r, i) => [x(i), yc(r.gap)]), proj = d3.range(A.NQ - 1, A.NT).map(i => [x(i), yc(A.val(id, i))]);
      g.select("path.spk:not(.out)").attr("d", d3.line()(data)).style("stroke", ink);
      g.select("path.spk.out").attr("d", d3.line()(proj)).style("stroke", ink);
      g.select("circle.spd").attr("cx", x(t)).attr("cy", yc(A.val(id, t))).style("fill", ink);
      g.attr("aria-label", A.aria(id, t));
    });
    const pos = id => (id ? `translate(${M.xy(id)})` : null);
    svg.select("path.outl.hov").attr("transform", pos(A.S.hover && A.S.hover !== A.S.sel ? A.S.hover : null)).style("display", A.S.hover && A.S.hover !== A.S.sel ? null : "none");
    svg.select("path.outl.on").attr("transform", pos(A.S.sel));
  }
  function note(A) {
    return (A.S.mode === "yoy" ? "Each hexagon is filled by the change in its gap against a year earlier (lighter = narrowed, darker magenta = widened; ▲ / ▼ repeat the direction). "
      : "Each hexagon is filled by its gap class and shows the gap in the chosen quarter. ") +
      `Equal hexagons in rough map positions give every CMA the same weight (Thunder Bay is much farther north-west than shown). The small line inside each hexagon is its gap from ${A.LAB[0]} to ${A.LAB[A.NQ - 1]} on one shared scale (${GDOM[0]}–${GDOM[1]} pp), dashed for the outlook, with a dot at the chosen quarter. Hover, tap or Tab to a hexagon for its values; click to follow it in Figure 2.`;
  }
})();
