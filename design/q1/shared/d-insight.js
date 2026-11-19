/* Q1 candidate D + insight surface (versions 5–9). A fork of shared/d-planes.js (left unchanged), which is itself a fork of
   candidate D v3: the same connected scatterplot, 3D space-time view, flat views, slider and timeline, plus one kind of
   "insight" overlay chosen by <body data-insight="plans|gates|trend|porcupine|ghost">:
     plans      official plans against the path: FAO projections (2024, 2025) and the 2026 Budget's funded case capacity
     gates      federal income-support window (CERB, CRB) and provincial OW / ODSP rule changes as time gates
     trend      the pre-pandemic track (2015–2019 log-linear trend) and the curtain between the path and that track
     porcupine  "two-year rule" forecast rays from the path, with their misses
     ghost      the 2008 recession's path, re-anchored at 2019 Q4
   Every overlay is a set of points in the cube's world coordinates, so the flat views read it in 2D automatically. */
(() => {
  "use strict";
  const { fmt } = Q1;
  const PH = { pre: "var(--ph0)", during: "var(--ph1)", post: "var(--ph2)" };
  const S = { step: 0, mode: "count", t: 0, hover: null, timer: null, view: "path", cam: { yaw: 0, pitch: 0 }, anim: null, tour: false };
  let DATA, F, Q, VA = 0; const syncs = []; // VA: first quarter shown in the cube (plans starts later, to give the plans room)
  const MODE = document.body.dataset.insight || "trend";
  const OPTS = {
    plans: [{ id: "all", label: "All plans" }, { id: "fao", label: "FAO projections" }, { id: "budget", label: "2026 Budget vs FAO" }, { id: "off", label: "None" }],
    gates: [{ id: "both", label: "Federal + provincial" }, { id: "fed", label: "Federal support only" }, { id: "prov", label: "Provincial changes only" }, { id: "off", label: "None" }],
    trend: [{ id: "curtain", label: "Track + gap" }, { id: "alt", label: "+ other fit windows" }, { id: "line", label: "Track only" }, { id: "off", label: "None" }],
    porcupine: [{ id: "all", label: "Yearly rays + current" }, { id: "cur", label: "Current quarter only" }, { id: "off", label: "None" }],
    ghost: [{ id: "rungs", label: "Ghost + yearly links" }, { id: "line", label: "Ghost only" }, { id: "off", label: "None" }],
  }[MODE];
  S.plane = OPTS[0].id; const X = {}; // everything the overlay computes
  const sint = v => `${v > 0 ? "+" : v < 0 ? "−" : "±"}${fmt.int(Math.abs(v))}`;
  const mlab = d3.timeFormat("%b %Y"), dlab = d3.timeFormat("%B %-d, %Y");
  const fyl = y => `${y}-${String((y + 1) % 100).padStart(2, "0")}`;
  const addQ = (date, k) => new Date(date.getFullYear(), date.getMonth() + 3 * k, 1);
  const on = () => S.plane !== "off";
  const extra = { plans: "../../data/fao-caseload-plans.csv", gates: "../../data/policy-events.csv" }[MODE];

  Promise.all([Q1.load("../../../../"), extra ? d3.csv(extra) : Promise.resolve(null)]).then(([d, ex]) => {
    DATA = d; F = d.F; Q = d.Q; window.__facts = F; window.__Q = Q; window.__cam = () => ({ ...S.cam, view: S.view, anim: !!S.anim, t: S.t }); // read-only hooks for the automated checks
    S.t = Q.length - 1;
    const U = new URLSearchParams(location.search);
    if (["count", "index"].includes(U.get("mode"))) S.mode = U.get("mode");
    if (U.has("step")) setStep(+U.get("step"));
    if (U.has("t")) { const i = Q.findIndex(r => r.label.replace(" ", "") === U.get("t")); if (i >= 0) S.t = i; }
    SETUP[MODE](ex); VA = X.from ? Q.findIndex(r => r.label === X.from) : 0; if (S.t < VA) S.t = VA; geom();
    if (OPTS.some(o => o.id === U.get("plane"))) S.plane = U.get("plane");
    window.__PL = () => X; window.__setCam = (yaw, pitch) => { S.view = "3d"; S.cam = { yaw, pitch }; syncs.forEach(f => f()); fig(); }; // hooks for the automated checks
    if (VIEWS.some(v => v.id === U.get("view"))) { S.view = U.get("view"); S.cam = { ...PRESET[S.view] }; }
    if (S.view === "3d" && U.has("yaw")) S.cam = { yaw: clamp(+U.get("yaw"), LIM.yaw), pitch: clamp(+(U.get("pitch") || PRESET["3d"].pitch), LIM.pitch) };
    Q1.themeButton(render);
    build(); render(); Q1.onResize(render);
    document.body.dataset.ready = "1";
  }).catch(Q1.fail);

  const steps = [{ id: 1, label: "1 · Before", ph: "pre" }, { id: 2, label: "2 · During", ph: "during" }, { id: 3, label: "3 · After", ph: "post" }, { id: 0, label: "Explore all" }];
  function setStep(id) { S.step = id; const s = steps.find(x => x.id === id); S.t = s && s.ph ? Q.indexOf(F.phase[s.ph].z) : Q.length - 1; }
  function moved() { syncs.forEach(f => f()); story(); fig(); timeline(); side(); } // the slider's quarter changed
  function build() {
    syncs.push(Q1.seg("#stepSeg", steps, s => s.label, s => S.step === s.id, s => { stop(); setStep(s.id); render(); }));
    syncs.push(Q1.seg("#modeSeg", [{ id: "count", label: "Axes in cases" }, { id: "index", label: "Axes as index, 2019 Q4 = 100" }], m => m.label, m => S.mode === m.id, m => { S.mode = m.id; render(); }));
    const sl = document.getElementById("tSlider"); sl.max = Q.length - 1; sl.min = VA;
    sl.addEventListener("input", () => { stop(); S.t = +sl.value; S.step = 0; moved(); });
    document.getElementById("playBtn").onclick = () => (S.timer ? stop() : play());
    syncs.push(Q1.seg("#viewSeg", VIEWS, v => v.label, v => S.view === v.id, v => { endTour(); animateTo(v.id); }));
    syncs.push(Q1.seg("#planeSeg", OPTS, o => o.label, o => S.plane === o.id, o => { S.plane = o.id; fig(); planeNote(); timeline(); side(); })); // filtering (L5)
    syncs.push(() => { document.getElementById("resetBtn").hidden = S.view !== "3d"; });
    document.getElementById("resetBtn").onclick = () => { endTour(); animateTo("3d"); };
    document.getElementById("tourBtn").onclick = () => (S.tour ? endTour() : tour());
    document.getElementById("f1a").addEventListener("keydown", e => { // keyboard rotation in 3D
      if (S.view !== "3d") return;
      const st = { ArrowLeft: [-5, 0], ArrowRight: [5, 0], ArrowUp: [0, -5], ArrowDown: [0, 5] }[e.key];
      if (e.key === "Home") { e.preventDefault(); endTour(); animateTo("3d"); return; }
      if (!st) return; e.preventDefault(); endTour();
      S.cam = { yaw: clamp(S.cam.yaw + st[0], LIM.yaw), pitch: clamp(S.cam.pitch + st[1], LIM.pitch) }; fig();
    });
    bindPointer();
    keys();
  }
  function play() {
    if (S.t >= Q.length - 1) S.t = VA;
    S.step = 0; document.getElementById("playBtn").textContent = "Pause";
    S.timer = setInterval(() => { S.t++; if (S.t >= Q.length - 1) { S.t = Q.length - 1; stop(); } moved(); }, Q1.reduced() ? 700 : 220);
  }
  function stop() { if (S.timer) clearInterval(S.timer); S.timer = null; const b = document.getElementById("playBtn"); if (b) b.textContent = "Play"; }
  function render() { syncs.forEach(f => f()); lead(); story(); fig(); timeline(); table(); cards(); planeDef(); planeNote(); planeKey(); side(); }
  const stepPhase = () => { const s = steps.find(x => x.id === S.step); return s && s.ph ? F.phase[s.ph] : null; };
  // Net direction of the path over a period: the program whose index changed more than twice as much sets it.
  function dirOf(p) {
    const dO = p.z.iow - p.a.iow, dD = p.z.iod - p.a.iod, word = (v, nm) => `${nm} ${v >= 0 ? "up" : "down"}`;
    if (Math.abs(dD) > 2 * Math.abs(dO)) return { main: dD >= 0 ? "right" : "left", text: `mostly ${dD >= 0 ? "right" : "left"} (${word(dD, "ODSP")})` };
    if (Math.abs(dO) > 2 * Math.abs(dD)) return { main: dO >= 0 ? "up" : "down", text: `mostly ${dO >= 0 ? "up" : "down"} (${word(dO, "OW")})` };
    return { main: "diagonal", text: `diagonal (${word(dO, "OW")}, ${word(dD, "ODSP")})` };
  }

  function lead() {
    const P = F.phase;
    document.getElementById("lead").innerHTML =
      `From ${P.pre.a.label} to ${P.pre.z.label} ODSP grew <b>${fmt.pct(P.pre.odsp)}</b> and OW ${fmt.pct(P.pre.ow)}; during the pandemic OW fell to index <b>${fmt.f1(F.owMin.iow)}</b> (${F.owMin.label}) while ODSP stayed between ${fmt.f1(F.odsp19.lo.iod)} and ${fmt.f1(F.odsp19.hi.iod)}; ` +
      `by ${F.last.label} OW was at ${fmt.f1(F.last.iow)}. ` + TEXT[MODE].card();
  }
  function story() {
    const el = document.getElementById("stepText"), P = F.phase, c = Q[S.t];
    document.getElementById("tOut").textContent = c.label;
    document.getElementById("tSlider").value = S.t;
    if (S.step === 1) el.innerHTML = `<b>${P.pre.a.label} → ${P.pre.z.label}: ${dirOf(P.pre).text}.</b> ODSP grew ${fmt.pct(P.pre.odsp)} and OW ${fmt.pct(P.pre.ow)} (index ${fmt.f1(P.pre.a.iod)} → ${fmt.f1(P.pre.z.iod)} across, ${fmt.f1(P.pre.a.iow)} → ${fmt.f1(P.pre.z.iow)} up).`;
    else if (S.step === 2) el.innerHTML = `<b>${P.during.a.label} → ${P.during.z.label}: down, then back up, almost vertically.</b> OW fell to ${fmt.int(F.owMin.ow)} (${F.owMin.label}, index ${fmt.f1(F.owMin.iow)}); ODSP's index varied by ${fmt.f1(F.odsp19.hi.iod - F.odsp19.lo.iod)} points at most. These data do not show why.`;
    else if (S.step === 3) el.innerHTML = `<b>${P.post.a.label} → ${P.post.z.label}: ${dirOf(P.post).text}.</b> OW grew ${fmt.pct(P.post.ow)} and ODSP ${fmt.sp(P.post.odsp)}.`;
    else el.innerHTML = `Showing the path up to <b>${c.label}</b> (${Q1.phaseOf(c).long}). Drag the slider, press Play, or hover a dot.`;
  }

  // ---------- Figure 1a: one orthographic renderer for the 2D path, the 3D space-time path and the flat views ----------
  // World axes: X = ODSP index, Y (up) = OW index, Z (depth) = time. Looking along Z gives the connected scatterplot,
  // along X gives OW over time, along Y gives ODSP over time (space-time cube "flattening", Bach et al. 2014).
  const VIEWS = [{ id: "path", label: "Path (OW vs ODSP)" }, { id: "3d", label: "3D" }, { id: "ow", label: "OW over time" }, { id: "odsp", label: "ODSP over time" },
    { id: "diff", label: "OW − ODSP over time" }];
  const PRESET = { path: { yaw: 0, pitch: 0 }, "3d": { yaw: 38, pitch: 24 }, ow: { yaw: 90, pitch: 0 }, odsp: { yaw: 90, pitch: 90 }, diff: { yaw: 90, pitch: -45 } };
  const LIM = { yaw: [-20, 110], pitch: [-50, 85] };
  const TIMEFLAT = ["ow", "odsp", "diff", "sum"];
  let G = null, FIG = null;
  const rad = d => (d * Math.PI) / 180, clamp = (v, [a, b]) => Math.max(a, Math.min(b, v));
  function geom() { // the box holds the path and every overlay point (X.ext), so toggling an overlay never resizes it
    const E = X.ext || { iod: [], iow: [] };
    const QV = Q.slice(VA), iods = QV.map(d => d.iod).concat(E.iod), iows = QV.map(d => d.iow).concat(E.iow);
    const xd = [Math.floor(d3.min(iods) / 10) * 10, Math.ceil(d3.max(iods) / 5) * 5 + 5];
    const yd = [Math.floor(d3.min(iows) / 10) * 10, Math.ceil(d3.max(iows) / 10) * 10];
    const t0 = Q[VA].date, tl = Q[Q.length - 1].date, t1 = E.t1 || tl;
    const L = 1.25 * Math.max(xd[1] - xd[0], yd[1] - yd[0]) * ((t1 - t0) / (tl - t0)); // time depth, in index-point units
    const zt = d3.scaleTime().domain([t0, t1]).range([0, L]);
    const c = [(xd[0] + xd[1]) / 2, (yd[0] + yd[1]) / 2, L / 2];
    G = { xd, yd, L, zt, c, t0, t1, B: { x: [xd[0] - c[0], xd[1] - c[0]], y: [yd[0] - c[1], yd[1] - c[1]], z: [-L / 2, L / 2] } };
    G.W = (iod, iow, date) => [iod - c[0], iow - c[1], zt(date) - c[2]];
    G.w3 = d => G.W(d.iod, d.iow, d.date);
  }
  function rot([X3, Y, Z], cam) { // yaw about the vertical axis, then pitch; orthographic (no perspective)
    const t = rad(cam.yaw), p = rad(cam.pitch);
    const x1 = X3 * Math.cos(t) + Z * Math.sin(t), z1 = -X3 * Math.sin(t) + Z * Math.cos(t);
    return [x1, Y * Math.cos(p) - z1 * Math.sin(p), Y * Math.sin(p) + z1 * Math.cos(p)];
  }
  function camera(w, h, cam) {
    const m = { t: 18, r: 24, b: 48, l: 68 };
    const cs = []; for (const x of G.B.x) for (const y of G.B.y) for (const z of G.B.z) cs.push(rot([x, y, z], cam));
    const ex = d3.extent(cs, p => p[0]), ey = d3.extent(cs, p => p[1]), W = w - m.l - m.r, H = h - m.t - m.b;
    const k = Math.min(W / Math.max(1e-6, ex[1] - ex[0]), H / Math.max(1e-6, ey[1] - ey[0])); // one scale for every axis
    const ox = m.l + (W - k * (ex[1] - ex[0])) / 2 - k * ex[0], oy = m.t + (H - k * (ey[1] - ey[0])) / 2 + k * ey[1];
    return p3 => { const r = rot(p3, cam); return [ox + k * r[0], oy - k * r[1], r[2]]; };
  }
  const VAR = () => {
    const idx = S.mode === "index", b = F.base;
    const mk = (key, i, dom, base, name, color) => ({ key, i, color, name, base,
      disp: idx ? dom : dom.map(v => (v * base) / 100), toWorld: v => (idx ? v : (v * 100) / base) - G.c[i],
      fmt: idx ? d3.format("d") : fmt.k, title: `${name} ${idx ? "index" : "cases"}` });
    return { x: mk("x", 0, G.xd, b.odsp, "ODSP", "var(--odsp)"), y: mk("y", 1, G.yd, b.ow, "OW", "var(--ow)"),
      z: { key: "z", i: 2, color: "var(--ink)", name: "Time", title: "Time", disp: [G.t0, G.t1], toWorld: v => G.zt(v) - G.c[2], fmt: d3.timeFormat("%Y") } };
  };
  const ticksOf = (v, n) => (v.key === "z" ? d3.scaleTime().domain(v.disp).ticks(d3.timeYear.every(n <= 4 || Q1.narrow() ? 5 : 2))
    : d3.scaleLinear().domain(v.disp).ticks(n));
  const isFlat = () => S.view !== "3d" && !S.anim && S.cam.yaw === PRESET[S.view].yaw && S.cam.pitch === PRESET[S.view].pitch;
  const AXES = { path: ["x", "y"], ow: ["z", "y"], odsp: ["z", "x"] };

  function fig() {
    const host = d3.select("#f1a"), w = Q1.W("f1a"), n = Q1.narrow(), h = n ? 380 : 470, flat = isFlat(), V = VAR(), sp = stepPhase(), c = Q[S.t];
    host.classed("spatial", !flat);
    const P = camera(w, h, S.cam);
    const pt = (a, val) => { const q = [G.B.x[0], G.B.y[0], G.B.z[0]]; q[V[a].i] = V[a].toWorld(val); return q; };
    const titles = { path: S.mode === "index" ? "OW index (up) against ODSP index (across), 2019 Q4 = 100, one dot per quarter" : "OW cases (up) against ODSP cases (across), one dot per quarter (axes use the same scale per index point)",
      "3d": "3D space-time path: ODSP across, OW up, time in depth (orthographic projection; read values in the flat views)",
      ow: `${V.y.title} over time: the same path seen along the ODSP axis`, odsp: `${V.x.title} over time: the same path seen along the OW axis`,
      diff: "OW index − ODSP index over time (2019 Q4 = 100, always in index points): the same path seen along the diagonal between the OW and ODSP axes",
      sum: S.mode === "index" ? "OW + ODSP over time (index, 2019 Q4 total = 100): the same cube turned until the height is the combined caseload" : "OW + ODSP cases over time: the same cube turned until the height is the combined caseload" };
    document.getElementById("f1aTitle").textContent = S.anim ? "Rotating…" : titles[S.view] + (VA ? ` · from ${Q[VA].label}` : "");
    host.attr("aria-label", S.view === "3d" ? "3D space-time path of OW against ODSP over time. Use the arrow keys to rotate and Home to reset; values are listed in the panel beside the chart."
      : `${titles[S.view]}. Choose 3D in the view buttons to rotate the cube.`);
    const svg = Q1.svgIn("f1a", w, h, titles[S.view]), g = svg.append("g");
    if (MODE === "gates") hatchDef(svg, "hatchA");
    if (flat) (S.view === "diff" ? diffAxes(g, P, V) : S.view === "sum" ? sumAxes(g, P, V) : flatAxes(g, P, V, pt)); else { const tt = spatialFrame(g, P, V, n); keepInside(g, w); declutter(g, tt, w); }
    const ctx = { g, P, flat, w, tf: flat && TIMEFLAT.includes(S.view), fr: flatFrame(P) };
    const tl = Q[Q.length - 1].date, fut = G.t1 > tl ? timeBand(ctx, tl, G.t1, { fill: "none", stroke: "var(--ink2)", dash: "2 3" }) : null; // the box extends past the data
    if (on()) UNDER[MODE](ctx); // under the path, so an overlay never hides the curve
    const pts = Q.map(d => P(G.w3(d)));
    const segs = Q.slice(1).map((d, i) => ({ a: pts[i], b: pts[i + 1], i: i + 1, ph: d.phase, z: (pts[i][2] + pts[i + 1][2]) / 2 })).filter(s => s.i - 1 >= VA);
    if (!flat) segs.sort((u, v) => u.z - v.z);
    g.append("g").selectAll("line").data(segs).join("line").attr("x1", s => s.a[0]).attr("y1", s => s.a[1]).attr("x2", s => s.b[0]).attr("y2", s => s.b[1])
      .style("stroke", s => (s.i <= S.t ? PH[s.ph] : "var(--grid)")).style("stroke-width", s => (s.i <= S.t ? 2.2 : 1.2))
      .style("opacity", s => (sp && s.ph !== sp.id && s.i <= S.t ? 0.3 : 1)).style("stroke-linecap", "round");
    g.append("g").selectAll("circle").data(Q.slice(VA, S.t + 1)).join("circle").attr("cx", (d, i) => pts[VA + i][0]).attr("cy", (d, i) => pts[VA + i][1]).attr("r", 2.4)
      .style("fill", d => PH[d.phase]).style("opacity", d => (sp && d.phase !== sp.id ? 0.3 : 1));
    if (!flat) dropLines(g, P, c);
    labels(g, pts, c, w, flat);
    ctx.pts = pts;
    if (on()) OVER[MODE](ctx);
    if (fut) { const top = fut.pp ? xy(d3.least(fut.pp, p => p[1])) : [fut.x, fut.top + 24];
      tag(ctx, MODE === "plans" ? "After the data: plans only" : "After the data", top, [[top[0], top[1] + 14, "middle"], [top[0], top[1] + 28, "middle"]], 10.5); }
    FIG = { P, pts, flat };
    overlay(svg, w, h, pts);
    if (S.hover) { const i = Q.indexOf(S.hover); FIG.hov.attr("cx", pts[i][0]).attr("cy", pts[i][1]).style("display", null); }
    document.getElementById("viewHint").textContent = S.view === "3d"
      ? "3D view: drag (or click the chart and use the arrow keys) to rotate; double-click or press Home to reset. Faint lines on the back walls are the path's shadows; thin lines drop from the current dot to each wall. Read values in the flat views or in the panel."
      : S.view === "sum"
        ? "Flat view: the height of the curve is OW + ODSP, the combined caseload. Choose 3D to see how this view comes from the cube."
        : S.view === "diff"
          ? "Flat view: the height of the curve is OW index minus ODSP index (2019 Q4 = 100). 0 = both programs at the same percentage of their 2019 Q4 level; above 0 = OW relatively higher. Always in index points, because a difference of cases would mix two scales. Choose 3D to see where this view comes from."
          : "Flat view: positions can be read against the axes. Choose 3D to see how this chart and the other flat views are faces of one cube.";
    readout(S.hover || c); planeNote();
  }
  function flatAxes(g, P, V, pt) {
    const [hk, vk] = AXES[S.view], H = V[hk], Vv = V[vk];
    const sx = v => P(pt(hk, v))[0], sy = v => P(pt(vk, v))[1];
    const xs = (H.key === "z" ? d3.scaleTime() : d3.scaleLinear()).domain(H.disp).range(H.disp.map(sx));
    const ys = d3.scaleLinear().domain(Vv.disp).range(Vv.disp.map(sy));
    const [x0, x1] = xs.range(), [yb, yt] = ys.range();
    const ht = ticksOf(H, 5), vt = ticksOf(Vv, 5).filter(v => v > Vv.disp[0]);
    if (H.key === "z") pandemicBand(g, xs, yt, yb);
    g.append("g").selectAll("line").data(ht).join("line").attr("x1", xs).attr("x2", xs).attr("y1", yt).attr("y2", yb).style("stroke", "var(--grid)");
    g.append("g").selectAll("line").data(vt).join("line").attr("x1", x0).attr("x2", x1).attr("y1", ys).attr("y2", ys).style("stroke", "var(--grid)");
    g.append("g").attr("class", "axis").attr("transform", `translate(0,${yb})`).call(d3.axisBottom(xs).tickValues(ht).tickFormat(H.fmt).tickSizeOuter(0));
    g.append("g").attr("class", "axis").attr("transform", `translate(${x0},0)`).call(d3.axisLeft(ys).tickValues(vt).tickFormat(Vv.fmt).tickSizeOuter(0));
    g.append("text").attr("class", "lbl-strong").attr("x", x1).attr("y", yb + 36).attr("text-anchor", "end").style("fill", H.color).text(`${H.title} →`);
    g.append("text").attr("class", "lbl-strong").attr("transform", "rotate(-90)").attr("x", -yt).attr("y", x0 - 50).attr("text-anchor", "end").style("fill", Vv.color).text(`${Vv.title} →`);
    const ref = a => (V[a].key === "z" ? null : S.mode === "index" ? 100 : V[a].base);
    if (ref(hk) != null) g.append("line").attr("x1", xs(ref(hk))).attr("x2", xs(ref(hk))).attr("y1", yt).attr("y2", yb).style("stroke", "var(--axis)");
    g.append("line").attr("x1", x0).attr("x2", x1).attr("y1", ys(ref(vk))).attr("y2", ys(ref(vk))).style("stroke", "var(--axis)");
    if (S.view === "path") {
      const lo = Math.max(G.xd[0], G.yd[0]), hi = Math.min(G.xd[1], G.yd[1]), wp = v => P([v - G.c[0], v - G.c[1], 0]);
      const a = wp(lo), b = wp(hi);
      g.append("line").attr("x1", a[0]).attr("y1", a[1]).attr("x2", b[0]).attr("y2", b[1]).style("stroke", "var(--ink2)").style("stroke-dasharray", "2 4").style("stroke-width", 1.2);
      g.append("text").attr("class", "lbl").attr("x", a[0] + 6).attr("y", a[1] - 6).style("font-size", "11px").text("equal growth");
    } else g.append("text").attr("class", "lbl").attr("x", x0 + 4).attr("y", ys(ref(vk)) - 5).attr("text-anchor", "start").style("font-size", "11px").text("2019 Q4 level");
  }
  function pandemicBand(g, xs, yt, yb) { // as on every time axis of the site
    const a = xs(Q1.COVID[0]), b = xs(Q1.COVID[1]);
    g.append("rect").attr("x", a).attr("width", b - a).attr("y", yt).attr("height", yb - yt).style("fill", "var(--covid)");
    g.append("text").attr("class", "lbl").attr("x", a + 4).attr("y", yt + 11).style("font-size", "11px").text("Pandemic");
  }
  function diffAxes(g, P, V) {
    const dd = [G.yd[0] - G.xd[1], G.yd[1] - G.xd[0]];
    const sx = dt => P([0, 0, G.zt(dt) - G.c[2]])[0], sy = d => P([0, d - (G.c[1] - G.c[0]), 0])[1];
    const xs = d3.scaleTime().domain(V.z.disp).range(V.z.disp.map(sx)), ys = d3.scaleLinear().domain(dd).range(dd.map(sy));
    const [x0, x1] = xs.range(), [yb, yt] = ys.range();
    const ht = ticksOf(V.z, 5), vt = ys.ticks(6).filter(v => v > dd[0]), sgn = v => (v > 0 ? `+${v}` : v < 0 ? `−${-v}` : "0");
    pandemicBand(g, xs, yt, yb);
    g.append("g").selectAll("line").data(ht).join("line").attr("x1", xs).attr("x2", xs).attr("y1", yt).attr("y2", yb).style("stroke", "var(--grid)");
    g.append("g").selectAll("line").data(vt).join("line").attr("x1", x0).attr("x2", x1).attr("y1", ys).attr("y2", ys).style("stroke", "var(--grid)");
    g.append("g").attr("class", "axis").attr("transform", `translate(0,${yb})`).call(d3.axisBottom(xs).tickValues(ht).tickFormat(V.z.fmt).tickSizeOuter(0));
    g.append("g").attr("class", "axis").attr("transform", `translate(${x0},0)`).call(d3.axisLeft(ys).tickValues(vt).tickFormat(sgn).tickSizeOuter(0));
    g.append("text").attr("class", "lbl-strong").attr("x", x1).attr("y", yb + 36).attr("text-anchor", "end").text("Time →");
    g.append("text").attr("class", "lbl-strong").attr("transform", "rotate(-90)").attr("x", -yt).attr("y", x0 - 50).attr("text-anchor", "end").text("OW index − ODSP index →");
    g.append("line").attr("x1", x0).attr("x2", x1).attr("y1", ys(0)).attr("y2", ys(0)).style("stroke", "var(--ink2)").style("stroke-dasharray", "2 4").style("stroke-width", 1.2);
    g.append("text").attr("class", "lbl").attr("x", x0 + 4).attr("y", ys(0) + 14).style("font-size", "11px").text("0 = equal growth since 2019 Q4");
    const hi = g.append("text").attr("class", "lbl").attr("x", x0 + 4).attr("y", ys(vt[vt.length - 1]) + 14).style("font-size", "11px").text("OW relatively higher ↑");
    { const pb = g.selectAll(":scope > text.lbl").filter(function () { return this.textContent === "Pandemic"; }).node(); // a short time axis puts the band near the left edge
      const ov = (a, b) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
      for (let k = 0; k < 3 && pb && ov(hi.node().getBoundingClientRect(), pb.getBoundingClientRect()); k++) hi.attr("y", +hi.attr("y") + 14); }
    g.append("text").attr("class", "lbl").attr("x", x0 + 4).attr("y", yb - 6).style("font-size", "11px").text("OW relatively lower ↓");
  }
  // trend version only: the view in which the height is OW + ODSP (cases or index), read off the same projection P
  function sumAxes(g, P, V) {
    const w = X.w, idx = S.mode === "index", dd = [w * G.yd[0] + (1 - w) * G.xd[0], w * G.yd[1] + (1 - w) * G.xd[1]];
    const sx = dt => P([0, 0, G.zt(dt) - G.c[2]])[0], sy = v => P([0, (v - (1 - w) * G.c[0]) / w - G.c[1], 0])[1];
    const toDisp = v => (idx ? v : (v * X.T0) / 100);
    const xs = d3.scaleTime().domain(V.z.disp).range(V.z.disp.map(sx)), ys = d3.scaleLinear().domain(dd.map(toDisp)).range(dd.map(sy));
    const [x0, x1] = xs.range(), [yb, yt] = ys.range(), ht = ticksOf(V.z, 5), vt = ys.ticks(6).filter(v => v > ys.domain()[0]);
    pandemicBand(g, xs, yt, yb);
    g.append("g").selectAll("line").data(ht).join("line").attr("x1", xs).attr("x2", xs).attr("y1", yt).attr("y2", yb).style("stroke", "var(--grid)");
    g.append("g").selectAll("line").data(vt).join("line").attr("x1", x0).attr("x2", x1).attr("y1", ys).attr("y2", ys).style("stroke", "var(--grid)");
    g.append("g").attr("class", "axis").attr("transform", `translate(0,${yb})`).call(d3.axisBottom(xs).tickValues(ht).tickFormat(V.z.fmt).tickSizeOuter(0));
    g.append("g").attr("class", "axis").attr("transform", `translate(${x0},0)`).call(d3.axisLeft(ys).tickValues(vt).tickFormat(idx ? d3.format("d") : fmt.k).tickSizeOuter(0));
    g.append("text").attr("class", "lbl-strong").attr("x", x1).attr("y", yb + 36).attr("text-anchor", "end").text("Time →");
    g.append("text").attr("class", "lbl-strong").attr("transform", "rotate(-90)").attr("x", -yt).attr("y", x0 - 50).attr("text-anchor", "end").text(idx ? "OW + ODSP index (2019 Q4 total = 100) →" : "OW + ODSP cases →");
  }

  // ================= drawing primitives for the overlays (world coordinates in, screen out) =================
  function flatFrame(P) { // flat time views: x of a date, and the plot's top and bottom (the cube's projection)
    const cs = []; for (const x of G.B.x) for (const y of G.B.y) for (const z of G.B.z) cs.push(P([x, y, z]));
    return { x: t => P([0, 0, G.zt(t) - G.c[2]])[0], top: d3.min(cs, p => p[1]), bot: d3.max(cs, p => p[1]) };
  }
  const xy = p => [p[0], p[1]];
  function line3(g, P, W, st = {}) {
    const el = g.append("path").attr("class", "ins").attr("d", d3.line()(W.map(P).map(xy))).style("fill", "none")
      .style("stroke", st.c || "var(--ink2)").style("stroke-width", st.w || 1.4).style("stroke-linecap", "round").style("stroke-linejoin", "round");
    if (st.dash) el.style("stroke-dasharray", st.dash); if (st.op != null) el.style("stroke-opacity", st.op);
    return el;
  }
  function ribbon(g, P, A, B, st = {}) { // ruled surface between two polylines with matching points (one quad per step)
    const gg = g.append("g").attr("class", "ins ribbon");
    for (let i = 0; i + 1 < A.length; i++) {
      const pp = [A[i], A[i + 1], B[i + 1], B[i]].map(P);
      gg.append("polygon").attr("points", pp.map(p => xy(p).join(",")).join(" ")).style("fill", st.c || "var(--ink2)").style("fill-opacity", st.op || 0.1).style("stroke", "none");
    }
    return gg;
  }
  function clipSeg(a, b) { // Liang–Barsky against the box; returns [a', b', cutAtStart, cutAtEnd] or null
    let t0 = 0, t1 = 1; const d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], BB = [G.B.x, G.B.y, G.B.z];
    for (let i = 0; i < 3; i++) for (const [p, q] of [[-d[i], a[i] - BB[i][0]], [d[i], BB[i][1] - a[i]]]) {
      if (Math.abs(p) < 1e-12) { if (q < 0) return null; continue; }
      const r = q / p; if (p < 0) { if (r > t1) return null; if (r > t0) t0 = r; } else { if (r < t0) return null; if (r < t1) t1 = r; }
    }
    const at = t => a.map((v, i) => v + d[i] * t);
    return [at(t0), at(t1), t0 > 1e-9, t1 < 1 - 1e-9];
  }
  function clipped(W) { // a polyline cut to the box: visible pieces, and the points where it leaves the box
    const pieces = [], exits = []; let cur = null;
    for (let i = 0; i + 1 < W.length; i++) {
      const c = clipSeg(W[i], W[i + 1]);
      if (!c) { if (cur) { pieces.push(cur); cur = null; } continue; }
      if (!cur || c[2]) { if (cur) pieces.push(cur); cur = [c[0]]; }
      cur.push(c[1]);
      if (c[3]) { exits.push(c[1]); pieces.push(cur); cur = null; }
    }
    if (cur) pieces.push(cur);
    return { pieces, exits };
  }
  function timeBand(ctx, t0, t1, st) { // a span of time: a floor band in 3D, a full-height band in flat time views
    const { g, P, flat, tf, fr } = ctx;
    if (flat && !tf) return null; // path view: the band would face the viewer
    if (tf) {
      const a = fr.x(t0), b = fr.x(t1);
      return { el: g.append("rect").attr("class", "ins").attr("x", Math.min(a, b)).attr("width", Math.abs(b - a)).attr("y", fr.top).attr("height", fr.bot - fr.top)
        .style("fill", st.fill).style("fill-opacity", st.fop == null ? 1 : st.fop).style("stroke", st.stroke || "none").style("stroke-dasharray", st.dash || null), x: (a + b) / 2, top: fr.top };
    }
    // 3D: on the far floor and on the far OW–time wall (like the path's shadows), never as a slab across the box
    const B = G.B, far = farFaces(P), z0 = Math.max(B.z[0], G.zt(t0) - G.c[2]), z1 = Math.min(B.z[1], G.zt(t1) - G.c[2]);
    const floor = [[B.x[0], far.y, z0], [B.x[1], far.y, z0], [B.x[1], far.y, z1], [B.x[0], far.y, z1]].map(P);
    const wall = [[far.x, B.y[0], z0], [far.x, B.y[1], z0], [far.x, B.y[1], z1], [far.x, B.y[0], z1]].map(P);
    [floor, wall].forEach(pp => g.append("polygon").attr("class", "ins").attr("points", pp.map(p => xy(p).join(",")).join(" ")).style("fill", st.fill).style("fill-opacity", st.fop == null ? 1 : st.fop)
      .style("stroke", st.stroke || "none").style("stroke-dasharray", st.dash || null));
    return { pp: floor, wall };
  }
  function timeGate(ctx, t, st) { // one instant: lines on the far floor and wall in 3D, a vertical line in flat time views
    const { g, P, flat, tf, fr } = ctx;
    if (flat && !tf) return null;
    const ln = (a, b) => g.append("line").attr("class", "ins").attr("x1", a[0]).attr("y1", a[1]).attr("x2", b[0]).attr("y2", b[1]).style("stroke", st.c || "var(--ink2)").style("stroke-dasharray", st.dash || "4 3").style("stroke-width", st.w || 1.2);
    if (tf) { const x = fr.x(t); ln([x, fr.top], [x, fr.bot]); return { top: [x, fr.top] }; }
    const B = G.B, far = farFaces(P), z = G.zt(t) - G.c[2];
    const f = [[B.x[0], far.y, z], [B.x[1], far.y, z]].map(P), wl = [[far.x, B.y[0], z], [far.x, B.y[1], z]].map(P);
    ln(f[0], f[1]); ln(wl[0], wl[1]);
    return { top: xy(d3.least(wl, p => p[1])) };
  }
  function hatchDef(svg, id) { // diagonal hatching: a texture, not a colour, so it never competes with OW blue, ODSP orange or the pandemic grey
    const p = svg.append("defs").append("pattern").attr("id", id).attr("patternUnits", "userSpaceOnUse").attr("width", 6).attr("height", 6).attr("patternTransform", "rotate(45)");
    p.append("line").attr("x1", 0).attr("y1", 0).attr("x2", 0).attr("y2", 6).style("stroke", "var(--ink2)").style("stroke-width", 1.3).style("stroke-opacity", 0.5);
  }
  function dot(g, p, st = {}) {
    return g.append("circle").attr("class", "ins").attr("cx", p[0]).attr("cy", p[1]).attr("r", st.r || 3).style("fill", st.fill || "var(--surface)").style("stroke", st.c || "var(--ink2)").style("stroke-width", st.w || 1.3);
  }
  // try a few positions for a label; keep the first that is inside the chart and clear of every other label
  function placeSafe(svgNode, el, cands, w) {
    const others = [...svgNode.querySelectorAll("text")].filter(t => t !== el.node() && t.textContent.trim()).map(t => t.getBoundingClientRect()).filter(r => r.width > 0);
    const sv = svgNode.getBoundingClientRect(), hit = (a, b) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
    for (const [x, y, anc] of cands) {
      el.attr("x", x).attr("y", y).attr("text-anchor", anc); const r = el.node().getBoundingClientRect();
      if (r.left >= sv.left + 2 && r.right <= sv.left + w - 2 && r.top >= sv.top && r.bottom <= sv.bottom && !others.some(o => hit(r, o))) return true;
    }
    el.remove(); return false;
  }
  function tag(ctx, text, p, extra = [], size = 11) { // a billboard label near screen point p
    const el = ctx.g.append("text").attr("class", "ann ins-lbl").attr("dy", "0.32em").style("font-weight", 500).style("font-size", size + "px").text(text);
    return placeSafe(ctx.g.node().ownerSVGElement, el, [[p[0] + 7, p[1] - 9, "start"], [p[0] - 7, p[1] - 9, "end"], [p[0] + 7, p[1] + 10, "start"], [p[0] - 7, p[1] + 10, "end"], ...extra], ctx.w);
  }

  // ================= the five overlays =================
  const SETUP = {}, UNDER = {}, OVER = {}, TEXT = {};
  const pathW = arr => arr.map(p => G.W(p.iod, p.iow, p.date));
  const ix = (d, b = F.base) => ({ iod: (d.odsp / b.odsp) * 100, iow: (d.ow / b.ow) * 100 });

  // ---- version 5 · plans: official projections and the 2026 Budget's funded case capacity against the path ----
  const fyOf = d => (d.quarter === 1 ? d.year - 1 : d.year); // Ontario fiscal year, April–March
  const fyDate = y => new Date((+new Date(y, 5, 1) + +new Date(y, 8, 1) + +new Date(y, 11, 1) + +new Date(y + 1, 2, 1)) / 4); // mean of its four quarter-end months
  SETUP.plans = rows => {
    rows.forEach(r => { r.fy = +r.fy_start; r.cases = +r.cases; });
    const get = (v, s, p) => new Map(rows.filter(r => r.vintage === v && r.series === s && r.program === p).map(r => [r.fy, r.cases]));
    const mk = (id, name, short, published, ow, odsp, st) => ({ id, name, short, published, st,
      pts: [...ow.keys()].sort().map(y => ({ fy: y, ow: ow.get(y), odsp: odsp.get(y), date: fyDate(y) })).map(p => ({ ...p, ...ix(p) })) });
    const act = { ow: get("fao2026", "fao_actual", "OW"), odsp: get("fao2026", "fao_actual", "ODSP") };
    const cap = { ow: get("fao2026", "budget_funded_capacity", "OW"), odsp: get("fao2026", "budget_funded_capacity", "ODSP") };
    const sh = { ow: get("fao2026", "fao_shortfall", "OW"), odsp: get("fao2026", "fao_shortfall", "ODSP") };
    const y0 = d3.max([...act.ow.keys()]), withStart = m => new Map([[y0, m === "ow" ? act.ow.get(y0) : act.odsp.get(y0)]]);
    const est = k => { const m = withStart(k); cap[k].forEach((v, y) => m.set(y, v + sh[k].get(y))); return m; };
    const capS = k => { const m = withStart(k); cap[k].forEach((v, y) => m.set(y, v)); return m; };
    const pub = v => rows.find(r => r.vintage === v).published;
    X.s = {
      f24: mk("f24", "FAO projection, June 2024", "FAO Jun 2024", pub("fao2024"), get("fao2024", "fao_projection", "OW"), get("fao2024", "fao_projection", "ODSP"), { dash: "7 4", w: 1.6 }),
      f25: mk("f25", "FAO projection, October 2025", "FAO Oct 2025", pub("fao2025"), get("fao2025", "fao_projection", "OW"), get("fao2025", "fao_projection", "ODSP"), { dash: "1.5 3.5", w: 2 }),
      cap: mk("cap", "Funded case capacity in the 2026 Budget (FAO calculation)", "2026 Budget funds", pub("fao2026"), capS("ow"), capS("odsp"), { w: 2.2, c: "var(--ink)" }),
      est: mk("est", "FAO estimate, September 2026 (funded capacity + FAO shortfall)", "FAO 2026 estimate", pub("fao2026"), est("ow"), est("odsp"), { dash: "5 3", w: 1.6, c: "var(--ink)" }),
    };
    X.act = act; X.cap = cap; X.sh = sh; X.y0 = y0; X.from = "2015 Q1";
    // this page's fiscal-year averages (mean of the four quarter-end months), for fiscal years fully in the data
    const by = d3.group(Q, fyOf); X.fy = new Map();
    by.forEach((r, y) => { if (r.length === 4) { const o = { fy: y, ow: d3.mean(r, d => d.ow), odsp: d3.mean(r, d => d.odsp), date: fyDate(y) }; X.fy.set(y, { ...o, ...ix(o) }); } });
    X.actPts = new Map([...act.ow.keys()].map(y => { const o = { fy: y, ow: act.ow.get(y), odsp: act.odsp.get(y), date: fyDate(y) }; return [y, { ...o, ...ix(o) }]; }));
    X.agree = [...act.ow.keys()].filter(y => X.fy.has(y)).map(y => ({ y, ow: (X.fy.get(y).ow / act.ow.get(y) - 1) * 100, odsp: (X.fy.get(y).odsp / act.odsp.get(y) - 1) * 100 }));
    const err = (s, y) => { const p = X.s[s].pts.find(q => q.fy === y), a = act.ow.has(y) ? { ow: act.ow.get(y), odsp: act.odsp.get(y) } : null; return p && a ? { ow: (p.ow / a.ow - 1) * 100, odsp: (p.odsp / a.odsp - 1) * 100 } : null; };
    X.err = { f24: [...act.ow.keys()].map(y => ({ y, e: err("f24", y) })).filter(r => r.e), f25: [...act.ow.keys()].map(y => ({ y, e: err("f25", y) })).filter(r => r.e) };
    const c1 = d3.min([...cap.ow.keys()]);
    X.capCut = { y: c1, ow: cap.ow.get(c1), pct: (cap.ow.get(c1) / act.ow.get(y0) - 1) * 100, abs: cap.ow.get(c1) - act.ow.get(y0), short: sh.ow.get(c1), shOd: sh.odsp.get(c1) };
    const a = F.phase.during.a, lo = F.owMin; X.drop = { a, lo, n: a.ow - lo.ow };
    X.yoyBelow = Q.filter(d => d.yow != null && d.yow <= X.capCut.pct).map(d => d.label);
    const all = Object.values(X.s).flatMap(s => s.pts).concat([...X.fy.values()], [...X.actPts.values()]);
    X.ext = { iod: all.map(p => p.iod), iow: all.map(p => p.iow), t1: new Date(d3.max([...cap.ow.keys()]) + 1, 2, 1) };
  };
  const showS = id => (id === "f24" || id === "f25" ? ["all", "fao"] : ["all", "budget"]).includes(S.plane);
  UNDER.plans = ctx => {
    const { g, P } = ctx;
    if (showS("cap")) ribbon(g, P, pathW(X.s.cap.pts), pathW(X.s.est.pts), { op: 0.16 }); // the funding gap, as a ruled surface
    ["f24", "f25", "cap", "est"].filter(showS).forEach(id => {
      const s = X.s[id]; line3(g, P, pathW(s.pts), s.st);
      s.pts.forEach(p => dot(g, P(G.W(p.iod, p.iow, p.date)), { r: 2.6, c: s.st.c || "var(--ink2)" }));
    });
    if (showS("f24")) ["f24", "f25"].forEach(id => s2a(id).forEach(([p, a]) => line3(g, P, pathW([p, a]), { w: 1.2, c: "var(--ink)" }))); // misses: projection → actual
  };
  const s2a = id => X.s[id].pts.filter(p => X.actPts.has(p.fy)).map(p => [p, X.actPts.get(p.fy)]);
  OVER.plans = ctx => {
    const { P } = ctx;
    if (showS("f24")) [...new Set([...s2a("f24"), ...s2a("f25")].map(([, a]) => a))].forEach(a => { const p = P(G.W(a.iod, a.iow, a.date)); ctx.g.append("rect").attr("class", "ins").attr("x", p[0] - 3).attr("y", p[1] - 3).attr("width", 6).attr("height", 6).style("fill", "var(--ink)"); });
    ["f24", "f25", "cap", "est"].filter(showS).forEach(id => { const s = X.s[id], p = s.pts[s.pts.length - 1]; tag(ctx, s.short, P(G.W(p.iod, p.iow, p.date)), [], 10.5); });
  };
  TEXT.plans = {
    card: () => `The 2026 Budget funds ${fmt.int(X.capCut.ow)} OW cases for ${fyl(X.capCut.y)}: ${fmt.f1(Math.abs(X.capCut.pct))}% fewer than the ${fyl(X.y0)} average and ${fmt.int(X.capCut.short)} fewer than the FAO estimates, a gap ${Math.round((100 * X.capCut.short) / X.drop.n)}% as large as OW's whole pandemic drop.`,
    def: () => `Lines beyond the path are official numbers, plotted at the middle of each fiscal year (April–March) and placed in the same cube. Dashed: the FAO's projections of June 2024 and October 2025. Solid black: the OW and ODSP caseload the 2026 Ontario Budget's allocation would fund, as calculated by the FAO ("funded case capacity"); dashed black: the FAO's own estimate for the same years. The shaded ribbon between them is the FAO's "funded caseload shortfall". Short black links join a projection to what happened (black square: the fiscal-year average the FAO later reported). Funded capacity is not a caseload target, and none of these numbers are forecasts made by this page. The cube starts at ${X.from} to give the plans room; the full path is in D v3 and in the timeline below.`,
    note: () => {
      const e = X.err, f = r => `${fyl(r.y)} ${fmt.sp(r.e.ow)}`, g2 = r => `${fyl(r.y)} ${fmt.sp(r.e.odsp)}`, ag = X.agree.filter(a => Math.abs(a.ow) > 1 || Math.abs(a.odsp) > 1);
      return `<b>Plans against the path.</b> The FAO's June 2024 projection missed OW by ${e.f24.map(f).join(", ")} and ODSP by ${e.f24.map(g2).join(", ")} (positive = projection above the actual average): close for OW, too high for ODSP, whose growth has not returned. ` +
        `Its October 2025 forecast for ${e.f25.map(r => `${fyl(r.y)} was ${fmt.sp(r.e.ow)} for OW and ${fmt.sp(r.e.odsp)} for ODSP`).join("; ")}. ` +
        `For ${fyl(X.capCut.y)} the 2026 Budget funds ${fmt.int(X.capCut.ow)} OW cases, ${sint(X.capCut.abs)} (${fmt.sp(X.capCut.pct)}) against the ${fyl(X.y0)} average of ${fmt.int(X.act.ow.get(X.y0))}; the FAO estimates ${fmt.int(X.capCut.ow + X.capCut.short)}, a shortfall of ${fmt.int(X.capCut.short)} OW and ${fmt.int(X.capCut.shOd)} ODSP cases. ` +
        `For comparison, OW fell ${fmt.int(X.drop.n)} cases from ${X.drop.a.label} to ${X.drop.lo.label}; its year-over-year change has been ${fmt.f1(X.capCut.pct)}% or lower only in ${X.yoyBelow.join(", ")}. ` +
        `This page's fiscal-year averages (four quarter-end months) agree with the FAO's twelve-month averages within 1% except ${ag.map(a => `${fyl(a.y)} (OW ${fmt.sp(a.ow)})`).join(", ")}.`;
    },
    key: () => [[sw("none", 0, "var(--ink2)", "7 4"), "FAO projection, June 2024"], [sw("none", 0, "var(--ink2)", "1.5 3.5"), "FAO projection, October 2025"], [sw("none", 0, "var(--ink)", null, 2.2), "2026 Budget: funded case capacity"],
      [sw("none", 0, "var(--ink)", "5 3"), "FAO estimate, September 2026"], [sw("var(--ink2)", 0.2, "none"), "Gap: FAO funded caseload shortfall"], [`<svg width="34" height="14" aria-hidden="true"><rect x="14" y="4" width="6" height="6" style="fill:var(--ink)"/></svg>`, "What happened: FAO fiscal-year average"]],
    rows: d => {
      const y = fyOf(d), a = X.fy.get(y), fa = X.actPts.get(y), p24 = X.s.f24.pts.find(p => p.fy === y), p25 = X.s.f25.pts.find(p => p.fy === y);
      return `<dt>Fiscal year</dt><dd>${fyl(y)}</dd>` + (a ? `<dt>FY average here: OW, ODSP</dt><dd>${fmt.int(a.ow)}, ${fmt.int(a.odsp)}</dd>` : "") +
        (fa ? `<dt>FAO FY average: OW, ODSP</dt><dd>${fmt.int(fa.ow)}, ${fmt.int(fa.odsp)}</dd>` : "") +
        (p24 ? `<dt>FAO Jun 2024: OW, ODSP</dt><dd>${fmt.int(p24.ow)}, ${fmt.int(p24.odsp)}</dd>` : "") + (p25 ? `<dt>FAO Oct 2025: OW, ODSP</dt><dd>${fmt.int(p25.ow)}, ${fmt.int(p25.odsp)}</dd>` : "");
    },
    tip: () => [],
    dns: "Whether the 2026 allocation will be revised, or what would bring OW down: funded capacity is the FAO's calculation from the budget plan, not a caseload target.",
    wi: `Which assumptions (unemployment, migration, benefit rates) separate the 2026 Budget's funded OW capacity from the FAO's estimate.`,
  };

  // ---- version 6 · gates: the federal income-support window and provincial rule changes ----
  SETUP.gates = rows => {
    const ev = rows.map(r => ({ ...r, s: new Date(r.start + "T00:00:00"), e: r.end ? new Date(r.end + "T00:00:00") : null }));
    const baseOf = t => { const m = new Date(t.getFullYear(), t.getMonth(), 1); let i = -1; Q.forEach((d, j) => { if (d.date < m) i = j; }); return i; }; // last quarter-end month before the change
    const ch = (i, k, prog) => (Q[i + k] && Q[i] ? (Q[i + k][prog] / Q[i][prog] - 1) * 100 : null);
    ev.forEach(e => { e.at = e.level === "federal" && e.id === "CRB" ? e.e : e.s; e.base = baseOf(e.at);
      e.after = { ow: ch(e.base, 4, "ow"), odsp: ch(e.base, 4, "odsp") }; e.before = { ow: ch(e.base - 4, 4, "ow"), odsp: ch(e.base - 4, 4, "odsp") }; });
    X.ev = ev; X.fed = ev.filter(e => e.level === "federal"); X.prov = ev.filter(e => e.level === "provincial");
    const cerb = X.fed.find(e => e.id === "CERB"), crb = X.fed.find(e => e.id === "CRB"); X.cerb = cerb; X.crb = crb; X.win = [cerb.s, crb.e];
    X.inWin = d => (d.date >= cerb.s && d.date <= cerb.e ? "CERB" : d.date >= crb.s && d.date <= crb.e ? "CRB" : null);
    X.lastBefore = Q[crb.base]; X.next = Q[crb.base + 1];
    const qq = Q.slice(1).map((d, i) => ({ d, v: (d.ow / Q[i].ow - 1) * 100 })).sort((a, b) => b.v - a.v);
    X.nextRank = qq.findIndex(r => r.d === X.next) + 1; X.nextQoQ = qq.find(r => r.d === X.next).v; X.topQoQ = qq[0];
    X.winLow = d3.least(Q.filter(d => X.inWin(d)), d => d.ow);
    X.odspAfter = d3.max(X.prov.filter(e => /ODSP/.test(e.label) && e.s > cerb.s), e => Math.abs(e.after.odsp));
    X.odspN = X.prov.filter(e => /ODSP/.test(e.label) && e.s > cerb.s).length;
    X.from = "2015 Q1"; // the changes fall in 2018–2023: a shorter cube gives them room
  };
  UNDER.gates = ctx => {
    const { g, P, flat } = ctx; X.drawn = { fed: [], prov: [] };
    if (S.plane === "both" || S.plane === "fed") {
      // the path's quarters inside the window get a hatched halo, visible in every view (also the path view)
      const W = Q.map(d => G.w3(d)), seg = Q.slice(1).map((d, i) => [i, i + 1]).filter(([a, b]) => Q[b].date > X.win[0] && Q[a].date < X.win[1]);
      seg.forEach(([a, b]) => { const p = P(W[a]), q = P(W[b]); g.append("line").attr("class", "ins").attr("x1", p[0]).attr("y1", p[1]).attr("x2", q[0]).attr("y2", q[1]).style("stroke", "url(#hatchA)").style("stroke-width", 11).style("stroke-linecap", "round"); });
      if (!flat || ctx.tf) {
        const s = { fill: "url(#hatchA)", stroke: "var(--ink2)" };
        X.drawn.fed = X.fed.map(e => ({ e, b: timeBand(ctx, e.s, e.e, s) }));
      }
    }
    if (S.plane === "both" || S.plane === "prov") X.drawn.prov = X.prov.map(e => ({ e, gt: timeGate(ctx, e.s, {}) })).filter(r => r.gt);
  };
  OVER.gates = ctx => {
    X.drawn.fed.forEach(({ e, b }) => { if (!b) return;
      const c = b.pp ? [(b.pp[0][0] + b.pp[2][0]) / 2, (b.pp[0][1] + b.pp[2][1]) / 2] : [b.x, b.top + 26];
      tag(ctx, e.short, c, [[c[0], c[1], "middle"], [c[0], c[1] + 16, "middle"], [c[0], c[1] + 32, "middle"]], 11); });
    const sel = X.prov.find(e => e.base === S.t || e.base + 1 === S.t);
    X.drawn.prov.forEach(({ e, gt }) => { const t = gt.top;
      const el = ctx.g.append("text").attr("class", "ann ins-lbl").attr("dy", "0.32em").style("font-weight", e === sel ? 700 : 500).style("font-size", "11px").text(e.short);
      placeSafe(ctx.g.node().ownerSVGElement, el, [[t[0], t[1] - 7, "middle"], [t[0], t[1] + 24, "middle"], [t[0], t[1] + 38, "middle"], [t[0] + 8, t[1] + 10, "start"], [t[0] - 8, t[1] + 10, "end"]], ctx.w); });
  };
  TEXT.gates = {
    card: () => `OW fell through the federal support window (CERB, then CRB) and was lowest in ${X.winLow.label}${X.winLow === X.lastBefore ? ", the last quarter-end before the CRB ended" : ""}; ${X.next.label} brought OW's ${X.nextRank === 1 ? "largest" : X.nextRank === 2 ? "second-largest" : `#${X.nextRank}`} quarterly rise since ${Q[0].label} (${fmt.sp(X.nextQoQ)}).`,
    def: () => `Hatched band: the federal income-support window, CERB (${dlab(X.cerb.s)} – ${dlab(X.cerb.e)}) then CRB (${dlab(X.crb.s)} – ${dlab(X.crb.e)}); in 3D it lies on the floor and the back wall of the cube, and the path's quarters inside it carry a hatched halo in every view. Numbered dashed lines (on the floor and back wall in 3D, vertical in the time views): provincial changes to OW and ODSP rules (Figure 1d lists them, with sources). Changes are compared with the last quarter-end before them. Dates line up; these data cannot show that a benefit or rule caused a change. The cube starts at ${X.from} to give the changes room; the full path is in D v3 and in the timeline below.`,
    note: () => {
      const P3 = X.prov.filter(e => /ODSP/.test(e.label) && e.s > X.cerb.s);
      return `<b>Support window and rule changes.</b> From ${Q[X.cerb.base].label}, the last quarter-end before CERB, to ${X.winLow.label}, OW fell from ${fmt.int(Q[X.cerb.base].ow)} to ${fmt.int(X.winLow.ow)} cases; ODSP changed ${fmt.sp((X.winLow.odsp / Q[X.cerb.base].odsp - 1) * 100)} over the same quarters. ` +
        `In the four quarters from ${Q[X.crb.base].label}, the last quarter-end before the CRB ended, OW changed ${fmt.sp(X.crb.after.ow)}, after ${fmt.sp(X.crb.before.ow)} in the four quarters before. ${X.next.label}'s ${fmt.sp(X.nextQoQ)} is second only to ${X.topQoQ.d.label} (${fmt.sp(X.topQoQ.v)}). ` +
        `After each of the ${X.odspN} ODSP changes since ${P3.length ? mlab(P3[0].s) : ""} (${P3.map(e => e.short).join(", ")}), the ODSP caseload moved by at most ${fmt.f1(X.odspAfter)}% over four quarters.`;
    },
    key: () => [[`<svg width="34" height="14" aria-hidden="true"><defs><pattern id="hk" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="6" style="stroke:var(--ink2);stroke-width:1.3;stroke-opacity:.5"/></pattern></defs><rect x="2" y="2" width="30" height="10" style="fill:url(#hk);stroke:var(--ink2)"/></svg>`, "Federal support: CERB, then CRB"],
      [`<svg width="34" height="14" aria-hidden="true"><line x1="17" y1="1" x2="17" y2="13" style="stroke:var(--ink2);stroke-dasharray:4 3"/><text x="23" y="11" style="font:10px var(--sans);fill:var(--ink)">n</text></svg>`, "Provincial change n (list below)"]],
    rows: d => { const w = X.inWin(d), prev = X.prov.filter(e => e.s <= d.date).pop();
      return `<dt>Federal support at quarter-end</dt><dd>${w || "none"}</dd><dt>Latest provincial change</dt><dd>${prev ? `${prev.short} · ${mlab(prev.s)}` : "none in view"}</dd>`; },
    tip: d => (X.inWin(d) ? [`Inside the federal support window (${X.inWin(d)})`] : []),
    dns: "Whether CERB, the CRB or any provincial rule change caused a caseload change: the dates line up, but these data have no measure of who received federal benefits.",
    wi: "How many OW and ODSP households received CERB or CRB, and when they returned (administrative data).",
  };

  // ---- version 7 · trend: the pre-pandemic track and the curtain between path and track ----
  function fitLog(prog, a, z) { // least squares of log(cases) on the quarter number, over [a, z]
    const i0 = Q.findIndex(d => d.label === a), i1 = Q.findIndex(d => d.label === z), xs = d3.range(i0, i1 + 1), ys = xs.map(i => Math.log(Q[i][prog]));
    const mx = d3.mean(xs), my = d3.mean(ys), b = d3.sum(xs, (x, j) => (x - mx) * (ys[j] - my)) / d3.sum(xs, x => (x - mx) ** 2);
    return { i0, i1, b, at: i => Math.exp(my + b * (i - mx)), ann: (Math.exp(4 * b) - 1) * 100 };
  }
  SETUP.trend = () => {
    const b = F.base; X.ib = Q.indexOf(b); X.w = b.ow / (b.ow + b.odsp); X.T0 = b.ow + b.odsp;
    const mk = (a, z, name) => { const f = { a, z, name, ow: fitLog("ow", a, z), odsp: fitLog("odsp", a, z) };
      f.track = i => ({ ow: f.ow.at(i), odsp: f.odsp.at(i), date: Q[i].date }); f.pts = (from, to) => d3.range(from, to + 1).map(i => { const t = f.track(i); return { ...t, ...ix(t) }; }); return f; };
    X.main = mk("2015 Q1", "2019 Q4", "2015–19"); X.alts = [mk("2010 Q1", "2019 Q4", "2010–19"), mk("2017 Q1", "2019 Q4", "2017–19")];
    const L = Q.length - 1;
    X.gap = (f, i) => { const t = f.track(i), d = Q[i]; return { ow: d.ow - t.ow, odsp: d.odsp - t.odsp, owp: (d.ow / t.ow - 1) * 100, odp: (d.odsp / t.odsp - 1) * 100, tot: d.ow + d.odsp - t.ow - t.odsp }; };
    X.gl = X.gap(X.main, L);
    const dev = Q.map((d, i) => (i > X.ib ? X.gap(X.main, i).owp : null));
    X.owLow = d3.least(Q.slice(X.ib + 1), d => dev[Q.indexOf(d)]); X.owBack = Q.slice(Q.indexOf(X.owLow)).find(d => dev[Q.indexOf(d)] > 0);
    X.rob = [X.main, ...X.alts].map(f => ({ f, g: X.gap(f, L) }));
    const all = [X.main, ...X.alts].flatMap(f => f.pts(X.ib, L)).concat(X.main.pts(X.main.ow.i0, X.ib));
    X.ext = { iod: all.map(p => p.iod), iow: all.map(p => p.iow) };
    VIEWS.push({ id: "sum", label: "OW + ODSP over time" }); PRESET.sum = { yaw: 90, pitch: (Math.atan((1 - X.w) / X.w) * 180) / Math.PI };
    TOUR.splice(TOUR.length - 1, 0, ["sum", "Turned until the height is OW + ODSP, the two programs' gaps from their tracks almost cancel: the total stays close to the combined track."], ["3d", "Back to the cube."]);
  };
  UNDER.trend = ctx => {
    const { g, P } = ctx, L = Q.length - 1;
    if (S.plane === "alt") X.alts.forEach(f => line3(g, P, pathW(f.pts(X.ib, L)), { dash: "2 3", w: 1.2, op: 0.8 }));
    line3(g, P, pathW(X.main.pts(X.main.ow.i0, X.ib)), { w: 1.2, op: 0.7 }); // the fitted part
    const track = X.main.pts(X.ib, L); line3(g, P, pathW(track), { dash: "6 4", w: 1.7 });
    if (S.plane !== "line") {
      const act = Q.slice(X.ib).map(d => G.w3(d));
      ribbon(g, P, act, pathW(track), { op: 0.11 });
      track.forEach((t, k) => { if (k % 4 === 0 && k > 0) line3(g, P, [act[k], pathW([t])[0]], { w: 1, op: 0.55 }); });
    }
  };
  OVER.trend = ctx => {
    const { P } = ctx, L = Q.length - 1, end = X.main.pts(L, L)[0];
    dot(ctx.g, P(G.W(end.iod, end.iow, end.date)), { r: 3 });
    tag(ctx, `${X.main.name} track`, P(G.W(end.iod, end.iow, end.date)));
    if (S.plane === "alt") X.alts.forEach(f => { const e = f.pts(L, L)[0]; tag(ctx, f.name, P(G.W(e.iod, e.iow, e.date)), [], 10.5); });
  };
  TEXT.trend = {
    card: () => `In ${F.last.label} ODSP was ${fmt.int(Math.abs(X.gl.odsp))} cases (${fmt.f1(Math.abs(X.gl.odp))}%) below the track of its ${X.main.name} growth and OW ${fmt.int(X.gl.ow)} (${fmt.f1(X.gl.owp)}%) above its own; together they were only ${fmt.int(Math.abs(X.gl.tot))} off, so the total hides two opposite departures.`,
    def: () => `The track continues each program's ${X.main.a} – ${X.main.z} trend (a straight line through the logarithm of cases: ODSP ${fmt.sp(X.main.odsp.ann)} a year, OW ${fmt.sp(X.main.ow.ann)} a year). The shaded curtain joins each quarter on the path to the same quarter on the track; its length in the flat views is the gap. "OW + ODSP over time" turns the cube until the height is the combined caseload. A track is a descriptive reference: not a forecast, and not what would have happened without the pandemic.`,
    note: () => {
      const r = X.rob.slice(1), rng = k => d3.extent(X.rob, x => x.g[k]);
      return `<b>Pre-pandemic track.</b> OW was furthest below its track in ${X.owLow.label} (${fmt.sp(X.gap(X.main, Q.indexOf(X.owLow)).owp)}) and back above it from ${X.owBack.label}. ` +
        `In ${F.last.label}: ODSP ${sint(X.gl.odsp)} (${fmt.sp(X.gl.odp)}), OW ${sint(X.gl.ow)} (${fmt.sp(X.gl.owp)}), OW + ODSP ${sint(X.gl.tot)} against the ${X.main.name} tracks. ` +
        `With other fit windows (${r.map(x => x.f.name).join(", ")}) ODSP is ${fmt.f1(-rng("odp")[1])}–${fmt.f1(-rng("odp")[0])}% below and OW ${fmt.f1(rng("owp")[0])}–${fmt.f1(rng("owp")[1])}% above: the direction does not depend on the window; the size does.`;
    },
    key: () => [[sw("none", 0, "var(--ink2)", "6 4"), `Track: ${X.main.name} trend continued`], [sw("var(--ink2)", 0.18, "none"), "Gap between path and track"], [sw("none", 0, "var(--ink2)", "2 3"), "Other fit windows (option)"]],
    rows: d => { const i = Q.indexOf(d); if (i < X.main.ow.i0) return `<dt>Track</dt><dd>from ${X.main.a}</dd>`; const gp = X.gap(X.main, i);
      return `<dt>OW vs track</dt><dd>${sint(gp.ow)} (${fmt.sp(gp.owp)})</dd><dt>ODSP vs track</dt><dd>${sint(gp.odsp)} (${fmt.sp(gp.odp)})</dd><dt>OW + ODSP vs track</dt><dd>${sint(gp.tot)}</dd>`; },
    tip: d => { const i = Q.indexOf(d); if (i <= X.ib) return []; const gp = X.gap(X.main, i); return [`Against the ${X.main.name} track: OW ${fmt.sp(gp.owp)}, ODSP ${fmt.sp(gp.odp)}`]; },
    dns: "What the caseloads would have been without the pandemic: a trend line is a reference, not a counterfactual.",
    wi: "Why ODSP growth, steady at about 3% a year before 2020, has not resumed (applications, grants, exits).",
  };

  // ---- version 8 · porcupine: the "two-year rule" forecast rays and their misses ----
  SETUP.porcupine = () => {
    const H = 8; X.H = H;
    X.ray = i => { if (i < H) return null; const d = Q[i], go = d.ow / Q[i - H].ow, gd = d.odsp / Q[i - H].odsp;
      const pts = d3.range(0, H + 1).map(k => ({ ow: d.ow * go ** (k / H), odsp: d.odsp * gd ** (k / H), date: addQ(d.date, k) })).map(p => ({ ...p, ...ix(p) }));
      const tgt = Q[i + H] || null, end = pts[H];
      return { i, d, pts, end, tgt, eo: tgt ? (end.ow / tgt.ow - 1) * 100 : null, ed: tgt ? (end.odsp / tgt.odsp - 1) * 100 : null };
    };
    X.rays = d3.range(H, Q.length).map(X.ray);
    const scored = X.rays.filter(r => r.tgt), pre = scored.filter(r => r.d.year < 2018);
    X.mPre = d3.mean(pre, r => Math.abs(r.eo)); X.mAll = d3.mean(scored, r => Math.abs(r.eo)); X.mOd = d3.mean(scored, r => Math.abs(r.ed));
    X.wOw = d3.greatest(scored, r => Math.abs(r.eo)); X.wOd = d3.greatest(scored, r => Math.abs(r.ed));
    X.at = lab => scored.find(r => r.d.label === lab); X.lastScored = scored[scored.length - 1];
    X.ext = { iod: [], iow: [], t1: addQ(Q[Q.length - 1].date, H) };
  };
  UNDER.porcupine = ctx => {
    const { g, P } = ctx;
    const draw = (r, st) => { const c = clipped(pathW(r.pts)); c.pieces.forEach(pc => line3(g, P, pc, st)); return c; };
    if (S.plane === "all") X.rays.filter(r => r.d.quarter === 4 && r.i !== S.t).forEach(r => { const c = draw(r, { w: 1.1, op: 0.5 }); c.exits.forEach(e => dot(g, P(e), { r: 2.2, fill: "var(--surface)" })); });
    X.cur = X.ray(S.t);
    if (X.cur) {
      const c = draw(X.cur, { w: 2, c: "var(--ink)" }); c.exits.forEach(e => dot(g, P(e), { r: 3, c: "var(--ink)" }));
      X.curExit = c.exits.length > 0;
      if (X.cur.tgt) { const e = clipped(pathW([X.cur.end, ix2(X.cur.tgt)])); e.pieces.forEach(pc => line3(g, P, pc, { dash: "2 3", w: 1.3, c: "var(--ink)" })); }
    }
  };
  const ix2 = d => ({ iod: d.iod, iow: d.iow, date: d.date });
  OVER.porcupine = ctx => {
    const { P } = ctx, r = X.cur; if (!r) return;
    const inBox = clipSeg(G.W(r.end.iod, r.end.iow, r.end.date), G.W(r.end.iod, r.end.iow, r.end.date));
    if (inBox) { const p = P(G.W(r.end.iod, r.end.iow, r.end.date)); dot(ctx.g, p, { r: 3.5, c: "var(--ink)", fill: "var(--ink)" }); tag(ctx, `Rule from ${r.d.label}`, p); }
    if (r.tgt) { const p = ctx.pts[Q.indexOf(r.tgt)]; ctx.g.append("circle").attr("class", "cross").attr("cx", p[0]).attr("cy", p[1]).attr("r", 5.5).style("fill", "none").style("stroke", "var(--ink)").style("stroke-width", 1.5); }
  };
  TEXT.porcupine = {
    card: () => `Continuing the last two years' growth for two more years missed OW by ${fmt.f1(X.mPre)}% on average from origins before 2018, but by ${fmt.sp(X.at("2019 Q4").eo)} from 2019 Q4 and ${fmt.sp(X.wOw.eo)} from ${X.wOw.d.label}; for ODSP the average miss was ${fmt.f1(X.mOd)}%.`,
    def: () => `From a quarter on the path, the "two-year rule" continues each program's growth over the previous ${X.H} quarters for ${X.H} more quarters, giving a ray in the cube. Grey rays start at every fourth quarter (Q4); the black ray starts at the slider's quarter, and the dotted link joins its end to what happened ${X.H} quarters later (ringed). A small circle marks where a ray leaves the box. The rule is a deliberately simple benchmark, not the method of any agency.`,
    note: () => `<b>Two-year rule.</b> Over ${X.rays.filter(r => r.tgt).length} origins (${X.rays[0].d.label} – ${X.lastScored.d.label}) the rule missed OW by ${fmt.f1(X.mAll)}% on average (${fmt.f1(X.mPre)}% for origins before 2018) and ODSP by ${fmt.f1(X.mOd)}%. ` +
      `Largest misses: OW ${fmt.sp(X.wOw.eo)} from ${X.wOw.d.label} (for ${X.wOw.tgt.label}); ODSP ${fmt.sp(X.wOd.ed)} from ${X.wOd.d.label}, when its growth stopped. From ${F.base.label} the rule overstated OW by ${fmt.sp(X.at(F.base.label).eo)} and ODSP by ${fmt.sp(X.at(F.base.label).ed)}. ` +
      `Misses are largest at turning points, where planning by extrapolation is least reliable. Figure 1d plots every miss.`,
    key: () => [[sw("none", 0, "var(--ink2)"), "Rule from each Q4"], [sw("none", 0, "var(--ink)", null, 2), "Rule from the slider's quarter"], [sw("none", 0, "var(--ink)", "2 3"), "Miss: ray end → actual (ringed)"], [`<svg width="34" height="14" aria-hidden="true"><circle cx="17" cy="7" r="3" style="fill:var(--surface);stroke:var(--ink2);stroke-width:1.3"/></svg>`, "Ray leaves the box"]],
    rows: d => { const r = X.ray(Q.indexOf(d)); if (!r) return `<dt>Two-year rule</dt><dd>from ${Q[X.H].label}</dd>`;
      const t = addQ(d.date, X.H), tl = `${t.getFullYear()} Q${Math.floor(t.getMonth() / 3) + 1}`;
      return `<dt>Rule for ${tl}: OW</dt><dd>${fmt.int(r.end.ow)}${r.tgt ? ` (${fmt.sp(r.eo)})` : ""}</dd><dt>Rule for ${tl}: ODSP</dt><dd>${fmt.int(r.end.odsp)}${r.tgt ? ` (${fmt.sp(r.ed)})` : ""}</dd>` +
        (r.tgt ? `<dt>Actual ${tl}: OW, ODSP</dt><dd>${fmt.int(r.tgt.ow)}, ${fmt.int(r.tgt.odsp)}</dd>` : `<dt>Actual ${tl}</dt><dd>after the data</dd>`); },
    tip: () => [],
    dns: "How official forecasts performed: the rule is a simple benchmark built here; version 5 compares the FAO's projections.",
    wi: "Which signals (applications, unemployment, federal benefits) turned before OW did at 2019 Q4 and 2021 Q3.",
  };

  // ---- version 9 · ghost: the 2008 recession's path, re-anchored at 2019 Q4 ----
  SETUP.ghost = () => {
    const i08 = Q.findIndex(d => d.label === "2008 Q3"), ib = Q.indexOf(F.base), K = Q.length - 1 - ib;
    X.i08 = i08; X.ib = ib; X.K = K;
    X.gp = d3.range(0, K + 1).map(k => ({ k, src: Q[i08 + k], date: Q[ib + k].date, iow: (Q[i08 + k].ow / Q[i08].ow) * 100, iod: (Q[i08 + k].odsp / Q[i08].odsp) * 100 }));
    X.cmp = k => ({ k, src: Q[i08 + k], cur: Q[ib + k], g: X.gp[k], c: { iow: Q[ib + k].iow, iod: Q[ib + k].iod } });
    X.ext = { iod: X.gp.map(p => p.iod), iow: X.gp.map(p => p.iow) };
  };
  UNDER.ghost = ctx => {
    const { g, P } = ctx;
    const src = Q.slice(X.i08, X.i08 + X.K + 1).map(d => G.w3(d)); line3(g, P, src, { w: 8, op: 0.16 }); // where the ghost comes from
    line3(g, P, pathW(X.gp), { dash: "6 4", w: 1.8 });
    if (S.plane === "rungs") X.gp.forEach(p => { if (p.k > 0 && p.k % 4 === 0) line3(g, P, [G.w3(Q[X.ib + p.k]), G.W(p.iod, p.iow, p.date)], { w: 1, op: 0.6, dash: "2 2" }); });
  };
  OVER.ghost = ctx => {
    const { P } = ctx, e = X.gp[X.K], c = Math.min(S.t - X.ib, X.K);
    tag(ctx, `2008 recession, from ${F.base.label}`, P(G.W(e.iod, e.iow, e.date)));
    tag(ctx, `${X.gp[0].src.label} – ${X.gp[X.K].src.label}`, ctx.pts[X.i08 + 6], [], 10.5);
    if (c > 0) dot(ctx.g, P(G.W(X.gp[c].iod, X.gp[c].iow, X.gp[c].date)), { r: 3.5, c: "var(--ink)" });
  };
  TEXT.ghost = {
    card: () => { const a = X.cmp(6), z = X.cmp(X.K);
      return `Six quarters after ${X.gp[0].src.label} OW was up ${fmt.f1(a.g.iow - 100)}%; six quarters after ${F.base.label} it was down ${fmt.f1(100 - a.c.iow)}%. ${X.K} quarters on, OW ends at a similar level (${fmt.f1(z.g.iow)} vs ${fmt.f1(z.c.iow)}), while ODSP, up ${fmt.f1(z.g.iod - 100)}% after 2008, is flat (${fmt.f1(z.c.iod)}).`; },
    def: () => `The dashed ghost replays what OW and ODSP did from ${X.gp[0].src.label} to ${X.gp[X.K].src.label}, as percentage changes, starting from the path at ${F.base.label}. The two anchors are the last quarter-end before the business-cycle peaks dated by the C.D. Howe Institute Business Cycle Council (October 2008; February 2020). The thick grey stroke marks the original 2008–2014 stretch of the path. Faint links join the two at every fourth quarter. A replay of one past episode is a comparison, not a forecast.`,
    note: () => { const r = [4, 6, 12, 20, X.K].map(X.cmp);
      return `<b>2008 ghost.</b> ${r.map(c => `+${c.k} quarters: OW ${fmt.f1(c.g.iow)} after 2008 vs ${fmt.f1(c.c.iow)} after 2019; ODSP ${fmt.f1(c.g.iod)} vs ${fmt.f1(c.c.iod)}`).join(". ")} (each = 100 at its anchor). ` +
        `In its June 2024 projection the FAO expected OW to decline gradually "similar to the experience following the 2008-09 recession". Figure 1d lists the pairs.`; },
    key: () => [[sw("none", 0, "var(--ink2)", "6 4"), "Ghost: 2008 Q3 – 2014 Q4 replayed from 2019 Q4"], [sw("none", 0, "var(--ink2)", null, 6, 0.25), "Original 2008–2014 stretch"], [sw("none", 0, "var(--ink2)", "2 2"), "Same quarter count (option)"]],
    rows: d => { const k = Q.indexOf(d) - X.ib; if (k < 0) return `<dt>Ghost</dt><dd>starts at ${F.base.label}</dd>`; const c = X.cmp(Math.min(k, X.K));
      return `<dt>Quarters after anchor</dt><dd>${c.k}</dd><dt>After 2008 (${c.src.label}): OW, ODSP</dt><dd>${fmt.sp(c.g.iow - 100)}, ${fmt.sp(c.g.iod - 100)}</dd><dt>After 2019: OW, ODSP</dt><dd>${fmt.sp(c.c.iow - 100)}, ${fmt.sp(c.c.iod - 100)}</dd>`; },
    tip: d => { const k = Q.indexOf(d) - X.ib; if (k <= 0 || k > X.K) return []; const c = X.cmp(k); return [`${k} quarters after the anchor: OW ${fmt.sp(c.c.iow - 100)} now, ${fmt.sp(c.g.iow - 100)} after 2008`]; },
    dns: "Why the two shocks differed: the 2008 recession and the pandemic differed in cause, length and federal response, none of which is measured here.",
    wi: "Why ODSP grew steadily after 2008 but not after 2020, when OW ended at a similar relative level both times.",
  };

  // ================= text, key, readout, side panel (Figure 1d) =================
  function sw(fill, op, stroke, dash, sw2, sop) {
    return `<svg width="34" height="14" aria-hidden="true">${fill === "none" ? `<line x1="2" y1="7" x2="32" y2="7" style="stroke:${stroke};stroke-width:${sw2 || 1.6};${dash ? `stroke-dasharray:${dash};` : ""}${sop ? `stroke-opacity:${sop}` : ""}"/>`
      : `<rect x="2" y="2" width="30" height="10" rx="2" style="fill:${fill};fill-opacity:${op};stroke:${stroke}"/>`}</svg>`;
  }
  function planeDef() { const el = document.getElementById("planeDef"); if (el) el.innerHTML = TEXT[MODE].def(); }
  function planeNote() { const el = document.getElementById("planeNote"); if (el) el.innerHTML = TEXT[MODE].note() + (on() ? "" : " <i>(The overlay is switched off.)</i>"); }
  function planeKey() { document.getElementById("planeKey").innerHTML = TEXT[MODE].key().map(([s, t]) => `<div class="row">${s}<span>${t}</span></div>`).join(""); }
  function side() { // Figure 1d: the overlay's numbers in 2D
    const host = document.getElementById("insightTable"), cap = document.getElementById("insCap"); if (!host) return;
    SIDE[MODE](host, cap);
  }
  const SIDE = {};
  SIDE.plans = (host, cap) => {
    cap.innerHTML = "<b>Figure 1d.</b> Average monthly cases by fiscal year: this page's average, the FAO's projections and the 2026 Budget's funded capacity";
    const ys = d3.range(2023, d3.max([...X.cap.ow.keys()]) + 1), cur = fyOf(Q[S.t]);
    const cell = (s, y, k) => { const p = X.s[s].pts.find(q => q.fy === y); return p ? fmt.int(p[k]) : ""; };
    const rows = ys.map(y => { const a = X.fy.get(y); return `<tr${y === cur ? ' style="background:var(--btn)"' : ""}><td>${fyl(y)}</td>` +
      ["ow", "odsp"].map(k => `<td>${a ? fmt.int(a[k]) : ""}</td><td>${cell("f24", y, k)}</td><td>${cell("f25", y, k)}</td><td>${y > X.y0 ? cell("cap", y, k) : ""}</td><td>${y > X.y0 ? cell("est", y, k) : ""}</td>`).join("") + "</tr>"; }).join("");
    host.innerHTML = `<div class="tbl-wrap"><table><thead><tr><th></th><th colspan="5" style="color:var(--ow)">OW</th><th colspan="5" style="color:var(--odsp)">ODSP</th></tr><tr><th>Fiscal year</th>${"<th>This data</th><th>FAO Jun 2024</th><th>FAO Oct 2025</th><th>2026 Budget</th><th>FAO 2026</th>".repeat(2)}</tr></thead><tbody>${rows}</tbody></table></div>` +
      `<p class="note">Sources: FAO, <a href="https://fao-on.org/en/report/fa2305-mccss/">MCCSS Spending Plan Review</a> (${X.s.f24.published}), <a href="https://fao-on.org/en/report/estimates-2025-mccss/">2025 Spending Plan Review</a> (${X.s.f25.published}), <a href="https://fao-on.org/en/report/estimates-2026-mccss/">2026 Spending Plan Review</a> (${X.s.cap.published}); numbers as published in the reports' accessible tables. "FAO 2026" = funded capacity + the FAO's funded caseload shortfall.</p>`;
  };
  SIDE.gates = (host, cap) => {
    cap.innerHTML = "<b>Figure 1d.</b> The changes in the cube, and how each program moved over the four quarters before and after (choose one to move the slider to its last quarter-end before the change)";
    const sel = S.t;
    host.innerHTML = `<div class="tbl-wrap"><table class="gates"><thead><tr><th></th><th>Date</th><th>Change</th><th>OW, 4 quarters before → after</th><th>ODSP, before → after</th><th>Source</th></tr></thead><tbody>` +
      X.ev.map(e => `<tr${e.base === sel ? ' style="background:var(--btn)"' : ""}><td><button type="button" class="ghost gate-go" data-i="${e.base}" aria-label="Move the slider to ${Q[e.base].label}, before ${e.short}">${e.short}</button></td><td>${e.e ? `${mlab(e.s)} – ${mlab(e.e)}` : e.date_precision === "month" ? mlab(e.s) : dlab(e.s)}</td><td style="text-align:left">${e.label}</td>` +
        `<td>${fmt.sp(e.before.ow)} → ${e.after.ow == null ? "n/a" : fmt.sp(e.after.ow)}</td><td>${fmt.sp(e.before.odsp)} → ${e.after.odsp == null ? "n/a" : fmt.sp(e.after.odsp)}</td><td style="text-align:left"><a href="${e.source_url}">${e.source_name}</a></td></tr>`).join("") +
      `</tbody></table></div><p class="note">"Before → after": change over the four quarters up to, and the four quarters from, the last quarter-end before the change (for the CRB: before it ended). Dates line up; they do not show cause.</p>`;
    host.querySelectorAll(".gate-go").forEach(b => b.onclick = () => { stop(); S.t = +b.dataset.i; S.step = 0; moved(); const nb = host.querySelector(`.gate-go[data-i="${b.dataset.i}"]`); if (nb) nb.focus(); });
  };
  SIDE.trend = (host, cap) => {
    const i = S.t > X.ib ? S.t : Q.length - 1, d = Q[i];
    cap.innerHTML = `<b>Figure 1d.</b> Gap from each track in ${d.label} (slider's quarter after ${F.base.label}; otherwise the latest), for three fit windows`;
    host.innerHTML = `<div class="tbl-wrap"><table><thead><tr><th>Fit window</th><th>ODSP growth / yr</th><th>OW growth / yr</th><th>ODSP vs track</th><th>OW vs track</th><th>OW + ODSP vs track</th></tr></thead><tbody>` +
      [X.main, ...X.alts].map(f => { const gp = X.gap(f, i); return `<tr${f === X.main ? ' style="font-weight:600"' : ""}><td>${f.a} – ${f.z}${f === X.main ? " (shown)" : ""}</td><td>${fmt.sp(f.odsp.ann)}</td><td>${fmt.sp(f.ow.ann)}</td><td>${sint(gp.odsp)} (${fmt.sp(gp.odp)})</td><td>${sint(gp.ow)} (${fmt.sp(gp.owp)})</td><td>${sint(gp.tot)}</td></tr>`; }).join("") + `</tbody></table></div>`;
  };
  SIDE.porcupine = (host, cap) => {
    cap.innerHTML = `<b>Figure 1d.</b> How far the two-year rule missed, by the quarter it started from (positive = rule above what happened ${X.H} quarters later)`;
    const w = host.clientWidth || Q1.W("f1b"), n = Q1.narrow(), m = { t: 12, r: n ? 12 : 70, b: 24, l: 56 }, iw = w - m.l - m.r, h = n ? 150 : 170, ih = h - m.t - m.b;
    const sc = X.rays.filter(r => r.tgt), x = d3.scaleTime().domain([Q[0].date, Q[Q.length - 1].date]).range([0, iw]);
    const y = d3.scaleLinear().domain(d3.extent(sc.flatMap(r => [r.eo, r.ed]).concat([0]))).nice().range([ih, 0]);
    host.innerHTML = ""; const svg = d3.select(host).append("svg").attr("width", w).attr("height", h).attr("role", "img").attr("aria-label", "Two-year rule misses by origin quarter, OW and ODSP");
    const g = svg.append("g").attr("transform", `translate(${m.l},${m.t})`);
    Q1.covidBand(g, x, ih, true);
    g.append("g").attr("class", "grid").call(d3.axisLeft(y).ticks(4).tickSize(-iw).tickFormat(""));
    g.append("line").attr("x1", 0).attr("x2", iw).attr("y1", y(0)).attr("y2", y(0)).style("stroke", "var(--ink2)");
    g.append("path").datum(sc).attr("class", "ln-odsp").attr("d", d3.line().x(r => x(r.d.date)).y(r => y(r.ed)));
    g.append("path").datum(sc).attr("class", "ln-ow").attr("d", d3.line().x(r => x(r.d.date)).y(r => y(r.eo)));
    g.append("g").attr("class", "axis").call(d3.axisLeft(y).ticks(4).tickFormat(v => `${v > 0 ? "+" : v < 0 ? "−" : ""}${Math.abs(v)}%`).tickSizeOuter(0));
    Q1.timeAxis(g, x, ih);
    if (!n) Q1.endLabels(g, [{ y: y(sc[sc.length - 1].eo), t: "OW", fill: "var(--ow)" }, { y: y(sc[sc.length - 1].ed), t: "ODSP", fill: "var(--odsp)" }], iw + 8, 14);
    const r = X.ray(S.t); if (r && r.tgt) { g.append("line").attr("x1", x(r.d.date)).attr("x2", x(r.d.date)).attr("y1", 0).attr("y2", ih).style("stroke", "var(--ink)").style("stroke-width", 2); }
    host.insertAdjacentHTML("beforeend", `<p class="note">The vertical line marks the slider's quarter (rules from ${X.lastScored.d.label} onward end after the data). ${n ? "Blue = OW, orange = ODSP." : ""}</p>`);
  };
  SIDE.ghost = (host, cap) => {
    cap.innerHTML = `<b>Figure 1d.</b> The same number of quarters after each anchor (index = 100 at ${X.gp[0].src.label} and at ${F.base.label})`;
    const ks = [2, 4, 6, 8, 12, 16, 20, X.K], cur = S.t - X.ib;
    host.innerHTML = `<div class="tbl-wrap"><table><thead><tr><th>Quarters after</th><th>After 2008</th><th>OW</th><th>ODSP</th><th>After 2019</th><th>OW</th><th>ODSP</th></tr></thead><tbody>` +
      ks.map(k => { const c = X.cmp(k); return `<tr${k === cur ? ' style="background:var(--btn)"' : ""}><td>${k}</td><td>${c.src.label}</td><td>${fmt.f1(c.g.iow)}</td><td>${fmt.f1(c.g.iod)}</td><td>${c.cur.label}</td><td>${fmt.f1(c.c.iow)}</td><td>${fmt.f1(c.c.iod)}</td></tr>`; }).join("") + `</tbody></table></div>`;
  };

  function farFaces(P) { // for each axis, the face (min or max) further from the viewer
    const B = G.B, out = {};
    ["x", "y", "z"].forEach((a, i) => { const lo = [0, 0, 0], hi = [0, 0, 0]; lo[i] = B[a][0]; hi[i] = B[a][1]; out[a] = P(lo)[2] < P(hi)[2] ? B[a][0] : B[a][1]; });
    return out;
  }
  function spatialFrame(g, P, V, n) {
    const B = G.B, far = farFaces(P), keys = ["x", "y", "z"], cen = P([0, 0, 0]);
    const nt = n ? 3 : 4, ticks = { x: ticksOf(V.x, nt), y: ticksOf(V.y, nt), z: ticksOf(V.z, nt) }, titles = [];
    keys.forEach((a, i) => {
      const [b, c] = keys.filter(k => k !== a), ib = keys.indexOf(b), ic = keys.indexOf(c);
      const corner = (vb, vc) => { const q = [0, 0, 0]; q[i] = far[a]; q[ib] = vb; q[ic] = vc; return P(q); };
      const poly = [corner(B[b][0], B[c][0]), corner(B[b][1], B[c][0]), corner(B[b][1], B[c][1]), corner(B[b][0], B[c][1])];
      g.append("polygon").attr("points", poly.map(p => p.slice(0, 2).join(",")).join(" ")).style("fill", "var(--btn)").style("fill-opacity", .35).style("stroke", "var(--axis)");
      [[b, ib, c, ic], [c, ic, b, ib]].forEach(([u, iu, v, iv]) => ticks[u].forEach(tv => {
        const q1 = [0, 0, 0], q2 = [0, 0, 0]; q1[i] = q2[i] = far[a]; q1[iu] = q2[iu] = V[u].toWorld(tv); q1[iv] = B[v][0]; q2[iv] = B[v][1];
        const p1 = P(q1), p2 = P(q2); g.append("line").attr("x1", p1[0]).attr("y1", p1[1]).attr("x2", p2[0]).attr("y2", p2[1]).style("stroke", "var(--grid)");
      }));
      const sh = Q.slice(VA).map(d => { const q = G.w3(d); q[i] = far[a]; return P(q); });
      g.append("path").attr("d", d3.line()(sh.map(p => p.slice(0, 2)))).style("fill", "none").style("stroke", "var(--axis)").style("stroke-width", 1);
      if (a === "z") { // equal growth (OW index = ODSP index) is a plane; on the time wall it is the 45° line
        const lo = Math.max(G.xd[0], G.yd[0]), hi = Math.min(G.xd[1], G.yd[1]);
        const e1 = P([lo - G.c[0], lo - G.c[1], far.z]), e2 = P([hi - G.c[0], hi - G.c[1], far.z]);
        g.append("line").attr("x1", e1[0]).attr("y1", e1[1]).attr("x2", e2[0]).attr("y2", e2[1]).style("stroke", "var(--ink2)").style("stroke-dasharray", "2 4");
      }
    });
    keys.forEach((a, i) => {
      const others = keys.filter(k => k !== a), io = others.map(k => keys.indexOf(k)), cands = [];
      for (const u of B[others[0]]) for (const v of B[others[1]]) {
        const q0 = [0, 0, 0], q1 = [0, 0, 0]; q0[io[0]] = q1[io[0]] = u; q0[io[1]] = q1[io[1]] = v; q0[i] = B[a][0]; q1[i] = B[a][1];
        const p0 = P(q0), p1 = P(q1); cands.push({ q0, p0, p1, mx: (p0[0] + p1[0]) / 2, my: (p0[1] + p1[1]) / 2, len: Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) });
      }
      const e = a === "y" ? d3.least(cands, cd => cd.mx) : d3.greatest(cands, cd => cd.my);
      if (e.len < 50) return;
      let dx = e.mx - cen[0], dy = e.my - cen[1]; const dl = Math.hypot(dx, dy) || 1; dx /= dl; dy /= dl;
      const anchor = dx > 0.35 ? "start" : dx < -0.35 ? "end" : "middle";
      g.append("line").attr("x1", e.p0[0]).attr("y1", e.p0[1]).attr("x2", e.p1[0]).attr("y2", e.p1[1]).style("stroke", "var(--ink2)");
      ticks[a].forEach(tv => {
        const q = e.q0.slice(); q[i] = V[a].toWorld(tv); const p = P(q);
        g.append("line").attr("x1", p[0]).attr("y1", p[1]).attr("x2", p[0] + dx * 5).attr("y2", p[1] + dy * 5).style("stroke", "var(--ink2)");
        g.append("text").attr("class", "lbl").style("font-size", "11px").attr("x", p[0] + dx * 13).attr("y", p[1] + dy * 13).attr("dy", "0.32em").attr("text-anchor", anchor).text(V[a].fmt(tv));
      });
      const top = e.p0[1] < e.p1[1] ? e.p0 : e.p1;
      const tx = a === "y" ? top[0] : e.mx + dx * 40, ty = a === "y" ? top[1] - 16 : e.my + dy * 40;
      const el = g.append("text").attr("class", "lbl-strong").style("fill", V[a].color).attr("x", tx).attr("y", ty).attr("dy", "0.32em").attr("text-anchor", a === "y" ? "middle" : anchor)
        .text(a === "z" ? "Time →" : a === "y" ? `${V[a].title} ↑` : `${V[a].title} →`).node();
      titles.push({ el, dx: a === "y" ? 0 : dx, dy: a === "y" ? -1 : dy });
    });
    return titles;
  }
  function declutter(g, titles, w) {
    const hit = (a, b) => a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
    const ticksT = () => g.selectAll("text.lbl").nodes();
    titles.forEach(({ el, dx, dy }) => {
      for (let k = 0; k < 4 && ticksT().some(t => hit(el.getBBox(), t.getBBox())); k++) {
        el.setAttribute("x", +el.getAttribute("x") + dx * 10); el.setAttribute("y", +el.getAttribute("y") + dy * 10);
        const bb = el.getBBox(); if (bb.x < 2) el.setAttribute("x", +el.getAttribute("x") + (2 - bb.x)); else if (bb.x + bb.width > w - 2) el.setAttribute("x", +el.getAttribute("x") - (bb.x + bb.width - w + 2));
      }
    });
    titles.forEach((t, j) => titles.slice(0, j).forEach(o => {
      for (let k = 0; k < 6 && hit(t.el.getBBox(), o.el.getBBox()); k++) { t.el.setAttribute("x", +t.el.getAttribute("x") + t.dx * 10); t.el.setAttribute("y", +t.el.getAttribute("y") + t.dy * 10); }
      for (let k = 0; k < 6 && hit(t.el.getBBox(), o.el.getBBox()); k++) t.el.setAttribute("y", +t.el.getAttribute("y") + 8);
      const bb = t.el.getBBox(); if (bb.x < 2) t.el.setAttribute("x", +t.el.getAttribute("x") + (2 - bb.x)); else if (bb.x + bb.width > w - 2) t.el.setAttribute("x", +t.el.getAttribute("x") - (bb.x + bb.width - w + 2));
    }));
    const kept = titles.map(t => t.el.getBBox());
    ticksT().forEach(t => { const bb = t.getBBox(); if (kept.some(k => hit(k, bb))) t.remove(); else kept.push(bb); });
  }
  function keepInside(g, w) {
    g.selectAll("text").each(function () { const bb = this.getBBox(), x = +this.getAttribute("x");
      if (bb.x < 2) this.setAttribute("x", x + (2 - bb.x)); else if (bb.x + bb.width > w - 2) this.setAttribute("x", x - (bb.x + bb.width - (w - 2))); });
  }
  function dropLines(g, P, d) {
    const far = farFaces(P), q = G.w3(d), p = P(q);
    ["x", "y", "z"].forEach((a, i) => { const f = q.slice(); f[i] = far[a]; const pf = P(f);
      g.append("line").attr("x1", p[0]).attr("y1", p[1]).attr("x2", pf[0]).attr("y2", pf[1]).style("stroke", "var(--ink2)").style("stroke-width", 1).style("opacity", .7);
      g.append("circle").attr("cx", pf[0]).attr("cy", pf[1]).attr("r", 2.5).style("fill", "var(--ink2)"); });
  }
  function labels(g, pts, c, w, flat) {
    const iOf = d => Q.indexOf(d), lab = !flat ? [[F.last, "start", 8, 0]]
      : [[Q[0], "start", 8, 4], [F.base, "end", -8, -6], ...(S.view === "odsp" ? [] : [[F.owMin, "start", 8, 12]]), [F.last, "start", 8, 0]];
    let fixed = lab.filter(([d]) => iOf(d) <= S.t && iOf(d) >= VA && d !== c).map(([d, anchor, dx, dy]) =>
      g.append("text").attr("class", "ann").attr("x", pts[iOf(d)][0] + dx).attr("y", pts[iOf(d)][1] + dy).attr("dy", "0.32em").attr("text-anchor", anchor).style("font-weight", 500).text(d.label));
    { // a data label wins over a reference label ("2019 Q4 level", "Pandemic"); against a tick label it moves above its dot, or goes
      const R = el => el.getBoundingClientRect(), ov = (a, b) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
      const ticksT = g.selectAll(".axis text").nodes();
      fixed = fixed.filter(t => {
        g.selectAll(":scope > text.lbl").nodes().forEach(r => { if (ov(R(t.node()), R(r))) r.remove(); });
        if (!ticksT.some(k => ov(R(t.node()), R(k)))) return true;
        t.attr("y", +t.attr("y") - 24); if (!ticksT.some(k => ov(R(t.node()), R(k)))) return true;
        t.remove(); return false;
      });
    }
    const p = pts[S.t];
    g.append("circle").attr("cx", p[0]).attr("cy", p[1]).attr("r", 6).style("fill", PH[c.phase]).style("stroke", "var(--ink)").style("stroke-width", 2);
    const cur = g.append("text").attr("class", "ann").text(c.label);
    const hit = (a, b) => a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
    let ok = false; const ttl = g.selectAll(":scope > text.lbl-strong, :scope > text.lbl").nodes();
    for (const [dx, dy, anc] of [[10, -10, "start"], [-10, -10, "end"], [10, 18, "start"], [-10, 18, "end"]]) {
      cur.attr("x", p[0] + dx).attr("y", p[1] + dy).attr("text-anchor", anc);
      const bb = cur.node().getBBox();
      if (bb.x >= 0 && bb.x + bb.width <= w && !fixed.some(t => hit(bb, t.node().getBBox())) && !ttl.some(t => hit(bb, t.getBBox()))) { ok = true; break; }
    }
    if (!ok) { cur.attr("x", p[0] + 10).attr("y", p[1] - 10).attr("text-anchor", "start"); const bb = cur.node().getBBox(); fixed.forEach(t => { if (hit(bb, t.node().getBBox())) t.remove(); }); }
    { const r = cur.node().getBoundingClientRect(); g.selectAll(":scope > text.lbl").each(function () { const o = this.getBoundingClientRect(); if (o.left < r.right && r.left < o.right && o.top < r.bottom && r.top < o.bottom) this.remove(); }); }
  }
  function overlay(svg, w, h, pts) {
    svg.append("rect").attr("width", w).attr("height", h).style("fill", "transparent");
    FIG.hov = svg.append("circle").attr("r", 7).style("fill", "none").style("stroke", "var(--ink2)").style("stroke-width", 1.5).style("display", "none").style("pointer-events", "none");
    FIG.del = d3.Delaunay.from(pts.map((p, i) => (i < VA ? [-1e6, -1e6] : p)), p => p[0], p => p[1]); // quarters before VA are not in the cube
  }
  function bindPointer() {
    const host = document.getElementById("f1a"); let drag = null;
    const local = e => { const r = host.querySelector("svg").getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    const nearest = e => { const [mx, my] = local(e); return FIG.del.find(mx, my); };
    host.addEventListener("pointerdown", e => { if (S.view !== "3d" || !FIG) return; endTour(); drag = { x: e.clientX, y: e.clientY, cam: { ...S.cam }, moved: false }; host.setPointerCapture(e.pointerId); });
    host.addEventListener("pointermove", e => {
      if (!FIG) return;
      if (drag) { const dx = e.clientX - drag.x, dy = e.clientY - drag.y; if (Math.hypot(dx, dy) > 3) drag.moved = true;
        if (drag.moved) { S.cam = { yaw: clamp(drag.cam.yaw + dx * 0.4, LIM.yaw), pitch: clamp(drag.cam.pitch + dy * 0.3, LIM.pitch) }; Q1.hideTip(); fig(); } return; }
      const i = nearest(e), d = Q[i], p = FIG.pts[i];
      FIG.hov.attr("cx", p[0]).attr("cy", p[1]).style("display", null); S.hover = d; tipFor(e, d); timelineHover(d); readout(d);
    });
    host.addEventListener("pointerup", e => {
      if (FIG && (!drag || !drag.moved)) { S.t = nearest(e); S.step = 0; stop(); moved(); }
      drag = null;
    });
    host.addEventListener("pointercancel", () => { drag = null; });
    host.addEventListener("pointerleave", () => { if (drag || !FIG) return; FIG.hov.style("display", "none"); S.hover = null; Q1.hideTip(); timelineHover(null); readout(Q[S.t]); });
    host.addEventListener("dblclick", () => { if (S.view === "3d") { endTour(); animateTo("3d"); } });
  }
  function animateTo(view, done) {
    const from = { ...S.cam }, to = PRESET[view];
    S.view = view; syncs.forEach(f => f());
    if (S.anim) { S.anim.stop(); S.anim = null; }
    if (Q1.reduced() || (from.yaw === to.yaw && from.pitch === to.pitch)) { S.cam = { ...to }; fig(); if (done) done(); return; }
    const T = 700;
    S.anim = d3.timer(el => {
      const u = Math.min(1, el / T), e = d3.easeCubicInOut(u);
      S.cam = { yaw: from.yaw + (to.yaw - from.yaw) * e, pitch: from.pitch + (to.pitch - from.pitch) * e };
      if (u >= 1) { S.anim.stop(); S.anim = null; S.cam = { ...to }; }
      fig(); if (!S.anim && done) done();
    });
  }
  const TOUR = [["3d", "The path, the two time charts and the slider all describe one curve in a cube: ODSP across, OW up, time in depth."],
    ["ow", "Looking along the ODSP axis, the cube flattens into OW over time."], ["3d", "Back to the cube."],
    ["odsp", "Looking along the OW axis (from below), it flattens into ODSP over time."], ["3d", "Back to the cube."],
    ["diff", "Looking along the diagonal between the two axes, the equal-growth plane is seen edge-on: the height is OW index − ODSP index over time."], ["3d", "Back to the cube."],
    ["path", "Looking along time, it flattens into the connected scatterplot: OW against ODSP."]];
  function tour() {
    endTour(); let i = 0; S.tour = true; document.getElementById("tourBtn").textContent = "Stop the tour";
    const step = () => { if (!S.tour) return; if (i >= TOUR.length) { endTour(); return; }
      const [v, t] = TOUR[i++]; document.getElementById("tourText").textContent = t;
      animateTo(v, () => { S.tourTimer = setTimeout(step, Q1.reduced() ? 2600 : 1600); }); };
    step();
  }
  function endTour() { S.tour = false; clearTimeout(S.tourTimer); const b = document.getElementById("tourBtn"); if (b) b.textContent = "Show how the views connect"; }
  function tipFor(e, d) {
    const u = Q1.urAt(DATA.UR, d.date);
    Q1.showTip(e, `<div class="t">${d.label} · ${Q1.phaseOf(d).long}</div>` + Q1.tr("OW cases", `${fmt.int(d.ow)} (index ${fmt.f1(d.iow)})`, "var(--ow)") +
      Q1.tr("ODSP cases", `${fmt.int(d.odsp)} (index ${fmt.f1(d.iod)})`, "var(--odsp)") + Q1.tr("Unemployment, quarter-end month", u ? fmt.pct(u.ur) : "no data") +
      (on() ? TEXT[MODE].tip(d) : []).map(t => `<div class="m"><b>${t}.</b></div>`).join("") +
      `<div class="m">Index: 2019 Q4 = 100. OW counts shown as published.</div>`);
  }
  function readout(d) {
    const i = Q.indexOf(d), p = Q[i - 1], ch = (k) => (p ? fmt.sp((d[k] / p[k] - 1) * 100) : "n/a");
    document.getElementById("readout").innerHTML = `<div class="q">${d.label}</div><div>${Q1.cap(Q1.phaseOf(d).long)}</div><dl>` +
      `<dt>OW cases</dt><dd style="color:var(--ow)">${fmt.int(d.ow)}</dd><dt>OW index</dt><dd>${fmt.f1(d.iow)}</dd><dt>OW vs previous quarter</dt><dd>${ch("ow")}</dd>` +
      `<dt>ODSP cases</dt><dd style="color:var(--odsp)">${fmt.int(d.odsp)}</dd><dt>ODSP index</dt><dd>${fmt.f1(d.iod)}</dd><dt>ODSP vs previous quarter</dt><dd>${ch("odsp")}</dd>` +
      `<dt>OW index − ODSP index</dt><dd>${fmt.spp(d.iow - d.iod)}</dd>` + TEXT[MODE].rows(d) + `</dl>`;
  }
  function keys() {
    const arrow = (dx, dy) => `<svg width="34" height="22" aria-hidden="true"><defs><marker id="ah${dx}${dy}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,0L10,5L0,10z" fill="currentColor"/></marker></defs>` +
      `<line x1="${17 - dx * 11}" y1="${11 + dy * 8}" x2="${17 + dx * 11}" y2="${11 - dy * 8}" stroke="currentColor" stroke-width="2" marker-end="url(#ah${dx}${dy})"/></svg>`;
    document.getElementById("dirKey").innerHTML = [[1, 0, "Right: only ODSP grew"], [0, 1, "Up: only OW grew"], [1, 1, "Diagonal: both grew"], [0, -1, "Down: only OW fell"]]
      .map(([dx, dy, t]) => `<div class="row" style="color:var(--ink2)">${arrow(dx, dy)}<span>${t}</span></div>`).join("");
    document.getElementById("phKey").innerHTML = Q1.PHASES.map(p => `<div class="row"><svg width="34" height="10" aria-hidden="true"><line x1="2" x2="32" y1="5" y2="5" stroke="${PH[p.id]}" stroke-width="3" stroke-linecap="round"/></svg><span>${Q1.cap(p.long)}</span></div>`).join("");
  }

  let TL = null;
  function timeline() { // Figure 1b: the two series over time; the overlay's 2D counterpart where it has one
    const w = Q1.W("f1b"), n = Q1.narrow(), m = { t: 10, r: n ? 12 : 70, b: 22, l: 56 }, iw = w - m.l - m.r, h = n ? 130 : 150, ih = h - m.t - m.b;
    const x = d3.scaleTime().domain([Q[0].date, Q[Q.length - 1].date]).range([0, iw]);
    const ex = on() ? TLX[MODE]() : [];
    const vals = Q.flatMap(d => [d.iow, d.iod]).concat(ex.flatMap(s => s.pts.map(p => p.v)));
    const y = d3.scaleLinear().domain([Math.floor(d3.min(vals) / 10) * 10, Math.ceil(d3.max(vals) / 10) * 10]).range([ih, 0]);
    const svg = Q1.svgIn("f1b", w, h, "OW and ODSP index over time"), g = svg.append("g").attr("transform", `translate(${m.l},${m.t})`);
    Q1.covidBand(g, x, ih, true);
    if (MODE === "gates" && on()) { hatchDef(svg, "hatchB");
      if (S.plane !== "prov") g.append("rect").attr("x", x(X.win[0])).attr("width", x(X.win[1]) - x(X.win[0])).attr("y", 0).attr("height", ih).style("fill", "url(#hatchB)");
      if (S.plane !== "fed") X.prov.forEach(e => g.append("line").attr("x1", x(e.s)).attr("x2", x(e.s)).attr("y1", 0).attr("y2", ih).style("stroke", "var(--ink2)").style("stroke-dasharray", "4 3")); }
    const sp = stepPhase(); if (sp) Q1.encl(g, x, sp.a.date, sp.z.date, ih);
    g.append("g").attr("class", "grid").call(d3.axisLeft(y).ticks(4).tickSize(-iw).tickFormat(""));
    g.append("line").attr("x1", 0).attr("x2", iw).attr("y1", y(100)).attr("y2", y(100)).style("stroke", "var(--ink2)");
    ex.forEach(s => g.append("path").datum(s.pts).attr("d", d3.line().x(p => x(p.date)).y(p => y(p.v))).style("fill", "none").style("stroke", s.c).style("stroke-width", 1.5).style("stroke-dasharray", s.dash));
    g.append("path").datum(Q).attr("class", "ln-odsp").attr("d", d3.line().x(d => x(d.date)).y(d => y(d.iod)));
    g.append("path").datum(Q).attr("class", "ln-ow").attr("d", d3.line().x(d => x(d.date)).y(d => y(d.iow)));
    g.append("g").attr("class", "axis").call(d3.axisLeft(y).ticks(4).tickSizeOuter(0));
    Q1.timeAxis(g, x, ih);
    if (!n) Q1.endLabels(g, [{ y: y(F.last.iow), t: "OW", fill: "var(--ow)" }, { y: y(F.last.iod), t: "ODSP", fill: "var(--odsp)" }], iw + 8, 14);
    const c = Q[S.t];
    g.append("line").attr("x1", x(c.date)).attr("x2", x(c.date)).attr("y1", 0).attr("y2", ih).style("stroke", "var(--ink)").style("stroke-width", 2);
    const hl = g.append("line").attr("y1", 0).attr("y2", ih).style("stroke", "var(--ink2)").style("display", "none");
    const h2 = n ? 90 : 100, ih2 = h2 - m.t - m.b, UR = DATA.UR;
    const y2 = d3.scaleLinear().domain([0, Math.ceil(F.urMax.ur / 5) * 5]).range([ih2, 0]);
    const g2 = Q1.svgIn("f1c", w, h2, "Ontario unemployment rate by month").append("g").attr("transform", `translate(${m.l},${m.t})`);
    Q1.covidBand(g2, x, ih2, false);
    if (sp) Q1.encl(g2, x, sp.a.date, sp.z.date, ih2);
    g2.append("text").attr("class", "lbl").attr("x", x(F.urFirst.date) - 6).attr("y", ih2 / 2).attr("text-anchor", "end").style("font-size", "11px").text(n ? "no data before 2017" : "No unemployment data before Jan 2017");
    g2.append("g").attr("class", "grid").call(d3.axisLeft(y2).ticks(3).tickSize(-iw).tickFormat(""));
    g2.append("path").datum(UR).attr("d", d3.area().x(d => x(d.date)).y0(ih2).y1(d => y2(d.ur))).style("fill", "var(--ur-fill)");
    g2.append("path").datum(UR).attr("d", d3.line().x(d => x(d.date)).y(d => y2(d.ur))).style("fill", "none").style("stroke", "var(--ur)").style("stroke-width", 1.5);
    g2.append("g").attr("class", "axis").call(d3.axisLeft(y2).tickValues(y2.ticks(3).filter(v => v > 0)).tickFormat(d => d + "%").tickSizeOuter(0));
    Q1.timeAxis(g2, x, ih2);
    g2.append("line").attr("x1", x(c.date)).attr("x2", x(c.date)).attr("y1", 0).attr("y2", ih2).style("stroke", "var(--ink)").style("stroke-width", 2);
    const hl2 = g2.append("line").attr("y1", 0).attr("y2", ih2).style("stroke", "var(--ink2)").style("display", "none");
    TL = { x, hl, hl2 };
    const bis = d3.bisector(d => d.date).center;
    const pick = function (e) { return Q[bis(Q, x.invert(d3.pointer(e, this)[0]))]; };
    [[g, ih], [g2, ih2]].forEach(([gg, hh]) => gg.append("rect").attr("width", iw).attr("height", hh).style("fill", "transparent")
      .on("pointermove", function (e) { const d = pick.call(this, e); tipFor(e, d); timelineHover(d); readout(d); figHover(d); })
      .on("pointerleave", () => { Q1.hideTip(); timelineHover(null); readout(Q[S.t]); figHover(null); })
      .on("click", function (e) { S.t = Math.max(VA, Q.indexOf(pick.call(this, e))); S.step = 0; stop(); moved(); }));
  }
  const TLX = { // extra index lines in Figure 1b (within the data's time range)
    plans: () => [],
    gates: () => [],
    trend: () => { const L = Q.length - 1, pts = X.main.pts(X.ib, L); return [{ pts: pts.map(p => ({ date: p.date, v: p.iow })), c: "var(--ow)", dash: "5 3" }, { pts: pts.map(p => ({ date: p.date, v: p.iod })), c: "var(--odsp)", dash: "5 3" }]; },
    porcupine: () => { const r = X.ray(S.t); if (!r) return []; const pts = r.pts.filter(p => p.date <= Q[Q.length - 1].date); return [{ pts: pts.map(p => ({ date: p.date, v: p.iow })), c: "var(--ow)", dash: "2 2" }, { pts: pts.map(p => ({ date: p.date, v: p.iod })), c: "var(--odsp)", dash: "2 2" }]; },
    ghost: () => [{ pts: X.gp.map(p => ({ date: p.date, v: p.iow })), c: "var(--ow)", dash: "6 4" }, { pts: X.gp.map(p => ({ date: p.date, v: p.iod })), c: "var(--odsp)", dash: "6 4" }],
  };
  function timelineHover(d) {
    if (!TL) return;
    [TL.hl, TL.hl2].forEach(l => (d ? l.attr("x1", TL.x(d.date)).attr("x2", TL.x(d.date)).style("display", null) : l.style("display", "none")));
  }
  function figHover(d) {
    const svg = d3.select("#f1a svg"); svg.selectAll(".tl-hover").remove();
    if (d && FIG && Q.indexOf(d) >= VA) { const p = FIG.pts[Q.indexOf(d)]; svg.append("circle").attr("class", "tl-hover").attr("cx", p[0]).attr("cy", p[1]).attr("r", 7).style("fill", "none").style("stroke", "var(--ink2)").style("stroke-width", 1.5); }
  }

  function table() {
    const host = d3.select("#phaseTable"); host.selectAll("*").remove();
    const t = host.append("div").attr("class", "tbl-wrap").append("table");
    t.append("thead").append("tr").selectAll("th").data(["Period", "OW change", "ODSP change", "OW index", "ODSP index", "Path direction"]).join("th").text(d => d);
    const sp = stepPhase();
    t.append("tbody").selectAll("tr").data(Q1.PHASES.map(p => F.phase[p.id])).join("tr").attr("tabindex", 0).style("cursor", "pointer")
      .style("background", p => (sp && sp.id === p.id ? "var(--btn)" : null))
      .on("click", (e, p) => { stop(); setStep(steps.find(s => s.ph === p.id).id); render(); })
      .on("keydown", (e, p) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); stop(); setStep(steps.find(s => s.ph === p.id).id); render();
        const r = document.querySelector(`#phaseTable tr[data-ph="${p.id}"]`); if (r) r.focus(); } })
      .attr("data-ph", p => p.id)
      .selectAll("td").data(p => [`${Q1.cap(p.long)} (${p.a.label} – ${p.z.label})`, fmt.sp(p.ow), fmt.sp(p.odsp), `${fmt.f1(p.a.iow)} → ${fmt.f1(p.z.iow)}`, `${fmt.f1(p.a.iod)} → ${fmt.f1(p.z.iod)}`, dirOf(p).text])
      .join("td").text(d => d);
  }

  function cards() {
    const P = F.phase, T = TEXT[MODE];
    const c = [
      { h: "The data support", li: [
        `Before the pandemic ODSP grew far more than OW (${fmt.sp(P.pre.odsp)} vs ${fmt.sp(P.pre.ow)}).`,
        `During the pandemic OW fell to index ${fmt.f1(F.owMin.iow)} (${F.owMin.label}) while ODSP stayed between ${fmt.f1(F.odsp19.lo.iod)} and ${fmt.f1(F.odsp19.hi.iod)}.`,
        T.card()] },
      { h: "The data do not show", li: [T.dns,
        "How many people were helped, or how need changed: cases are not people and are not adjusted for population.",
        "That unemployment drove caseloads: it is shown for context only."] },
      { h: "Worth investigating", li: [T.wi,
        "Whether readers find the cube and its overlay easier or harder than plain time charts (test with the group before choosing)."] },
    ];
    d3.select("#cards").selectAll("div.card").data(c).join("div").attr("class", "card").html(d => `<h3>${d.h}</h3><ul>${d.li.map(l => `<li>${l}</li>`).join("")}</ul>`);
  }
})();
