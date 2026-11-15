"""Q3 v2: recompute the map labels, analysis cards and takeaways (pandas) and compare with the page.
First run: node tools/check_q3.mjs dump"""
import sys
from pathlib import Path
sys.stdout.reconfigure(encoding="utf-8")
REPO = Path(__file__).resolve().parents[1]          # repository root
OUTDIR = str(REPO / "tools" / "out") + "/"           # where the check scripts write their dumps
import pandas as pd, numpy as np, json, re, math
R=str(REPO / 'datasets') + '/'
c=pd.read_csv(R+'ONT-SA/selected/ont-sa-characteristic-ow-cma.csv'); o=pd.read_csv(R+'ONT-SA/selected/ont-sa-characteristic-ow-ont.csv')
for d in (c,o): d['s']=d.moa19/d.cases*100
c['code']=c.cma.str.split(' - ').str[0]; c['name']=c.cma.str.split(' - ').str[1].str.replace('--','–')
c=c.merge(o[['date','s']].rename(columns={'s':'so'}),on='date'); c['dev']=c.s-c.so
P={'latest':('2026-03-01','2026-03-01'),'post':('2023-06-01','2026-03-01'),'during':('2020-03-01','2023-03-01'),'pre':('2003-03-01','2019-12-01'),'all':('2003-03-01','2026-03-01')}
def stats(p):
    a,b=P[p]; x=c[(c.date>=a)&(c.date<=b)]; g=x.groupby('name').agg(L=('moa19','sum'),T=('cases','sum'),K=('date','count'))
    oo=o[(o.date>=a)&(o.date<=b)]; ont=oo.moa19.sum()/oo.cases.sum()*100
    g['share']=g.L/g['T']*100; g['avg']=g['T']/g.K; g['diff']=g.share-ont; g=g.sort_values('share',ascending=False); g['rank']=range(1,16); g['ont']=ont
    return g
f1=lambda v:f"{round(v+1e-9,1):.1f}"
pp=lambda v:("+" if v>0 else "−" if v<0 else "±")+f1(abs(v))+" pp"
cls=lambda v:(lambda r:0 if r<=-6 else 1 if r<-2 else 2 if r<=2 else 3 if r<6 else 4)(round(v*10)/10)
d=json.load(open(OUTDIR + 'q3_page_dump.json',encoding='utf-8'))
bad=0; checked=0
for p in P:
    g=stats(p)
    for lab in d['aria'][p]:
        name=lab.split(':')[0]; r=g.loc[name]
        exp=f"{name}: long-term share {f1(r.share)}%, {pp(r['diff'])} {'above' if r['diff']>=0 else 'below'} Ontario"
        tail=f"rank {int(r['rank'])} of 15; average {round(r.avg):,} OW cases."
        checked+=1
        if not (lab.startswith(exp) and lab.endswith(tail)): bad+=1; print('MISMATCH',p,lab,'| expected',exp,tail)
# cards (post)
g=stats('post'); g3={p:stats(p) for p in ['pre','during','post']}
for name,cd in d['cards'].items():
    r=g.loc[name]; exp=[f1(r.share)+'%',f1(r.ont)+'%',pp(r['diff']),f"{int(r['rank'])} of 15",f"{round(r.avg):,}"]
    bars='; '.join(f"{lab} the pandemic: {pp(g3[p].loc[name,'diff'])}, rank {int(g3[p].loc[name,'rank'])}" for p,lab in [('pre','Before'),('during','During'),('post','After')])
    above=int((c[c.name==name].dev>0).sum())
    checked+=1
    ok = cd['stats']==exp and cd['bars']==bars and cd['sum'].endswith(f"Above Ontario in {above} of 93 quarters.") and cd['warn']==(r.avg<3000)
    if not ok: bad+=1; print('CARD MISMATCH',name,cd,exp,bars,above)
# persistence + takeaway
ab=[n for n in g3['pre'].index if all(g3[p].loc[n,'diff']>0 for p in g3)]
marg={n:min(g3[p].loc[n,'diff'] for p in g3) for n in ab}
b90=c.groupby('name').dev.apply(lambda s:(s<0).sum()); b90=b90[b90/93>=0.9].sort_values(ascending=False)
print('aboveAll',{n:pp(m) for n,m in marg.items()},'below90',b90.to_dict())
for p in P:
    nUp=int((stats(p)['diff']>0).sum()); t=d['takeaway'][p]
    checked+=1
    exp_bits=[f"{n} (smallest margin {pp(marg[n])})" for n in ab]+[f"{n} ({k} of 93)" for n,k in b90.items()]+[f"{nUp} of 15 CMAs were above Ontario."]
    if not all(e in t for e in exp_bits): bad+=1; print('TAKEAWAY MISMATCH',p,t,exp_bits)
# class counts per period, scale maxima
print('class counts',{p:np.bincount([cls(v) for v in stats(p)['diff']],minlength=5).tolist() for p in P})
print('spark max', math.ceil(c.dev.abs().max()/5)*5, ' period-bar max', math.ceil(max(abs(g3[p]['diff']).max() for p in g3)/2)*2)
# Thunder Bay–Toronto distance from polygon centroids (planar area-weighted centroid, haversine)
gj=json.load(open(R+'EXTERNAL/CMA-BOUNDARIES/ont-cma-boundaries.geojson',encoding='utf-8'))
def cen(f):
    polys=f['geometry']['coordinates'] if f['geometry']['type']=='MultiPolygon' else [f['geometry']['coordinates']]
    A=X=Y=0
    for poly in polys:
        ring=poly[0]
        for (x0,y0),(x1,y1) in zip(ring,ring[1:]):
            cr=x0*y1-x1*y0; A+=cr; X+=(x0+x1)*cr; Y+=(y0+y1)*cr
    return X/(3*A),Y/(3*A)
F={f['properties']['cma_code']:f for f in gj['features']}
(a1,b1),(a2,b2)=cen(F['595']),cen(F['535'])
h=math.sin(math.radians(b2-b1)/2)**2+math.cos(math.radians(b1))*math.cos(math.radians(b2))*math.sin(math.radians(a2-a1)/2)**2
print('TB-Toronto km', round(2*6371*math.asin(math.sqrt(h))), '| page:', d['inset'])
print(f'checked {checked} items, mismatches {bad}')
print('Toronto card', d['cards']['Toronto']['sum']); print('Peterborough card', d['cards']['Peterborough']['sum'])
