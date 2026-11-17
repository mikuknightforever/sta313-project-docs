"""Independent pandas check of the numbers on the Q1 "D + insight" pages (versions 5–9).

Recomputes every overlay figure from the course CSVs and design/q1/data/*.csv, formats it the way the page does, and
checks that the exact string appears in the page dump written by `node tools/check_q1.mjs d-insight-<mode> <prefix> "" facts`.

Usage (repository root):
  for m in plans gates trend porcupine ghost; do node tools/check_q1.mjs d-insight-$m ins-$m "" facts; done
  python tools/verify_q1_insight.py
"""
import json, math, pathlib, sys
import numpy as np
import pandas as pd

REPO = pathlib.Path(__file__).resolve().parents[1]
SEL = REPO / "datasets/ONT-SA/selected"
DATA = REPO / "design/q1/data"
OUT = REPO / "tools/out"

from decimal import Decimal, ROUND_HALF_UP
MINUS = "−"  # d3-format writes negative numbers with U+2212
def f1(v): return f"{v:.1f}".replace("-", MINUS)
def sp(v): return ("+" if v > 0 else MINUS if v < 0 else "±") + f1(abs(v)) + "%"
def num(v): return f"{int(Decimal(repr(float(v))).quantize(Decimal('1'), rounding=ROUND_HALF_UP)):,}".replace("-", MINUS)  # JS rounds .5 up (235,500.5 → 235,501)
def sint(v): return ("+" if v > 0 else MINUS if v < 0 else "±") + num(abs(v))
def fyl(y): return f"{y}-{(y + 1) % 100:02d}"

ow = pd.read_csv(SEL / "ont-sa-characteristic-ow-ont.csv"); od = pd.read_csv(SEL / "ont-sa-characteristic-odsp-ont.csv")
q = pd.DataFrame({"year": ow.year, "quarter": ow.quarter, "month": ow.month, "ow": ow.cases, "odsp": od.cases.values})
q["label"] = q.year.astype(str) + " Q" + q.quarter.astype(str)
q["date"] = pd.to_datetime(dict(year=q.year, month=q.month, day=1))
q = q.reset_index(drop=True)
L = len(q) - 1
ib = int(q.index[q.label == "2019 Q4"][0]); b = q.loc[ib]
q["iow"] = q.ow / b.ow * 100; q["iod"] = q.odsp / b.odsp * 100
q["yow"] = (q.ow / q.ow.shift(4) - 1) * 100
I = {l: i for i, l in enumerate(q.label)}
phase = ow.covid_period.values
during = q[phase == "during"]; dur_a = during.index[0]
ow_min = int(q.ow.idxmin())

E = {}  # mode -> list of expected strings

