"""Independent number check for Q2 extra version F (Python standard library only; no pandas, no JS).

Run verify_browser.py first (it dumps every displayed text of 8 page states). This script recomputes, from the four
course CSVs, the gaps, colour classes, the convergence factors, every back-test error and its quantiles, every
outlook value and every sentence, and compares the exact strings (d3.format-style rounding, U+2212 minus).

    python design/q2/variants/f-heatmap/verify.py
"""
import csv, json, math, pathlib, statistics, sys
from decimal import Decimal, ROUND_HALF_UP

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parents[3]
SEL = ROOT / "datasets" / "ONT-SA" / "selected"
MINUS = "−"


def _q(x, p): return Decimal(abs(x)).quantize(Decimal(1).scaleb(-p), rounding=ROUND_HALF_UP)
def f1(x): v = _q(x, 1); return (MINUS if x < 0 and v != 0 else "") + str(v)
def f2d(x): v = _q(x, 2); return (MINUS if x < 0 and v != 0 else "") + str(v)   # toFixed(2) of a positive value
def fint(x): v = int(_q(x, 0)); return (MINUS if x < 0 and v != 0 else "") + f"{v:,}"
def jsround1(v): return math.floor(v * 10 + 0.5) / 10
def spp(v): r = jsround1(v); return ("+" if r > 0 else MINUS if r < 0 else "±") + f1(abs(v))
pct = lambda v: f1(v) + "%"
pp = lambda v: f1(v) + " pp"

SHORT = {"Kitchener–Cambridge–Waterloo": "Kitchener–C–W", "St. Catharines–Niagara": "St. Cath.–Niagara", "Greater Sudbury": "Sudbury"}
MAPNAME = {"505": "Ottawa", "539": "Niagara", "541": "Kitchener–Waterloo", "580": "Sudbury"}
PH = {"pre": "before the pandemic", "during": "during the pandemic", "post": "after the pandemic"}
BRK = [10, 15, 20, 25, 30]
CLS = ["under 10", "10–15", "15–20", "20–25", "25–30", "30 or more"]
RULES = [("conv", "Convergence", "keeps moving toward the middle CMA's gap at the past rate"), ("naive", "No change", "stays at its latest value"),
         ("trend", "10-year trend", "follows its straight-line trend of the last 10 years")]
RL = {r[0]: r for r in RULES}
HZ, WIN = 19, 40


def read(fn):
    with open(SEL / fn, encoding="utf-8") as f: return list(csv.DictReader(f))


def build():
    ow = read("ont-sa-characteristic-ow-cma.csv") + read("ont-sa-characteristic-ow-ont.csv")
    od = read("ont-sa-characteristic-odsp-cma.csv") + read("ont-sa-characteristic-odsp-ont.csv")
    key = lambda r: ((r.get("cma") or "ont") or "ont", r["year"], r["month"]); odby = {key(r): r for r in od}; ents = {}
    for r in ow:
        k = key(r); o = odby[k]
        ents.setdefault(k[0], []).append({"year": int(r["year"]), "month": int(r["month"]), "quarter": int(r["quarter"]), "label": f"{r['year']} Q{r['quarter']}",
            "phase": r["covid_period"], "owC": float(r["cases"]), "owF": float(r["fts"]), "odC": float(o["cases"]), "odF": float(o["fts"])})
    out = []
    for k, rows in ents.items():
        rows.sort(key=lambda d: (d["year"], d["month"]))
        for d in rows: d["sow"] = 100 * d["owF"] / d["owC"]; d["sod"] = 100 * d["odF"] / d["odC"]; d["gap"] = d["sod"] - d["sow"]
        ont = k == "ont"; name = "Ontario (all)" if ont else k.split(" - ")[1].replace("--", "–")
        out.append({"id": "ont" if ont else k.split(" - ")[0], "name": name, "short": "Ontario" if ont else SHORT.get(name, name), "ont": ont, "rows": rows})
    return next(e for e in out if e["ont"]), sorted([e for e in out if not e["ont"]], key=lambda e: e["id"])


