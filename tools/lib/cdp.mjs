// Shared driver for the page checks (tools/check_q1.mjs, check_q2.mjs, check_q3.mjs).
// 1. Uses the local server on HTTP_PORT (default 8000) if it is already serving this repository; otherwise starts
//    serve.py (no-cache server in the repository root) and stops it again at the end.
// 2. Launches a headless Chromium browser (Edge or Chrome; override with BROWSER=/path/to/browser) and connects to it
//    over the Chrome DevTools Protocol, so checks use exact viewport widths and real mouse, keyboard and touch events.
// Needs Node 22+ (built-in fetch and WebSocket). Standard library only.
import { spawn } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import os from "node:os";

export const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
export const sleep = ms => new Promise(r => setTimeout(r, ms));
const BROWSERS = [
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Google/Chrome/Application/chrome.exe", "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge", "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/microsoft-edge", "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser",
];

export async function startSession({ cdpPort, httpPort = +(process.env.HTTP_PORT || 8000) }) {
  const httpBase = `http://127.0.0.1:${httpPort}/`;
  // the server counts only if it serves this repository (serve.py sits in its root)
  const up = async () => { try { return (await fetch(httpBase + "serve.py", { method: "HEAD" })).ok; } catch { return false; } };
  let server = null;
  if (!(await up())) {
    const py = process.env.PYTHON || (process.platform === "win32" ? "python" : "python3");
    server = spawn(py, [path.join(REPO, "serve.py"), String(httpPort)], { stdio: "ignore" });
    for (let i = 0; i < 50 && !(await up()); i++) await sleep(200);
    if (!(await up())) { server.kill(); throw new Error(`Could not start serve.py on port ${httpPort} (port in use by another program? set HTTP_PORT)`); }
  }
  const exe = process.env.BROWSER || BROWSERS.find(p => existsSync(p));
  if (!exe) { server?.kill(); throw new Error("No Edge or Chrome found: set BROWSER to a Chromium-based browser executable"); }
  const prof = path.join(os.tmpdir(), `sta313-cdp-${cdpPort}`); mkdirSync(prof, { recursive: true });
  const browser = spawn(exe, ["--headless=new", "--disable-gpu", "--hide-scrollbars", `--remote-debugging-port=${cdpPort}`, `--user-data-dir=${prof}`, "--no-first-run", "about:blank"], { stdio: "ignore" });
  let list;
  for (let i = 0; i < 75; i++) { try { list = await (await fetch(`http://127.0.0.1:${cdpPort}/json/list`)).json(); if (list.some(t => t.type === "page")) break; } catch {} await sleep(200); }
  if (!list || !list.some(t => t.type === "page")) {
    browser.kill(); server?.kill();
    throw new Error(`The browser did not open DevTools port ${cdpPort}. A previous run may still be closing: wait a few seconds, or set CDP_PORT.`);
  }
  const ws = new WebSocket(list.find(t => t.type === "page").webSocketDebuggerUrl);
  await new Promise(r => ws.addEventListener("open", r));
  let id = 0; const pend = new Map(), errors = [];
  ws.addEventListener("message", e => {
    const m = JSON.parse(e.data);
    if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); return; }
    if (m.method === "Runtime.exceptionThrown") errors.push("exception: " + m.params.exceptionDetails.exception?.description);
    if (m.method === "Runtime.consoleAPICalled" && ["error", "warning"].includes(m.params.type)) errors.push(m.params.type + ": " + m.params.args.map(a => a.value ?? a.description).join(" "));
    if (m.method === "Log.entryAdded" && m.params.entry.level === "error" && !/Tracking Prevention|favicon/.test(m.params.entry.text + (m.params.entry.url || ""))) errors.push("log: " + m.params.entry.text);
  });
  const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pend.set(i, m => (m.error ? rej(new Error(method + ": " + m.error.message)) : res(m.result))); ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async expr => { const r = await send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true }); return r.result.value; };
  await send("Runtime.enable"); await send("Log.enable"); await send("Page.enable"); await send("Network.enable"); await send("Network.setCacheDisabled", { cacheDisabled: true });
  const close = async () => { try { ws.close(); } catch {} browser.kill(); if (server) server.kill(); await sleep(300); };
  return { send, ev, errors, close, httpBase };
}
