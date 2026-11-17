import { loadData } from './analysis.js';

const $ = selector => document.querySelector(selector);
const NS = 'http://www.w3.org/2000/svg';
const state = { phase: 'all', measure: 'index', program: 'OW', selectedQuarter: '2020 Q2', connect: true, adequacyYear: null };
let data;
const n = (value, digits = 1) => Number(value).toLocaleString('en-CA', { minimumFractionDigits: digits, maximumFractionDigits: digits });
const signed = (value, digits = 1) => `${value > 0 ? '+' : value < 0 ? '−' : ''}${n(Math.abs(value), digits)}`;
const money = value => `$${n(value, 0)}`;
const text = (selector, value) => { $(selector).textContent = value; };
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const programName = program => program === 'OW' ? 'Ontario Works' : 'ODSP';
const programKey = program => program === 'OW' ? 'ow' : 'odsp';
const rowsInView = () => data.quarters.filter(row => state.phase === 'all' || row.period === state.phase);
const selectedRow = () => data.quarters.find(row => row.quarter === state.selectedQuarter);
const annualRows = () => data.adequacy.filter(row => row.year === state.adequacyYear).sort((a, b) => (a.program === 'OW' ? -1 : 1) - (b.program === 'OW' ? -1 : 1));

function node(tag, attrs = {}, content) {
  const item = document.createElementNS(NS, tag);
  Object.entries(attrs).forEach(([key, value]) => item.setAttribute(key, value));
  if (content !== undefined) item.textContent = content;
  return item;
}
function svgChart(container, height, title, description) {
  container.replaceChildren();
  const width = Math.max(240, Math.round(container.getBoundingClientRect().width));
  const svg = node('svg', { viewBox: `0 0 ${width} ${height}`, role: 'img', 'aria-label': `${title}. ${description}` });
  svg.append(node('title', {}, title), node('desc', {}, description));
  container.append(svg);
  return { svg, width, height };
}
function line(svg, x1, y1, x2, y2, cls, attrs = {}) { svg.append(node('line', { x1, y1, x2, y2, class: cls, ...attrs })); }
function label(svg, x, y, content, cls = 'tick-label', attrs = {}) { svg.append(node('text', { x, y, class: cls, ...attrs }, content)); }
function scale(lo, hi, a, b) { return value => a + (value - lo) / (hi - lo || 1) * (b - a); }
function ticks(lo, hi, count = 4) {
  const rough = (hi - lo) / count;
  const magnitude = 10 ** Math.floor(Math.log10(rough || 1));
  const ratio = rough / magnitude;
  const step = (ratio <= 1 ? 1 : ratio <= 2 ? 2 : ratio <= 2.5 ? 2.5 : ratio <= 5 ? 5 : 10) * magnitude;
  const result = [];
  for (let value = Math.ceil(lo / step) * step; value <= hi + step / 100; value += step) result.push(Math.abs(value) < 1e-8 ? 0 : value);
  return result;
}
function path(points, x, y, field) { return points.map((row, i) => `${i ? 'L' : 'M'}${x(i)},${y(row[field])}`).join(' '); }
function setPressed(container, attribute, selected) {
  document.querySelectorAll(`${container} button`).forEach(button => button.setAttribute('aria-pressed', String(button.dataset[attribute] === selected)));
}
function selectQuarter(quarter) {
  if (state.selectedQuarter === quarter) return;
  state.selectedQuarter = quarter;
  renderSelection();
}

function renderFacts() {
  const peak = data.quarters.reduce((best, row) => row.unemployment > best.unemployment ? row : best);
  const low = data.quarters.reduce((best, row) => row.owIndex < best.owIndex ? row : best);
  text('#fact-unemployment', `${n(peak.unemployment)}%`);
  text('#fact-unemployment-detail', `${peak.quarter} · mean of three monthly rates`);
  text('#fact-ow', `${signed(low.owIndex - 100)}%`);
  text('#fact-ow-detail', `${low.quarter} · ${n(low.ow, 0)} cases`);
  const latest = Math.max(...data.adequacy.map(row => row.year));
  const examples = data.adequacy.filter(row => row.year === latest);
  if (examples.length) {
    text('#fact-adequacy', `${n(Math.min(...examples.map(row => row.ratio)), 0)}–${n(Math.max(...examples.map(row => row.ratio)), 0)}%`);
    text('#fact-adequacy-detail', `${latest} · welfare income / Toronto MBM threshold`);
  } else {
    text('#fact-adequacy', 'Not available');
    text('#fact-adequacy-detail', 'No verified annual comparison loaded');
  }
  text('#closing-support', `OW and ODSP followed different paths around COVID-19. Quarterly unemployment peaked at ${n(peak.unemployment)}% in ${peak.quarter}, while OW reached its lowest indexed level in ${low.quarter}. The annual examples separately assess income against a specified basic-needs benchmark.`);
}

