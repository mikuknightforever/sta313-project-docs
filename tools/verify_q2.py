import sys
from pathlib import Path
sys.stdout.reconfigure(encoding="utf-8")
REPO = Path(__file__).resolve().parents[1]          # repository root
OUTDIR = str(REPO / "tools" / "out") + "/"           # where the check scripts write their dumps
"""Independent pandas recomputation of every Q2 fact, compared with the browser's window.__facts and with every
number that appears in the page text (6 states per variant). Written separately from q2-common.js."""
import pandas as pd, numpy as np, json, re, math
R = str(REPO / 'datasets/ONT-SA/selected') + '/'
SC = OUTDIR
ow = pd.read_csv(R + 'ont-sa-characteristic-ow-cma.csv'); od = pd.read_csv(R + 'ont-sa-characteristic-odsp-cma.csv')
oo = pd.read_csv(R + 'ont-sa-characteristic-ow-ont.csv'); oo['cma'] = 'ont'
odo = pd.read_csv(R + 'ont-sa-characteristic-odsp-ont.csv'); odo['cma'] = 'ont'
cols = ['cma', 'date', 'year', 'quarter', 'covid_period', 'cases', 'fts', 'ftsp', 'ftc', 'fs1']
m = pd.concat([ow[cols], oo[cols]]).merge(pd.concat([od[cols], odo[cols]]), on=['cma', 'date', 'year', 'quarter', 'covid_period'], suffixes=('_ow', '_od'))
# data checks
for p in ['ow', 'od']:
    assert np.allclose(m[f'fts_{p}'] + m[f'ftsp_{p}'] + m[f'ftc_{p}'], m[f'cases_{p}']), 'components do not sum'
    assert np.allclose(m[f'fts_{p}'], m[f'fs1_{p}'])
m['sow'] = 100 * m.fts_ow / m.cases_ow; m['sod'] = 100 * m.fts_od / m.cases_od; m['gap'] = m.sod - m.sow
m = m.sort_values(['cma', 'date']).reset_index(drop=True)
m['label'] = m.year.astype(str) + ' Q' + m.quarter.astype(str)
name = lambda c: 'Ontario (all)' if c == 'ont' else c.split(' - ')[1].replace('--', '–')
G = {c: g.reset_index(drop=True) for c, g in m.groupby('cma')}
N = len(G['ont']); labels = list(G['ont'].label)
I19, I23 = labels.index('2019 Q4'), labels.index('2023 Q1')
cmas = [c for c in G if c != 'ont']
print(f'rows matched: {sum(len(G[c]) for c in cmas)} CMA-quarters, {len(cmas)} CMAs x {N} quarters; I19={I19} I23={I23}')

def summ(c, i0, i1):
    g = G[c]; a, z = g.iloc[i0], g.iloc[i1]
    widen = int((g.gap.iloc[i0:i1 + 1].diff().iloc[1:] > 0).sum())
    return dict(name=name(c), a=a, z=z, g0=a.gap, g1=z.gap, nar=a.gap - z.gap, dOW=z.sow - a.sow, dOD=z.sod - a.sod, widen=widen, steps=i1 - i0)

W = sorted([summ(c, 0, N - 1) for c in cmas], key=lambda s: (-s['nar'], s['name']))
O = summ('ont', 0, N - 1)
E = {}
E['ont'] = dict(g0=O['g0'], g1=O['g1'], nar=O['nar'], dOW=O['dOW'], dOD=O['dOD'], widen=O['widen'])
for k, i in [('top', 0), ('second', 1), ('third', 2), ('least', -1)]:
    s = W[i]; E[k] = dict(name=s['name'], g0=s['g0'], g1=s['g1'], nar=s['nar'], dOW=s['dOW'], dOD=s['dOD'], widen=s['widen'])
E['nNarrow'] = sum(s['nar'] > 0 for s in W)
E['dOW'] = [min(s['dOW'] for s in W), max(s['dOW'] for s in W)]
E['dOD'] = [min(s['dOD'] for s in W), max(s['dOD'] for s in W)]
E['widen'] = [min(s['widen'] for s in W), max(s['widen'] for s in W)]
om = max(W, key=lambda s: s['dOD']); E['odMax'] = dict(name=om['name'], dOD=om['dOD'], dOW=om['dOW'])
E['odFell'] = [s['name'] for s in sorted([s for s in W if s['dOD'] < 0], key=lambda s: s['dOD'])]
ew = max(W, key=lambda s: s['g1']); E['endWidest'] = dict(name=ew['name'], g1=ew['g1'])
ph = []
for c in cmas:
    g = G[c].gap; ph.append(dict(name=name(c), pre=g[0] - g[I19], during=g[I19] - g[I23], post=g[I23] - g[N - 1]))
