// Page checks for Q3: screenshots at exact widths, layout checks (page scroll, text overlaps, clipped text),
// keyboard, real mouse / touch events and console errors. See tools/README.md.
import { writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { startSession, REPO, sleep } from "./lib/cdp.mjs";

const { send, ev, errors, close, httpBase } = await startSession({ cdpPort: +(process.env.CDP_PORT || 9333) });
const BASE = httpBase + "design/q3/prototype/index.html";
const OUT = path.join(REPO, "design/q3/screenshots");          // the screenshots the docs refer to
// usage: node tools/check_q3.mjs [all|shots|hover|keys|touch|brush|dump]   (FULL=1 adds the period × width overlap sweep)
const SCRATCH = path.join(REPO, "tools/out");                    // dumps and scratch screenshots (git-ignored)
mkdirSync(OUT, { recursive: true }); mkdirSync(SCRATCH, { recursive: true });

async function open(query, width, mobile = false) {
  await send("Emulation.setDeviceMetricsOverride", { width, height: 1000, deviceScaleFactor: 1, mobile });
  await send("Emulation.setTouchEmulationEnabled", { enabled: mobile });
  await send("Page.navigate", { url: BASE + (query ? "?" + query : "") });
  for (let i = 0; i < 60; i++) { await sleep(200); if (await ev("!!document.querySelector('#f2map svg .hit') && !!document.querySelector('#card h3')")) break; }
  await sleep(500);
}
async function shot(name, clipSel) {
  const H = await ev("document.documentElement.scrollHeight");
  const W = await ev("document.documentElement.clientWidth");
  let clip = { x: 0, y: 0, width: W, height: H, scale: 1 };
  if (clipSel) { const b = await ev(`(()=>{const r=document.querySelector('${clipSel}').getBoundingClientRect();return {x:r.x+scrollX,y:r.y+scrollY,width:r.width,height:r.height}})()`); clip = { ...b, scale: 1 }; }
  const r = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true, clip });
  writeFileSync(`${OUT}/${name}.png`, Buffer.from(r.data, "base64"));
  console.log("shot", name, Math.round(clip.width) + "x" + Math.round(clip.height));
}
const checks = () => ev(`(()=>{const s=document.querySelector('#f2map svg');return {
  pageScroll: document.documentElement.scrollWidth - document.documentElement.clientWidth,
  mapOverflow: s.getBoundingClientRect().right - document.querySelector('#f2map').getBoundingClientRect().right,
  labelOverlaps: +s.dataset.labelOverlaps, maxShift: +s.dataset.maxShift,
  smallestHit: Math.min(...[...document.querySelectorAll('.hit')].map(c=>2*c.r.baseVal.value)),
  syms: document.querySelectorAll('.sym[fill]').length, labels: document.querySelectorAll('.maplbl').length,
  card: document.querySelector('#card h3').textContent }})()`);
