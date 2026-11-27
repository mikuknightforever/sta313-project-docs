"""Browser checks for the Q3 block versions (A relief tiles, B block treemap), headless Edge or Chrome via Playwright.

Usage (from the repository root):
    python tools/check_q3_blocks.py              # both versions, checks + screenshots
    python tools/check_q3_blocks.py a --no-shots

Checks layout (3 widths × 2 themes × 2 states), interactions (hover, click, keyboard, touch, period switch, four
turns, top view) and that everything outside Figure 2a is identical to the unchanged Q3 prototype in the same state.
Writes design/q3/<folder>/browser-verification.json (every block's numbers and labels, which
tools/verify_q3_blocks.py recomputes from the CSVs) and blocks-<letter>-* screenshots in design/q3/screenshots/.
"""
import functools, http.server, json, os, pathlib, sys, threading
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parents[1]
SHOTS_DIR = ROOT / "design" / "q3" / "screenshots"
SHOTS = "--no-shots" not in sys.argv
CHANNEL = os.environ.get("BROWSER_CHANNEL", "msedge")
VERSIONS = {"a": dict(folder="blocks-tiles", rel=True), "b": dict(folder="blocks-treemap", rel=False)}
pick = [a for a in sys.argv[1:] if a in VERSIONS] or list(VERSIONS)
STATES = ["period=post", "period=pre", "period=during&cma=535", "period=latest", "period=all&cma=550", "from=2015Q1&to=2019Q4&cma=529", "period=post&view=top", "period=post&turn=1"]
CROSS = ["period=post", "period=during&cma=535", "from=2015Q1&to=2019Q4&cma=529", "period=pre&cma=559"]


class NoCache(http.server.SimpleHTTPRequestHandler):
    def end_headers(self): self.send_header("Cache-Control", "no-store, max-age=0"); super().end_headers()
    def log_message(self, *a): pass


srv = http.server.ThreadingHTTPServer(("127.0.0.1", 0), functools.partial(NoCache, directory=str(ROOT)))
threading.Thread(target=srv.serve_forever, daemon=True).start()
HOST = f"http://127.0.0.1:{srv.server_port}/design/q3"

LAYOUT_JS = r"""() => {
  const vis = el => { for (let e = el; e && e.tagName !== 'svg'; e = e.parentElement) { const s = getComputedStyle(e); if (s.display === 'none' || s.visibility === 'hidden') return false; } return el.getBBox().width > 0; };
  const fig = document.getElementById('fig2'), fr = fig.getBoundingClientRect();
  const t = [...document.querySelectorAll('#f2map svg text')].filter(vis).map(x => ({ t: x.textContent, r: x.getBoundingClientRect() }));
  const overlaps = [], outside = [];
  t.forEach((a, i) => { if (a.r.right > fr.right + 0.5 || a.r.left < fr.left - 0.5) outside.push(a.t);
    t.slice(i + 1).forEach(b => { const ix = Math.min(a.r.right, b.r.right) - Math.max(a.r.left, b.r.left), iy = Math.min(a.r.bottom, b.r.bottom) - Math.max(a.r.top, b.r.top); if (ix > 1 && iy > 1) overlaps.push([a.t, b.t]); }); });
  return { scrollW: document.documentElement.scrollWidth, clientW: document.documentElement.clientWidth, texts: t.length, overlaps, outside };
}"""
DUMP_JS = r"""() => ({
  marks: [...document.querySelectorAll('#f2map path.sym[data-code]')].map(m => [m.dataset.code, m.dataset.share, m.dataset.diff, +m.dataset.c, +m.dataset.z, +m.dataset.a, +m.dataset.w, m.dataset.ont, +m.dataset.pit]),
  aria: [...document.querySelectorAll('#f2map g.blk')].map(g => [g.dataset.code, g.getAttribute('aria-label')]),
  labels: [...document.querySelectorAll('#f2map .labels text')].filter(t => t.style.display !== 'none').map(t => t.textContent),
  f2Period: document.getElementById('f2Period').textContent, legend: document.getElementById('mapLegend').innerText,
  card: document.getElementById('card').innerText,
})"""
REST_JS = r"""() => ({
  lead: document.getElementById('lead').innerText, card: document.getElementById('card').innerText.replace('click the block', 'click the circle'),
  f3: [...document.querySelectorAll('#f3 svg text')].map(t => t.textContent).join('|'), f3Period: document.getElementById('f3Period').textContent,
  f4Title: document.getElementById('f4Title').textContent, f4: [...document.querySelectorAll('#f4 svg text')].map(t => t.textContent).join('|'),
  f4Note: document.getElementById('f4Note').innerText, take: document.getElementById('mapTakeaway').innerText, cards: document.getElementById('cards').innerText,
  f2Period: document.getElementById('f2Period').textContent, periodNow: document.getElementById('periodNow').textContent,
})"""
ORDER_JS = r"""() => { const g = [...document.querySelectorAll('#f2map g.blk')].map(e => e.__data__).filter(d => !(d.diff < 0 && document.body.dataset.layout === 'tiles' && !document.querySelector('#viewSeg button[aria-pressed="true"]').textContent.startsWith('Top'))), e = 1e-9;
  const behind = (a, b) => (a.u1 <= b.u0 + e && a.v0 < b.v1 - e && b.v0 < a.v1 - e) || (a.v1 <= b.v0 + e && a.u0 < b.u1 - e && b.u0 < a.u1 - e) || (a.u1 <= b.u0 + e && a.v1 <= b.v0 + e);
  let bad = 0; for (let i = 0; i < g.length; i++) for (let j = i + 1; j < g.length; j++) if (behind(g[j], g[i])) bad++;
  return { n: document.querySelectorAll('#f2map g.blk').length, bad, walls: document.querySelectorAll('#f2map g.blk path.wall').length, scrollW: document.documentElement.scrollWidth, clientW: document.documentElement.clientWidth }; }"""