E['preLargest'] = sum(p['pre'] > p['during'] and p['pre'] > p['post'] for p in ph)
E['durWiden'] = [(p['name'], p['during']) for p in sorted([p for p in ph if p['during'] < 0], key=lambda p: p['during'])]
E['postNarrow'] = sum(p['post'] > 0 for p in ph)
cm = m[m.cma != 'ont']
E['cells'] = len(cm); E['odAbove'] = int((cm.sod > cm.sow).sum())
gx = cm.loc[cm.gap.idxmax()]; gn = cm.loc[cm.gap.idxmin()]
E['gapMax'] = (name(gx.cma), gx.label, gx.gap); E['gapMin'] = (name(gn.cma), gn.label, gn.gap)
last = cm[cm.date == cm.date.max()].sort_values('cases_ow')
E['small'] = [(name(r.cma), r.cases_ow) for r in last.head(3).itertuples()]

# ---- print the key facts (for the report) ----
print('Ontario: OW {:.1f} -> {:.1f}, ODSP {:.1f} -> {:.1f}, gap {:.1f} -> {:.1f} (narrowed {:.1f}), widened in {} of {}'.format(
    O['a'].sow, O['z'].sow, O['a'].sod, O['z'].sod, O['g0'], O['g1'], O['nar'], O['widen'], O['steps']))
for i, s in enumerate(W, 1):
    p = next(x for x in ph if x['name'] == s['name'])
    print(f"{i:2d} {s['name']:30s} gap {s['g0']:.1f}->{s['g1']:.1f} nar {s['nar']:.1f} | dOW {s['dOW']:+.1f} dOD {s['dOD']:+.1f} | widen {s['widen']} | pre {p['pre']:.1f} dur {p['during']:.1f} post {p['post']:.1f}")
print('dOW range', [round(v, 1) for v in E['dOW']], 'dOD range', [round(v, 1) for v in E['dOD']], 'widen range', E['widen'], 'odFell', E['odFell'])
print('preLargest', E['preLargest'], 'durWiden', [(n, round(v, 1)) for n, v in E['durWiden']], 'postNarrow', E['postNarrow'], 'odAbove', E['odAbove'], '/', E['cells'])
print('gapMax', E['gapMax'][:2], round(E['gapMax'][2], 1), 'gapMin', E['gapMin'][:2], round(E['gapMin'][2], 1), 'small', E['small'], 'endWidest', E['endWidest'])

# ---- compare with the browser facts ----
def close(a, b): return b is not None and math.isclose(float(a), float(b), rel_tol=1e-9, abs_tol=1e-9)
def check(F):
    bad = []
    def c(path, e, p):
        if not close(e, p): bad.append((path, e, p))
    for k in ['g0', 'g1', 'nar', 'dOW', 'dOD', 'widen']: c('ont.' + k, E['ont'][k], F['ont'].get(k))
    for k in ['top', 'second', 'third', 'least']:
        if F[k]['e']['name'] != E[k]['name']: bad.append((k, E[k]['name'], F[k]['e']['name']))
        for f in ['g0', 'g1', 'nar', 'dOW', 'dOD', 'widen']: c(f'{k}.{f}', E[k][f], F[k].get(f))
    c('nNarrow', E['nNarrow'], F['nNarrow'])
    for k in ['dOW', 'dOD', 'widen']: c(k + '[0]', E[k][0], F[k][0]); c(k + '[1]', E[k][1], F[k][1])
    if F['odMax']['e']['name'] != E['odMax']['name']: bad.append(('odMax', E['odMax']['name'], F['odMax']['e']['name']))
    c('odMax.dOD', E['odMax']['dOD'], F['odMax']['dOD'])
    if [r['e']['name'] for r in F['odFell']] != E['odFell']: bad.append(('odFell', E['odFell'], [r['e']['name'] for r in F['odFell']]))
    if F['endWidest']['e']['name'] != E['endWidest']['name']: bad.append(('endWidest', E['endWidest'], F['endWidest']['e']['name']))
    for k in ['preLargest', 'postNarrow', 'cells', 'odAbove']: c(k, E[k], F[k])
    if [(p['e']['name']) for p in F['durWiden']] != [n for n, _ in E['durWiden']]: bad.append(('durWiden', E['durWiden'], F['durWiden']))
    for (n, v), p in zip(E['durWiden'], F['durWiden']): c('durWiden.' + n, v, p['during'])
    if (F['gapMax']['c']['name'], F['gapMax']['r']['label']) != E['gapMax'][:2]: bad.append(('gapMax', E['gapMax'], F['gapMax']))
    c('gapMax', E['gapMax'][2], F['gapMax']['r']['gap']); c('gapMin', E['gapMin'][2], F['gapMin']['r']['gap'])
    if [s['name'] for s in F['small']] != [n for n, _ in E['small']]: bad.append(('small', E['small'], [s['name'] for s in F['small']]))
    for (n, v) in E['small']: pass
    for r, s in zip(F['rank'], W):
        if r['e']['name'] != s['name']: bad.append(('rank order', s['name'], r['e']['name']))
        for f in ['g0', 'g1', 'nar', 'dOW', 'dOD', 'widen']: c(f"rank.{s['name']}.{f}", s[f], r.get(f))
    for r in F['phase']:
        p = next(x for x in ph if x['name'] == r['e']['name'])
        for f in ['pre', 'during', 'post']: c(f"phase.{p['name']}.{f}", p[f], r[f])
    return bad

