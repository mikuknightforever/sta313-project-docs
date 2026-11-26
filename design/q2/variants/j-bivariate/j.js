/* Q2 extra version J — Figure 1a as a bivariate map: each CMA is filled by one of nine colours from a 3 × 3 key,
   lightness = gap size (under 12 / 12–20 / 20 pp or more) and hue = change against a year earlier (narrowed by 0.5 pp or
   more / within ±0.5 / widened by 0.5 pp or more). ▲ / ▼ on the labels repeat the direction for colour-blind readers.
   Everything else is the shared map-lab engine (shared/q2-maplab.js). */
(() => {
  "use strict";
  let M = null;
  const LV = [12, 20], LV_LAB = ["under 12", "12–20", "20+"], CH_LAB = ["narrowed", "within ±0.5", "widened"];
  MapLab.start({ fig1: { render, update, note, title }, legend });

  const lev = (A, v) => (A.r1(v) < LV[0] ? 0 : A.r1(v) < LV[1] ? 1 : 2);
  const dir = (A, d) => (d === null ? 1 : A.r1(d) <= -0.5 ? 0 : A.r1(d) >= 0.5 ? 2 : 1);
  function legend(A) {
    const cell = k => `<td><i style="background:var(--b${k})"></i></td>`;
    return `<span class="bikey"><table aria-label="Colour key: rows gap size, columns change against a year earlier"><tbody>` +
      [2, 1, 0].map(l => `<tr><th>${LV_LAB[l]}</th>${[0, 1, 2].map(c => cell(l * 3 + c)).join("")}</tr>`).join("") +
      `<tr><th></th>${CH_LAB.map(c => `<th class="col">${c}</th>`).join("")}</tr></tbody></table>` +
      `<span class="bikey-t">rows: gap (pp) · columns: change against a year earlier (▲ widened, ▼ narrowed)</span></span>`;
  }
  function render(A) {
    const w = Q2.W("f1");
    if (M && M.w === w) return;
    const G = A.mapGeom(w), n = G.n;
    const svg = Q2.svgIn("f1", w, G.h, "Map of the 15 CMAs coloured by gap size and its change against a year earlier");
    svg.attr("role", "group");
    A.hatch(svg);
    svg.append("clipPath").attr("id", "jclip").append("rect").attr("width", w).attr("height", G.h0);
    const base = svg.append("g").attr("clip-path", "url(#jclip)");
    base.append("path").datum(A.OUTLINE).attr("d", G.path).style("fill", "var(--land)").style("stroke", "var(--land-line)").style("stroke-width", .8);
    base.append("g").selectAll("path").data(G.south).join("path").attr("class", "mk").attr("data-id", f => f.properties.cma_code).attr("d", G.path);
    base.append("g").selectAll("path").data(G.south).join("path").attr("class", "hatchov").attr("d", G.path);
    const ins = A.drawInset(svg, G, "mk");
    svg.select("g.inset").append("path").datum(G.tbf).attr("class", "hatchov").attr("d", G.ipath);
    svg.append("path").attr("class", "mk hov outl").style("fill", "none").style("pointer-events", "none");
    svg.append("path").attr("class", "mk on outl").style("fill", "none").style("pointer-events", "none");
    const fs = n ? 10.5 : 11.5, meas = svg.append("text").attr("class", "maplbl").style("font-size", fs + "px");
    const nodes = A.DATA.CMAS.map(c => { const tb = c.id === A.TB, [x, y] = (tb ? G.ipath : G.path).centroid(G.feats.get(c.id)); meas.text(`${A.MAPNAME[c.id] || c.short} ▲`); return { id: c.id, tb, x, y, r: 4, tw: meas.node().getComputedTextLength() }; });
    meas.remove();
    A.placeLabels(nodes.filter(d => !d.tb), [{ x: G.inset.x - 2, y: G.inset.y - 2, w: G.inset.w + 4, h: G.inset.h + 4 }], { x0: 2, y0: 2, x1: w - 2, y1: G.h0 - 2 }, fs);
    A.placeLabels(nodes.filter(d => d.tb), [], { x0: G.inset.x + 3, y0: G.inset.y + 3, x1: G.inset.x + G.inset.w - 3, y1: G.inset.y + G.inset.h - 28 }, fs);
    const lab = svg.append("g").attr("class", "labels").selectAll("g").data(nodes).join("g").attr("data-id", d => d.id);
    lab.filter(d => d.L.far).append("line").attr("class", "leader").attr("x1", d => d.L.lx1).attr("y1", d => d.L.ly1).attr("x2", d => d.L.lx2).attr("y2", d => d.L.ly2);
    const tx = lab.append("text").attr("class", "maplbl").style("font-size", fs + "px").attr("x", d => d.L.tx).attr("y", d => d.L.ty).attr("dy", "0.35em").attr("text-anchor", d => d.L.anchor);
    tx.append("tspan").text(d => A.MAPNAME[d.id] || A.ent(d.id).short);
    tx.append("tspan").attr("class", "dir");
    svg.attr("data-label-overlaps", A.countOverlaps(nodes));
    svg.append("text").attr("class", "olabel").attr("x", w - 8).attr("y", 18).attr("text-anchor", "end").style("display", "none");
    A.interactive(svg.selectAll("path.mk:not(.outl)"));
    M = { w, svg, G };
  }
  function update(A) {
    if (!M) return;
    const t = A.S.t, out = A.isOut(t), { svg, G } = M;
    svg.selectAll("path.mk:not(.outl)").each(function () {
      const id = this.dataset.id, v = A.val(id, t), d = A.chg(id, t), k = lev(A, v) * 3 + dir(A, d);
      d3.select(this).style("fill", `var(--b${k})`).attr("data-t", t).attr("data-c", k).attr("data-v", `${A.fmt.f1(v)} / ${d === null ? "—" : A.fmt.spp(d)}`).attr("aria-label", A.aria(id, t));
    });
    svg.selectAll("path.hatchov").style("display", out ? null : "none");
    const pd = id => (id ? (id === A.TB ? G.ipath : G.path)(G.feats.get(id)) : null);
    svg.select("path.outl.hov").attr("d", A.S.hover && A.S.hover !== A.S.sel ? pd(A.S.hover) : null);
    svg.select("path.outl.on").attr("d", pd(A.S.sel));
    svg.selectAll("g.labels g").each(function () { const id = this.dataset.id, d = A.chg(id, t), k = dir(A, d);
      d3.select(this).select("tspan.dir").text(d === null ? "" : k === 2 ? " ▲" : k === 0 ? " ▼" : " •"); d3.select(this).select("text").classed("on", id === A.S.sel); });
    svg.select("text.olabel").style("display", out ? null : "none").text(out ? `OUTLOOK · ${A.ruleOf().label.toUpperCase()} RULE` : "");
  }
  function title(A) { return `Gap size and its change against a year earlier in each CMA, ${A.LAB[A.S.t]}${A.isOut(A.S.t) ? ` (outlook, ${A.ruleOf().label.toLowerCase()} rule)` : ""}`; }
  function note(A) {
    return `Each CMA takes one of nine colours: lighter to darker = a gap under ${LV[0]}, ${LV[0]}–${LV[1]} or ${LV[1]} pp and over; slate, grey or magenta = narrowed by 0.5 pp or more, within ±0.5, or widened by 0.5 pp or more against a year earlier (in each row the widened colour is also a little stronger). ` +
      `▲ / ▼ / • after each name repeat the direction. In the first four quarters there is no earlier year, so the middle column is used. Large CMAs cover more of the map than small ones; Thunder Bay is in the inset.`;
  }
})();