def load(page, url):
    errs = []
    page.on("console", lambda m: errs.append(m.text) if m.type in ("error", "warning") else None)
    page.on("pageerror", lambda e: errs.append(str(e)))
    page.goto(url); page.wait_for_selector("body[data-ready='1']", timeout=30000); page.wait_for_timeout(300)
    return errs


def center(page, sel):
    loc = page.locator(sel).first; loc.scroll_into_view_if_needed(); b = loc.bounding_box(); return b["x"] + b["width"] / 2, b["y"] + b["height"] / 2


summary = {}
with sync_playwright() as p:
    br = p.chromium.launch(channel=CHANNEL, headless=True)
    for v in pick:
        cfg = VERSIONS[v]; BASE = f"{HOST}/{cfg['folder']}/index.html"
        out = {"version": v, "layout": [], "states": [], "cross": [], "interactions": {}}
        for w in (1360, 820, 400):
            for theme in ("light", "dark"):
                for st in ("period=post", "period=pre&view=top"):
                    ctx = br.new_context(viewport={"width": w, "height": 900}); pg = ctx.new_page(); errs = load(pg, f"{BASE}?theme={theme}&{st}")
                    out["layout"].append({"width": w, "theme": theme, "state": st, "errors": errs, **pg.evaluate(LAYOUT_JS)})
                    if SHOTS and w in (1360, 400) and st == "period=post":
                        pg.locator("#fig2").screenshot(path=str(SHOTS_DIR / f"blocks-{v}-{'desktop' if w == 1360 else 'mobile'}-{theme}.png"))
                    ctx.close()
        ctx = br.new_context(viewport={"width": 1360, "height": 1000}); pg = ctx.new_page()
        for q in STATES:
            errs = load(pg, f"{BASE}?theme=light&{q}"); out["states"].append({"query": q, "errors": errs, **pg.evaluate(DUMP_JS)})
        for q in CROSS:  # everything outside Figure 2a equals the unchanged prototype
            pg.goto(f"{HOST}/prototype/index.html?theme=light&{q}"); pg.wait_for_selector("#f2map svg circle.sym", timeout=30000); pg.wait_for_timeout(400); proto = pg.evaluate(REST_JS)  # (v2 sets no ready flag)
            load(pg, f"{BASE}?theme=light&{q}"); mine = pg.evaluate(REST_JS)
            out["cross"].append({"query": q, "diff": {k: [proto[k][:160], mine[k][:160]] for k in proto if proto[k] != mine[k]}})
        ctx.close()
        # interactions
        ctx = br.new_context(viewport={"width": 1360, "height": 1000}); pg = ctx.new_page(); errs = load(pg, f"{BASE}?theme=light&period=post")
        I = out["interactions"]
        x, y = center(pg, '#f2map g.blk[data-code="535"] path.sym'); pg.mouse.move(x, y); pg.wait_for_timeout(200)
        I["hover"] = pg.evaluate("() => ({ card: document.querySelector('#card h3').textContent, mode: document.querySelector('#card .mode').textContent, outline: !!document.querySelector('#f2map path.outl.hl').getAttribute('d') })")
        if SHOTS: pg.locator("#fig2").screenshot(path=str(SHOTS_DIR / f"blocks-{v}-hover-light.png"))
        pg.mouse.click(x, y); pg.wait_for_timeout(250); pg.mouse.move(3, 3); pg.wait_for_timeout(150)
        I["click"] = pg.evaluate("() => ({ card: document.querySelector('#card h3').textContent, f4: document.getElementById('f4Title').textContent, f3sel: [...document.querySelectorAll('#f3 g.r.sel')].map(g => g.__data__.code), outline: !!document.querySelector('#f2map path.outl.sel').getAttribute('d') })")
        pg.evaluate("document.activeElement && document.activeElement.blur(); window.scrollTo(0, 0)")
        reached = []
        for _ in range(120):
            pg.keyboard.press("Tab")
            cur = pg.evaluate("() => { const a = document.activeElement; return a && a.matches('#f2map g.blk') ? a.dataset.code : null; }")
            if cur and cur not in reached: reached.append(cur)
            if len(reached) == 15: break
        pg.keyboard.press("Enter"); pg.wait_for_timeout(200)
        I["keys"] = pg.evaluate(f"() => ({{ n: {len(reached)}, kept: document.activeElement.matches('#f2map g.blk'), card: document.querySelector('#card h3').textContent, f4: document.getElementById('f4Title').textContent }})")
        I["turns"] = []
        for k in range(4):
            I["turns"].append(pg.evaluate(ORDER_JS))
            if SHOTS and k == 1: pg.locator("#fig2").screenshot(path=str(SHOTS_DIR / f"blocks-{v}-turn-light.png"))
            pg.click("#turnBtn"); pg.wait_for_timeout(250)
        pg.locator("#viewSeg button", has_text="Top view").click(); pg.wait_for_timeout(250)
        I["top"] = pg.evaluate(ORDER_JS)
        if SHOTS: pg.locator("#fig2").screenshot(path=str(SHOTS_DIR / f"blocks-{v}-top-light.png"))
        pg.locator("#viewSeg button", has_text="Isometric").click(); pg.wait_for_timeout(250)
        I["iso"] = pg.evaluate(ORDER_JS)
        pg.get_by_role("button", name="Pandemic", exact=True).click(); pg.wait_for_timeout(500)
        I["period"] = {"query": "period=during (clicked)", **pg.evaluate(DUMP_JS)}
        I["errors"] = errs
        ctx.close()
        ctx = br.new_context(viewport={"width": 400, "height": 820}, has_touch=True, is_mobile=True, device_scale_factor=2); pg = ctx.new_page(); terrs = load(pg, f"{BASE}?theme=light&period=post")
        x, y = center(pg, '#f2map g.blk[data-code="559"] path.sym'); pg.touchscreen.tap(x, y); pg.wait_for_timeout(300)
        I["touch"] = pg.evaluate("() => ({ card: document.querySelector('#card h3').textContent, scrollW: document.documentElement.scrollWidth, clientW: document.documentElement.clientWidth })")
        I["touchErrors"] = terrs
        ctx.close()
        if SHOTS:
            ctx = br.new_context(viewport={"width": 1360, "height": 900}); pg = ctx.new_page(); load(pg, f"{BASE}?theme=light&period=post")
            pg.locator("#f2map").screenshot(path=str(SHOTS_DIR / f"blocks-{v}-map-light.png")); ctx.close()
        (ROOT / "design" / "q3" / cfg["folder"] / "browser-verification.json").write_text(json.dumps(out, indent=1, ensure_ascii=False), encoding="utf-8")
        L = out["layout"]
        checks = {
            "no horizontal scroll or console errors (12 layouts)": not [l for l in L if l["scrollW"] > l["clientW"] or l["errors"]],
            "no overlapping text in Figure 2a": not [l for l in L if l["overlaps"]],
            "no text past the figure": not [l for l in L if l["outside"]],
            "everything outside Figure 2a identical to the Q3 prototype (4 states)": all(not c["diff"] for c in out["cross"]),
            "hover: card preview and outline": I["hover"]["card"] == "Toronto" and "Preview" in I["hover"]["mode"] and "block" in I["hover"]["mode"] and I["hover"]["outline"],
            "click: card, Figure 3 and Figure 4 follow": I["click"]["card"] == "Toronto" and I["click"]["f4"].startswith("Toronto") and I["click"]["f3sel"] == ["535"] and I["click"]["outline"],
            "keyboard: 15 blocks reachable, Enter selects and keeps focus": I["keys"]["n"] == 15 and I["keys"]["kept"] and I["keys"]["f4"].startswith(I["keys"]["card"]),
            "blocks drawn back to front after each of 4 turns": all(t["n"] == 15 and t["bad"] == 0 and t["scrollW"] <= t["clientW"] for t in I["turns"]),
            "top view draws no walls; isometric draws them again": I["top"]["walls"] == 0 and I["iso"]["walls"] > 0,
            "period switch redraws the blocks": I["period"]["f2Period"].startswith("during the pandemic") and len(I["period"]["marks"]) == 15,
            "touch tap selects, no horizontal scroll at 400 px": I["touch"]["card"] == "Windsor" and I["touch"]["scrollW"] <= I["touch"]["clientW"] and not I["touchErrors"],
            "no console errors in states / interactions": not any(s["errors"] for s in out["states"]) and not I["errors"],
        }
        summary[v] = checks
        print(f"--- Q3 {v.upper()} ({cfg['folder']})")
        for k, ok in checks.items(): print(("PASS " if ok else "FAIL ") + k)
        for l in L:
            if l["overlaps"] or l["outside"] or l["errors"]: print("  ", l["width"], l["theme"], l["state"], l["overlaps"][:3], l["outside"][:3], l["errors"][:2])
        for c in out["cross"]:
            if c["diff"]: print("   cross", c["query"], json.dumps(c["diff"], ensure_ascii=False)[:600])
    br.close()
srv.shutdown()
sys.exit(0 if all(all(c.values()) for c in summary.values()) else 1)
