from lib import *
from mock import OG, GOLDGRAD
import os
os.makedirs('svg',exist_ok=True)
T={}
for k,(bg,l,m) in OG.items(): T[f'ogee-{ {"olive":"olive","deep":"deep-gold","cream":"cream"}[k]}']=(OW,OH,svg(OW,OH,ogee_inner(l,m),bg))
T['arcade-allover-olive']=(360,528,svg(360,528,arcade_all_inner(CREAM),OLIVE))
T['arcade-band-olive']=(360,264,svg(360,264,arcade_band_inner(CREAM),OLIVE))
T['arcade-band-cream']=(360,264,svg(360,264,arcade_band_inner(OLIVE),CREAM))
T['arcade-band-deep-gold']=(360,264,svg(360,264,arcade_band_inner('#c9ad74'),'#2a2e18'))
T['petit-cream']=(CW,CH,svg(CW,CH,petit_inner(OLIVE,OLIVE_L),CREAM))
T['petit-olive']=(CW,CH,svg(CW,CH,petit_inner(CREAM,'#c9cda8'),OLIVE))
T['petit-cream-soft']=(CW,CH,svg(CW,CH,petit_inner('#c9ccb0','#d3d5bd'),CREAM))
for n,(w,h,s) in T.items(): open(f'svg/{n}.svg','w').write(s)
open('svg/seal-gold.svg','w').write(svg(320,400,seal(160,200,380,'url(#gold)',OLIVE),defs=GOLDGRAD))
import json; json.dump({n:(w,h) for n,(w,h,s) in T.items()},open('tiles.json','w'))