function renderEvents() {
  const parent = $('#policy-events'); parent.replaceChildren();
  for (const event of data.events) {
    const article = document.createElement('article'); article.className = 'policy-event';
    const date = document.createElement('time'); date.dateTime = event.date;
    const pieces = event.date.split('-');
    const dateObject = new Date(Date.UTC(Number(pieces[0]), Number(pieces[1]) - 1, Number(pieces[2] || 1)));
    date.textContent = dateObject.toLocaleDateString('en-CA', { month: 'short', ...(pieces.length === 3 ? { day: 'numeric' } : {}), year: 'numeric', timeZone: 'UTC' });
    const heading = document.createElement('h3'); heading.textContent = event.label;
    const description = document.createElement('p'); description.textContent = event.description;
    const anchor = document.createElement('a'); anchor.href = event.source_url; anchor.textContent = 'Source';
    article.append(date, heading, description, anchor); parent.append(article);
  }
}

function renderTimeline() {
  const rows = rowsInView(), selected = selectedRow();
  const target = $('#timeline-chart');
  const narrow = target.clientWidth < 500;
  const { svg, width } = svgChart(target, narrow ? 410 : 430, 'Ontario caseloads and unemployment over time', 'The upper panel compares OW and ODSP. The lower panel shows the quarterly mean unemployment rate. Use the quarter slider for exact values.');
  const margin = { left: narrow ? 43 : 55, right: 12 };
  const x = scale(0, Math.max(1, rows.length - 1), margin.left, width - margin.right);
  const caseTop = 32, caseBottom = narrow ? 214 : 228, uTop = narrow ? 274 : 284, uBottom = narrow ? 369 : 387;
  const keyOW = state.measure === 'index' ? 'owIndex' : 'ow';
  const keyODSP = state.measure === 'index' ? 'odspIndex' : 'odsp';
  const values = rows.flatMap(row => [row[keyOW], row[keyODSP]]);
  const caseLo = state.measure === 'count' ? 0 : Math.floor(Math.min(100, ...values) / 10) * 10 - 5;
  const caseHi = state.measure === 'count' ? Math.ceil(Math.max(...values) / 50000) * 50000 : Math.ceil(Math.max(100, ...values) / 10) * 10 + 5;
  const cy = scale(caseLo, caseHi, caseBottom, caseTop);
  const uHi = Math.ceil(Math.max(...rows.map(row => row.unemployment)) / 2) * 2;
  const uy = scale(0, uHi, uBottom, uTop);
  const during = rows.map((row, i) => row.period === 'during' ? i : -1).filter(i => i >= 0);
  if (during.length) {
    const half = (width - margin.left - margin.right) / Math.max(1, rows.length - 1) / 2;
    const left = Math.max(margin.left, x(during[0]) - half), right = Math.min(width - margin.right, x(during.at(-1)) + half);
    svg.append(node('rect', { x: left, y: caseTop, width: right - left, height: caseBottom - caseTop, class: 'phase-band' }));
    svg.append(node('rect', { x: left, y: uTop, width: right - left, height: uBottom - uTop, class: 'phase-band' }));
  }
  for (const tick of ticks(caseLo, caseHi, 4)) {
    line(svg, margin.left, cy(tick), width - margin.right, cy(tick), 'grid-line');
    label(svg, margin.left - 8, cy(tick) + 3, state.measure === 'count' ? `${n(tick / 1000, 0)}k` : n(tick, 0), 'tick-label', { 'text-anchor': 'end' });
  }
  if (state.measure === 'index') line(svg, margin.left, cy(100), width - margin.right, cy(100), 'reference-line');
  label(svg, margin.left, 15, state.measure === 'index' ? 'Cases · 2019 Q4 = 100' : 'Cases · quarterly observations', 'chart-title');
  svg.append(node('path', { d: path(rows, x, cy, keyOW), class: 'plot-line ow-line' }));
  svg.append(node('path', { d: path(rows, x, cy, keyODSP), class: 'plot-line odsp-line' }));
  for (const tick of ticks(0, uHi, 3)) {
    line(svg, margin.left, uy(tick), width - margin.right, uy(tick), 'grid-line');
    label(svg, margin.left - 8, uy(tick) + 3, `${n(tick, 0)}%`, 'tick-label', { 'text-anchor': 'end' });
  }
  label(svg, margin.left, uTop - 17, 'Ontario unemployment rate', 'chart-title');
  const unemploymentPath = path(rows, x, uy, 'unemployment');
  svg.append(node('path', { d: `${unemploymentPath} L${x(rows.length - 1)},${uBottom} L${x(0)},${uBottom} Z`, fill: 'var(--muted)', opacity: '.08' }));
  svg.append(node('path', { d: unemploymentPath, class: 'plot-line u-line' }));
  const tickIndices = [...new Set([0, Math.round((rows.length - 1) / 3), Math.round(2 * (rows.length - 1) / 3), rows.length - 1])];
  for (const index of tickIndices) {
    label(svg, x(index), uBottom + 23, rows[index].quarter, 'tick-label', { 'text-anchor': index === 0 ? 'start' : index === rows.length - 1 ? 'end' : 'middle' });
  }
  const index = rows.findIndex(row => row.quarter === selected.quarter);
  if (index >= 0) {
    line(svg, x(index), caseTop, x(index), caseBottom, 'selected-line');
    line(svg, x(index), uTop, x(index), uBottom, 'selected-line');
    [[keyOW, cy, 'var(--ow)'], [keyODSP, cy, 'var(--odsp)'], ['unemployment', uy, 'var(--muted)']].forEach(([key, y, color]) => svg.append(node('circle', { cx: x(index), cy: y(selected[key]), r: 4, fill: 'var(--surface)', stroke: color, 'stroke-width': 2 })));
  }
  const inspect = event => {
    const bounds = svg.getBoundingClientRect(), position = (event.clientX - bounds.left) / bounds.width * width;
    if (position < margin.left || position > width - margin.right) return;
    const index = Math.max(0, Math.min(rows.length - 1, Math.round((position - margin.left) / (width - margin.left - margin.right) * (rows.length - 1))));
    selectQuarter(rows[index].quarter);
  };
  svg.addEventListener('pointermove', event => { if (event.pointerType === 'mouse') inspect(event); });
  svg.addEventListener('pointerdown', inspect);
}

