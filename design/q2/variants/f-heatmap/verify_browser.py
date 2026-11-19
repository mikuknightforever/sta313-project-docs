"""Browser checks for Q2 extra version F: the gap on a map over time, with a tested outlook (headless Edge or Chrome).

Usage (from the repository root):
    python design/q2/variants/f-heatmap/verify_browser.py            # checks + screenshots
    python design/q2/variants/f-heatmap/verify_browser.py --no-shots # checks only

Needs `pip install playwright` and an installed Edge (channel "msedge") or Chrome (set BROWSER_CHANNEL=chrome).
Starts its own no-cache server on a free port. Writes browser-verification.json next to this file (layout,
interactions and every displayed number, which verify.py recomputes independently) and f-* screenshots.
"""
import functools, http.server, json, os, pathlib, sys, threading
from playwright.sync_api import sync_playwright

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parents[3]
SHOTS_DIR = ROOT / "design" / "q2" / "screenshots"
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
BASE = f"http://127.0.0.1:{srv.server_port}/design/q2/variants/f-heatmap/index.html"

LAYOUT_JS = r"""() => {
  const vis = el => { for (let e = el; e && e.tagName !== 'svg'; e = e.parentElement) { const s = getComputedStyle(e); if (s.display === 'none' || s.visibility === 'hidden') return false; } return el.getBBox().width > 0; };
  const res = { scrollW: document.documentElement.scrollWidth, clientW: document.documentElement.clientWidth, figs: {},
    labelOverlaps: +(document.querySelector('#f1 svg').getAttribute('data-label-overlaps') || 0) };
  for (const id of ['f1', 'f2', 'tBar']) {
    const host = document.getElementById(id), fig = host.closest('figure, .time-panel') || host, fr = fig.getBoundingClientRect();
    const t = [...host.querySelectorAll('svg text')].filter(vis).map(x => ({ t: x.textContent, r: x.getBoundingClientRect() }));
    const overlaps = [], outside = [];
    t.forEach((a, i) => { if (a.r.right > fr.right + 0.5 || a.r.left < fr.left - 0.5) outside.push(a.t);
      t.slice(i + 1).forEach(b => { const ix = Math.min(a.r.right, b.r.right) - Math.max(a.r.left, b.r.left), iy = Math.min(a.r.bottom, b.r.bottom) - Math.max(a.r.top, b.r.top); if (ix > 1 && iy > 1) overlaps.push([a.t, b.t]); }); });
    res.figs[id] = { texts: t.length, overlaps, outside };
  }
  return res;
}"""

