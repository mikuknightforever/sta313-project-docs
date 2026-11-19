"""Rebuild 1410045901_databaseLoadingData.csv from the Statistics Canada Web Data Service (WDS).

Usage (from the repository root):
    python design/q3/data/fetch_unemployment.py            # (re)write the CSV next to this file
    python design/q3/data/fetch_unemployment.py --check    # download and compare with the existing CSV only

Table 14-10-0459-01, Labour force characteristics by census metropolitan area, three-month moving average,
seasonally adjusted (https://doi.org/10.25318/1410045901-eng). Series: unemployment rate, estimate,
seasonally adjusted, for the 18 Ontario CMA geographies in the teammate's download (vectors v1643278942 to
v1643279894, step 56), January 2011 to October 2026. Output columns and quoting follow the table viewer's
"download selected data (for database loading)" CSV. Standard library only.
"""
import csv, io, json, pathlib, sys, urllib.request

HERE = pathlib.Path(__file__).resolve().parent
OUT = HERE / "1410045901_databaseLoadingData.csv"
WDS = "https://www150.statcan.gc.ca/t1/wds/rest/"
VECTORS = [1643278942 + 56 * i for i in range(18)]
START, END = "2011-01-01", "2026-10-01"
COLS = ["REF_DATE", "GEO", "DGUID", "Labour force characteristics", "Statistics", "Data type", "UOM", "UOM_ID",
        "SCALAR_FACTOR", "SCALAR_ID", "VECTOR", "COORDINATE", "VALUE", "STATUS", "SYMBOL", "TERMINATED", "DECIMALS"]


def get(url, body=None):
    req = urllib.request.Request(url, data=None if body is None else json.dumps(body).encode(),
                                 headers={"Content-Type": "application/json", "User-Agent": "sta313-course-project"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.load(r)


meta = get(WDS + "getCubeMetadata", [{"productId": 14100459}])[0]["object"]
geo = {m["memberId"]: m for m in meta["dimension"][0]["member"]}
ids = ",".join(f"%22{v}%22" for v in VECTORS)  # the API wants quoted IDs; quotes percent-encoded
vec = get(f"{WDS}getDataFromVectorByReferencePeriodRange?vectorIds={ids}&startRefPeriod={START}&endReferencePeriod={END}")

rows = []
for s in vec:
    assert s["status"] == "SUCCESS", s
    o = s["object"]
    coord = ".".join(o["coordinate"].split(".")[:4])
    gid, ch, st, dt = map(int, coord.split("."))
    assert (ch, st, dt) == (5, 1, 1), coord  # unemployment rate, estimate, seasonally adjusted
    g = geo[gid]
    for p in o["vectorDataPoint"]:
        assert p["statusCode"] == 0 and p["symbolCode"] == 0 and p["scalarFactorCode"] == 0 and p["decimals"] == 1, p
        rows.append([p["refPer"][:7], g["memberNameEn"], f"2021S0{g['geoLevel']}{g['classificationCode']}", "Unemployment rate",
                     "Estimate", "Seasonally adjusted", "Percent", "239", "units", "0", f"v{o['vectorId']}", coord,
                     f"{p['value']:.1f}", "", "", "", "1"])
buf = io.StringIO()
w = csv.writer(buf, quoting=csv.QUOTE_ALL, lineterminator="\n")
w.writerow(COLS); w.writerows(rows)
text = buf.getvalue()
print(f"{meta['cubeTitleEn']} · released {meta.get('releaseTime')} · {len(rows)} rows")
if "--check" in sys.argv:
    same = OUT.exists() and OUT.read_text(encoding="utf-8") == text
    print("identical to the existing CSV" if same else "DIFFERENT from the existing CSV (StatCan may have revised the series)")
    sys.exit(0 if same else 1)
OUT.write_text(text, encoding="utf-8", newline="")
print("wrote", OUT)
