"""Independent recomputation of every unemployment number shown by the Q3 extra version.

Usage (from the repository root, after verify_browser.py has written browser-verification.json):
    python design/q3/unemployment-prototype/verify.py

Standard library only (csv, statistics): the page computes in JavaScript (d3), this script recomputes from the
same CSV files in Python with its own code; Spearman uses statistics.correlation(method="ranked").
(pandas is the usual tool in tools/verify_q*.py, but it was blocked by Windows Application Control on the
machine where this version was built, so this check avoids compiled packages.)
Writes verification.json next to this file and exits non-zero on any mismatch.
"""
import csv, json, pathlib, re, statistics as stt, sys
from datetime import date

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parents[2]
SA = ROOT / "datasets/ONT-SA/selected"
UR_CSV = HERE.parent / "data/1410045901_databaseLoadingData.csv"
SHORT = {"505": "Ottawa", "539": "Niagara", "541": "Kitchener–Waterloo", "580": "Sudbury"}
MON = "Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split()

checks, fails = [], []


def check(what, got, want):
    ok = got == want
    checks.append({"what": what, "page": got, "python": want, "ok": ok})
    if not ok:
        fails.append(checks[-1])


f1 = lambda v: f"{v:.1f}"
sg2 = lambda v: ("+" if v > 0 else "−" if v < 0 else "") + f"{abs(v):.2f}"

# ---------- data ----------
ow = list(csv.DictReader(open(SA / "ont-sa-characteristic-ow-cma.csv", encoding="utf-8")))
ont = list(csv.DictReader(open(SA / "ont-sa-characteristic-ow-ont.csv", encoding="utf-8")))
urr = list(csv.DictReader(open(UR_CSV, encoding="utf-8")))
qkey = lambda r: (int(r["year"]), int(r["quarter"]))
qlabel = lambda k: f"{k[0]} Q{k[1]}"
qmonth = lambda r: f"{int(r['year'])}-{int(r['month']):02d}"   # OW quarters are dated by their last month
NAME = {}
OWQ = {}
for r in ow:
    code, nm = r["cma"].split(" - ", 1)
    NAME[code] = nm.replace("--", "–")
    OWQ.setdefault(code, {})[qkey(r)] = (float(r["moa19"]), float(r["cases"]), qmonth(r))
CODES = sorted(NAME)
ONTQ = {qkey(r): (float(r["moa19"]), float(r["cases"]), r["covid_period"]) for r in ont}
QS = sorted(ONTQ)

# CSV integrity: the file rebuilt from the StatCan API matches the teammate's download
geos = {r["GEO"] for r in urr}; months = sorted({r["REF_DATE"] for r in urr})
check("UR csv rows", len(urr), 3420); check("UR csv areas", len(geos), 18)
check("UR csv months", (len(months), months[0], months[-1]), (190, "2011-01", "2026-10"))
check("UR csv one measure", {(r["Labour force characteristics"], r["Statistics"], r["Data type"]) for r in urr},
      {("Unemployment rate", "Estimate", "Seasonally adjusted")})
SPOT = {  # values read from the teammate's file 1410045901_databaseLoadingData-2.csv (2026-11-18)
    ("Ottawa-Gatineau, Ontario part, Ontario/Quebec", "2011-01"): "6.6", ("Ottawa-Gatineau, Ontario part, Ontario/Quebec", "2020-06"): "10.0",
    ("Toronto, Ontario", "2020-07"): "15.1", ("Windsor, Ontario", "2020-05"): "17.5", ("Belleville - Quinte West, Ontario", "2018-03"): "0.7",
    ("Guelph, Ontario", "2019-02"): "2.1", ("Barrie, Ontario", "2021-01"): "13.3", ("Thunder Bay, Ontario", "2026-10"): "3.6",
    ("Kitchener-Cambridge-Waterloo, Ontario", "2026-04"): "9.0", ("Peterborough, Ontario", "2023-09"): "2.9"}
byk = {(r["GEO"], r["REF_DATE"]): r["VALUE"] for r in urr}
for k, v in SPOT.items():
    check(f"UR csv value {k}", byk.get(k), v)