DUMP_JS = r"""() => {
  const dl = [...document.querySelectorAll('#card dl.stats dt')].map(dt => [dt.textContent, dt.nextElementSibling.textContent]);
  const w = document.querySelector('#card .warn');
  return {
    lead: document.getElementById('lead').innerText, defTest: document.getElementById('defTest').textContent,
    f1Title: document.getElementById('f1Title').textContent, tNow: document.getElementById('tNow').textContent,
    moments: [...document.querySelectorAll('#momentSeg button')].map(b => b.textContent),
    card: { mode: document.querySelector('#card .mode').textContent, name: document.querySelector('#card h3').textContent,
      per: document.querySelector('#card .per').textContent, stats: dl, sum: document.querySelector('#card .sum').innerText,
      warn: w && w.style.visibility !== 'hidden' ? w.textContent : null },
    labels: Object.fromEntries([...document.querySelectorAll('#f1 g.labels g')].map(g => [g.dataset.id, g.querySelector('text').textContent])),
    tiles: Object.fromEntries([...document.querySelectorAll('#f1 g.tile')].map(g => [g.dataset.id, g.querySelector('text.tv').textContent])),
    cls: Object.fromEntries([...document.querySelectorAll('#f1 path.cma:not(.outl), #f1 g.tile')].map(e => [e.dataset.id, +e.getAttribute('data-cls')])),
    hatch: [...document.querySelectorAll('#f1 .hatchov')].filter(e => getComputedStyle(e).display !== 'none').length,
    olabel: (e => e && getComputedStyle(e).display !== 'none' ? e.textContent : null)(document.querySelector('#f1 text.olabel')),
    f2Title: document.getElementById('f2Title').textContent, f2Read: document.getElementById('f2Read').innerText,
    f2Ends: [...document.querySelectorAll('#f2 svg > g > text')].map(t => t.textContent).filter(s => /\d$/.test(s) && /(Convergence|No change|10-year trend|Conv\.|Trend)/.test(s)),
    f2On: document.querySelector('#f2 path.f2rule.on')?.dataset.rule,
    skill: [...document.querySelectorAll('#skill tbody tr')].map(tr => [tr.className, ...[...tr.cells].map(td => td.textContent)]),
    skillHead: [...document.querySelectorAll('#skill thead th')].map(t => t.textContent), skillNote: document.getElementById('skillNote').textContent,
    outTitle: document.getElementById('outTitle').textContent,
    out: [...document.querySelectorAll('#outTbl tbody tr')].map(tr => [tr.dataset.id, ...[...tr.cells].map(td => td.textContent)]),
    outHead: [...document.querySelectorAll('#outTbl thead th')].map(t => t.textContent),
    take: document.getElementById('f1Take').innerText, outCard: document.getElementById('outCard').innerText,
    slider: [tSlider.min, tSlider.max, tSlider.value],
  };
}"""


def load(page, query=""):
    errs = []
    page.on("console", lambda m: errs.append(m.text) if m.type in ("error", "warning") else None)
    page.on("pageerror", lambda e: errs.append(str(e)))
    page.goto(BASE + ("?" + query if query else ""))
    page.wait_for_selector("body[data-ready='1']", timeout=30000)
    page.wait_for_timeout(300)
    return errs


def center(page, sel):
    page.locator(sel).first.scroll_into_view_if_needed()
    b = page.locator(sel).first.bounding_box()
    return b["x"] + b["width"] / 2, b["y"] + b["height"] / 2


STATES = ["theme=light", "t=2019Q4&cma=532", "t=2026Q1", "t=2028Q2&cma=535", "t=2030Q4&rule=naive&cma=550", "t=2030Q4&rule=trend&cma=559",
          "view=tiles&t=2030Q4&cma=595", "t=2021Q1&cma=550"]
