"""Fetch 2021 Census CMA cartographic boundaries for Ontario from Statistics Canada.

Source: Statistics Canada, 2021 Cartographic Boundary Files, ArcGIS REST service
https://geo.statcan.gc.ca/geo_wa/rest/services/2021/Cartographic_boundary_files/MapServer
Layer 6 = CMA (lcma000b21s_e); layer 0 = provinces (lpr_000b21s_e).
Licence: Open Government Licence - Canada.

Outputs (written next to this script):
  original/ont-cma-parts-2021-full.geojson  all 16 Ontario CMA parts, full resolution, WGS84
  ont-cma-boundaries.geojson               the 15 CMAs in the course data, simplified, with
                                           cma_code / cma fields matching the ONT-SA CSVs
  ont-province-outline.geojson             Ontario outline, simplified (map background)

Run from the repository root (Python 3.8+, standard library only):
  python datasets/EXTERNAL/CMA-BOUNDARIES/fetch_cma_boundaries.py
"""

import csv
import json
import pathlib
import urllib.parse
import urllib.request

SERVICE = "https://geo.statcan.gc.ca/geo_wa/rest/services/2021/Cartographic_boundary_files/MapServer"
HERE = pathlib.Path(__file__).resolve().parent
REPO = HERE.parents[2]
OW_CMA_CSV = REPO / "datasets" / "ONT-SA" / "ont-sa-characteristic-ow-cma.csv"

# Simplification tolerance in degrees (output SR is WGS84). ~0.0005 deg is about 50 m.
CMA_TOLERANCE = 0.0005
PROVINCE_TOLERANCE = 0.01
MIN_ISLAND_DEG2 = 0.005


def ring_area(ring):
    """Planar shoelace area of a ring, in square degrees (only used for filtering)."""
    return abs(sum(ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1]
                   for i in range(len(ring) - 1))) / 2


def query(layer, where, out_fields, tolerance=None):
    params = {
        "where": where,
        "outFields": out_fields,
        "returnGeometry": "true",
        "outSR": "4326",
        "geometryPrecision": "5",
        "f": "geojson",
    }
    if tolerance is not None:
        params["maxAllowableOffset"] = str(tolerance)
    url = f"{SERVICE}/{layer}/query?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={"User-Agent": "sta313-project-data-fetch"})
    with urllib.request.urlopen(req, timeout=120) as resp:
        data = json.load(resp)
    if "error" in data:
        raise RuntimeError(data["error"])
    return data


def write(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8", newline="\n") as fh:
        json.dump(data, fh, ensure_ascii=False, separators=(",", ":"))
    print(f"wrote {path.relative_to(REPO)} ({path.stat().st_size:,} bytes, "
          f"{len(data['features'])} features)")


def course_cmas():
    """Map cma_code -> cma label exactly as it appears in the course CSV."""
    with open(OW_CMA_CSV, encoding="utf-8") as fh:
        return {row["cma_code"]: row["cma"] for row in csv.DictReader(fh)}


def main():
    fields = "CMAUID,CMAPUID,DGUID,CMANAME,CMATYPE,PRUID,LANDAREA"
    # CMATYPE 'B' = census metropolitan area (excludes CAs). PRUID '35' = Ontario part only,
    # which drops the Quebec part of Ottawa - Gatineau.
    where = "PRUID='35' AND CMATYPE='B'"

    full = query(6, where, fields)
    write(HERE / "original" / "ont-cma-parts-2021-full.geojson", full)

    labels = course_cmas()
    simplified = query(6, where, fields, CMA_TOLERANCE)
    kept = []
    for feat in simplified["features"]:
        p = feat["properties"]
        code = p["CMAUID"]
        if code not in labels:
            print(f"skip {code} {p['CMANAME']} (not in course data)")
            continue
        feat["properties"] = {
            "cma_code": code,
            "cma": labels[code],
            "cmapuid": p["CMAPUID"],
            "dguid": p["DGUID"],
            "statcan_name": p["CMANAME"],
            "land_area_km2": round(p["LANDAREA"], 2),
        }
        kept.append(feat)
    missing = set(labels) - {f["properties"]["cma_code"] for f in kept}
    if missing:
        raise RuntimeError(f"course CMAs without a boundary: {sorted(missing)}")
    kept.sort(key=lambda f: f["properties"]["cma_code"])
    write(HERE / "ont-cma-boundaries.geojson", {"type": "FeatureCollection", "features": kept})

    prov = query(0, "PRUID='35'", "PRUID,PRENAME", PROVINCE_TOLERANCE)
    for feat in prov["features"]:
        geom = feat["geometry"]
        if geom["type"] == "MultiPolygon":
            # The outline has ~37,000 small islands; keep only large land masses
            # (outer ring > MIN_ISLAND_DEG2 square degrees) for a light background layer.
            geom["coordinates"] = [p for p in geom["coordinates"]
                                   if ring_area(p[0]) > MIN_ISLAND_DEG2]
    write(HERE / "ont-province-outline.geojson", prov)


if __name__ == "__main__":
    main()
