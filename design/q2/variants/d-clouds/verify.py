"""Independent number check for Q2 extra version D (Python standard library only; no pandas, no JS).

Run verify_browser.py first: it dumps every displayed text of 11 page states to browser-verification.json.
This script recomputes each of them from the four course CSVs and compares the exact strings
(formatting mirrors d3.format: half-up rounding of the exact binary value, U+2212 minus).

    python design/q2/variants/d-clouds/verify.py
"""
import csv, json, math, pathlib, statistics, sys
from decimal import Decimal, ROUND_HALF_UP

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parents[3]
SEL = ROOT / "datasets" / "ONT-SA" / "selected"
MINUS = "−"


# ---------- formatting, as d3.format / the page ----------
def _q(x, p):
    return Decimal(abs(x)).quantize(Decimal(1).scaleb(-p), rounding=ROUND_HALF_UP)


def f1(x):
    v = _q(x, 1); return (MINUS if x < 0 and v != 0 else "") + str(v)


def fint(x):
    v = int(_q(x, 0)); return (MINUS if x < 0 and v != 0 else "") + f"{v:,}"


def jsround1(v):  # Math.round(v * 10) / 10
    return math.floor(v * 10 + 0.5) / 10


def spp(v):
    r = jsround1(v); return ("+" if r > 0 else MINUS if r < 0 else "±") + f1(abs(v))


pct = lambda v: f1(v) + "%"
pp = lambda v: f1(v) + " pp"
s2 = lambda v: ("+" if v >= 0 else MINUS) + str(_q(v, 2))


# ---------- data, as shared/q2-common.js ----------
SHORT = {"Kitchener–Cambridge–Waterloo": "Kitchener–C–W", "St. Catharines–Niagara": "St. Cath.–Niagara", "Greater Sudbury": "Sudbury"}


def read(fn):
    with open(SEL / fn, encoding="utf-8") as f:
        return list(csv.DictReader(f))


def build():
    ow = read("ont-sa-characteristic-ow-cma.csv") + read("ont-sa-characteristic-ow-ont.csv")
    od = read("ont-sa-characteristic-odsp-cma.csv") + read("ont-sa-characteristic-odsp-ont.csv")
    key = lambda r: ((r.get("cma") or "ont") or "ont", r["year"], r["month"])
    odby = {key(r): r for r in od}
    ents = {}
    for r in ow:
        k = key(r); o = odby[k]
        ents.setdefault(k[0], []).append({
            "year": int(r["year"]), "month": int(r["month"]), "quarter": int(r["quarter"]), "label": f"{r['year']} Q{r['quarter']}",
            "owC": float(r["cases"]), "owF": float(r["fts"]), "odC": float(o["cases"]), "odF": float(o["fts"])})
    out = []
    for k, rows in ents.items():
        rows.sort(key=lambda d: (d["year"], d["month"]))
        for i, d in enumerate(rows):
            d["i"] = i; d["sow"] = 100 * d["owF"] / d["owC"]; d["sod"] = 100 * d["odF"] / d["odC"]; d["gap"] = d["sod"] - d["sow"]
        ont = k == "ont"
        name = "Ontario (all)" if ont else k.split(" - ")[1].replace("--", "–")
        out.append({"id": "ont" if ont else k.split(" - ")[0], "name": name, "short": "Ontario" if ont else SHORT.get(name, name), "ont": ont, "rows": rows})
    ONT = next(e for e in out if e["ont"]); CMAS = sorted([e for e in out if not e["ont"]], key=lambda e: e["id"])
    return ONT, CMAS


ONT, CMAS = build()
ALL = [ONT] + CMAS
BY = {e["id"]: e for e in ALL}
QS = ONT["rows"]; N = len(QS)
assert all(len(c["rows"]) == N and all((a["year"], a["month"]) == (b["year"], b["month"]) for a, b in zip(c["rows"], QS)) for c in CMAS)
I19 = next(r["i"] for r in QS if r["label"] == "2019 Q4"); I23 = next(r["i"] for r in QS if r["label"] == "2023 Q1")
PRESET = {"all": (0, N - 1), "pre": (0, I19), "during": (I19, I23), "post": (I23, N - 1)}
PH = {"pre": ("Before", "before the pandemic"), "during": ("During", "during the pandemic"), "post": ("After", "after the pandemic")}


def ssum(e, i0, i1):
    a, z = e["rows"][i0], e["rows"][i1]
    widen = sum(1 for i in range(i0 + 1, i1 + 1) if e["rows"][i]["gap"] > e["rows"][i - 1]["gap"])
    return {"e": e, "a": a, "z": z, "g0": a["gap"], "g1": z["gap"], "nar": a["gap"] - z["gap"], "dOW": z["sow"] - a["sow"], "dOD": z["sod"] - a["sod"], "widen": widen, "steps": i1 - i0}


