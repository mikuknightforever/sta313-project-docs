// Page checks for Q2: screenshots at exact widths, layout checks (page scroll, text overlaps, clipped text),
// keyboard, real mouse / touch events and console errors. See tools/README.md.
import { writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { startSession, REPO, sleep } from "./lib/cdp.mjs";

const { send, ev, errors, close, httpBase } = await startSession({ cdpPort: +(process.env.CDP_PORT || 9336) });
const ROOT = httpBase + "design/q2/";
const OUT = path.join(REPO, "design/q2/screenshots");          // the screenshots the docs refer to
const SCRATCH = path.join(REPO, "tools/out");                    // dumps and scratch screenshots (git-ignored)
mkdirSync(OUT, { recursive: true }); mkdirSync(SCRATCH, { recursive: true });


// usage: node tools/check_q2.mjs <variant-dir> <prefix> [stateQuery] [tasks]
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
  report.text = await ev("[...document.querySelectorAll('.lead, .story-text, .card li, table, .note, figcaption, .pitch, .readout, .challenge, .key, .period-note')].map(e => e.innerText).concat([...document.querySelectorAll('svg text')].map(t => t.textContent)).join(String.fromCharCode(10))");
  writeFileSync(`${SCRATCH}/q2_${PREFIX}_dump.json`, JSON.stringify(report, null, 1));
  delete report.facts; report.text = report.text.length + " chars dumped";
}
if (tasks.includes("thumb")) {
  await open("theme=light", 1360);
  const b = await ev(`(() => { const r = document.querySelector('${process.env.THUMB || "#s1 .fig"}').getBoundingClientRect(); return { x: r.x + scrollX, y: r.y + scrollY, width: r.width, height: Math.min(r.height, +('${process.env.TH || 620}')) }; })()`);
  const r = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true, clip: { ...b, scale: 0.6 } });
  writeFileSync(`${OUT}/${PREFIX}-thumb.png`, Buffer.from(r.data, "base64")); report.thumb = `${Math.round(b.width * 0.6)}x${Math.round(b.height * 0.6)}`;
}

if (tasks.includes("state")) { // custom state screenshot: node q2check.mjs <dir> <prefix> "<query>" state  (env NAME, W, MOB, JS)
  const w = +(process.env.W || 1360), mob = !!process.env.MOB;
  await open(STATEQ, w, mob);
  if (process.env.JS) { report.js = await ev(`(async () => { ${process.env.JS} })()`); await sleep(+(process.env.WAIT || 600)); }
  report.state = { size: await shot(`${PREFIX}-${process.env.NAME || "state"}`), ...(await ev(CHECK)) };
}
if (tasks.includes("eval")) { await open(STATEQ, +(process.env.W || 1360), !!process.env.MOB); report.eval = await ev(`(async () => { ${process.env.JS} })()`); }
if (tasks.includes("hoverat")) { // env SEL (element), FX, FY fractions inside its box
  await open(STATEQ, +(process.env.W || 1360), !!process.env.MOB);
  await ev(`document.querySelector('${process.env.SEL}').scrollIntoView({block:'center'})`); await sleep(300);
  const p = await ev(`(() => { const r = document.querySelector('${process.env.SEL}').getBoundingClientRect(); return { x: r.x + r.width * ${process.env.FX || 0.5}, y: r.y + r.height * ${process.env.FY || 0.5} }; })()`);
  if (process.env.PRE) await ev(`(() => { ${process.env.PRE} })()`);
  if (process.env.MOB) { await send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: p.x, y: p.y }] }); await send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] }); }
  else await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: p.x, y: p.y });
  await sleep(500);
  if (process.env.POST) report.post = await ev(`(() => { ${process.env.POST} })()`);
  report.tip = await ev("!document.getElementById('tip').hidden ? document.getElementById('tip').innerText.split(String.fromCharCode(10)).join(' | ') : null");
  if (process.env.NAME) report.shot = await (async () => { const r = await send("Page.captureScreenshot", { format: "png" }); writeFileSync(`${OUT}/${PREFIX}-${process.env.NAME}.png`, Buffer.from(r.data, "base64")); return "viewport"; })();
}
if (tasks.includes("texts")) { // facts + page text in several states (env STATES = "q1;q2;...")
  const out = { facts: null, texts: {} };
  for (const q of (process.env.STATES || "theme=light").split(";")) {
    await open(q, 1360);
    if (!out.facts) out.facts = await ev(`JSON.parse(JSON.stringify(window.__facts, (k, v) => (k === 'rows' ? undefined : v)))`);
    out.texts[q] = await ev("[...document.querySelectorAll('.lead, .story-text, .card li, table, .note, figcaption, .pitch, .readout, .challenge, .key, .period-note, #tOut')].map(e => e.innerText).concat([...document.querySelectorAll('svg text')].filter(t => t.style.display !== 'none').map(t => t.textContent)).join(String.fromCharCode(10))");
  }
  writeFileSync(`${SCRATCH}/q2_${PREFIX}_texts.json`, JSON.stringify(out, null, 1));
  report.texts = Object.keys(out.texts).length + " states dumped";
}
report.errors = errors;
console.log(JSON.stringify(report, null, 1));
await close();
process.exit(0);
