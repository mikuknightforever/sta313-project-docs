/* Q2 extra version I — Figure 1a as small multiples: six maps of the key moments side by side (the first quarter, the last
   quarter before the pandemic, the quarter with the most widening against a year earlier, the last pandemic quarter,
   the latest quarter and the end of the outlook). Same colour key in all six; hovering a CMA in any map outlines it in
   all of them. The quarter slider still drives the card and Figure 2, and marks the matching map.
   Everything else is the shared map-lab engine (shared/q2-maplab.js). */
(() => {
  "use strict";
  let M = null;
  MapLab.start({ modes: ["level", "yoy"], fig1: { render, update, note, title } });

  function render(A) {
    const w = Q2.W("f1");
    if (M && M.w === w) return;
    const T = A.keyMoments(), n = w < 560, cols = n ? 2 : 3, gap = 12, pw = (w - (cols - 1) * gap) / cols;
    const G = A.mapGeom(pw, { noInset: true }), ph = G.h0 + 46, rows = Math.ceil(T.length / cols), h = rows * ph + (rows - 1) * gap;
    const svg = Q2.svgIn("f1", w, h, `Six small maps of the 15 CMAs: ${T.map(t => A.LAB[t]).join(", ")}`);
    svg.attr("role", "group");
    A.hatch(svg, "fhatch", 5);
    const tbBox = { w: Math.max(34, pw * 0.16), h: 20 };
    const P = svg.selectAll("g.panel").data(T).join("g").attr("class", "panel").attr("data-t", t => t)
      .attr("transform", (t, i) => `translate(${(i % cols) * (pw + gap)},${Math.floor(i / cols) * (ph + gap)})`);
    P.append("rect").attr("class", "pbox").attr("width", pw).attr("height", ph).attr("rx", 6);
    P.append("text").attr("class", "ptitle").attr("x", 8).attr("y", 16);
    P.append("text").attr("class", "psub").attr("x", 8).attr("y", 31);
    const map = P.append("g").attr("transform", "translate(0,38)");
    map.append("clipPath").attr("id", (t, i) => `iclip${i}`).append("rect").attr("width", pw).attr("height", G.h0);
    const base = map.append("g").attr("clip-path", (t, i) => `url(#iclip${i})`);
    base.append("path").datum(A.OUTLINE).attr("d", G.path).style("fill", "var(--land)").style("stroke", "var(--land-line)").style("stroke-width", .6);
    const last = A.NQ - 1;
    base.each(function (t) {
      const gb = d3.select(this);
      gb.selectAll("path.mk").data(G.south).join("path").attr("class", "mk").attr("data-id", f => f.properties.cma_code).attr("data-t", t).attr("d", G.path);
      gb.selectAll("path.hatchov").data(t >= A.NQ ? G.south : []).join("path").attr("class", "hatchov").attr("d", G.path);
      // outlines of the hovered and selected CMA on top (the focusable shapes are never moved, so keyboard focus stays)
      gb.append("path").attr("class", "mk hov outl").style("fill", "none").style("pointer-events", "none");
      gb.append("path").attr("class", "mk on outl").style("fill", "none").style("pointer-events", "none");
      // Thunder Bay, far off this frame, as a labelled square in the top-left corner
      const tb = gb.append("g").attr("class", "tbbox").attr("transform", "translate(6,4)");
      tb.append("rect").attr("class", "mk").attr("data-id", A.TB).attr("data-t", t).attr("width", tbBox.h).attr("height", tbBox.h).attr("rx", 3);
      if (t >= A.NQ) tb.append("rect").attr("class", "hatchov").attr("width", tbBox.h).attr("height", tbBox.h).attr("rx", 3);
      tb.append("text").attr("class", "lbl").attr("x", tbBox.h + 4).attr("y", tbBox.h / 2 + 4).style("font-size", "10px").text("Thunder Bay");
      // only the latest-quarter map is in the keyboard order (15 stops, not 90)
      A.interactive(gb.selectAll(".mk:not(.outl)"), t === last);
    });
    M = { w, svg, T, G, short: pw < 250 };
  }
  function update(A) {
    if (!M) return;
    const { svg } = M, yoy = A.S.mode === "yoy";
    svg.selectAll("g.panel").each(function (t) {
      const P = d3.select(this), vals = A.DATA.CMAS.map(c => A.shown(c.id, t));
      P.classed("now", t === A.S.t);
      P.select("text.ptitle").text(`${A.LAB[t]}${t === A.NQ - 1 ? " · latest" : t >= A.NQ ? (M.short ? " · outlook" : ` · outlook (${A.ruleOf().label.toLowerCase()})`) : ""}${t === A.S.t ? " ◂" : ""}`);
      const nums = vals.filter(s => !s.none).map(s => s.v);
      P.select("text.psub").text(yoy ? (nums.length ? (M.short ? `wider in ${nums.filter(v => A.r1(v) > 0).length} of ${A.DATA.CMAS.length}` : `wider than a year earlier in ${nums.filter(v => A.r1(v) > 0).length} of ${A.DATA.CMAS.length}`) : "no earlier year")
        : `gaps ${A.fmt.f1(d3.min(nums))}–${A.fmt.f1(d3.max(nums))} pp`);
      P.selectAll(".mk:not(.outl)").each(function () {
        const id = this.dataset.id, s = A.shown(id, t);
        d3.select(this).style("fill", A.fillVar(s.c)).attr("data-v", s.txt).attr("data-c", s.c)
          .classed("on", id === A.S.sel).classed("hov", id === A.S.hover && A.S.hover !== A.S.sel).attr("aria-label", A.aria(id, t));
      });
      const od = id => (id && id !== A.TB ? M.G.path(M.G.feats.get(id)) : null);
      P.select("path.outl.hov").attr("d", A.S.hover && A.S.hover !== A.S.sel ? od(A.S.hover) : null);
      P.select("path.outl.on").attr("d", od(A.S.sel));
    });
  }
  function title(A) {
    return (A.S.mode === "yoy" ? "Change in each CMA's gap against a year earlier" : "Gap between the ODSP and OW single-person shares in each CMA") +
      ` at six key moments (${A.keyMoments().map(t => A.LAB[t]).join(", ")})`;
  }
  function note(A) {
    const T = A.keyMoments();
    return `Six moments chosen for the story: ${A.LAB[T[0]]} (the first quarter), ${A.LAB[T[1]]} (the last before the pandemic), ${A.LAB[T[2]]} (the most CMAs with a wider gap than a year earlier), ` +
      `${A.LAB[T[3]]} (the last pandemic quarter), ${A.LAB[T[4]]} (the latest) and ${A.LAB[T[5]]} (the end of the outlook, hatched). The same colour key applies to all six. ` +
      "Thunder Bay is the small square in each map's corner. Hover or tap a CMA in any map to outline it in all six; click to follow it in Figure 2. The slider moves the card and Figure 2; the map for that quarter, if it is one of the six, is outlined and marked ◂. Keyboard: the latest-quarter map, Table 2 or the slider.";
  }
})();