def ranked(ents, i0, i1):
    return sorted((ssum(e, i0, i1) for e in ents), key=lambda s: (-s["nar"], s["e"]["name"]))


def segments(i0, i1):
    cuts = [i0] + [c for c in (I19, I23) if i0 < c < i1] + [i1]
    return [{"a": cuts[k], "b": b, "ph": "pre" if b <= I19 else "during" if b <= I23 else "post"} for k, b in enumerate(cuts[1:])]


# whole-period facts (story steps, lead, h1)
R = ranked(CMAS, 0, N - 1); n = len(CMAS)
top, second, third, least = R[0], R[1], R[2], R[-1]
allNarrow = all(r["nar"] > 0 for r in R)
dOW = (min(r["dOW"] for r in R), max(r["dOW"] for r in R)); dOD = (min(r["dOD"] for r in R), max(r["dOD"] for r in R))
odMax = max(R, key=lambda r: r["dOD"]); odFell = sorted([r for r in R if r["dOD"] < 0], key=lambda r: r["dOD"])
widen = (min(r["widen"] for r in R), max(r["widen"] for r in R)); endWidest = max(R, key=lambda r: r["g1"])
phase = []
for r in R:
    sg = [(g, r["e"]["rows"][g["a"]]["gap"] - r["e"]["rows"][g["b"]]["gap"]) for g in segments(0, N - 1)]
    phase.append({"e": r["e"], "pre": sg[0][1], "during": sg[1][1], "post": sg[2][1]})
preLargest = sum(1 for p in phase if p["pre"] > p["during"] and p["pre"] > p["post"])
durWiden = sorted([p for p in phase if p["during"] < 0], key=lambda p: p["during"])
postNarrow = sum(1 for p in phase if p["post"] > 0)
SEGS = [(QS[g["a"]]["label"], QS[g["b"]]["label"]) for g in segments(0, N - 1)]
cells = [(c, r) for c in CMAS for r in c["rows"]]; odAbove = sum(1 for c, r in cells if r["sod"] > r["sow"])
o = ssum(ONT, 0, N - 1)

# the clouds (this version only)
YEARS = [r["i"] for r in QS if r["quarter"] == 1]
space = []
for q in QS:
    i = q["i"]; mo = max(c["rows"][i]["sow"] for c in CMAS); md = min(c["rows"][i]["sod"] for c in CMAS)
    space.append({"i": i, "label": q["label"], "space": md - mo, "medOW": statistics.median(c["rows"][i]["sow"] for c in CMAS), "medOD": statistics.median(c["rows"][i]["sod"] for c in CMAS)})
sep = sum(1 for s in space if s["space"] > 0)
first, last = space[YEARS[0]], space[YEARS[-1]]
minSpace = min(space, key=lambda s: s["space"])
rising = sum(1 for r in R if r["dOW"] > 0 and r["nar"] > 0)


def lead():
    return (f"From {QS[0]['label']} to {QS[-1]['label']}, the share of cases that are a single person without children rose in both programs across Ontario: "
            f"OW {pct(o['a']['sow'])} → {pct(o['z']['sow'])}, ODSP {pct(o['a']['sod'])} → {pct(o['z']['sod'])}. "
            f"The gap between the programs went from {f1(o['g0'])} to {f1(o['g1'])} percentage points. "
            f"It was smaller at the end than at the start in {'all ' + str(n) if allNarrow else str(sum(r['nar'] > 0 for r in R)) + ' of ' + str(n)} CMAs: by the most in {top['e']['name']} "
            f"({f1(top['g0'])} → {f1(top['g1'])}), by the least in {least['e']['name']} ({f1(least['g0'])} → {f1(least['g1'])}).")


