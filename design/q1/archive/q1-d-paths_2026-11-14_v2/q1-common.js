/* Q1 shared data + helpers. Every number shown on any Q1 variant is computed here or in the variant
   from the course CSVs; nothing is typed by hand. Helpers mirror Q3 v2 so the site behaves the same. */
(() => {
  "use strict";
  const COVID = [new Date(2020, 2, 1), new Date(2023, 4, 31)]; // dataset definition: Mar 2020 – May 2023
  const PHASES = [
    { id: "pre", label: "Before", long: "before the pandemic" },
    { id: "during", label: "During", long: "during the pandemic" },
    { id: "post", label: "After", long: "after the pandemic" },
  ];
  const f1 = d3.format(".1f");
  const fmt = {
    f1, int: v => d3.format(",.0f")(v), pct: v => `${f1(v)}%`,
    sp: v => `${v > 0 ? "+" : v < 0 ? "−" : "±"}${f1(Math.abs(v))}%`,   // signed percent
    spp: v => `${v > 0 ? "+" : v < 0 ? "−" : "±"}${f1(Math.abs(v))}`,   // signed number
    k: v => (v === 0 ? "0" : d3.format(",")(v / 1000) + "k"),
  };

  async function load(base) {
    const D = base + "datasets/ONT-SA/selected/";
    const qrow = d => ({ date: new Date(+d.year, +d.month - 1, 1), year: +d.year, quarter: +d.quarter, phase: d.covid_period, cases: +d.cases });
    const [ow, odsp, lf, hist] = await Promise.all([
      d3.csv(D + "ont-sa-characteristic-ow-ont.csv", qrow),
      d3.csv(D + "ont-sa-characteristic-odsp-ont.csv", qrow),
      d3.csv(D + "1410028701_databaseLoadingData.csv", d => ({ date: new Date(+d.year, +d.month - 1, 1), ur: +d.ont_unemployment_rate_pct })),
      d3.csv(D + "ont-sa-historical.csv", d => ({ date: new Date(+d.year, +d.month - 1, 1), cases: +d.ont_all_assistance_cases })),
    ]);
    const odspBy = new Map(odsp.map(d => [+d.date, d.cases]));
    const Q = ow.sort((a, b) => a.date - b.date).map(d => ({
      date: d.date, year: d.year, quarter: d.quarter, phase: d.phase,
      label: `${d.year} Q${d.quarter}`, ow: d.cases, odsp: odspBy.get(+d.date),
    }));
    const base0 = Q.find(d => d.label === "2019 Q4");
    Q.forEach((d, i) => {
      d.iow = (d.ow / base0.ow) * 100; d.iod = (d.odsp / base0.odsp) * 100;
      const p = Q[i - 4]; // year-over-year: same quarter one year earlier
      d.yow = p ? (d.ow / p.ow - 1) * 100 : null; d.yod = p ? (d.odsp / p.odsp - 1) * 100 : null;
    });
    const UR = lf.sort((a, b) => a.date - b.date), H = hist.sort((a, b) => a.date - b.date);
    return { Q, UR, H, F: facts(Q, UR, H, base0) };
  }

  function facts(Q, UR, H, base) {
    const F = { base, last: Q[Q.length - 1], first: Q[0] };
    F.owMin = d3.least(Q, d => d.ow); F.owMax = d3.greatest(Q, d => d.ow);
    F.odspMax = d3.greatest(Q, d => d.odsp); F.odspMin = d3.least(Q, d => d.odsp);
    const s19 = Q.filter(d => d.year >= 2019);
    F.odsp19 = { lo: d3.least(s19, d => d.odsp), hi: d3.greatest(s19, d => d.odsp) };
    F.ratio19 = base.odsp / base.ow;
    F.owBack = Q.find(d => d.date > F.owMin.date && d.iow >= 100); // first quarter back at/above 2019 Q4
    F.phase = {};
    PHASES.forEach(p => {
      const r = Q.filter(d => d.phase === p.id), a = r[0], z = r[r.length - 1];
      const years = (r.length - 1) / 4; // quarters between first and last observation
      const ch = k => (z[k] / a[k] - 1) * 100, ann = k => (Math.pow(z[k] / a[k], 1 / years) - 1) * 100;
      F.phase[p.id] = { ...p, a, z, n: r.length, years, ow: ch("ow"), odsp: ch("odsp"), owAnn: ann("ow"), odspAnn: ann("odsp"), rows: r };
    });
    const y = Q.filter(d => d.yow != null);
    F.yowMin = d3.least(y, d => d.yow); F.yowMax = d3.greatest(y, d => d.yow);
    F.yodMin = d3.least(y, d => d.yod); F.yodMax = d3.greatest(y, d => d.yod);
    F.same = y.filter(d => Math.sign(d.yow) === Math.sign(d.yod)).length; F.nYoY = y.length;
    F.urMax = d3.greatest(UR, d => d.ur); F.urFirst = UR[0]; F.urLast = UR[UR.length - 1];
    F.ur1912 = UR.find(d => +d.date === +new Date(2019, 11, 1));
    // historical "all social assistance" series (different coverage from OW + ODSP; see data dictionary)
    const hBy = new Map(H.map(d => [+d.date, d.cases]));
    F.hMax = d3.greatest(H, d => d.cases); F.hFirst = H[0]; F.hLast = H[H.length - 1];
    F.h1994 = d3.greatest(H.filter(d => d.date < new Date(1998, 3, 1)), d => d.cases);
    F.hAbove94 = H.find(d => d.cases > F.h1994.cases);
    F.hPre = H.find(d => +d.date === +new Date(2020, 1, 1));
    F.hLow = d3.least(H.filter(d => d.date >= COVID[0]), d => d.cases);
    const gaps = Q.filter(d => hBy.has(+d.date)).map(d => ({ d, gap: hBy.get(+d.date) - d.ow - d.odsp }));
    F.gapLo = d3.min(gaps, g => g.gap); F.gapHi = d3.max(gaps, g => g.gap);
    F.gap19 = gaps.find(g => g.d.label === "2019 Q4");
    F.h1912 = hBy.get(+new Date(2019, 11, 1));
    return F;
  }

  // ---------- helpers (same behaviour as Q3 v2) ----------
  const tip = () => document.getElementById("tip");
  function showTip(e, html) {
    const t = tip(); t.innerHTML = html; t.hidden = false;
    const r = t.getBoundingClientRect(), pad = 14;
    let x = e.clientX + pad, y = e.clientY + pad;
    if (x + r.width > innerWidth - 8) x = e.clientX - r.width - pad;
    if (y + r.height > innerHeight - 8) y = e.clientY - r.height - pad;
    t.style.left = Math.max(8, x) + "px"; t.style.top = Math.max(8, y) + "px";
  }
  const hideTip = () => { const t = tip(); if (t) t.hidden = true; };
  const tr = (k, v, sw) => `<div class="r"><span>${sw ? `<i style="background:${sw}"></i>` : ""}${k}</span><span>${v}</span></div>`;
  const W = id => document.getElementById(id).clientWidth;
  const narrow = () => window.innerWidth < 640;
  function svgIn(id, w, h, label) {
    const host = d3.select("#" + id); host.selectAll("*").remove();
    return host.append("svg").attr("width", w).attr("height", h).attr("role", "img").attr("aria-label", label);
  }
  function covidBand(g, x, h, withLabel) {
    const [a, b] = x.domain(), x0 = Math.max(+a, +COVID[0]), x1 = Math.min(+b, +COVID[1]);
    if (x1 <= x0) return;
    g.append("rect").attr("x", x(x0)).attr("width", x(x1) - x(x0)).attr("y", 0).attr("height", h).style("fill", "var(--covid)");
    if (withLabel) g.append("text").attr("class", "lbl").attr("x", x(x0) + 4).attr("y", 11).style("font-size", "11px").text("Pandemic");
  }
  function encl(g, x, a, b, h) { // the same enclosure marks a selected period everywhere (L4-1)
    g.append("rect").attr("x", x(a)).attr("width", Math.max(2, x(b) - x(a))).attr("height", h)
      .style("fill", "var(--sel)").style("fill-opacity", .12).style("stroke", "var(--sel)").style("stroke-opacity", .8);
  }
  function timeAxis(g, x, h, every) {
    const span = (x.domain()[1] - x.domain()[0]) / 3.15e10, n = narrow();
    const step = every || (span > 30 ? (n ? 20 : 10) : span > 12 ? (n ? 5 : 2) : 1);
    g.append("g").attr("class", "axis").attr("transform", `translate(0,${h})`)
      .call(d3.axisBottom(x).ticks(d3.timeYear.every(step)).tickFormat(d3.timeFormat("%Y")).tickSizeOuter(0));
  }
  function endLabels(g, items, x0, minGap) {
    items.sort((a, b) => a.y - b.y);
    for (let i = 1; i < items.length; i++) if (items[i].y - items[i - 1].y < minGap) items[i].y = items[i - 1].y + minGap;
    items.forEach(it => g.append("text").attr("class", it.cls || "lbl-strong").attr("x", x0).attr("y", it.y).attr("dy", "0.32em")
      .style("fill", it.fill || null).text(it.t));
  }
  function seg(sel, data, label, isOn, click) {
    const s = d3.select(sel).selectAll("button").data(data).join("button").attr("type", "button").text(label)
      .on("click", (e, d) => { click(d); sync(); });
    const sync = () => s.attr("aria-pressed", d => String(isOn(d)));
    sync(); return sync;
  }
  function themeButton(onChange) {
    const tb = document.getElementById("themeBtn");
    const dark = () => (document.documentElement.dataset.theme || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")) === "dark";
    const lab = () => (tb.textContent = dark() ? "Light theme" : "Dark theme");
    tb.onclick = () => { document.documentElement.dataset.theme = dark() ? "light" : "dark"; lab(); onChange && onChange(); };
    const t = new URLSearchParams(location.search).get("theme");
    if (t) document.documentElement.dataset.theme = t;
    lab();
  }
  function onResize(fn) {
    let lastW = document.querySelector(".page").clientWidth, t;
    new ResizeObserver(() => { clearTimeout(t); t = setTimeout(() => {
      const w = document.querySelector(".page").clientWidth; if (w !== lastW) { lastW = w; fn(); }
    }, 120); }).observe(document.querySelector(".page"));
  }
  const phaseOf = d => PHASES.find(p => p.id === d.phase);
  const urAt = (UR, date) => UR.find(u => +u.date === +date); // quarter-end month
  const cap = s => s[0].toUpperCase() + s.slice(1);
  const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  function fail(err) {
    const el = document.getElementById("lead");
    if (el) el.textContent = "Could not load the data files. Serve the repository root over HTTP (see design/q1/README.md) and reopen this page.";
    console.error(err);
  }

  window.Q1 = { COVID, PHASES, fmt, load, showTip, hideTip, tr, W, narrow, svgIn, covidBand, encl, timeAxis, endLabels, seg,
    themeButton, onResize, phaseOf, urAt, cap, reduced, fail };
})();
