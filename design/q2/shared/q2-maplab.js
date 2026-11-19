/* Q2 map lab — the shared engine of extra versions G–K (map forms of version F).
   Everything except Figure 1a comes from version F (design/q2/variants/f-heatmap/f.js, copied, F itself unchanged):
   data, the three outlook rules and their back-test, the quarter slider / Play / key moments, the card (Figure 1b),
   Figure 2, Tables 1–2 and the take-aways. New here: the change against a year earlier (and its five classes), a
   "Show" switch between gap size and change, and one data-* convention for every mark in Figure 1a
   (data-id, data-t, data-v = printed value, data-c = colour class) so the checks can read what is drawn.
   Each version supplies Figure 1a through MapLab.start({ fig1: { render(A), update(A), note(A) }, modes, ... }).
   Every number is computed in the browser from the course CSVs. */
(() => {
  "use strict";
  const { fmt } = Q2;
  const GEO = "../../../../datasets/EXTERNAL/CMA-BOUNDARIES/";
  const HZ = 19, WIN = 40, BRK = [10, 15, 20, 25, 30];
  const CLS = ["under 10", "10–15", "15–20", "20–25", "25–30", "30 or more"];
  const CHG = ["narrowed 1.5+", "narrowed 0.5–1.5", "within ±0.5", "widened 0.5–1.5", "widened 1.5+"];
  const RULES = [
    { id: "conv", label: "Convergence", short: "Conv.", long: "keeps moving toward the middle CMA's gap at the past rate" },
    { id: "naive", label: "No change", short: "No change", long: "stays at its latest value" },
    { id: "trend", label: "10-year trend", short: "Trend", long: "follows its straight-line trend of the last 10 years" }];
  const MODES = { level: { id: "level", label: "Gap size" }, yoy: { id: "yoy", label: "Change vs a year earlier" } };
  const MAIN_BOX = [-84.9, 41.75, -74.5, 47.35], TB = "595";
  const MAPNAME = { 505: "Ottawa", 539: "Niagara", 541: "Kitchener–Waterloo", 580: "Sudbury" };
  const TILENAME = { 505: "Ottawa", 539: "Niagara", 541: "Kitchener–W.", 580: "Sudbury" };
  const TILE = { 595: [0, 0], 580: [2, 0], 505: [6, 0], 568: [3, 1], 529: [4, 1], 521: [5, 1], 541: [1, 2], 550: [2, 2], 535: [3, 2], 532: [4, 2],
    559: [0, 3], 555: [1, 3], 543: [2, 3], 537: [3, 3], 539: [4, 3] };
  const S = { t: 0, sel: null, hover: null, rule: "conv", mode: "level", timer: null };
  let V, A, DATA, F, GEOJ, OUTLINE, NQ, NT, LAB, OUT, BT, MED, F2 = null, WID = null;
  const syncs = [];
  const ent = id => DATA.ALL.find(e => e.id === id);
  const r1 = v => Math.round(v * 10) / 10;
  const clsOf = v => BRK.filter(b => r1(v) >= b).length;
  const chgClsOf = v => { const c = r1(v); return Math.abs(c) < 0.5 ? 2 : c <= -1.5 ? 0 : c < 0 ? 1 : c >= 1.5 ? 4 : 3; };
  const ruleOf = () => RULES.find(r => r.id === S.rule);

  function start(cfg) {
    V = cfg;
    Promise.all([Q2.load("../../../../"), d3.json(GEO + "ont-cma-boundaries.geojson"), d3.json(GEO + "ont-province-outline.geojson")]).then(([d, geo, outline]) => {
      DATA = d; F = d.F; NQ = Q2.N; NT = NQ + HZ;
      const fix = poly => (d3.geoArea({ type: "Polygon", coordinates: poly }) > 2 * Math.PI ? poly.map(ring => ring.slice().reverse()) : poly);
      const rewind = fc => { fc.features.forEach(f => { const g = f.geometry; g.coordinates = g.type === "Polygon" ? fix(g.coordinates) : g.coordinates.map(fix); }); return fc; };
      GEOJ = rewind(geo); OUTLINE = rewind(outline);
      const missing = DATA.CMAS.filter(c => !GEOJ.features.some(f => f.properties.cma_code === c.id));
      if (missing.length) console.error("CMAs without a boundary:", missing.map(c => c.name));
      LAB = labels(); outlook();
      // the quarter with the most CMAs whose gap was wider than a year earlier (data only)
      WID = d3.greatest(d3.range(4, NQ).map(t => ({ t, n: DATA.CMAS.filter(c => c.rows[t].gap > c.rows[t - 4].gap).length })), d => d.n);
      A = api();
      window.__facts = F; window.__out = { OUT, BT, MED, LAB, NQ, NT, HZ, WID };
      S.sel = F.endWidest.e.id; S.mode = (V.modes || ["level"])[0];
      const U = new URLSearchParams(location.search), ti = LAB.findIndex(l => l.replace(" ", "") === U.get("t"));
      if (ti >= 0) S.t = ti;
      if (DATA.CMAS.some(c => c.id === U.get("cma"))) S.sel = U.get("cma");
      if (RULES.some(r => r.id === U.get("rule"))) S.rule = U.get("rule");
      if ((V.modes || []).includes(U.get("show"))) S.mode = U.get("show");
      Q2.themeButton(render);
      document.getElementById("lead").innerHTML = Q2.lead(F);
      document.getElementById("defTest").textContent = `Each rule was run from every quarter from ${LAB[WIN - 1]} (the first with 10 years of data before it) to ${LAB[NQ - 2]}, ` +
        `using only the data up to that quarter, and compared with what happened later. The "likely range" is the middle 80% of those past misses at the same distance ahead.`;
      Q2.renderCards(F); outlookCard();
      build(); render();
      Q2.onResize(() => render());
      document.body.dataset.ready = "1";
    }).catch(Q2.fail);
  }

  function labels() {
    const L = Q2.QS.map(r => r.label), last = Q2.QS[NQ - 1];
    let y = last.year, q = last.quarter;
    for (let h = 1; h <= HZ; h++) { q++; if (q > 4) { q = 1; y++; } L.push(`${y} Q${q}`); }
    return L;
  }
  const tDate = t => { if (t < NQ) return Q2.QS[t].date; const [y, q] = LAB[t].split(" Q").map(Number); return new Date(y, 3 * q - 1, 1); };
  const isOut = t => t >= NQ;
  const phaseOf = t => (t < NQ ? (Q2.PH[Q2.QS[t].phase] ? Q2.PH[Q2.QS[t].phase].long : "") : `outlook, ${ruleOf().label.toLowerCase()} rule`);

  // ---------- the outlook (as version F) ----------
  function outlook() {
    const C = DATA.CMAS, T = NQ - 1, G = new Map(C.map(c => [c.id, c.rows.map(r => r.gap)]));
    MED = d3.range(NQ).map(t => d3.median(C, c => c.rows[t].gap));
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
  const chg = (id, t, rule = S.rule) => (t >= 4 ? val(id, t, rule) - val(id, t - 4, rule) : null);
  const rankAt = (id, t) => 1 + DATA.CMAS.filter(c => val(c.id, t) > val(id, t)).length;
  const at2030 = (id, rule) => OUT[rule].get(id)[HZ];
  // what Figure 1a shows for one CMA in one quarter, in the current mode: printed value and colour class
  function shown(id, t) {
    if (S.mode === "yoy") { const v = chg(id, t); return v === null ? { v: null, txt: "—", c: 2, none: true } : { v, txt: fmt.spp(v), c: chgClsOf(v) }; }
    const v = val(id, t); return { v, txt: fmt.f1(v), c: clsOf(v) };
  }
  const fillVar = c => `var(--${S.mode === "yoy" ? "c" : "h"}${c})`;
  const inkVar = c => `var(--${S.mode === "yoy" ? "ct" : "ht"}${c})`;

  // ---------- map geometry shared by the map versions (Part 3's projection and framing) ----------
  function bboxPoints(lon0, lat0, lon1, lat1) {
    const pts = [];
    for (let t = 0; t <= 1.0001; t += 0.1) { const lo = lon0 + (lon1 - lon0) * t, la = lat0 + (lat1 - lat0) * t; pts.push([lo, lat0], [lo, lat1], [lon0, la], [lon1, la]); }
    return { type: "MultiPoint", coordinates: pts };
  }
  function mapGeom(w, opt = {}) {
    const pad = 6, n = w < 560, box = bboxPoints(...MAIN_BOX);
    const proj = d3.geoConicConformal().parallels([43, 46.5]).rotate([79.7, 0]).fitWidth(w - 2 * pad, box);
    const b = d3.geoPath(proj).bounds(box);
    proj.translate([proj.translate()[0] + pad - b[0][0], proj.translate()[1] + pad - b[0][1]]);
    const h0 = Math.ceil(b[1][1] - b[0][1] + 2 * pad);
    const noInset = opt.noInset, stack = n && !noInset;
    const insetW = n ? 150 : Math.round(Math.min(176, Math.max(150, w * 0.26))), insetH = Math.round(insetW * 0.98);
    const inset = noInset ? null : { x: 6, y: stack ? h0 + 6 : 6, w: insetW, h: insetH };
    const h = stack ? h0 + insetH + 12 : h0;
    const iproj = inset ? d3.geoConicConformal().parallels([44, 52]).rotate([85, 0]).fitExtent([[inset.x + 6, inset.y + 6], [inset.x + inset.w - 6, inset.y + inset.h - 30]], OUTLINE) : null;
    const feats = GEOJ.features.filter(f => DATA.CMAS.some(c => c.id === f.properties.cma_code));
    const south = feats.filter(f => f.properties.cma_code !== TB).sort((p, q) => d3.geoCentroid(p)[0] - d3.geoCentroid(q)[0]);
    const tbf = feats.find(f => f.properties.cma_code === TB);
    const km = Math.round((d3.geoDistance(d3.geoCentroid(tbf), d3.geoCentroid(feats.find(f => f.properties.cma_code === "535"))) * 6371) / 10) * 10;
    return { w, h, h0, n, proj, iproj, path: d3.geoPath(proj), ipath: iproj ? d3.geoPath(iproj) : null, inset, feats: new Map(feats.map(f => [f.properties.cma_code, f])), south, tbf, km };
  }
  function drawInset(svg, G, cls) {
    const { inset, ipath, tbf, km } = G, ig = svg.append("g").attr("class", "inset");
    ig.append("rect").attr("class", "inset-box").attr("x", inset.x).attr("y", inset.y).attr("width", inset.w).attr("height", inset.h).attr("rx", 4);
    ig.append("path").datum(OUTLINE).attr("d", ipath).style("fill", "var(--land)").style("stroke", "var(--land-line)").style("stroke-width", .6);
    const tb = ig.append("path").datum(tbf).attr("class", cls || "cma").attr("data-id", TB).attr("d", ipath);
    const edge = [[MAIN_BOX[0], MAIN_BOX[1]], [MAIN_BOX[2], MAIN_BOX[1]], [MAIN_BOX[2], MAIN_BOX[3]], [MAIN_BOX[0], MAIN_BOX[3]], [MAIN_BOX[0], MAIN_BOX[1]]].map(p => G.iproj(p));
    ig.append("path").attr("d", d3.line()(edge)).style("fill", "none").style("stroke", "var(--ink2)").style("stroke-width", 1);
    ig.append("text").attr("class", "lbl").attr("x", inset.x + 6).attr("y", inset.y + inset.h - 20).style("font-size", "10px").text("All Ontario · box = main map");
    ig.append("text").attr("class", "lbl").attr("x", inset.x + 6).attr("y", inset.y + inset.h - 6).style("font-size", "10px").text(`≈ ${km} km NW of Toronto`);
    return { ig, tb };
  }
  function hatch(svg, id = "fhatch", gap = 7) {
    svg.append("defs").append("pattern").attr("id", id).attr("width", gap).attr("height", gap).attr("patternUnits", "userSpaceOnUse").attr("patternTransform", "rotate(45)")
      .append("line").attr("x1", 0).attr("y1", 0).attr("x2", 0).attr("y2", gap).style("stroke", "var(--hatch)").style("stroke-width", 1.6);
  }
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
  // hover / select / keyboard on any element carrying data-id
  function interactive(sel, focusable = true) {
    if (focusable) sel.attr("tabindex", 0).attr("role", "button");
    sel.on("pointerenter", function () { setHover(this.dataset.id); }).on("pointerleave", Q2.leave(() => setHover(null)))
      .on("click", function () { pick(this.dataset.id); });
    if (focusable) sel.on("focus", function () { setHover(this.dataset.id); }).on("blur", () => setHover(null))
      .on("keydown", function (ev) { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); pick(this.dataset.id); } });
  }
  const aria = (id, t) => { const s = shown(id, t);
    return `${ent(id).name}, ${LAB[t]}${isOut(t) ? " (projected)" : ""}: gap ${fmt.f1(val(id, t))} percentage points` +
      (chg(id, t) === null ? "" : `, ${fmt.spp(chg(id, t))} against a year earlier`) + `; rank ${rankAt(id, t)} of ${DATA.CMAS.length}, 1 = widest. Press Enter to follow it in Figure 2.` + (s.none ? "" : ""); };

  function api() {
    return { S, fmt, LAB, NQ, NT, HZ, RULES, CLS, CHG, BRK, TB, MAIN_BOX, MAPNAME, TILENAME, TILE, ent, r1, val, band, chg, clsOf, chgClsOf, shown, fillVar, inkVar,
      rankAt, isOut, tDate, ruleOf, mapGeom, drawInset, hatch, placeLabels, countOverlaps, interactive, aria, setHover, pick, setT,
      get DATA() { return DATA; }, get GEOJ() { return GEOJ; }, get OUTLINE() { return OUTLINE; }, get WID() { return WID; }, keyMoments };
  }

  // ---------- controls ----------
  function keyMoments() { return [0, Q2.I19, WID.t, Q2.I23, NQ - 1, NT - 1].filter((t, i, a) => a.indexOf(t) === i); }
  function build() {
    const MOM = keyMoments().map(t => ({ t, label: LAB[t] + (t === NQ - 1 ? " (latest)" : t === NT - 1 ? " (outlook)" : "") }));
    syncs.push(Q2.seg("#momentSeg", MOM, m => m.label, m => S.t === m.t, m => { stop(); setT(m.t); }));
    if (document.getElementById("modeSeg")) syncs.push(Q2.seg("#modeSeg", (V.modes || []).map(m => MODES[m]), m => m.label, m => S.mode === m.id, m => { S.mode = m.id; render(); }));
    syncs.push(Q2.seg("#ruleSeg", RULES, r => r.label, r => S.rule === r.id, r => { S.rule = r.id; render(); }));
    const sl = document.getElementById("tSlider"); sl.max = NT - 1;
    sl.addEventListener("input", () => { stop(); setT(+sl.value); });
    document.getElementById("playBtn").addEventListener("click", () => (S.timer ? stop() : play()));
  }
  function legend() {
    const sw = (v, c) => `<svg width="14" height="14"><rect width="14" height="14" rx="2" style="fill:var(--${v}${c});stroke:var(--ring)"/></svg>`;
    const hat = `<span><svg width="14" height="14"><defs><pattern id="khatch" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="5" style="stroke:var(--hatch);stroke-width:1.5"/></pattern></defs><rect width="14" height="14" rx="2" style="fill:var(--h2)"/><rect width="14" height="14" rx="2" style="fill:url(#khatch)"/></svg>Hatched = outlook (projection)</span>`;
    const own = V.legend ? V.legend(A) : null;
    document.getElementById("f1Key").innerHTML = own != null ? own + hat
      : S.mode === "yoy" ? `<span class="lab-t">Gap against a year earlier (pp):</span>` + CHG.map((l, c) => `<span>${sw("c", c)}${l}</span>`).join("") + hat
      : `<span class="lab-t">Gap (pp):</span>` + CLS.map((l, c) => `<span>${sw("h", c)}${l}</span>`).join("") + hat;
  }
  const sync = () => syncs.forEach(f => f());
  function render() { sync(); nowText(); tBar(); legend(); V.fig1.render(A); V.fig1.update(A); document.getElementById("f1Note").textContent = V.fig1.note(A); card(); fig2(); tables(); takeaway(); }
  function setT(t) { S.t = Math.max(0, Math.min(NT - 1, t)); sync(); nowText(); V.fig1.update(A); card(); f2Marker(); btn(); }
  function setHover(id) { if (S.hover === id) return; S.hover = id; V.fig1.update(A); card(); }
  function pick(id) { S.sel = id; S.hover = null; V.fig1.update(A); card(); fig2(); tables(); }
  function play() {
    if (S.t >= NT - 1) S.t = -1;
    const step = () => {
      if (S.t >= NT - 1) { stop(true); return; }
      setT(S.t + 1);
      S.timer = setTimeout(step, S.t === NQ - 1 ? 1100 : Q2.reduced() ? 220 : (V.tick || 85));
      btn();
    };
    document.body.dataset.play = "playing";
    S.timer = setTimeout(step, 0); btn();
  }
  function stop(done) { if (S.timer) { clearTimeout(S.timer); S.timer = null; document.body.dataset.play = done ? "done" : "paused"; } btn(); }
  function btn() { document.getElementById("playBtn").textContent = S.timer ? "Pause" : S.t >= NT - 1 ? "Replay" : "Play"; }
  function nowText() {
    const t = S.t, sl = document.getElementById("tSlider");
    sl.value = t; sl.setAttribute("aria-valuetext", `${LAB[t]}, ${phaseOf(t)}`);
    document.getElementById("tNow").innerHTML = `<b>${LAB[t]}</b> · ${phaseOf(t)}${isOut(t) ? '<span class="tag">projection</span>' : ""}`;
    document.getElementById("f1Title").textContent = (V.fig1.title ? V.fig1.title(A) : (S.mode === "yoy"
      ? `Change in each CMA's gap against a year earlier, ${LAB[t]}` : `Gap between the ODSP and OW single-person shares in each CMA, ${LAB[t]}`)) +
      (isOut(t) && !V.fig1.title ? ` (outlook, ${ruleOf().label.toLowerCase()} rule)` : "");
  }
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

  // ---------- Figure 1b: card ----------
  function card() {
    const id = S.hover || S.sel, e = ent(id), t = S.t, out = isOut(t), preview = !!S.hover && S.hover !== S.sel, n = DATA.CMAS.length;
    const v = val(id, t), k = clsOf(v), b = band(id, t), r = rankAt(id, t), row = e.rows[Math.min(t, NQ - 1)], dv = chg(id, t);
    const el = d3.select("#card"); el.selectAll("*").remove();
    el.append("p").attr("class", "mode").text(preview ? "Figure 1b · Preview · click to select" : "Figure 1b · Selected CMA");
    el.append("h3").text(e.name);
    el.append("p").attr("class", "per").text(`${LAB[t]} · ${phaseOf(t)}`);
    el.append("dl").attr("class", "stats").html(
      `<dt>Gap</dt><dd><i style="background:var(--h${k})"></i>${fmt.f1(v)} pp${out ? " (projected)" : ""}</dd>` +
      `<dt>Likely range</dt><dd>${out ? `${fmt.f1(b.lo)}–${fmt.f1(b.hi)} pp` : "— (data)"}</dd>` +
      `<dt>Against a year earlier</dt><dd>${dv === null ? "— (no earlier year)" : `<i style="background:var(--c${chgClsOf(dv)})"></i>${fmt.spp(dv)} pp ${dv > 0 && r1(dv) !== 0 ? "▲" : r1(dv) < 0 ? "▼" : ""}`}</dd>` +
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
    const last = e.rows[NQ - 1], small = last.owC < 3000;
    el.append("p").attr("class", "warn").style("visibility", small ? null : "hidden").attr("aria-hidden", small ? null : "true")
      .text(`Small caseload (${fmt.int(last.owC)} OW cases in ${LAB[NQ - 1]}): its shares move more from quarter to quarter, so single quarters and projections are less reliable.`);
  }

  // ---------- Figure 2 (as version F) ----------
  function dodge(ts, gap, lo, hi) {
    const ord = ts.map((t, i) => i).sort((a, b) => ts[a] - ts[b] || a - b);
    let cl = ord.map(i => ({ ids: [i], mean: ts[i] }));
    const top = c => c.mean - (c.ids.length - 1) * gap / 2;
    for (let again = true; again;) { again = false;
      for (let k = 0; k < cl.length - 1; k++) { const P = cl[k], Q = cl[k + 1];
        if (top(P) + P.ids.length * gap > top(Q) + 1e-9) { const ids = P.ids.concat(Q.ids); cl.splice(k, 2, { ids, mean: d3.mean(ids, i => ts[i]) }); again = true; break; } } }
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
    g.append("path").datum(pts(S.rule)).attr("class", "f2band").attr("d", d3.area().x(d => x(d.d)).y0(d => y(d.lo)).y1(d => y(d.hi)));
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
    const lo = d3.min(ends), hi = d3.max(ends);
    document.getElementById("f2Read").innerHTML = `<b>${e.name}:</b> ${fmt.f1(e.rows[0].gap)} pp in ${LAB[0]}, ${fmt.f1(e.rows[NQ - 1].gap)} pp in ${LAB[NQ - 1]}. For ${LAB[NT - 1]} the rules give ` +
      `${fmt.f1(ends[0])} (convergence), ${fmt.f1(ends[1])} (no change) and ${fmt.f1(ends[2])} pp (10-year trend); they differ by ${fmt.f1(r1(hi) - r1(lo))} pp.`;
    document.getElementById("f2Note").textContent = `Solid black: this CMA's data; dotted: Ontario as a whole (data only). In the outlook the bold line is the chosen rule (${ruleOf().label}) and the shaded band its likely range, the middle 80% of its past misses at each distance ahead; dashed lines are the other two rules. The 10-year trend starts from its fitted line, not from the last value, so it can jump at ${LAB[NQ - 1]}. The strip on the left repeats the gap-size colour classes. The dashed vertical line follows the quarter slider.`;
  }
  function f2Marker() { if (!F2) return; const xx = F2.x(tDate(S.t)); F2.mk.select("line").attr("x1", xx).attr("x2", xx); F2.mk.select("circle").attr("cx", xx).attr("cy", F2.y(val(S.sel, S.t))); }

  // ---------- Tables 1–2 (as version F) ----------
  function tables() {
    const best = RULES.reduce((a, b) => (BT[b.id].mae[HZ] < BT[a.id].mae[HZ] ? b : a));
    const bias = v => (Math.abs(v) < 0.05 ? "about right" : `${fmt.f1(Math.abs(v))} too ${v > 0 ? "low" : "high"}`);
    d3.select("#skill").html(`<div class="tbl-wrap"><table><thead><tr><th>Rule</th><th>1 year ahead</th><th>2 years</th><th>${HZ} quarters (to ${LAB[NT - 1]})</th><th>On average, ${HZ} quarters</th></tr></thead><tbody>` +
      RULES.map(rl => { const B = BT[rl.id]; return `<tr class="${rl.id === best.id ? "best" : ""}" data-rule="${rl.id}"><td>${rl.label}</td><td>${fmt.f1(B.mae[4])}</td><td>${fmt.f1(B.mae[8])}</td><td>${fmt.f1(B.mae[HZ])}</td><td>${bias(B.bias[HZ])}</td></tr>`; }).join("") + `</tbody></table></div>`);
    const nb = BT.conv.n;
    document.getElementById("skillNote").textContent = `Average miss = mean of |actual gap − projected gap| over the 15 CMAs and every starting quarter from ${LAB[BT.first]} on, using only the data up to that quarter ` +
      `(${fmt.int(nb[4])} projections 1 year ahead, ${fmt.int(nb[HZ])} for ${HZ} quarters ahead, the last starting in ${LAB[NQ - 1 - HZ]}). "Too low" means the rule projected a narrower gap than happened. ` +
      `Bold: the smallest miss ${HZ} quarters ahead (${RULES.map(rl => `${rl.label.toLowerCase()} ${BT[rl.id].mae[HZ].toFixed(2)}`).join(", ")} to two decimals). "No change" is the yardstick: a rule that cannot clearly beat it adds little.`;
    const rows = DATA.CMAS.map(c => ({ c, now: c.rows[NQ - 1].gap, o: Object.fromEntries(RULES.map(rl => [rl.id, at2030(c.id, rl.id)])) }))
      .sort((a, b) => b.o[S.rule].p - a.o[S.rule].p || d3.ascending(a.c.name, b.c.name));
    document.getElementById("outTitle").textContent = `Outlook for ${LAB[NT - 1]}, sorted by the ${ruleOf().label.toLowerCase()} rule (likely range in brackets)`;
    const cell = o => `${fmt.f1(o.p)} <span class="hint">(${fmt.f1(o.lo)}–${fmt.f1(o.hi)})</span>`;
    d3.select("#outTbl").html(`<div class="tbl-wrap"><table><thead><tr><th>CMA</th><th>${LAB[NQ - 1]}</th>${RULES.map(rl => `<th${rl.id === S.rule ? ' style="text-decoration:underline"' : ""}>${rl.label}</th>`).join("")}</tr></thead><tbody>` +
      rows.map(r => `<tr tabindex="0" data-id="${r.c.id}" class="${r.c.id === S.sel ? "on" : ""}"><td><i style="background:var(--h${clsOf(r.o[S.rule].p)})"></i>${r.c.name}</td><td>${fmt.f1(r.now)}</td>${RULES.map(rl => `<td>${cell(r.o[rl.id])}</td>`).join("")}</tr>`).join("") + `</tbody></table></div>`);
    d3.selectAll("#outTbl tbody tr").on("click", function () { pick(this.dataset.id); })
      .on("keydown", function (ev) { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); const id = this.dataset.id; pick(id); Q2.refocus("#outTbl tbody tr", id); } });
  }

  // ---------- take-aways ----------
  function takeaway() {
    const C = DATA.CMAS, n = C.length, dark = t => C.filter(c => clsOf(c.rows[t].gap) >= 4).length, T = NQ - 1;
    const widest = d3.greatest(C, c => c.rows[T].gap), p = C.map(c => at2030(c.id, S.rule).p), now = C.map(c => c.rows[T].gap);
    const diffs = C.map(c => { const v = RULES.map(rl => at2030(c.id, rl.id).p); return { c, d: r1(d3.max(v)) - r1(d3.min(v)) }; }), dmax = d3.greatest(diffs, d => d.d);
    document.getElementById("f1Take").innerHTML = `<b>Narrower overall, with setbacks.</b> In ${LAB[0]}, ${dark(0)} of the ${n} CMAs had a gap of 25 pp or more; in ${LAB[T]}, ${dark(T) === 0 ? "none" : dark(T)} did, ` +
      `and the widest gap was ${fmt.f1(widest.rows[T].gap)} pp (${widest.name}). Against a year earlier, though, the gap widened in ${WID.n} of the ${n} CMAs in ${LAB[WID.t]}, the most of any quarter. ` +
      `On the ${ruleOf().label.toLowerCase()} rule, the ${LAB[NT - 1]} gaps would span ${fmt.f1(d3.min(p))}–${fmt.f1(d3.max(p))} pp (${LAB[T]}: ${fmt.f1(d3.min(now))}–${fmt.f1(d3.max(now))} pp); ` +
      `for one CMA the three rules differ by up to ${fmt.f1(dmax.d)} pp (${dmax.c.name}), a reminder that the outlook is a projection.`;
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

  window.MapLab = { start };
})();