def story(step):
    if step == 1:
        return (f"Both shares rose; the gap was smaller at the end everywhere. Across Ontario the OW share rose {spp(o['dOW'])} pp and the ODSP share {spp(o['dOD'])} pp, "
                f"so the gap went from {f1(o['g0'])} to {f1(o['g1'])} pp. The ODSP share was above the OW share in {'every' if odAbove == len(cells) else f'{odAbove} of {len(cells)}'} CMA-quarter, so the gap never reversed.")
    if step == 2:
        return (f"{top['e']['name']} narrowed the most: {f1(top['g0'])} → {f1(top['g1'])} pp ({f1(top['nar'])} pp). "
                f"Next were {second['e']['name']} ({f1(second['nar'])}) and {third['e']['name']} ({f1(third['nar'])}). {least['e']['name']} narrowed the least "
                f"({f1(least['g0'])} → {f1(least['g1'])}, {f1(least['nar'])} pp){' and had the widest gap in ' + QS[-1]['label'] if endWidest['e'] is least['e'] else ''}.")
    if step == 3:
        s = (f"Most of the change came from OW. Across CMAs the OW share rose {f1(dOW[0])} to {f1(dOW[1])} pp, while the ODSP share changed "
             f"{spp(dOD[0])} to {spp(dOD[1])} pp. Even in {odMax['e']['name']}, where the ODSP share rose most ({spp(odMax['dOD'])}), the OW share rose more ({spp(odMax['dOW'])}).")
        if odFell: s += " In " + " and ".join(f"{r['e']['name']} ({spp(r['dOD'])})" for r in odFell) + " the ODSP share fell slightly."
        return s
    if step == 4:
        s = (f"Smaller by the end does not mean smaller every quarter. Each CMA's gap widened in {widen[0]}–{widen[1]} of its {N - 1} quarter-to-quarter changes. "
             f"{'In every CMA most' if preLargest == n else f'In {preLargest} CMAs most'} of the narrowing happened before the pandemic ({SEGS[0][0]} – {SEGS[0][1]}). ")
        if durWiden: s += f"During it ({SEGS[1][0]} – {SEGS[1][1]}) the gap widened in " + " and ".join(f"{p['e']['name']} ({spp(-p['during'])} pp)" for p in durWiden) + "; "
        return s + f"after it ({SEGS[2][0]} – {SEGS[2][1]}) it narrowed in {'every CMA' if postNarrow == n else f'{postNarrow} of {n} CMAs'}."
    return "Explore freely: choose any start and end quarter, select a CMA, and hover or tap for exact shares and case counts."


def hint(step, sel, i0, i1):
    e = BY[sel]
    if step == 1:
        return (f"In Figure 1a the blue cloud rises much more than the orange one, so the space between them shrinks from {f1(first['space'])} pp ({first['label']}) to "
                f"{f1(last['space'])} pp ({last['label']}). The zipper with hollow markers is Ontario as a whole.")
    if step == 2:
        return f"The zipper is {e['name']}; the other CMAs named above are outlined in Figure 1a and darker in Figure 2."
    if step == 3:
        return (f"Follow {e['name']}'s zipper: its upper (ODSP) thread rises too, but its lower (OW) thread rises more, so the teeth get shorter."
                if odMax["dOD"] > 0 and odMax["dOW"] > odMax["dOD"] else f"The zipper is {e['name']}.")
    if step == 4:
        return (f"The period is now {QS[i0]['label']} → {QS[i1]['label']}. Figure 1b shows {e['name']}"
                + (': its "During" bar is on the widened side' if durWiden and durWiden[0]["e"] is e else "") + ".")
    return None


def state_of(query):
    p = dict(kv.split("=") for kv in query.split("&"))
    step, i0, i1, sel, hl = 1, 0, N - 1, "ont", []
    def set_step(sid):
        nonlocal step, i0, i1, sel, hl
        step = sid
        if sid == 1: i0, i1, sel, hl = 0, N - 1, "ont", []
        elif sid == 2: i0, i1, sel, hl = 0, N - 1, top["e"]["id"], [r["e"]["id"] for r in (top, second, third, least)]
        elif sid == 3: i0, i1, sel, hl = 0, N - 1, odMax["e"]["id"], [r["e"]["id"] for r in [odMax] + odFell]
        elif sid == 4: i0, i1, sel, hl = I19, I23, (durWiden[0]["e"]["id"] if durWiden else top["e"]["id"]), [q["e"]["id"] for q in durWiden]
        else: hl = []
    if "step" in p: set_step(int(p["step"]))
    if any(k in p for k in ("start", "end", "period")):
        if p.get("period") in PRESET: i0, i1 = PRESET[p["period"]]
        at = lambda v: next((r["i"] for r in QS if r["label"].replace(" ", "") == v), -1)
        if at(p.get("start", "")) >= 0: i0 = at(p["start"])
        if at(p.get("end", "")) >= 0: i1 = at(p["end"])
        if i1 <= i0: i0, i1 = 0, N - 1
        if "step" not in p: step = 0
    if p.get("cma") in BY:
        sel = p["cma"]
        if "step" not in p: step = 0
    return step, i0, i1, sel, hl


def chg(v):
    return "did not change" if abs(v) < 0.05 else f"{'rose' if v > 0 else 'fell'} {f1(abs(v))} pp"