# ---- every number a page may show, formatted the way the page formats it ----
from decimal import Decimal, ROUND_HALF_UP
def fmts(v):  # the page (JavaScript toFixed) rounds halves up; Python round() rounds halves to even, so accept both
    r = round(v + 0, 1); hu = int(Decimal(repr(float(v))).quantize(Decimal('1'), rounding=ROUND_HALF_UP))
    return {f'{abs(r):.1f}', f'{round(v):,}', str(int(round(v))), f'{hu:,}', str(hu)}
exp = set()
periods = [(0, N - 1), (0, I19), (I19, I23), (I23, N - 1)]
for c in G:
    for i0, i1 in periods:
        s = summ(c, i0, i1)
        for v in [s['g0'], s['g1'], s['nar'], s['dOW'], s['dOD'], s['widen'], s['steps']]: exp |= fmts(v)
        for r in [s['a'], s['z']]:
            for f in ['sow', 'sod', 'gap', 'cases_ow', 'cases_od', 'fts_ow', 'fts_od']: exp |= fmts(r[f])
        for a, b in zip([i0, I19, I23], [I19, I23, i1]):  # waterfall segments inside the period
            if i0 <= a < b <= i1: exp |= fmts(G[c].gap[a] - G[c].gap[b])
for n_, v in E['small']: exp |= fmts(v)
exp |= fmts(E['cells']) | fmts(len(cmas)) | fmts(N - 1)
print('expected value strings:', len(exp))
for v in 'abc':
    d = json.load(open(SC + f'q2_{v}_texts.json', encoding='utf-8'))
    bad = check(d['facts'])
    allnums, unk = 0, []
    for q, txt in d['texts'].items():
        nums = re.findall(r'(?<![\w.])[+−-]?\d[\d,]*(?:\.\d+)?', txt)
        allnums += len(nums)
        for n in nums:
            s = n.lstrip('+−-')
            if s in exp: continue
            val = float(s.replace(',', ''))
            if 2003 <= val <= 2026 and ',' not in s and '.' not in s: continue       # years / quarter labels
            if '.' not in s and val in (0, 1, 2, 3, 4, 5, 100): continue            # step numbers, Q1..Q4, "#k" handled below
            if '.' not in s and val % 5 == 0: continue                               # axis ticks, gridlines, constant-gap lines
            i = txt.find(n); unk.append((q, n, txt[max(0, i - 30):i + 12].replace('\n', ' ')))
    # ranks "#1".."#15" and "x of 15" are counts, not data values
    unk = [u for u in unk if not (re.fullmatch(r'\d{1,2}', u[1]) and 1 <= int(u[1]) <= 15)]
    print(f'--- {v}: fact mismatches {len(bad)} {bad[:4]} | numbers in text (6 states) {allnums}, unexplained {len(unk)}')
    for u in unk[:30]: print('    ', u)