# ---------- plans ----------
fao = pd.read_csv(DATA / "fao-caseload-plans.csv")
def get(v, s, p): r = fao[(fao.vintage == v) & (fao.series == s) & (fao.program == p)]; return dict(zip(r.fy_start, r.cases))
act = {"ow": get("fao2026", "fao_actual", "OW"), "odsp": get("fao2026", "fao_actual", "ODSP")}
cap = {"ow": get("fao2026", "budget_funded_capacity", "OW"), "odsp": get("fao2026", "budget_funded_capacity", "ODSP")}
sh = {"ow": get("fao2026", "fao_shortfall", "OW"), "odsp": get("fao2026", "fao_shortfall", "ODSP")}
f24 = {"ow": get("fao2024", "fao_projection", "OW"), "odsp": get("fao2024", "fao_projection", "ODSP")}
f25 = {"ow": get("fao2025", "fao_projection", "OW"), "odsp": get("fao2025", "fao_projection", "ODSP")}
y0 = max(act["ow"]); c1 = min(cap["ow"])
pct = (cap["ow"][c1] / act["ow"][y0] - 1) * 100
drop = q.ow[dur_a] - q.ow[ow_min]
yoy_below = q.label[q.yow <= pct].tolist()
q["fy"] = np.where(q.quarter == 1, q.year - 1, q.year)
fyavg = q.groupby("fy").agg(ow=("ow", "mean"), odsp=("odsp", "mean"), n=("ow", "size"))
fyavg = fyavg[fyavg.n == 4]
err24 = [(y, (f24["ow"][y] / act["ow"][y] - 1) * 100, (f24["odsp"][y] / act["odsp"][y] - 1) * 100) for y in sorted(f24["ow"]) if y in act["ow"]]
err25 = [(y, (f25["ow"][y] / act["ow"][y] - 1) * 100, (f25["odsp"][y] / act["odsp"][y] - 1) * 100) for y in sorted(f25["ow"]) if y in act["ow"]]
agree = [(y, (fyavg.ow[y] / act["ow"][y] - 1) * 100, (fyavg.odsp[y] / act["odsp"][y] - 1) * 100) for y in sorted(act["ow"]) if y in fyavg.index]
agree_x = [a for a in agree if abs(a[1]) > 1 or abs(a[2]) > 1]
E["plans"] = [
    f"The 2026 Budget funds {num(cap['ow'][c1])} OW cases for {fyl(c1)}: {f1(abs(pct))}% fewer than the {fyl(y0)} average and {num(sh['ow'][c1])} fewer than the FAO estimates, a gap {round(100 * sh['ow'][c1] / drop)}% as large as OW's whole pandemic drop.",
    "missed OW by " + ", ".join(f"{fyl(y)} {sp(e)}" for y, e, _ in err24) + " and ODSP by " + ", ".join(f"{fyl(y)} {sp(e)}" for y, _, e in err24),
    "; ".join(f"{fyl(y)} was {sp(e1)} for OW and {sp(e2)} for ODSP" for y, e1, e2 in err25),
    f"the 2026 Budget funds {num(cap['ow'][c1])} OW cases, {sint(cap['ow'][c1] - act['ow'][y0])} ({sp(pct)}) against the {fyl(y0)} average of {num(act['ow'][y0])}; the FAO estimates {num(cap['ow'][c1] + sh['ow'][c1])}, a shortfall of {num(sh['ow'][c1])} OW and {num(sh['odsp'][c1])} ODSP cases.",
    f"OW fell {num(drop)} cases from {q.label[dur_a]} to {q.label[ow_min]}; its year-over-year change has been {f1(pct)}% or lower only in {', '.join(yoy_below)}.",
    "except " + ", ".join(f"{fyl(y)} (OW {sp(e)})" for y, e, _ in agree_x) + ".",
] + [num(fyavg.loc[y, k]) for y in range(2023, 2026) for k in ("ow", "odsp")] \
  + [num(cap[k][y] + sh[k][y]) for y in cap["ow"] for k in ("ow", "odsp")]

# ---------- gates ----------
ev = pd.read_csv(DATA / "policy-events.csv")
def base_of(t):  # last quarter whose month starts before the event's month
    m = pd.Timestamp(t.year, t.month, 1); return int(q.index[q.date < m].max())
def ch(i, k, p): return (q[p][i + k] / q[p][i] - 1) * 100 if 0 <= i and i + k <= L else None
rows = []
for _, e in ev.iterrows():
    at = pd.Timestamp(e.end if e.id == "CRB" else e.start); bi = base_of(at)
    rows.append(dict(id=e.id, base=bi, a_ow=ch(bi, 4, "ow"), a_od=ch(bi, 4, "odsp"), b_ow=ch(bi - 4, 4, "ow"), b_od=ch(bi - 4, 4, "odsp")))
