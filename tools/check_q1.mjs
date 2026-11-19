// Page checks for Q1: screenshots at exact widths, layout checks (page scroll, text overlaps, clipped text),
// keyboard, real mouse / touch events and console errors. See tools/README.md.
import { writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { startSession, REPO, sleep } from "./lib/cdp.mjs";

const { send, ev, errors, close, httpBase } = await startSession({ cdpPort: +(process.env.CDP_PORT || 9335) });
const ROOT = httpBase + "design/q1/";
const OUT = path.join(REPO, "design/q1/screenshots");          // the screenshots the docs refer to
const SCRATCH = path.join(REPO, "tools/out");                    // dumps and scratch screenshots (git-ignored)
mkdirSync(OUT, { recursive: true }); mkdirSync(SCRATCH, { recursive: true });


// usage: node tools/check_q1.mjs <variant-dir> <prefix> [stateQuery] [tasks]
const [, , VDIR, PREFIX, STATEQ = "", TASKS = "shots,checks,keys"] = process.argv;
const URL0 = VDIR === "." ? ROOT + "index.html" : VDIR.startsWith("archive/") ? ROOT + VDIR + "/index.html" : ROOT + "variants/" + VDIR + "/index.html";
async function open(q, width, mobile = false) {
  await send("Emulation.setDeviceMetricsOverride", { width, height: 1000, deviceScaleFactor: 1, mobile });
  await send("Emulation.setTouchEmulationEnabled", { enabled: mobile });
  await send("Page.navigate", { url: URL0 + (q ? "?" + q : "") });
  for (let i = 0; i < 75; i++) { await sleep(200); if (await ev("document.body.dataset.ready === '1'")) break; }
  await sleep(600);
}
async function shot(name) {
  const H = await ev("document.documentElement.scrollHeight"), Wd = await ev("document.documentElement.clientWidth");
  const r = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true, clip: { x: 0, y: 0, width: Wd, height: H, scale: 1 } });
  writeFileSync(`${OUT}/${name}.png`, Buffer.from(r.data, "base64")); return `${Wd}x${H}`;
}
const CHECK = `(() => {
  const vis = el => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.display !== 'none' && cs.visibility !== 'hidden' && cs.opacity !== '0'; };
  let overlaps = [];
  document.querySelectorAll('svg').forEach((svg, si) => {
    const t = [...svg.querySelectorAll('text')].filter(e => e.textContent.trim() && vis(e) && !e.closest('[style*="display: none"]')).map(e => ({ e, r: e.getBoundingClientRect() }));
    for (let i = 0; i < t.length; i++) for (let j = i + 1; j < t.length; j++) {
      const a = t[i].r, b = t[j].r, ox = Math.min(a.right, b.right) - Math.max(a.left, b.left), oy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
      if (ox > 1.5 && oy > 1.5) overlaps.push(svg.parentElement.id + ': "' + t[i].e.textContent.slice(0, 28) + '" × "' + t[j].e.textContent.slice(0, 28) + '"');
    }
  });
  const over = [...document.querySelectorAll('svg')].filter(s => s.getBoundingClientRect().right > document.documentElement.clientWidth + 0.5).map(s => s.parentElement.id);
  const clipped = []; document.querySelectorAll('svg').forEach(svg => { const sr = svg.getBoundingClientRect(); svg.querySelectorAll('text').forEach(t => { const r = t.getBoundingClientRect(); if (t.textContent.trim() && r.width > 0 && (r.left < sr.left - 1 || r.right > sr.right + 1)) clipped.push(svg.parentElement.id + ': "' + t.textContent.slice(0, 24) + '"'); }); });
  return { pageScroll: document.documentElement.scrollWidth - document.documentElement.clientWidth, svgOverflow: over, textOverlaps: overlaps, textClipped: clipped };
})()`;
const report = { url: URL0 };
const tasks = TASKS.split(",");
if (tasks.includes("shots")) {
  for (const [nm, q, w, mob] of [["desktop-light", "theme=light", 1360], ["desktop-dark", "theme=dark", 1360], ["mobile-light", "theme=light", 400, true], ["mobile-dark", "theme=dark", 400, true]]) {
    await open(q, w, mob); report[nm] = { size: await shot(`${PREFIX}-${nm}`), ...(await ev(CHECK)) };
  }
  if (STATEQ) { await open("theme=light&" + STATEQ, 1360); report.state = { size: await shot(`${PREFIX}-state`), ...(await ev(CHECK)) }; }
}
if (tasks.includes("checks")) {
  for (const [w, mob] of [[1360, false], [820, false], [400, true]]) { await open("theme=light", w, mob); report["check@" + w] = await ev(CHECK); }
}
if (tasks.includes("keys")) {
  await open("theme=light", 1360);
  const focusables = await ev(`[...document.querySelectorAll('button, a[href], input, select, [tabindex="0"]')].filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && !e.disabled; }).length`);
  await ev("document.activeElement && document.activeElement.blur(); window.scrollTo(0,0)");
  const seen = new Set();
  for (let i = 0; i < focusables + 6; i++) {
    await send("Input.dispatchKeyEvent", { type: "keyDown", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9 });
    await send("Input.dispatchKeyEvent", { type: "keyUp", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9 });
    await sleep(30);
    seen.add(await ev("(() => { const a = document.activeElement; if (!a || a === document.body) return null; return a.tagName + '|' + (a.textContent || a.getAttribute('aria-label') || a.id || '').trim().slice(0, 30) + '|' + [...document.querySelectorAll('*')].indexOf(a); })()"));
  }
  seen.delete(null);
  report.keys = { focusable: focusables, reachedByTab: seen.size };
  // Enter on the first segmented button of each group should toggle aria-pressed
  report.enterWorks = await ev(`(async () => { const out = []; for (const g of document.querySelectorAll('.seg')) { const b = [...g.querySelectorAll('button')].find(x => x.getAttribute('aria-pressed') === 'false'); if (!b) continue; b.focus(); b.dispatchEvent(new KeyboardEvent('keydown', {key:'Enter', bubbles:true})); b.click(); await new Promise(r => setTimeout(r, 150)); const nb = [...g.querySelectorAll('button')].find(x => x.textContent === b.textContent); out.push(g.id + ':' + (nb && nb.getAttribute('aria-pressed'))); } return out; })()`);
}
if (tasks.includes("facts")) {
  await open("theme=light", 1360);
  report.facts = await ev(`JSON.parse(JSON.stringify(window.__facts, (k, v) => (k === 'rows' ? undefined : v)))`);
  report.text = await ev("[...document.querySelectorAll('.lead, .story-text, .card li, table, .note, figcaption, .pitch, #planeDef')].map(e => e.innerText).concat([...document.querySelectorAll('svg text')].map(t => t.textContent)).join(String.fromCharCode(10))");
  writeFileSync(`${SCRATCH}/q1_${PREFIX}_dump.json`, JSON.stringify(report, null, 1));
  delete report.facts; report.text = report.text.length + " chars dumped";
}
if (tasks.includes("thumb")) {
  await open(process.env.THQ || "theme=light", 1360);
  const b = await ev(`(() => { const r = document.querySelector('#s1 .fig').getBoundingClientRect(); return { x: r.x + scrollX, y: r.y + scrollY, width: r.width, height: Math.min(r.height, 620) }; })()`);
  const r = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true, clip: { ...b, scale: 0.6 } });
  writeFileSync(`${OUT}/${PREFIX}-thumb.png`, Buffer.from(r.data, "base64")); report.thumb = `${Math.round(b.width * 0.6)}x${Math.round(b.height * 0.6)}`;
}
if (tasks.includes("hover")) {
  const [MAIN, STRIP] = (process.env.SEL || "#f1a,#f1b").split(",");
  await open("theme=light", 1360);
  const c = await ev(`(() => { const r = [...document.querySelectorAll('${MAIN} rect')].filter(e => e.style.fill === 'transparent').pop(); r.scrollIntoView({block:'center'}); return null; })()`);
  await sleep(300);
  const p = await ev(`(() => { const r = [...document.querySelectorAll('${MAIN} rect')].filter(e => e.style.fill === 'transparent').pop().getBoundingClientRect(); return { x: r.x + r.width * 0.78, y: r.y + r.height * 0.5 }; })()`);
  await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: p.x, y: p.y }); await sleep(300);
  report.hover = await ev(`({ tip: !document.getElementById('tip').hidden ? document.getElementById('tip').innerText.split(String.fromCharCode(10)).slice(0, 3).join(' | ') : null,
    stripRule: [...document.querySelectorAll('${STRIP} line')].some(l => l.style.display === '' && l.style.stroke.includes('ink2')) })`);
  void c;
  if (process.env.DRAG) { // C: drag the overview brush
    const b = await ev(`(() => { const o = document.querySelector('#f1 .overlay'); o.scrollIntoView({block:'center'}); return null; })()`); await sleep(300); void b;
    const o = await ev(`(() => { const r = document.querySelector('#f1 .overlay').getBoundingClientRect(); return { x: r.x, y: r.y + r.height / 2, w: r.width }; })()`);
    const x1 = o.x + o.w * 0.55, x2 = o.x + o.w * 0.85;
    await send("Input.dispatchMouseEvent", { type: "mousePressed", x: x1, y: o.y, button: "left", clickCount: 1 });
    for (let i = 1; i <= 8; i++) await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: x1 + (x2 - x1) * i / 8, y: o.y, button: "left", buttons: 1 });
    await send("Input.dispatchMouseEvent", { type: "mouseReleased", x: x2, y: o.y, button: "left", clickCount: 1 }); await sleep(600);
    report.brushDetail = await ev("document.getElementById('f2note').textContent");
    report.postDrag = await ev("(() => { const sel = document.querySelector('#f1 .selection'); return [sel.getAttribute('x'), sel.getAttribute('width'), document.getElementById('stepText').textContent.slice(0, 40), document.getElementById('f2Title').textContent, document.getElementById('f2note').textContent.slice(0, 50)]; })()");
  }
  if (process.env.SLIDER) { // D: move the time slider with the keyboard
    await ev("document.getElementById('tSlider').focus()");
    for (let i = 0; i < 20; i++) { await send("Input.dispatchKeyEvent", { type: "keyDown", key: "ArrowLeft", code: "ArrowLeft", windowsVirtualKeyCode: 37 }); await send("Input.dispatchKeyEvent", { type: "keyUp", key: "ArrowLeft", code: "ArrowLeft", windowsVirtualKeyCode: 37 }); }
    await sleep(300);
    report.slider = await ev("[document.getElementById('tOut').textContent, document.querySelector('#readout .q').textContent, document.querySelectorAll('#f1a svg circle').length]");
  }
}
if (tasks.includes("rowenter")) {
  await open("theme=light", 1360);
  report.rowEnter = await ev(`(async () => { const r = document.querySelector('${process.env.ROW}'); r.focus(); r.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); await new Promise(z => setTimeout(z, 300)); return [document.querySelectorAll('[data-ph]').length, document.hasFocus(), document.activeElement === document.body ? 'body' : (document.activeElement.dataset.ph || document.activeElement.tagName), [...document.querySelectorAll('#stepSeg button')].find(b => b.getAttribute('aria-pressed') === 'true').textContent]; })()`);
}
if (tasks.includes("views")) { // D: oblique 3D + the three front presets, light and dark, clipped to Figure 1a + key
  for (const th of ["light", "dark"]) for (const v of ["3d", "path", "ow", "odsp", "diff"]) {
    await open(`theme=${th}&view=${v}`, 1360);
    const b = await ev(`(() => { const r = document.querySelector('#s1 .fig').getBoundingClientRect(); return { x: r.x + scrollX, y: r.y + scrollY, width: r.width, height: Math.min(r.height, document.querySelector('#f1a').getBoundingClientRect().bottom - r.top + 40) }; })()`);
    const r = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true, clip: { ...b, scale: 1 } });
    writeFileSync(`${OUT}/d3d-${v}-${th}.png`, Buffer.from(r.data, "base64"));
    report[`${v}-${th}`] = await ev(CHECK);
  }
}
if (tasks.includes("consistency")) {
  // Reads the two flat axes, fits value → pixel from the tick positions, and checks every dot against that mapping.
  const AX = `(() => {
    const svg = document.querySelector('#f1a svg'), axes = [...svg.querySelectorAll('g.axis')];
    const tr = el => { const c = el.transform && el.transform.baseVal.consolidate(); return c ? [c.matrix.e, c.matrix.f] : [0, 0]; };
    const parse = (txt, isTime) => isTime ? new Date(+txt, 0, 1).getTime() : (txt.endsWith('k') ? +txt.slice(0, -1) * 1000 : +txt);
    const read = (ax, horiz) => { const g0 = tr(ax); const ticks = [...ax.querySelectorAll('.tick')].map(t => { const p = tr(t); return { txt: t.textContent, px: horiz ? p[0] + g0[0] : p[1] + g0[1] }; });
      const isTime = ticks.every(t => t.txt.length === 4 && +t.txt > 1900 && +t.txt < 2100); const pts = ticks.map(t => [parse(t.txt, isTime), t.px]);
      const n = pts.length, mx = pts.reduce((a, p) => a + p[0], 0) / n, my = pts.reduce((a, p) => a + p[1], 0) / n;
      const b = pts.reduce((a, p) => a + (p[0] - mx) * (p[1] - my), 0) / pts.reduce((a, p) => a + (p[0] - mx) ** 2, 0), a0 = my - b * mx;
      const resid = Math.max(...pts.map(p => Math.abs(a0 + b * p[0] - p[1])));
      const bb = ax.querySelector('path.domain').getBBox();
      const ends = horiz ? [bb.x + g0[0], bb.x + bb.width + g0[0]] : [bb.y + bb.height + g0[1], bb.y + g0[1]];
      return { labels: ticks.map(t => t.txt), isTime, a0, b, tickResid: resid, domain: ends.map(px => (px - a0) / b) }; };
    return { h: read(axes[0], true), v: read(axes[1], false) };
  })()`;
  const DOTS = `[...document.querySelectorAll('#f1a svg > g > g:nth-of-type(n) circle')].filter(c => +c.getAttribute('r') === 2.4).map(c => [+c.getAttribute('cx'), +c.getAttribute('cy')])`;
  const out = {};
  for (const mode of ["count", "index"]) for (const v of ["path", "ow", "odsp"]) {
    await open(`theme=light&view=${v}&mode=${mode}`, 1360);
    const ax = await ev(AX), dots = await ev(DOTS);
    const Qd = await ev(`window.__Q.map(d => ({ t: d.date.getTime(), ow: d.ow, odsp: d.odsp, iow: d.iow, iod: d.iod }))`);
    const val = { path: [mode === "index" ? "iod" : "odsp", mode === "index" ? "iow" : "ow"], ow: ["t", mode === "index" ? "iow" : "ow"], odsp: ["t", mode === "index" ? "iod" : "odsp"] }[v];
    const dev = dots.map((p, i) => Math.max(Math.abs(ax.h.a0 + ax.h.b * Qd[i][val[0]] - p[0]), Math.abs(ax.v.a0 + ax.v.b * Qd[i][val[1]] - p[1])));
    const fmtDom = (d, t) => t ? d.map(x => new Date(x).toISOString().slice(0, 7)) : d.map(x => Math.round(x * 100) / 100);
    out[`${v}/${mode}`] = { dots: dots.length, maxDotErrorPx: +Math.max(...dev).toFixed(3), maxTickResidPx: +Math.max(ax.h.tickResid, ax.v.tickResid).toFixed(3),
      hLabels: ax.h.labels.join(" "), vLabels: ax.v.labels.join(" "), hDomain: fmtDom(ax.h.domain, ax.h.isTime), vDomain: fmtDom(ax.v.domain, false) };
    if (v === "ow" && mode === "count") { // arrive by animation (3D → OW over time) and compare with the direct render
      await open(`theme=light&view=3d`, 1360);
      await ev(`[...document.querySelectorAll('#viewSeg button')].find(b => b.textContent === 'OW over time').click()`); await sleep(1300);
      const ax2 = await ev(AX), dots2 = await ev(DOTS);
      out.animatedArrival = { sameLabels: ax2.h.labels.join(" ") === ax.h.labels.join(" ") && ax2.v.labels.join(" ") === ax.v.labels.join(" "),
        maxDotShiftPx: +Math.max(...dots2.map((p, i) => Math.hypot(p[0] - dots[i][0], p[1] - dots[i][1]))).toFixed(3), title: await ev("document.getElementById('f1aTitle').textContent") };
    }
  }
  report.consistency = out;
}
if (tasks.includes("axdebug")) {
  await open("theme=light&view=path", 1360);
  report.ax = await ev(`(() => { const a = document.querySelector('#f1a svg g.axis'); return { g: a.getAttribute('transform'), ticks: [...a.querySelectorAll('.tick')].slice(0, 3).map(t => [t.getAttribute('transform'), t.textContent]), dom: a.querySelector('path.domain').getAttribute('d') }; })()`);
}
if (tasks.includes("archcmp")) { // v2 path view vs the archived v1 2D path (same labels, domains and dot positions)
  const AX = `(() => {
    const svg = document.querySelector('#f1a svg'), axes = [...svg.querySelectorAll('g.axis')];
    const tr = el => { const c = el.transform && el.transform.baseVal.consolidate(); return c ? [c.matrix.e, c.matrix.f] : [0, 0]; };
    const parse = (txt, isTime) => isTime ? new Date(+txt, 0, 1).getTime() : (txt.endsWith('k') ? +txt.slice(0, -1) * 1000 : +txt);
    const read = (ax, horiz) => { const g0 = tr(ax); const ticks = [...ax.querySelectorAll('.tick')].map(t => { const p = tr(t); return { txt: t.textContent, px: horiz ? p[0] + g0[0] : p[1] + g0[1] }; });
      const isTime = ticks.every(t => t.txt.length === 4 && +t.txt > 1900 && +t.txt < 2100); const pts = ticks.map(t => [parse(t.txt, isTime), t.px]);
      const n = pts.length, mx = pts.reduce((a, p) => a + p[0], 0) / n, my = pts.reduce((a, p) => a + p[1], 0) / n;
      const b = pts.reduce((a, p) => a + (p[0] - mx) * (p[1] - my), 0) / pts.reduce((a, p) => a + (p[0] - mx) ** 2, 0), a0 = my - b * mx;
      const resid = Math.max(...pts.map(p => Math.abs(a0 + b * p[0] - p[1])));
      const bb = ax.querySelector('path.domain').getBBox();
      const ends = horiz ? [bb.x + g0[0], bb.x + bb.width + g0[0]] : [bb.y + bb.height + g0[1], bb.y + g0[1]];
      return { labels: ticks.map(t => t.txt), isTime, a0, b, tickResid: resid, domain: ends.map(px => (px - a0) / b) }; };
    return process_ORDER;
  })()`;
  const out = {};
  for (const mode of ["count", "index"]) {
    await open(`theme=light&view=path&mode=${mode}`, 1360);
    const kx = mode === "index" ? "d.iod" : "d.odsp", ky = mode === "index" ? "d.iow" : "d.ow";
    const Qd = await ev("window.__Q.map(d => ({ x: " + kx + ", y: " + ky + " }))");
    const cur = await ev(AX.replace("process_ORDER", "{ h: read(axes[0], true), v: read(axes[1], false) }"));
    await send("Page.navigate", { url: ROOT + "archive/q1-d-paths_2026-11-12_v1/index.html?theme=light&mode=" + mode });
    for (let k = 0; k < 60; k++) { await sleep(200); if (await ev("document.body.dataset.ready === '1'")) break; } await sleep(500);
    const old = await ev(AX.replace("process_ORDER", "{ h: read(axes[1], true), v: read(axes[0], false) }"));
    const dots = await ev(`[...document.querySelectorAll('#f1a svg circle')].filter(c => +c.getAttribute('r') === 2.4).map(c => [+c.getAttribute('cx'), +c.getAttribute('cy')])`);
    const err = Math.max(...dots.map((p, i2) => Math.max(Math.abs(old.h.a0 + old.h.b * Qd[i2].x - p[0]), Math.abs(old.v.a0 + old.v.b * Qd[i2].y - p[1]))));
    out[mode] = { sameH: cur.h.labels.join(" ") === old.h.labels.join(" "), sameV: cur.v.labels.join(" ") === old.v.labels.join(" "),
      v1H: old.h.labels.join(" "), v1V: old.v.labels.join(" "), v1Domain: [old.h.domain.map(x => Math.round(x * 10) / 10), old.v.domain.map(x => Math.round(x * 10) / 10)],
      v2Domain: [cur.h.domain.map(x => Math.round(x * 10) / 10), cur.v.domain.map(x => Math.round(x * 10) / 10)], v1DotsVsDataPx: +err.toFixed(2), v1Dots: dots.length };
  }
  report.archcmp = out;
}
if (tasks.includes("interact3d")) {
  const R = {}, cam = () => ev("window.__cam()");
  const key = async (k, code, vk) => { await send("Input.dispatchKeyEvent", { type: "keyDown", key: k, code, windowsVirtualKeyCode: vk }); await send("Input.dispatchKeyEvent", { type: "keyUp", key: k, code, windowsVirtualKeyCode: vk }); await sleep(40); };
  await open("theme=light&view=3d", 1360);
  await ev("document.getElementById('f1a').scrollIntoView({block:'center'})"); await sleep(300);
  const c0 = await ev("(() => { const r = document.querySelector('#f1a svg').getBoundingClientRect(); return { x: r.x + r.width * 0.4, y: r.y + r.height * 0.5 }; })()");
  R.start = await cam();
  // drag: modest, then extreme (must stay within the limits)
  const drag = async (dx, dy) => { await send("Input.dispatchMouseEvent", { type: "mousePressed", x: c0.x, y: c0.y, button: "left", clickCount: 1 });
    for (let i = 1; i <= 10; i++) await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: c0.x + dx * i / 10, y: c0.y + dy * i / 10, button: "left", buttons: 1 });
    await send("Input.dispatchMouseEvent", { type: "mouseReleased", x: c0.x + dx, y: c0.y + dy, button: "left", clickCount: 1 }); await sleep(200); };
  await drag(60, -30); R.afterDrag = await cam();
  await drag(900, 900); R.afterExtremeDrag = await cam();
  R.dragChecks = await ev(CHECK);
  // keyboard: Home resets (animated), arrows rotate by 5°
  await ev("document.getElementById('f1a').focus()"); await key("Home", "Home", 36); await sleep(900); R.afterHome = await cam();
  await key("ArrowRight", "ArrowRight", 39); await key("ArrowRight", "ArrowRight", 39); await key("ArrowUp", "ArrowUp", 38); R.afterArrows = await cam();
  // play in 3D: current point advances
  await ev("document.getElementById('tSlider').value = 10; document.getElementById('tSlider').dispatchEvent(new Event('input'))"); await sleep(200);
  await ev("document.getElementById('playBtn').click()"); await sleep(1200); R.playT = (await cam()).t; await ev("document.getElementById('playBtn').click()");
  // hover in 3D: tooltip + linked timeline rule
  await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: c0.x + 30, y: c0.y + 10 }); await sleep(300);
  R.hover3d = await ev("({ tip: !document.getElementById('tip').hidden, rule: [...document.querySelectorAll('#f1b line')].some(l => l.style.display === '' && l.style.stroke.includes('ink2')), readout: document.querySelector('#readout .q').textContent })");
  // mid-animation frame: switching view starts a rotation that ends in the flat preset
  await ev("[...document.querySelectorAll('#viewSeg button')].find(b => b.textContent === 'ODSP over time').click()"); await sleep(250);
  R.midAnimation = await cam(); await sleep(900); R.endAnimation = await cam();
  R.endChecks = await ev(CHECK);
  // tour runs through every view and ends on the path view
  await ev("document.getElementById('tourBtn').click()"); const seen = new Set();
  for (let i = 0; i < 120; i++) { await sleep(250); const c = await cam(); seen.add(c.view); if (!(await ev("document.getElementById('tourBtn').textContent")).startsWith("Stop")) break; }
  R.tour = { viewsVisited: [...seen], endedOn: (await cam()).view, caption: await ev("document.getElementById('tourText').textContent").then(t => t.slice(0, 50)) };
  // reduced motion: switching is instant
  await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
  await open("theme=light&view=path", 1360);
  await ev("[...document.querySelectorAll('#viewSeg button')].find(b => b.textContent === '3D').click()"); await sleep(40);
  R.reducedMotion = await cam();
  await send("Emulation.setEmulatedMedia", { features: [] });
  // phone: 3D usable, touch drag rotates, no horizontal scroll
  await open("theme=light&view=3d", 400, true);
  await ev("document.getElementById('f1a').scrollIntoView({block:'center'})"); await sleep(300);
  const m0 = await ev("(() => { const r = document.querySelector('#f1a svg').getBoundingClientRect(); return { x: r.x + r.width * 0.5, y: r.y + r.height * 0.5 }; })()");
  const before = await cam();
  await send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: m0.x, y: m0.y }] });
  for (let i = 1; i <= 8; i++) await send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: m0.x + 6 * i, y: m0.y }] });
  await send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] }); await sleep(300);
  R.phone = { before, after: await cam(), checks: await ev(CHECK) };
  report.interact3d = R;
}
if (tasks.includes("mob3d")) {
  for (const th of ["light", "dark"]) {
    await open(`theme=${th}&view=3d`, 400, true);
    const b = await ev(`(() => { const r = document.querySelector('#s1 .fig').getBoundingClientRect(); return { x: r.x + scrollX, y: r.y + scrollY, width: r.width, height: document.querySelector('#f1a').getBoundingClientRect().bottom - r.top + 60 }; })()`);
    const r = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true, clip: { ...b, scale: 1 } });
    writeFileSync(`${OUT}/d3d-3d-mobile-${th}.png`, Buffer.from(r.data, "base64")); report["mob-" + th] = await ev(CHECK);
  }
}
if (tasks.includes("anglesweep")) { // render 3D across the whole allowed range of angles and check labels at each
  const bad = []; let n = 0;
  for (const w of [1360, 400]) { await open("theme=light&view=3d", w, w < 500);
    for (let yaw = -20; yaw <= 110; yaw += 10) for (let pitch = +(process.env.P0 || -15); pitch <= +(process.env.P1 || 85); pitch += 10) {
      const r = await ev("(async () => { const u = new URL(location); u.searchParams.set('yaw', " + yaw + "); u.searchParams.set('pitch', " + pitch + "); history.replaceState(null, '', u); return 1; })()");
      await send("Page.navigate", { url: URL0 + "?theme=light&view=3d&yaw=" + yaw + "&pitch=" + pitch });
      for (let k = 0; k < 40; k++) { await sleep(100); if (await ev("document.body.dataset.ready === '1'")) break; }
      const c = await ev(CHECK); n++; void r;
      if (c.textOverlaps.length || c.textClipped.length || c.pageScroll) bad.push({ w, yaw, pitch, o: c.textOverlaps.slice(0, 2), cl: c.textClipped.slice(0, 2) });
    } }
  report.anglesweep = { angles: n, problems: bad.length, first: bad.slice(0, 6) };
}
if (tasks.includes("checkq")) { // layout checks for a list of states (env QS = "q1;q2") at three widths
  const bad = []; let n = 0;
  for (const q of process.env.QS.split(";")) for (const w of [1360, 820, 400]) { await open(q, w, w < 500); const c = await ev(CHECK); n++;
    if (c.textOverlaps.length || c.textClipped.length || c.pageScroll || c.svgOverflow.length) bad.push({ q, w, ...c }); }
  report.checkq = { states: n, problems: bad };
}
if (tasks.includes("diffcons")) { // diff view: every dot against the axis ticks (time across, OW index − ODSP index up)
  const out = {};
  for (const mode of ["count", "index"]) for (const w of [1360, 400]) {
    await open(`theme=light&view=diff&mode=${mode}`, w, w < 500);
    out[`${mode}@${w}`] = await ev(`(() => {
      const svg = document.querySelector('#f1a svg'), axes = [...svg.querySelectorAll('g.axis')];
      const tr = el => { const c = el.transform && el.transform.baseVal.consolidate(); return c ? [c.matrix.e, c.matrix.f] : [0, 0]; };
      const fit = pts => { const n = pts.length, mx = pts.reduce((a, p) => a + p[0], 0) / n, my = pts.reduce((a, p) => a + p[1], 0) / n;
        const b = pts.reduce((a, p) => a + (p[0] - mx) * (p[1] - my), 0) / pts.reduce((a, p) => a + (p[0] - mx) ** 2, 0); return { a: my - b * mx, b, resid: Math.max(...pts.map(p => Math.abs(my - b * mx + b * p[0] - p[1]))) }; };
      const h = axes[0], v = axes[1], gh = tr(h), gv = tr(v);
      const hp = [...h.querySelectorAll('.tick')].map(t => [new Date(+t.textContent, 0, 1).getTime(), tr(t)[0] + gh[0]]);
      const vp = [...v.querySelectorAll('.tick')].map(t => [+t.textContent.replace('\u2212', '-'), tr(t)[1] + gv[1]]);
      const H = fit(hp), V = fit(vp);
      const dots = [...svg.querySelectorAll('circle')].filter(c => +c.getAttribute('r') === 2.4).map(c => [+c.getAttribute('cx'), +c.getAttribute('cy')]);
      const err = dots.map((p, i) => { const d = window.__Q[i]; return Math.max(Math.abs(H.a + H.b * d.date.getTime() - p[0]), Math.abs(V.a + V.b * (d.iow - d.iod) - p[1])); });
      return { dots: dots.length, maxDotErrorPx: +Math.max(...err).toFixed(3), tickResidPx: +Math.max(H.resid, V.resid).toFixed(3), vLabels: [...v.querySelectorAll('.tick')].map(t => t.textContent).join(' '),
        title: document.getElementById('f1aTitle').textContent.slice(0, 40), readoutDiff: [...document.querySelectorAll('#readout dd')].pop().textContent };
    })()`);
  }
  // arriving by animation (3D → diff) gives the same picture as opening it directly
  await open("theme=light&view=diff", 1360);
  const direct = await ev("[...document.querySelectorAll('#f1a svg circle')].filter(c => +c.getAttribute('r') === 2.4).map(c => [+c.getAttribute('cx'), +c.getAttribute('cy')])");
  await open("theme=light&view=3d", 1360);
  await ev(`[...document.querySelectorAll('#viewSeg button')].find(b => b.textContent.startsWith('OW −')).click()`); await sleep(1300);
  const anim = await ev("[...document.querySelectorAll('#f1a svg circle')].filter(c => +c.getAttribute('r') === 2.4).map(c => [+c.getAttribute('cx'), +c.getAttribute('cy')])");
  out.animatedArrival = { maxDotShiftPx: +Math.max(...anim.map((p, i) => Math.hypot(p[0] - direct[i][0], p[1] - direct[i][1]))).toFixed(3), cam: await ev("window.__cam()"), pressed: await ev(`[...document.querySelectorAll('#viewSeg button')].find(b => b.getAttribute('aria-pressed') === 'true').textContent`) };
  report.diffcons = out;
}
if (tasks.includes("figshot")) { // clipped Figure 1a shots into tools/out: env QS = "name=query;name=query", W, MOB
  const SP = SCRATCH + "/";
  const out = {};
  for (const item of process.env.QS.split(";")) { const [nm, q] = item.split("=", 2).length === 2 ? [item.slice(0, item.indexOf("=")), item.slice(item.indexOf("=") + 1)] : [item, item];
    const w = +(process.env.W || 1360); await open(q, w, w < 500);
    const b = await ev(`(() => { const r = document.querySelector('#s1 .fig').getBoundingClientRect(); return { x: r.x + scrollX, y: r.y + scrollY, width: r.width, height: Math.min(r.height, document.querySelector('#planeNote').getBoundingClientRect().bottom - r.top + 10) }; })()`);
    const r = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true, clip: { ...b, scale: 1 } });
    writeFileSync(SP + nm + ".png", Buffer.from(r.data, "base64")); const c = await ev(CHECK);
    out[nm] = { overlaps: c.textOverlaps, clipped: c.textClipped, scroll: c.pageScroll, note: await ev("document.getElementById('planeNote').textContent.slice(0, 160)") };
  }
  report.figshot = out;
}
if (tasks.includes("sweepfast")) { // every allowed angle via the page's test hook (no reload): env SQ = base query
  const bad = []; let n = 0;
  for (const w of [1360, 400]) { await open(process.env.SQ || "theme=light&view=3d", w, w < 500);
    for (let yaw = -20; yaw <= 110; yaw += 10) for (const pitch of [-50, -40, -30, -20, -10, 0, 10, 20, 30, 40, 50, 60, 70, 80, 85]) {
      await ev(`window.__setCam(${yaw}, ${pitch})`); const c = await ev(CHECK); n++;
      if (c.textOverlaps.length || c.textClipped.length || c.pageScroll) bad.push({ w, yaw, pitch, o: c.textOverlaps.slice(0, 2), cl: c.textClipped.slice(0, 2) });
    } }
  report.sweepfast = { angles: n, problems: bad.length, first: bad.slice(0, 5) };
}
report.errors = errors;
console.log(JSON.stringify(report, null, 1));
await close();