ONT, CMAS = build(); BY = {c["id"]: c for c in CMAS}; QS = ONT["rows"]; NQ = len(QS); NT = NQ + HZ; T = NQ - 1; n = len(CMAS)
LAB = [r["label"] for r in QS]; y, q = QS[-1]["year"], QS[-1]["quarter"]
for _ in range(HZ):
    q += 1
    if q > 4: q, y = 1, y + 1
    LAB.append(f"{y} Q{q}")
I19 = LAB.index("2019 Q4"); I23 = LAB.index("2023 Q1")
G = {c["id"]: [r["gap"] for r in c["rows"]] for c in CMAS}
MED = [statistics.median(G[c][t] for c in G) for t in range(NQ)]


def phi(T0, h):
    sxy = sxx = 0.0
    for t in range(0, T0 - h + 1):
        for c in CMAS:
            g = G[c["id"]]; x = g[t] - MED[t]; yv = g[t + h] - MED[t + h]; sxy += x * yv; sxx += x * x
    return sxy / sxx


def ols(g, i0, i1):
    xs = list(range(i0, i1 + 1)); mx = statistics.fmean(xs); my = statistics.fmean(g[i] for i in xs)
    b = sum((i - mx) * (g[i] - my) for i in xs) / sum((i - mx) ** 2 for i in xs); return my - b * mx, b


def proj(rule, g, T0, h, ph):
    if rule == "naive": return g[T0]
    if rule == "trend": a, b = ols(g, T0 - WIN + 1, T0); return a + b * (T0 + h)
    return MED[T0] + ph[h] * (g[T0] - MED[T0])


def quantile(a, p):  # d3.quantile on sorted values (linear interpolation, R-7)
    i = (len(a) - 1) * p; i0 = math.floor(i); return a[i0] + (a[min(i0 + 1, len(a) - 1)] - a[i0]) * (i - i0)


err = {r: [[] for _ in range(HZ + 1)] for r in RL}
for T0 in range(WIN - 1, T):
    ph = [1] + [phi(T0, h) for h in range(1, HZ + 1)]
    for c in CMAS:
        g = G[c["id"]]
        for h in range(1, HZ + 1):
            if T0 + h > T: break
            for r in RL: err[r][h].append(g[T0 + h] - proj(r, g, T0, h, ph))
BT = {}
for r in RL:
    e = err[r]; srt = [sorted(a) for a in e]
    BT[r] = {"n": [len(a) for a in e], "mae": [statistics.fmean(abs(x) for x in a) if a else 0 for a in e], "bias": [statistics.fmean(a) if a else 0 for a in e],
             "q10": [quantile(a, 0.1) if a else 0 for a in srt], "q90": [quantile(a, 0.9) if a else 0 for a in srt]}
phN = [1] + [phi(T, h) for h in range(1, HZ + 1)]
OUT = {}
for r in RL:
    OUT[r] = {}
    for c in CMAS:
        g = G[c["id"]]; lst = []
        for h in range(HZ + 1):
            pr = proj(r, g, T, h, phN) if h else g[T]
            lst.append({"p": max(0, pr), "lo": max(0, pr + BT[r]["q10"][h]), "hi": max(0, pr + BT[r]["q90"][h])})
        OUT[r][c["id"]] = lst


def val(i, t, rule): return G[i][t] if t < NQ else OUT[rule][i][t - NQ + 1]["p"]
def clsof(v): return sum(1 for b in BRK if jsround1(v) >= b)
def rank(i, t, rule): return 1 + sum(1 for c in CMAS if val(c["id"], t, rule) > val(i, t, rule))
def phase(t, rule): return PH.get(QS[t]["phase"], "") if t < NQ else f"outlook, {RL[rule][1].lower()} rule"


# whole-period facts for the lead (as shared/q2-common.js)
def ssum(e, i0, i1):
    a, z = e["rows"][i0], e["rows"][i1]; return {"e": e, "a": a, "z": z, "g0": a["gap"], "g1": z["gap"], "nar": a["gap"] - z["gap"]}