dg = lambda c: "2021S050535505" if c == "505" else "2021S0503" + c   # Ottawa = Ontario part
UR = {c: {r["REF_DATE"]: float(r["VALUE"]) for r in urr if r["DGUID"] == dg(c)} for c in CODES}
check("UR series for all 15 OW CMAs", sorted(c for c in CODES if len(UR[c]) == 190), CODES)
URQS = [q for q in QS if all(OWQ[c][q][2] in UR[c] for c in CODES)]


def mlabel(ym):
    y, m = ym.split("-"); return f"{MON[int(m) - 1]} {y}"


def period_range(query):
    p = dict(kv.split("=") for kv in query.split("&"))
    if "from" in p:
        f = lambda s: (int(s[:4]), int(s[-1]))
        return f(p["from"]), f(p["to"])
    per = p.get("period", "post")
    if per == "latest": return QS[-1], QS[-1]
    if per == "all": return QS[0], QS[-1]
    qs = [q for q in QS if ONTQ[q][2] == per]
    return qs[0], qs[-1]


def stats(rng):
    a, b = rng
    qs = [q for q in URQS if a <= q <= b]
    total = len([q for q in QS if a <= q <= b])
    if not qs:
        return {"n": 0, "total": total}
    out = {"n": len(qs), "total": total, "range": f"{qlabel(qs[0])} – {qlabel(qs[-1])}" if qs[0] != qs[-1] else qlabel(qs[0]), "cma": {}}
    for c in CODES:
        lt = sum(OWQ[c][q][0] for q in qs); cs = sum(OWQ[c][q][1] for q in qs)
        out["cma"][c] = {"ur": stt.fmean(UR[c][OWQ[c][q][2]] for q in qs), "share": lt / cs * 100}
    for c, d in out["cma"].items():
        d["rank"] = 1 + sum(o["ur"] > d["ur"] for o in out["cma"].values())
        d["tie"] = any(o is not d and o["ur"] == d["ur"] for o in out["cma"].values())
    out["ont"] = sum(ONTQ[q][0] for q in qs) / sum(ONTQ[q][1] for q in qs) * 100
    out["rho"] = stt.correlation([out["cma"][c]["ur"] for c in CODES], [out["cma"][c]["share"] for c in CODES], method="ranked")
    return out


P3 = {p: stats(period_range(f"period={p}")) for p in ("pre", "during", "post")}
dump = json.load(open(HERE / "browser-verification.json", encoding="utf-8"))
code_of = {v: k for k, v in NAME.items()}

