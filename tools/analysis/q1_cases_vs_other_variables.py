import sys
from pathlib import Path
sys.stdout.reconfigure(encoding="utf-8")
REPO = Path(__file__).resolve().parents[2]          # repository root
OUTDIR = str(REPO / "tools" / "out") + "/"           # where the check scripts write their dumps
"""Q1 part 2: cases × other variables. Analysis only (not part of the site). Prints every number cited in Q1_DESIGN.md §7.3 and the 3D discussion."""
import pandas as pd, numpy as np, openpyxl
R = str(REPO / 'datasets/ONT-SA') + '/'
S = R + 'selected/'
pd.set_option('display.width', 200)
ow = pd.read_csv(S + 'ont-sa-characteristic-ow-ont.csv'); od = pd.read_csv(S + 'ont-sa-characteristic-odsp-ont.csv')
for d in (ow, od):
    d['date'] = pd.to_datetime(d.date); d['lab'] = d.year.astype(str) + 'Q' + d.quarter.astype(str)
lf = pd.read_csv(S + '1410028701_databaseLoadingData.csv'); lf['date'] = pd.to_datetime(lf.date)
lf['lab'] = lf.year.astype(str) + 'Q' + lf.quarter.astype(str)

print('=== 0. component sums vs cases (Ontario files) ===')
dims_ow = {'family type': ['fts', 'ftsp', 'ftc'], 'family size': ['fs1', 'fs2', 'fs3'], 'age (applicant)': ['age24', 'age2554', 'age55'],
           'sex (applicant)': ['male', 'female'], 'months on assistance': ['moa04', 'moa512', 'moa1318', 'moa19']}
dims_od = {**{k: v for k, v in dims_ow.items() if k != 'months on assistance'}, 'months on assistance': ['moa035', 'moa3659', 'moa60']}
for nm, d, dims in [('OW', ow, dims_ow), ('ODSP', od, dims_od)]:
    for k, cols in dims.items():
        r = (d[cols].sum(axis=1) / d.cases - 1) * 100
        print(f'  {nm:4s} {k:22s} sum/cases − 1: min {r.min():+.2f}%  max {r.max():+.2f}%')

print('\n=== 1. cases × unemployment (quarterly, 2017Q1–2025Q4) ===')
qa = lf.groupby('lab').agg(ur_avg=('ont_unemployment_rate_pct', 'mean'), lf_avg=('ont_labour_force_thousands', 'mean')).reset_index()
qe = lf[lf.month.isin([3, 6, 9, 12])][['lab', 'ont_unemployment_rate_pct', 'ont_labour_force_thousands']].rename(columns={'ont_unemployment_rate_pct': 'ur_end', 'ont_labour_force_thousands': 'lf_end'})
m = ow[['lab', 'date', 'covid_period', 'cases']].rename(columns={'cases': 'ow'}).merge(od[['lab', 'cases']].rename(columns={'cases': 'od'}), on='lab').merge(qa, on='lab').merge(qe, on='lab')
print('  overlap quarters:', len(m), m.lab.iloc[0], '→', m.lab.iloc[-1])
print('  UR peak month:', lf.loc[lf.ont_unemployment_rate_pct.idxmax(), ['date', 'ont_unemployment_rate_pct']].tolist())
print(m[(m.lab >= '2019Q4') & (m.lab <= '2021Q4')][['lab', 'ow', 'od', 'ur_avg', 'ur_end']].round(1).to_string(index=False))
def corr(a, b): return np.corrcoef(a, b)[0, 1]
for nm, sel in [('all 36 quarters', m), ('excluding pandemic (pre+post)', m[m.covid_period != 'during']), ('pre only (12 q)', m[m.covid_period == 'pre']),
                ('during only (13 q)', m[m.covid_period == 'during']), ('post only (11 q)', m[m.covid_period == 'post'])]:
    print(f'  levels r(OW, UR avg) {nm:30s} = {corr(sel.ow, sel.ur_avg):+.2f}   r(ODSP, UR) = {corr(sel.od, sel.ur_avg):+.2f}   n={len(sel)}')
