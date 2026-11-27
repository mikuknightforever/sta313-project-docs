"""Independent number check for Q2 extra versions G–N (Python standard library only; no pandas, no JS).

Run tools/check_q2_maplab.py first: it writes browser-verification.json in each version folder. This script
recomputes from the four course CSVs the gaps, the change against a year earlier, every colour class, the outlook
(convergence factors, every back-test error and its quantiles, every projection) and every sentence, and compares the
exact strings for every dumped page state, including every mark drawn in Figure 1a (data-v / data-c).

    python tools/verify_q2_maplab.py            # all five
    python tools/verify_q2_maplab.py g k        # some
"""
import csv, json, math, pathlib, statistics, sys
from decimal import Decimal, ROUND_HALF_UP

ROOT = pathlib.Path(__file__).resolve().parents[1]
SEL = ROOT / "datasets" / "ONT-SA" / "selected"
MINUS = "−"
FOLDERS = {"g": "g-spikes", "h": "h-hexes", "i": "i-multiples", "j": "j-bivariate", "k": "k-prisms", "l": "l-blocks", "m": "m-block-treemap", "n": "n-map-blocks"}


def _q(x, p): return Decimal(abs(x)).quantize(Decimal(1).scaleb(-p), rounding=ROUND_HALF_UP)
def f1(x): v = _q(x, 1); return (MINUS if x < 0 and v != 0 else "") + str(v)
def f2d(x): v = _q(x, 2); return (MINUS if x < 0 and v != 0 else "") + str(v)
def fint(x): v = int(_q(x, 0)); return (MINUS if x < 0 and v != 0 else "") + f"{v:,}"
def jsr1(v): return math.floor(v * 10 + 0.5) / 10
def spp(v): r = jsr1(v); return ("+" if r > 0 else MINUS if r < 0 else "±") + f1(abs(v))
pct = lambda v: f1(v) + "%"

SHORT = {"Kitchener–Cambridge–Waterloo": "Kitchener–C–W", "St. Catharines–Niagara": "St. Cath.–Niagara", "Greater Sudbury": "Sudbury"}
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
LAB = [r["label"] for r in QS]; yy, qq = QS[-1]["year"], QS[-1]["quarter"]
for _ in range(HZ):
    qq += 1
    if qq > 4: qq, yy = 1, yy + 1
    LAB.append(f"{yy} Q{qq}")
I19 = LAB.index("2019 Q4"); I23 = LAB.index("2023 Q1")
G = {c["id"]: [r["gap"] for r in c["rows"]] for c in CMAS}
MED = [statistics.median(G[c][t] for c in G) for t in range(NQ)]


def phi(T0, h):
    sxy = sxx = 0.0
    for t in range(0, T0 - h + 1):
        for c in CMAS:
            g = G[c["id"]]; x = g[t] - MED[t]; y = g[t + h] - MED[t + h]; sxy += x * y; sxx += x * x
    return sxy / sxx


def ols(g, i0, i1):
    xs = list(range(i0, i1 + 1)); mx = statistics.fmean(xs); my = statistics.fmean(g[i] for i in xs)
    b = sum((i - mx) * (g[i] - my) for i in xs) / sum((i - mx) ** 2 for i in xs); return my - b * mx, b


def proj(rule, g, T0, h, ph):
    if rule == "naive": return g[T0]
    if rule == "trend": a, b = ols(g, T0 - WIN + 1, T0); return a + b * (T0 + h)
    return MED[T0] + ph[h] * (g[T0] - MED[T0])


def quantile(a, p): i = (len(a) - 1) * p; i0 = math.floor(i); return a[i0] + (a[min(i0 + 1, len(a) - 1)] - a[i0]) * (i - i0)


err = {r: [[] for _ in range(HZ + 1)] for r in RL}
for T0 in range(WIN - 1, T):
    ph = [1] + [phi(T0, h) for h in range(1, HZ + 1)]
    for c in CMAS:
        g = G[c["id"]]
        for h in range(1, HZ + 1):
            if T0 + h > T: break
            for r in RL: err[r][h].append(g[T0 + h] - proj(r, g, T0, h, ph))
BT = {r: {"n": [len(a) for a in err[r]], "mae": [statistics.fmean(abs(x) for x in a) if a else 0 for a in err[r]], "bias": [statistics.fmean(a) if a else 0 for a in err[r]],
          "q10": [quantile(sorted(a), 0.1) if a else 0 for a in err[r]], "q90": [quantile(sorted(a), 0.9) if a else 0 for a in err[r]]} for r in RL}