def expected(query):
    step, i0, i1, sel, hl = state_of(query)
    e = BY[sel]; a, z = QS[i0]["label"], QS[i1]["label"]
    s = ssum(e, i0, i1); RR = ranked(CMAS, i0, i1); rank = next(k for k, r in enumerate(RR) if r["e"]["id"] == sel) + 1 if not e["ont"] else None
    X = {}
    X["h1"] = f"Two clouds: OW climbed toward ODSP in {'every CMA' if rising == n else f'{rising} of {n} CMAs'}"
    X["lead"] = lead()
    h = hint(step, sel, i0, i1)
    X["story"] = story(step) + (" " + h if h else "")
    dMOW, dMOD = last["medOW"] - first["medOW"], last["medOD"] - first["medOD"]
    X["f1Take"] = (f"The clouds never overlap. In {'all ' + str(len(space)) if sep == len(space) else f'{sep} of {len(space)}'} quarters the lowest ODSP share among the {n} CMAs was above the highest OW share. "
                   f"The space between the clouds went from {f1(first['space'])} pp in {first['label']} to {f1(last['space'])} pp in {last['label']}"
                   + (f" (narrowest: {f1(minSpace['space'])} pp in {minSpace['label']})" if minSpace["i"] != last["i"] else "")
                   + (", mostly because the OW cloud rose" if dMOW > 2 * abs(dMOD) else "")
                   + f": the median CMA's OW share went from {pct(first['medOW'])} to {pct(last['medOW'])}, its ODSP share from {pct(first['medOD'])} to {pct(last['medOD'])}.")
    X["f1Title"] = f"Share of cases that are a single person without children, OW (blue) and ODSP (orange): every CMA, every year (first quarter), {QS[YEARS[0]]['year']}–{QS[YEARS[-1]]['year']}"
    X["gutter"] = [f"{f1(first['space'])} pp", f"{f1(last['space'])} pp"]
    lr = e["rows"][YEARS[-1]]
    X["zlbl"] = [f"{e['short']}{f1(lr['gap'])} pp, {QS[YEARS[-1]]['label']}"]
    stats = [["Gap", f"{f1(s['g0'])} → {f1(s['g1'])} pp"], ["Narrowed by" if s["nar"] >= 0 else "Widened by", pp(abs(s["nar"]))]]
    stats.append(["Rank by narrowing", "reference, not ranked" if e["ont"] else f"{rank} of {len(RR)}"])
    stats += [["OW share", f"{f1(s['a']['sow'])} → {pct(s['z']['sow'])} ({spp(s['dOW'])})"], ["ODSP share", f"{f1(s['a']['sod'])} → {pct(s['z']['sod'])} ({spp(s['dOD'])})"],
              ["Gap widened in", f"{s['widen']} of {s['steps']} changes"], [f"OW cases, {z}", fint(s["z"]["owC"])], [f"ODSP cases, {z}", fint(s["z"]["odC"])]]
    bars = ["← widened", "narrowed →"]
    for g in segments(i0, i1):
        v = e["rows"][g["a"]]["gap"] - e["rows"][g["b"]]["gap"]
        bars += [PH[g["ph"]][0], f"{'no change' if abs(v) < 0.05 else 'narrowed' if v > 0 else 'widened'} {f1(abs(v))}"]
    X["card"] = {"mode": "Figure 1b · Ontario as a whole (reference)" if e["ont"] else "Figure 1b · Selected CMA", "name": e["name"],
                 "per": f"{a} → {z} · {s['steps']} quarterly changes", "stats": stats,
                 "warn": (f"Small caseload ({fint(s['z']['owC'])} OW cases in {z}): its shares move more from quarter to quarter, so single quarters are less reliable."
                          if not e["ont"] and s["z"]["owC"] < 3000 else None),
                 "bars": bars,
                 "sum": f"{'Narrowed' if s['nar'] >= 0 else 'Widened'} by {f1(abs(s['nar']))} pp: the OW share {chg(s['dOW'])} and the ODSP share {chg(s['dOD'])}."
                        + (" The change came mostly from the OW share." if s["nar"] > 0 and s["dOW"] > 0 and abs(s["dOD"]) < s["dOW"] / 4 else "")}
    X["f2Title"] = f"Every CMA's gap at the start and end of the period, {a} → {z}: the steeper a line falls, the more the gap narrowed"
    rows = {x["id"]: ssum(x, i0, i1) for x in ALL}
    X["f2L"] = sorted([x["id"], f"{x['short']} {f1(rows[x['id']]['g0'])}"] for x in ALL)
    X["f2R"] = sorted([x["id"], f"{f1(rows[x['id']]['g1'])} {x['short']}"] for x in ALL)
    e0 = (min(r["g0"] for r in RR), max(r["g0"] for r in RR)); e1 = (min(r["g1"] for r in RR), max(r["g1"] for r in RR))
    rho = statistics.correlation([r["g0"] for r in RR], [r["nar"] for r in RR], method="ranked")
    nw = lambda r: f"{'narrowed' if r['nar'] >= 0 else 'widened'} {f1(abs(r['nar']))} pp"
    X["f2Read"] = (f"{a} → {z}: the {n} CMAs' gaps spanned {f1(e0[0])}–{f1(e0[1])} pp at the start and {f1(e1[0])}–{f1(e1[1])} pp at the end "
                   f"(a range of {f1(jsround1(e0[1]) - jsround1(e0[0]))} pp, then {f1(jsround1(e1[1]) - jsround1(e1[0]))} pp). {RR[0]['e']['name']} {nw(RR[0])}, the most; {RR[-1]['e']['name']} {nw(RR[-1])}, the least. "
                   f"Rank correlation between the start gap and the narrowing: {s2(rho)}" + ((": CMAs with wider gaps at the start narrowed more." if rho > 0 else ": CMAs with wider gaps at the start narrowed less.") if abs(rho) >= 0.5 else "."))
    zid = sel; hlset = sorted(set(hl) - {zid})
    X["hlDots"] = hlset
    X["f2Classes"] = {x["id"]: sorted(["sl"] + (["ont"] if x["ont"] else []) + (["on"] if x["id"] == sel else ["hl"] if x["id"] in hl else [])) for x in ALL}
    trows = [ssum(ONT, i0, i1)] + RR
    X["table"] = [[r["e"]["id"], r["e"]["name"], f1(r["a"]["sow"]), f1(r["z"]["sow"]), spp(r["dOW"]), f1(r["a"]["sod"]), f1(r["z"]["sod"]), spp(r["dOD"]),
                   f1(r["g0"]), f1(r["g1"]), spp(r["nar"]), fint(r["z"]["owC"]), fint(r["z"]["odC"])] for r in trows]
    X["tableHead"] = ["Area", a, z, "Change", a, z, "Change", a, z, "Narrowed by", "OW", "ODSP"]
    X["period"] = [str(i0), str(i1)]
    return X


