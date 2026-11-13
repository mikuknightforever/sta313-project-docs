/* Q2 candidate B — arrows (comets) in OW-share × ODSP-share space + diverging decomposition bars. */
(() => {
  "use strict";
  const { fmt } = Q2;
  const S = { step: 1, i0: 0, i1: 0, sel: "ont", hl: [], timer: null, hover: null };
  let DATA, F, syncs = [], XD, YD, f2dom = null;

  Q2.load("../../../../").then(d => {
    DATA = d; F = d.F; window.__facts = F;
    S.i1 = Q2.N - 1;
    const U = new URLSearchParams(location.search);
    if (U.has("step")) setStep(+U.get("step"));
    if (U.has("start") || U.has("end") || U.has("period")) { Q2.readPeriod(S, U); if (!U.has("step")) S.step = 0; }
    if (DATA.ALL.some(e => e.id === U.get("cma"))) { S.sel = U.get("cma"); if (!U.has("step")) S.step = 0; }
    const cells = DATA.ALL.flatMap(e => e.rows);
    XD = [Math.floor(d3.min(cells, r => r.sow) / 5) * 5, Math.ceil(d3.max(cells, r => r.sow) / 5) * 5];
    YD = [Math.floor(d3.min(cells, r => r.sod) / 5) * 5, Math.ceil(d3.max(cells, r => r.sod) / 5) * 5];
    Q2.themeButton(() => render());
    document.getElementById("lead").innerHTML = Q2.lead(F);
    Q2.renderCards(F);
    build(); render(); Q2.onResize(() => { d3.select("#f1").selectAll("*").remove(); d3.select("#f2").selectAll("*").remove(); render(); });
    document.body.dataset.ready = "1";
  }).catch(Q2.fail);

  function setStep(id) {
    S.step = id; const st = Q2.stepState(F, id);
    if (st) { S.i0 = st.i0; S.i1 = st.i1; S.sel = st.sel; S.hl = st.hl; } else S.hl = [];
  }
  const explore = () => { S.step = 0; S.hl = []; };
  function build() {
    syncs.push(Q2.seg("#stepSeg", Q2.STEPS, s => s.label, s => S.step === s.id, s => { stop(); setStep(s.id); render(); }));
    syncs.push(Q2.periodControl(S, () => { stop(); explore(); render(); }));
    const sl = document.getElementById("tSlider");
    sl.addEventListener("input", () => { stop(); S.i1 = +sl.value; explore(); render(true); });
    sl.addEventListener("change", () => render());
    // no time axis in Figure 1, so the slider readout names the pandemic phase of the end quarter
    const phaseTxt = r => ({ pre: "before the pandemic", during: "pandemic", post: "after the pandemic" })[r.phase] || "";
    syncs.push(() => { const r = Q2.QS[S.i1]; sl.min = S.i0 + 1; sl.max = Q2.N - 1; sl.value = S.i1;
      document.getElementById("tOut").innerHTML = `<b>${r.label}</b> <span class="hint">· ${phaseTxt(r)}</span>`;
      sl.setAttribute("aria-valuetext", `${r.label}, ${phaseTxt(r)}`); });
    document.getElementById("playBtn").onclick = () => (S.timer ? stop() : play());
    document.getElementById("f1Key").innerHTML =
      `<span><svg width="30" height="10"><path d="M1 5.2 L25 2.5 L25 7.5 L1 4.8 Z" style="fill:var(--ink2)"/><circle cx="25" cy="5" r="3" style="fill:var(--ink2)"/><circle cx="1.5" cy="5" r="1.8" style="fill:var(--ink2)"/></svg>One CMA: thin tail at the start quarter, round head at the end quarter</span>` +
      `<span><svg width="30" height="10"><path d="M1 5.2 L25 2.5 L25 7.5 L1 4.8 Z" style="fill:var(--surface);stroke:var(--ink);stroke-width:1"/><circle cx="25" cy="5" r="3" style="fill:var(--surface);stroke:var(--ink)"/></svg>Ontario as a whole</span>` +
      `<span><svg width="24" height="10"><line x1="1" y1="9" x2="23" y2="1" style="stroke:var(--ink2);stroke-width:1.5"/></svg>Equal shares (gap 0)</span>` +
      `<span><svg width="24" height="10"><line x1="1" y1="9" x2="23" y2="1" style="stroke:var(--gap);stroke-dasharray:4 3"/></svg>Constant gap of 10, 20, 30, 40 pp</span>`;
    document.getElementById("f2Key").innerHTML =
      `<span><svg width="16" height="10"><rect width="16" height="10" rx="2" style="fill:var(--ow)"/></svg>OW share change</span>` +
      `<span><svg width="16" height="10"><rect width="16" height="10" rx="2" style="fill:var(--odsp)"/></svg>ODSP share change</span>` +
      `<span><svg width="6" height="14"><line x1="3" x2="3" y1="0" y2="14" style="stroke:var(--ink);stroke-width:2.5"/></svg>Net: narrowed by</span>`;
  }
  function play() {
    explore(); if (S.i1 >= Q2.N - 1) S.i1 = S.i0 + 1;
    document.getElementById("playBtn").textContent = "Pause";
    S.timer = setInterval(() => { S.i1++; render(true); if (S.i1 >= Q2.N - 1) stop(); }, Q2.reduced() ? 160 : 90);
  }
  function stop() {
    if (!S.timer) return; clearInterval(S.timer); S.timer = null;
    document.getElementById("playBtn").textContent = "Play"; render();
  }
  const pick = id => { stop(); S.sel = id; explore(); render(); };
  const sync = () => syncs.forEach(f => f());
  function render(quick) { sync(); story(); fig1(quick); fig2(quick); if (!quick) Q2.table(DATA.ALL, S, pick); }

  const ent = id => DATA.ALL.find(e => e.id === id);
  function story() {
    const a = Q2.QS[S.i0].label, z = Q2.QS[S.i1].label;
    const hint = {
      1: "In Figure 1 every arrow points toward the equal-shares line and crosses the dashed constant-gap lines; Ontario is the hollow arrow.",
      2: `Figure 2 ranks the CMAs by net narrowing (black tick). ${ent(S.sel).name} is highlighted in Figure 1.`,
      3: `In Figure 2 the blue OW bars are long and the orange ODSP bars short; in Figure 1 most arrows are nearly horizontal. ${ent(S.sel).name} is selected.`,
      4: `The period is now ${a} → ${z}: the arrows are short, and in Figure 2 the ticks of the CMAs that widened sit left of zero.`,
    }[S.step];
    document.getElementById("stepText").innerHTML = Q2.story(F, S.step) + (hint ? ` <span class="hint">${hint}</span>` : "");
  }
  // which way an arrow points, in words (direction = which program moved)
  function direction(s) {
    const ow = Math.abs(s.dOW), od = Math.abs(s.dOD);
    let t;
    if (od < 0.25 * ow) t = `nearly horizontal: the OW share did most of the moving (${fmt.spp(s.dOW)} pp vs ${fmt.spp(s.dOD)} pp)`;
    else if (ow < 0.25 * od) t = `nearly vertical: the ODSP share did most of the moving (${fmt.spp(s.dOD)} pp vs ${fmt.spp(s.dOW)} pp)`;
    else t = `${s.dOD > 0 ? "up" : "down"} and to the ${s.dOW > 0 ? "right" : "left"}: OW ${fmt.spp(s.dOW)} pp, ODSP ${fmt.spp(s.dOD)} pp`;
    return t + `, ${s.nar >= 0 ? "toward" : "away from"} the equal-shares line`;
  }
  function comet(x0, y0, x1, y1, w0, w1) {
    const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1e-6, nx = -dy / L, ny = dx / L, p = v => v.toFixed(2);
    return `M${p(x0 + nx * w0 / 2)},${p(y0 + ny * w0 / 2)}L${p(x1 + nx * w1 / 2)},${p(y1 + ny * w1 / 2)}L${p(x1 - nx * w1 / 2)},${p(y1 - ny * w1 / 2)}L${p(x0 - nx * w0 / 2)},${p(y0 - ny * w0 / 2)}Z`;
  }

  // Figure 1: comets in share space; equal scales, so distance from the 45° line is the gap
  function fig1(quick) {
    const w = Q2.W("f1"), n = Q2.narrow() || w < 470;
    const m = { t: 24, r: 14, b: 40, l: 42 }, iw = w - m.l - m.r;
    // equal scales (1 pp across = 1 pp up) whenever the width allows; on narrow screens the vertical scale is
    // stretched to stay readable — the constant-gap lines are still exact, only their angle changes
    const kx = Math.min(iw / (XD[1] - XD[0]), 470 / (YD[1] - YD[0])), ky = Math.max(kx, (n ? 250 : 0) / (YD[1] - YD[0]));
    const pw = kx * (XD[1] - XD[0]), ih = ky * (YD[1] - YD[0]), h = m.t + ih + m.b;
    S.equal = Math.abs(kx - ky) < 1e-9;
    const x = d3.scaleLinear().domain(XD).range([0, pw]), y = d3.scaleLinear().domain(YD).range([ih, 0]);
    const a = Q2.QS[S.i0].label, z = Q2.QS[S.i1].label;
    document.getElementById("f1Title").textContent = `OW share (across) and ODSP share (up) of single-person cases without children, ${a} → ${z}; one arrow per CMA`;
    const host = d3.select("#f1"); let svg = host.select("svg");
    if (svg.empty()) {
      svg = host.append("svg").attr("width", w).attr("height", h).attr("role", "img");
      const g = svg.append("g").attr("class", "root").attr("transform", `translate(${m.l},${m.t})`);
      g.append("g").attr("class", "grid").call(d3.axisLeft(y).ticks(5).tickSize(-pw).tickFormat(""));
      g.append("g").attr("class", "grid").attr("transform", `translate(0,${ih})`).call(d3.axisBottom(x).ticks(8).tickSize(-ih).tickFormat(""));
      const ref = g.append("g").attr("class", "ref");
      [0, 10, 20, 30, 40].forEach(gp => { // lines of constant gap: ODSP share = OW share + gp
        const xa = Math.max(XD[0], YD[0] - gp), xb = Math.min(XD[1], YD[1] - gp); if (xb - xa < 2) return;
        ref.append("line").attr("x1", x(xa)).attr("y1", y(xa + gp)).attr("x2", x(xb)).attr("y2", y(xb + gp))
          .style("stroke", gp ? "var(--gap)" : "var(--ink2)").style("stroke-width", gp ? 1 : 1.5).style("stroke-dasharray", gp ? "4 3" : null);
        const tx = x(xb) - 4, ty = y(xb + gp) + 4;
        const ang = -Math.atan2(y(xa + gp) - y(xb + gp), x(xb) - x(xa)) * 180 / Math.PI;
        const t = ref.append("text").attr("class", "lbl ref-lbl").attr("transform", `translate(${tx},${ty}) rotate(${ang})`).attr("text-anchor", "end").attr("dy", "-0.35em")
          .style("font-size", "11px").text(gp ? `gap ${gp} pp` : "equal shares (gap 0)");
        const b = t.node().getBBox(), len = Math.hypot(x(xb) - x(xa), y(xa + gp) - y(xb + gp));
        if (b.width > len - 8) { t.text(gp ? `${gp} pp` : "gap 0"); if (t.node().getBBox().width > len - 8) t.remove(); }
      });
      g.append("g").attr("class", "axis").call(d3.axisLeft(y).tickValues(y.ticks(5).filter(v => v > YD[0])).tickFormat(v => v + "%").tickSizeOuter(0));
      g.append("g").attr("class", "axis").attr("transform", `translate(0,${ih})`).call(d3.axisBottom(x).ticks(n ? 5 : 8).tickFormat(v => v + "%").tickSizeOuter(0));
      g.append("text").attr("class", "lbl").attr("x", pw).attr("y", ih + 32).attr("text-anchor", "end").text("OW share of cases →");
      g.append("text").attr("class", "lbl").attr("x", -m.l + 2).attr("y", -10).text("↑ ODSP share of cases");
      g.append("g").attr("class", "comets"); g.append("g").attr("class", "labels"); g.append("circle").attr("class", "ring");
      g.append("rect").attr("class", "hit").attr("width", pw).attr("height", ih).style("fill", "transparent");
    }
    svg.attr("aria-label", `Arrow chart: each CMA's OW and ODSP shares from ${a} to ${z}`);
    const g = svg.select("g.root"), T = quick ? 0 : Q2.dur(450);
    const R = Q2.ranked(DATA.CMAS, S.i0, S.i1), O = Q2.sum(DATA.ONT, S.i0, S.i1), all = [...R, O];
    const lvl = s => (s.e.id === S.sel ? 3 : s.e.ont ? 2 : S.hl.includes(s.e.id) ? 1 : 0);
    const P = s => ({ x0: x(s.a.sow), y0: y(s.a.sod), x1: x(s.z.sow), y1: y(s.z.sod) });
    const cg = g.select("g.comets").selectAll("g.c").data(all, s => s.e.id).join(en => {
      const e = en.append("g").attr("class", "c");
      e.append("path"); e.append("circle").attr("class", "st").attr("r", 1.8); e.append("circle").attr("class", "hd"); return e;
    });
    cg.sort((p, q) => lvl(p) - lvl(q));
    const wid = s => (lvl(s) === 3 ? 8 : 5.5), fade = s => (S.hl.length || S.sel !== "ont" ? (lvl(s) ? 1 : 0.38) : 0.62);
    cg.select("path").style("fill", s => (s.e.ont ? "var(--surface)" : lvl(s) === 3 ? "var(--ink)" : "var(--ink2)"))
      .style("stroke", s => (s.e.ont ? "var(--ink)" : "none")).style("stroke-width", 1).style("opacity", fade)
      .transition().duration(T).attr("d", s => { const p = P(s); return comet(p.x0, p.y0, p.x1, p.y1, 0.6, wid(s)); });
    cg.select("circle.hd").style("fill", s => (s.e.ont ? "var(--surface)" : lvl(s) === 3 ? "var(--ink)" : "var(--ink2)"))
      .style("stroke", s => (s.e.ont ? "var(--ink)" : "var(--surface)")).style("stroke-width", s => (s.e.ont ? 1 : 1.2)).style("opacity", fade)
      .transition().duration(T).attr("cx", s => P(s).x1).attr("cy", s => P(s).y1).attr("r", s => wid(s) / 2 + 0.6);
    cg.select("circle.st").style("fill", "var(--ink2)").style("opacity", fade).transition().duration(T).attr("cx", s => P(s).x0).attr("cy", s => P(s).y0);
    // labels: selected, highlighted, Ontario, most and least narrowing; placed where they do not collide
    const lab = g.select("g.labels"); lab.selectAll("*").remove();
    const want = [], add = s => { if (s && !want.includes(s)) want.push(s); };
    add(all.find(s => s.e.id === S.sel)); S.hl.forEach(id => add(all.find(s => s.e.id === id))); add(R[0]); add(R[R.length - 1]); add(O);
    const boxes = [...g.selectAll("text.ref-lbl").nodes()].map(t => t.getBoundingClientRect());
    const sv = svg.node().getBoundingClientRect();
    want.forEach(s => {
      const p = P(s), r = wid(s) / 2 + 3;
      const t = lab.append("text").attr("class", "ann").style("font-size", "11.5px").text(s.e.ont ? "Ontario" : n ? s.e.short : s.e.name);
      const cands = [[p.x1 + r + 3, p.y1, "start", "0.32em"], [p.x1, p.y1 - r - 3, "middle", "0"], [p.x1, p.y1 + r + 3, "middle", "0.8em"], [p.x1 - r - 3, p.y1, "end", "0.32em"]];
      const ok = cands.find(([cx, cyy, an, dy]) => {
        t.attr("x", cx).attr("y", cyy).attr("text-anchor", an).attr("dy", dy);
        const b = t.node().getBoundingClientRect();
        if (b.left < sv.left + m.l - 2 || b.right > sv.left + m.l + pw + 2 || b.top < sv.top || b.bottom > sv.top + m.t + ih) return false;
        return !boxes.some(o => b.left < o.right && b.right > o.left && b.top < o.bottom && b.bottom > o.top);
      });
      if (ok) { t.attr("x", ok[0]).attr("y", ok[1]).attr("text-anchor", ok[2]).attr("dy", ok[3]); boxes.push(t.node().getBoundingClientRect()); } else t.remove();
    });
    if (T) lab.style("opacity", 0).transition().delay(T).duration(Q2.dur(150)).style("opacity", 1);
    // hover / tap: nearest point on any arrow (Delaunay over points sampled along each arrow)
    const samples = all.flatMap(s => { const p = P(s); return d3.range(0, 1.0001, 0.125).map(t => [p.x0 + (p.x1 - p.x0) * t, p.y0 + (p.y1 - p.y0) * t, s]); });
    const del = d3.Delaunay.from(samples, d => d[0], d => d[1]), ring = g.select("circle.ring");
    const hide = () => { ring.style("display", "none"); Q2.hideTip(); };
    g.select("rect.hit").on("pointermove pointerdown", function (ev) {
      const [mx, my] = d3.pointer(ev, this), i = del.find(mx, my), smp = samples[i];
      if (Math.hypot(smp[0] - mx, smp[1] - my) > 26) { hide(); return; }
      const s = smp[2], p = P(s);
      ring.attr("cx", p.x1).attr("cy", p.y1).attr("r", wid(s) / 2 + 5).style("display", null).style("fill", "none").style("stroke", "var(--ink)").style("stroke-width", 1.5);
      Q2.showTip(ev, `<div class="t">${s.e.name}${s.e.ont ? "" : ` <span class="badge">#${R.indexOf(s) + 1} of ${R.length}</span>`}</div>` +
        Q2.tr("OW share", `${fmt.pct(s.a.sow)} → ${fmt.pct(s.z.sow)} (${fmt.spp(s.dOW)})`, "var(--ow)") +
        Q2.tr("ODSP share", `${fmt.pct(s.a.sod)} → ${fmt.pct(s.z.sod)} (${fmt.spp(s.dOD)})`, "var(--odsp)") + Q2.tipPeriod(s) +
        Q2.tr(`Cases, ${s.z.label}`, `OW ${fmt.int(s.z.owC)} · ODSP ${fmt.int(s.z.odC)}`) + `<div class="m">Click or tap to select.</div>`);
      S.hover = s.e.id;
    }).on("pointerleave", Q2.leave(hide)).on("click", () => { if (S.hover) pick(S.hover); });
    document.getElementById("f1Note").textContent = S.equal
      ? "Both axes use the same scale, so lines at 45° keep the gap constant. A horizontal arrow means only the OW share changed; a vertical one, only ODSP. Hover or tap near an arrow for values."
      : "On this narrow screen the vertical scale is stretched; the dashed constant-gap lines are still exact. A horizontal arrow means only the OW share changed. Tap near an arrow for values.";
    const s = all.find(q => q.e.id === S.sel);
    document.getElementById("f1Read").innerHTML = `<b>${s.e.name}, ${a} → ${z}:</b> the arrow runs from OW ${fmt.pct(s.a.sow)} / ODSP ${fmt.pct(s.a.sod)} ` +
      `to OW ${fmt.pct(s.z.sow)} / ODSP ${fmt.pct(s.z.sod)} — ${direction(s)}. Gap ${fmt.f1(s.g0)} → ${fmt.f1(s.g1)} pp.`;
  }

  // Figure 2: the change in the gap split into its two parts (diverging stacked bars, net tick)
  const ROW = 22, cy = i => (i === 0 ? ROW / 2 : 42 + (i - 1) * ROW);
  function parts(s) {
    const c = -s.dOD, out = []; let pos = 0, neg = 0;
    const put = (v, k) => { if (v >= 0) { out.push({ k, a: pos, b: pos + v }); pos += v; } else { out.push({ k, a: neg + v, b: neg }); neg += v; } };
    put(s.dOW, "ow"); put(c, "odsp"); return { segs: out, lo: neg, hi: pos };
  }
  function fig2(quick) {
    const w = Q2.W("f2"), n = Q2.narrow() || w < 400, lw = n ? 108 : 196;
    const m = { t: 42, r: 16, b: 28, l: lw }, iw = w - m.l - m.r, ih = cy(15) + ROW / 2 + 4, h = m.t + ih + m.b;
    const R = Q2.ranked(DATA.CMAS, S.i0, S.i1), rows = [Q2.sum(DATA.ONT, S.i0, S.i1), ...R];
    const a = Q2.QS[S.i0].label, z = Q2.QS[S.i1].label;
    document.getElementById("f2Title").textContent = `How the change in the gap splits between the programs, ${a} → ${z}; sorted by how much the gap narrowed`;
    if (!f2dom || f2dom.i0 !== S.i0) { // fixed for a given start quarter, so Play does not rescale the bars
      let lo = 0, hi = 0;
      DATA.ALL.forEach(e => { for (let j = S.i0 + 1; j < Q2.N; j++) { const p = parts(Q2.sum(e, S.i0, j)); lo = Math.min(lo, p.lo); hi = Math.max(hi, p.hi); } });
      f2dom = { i0: S.i0, d: [Math.min(lo, -0.2 * hi), Math.max(hi, -0.2 * lo)] };
    }
    const x = d3.scaleLinear().domain(f2dom.d).nice().range([0, iw]);
    const host = d3.select("#f2"); let svg = host.select("svg"), fresh = false;
    if (svg.empty() || +svg.attr("data-i0") !== S.i0) {
      fresh = true; host.selectAll("*").remove();
      svg = host.append("svg").attr("width", w).attr("height", h).attr("role", "img").attr("data-i0", S.i0);
      const g = svg.append("g").attr("class", "root").attr("transform", `translate(${m.l},${m.t})`);
      g.append("g").attr("class", "grid").call(d3.axisTop(x).ticks(n ? 4 : 6).tickSize(-ih).tickFormat(""));
      g.append("g").attr("class", "axis").call(d3.axisTop(x).ticks(n ? 4 : 6).tickFormat(v => (v > 0 ? "+" + v : v < 0 ? "−" + Math.abs(v) : "0")).tickSizeOuter(0));
      g.append("line").attr("x1", x(0)).attr("x2", x(0)).attr("y1", 0).attr("y2", ih).style("stroke", "var(--ink2)");
      g.append("text").attr("class", "lbl").attr("x", x(0) - 6).attr("y", -28).attr("text-anchor", "end").style("font-size", "11px").text("← widens the gap");
      g.append("text").attr("class", "lbl").attr("x", x(0) + 6).attr("y", -28).style("font-size", "11px").text("narrows the gap →");
      g.append("line").attr("x1", -lw + 4).attr("x2", iw).attr("y1", ROW + 4).attr("y2", ROW + 4).style("stroke", "var(--axis)");
      g.append("text").attr("class", "lbl").attr("x", iw).attr("y", ih + 20).attr("text-anchor", "end").style("font-size", "11px").text("Change in the gap (percentage points)");
      g.append("g").attr("class", "rows"); g.append("g").attr("class", "ann");
    }
    svg.attr("aria-label", `Diverging bar chart splitting each CMA's change in the gap into OW and ODSP parts, ${a} to ${z}`);
    const g = svg.select("g.root"), T = quick || fresh ? 0 : Q2.dur(450);
    const rg = g.select("g.rows").selectAll("g.row").data(rows, s => s.e.id).join(en => {
      const e = en.append("g").attr("class", "row").attr("transform", (s, i) => `translate(0,${cy(i)})`);
      e.append("rect").attr("class", "bg").attr("x", -lw).attr("y", -ROW / 2).attr("height", ROW).attr("rx", 4);
      e.append("text").attr("class", "name").attr("x", -8).attr("dy", "0.32em").attr("text-anchor", "end");
      e.append("rect").attr("class", "p-ow").attr("y", -6).attr("height", 12).attr("rx", 2).style("fill", "var(--ow)").style("stroke", "var(--surface)").style("stroke-width", 1);
      e.append("rect").attr("class", "p-odsp").attr("y", -6).attr("height", 12).attr("rx", 2).style("fill", "var(--odsp)").style("stroke", "var(--surface)").style("stroke-width", 1);
      e.append("line").attr("class", "net").attr("y1", -9).attr("y2", 9).style("stroke", "var(--ink)").style("stroke-width", 2.5);
      e.append("rect").attr("class", "row-hit").attr("x", -lw).attr("y", -ROW / 2).attr("height", ROW).style("fill", "transparent").attr("tabindex", 0).attr("role", "button");
      return e;
    });
    rg.select("rect.bg").attr("width", lw + iw).style("fill", s => (s.e.id === S.sel ? "var(--btn)" : "transparent"));
    rg.select("text.name").attr("class", s => "name " + (s.e.id === S.sel || s.e.ont ? "lbl-strong" : "lbl")).style("font-style", s => (s.e.ont ? "italic" : null)).text(s => (n ? s.e.short : s.e.name));
    const dim = s => S.hl.length && !S.hl.includes(s.e.id) && s.e.id !== S.sel && !s.e.ont;
    rg.transition().duration(T).attr("transform", (s, i) => `translate(0,${cy(i)})`).style("opacity", s => (dim(s) ? 0.32 : 1));
    ["ow", "odsp"].forEach(k => rg.select("rect.p-" + k).transition().duration(T)
      .attr("x", s => x(parts(s).segs.find(p => p.k === k).a)).attr("width", s => { const p = parts(s).segs.find(q => q.k === k); return Math.max(0, x(p.b) - x(p.a)); }));
    rg.select("line.net").transition().duration(T).attr("x1", s => x(s.nar)).attr("x2", s => x(s.nar));
    rg.select("rect.row-hit").attr("width", lw + iw).attr("data-id", s => s.e.id)
      .attr("aria-label", s => `${s.e.name}: OW share ${fmt.spp(s.dOW)} pp, ODSP share ${fmt.spp(s.dOD)} pp, gap narrowed by ${fmt.spp(s.nar)} pp. Press Enter to select.`)
      .on("pointermove pointerdown", (ev, s) => Q2.showTip(ev, `<div class="t">${s.e.name}, ${s.a.label} → ${s.z.label}</div>` +
        Q2.tr(`OW share ${fmt.spp(s.dOW)} pp`, `${s.dOW >= 0 ? "narrows" : "widens"} the gap by ${fmt.f1(Math.abs(s.dOW))}`, "var(--ow)") +
        Q2.tr(`ODSP share ${fmt.spp(s.dOD)} pp`, `${s.dOD > 0 ? "widens" : "narrows"} the gap by ${fmt.f1(Math.abs(s.dOD))}`, "var(--odsp)") +
        Q2.tr("Net", `${s.nar >= 0 ? "narrowed" : "widened"} by ${fmt.pp(Math.abs(s.nar))} (${fmt.f1(s.g0)} → ${fmt.f1(s.g1)})`) +
        Q2.tr("Widened in", `${s.widen} of ${s.steps} quarterly changes`)))
      .on("pointerleave", Q2.leave(Q2.hideTip))
      .on("click", (ev, s) => pick(s.e.id))
      .on("keydown", (ev, s) => { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); pick(s.e.id); Q2.refocus("#f2 rect.row-hit", s.e.id); } });
    // net value only for the selected row (selective labels)
    const ann = g.select("g.ann"); ann.selectAll("*").remove();
    const i = rows.findIndex(s => s.e.id === S.sel), s = rows[i];
    if (s) {
      const p = parts(s), t = ann.append("text").attr("class", "ann").attr("y", cy(i)).attr("dy", "0.32em").style("font-size", "11.5px")
        .text(`${s.nar >= 0 ? "narrowed" : "widened"} ${fmt.f1(Math.abs(s.nar))}`);
      const tw = t.node().getComputedTextLength();
      if (x(p.hi) + 8 + tw <= iw) t.attr("x", x(p.hi) + 8); else if (x(p.lo) - 8 - tw >= 0) t.attr("x", x(p.lo) - 8).attr("text-anchor", "end"); else t.remove();
      if (T) ann.style("opacity", 0).transition().delay(T).duration(Q2.dur(150)).style("opacity", 1);
    }
  }
})();
