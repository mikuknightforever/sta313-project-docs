/* Q2 shared data + helpers. Every number shown on any Q2 variant is computed here or in the variant from the
   course CSVs; nothing is typed by hand. Helpers mirror Q1 / Q3 v2 so the site behaves the same. */
(() => {
  "use strict";
  const COVID = [new Date(2020, 2, 1), new Date(2023, 4, 31)]; // dataset definition: Mar 2020 – May 2023
  const f1 = d3.format(".1f");
  const sign = v => { const r = Math.round(v * 10) / 10; return r > 0 ? "+" : r < 0 ? "−" : "±"; }; // sign of the value as shown (1 dp)
  const fmt = {
    f1, int: v => d3.format(",.0f")(v), pct: v => `${f1(v)}%`, pp: v => `${f1(v)} pp`,
    spp: v => `${sign(v)}${f1(Math.abs(v))}`,            // signed percentage-point change
    q: r => r.label,
  };
  // short names for small tiles and narrow screens; full names everywhere else
  const SHORT = { "Kitchener–Cambridge–Waterloo": "Kitchener–C–W", "St. Catharines–Niagara": "St. Cath.–Niagara", "Greater Sudbury": "Sudbury", "Ottawa–Gatineau": "Ottawa–Gatineau" };
  const PH = { pre: { label: "Before", long: "before the pandemic" }, during: { label: "During", long: "during the pandemic" }, post: { label: "After", long: "after the pandemic" } };

  let QS, N, I19, I23, PRESETS;

  async function load(base) {
    const D = base + "datasets/ONT-SA/selected/";
    const row = d => ({ cma: d.cma || "ont", date: new Date(+d.year, +d.month - 1, 1), year: +d.year, quarter: +d.quarter, phase: d.covid_period, cases: +d.cases, fts: +d.fts });
    const [ow, od, oow, ood] = await Promise.all(["ow-cma", "odsp-cma", "ow-ont", "odsp-ont"].map(f => d3.csv(D + `ont-sa-characteristic-${f}.csv`, row)));
    const key = d => d.cma + "|" + +d.date;
    const odBy = new Map(od.concat(ood).map(d => [key(d), d]));
    const ents = [];
    for (const [k, rs] of d3.group(ow.concat(oow), d => d.cma)) {
      rs.sort((a, b) => a.date - b.date);
      const rows = rs.map((d, i) => {
        const o = odBy.get(key(d)); if (!o) throw new Error("No matching ODSP row for " + key(d));
        const sow = (100 * d.fts) / d.cases, sod = (100 * o.fts) / o.cases;
        return { i, date: d.date, year: d.year, quarter: d.quarter, phase: d.phase, label: `${d.year} Q${d.quarter}`,
          owC: d.cases, owF: d.fts, odC: o.cases, odF: o.fts, sow, sod, gap: sod - sow };
      });
      const ont = k === "ont", id = ont ? "ont" : k.split(" - ")[0], name = ont ? "Ontario (all)" : k.split(" - ")[1].replace(/--/g, "–");
      ents.push({ id, name, short: ont ? "Ontario" : SHORT[name] || name, ont, rows });
    }
    const ONT = ents.find(e => e.ont), CMAS = ents.filter(e => !e.ont).sort((a, b) => d3.ascending(a.id, b.id));
    QS = ONT.rows; N = QS.length;
    CMAS.forEach(c => { if (c.rows.length !== N || c.rows.some((r, i) => +r.date !== +QS[i].date)) throw new Error("Quarter mismatch in " + c.name); });
    I19 = QS.findIndex(r => r.label === "2019 Q4"); I23 = QS.findIndex(r => r.label === "2023 Q1");
    PRESETS = [
      { id: "all", label: "Whole period", i0: 0, i1: N - 1 },
      { id: "pre", label: "Before the pandemic", i0: 0, i1: I19 },
      { id: "during", label: "During", i0: I19, i1: I23 },
      { id: "post", label: "After", i0: I23, i1: N - 1 },
    ];
    const F = facts(ONT, CMAS);
    return { ONT, CMAS, ALL: [ONT, ...CMAS], QS, F };
  }

  // summary of one area between two quarters (narrowing = start gap − end gap; positive = narrower)
  function sum(e, i0, i1) {
    const a = e.rows[i0], z = e.rows[i1];
    let widen = 0; for (let i = i0 + 1; i <= i1; i++) if (e.rows[i].gap > e.rows[i - 1].gap) widen++;
    return { e, a, z, g0: a.gap, g1: z.gap, nar: a.gap - z.gap, dOW: z.sow - a.sow, dOD: z.sod - a.sod, widen, steps: i1 - i0 };
  }
  // split a period at the phase-end quarters (2019 Q4 = last before, 2023 Q1 = last during)
  function segments(i0, i1) {
    const cuts = [i0, ...[I19, I23].filter(c => c > i0 && c < i1), i1];
    return cuts.slice(1).map((b, k) => ({ a: cuts[k], b, ph: b <= I19 ? "pre" : b <= I23 ? "during" : "post" }));
  }
  const ranked = (ents, i0, i1) => ents.map(e => sum(e, i0, i1)).sort((p, q) => q.nar - p.nar || d3.ascending(p.e.name, q.e.name));

  function facts(ONT, CMAS) {
    const F = { first: QS[0], last: QS[N - 1], I19, I23, n: CMAS.length, ont: sum(ONT, 0, N - 1) };
    const R = ranked(CMAS, 0, N - 1); F.rank = R;
    F.top = R[0]; F.second = R[1]; F.third = R[2]; F.least = R[R.length - 1];
    F.nNarrow = R.filter(r => r.nar > 0).length; F.allNarrow = F.nNarrow === R.length;
    F.dOW = d3.extent(R, r => r.dOW); F.dOD = d3.extent(R, r => r.dOD);
    F.odMax = d3.greatest(R, r => r.dOD);
    F.odFell = R.filter(r => r.dOD < 0).sort((p, q) => p.dOD - q.dOD);
    F.widenMin = d3.least(R, r => r.widen); F.widenMax = d3.greatest(R, r => r.widen);
    F.widen = d3.extent(R, r => r.widen); F.steps = N - 1;
    F.endWidest = d3.greatest(R, r => r.g1);
    // phases (cut at the phase-end quarters)
    F.phase = R.map(r => { const s = segments(0, N - 1).map(g => ({ ...g, nar: r.e.rows[g.a].gap - r.e.rows[g.b].gap })); return { e: r.e, pre: s[0].nar, during: s[1].nar, post: s[2].nar }; });
    F.preLargest = F.phase.filter(p => p.pre > p.during && p.pre > p.post).length;
    F.durWiden = F.phase.filter(p => p.during < 0).sort((p, q) => p.during - q.during);
    F.postNarrow = F.phase.filter(p => p.post > 0).length;
    F.segs = segments(0, N - 1).map(g => ({ ...g, A: QS[g.a], B: QS[g.b] }));
    // every CMA × quarter: is ODSP above OW? (no reversal)
    const cells = CMAS.flatMap(c => c.rows.map(r => ({ c, r })));
    F.cells = cells.length; F.odAbove = cells.filter(x => x.r.sod > x.r.sow).length;
    F.gapMax = d3.greatest(cells, x => x.r.gap); F.gapMin = d3.least(cells, x => x.r.gap);
    F.small = [...CMAS].sort((a, b) => a.rows[N - 1].owC - b.rows[N - 1].owC).slice(0, 3);
    F.shareExtent = { ow: d3.extent(cells, x => x.r.sow), od: d3.extent(cells, x => x.r.sod) };
    return F;
  }

  // ---------- shared page text (lead, story steps, take-aways): computed, identical facts on every variant ----------
  const nm = r => `<b>${r.e.name}</b>`;
  function lead(F) {
    const o = F.ont;
    return `From ${F.first.label} to ${F.last.label}, the share of cases that are a single person without children rose in both programs across Ontario: ` +
      `OW <b>${fmt.pct(o.a.sow)} → ${fmt.pct(o.z.sow)}</b>, ODSP <b>${fmt.pct(o.a.sod)} → ${fmt.pct(o.z.sod)}</b>. ` +
      `The gap between the programs went from <b>${fmt.f1(o.g0)} to ${fmt.f1(o.g1)} percentage points</b>. ` +
      `It was smaller at the end than at the start in <b>${F.allNarrow ? `all ${F.n}` : `${F.nNarrow} of ${F.n}`} CMAs</b>: by the most in ${nm(F.top)} ` +
      `(${fmt.f1(F.top.g0)} → ${fmt.f1(F.top.g1)}), by the least in ${nm(F.least)} (${fmt.f1(F.least.g0)} → ${fmt.f1(F.least.g1)}).`;
  }
  const STEPS = [
    { id: 1, label: "1 · Overall" }, { id: 2, label: "2 · Where most" }, { id: 3, label: "3 · Which program" },
    { id: 4, label: "4 · Not steady" }, { id: 0, label: "Explore" }];
  // state each story step puts the page in (period + selected area + highlighted areas)
  function stepState(F, id) {
    const all = { i0: 0, i1: N - 1 };
    if (id === 1) return { ...all, sel: "ont", hl: [] };
    if (id === 2) return { ...all, sel: F.top.e.id, hl: [F.top, F.second, F.third, F.least].map(r => r.e.id) };
    if (id === 3) return { ...all, sel: F.odMax.e.id, hl: [F.odMax, ...F.odFell].map(r => r.e.id) };
    if (id === 4) return { i0: I19, i1: I23, sel: F.durWiden.length ? F.durWiden[0].e.id : F.top.e.id, hl: F.durWiden.map(p => p.e.id) };
    return null;
  }
  function story(F, id) {
    const o = F.ont, S = F.segs;
    if (id === 1) return `<b>Both shares rose; the gap was smaller at the end everywhere.</b> Across Ontario the OW share rose ${fmt.spp(o.dOW)} pp and the ODSP share ${fmt.spp(o.dOD)} pp, ` +
      `so the gap went from ${fmt.f1(o.g0)} to ${fmt.f1(o.g1)} pp. The ODSP share was above the OW share in ${F.odAbove === F.cells ? "every" : `${F.odAbove} of ${F.cells}`} CMA-quarter, so the gap never reversed.`;
    if (id === 2) return `<b>${F.top.e.name} narrowed the most: ${fmt.f1(F.top.g0)} → ${fmt.f1(F.top.g1)} pp (${fmt.f1(F.top.nar)} pp).</b> ` +
      `Next were ${F.second.e.name} (${fmt.f1(F.second.nar)}) and ${F.third.e.name} (${fmt.f1(F.third.nar)}). ${F.least.e.name} narrowed the least ` +
      `(${fmt.f1(F.least.g0)} → ${fmt.f1(F.least.g1)}, ${fmt.f1(F.least.nar)} pp)${F.endWidest.e === F.least.e ? ` and had the widest gap in ${F.last.label}` : ""}.`;
    if (id === 3) return `<b>Most of the change came from OW.</b> Across CMAs the OW share rose ${fmt.f1(F.dOW[0])} to ${fmt.f1(F.dOW[1])} pp, while the ODSP share changed ` +
      `${fmt.spp(F.dOD[0])} to ${fmt.spp(F.dOD[1])} pp. Even in ${F.odMax.e.name}, where the ODSP share rose most (${fmt.spp(F.odMax.dOD)}), the OW share rose more (${fmt.spp(F.odMax.dOW)}).` +
      (F.odFell.length ? ` In ${F.odFell.map(r => `${r.e.name} (${fmt.spp(r.dOD)})`).join(" and ")} the ODSP share fell slightly.` : "");
    if (id === 4) return `<b>Smaller by the end does not mean smaller every quarter.</b> Each CMA's gap widened in ${F.widen[0]}–${F.widen[1]} of its ${F.steps} quarter-to-quarter changes. ` +
      `${F.preLargest === F.n ? "In every CMA most" : `In ${F.preLargest} CMAs most`} of the narrowing happened before the pandemic (${S[0].A.label} – ${S[0].B.label}). ` +
      (F.durWiden.length ? `During it (${S[1].A.label} – ${S[1].B.label}) the gap widened in ${F.durWiden.map(p => `${p.e.name} (${fmt.spp(-p.during)} pp)`).join(" and ")}; ` : "") +
      `after it (${S[2].A.label} – ${S[2].B.label}) it narrowed in ${F.postNarrow === F.n ? "every CMA" : `${F.postNarrow} of ${F.n} CMAs`}.`;
    return "Explore freely: choose any start and end quarter, select a CMA, and hover or tap for exact shares and case counts.";
  }
  function cards(F) {
    const s = F.small.map(c => `${c.name} (${fmt.int(c.rows[N - 1].owC)})`);
    return [
      { h: "The data support", li: [
        `The gap between ODSP and OW shares was smaller in ${F.last.label} than in ${F.first.label} in ${F.allNarrow ? `all ${F.n}` : `${F.nNarrow} of ${F.n}`} CMAs (by ${fmt.f1(F.least.nar)}–${fmt.f1(F.top.nar)} pp).`,
        `The OW share rose in every CMA (${fmt.spp(F.dOW[0])} to ${fmt.spp(F.dOW[1])} pp); the ODSP share changed much less (${fmt.spp(F.dOD[0])} to ${fmt.spp(F.dOD[1])} pp).`,
        `The ODSP share was above the OW share in ${F.odAbove === F.cells ? "every" : `${F.odAbove} of ${F.cells}`} CMA-quarter, so the gap never reversed.`,
        `${F.preLargest === F.n ? "In every CMA, most" : `In ${F.preLargest} CMAs, most`} of the narrowing happened before the pandemic.`] },
      { h: "The data do not show", li: [
        "Why the OW share rose, or whether needs, policies or service use converged.",
        "How many single residents receive assistance: the share describes the make-up of the caseload, not of the population.",
        `That the gap shrank every quarter: in each CMA it widened in ${F.widen[0]}–${F.widen[1]} of ${F.steps} quarterly changes.`,
        "People: a case can include more than one person."] },
      { h: "Worth investigating", li: [
        `Why ${F.least.e.name} narrowed the least${F.endWidest.e === F.least.e ? ` and kept the widest gap (${fmt.f1(F.least.g1)} pp in ${F.last.label})` : ""}.`,
        F.durWiden.length ? `What lies behind the widening in ${F.durWiden.map(p => p.e.name).join(" and ")} during the pandemic.` : "Which quarters account for each CMA's narrowing.",
        `Small caseloads move more from quarter to quarter: the fewest OW cases in ${F.last.label} were in ${s.join(", ")}. Check counts before ranking close values.`,
        "How family composition relates to time on assistance: see Part 3."] },
    ];
  }
  function renderCards(F) {
    d3.select("#cards").selectAll("div.card").data(cards(F)).join("div").attr("class", "card").html(d => `<h3>${d.h}</h3><ul>${d.li.map(l => `<li>${l}</li>`).join("")}</ul>`);
  }

  // ---------- shared controls ----------
  function periodControl(S, onChange) {
    const host = d3.select("#period"); host.selectAll("*").remove();
    const segEl = host.append("div").attr("class", "seg").attr("role", "group").attr("aria-label", "Period preset").node();
    const syncSeg = seg(segEl, PRESETS, p => p.label, p => S.i0 === p.i0 && S.i1 === p.i1, p => { S.i0 = p.i0; S.i1 = p.i1; onChange(); });
    const mk = (lab, id, lo, hi) => {
      const l = host.append("label").attr("class", "lab-t").text(lab + " ");
      const s = l.append("select").attr("id", id);
      s.selectAll("option").data(QS.slice(lo, hi + 1)).join("option").attr("value", d => d.i).text(d => d.label);
      return s;
    };
    const s0 = mk("From", "startSel", 0, N - 2), s1 = mk("to", "endSel", 1, N - 1);
    const note = host.append("span").attr("class", "period-note").attr("aria-live", "polite");
    s0.on("change", function () { S.i0 = +this.value; if (S.i1 <= S.i0) S.i1 = S.i0 + 1; onChange(); });
    s1.on("change", function () { S.i1 = +this.value; if (S.i0 >= S.i1) S.i0 = S.i1 - 1; onChange(); });
    return () => {
      syncSeg(); s0.property("value", S.i0); s1.property("value", S.i1);
      note.text(`${S.i1 - S.i0} quarterly changes`);
    };
  }
  function readPeriod(S, U) {
    const at = k => { const v = U.get(k); if (!v) return -1; return QS.findIndex(r => r.label.replace(" ", "") === v); };
    const p = PRESETS.find(x => x.id === U.get("period")); if (p) { S.i0 = p.i0; S.i1 = p.i1; }
    const a = at("start"), b = at("end"); if (a >= 0) S.i0 = a; if (b >= 0) S.i1 = b;
    if (S.i1 <= S.i0) { S.i0 = 0; S.i1 = N - 1; }
  }

  // Table 1: every CMA for the selected period (the accessible table view; click a row to select it)
  function table(ALL, S, onPick) {
    const R = ranked(ALL.filter(e => !e.ont), S.i0, S.i1), o = sum(ALL.find(e => e.ont), S.i0, S.i1);
    const rows = [o, ...R], a = QS[S.i0].label, z = QS[S.i1].label;
    const host = d3.select("#tbl"); host.selectAll("*").remove();
    host.append("p").attr("class", "note").style("margin", "2px 0 0")
      .text(`Share of cases that are a single person without children (%), ${a} → ${z}; sorted by how much the gap narrowed. Click a row to select it.`);
    const t = host.append("div").attr("class", "tbl-wrap").append("table");
    const hd = t.append("thead");
    hd.append("tr").html(`<th></th><th colspan="3" style="text-align:center">OW share</th><th colspan="3" style="text-align:center">ODSP share</th><th colspan="3" style="text-align:center">Gap (pp)</th><th colspan="2" style="text-align:center">Cases, ${z}</th>`);
    hd.append("tr").selectAll("th").data(["Area", a, z, "Change", a, z, "Change", a, z, "Narrowed by", "OW", "ODSP"]).join("th").text(d => d);
    t.append("tbody").selectAll("tr").data(rows).join("tr")
      .attr("tabindex", 0).attr("data-id", r => r.e.id).attr("class", r => (r.e.ont ? "ont " : "") + (r.e.id === S.sel ? "on" : ""))
      .attr("aria-label", r => `Select ${r.e.name}`)
      .on("click", (e, r) => onPick(r.e.id))
      .on("keydown", (e, r) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onPick(r.e.id); refocus("#tbl tr", r.e.id); } })
      .selectAll("td").data(r => [r.e.name, fmt.f1(r.a.sow), fmt.f1(r.z.sow), fmt.spp(r.dOW), fmt.f1(r.a.sod), fmt.f1(r.z.sod), fmt.spp(r.dOD),
        fmt.f1(r.g0), fmt.f1(r.g1), fmt.spp(r.nar), fmt.int(r.z.owC), fmt.int(r.z.odC)])
      .join("td").text(d => d);
  }
  // keyboard users keep their place when a re-render rebuilds the element
  const refocus = (sel, id) => { const r = document.querySelector(`${sel}[data-id="${id}"]`); if (r) r.focus(); };

  // tooltip body for one area in one quarter (counts shown so small caseloads can be judged)
  const tipQuarter = (e, r) => `<div class="t">${e.name} · ${r.label}</div>` +
    tr("OW share", `${fmt.pct(r.sow)} <span style="color:var(--muted)">(${fmt.int(r.owF)} of ${fmt.int(r.owC)})</span>`, "var(--ow)") +
    tr("ODSP share", `${fmt.pct(r.sod)} <span style="color:var(--muted)">(${fmt.int(r.odF)} of ${fmt.int(r.odC)})</span>`, "var(--odsp)") +
    tr("Gap", fmt.pp(r.gap));
  const tipPeriod = s => tr(`Gap ${s.a.label} → ${s.z.label}`, `${fmt.f1(s.g0)} → ${fmt.f1(s.g1)}`) +
    tr(s.nar >= 0 ? "Narrowed by" : "Widened by", fmt.pp(Math.abs(s.nar))) +
    tr("Widened in", `${s.widen} of ${s.steps} quarterly changes`);

  // ---------- helpers (same behaviour as Q1 / Q3 v2) ----------
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
  // tap replaces hover: a touch "leave" fires right after the tap, so on touch the tooltip stays until the
  // reader taps outside a chart or scrolls
  const leave = fn => e => { if (!e || e.pointerType !== "touch") fn(e); };
  document.addEventListener("pointerdown", e => { if (e.pointerType === "touch" && !e.target.closest(".chart svg")) hideTip(); });
  // a scroll gesture closes it (not "scroll" events: re-renders above trigger scroll anchoring without the page moving)
  ["touchmove", "wheel"].forEach(n => window.addEventListener(n, () => { const t = tip(); if (t && !t.hidden && matchMedia("(hover: none)").matches) hideTip(); }, { passive: true }));
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
  function encl(g, x, a, b, h) {
    g.append("rect").attr("x", x(a)).attr("width", Math.max(2, x(b) - x(a))).attr("height", h)
      .style("fill", "var(--sel)").style("fill-opacity", .10).style("stroke", "var(--sel)").style("stroke-opacity", .8);
  }
  function timeAxis(g, x, h) {
    const span = (x.domain()[1] - x.domain()[0]) / 3.15e10, n = narrow() || x.range()[1] < 420;
    const step = span > 12 ? (n ? 5 : 2) : 1;
    g.append("g").attr("class", "axis").attr("transform", `translate(0,${h})`)
      .call(d3.axisBottom(x).ticks(d3.timeYear.every(step)).tickFormat(d3.timeFormat("%Y")).tickSizeOuter(0));
  }
  function hatch(svg, id) { // diagonal texture = "the gap" (neutral, distinct from the solid pandemic band)
    svg.append("defs").append("pattern").attr("id", id).attr("width", 6).attr("height", 6).attr("patternUnits", "userSpaceOnUse")
      .attr("patternTransform", "rotate(45)").append("line").attr("x1", 0).attr("y1", 0).attr("x2", 0).attr("y2", 6)
      .style("stroke", "var(--gap)").style("stroke-width", 1.4);
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
  const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  const dur = ms => (reduced() ? 0 : ms);
  function fail(err) {
    const el = document.getElementById("lead");
    if (el) el.textContent = "Could not load the data files. Serve the repository root over HTTP (see design/q2/README.md) and reopen this page.";
    console.error(err);
  }
  // hide labels that collide with an earlier (higher-priority) label; returns the kept ones
  function declutter(nodes, pad = 2) {
    const kept = [];
    nodes.forEach(n => { const b = n.getBBox(); const box = { x0: b.x - pad, x1: b.x + b.width + pad, y0: b.y - pad, y1: b.y + b.height + pad };
      if (kept.some(k => box.x0 < k.x1 && box.x1 > k.x0 && box.y0 < k.y1 && box.y1 > k.y0)) n.style.display = "none"; else kept.push(box); });
  }

  window.Q2 = {
    COVID, PH, fmt, load, sum, segments, ranked, lead, STEPS, stepState, story, renderCards, periodControl, readPeriod, table, refocus,
    tipQuarter, tipPeriod, showTip, hideTip, leave, tr, W, narrow, svgIn, covidBand, encl, timeAxis, hatch, seg, themeButton, onResize, reduced, dur, fail, declutter,
    get QS() { return QS; }, get N() { return N; }, get I19() { return I19; }, get I23() { return I23; }, get PRESETS() { return PRESETS; },
  };
})();