const center = sel => ev(`(()=>{const r=document.querySelector('${sel}').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);
const scrollTo = sel => ev(`document.querySelector('${sel}').scrollIntoView({block:'center'})`);

const task = process.argv[2] || "all";
const report = {};
if (task === "all" || task === "shots") {
  for (const [name, q, w, mob] of [["desktop-light", "theme=light", 1360], ["desktop-dark", "theme=dark", 1360], ["mobile-light", "theme=light", 400, true], ["mobile-dark", "theme=dark", 400, true]]) {
    await open(q, w, mob); report[name] = await checks(); await shot(name);
  }
  // interaction state (Step 1 share mode + pandemic period + Toronto mix)
  await open("theme=light&step=2&mode=share&iso=moa19&period=during&cma=535&detail=mix", 1360); report.state = await checks(); await shot("state-share-pandemic-light");
  await open("theme=dark&step=2&mode=share&iso=moa19&period=during&cma=535&detail=mix", 1360); await shot("state-share-pandemic-dark");
  // every preset period at desktop and phone width: label overlaps must stay 0
  if (process.env.FULL) for (const p of ["latest", "post", "during", "pre", "all"]) for (const [w, mob] of [[1360, false], [400, true], [820, false]]) {
    await open(`period=${p}`, w, mob); const c = await checks(); report[`overlap ${p} @${w}`] = c.labelOverlaps + " overlaps, max shift " + c.maxShift + "px, page scroll " + c.pageScroll;
  }
}
if (task === "all" || task === "hover") {
  await open("theme=light", 1360);
  await scrollTo("#fig2");
  const p = await center('.hit[aria-label^="Toronto"]');
  await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: p.x, y: p.y });
  await sleep(400);
  report.hover = { card: await ev("document.querySelector('#card h3').textContent"), mode: await ev("document.querySelector('#card .mode').textContent"),
    f3hl: await ev("d3.select('#f3 g.r.hl').empty() ? null : d3.select('#f3 g.r.hl').datum().name"),
    f4hl: await ev("document.querySelector('#f4 .f4other.hl')?.dataset.cma ?? null"), symhl: await ev("d3.select('#f2map .sym.hl').empty()?null:d3.select('#f2map .sym.hl').datum().code") };
  await shot("hover-toronto-light", "#fig2");
  await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: 5, y: 5 }); await sleep(200);
  report.afterLeave = await ev("document.querySelector('#card h3').textContent");
  // reverse link: hover a Figure 3 row → map symbol highlighted
  await scrollTo("#f3");
  const r3 = await center('#f3 g.r:nth-of-type(5) .bg');
  await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: r3.x, y: r3.y }); await sleep(300);
  report.reverse = { row: await ev("d3.select('#f3 g.r.hl').empty()?null:d3.select('#f3 g.r.hl').datum().name"), sym: await ev("d3.select('#f2map .sym.hl').empty()?null:d3.select('#f2map .sym.hl').datum().name") };
}
if (task === "all" || task === "keys") {
  await open("theme=light", 1360);
  await ev("document.activeElement.blur(); document.querySelector('#periodSeg button').focus()");
  const key = async (k, code, vk) => { await send("Input.dispatchKeyEvent", { type: "keyDown", key: k, code, windowsVirtualKeyCode: vk }); await send("Input.dispatchKeyEvent", { type: "keyUp", key: k, code, windowsVirtualKeyCode: vk }); await sleep(60); };
  const seen = [];
  for (let i = 0; i < 40 && seen.length < 15; i++) {
    await key("Tab", "Tab", 9);
    const a = await ev("document.activeElement.classList.contains('hit') ? [document.activeElement.getAttribute('aria-label').split(':')[0], document.querySelector('#card h3').textContent] : null");
    if (a) seen.push(a);
  }
  report.tabOrder = seen.map(([n, c]) => n + (n === c ? "" : " (card shows " + c + ")"));
  await key("Enter", "Enter", 13);
  report.enterSelects = await ev("[d3.select('#f2map .sym.sel').datum().name, document.querySelector('#card .mode').textContent, document.querySelector('#f4Title').textContent]");
}
if (task === "all" || task === "touch") {
  await open("theme=light", 400, true);
  await scrollTo("#f2map");
  const p = await center('.hit[aria-label^="Ottawa"]');
  await send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: p.x, y: p.y }] });
  await send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await sleep(500);
  report.tap = await ev("[document.querySelector('#card h3').textContent, document.querySelector('#card .mode').textContent, document.querySelector('#card').getBoundingClientRect().top > document.querySelector('#f2map').getBoundingClientRect().bottom - 1]");
  await shot("mobile-tap-ottawa-light", "#fig2");
}
if (task === "brush") {
  await open("theme=light", 1360);
  await scrollTo("#periodStrip");
  const b = await ev(`(()=>{const r=document.querySelector('#periodStrip .overlay').getBoundingClientRect();return {x:r.x,y:r.y+r.height/2,w:r.width}})()`);
  const x1 = b.x + b.w * 0.52, x2 = b.x + b.w * 0.72;
  await send("Input.dispatchMouseEvent", { type: "mousePressed", x: x1, y: b.y, button: "left", clickCount: 1 });
  for (let i = 1; i <= 8; i++) await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: x1 + (x2 - x1) * i / 8, y: b.y, button: "left", buttons: 1 });
  await send("Input.dispatchMouseEvent", { type: "mouseReleased", x: x2, y: b.y, button: "left", clickCount: 1 });
  await sleep(700);
  report.brush = await ev("[document.querySelector('#periodNow').textContent, document.querySelector('#f2Period').textContent, document.querySelector('#f3Period').textContent, document.querySelector('#card .per').textContent, [...document.querySelectorAll('#periodSeg button')].filter(b=>b.getAttribute('aria-pressed')==='true').length]");
  await open("period=pre&from=2010Q1&to=2014Q4", 1360);
  report.urlCustom = await ev("document.querySelector('#periodNow').textContent");
}
if (task === "dump") {
  const out = { aria: {}, cards: {}, takeaway: {} };
  for (const per of ["latest", "post", "during", "pre", "all"]) {
    await open(`period=${per}`, 1360);
    out.aria[per] = await ev("[...document.querySelectorAll('.hit')].map(h=>h.getAttribute('aria-label'))");
    out.takeaway[per] = await ev("document.querySelector('#mapTakeaway').textContent");
  }
  await open("period=post", 1360);
  const n = await ev("document.querySelectorAll('.hit').length");
  for (let i = 0; i < n; i++) {
    const c = await ev(`(()=>{const h=document.querySelectorAll('.hit')[${i}]; h.dispatchEvent(new FocusEvent('focus')); const k=document.querySelector('#card'); return {name:k.querySelector('h3').textContent, stats:[...k.querySelectorAll('dd')].map(d=>d.textContent), bars:k.querySelectorAll('svg')[1].getAttribute('aria-label'), sum:k.querySelector('.sum').textContent, warn:!!k.querySelector('.warn')}})()`);
    out.cards[c.name] = c;
  }
  out.inset = await ev("[...document.querySelectorAll('.inset text')].map(t=>t.textContent)");
  writeFileSync(path.join(SCRATCH, "q3_page_dump.json"), JSON.stringify(out, null, 1));
  report.dumped = Object.keys(out.cards).length;
}
report.errors = errors;
console.log(JSON.stringify(report, null, 1));
await close();