m['dow'] = m.ow.pct_change() * 100; m['dod'] = m.od.pct_change() * 100; m['dur'] = m.ur_avg.diff()
print('  quarterly changes: r(ΔOW%, ΔUR) by lag (UR leads by k quarters):')
for k in range(0, 7):
    x = m.dur.shift(k); ok = x.notna() & m.dow.notna()
    okx = ok & (m.covid_period != 'during')
    print(f'    lag {k}: all r={corr(m.dow[ok], x[ok]):+.2f} (n={ok.sum()})   excl. pandemic quarters r={corr(m.dow[okx], x[okx]):+.2f} (n={okx.sum()})')
# robustness of the lag-0 change correlation: leave one quarter out
ok = m.dow.notna() & m.dur.notna(); base = corr(m.dow[ok], m.dur[ok]); loo = []
for i in m.index[ok]:
    o2 = ok.copy(); o2[i] = False; loo.append((m.lab[i], corr(m.dow[o2], m.dur[o2])))
lo = min(loo, key=lambda t: t[1]); hi = max(loo, key=lambda t: t[1])
print(f'  lag-0 change r = {base:+.2f}; leave-one-quarter-out range {lo[1]:+.2f} (drop {lo[0]}) to {hi[1]:+.2f} (drop {hi[0]})')
# rolling window × lag "surface"
print('  rolling 12-quarter window, levels r(OW, UR lagged k): window end × lag')
rows = []
for end in range(11, len(m)):
    w = m.iloc[end - 11:end + 1]; row = [m.lab[end]]
    for k in range(0, 5):
        x = m.ur_avg.shift(k).iloc[end - 11:end + 1]; okk = x.notna()
        row.append(round(corr(w.ow[okk], x[okk]), 2) if okk.sum() >= 8 else None)
    rows.append(row)
sf = pd.DataFrame(rows, columns=['window_end'] + [f'lag{k}' for k in range(5)])
print(sf.to_string(index=False))
print('  surface value range:', np.nanmin(sf.iloc[:, 1:].values.astype(float)), np.nanmax(sf.iloc[:, 1:].values.astype(float)))

print('\n=== 2. OW and ODSP cases per 1,000 people in the labour force ===')
m['ow_pk'] = m.ow / m.lf_avg; m['od_pk'] = m.od / m.lf_avg    # cases per 1,000 labour-force members (lf in thousands)
for lab in ['2017Q1', '2019Q4', '2021Q3', '2023Q1', '2025Q2', '2025Q4']:
    r = m[m.lab == lab].iloc[0]; print(f'  {lab}: OW {r.ow:,.0f} cases, LF {r.lf_avg:,.0f}k → {r.ow_pk:.1f} per 1,000; ODSP {r.od_pk:.1f} per 1,000')
a, b = m[m.lab == '2019Q4'].iloc[0], m[m.lab == '2025Q2'].iloc[0]
print(f'  2019Q4→2025Q2: OW cases {100*(b.ow/a.ow-1):+.1f}%, labour force {100*(b.lf_avg/a.lf_avg-1):+.1f}%, OW per 1,000 {100*(b.ow_pk/a.ow_pk-1):+.1f}%')
a2 = m[m.lab == '2017Q1'].iloc[0]; print(f'  2017Q1→2025Q4 labour force {100*(m.lf_avg.iloc[-1]/a2.lf_avg-1):+.1f}%')

print('\n=== 3. composition × time: who drove the OW fall and rise? ===')
def decomp(d, dims, a, b, title):
    A, B = d[d.lab == a].iloc[0], d[d.lab == b].iloc[0]; tot = B.cases - A.cases
    print(f'  {title} {a}→{b}: total {tot:+,.0f} ({100*tot/A.cases:+.1f}%)')
    for k, cols in dims.items():
        parts = ', '.join(f'{c} {B[c]-A[c]:+,.0f} ({100*(B[c]-A[c])/tot:.0f}% of change; group {100*(B[c]/A[c]-1):+.1f}%; share {100*A[c]/A.cases:.0f}%→{100*B[c]/B.cases:.0f}%)' for c in cols)
        print(f'     {k}: {parts}')
