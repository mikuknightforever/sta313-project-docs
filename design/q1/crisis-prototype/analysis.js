// Pure transformations shared by the live and self-contained prototypes.
export const CSV_PATHS = {
  ow: '../../../datasets/ONT-SA/selected/ont-sa-characteristic-ow-ont.csv',
  odsp: '../../../datasets/ONT-SA/selected/ont-sa-characteristic-odsp-ont.csv',
  unemployment: '../../../datasets/ONT-SA/selected/1410028701_databaseLoadingData.csv',
  adequacy: './data/adequacy.csv',
  events: './data/policy-events.csv'
};

export function parseCSV(text) {
  const rows = []; let row = [], field = '', quoted = false;
  const source = text.replace(/^\uFEFF/, '');
  for (let i = 0; i < source.length; i++) {
    const c = source[i];
    if (c === '"') {
      if (quoted && source[i + 1] === '"') { field += '"'; i++; }
      else quoted = !quoted;
    } else if (!quoted && (c === ',' || c === '\n' || c === '\r')) {
      row.push(field); field = '';
      if (c !== ',') {
        if (row.some(value => value !== '')) rows.push(row);
        row = [];
        if (c === '\r' && source[i + 1] === '\n') i++;
      }
    } else field += c;
  }
  if (quoted) throw new Error('Unterminated quoted CSV field.');
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  const headers = rows.shift();
  if (!headers?.length) throw new Error('CSV has no header.');
  return rows.map((values, i) => {
    if (values.length !== headers.length) throw new Error(`CSV row ${i + 2} has an unexpected field count.`);
    return Object.fromEntries(headers.map((key, j) => [key, values[j]]));
  });
}

function number(value, label) {
  if (value === '' || value == null || !Number.isFinite(Number(value))) throw new Error(`Missing or invalid ${label}.`);
  return Number(value);
}

function caseMap(rows, program) {
  const map = new Map();
  for (const row of rows) {
    const year = number(row.year, 'year'), month = number(row.month, 'month');
    if (![3, 6, 9, 12].includes(month)) throw new Error(`${program}: expected quarterly snapshots.`);
    const cases = number(row.cases, 'cases'), key = year * 4 + month / 3 - 1;
    if (cases <= 0 || map.has(key)) throw new Error(`${program}: non-positive or duplicated cases.`);
    map.set(key, cases);
  }
  return map;
}

export function deriveData(raw) {
  const ow = caseMap(parseCSV(raw.ow), 'OW'), odsp = caseMap(parseCSV(raw.odsp), 'ODSP');
  const monthly = parseCSV(raw.unemployment), groups = new Map(), seen = new Set();
  for (const row of monthly) {
    const year = number(row.year, 'year'), month = number(row.month, 'month');
    if (month < 1 || month > 12 || seen.has(`${year}-${month}`)) throw new Error('Invalid or duplicate unemployment month.');
    seen.add(`${year}-${month}`);
    const key = year * 4 + Math.floor((month - 1) / 3);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(number(row.ont_unemployment_rate_pct, 'unemployment rate'));
  }
  const unemployment = new Map([...groups].map(([key, values]) => {
    if (values.length !== 3) throw new Error('A quarterly unemployment mean requires all three months.');
    return [key, values.reduce((a, b) => a + b, 0) / 3];
  }));
  const base = 2019 * 4 + 3;
  if (!ow.has(base) || !odsp.has(base)) throw new Error('Missing 2019 Q4 baseline.');
  const quarters = [];
  for (let year = 2017; year <= 2025; year++) {
    for (let quarterNumber = 1; quarterNumber <= 4; quarterNumber++) {
      const key = year * 4 + quarterNumber - 1;
      if (![ow, odsp, unemployment].every(map => map.has(key))) throw new Error(`Incomplete common window at ${year} Q${quarterNumber}.`);
      const relative = map => map.has(key - 4) ? 100 * (map.get(key) / map.get(key - 4) - 1) : null;
      quarters.push({
        quarter: `${year} Q${quarterNumber}`, year, quarterNumber,
        date: `${year}-${String(quarterNumber * 3).padStart(2, '0')}-01`,
        period: key <= base ? 'pre' : key <= 2023 * 4 ? 'during' : 'post',
        ow: ow.get(key), odsp: odsp.get(key), unemployment: unemployment.get(key),
        owIndex: 100 * ow.get(key) / ow.get(base), odspIndex: 100 * odsp.get(key) / odsp.get(base),
        owYoY: relative(ow), odspYoY: relative(odsp),
        unemploymentYoY: unemployment.has(key - 4) ? unemployment.get(key) - unemployment.get(key - 4) : null
      });
    }
  }
  const adequacyKeys = new Set();
  const adequacy = parseCSV(raw.adequacy).map(row => {
    const year = number(row.year, 'scenario year'), income = number(row.income, 'annual welfare income');
    const threshold = number(row.threshold, 'MBM threshold'), key = `${year}-${row.program}`;
    if (income < 0 || threshold <= 0 || !['OW', 'ODSP'].includes(row.program) || adequacyKeys.has(key)) throw new Error('Invalid or duplicated adequacy scenario.');
    adequacyKeys.add(key);
    return {...row, year, income, threshold, ratio: 100 * income / threshold, gap: threshold - income};
  });
  return {quarters, adequacy, events: parseCSV(raw.events)};
}

export async function loadData() {
  const inline = globalThis.PROTOTYPE_CSV;
  const pairs = await Promise.all(Object.entries(CSV_PATHS).map(async ([name, path]) => {
    if (inline && typeof inline[name] === 'string') return [name, inline[name]];
    const response = await fetch(path);
    if (!response.ok) throw new Error(`Unable to load ${name}: HTTP ${response.status}.`);
    return [name, await response.text()];
  }));
  return deriveData(Object.fromEntries(pairs));
}