R = sorted((ssum(c, 0, T) for c in CMAS), key=lambda s: (-s["nar"], s["e"]["name"])); o = ssum(ONT, 0, T)
endWidest = max(R, key=lambda r: r["g1"])
lead = (f"From {LAB[0]} to {LAB[T]}, the share of cases that are a single person without children rose in both programs across Ontario: OW {pct(o['a']['sow'])} → {pct(o['z']['sow'])}, "
        f"ODSP {pct(o['a']['sod'])} → {pct(o['z']['sod'])}. The gap between the programs went from {f1(o['g0'])} to {f1(o['g1'])} percentage points. "
        f"It was smaller at the end than at the start in {'all ' + str(n) if all(r['nar'] > 0 for r in R) else str(sum(r['nar'] > 0 for r in R)) + ' of ' + str(n)} CMAs: by the most in {R[0]['e']['name']} "
        f"({f1(R[0]['g0'])} → {f1(R[0]['g1'])}), by the least in {R[-1]['e']['name']} ({f1(R[-1]['g0'])} → {f1(R[-1]['g1'])}).")


def state_of(query):
    p = dict(kv.split("=") for kv in query.split("&"))
    t = LAB.index(p["t"][:4] + " " + p["t"][4:]) if "t" in p else 0
    sel = p["cma"] if p.get("cma") in BY else endWidest["e"]["id"]
    return t, sel, p.get("view", "map"), p.get("rule", "conv")


