"""Q1: recompute every fact the A–D pages show (pandas) and match every number in their text.
First run: for v in a-timeline b-change c-longview d-paths: node tools/check_q1.mjs <dir> <a|b|c|d> "" facts"""
import sys
from pathlib import Path
sys.stdout.reconfigure(encoding="utf-8")
REPO = Path(__file__).resolve().parents[1]          # repository root
OUTDIR = str(REPO / "tools" / "out") + "/"           # where the check scripts write their dumps
import pandas as pd, numpy as np, json, re, math, sys
R=str(REPO / 'datasets/ONT-SA/selected') + '/'
ow=pd.read_csv(R+'ont-sa-characteristic-ow-ont.csv'); od=pd.read_csv(R+'ont-sa-characteristic-odsp-ont.csv')
lf=pd.read_csv(R+'1410028701_databaseLoadingData.csv'); hi=pd.read_csv(R+'ont-sa-historical.csv')
q=ow[['date','year','quarter','covid_period','cases']].rename(columns={'cases':'ow'}).merge(od[['date','cases']].rename(columns={'cases':'odsp'}),on='date')
q['label']=q.year.astype(str)+' Q'+q.quarter.astype(str)
b0=q[q.label=='2019 Q4'].iloc[0]; q['iow']=q.ow/b0.ow*100; q['iod']=q.odsp/b0.odsp*100; b=q[q.label=='2019 Q4'].iloc[0]
q['yow']=q.ow.pct_change(4)*100; q['yod']=q.odsp.pct_change(4)*100
E={}  # expected facts (pandas)
row=lambda r:{'label':r.label,'ow':r.ow,'odsp':r.odsp,'iow':r.iow,'iod':r.iod}
E['base']=row(b); E['last']=row(q.iloc[-1]); E['first']=row(q.iloc[0])
E['owMin']=row(q.loc[q.ow.idxmin()]); E['owMax']=row(q.loc[q.ow.idxmax()]); E['odspMax']=row(q.loc[q.odsp.idxmax()]); E['odspMin']=row(q.loc[q.odsp.idxmin()])
s19=q[q.year>=2019]; E['odsp19']={'lo':row(s19.loc[s19.odsp.idxmin()]),'hi':row(s19.loc[s19.odsp.idxmax()])}
E['ratio19']=b.odsp/b.ow
after=q[q.date>q.loc[q.ow.idxmin(),'date']]; E['owBack']=row(after[after.iow>=100].iloc[0])
E['phase']={}
for p in ['pre','during','post']:
    r=q[q.covid_period==p]; a=r.iloc[0]; z=r.iloc[-1]; yrs=(len(r)-1)/4
    E['phase'][p]={'a':row(a),'z':row(z),'n':len(r),'years':yrs,'ow':(z.ow/a.ow-1)*100,'odsp':(z.odsp/a.odsp-1)*100,'owAnn':((z.ow/a.ow)**(1/yrs)-1)*100,'odspAnn':((z.odsp/a.odsp)**(1/yrs)-1)*100}
y=q.dropna(subset=['yow'])
for k,c in [('yowMin','yow'),('yodMin','yod')]: r=y.loc[y[c].idxmin()]; E[k]={**row(r),c:r[c]}
for k,c in [('yowMax','yow'),('yodMax','yod')]: r=y.loc[y[c].idxmax()]; E[k]={**row(r),c:r[c]}
E['same']=int((np.sign(y.yow)==np.sign(y.yod)).sum()); E['nYoY']=len(y)
E['urMax']={'ur':lf.ont_unemployment_rate_pct.max()}; E['hMax']={'cases':hi.ont_all_assistance_cases.max()}
E['h1994']={'cases':hi[hi.date<'1998-04-01'].ont_all_assistance_cases.max()}
E['hPre']={'cases':hi[hi.date=='2020-02-01'].ont_all_assistance_cases.item()}
E['hLow']={'cases':hi[hi.date>='2020-03-01'].ont_all_assistance_cases.min()}
m=hi.merge(q,on='date'); m['gap']=m.ont_all_assistance_cases-m.ow-m.odsp
E['gapLo']=m.gap.min(); E['gapHi']=m.gap.max(); E['h1912']=hi[hi.date=='2019-12-01'].ont_all_assistance_cases.item()
def cmp(path,e,p,bad):
    if isinstance(e,dict):
        for k in e: cmp(path+'.'+k,e[k],(p or {}).get(k),bad)
    elif isinstance(e,str):
        if e!=p: bad.append((path,e,p))
    else:
        if p is None or not math.isclose(float(e),float(p),rel_tol=1e-9,abs_tol=1e-9): bad.append((path,e,p))
