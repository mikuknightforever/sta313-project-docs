"""Browser checks for Q2 extra version D (headless Microsoft Edge or Chrome via Playwright).

Usage (from the repository root):
    python design/q2/variants/d-clouds/verify_browser.py            # checks + screenshots
    python design/q2/variants/d-clouds/verify_browser.py --no-shots # checks only

Needs `pip install playwright` and an installed Edge (channel "msedge") or Chrome (set BROWSER_CHANNEL=chrome);
no browser download is required. Starts its own no-cache server on a free port.
Writes browser-verification.json next to this file (layout, interactions and every displayed number that
verify.py recomputes independently) and the d-* screenshots in design/q2/screenshots/.
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
BASE = f"http://127.0.0.1:{srv.server_port}/design/q2/variants/d-clouds/index.html"

# Layout: page scroll, overlapping text inside each chart, text past its figure, text covering a cloud dot.
LAYOUT_JS = r"""() => {
  const vis = el => { const s = getComputedStyle(el); return s.display !== 'none' && s.visibility !== 'hidden' && el.getBBox().width > 0; };
  const res = { scrollW: document.documentElement.scrollWidth, clientW: document.documentElement.clientWidth, figs: {}, layout: window.__layout };
  for (const id of ['f1', 'f2', 'periodStrip', 'card']) {
    const host = document.getElementById(id); if (!host) continue;
    const fig = host.closest('figure, .period-panel') || host, fr = fig.getBoundingClientRect();
    const texts = [...host.querySelectorAll('svg text')].filter(vis).map(t => ({ t: t.textContent, r: t.getBoundingClientRect() }));
    const overlaps = [], outside = [];
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
  // text inside Figure 1a must not cover a cloud dot (tick labels are outside the plot and excluded)
  const dots = [...document.querySelectorAll('#f1 g.dots circle.dot')].map(d => d.getBoundingClientRect());
  res.textOverDot = [...document.querySelectorAll('#f1 text.glbl, #f1 text.plbl, #f1 text.zlbl')].flatMap(t => {
    const r = t.getBoundingClientRect();
    const n = dots.filter(c => r.left < c.right - 1 && c.left + 1 < r.right && r.top < c.bottom - 1 && c.top + 1 < r.bottom).length;
    return n ? [[t.textContent, n]] : [];
  });
  return res;
}"""

DUMP_JS = r"""() => ({
  h1: document.getElementById('h1').textContent,
  lead: document.getElementById('lead').innerText,
  story: document.getElementById('stepText').innerText,
  f1Title: document.getElementById('f1Title').textContent,
  f1Take: document.getElementById('f1Take').innerText,
  gutter: [...document.querySelectorAll('#f1 text.glbl tspan.big')].map(t => t.textContent),
  zlbl: [...document.querySelectorAll('#f1 text.zlbl')].map(t => t.textContent),
  card: { mode: document.querySelector('#card .mode').textContent, name: document.querySelector('#card h3').textContent,
    per: document.querySelector('#card .per').textContent,
    stats: [...document.querySelectorAll('#card dl.stats dt')].map(dt => [dt.textContent, dt.nextElementSibling.textContent]),
    warn: (w => w && w.style.visibility !== 'hidden' ? w.textContent : null)(document.querySelector('#card .warn')),
    bars: [...document.querySelectorAll('#card .chart:not(.spark) svg text')].map(t => t.textContent),
    sum: document.querySelector('#card .sum').innerText },
  f2Title: document.getElementById('f2Title').textContent,
  f2Read: document.getElementById('f2Read').innerText,
  f2L: [...document.querySelectorAll('#f2 text.slbl.l')].map(t => [t.dataset.id, t.textContent]),
  f2R: [...document.querySelectorAll('#f2 text.slbl.r')].map(t => [t.dataset.id, t.textContent]),
  f2Classes: Object.fromEntries([...document.querySelectorAll('#f2 g.srow')].map(g => [g.dataset.id, g.querySelector('path.sl').getAttribute('class')])),
  hlDots: [...new Set([...document.querySelectorAll('#f1 circle.dot.hl')].map(c => c.dataset.id))].sort(),
  table: [...document.querySelectorAll('#tbl tbody tr')].map(tr => [tr.dataset.id, ...[...tr.cells].map(td => td.textContent)]),
  tableHead: [...document.querySelectorAll('#tbl thead tr:nth-child(2) th')].map(t => t.textContent),
  period: [document.getElementById('startSel').value, document.getElementById('endSel').value],
  dots: document.querySelectorAll('#f1 g.dots circle.dot').length,
})"""


def load(page, query=""):
    errs = []
    page.on("console", lambda m: errs.append(m.text) if m.type in ("error", "warning") else None)
    page.on("pageerror", lambda e: errs.append(str(e)))
    page.goto(BASE + ("?" + query if query else ""))
    page.wait_for_selector("body[data-ready='1']", timeout=30000)
    page.wait_for_timeout(400)
    return errs


def dot_center(page, cma, prog, year):
    page.evaluate("document.getElementById('fig1').scrollIntoView({block: 'start'})"); page.wait_for_timeout(100)
    return page.evaluate(f"""() => {{ const c = [...document.querySelectorAll('#f1 g.dots circle.dot')].find(e => e.__data__.e.id === '{cma}' && e.__data__.p === '{prog}' && e.__data__.r.year === {year});
      const r = c.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; }}""")


STATES = ["theme=light", "step=2", "step=3", "step=4", "step=0&cma=532", "step=0&period=during&cma=550", "step=0&period=pre&cma=505",
          "step=0&start=2010Q1&end=2015Q4&cma=559", "step=0&period=post&cma=595", "step=0&period=all&cma=550", "step=0&period=post&cma=ont"]

out = {"base": BASE, "layout": [], "states": [], "interactions": {}}
with sync_playwright() as p:
    br = p.chromium.launch(channel=CHANNEL, headless=True)

    # 1) layout: 3 widths x 2 themes x 2 states
    for w in (1360, 820, 400):
        for theme in ("light", "dark"):
            for st in ("step=1", "step=0&period=during&cma=550"):
                ctx = br.new_context(viewport={"width": w, "height": 900}, device_scale_factor=1)
                pg = ctx.new_page(); errs = load(pg, f"theme={theme}&{st}")
                out["layout"].append({"width": w, "theme": theme, "state": st, "errors": errs, **pg.evaluate(LAYOUT_JS)})
                if SHOTS and st == "step=1" and w in (1360, 400):
                    pg.screenshot(path=str(SHOTS_DIR / f"d-{'desktop' if w == 1360 else 'mobile'}-{theme}.png"), full_page=True)
                ctx.close()

    # 1b) the card keeps one height whichever area it shows (otherwise Figure 2 below it jumps under the pointer)
    out["cardHeights"] = []
    for w in (1360, 1100, 1001, 820, 400):
        for q in ("period=all", "period=during"):
            ctx = br.new_context(viewport={"width": w, "height": 900}); pg = ctx.new_page(); load(pg, f"theme=light&step=0&{q}")
            hs = pg.evaluate("() => [...document.querySelectorAll('#f2 text.slbl.r')].map(t => { t.dispatchEvent(new PointerEvent('pointerenter')); return document.getElementById('card').offsetHeight; })")
            out["cardHeights"].append({"width": w, "query": q, "heights": sorted(set(hs)), "areas": len(hs)})
            ctx.close()

    # 2) number dump for verify.py
    ctx = br.new_context(viewport={"width": 1360, "height": 900})
    for q in STATES:
        pg = ctx.new_page(); errs = load(pg, q if q.startswith("theme") else "theme=light&" + q)
        out["states"].append({"query": q, "errors": errs, **pg.evaluate(DUMP_JS)})
        pg.close()
    ctx.close()

    # 3) interactions, desktop: real mouse and keyboard (tall viewport so Figure 1 does not scroll away)
    ctx = br.new_context(viewport={"width": 1360, "height": 1700})
    pg = ctx.new_page(); errs = load(pg, "theme=light&step=0&cma=532")
    I = out["interactions"]
    x, y = dot_center(pg, "535", "ow", 2015)
    pg.mouse.move(x, y); pg.wait_for_timeout(200)
    I["hoverDot"] = pg.evaluate("""() => ({ card: document.querySelector('#card h3').textContent, mode: document.querySelector('#card .mode').textContent,
      tip: !document.getElementById('tip').hidden, tipText: document.getElementById('tip').innerText,
      prevZip: document.querySelectorAll('#f1 .zip.prev').length, ghostZip: document.querySelectorAll('#f1 .zip.ghost').length,
      dimmed: document.querySelector('#f1 g.dots').classList.contains('focus'),
      f2prev: [...document.querySelectorAll('#f2 g.srow')].filter(g => g.querySelector('path.sl').classList.contains('prev')).map(g => g.dataset.id),
      zlbl: [...document.querySelectorAll('#f1 text.zlbl')].map(t => t.textContent) })""")
    if SHOTS:
        pg.locator("#fig1").screenshot(path=str(SHOTS_DIR / "d-hover-light.png"))
    x, y = dot_center(pg, "535", "ow", 2015)
    pg.mouse.click(x, y); pg.wait_for_timeout(250)
    pg.mouse.move(5, 5); pg.wait_for_timeout(150)
    I["clickDot"] = pg.evaluate("""() => ({ card: document.querySelector('#card h3').textContent, mode: document.querySelector('#card .mode').textContent,
      selZip: document.querySelectorAll('#f1 .zip.sel').length, prevZip: document.querySelectorAll('#f1 .zip.prev').length,
      tblOn: [...document.querySelectorAll('#tbl tbody tr.on')].map(t => t.dataset.id),
      f2on: [...document.querySelectorAll('#f2 g.srow')].filter(g => g.querySelector('path.sl').classList.contains('on')).map(g => g.dataset.id),
      step: [...document.querySelectorAll('#stepSeg button')].find(b => b.getAttribute('aria-pressed') === 'true')?.textContent })""")
    # hover a name in Figure 2 -> Figure 1a zipper preview + card preview
    pg.locator("#f2").scroll_into_view_if_needed()
    b = pg.locator('#f2 text.slbl.r[data-id="505"]').bounding_box()
    pg.mouse.move(b["x"] + b["width"] / 2, b["y"] + b["height"] / 2); pg.wait_for_timeout(200)
    I["hoverF2"] = pg.evaluate("""() => ({ card: document.querySelector('#card h3').textContent, mode: document.querySelector('#card .mode').textContent,
      prevZip: document.querySelectorAll('#f1 .zip.prev').length, zlbl: [...document.querySelectorAll('#f1 text.zlbl')].map(t => t.textContent),
      onDots: [...new Set([...document.querySelectorAll('#f1 g.dots circle.dot.on')].map(c => c.dataset.id))] })""")
    pg.mouse.move(5, 5); pg.wait_for_timeout(150)
    I["afterLeave"] = pg.evaluate("() => ({ card: document.querySelector('#card h3').textContent, prevZip: document.querySelectorAll('#f1 .zip.prev').length })")
    # keyboard: Tab through the page, count Figure 2 names reached, Enter on one selects it and keeps focus
    pg.evaluate("document.activeElement && document.activeElement.blur(); window.scrollTo(0, 0)")
    reached = []
    for _ in range(90):
        pg.keyboard.press("Tab")
        cur = pg.evaluate("() => { const a = document.activeElement; return a && a.matches('#f2 text.slbl.r') ? a.dataset.id : null; }")
        if cur and cur not in reached: reached.append(cur)
        if len(reached) == 16: break
    focus_card = pg.evaluate("document.querySelector('#card h3').textContent")
    pg.keyboard.press("Enter"); pg.wait_for_timeout(250)
    I["keys"] = pg.evaluate(f"""() => ({{ n: {len(reached)}, focusPreview: {json.dumps(focus_card)},
      focusKept: !!document.activeElement && document.activeElement.matches('#f2 text.slbl.r'), focused: document.activeElement.dataset.id,
      selected: [...document.querySelectorAll('#tbl tbody tr.on')].map(t => t.dataset.id), card: document.querySelector('#card h3').textContent,
      mode: document.querySelector('#card .mode').textContent }})""")
    # preset button "During"
    pg.locator("#period .seg button", has_text="During").click(); pg.wait_for_timeout(250)
    I["preset"] = pg.evaluate("() => ({ per: document.querySelector('#card .per').textContent, f2: document.getElementById('f2Title').textContent, period: [startSel.value, endSel.value] })")
    # brush the strip from 2010 Q1 to 2015 Q4
    pg.locator("#periodStrip").scroll_into_view_if_needed()
    ov = pg.evaluate("() => { const r = document.querySelector('#periodStrip .overlay').getBoundingClientRect(); return [r.left, r.width, r.top + r.height / 2]; }")
    cx = lambda i: ov[0] + (i + 0.5) * ov[1] / 93
    i0, i1 = (2010 - 2003) * 4, (2015 - 2003) * 4 + 3
    pg.mouse.move(cx(i0) - 2, ov[2]); pg.mouse.down(); pg.mouse.move(cx(i1) + 2, ov[2], steps=10); pg.mouse.up(); pg.wait_for_timeout(400)
    I["brush"] = pg.evaluate("() => ({ per: document.querySelector('#card .per').textContent, period: [startSel.value, endSel.value], enclosure: !!document.querySelector('#f1 g.plot > rect[style*=\"fill-opacity\"]') })")
    # story step buttons
    pg.locator("#stepSeg button", has_text="2 · Where most").click(); pg.wait_for_timeout(250)
    I["step2"] = pg.evaluate("() => ({ hlDots: [...new Set([...document.querySelectorAll('#f1 circle.dot.hl')].map(c => c.dataset.id))].sort(), card: document.querySelector('#card h3').textContent, period: [startSel.value, endSel.value] })")
    I["errors"] = errs
    ctx.close()

    # 4) touch, 400 px phone: tap a dot -> that CMA becomes selected, tooltip shown
    ctx = br.new_context(viewport={"width": 400, "height": 820}, has_touch=True, is_mobile=True, device_scale_factor=2)
    pg = ctx.new_page(); errs = load(pg, "theme=light&step=0&cma=532")
    x, y = dot_center(pg, "559", "od", 2012)
    pg.touchscreen.tap(x, y); pg.wait_for_timeout(350)
    I["touch"] = pg.evaluate("""() => ({ card: document.querySelector('#card h3').textContent, mode: document.querySelector('#card .mode').textContent,
      tip: !document.getElementById('tip').hidden, tblOn: [...document.querySelectorAll('#tbl tbody tr.on')].map(t => t.dataset.id),
      scrollW: document.documentElement.scrollWidth, clientW: document.documentElement.clientWidth })""")
    I["touchErrors"] = errs
    ctx.close()

    # 5) state screenshot (pandemic period, Guelph selected) and the overview thumbnail (Figure 1 at 0.6 scale)
    if SHOTS:
        ctx = br.new_context(viewport={"width": 1360, "height": 900})
        pg = ctx.new_page(); load(pg, "theme=light&step=0&period=during&cma=550")
        pg.screenshot(path=str(SHOTS_DIR / "d-state.png"), full_page=True)
        ctx.close()
        ctx = br.new_context(viewport={"width": 1360, "height": 900}, device_scale_factor=0.6)
        pg = ctx.new_page(); load(pg, "theme=light")
        bb = pg.evaluate("() => { const r = document.querySelector('#s1 .fig').getBoundingClientRect(); return { x: r.x + scrollX, y: r.y + scrollY, width: r.width, height: Math.min(r.height, 620) }; }")
        pg.screenshot(path=str(SHOTS_DIR / "d-thumb.png"), clip=bb, full_page=True)
        ctx.close()
    br.close()
srv.shutdown()

(HERE / "browser-verification.json").write_text(json.dumps(out, indent=1, ensure_ascii=False), encoding="utf-8")

# ---- summary ----
I = out["interactions"]
L = out["layout"]
bad_scroll = [(l["width"], l["theme"], l["state"]) for l in L if l["scrollW"] > l["clientW"] or l["errors"]]
ov = {f"{l['width']} {l['theme']} {l['state']} {f}": l["figs"][f]["overlaps"] for l in L for f in l["figs"] if l["figs"][f]["overlaps"]}
outside = {f"{l['width']} {l['theme']} {l['state']} {f}": l["figs"][f]["outside"] for l in L for f in l["figs"] if l["figs"][f]["outside"]}
tod = {f"{l['width']} {l['theme']} {l['state']}": l["textOverDot"] for l in L if l["textOverDot"]}
checks = {
    "no horizontal scroll or console errors (12 layouts)": not bad_scroll,
    "no overlapping text in any chart (12 layouts)": not ov,
    "no text past its figure's edge (12 layouts)": not outside,
    "no Figure 1a label covers a cloud dot (12 layouts)": not tod,
    "every swarm stays inside its year's column (12 layouts)": all(l["layout"]["fits"] for l in L),
    "720 cloud dots in every state": all(s["dots"] == 720 for s in out["states"]),
    "card height identical for all 16 areas (5 widths x 2 periods)": all(len(c["heights"]) == 1 and c["areas"] == 16 for c in out["cardHeights"]),
    "hover dot: card preview, tooltip, zipper preview over the dimmed clouds, Figure 2 line": I["hoverDot"]["card"] == "Toronto" and "Preview" in I["hoverDot"]["mode"]
        and I["hoverDot"]["tip"] and "Toronto · 2015 Q1" in I["hoverDot"]["tipText"] and I["hoverDot"]["prevZip"] == 1 and I["hoverDot"]["ghostZip"] == 1
        and I["hoverDot"]["dimmed"] and I["hoverDot"]["f2prev"] == ["535"],
    "click dot: selection follows in card, zipper, Figure 2, Table 1; Explore mode": I["clickDot"]["card"] == "Toronto" and I["clickDot"]["mode"] == "Figure 1b · Selected CMA"
        and I["clickDot"]["selZip"] == 1 and I["clickDot"]["prevZip"] == 0 and I["clickDot"]["tblOn"] == ["535"] and I["clickDot"]["f2on"] == ["535"] and I["clickDot"]["step"] == "Explore",
    "hover Figure 2 name: zipper and card preview; leaving restores": I["hoverF2"]["card"] == "Ottawa–Gatineau" and I["hoverF2"]["prevZip"] == 1 and I["hoverF2"]["onDots"] == ["505"]
        and I["afterLeave"]["card"] == "Toronto" and I["afterLeave"]["prevZip"] == 0,
    "keyboard: all 16 names reachable, Enter selects and keeps focus": I["keys"]["n"] == 16 and I["keys"]["focusKept"] and I["keys"]["selected"] == [I["keys"]["focused"]]
        and I["keys"]["mode"] == "Figure 1b · Selected CMA",
    "preset During: card and Figure 2 follow": I["preset"]["per"].startswith("2019 Q4 → 2023 Q1") and "2019 Q4 → 2023 Q1" in I["preset"]["f2"],
    "brush 2010 Q1 – 2015 Q4: period, card and enclosure follow": I["brush"]["per"].startswith("2010 Q1 → 2015 Q4") and I["brush"]["enclosure"],
    "story step 2: whole period, top CMA selected, others outlined": I["step2"]["card"] == "Oshawa" and len(I["step2"]["hlDots"]) == 3,
    "touch tap selects, tooltip shown, no horizontal scroll at 400 px": I["touch"]["card"] == "Windsor" and I["touch"]["tblOn"] == ["559"] and I["touch"]["tip"]
        and I["touch"]["scrollW"] <= I["touch"]["clientW"] and not I["touchErrors"],
    "no console errors in states / interactions": not any(s["errors"] for s in out["states"]) and not I["errors"],
}
for k, v in checks.items():
    print(("PASS " if v else "FAIL ") + k)
print("dot radius by width:", sorted({(l["width"], l["layout"]["r"]) for l in L}))
for name, d in (("overlaps", ov), ("outside", outside), ("text over dots", tod), ("layout problems", bad_scroll)):
    if d: print(name + ":", d)
sys.exit(0 if all(checks.values()) else 1)