for s in dump["states"]:
    q = s["query"]; st = stats(period_range(q)); T = f"[{q}] "
    if st["n"] == 0:
        check(T + "no-data message", bool(s["f5aNodata"]) and "starts in Jan 2011" in s["f5aNodata"], True)
        check(T + "card no-data", "No unemployment data" in s["cardUR"], True)
        continue
    # Figure 5a: one aria-label per dot carries the plotted values
    rx = re.compile(r"^(.+?): average unemployment rate ([\d.]+)%, rank (\d+) of 15; long-term share ([\d.]+)%; (.+)\.$")
    seen = set()
    for lab in s["f5aHits"]:
        m = rx.match(lab); c = code_of[m.group(1)]; d = st["cma"][c]; seen.add(c)
        check(T + f"5a {c} ur/rank/share/range", (m.group(2), int(m.group(3)), m.group(4), m.group(5)), (f1(d["ur"]), d["rank"], f1(d["share"]), st["range"]))
    check(T + "5a all 15 dots", sorted(seen), CODES)
    check(T + "5a Ontario line", s["f5aOntario"], [f"Ontario {f1(st['ont'])}%"])
    note_want = f"Both axes use the same quarters: {st['range']} ({st['n']} quarter{'s' if st['n'] != 1 else ''})" + (
        f"; unemployment data start in Jan 2011, so the period's {st['total'] - st['n']} earlier quarters are left out" if st["n"] < st["total"] else "")
    check(T + "5a note window", s["f5aNote"].split(". Unemployment rate")[0], note_want)
    m = re.search(r"before the pandemic ([+−]?[\d.]+) · during the pandemic ([+−]?[\d.]+) · after the pandemic ([+−]?[\d.]+)", s["f5aTake"])
    check(T + "5a rho before/during/after", m.groups(), tuple(sg2(P3[p]["rho"]) for p in ("pre", "during", "post")))
    if "selected period" in s["f5aTake"]:
        check(T + "5a rho selected", re.search(r"selected period ([+−]?[\d.]+)", s["f5aTake"]).group(1), sg2(st["rho"]))
    signs = {(round(P3[p]["rho"] * 100) > 0) - (round(P3[p]["rho"] * 100) < 0) for p in P3}
    check(T + "5a direction sentence", "direction changes" in s["f5aTake"], len(signs) > 1)
    check(T + "5a before window", f"(before = {P3['pre']['range']} only)" in s["f5aTake"], True)
    # Figure 2b card, unemployment block
    c = code_of[s["card"]]; d = st["cma"][c]
    rows = s["cardUR"].split("\n")
    v = lambda label: rows[[i for i, r in enumerate(rows) if r.startswith(label)][0] + 1]
    check(T + f"card {c} average", v("Average unemployment rate"), f"{f1(d['ur'])}%")
    check(T + f"card {c} rank", v("Rank among 15 CMAs"), f"{d['rank']}{' (tied)' if d['tie'] else ''} of 15")
    if st["n"] < st["total"]:
        check(T + f"card {c} window", f"Average unemployment rate, {st['range']}" in s["cardUR"], True)
        check(T + f"card {c} share same quarters", v("Long-term share, same quarters"), f"{f1(d['share'])}%")
        check(T + f"card {c} quarters", f"uses {st['n']} of the period's {st['total']} quarters" in s["cardUR"], True)
    check(T + "card Ottawa note", "Ontario part of Ottawa–Gatineau" in s["cardUR"], c == "505")
    # Figure 5b
    check(T + "5b title", s["f5bTitle"], f"{NAME[c]}{' (Ontario part)' if c == '505' else ''}: unemployment rate vs the other 14 CMAs")
    check(T + "5b months + window", (s["f5bNote"].split(";")[0], f"({st['range']})" in s["f5bNote"], f"({qlabel(QS[-1])})" in s["f5bNote"]),
          (f"Monthly, {mlabel(months[0])} – {mlabel(months[-1])}", True, True))
    check(T + "5b end label", s["f5bEnd"], [f"{SHORT.get(c, NAME[c])} {f1(UR[c][months[-1]])}%"])
    check(T + "5b other lines", s["f5bOthers"], 14)
    # Step 3 bullets
    m = re.search(r"was ([+−]?[\d.]+) before, ([+−]?[\d.]+) during and ([+−]?[\d.]+) after the pandemic", s["cards"])
    check(T + "step 3 rho", m.groups(), tuple(sg2(P3[p]["rho"]) for p in ("pre", "during", "post")))
    top = max(P3["post"]["cma"], key=lambda k: P3["post"]["cma"][k]["share"]); t = P3["post"]["cma"][top]
    want = (f"Why {NAME[top]} had the highest long-term share after the pandemic ({f1(t['share'])}%) {'while' if t['rank'] > 5 else 'and'} "
            f"its unemployment rate ranked {t['rank']}{' (tied)' if t['tie'] else ''} of 15 ({f1(t['ur'])}%; Figure 5a).")
    check(T + "step 3 worth investigating", want in s["cards"], True)

res = {"compared": len(checks), "mismatches": len(fails), "failures": fails,
       "rho": {p: round(P3[p]["rho"], 4) for p in P3}, "windows": {p: P3[p]["range"] for p in P3}}
(HERE / "verification.json").write_text(json.dumps(res, indent=1, ensure_ascii=False), encoding="utf-8")
print(f"{len(checks)} checks, {len(fails)} mismatches; rho {res['rho']}; windows {res['windows']}")
for f in fails:
    print("MISMATCH", f)
sys.exit(1 if fails else 0)