phN = [1] + [phi(T, h) for h in range(1, HZ + 1)]
OUT = {r: {c["id"]: [(lambda pr: {"p": max(0, pr), "lo": max(0, pr + BT[r]["q10"][h]), "hi": max(0, pr + BT[r]["q90"][h])})(proj(r, G[c["id"]], T, h, phN) if h else G[c["id"]][T])
                     for h in range(HZ + 1)] for c in CMAS} for r in RL}


def val(i, t, rule): return G[i][t] if t < NQ else OUT[rule][i][t - NQ + 1]["p"]
def chg(i, t, rule): return val(i, t, rule) - val(i, t - 4, rule) if t >= 4 else None
def clsof(v): return sum(1 for b in BRK if jsr1(v) >= b)
def chgcls(v): c = jsr1(v); return 2 if abs(c) < 0.5 else 0 if c <= -1.5 else 1 if c < 0 else 4 if c >= 1.5 else 3
def rank(i, t, rule): return 1 + sum(1 for c in CMAS if val(c["id"], t, rule) > val(i, t, rule))
def phase(t, rule): return PH.get(QS[t]["phase"], "") if t < NQ else f"outlook, {RL[rule][1].lower()} rule"


def shown(i, t, rule, mode):
    if mode == "yoy":
        d = chg(i, t, rule)
        return ("—", 2) if d is None else (spp(d), chgcls(d))
    v = val(i, t, rule); return (f1(v), clsof(v))


widen = [(t, sum(1 for c in CMAS if G[c["id"]][t] > G[c["id"]][t - 4])) for t in range(4, NQ)]
WIDn = max(w for _, w in widen); WIDt = next(t for t, w in widen if w == WIDn)
MOM = []
for t in [0, I19, WIDt, I23, NQ - 1, NT - 1]:
    if t not in MOM: MOM.append(t)


def ssum(e, i0, i1):
    a, z = e["rows"][i0], e["rows"][i1]; return {"e": e, "a": a, "z": z, "g0": a["gap"], "g1": z["gap"], "nar": a["gap"] - z["gap"]}
R = sorted((ssum(c, 0, T) for c in CMAS), key=lambda s: (-s["nar"], s["e"]["name"])); o = ssum(ONT, 0, T); endWidest = max(R, key=lambda r: r["g1"])
lead = (f"From {LAB[0]} to {LAB[T]}, the share of cases that are a single person without children rose in both programs across Ontario: OW {pct(o['a']['sow'])} → {pct(o['z']['sow'])}, "
        f"ODSP {pct(o['a']['sod'])} → {pct(o['z']['sod'])}. The gap between the programs went from {f1(o['g0'])} to {f1(o['g1'])} percentage points. "
        f"It was smaller at the end than at the start in {'all ' + str(n) if all(r['nar'] > 0 for r in R) else str(sum(r['nar'] > 0 for r in R)) + ' of ' + str(n)} CMAs: by the most in {R[0]['e']['name']} "
        f"({f1(R[0]['g0'])} → {f1(R[0]['g1'])}), by the least in {R[-1]['e']['name']} ({f1(R[-1]['g0'])} → {f1(R[-1]['g1'])}).")