R = {r["id"]: r for r in rows}
cerb_s, cerb_e = pd.Timestamp(ev.set_index("id").start["CERB"]), pd.Timestamp(ev.set_index("id").end["CERB"])
crb_s, crb_e = pd.Timestamp(ev.set_index("id").start["CRB"]), pd.Timestamp(ev.set_index("id").end["CRB"])
inwin = q[((q.date >= cerb_s) & (q.date <= cerb_e)) | ((q.date >= crb_s) & (q.date <= crb_e))]
win_low = int(inwin.ow.idxmin())
qoq = (q.ow / q.ow.shift(1) - 1) * 100
nxt = R["CRB"]["base"] + 1; rank = int((qoq > qoq[nxt]).sum()) + 1; top = int(qoq.idxmax())
odsp_after = max(abs(R[i]["a_od"]) for i in ["P4", "P5", "P6"])
cb = R["CERB"]["base"]
E["gates"] = [
    f"was lowest in {q.label[win_low]}" + (", the last quarter-end before the CRB ended" if win_low == R["CRB"]["base"] else ""),
    f"{q.label[nxt]} brought OW's {'second-largest' if rank == 2 else 'largest' if rank == 1 else '#' + str(rank)} quarterly rise since {q.label[0]} ({sp(qoq[nxt])})",
    f"From {q.label[cb]}, the last quarter-end before CERB, to {q.label[win_low]}, OW fell from {num(q.ow[cb])} to {num(q.ow[win_low])} cases; ODSP changed {sp((q.odsp[win_low] / q.odsp[cb] - 1) * 100)}",
    f"OW changed {sp(R['CRB']['a_ow'])}, after {sp(R['CRB']['b_ow'])} in the four quarters before",
    f"is second only to {q.label[top]} ({sp(qoq[top])})" if rank == 2 else "",
    f"moved by at most {f1(odsp_after)}% over four quarters",
] + [f"{sp(r['b_ow'])} → {sp(r['a_ow'])}" for r in rows] + [f"{sp(r['b_od'])} → {sp(r['a_od'])}" for r in rows]

# ---------- trend ----------
def fit(p, a, z):
    i0, i1 = I[a], I[z]; x = np.arange(i0, i1 + 1); k, c = np.polyfit(x, np.log(q[p].values[i0:i1 + 1]), 1)
    return lambda i: math.exp(k * i + c), (math.exp(4 * k) - 1) * 100
fits = {nm: {p: fit(p, a, z) for p in ("ow", "odsp")} for nm, a, z in [("2015–19", "2015 Q1", "2019 Q4"), ("2010–19", "2010 Q1", "2019 Q4"), ("2017–19", "2017 Q1", "2019 Q4")]}
def gap(nm, i):
    t_ow, t_od = fits[nm]["ow"][0](i), fits[nm]["odsp"][0](i)
    return dict(ow=q.ow[i] - t_ow, odsp=q.odsp[i] - t_od, owp=(q.ow[i] / t_ow - 1) * 100, odp=(q.odsp[i] / t_od - 1) * 100, tot=q.ow[i] + q.odsp[i] - t_ow - t_od)
g = gap("2015–19", L)
dev = {i: gap("2015–19", i)["owp"] for i in range(ib + 1, L + 1)}
low = min(dev, key=dev.get); back = next(i for i in range(low, L + 1) if dev[i] > 0)
rob = [gap(nm, L) for nm in fits]
E["trend"] = [
    f"In {q.label[L]} ODSP was {num(abs(g['odsp']))} cases ({f1(abs(g['odp']))}%) below the track of its 2015–19 growth and OW {num(g['ow'])} ({f1(g['owp'])}%) above its own; together they were only {num(abs(g['tot']))} off",
    f"ODSP {sp(fits['2015–19']['odsp'][1])} a year, OW {sp(fits['2015–19']['ow'][1])} a year",
    f"OW was furthest below its track in {q.label[low]} ({sp(dev[low])}) and back above it from {q.label[back]}",
    f"ODSP {sint(g['odsp'])} ({sp(g['odp'])}), OW {sint(g['ow'])} ({sp(g['owp'])}), OW + ODSP {sint(g['tot'])}",
    f"ODSP is {f1(-max(r['odp'] for r in rob))}–{f1(-min(r['odp'] for r in rob))}% below and OW {f1(min(r['owp'] for r in rob))}–{f1(max(r['owp'] for r in rob))}% above",
] + [f"{sint(r['odsp'])} ({sp(r['odp'])})" for r in rob] + [sp(fits[nm][p][1]) for nm in fits for p in ("ow", "odsp")]