# numbers formatted the way the page formats them
def fmts(v):
    out=set(); r=round(v+0,1)
    out|={f"{round(v):,}",f"{abs(r):.1f}",f"{r:.1f}",str(round(v))}
    return out
exp=set()
def walk(e):
    if isinstance(e,dict): [walk(x) for x in e.values()]
    elif isinstance(e,(int,float,np.floating)): exp.update(fmts(float(e)))
walk(E)
# derived values shown on pages
exp.update(fmts(E['last']['odsp']-E['last']['ow'])); exp.update(fmts(E['nYoY']-E['same'])); exp.update(fmts((E['hLow']['cases']/E['hPre']['cases']-1)*100))
exp.update(fmts(E['odsp19']['hi']['iod']-E['odsp19']['lo']['iod'])); exp.update(fmts(m[m.date=='2019-12-01'].iloc[0].ow+m[m.date=='2019-12-01'].iloc[0].odsp))
L=q.iloc[-1]; P=q.iloc[-2]; exp.update(fmts((L.ow/P.ow-1)*100)); exp.update(fmts((L.odsp/P.odsp-1)*100)); exp.update(fmts(len(q)))
for p in E['phase'].values():
    for k in ['a','z']: [exp.update(fmts(p[k][f])) for f in ['ow','odsp','iow','iod']]
exp.update(fmts(lf.ont_unemployment_rate_pct.iloc[-1])); exp.update(fmts(E['yowMin']['yow'])); exp.update(fmts(E['yodMin']['yod']))
exp.update(fmts(q.iloc[-1].yow)); exp.update(fmts(q.iloc[-1].yod)); exp.update(fmts(q.iloc[-1].iow-100)); exp.update(fmts(q.iloc[-1].iod-100))
print('expected value strings:',len(exp))
for v in 'abcd':
    d=json.load(open(OUTDIR + f'q1_{v}_dump.json',encoding='utf-8')); bad=[]
    keys=['base','last','owMin','owMax','odspMax','odsp19','ratio19','owBack','phase','yowMin','yodMin','yowMax','yodMax','same','nYoY','urMax','hMax','h1994','hPre','hLow','gapLo','gapHi','h1912']
    for k in keys: cmp(k,E[k],d['facts'].get(k),bad)
    txt=d['text']; nums=re.findall(r'(?<![\w.])[+−-]?\d[\d,]*(?:\.\d+)?', txt)
    unk=[]
    for n in nums:
        s=n.lstrip('+−-')
        if s in exp: continue
        val=float(s.replace(',',''))
        if 1969<=val<=2026 and ',' not in s and '.' not in s: continue          # years
        if val in (1,2,3,4,0) : continue                                          # step numbers, Q1..Q4, zero
        if val==100 or val==45: continue                                          # "2019 Q4 = 100", 45° guide
        ctx=txt[max(0,txt.find(n)-25):txt.find(n)+12].replace('\n',' ')
        unk.append((n,ctx))
    # axis ticks (round numbers in svg) are expected: report only non-round unknowns
    unk=[u for u in unk if not re.fullmatch(r'[+−-]?\d+', u[0].replace(',','')) or float(u[0].lstrip('+−-').replace(',',''))%5!=0]
    print(f'--- {v}: fact mismatches {len(bad)} {bad[:3]} | numbers in text {len(nums)}, unexplained {len(unk)}')
    for u in unk[:25]: print("    ", u)
