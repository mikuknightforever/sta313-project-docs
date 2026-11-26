/* Q2 extra version G — Figure 1a as a spike map: on Part 3's base map, a spike rises from each CMA's centre; its height
   is the gap (gap-size mode) or an arrow shows the change against a year earlier (change mode: up = wider, down =
   narrower). The CMA shapes are drawn in one neutral colour (location only), so area carries no data.
   Everything else (data, outlook, card, Figure 2, tables) is the shared map-lab engine (shared/q2-maplab.js). */
(() => {
  "use strict";
  let M = null;
  MapLab.start({ modes: ["level", "yoy"], fig1: { render, update, note } });

  function render(A) {
    const w = Q2.W("f1");
    if (M && M.w === w && M.mode === A.S.mode && M.theme === document.documentElement.dataset.theme) return;
    const G = A.mapGeom(w), n = G.n;
    const svg = Q2.svgIn("f1", w, G.h, A.S.mode === "yoy" ? "Map of the 15 CMAs with arrows for the change in the gap against a year earlier" : "Map of the 15 CMAs with spikes for the gap");
    svg.attr("role", "group");
    A.hatch(svg);
    svg.append("clipPath").attr("id", "gclip").append("rect").attr("width", w).attr("height", G.h0);
    const base = svg.append("g").attr("clip-path", "url(#gclip)");
    base.append("path").datum(A.OUTLINE).attr("d", G.path).style("fill", "var(--land)").style("stroke", "var(--land-line)").style("stroke-width", .8);
    base.append("g").selectAll("path").data(G.south).join("path").attr("class", "base-cma").attr("data-id", f => f.properties.cma_code).attr("d", G.path);
    const ins = A.drawInset(svg, G, "base-cma");
    const yoy = A.S.mode === "yoy", Hmax = Math.max(46, Math.min(110, G.h0 * 0.24));
    const ky = Hmax / 40, kc = (Hmax * 0.5) / 6;            // px per pp: gap (0–40 pp) and change (±6 pp)
    const anchors = A.DATA.CMAS.map(c => { const tb = c.id === A.TB, [x, y] = (tb ? G.ipath : G.path).centroid(G.feats.get(c.id)); return { id: c.id, tb, x, y }; });
    // legend: reference spikes or arrows, bottom right (New York State is empty)
    const lgW = 132, lgH = yoy ? 104 : Math.round(30 * ky + 44), lg = { x: w - lgW - 6, y: G.h0 - lgH - 6, w: lgW, h: lgH };
    const lgg = svg.append("g").attr("class", "lg").attr("transform", `translate(${lg.x},${lg.y})`);
    lgg.append("rect").attr("class", "lg-box").attr("width", lg.w).attr("height", lg.h).attr("rx", 4);
    if (!yoy) {
      lgg.append("text").attr("class", "lbl").attr("x", 8).attr("y", 15).style("font-size", "10.5px").text("Spike height = gap");
      [10, 20, 30].forEach((v, i) => { const x0 = 22 + i * 38, y0 = lg.h - 16;
        lgg.append("path").attr("d", `M${x0 - 5},${y0}L${x0},${y0 - v * ky}L${x0 + 5},${y0}Z`).style("fill", `var(--h${A.clsOf(v)})`).style("stroke", "var(--ink2)").style("stroke-width", .7);
        lgg.append("text").attr("class", "lbl").attr("x", x0).attr("y", y0 + 12).attr("text-anchor", "middle").style("font-size", "10px").text(`${v} pp`); });
    } else {
      lgg.append("text").attr("class", "lbl").attr("x", 8).attr("y", 15).style("font-size", "10.5px").text("Against a year earlier");
      [[-3, "−3"], [-1, "−1"], [1, "+1"], [3, "+3"]].forEach(([v, l], i) => { const x0 = 20 + i * 30, y0 = 58;
        lgg.append("path").attr("d", arrow(x0, y0, v * kc)).style("fill", `var(--c${A.chgClsOf(v)})`).style("stroke", "var(--ink2)").style("stroke-width", .7);
        lgg.append("text").attr("class", "lbl").attr("x", x0).attr("y", lg.h - 6).attr("text-anchor", "middle").style("font-size", "10px").text(l); });
    }
    // names, placed once, clear of every spike's largest extent, the inset and the legend
    const ext = a => (yoy ? { x: a.x - 7, y: a.y - Hmax * 0.55, w: 14, h: Hmax * 1.1 } : { x: a.x - 7, y: a.y - Hmax, w: 14, h: Hmax });
    const fs = n ? 10.5 : 11.5, meas = svg.append("text").attr("class", "maplbl").style("font-size", fs + "px");
    const nodes = anchors.map(a => { meas.text(A.MAPNAME[a.id] || A.ent(a.id).short); return { ...a, r: 4, tw: meas.node().getComputedTextLength() }; });
    meas.remove();
    const sn = nodes.filter(d => !d.tb), tn = nodes.filter(d => d.tb), obs = [lg].concat(G.inset ? [{ x: G.inset.x - 2, y: G.inset.y - 2, w: G.inset.w + 4, h: G.inset.h + 4 }] : []);
    A.placeLabels(sn, obs.concat(anchors.filter(a => !a.tb).map(ext)), { x0: 2, y0: 2, x1: w - 2, y1: G.h0 - 2 }, fs);
    A.placeLabels(tn, [ext(anchors.find(a => a.tb))], { x0: G.inset.x + 3, y0: G.inset.y + 3, x1: G.inset.x + G.inset.w - 3, y1: G.inset.y + G.inset.h - 28 }, fs);
    const lab = svg.append("g").attr("class", "labels").selectAll("g").data(nodes).join("g").attr("data-id", d => d.id);
    lab.filter(d => d.L.far).append("line").attr("class", "leader").attr("x1", d => d.L.lx1).attr("y1", d => d.L.ly1).attr("x2", d => d.L.lx2).attr("y2", d => d.L.ly2);
    lab.append("text").attr("class", "maplbl").style("font-size", fs + "px").attr("x", d => d.L.tx).attr("y", d => d.L.ty).attr("dy", "0.35em").attr("text-anchor", d => d.L.anchor).text(d => A.MAPNAME[d.id] || A.ent(d.id).short);
    Q2.declutter(lab.select("text").nodes(), 1);
    svg.attr("data-label-overlaps", A.countOverlaps(nodes.filter((d, i) => lab.select("text").nodes()[i].style.display !== "none")));
    // spikes / arrows (+ hatch overlay and outlook whisker); the value of the hovered and selected CMA at the tip
    const sp = svg.append("g").attr("class", "spikes").selectAll("g").data(anchors).join("g").attr("data-id", d => d.id);
    sp.append("line").attr("class", "whisk").style("stroke", "var(--ink)").style("stroke-width", 1.2);
    sp.append("path").attr("class", "mk").attr("data-id", d => d.id);
    sp.append("path").attr("class", "hatchov");
    svg.append("g").attr("class", "tips");
    svg.append("text").attr("class", "olabel").attr("x", w - lgW - 14).attr("y", G.h0 - 10).attr("text-anchor", "end").style("display", "none");
    A.interactive(svg.selectAll("path.base-cma"));
    A.interactive(svg.selectAll("g.spikes g"), false);
    M = { w, mode: A.S.mode, theme: document.documentElement.dataset.theme, svg, G, ky, kc, anchors, yoy };
  }
  function arrow(x, y, d) { // vertical arrow from (x, y), d px up (positive) or down (negative)
    const s = d >= 0 ? -1 : 1, L = Math.abs(d), head = Math.min(7, Math.max(3, L * 0.45)), hw = 6, sw = 2.2;
    if (L < 0.5) return `M${x - 3},${y}L${x + 3},${y}`;
    return `M${x - sw},${y}L${x - sw},${y + s * (L - head)}L${x - hw},${y + s * (L - head)}L${x},${y + s * L}L${x + hw},${y + s * (L - head)}L${x + sw},${y + s * (L - head)}L${x + sw},${y}Z`;
  }
  function update(A) {
    if (!M) return;
    const t = A.S.t, out = A.isOut(t), { svg, ky, kc, yoy } = M;
    svg.selectAll("g.spikes g").each(function (a) {
      const g = d3.select(this), s = A.shown(a.id, t), b = A.band(a.id, t);
      const d = yoy ? (s.none ? `M${a.x - 3},${a.y}L${a.x + 3},${a.y}` : arrow(a.x, a.y, s.v * kc)) : `M${a.x - 5},${a.y}L${a.x},${a.y - s.v * ky}L${a.x + 5},${a.y}Z`;
      g.select("path.mk").attr("d", d).style("fill", A.fillVar(s.c)).attr("data-t", t).attr("data-v", s.txt).attr("data-c", s.c)
        .classed("on", a.id === A.S.sel).classed("hov", a.id === A.S.hover && A.S.hover !== A.S.sel);
      g.select("path.hatchov").attr("d", d).style("display", out ? null : "none");
      g.select("line.whisk").style("display", out && !yoy ? null : "none")
        .attr("x1", a.x + 8).attr("x2", a.x + 8).attr("y1", b ? a.y - b.lo * ky : a.y).attr("y2", b ? a.y - b.hi * ky : a.y);
      if (a.id === A.S.sel || a.id === A.S.hover) g.raise();
    });
    svg.selectAll("path.base-cma").attr("aria-label", function () { return A.aria(this.dataset.id, t); })
      .style("stroke", function () { return this.dataset.id === A.S.sel ? "var(--ink)" : this.dataset.id === A.S.hover ? "var(--ink2)" : null; })
      .style("stroke-width", function () { return this.dataset.id === A.S.sel ? "2.4px" : this.dataset.id === A.S.hover ? "1.8px" : null; });
    // tip values for the selected and hovered CMA
    const tips = [...new Set([A.S.sel, A.S.hover].filter(Boolean))].map(id => { const a = M.anchors.find(x => x.id === id), s = A.shown(id, t);
      const top = yoy ? (s.none ? a.y : a.y - Math.max(0, s.v * kc)) : a.y - s.v * ky; return { id, x: a.x, y: top - 6, txt: yoy && !s.none ? `${s.txt} pp` : s.txt }; });
    svg.select("g.tips").selectAll("text").data(tips, d => d.id).join("text").attr("class", "ann").attr("x", d => d.x).attr("y", d => d.y).attr("text-anchor", "middle").style("font-size", "12px").text(d => d.txt);
    svg.select("text.olabel").style("display", out ? null : "none").text(out ? `OUTLOOK · ${A.ruleOf().label.toUpperCase()} RULE` : "");
  }
  function note(A) {
    return A.S.mode === "yoy"
      ? "Each arrow starts at the centre of its CMA: up = the gap was wider than a year earlier, down = narrower; length = size of the change (the legend shows ±1 and ±3 pp); colour repeats it, lighter = narrowed, darker magenta = widened. The CMA shapes only show location. Thunder Bay is in the inset. In the outlook the change is between projected quarters. Names are shown where they fit."
      : "Each spike rises from the centre of its CMA; its height is the gap on one scale everywhere (the legend shows 10, 20 and 30 pp), and its colour repeats the class. The CMA shapes only show location, so a large CMA does not look more important. In the outlook the spikes are hatched and the thin line beside each spike is its likely range. Thunder Bay is in the inset. Names are shown where they fit.";
  }
})();