decomp(ow, dims_ow, '2020Q1', '2021Q3', 'OW fall')
decomp(ow, dims_ow, '2021Q3', '2025Q2', 'OW rise')
decomp(ow, dims_ow, '2003Q1', '2019Q4', 'OW pre')
decomp(od, dims_od, '2003Q1', '2019Q4', 'ODSP pre')
decomp(od, dims_od, '2019Q4', '2026Q1', 'ODSP since 2019Q4')

print('\n=== 4. OW vs ODSP composition (shares of cases, %) ===')
for lab in ['2003Q1', '2019Q4', '2026Q1']:
    A, B = ow[ow.lab == lab].iloc[0], od[od.lab == lab].iloc[0]
    def sh(r, c): return 100 * r[c] / r.cases
    print(f'  {lab}: age55 OW {sh(A,"age55"):.1f} / ODSP {sh(B,"age55"):.1f}; age24 {sh(A,"age24"):.1f} / {sh(B,"age24"):.1f}; '
          f'single-no-children {sh(A,"fts"):.1f} / {sh(B,"fts"):.1f}; single parent {sh(A,"ftsp"):.1f} / {sh(B,"ftsp"):.1f}; '
          f'female {sh(A,"female"):.1f} / {sh(B,"female"):.1f}; size3+ {sh(A,"fs3"):.1f} / {sh(B,"fs3"):.1f}')
# OW duration mix at key quarters
for lab in ['2019Q4', '2020Q1', '2021Q3', '2023Q1', '2025Q2', '2026Q1']:
    A = ow[ow.lab == lab].iloc[0]; print(f'  OW months on assistance {lab}: ≤4 {100*A.moa04/A.cases:.1f}%, 5–12 {100*A.moa512/A.cases:.1f}%, 13–18 {100*A.moa1318/A.cases:.1f}%, 19+ {100*A.moa19/A.cases:.1f}%  (≤4 count {A.moa04:,.0f}, 19+ {A.moa19:,.0f})')

print('\n=== 5. CMA × time: OW and ODSP index (2019Q4 = 100) ===')
for nm, f in [('OW', 'ont-sa-characteristic-ow-cma.csv'), ('ODSP', 'ont-sa-characteristic-odsp-cma.csv')]:
    c = pd.read_csv(S + f); c['lab'] = c.year.astype(str) + 'Q' + c.quarter.astype(str)
    p = c.pivot(index='lab', columns='cma', values='cases'); idx = p / p.loc['2019Q4'] * 100
    for lab in ['2021Q3', '2026Q1']:
        s = idx.loc[lab].sort_values(); print(f'  {nm} {lab}: min {s.iloc[0]:.1f} ({s.index[0].split(" - ")[1]}), median {s.median():.1f}, max {s.iloc[-1]:.1f} ({s.index[-1].split(" - ")[1]}), spread {s.iloc[-1]-s.iloc[0]:.1f}')
    cr = idx.loc['2017Q1':].corr().values; print(f'  {nm} CMA index paths 2017Q1–2026Q1: median pairwise r = {np.median(cr[np.triu_indices(15,1)]):.2f}, min {cr[np.triu_indices(15,1)].min():.2f}')

print('\n=== 6. historical workbook: beneficiaries per case (people per case, all social assistance) ===')
ws = openpyxl.load_workbook(R + 'original/historical_sa_recipients_dataset_en.xlsx', read_only=True).worksheets[0]
h = pd.DataFrame([r for r in ws.iter_rows(min_row=2, values_only=True) if r[0] is not None and r[3] not in ('na', None)], columns=['year', 'month', 'cases', 'ben'])
h['ppc'] = h.ben / h.cases
for y, mo in [(1981, 1), (1994, 3), (2003, 3), (2019, 12), (2021, 9), (2026, 3)]:
    r = h[(h.year == y) & (h.month == mo)]
    if len(r): r = r.iloc[0]; print(f'  {y}-{mo:02d}: cases {r.cases:,.0f}, beneficiaries {r.ben:,.0f}, people per case {r.ppc:.2f}')