def expected(query):
    t, sel, view, rule = state_of(query); e = BY[sel]; out = t >= NQ; X = {}
    v = val(sel, t, rule); k = clsof(v); r = rank(sel, t, rule); row = e["rows"][min(t, T)]; b = OUT[rule][sel][t - NQ + 1] if out else None
    X["lead"] = lead
    X["defTest"] = (f"Each rule was run from every quarter from {LAB[WIN - 1]} (the first with 10 years of data before it) to {LAB[NQ - 2]}, using only the data up to that quarter, "
                    f"and compared with what happened later. The \"likely range\" is the middle 80% of those past misses at the same distance ahead.")
    X["f1Title"] = f"Gap between the ODSP and OW single-person shares in each CMA, {LAB[t]}" + (f" (outlook, {RL[rule][1].lower()} rule)" if out else "")
    X["tNow"] = f"{LAB[t]} · {phase(t, rule)}" + ("projection" if out else "")
    X["moments"] = [LAB[0], LAB[I19], LAB[I23], LAB[T] + " (latest)", LAB[NT - 1] + " (outlook)"]
    stats = [["Gap", f"{f1(v)} pp" + (" (projected)" if out else "")], ["Likely range", f"{f1(b['lo'])}–{f1(b['hi'])} pp" if out else "— (data)"],
             ["Colour class", CLS[k]], ["Rank (1 = widest gap)", f"{r} of {n}"], [f"Change since {LAB[0]}", f"{spp(v - e['rows'][0]['gap'])} pp"],
             ["OW · ODSP share", "not projected" if out else f"{pct(row['sow'])} · {pct(row['sod'])}"], ["OW cases", "—" if out else fint(row["owC"])]]
    stats += [[RL[x][1], f"{f1(OUT[x][sel][HZ]['p'])} pp ({f1(OUT[x][sel][HZ]['lo'])}–{f1(OUT[x][sel][HZ]['hi'])})"] for x in RL]
    if out: sm = f"If its gap {RL[rule][2]}, it would be about {f1(v)} pp in {LAB[t]} (likely {f1(b['lo'])}–{f1(b['hi'])} pp). This is a projection, not a forecast."
    else: sm = f"In {LAB[t]}, {e['name']}'s gap was {f1(v)} pp: {'the widest of the 15 CMAs' if r == 1 else 'the narrowest of the 15 CMAs' if r == n else f'rank {r} of {n}'} ({spp(v - e['rows'][0]['gap'])} pp since {LAB[0]})."
    last = e["rows"][T]
    X["card"] = {"mode": "Figure 1b · Selected CMA", "name": e["name"], "per": f"{LAB[t]} · {phase(t, rule)}", "stats": stats, "sum": sm,
                 "warn": f"Small caseload ({fint(last['owC'])} OW cases in {LAB[T]}): its shares move more from quarter to quarter, so single quarters and projections are less reliable." if last["owC"] < 3000 else None}
    nm = lambda i: MAPNAME.get(i, BY[i]["short"])
    X["labels"] = {c["id"]: f"{nm(c['id'])} {f1(val(c['id'], t, rule))}" for c in CMAS} if view == "map" else {}
    X["tiles"] = {c["id"]: f1(val(c["id"], t, rule)) for c in CMAS} if view == "tiles" else {}
    X["cls"] = {c["id"]: clsof(val(c["id"], t, rule)) for c in CMAS}
    X["hatch"] = (15 if view == "map" else 15) if out else 0
    X["olabel"] = f"OUTLOOK · {RL[rule][1].upper()} RULE" if out and view == "map" else None
    X["f2Title"] = f"{e['name']}: the gap every quarter, {LAB[0]} – {LAB[T]}, and the three outlook rules to {LAB[NT - 1]}"
    ends = [OUT[x][sel][HZ]["p"] for x in RL]
    X["f2Read"] = (f"{e['name']}: {f1(e['rows'][0]['gap'])} pp in {LAB[0]}, {f1(e['rows'][T]['gap'])} pp in {LAB[T]}. For {LAB[NT - 1]} the rules give {f1(ends[0])} (convergence), "
                   f"{f1(ends[1])} (no change) and {f1(ends[2])} pp (10-year trend); they differ by {f1(jsround1(max(ends)) - jsround1(min(ends)))} pp.")
    X["f2Ends"] = sorted(f"{RL[x][1]} {f1(OUT[x][sel][HZ]['p'])}" for x in RL)
    X["f2On"] = rule
    best = min(RL, key=lambda x: (BT[x]["mae"][HZ], ["conv", "naive", "trend"].index(x)))
    bias = lambda v: "about right" if abs(v) < 0.05 else f"{f1(abs(v))} too {'low' if v > 0 else 'high'}"
    X["skill"] = [["best" if x == best else "", RL[x][1], f1(BT[x]["mae"][4]), f1(BT[x]["mae"][8]), f1(BT[x]["mae"][HZ]), bias(BT[x]["bias"][HZ])] for x in RL]
    X["skillHead"] = ["Rule", "1 year ahead", "2 years", f"{HZ} quarters (to {LAB[NT - 1]})", f"On average, {HZ} quarters"]
    nb = BT["conv"]["n"]
    X["skillNote"] = (f"Average miss = mean of |actual gap − projected gap| over the 15 CMAs and every starting quarter from {LAB[WIN - 1]} on, using only the data up to that quarter "
                      f"({fint(nb[4])} projections 1 year ahead, {fint(nb[HZ])} for {HZ} quarters ahead, the last starting in {LAB[T - HZ]}). \"Too low\" means the rule projected a narrower gap than happened. "
                      f"Bold: the smallest miss {HZ} quarters ahead (" + ", ".join(f"{RL[x][1].lower()} {f2d(BT[x]['mae'][HZ])}" for x in RL) + " to two decimals). "
                      "\"No change\" is the yardstick: a rule that cannot clearly beat it adds little.")
    X["outTitle"] = f"Outlook for {LAB[NT - 1]}, sorted by the {RL[rule][1].lower()} rule (likely range in brackets)"
    rows = sorted(CMAS, key=lambda c: (-OUT[rule][c["id"]][HZ]["p"], c["name"]))
    cell = lambda x, i: f"{f1(OUT[x][i][HZ]['p'])} ({f1(OUT[x][i][HZ]['lo'])}–{f1(OUT[x][i][HZ]['hi'])})"
    X["out"] = [[c["id"], c["name"], f1(G[c["id"]][T])] + [cell(x, c["id"]) for x in RL] for c in rows]
    X["outHead"] = ["CMA", LAB[T]] + [RL[x][1] for x in RL]
    dark = lambda tt: sum(1 for c in CMAS if clsof(G[c["id"]][tt]) >= 4)
    wd = max(CMAS, key=lambda c: G[c["id"]][T]); pv = [OUT[rule][c["id"]][HZ]["p"] for c in CMAS]; now = [G[c["id"]][T] for c in CMAS]
    diffs = [(c, jsround1(max(OUT[x][c["id"]][HZ]["p"] for x in RL)) - jsround1(min(OUT[x][c["id"]][HZ]["p"] for x in RL))) for c in CMAS]
    dmax = max(diffs, key=lambda d: d[1])  # d3.greatest keeps the first maximum
    dmax = next(d for d in diffs if d[1] == dmax[1])
    X["take"] = (f"From dark to light. In {LAB[0]}, {dark(0)} of the {n} CMAs had a gap of 25 pp or more (the two darkest classes); in {LAB[T]}, {'none' if dark(T) == 0 else dark(T)} did, "
                 f"and the widest gap was {f1(G[wd['id']][T])} pp ({wd['name']}). On the {RL[rule][1].lower()} rule, the {LAB[NT - 1]} gaps would span {f1(min(pv))}–{f1(max(pv))} pp "
                 f"({LAB[T]}: {f1(min(now))}–{f1(max(now))} pp); for one CMA the three rules differ by up to {f1(dmax[1])} pp ({dmax[0]['name']}), a reminder that the outlook is a projection.")
    mae = lambda x: f1(BT[x]["mae"][HZ])
    X["outCard"] = ("About the outlook\n"
                    f"Tested from {LAB[WIN - 1]} on, {HZ} quarters ahead the rules missed by {mae('conv')} pp (convergence), {mae('naive')} pp (no change) and {mae('trend')} pp (10-year trend) on average.\n"
                    "The rules know nothing about future policy, benefit rates, caseload growth or the economy; a change in either program would break them.\n"
                    f"They disagree most for {dmax[0]['name']}: {f1(dmax[1])} pp apart in {LAB[NT - 1]}.\n"
                    "A projected gap is not a target, and a narrower gap does not mean that needs converged.")
    X["slider"] = ["0", str(NT - 1), str(t)]
    return X