def expected(ver, query):
    p = dict(kv.split("=") for kv in query.split("&"))
    t = LAB.index(p["t"][:4] + " " + p["t"][4:]) if "t" in p else 0
    sel = p["cma"] if p.get("cma") in BY else endWidest["e"]["id"]
    rule = p.get("rule", "conv"); mode = "level" if ver == "j" else p.get("show", "level")
    e = BY[sel]; out = t >= NQ; X = {}
    v = val(sel, t, rule); r = rank(sel, t, rule); row = e["rows"][min(t, T)]; b = OUT[rule][sel][t - NQ + 1] if out else None; d = chg(sel, t, rule)
    X["lead"] = lead
    X["defTest"] = (f"Each rule was run from every quarter from {LAB[WIN - 1]} (the first with 10 years of data before it) to {LAB[NQ - 2]}, using only the data up to that quarter, "
                    f"and compared with what happened later. The \"likely range\" is the middle 80% of those past misses at the same distance ahead.")
    X["tNow"] = f"{LAB[t]} · {phase(t, rule)}" + ("projection" if out else "")
    X["moments"] = [LAB[m] + (" (latest)" if m == T else " (outlook)" if m == NT - 1 else "") for m in MOM]
    if ver in ("g", "h", "k"):
        X["f1Title"] = (f"Change in each CMA's gap against a year earlier, {LAB[t]}" if mode == "yoy" else f"Gap between the ODSP and OW single-person shares in each CMA, {LAB[t]}") + (f" (outlook, {RL[rule][1].lower()} rule)" if out else "")
    elif ver == "i":
        X["f1Title"] = ("Change in each CMA's gap against a year earlier" if mode == "yoy" else "Gap between the ODSP and OW single-person shares in each CMA") + f" at six key moments ({', '.join(LAB[m] for m in MOM)})"
    elif ver in ("l", "m", "n"):
        X["f1Title"] = f"Gap (height) and its change against a year earlier (top colour) in each CMA, {LAB[t]}" + (f" (outlook, {RL[rule][1].lower()} rule)" if out else "")
    else:
        X["f1Title"] = f"Gap size and its change against a year earlier in each CMA, {LAB[t]}" + (f" (outlook, {RL[rule][1].lower()} rule)" if out else "")
    stats = [["Gap", f"{f1(v)} pp" + (" (projected)" if out else "")], ["Likely range", f"{f1(b['lo'])}–{f1(b['hi'])} pp" if out else "— (data)"],
             ["Against a year earlier", "— (no earlier year)" if d is None else f"{spp(d)} pp " + ("▲" if d > 0 and jsr1(d) != 0 else "▼" if jsr1(d) < 0 else "")],
             ["Rank (1 = widest gap)", f"{r} of {n}"], [f"Change since {LAB[0]}", f"{spp(v - e['rows'][0]['gap'])} pp"],
             ["OW · ODSP share", "not projected" if out else f"{pct(row['sow'])} · {pct(row['sod'])}"], ["OW cases", "—" if out else fint(row["owC"])]]
    stats += [[RL[x][1], f"{f1(OUT[x][sel][HZ]['p'])} pp ({f1(OUT[x][sel][HZ]['lo'])}–{f1(OUT[x][sel][HZ]['hi'])})"] for x in RL]
    sm = (f"If its gap {RL[rule][2]}, it would be about {f1(v)} pp in {LAB[t]} (likely {f1(b['lo'])}–{f1(b['hi'])} pp). This is a projection, not a forecast." if out else
          f"In {LAB[t]}, {e['name']}'s gap was {f1(v)} pp: {'the widest of the 15 CMAs' if r == 1 else 'the narrowest of the 15 CMAs' if r == n else f'rank {r} of {n}'} ({spp(v - e['rows'][0]['gap'])} pp since {LAB[0]}).")
    last = e["rows"][T]
    X["card"] = {"mode": "Figure 1b · Selected CMA", "name": e["name"], "per": f"{LAB[t]} · {phase(t, rule)}", "stats": stats, "sum": sm,
                 "warn": f"Small caseload ({fint(last['owC'])} OW cases in {LAB[T]}): its shares move more from quarter to quarter, so single quarters and projections are less reliable." if last["owC"] < 3000 else None}
    # every mark in Figure 1a
    marks = []
    for c in CMAS:
        i = c["id"]
        if ver == "i":
            for tp in MOM: txt, k = shown(i, tp, rule, mode); marks.append([i, tp, txt, k, None])
        elif ver in ("l", "m", "n"):
            vv = val(i, t, rule); dd = chg(i, t, rule)
            marks.append([i, t, f"{f1(vv)} / {'—' if dd is None else spp(dd)}", 2 if dd is None else chgcls(dd), f1(vv)])
        elif ver == "j":
            vv = val(i, t, rule); dd = chg(i, t, rule); lev = 0 if jsr1(vv) < 12 else 1 if jsr1(vv) < 20 else 2
            dr = 1 if dd is None else 0 if jsr1(dd) <= -0.5 else 2 if jsr1(dd) >= 0.5 else 1
            marks.append([i, t, f"{f1(vv)} / {'—' if dd is None else spp(dd)}", lev * 3 + dr, None])
        else:
            txt, k = shown(i, t, rule, mode); marks.append([i, t, txt, k, f1(val(i, t, rule)) if ver == "k" else None])
    X["marks"] = sorted(marks)
    X["f2Title"] = f"{e['name']}: the gap every quarter, {LAB[0]} – {LAB[T]}, and the three outlook rules to {LAB[NT - 1]}"
    ends = [OUT[x][sel][HZ]["p"] for x in RL]
    X["f2Read"] = (f"{e['name']}: {f1(e['rows'][0]['gap'])} pp in {LAB[0]}, {f1(e['rows'][T]['gap'])} pp in {LAB[T]}. For {LAB[NT - 1]} the rules give {f1(ends[0])} (convergence), "
                   f"{f1(ends[1])} (no change) and {f1(ends[2])} pp (10-year trend); they differ by {f1(jsr1(max(ends)) - jsr1(min(ends)))} pp.")
    X["f2Ends"] = sorted(f"{RL[x][1]} {f1(OUT[x][sel][HZ]['p'])}" for x in RL)
    best = min(RL, key=lambda x: (BT[x]["mae"][HZ], ["conv", "naive", "trend"].index(x)))
    bias = lambda bv: "about right" if abs(bv) < 0.05 else f"{f1(abs(bv))} too {'low' if bv > 0 else 'high'}"
    X["skill"] = [["best" if x == best else "", RL[x][1], f1(BT[x]["mae"][4]), f1(BT[x]["mae"][8]), f1(BT[x]["mae"][HZ]), bias(BT[x]["bias"][HZ])] for x in RL]
    nb = BT["conv"]["n"]
    X["skillNote"] = (f"Average miss = mean of |actual gap − projected gap| over the 15 CMAs and every starting quarter from {LAB[WIN - 1]} on, using only the data up to that quarter "
                      f"({fint(nb[4])} projections 1 year ahead, {fint(nb[HZ])} for {HZ} quarters ahead, the last starting in {LAB[T - HZ]}). \"Too low\" means the rule projected a narrower gap than happened. "
                      f"Bold: the smallest miss {HZ} quarters ahead (" + ", ".join(f"{RL[x][1].lower()} {f2d(BT[x]['mae'][HZ])}" for x in RL) + " to two decimals). "
                      "\"No change\" is the yardstick: a rule that cannot clearly beat it adds little.")
    X["outTitle"] = f"Outlook for {LAB[NT - 1]}, sorted by the {RL[rule][1].lower()} rule (likely range in brackets)"
    rows = sorted(CMAS, key=lambda c: (-OUT[rule][c["id"]][HZ]["p"], c["name"]))
    X["out"] = [[c["id"], c["name"], f1(G[c["id"]][T])] + [f"{f1(OUT[x][c['id']][HZ]['p'])} ({f1(OUT[x][c['id']][HZ]['lo'])}–{f1(OUT[x][c['id']][HZ]['hi'])})" for x in RL] for c in rows]
    dark = lambda tt: sum(1 for c in CMAS if clsof(G[c["id"]][tt]) >= 4)
    wd = max(CMAS, key=lambda c: G[c["id"]][T]); pv = [OUT[rule][c["id"]][HZ]["p"] for c in CMAS]; now = [G[c["id"]][T] for c in CMAS]
    diffs = [(c, jsr1(max(OUT[x][c["id"]][HZ]["p"] for x in RL)) - jsr1(min(OUT[x][c["id"]][HZ]["p"] for x in RL))) for c in CMAS]
    dmax = next(dd for dd in diffs if dd[1] == max(x[1] for x in diffs))
    X["take"] = (f"Narrower overall, with setbacks. In {LAB[0]}, {dark(0)} of the {n} CMAs had a gap of 25 pp or more; in {LAB[T]}, {'none' if dark(T) == 0 else dark(T)} did, "
                 f"and the widest gap was {f1(G[wd['id']][T])} pp ({wd['name']}). Against a year earlier, though, the gap widened in {WIDn} of the {n} CMAs in {LAB[WIDt]}, the most of any quarter. "
                 f"On the {RL[rule][1].lower()} rule, the {LAB[NT - 1]} gaps would span {f1(min(pv))}–{f1(max(pv))} pp ({LAB[T]}: {f1(min(now))}–{f1(max(now))} pp); "
                 f"for one CMA the three rules differ by up to {f1(dmax[1])} pp ({dmax[0]['name']}), a reminder that the outlook is a projection.")
    mae = lambda x: f1(BT[x]["mae"][HZ])
    X["outCard"] = ("About the outlook\n"
                    f"Tested from {LAB[WIN - 1]} on, {HZ} quarters ahead the rules missed by {mae('conv')} pp (convergence), {mae('naive')} pp (no change) and {mae('trend')} pp (10-year trend) on average.\n"
                    "The rules know nothing about future policy, benefit rates, caseload growth or the economy; a change in either program would break them.\n"
                    f"They disagree most for {dmax[0]['name']}: {f1(dmax[1])} pp apart in {LAB[NT - 1]}.\n"
                    "A projected gap is not a target, and a narrower gap does not mean that needs converged.")
    return X