dump = json.loads((HERE / "browser-verification.json").read_text(encoding="utf-8"))
results, mism = [], []
for st in dump["states"]:
    X = expected(st["query"])
    got = dict(st)
    got["f2L"] = sorted(st["f2L"]); got["f2R"] = sorted(st["f2R"])
    got["f2Classes"] = {k: sorted(v.split()) for k, v in st["f2Classes"].items()}
    for k, v in X.items():
        if k == "card":
            for ck, cv in v.items():
                ok = got["card"][ck] == cv
                results.append({"state": st["query"], "field": "card." + ck, "ok": ok})
                if not ok: mism.append({"state": st["query"], "field": "card." + ck, "page": got["card"][ck], "expected": cv})
        else:
            ok = got[k] == v
            results.append({"state": st["query"], "field": k, "ok": ok})
            if not ok: mism.append({"state": st["query"], "field": k, "page": got[k], "expected": v})

# claims written as facts on the page (checked on the data, not only as strings)
facts = {
    "clouds separated in every quarter": sep == len(space),
    "space 2003 Q1 → 2026 Q1 shrank": first["space"] > last["space"],
    "OW median rose more than twice the ODSP median change": (last["medOW"] - first["medOW"]) > 2 * abs(last["medOD"] - first["medOD"]),
    "OW share rose and gap narrowed in every CMA (h1)": rising == n,
    "every CMA-quarter has ODSP share above OW share": odAbove == len(cells),
}
n_cells = sum(len(st["table"]) * len(st["table"][0]) for st in dump["states"])
summary = {"states": len(dump["states"]), "fields": len(results), "mismatches": len(mism), "table_cells_compared": n_cells, "facts": facts,
           "space_first": [first["label"], round(first["space"], 4)], "space_last": [last["label"], round(last["space"], 4)],
           "space_min": [minSpace["label"], round(minSpace["space"], 4)]}
(HERE / "verification.json").write_text(json.dumps({"summary": summary, "mismatches": mism, "results": results}, indent=1, ensure_ascii=False), encoding="utf-8")
print(json.dumps(summary, indent=1, ensure_ascii=False))
for m in mism[:20]:
    print("MISMATCH", json.dumps(m, ensure_ascii=False)[:900])
sys.exit(0 if not mism and all(facts.values()) else 1)