out = {"base": BASE, "layout": [], "cardHeights": [], "states": [], "interactions": {}}
with sync_playwright() as p:
    br = p.chromium.launch(channel=CHANNEL, headless=True)
    # 1) layout: 3 widths x 2 themes x (map in 2003 Q1, tiles in 2030 Q4)
    for w in (1360, 820, 400):
        for theme in ("light", "dark"):
            for st in ("t=2003Q1", "view=tiles&t=2030Q4"):
                ctx = br.new_context(viewport={"width": w, "height": 900}); pg = ctx.new_page(); errs = load(pg, f"theme={theme}&{st}")
                out["layout"].append({"width": w, "theme": theme, "state": st, "errors": errs, **pg.evaluate(LAYOUT_JS)})
                if SHOTS and st == "t=2003Q1" and w in (1360, 400):
                    pg.screenshot(path=str(SHOTS_DIR / f"f-{'desktop' if w == 1360 else 'mobile'}-{theme}.png"), full_page=True)
                ctx.close()
    # 1b) the card keeps one height for every CMA, in a data quarter and in the outlook
    for w in (1360, 1001, 820, 400):
        ctx = br.new_context(viewport={"width": w, "height": 900}); pg = ctx.new_page(); load(pg, "theme=light&t=2003Q1")
        hs = []
        for q in ("2003Q1", "2030Q4"):
            pg.evaluate(f"() => {{ const i = window.__out.LAB.findIndex(l => l.replace(' ', '') === '{q}'); tSlider.value = i; tSlider.dispatchEvent(new Event('input')); }}")
            hs += pg.evaluate("() => [...document.querySelectorAll('#f1 path.cma:not(.outl)')].map(p => { p.dispatchEvent(new PointerEvent('pointerenter')); return document.getElementById('card').offsetHeight; })")
        out["cardHeights"].append({"width": w, "heights": sorted(set(hs)), "n": len(hs)})
        ctx.close()
    # 2) number dump
    ctx = br.new_context(viewport={"width": 1360, "height": 900})
    for q in STATES:
        pg = ctx.new_page(); errs = load(pg, q if q.startswith("theme") else "theme=light&" + q)
        out["states"].append({"query": q, "errors": errs, **pg.evaluate(DUMP_JS)})
        pg.close()
    ctx.close()
    # 3) interactions, desktop
    ctx = br.new_context(viewport={"width": 1360, "height": 1100}); pg = ctx.new_page(); errs = load(pg, "theme=light&t=2019Q4")
    I = out["interactions"]
    x, y = center(pg, '#f1 path.cma[data-id="535"]')
    pg.mouse.move(x, y); pg.wait_for_timeout(150)
    I["hover"] = pg.evaluate("() => ({ card: document.querySelector('#card h3').textContent, mode: document.querySelector('#card .mode').textContent, outline: !!document.querySelector('#f1 path.outl.hov').getAttribute('d') })")
    if SHOTS: pg.locator("#fig1").screenshot(path=str(SHOTS_DIR / "f-hover-light.png"))
    x, y = center(pg, '#f1 path.cma[data-id="535"]')
    pg.mouse.click(x, y); pg.wait_for_timeout(200); pg.mouse.move(3, 3); pg.wait_for_timeout(150)
    I["click"] = pg.evaluate("() => ({ card: document.querySelector('#card h3').textContent, mode: document.querySelector('#card .mode').textContent, f2: document.getElementById('f2Title').textContent, row: [...document.querySelectorAll('#outTbl tbody tr.on')].map(r => r.dataset.id) })")
    # keyboard: Tab reaches the 15 CMA shapes; Enter selects and keeps focus
    pg.evaluate("document.activeElement && document.activeElement.blur(); window.scrollTo(0, 0)")
    reached = []
    for _ in range(80):
        pg.keyboard.press("Tab")
        cur = pg.evaluate("() => { const a = document.activeElement; return a && a.matches('#f1 path.cma') ? a.dataset.id : null; }")
        if cur and cur not in reached: reached.append(cur)
        if len(reached) == 15: break
    pg.keyboard.press("Enter"); pg.wait_for_timeout(200)
    I["keys"] = pg.evaluate(f"() => ({{ n: {len(reached)}, focused: document.activeElement.dataset.id, kept: document.activeElement.matches('#f1 path.cma'), card: document.querySelector('#card h3').textContent, f2: document.getElementById('f2Title').textContent }})")
    # slider: End = last outlook quarter (hatched, labelled), Home = first quarter
    pg.focus("#tSlider"); pg.keyboard.press("End"); pg.wait_for_timeout(200)
    I["end"] = pg.evaluate("() => ({ t: +tSlider.value, now: tNow.textContent, hatch: [...document.querySelectorAll('#f1 .hatchov')].filter(e => getComputedStyle(e).display !== 'none').length, olabel: getComputedStyle(document.querySelector('#f1 text.olabel')).display, card: document.querySelector('#card .per').textContent })")
    if SHOTS: pg.locator("#fig1").screenshot(path=str(SHOTS_DIR / "f-outlook-light.png"))
    pg.keyboard.press("Home"); pg.wait_for_timeout(150)
    I["home"] = pg.evaluate("() => ({ t: +tSlider.value, hatch: [...document.querySelectorAll('#f1 .hatchov')].filter(e => getComputedStyle(e).display !== 'none').length })")
    # Play advances, Pause stops
    pg.click("#playBtn"); pg.wait_for_timeout(1500)
    playing = pg.evaluate("() => ({ t: +tSlider.value, btn: playBtn.textContent })")
    pg.click("#playBtn"); pg.wait_for_timeout(300)
    I["play"] = {"playing": playing, "paused": pg.evaluate("() => ({ t: +tSlider.value, btn: playBtn.textContent, state: document.body.dataset.play })")}
    # key moment and outlook rule
    pg.locator("#momentSeg button").nth(3).click(); pg.wait_for_timeout(150)
    I["moment"] = pg.evaluate("() => ({ t: +tSlider.value, now: tNow.textContent })")
    pg.locator("#momentSeg button").nth(4).click(); pg.locator("#ruleSeg button", has_text="10-year trend").click(); pg.wait_for_timeout(200)
    I["rule"] = pg.evaluate("() => ({ per: document.querySelector('#card .per').textContent, on: document.querySelector('#f2 path.f2rule.on').dataset.rule, title: outTitle.textContent, olabel: document.querySelector('#f1 text.olabel').textContent })")
    # Table 2 row click
    pg.locator('#outTbl tbody tr[data-id="580"]').click(); pg.wait_for_timeout(150)
    I["row"] = pg.evaluate("() => ({ card: document.querySelector('#card h3').textContent, f2: document.getElementById('f2Title').textContent })")
    # equal tiles
    pg.locator("#viewSeg button", has_text="Equal tiles").click(); pg.wait_for_timeout(200)
    x, y = center(pg, '#f1 g.tile[data-id="550"]'); pg.mouse.move(x, y); pg.wait_for_timeout(150)
    tile_hover = pg.evaluate("() => ({ n: document.querySelectorAll('#f1 g.tile').length, card: document.querySelector('#card h3').textContent, mode: document.querySelector('#card .mode').textContent })")
    pg.mouse.click(x, y); pg.wait_for_timeout(150); pg.mouse.move(3, 3); pg.wait_for_timeout(100)
    I["tiles"] = {"hover": tile_hover, "click": pg.evaluate("() => ({ card: document.querySelector('#card h3').textContent, on: [...document.querySelectorAll('#f1 g.tile.on')].map(g => g.dataset.id) })")}
    if SHOTS: pg.locator("#fig1").screenshot(path=str(SHOTS_DIR / "f-tiles-light.png"))
    I["errors"] = errs
    ctx.close()
    # 4) touch, phone
    ctx = br.new_context(viewport={"width": 400, "height": 820}, has_touch=True, is_mobile=True, device_scale_factor=2); pg = ctx.new_page(); errs = load(pg, "theme=light&t=2026Q1")
    x, y = center(pg, '#f1 path.cma[data-id="559"]'); pg.touchscreen.tap(x, y); pg.wait_for_timeout(300)
    I["touch"] = pg.evaluate("() => ({ card: document.querySelector('#card h3').textContent, f2: document.getElementById('f2Title').textContent, scrollW: document.documentElement.scrollWidth, clientW: document.documentElement.clientWidth })")
    I["touchErrors"] = errs
    ctx.close()
    if SHOTS:
        ctx = br.new_context(viewport={"width": 1360, "height": 900}); pg = ctx.new_page(); load(pg, "theme=light&t=2030Q4")
        pg.locator("#fig2").screenshot(path=str(SHOTS_DIR / "f-figure2-light.png"))
        pg.locator("#s2").screenshot(path=str(SHOTS_DIR / "f-tables-light.png"))
        ctx.close()
        ctx = br.new_context(viewport={"width": 1360, "height": 900}, device_scale_factor=0.6); pg = ctx.new_page(); load(pg, "theme=light&t=2003Q1")
        bb = pg.evaluate("() => { const r = document.getElementById('fig1').getBoundingClientRect(); return { x: r.x + scrollX, y: r.y + scrollY, width: r.width, height: Math.min(r.height, 620) }; }")
        pg.screenshot(path=str(SHOTS_DIR / "f-thumb.png"), clip=bb, full_page=True)
        ctx.close()
    br.close()
