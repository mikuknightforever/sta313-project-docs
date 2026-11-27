"""Independent number check for the Q3 block versions (Python standard library only; no pandas, no JS).

Run tools/check_q3_blocks.py first: it writes browser-verification.json in each version folder. This script recomputes
from the OW CSVs, for every dumped state, each CMA's pooled long-term share, Ontario's share, the difference, its colour
class, the average caseload and the rank, and compares them with every block's data, its accessible label, the visible
labels and the period text. It also checks that heights are on one scale (A: height ∝ difference, sunk when lower;
B: height ∝ share) and that B's footprints are exactly proportional to average caseload.

    python tools/verify_q3_blocks.py          # both
    python tools/verify_q3_blocks.py a
"""
import csv, json, math, pathlib, statistics, sys
from decimal import Decimal, ROUND_HALF_UP

ROOT = pathlib.Path(__file__).resolve().parents[1]
SEL = ROOT / "datasets" / "ONT-SA" / "selected"
FOLDERS = {"a": ("blocks-tiles", True), "b": ("blocks-treemap", False)}
MINUS = "−"
SHORT = {"505": "Ottawa", "539": "Niagara", "541": "Kitchener–Waterloo", "580": "Sudbury"}
PHRASE = {"latest": "in the latest quarter", "post": "after the pandemic", "during": "during the pandemic", "pre": "before the pandemic", "all": "across all years", "custom": "in the selected period"}


def fx(x, p):  # JS toFixed / d3.format(".pf") for x >= 0: the exact binary value, ties to the larger
    return str(Decimal(x).quantize(Decimal(1).scaleb(-p), rounding=ROUND_HALF_UP))
f1 = lambda v: fx(v, 1)
pct = lambda v: f1(v) + "%"
pp = lambda v: ("+" if v > 0 else MINUS if v < 0 else "±") + f1(abs(v)) + " pp"
def intc(v): return f"{int(Decimal(v).quantize(Decimal(1), rounding=ROUND_HALF_UP)):,}"
def dividx(v): r = math.floor(v * 10 + 0.5) / 10; return 0 if r <= -6 else 1 if r < -2 else 2 if r <= 2 else 3 if r < 6 else 4


def read(fn):
    with open(SEL / fn, encoding="utf-8") as f: return list(csv.DictReader(f))


ONT = sorted(({"y": int(r["year"]), "m": int(r["month"]), "q": int(r["quarter"]), "covid": r["covid_period"], "cases": float(r["cases"]), "lt": float(r["moa19"])} for r in read("ont-sa-characteristic-ow-ont.csv")), key=lambda d: (d["y"], d["m"]))
for d in ONT: d["label"] = f"{d['y']} Q{d['q']}"
CMA = {}
for r in read("ont-sa-characteristic-ow-cma.csv"):
    code, name = r["cma"].split(" - ", 1)
    CMA.setdefault(code, {"name": name.replace("--", "–"), "rows": []})["rows"].append({"y": int(r["year"]), "m": int(r["month"]), "cases": float(r["cases"]), "lt": float(r["moa19"])})
KEY = lambda d: (d["y"], d["m"])
LAST = KEY(ONT[-1])


def span(cid):
    r = [d for d in ONT if d["covid"] == cid]; return KEY(r[0]), KEY(r[-1])


PERIODS = {"latest": (LAST, LAST), "post": span("post"), "during": span("during"), "pre": span("pre"), "all": (KEY(ONT[0]), LAST)}
LABEL = {KEY(d): d["label"] for d in ONT}


def expected(query):
    p = dict(kv.split("=") for kv in query.split("&"))
    if "from" in p and "to" in p:
        qk = lambda s: next(KEY(d) for d in ONT if d["label"] == s[:4] + " " + s[4:])
        pid, (a, b) = "custom", (qk(p["from"]), qk(p["to"]))
    else:
        pid = p.get("period", "post"); a, b = PERIODS[pid]
    ins = lambda d: a <= KEY(d) <= b
    o = [d for d in ONT if ins(d)]; ont = sum(d["lt"] for d in o) / sum(d["cases"] for d in o) * 100
    st = []
    for code, c in CMA.items():
        r = [d for d in c["rows"] if ins(d)]; lt, al = sum(d["lt"] for d in r), sum(d["cases"] for d in r)
        st.append({"code": code, "name": c["name"], "share": lt / al * 100, "avg": al / len(r)})
    st.sort(key=lambda d: -d["share"])
    for i, d in enumerate(st): d["rank"] = i + 1; d["diff"] = d["share"] - ont; d["ont"] = ont
    la, lb = LABEL[a], LABEL[b]
    per = f"{PHRASE[pid]} ({la if la == lb else la + ' – ' + lb})"
    return st, per, p.get("view") == "top", p.get("shape") == "map"