# ---------- porcupine ----------
H = 8
rays = []
for i in range(H, L + 1):
    go, gd = q.ow[i] / q.ow[i - H], q.odsp[i] / q.odsp[i - H]
    t = i + H
    rays.append(dict(i=i, eo=(q.ow[i] * go / q.ow[t] - 1) * 100 if t <= L else None, ed=(q.odsp[i] * gd / q.odsp[t] - 1) * 100 if t <= L else None))
sc = [r for r in rays if r["eo"] is not None]
pre = [r for r in sc if q.year[r["i"]] < 2018]
m_pre = np.mean([abs(r["eo"]) for r in pre]); m_all = np.mean([abs(r["eo"]) for r in sc]); m_od = np.mean([abs(r["ed"]) for r in sc])
w_ow = max(sc, key=lambda r: abs(r["eo"])); w_od = max(sc, key=lambda r: abs(r["ed"])); at19 = next(r for r in sc if r["i"] == ib)
E["porcupine"] = [
    f"missed OW by {f1(m_pre)}% on average from origins before 2018, but by {sp(at19['eo'])} from 2019 Q4 and {sp(w_ow['eo'])} from {q.label[w_ow['i']]}; for ODSP the average miss was {f1(m_od)}%",
    f"Over {len(sc)} origins ({q.label[sc[0]['i']]} – {q.label[sc[-1]['i']]}) the rule missed OW by {f1(m_all)}% on average ({f1(m_pre)}% for origins before 2018) and ODSP by {f1(m_od)}%",
    f"OW {sp(w_ow['eo'])} from {q.label[w_ow['i']]} (for {q.label[w_ow['i'] + H]}); ODSP {sp(w_od['ed'])} from {q.label[w_od['i']]}",
    f"From 2019 Q4 the rule overstated OW by {sp(at19['eo'])} and ODSP by {sp(at19['ed'])}",
]

# ---------- ghost ----------
i08 = I["2008 Q3"]; K = L - ib
def cmp(k): return dict(src=q.label[i08 + k], g_ow=q.ow[i08 + k] / q.ow[i08] * 100, g_od=q.odsp[i08 + k] / q.odsp[i08] * 100, c_ow=q.iow[ib + k], c_od=q.iod[ib + k], cur=q.label[ib + k])
a6, z = cmp(6), cmp(K)
E["ghost"] = [
    f"Six quarters after 2008 Q3 OW was up {f1(a6['g_ow'] - 100)}%; six quarters after 2019 Q4 it was down {f1(100 - a6['c_ow'])}%. {K} quarters on, OW ends at a similar level ({f1(z['g_ow'])} vs {f1(z['c_ow'])}), while ODSP, up {f1(z['g_od'] - 100)}% after 2008, is flat ({f1(z['c_od'])}).",
] + [f"+{k} quarters: OW {f1(cmp(k)['g_ow'])} after 2008 vs {f1(cmp(k)['c_ow'])} after 2019; ODSP {f1(cmp(k)['g_od'])} vs {f1(cmp(k)['c_od'])}" for k in (4, 6, 12, 20, K)]

# ---------- compare with the page dumps ----------
bad = 0; total = 0
for m, exp in E.items():
    p = OUT / f"q1_ins-{m}_dump.json"
    if not p.exists(): print(f"{m}: no dump ({p.name}); run check_q1.mjs facts first"); bad += 1; continue
    text = json.loads(p.read_text(encoding="utf-8"))["text"]
    miss = [s for s in exp if s and s not in text]
    total += len([s for s in exp if s]); bad += len(miss)
    print(f"{m}: {len([s for s in exp if s]) - len(miss)}/{len([s for s in exp if s])} strings found")
    for s in miss: print("   MISSING:", s)
print(f"\n{total - bad}/{total} checks pass")
sys.exit(1 if bad else 0)
