import sys
from pathlib import Path
sys.stdout.reconfigure(encoding="utf-8")
REPO = Path(__file__).resolve().parents[2]          # repository root
OUTDIR = str(REPO / "tools" / "out") + "/"           # where the check scripts write their dumps
"""Candidate planes for the Q1 D cube: numbers and robustness. Analysis only (not part of the site); numbers cited in Q1_DESIGN.md §7.3."""
import pandas as pd, numpy as np
S = str(REPO / 'datasets/ONT-SA/selected') + '/'
ow = pd.read_csv(S + 'ont-sa-characteristic-ow-ont.csv'); od = pd.read_csv(S + 'ont-sa-characteristic-odsp-ont.csv')
q = ow[['date', 'year', 'quarter', 'covid_period', 'cases']].rename(columns={'cases': 'ow'}).merge(od[['date', 'cases']].rename(columns={'cases': 'od'}), on='date')
q['lab'] = q.year.astype(str) + 'Q' + q.quarter.astype(str); L = list(q.lab); ix = {l: i for i, l in enumerate(L)}
def at(l, c): return q.loc[ix[l], c]
def crossings(s):  # quarters where the sign changes (value at the first quarter on the new side)
    sg = np.sign(np.round(s.values, 9)); out = []
    for i in range(1, len(sg)):
        if sg[i] != sg[i - 1]: out.append((L[i], 'above' if sg[i] > 0 else 'below' if sg[i] < 0 else 'on'))
    return out

print('=== A. equal-growth plane (index: OW idx = ODSP idx), base 2019Q4 ===')
b = ix['2019Q4']; q['iow'] = q.ow / q.ow[b] * 100; q['iod'] = q.od / q.od[b] * 100; q['g'] = q.iow - q.iod
print('  crossings:', crossings(q.g))
for l in ['2003Q1', '2010Q1', '2019Q4', '2020Q1', '2020Q2', '2021Q3', '2022Q4', '2023Q1', '2025Q2', '2026Q1']:
    print(f'   {l}: OW idx {at(l,"iow"):.1f}, ODSP idx {at(l,"iod"):.1f}, gap {at(l,"g"):+.1f}')
print('  max gap after base:', q.lab[q.g[b:].idxmax()], round(q.g[b:].max(), 1), '| min:', q.lab[q.g[b:].idxmin()], round(q.g[b:].min(), 1), '| max before base:', q.lab[q.g[:b].idxmax()], round(q.g[:b].max(), 1))
print('  robustness: crossing dates for other bases (first quarter below, first quarter back above, after the base)')
for base in ['2019Q1', '2019Q2', '2019Q3', '2019Q4', '2019avg', '2020Q1']:
    if base == '2019avg': o0 = q.ow[q.year == 2019].mean(); d0 = q.od[q.year == 2019].mean(); start = ix['2019Q4']
    else: o0 = at(base, 'ow'); d0 = at(base, 'od'); start = ix[base]
    gg = q.ow / o0 * 100 - q.od / d0 * 100
    after = gg[start + 1:]; below = after[after < 0]
    fb = q.lab[below.index[0]] if len(below) else None
    back = after[(after.index > below.index[0]) & (after > 0)] if len(below) else []
    print(f'    base {base}: first below {fb}, back above {q.lab[back.index[0]] if len(back) else None}, min {gg[start:].min():+.1f} ({q.lab[gg[start:].idxmin()]}), 2026Q1 {gg.iloc[-1]:+.1f}')

print('\n=== B. OW share of the two programs (planes OW = k/(1-k)·ODSP through the time axis; base-free) ===')
q['sh'] = 100 * q.ow / (q.ow + q.od)
for l in ['2003Q1', '2019Q4', '2020Q1', '2021Q3', '2023Q1', '2025Q2', '2026Q1']: print(f'   {l}: OW share {at(l,"sh"):.1f}%  (OW {at(l,"ow"):,.0f}, ODSP {at(l,"od"):,.0f})')
print('  max', q.lab[q.sh.idxmax()], round(q.sh.max(), 1), ' min', q.lab[q.sh.idxmin()], round(q.sh.min(), 1))
print('  OW > ODSP in any quarter?', (q.ow > q.od).any(), '| equal-cases gap 2003Q1:', round(at('2003Q1', 'od') - at('2003Q1', 'ow')), 'cases')
for k in [35, 40, 45]: print(f'  share-{k}% plane crossings:', crossings(q.sh - k))
print('  share 2019Q4 → 2026Q1 change:', round(at('2026Q1', 'sh') - at('2019Q4', 'sh'), 1), 'pp; pre-pandemic 2003Q1→2019Q4:', round(at('2019Q4', 'sh') - at('2003Q1', 'sh'), 1), 'pp')