function renderReadout() {
  const row = selectedRow(), rows = rowsInView();
  text('#timeline-range', `${rows[0].quarter} — ${rows.at(-1).quarter}`);
  text('#selected-quarter', row.quarter);
  $('#quarter-slider').max = rows.length - 1;
  $('#quarter-slider').value = rows.findIndex(item => item.quarter === row.quarter);
  $('#quarter-slider').setAttribute('aria-valuetext', row.quarter);
  $('#quarter-readout').innerHTML = `<div class="ow-value"><span>Ontario Works</span><strong>${n(row.ow, 0)}</strong><small>${signed(row.owIndex - 100)}% vs 2019 Q4</small></div><div class="odsp-value"><span>ODSP</span><strong>${n(row.odsp, 0)}</strong><small>${signed(row.odspIndex - 100)}% vs 2019 Q4</small></div><div><span>Unemployment</span><strong>${n(row.unemployment)}%</strong><small>Quarterly mean rate</small></div>`;
}

function renderScatter() {
  const target = $('#scatter-chart'), narrow = target.clientWidth < 450;
  const rows = rowsInView().filter(row => Number.isFinite(row.unemploymentYoY) && Number.isFinite(row[`${programKey(state.program)}YoY`]));
  const key = `${programKey(state.program)}YoY`, color = state.program === 'OW' ? 'var(--ow)' : 'var(--odsp)';
  const { svg, width } = svgChart(target, narrow ? 350 : 375, `${programName(state.program)} annual change against unemployment annual change`, 'Each point is a quarter. The axes cross at zero. Positive unemployment change is to the right; positive caseload growth is above. The accessible table lists all values.');
  const margin = { left: narrow ? 43 : 52, right: 16, top: 40, bottom: narrow ? 278 : 305 };
  // Stable scales across programs and phases support honest comparisons.
  const valid = data.quarters.filter(row => Number.isFinite(row.unemploymentYoY));
  const xExtent = Math.ceil(Math.max(...valid.map(row => Math.abs(row.unemploymentYoY))) * 1.1);
  const yExtent = Math.ceil(Math.max(...valid.flatMap(row => [Math.abs(row.owYoY), Math.abs(row.odspYoY)])) / 5) * 5 + 5;
  const x = scale(-xExtent, xExtent, margin.left, width - margin.right), y = scale(-yExtent, yExtent, margin.bottom, margin.top);
  label(svg, margin.left, 15, 'Caseload change · year over year (%)', 'chart-title');
  for (const tick of ticks(-xExtent, xExtent, narrow ? 4 : 6)) {
    line(svg, x(tick), margin.top, x(tick), margin.bottom, tick === 0 ? 'reference-line' : 'grid-line');
    label(svg, x(tick), margin.bottom + 18, signed(tick, 0), 'tick-label', { 'text-anchor': 'middle' });
  }
  for (const tick of ticks(-yExtent, yExtent, 5)) {
    line(svg, margin.left, y(tick), width - margin.right, y(tick), tick === 0 ? 'reference-line' : 'grid-line');
    label(svg, margin.left - 8, y(tick) + 3, signed(tick, 0), 'tick-label', { 'text-anchor': 'end' });
  }
  label(svg, margin.left + 5, margin.top + 12, 'Unemployment ↓  Cases ↑', 'quadrant-label');
  label(svg, width - margin.right - 5, margin.top + 12, 'Both ↑', 'quadrant-label', { 'text-anchor': 'end' });
  label(svg, margin.left + 5, margin.bottom - 8, 'Both ↓', 'quadrant-label');
  label(svg, width - margin.right - 5, margin.bottom - 8, 'Unemployment ↑  Cases ↓', 'quadrant-label', { 'text-anchor': 'end' });
  const xTitle = narrow ? ['Unemployment-rate change', 'year over year (percentage points)'] : ['Unemployment-rate change · year over year (pp)'];
  xTitle.forEach((content, i) => label(svg, (margin.left + width - margin.right) / 2, margin.bottom + 42 + i * 14, content, 'axis-label', { 'text-anchor': 'middle' }));
  if (state.connect && rows.length) svg.append(node('path', { d: rows.map((row, i) => `${i ? 'L' : 'M'}${x(row.unemploymentYoY)},${y(row[key])}`).join(' '), fill: 'none', stroke: color, 'stroke-width': 1.3, opacity: .4 }));
  for (const row of rows) {
    const selected = row.quarter === state.selectedQuarter;
    const dot = node('circle', { cx: x(row.unemploymentYoY), cy: y(row[key]), r: selected ? 6 : 3.5, fill: selected ? color : 'var(--surface)', stroke: color, 'stroke-width': selected ? 2.5 : 1.5, opacity: selected ? 1 : .75 });
    dot.append(node('title', {}, `${row.quarter}: unemployment ${signed(row.unemploymentYoY)} pp; ${state.program} cases ${signed(row[key])}%`));
    svg.append(dot);
  }
  const row = selectedRow();
  if (Number.isFinite(row.unemploymentYoY) && rows.includes(row)) {
    const px = x(row.unemploymentYoY), py = y(row[key]);
    const anchor = px > width / 2 ? 'end' : 'start';
    label(svg, px + (anchor === 'end' ? -10 : 10), Math.max(margin.top + 28, Math.min(margin.bottom - 18, py - 11)), row.quarter, 'chart-title', { 'text-anchor': anchor, 'paint-order': 'stroke', stroke: 'var(--surface)', 'stroke-width': 4, 'stroke-linejoin': 'round' });
  }
  svg.addEventListener('pointerdown', event => {
    const bounds = svg.getBoundingClientRect(), px = (event.clientX - bounds.left) / bounds.width * width, py = (event.clientY - bounds.top) / bounds.height * (narrow ? 350 : 375);
    const closest = rows.reduce((best, row) => {
      const distance = Math.hypot(x(row.unemploymentYoY) - px, y(row[key]) - py);
      return !best || distance < best.distance ? { row, distance } : best;
    }, null);
    if (closest && closest.distance < 30) selectQuarter(closest.row.quarter);
  });
  text('#scatter-quarter', row.quarter);
  const available = Number.isFinite(row.unemploymentYoY);
  $('#scatter-readout').innerHTML = available ? `<div class="scatter-value"><span>Unemployment change</span><strong>${signed(row.unemploymentYoY)} pp</strong></div><div class="scatter-value"><span>${escape(state.program)} cases change</span><strong>${signed(row[key])}%</strong></div>` : '<p class="small-note">The unemployment series starts in 2017. A year-over-year comparison is not available for this quarter.</p>';
  let message = 'Choose a quarter from 2018 onward to compare annual changes.';
  if (available) {
    if (row.unemploymentYoY > 0 && row[key] < 0) message = 'Unemployment rose while recorded cases fell. What role did other support, eligibility and access play? The direction alone cannot distinguish them.';
    else if (row.unemploymentYoY < 0 && row[key] > 0) message = 'Unemployment fell while recorded cases rose. Caseloads can reflect pressures and transitions that an unemployment rate alone does not capture.';
    else if (row.unemploymentYoY > 0 && row[key] > 0) message = 'Unemployment and recorded cases both rose. Moving together does not show whether support reached everyone who needed it.';
    else if (row.unemploymentYoY < 0 && row[key] < 0) message = 'Unemployment and recorded cases both fell. This does not establish that recipients’ needs were met or explain why they left assistance.';
    else message = 'At least one measure was unchanged year over year. An unchanged rate can still represent substantial economic pressure.';
  }
  text('#scatter-interpretation', message);
  text('#scatter-sample', `${rows.length} comparable quarters in this period. Annual changes overlap in time; points are not independent observations. Tap a point or use the quarter slider above.`);
}

