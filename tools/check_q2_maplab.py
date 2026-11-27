"""Browser checks for Q2 extra versions G–M (the map-lab versions; L and M are the isometric block versions), headless Edge or Chrome via Playwright.

Usage (from the repository root):
    python tools/check_q2_maplab.py                 # all seven versions, checks + screenshots
    python tools/check_q2_maplab.py g h --no-shots  # some versions, checks only

Needs `pip install playwright` and an installed Edge (channel "msedge") or Chrome (BROWSER_CHANNEL=chrome).
For each version writes design/q2/variants/<folder>/browser-verification.json (layout, interactions and every
displayed number, which tools/verify_q2_maplab.py recomputes) and <letter>-* screenshots in design/q2/screenshots/.
"""
import functools, http.server, json, os, pathlib, sys, threading
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parents[1]
SHOTS_DIR = ROOT / "design" / "q2" / "screenshots"
SHOTS = "--no-shots" not in sys.argv
CHANNEL = os.environ.get("BROWSER_CHANNEL", "msedge")
VERSIONS = {
    "g": dict(folder="g-spikes", modes=True, hit="#f1 path.base-cma", focus="#f1 path.base-cma", labels=True),
    "h": dict(folder="h-hexes", modes=True, hit="#f1 g.hex", focus="#f1 g.hex", labels=False),
    "i": dict(folder="i-multiples", modes=True, hit='#f1 g.panel[data-t="92"] .mk:not(.outl)', focus="#f1 .mk[tabindex]", labels=False),
    "j": dict(folder="j-bivariate", modes=False, hit="#f1 path.mk:not(.outl)", focus="#f1 path.mk:not(.outl)", labels=True),
    "k": dict(folder="k-prisms", modes=True, hit="#f1 g.prism", focus="#f1 g.prism", labels=False),
    "l": dict(folder="l-blocks", modes=False, hit="#f1 g.blk", focus="#f1 g.blk", labels=False, blocks=True),
    "m": dict(folder="m-block-treemap", modes=False, hit="#f1 g.blk", focus="#f1 g.blk", labels=False, blocks=True),
}
pick = [a for a in sys.argv[1:] if a in VERSIONS] or list(VERSIONS)