print('\n=== C. constant-total plane (cases: OW + ODSP = 2019Q4 total; index: w·OWidx + (1−w)·ODSPidx = 100) ===')
q['tot'] = q.ow + q.od; T0 = at('2019Q4', 'tot'); w = at('2019Q4', 'ow') / T0; q['ti'] = q.tot / T0 * 100
print(f'  2019Q4 total {T0:,.1f}; w = OW share at base = {w:.3f}')
print('  crossings of total = 2019Q4:', crossings(q.ti - 100))
for l in ['2003Q1', '2020Q1', '2021Q3', '2023Q3', '2023Q4', '2026Q1']: print(f'   {l}: total {at(l,"tot"):,.0f}, total index {at(l,"ti"):.1f}')
print('  min after base:', q.lab[q.ti[ix['2019Q4']:].idxmin()], round(q.ti[ix['2019Q4']:].min(), 1))
for base in ['2019avg', '2020Q1']:
    t0 = q.tot[q.year == 2019].mean() if base == '2019avg' else at(base, 'tot'); ti = q.tot / t0 * 100; aft = ti[ix['2020Q2']:]
    first_back = q.lab[aft[aft >= 100].index[0]]
    print(f'    base {base}: total min {ti[ix["2020Q1"]:].min():.1f}, back to base level first in {first_back}')

print('\n=== D. back-to-2019Q4-level planes (OW = OW_2019Q4; ODSP = ODSP_2019Q4) ===')
print('  OW crossings of its 2019Q4 level:', [c for c in crossings(q.iow - 100) if c[0] >= '2019Q4'])
print('  ODSP crossings of its 2019Q4 level:', [c for c in crossings(q.iod - 100) if c[0] >= '2019Q4'])
for base in ['2019avg', '2020Q1']:
    o0 = q.ow[q.year == 2019].mean() if base == '2019avg' else at(base, 'ow'); aft = q.ow[ix['2020Q2']:]
    print(f'    OW back to {base} level ({o0:,.0f}) first in {q.lab[aft[aft >= o0].index[0]]}')
print('  ODSP within ±1% of its 2019Q4 level, 2020Q1–2026Q1:', int(((q.iod - 100).abs()[ix['2020Q1']:] <= 1).sum()), 'of', len(q) - ix['2020Q1'], 'quarters; range', round(q.iod[ix['2020Q1']:].min(), 1), '–', round(q.iod[ix['2020Q1']:].max(), 1))

print('\n=== E. pre-pandemic trend baselines (reference only) ===')
t = np.arange(len(q))
for win in [('2003Q1', '2019Q4'), ('2010Q1', '2019Q4'), ('2015Q1', '2019Q4'), ('2017Q1', '2019Q4')]:
    a, z = ix[win[0]], ix[win[1]]
    for meth in ['linear', 'log-linear']:
        res = []
        for k in ['ow', 'od']:
            y = q[k].values[a:z + 1]; x = t[a:z + 1]
            if meth == 'linear': c = np.polyfit(x, y, 1); f = np.polyval(c, t[-1])
            else: c = np.polyfit(x, np.log(y), 1); f = np.exp(np.polyval(c, t[-1]))
            res.append(100 * (q[k].values[-1] / f - 1))
        print(f'  window {win[0]}–{win[1]} {meth:10s}: 2026Q1 actual vs trend: OW {res[0]:+.1f}%, ODSP {res[1]:+.1f}%')

print('\n=== F. time slice data (cross-section at the slider quarter) ===')
lf = pd.read_csv(S + '1410028701_databaseLoadingData.csv'); lf['lab'] = lf.year.astype(str) + 'Q' + lf.quarter.astype(str)
ur = lf[lf.month.isin([3, 6, 9, 12])].set_index('lab').ont_unemployment_rate_pct
for l in ['2019Q4', '2021Q3', '2025Q2']:
    print(f'   {l}: OW {at(l,"ow"):,.0f} (idx {at(l,"iow"):.1f}), ODSP {at(l,"od"):,.0f} (idx {at(l,"iod"):.1f}), OW share {at(l,"sh"):.1f}%, total {at(l,"tot"):,.0f}, UR quarter-end month {ur.get(l, float("nan"))}')
