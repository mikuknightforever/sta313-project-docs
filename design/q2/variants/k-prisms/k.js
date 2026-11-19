/* Q2 extra version K — Figure 1a as a 3D prism map: Part 3's projection, tilted, with each CMA raised to a height
   proportional to its gap; the top colour shows the gap class or the change against a year earlier. Drawn in SVG with
   the painter's algorithm (back to front), on boundaries simplified to about 1.5 px. A tilt switch includes a flat view.
   Everything else is the shared map-lab engine (shared/q2-maplab.js). */
(() => {
  "use strict";
  let M = null, TILT = 50;
  const TILTS = [{ id: 0, label: "Flat" }, { id: 35, label: "35°" }, { id: 50, label: "50°" }];
  MapLab.start({ modes: ["level", "yoy"], fig1: { render, update, note }, tick: 110 });

  function segDist(p, a, b) { const dx = b[0] - a[0], dy = b[1] - a[1], L = dx * dx + dy * dy; let t = L ? ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L : 0; t = Math.max(0, Math.min(1, t)); return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy); }
  function simplify(pts, tol) { // Douglas–Peucker
    if (pts.length < 4) return pts;
    const keep = new Uint8Array(pts.length); keep[0] = keep[pts.length - 1] = 1;
    const st = [[0, pts.length - 1]];
    while (st.length) { const [a, b] = st.pop(); let mi = -1, md = tol; for (let i = a + 1; i < b; i++) { const d = segDist(pts[i], pts[a], pts[b]); if (d > md) { md = d; mi = i; } } if (mi >= 0) { keep[mi] = 1; st.push([a, mi], [mi, b]); } }
    return pts.filter((p, i) => keep[i]);
  }
  const rings = f => (f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates).map(poly => poly[0]);
  function render(A) {
    const w = Q2.W("f1");
    if (!document.querySelector("#tiltSeg button")) Q2.seg("#tiltSeg", TILTS, d => d.label, d => d.id === TILT, d => { TILT = d.id; M = null; render(A); update(A); document.getElementById("f1Note").textContent = note(A); });
    if (M && M.w === w && M.tilt === TILT) return;
    const G = A.mapGeom(w, { noInset: true }), th = TILT * Math.PI / 180, c = Math.cos(th), s = Math.sin(th);
    const kz = (G.h0 * 0.24) / 40, mt = Math.ceil(kz * 40 * s) + 10, h = Math.ceil(mt + G.h0 * c + 10);
    const P = ([x, y]) => [x, mt + y * c];                      // tilted ground position
    const svg = Q2.svgIn("f1", w, h, "Tilted map of the 15 CMAs raised to a height proportional to the gap");
    svg.attr("role", "group");
    A.hatch(svg);
    // ground: Ontario's outline, tilted
    const ground = d3.geoTransform({ point(x, y) { const p = G.proj([x, y]); if (p) this.stream.point(p[0], mt + p[1] * c); } });
    // (clipped: Ontario's outline runs far past the frame to the north-west and must not cover the controls above)
    svg.append("clipPath").attr("id", "kclip").append("rect").attr("width", w).attr("height", h);
    svg.append("path").datum(A.OUTLINE).attr("d", d3.geoPath(ground)).attr("clip-path", "url(#kclip)").style("pointer-events", "none")
      .style("fill", "var(--land)").style("stroke", "var(--land-line)").style("stroke-width", .8);
    // prisms: simplified rings in screen space; Thunder Bay drawn in a box in the top-left corner (not in position)
    const tbBox = { x: 8, y: mt + 4, w: Math.min(96, w * 0.14), h: Math.min(76, w * 0.11) };
    const tbProj = d3.geoConicConformal().parallels([44, 52]).rotate([89.3, 0]).fitExtent([[tbBox.x + 8, 8], [tbBox.x + tbBox.w - 8, tbBox.h / c - 8]], G.tbf);
    const prisms = A.DATA.CMAS.map(cm => {
      const tb = cm.id === A.TB, pr = tb ? tbProj : G.proj, oy = tb ? tbBox.y - mt : 0;
      const rs = rings(G.feats.get(cm.id)).map(r => simplify(r.map(q => pr(q)).map(([x, y]) => [x, mt + (y + oy) * c]), 1.4)).filter(r => r.length >= 4);
      const all = rs.flat(), cy = d3.mean(all, p => p[1]), cx = d3.mean(all, p => p[0]);
      return { id: cm.id, tb, rs, cx, cy, maxY: d3.max(all, p => p[1]) };
    }).sort((a, b) => a.maxY - b.maxY);                          // back (top of screen) first
    if (TILT === 0) prisms.forEach(p => (p.flat = true));
    svg.append("text").attr("class", "lbl").attr("x", tbBox.x + 2).attr("y", prisms.find(p => p.tb).maxY + 14).style("font-size", "10px").text("Thunder Bay (not to position)");
    const gp = svg.append("g").attr("class", "prisms").selectAll("g").data(prisms).join("g").attr("class", "prism").attr("data-id", d => d.id);
    gp.append("g").attr("class", "walls");
    gp.append("path").attr("class", "mk").attr("data-id", d => d.id);
    gp.append("path").attr("class", "hatchov");
    svg.append("g").attr("class", "plabels");
    svg.append("text").attr("class", "olabel").attr("x", w - 8).attr("y", h - 10).attr("text-anchor", "end").style("display", "none");
    A.interactive(svg.selectAll("g.prism"));
    M = { w, tilt: TILT, svg, prisms, kz, s, h };
  }
  function update(A) {
    if (!M) return;
    const t = A.S.t, out = A.isOut(t), { svg, kz, s } = M;
    svg.selectAll("g.prism").each(function (p) {
      const g = d3.select(this), v = A.val(p.id, t), sh = A.shown(p.id, t), dz = kz * v * s;
      const top = p.rs.map(r => "M" + r.map(q => `${q[0].toFixed(1)},${(q[1] - dz).toFixed(1)}`).join("L") + "Z").join("");
      // walls: every edge of every ring, the lower (nearer) edges last
      const walls = [];
      if (dz > 0.3) p.rs.forEach(r => { for (let i = 0; i < r.length - 1; i++) { const a = r[i], b = r[i + 1]; walls.push({ y: Math.max(a[1], b[1]), d: `M${a[0].toFixed(1)},${a[1].toFixed(1)}L${b[0].toFixed(1)},${b[1].toFixed(1)}L${b[0].toFixed(1)},${(b[1] - dz).toFixed(1)}L${a[0].toFixed(1)},${(a[1] - dz).toFixed(1)}Z` }); } });
      walls.sort((x, y) => x.y - y.y);
      g.select("g.walls").selectAll("path").data(walls).join("path").attr("class", "wall").attr("d", d => d.d);
      g.select("path.mk").attr("d", top).style("fill", A.fillVar(sh.c)).attr("data-t", t).attr("data-v", sh.txt).attr("data-c", sh.c).attr("data-h", A.fmt.f1(v))
        .classed("on", p.id === A.S.sel).classed("hov", p.id === A.S.hover && A.S.hover !== A.S.sel);
      g.select("path.hatchov").attr("d", top).style("display", out ? null : "none");
      g.attr("aria-label", A.aria(p.id, t));
      p.top = p.cy - dz;
    });
    // labels: selected and hovered first, then the rest where they fit (hidden if they would overlap)
    const order = M.prisms.slice().sort((a, b) => (b.id === A.S.sel) - (a.id === A.S.sel) || (b.id === A.S.hover) - (a.id === A.S.hover) || a.top - b.top);
    const lab = svg.select("g.plabels").selectAll("text").data(order, d => d.id).join("text").attr("class", d => "maplbl" + (d.id === A.S.sel ? " on" : ""))
      .attr("x", d => d.cx).attr("y", d => d.top - 4).attr("text-anchor", "middle").style("font-size", "11px").style("display", null)
      .text(d => `${A.MAPNAME[d.id] || A.ent(d.id).short}${d.id === A.S.sel || d.id === A.S.hover ? ` ${A.shown(d.id, t).txt}` : ""}`);
    lab.order();
    Q2.declutter(lab.nodes(), 1);
    svg.select("text.olabel").style("display", out ? null : "none").text(out ? `OUTLOOK · ${A.ruleOf().label.toUpperCase()} RULE` : "");
  }
  function note(A) {
    return `Each CMA is raised to a height proportional to its gap (the same scale everywhere); the top colour shows ${A.S.mode === "yoy" ? "the change against a year earlier (lighter = narrowed, darker magenta = widened)" : "the gap class"}. ` +
      `Boundaries are simplified to about 1.5 px. 3D makes heights hard to compare and can hide a block behind a taller one: use Flat, the card, Figure 2 or Table 2 for values. ` +
      `Names are shown where they fit; the selected and hovered CMA also show their value. Thunder Bay sits in the top-left corner, not in its true position.${TILT === 0 ? " Flat view: heights are not visible, so read the colours." : ""}`;
  }
})();
