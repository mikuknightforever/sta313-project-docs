"""Browser checks for the Q3 unemployment extra version (headless Microsoft Edge or Chrome via Playwright).

Usage (from the repository root):
    python design/q3/unemployment-prototype/verify_browser.py            # checks + screenshots
    python design/q3/unemployment-prototype/verify_browser.py --no-shots # checks only

Needs `pip install playwright` and an installed Edge (channel "msedge") or Chrome (set BROWSER_CHANNEL=chrome);
no browser download is required. Starts its own no-cache server on a free port.
Writes browser-verification.json next to this file (layout, interaction results and every displayed
unemployment number, which verify.py recomputes independently) and screenshots/ PNGs.
"""
import functools, http.server, json, os, pathlib, sys, threading
from playwright.sync_api import sync_playwright

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parents[2]
SHOTS = "--no-shots" not in sys.argv
CHANNEL = os.environ.get("BROWSER_CHANNEL", "msedge")


class NoCache(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, max-age=0")
        super().end_headers()

    def log_message(self, *a):
        pass


srv = http.server.ThreadingHTTPServer(("127.0.0.1", 0), functools.partial(NoCache, directory=str(ROOT)))
threading.Thread(target=srv.serve_forever, daemon=True).start()
BASE = f"http://127.0.0.1:{srv.server_port}/design/q3/unemployment-prototype/index.html"

# Layout: horizontal scroll, overlapping text inside each figure, text past its figure's right edge.
LAYOUT_JS = r"""() => {
  const vis = el => { const s = getComputedStyle(el); return s.display !== 'none' && s.visibility !== 'hidden' && el.getBBox().width > 0; };
  const res = { scrollW: document.documentElement.scrollWidth, clientW: document.documentElement.clientWidth, figs: {} };
  for (const id of ['f2map', 'f3', 'f4', 'f5a', 'f5b', 'periodStrip', 'f1a', 'f1b']) {
    const host = document.getElementById(id); if (!host) continue;
    const fig = host.closest('figure, .period-panel') || host;
    const fr = fig.getBoundingClientRect();
    const texts = [...host.querySelectorAll('svg text')].filter(vis).map(t => ({ t: t.textContent, r: t.getBoundingClientRect() }));
    let overlaps = [], outside = [];
    for (let i = 0; i < texts.length; i++) {
      const a = texts[i].r;
      if (a.right > fr.right + 0.5 || a.left < fr.left - 0.5) outside.push(texts[i].t);
      for (let j = i + 1; j < texts.length; j++) {
        const b = texts[j].r, ix = Math.min(a.right, b.right) - Math.max(a.left, b.left), iy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
        if (ix > 1 && iy > 1) overlaps.push([texts[i].t, texts[j].t]);
      }
    }
    res.figs[id] = { texts: texts.length, overlaps, outside };
  }
  // Figure 5a: every CMA's label (shown one at a time on hover / selection) must not cover another CMA's dot
  const dots = [...document.querySelectorAll('#f5a .f5dot')];
  res.labelOverDot = [...document.querySelectorAll('#f5a .f5lbl')].flatMap(l => {
    const was = l.style.display; l.style.display = 'inline'; const r = l.getBoundingClientRect(); l.style.display = was;
    return dots.filter(d => d.__data__.code !== l.__data__.code).filter(d => {
      const c = d.getBoundingClientRect(); return r.left < c.right && c.left < r.right && r.top < c.bottom && c.top < r.bottom;
    }).map(d => [l.__data__.code, d.__data__.code]);
  });
  return res;
}"""

DUMP_JS = r"""() => ({
  card: document.querySelector('#card h3')?.textContent,
  cardMode: document.querySelector('#card .mode')?.textContent,
  cardUR: document.querySelector('#card .ur')?.innerText,
  f5aCaption: document.getElementById('f5aPeriod').textContent,
  f5aNote: document.getElementById('f5aNote').textContent,
  f5aTake: document.getElementById('f5aTake').innerText,
  f5aNodata: document.querySelector('#f5a .nodata')?.textContent || null,
  f5aOntario: [...document.querySelectorAll('#f5a text.ann')].map(t => t.textContent),
  f5aHits: [...document.querySelectorAll('#f5a .f5hit')].map(h => h.getAttribute('aria-label')),
  f5aDots: [...document.querySelectorAll('#f5a .f5dot')].length,
  f5bTitle: document.getElementById('f5bTitle').textContent,
  f5bNote: document.getElementById('f5bNote').textContent,
  f5bEnd: [...document.querySelectorAll('#f5b text.lbl-strong')].map(t => t.textContent),
  f5bOthers: document.querySelectorAll('#f5b .f5other').length,
  cards: document.getElementById('cards').innerText,
})"""


def load(page, query=""):
    errs = []
    page.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
    page.on("pageerror", lambda e: errs.append(str(e)))
    page.goto(BASE + ("?" + query if query else ""))
    page.wait_for_selector("#f5b svg", timeout=30000)
    page.wait_for_timeout(500)
    return errs


def center(page, sel):
    b = page.locator(sel).first.bounding_box()
    return b["x"] + b["width"] / 2, b["y"] + b["height"] / 2


out = {"base": BASE, "layout": [], "states": [], "interactions": {}}
with sync_playwright() as p:
    br = p.chromium.launch(channel=CHANNEL, headless=True)

    # 1) layout: 3 widths x 2 themes x 2 periods
    for w in (1360, 820, 400):
        for theme in ("light", "dark"):
            for per in ("post", "pre"):
                ctx = br.new_context(viewport={"width": w, "height": 900}, device_scale_factor=1)
                pg = ctx.new_page(); errs = load(pg, f"theme={theme}&period={per}")
                lay = pg.evaluate(LAYOUT_JS)
                out["layout"].append({"width": w, "theme": theme, "period": per, "errors": errs, **lay})
                if SHOTS and per == "post":
                    name = {1360: "desktop", 400: "mobile"}.get(w)
                    if name:
                        pg.screenshot(path=str(HERE / "screenshots" / f"{name}-{theme}.png"), full_page=True)
                ctx.close()

    # 2) number dump: every preset, a custom range, a pre-2011 range, Ottawa
    queries = [f"period={p}" for p in ("latest", "post", "during", "pre", "all")] + [
        "from=2015Q1&to=2019Q4", "from=2005Q1&to=2009Q4", "period=pre&cma=505", "period=during&cma=535", "period=post&cma=559"]
    ctx = br.new_context(viewport={"width": 1360, "height": 900})
    for q in queries:
        pg = ctx.new_page(); errs = load(pg, "theme=light&" + q)
        out["states"].append({"query": q, "errors": errs, **pg.evaluate(DUMP_JS)})
        pg.close()

    # 3) interactions (desktop, real mouse and keyboard). Tall viewport so the map, card and Figure 5 are all on
    #    screen at once: screenshots then do not scroll the page away from the pointer.
    ctx.close(); ctx = br.new_context(viewport={"width": 1360, "height": 2300})
    pg = ctx.new_page(); errs = load(pg, "theme=light&period=post")
    I = out["interactions"]
    sel0 = pg.evaluate("document.querySelector('#card h3').textContent")
    # hover a Figure 5a dot -> card preview + linked highlight on map, Figure 3 and Figure 5b
    pg.evaluate("document.getElementById('fig2').scrollIntoView({block: 'start'})"); pg.wait_for_timeout(100)
    target = pg.evaluate("""() => { const h = [...document.querySelectorAll('#f5a .f5hit')].find(e => !e.getAttribute('aria-label').startsWith(document.querySelector('#card h3').textContent)); return h.__data__.code; }""")
    x, y = center(pg, f"#f5a .f5hit >> nth={pg.evaluate(f'[...document.querySelectorAll(\"#f5a .f5hit\")].findIndex(e => e.__data__.code === \"{target}\")')}")
    pg.mouse.move(x, y); pg.wait_for_timeout(150)
    I["hover5a"] = pg.evaluate(f"""() => ({{ code: '{target}', card: document.querySelector('#card h3').textContent,
      name: [...document.querySelectorAll('#f5a .f5hit')].find(e => e.__data__.code === '{target}').getAttribute('aria-label').split(':')[0],
      mode: document.querySelector('#card .mode').textContent,
      mapHl: [...document.querySelectorAll('#f2map .sym.hl')].map(e => e.__data__.code),
      f3Hl: [...document.querySelectorAll('#f3 g.r.hl')].map(e => e.__data__.code),
      f5bHl: [...document.querySelectorAll('#f5b .f5other.hl')].map(e => e.dataset.cma),
      lblShown: [...document.querySelectorAll('#f5a .f5lbl')].filter(e => getComputedStyle(e).display !== 'none').map(e => e.__data__.code),
      tip: !document.getElementById('tip').hidden }})""")
    if SHOTS:
        pg.locator("#s2 .ctx-head + .two-col").screenshot(path=str(HERE / "screenshots" / "hover-5a-light.png"))
        pg.locator("#fig2").screenshot(path=str(HERE / "screenshots" / "hover-5a-card-light.png"))
    # click it -> selection follows in Figures 2b, 3, 4, 5a, 5b (re-measure: the screenshots above scrolled the page)
    pg.locator("#f5a").scroll_into_view_if_needed()
    x, y = center(pg, f"#f5a .f5hit >> nth={pg.evaluate(f'[...document.querySelectorAll(\"#f5a .f5hit\")].findIndex(e => e.__data__.code === \"{target}\")')}")
    pg.mouse.click(x, y); pg.wait_for_timeout(150)
    pg.mouse.move(5, 5); pg.wait_for_timeout(150)
    I["click5a"] = pg.evaluate(f"""() => ({{ code: '{target}', before: '{sel0}', card: document.querySelector('#card h3').textContent,
      mode: document.querySelector('#card .mode').textContent, f4: document.getElementById('f4Title').textContent,
      f5b: document.getElementById('f5bTitle').textContent,
      f3Sel: [...document.querySelectorAll('#f3 g.r.sel')].map(e => e.__data__.code),
      mapSel: [...document.querySelectorAll('#f2map .sym.sel')].map(e => e.__data__.code),
      f5aSel: [...document.querySelectorAll('#f5a .f5dot.sel')].map(e => e.__data__.code) }})""")
    # hover a map circle -> Figure 5a dot + label and Figure 5b line highlighted
    mcode = "535" if target != "535" else "555"
    idx = pg.evaluate(f'[...document.querySelectorAll("#f2map .hit")].findIndex(e => e.__data__.code === "{mcode}")')
    pg.locator("#f2map").scroll_into_view_if_needed()
    x2, y2 = center(pg, f"#f2map .hit >> nth={idx}")
    pg.mouse.move(x2, y2); pg.wait_for_timeout(150)
    I["hoverMap"] = pg.evaluate(f"""() => ({{ code: '{mcode}',
      f5aHl: [...document.querySelectorAll('#f5a .f5dot.hl')].map(e => e.__data__.code),
      lblShown: [...document.querySelectorAll('#f5a .f5lbl')].filter(e => getComputedStyle(e).display !== 'none').map(e => e.__data__.code),
      f5bHl: [...document.querySelectorAll('#f5b .f5other.hl')].map(e => e.dataset.cma) }})""")
    pg.mouse.move(5, 5)
    # hover Figure 5b -> tooltip
    pg.locator("#f5b").scroll_into_view_if_needed()
    b = pg.locator("#f5b svg").bounding_box(); pg.mouse.move(b["x"] + b["width"] * 0.5, b["y"] + 100); pg.wait_for_timeout(150)
    I["hover5b"] = pg.evaluate("() => ({ tip: !document.getElementById('tip').hidden, text: document.getElementById('tip').innerText })")
    pg.mouse.move(5, 5)
    # keyboard: Tab through the page; count Figure 5a dots reached, then Enter on one keeps focus and selects it
    pg.keyboard.press("Escape"); pg.evaluate("document.activeElement.blur(); window.scrollTo(0,0)")
    reached, seen = [], 0
    for _ in range(140):
        pg.keyboard.press("Tab")
        info = pg.evaluate("() => { const a = document.activeElement; return a && a.classList.contains('f5hit') ? a.__data__.code : null; }")
        if info and info not in reached: reached.append(info)
        if len(reached) == 15: break
    pg.keyboard.press("Enter"); pg.wait_for_timeout(150)
    I["keys"] = pg.evaluate(f"""() => ({{ reached: {json.dumps(reached)}, n: {len(reached)},
      focusKept: document.activeElement.classList.contains('f5hit'), focusedCode: document.activeElement.__data__ && document.activeElement.__data__.code,
      selected: document.querySelector('#card h3').textContent, f5aSel: [...document.querySelectorAll('#f5a .f5dot.sel')].map(e => e.__data__.code) }})""")
    # brush the strip to 2005-2009 -> Figure 5a shows the no-data message, card says no data
    pg.locator("#periodStrip").scroll_into_view_if_needed()
    sb = pg.locator("#periodStrip svg").bounding_box()
    xs = pg.evaluate("""() => { const r = document.querySelector('#periodStrip .overlay').getBoundingClientRect(); return [r.left, r.width]; }""")
    frac = lambda yq: (yq - 2003) / (2026.25 - 2003)
    pg.mouse.move(xs[0] + xs[1] * frac(2005.1), sb["y"] + 30); pg.mouse.down()
    pg.mouse.move(xs[0] + xs[1] * frac(2009.9), sb["y"] + 30, steps=8); pg.mouse.up(); pg.wait_for_timeout(400)
    I["brushPre2011"] = pg.evaluate("""() => ({ selected: document.getElementById('periodNow').textContent,
      nodata: document.querySelector('#f5a .nodata')?.textContent || null,
      cardUR: document.querySelector('#card .ur')?.innerText, f5bNote: document.getElementById('f5bNote').textContent })""")
    I["errors"] = errs
    ctx.close()

    # 4) touch (400 px phone): tap a Figure 5a dot -> it becomes the selected CMA
    ctx = br.new_context(viewport={"width": 400, "height": 800}, has_touch=True, is_mobile=True, device_scale_factor=2)
    pg = ctx.new_page(); errs = load(pg, "theme=light&period=post")
    tcode = "559"
    idx = pg.evaluate(f'[...document.querySelectorAll("#f5a .f5hit")].findIndex(e => e.__data__.code === "{tcode}")')
    pg.locator("#f5a").scroll_into_view_if_needed()
    x, y = center(pg, f"#f5a .f5hit >> nth={idx}")
    pg.touchscreen.tap(x, y); pg.wait_for_timeout(300)
    I["touch"] = pg.evaluate(f"""() => ({{ code: '{tcode}', card: document.querySelector('#card h3').textContent,
      f5b: document.getElementById('f5bTitle').textContent, f5aSel: [...document.querySelectorAll('#f5a .f5dot.sel')].map(e => e.__data__.code),
      scrollW: document.documentElement.scrollWidth, clientW: document.documentElement.clientWidth }})""")
    I["touchErrors"] = errs
    if SHOTS:
        pg.locator("#s2 .ctx-head + .two-col").screenshot(path=str(HERE / "screenshots" / "mobile-tap-windsor-light.png"))
    ctx.close()

    # 5) extra state screenshot: before the pandemic, Ottawa, dark
    if SHOTS:
        ctx = br.new_context(viewport={"width": 1360, "height": 900})
        pg = ctx.new_page(); load(pg, "theme=dark&period=pre&cma=505")
        pg.locator("#fig2").screenshot(path=str(HERE / "screenshots" / "state-pre-ottawa-card-dark.png"))
        pg.locator("#s2 .ctx-head + .two-col").screenshot(path=str(HERE / "screenshots" / "state-pre-ottawa-dark.png"))
        ctx.close()
    br.close()
srv.shutdown()

(HERE / "browser-verification.json").write_text(json.dumps(out, indent=1, ensure_ascii=False), encoding="utf-8")

# ---- summary ----
I = out["interactions"]
lay_bad = [(l["width"], l["theme"], l["period"]) for l in out["layout"] if l["scrollW"] > l["clientW"] or l["errors"]]
new_figs = ("f5a", "f5b")
ov = {(l["width"], l["theme"], l["period"], f): l["figs"][f]["overlaps"] for l in out["layout"] for f in new_figs if l["figs"][f]["overlaps"]}
outside = {(l["width"], l["theme"], l["period"], f): l["figs"][f]["outside"] for l in out["layout"] for f in l["figs"] if l["figs"][f]["outside"]}
checks = {
    "no horizontal scroll or console errors (12 layouts)": not lay_bad,
    "no overlapping text in Figures 5a/5b (12 layouts)": not ov,
    "no 5a label covers another CMA's dot (15 labels x 12 layouts)": not any(l["labelOverDot"] for l in out["layout"]),
    "hover 5a: card preview of that CMA, tooltip shown": I["hover5a"]["card"] == I["hover5a"]["name"] and I["hover5a"]["mode"].startswith("Figure 2b · Preview") and I["hover5a"]["tip"],
    "hover 5a: map, Fig 3, Fig 5b highlighted": I["hover5a"]["mapHl"] == [I["hover5a"]["code"]] and I["hover5a"]["f3Hl"] == [I["hover5a"]["code"]] and I["hover5a"]["f5bHl"] == [I["hover5a"]["code"]],
    "click 5a: selection follows in 2a, 3, 4, 5a, 5b": all(I["click5a"][k] == [I["click5a"]["code"]] for k in ("f3Sel", "mapSel", "f5aSel")) and I["click5a"]["card"] in I["click5a"]["f4"] and I["click5a"]["card"] in I["click5a"]["f5b"],
    "hover map: 5a dot + label and 5b line highlighted": I["hoverMap"]["f5aHl"] == [I["hoverMap"]["code"]] and I["hoverMap"]["code"] in I["hoverMap"]["lblShown"] and I["hoverMap"]["f5bHl"] == [I["hoverMap"]["code"]],
    "hover 5b: tooltip": I["hover5b"]["tip"],
    "keyboard: all 15 dots reachable, Enter selects and keeps focus": I["keys"]["n"] == 15 and I["keys"]["focusKept"] and I["keys"]["f5aSel"] == [I["keys"]["focusedCode"]],
    "brush to 2005-2009: no-data message": bool(I["brushPre2011"]["nodata"]) and "No unemployment data" in (I["brushPre2011"]["cardUR"] or ""),
    "touch tap selects, no horizontal scroll at 400 px": I["touch"]["f5aSel"] == [I["touch"]["code"]] and I["touch"]["scrollW"] <= I["touch"]["clientW"] and not I["touchErrors"],
    "no console errors in states / interactions": not any(s["errors"] for s in out["states"]) and not I["errors"],
}
for k, v in checks.items():
    print(("PASS " if v else "FAIL ") + k)
if ov: print("overlaps:", ov)
if outside: print("text past a figure's right/left edge (all figures, for information):", {f"{k}": v for k, v in outside.items()})
sys.exit(0 if all(checks.values()) else 1)
