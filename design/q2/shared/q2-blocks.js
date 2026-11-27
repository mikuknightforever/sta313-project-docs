/* Q2 block versions (L = equal tiles, M = treemap): Figure 1a as isometric blocks, after the "Causes of untimely
   death" graphic a teammate proposed. One encoding per channel (L3: separable channels):
     height     = the gap (pp), on one scale for every block (orthographic view: same value, same pixels);
     top colour = change against a year earlier (the 5-class slate → magenta palette of versions G–K);
     footprint  = L: equal tiles in rough map positions (L7 "equal area + glyphs"; area carries no data)
                  M: average number of single-person cases (OW + ODSP) over 2003 Q1 – 2026 Q1, fixed;
                     CMAs grouped on base slabs by location (L4-1 enclosure, instead of hue);
     side faces = the top colour, darker (shape cue only).
   View: isometric or top view; "Turn 90°" rotates the ground so hidden blocks come into view.
   Everything else is the shared map-lab engine (q2-maplab.js); geometry is ../../shared/iso-blocks.js. */
window.Q2Blocks = kind => {
  "use strict";
  let M = null, VIEW = "iso", TURN = 0, WGT = null;
  const VIEWS = [{ id: "iso", label: "Isometric" }, { id: "top", label: "Top view" }];
  const ZMAX = 40;                                        // height scale domain (pp); the largest gap in the data is 36.0
  const ZK = kind === "tiles" ? 1.05 : 0.30;              // 40 pp = ZK × the ground unit, in pixels
  const RULER = [10, 20, 30];
  const SLAB = 5;                                         // base-slab height (px) under each location group (M)

  function controls(A) {
    if (document.querySelector("#viewSeg button")) return;
    Q2.seg("#viewSeg", VIEWS, d => d.label, d => d.id === VIEW, d => { VIEW = d.id; M = null; render(A); update(A); note2(A); });
    document.getElementById("turnBtn").addEventListener("click", () => { TURN = (TURN + 1) % 4; M = null; render(A); update(A); });
  }
  const note2 = A => { document.getElementById("f1Note").textContent = note(A); };
  const weights = A => new Map(A.DATA.CMAS.map(c => [c.id, d3.mean(c.rows, r => r.owF + r.odF)]));

  function render(A) {
    controls(A);
    const w = Q2.W("f1");
    if (M && M.w === w && M.view === VIEW && M.turn === TURN) return;
    const ids = A.DATA.CMAS.map(c => c.id), n = w < 560, top = VIEW === "top", pad = 10;
    if (!WGT) WGT = weights(A);
    const base = kind === "tiles" ? Iso.tiles(ids) : Iso.treemap(id => WGT.get(id), 1.6, 1);
    const T = Iso.turn(base.boxes, TURN, base.W, base.H), TG = base.groups ? Iso.turn(base.groups, TURN, base.W, base.H).list : [];
    const k0 = (w - 2 * pad) / ((T.W + T.H) * Iso.C30), zmax = top ? 0 : ZK * k0;
    const RB = base.groups && !top ? 70 : 0;              // treemap: a band above the drawing for the scale (back blocks fill the corners)
    const F = Iso.fit(T.W, T.H, w, zmax + (base.groups ? SLAB : 0) + 16 + RB, pad, top);
    const kz = zmax / ZMAX, z0 = base.groups && !top ? SLAB : 0;
    const svg = Q2.svgIn("f1", w, F.h, kind === "tiles" ? "Isometric blocks, one per CMA in rough map positions: height = gap, top colour = change against a year earlier"
      : "Isometric treemap of the 15 CMAs: footprint = average single-person cases, height = gap, top colour = change against a year earlier");
    svg.attr("role", "group");
    A.hatch(svg);
    // ground plate
    const P = F.P, plate = top ? [P(0, 0), P(T.W, 0), P(T.W, T.H), P(0, T.H)] : [P(0, 0, 0), P(T.W, 0, 0), P(T.W, T.H, 0), P(0, T.H, 0)];
    svg.append("path").attr("class", "plate").attr("d", "M" + plate.map(p => p.join(",")).join("L") + "Z");
    // location-group slabs (M)
    const slabs = svg.append("g").attr("class", "slabs");
    Iso.order(TG).forEach(g => { const f = Iso.faces(g, 0, z0, F), s = slabs.append("g").attr("class", "slab").attr("data-group", g.id);
      if (f.left) s.append("path").attr("class", "slab-l").attr("d", f.left); if (f.right) s.append("path").attr("class", "slab-r").attr("d", f.right); s.append("path").attr("class", "slab-t").attr("d", f.top); });
    // blocks, back to front
    const blocks = svg.append("g").attr("class", "blocks").selectAll("g.blk").data(Iso.order(T.list), d => d.id).join("g").attr("class", "blk").attr("data-id", d => d.id);
    blocks.append("path").attr("class", "wall wall-l"); blocks.append("path").attr("class", "wall wall-r");
    blocks.append("path").attr("class", "mk").attr("data-id", d => d.id); blocks.append("path").attr("class", "hatchov");
    // overlays: outlines of the hovered and selected tops, drawn above every block
    svg.append("path").attr("class", "mk hov outl").style("fill", "none").style("pointer-events", "none");
    svg.append("path").attr("class", "mk on outl").style("fill", "none").style("pointer-events", "none");
    svg.append("g").attr("class", "blabels");
    // group names (M): every strip reaches one front edge of the plate; the name sits just outside that edge
    const glab = svg.append("g").attr("class", "glabels").selectAll("text").data(TG).join("text").attr("class", "glbl").each(function (g) {
      const fullV = g.v1 - g.v0 > 0.8 * T.H, len = (fullV ? g.u1 - g.u0 : g.v1 - g.v0) * F.k;
      const [x, y] = top ? P((g.u0 + g.u1) / 2, g.v1) : fullV ? P((g.u0 + g.u1) / 2, g.v1, 0) : P(g.u1, (g.v0 + g.v1) / 2, 0);
      d3.select(this).attr("x", top ? x : x + (fullV ? -8 : 8)).attr("y", y + (top ? 14 : 17)).attr("text-anchor", top ? "middle" : fullV ? "end" : "start")
        .text(len > 190 && !n ? g.label : g.short);
      const bb = this.getBBox(), dx = bb.x < 2 ? 2 - bb.x : bb.x + bb.width > w - 2 ? w - 2 - bb.x - bb.width : 0;
      if (dx) d3.select(this).attr("x", +d3.select(this).attr("x") + dx); });
    Q2.declutter(glab.nodes().sort((p, q) => d3.select(q).datum().u1 - d3.select(q).datum().u0 + d3.select(q).datum().v1 - d3.select(q).datum().v0 - (d3.select(p).datum().u1 - d3.select(p).datum().u0 + d3.select(p).datum().v1 - d3.select(p).datum().v0)), 2);
    // height scale (isometric only): reference blocks (tiles: top-left corner; treemap: the band above), and a north arrow
    if (!top) {
      const tiles = kind === "tiles", refs = tiles ? RULER : [10, 20], rs = tiles ? 0.26 : 0.06, rg = svg.append("g").attr("class", "ruler"), x0 = pad + 4;
      const yb = tiles ? pad + zmax + 10 + (n ? 6 : 14) : pad + 26 + 20 * kz;
      rg.append("text").attr("class", "lbl").attr("x", x0).attr("y", pad + 10).style("font-size", "11px").text("Height = gap (pp)");
      refs.forEach((v, i) => { const cx = x0 + i * (rs * k0 * 2 * Iso.C30 + 14), b = { u0: 0, u1: rs, v0: 0, v1: rs };
        const RP = { P: (u, vv, z = 0) => [cx + (u - vv) * Iso.C30 * k0 + rs * Iso.C30 * k0, yb + (u + vv) * Iso.S30 * k0 - z], top: false }, f = Iso.faces(b, 0, v * kz, RP);
        rg.append("path").attr("class", "rwall-l").attr("d", f.left); rg.append("path").attr("class", "rwall-r").attr("d", f.right); rg.append("path").attr("class", "rtop").attr("d", f.top);
        const [tx, ty] = Iso.centre(b, v * kz, RP); rg.append("text").attr("class", "lbl").attr("x", tx).attr("y", ty - 5).attr("text-anchor", "middle").style("font-size", "10.5px").text(v); });
      const [nx, ny] = Iso.north(TURN, base.W, base.H, F), cxn = tiles ? x0 + 14 : x0 + 2 * (rs * k0 * 2 * Iso.C30 + 14) + 40, cyn = tiles ? yb + rs * k0 + 30 : pad + RB / 2;
      const ng = svg.append("g").attr("class", "northa");
      ng.append("line").attr("x1", cxn - nx * 10).attr("y1", cyn - ny * 10).attr("x2", cxn + nx * 12).attr("y2", cyn + ny * 12);
      ng.append("path").attr("d", `M${cxn + nx * 16},${cyn + ny * 16}L${cxn + nx * 8 - ny * 4},${cyn + ny * 8 + nx * 4}L${cxn + nx * 8 + ny * 4},${cyn + ny * 8 - nx * 4}Z`);
      ng.append("text").attr("class", "lbl").attr("x", cxn + nx * 24).attr("y", cyn + ny * 24).attr("dy", "0.35em").attr("text-anchor", "middle").style("font-size", "11px").text("N");
    }
    // outlook label: bottom right for tiles; in the free scale band at the top right for the treemap (group names use the edges)
    svg.append("text").attr("class", "olabel").attr("x", w - 8).attr("y", RB ? pad + 12 : F.h - 8).attr("text-anchor", "end").style("display", "none");
    A.interactive(blocks);
    M = { w, view: VIEW, turn: TURN, svg, F, kz, z0, blocks, n, glab };
  }

  function update(A) {
    if (!M) return;
    const t = A.S.t, out = A.isOut(t), { svg, F, kz, z0 } = M, f1 = A.fmt.f1;
    const label = new Map();
    svg.selectAll("g.blk").each(function (b) {
      const id = b.id, v = A.val(id, t), d = A.chg(id, t), c = d === null ? 2 : A.chgClsOf(d), z1 = z0 + v * kz, f = Iso.faces(b, z0, z1, F), fill = `var(--c${c})`;
      const g = d3.select(this);
      g.select(".wall-l").attr("d", f.left).style("fill", f.left ? Iso.shade(fill, 0.9) : null);
      g.select(".wall-r").attr("d", f.right).style("fill", f.right ? Iso.shade(fill, 0.45) : null);
      g.select("path.mk").attr("d", f.top).style("fill", fill).attr("data-t", t).attr("data-c", c).attr("data-h", f1(v)).attr("data-z", (z1 - z0).toFixed(2))
        .attr("data-v", `${f1(v)} / ${d === null ? "—" : A.fmt.spp(d)}`).attr("data-a", Iso.area(b).toFixed(6)).attr("data-w", b.w ? Math.round(b.w) : null)
        .classed("on", id === A.S.sel).classed("hov", id === A.S.hover && A.S.hover !== A.S.sel);
      g.select(".hatchov").attr("d", f.top).style("display", out ? null : "none");
      g.attr("aria-label", A.aria(id, t));
      label.set(id, { b, z1, f });
    });
    const outl = id => (id && label.has(id) ? label.get(id).f.top : null);
    svg.select("path.outl.hov").attr("d", A.S.hover && A.S.hover !== A.S.sel ? outl(A.S.hover) : null);
    svg.select("path.outl.on").attr("d", outl(A.S.sel));
    // labels on the tops: name and gap; selected and hovered first, then larger tops, then the rest where they fit
    const nm = id => A.TILENAME[id] || A.ent(id).short, sz = id => Iso.area(label.get(id).b);
    const order = [...label.keys()].sort((p, q) => (q === A.S.sel) - (p === A.S.sel) || (q === A.S.hover) - (p === A.S.hover) || sz(q) - sz(p) || p.localeCompare(q));
    svg.select("text.olabel").style("display", out ? null : "none").text(out ? `OUTLOOK · ${A.ruleOf().label.toUpperCase()} RULE` : "");
    const lab = svg.select("g.blabels").selectAll("text").data(order, d => d).join(en => { const tx = en.append("text").attr("class", "maplbl").attr("text-anchor", "middle");
      tx.append("tspan").attr("class", "nm"); tx.append("tspan").attr("class", "v"); return tx; });
    lab.each(function (id) { const L = label.get(id), [x, y] = Iso.centre(L.b, L.z1, F), small = M.n || sz(id) < (kind === "tiles" ? 0 : 0.03);
      const tx = d3.select(this).attr("x", x).attr("y", y).style("font-size", (small ? 10.5 : 11.5) + "px").style("display", null).classed("on", id === A.S.sel);
      tx.select(".nm").attr("x", x).attr("dy", "-0.2em").text(nm(id));
      tx.select(".v").attr("x", x).attr("dy", "1.15em").text(f1(A.val(id, t))); });
    lab.order();
    Q2.declutter([...svg.selectAll(".ruler text, .northa text, text.olabel").nodes().filter(t => t.style.display !== "none" && t.textContent), ...lab.nodes()], 1); // scale and arrow labels win
    svg.select("text.olabel").style("display", out ? null : "none").text(out ? `OUTLOOK · ${A.ruleOf().label.toUpperCase()} RULE` : "");
  }

  const title = A => `Gap (height) and its change against a year earlier (top colour) in each CMA, ${A.LAB[A.S.t]}` + (A.isOut(A.S.t) ? ` (outlook, ${A.ruleOf().label.toLowerCase()} rule)` : "");
  function note(A) {
    const fp = kind === "tiles" ? "Every block has the same footprint, placed in a rough map position (Thunder Bay is far north-west of where it is shown), so only height and colour carry data."
      : `Footprint = the CMA's average number of single-person cases (OW + ODSP), ${A.LAB[0]} – ${A.LAB[A.NQ - 1]}; it does not change with the slider. Blocks sit on a base slab for their location group (Toronto area, southwest and central, east, north), which is not an official region. Do not read the volume: footprint and height mean different things.`;
    return `${VIEW === "top" ? "Top view: the blocks seen from above, so height is not shown; the printed number is the gap." : `Height = the gap, on one scale for every block (see the ${kind === "tiles" ? "10 / 20 / 30" : "10 / 20"} pp reference blocks); the view is isometric, so the same height is the same number of pixels anywhere in the picture.`} ` +
      `Top colour = change against a year earlier (lighter = narrowed, darker magenta = widened); in the first four quarters there is no earlier year and the middle grey is used. ${fp} ` +
      `Side faces are the top colour, darker: they only show the shape. A tall block can hide one behind it: use Turn 90°, the top view, the card or Table 2. Names are shown where they fit.`;
  }
  function legend(A) {
    const sw = c => `<svg width="14" height="14"><rect width="14" height="14" rx="2" style="fill:var(--c${c});stroke:var(--ring)"/></svg>`;
    return `<span class="lab-t">Top colour: change against a year earlier (pp):</span>` + A.CHG.map((l, c) => `<span>${sw(c)}${l}</span>`).join("") +
      `<span class="lab-t">Height: gap (pp)${kind === "tiles" ? "" : " · Footprint: average single-person cases"}</span>`;
  }
  return { fig1: { render, update, note, title }, legend, tick: 110 };
};