class NoCache(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, max-age=0"); super().end_headers()

    def log_message(self, *a):
        pass


srv = http.server.ThreadingHTTPServer(("127.0.0.1", 0), functools.partial(NoCache, directory=str(ROOT)))
threading.Thread(target=srv.serve_forever, daemon=True).start()

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
  const w = document.querySelector('#card .warn');
  return {
    lead: document.getElementById('lead').innerText, defTest: document.getElementById('defTest').textContent,
    f1Title: document.getElementById('f1Title').textContent, tNow: document.getElementById('tNow').textContent,
    moments: [...document.querySelectorAll('#momentSeg button')].map(b => b.textContent),
    card: { mode: document.querySelector('#card .mode').textContent, name: document.querySelector('#card h3').textContent, per: document.querySelector('#card .per').textContent,
      stats: [...document.querySelectorAll('#card dl.stats dt')].map(dt => [dt.textContent, dt.nextElementSibling.textContent]),
      sum: document.querySelector('#card .sum').innerText, warn: w && w.style.visibility !== 'hidden' ? w.textContent : null },
    marks: [...document.querySelectorAll('#f1 .mk[data-v]')].map(m => [m.dataset.id, +m.dataset.t, m.dataset.v, +m.dataset.c, m.dataset.h || null]),
    hatch: [...document.querySelectorAll('#f1 .hatchov')].filter(e => getComputedStyle(e).display !== 'none').length,
    f2Title: document.getElementById('f2Title').textContent, f2Read: document.getElementById('f2Read').innerText,
    f2Ends: [...document.querySelectorAll('#f2 svg > g > text')].map(t => t.textContent).filter(s => /\d$/.test(s) && /(Convergence|No change|10-year trend|Conv\.|Trend)/.test(s)),
    skill: [...document.querySelectorAll('#skill tbody tr')].map(tr => [tr.className, ...[...tr.cells].map(td => td.textContent)]),
    skillNote: document.getElementById('skillNote').textContent, outTitle: document.getElementById('outTitle').textContent,
    out: [...document.querySelectorAll('#outTbl tbody tr')].map(tr => [tr.dataset.id, ...[...tr.cells].map(td => td.textContent)]),
    take: document.getElementById('f1Take').innerText, outCard: document.getElementById('outCard').innerText,
    blk: [...document.querySelectorAll('#f1 .mk[data-a]')].map(m => [m.dataset.id, +m.dataset.z, m.dataset.h, +m.dataset.a, m.dataset.w ? +m.dataset.w : null]),
  };
}"""


def load(page, url):
    errs = []
    page.on("console", lambda m: errs.append(m.text) if m.type in ("error", "warning") else None)
    page.on("pageerror", lambda e: errs.append(str(e)))
    page.goto(url); page.wait_for_selector("body[data-ready='1']", timeout=30000); page.wait_for_timeout(300)
    return errs


def center(page, sel):
    loc = page.locator(sel).first
    loc.scroll_into_view_if_needed()
    b = loc.bounding_box(); return b["x"] + b["width"] / 2, b["y"] + b["height"] / 2


def states_for(v):
    if v == "i": return ["show=level", "show=yoy", "t=2021Q1&cma=550", "t=2030Q4&rule=naive&show=yoy"]
    if v == "j": return ["t=2003Q1", "t=2018Q1", "t=2021Q1&cma=550", "t=2030Q4&rule=trend"]
    if v in ("l", "m"): return ["t=2003Q1", "t=2019Q4", "t=2021Q1&cma=550", "t=2030Q4&rule=trend&cma=559", "t=2028Q2&cma=535"]
    return ["t=2003Q1", "t=2003Q1&show=yoy", "t=2021Q1&show=yoy", "t=2019Q4&cma=532", "t=2030Q4&rule=trend&cma=559", "t=2028Q2&show=yoy&cma=535"]


summary = {}
with sync_playwright() as p:
    br = p.chromium.launch(channel=CHANNEL, headless=True)
    for v in pick:
        cfg = VERSIONS[v]; BASE = f"http://127.0.0.1:{srv.server_port}/design/q2/variants/{cfg['folder']}/index.html"
        out = {"version": v, "base": BASE, "layout": [], "cardHeights": [], "states": [], "interactions": {}}
        lay_states = ["t=2003Q1", "t=2021Q1&show=yoy"] if cfg["modes"] else ["t=2003Q1", "t=2030Q4"]
        if v == "j": lay_states = ["t=2018Q1", "t=2030Q4"]
        for w in (1360, 820, 400):
            for theme in ("light", "dark"):
                for st in lay_states:
                    ctx = br.new_context(viewport={"width": w, "height": 900}); pg = ctx.new_page(); errs = load(pg, f"{BASE}?theme={theme}&{st}")
                    out["layout"].append({"width": w, "theme": theme, "state": st, "errors": errs, **pg.evaluate(LAYOUT_JS)})
                    if SHOTS and w in (1360, 400) and st == lay_states[0]:
                        pg.screenshot(path=str(SHOTS_DIR / f"{v}-{'desktop' if w == 1360 else 'mobile'}-{theme}.png"), full_page=True)
                    ctx.close()
        for w in (1360, 1001, 820, 400):
            ctx = br.new_context(viewport={"width": w, "height": 900}); pg = ctx.new_page(); load(pg, f"{BASE}?theme=light&t=2003Q1")
            hs = []
            for q in (0, 111):
                pg.evaluate(f"() => {{ tSlider.value = {q}; tSlider.dispatchEvent(new Event('input')); }}")
                hs += pg.evaluate(f"() => [...document.querySelectorAll('{cfg['hit']}')].map(e => {{ e.dispatchEvent(new PointerEvent('pointerenter')); return document.getElementById('card').offsetHeight; }})")
            out["cardHeights"].append({"width": w, "heights": sorted(set(hs)), "n": len(hs)})
            ctx.close()
        ctx = br.new_context(viewport={"width": 1360, "height": 900})
        for q in states_for(v):
            pg = ctx.new_page(); errs = load(pg, f"{BASE}?theme=light&{q}")
            out["states"].append({"query": q, "errors": errs, **pg.evaluate(DUMP_JS)}); pg.close()
        ctx.close()
        # interactions
        ctx = br.new_context(viewport={"width": 1360, "height": 1100}); pg = ctx.new_page(); errs = load(pg, f"{BASE}?theme=light&t=2019Q4")
        I = out["interactions"]
        target = f'{cfg["hit"]}[data-id="535"]' if v != "i" else '#f1 g.panel[data-t="92"] path.mk[data-id="535"]'
        x, y = center(pg, target); pg.mouse.move(x, y); pg.wait_for_timeout(200)
        I["hover"] = pg.evaluate("() => ({ card: document.querySelector('#card h3').textContent, mode: document.querySelector('#card .mode').textContent })")
        if SHOTS: pg.locator("#fig1").screenshot(path=str(SHOTS_DIR / f"{v}-hover-light.png"))
        x, y = center(pg, target); pg.mouse.click(x, y); pg.wait_for_timeout(200); pg.mouse.move(3, 3); pg.wait_for_timeout(150)
        I["click"] = pg.evaluate("() => ({ card: document.querySelector('#card h3').textContent, mode: document.querySelector('#card .mode').textContent, f2: document.getElementById('f2Title').textContent, row: [...document.querySelectorAll('#outTbl tbody tr.on')].map(r => r.dataset.id) })")
        pg.evaluate("document.activeElement && document.activeElement.blur(); window.scrollTo(0, 0)")
        reached = []
        for _ in range(90):
            pg.keyboard.press("Tab")
            cur = pg.evaluate(f"() => {{ const a = document.activeElement; return a && a.matches('{cfg['focus']}') ? a.dataset.id : null; }}")
            if cur and cur not in reached: reached.append(cur)
            if len(reached) == 15: break
        pg.keyboard.press("Enter"); pg.wait_for_timeout(200)
        I["keys"] = pg.evaluate(f"() => ({{ n: {len(reached)}, kept: document.activeElement.matches('{cfg['focus']}'), card: document.querySelector('#card h3').textContent, f2: document.getElementById('f2Title').textContent }})")
        pg.focus("#tSlider"); pg.keyboard.press("End"); pg.wait_for_timeout(250)
        I["end"] = pg.evaluate("() => ({ t: +tSlider.value, now: tNow.textContent, hatch: [...document.querySelectorAll('#f1 .hatchov')].filter(e => getComputedStyle(e).display !== 'none').length, panel: [...document.querySelectorAll('#f1 g.panel.now')].map(p => +p.dataset.t) })")
        if SHOTS: pg.locator("#fig1").screenshot(path=str(SHOTS_DIR / f"{v}-outlook-light.png"))
        pg.keyboard.press("Home"); pg.wait_for_timeout(200)
        I["home"] = pg.evaluate("() => ({ t: +tSlider.value, hatch: [...document.querySelectorAll('#f1 .hatchov')].filter(e => getComputedStyle(e).display !== 'none').length, panel: [...document.querySelectorAll('#f1 g.panel.now')].map(p => +p.dataset.t) })")
        if cfg["modes"]:
            pg.locator("#modeSeg button", has_text="Change vs a year earlier").click(); pg.wait_for_timeout(250)
            pg.locator("#momentSeg button").nth(2).click(); pg.wait_for_timeout(250)
            I["mode"] = pg.evaluate("() => ({ title: f1Title.textContent, cls: [...document.querySelectorAll('#f1 .mk[data-v]')].map(m => +m.dataset.c), now: tNow.textContent })")
            if SHOTS: pg.locator("#fig1").screenshot(path=str(SHOTS_DIR / f"{v}-change-light.png"))
        if cfg.get("blocks"):  # painter's order after every turn, the top view, and back
            ORDER_JS = """() => { const g = [...document.querySelectorAll('#f1 g.blk')].map(e => e.__data__), e = 1e-9;
              const behind = (a, b) => (a.u1 <= b.u0 + e && a.v0 < b.v1 - e && b.v0 < a.v1 - e) || (a.v1 <= b.v0 + e && a.u0 < b.u1 - e && b.u0 < a.u1 - e) || (a.u1 <= b.u0 + e && a.v1 <= b.v0 + e);
              let bad = 0; for (let i = 0; i < g.length; i++) for (let j = i + 1; j < g.length; j++) if (behind(g[j], g[i])) bad++;
              return { n: g.length, bad, walls: document.querySelectorAll('#f1 g.blk path.wall[d]').length, scrollW: document.documentElement.scrollWidth, clientW: document.documentElement.clientWidth }; }"""
            I["turns"] = []
            for k in range(4):
                I["turns"].append(pg.evaluate(ORDER_JS))
                if SHOTS and k == 1: pg.locator("#fig1").screenshot(path=str(SHOTS_DIR / f"{v}-turn-light.png"))
                pg.click("#turnBtn"); pg.wait_for_timeout(250)
            pg.locator("#viewSeg button", has_text="Top view").click(); pg.wait_for_timeout(250)
            I["topview"] = pg.evaluate(ORDER_JS)
            if SHOTS: pg.locator("#fig1").screenshot(path=str(SHOTS_DIR / f"{v}-top-light.png"))
            pg.locator("#viewSeg button", has_text="Isometric").click(); pg.wait_for_timeout(250)
            I["iso"] = pg.evaluate(ORDER_JS)
        pg.click("#playBtn"); pg.wait_for_timeout(1200); playing = pg.evaluate("() => ({ t: +tSlider.value, btn: playBtn.textContent })")
        pg.click("#playBtn"); pg.wait_for_timeout(250)
        I["play"] = {"playing": playing, "paused": pg.evaluate("() => ({ btn: playBtn.textContent, state: document.body.dataset.play })")}
        pg.locator("#ruleSeg button", has_text="10-year trend").click(); pg.wait_for_timeout(200)
        I["rule"] = pg.evaluate("() => ({ title: outTitle.textContent, on: document.querySelector('#f2 path.f2rule.on').dataset.rule })")
        I["errors"] = errs
        ctx.close()
        ctx = br.new_context(viewport={"width": 400, "height": 820}, has_touch=True, is_mobile=True, device_scale_factor=2); pg = ctx.new_page(); terrs = load(pg, f"{BASE}?theme=light&t=2026Q1")
        tt = f'{cfg["hit"]}[data-id="559"]' if v != "i" else '#f1 g.panel[data-t="92"] path.mk[data-id="559"]'
        x, y = center(pg, tt); pg.touchscreen.tap(x, y); pg.wait_for_timeout(300)
        I["touch"] = pg.evaluate("() => ({ card: document.querySelector('#card h3').textContent, scrollW: document.documentElement.scrollWidth, clientW: document.documentElement.clientWidth })")
        I["touchErrors"] = terrs
        ctx.close()
        if SHOTS:
            ctx = br.new_context(viewport={"width": 1360, "height": 900}, device_scale_factor=0.6); pg = ctx.new_page(); load(pg, f"{BASE}?theme=light&t=" + ("2018Q1" if v == "j" else "2003Q1"))
            bb = pg.evaluate("() => { const r = document.getElementById('fig1').getBoundingClientRect(); return { x: r.x + scrollX, y: r.y + scrollY, width: r.width, height: Math.min(r.height, 620) }; }")
            pg.screenshot(path=str(SHOTS_DIR / f"{v}-thumb.png"), clip=bb, full_page=True); ctx.close()
        folder = ROOT / "design" / "q2" / "variants" / cfg["folder"]
        (folder / "browser-verification.json").write_text(json.dumps(out, indent=1, ensure_ascii=False), encoding="utf-8")
        L = out["layout"]
        ov = {f"{l['width']} {l['theme']} {l['state']} {f}": l["figs"][f]["overlaps"] for l in L for f in l["figs"] if l["figs"][f]["overlaps"]}
        outside = {f"{l['width']} {l['theme']} {l['state']} {f}": l["figs"][f]["outside"] for l in L for f in l["figs"] if l["figs"][f]["outside"]}
        checks = {
            "no horizontal scroll or console errors (12 layouts)": not [l for l in L if l["scrollW"] > l["clientW"] or l["errors"]],
            "no overlapping text in Figure 1a, Figure 2 or the timeline": not ov,
            "no text past its figure": not outside,
            "map labels placed without collisions": all(l["labelOverlaps"] == 0 for l in L) if cfg["labels"] else True,
            "card height identical for every CMA, data and outlook quarters (4 widths)": all(len(c["heights"]) == 1 for c in out["cardHeights"]),
            "hover: card preview": I["hover"]["card"] == "Toronto" and "Preview" in I["hover"]["mode"],
            "click: card, Figure 2 and Table 2 follow": I["click"]["card"] == "Toronto" and I["click"]["f2"].startswith("Toronto") and I["click"]["row"] == ["535"],
            "keyboard: 15 CMAs reachable, Enter selects and keeps focus": I["keys"]["n"] == 15 and I["keys"]["kept"] and I["keys"]["f2"].startswith(I["keys"]["card"]),
            "slider End: outlook quarter hatched (I: its map marked); Home: no hatch (I: first map marked)": (I["end"]["t"] == 111 and I["end"]["panel"] == [111] and I["home"]["panel"] == [0]) if v == "i"
                else (I["end"]["t"] == 111 and I["end"]["now"].startswith("2030 Q4") and I["end"]["hatch"] > 0 and I["home"]["t"] == 0 and I["home"]["hatch"] == 0),
            "change mode: change classes and title": (I["mode"]["title"].startswith("Change") and all(0 <= c <= 4 for c in I["mode"]["cls"]) and I["mode"]["now"].startswith("2021 Q1")) if cfg["modes"] else True,
            "Play advances, Pause stops": I["play"]["playing"]["t"] > 3 and I["play"]["playing"]["btn"] == "Pause" and I["play"]["paused"]["state"] == "paused",
            "rule switch: Table 2 and Figure 2 follow": "10-year trend rule" in I["rule"]["title"] and I["rule"]["on"] == "trend",
            "touch tap selects, no horizontal scroll at 400 px": I["touch"]["card"] == "Windsor" and I["touch"]["scrollW"] <= I["touch"]["clientW"] and not I["touchErrors"],
            "no console errors in states / interactions": not any(s["errors"] for s in out["states"]) and not I["errors"],
        }
        if cfg.get("blocks"):
            checks["blocks drawn back to front after each of 4 turns (15 blocks, 0 order errors)"] = all(t["n"] == 15 and t["bad"] == 0 and t["scrollW"] <= t["clientW"] for t in I["turns"])
            checks["top view draws no walls; isometric view draws them again"] = I["topview"]["n"] == 15 and I["topview"]["walls"] == 0 and I["iso"]["walls"] > 0
        summary[v] = checks
        print(f"--- {v.upper()} ({cfg['folder']})")
        for k, ok in checks.items(): print(("PASS " if ok else "FAIL ") + k)
        if ov: print("overlaps:", ov)
        if outside: print("outside:", outside)
        if not checks["card height identical for every CMA, data and outlook quarters (4 widths)"]: print("card heights:", out["cardHeights"])
    br.close()
srv.shutdown()
sys.exit(0 if all(all(c.values()) for c in summary.values()) else 1)