function renderAdequacy() {
  const rows = annualRows(), target = $('#adequacy-chart');
  if (!rows.length) { target.textContent = 'No verified annual comparison is available.'; return; }
  const narrow = target.clientWidth < 450;
  const { svg, width } = svgChart(target, 215, `Welfare income as a share of the Toronto MBM threshold in ${state.adequacyYear}`, 'Two example single-adult households are compared with a 100 percent poverty-threshold reference. The exact amounts appear below.');
  const left = 12, right = 23, max = Math.max(110, Math.ceil(Math.max(...rows.map(row => row.ratio)) / 10) * 10 + 10);
  const x = scale(0, max, left, width - right);
  const ys = [67, 143];
  line(svg, x(100), 28, x(100), 164, 'reference-line');
  label(svg, x(100), 16, 'MBM 100%', 'tick-label', { 'text-anchor': 'middle' });
  rows.forEach((row, i) => {
    const y = ys[i] ?? 67 + i * 76, color = row.program === 'OW' ? 'var(--ow)' : 'var(--odsp)';
    label(svg, left, y - 21, `${programName(row.program)} · single adult`, 'chart-title');
    line(svg, left, y, x(100), y, 'grid-line', { 'stroke-width': 8, 'stroke-linecap': 'round' });
    line(svg, left, y, x(row.ratio), y, '', { stroke: color, 'stroke-width': 8, 'stroke-linecap': 'round' });
    svg.append(node('circle', { cx: x(row.ratio), cy: y, r: 6, fill: color, stroke: 'var(--surface)', 'stroke-width': 2 }));
    label(svg, x(row.ratio), y + 24, `${n(row.ratio)}%`, 'chart-title', { 'text-anchor': 'middle' });
  });
  for (const tick of [0, 25, 50, 75, 100]) label(svg, x(tick), 198, `${tick}%`, 'tick-label', { 'text-anchor': tick === 0 ? 'start' : 'middle' });
  $('#adequacy-values').innerHTML = rows.map(row => `<div class="adequacy-value ${row.program === 'ODSP' ? 'odsp-value' : ''}"><h3>${escape(programName(row.program))}</h3><dl><div><dt>Total welfare income</dt><dd>${money(row.income)}</dd></div><div><dt>MBM threshold</dt><dd>${money(row.threshold)}</dd></div><div class="gap-row"><dt>${row.gap >= 0 ? 'Below threshold' : 'Above threshold'}</dt><dd>${money(Math.abs(row.gap))}</dd></div></dl></div>`).join('');
  text('#adequacy-scope', `${state.adequacyYear} examples for ${rows[0].geography}; ${rows[0].mbm_base} MBM base. The OW example is a single adult considered employable; the ODSP example is a single adult with a disability.`);
  const source = $('#adequacy-source'); source.replaceChildren();
  const unique = [...new Set(rows.map(row => row.source_url))];
  unique.forEach((url, i) => { const link = document.createElement('a'); link.href = url; link.textContent = unique.length > 1 ? `Annual income report ${i + 1}` : 'Annual income report'; source.append(link, document.createElement('br')); });
  const thresholds = [...new Set(rows.map(row => row.threshold_source_url).filter(Boolean))];
  thresholds.forEach((url, i) => { const link = document.createElement('a'); link.href = url; link.textContent = thresholds.length > 1 ? `Threshold source ${i + 1}` : 'Threshold source'; source.append(link, document.createElement('br')); });
  const status = [...new Set(rows.map(row => row.threshold_status).filter(Boolean))].join(' ');
  const note = (rows.find(row => row.program === 'OW') || rows[0]).note || '';
  const visibleNote = note.replace(/The report explicitly estimates LIM[\s\S]*$/, '').trim();
  text('#adequacy-note', `${visibleNote} Benchmark status: ${status}. Years are separate published snapshots; changes in methods and benefit components must be checked before a cross-year comparison.`);
  $('#adequacy-table tbody').innerHTML = rows.map(row => `<tr><td>${row.year}</td><td>${escape(row.program)}</td><td>${money(row.income)}</td><td>${money(row.threshold)}</td><td>${n(row.ratio)}%</td><td>${escape(row.mbm_base)}</td></tr>`).join('');
}

