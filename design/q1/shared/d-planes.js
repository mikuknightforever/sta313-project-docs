/* Q1 candidate D + reference plane (versions 1–4). A fork of candidate D v3 (variants/d-paths/d.js, left unchanged):
   the same connected scatterplot, 3D space-time view, flat views, slider and timeline, plus one kind of reference plane
   chosen by <body data-plane="share|slice|total|level">. */
(() => {
  "use strict";
  const { fmt } = Q1;
  const PH = { pre: "var(--ph0)", during: "var(--ph1)", post: "var(--ph2)" };
  const S = { step: 0, mode: "count", t: 0, hover: null, timer: null, view: "path", cam: { yaw: 0, pitch: 0 }, anim: null, tour: false };
  let DATA, F, Q; const syncs = [];
  // ---- which reference plane this page shows (one per version) ----
  const MODE = document.body.dataset.plane || "share";
  const PLANE_OPTS = { share: [{ id: "on", label: "OW-share plane" }, { id: "off", label: "No plane" }],
    slice: [{ id: "on", label: "Time slice" }, { id: "off", label: "No slice" }],
    total: [{ id: "on", label: "Total plane" }, { id: "off", label: "No plane" }],
    level: [{ id: "both", label: "Both 2019 Q4 planes" }, { id: "ow", label: "OW plane" }, { id: "odsp", label: "ODSP plane" }, { id: "off", label: "None" }] }[MODE];
  S.plane = PLANE_OPTS[0].id; let PL = null;

  Q1.load("../../../../").then(d => {
    DATA = d; F = d.F; Q = d.Q; window.__facts = F; window.__Q = Q; window.__cam = () => ({ ...S.cam, view: S.view, anim: !!S.anim, t: S.t }); // read-only hooks for the automated checks
    S.t = Q.length - 1;
    const U = new URLSearchParams(location.search);
    if (["count", "index"].includes(U.get("mode"))) S.mode = U.get("mode");
    if (U.has("step")) setStep(+U.get("step"));
    if (U.has("t")) { const i = Q.findIndex(r => r.label.replace(" ", "") === U.get("t")); if (i >= 0) S.t = i; }
    geom(); setupPlanes();
    if (PLANE_OPTS.some(o => o.id === U.get("plane"))) S.plane = U.get("plane");
    window.__PL = () => PL; window.__setCam = (yaw, pitch) => { S.view = "3d"; S.cam = { yaw, pitch }; syncs.forEach(f => f()); fig(); }; // hooks for the automated checks
    if (VIEWS.some(v => v.id === U.get("view"))) { S.view = U.get("view"); S.cam = { ...PRESET[S.view] }; }
    if (S.view === "3d" && U.has("yaw")) S.cam = { yaw: clamp(+U.get("yaw"), LIM.yaw), pitch: clamp(+(U.get("pitch") || PRESET["3d"].pitch), LIM.pitch) };
    Q1.themeButton(render);
    build(); render(); Q1.onResize(render);
    document.body.dataset.ready = "1";
  }).catch(Q1.fail);

  const steps = [{ id: 1, label: "1 · Before", ph: "pre" }, { id: 2, label: "2 · During", ph: "during" }, { id: 3, label: "3 · After", ph: "post" }, { id: 0, label: "Explore all" }];
  function setStep(id) { S.step = id; const s = steps.find(x => x.id === id); S.t = s && s.ph ? Q.indexOf(F.phase[s.ph].z) : Q.length - 1; }
  function build() {
    syncs.push(Q1.seg("#stepSeg", steps, s => s.label, s => S.step === s.id, s => { stop(); setStep(s.id); render(); }));
    syncs.push(Q1.seg("#modeSeg", [{ id: "count", label: "Axes in cases" }, { id: "index", label: "Axes as index, 2019 Q4 = 100" }], m => m.label, m => S.mode === m.id, m => { S.mode = m.id; render(); }));
    const sl = document.getElementById("tSlider"); sl.max = Q.length - 1;
    sl.addEventListener("input", () => { stop(); S.t = +sl.value; S.step = 0; syncs.forEach(f => f()); story(); fig(); timeline(); });
    document.getElementById("playBtn").onclick = () => (S.timer ? stop() : play());
    syncs.push(Q1.seg("#viewSeg", VIEWS, v => v.label, v => S.view === v.id, v => { endTour(); animateTo(v.id); }));
    syncs.push(Q1.seg("#planeSeg", PLANE_OPTS, o => o.label, o => S.plane === o.id, o => { S.plane = o.id; fig(); planeNote(); })); // filtering (L5)
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
    if (S.t >= Q.length - 1) S.t = 0;
    S.step = 0; document.getElementById("playBtn").textContent = "Pause";
    S.timer = setInterval(() => { S.t++; if (S.t >= Q.length - 1) { S.t = Q.length - 1; stop(); } fig(); timeline(); story(); syncs.forEach(f => f()); }, Q1.reduced() ? 700 : 220);
  }
  function stop() { if (S.timer) clearInterval(S.timer); S.timer = null; const b = document.getElementById("playBtn"); if (b) b.textContent = "Play"; }
  function render() { syncs.forEach(f => f()); lead(); story(); fig(); timeline(); table(); cards(); planeDef(); planeNote(); planeKey(); }
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
      `From ${P.pre.a.label} to ${P.pre.z.label} the path moved ${dirOf(P.pre).text.replace(/ \(.*/, "")}: ODSP grew <b>${fmt.pct(P.pre.odsp)}</b>, OW ${fmt.pct(P.pre.ow)}. ` +
      `During the pandemic OW fell to index <b>${fmt.f1(F.owMin.iow)}</b> (${F.owMin.label}) while ODSP stayed between ${fmt.f1(F.odsp19.lo.iod)} and ${fmt.f1(F.odsp19.hi.iod)}, so the path dropped nearly vertically; ` +
      `after it, the path moved ${dirOf(P.post).text.replace(/ \(.*/, "")} to OW ${fmt.f1(F.last.iow)} in ${F.last.label}.`;
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

  // ---------- Figure 1a: one orthographic renderer for the 2D path, the 3D space-time path and the two time views ----------
  // World axes: X = ODSP index, Y (up) = OW index, Z (depth) = time. Looking along Z gives the connected scatterplot,
  // along X gives OW over time, along Y gives ODSP over time (space-time cube "flattening", Bach et al. 2014).
  // v3: a fourth flat view. At yaw 90° the pitch turns the camera about the time axis and the screen's vertical shows
  // OW·cos(pitch) + ODSP·sin(pitch); at pitch −45° that is (OW − ODSP)/√2: the equal-growth plane is seen edge-on and
  // the height of the curve is OW index − ODSP index.
  const VIEWS = [{ id: "path", label: "Path (OW vs ODSP)" }, { id: "3d", label: "3D" }, { id: "ow", label: "OW over time" }, { id: "odsp", label: "ODSP over time" },
    { id: "diff", label: "OW − ODSP over time" }];
  const PRESET = { path: { yaw: 0, pitch: 0 }, "3d": { yaw: 38, pitch: 24 }, ow: { yaw: 90, pitch: 0 }, odsp: { yaw: 90, pitch: 90 }, diff: { yaw: 90, pitch: -45 } };
  const LIM = { yaw: [-20, 110], pitch: [-50, 85] }; // free rotation reaches the diagonal view but never turns the cube upside down
  let G = null, FIG = null;
  const rad = d => (d * Math.PI) / 180, clamp = (v, [a, b]) => Math.max(a, Math.min(b, v));
  function geom() {
    const xd = [Math.floor(d3.min(Q, d => d.iod) / 10) * 10, Math.ceil(d3.max(Q, d => d.iod) / 5) * 5 + 5];
    const yd = [Math.floor(d3.min(Q, d => d.iow) / 10) * 10, Math.ceil(d3.max(Q, d => d.iow) / 10) * 10];
    const L = 1.25 * Math.max(xd[1] - xd[0], yd[1] - yd[0]); // time depth, in index-point units
    const zt = d3.scaleTime().domain([Q[0].date, Q[Q.length - 1].date]).range([0, L]);
    const c = [(xd[0] + xd[1]) / 2, (yd[0] + yd[1]) / 2, L / 2];
    G = { xd, yd, L, zt, c, B: { x: [xd[0] - c[0], xd[1] - c[0]], y: [yd[0] - c[1], yd[1] - c[1]], z: [-L / 2, L / 2] } };
    G.w3 = d => [d.iod - c[0], d.iow - c[1], zt(d.date) - c[2]];
  }
  function rot([X, Y, Z], cam) { // yaw about the vertical axis, then pitch; orthographic (no perspective)
    const t = rad(cam.yaw), p = rad(cam.pitch);
    const x1 = X * Math.cos(t) + Z * Math.sin(t), z1 = -X * Math.sin(t) + Z * Math.cos(t);
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
  // the three variables, in display units (cases or index) and world units
  const VAR = () => {
    const idx = S.mode === "index", b = F.base;
    const mk = (key, i, dom, base, name, color) => ({ key, i, color, name, base,
      disp: idx ? dom : dom.map(v => (v * base) / 100), toWorld: v => (idx ? v : (v * 100) / base) - G.c[i],
      fmt: idx ? d3.format("d") : fmt.k, title: `${name} ${idx ? "index" : "cases"}` });
    return { x: mk("x", 0, G.xd, b.odsp, "ODSP", "var(--odsp)"), y: mk("y", 1, G.yd, b.ow, "OW", "var(--ow)"),
      z: { key: "z", i: 2, color: "var(--ink)", name: "Time", title: "Time", disp: [Q[0].date, Q[Q.length - 1].date], toWorld: v => G.zt(v) - G.c[2], fmt: d3.timeFormat("%Y") } };
  };
  const ticksOf = (v, n) => (v.key === "z" ? d3.scaleTime().domain(v.disp).ticks(d3.timeYear.every(n <= 4 || Q1.narrow() ? 5 : 2))
    : d3.scaleLinear().domain(v.disp).ticks(n));
  const isFlat = () => S.view !== "3d" && !S.anim && S.cam.yaw === PRESET[S.view].yaw && S.cam.pitch === PRESET[S.view].pitch;
  const AXES = { path: ["x", "y"], ow: ["z", "y"], odsp: ["z", "x"] }; // [horizontal, vertical] in each flat view

  function fig() {
    const host = d3.select("#f1a"), w = Q1.W("f1a"), n = Q1.narrow(), h = n ? 380 : 470, flat = isFlat(), V = VAR(), sp = stepPhase(), c = Q[S.t];
    host.classed("spatial", !flat);
    const P = camera(w, h, S.cam);
    const pt = (a, val) => { const q = [G.B.x[0], G.B.y[0], G.B.z[0]]; q[V[a].i] = V[a].toWorld(val); return q; };
    const titles = { path: S.mode === "index" ? "OW index (up) against ODSP index (across), 2019 Q4 = 100, one dot per quarter" : "OW cases (up) against ODSP cases (across), one dot per quarter (axes use the same scale per index point)",
      "3d": "3D space-time path: ODSP across, OW up, time in depth (orthographic projection; read values in the flat views)",
      ow: `${V.y.title} over time: the same path seen along the ODSP axis`, odsp: `${V.x.title} over time: the same path seen along the OW axis`,
      diff: "OW index − ODSP index over time (2019 Q4 = 100, always in index points): the same path seen along the diagonal between the OW and ODSP axes",
      sum: S.mode === "index" ? "OW + ODSP over time (index, 2019 Q4 total = 100): the same path seen with the total plane edge-on" : "OW + ODSP cases over time: the same path seen with the total plane edge-on" };
    document.getElementById("f1aTitle").textContent = S.anim ? "Rotating…" : titles[S.view];
    host.attr("aria-label", S.view === "3d" ? "3D space-time path of OW against ODSP over time. Use the arrow keys to rotate and Home to reset; values are listed in the panel beside the chart."
      : `${titles[S.view]}. Choose 3D in the view buttons to rotate the cube.`);
    const svg = Q1.svgIn("f1a", w, h, titles[S.view]), g = svg.append("g");
    if (flat) (S.view === "diff" ? diffAxes(g, P, V) : S.view === "sum" ? sumAxes(g, P, V) : flatAxes(g, P, V, pt)); else { const titles = spatialFrame(g, P, V, n); keepInside(g, w); declutter(g, titles, w); }
    const drawn = drawPlanes(g, P, flat); // under the path, so a plane never hides the curve
    // the path: segments coloured by period (ordinal neutral ramp); in 3D, far segments are drawn first (painter's order)
    const pts = Q.map(d => P(G.w3(d)));
    const segs = Q.slice(1).map((d, i) => ({ a: pts[i], b: pts[i + 1], i: i + 1, ph: d.phase, z: (pts[i][2] + pts[i + 1][2]) / 2 }));
    if (!flat) segs.sort((u, v) => u.z - v.z);
    g.append("g").selectAll("line").data(segs).join("line").attr("x1", s => s.a[0]).attr("y1", s => s.a[1]).attr("x2", s => s.b[0]).attr("y2", s => s.b[1])
      .style("stroke", s => (s.i <= S.t ? PH[s.ph] : "var(--grid)")).style("stroke-width", s => (s.i <= S.t ? 2.2 : 1.2))
      .style("opacity", s => (sp && s.ph !== sp.id && s.i <= S.t ? 0.3 : 1)).style("stroke-linecap", "round");
    g.append("g").selectAll("circle").data(Q.slice(0, S.t + 1)).join("circle").attr("cx", (d, i) => pts[i][0]).attr("cy", (d, i) => pts[i][1]).attr("r", 2.4)
      .style("fill", d => PH[d.phase]).style("opacity", d => (sp && d.phase !== sp.id ? 0.3 : 1));
    if (!flat) dropLines(g, P, c);
    labels(g, pts, c, w, flat);
    planeMarks(g, pts, drawn, w, flat);
    FIG = { P, pts, flat };
    overlay(svg, w, h, pts);
    if (S.hover) { const i = Q.indexOf(S.hover); FIG.hov.attr("cx", pts[i][0]).attr("cy", pts[i][1]).style("display", null); }
    document.getElementById("viewHint").textContent = S.view === "3d"
      ? "3D view: drag (or click the chart and use the arrow keys) to rotate; double-click or press Home to reset. Faint lines on the back walls are the path's shadows; thin lines drop from the current dot to each wall. Read values in the flat views or in the panel."
      : S.view === "sum"
        ? "Flat view: the height of the curve is OW + ODSP, the combined caseload; the dashed line is the total plane seen edge-on (the 2019 Q4 total). Choose 3D to see the plane in the cube."
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
    const ht = ticksOf(H, 5), vt = ticksOf(Vv, 5).filter(v => v > Vv.disp[0]); // no corner tick: the two axes never collide
    if (H.key === "z") { // pandemic band, as on every time axis of the site
      const a = xs(Q1.COVID[0]), b = xs(Q1.COVID[1]);
      g.append("rect").attr("x", a).attr("width", b - a).attr("y", yt).attr("height", yb - yt).style("fill", "var(--covid)");
      g.append("text").attr("class", "lbl").attr("x", a + 4).attr("y", yt + 11).style("font-size", "11px").text("Pandemic");
    }
    g.append("g").selectAll("line").data(ht).join("line").attr("x1", xs).attr("x2", xs).attr("y1", yt).attr("y2", yb).style("stroke", "var(--grid)");
    g.append("g").selectAll("line").data(vt).join("line").attr("x1", x0).attr("x2", x1).attr("y1", ys).attr("y2", ys).style("stroke", "var(--grid)");
    g.append("g").attr("class", "axis").attr("transform", `translate(0,${yb})`).call(d3.axisBottom(xs).tickValues(ht).tickFormat(H.fmt).tickSizeOuter(0));
    g.append("g").attr("class", "axis").attr("transform", `translate(${x0},0)`).call(d3.axisLeft(ys).tickValues(vt).tickFormat(Vv.fmt).tickSizeOuter(0));
    g.append("text").attr("class", "lbl-strong").attr("x", x1).attr("y", yb + 36).attr("text-anchor", "end").style("fill", H.color).text(`${H.title} →`);
    g.append("text").attr("class", "lbl-strong").attr("transform", "rotate(-90)").attr("x", -yt).attr("y", x0 - 50).attr("text-anchor", "end").style("fill", Vv.color).text(`${Vv.title} →`);
    // 2019 Q4 reference lines; the 45° equal-growth line in the path view
    const ref = a => (V[a].key === "z" ? null : S.mode === "index" ? 100 : V[a].base);
    if (ref(hk) != null) g.append("line").attr("x1", xs(ref(hk))).attr("x2", xs(ref(hk))).attr("y1", yt).attr("y2", yb).style("stroke", "var(--axis)");
    g.append("line").attr("x1", x0).attr("x2", x1).attr("y1", ys(ref(vk))).attr("y2", ys(ref(vk))).style("stroke", "var(--axis)");
    if (S.view === "path" && !(MODE === "share" && planeOn())) {
      const lo = Math.max(G.xd[0], G.yd[0]), hi = Math.min(G.xd[1], G.yd[1]), wp = v => P([v - G.c[0], v - G.c[1], 0]);
      const a = wp(lo), b = wp(hi);
      g.append("line").attr("x1", a[0]).attr("y1", a[1]).attr("x2", b[0]).attr("y2", b[1]).style("stroke", "var(--ink2)").style("stroke-dasharray", "2 4").style("stroke-width", 1.2);
      g.append("text").attr("class", "lbl").attr("x", a[0] + 6).attr("y", a[1] - 6).style("font-size", "11px").text("equal growth");
    } else if (S.view !== "path" && !(MODE === "level" && planeOn() && (S.plane === "both" || S.plane === (S.view === "ow" ? "ow" : "odsp"))))
      g.append("text").attr("class", "lbl").attr("x", x0 + 4).attr("y", ys(ref(vk)) - 5).attr("text-anchor", "start").style("font-size", "11px").text("2019 Q4 level");
  }
  // the fourth flat view: time across, OW index − ODSP index up (both read off the same projection P as the curve)
  function diffAxes(g, P, V) {
    const dd = [G.yd[0] - G.xd[1], G.yd[1] - G.xd[0]]; // the cube's extent in this direction, in difference points
    const sx = dt => P([0, 0, G.zt(dt) - G.c[2]])[0], sy = d => P([0, d - (G.c[1] - G.c[0]), 0])[1];
    const xs = d3.scaleTime().domain(V.z.disp).range(V.z.disp.map(sx)), ys = d3.scaleLinear().domain(dd).range(dd.map(sy));
    const [x0, x1] = xs.range(), [yb, yt] = ys.range();
    const ht = ticksOf(V.z, 5), vt = ys.ticks(6).filter(v => v > dd[0]), sgn = v => (v > 0 ? `+${v}` : v < 0 ? `−${-v}` : "0");
    const a = xs(Q1.COVID[0]), b = xs(Q1.COVID[1]); // pandemic band, as on every time axis of the site
    g.append("rect").attr("x", a).attr("width", b - a).attr("y", yt).attr("height", yb - yt).style("fill", "var(--covid)");
    g.append("text").attr("class", "lbl").attr("x", a + 4).attr("y", yt + 11).style("font-size", "11px").text("Pandemic");
    g.append("g").selectAll("line").data(ht).join("line").attr("x1", xs).attr("x2", xs).attr("y1", yt).attr("y2", yb).style("stroke", "var(--grid)");
    g.append("g").selectAll("line").data(vt).join("line").attr("x1", x0).attr("x2", x1).attr("y1", ys).attr("y2", ys).style("stroke", "var(--grid)");
    g.append("g").attr("class", "axis").attr("transform", `translate(0,${yb})`).call(d3.axisBottom(xs).tickValues(ht).tickFormat(V.z.fmt).tickSizeOuter(0));
    g.append("g").attr("class", "axis").attr("transform", `translate(${x0},0)`).call(d3.axisLeft(ys).tickValues(vt).tickFormat(sgn).tickSizeOuter(0));
    g.append("text").attr("class", "lbl-strong").attr("x", x1).attr("y", yb + 36).attr("text-anchor", "end").text("Time →");
    g.append("text").attr("class", "lbl-strong").attr("transform", "rotate(-90)").attr("x", -yt).attr("y", x0 - 50).attr("text-anchor", "end").text("OW index − ODSP index →");
    // 0 = equal relative change since 2019 Q4 (the equal-growth plane, seen edge-on)
    g.append("line").attr("x1", x0).attr("x2", x1).attr("y1", ys(0)).attr("y2", ys(0)).style("stroke", "var(--ink2)").style("stroke-dasharray", "2 4").style("stroke-width", 1.2);
    if (!(MODE === "share" && planeOn())) g.append("text").attr("class", "lbl").attr("x", x0 + 4).attr("y", ys(0) + 14).style("font-size", "11px").text("0 = equal growth since 2019 Q4"); // left: the curve is far above 0 there
    g.append("text").attr("class", "lbl").attr("x", x0 + 4).attr("y", ys(vt[vt.length - 1]) + 14).style("font-size", "11px").text("OW relatively higher ↑");
    g.append("text").attr("class", "lbl").attr("x", x0 + 4).attr("y", yb - 6).style("font-size", "11px").text("OW relatively lower ↓");
  }
  // ================= reference planes (D + plane versions 1–4) =================
  // Every plane is a set of points in the cube's world coordinates (index units: X = ODSP index, Y = OW index,
  // Z = time). In count mode only the tick labels change, so each plane is the same set of points in both modes.
  // In 3D a plane is a translucent polygon drawn under the path (it never hides the curve). In a flat view it is drawn
  // only when it is seen edge-on, where it becomes a reference line; otherwise it is hidden.
  function crossList(vals, ref, from) { // quarters where vals − ref changes sign (value at the first quarter on the new side)
    const out = []; let prev = 0;
    for (let i = from + 1; i < vals.length; i++) {
      const s = Math.sign(vals[i] - ref); if (s === 0) continue;
      if (prev !== 0 && s !== prev) out.push({ i, side: s > 0 ? "above" : "below" });
      prev = s;
    }
    return out;
  }
  function setupPlanes() {
    const b = F.base, ib = Q.indexOf(b), sh = d => (100 * d.ow) / (d.ow + d.odsp);
    PL = { ib, sh, s0: sh(b), w: b.ow / (b.ow + b.odsp), T0: b.ow + b.odsp };
    PL.rk = k => (k / (100 - k)) * (b.odsp / b.ow);   // OW index = rk · ODSP index on the k% plane (rk(s0) = 1: equal growth)
    PL.ti = d => ((d.ow + d.odsp) / PL.T0) * 100;      // combined caseload, 2019 Q4 total = 100
    const SH = Q.map(sh);
    PL.cross = { share: crossList(SH, PL.s0, ib), s40: crossList(SH, 40, 0), s35: crossList(SH, 35, 0),
      total: crossList(Q.map(PL.ti), 100, ib), ow: crossList(Q.map(d => d.iow), 100, ib), odsp: crossList(Q.map(d => d.iod), 100, ib) };
    PL.shMin = d3.least(Q, sh); PL.shHi = d3.greatest(Q.slice(Q.indexOf(PL.shMin)), sh);
    PL.shSince = Q.slice(0, Q.indexOf(PL.shMin)).filter(d => sh(d) >= sh(PL.shHi)).pop();       // last earlier quarter as high
    PL.tiMin = d3.least(Q.slice(ib), PL.ti);
    const after = Q.slice(Q.indexOf(F.phase.during.a)); PL.odspRange = d3.extent(after, d => d.iod);
    const dur = F.phase.during.rows; PL.durOdsp = d3.max(dur, d => Math.abs(d.odsp / dur[0].odsp - 1) * 100);
    if (MODE === "total") { VIEWS.push({ id: "sum", label: "OW + ODSP over time" }); PRESET.sum = { yaw: 90, pitch: (Math.atan((1 - PL.w) / PL.w) * 180) / Math.PI }; }
  }
  const qOf = c => Q[c.i].label, side = (list, s) => list.filter(c => c.side === s).map(qOf);
  const planeOn = () => S.plane !== "off";
  function planeSpecs() {
    const out = []; if (!planeOn()) return out;
    if (MODE === "share") {
      out.push({ a: -1, b: 1, c: 0, col: "var(--ink2)", main: true, label: `OW share ${fmt.f1(PL.s0)}% (2019 Q4 mix)` });
      [35, 40, 45, 50].forEach(k => out.push({ a: -PL.rk(k), b: 1, c: 0, col: "var(--ink2)", fan: true, label: `${k}%` }));
    }
    if (MODE === "total") out.push({ a: 1 - PL.w, b: PL.w, c: 100, col: "var(--ink2)", main: true, label: `OW + ODSP = ${fmt.int(PL.T0)} (2019 Q4)` });
    if (MODE === "level") {
      if (S.plane !== "odsp") out.push({ a: 0, b: 1, c: 100, col: "var(--ow)", main: true, label: "OW = 2019 Q4 level" });
      if (S.plane !== "ow") out.push({ a: 1, b: 0, c: 100, col: "var(--odsp)", main: true, label: "ODSP = 2019 Q4 level" });
    }
    if (MODE === "slice") out.push({ time: Q[S.t].date, col: "var(--sel)", main: true, label: "" });
    return out;
  }
  function clipLine(a, b, c) { // a·ODSP index + b·OW index = c inside the cube's rectangle → two points [iod, iow]
    const [x0, x1] = G.xd, [y0, y1] = G.yd, pts = [], e = 1e-9;
    if (Math.abs(b) > e) for (const x of [x0, x1]) { const y = (c - a * x) / b; if (y >= y0 - e && y <= y1 + e) pts.push([x, y]); }
    if (Math.abs(a) > e) for (const y of [y0, y1]) { const x = (c - b * y) / a; if (x >= x0 - e && x <= x1 + e) pts.push([x, y]); }
    const u = []; pts.forEach(p => { if (!u.some(q => Math.hypot(q[0] - p[0], q[1] - p[1]) < 1e-6)) u.push(p); });
    return u.length >= 2 ? [u[0], u[1]] : null;
  }
  const area = pp => Math.abs(pp.reduce((s, p, i) => { const q = pp[(i + 1) % pp.length]; return s + p[0] * q[1] - q[0] * p[1]; }, 0)) / 2;
  function drawPlanes(g, P, flat) {
    const drawn = [], B = G.B, far = flat ? null : farFaces(P);
    if (!flat && MODE === "slice" && planeOn()) { // pandemic quarters as a grey band on the floor (same grey as every time axis)
      const z0 = G.zt(Q1.COVID[0]) - G.c[2], z1 = Math.min(B.z[1], G.zt(Q1.COVID[1]) - G.c[2]), y = B.y[0];
      const pp = [[B.x[0], y, z0], [B.x[1], y, z0], [B.x[1], y, z1], [B.x[0], y, z1]].map(P);
      g.append("polygon").attr("class", "plane").attr("points", pp.map(p => p.slice(0, 2).join(",")).join(" ")).style("fill", "var(--covid)").style("stroke", "none");
      drawn.push({ band: true, pp, label: "Pandemic" });
    }
    planeSpecs().forEach(sp => {
      let W;
      if (sp.time) { const z = G.zt(sp.time) - G.c[2]; W = [[B.x[0], B.y[0], z], [B.x[1], B.y[0], z], [B.x[1], B.y[1], z], [B.x[0], B.y[1], z]]; }
      else {
        const s = clipLine(sp.a, sp.b, sp.c); if (!s) return;
        const [p0, p1] = s.map(p => [p[0] - G.c[0], p[1] - G.c[1]]);
        if (sp.fan && !flat) { // fan planes: only their trace on the far time wall, like a scale of rays
          const r = [P([...p0, far.z]), P([...p1, far.z])];
          g.append("line").attr("class", "plane").attr("x1", r[0][0]).attr("y1", r[0][1]).attr("x2", r[1][0]).attr("y2", r[1][1]).style("stroke", sp.col).style("stroke-opacity", .55).style("stroke-dasharray", "3 3");
          drawn.push({ sp, pp: r }); return;
        }
        W = [[...p0, B.z[0]], [...p1, B.z[0]], [...p1, B.z[1]], [...p0, B.z[1]]];
      }
      const pp = W.map(P);
      if (flat && area(pp) > 1) return; // flat view: only an edge-on plane is drawn (as a line)
      g.append("polygon").attr("class", "plane").attr("points", pp.map(p => p.slice(0, 2).join(",")).join(" "))
        .style("fill", sp.col).style("fill-opacity", flat ? 0 : sp.time ? 0.07 : 0.1)
        .style("stroke", sp.col).style("stroke-opacity", sp.fan ? 0.55 : 0.9).style("stroke-width", flat && sp.main ? 1.8 : 1).style("stroke-dasharray", flat ? (sp.fan ? "3 3" : "7 4") : null);
      drawn.push({ sp, pp });
    });
    return drawn;
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
  function planeMarks(g, pts, drawn, w, flat) {
    if (!drawn.length) return;
    const svgNode = g.node().ownerSVGElement;
    // labels at the top end of each plane (billboards: always facing the screen)
    drawn.forEach(d => {
      const lab = d.band ? d.label : d.sp.label; if (!lab) return;
      const top = d3.least(d.pp, p => p[1]), bot = d3.greatest(d.pp, p => p[1]);
      const el = g.append("text").attr("class", "ann plane-lbl").attr("dy", "0.32em").style("font-weight", 500).style("font-size", d.sp && d.sp.fan ? "10.5px" : "11px").text(lab);
      const c = d.band ? [[(top[0] + bot[0]) / 2, (top[1] + bot[1]) / 2, "middle"]] : [[top[0], top[1] - 9, "middle"], [top[0] + 6, top[1] + 8, "start"], [top[0] - 6, top[1] + 8, "end"], [bot[0] + 6, bot[1] - 8, "start"], [bot[0] - 6, bot[1] - 8, "end"]];
      placeSafe(svgNode, el, c, w);
    });
    // rings where the path crosses the plane (up to the slider's quarter)
    const lists = MODE === "share" ? [PL.cross.share] : MODE === "total" ? [PL.cross.total]
      : MODE === "level" ? [S.plane !== "odsp" ? PL.cross.ow : [], S.plane !== "ow" ? PL.cross.odsp : []] : [];
    lists.flat().filter(cr => cr.i <= S.t).forEach(cr => g.append("circle").attr("class", "cross").attr("cx", pts[cr.i][0]).attr("cy", pts[cr.i][1]).attr("r", 5.5)
      .style("fill", "none").style("stroke", "var(--ink)").style("stroke-width", 1.5).style("pointer-events", "none"));
    void flat;
  }
  function crossingAt(d) { // for the tooltip: does the path cross a shown plane at this quarter?
    const i = Q.indexOf(d), hits = [];
    if (!planeOn()) return hits;
    const chk = (list, nm) => list.forEach(c => { if (c.i === i) hits.push(`Crosses the ${nm} here (now ${c.side})`); });
    if (MODE === "share") chk(PL.cross.share, `${fmt.f1(PL.s0)}% share plane`);
    if (MODE === "total") chk(PL.cross.total, "total plane");
    if (MODE === "level") { if (S.plane !== "odsp") chk(PL.cross.ow, "OW 2019 Q4 plane"); if (S.plane !== "ow") chk(PL.cross.odsp, "ODSP 2019 Q4 plane"); }
    return hits;
  }
  // the edge-on view of the total plane: time across, OW + ODSP up (cases or index), read off the same projection P
  function sumAxes(g, P, V) {
    const w = PL.w, idx = S.mode === "index", dd = [w * G.yd[0] + (1 - w) * G.xd[0], w * G.yd[1] + (1 - w) * G.xd[1]];
    const sx = dt => P([0, 0, G.zt(dt) - G.c[2]])[0], sy = v => P([0, (v - (1 - w) * G.c[0]) / w - G.c[1], 0])[1];
    const toDisp = v => (idx ? v : (v * PL.T0) / 100);
    const xs = d3.scaleTime().domain(V.z.disp).range(V.z.disp.map(sx)), ys = d3.scaleLinear().domain(dd.map(toDisp)).range(dd.map(sy));
    const [x0, x1] = xs.range(), [yb, yt] = ys.range(), ht = ticksOf(V.z, 5), vt = ys.ticks(6).filter(v => v > ys.domain()[0]);
    const a = xs(Q1.COVID[0]), b = xs(Q1.COVID[1]);
    g.append("rect").attr("x", a).attr("width", b - a).attr("y", yt).attr("height", yb - yt).style("fill", "var(--covid)");
    g.append("text").attr("class", "lbl").attr("x", a + 4).attr("y", yt + 11).style("font-size", "11px").text("Pandemic");
    g.append("g").selectAll("line").data(ht).join("line").attr("x1", xs).attr("x2", xs).attr("y1", yt).attr("y2", yb).style("stroke", "var(--grid)");
    g.append("g").selectAll("line").data(vt).join("line").attr("x1", x0).attr("x2", x1).attr("y1", ys).attr("y2", ys).style("stroke", "var(--grid)");
    g.append("g").attr("class", "axis").attr("transform", `translate(0,${yb})`).call(d3.axisBottom(xs).tickValues(ht).tickFormat(V.z.fmt).tickSizeOuter(0));
    g.append("g").attr("class", "axis").attr("transform", `translate(${x0},0)`).call(d3.axisLeft(ys).tickValues(vt).tickFormat(idx ? d3.format("d") : fmt.k).tickSizeOuter(0));
    g.append("text").attr("class", "lbl-strong").attr("x", x1).attr("y", yb + 36).attr("text-anchor", "end").text("Time →");
    g.append("text").attr("class", "lbl-strong").attr("transform", "rotate(-90)").attr("x", -yt).attr("y", x0 - 50).attr("text-anchor", "end").text(idx ? "OW + ODSP index (2019 Q4 total = 100) →" : "OW + ODSP cases →");
  }
  function planeDef() { // definition card (Read this first)
    const el = document.getElementById("planeDef"); if (!el) return;
    const b = F.base;
    el.innerHTML = {
      share: `Every point on the plane has OW = ${fmt.f1(PL.s0)}% of OW + ODSP cases, the mix in ${b.label}. In index units this is the equal-growth plane (OW index = ODSP index). Above it, OW makes up more of the two programs than in ${b.label}. Rays on the back wall mark 35, 40, 45 and 50%. The share does not depend on the base quarter and is the same in cases and index mode; it is not a take-up rate.`,
      slice: `The plane time = the slider's quarter cuts the path at one point, the current quarter; the panel lists its values. The grey band on the floor spans the pandemic quarters (${F.phase.during.a.label} – ${F.phase.during.z.label}). In the flat time views the slice is a vertical line.`,
      total: `Every point on the plane has OW + ODSP = ${fmt.int(PL.T0)} cases, the ${b.label} total. In index units: ${d3.format(".3f")(PL.w)} × OW index + ${d3.format(".3f")(1 - PL.w)} × ODSP index = 100. Below it, the two programs together had fewer cases than in ${b.label}. Cases are added across two programs; they are not people. "OW + ODSP over time" shows the plane edge-on.`,
      level: `Two planes: OW = its ${b.label} level (${fmt.int(b.ow)} cases) and ODSP = its ${b.label} level (${fmt.int(b.odsp)} cases). The side of each plane the path is on says whether that program is above or below its ${b.label} caseload. "Back to the ${b.label} level" depends on choosing that quarter.`,
    }[MODE];
  }
  function planeNote() { // the 2D reading: crossings and distances in words
    const el = document.getElementById("planeNote"); if (!el) return;
    const b = F.base, C = PL.cross, sh = PL.sh, L = F.last;
    el.innerHTML = "<b>Reference plane.</b> " + {
      share: `The path crossed below the ${fmt.f1(PL.s0)}% plane in ${side(C.share, "below").join(", ")} and back above it in ${side(C.share, "above").join(", ")}. ` +
        `OW's share of the two programs went from ${fmt.f1(sh(Q[0]))}% (${Q[0].label}) to ${fmt.f1(PL.s0)}% (${b.label}) and ${fmt.f1(sh(PL.shMin))}% (${PL.shMin.label}, the lowest), then up to ${fmt.f1(sh(PL.shHi))}% (${PL.shHi.label}${PL.shSince ? `, the highest since ${PL.shSince.label}` : ""}); ${fmt.f1(sh(L))}% in ${L.label}. ` +
        `It crossed 40% downward in ${side(C.s40, "below").join(", ")} and upward in ${side(C.s40, "above").join(", ")}; 35% downward in ${side(C.s35, "below").join(", ")} and upward in ${side(C.s35, "above").join(", ")}.`,
      slice: `The slice is at ${Q[S.t].label}: OW ${fmt.int(Q[S.t].ow)}, ODSP ${fmt.int(Q[S.t].odsp)}, OW share of the two ${fmt.f1(sh(Q[S.t]))}%. ` +
        `Over the pandemic band OW fell to ${fmt.int(F.owMin.ow)} (${F.owMin.label}, ${fmt.sp((F.owMin.ow / F.phase.during.a.ow - 1) * 100)} from ${F.phase.during.a.label}) and was at ${fmt.int(F.phase.during.z.ow)} by ${F.phase.during.z.label}, while ODSP stayed within ${fmt.f1(PL.durOdsp)}% of its ${F.phase.during.a.label} level.`,
      total: `The path dropped below the plane in ${side(C.total, "below").join(", ")}, reached ${fmt.f1(PL.ti(PL.tiMin))} (${PL.tiMin.label}; ${b.label} total = 100) and came back above it in ${side(C.total, "above").join(", ")}; ` +
        `OW alone was back at its ${b.label} level in ${side(C.ow, "above").join(", ")}. ${L.label}: ${fmt.int(L.ow + L.odsp)} cases (${fmt.f1(PL.ti(L))}).`,
      level: `OW was below its ${b.label} plane from ${side(C.ow, "below").join(", ")} and back above it from ${side(C.ow, "above").join(", ")}. ` +
        `ODSP was below its plane from ${side(C.odsp, "below").join(", ")} and back above in ${side(C.odsp, "above").join(", ")}; since ${F.phase.during.a.label} its index has stayed between ${fmt.f1(PL.odspRange[0])} and ${fmt.f1(PL.odspRange[1])}.`,
    }[MODE] + (planeOn() ? "" : " <i>(The plane is switched off.)</i>");
  }
  function planeKey() {
    const sw = (fill, op, stroke) => `<svg width="34" height="14" aria-hidden="true"><rect x="2" y="2" width="30" height="10" rx="2" style="fill:${fill};fill-opacity:${op};stroke:${stroke}"/></svg>`;
    const ring = `<svg width="34" height="14" aria-hidden="true"><circle cx="17" cy="7" r="5" style="fill:none;stroke:var(--ink);stroke-width:1.5"/></svg>`;
    const rows = {
      share: [[sw("var(--ink2)", .15, "var(--ink2)"), `Plane: OW = ${fmt.f1(PL.s0)}% of the two (${F.base.label} mix)`], [`<svg width="34" height="14" aria-hidden="true"><line x1="2" y1="12" x2="32" y2="2" style="stroke:var(--ink2);stroke-dasharray:3 3"/></svg>`, "Back-wall rays: 35, 40, 45, 50%"], [ring, "Path crosses the plane"]],
      slice: [[sw("var(--sel)", .1, "var(--sel)"), "Slice at the slider's quarter"], [sw("var(--covid)", 1, "none"), "Floor band: pandemic quarters"]],
      total: [[sw("var(--ink2)", .15, "var(--ink2)"), `Plane: OW + ODSP = ${F.base.label} total`], [ring, "Path crosses the plane"]],
      level: [[sw("var(--ow)", .15, "var(--ow)"), `OW = ${F.base.label} level`], [sw("var(--odsp)", .15, "var(--odsp)"), `ODSP = ${F.base.label} level`], [ring, "Path crosses a plane"]],
    }[MODE];
    document.getElementById("planeKey").innerHTML = rows.map(([s, t]) => `<div class="row">${s}<span>${t}</span></div>`).join("");
  }
  function planeCard() { // one take-away per version, computed
    const C = PL.cross, b = F.base;
    return {
      share: `OW's share of the two programs fell from ${fmt.f1(PL.sh(Q[0]))}% (${Q[0].label}) to ${fmt.f1(PL.s0)}% (${b.label}) and ${fmt.f1(PL.sh(PL.shMin))}% (${PL.shMin.label}), then rose to ${fmt.f1(PL.sh(PL.shHi))}% (${PL.shHi.label}).`,
      slice: `Across the pandemic quarters OW fell ${fmt.f1(Math.abs((F.owMin.ow / F.phase.during.a.ow - 1) * 100))}% to its low (${F.owMin.label}) while ODSP stayed within ${fmt.f1(PL.durOdsp)}% of its ${F.phase.during.a.label} level.`,
      total: `OW and ODSP together were below their ${b.label} caseload from ${side(C.total, "below")[0]} until ${Q[C.total.find(c => c.side === "above").i - 1].label}, back above in ${side(C.total, "above")[0]} (OW alone: ${side(C.ow, "above")[0]}).`,
      level: `OW was back at its ${b.label} level from ${side(C.ow, "above")[0]}; ODSP's index has stayed between ${fmt.f1(PL.odspRange[0])} and ${fmt.f1(PL.odspRange[1])} since ${F.phase.during.a.label}.`,
    }[MODE];
  }
  function farFaces(P) { // for each axis, the face (min or max) further from the viewer
    const B = G.B, out = {};
    ["x", "y", "z"].forEach((a, i) => { const lo = [0, 0, 0], hi = [0, 0, 0]; lo[i] = B[a][0]; hi[i] = B[a][1]; out[a] = P(lo)[2] < P(hi)[2] ? B[a][0] : B[a][1]; });
    return out;
  }
  function spatialFrame(g, P, V, n) {
    const B = G.B, far = farFaces(P), keys = ["x", "y", "z"], cen = P([0, 0, 0]);
    const nt = n ? 3 : 4, ticks = { x: ticksOf(V.x, nt), y: ticksOf(V.y, nt), z: ticksOf(V.z, nt) }, titles = [];
    // far walls: faint pane, grid at the tick values, and the path's shadow (its projection onto the wall)
    keys.forEach((a, i) => {
      const [b, c] = keys.filter(k => k !== a), ib = keys.indexOf(b), ic = keys.indexOf(c);
      const corner = (vb, vc) => { const q = [0, 0, 0]; q[i] = far[a]; q[ib] = vb; q[ic] = vc; return P(q); };
      const poly = [corner(B[b][0], B[c][0]), corner(B[b][1], B[c][0]), corner(B[b][1], B[c][1]), corner(B[b][0], B[c][1])];
      g.append("polygon").attr("points", poly.map(p => p.slice(0, 2).join(",")).join(" ")).style("fill", "var(--btn)").style("fill-opacity", .35).style("stroke", "var(--axis)");
      [[b, ib, c, ic], [c, ic, b, ib]].forEach(([u, iu, v, iv]) => ticks[u].forEach(tv => {
        const q1 = [0, 0, 0], q2 = [0, 0, 0]; q1[i] = q2[i] = far[a]; q1[iu] = q2[iu] = V[u].toWorld(tv); q1[iv] = B[v][0]; q2[iv] = B[v][1];
        const p1 = P(q1), p2 = P(q2); g.append("line").attr("x1", p1[0]).attr("y1", p1[1]).attr("x2", p2[0]).attr("y2", p2[1]).style("stroke", "var(--grid)");
      }));
      const sh = Q.map(d => { const q = G.w3(d); q[i] = far[a]; return P(q); });
      g.append("path").attr("d", d3.line()(sh.map(p => p.slice(0, 2)))).style("fill", "none").style("stroke", "var(--axis)").style("stroke-width", 1);
      if (a === "z" && !(MODE === "share" && planeOn())) { // equal growth (OW index = ODSP index) is a plane; on the time wall it is the 45° line
        const lo = Math.max(G.xd[0], G.yd[0]), hi = Math.min(G.xd[1], G.yd[1]);
        const e1 = P([lo - G.c[0], lo - G.c[1], far.z]), e2 = P([hi - G.c[0], hi - G.c[1], far.z]);
        g.append("line").attr("x1", e1[0]).attr("y1", e1[1]).attr("x2", e2[0]).attr("y2", e2[1]).style("stroke", "var(--ink2)").style("stroke-dasharray", "2 4");
      }
    });
    // axes along the most readable box edge; labels always face the screen (billboards)
    keys.forEach((a, i) => {
      const others = keys.filter(k => k !== a), io = others.map(k => keys.indexOf(k)), cands = [];
      for (const u of B[others[0]]) for (const v of B[others[1]]) {
        const q0 = [0, 0, 0], q1 = [0, 0, 0]; q0[io[0]] = q1[io[0]] = u; q0[io[1]] = q1[io[1]] = v; q0[i] = B[a][0]; q1[i] = B[a][1];
        const p0 = P(q0), p1 = P(q1); cands.push({ q0, p0, p1, mx: (p0[0] + p1[0]) / 2, my: (p0[1] + p1[1]) / 2, len: Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) });
      }
      const e = a === "y" ? d3.least(cands, cd => cd.mx) : d3.greatest(cands, cd => cd.my);
      if (e.len < 50) return; // axis seen end-on: no labels
      let dx = e.mx - cen[0], dy = e.my - cen[1]; const dl = Math.hypot(dx, dy) || 1; dx /= dl; dy /= dl;
      const anchor = dx > 0.35 ? "start" : dx < -0.35 ? "end" : "middle";
      g.append("line").attr("x1", e.p0[0]).attr("y1", e.p0[1]).attr("x2", e.p1[0]).attr("y2", e.p1[1]).style("stroke", "var(--ink2)");
      ticks[a].forEach(tv => {
        const q = e.q0.slice(); q[i] = V[a].toWorld(tv); const p = P(q);
        g.append("line").attr("x1", p[0]).attr("y1", p[1]).attr("x2", p[0] + dx * 5).attr("y2", p[1] + dy * 5).style("stroke", "var(--ink2)");
        g.append("text").attr("class", "lbl").style("font-size", "11px").attr("x", p[0] + dx * 13).attr("y", p[1] + dy * 13).attr("dy", "0.32em").attr("text-anchor", anchor).text(V[a].fmt(tv));
      });
      const top = e.p0[1] < e.p1[1] ? e.p0 : e.p1; // the vertical axis is titled above its top end, clear of its ticks
      const tx = a === "y" ? top[0] : e.mx + dx * 40, ty = a === "y" ? top[1] - 16 : e.my + dy * 40;
      const el = g.append("text").attr("class", "lbl-strong").style("fill", V[a].color).attr("x", tx).attr("y", ty).attr("dy", "0.32em").attr("text-anchor", a === "y" ? "middle" : anchor)
        .text(a === "z" ? "Time →" : a === "y" ? `${V[a].title} ↑` : `${V[a].title} →`).node();
      titles.push({ el, dx: a === "y" ? 0 : dx, dy: a === "y" ? -1 : dy });
    });
    return titles;
  }
  // free rotation can bring an axis title onto tick labels: push the title outward, then drop any tick it still covers
  function declutter(g, titles, w) {
    const hit = (a, b) => a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
    const ticksT = () => g.selectAll("text.lbl").nodes();
    titles.forEach(({ el, dx, dy }) => {
      for (let k = 0; k < 4 && ticksT().some(t => hit(el.getBBox(), t.getBBox())); k++) {
        el.setAttribute("x", +el.getAttribute("x") + dx * 10); el.setAttribute("y", +el.getAttribute("y") + dy * 10);
        const bb = el.getBBox(); if (bb.x < 2) el.setAttribute("x", +el.getAttribute("x") + (2 - bb.x)); else if (bb.x + bb.width > w - 2) el.setAttribute("x", +el.getAttribute("x") - (bb.x + bb.width - w + 2));
      }
    });
    titles.forEach((t, j) => titles.slice(0, j).forEach(o => { // two titles meeting: move the later one outward, then down
      for (let k = 0; k < 6 && hit(t.el.getBBox(), o.el.getBBox()); k++) { t.el.setAttribute("x", +t.el.getAttribute("x") + t.dx * 10); t.el.setAttribute("y", +t.el.getAttribute("y") + t.dy * 10); }
      for (let k = 0; k < 6 && hit(t.el.getBBox(), o.el.getBBox()); k++) t.el.setAttribute("y", +t.el.getAttribute("y") + 8);
      const bb = t.el.getBBox(); if (bb.x < 2) t.el.setAttribute("x", +t.el.getAttribute("x") + (2 - bb.x)); else if (bb.x + bb.width > w - 2) t.el.setAttribute("x", +t.el.getAttribute("x") - (bb.x + bb.width - w + 2));
    }));
    // greedy thinning: titles stay; a tick label is kept only if it collides with nothing already kept
    // (handles foreshortened axes, where ticks bunch up, and labels of two axes meeting at a corner)
    const kept = titles.map(t => t.el.getBBox());
    ticksT().forEach(t => { const bb = t.getBBox(); if (kept.some(k => hit(k, bb))) t.remove(); else kept.push(bb); });
  }
  function keepInside(g, w) { // billboard labels can land outside the chart at some angles: nudge them back in
    g.selectAll("text").each(function () { const bb = this.getBBox(), x = +this.getAttribute("x");
      if (bb.x < 2) this.setAttribute("x", x + (2 - bb.x)); else if (bb.x + bb.width > w - 2) this.setAttribute("x", x - (bb.x + bb.width - (w - 2))); });
  }
  function dropLines(g, P, d) { // perpendicular lines from the current dot to the three back walls
    const far = farFaces(P), q = G.w3(d), p = P(q);
    ["x", "y", "z"].forEach((a, i) => { const f = q.slice(); f[i] = far[a]; const pf = P(f);
      g.append("line").attr("x1", p[0]).attr("y1", p[1]).attr("x2", pf[0]).attr("y2", pf[1]).style("stroke", "var(--ink2)").style("stroke-width", 1).style("opacity", .7);
      g.append("circle").attr("cx", pf[0]).attr("cy", pf[1]).attr("r", 2.5).style("fill", "var(--ink2)"); });
  }
  function labels(g, pts, c, w, flat) {
    const iOf = d => Q.indexOf(d), lab = !flat ? [[F.last, "start", 8, 0]] // 3D: the time axis marks the start
      : [[Q[0], "start", 8, 4], [F.base, "end", -8, -6], ...(S.view === "odsp" ? [] : [[F.owMin, "start", 8, 12]]), [F.last, "start", 8, 0]]; // OW's low is only meaningful where OW is shown
    const fixed = lab.filter(([d]) => iOf(d) <= S.t && d !== c).map(([d, anchor, dx, dy]) =>
      g.append("text").attr("class", "ann").attr("x", pts[iOf(d)][0] + dx).attr("y", pts[iOf(d)][1] + dy).attr("dy", "0.32em").attr("text-anchor", anchor).style("font-weight", 500).text(d.label));
    const p = pts[S.t];
    g.append("circle").attr("cx", p[0]).attr("cy", p[1]).attr("r", 6).style("fill", PH[c.phase]).style("stroke", "var(--ink)").style("stroke-width", 2);
    const cur = g.append("text").attr("class", "ann").text(c.label);
    const hit = (a, b) => a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
    let ok = false; const ttl = g.selectAll(":scope > text.lbl-strong, :scope > text.lbl").nodes(); // also keep clear of titles, ticks and band / reference labels
    for (const [dx, dy, anc] of [[10, -10, "start"], [-10, -10, "end"], [10, 18, "start"], [-10, 18, "end"]]) {
      cur.attr("x", p[0] + dx).attr("y", p[1] + dy).attr("text-anchor", anc);
      const bb = cur.node().getBBox();
      if (bb.x >= 0 && bb.x + bb.width <= w && !fixed.some(t => hit(bb, t.node().getBBox())) && !ttl.some(t => hit(bb, t.getBBox()))) { ok = true; break; }
    }
    if (!ok) { cur.attr("x", p[0] + 10).attr("y", p[1] - 10).attr("text-anchor", "start"); const bb = cur.node().getBBox(); fixed.forEach(t => { if (hit(bb, t.node().getBBox())) t.remove(); }); }
    { const r = cur.node().getBoundingClientRect(); g.selectAll(":scope > text.lbl").each(function () { const o = this.getBoundingClientRect(); if (o.left < r.right && r.left < o.right && o.top < r.bottom && r.top < o.bottom) this.remove(); }); }
  }
  // Per render: hover ring + nearest-dot index. Pointer handlers live on the stable #f1a container (wired once in
  // bindPointer), because every frame rebuilds the SVG and a handler on the SVG would lose an in-progress drag.
  function overlay(svg, w, h, pts) {
    svg.append("rect").attr("width", w).attr("height", h).style("fill", "transparent");
    FIG.hov = svg.append("circle").attr("r", 7).style("fill", "none").style("stroke", "var(--ink2)").style("stroke-width", 1.5).style("display", "none").style("pointer-events", "none");
    FIG.del = d3.Delaunay.from(pts, p => p[0], p => p[1]);
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
      if (FIG && (!drag || !drag.moved)) { S.t = nearest(e); S.step = 0; stop(); syncs.forEach(f => f()); story(); fig(); timeline(); }
      drag = null;
    });
    host.addEventListener("pointercancel", () => { drag = null; });
    host.addEventListener("pointerleave", () => { if (drag || !FIG) return; FIG.hov.style("display", "none"); S.hover = null; Q1.hideTip(); timelineHover(null); readout(Q[S.t]); });
    host.addEventListener("dblclick", () => { if (S.view === "3d") { endTour(); animateTo("3d"); } });
  }
  function animateTo(view, done) { // camera rotation between presets (~700 ms); instant with prefers-reduced-motion
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
  if (MODE === "total") TOUR.splice(TOUR.length - 1, 0, ["sum", "Turned until the total plane is edge-on, the height is OW + ODSP: the combined caseload over time."], ["3d", "Back to the cube."]);
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
      crossingAt(d).map(t => `<div class="m"><b>${t}.</b></div>`).join("") +
      `<div class="m">Index: 2019 Q4 = 100. OW counts shown as published.</div>`);
  }
  function readout(d) {
    const i = Q.indexOf(d), p = Q[i - 1], ch = (k) => (p ? fmt.sp((d[k] / p[k] - 1) * 100) : "n/a");
    document.getElementById("readout").innerHTML = `<div class="q">${d.label}</div><div>${Q1.cap(Q1.phaseOf(d).long)}</div><dl>` +
      `<dt>OW cases</dt><dd style="color:var(--ow)">${fmt.int(d.ow)}</dd><dt>OW index</dt><dd>${fmt.f1(d.iow)}</dd><dt>OW vs previous quarter</dt><dd>${ch("ow")}</dd>` +
      `<dt>ODSP cases</dt><dd style="color:var(--odsp)">${fmt.int(d.odsp)}</dd><dt>ODSP index</dt><dd>${fmt.f1(d.iod)}</dd><dt>ODSP vs previous quarter</dt><dd>${ch("odsp")}</dd>` +
      `<dt>OW index − ODSP index</dt><dd>${fmt.spp(d.iow - d.iod)}</dd>` + {
        share: `<dt>OW share of the two</dt><dd>${fmt.f1(PL.sh(d))}%</dd>`,
        slice: `<dt>OW share of the two</dt><dd>${fmt.f1(PL.sh(d))}%</dd><dt>OW + ODSP</dt><dd>${fmt.int(d.ow + d.odsp)}</dd>`,
        total: `<dt>OW + ODSP</dt><dd>${fmt.int(d.ow + d.odsp)}</dd><dt>OW + ODSP index</dt><dd>${fmt.f1(PL.ti(d))}</dd>`,
        level: `<dt>OW vs ${F.base.label}</dt><dd>${fmt.sp(d.iow - 100)}</dd><dt>ODSP vs ${F.base.label}</dt><dd>${fmt.sp(d.iod - 100)}</dd>`,
      }[MODE] + `</dl>`;
  }
  function keys() {
    const arrow = (dx, dy) => `<svg width="34" height="22" aria-hidden="true"><defs><marker id="ah${dx}${dy}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,0L10,5L0,10z" fill="currentColor"/></marker></defs>` +
      `<line x1="${17 - dx * 11}" y1="${11 + dy * 8}" x2="${17 + dx * 11}" y2="${11 - dy * 8}" stroke="currentColor" stroke-width="2" marker-end="url(#ah${dx}${dy})"/></svg>`;
    document.getElementById("dirKey").innerHTML = [[1, 0, "Right: only ODSP grew"], [0, 1, "Up: only OW grew"], [1, 1, "Diagonal: both grew"], [0, -1, "Down: only OW fell"]]
      .map(([dx, dy, t]) => `<div class="row" style="color:var(--ink2)">${arrow(dx, dy)}<span>${t}</span></div>`).join("");
    document.getElementById("phKey").innerHTML = Q1.PHASES.map(p => `<div class="row"><svg width="34" height="10" aria-hidden="true"><line x1="2" x2="32" y1="5" y2="5" stroke="${PH[p.id]}" stroke-width="3" stroke-linecap="round"/></svg><span>${Q1.cap(p.long)}</span></div>`).join("");
  }

  let TL = null;
  function timeline() {
    const w = Q1.W("f1b"), n = Q1.narrow(), m = { t: 10, r: n ? 12 : 70, b: 22, l: 56 }, iw = w - m.l - m.r, h = n ? 130 : 150, ih = h - m.t - m.b;
    const x = d3.scaleTime().domain([Q[0].date, Q[Q.length - 1].date]).range([0, iw]);
    const y = d3.scaleLinear().domain([Math.floor(d3.min(Q, d => Math.min(d.iow, d.iod)) / 10) * 10, Math.ceil(d3.max(Q, d => Math.max(d.iow, d.iod)) / 10) * 10]).range([ih, 0]);
    const g = Q1.svgIn("f1b", w, h, "OW and ODSP index over time").append("g").attr("transform", `translate(${m.l},${m.t})`);
    Q1.covidBand(g, x, ih, true);
    const sp = stepPhase(); if (sp) Q1.encl(g, x, sp.a.date, sp.z.date, ih);
    g.append("g").attr("class", "grid").call(d3.axisLeft(y).ticks(4).tickSize(-iw).tickFormat(""));
    g.append("line").attr("x1", 0).attr("x2", iw).attr("y1", y(100)).attr("y2", y(100)).style("stroke", "var(--ink2)");
    g.append("path").datum(Q).attr("class", "ln-odsp").attr("d", d3.line().x(d => x(d.date)).y(d => y(d.iod)));
    g.append("path").datum(Q).attr("class", "ln-ow").attr("d", d3.line().x(d => x(d.date)).y(d => y(d.iow)));
    g.append("g").attr("class", "axis").call(d3.axisLeft(y).ticks(4).tickSizeOuter(0));
    Q1.timeAxis(g, x, ih);
    if (!n) Q1.endLabels(g, [{ y: y(F.last.iow), t: "OW", fill: "var(--ow)" }, { y: y(F.last.iod), t: "ODSP", fill: "var(--odsp)" }], iw + 8, 14);
    const c = Q[S.t];
    g.append("line").attr("x1", x(c.date)).attr("x2", x(c.date)).attr("y1", 0).attr("y2", ih).style("stroke", "var(--ink)").style("stroke-width", 2);
    const hl = g.append("line").attr("y1", 0).attr("y2", ih).style("stroke", "var(--ink2)").style("display", "none");
    // unemployment strip, same x scale
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
      .on("click", function (e) { S.t = Q.indexOf(pick.call(this, e)); S.step = 0; stop(); syncs.forEach(f => f()); story(); fig(); timeline(); }));
  }
  function timelineHover(d) {
    if (!TL) return;
    [TL.hl, TL.hl2].forEach(l => (d ? l.attr("x1", TL.x(d.date)).attr("x2", TL.x(d.date)).style("display", null) : l.style("display", "none")));
  }
  function figHover(d) {
    const svg = d3.select("#f1a svg"); svg.selectAll(".tl-hover").remove();
    if (d && FIG) { const p = FIG.pts[Q.indexOf(d)]; svg.append("circle").attr("class", "tl-hover").attr("cx", p[0]).attr("cy", p[1]).attr("r", 7).style("fill", "none").style("stroke", "var(--ink2)").style("stroke-width", 1.5); }
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
    const P = F.phase;
    const c = [
      { h: "The data support", li: [
        `Before the pandemic ODSP grew far more than OW (${fmt.sp(P.pre.odsp)} vs ${fmt.sp(P.pre.ow)}): net direction ${dirOf(P.pre).text}.`,
        `During the pandemic OW fell to index ${fmt.f1(F.owMin.iow)} (${F.owMin.label}) while ODSP stayed between ${fmt.f1(F.odsp19.lo.iod)} and ${fmt.f1(F.odsp19.hi.iod)}: the path is almost vertical.`,
        `After the pandemic OW grew ${fmt.sp(P.post.ow)} and ODSP ${fmt.sp(P.post.odsp)}, ending at index ${fmt.f1(F.last.iow)} and ${fmt.f1(F.last.iod)}.`, planeCard()] },
      { h: "The data do not show", li: [
        "Why the programs moved differently: the pandemic, CERB, policy or the economy are not measured here.",
        "How many people were helped, or how need changed: cases are not people and are not adjusted for population.",
        "That unemployment drove caseloads: it is shown for context only."] },
      { h: "Worth investigating", li: [
        `Why the path turned from rightward to vertical after ${F.base.label}.`,
        "Whether readers find the path easier or harder than two lines (test with the group before choosing this form)."] },
    ];
    d3.select("#cards").selectAll("div.card").data(c).join("div").attr("class", "card").html(d => `<h3>${d.h}</h3><ul>${d.li.map(l => `<li>${l}</li>`).join("")}</ul>`);
  }
})();