dump = json.loads((HERE / "browser-verification.json").read_text(encoding="utf-8"))
results, mism = [], []
for st in dump["states"]:
    X = expected(st["query"]); got = dict(st); got["f2Ends"] = sorted(st["f2Ends"])
    got["skill"] = [[r[0].strip()] + r[1:] for r in st["skill"]]
    for kname, v in X.items():
        if kname == "card":
            for ck, cv in v.items():
                ok = got["card"][ck] == cv; results.append({"state": st["query"], "field": "card." + ck, "ok": ok})
                if not ok: mism.append({"state": st["query"], "field": "card." + ck, "page": got["card"][ck], "expected": cv})
        else:
            pv = got[kname]
            if kname == "outCard": pv = "\n".join(s.strip() for s in pv.split("\n") if s.strip())
            ok = pv == v; results.append({"state": st["query"], "field": kname, "ok": ok})
            if not ok: mism.append({"state": st["query"], "field": kname, "page": pv, "expected": v})

facts = {
    "convergence rule beats the 10-year trend 19 quarters ahead": BT["conv"]["mae"][HZ] < BT["trend"]["mae"][HZ],
    "no-change rule beats the 10-year trend 19 quarters ahead": BT["naive"]["mae"][HZ] < BT["trend"]["mae"][HZ],
    "no projected gap had to be clipped at 0": all(OUT[x][c["id"]][h]["p"] > 0 for x in RL for c in CMAS for h in range(HZ + 1)),
}
summary = {"states": len(dump["states"]), "fields": len(results), "mismatches": len(mism), "facts": facts,
           "mae_19q": {x: round(BT[x]["mae"][HZ], 4) for x in RL}, "bias_19q": {x: round(BT[x]["bias"][HZ], 4) for x in RL},
           "phi": {h: round(phN[h], 4) for h in (1, 4, 8, HZ)}, "n_19q": BT["conv"]["n"][HZ]}
(HERE / "verification.json").write_text(json.dumps({"summary": summary, "mismatches": mism, "results": results}, indent=1, ensure_ascii=False), encoding="utf-8")
print(json.dumps(summary, indent=1, ensure_ascii=False))
for m in mism[:15]: print("MISMATCH", json.dumps(m, ensure_ascii=False)[:800])
sys.exit(0 if not mism and all(facts.values()) else 1)