pick = [a for a in sys.argv[1:] if a in FOLDERS] or list(FOLDERS)
sys.stdout.reconfigure(encoding="utf-8", errors="replace")
ok_all = True
for ver in pick:
    folder, rel = FOLDERS[ver]; d = ROOT / "design" / "q3" / folder
    dump = json.loads((d / "browser-verification.json").read_text(encoding="utf-8"))
    states = dump["states"] + [dict(dump["interactions"]["period"], query="period=during")]
    n, mism = 0, []
    def chk(ok, state, field, page, exp):
        global n; n += 1
        if not ok: mism.append({"state": state, "field": field, "page": page, "expected": exp})
    for s in states:
        st, per, top, mapshape = expected(s["query"]); by = {x["code"]: x for x in st}; q = s["query"]
        chk(s["f2Period"] == per, q, "f2Period", s["f2Period"], per)
        chk(len(s["marks"]) == 15, q, "15 blocks", len(s["marks"]), 15)
        for code, share, diff, c, z, area, w, ont, pit in s["marks"]:
            e = by[code]
            exp = [f1(e["share"]), pp(e["diff"]), dividx(e["diff"]), int(Decimal(e["avg"]).quantize(Decimal(1), rounding=ROUND_HALF_UP)), f1(e["ont"]), 1 if rel and not top and e["diff"] < 0 else 0]
            got = [share, diff, c, w, ont, pit]
            chk(got == exp, q, f"block {code}", got, exp)
        for code, label in s["aria"]:
            e = by[code]
            exp = f"{e['name']}: long-term share {pct(e['share'])}, {pp(e['diff'])} {'above' if e['diff'] >= 0 else 'below'} Ontario {per}; rank {e['rank']} of 15; average {intc(e['avg'])} OW cases."
            chk(label == exp, q, f"aria {code}", label, exp)
        names = {(SHORT.get(x["code"], x["name"]) + (pp(x["diff"]) if rel else pct(x["share"]))) for x in st}
        bad = [l for l in s["labels"] if l not in names]
        chk(not bad, q, "visible labels", bad, "name + value of some CMA")
        # one scale: A height ∝ difference (negative = sunk); B height ∝ share; top view: no height
        m = {x[0]: x for x in s["marks"]}
        if top:
            chk(all(abs(x[4]) < 1e-9 for x in s["marks"]), q, "top view has no height", [x[4] for x in s["marks"]], 0)
        else:
            base = [(m[c][4], by[c]["diff"] if rel else by[c]["share"]) for c in by if abs(by[c]["diff"] if rel else by[c]["share"]) >= 0.5]
            r = [z / v for z, v in base]; k = statistics.median(r)
            chk(k > 0 and all(abs(x - k) <= 0.004 * k + 0.02 for x in r), q, "heights on one scale", r, k)
        if not rel and not mapshape:  # (map shapes: the footprint is geography, not caseload)
            ka = [m[c][5] / by[c]["avg"] for c in by]
            chk(max(ka) / min(ka) - 1 < 1e-4, q, "footprint area ∝ average cases", ka, "constant")
    summary = {"version": ver, "folder": folder, "states": len(states), "checks": n, "mismatches": len(mism)}
    (d / "verification.json").write_text(json.dumps({"summary": summary, "mismatches": mism}, indent=1, ensure_ascii=False), encoding="utf-8")
    print(json.dumps(summary, ensure_ascii=False))
    for x in mism[:6]: print("  MISMATCH", json.dumps(x, ensure_ascii=False)[:600])
    ok_all = ok_all and not mism
sys.exit(0 if ok_all else 1)
