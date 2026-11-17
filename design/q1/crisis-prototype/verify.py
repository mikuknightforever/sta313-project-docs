"""Recompute browser-derived quantities independently with pandas, using the source CSVs."""
import hashlib
import json
import math
from pathlib import Path
import subprocess
import pandas as pd
from build_standalone import HERE, REPO, INPUTS


def expected_data():
    frames = {p: pd.read_csv(INPUTS[p]) for p in ['ow', 'odsp']}
    maps = {p: f.set_index(['year', 'quarter'])['cases'] for p, f in frames.items()}
    labour = pd.read_csv(INPUTS['unemployment'])
    assert len(labour) == 108 and not labour.duplicated(['year', 'month']).any()
    assert labour.groupby(['year', 'quarter']).size().eq(3).all()
    # Independently verify that the selected unemployment series matches the raw
    # Statistics Canada Ontario / age 15+ / total gender / seasonally adjusted rate.
    original = pd.read_csv(REPO / 'datasets/ONT-SA/1410028701_databaseLoadingData.csv')
    subset = original.loc[
        original['GEO'].eq('Ontario') & original['Labour force characteristics'].eq('Unemployment rate')
        & original['Gender'].eq('Total - Gender') & original['Age group'].eq('15 years and over')
        & original['Statistics'].eq('Estimate') & original['Data type'].eq('Seasonally adjusted')
    ].set_index('REF_DATE')['VALUE']
    for row in labour.itertuples():
        assert math.isclose(subset[f'{row.year}-{row.month:02d}'], row.ont_unemployment_rate_pct)
    unemp = labour.groupby(['year', 'quarter'])['ont_unemployment_rate_pct'].mean()
    records = []
    for (year, quarter), rate in unemp.items():
        previous = (year - 1, quarter)
        record = {'quarter': f'{year} Q{quarter}', 'year': int(year), 'quarterNumber': int(quarter),
                  'date': f'{year}-{quarter*3:02d}-01',
                  'period': 'pre' if year < 2020 else 'during' if (year, quarter) <= (2023, 1) else 'post',
                  'unemployment': rate,
                  'unemploymentYoY': rate - unemp[previous] if previous in unemp.index else None}
        for p, series in maps.items():
            record[p] = series[year, quarter]
            record[p + 'Index'] = series[year, quarter] / series[2019, 4] * 100
            record[p + 'YoY'] = (series[year, quarter] / series[previous] - 1) * 100
        records.append(record)
    assert len(records) == 36
    assert sum(r['unemploymentYoY'] is not None for r in records) == 32
    adequacy = []
    for row in pd.read_csv(INPUTS['adequacy']).to_dict('records'):
        row['ratio'] = row['income'] / row['threshold'] * 100
        row['gap'] = row['threshold'] - row['income']
        adequacy.append(row)
    return records, adequacy


def verify():
    expected, adequacy = expected_data()
    script = '''
      import fs from 'node:fs';
      import {deriveData, parseCSV} from './analysis.js';
      const paths = JSON.parse(process.argv[1]);
      const raw = Object.fromEntries(Object.entries(paths).map(([k,p])=>[k,fs.readFileSync(p,'utf8')]));
      const probe=parseCSV('a,b\\r\\n"a,b","said ""hi"""\\r\\n');
      if (probe[0].a !== 'a,b' || probe[0].b !== 'said "hi"') throw Error('CSV quoting failed');
      const data = deriveData(raw);
      let rejected = false;
      try {deriveData({...raw,unemployment:raw.unemployment.split('\\n').filter((_,i)=>i!==1).join('\\n')});}
      catch {rejected=true;}
      if(!rejected) throw Error('An incomplete quarter was silently accepted');
      process.stdout.write(JSON.stringify(data));
    '''
    result = subprocess.run(['node', '--input-type=module', '-e', script, json.dumps({k: str(v) for k,v in INPUTS.items()})], cwd=HERE, check=True, text=True, capture_output=True)
    actual = json.loads(result.stdout)
    checked = 0
    for want, got in zip(expected, actual['quarters'], strict=True):
        for key, value in want.items():
            if isinstance(value, (float, int)):
                assert math.isclose(value, got[key], rel_tol=1e-10, abs_tol=1e-8), (key, want, got)
            else:
                assert value == got[key], (key, value, got[key])
            checked += 1
    for want, got in zip(adequacy, actual['adequacy'], strict=True):
        for key in ['year', 'income', 'threshold', 'ratio', 'gap']:
            assert math.isclose(want[key], got[key], abs_tol=1e-8), (key, want, got)
            checked += 1
    df = pd.DataFrame(expected)
    report = {
        'checks_passed': checked,
        'raw_unemployment_months_verified': 108,
        'quarters': 36, 'joint_yoy_quarters': 32,
        'incomplete_quarter_rejected': True, 'csv_quoted_fields_checked': True,
        'quarterly_mean_unemployment_peak': df.loc[df.unemployment.idxmax(), ['quarter','unemployment']].to_dict(),
        'caseload_troughs': {p: df.loc[df[p].idxmin(), ['quarter',p,p+'Index']].to_dict() for p in ['ow','odsp']},
        'adequacy': actual['adequacy'],
        'input_hashes': {k: hashlib.sha256(v.read_bytes()).hexdigest() for k,v in INPUTS.items()},
        'interpretation': 'Independent arithmetic and extraction checks; not a causal analysis or a test of benefit eligibility.'
    }
    (HERE / 'verification.json').write_text(json.dumps(report, indent=2, ensure_ascii=False) + '\n')
    print(json.dumps({k:v for k,v in report.items() if k not in ['adequacy','input_hashes']}, indent=2))


if __name__ == '__main__':
    verify()