function renderTable() {
  const cells = row => [row.quarter, n(row.ow, 0), n(row.odsp, 0), `${n(row.unemployment)}%`, `${signed(row.owYoY)}%`, `${signed(row.odspYoY)}%`, Number.isFinite(row.unemploymentYoY) ? `${signed(row.unemploymentYoY)} pp` : 'Unavailable'];
  $('#quarter-table tbody').innerHTML = rowsInView().map(row => `<tr>${cells(row).map(value => `<td>${escape(value)}</td>`).join('')}</tr>`).join('');
}
function renderSelection() { renderReadout(); renderTimeline(); renderScatter(); }
function renderAll() { renderSelection(); renderAdequacy(); renderTable(); }

$('#theme-toggle').addEventListener('click', () => {
  const dark = document.documentElement.dataset.theme !== 'dark';
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  $('#theme-toggle').setAttribute('aria-pressed', String(dark));
  $('#theme-toggle').textContent = dark ? 'Light mode' : 'Dark mode';
});

async function start() {
  try {
    data = await loadData();
    if (!data.quarters.length) throw new Error('No quarterly observations were loaded.');
    if (!data.quarters.some(row => row.quarter === state.selectedQuarter)) state.selectedQuarter = data.quarters[0].quarter;
    const years = [...new Set(data.adequacy.map(row => row.year))].sort((a, b) => b - a);
    state.adequacyYear = years[0] ?? null;
    $('#adequacy-year').replaceChildren(...years.map(year => { const option = document.createElement('option'); option.value = year; option.textContent = year; return option; }));
    $('#loading').hidden = true; $('#analysis').hidden = false;
    window.q1PrototypeState = { data, state };
    renderFacts(); renderEvents(); renderAll();
    $('#phase-controls').addEventListener('click', event => {
      const button = event.target.closest('button'); if (!button) return;
      state.phase = button.dataset.phase; setPressed('#phase-controls', 'phase', state.phase);
      const rows = rowsInView(); if (!rows.some(row => row.quarter === state.selectedQuarter)) state.selectedQuarter = rows[0].quarter;
      renderSelection(); renderTable();
    });
    $('#measure-controls').addEventListener('click', event => { const button = event.target.closest('button'); if (!button) return; state.measure = button.dataset.measure; setPressed('#measure-controls', 'measure', state.measure); renderTimeline(); });
    $('#program-controls').addEventListener('click', event => { const button = event.target.closest('button'); if (!button) return; state.program = button.dataset.program; setPressed('#program-controls', 'program', state.program); renderScatter(); });
    $('#quarter-slider').addEventListener('input', event => selectQuarter(rowsInView()[Number(event.target.value)].quarter));
    $('#path-toggle').addEventListener('change', event => { state.connect = event.target.checked; renderScatter(); });
    $('#adequacy-year').addEventListener('change', event => { state.adequacyYear = Number(event.target.value); renderAdequacy(); });
    let resizeFrame;
    let lastWidth = window.innerWidth;
    window.addEventListener('resize', () => {
      if (window.innerWidth === lastWidth) return;
      lastWidth = window.innerWidth;
      cancelAnimationFrame(resizeFrame); resizeFrame = requestAnimationFrame(renderAll);
    });
  } catch (error) {
    $('#loading').hidden = true; $('#error').hidden = false;
    $('#error').textContent = `The analysis could not be loaded. ${error.message} Open this folder through the project’s local server, or use the self-contained standalone.html file.`;
    console.error(error);
  }
}
start();
