/* Q2 extra version F — the gap between the ODSP and OW single-person shares on a map of the 15 CMAs, quarter by
   quarter (2003 Q1 – 2026 Q1), with an outlook to 2030 Q4 from three simple rules that are tested on the past.
   Figure 1a: filled map (or equal tiles) with a quarter slider and Play; Figure 1b: card (hover = preview, click =
   select, as in Part 3); Figure 2: the selected CMA's gap with the three rules and the likely range; Tables 1–2:
   past accuracy of each rule and the 2030 Q4 outlook. Every number is computed here or in shared/q2-common.js.
   Map projection, framing, inset, polygon rewinding and label placement follow Part 3 (design/q3/prototype/q3.js). */
(() => {
  "use strict";
  const { fmt } = Q2;
  const GEO = "../../../../datasets/EXTERNAL/CMA-BOUNDARIES/";
  const HZ = 19;                       // outlook quarters after the last data quarter (2026 Q2 … 2030 Q4)
  const WIN = 40;                      // 10 years of quarters: the trend rule's window and the first testable starting quarter
  const BRK = [10, 15, 20, 25, 30];    // colour classes, pp
  const CLS = ["under 10", "10–15", "15–20", "20–25", "25–30", "30 or more"];
  const RULES = [
    { id: "conv", label: "Convergence", short: "Conv.", long: "keeps moving toward the middle CMA's gap at the past rate" },
    { id: "naive", label: "No change", short: "No change", long: "stays at its latest value" },
    { id: "trend", label: "10-year trend", short: "Trend", long: "follows its straight-line trend of the last 10 years" }];
  const MAIN_BOX = [-84.9, 41.75, -74.5, 47.35], TB = "595";
  const MAPNAME = { 505: "Ottawa", 539: "Niagara", 541: "Kitchener–Waterloo", 580: "Sudbury" };   // as Part 3's map
  const TILENAME = { 505: "Ottawa", 539: "Niagara", 541: "Kitchener–W.", 580: "Sudbury" };
  const TILE = { 595: [0, 0], 580: [2, 0], 505: [6, 0], 568: [3, 1], 529: [4, 1], 521: [5, 1], 541: [1, 2], 550: [2, 2], 535: [3, 2], 532: [4, 2],
    559: [0, 3], 555: [1, 3], 543: [2, 3], 537: [3, 3], 539: [4, 3] };          // as candidate C's grid
  const S = { t: 0, sel: null, hover: null, view: "map", rule: "conv", timer: null };
  let DATA, F, GEOJ, OUTLINE, NQ, NT, LAB, OUT, BT, MED, MAP = null, TILES = null, F2 = null;
  const syncs = [];
  const ent = id => DATA.ALL.find(e => e.id === id);
  const r1 = v => Math.round(v * 10) / 10;
  const clsOf = v => BRK.filter(b => r1(v) >= b).length;   // classes follow the value as printed (1 dp)
  const ruleOf = () => RULES.find(r => r.id === S.rule);

  Promise.all([Q2.load("../../../../"), d3.json(GEO + "ont-cma-boundaries.geojson"), d3.json(GEO + "ont-province-outline.geojson")]).then(([d, geo, outline]) => {
    DATA = d; F = d.F; NQ = Q2.N; NT = NQ + HZ;
    // RFC 7946 rings read as "everything except the polygon" by spherical d3-geo: rewind each polygon on its own (Part 3)
    const fix = poly => (d3.geoArea({ type: "Polygon", coordinates: poly }) > 2 * Math.PI ? poly.map(ring => ring.slice().reverse()) : poly);
    const rewind = fc => { fc.features.forEach(f => { const g = f.geometry; g.coordinates = g.type === "Polygon" ? fix(g.coordinates) : g.coordinates.map(fix); }); return fc; };
    GEOJ = rewind(geo); OUTLINE = rewind(outline);
    const missing = DATA.CMAS.filter(c => !GEOJ.features.some(f => f.properties.cma_code === c.id));
    if (missing.length) console.error("CMAs without a boundary:", missing.map(c => c.name));
    LAB = labels(); outlook();
    window.__facts = F; window.__out = { OUT, BT, MED, LAB, NQ, NT, HZ }; // read by the checks
    S.t = 0; S.sel = F.endWidest.e.id;
    const U = new URLSearchParams(location.search), ti = LAB.findIndex(l => l.replace(" ", "") === U.get("t"));
    if (ti >= 0) S.t = ti;
    if (DATA.CMAS.some(c => c.id === U.get("cma"))) S.sel = U.get("cma");
    if (["map", "tiles"].includes(U.get("view"))) S.view = U.get("view");
    if (RULES.some(r => r.id === U.get("rule"))) S.rule = U.get("rule");
    Q2.themeButton(render);
    document.getElementById("lead").innerHTML = Q2.lead(F);
    document.getElementById("defTest").textContent = `Each rule was run from every quarter from ${LAB[WIN - 1]} (the first with 10 years of data before it) to ${LAB[NQ - 2]}, ` +
      `using only the data up to that quarter, and compared with what happened later. The "likely range" is the middle 80% of those past misses at the same distance ahead.`;
    Q2.renderCards(F); outlookCard();
    build(); render();
    Q2.onResize(() => { MAP = TILES = null; render(); });
    document.body.dataset.ready = "1";
  }).catch(Q2.fail);

  function labels() { // data quarters, then 2026 Q2 … 2030 Q4
    const L = Q2.QS.map(r => r.label), last = Q2.QS[NQ - 1];
    let y = last.year, q = last.quarter;
    for (let h = 1; h <= HZ; h++) { q++; if (q > 4) { q = 1; y++; } L.push(`${y} Q${q}`); }
    return L;
  }
  const tDate = t => { if (t < NQ) return Q2.QS[t].date; const [y, q] = LAB[t].split(" Q").map(Number); return new Date(y, 3 * q - 1, 1); };
  const isOut = t => t >= NQ;
  const phaseOf = t => (t < NQ ? (Q2.PH[Q2.QS[t].phase] ? Q2.PH[Q2.QS[t].phase].long : "") : `outlook, ${ruleOf().label.toLowerCase()} rule`);

  // ---------- the outlook: three rules, each tested on every past starting quarter with 10 years of data ----------
  function outlook() {
    const C = DATA.CMAS, T = NQ - 1, G = new Map(C.map(c => [c.id, c.rows.map(r => r.gap)]));
    MED = d3.range(NQ).map(t => d3.median(C, c => c.rows[t].gap));
    // convergence: pooled least-squares slope (through 0) of the deviation from the middle CMA, h quarters later on now
    const phi = (T0, h) => { let sxy = 0, sxx = 0; for (let t = 0; t + h <= T0; t++) C.forEach(c => { const g = G.get(c.id), x = g[t] - MED[t], y = g[t + h] - MED[t + h]; sxy += x * y; sxx += x * x; }); return sxy / sxx; };
    const ols = (g, i0, i1) => { const xs = d3.range(i0, i1 + 1), mx = d3.mean(xs), my = d3.mean(xs, i => g[i]); let sxy = 0, sxx = 0;
      xs.forEach(i => { sxy += (i - mx) * (g[i] - my); sxx += (i - mx) ** 2; }); const b = sxy / sxx; return [my - b * mx, b]; };
    const proj = (rule, g, T0, h, ph) => (rule === "naive" ? g[T0] : rule === "trend" ? (([a, b]) => a + b * (T0 + h))(ols(g, T0 - WIN + 1, T0)) : MED[T0] + ph[h] * (g[T0] - MED[T0]));
    const err = Object.fromEntries(RULES.map(r => [r.id, d3.range(HZ + 1).map(() => [])]));
    for (let T0 = WIN - 1; T0 < T; T0++) {
      const ph = d3.range(HZ + 1).map(h => (h ? phi(T0, h) : 1));
      C.forEach(c => { const g = G.get(c.id); for (let h = 1; h <= HZ && T0 + h <= T; h++) RULES.forEach(r => err[r.id][h].push(g[T0 + h] - proj(r.id, g, T0, h, ph))); });
    }
    BT = { first: WIN - 1 };
    RULES.forEach(r => { const e = err[r.id], srt = e.map(a => a.slice().sort(d3.ascending));
      BT[r.id] = { n: e.map(a => a.length), mae: e.map(a => (a.length ? d3.mean(a, Math.abs) : 0)), bias: e.map(a => (a.length ? d3.mean(a) : 0)),
        q10: srt.map(a => (a.length ? d3.quantile(a, 0.1) : 0)), q90: srt.map(a => (a.length ? d3.quantile(a, 0.9) : 0)) }; });
    const ph = d3.range(HZ + 1).map(h => (h ? phi(T, h) : 1));
    OUT = { phi: ph };
    RULES.forEach(r => { OUT[r.id] = new Map(C.map(c => { const g = G.get(c.id);
      return [c.id, d3.range(HZ + 1).map(h => { const p = h ? proj(r.id, g, T, h, ph) : g[T];
        return { p: Math.max(0, p), lo: Math.max(0, p + BT[r.id].q10[h]), hi: Math.max(0, p + BT[r.id].q90[h]) }; })]; })); });
  }
  const val = (id, t, rule = S.rule) => (t < NQ ? ent(id).rows[t].gap : OUT[rule].get(id)[t - NQ + 1].p);
  const band = (id, t, rule = S.rule) => (t < NQ ? null : OUT[rule].get(id)[t - NQ + 1]);
  const rankAt = (id, t) => 1 + DATA.CMAS.filter(c => val(c.id, t) > val(id, t)).length; // 1 = widest gap
  const at2030 = (id, rule) => OUT[rule].get(id)[HZ];

  // ---------- controls ----------
  function build() {
    const MOM = [0, Q2.I19, Q2.I23, NQ - 1, NT - 1].map(t => ({ t, label: LAB[t] + (t === NQ - 1 ? " (latest)" : t === NT - 1 ? " (outlook)" : "") }));
    syncs.push(Q2.seg("#momentSeg", MOM, m => m.label, m => S.t === m.t, m => { stop(); setT(m.t); }));
    syncs.push(Q2.seg("#viewSeg", [{ id: "map", label: "Map" }, { id: "tiles", label: "Equal tiles" }], v => v.label, v => S.view === v.id, v => { S.view = v.id; MAP = TILES = null; fig1(); }));
    syncs.push(Q2.seg("#ruleSeg", RULES, r => r.label, r => S.rule === r.id, r => { S.rule = r.id; render(); }));
    const sl = document.getElementById("tSlider"); sl.max = NT - 1;
    sl.addEventListener("input", () => { stop(); setT(+sl.value); });
    document.getElementById("playBtn").addEventListener("click", () => (S.timer ? stop() : play()));
    const sw = c => `<svg width="14" height="14"><rect width="14" height="14" rx="2" style="fill:var(--h${c});stroke:var(--ring)"/></svg>`;
    document.getElementById("f1Key").innerHTML = `<span class="lab-t">Gap (pp):</span>` + CLS.map((l, c) => `<span>${sw(c)}${l}</span>`).join("") +
      `<span><svg width="14" height="14"><defs><pattern id="khatch" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="5" style="stroke:var(--hatch);stroke-width:1.5"/></pattern></defs><rect width="14" height="14" rx="2" style="fill:var(--h2)"/><rect width="14" height="14" rx="2" style="fill:url(#khatch)"/></svg>Hatched = outlook (projection)</span>` +
      `<span><svg width="14" height="14"><rect x="1.5" y="1.5" width="11" height="11" rx="2" style="fill:none;stroke:var(--ink);stroke-width:2.5"/></svg>Selected CMA</span>`;
  }
  const sync = () => syncs.forEach(f => f());
  function render() { sync(); nowText(); tBar(); fig1(); card(); fig2(); tables(); takeaway(); }
  function setT(t) { S.t = Math.max(0, Math.min(NT - 1, t)); sync(); nowText(); updateFig1(); card(); f2Marker(); btn(); }
  function play() {
    if (S.t >= NT - 1) S.t = -1;
    const step = () => {
      if (S.t >= NT - 1) { stop(true); return; }
      setT(S.t + 1);
      // a pause where the data end and the outlook begins
      S.timer = setTimeout(step, S.t === NQ - 1 ? 1100 : Q2.reduced() ? 220 : 85);
      btn();
    };
    document.body.dataset.play = "playing";
    S.timer = setTimeout(step, 0); btn();
  }
  function stop(done) {
    if (S.timer) { clearTimeout(S.timer); S.timer = null; document.body.dataset.play = done ? "done" : "paused"; }
    btn();
  }
  function btn() { document.getElementById("playBtn").textContent = S.timer ? "Pause" : S.t >= NT - 1 ? "Replay" : "Play"; }
  function nowText() {
    const t = S.t, sl = document.getElementById("tSlider");
    sl.value = t; sl.setAttribute("aria-valuetext", `${LAB[t]}, ${phaseOf(t)}`);
    document.getElementById("tNow").innerHTML = `<b>${LAB[t]}</b> · ${phaseOf(t)}${isOut(t) ? '<span class="tag">projection</span>' : ""}`;
    document.getElementById("f1Title").textContent = `Gap between the ODSP and OW single-person shares in each CMA, ${LAB[t]}${isOut(t) ? ` (outlook, ${ruleOf().label.toLowerCase()} rule)` : ""}`;
  }
  // a bar under the slider: data quarters, then the hatched outlook, with years
  function tBar() {
    const w = Q2.W("tBar"), h = 30, pad = 8, x = d3.scaleLinear().domain([0, NT - 1]).range([pad, w - pad]);
    const svg = Q2.svgIn("tBar", w, h, `Timeline: data ${LAB[0]} to ${LAB[NQ - 1]}, outlook to ${LAB[NT - 1]}`);
    svg.append("defs").append("pattern").attr("id", "bhatch").attr("width", 5).attr("height", 5).attr("patternUnits", "userSpaceOnUse").attr("patternTransform", "rotate(45)")
      .append("line").attr("x1", 0).attr("y1", 0).attr("x2", 0).attr("y2", 5).style("stroke", "var(--hatch)").style("stroke-width", 1.4);
    svg.append("rect").attr("x", x(0)).attr("width", x(NQ - 1) - x(0)).attr("y", 2).attr("height", 6).attr("rx", 2).style("fill", "var(--axis)");
    svg.append("rect").attr("x", x(NQ - 1)).attr("width", x(NT - 1) - x(NQ - 1)).attr("y", 2).attr("height", 6).attr("rx", 2).style("fill", "url(#bhatch)").style("stroke", "var(--ink2)").style("stroke-width", .6);
    const every = w < 520 ? 10 : 5;
    LAB.forEach((l, t) => { const [y, q] = l.split(" Q").map(Number); if (q === 1 && y % every === 0) {
      svg.append("line").attr("x1", x(t)).attr("x2", x(t)).attr("y1", 9).attr("y2", 13).style("stroke", "var(--axis)");
      svg.append("text").attr("class", "lbl").attr("x", x(t)).attr("y", 25).attr("text-anchor", "middle").style("font-size", "10.5px").text(y); } });
    if (w >= 520) svg.append("text").attr("class", "lbl").attr("x", (x(NQ - 1) + x(NT - 1)) / 2 - 18).attr("y", 25).attr("text-anchor", "middle").style("font-size", "10.5px").style("font-weight", 600).text("outlook");
  }

  // ---------- Figure 1a: map ----------
  function bboxPoints(lon0, lat0, lon1, lat1) { // densified edges: conic parallels curve
    const pts = [];
    for (let t = 0; t <= 1.0001; t += 0.1) { const lo = lon0 + (lon1 - lon0) * t, la = lat0 + (lat1 - lat0) * t; pts.push([lo, lat0], [lo, lat1], [lon0, la], [lon1, la]); }
    return { type: "MultiPoint", coordinates: pts };
  }
  function fig1() {
    const w = Q2.W("f1");
    if (S.view === "map") { if (!MAP || MAP.w !== w) buildMap(w); } else if (!TILES || TILES.w !== w) buildTiles(w);
    document.getElementById("f1Note").textContent = S.view === "map"
      ? "Each CMA is filled by its gap in the chosen quarter (classes of 5 pp; colours follow the value rounded to 0.1 pp, as printed). Large CMAs such as Toronto, Ottawa and Sudbury cover more of the map than small ones such as Guelph and Brantford, although each counts once: switch to Equal tiles to compare them evenly. Thunder Bay is in the inset. Hover, tap or Tab to a CMA for its values; click to follow it in Figure 2."
      : "Equal tiles in rough map positions (Thunder Bay is much farther north-west than shown), so every CMA has the same weight. Each tile shows the gap in the chosen quarter. Hover, tap or Tab to a tile for its values; click to follow it in Figure 2.";
    updateFig1();
  }
  const pathName = id => MAPNAME[id] || ent(id).short;
  function buildMap(w) {
    TILES = null;
    const pad = 6, n = w < 560, box = bboxPoints(...MAIN_BOX);
    const proj = d3.geoConicConformal().parallels([43, 46.5]).rotate([79.7, 0]).fitWidth(w - 2 * pad, box);
    const b = d3.geoPath(proj).bounds(box);
    proj.translate([proj.translate()[0] + pad - b[0][0], proj.translate()[1] + pad - b[0][1]]);
    const h0 = Math.ceil(b[1][1] - b[0][1] + 2 * pad);
    const insetW = n ? 150 : Math.round(Math.min(176, Math.max(150, w * 0.26))), insetH = Math.round(insetW * 0.98);
    const inset = { x: 6, y: n ? h0 + 6 : 6, w: insetW, h: insetH }, h = n ? h0 + insetH + 12 : h0;
    const iproj = d3.geoConicConformal().parallels([44, 52]).rotate([85, 0]).fitExtent([[inset.x + 6, inset.y + 6], [inset.x + inset.w - 6, inset.y + inset.h - 30]], OUTLINE);
    const path = d3.geoPath(proj), ipath = d3.geoPath(iproj);
    const svg = Q2.svgIn("f1", w, h, "Map of the 15 CMAs, each filled by its gap in the chosen quarter");
    svg.attr("role", "group");
    svg.append("defs").append("pattern").attr("id", "fhatch").attr("width", 7).attr("height", 7).attr("patternUnits", "userSpaceOnUse").attr("patternTransform", "rotate(45)")
      .append("line").attr("x1", 0).attr("y1", 0).attr("x2", 0).attr("y2", 7).style("stroke", "var(--hatch)").style("stroke-width", 1.6);
    svg.append("clipPath").attr("id", "fclip").append("rect").attr("width", w).attr("height", h0);
    const base = svg.append("g").attr("clip-path", "url(#fclip)");
    base.append("path").datum(OUTLINE).attr("d", path).style("fill", "var(--land)").style("stroke", "var(--land-line)").style("stroke-width", .8);
    const feats = GEOJ.features.filter(f => DATA.CMAS.some(c => c.id === f.properties.cma_code));
    const south = feats.filter(f => f.properties.cma_code !== TB).sort((p, q) => d3.geoCentroid(p)[0] - d3.geoCentroid(q)[0]); // west → east tab order
    const tbf = feats.find(f => f.properties.cma_code === TB);
    const gp = base.append("g").attr("class", "polys");
    gp.selectAll("path").data(south).join("path").attr("class", "cma").attr("data-id", f => f.properties.cma_code).attr("d", path);
    base.append("g").selectAll("path").data(south).join("path").attr("class", "hatchov").attr("d", path);
    // inset: whole province, the main map's extent, Thunder Bay
    const ig = svg.append("g").attr("class", "inset");
    ig.append("rect").attr("class", "inset-box").attr("x", inset.x).attr("y", inset.y).attr("width", inset.w).attr("height", inset.h).attr("rx", 4);
    ig.append("path").datum(OUTLINE).attr("d", ipath).style("fill", "var(--land)").style("stroke", "var(--land-line)").style("stroke-width", .6);
    ig.append("path").datum(tbf).attr("class", "cma").attr("data-id", TB).attr("d", ipath);
    ig.append("path").datum(tbf).attr("class", "hatchov").attr("d", ipath);
    const edge = [[MAIN_BOX[0], MAIN_BOX[1]], [MAIN_BOX[2], MAIN_BOX[1]], [MAIN_BOX[2], MAIN_BOX[3]], [MAIN_BOX[0], MAIN_BOX[3]], [MAIN_BOX[0], MAIN_BOX[1]]].map(p => iproj(p));
    ig.append("path").attr("d", d3.line()(edge)).style("fill", "none").style("stroke", "var(--ink2)").style("stroke-width", 1);
    const km = Math.round((d3.geoDistance(d3.geoCentroid(tbf), d3.geoCentroid(feats.find(f => f.properties.cma_code === "535"))) * 6371) / 10) * 10;
    ig.append("text").attr("class", "lbl").attr("x", inset.x + 6).attr("y", inset.y + inset.h - 20).style("font-size", "10px").text("All Ontario · box = main map");
    ig.append("text").attr("class", "lbl").attr("x", inset.x + 6).attr("y", inset.y + inset.h - 6).style("font-size", "10px").text(`≈ ${km} km NW of Toronto`);
    // outlines of the hovered and selected CMA drawn on top (the focusable shapes themselves are never moved)
    svg.append("path").attr("class", "cma hov outl").style("fill", "none").style("pointer-events", "none");
    svg.append("path").attr("class", "cma on outl").style("fill", "none").style("pointer-events", "none");
    // labels: placed once with room for a value, so they stay put while the values change
    const fs = n ? 10.5 : 11.5, meas = svg.append("text").attr("class", "maplbl").style("font-size", fs + "px");
    const nodes = feats.map(f => { const id = f.properties.cma_code, tb = id === TB, [x, y] = tb ? ipath.centroid(f) : path.centroid(f);
      meas.text(n ? pathName(id) : `${pathName(id)} 00.0`); return { id, tb, x, y, r: 4, tw: meas.node().getComputedTextLength() }; });
    meas.remove();
    const sn = nodes.filter(d => !d.tb), tn = nodes.filter(d => d.tb);
    placeLabels(sn, [{ x: inset.x - 2, y: inset.y - 2, w: inset.w + 4, h: inset.h + 4 }], { x0: 2, y0: 2, x1: w - 2, y1: h0 - 2 }, fs);
    placeLabels(tn, [], { x0: inset.x + 3, y0: inset.y + 3, x1: inset.x + inset.w - 3, y1: inset.y + inset.h - 28 }, fs);
    const lg = svg.append("g").attr("class", "labels").selectAll("g").data(nodes).join("g").attr("data-id", d => d.id);
    lg.filter(d => d.L.far).append("line").attr("class", "leader").attr("x1", d => d.L.lx1).attr("y1", d => d.L.ly1).attr("x2", d => d.L.lx2).attr("y2", d => d.L.ly2);
    const tx = lg.append("text").attr("class", "maplbl").style("font-size", fs + "px").attr("x", d => d.L.tx).attr("y", d => d.L.ty).attr("dy", "0.35em").attr("text-anchor", d => d.L.anchor);
    tx.append("tspan").attr("class", "nm").text(d => pathName(d.id));
    if (!n) tx.append("tspan").attr("class", "v").text("");
    svg.attr("data-label-overlaps", countOverlaps(nodes));
    svg.append("text").attr("class", "olabel").attr("x", w - 8).attr("y", h0 - 10).attr("text-anchor", "end").style("display", "none");
    svg.selectAll("path.cma:not(.outl)").attr("tabindex", 0).attr("role", "button")
      .on("pointerenter", function () { setHover(this.dataset.id); }).on("pointerleave", Q2.leave(() => setHover(null)))
      .on("focus", function () { setHover(this.dataset.id); }).on("blur", () => setHover(null))
      .on("click", function () { pick(this.dataset.id); })
      .on("keydown", function (ev) { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); pick(this.dataset.id); } });
    MAP = { w, h, h0, svg, path, ipath, feats: new Map(feats.map(f => [f.properties.cma_code, f])), n };
  }
  // Greedy label placement (Part 3): 12 directions × 6 distances; the closest spot that collides with nothing wins.
  function placeLabels(nodes, obstacles, bnd, fs) {
    const th = fs * 1.2, placed = [];
    const hitsCircle = b => nodes.some(n => rectCircle(b, n.x, n.y, n.r + 1.5));
    const hitsRect = b => placed.some(p => overlap(b, p)) || obstacles.some(o => overlap(b, o));
    const angles = [0, 180, -90, 90, -30, 30, -150, 150, -60, 60, -120, 120], steps = [3, 10, 20, 32, 46, 62];
    nodes.slice().sort((a, b) => a.x - b.x).forEach(n => {
      let best = null;
      outer: for (const s of steps) for (const a of angles) {
        const rad = (a * Math.PI) / 180, d = n.r + s, c = Math.cos(rad), sn = Math.sin(rad), ax = n.x + c * d, ay = n.y + sn * d;
        const anchor = c > 0.35 ? "start" : c < -0.35 ? "end" : "middle";
        const x0 = anchor === "start" ? ax : anchor === "end" ? ax - n.tw : ax - n.tw / 2, y0 = sn < -0.8 ? ay - th : sn > 0.8 ? ay : ay - th / 2;
        const b = { x: x0 - 1, y: y0, w: n.tw + 2, h: th };
        if (b.x < bnd.x0 || b.y < bnd.y0 || b.x + b.w > bnd.x1 || b.y + b.h > bnd.y1) continue;
        const cost = (hitsCircle(b) ? 2 : 0) + (hitsRect(b) ? 2 : 0) + s / 100;
        if (!best || cost < best.cost) best = { b, anchor, s, rad, cost };
        if (cost < 1) break outer;
      }
      if (!best) best = { b: { x: n.x + n.r + 3, y: n.y - th / 2, w: n.tw, h: th }, anchor: "start", s: 3, rad: 0 };
      placed.push(best.b);
      n.L = { anchor: best.anchor, tx: best.anchor === "start" ? best.b.x + 1 : best.anchor === "end" ? best.b.x + best.b.w - 1 : best.b.x + best.b.w / 2,
        ty: best.b.y + th / 2, box: best.b, far: best.s >= 20,
        lx1: n.x + Math.cos(best.rad) * (n.r + 1), ly1: n.y + Math.sin(best.rad) * (n.r + 1),
        lx2: n.x + Math.cos(best.rad) * (n.r + best.s - 2), ly2: n.y + Math.sin(best.rad) * (n.r + best.s - 2) };
    });
  }
  const overlap = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
  function rectCircle(b, cx, cy, r) { const nx = Math.max(b.x, Math.min(cx, b.x + b.w)), ny = Math.max(b.y, Math.min(cy, b.y + b.h)); return (nx - cx) ** 2 + (ny - cy) ** 2 < r * r; }
  function countOverlaps(nodes) { let k = 0; for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) if (overlap(nodes[i].L.box, nodes[j].L.box)) k++; return k; }

  // ---------- Figure 1a: equal tiles ----------
  function buildTiles(w) {
    MAP = null;
    const n = w < 560, cols = n ? 3 : 7, gap = 6, tw = (w - (cols - 1) * gap) / cols, th = n ? 62 : Math.max(62, Math.min(84, tw * 0.75));
    const ids = Object.keys(TILE), pos = new Map();
    if (!n) ids.forEach(id => pos.set(id, TILE[id]));
    else ids.slice().sort((p, q) => TILE[p][1] - TILE[q][1] || TILE[p][0] - TILE[q][0]).forEach((id, i) => pos.set(id, [i % cols, Math.floor(i / cols)]));
    const rows = d3.max([...pos.values()], p => p[1]) + 1, h = rows * th + (rows - 1) * gap;
    const svg = Q2.svgIn("f1", w, h, "Equal tiles, one per CMA in rough map positions, each filled by its gap in the chosen quarter");
    svg.attr("role", "group");
    svg.append("defs").append("pattern").attr("id", "fhatch").attr("width", 7).attr("height", 7).attr("patternUnits", "userSpaceOnUse").attr("patternTransform", "rotate(45)")
      .append("line").attr("x1", 0).attr("y1", 0).attr("x2", 0).attr("y2", 7).style("stroke", "var(--hatch)").style("stroke-width", 1.6);
    const order = ids.slice().sort((p, q) => pos.get(p)[1] - pos.get(q)[1] || pos.get(p)[0] - pos.get(q)[0]);
    const g = svg.selectAll("g.tile").data(order).join("g").attr("class", "tile").attr("data-id", id => id).attr("tabindex", 0).attr("role", "button")
      .attr("transform", id => `translate(${pos.get(id)[0] * (tw + gap)},${pos.get(id)[1] * (th + gap)})`);
    g.append("rect").attr("class", "bgt").attr("width", tw).attr("height", th).attr("rx", 6);
    g.append("rect").attr("class", "hatchov").attr("width", tw).attr("height", th).attr("rx", 6);
    g.append("text").attr("class", "tn").attr("x", 8).attr("y", 17).text(id => TILENAME[id] || ent(id).short);
    g.append("text").attr("class", "tv").attr("x", 8).attr("y", th - 11);
    g.on("pointerenter", (ev, id) => setHover(id)).on("pointerleave", Q2.leave(() => setHover(null)))
      .on("focus", (ev, id) => setHover(id)).on("blur", () => setHover(null)).on("click", (ev, id) => pick(id))
      .on("keydown", (ev, id) => { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); pick(id); } });
    TILES = { w, h, svg, n };
  }

  // colours, values, outlines and labels for the chosen quarter (no rebuild, so Play stays smooth)
  function updateFig1() {
    const t = S.t, out = isOut(t), c = id => clsOf(val(id, t));
    const aria = id => `${ent(id).name}, ${LAB[t]}${out ? " (projected)" : ""}: gap ${fmt.f1(val(id, t))} percentage points (${CLS[c(id)]}); rank ${rankAt(id, t)} of ${DATA.CMAS.length}, 1 = widest. Press Enter to follow it in Figure 2.`;
    if (S.view === "map" && MAP) {
      MAP.svg.selectAll("path.cma:not(.outl)").each(function () { const id = this.dataset.id; d3.select(this).style("fill", `var(--h${c(id)})`).attr("data-cls", c(id)).attr("aria-label", aria(id)); });
      MAP.svg.selectAll("path.hatchov").style("display", out ? null : "none");
      const pd = id => (id ? (id === TB ? MAP.ipath : MAP.path)(MAP.feats.get(id)) : null);
      MAP.svg.select("path.outl.hov").attr("d", S.hover && S.hover !== S.sel ? pd(S.hover) : null);
      MAP.svg.select("path.outl.on").attr("d", pd(S.sel));
      MAP.svg.selectAll("g.labels g").each(function () { const id = this.dataset.id, tx = d3.select(this).select("text").classed("on", id === S.sel);
        tx.select("tspan.v").text(` ${fmt.f1(val(id, t))}`); });
      MAP.svg.select("text.olabel").style("display", out ? null : "none").text(out ? `OUTLOOK · ${ruleOf().label.toUpperCase()} RULE` : "");
    } else if (TILES) {
      TILES.svg.selectAll("g.tile").each(function (id) {
        const g = d3.select(this), k = c(id);
        g.classed("on", id === S.sel).classed("hov", id === S.hover && S.hover !== S.sel).attr("aria-label", aria(id)).attr("data-cls", k);
        g.select("rect.bgt").style("fill", `var(--h${k})`);
        g.select("rect.hatchov").style("display", out ? null : "none");
        g.selectAll("text").style("fill", `var(--ht${k})`);
        g.select("text.tv").text(fmt.f1(val(id, t)));
      });
    }
  }
  function setHover(id) { if (S.hover === id) return; S.hover = id; updateFig1(); card(); }
  function pick(id) { S.sel = id; S.hover = null; updateFig1(); card(); fig2(); tables(); }

  // ---------- Figure 1b: card ----------
  function card() {
    const id = S.hover || S.sel, e = ent(id), t = S.t, out = isOut(t), preview = !!S.hover && S.hover !== S.sel, n = DATA.CMAS.length;
    const v = val(id, t), k = clsOf(v), b = band(id, t), r = rankAt(id, t), row = e.rows[Math.min(t, NQ - 1)];
    const el = d3.select("#card"); el.selectAll("*").remove();
    el.append("p").attr("class", "mode").text(preview ? "Figure 1b · Preview · click to select" : "Figure 1b · Selected CMA");
    el.append("h3").text(e.name);
    el.append("p").attr("class", "per").text(`${LAB[t]} · ${phaseOf(t)}`);
    el.append("dl").attr("class", "stats").html(
      `<dt>Gap</dt><dd>${fmt.f1(v)} pp${out ? " (projected)" : ""}</dd>` +
      `<dt>Likely range</dt><dd>${out ? `${fmt.f1(b.lo)}–${fmt.f1(b.hi)} pp` : "— (data)"}</dd>` +
      `<dt>Colour class</dt><dd><i style="background:var(--h${k})"></i>${CLS[k]}</dd>` +
      `<dt>Rank (1 = widest gap)</dt><dd>${r} of ${n}</dd>` +
      `<dt>Change since ${LAB[0]}</dt><dd>${fmt.spp(v - e.rows[0].gap)} pp</dd>` +
      `<dt>OW · ODSP share</dt><dd>${out ? "not projected" : `${fmt.pct(row.sow)} · ${fmt.pct(row.sod)}`}</dd>` +
      `<dt>OW cases</dt><dd>${out ? "—" : fmt.int(row.owC)}</dd>`);
    el.append("h4").text(`Outlook for ${LAB[NT - 1]}, each rule (likely range)`);
    el.append("dl").attr("class", "stats").html(RULES.map(rl => { const o = at2030(id, rl.id);
      return `<dt>${rl.label}</dt><dd class="${rl.id === S.rule ? "rule-on" : ""}">${fmt.f1(o.p)} pp (${fmt.f1(o.lo)}–${fmt.f1(o.hi)})</dd>`; }).join(""));
    el.append("p").attr("class", "sum").html(out
      ? `<b>If its gap ${ruleOf().long},</b> it would be about ${fmt.f1(v)} pp in ${LAB[t]} (likely ${fmt.f1(b.lo)}–${fmt.f1(b.hi)} pp). This is a projection, not a forecast.`
      : `<b>In ${LAB[t]}, ${e.name}'s gap was ${fmt.f1(v)} pp:</b> ${r === 1 ? "the widest of the 15 CMAs" : r === n ? "the narrowest of the 15 CMAs" : `rank ${r} of ${n}`} (${fmt.spp(v - e.rows[0].gap)} pp since ${LAB[0]}).`);
    const last = e.rows[NQ - 1], small = last.owC < 3000;   // space kept even when hidden, so the card never changes height
    el.append("p").attr("class", "warn").style("visibility", small ? null : "hidden").attr("aria-hidden", small ? null : "true")
      .text(`Small caseload (${fmt.int(last.owC)} OW cases in ${LAB[NQ - 1]}): its shares move more from quarter to quarter, so single quarters and projections are less reliable.`);
  }

  // ---------- Figure 2: the selected CMA, data and the three rules ----------
  function dodge(ts, gap, lo, hi) { // labels spread vertically; overlapping ones merge into clusters centred on their points
    const ord = ts.map((t, i) => i).sort((a, b) => ts[a] - ts[b] || a - b);
    let cl = ord.map(i => ({ ids: [i], mean: ts[i] }));
    const top = c => c.mean - (c.ids.length - 1) * gap / 2;
    for (let again = true; again;) { again = false;
      for (let k = 0; k < cl.length - 1; k++) { const A = cl[k], B = cl[k + 1];
        if (top(A) + A.ids.length * gap > top(B) + 1e-9) { const ids = A.ids.concat(B.ids); cl.splice(k, 2, { ids, mean: d3.mean(ids, i => ts[i]) }); again = true; break; } } }
    const out = new Array(ts.length);
    cl.forEach(c => { const t0 = Math.max(lo, Math.min(top(c), hi - (c.ids.length - 1) * gap)); c.ids.forEach((i, j) => (out[i] = t0 + j * gap)); });
    for (let k = 1; k < ord.length; k++) out[ord[k]] = Math.max(out[ord[k]], out[ord[k - 1]] + gap);
    return out;
  }
  function fig2() {
    const e = ent(S.sel), w = Q2.W("f2"), n = w < 560, m = { t: 26, r: n ? 104 : 150, b: 30, l: 48 }, h = n ? 300 : 330, iw = w - m.l - m.r, ih = h - m.t - m.b;
    document.getElementById("f2Title").textContent = `${e.name}: the gap every quarter, ${LAB[0]} – ${LAB[NQ - 1]}, and the three outlook rules to ${LAB[NT - 1]}`;
    const x = d3.scaleTime().domain([tDate(0), tDate(NT - 1)]).range([0, iw]), y = d3.scaleLinear().domain([0, 40]).range([ih, 0]);
    const svg = Q2.svgIn("f2", w, h, `${e.name}: gap every quarter with three outlook rules`), g = svg.append("g").attr("transform", `translate(${m.l},${m.t})`);
    // colour strip on the left: the map's classes
    const edges = [0, ...BRK, 40];
    edges.slice(0, -1).forEach((v0, k) => g.append("rect").attr("x", -14).attr("width", 7).attr("y", y(edges[k + 1])).attr("height", y(v0) - y(edges[k + 1])).style("fill", `var(--h${k})`));
    g.append("g").attr("class", "grid").call(d3.axisLeft(y).tickValues([10, 20, 30, 40]).tickSize(-iw).tickFormat(""));
    g.append("g").attr("class", "axis").attr("transform", "translate(-16,0)").call(d3.axisLeft(y).tickValues([0, 10, 20, 30, 40]).tickSizeOuter(0)).call(a => a.select(".domain").remove());
    g.append("text").attr("class", "lbl").attr("x", -m.l + 2).attr("y", -12).style("font-size", "11px").text("Gap, ODSP share − OW share (pp)");
    Q2.covidBand(g, x, ih, true);
    const xo = x(tDate(NQ - 1));
    g.append("rect").attr("x", xo).attr("width", iw - xo).attr("height", ih).style("fill", "var(--outlook)");
    g.append("text").attr("class", "lbl").attr("x", xo + 4).attr("y", n ? 25 : 11).style("font-size", "11px").style("font-weight", 600).text("Outlook");
    g.append("g").attr("class", "axis").attr("transform", `translate(0,${ih})`).call(d3.axisBottom(x).ticks(d3.timeYear.every(n ? 9 : 3)).tickFormat(d3.timeFormat("%Y")).tickSizeOuter(0));
    const ln = d3.line().x(r => x(r.date)).y(r => y(r.gap));
    g.append("path").datum(DATA.ONT.rows).attr("class", "f2ont").attr("d", ln);
    g.append("path").datum(e.rows).attr("class", "f2act").attr("d", ln);
    const pts = rid => d3.range(HZ + 1).map(hh => ({ d: tDate(NQ - 1 + hh), ...OUT[rid].get(e.id)[hh] }));
    const on = pts(S.rule);
    g.append("path").datum(on).attr("class", "f2band").attr("d", d3.area().x(d => x(d.d)).y0(d => y(d.lo)).y1(d => y(d.hi)));
    RULES.slice().sort((a, b) => (a.id === S.rule) - (b.id === S.rule)).forEach(rl => g.append("path").datum(pts(rl.id)).attr("class", "f2rule" + (rl.id === S.rule ? " on" : "")).attr("data-rule", rl.id)
      .attr("d", d3.line().x(d => x(d.d)).y(d => y(d.p))));
    const ends = RULES.map(rl => at2030(e.id, rl.id).p), ly = dodge(ends.map(v => y(v)), 15, 6, ih - 4);
    RULES.forEach((rl, k) => g.append("text").attr("class", rl.id === S.rule ? "lbl-strong" : "lbl").attr("x", iw + 6).attr("y", ly[k] + 4).style("font-size", "11.5px")
      .text(`${n ? rl.short : rl.label} ${fmt.f1(ends[k])}`));
    const mk = g.append("g").attr("class", "f2m");
    mk.append("line").attr("class", "f2now").attr("y1", 0).attr("y2", ih);
    mk.append("circle").attr("class", "f2dot").attr("r", 4.5);
    F2 = { x, y, mk };
    f2Marker();
    const g0 = e.rows[0].gap, gN = e.rows[NQ - 1].gap, lo = d3.min(ends), hi = d3.max(ends);
    document.getElementById("f2Read").innerHTML = `<b>${e.name}:</b> ${fmt.f1(g0)} pp in ${LAB[0]}, ${fmt.f1(gN)} pp in ${LAB[NQ - 1]}. For ${LAB[NT - 1]} the rules give ` +
      `${fmt.f1(ends[0])} (convergence), ${fmt.f1(ends[1])} (no change) and ${fmt.f1(ends[2])} pp (10-year trend); they differ by ${fmt.f1(r1(hi) - r1(lo))} pp.`;
    document.getElementById("f2Note").textContent = `Solid black: this CMA's data; dotted: Ontario as a whole (data only). In the outlook the bold line is the chosen rule (${ruleOf().label}) and the shaded band its likely range, the middle 80% of its past misses at each distance ahead; dashed lines are the other two rules. The 10-year trend starts from its fitted line, not from the last value, so it can jump at ${LAB[NQ - 1]}. The strip on the left repeats the map's colour classes. The dashed vertical line follows the quarter slider.`;
  }
  function f2Marker() {
    if (!F2) return;
    const t = S.t, xx = F2.x(tDate(t)), v = val(S.sel, t);
    F2.mk.select("line").attr("x1", xx).attr("x2", xx);
    F2.mk.select("circle").attr("cx", xx).attr("cy", F2.y(v));
  }

  // ---------- Tables 1–2 ----------
  function tables() {
    const H4 = 4, H8 = 8, best = RULES.reduce((a, b) => (BT[b.id].mae[HZ] < BT[a.id].mae[HZ] ? b : a));
    const bias = v => (Math.abs(v) < 0.05 ? "about right" : `${fmt.f1(Math.abs(v))} too ${v > 0 ? "low" : "high"}`);
    d3.select("#skill").html(`<div class="tbl-wrap"><table><thead><tr><th>Rule</th><th>1 year ahead</th><th>2 years</th><th>${HZ} quarters (to ${LAB[NT - 1]})</th><th>On average, ${HZ} quarters</th></tr></thead><tbody>` +
      RULES.map(rl => { const B = BT[rl.id]; return `<tr class="${rl.id === best.id ? "best" : ""}" data-rule="${rl.id}"><td>${rl.label}</td><td>${fmt.f1(B.mae[H4])}</td><td>${fmt.f1(B.mae[H8])}</td><td>${fmt.f1(B.mae[HZ])}</td><td>${bias(B.bias[HZ])}</td></tr>`; }).join("") +
      `</tbody></table></div>`);
    const nb = BT.conv.n;
    document.getElementById("skillNote").textContent = `Average miss = mean of |actual gap − projected gap| over the 15 CMAs and every starting quarter from ${LAB[BT.first]} on, using only the data up to that quarter ` +
      `(${fmt.int(nb[H4])} projections 1 year ahead, ${fmt.int(nb[HZ])} for ${HZ} quarters ahead, the last starting in ${LAB[NQ - 1 - HZ]}). "Too low" means the rule projected a narrower gap than happened. ` +
      `Bold: the smallest miss ${HZ} quarters ahead (${RULES.map(rl => `${rl.label.toLowerCase()} ${BT[rl.id].mae[HZ].toFixed(2)}`).join(", ")} to two decimals). "No change" is the yardstick: a rule that cannot clearly beat it adds little.`;
    const rows = DATA.CMAS.map(c => ({ c, now: c.rows[NQ - 1].gap, o: Object.fromEntries(RULES.map(rl => [rl.id, at2030(c.id, rl.id)])) }))
      .sort((a, b) => b.o[S.rule].p - a.o[S.rule].p || d3.ascending(a.c.name, b.c.name));
    document.getElementById("outTitle").textContent = `Outlook for ${LAB[NT - 1]}, sorted by the ${ruleOf().label.toLowerCase()} rule (likely range in brackets)`;
    const cell = o => `${fmt.f1(o.p)} <span class="hint">(${fmt.f1(o.lo)}–${fmt.f1(o.hi)})</span>`;
    d3.select("#outTbl").html(`<div class="tbl-wrap"><table><thead><tr><th>CMA</th><th>${LAB[NQ - 1]}</th>${RULES.map(rl => `<th${rl.id === S.rule ? ' style="text-decoration:underline"' : ""}>${rl.label}</th>`).join("")}</tr></thead><tbody>` +
      rows.map(r => `<tr tabindex="0" data-id="${r.c.id}" class="${r.c.id === S.sel ? "on" : ""}"><td><i style="background:var(--h${clsOf(r.o[S.rule].p)})"></i>${r.c.name}</td><td>${fmt.f1(r.now)}</td>${RULES.map(rl => `<td>${cell(r.o[rl.id])}</td>`).join("")}</tr>`).join("") +
      `</tbody></table></div>`);
    d3.selectAll("#outTbl tbody tr").on("click", function () { pick(this.dataset.id); })
      .on("keydown", function (ev) { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); const id = this.dataset.id; pick(id); Q2.refocus("#outTbl tbody tr", id); } });
  }

  // ---------- take-aways ----------
  function takeaway() {
    const C = DATA.CMAS, n = C.length, dark = t => C.filter(c => clsOf(c.rows[t].gap) >= 4).length, T = NQ - 1;
    const widest = d3.greatest(C, c => c.rows[T].gap), p = C.map(c => at2030(c.id, S.rule).p), now = C.map(c => c.rows[T].gap);
    const diffs = C.map(c => { const v = RULES.map(rl => at2030(c.id, rl.id).p); return { c, d: r1(d3.max(v)) - r1(d3.min(v)) }; }), dmax = d3.greatest(diffs, d => d.d);
    document.getElementById("f1Take").innerHTML = `<b>From dark to light.</b> In ${LAB[0]}, ${dark(0)} of the ${n} CMAs had a gap of 25 pp or more (the two darkest classes); in ${LAB[T]}, ${dark(T) === 0 ? "none" : dark(T)} did, ` +
      `and the widest gap was ${fmt.f1(widest.rows[T].gap)} pp (${widest.name}). On the ${ruleOf().label.toLowerCase()} rule, the ${LAB[NT - 1]} gaps would span ${fmt.f1(d3.min(p))}–${fmt.f1(d3.max(p))} pp ` +
      `(${LAB[T]}: ${fmt.f1(d3.min(now))}–${fmt.f1(d3.max(now))} pp); for one CMA the three rules differ by up to ${fmt.f1(dmax.d)} pp (${dmax.c.name}), a reminder that the outlook is a projection.`;
  }
  function outlookCard() {
    const diffs = DATA.CMAS.map(c => { const v = RULES.map(rl => at2030(c.id, rl.id).p); return { c, d: r1(d3.max(v)) - r1(d3.min(v)) }; }), dmax = d3.greatest(diffs, d => d.d);
    const mae = id => fmt.f1(BT[id].mae[HZ]);
    d3.select("#cards").append("div").attr("class", "card").attr("id", "outCard").html(`<h3>About the outlook</h3><ul>` +
      `<li>Tested from ${LAB[BT.first]} on, ${HZ} quarters ahead the rules missed by ${mae("conv")} pp (convergence), ${mae("naive")} pp (no change) and ${mae("trend")} pp (10-year trend) on average.</li>` +
      `<li>The rules know nothing about future policy, benefit rates, caseload growth or the economy; a change in either program would break them.</li>` +
      `<li>They disagree most for ${dmax.c.name}: ${fmt.f1(dmax.d)} pp apart in ${LAB[NT - 1]}.</li>` +
      `<li>A projected gap is not a target, and a narrower gap does not mean that needs converged.</li></ul>`);
  }
})();
