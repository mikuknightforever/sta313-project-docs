/* Isometric blocks — shared geometry for the block versions of Part 2 (design/q2/variants/l-blocks, m-block-treemap)
   and Part 3 (design/q3/blocks-tiles, blocks-treemap). No data logic here.

   A block stands on an axis-aligned ground rectangle {id, u0, u1, v0, v1} (any units).
   Isometric view: screen x = ox + (u − v)·cos30°·k, screen y = oy + (u + v)·sin30°·k − z. The projection is
   orthographic, so a height of z pixels is z pixels everywhere on the page (no perspective shrinking with depth),
   and every block is seen from the same angle. Top view: x = ox + u·k, y = oy + v·k, heights not drawn. */
window.Iso = (() => {
  "use strict";
  const C30 = Math.cos(Math.PI / 6), S30 = 0.5;

  // The 15 CMAs in rough map positions (Part 2 candidate C's grid): col = west → east, row = north → south.
  const TILE = { 595: [0, 0], 580: [2, 0], 505: [6, 0], 568: [3, 1], 529: [4, 1], 521: [5, 1], 541: [1, 2], 550: [2, 2], 535: [3, 2], 532: [4, 2],
    559: [0, 3], 555: [1, 3], 543: [2, 3], 537: [3, 3], 539: [4, 3] };
  // Location groups, used only to arrange the treemap blocks (rough geography, not official regions), in strip
  // order from west/north to east.
  const GROUPS = [
    { id: "north", label: "North", short: "North", ids: ["580", "595"] },
    { id: "sw", label: "Southwest and central", short: "Southwest", ids: ["541", "550", "543", "555", "559", "539", "568"] },
    { id: "gtha", label: "Greater Toronto and Hamilton", short: "Toronto area", ids: ["535", "532", "537"] },
    { id: "east", label: "East", short: "East", ids: ["505", "521", "529"] },
  ];

  // Equal tiles: one 1 × 1 cell per CMA, the block inset by `pad` on every side.
  function tiles(ids, pad = 0.13) {
    const boxes = ids.map(id => { const [c, r] = TILE[id]; return { id, u0: c + pad, u1: c + 1 - pad, v0: r + pad, v1: r + 1 - pad }; });
    return { boxes, W: d3.max(ids, id => TILE[id][0]) + 1, H: d3.max(ids, id => TILE[id][1]) + 1 };
  }

  // Treemap: footprint area ∝ weight(id). The groups are strips side by side along u (width ∝ their total), so
  // every group reaches the front edge; inside each strip the CMAs are squarified. Each strip is shrunk about its
  // centre by fg and each block by f — the same factors everywhere, so areas stay exactly proportional to weight.
  function treemap(weight, W, H, f = 0.9, fg = 0.965) {
    const shrink = (r, k) => { const cu = (r.u0 + r.u1) / 2, cv = (r.v0 + r.v1) / 2, hu = (r.u1 - r.u0) * k / 2, hv = (r.v1 - r.v0) * k / 2; return { u0: cu - hu, u1: cu + hu, v0: cv - hv, v1: cv + hv }; };
    const tot = d3.sum(GROUPS, g => d3.sum(g.ids, weight)), boxes = [], groups = [];
    let u = 0;
    GROUPS.forEach(g => {
      const gw = d3.sum(g.ids, weight), strip = { u0: u, u1: u + W * gw / tot, v0: 0, v1: H }; u = strip.u1;
      const gr = shrink(strip, fg);
      groups.push({ id: g.id, label: g.label, short: g.short, slab: true, ...gr });
      const root = d3.hierarchy({ children: g.ids.map(id => ({ id, w: weight(id) })) }).sum(d => d.w || 0).sort((a, b) => b.value - a.value);
      d3.treemap().tile(d3.treemapSquarify.ratio(1)).size([gr.u1 - gr.u0, gr.v1 - gr.v0]).round(false)(root);
      root.leaves().forEach(n => boxes.push({ id: n.data.id, group: g.id, w: n.data.w, ...shrink({ u0: gr.u0 + n.x0, u1: gr.u0 + n.x1, v0: gr.v0 + n.y0, v1: gr.v0 + n.y1 }, f) }));
    });
    return { boxes, groups, W, H };
  }

  // Rotate ground rectangles by k quarter turns inside a W × H frame (the frame's W and H swap on odd turns).
  function turn(list, k, W, H) {
    let out = list.map(b => ({ ...b })), w = W, h = H;
    for (let i = 0; i < ((k % 4) + 4) % 4; i++) { out = out.map(b => ({ ...b, u0: h - b.v1, u1: h - b.v0, v0: b.u0, v1: b.u1 })); [w, h] = [h, w]; }
    return { list: out, W: w, H: h };
  }
  const turnPoint = (u, v, k, W, H) => { let w = W, h = H; for (let i = 0; i < ((k % 4) + 4) % 4; i++) { [u, v] = [h - v, u]; [w, h] = [h, w]; } return [u, v]; };

  // Painter's order (back to front) for blocks whose footprints do not overlap: A goes first if it is behind B.
  // Viewer at large u + v. For separate rectangles this relation is complete: when neither is behind the other,
  // their projections do not overlap and any order is right.
  function order(boxes) {
    const e = 1e-9, behind = (a, b) => (a.u1 <= b.u0 + e && a.v0 < b.v1 - e && b.v0 < a.v1 - e) || (a.v1 <= b.v0 + e && a.u0 < b.u1 - e && b.u0 < a.u1 - e) || (a.u1 <= b.u0 + e && a.v1 <= b.v0 + e);
    const n = boxes.length, indeg = new Array(n).fill(0), next = boxes.map(() => []);
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if (i !== j && behind(boxes[i], boxes[j])) { next[i].push(j); indeg[j]++; }
    const key = b => b.u0 + b.v0 + b.u1 + b.v1, out = [], ready = d3.range(n).filter(i => !indeg[i]);
    while (ready.length) { ready.sort((p, q) => key(boxes[p]) - key(boxes[q])); const i = ready.shift(); out.push(boxes[i]); next[i].forEach(j => { if (!--indeg[j]) ready.push(j); }); }
    return out.length === n ? out : boxes.slice().sort((a, b) => key(a) - key(b)); // (a cycle cannot happen for separate rectangles)
  }

  // Projection that fits a W × H frame into width w, leaving room above for blocks up to zmax pixels.
  // Depends only on W + H, so the drawing keeps its size when the frame is turned.
  function fit(W, H, w, zmax, pad = 10, top = false) {
    if (top) { const k = (w - 2 * pad) / W; return { k, h: Math.ceil(H * k + 2 * pad), P: (u, v) => [pad + u * k, pad + v * k], top: true }; }
    const k = (w - 2 * pad) / ((W + H) * C30), ox = pad + H * C30 * k, oy = pad + zmax;
    return { k, h: Math.ceil(oy + (W + H) * S30 * k + pad), P: (u, v, z = 0) => [ox + (u - v) * C30 * k, oy + (u + v) * S30 * k - z], top: false };
  }
  const line = pts => "M" + pts.map(p => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join("L") + "Z";
  // Faces of the block standing on b between heights z0 and z1 (pixels). Only the three faces a viewer can see:
  // the top, the face at u = u1 (front right) and the face at v = v1 (front left). Top view: the top only.
  function faces(b, z0, z1, F) {
    const P = F.P;
    if (F.top) return { top: line([P(b.u0, b.v0), P(b.u1, b.v0), P(b.u1, b.v1), P(b.u0, b.v1)]), right: null, left: null };
    return {
      top: line([P(b.u0, b.v0, z1), P(b.u1, b.v0, z1), P(b.u1, b.v1, z1), P(b.u0, b.v1, z1)]),
      right: z1 - z0 > 0.2 ? line([P(b.u1, b.v0, z0), P(b.u1, b.v1, z0), P(b.u1, b.v1, z1), P(b.u1, b.v0, z1)]) : null,
      left: z1 - z0 > 0.2 ? line([P(b.u0, b.v1, z0), P(b.u1, b.v1, z0), P(b.u1, b.v1, z1), P(b.u0, b.v1, z1)]) : null,
    };
  }
  const centre = (b, z, F) => F.P((b.u0 + b.u1) / 2, (b.v0 + b.v1) / 2, z);
  // The two visible front edges at height z (a reference line drawn around a block, e.g. Ontario's level).
  const ring = (b, z, F) => { const P = F.P, p = [P(b.u0, b.v1, z), P(b.u1, b.v1, z), P(b.u1, b.v0, z)]; return "M" + p.map(q => `${q[0].toFixed(1)},${q[1].toFixed(1)}`).join("L"); };
  // Ground area of a top face, in ground units (used by the checks: proportional to the weight in a treemap).
  const area = b => (b.u1 - b.u0) * (b.v1 - b.v0);
  // Side faces are the top colour, darker: a light-from-above cue for the shape, not data.
  function shade(css, k) {
    const v = css.startsWith("var(") ? getComputedStyle(document.documentElement).getPropertyValue(css.slice(4, -1)).trim() : css;
    const c = d3.color(v); return c ? c.darker(k).formatHex() : v;
  }
  // North arrow: the screen direction of "north" (−v before turning) after k turns.
  function north(k, W, H, F) {
    const a = turnPoint(W / 2, H / 2, k, W, H), b = turnPoint(W / 2, H / 2 - 0.5, k, W, H), p = F.P(a[0], a[1]), q = F.P(b[0], b[1]);
    const L = Math.hypot(q[0] - p[0], q[1] - p[1]) || 1; return [(q[0] - p[0]) / L, (q[1] - p[1]) / L];
  }
  // ---------- map shapes: the real CMA boundaries, north up, tilted (a parallel "oblique" view, as Part 2's version K) ----------
  // Ground = Part 3's conic projection of the main map box, W0 units wide. Screen x = ox + x·k, y = oy + y·k·c − z
  // (c = cos of the tilt); parallel projection, so equal heights are equal pixels anywhere. Thunder Bay sits in a box in
  // the north-west corner, not in its true position (as in version K).
  const MAIN_BOX = [-84.9, 41.75, -74.5, 47.35], TB = "595";
  function boxPoints(lon0, lat0, lon1, lat1) { const pts = []; for (let t = 0; t <= 1.0001; t += 0.1) { const lo = lon0 + (lon1 - lon0) * t, la = lat0 + (lat1 - lat0) * t; pts.push([lo, lat0], [lo, lat1], [lon0, la], [lon1, la]); } return { type: "MultiPoint", coordinates: pts }; }
  function segDist(p, a, b) { const dx = b[0] - a[0], dy = b[1] - a[1], L = dx * dx + dy * dy; let t = L ? ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L : 0; t = Math.max(0, Math.min(1, t)); return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy); }
  function simplify(pts, tol) { // Douglas–Peucker
    if (pts.length < 4) return pts;
    const keep = new Uint8Array(pts.length); keep[0] = keep[pts.length - 1] = 1; const st = [[0, pts.length - 1]];
    while (st.length) { const [a, b] = st.pop(); let mi = -1, md = tol; for (let i = a + 1; i < b; i++) { const d = segDist(pts[i], pts[a], pts[b]); if (d > md) { md = d; mi = i; } } if (mi >= 0) { keep[mi] = 1; st.push([a, mi], [mi, b]); } }
    return pts.filter((p, i) => keep[i]);
  }
  function mapGround(features, ids, W0 = 1000) {
    const box = boxPoints(...MAIN_BOX), proj = d3.geoConicConformal().parallels([43, 46.5]).rotate([79.7, 0]).fitWidth(W0, box);
    const b = d3.geoPath(proj).bounds(box); proj.translate([proj.translate()[0] - b[0][0], proj.translate()[1] - b[0][1]]);
    const H0 = b[1][1] - b[0][1]; proj.clipExtent([[0, 0], [W0, H0]]);
    const feats = new Map(features.map(f => [f.properties.cma_code, f]));
    const tbBox = { x: 0.012 * W0, y: 0.012 * W0, w: 0.15 * W0, h: 0.12 * W0 }, m = 0.012 * W0;
    const tbProj = d3.geoConicConformal().parallels([44, 52]).rotate([89.3, 0]).fitExtent([[tbBox.x + m, tbBox.y + m], [tbBox.x + tbBox.w - m, tbBox.y + tbBox.h - 2.5 * m]], feats.get(TB));
    const outer = f => (f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates).map(poly => poly[0]);
    const shapes = ids.map(id => { const pr = id === TB ? tbProj : proj;
      const rings = outer(feats.get(id)).map(r => simplify(r.map(q => pr(q)), 1.2)).filter(r => r.length >= 4 && Math.abs(d3.polygonArea(r)) > 4);
      return { id, rings, tb: id === TB }; });
    return { W: W0, H: H0, shapes, proj, tbBox };
  }
  // Turn the shapes (and the Thunder Bay box) by k quarter turns inside the W × H ground.
  function turnShapes(G, k) {
    const tp = p => turnPoint(p[0], p[1], k, G.W, G.H), odd = ((k % 4) + 4) % 2 === 1;
    const c = [[G.tbBox.x, G.tbBox.y], [G.tbBox.x + G.tbBox.w, G.tbBox.y + G.tbBox.h]].map(tp);
    return { W: odd ? G.H : G.W, H: odd ? G.W : G.H, k,
      tbBox: { x: Math.min(c[0][0], c[1][0]), y: Math.min(c[0][1], c[1][1]), w: Math.abs(c[1][0] - c[0][0]), h: Math.abs(c[1][1] - c[0][1]) },
      shapes: G.shapes.map(s => { const rings = s.rings.map(r => r.map(tp)); return { ...s, rings, key: d3.max(rings.flat(), p => p[1]), area: d3.sum(rings, r => Math.abs(d3.polygonArea(r))) }; })
        .sort((a, b) => a.key - b.key) };  // back (north on screen) to front
  }
  // Oblique (north-up, tilted) projection fitting a W × H ground into width w, with zmax pixels of room above.
  function oblique(W, H, w, zmax, pad = 10, c = 0.62, top = false) {
    const k = (w - 2 * pad) / W, cc = top ? 1 : c, oy = pad + (top ? 0 : zmax);
    return { k, c: cc, top, h: Math.ceil(oy + H * k * cc + pad), P: (x, y, z = 0) => [pad + x * k, oy + y * k * cc - (top ? 0 : z)] };
  }
  const pathOf = pts => "M" + pts.map(p => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join("L") + "Z";
  // Outward unit normals of a ring's edges (tested against the ring, so the ring's winding does not matter).
  function edges(r) {
    const out = [];
    for (let i = 0; i < r.length - 1; i++) {
      const a = r[i], b = r[i + 1], dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy); if (L < 1e-9) continue;
      let nx = dy / L, ny = -dx / L; const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
      if (d3.polygonContains(r, [mx + nx * 0.6, my + ny * 0.6])) { nx = -nx; ny = -ny; }
      out.push({ a, b, nx, ny });
    }
    return out;
  }
  // A block on a map shape between heights z0 and z1: its top and the walls that face the viewer (south), back to front.
  // Walls are shaded by the direction they face (light from the north-west): a shape cue, not data.
  function prism(s, z0, z1, F) {
    const P = F.P, top = s.rings.map(r => pathOf(r.map(p => P(p[0], p[1], z1)))).join("");
    if (F.top || z1 - z0 < 0.2) return { top, walls: [] };
    const walls = s.rings.flatMap(edges).filter(e => e.ny > 0.05).map(e => ({ y: Math.max(e.a[1], e.b[1]), shade: 0.35 + 0.3 * Math.max(0, -e.nx) + 0.25 * e.ny,
      d: pathOf([P(e.a[0], e.a[1], z0), P(e.b[0], e.b[1], z0), P(e.b[0], e.b[1], z1), P(e.a[0], e.a[1], z1)]) })).sort((p, q) => p.y - q.y);
    return { top, walls };
  }
  // A shape sunk below the ground by `depth` pixels: the floor and the inside of the far (north-facing) walls, to be
  // clipped to the opening.
  function pit(s, depth, F) {
    const P = F.P, open = s.rings.map(r => pathOf(r.map(p => P(p[0], p[1], 0)))).join(""), floor = s.rings.map(r => pathOf(r.map(p => P(p[0], p[1], -depth)))).join("");
    const walls = s.rings.flatMap(edges).filter(e => e.ny < -0.05).map(e => ({ y: Math.max(e.a[1], e.b[1]), shade: 0.35 + 0.3 * Math.max(0, e.nx) + 0.25 * -e.ny,
      d: pathOf([P(e.a[0], e.a[1], -depth), P(e.b[0], e.b[1], -depth), P(e.b[0], e.b[1], 0), P(e.a[0], e.a[1], 0)]) })).sort((p, q) => p.y - q.y);
    return { open, floor, walls };
  }
  // The viewer-facing edges at height z (a reference line around a block), and the whole outline at z (a "lid").
  const ringFront = (s, z, F) => s.rings.flatMap(edges).filter(e => e.ny > 0.05).map(e => { const p = F.P(e.a[0], e.a[1], z), q = F.P(e.b[0], e.b[1], z); return `M${p[0].toFixed(1)},${p[1].toFixed(1)}L${q[0].toFixed(1)},${q[1].toFixed(1)}`; }).join("");
  const lid = (s, z, F) => s.rings.map(r => pathOf(r.map(p => F.P(p[0], p[1], z)))).join("");
  const shapeCentre = (s, z, F) => { const r = s.rings.slice().sort((p, q) => Math.abs(d3.polygonArea(q)) - Math.abs(d3.polygonArea(p)))[0], c = d3.polygonCentroid(r); return F.P(c[0], c[1], z); };
  // The province outline on the turned ground (clipped to the main map box).
  function landPath(outline, G, k, F) {
    const T = d3.geoTransform({ point(x, y) { const [u, v] = turnPoint(x, y, k, G.W, G.H), q = F.P(u, v, 0); this.stream.point(q[0], q[1]); } });
    return d3.geoPath({ stream: s => G.proj.stream(T.stream(s)) })(outline);
  }
  const northMap = (k, G, F) => { const a = turnPoint(G.W / 2, G.H / 2, k, G.W, G.H), b = turnPoint(G.W / 2, G.H / 2 - 50, k, G.W, G.H), p = F.P(a[0], a[1]), q = F.P(b[0], b[1]), L = Math.hypot(q[0] - p[0], q[1] - p[1]) || 1; return [(q[0] - p[0]) / L, (q[1] - p[1]) / L]; };

  return { C30, S30, TILE, GROUPS, tiles, treemap, turn, order, fit, faces, centre, ring, area, shade, north,
    TB, mapGround, turnShapes, oblique, prism, pit, ringFront, lid, shapeCentre, landPath, northMap, pathOf };
})();