sys.stdout.reconfigure(encoding="utf-8", errors="replace")
pick = [a for a in sys.argv[1:] if a in FOLDERS] or list(FOLDERS)
ok_all = True
for ver in pick:
    folder = ROOT / "design" / "q2" / "variants" / FOLDERS[ver]
    dump = json.loads((folder / "browser-verification.json").read_text(encoding="utf-8"))
    results, mism = [], []
    for st in dump["states"]:
        X = expected(ver, st["query"]); got = dict(st); got["f2Ends"] = sorted(st["f2Ends"]); got["marks"] = sorted(st["marks"])
        got["skill"] = [[r[0].strip()] + r[1:] for r in st["skill"]]
        for key, v in X.items():
            if key == "card":
                for ck, cv in v.items():
                    ok = got["card"][ck] == cv; results.append(ok)
                    if not ok: mism.append({"state": st["query"], "field": "card." + ck, "page": got["card"][ck], "expected": cv})
            else:
                pv = got[key]
                if key == "outCard": pv = "\n".join(s.strip() for s in pv.split("\n") if s.strip())
                ok = pv == v; results.append(ok)
                if not ok: mism.append({"state": st["query"], "field": key, "page": pv if key != "marks" else [m for m in pv if m not in v][:5], "expected": v if key != "marks" else [m for m in v if m not in pv][:5]})
    if ver in ("l", "m", "n"):  # heights on one scale; M: footprints = average single-person cases (OW + ODSP), areas proportional
        WGT = {c["id"]: statistics.fmean(r["owF"] + r["odF"] for r in c["rows"]) for c in CMAS}
        for st in dump["states"]:  # pixel height ÷ the exact recomputed gap must be one constant (z is printed to 0.01 px)
            qp = dict(kv.split("=") for kv in st["query"].split("&")); tq = LAB.index(qp["t"][:4] + " " + qp["t"][4:]) if "t" in qp else 0; rq = qp.get("rule", "conv")
            ratios = [z / val(i, tq, rq) for i, z, h, a, w in st["blk"]]; mz = statistics.median(ratios)
            ok = len(st["blk"]) == 15 and all(abs(r - mz) <= 0.001 * mz for r in ratios); results.append(ok)
            if not ok: mism.append({"state": st["query"], "field": "heights not proportional to the gap", "page": ratios, "expected": mz})
            if ver == "m":
                ws = {i: w for i, z, h, a, w in st["blk"]}; ar = {i: a for i, z, h, a, w in st["blk"]}
                okw = all(ws[i] == int(_q(WGT[i], 0)) for i in WGT); results.append(okw)
                if not okw: mism.append({"state": st["query"], "field": "footprint weights", "page": ws, "expected": {i: int(_q(WGT[i], 0)) for i in WGT}})
                k = [ar[i] / WGT[i] for i in WGT]; oka = max(k) / min(k) - 1 < 1e-4; results.append(oka)
                if not oka: mism.append({"state": st["query"], "field": "footprint area not proportional to weight", "page": k, "expected": "constant"})
    n_marks = sum(len(s["marks"]) for s in dump["states"])
    summary = {"version": ver, "states": len(dump["states"]), "fields": len(results), "marks_compared": n_marks, "mismatches": len(mism),
               "widest_widening": [LAB[WIDt], WIDn], "mae_19q": {x: round(BT[x]["mae"][HZ], 4) for x in RL}}
    (folder / "verification.json").write_text(json.dumps({"summary": summary, "mismatches": mism}, indent=1, ensure_ascii=False), encoding="utf-8")
    print(json.dumps(summary, ensure_ascii=False))
    for m in mism[:6]: print("  MISMATCH", json.dumps(m, ensure_ascii=False)[:700])
    ok_all = ok_all and not mism
sys.exit(0 if ok_all else 1)