srv.shutdown()

(HERE / "browser-verification.json").write_text(json.dumps(out, indent=1, ensure_ascii=False), encoding="utf-8")

I = out["interactions"]; L = out["layout"]
bad = [(l["width"], l["theme"], l["state"]) for l in L if l["scrollW"] > l["clientW"] or l["errors"]]
ov = {f"{l['width']} {l['theme']} {l['state']} {f}": l["figs"][f]["overlaps"] for l in L for f in l["figs"] if l["figs"][f]["overlaps"]}
outside = {f"{l['width']} {l['theme']} {l['state']} {f}": l["figs"][f]["outside"] for l in L for f in l["figs"] if l["figs"][f]["outside"]}
checks = {
    "no horizontal scroll or console errors (12 layouts)": not bad,
    "no overlapping text in the map, tiles, Figure 2 or the timeline (12 layouts)": not ov,
    "no text past its figure (12 layouts)": not outside,
    "map labels placed without collisions (data-label-overlaps = 0)": all(l["labelOverlaps"] == 0 for l in L if "tiles" not in l["state"]),
    "card height identical for every CMA, data and outlook quarters (4 widths)": all(len(c["heights"]) == 1 for c in out["cardHeights"]),
    "hover a CMA: card preview and outline": I["hover"]["card"] == "Toronto" and "Preview" in I["hover"]["mode"] and I["hover"]["outline"],
    "click a CMA: card, Figure 2 and Table 2 follow": I["click"]["card"] == "Toronto" and I["click"]["mode"] == "Figure 1b · Selected CMA" and I["click"]["f2"].startswith("Toronto") and I["click"]["row"] == ["535"],
    "keyboard: all 15 CMAs reachable, Enter selects and keeps focus": I["keys"]["n"] == 15 and I["keys"]["kept"] and I["keys"]["f2"].startswith(I["keys"]["card"]),
    "slider End: last outlook quarter, hatched and labelled; Home: no hatch": I["end"]["t"] == 111 and I["end"]["now"].startswith("2030 Q4") and I["end"]["hatch"] == 15
        and I["end"]["olabel"] != "none" and I["home"]["t"] == 0 and I["home"]["hatch"] == 0,
    "Play advances, Pause stops": I["play"]["playing"]["t"] > 5 and I["play"]["playing"]["btn"] == "Pause" and I["play"]["paused"]["btn"] == "Play" and I["play"]["paused"]["state"] == "paused",
    "key moment buttons jump (2026 Q1)": I["moment"]["t"] == 92 and I["moment"]["now"].startswith("2026 Q1"),
    "outlook rule switch updates card, Figure 2, Table 2 and the map label": "10-year trend rule" in I["rule"]["per"] and I["rule"]["on"] == "trend" and "10-year trend rule" in I["rule"]["title"] and "10-YEAR TREND" in I["rule"]["olabel"],
    "Table 2 row selects": I["row"]["card"] == "Greater Sudbury" and I["row"]["f2"].startswith("Greater Sudbury"),
    "equal tiles: 15 tiles, hover previews, click selects": I["tiles"]["hover"]["n"] == 15 and I["tiles"]["hover"]["card"] == "Guelph" and I["tiles"]["click"]["on"] == ["550"],
    "touch tap selects, no horizontal scroll at 400 px": I["touch"]["card"] == "Windsor" and I["touch"]["scrollW"] <= I["touch"]["clientW"] and not I["touchErrors"],
    "no console errors in states / interactions": not any(s["errors"] for s in out["states"]) and not I["errors"],
}
for k, v in checks.items():
    print(("PASS " if v else "FAIL ") + k)
for name, d in (("overlaps", ov), ("outside", outside), ("layout problems", bad)):
    if d: print(name + ":", d)
print("card heights:", out["cardHeights"])
sys.exit(0 if all(checks.values()) else 1)
