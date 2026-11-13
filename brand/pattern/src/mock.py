from lib import *
GOLDGRAD=f'<linearGradient id="gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e3c591"/><stop offset=".45" stop-color="{GOLD}"/><stop offset=".7" stop-color="#d9b983"/><stop offset="1" stop-color="#9c7c45"/></linearGradient>'
SHADOW='<filter id="sh" x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="0" dy="10" stdDeviation="12" flood-color="#2d311a" flood-opacity=".22"/></filter>'
OG=dict(olive=(OLIVE,'#71794c','#6b7247'), deep=('#2a2e18','#8a7648',GOLD), cream=(CREAM,'#ddd6c3','#e2dccc'))

BODY=('M96,405C88,380 86,350 92,322C98,296 120,280 160,270L262,246C300,190 340,128 392,104C420,94 460,90 520,90L1090,90'
      'C1130,90 1150,104 1156,140L1172,330C1176,370 1174,395 1168,405L1028,405A78,78 0 0 0 872,405L388,405A78,78 0 0 0 232,405Z')
def wheel(cx):
    g=f'<circle cx="{cx}" cy="405" r="66" fill="#1b1c17"/><circle cx="{cx}" cy="405" r="43" fill="#c9c7bf"/><circle cx="{cx}" cy="405" r="43" fill="none" stroke="#8d8b83" stroke-width="2"/>'
    for i in range(5):
        a=math.radians(i*72-90); x=cx+math.cos(a)*40; y=405+math.sin(a)*40
        g+=f'<path d="M{cx},405L{f(x)},{f(y)}" stroke="#8d8b83" stroke-width="9" stroke-linecap="round"/>'
    g+=f'<circle cx="{cx}" cy="405" r="12" fill="#77756e"/>'
    return g
def van(vid,base,layers,over,glass='#20241a',rearwin=True,line='#00000030'):
    """layers: svg clipped to body. over: svg on top (logos)."""
    g=f'<clipPath id="{vid}"><path d="{BODY}"/></clipPath>'
    g+='<ellipse cx="640" cy="474" rx="560" ry="14" fill="#2d311a" opacity=".18"/>'
    g+=f'<path d="{BODY}" fill="{base}"/><g clip-path="url(#{vid})">{layers}'
    # soft body shading
    g+='<path d="M1140,168H1180V262H1150Z" fill="#8c2b22"/>'
    g+='<rect x="60" y="80" width="1160" height="60" fill="#fff" opacity=".06"/><rect x="60" y="360" width="1160" height="60" fill="#000" opacity=".10"/></g>'
    # glass
    g+=f'<path d="M300,246L352,150C362,130 380,120 400,118L520,118V246Z" fill="{glass}"/>'
    g+=f'<rect x="536" y="118" width="224" height="128" rx="6" fill="{glass}"/>'
    if rearwin: g+=f'<path d="M776,118H1060C1090,118 1110,130 1116,160L1126,246H776Z" fill="{glass}"/>'
    g+='<path d="M312,236L356,154C364,138 380,128 398,126L440,126L372,236Z" fill="#fff" opacity=".07"/>'
    # door lines, handles
    g+=f'<path d="M528,104V404M768,104V404M290,252C284,300 286,350 300,392" fill="none" stroke="{line}" stroke-width="1.6"/>'
    g+=f'<rect x="478" y="268" width="34" height="8" rx="4" fill="{line}"/><rect x="544" y="268" width="34" height="8" rx="4" fill="{line}"/>'
    # mirror, lights, bumper trims
    g+='<path d="M286,232C300,224 318,226 322,238C324,248 312,254 296,252C286,250 282,240 286,232Z" fill="#1b1c17"/>'
    g+='<path d="M96,318C102,300 124,288 158,282L150,304C132,310 112,316 96,318Z" fill="#f4ecd6" stroke="#00000030"/>'
    g+='<path d="M92,372H180V392H98Z" fill="#00000028"/>'
    g+=''.join(f'<path d="M{c-78},406A78,78 0 0 1 {c+78},406Z" fill="#14150f"/>' for c in (310,950))+wheel(310)+wheel(950)+over
    return g

def vehicle1():
    bg,l,m=OG['olive']
    defs=GOLDGRAD+ogee_pattern('va',l,m,scale=.44,x=20,y=14)
    edge='M690,60C690,190 590,270 590,440'
    layers=f'<path d="{edge}L1300,440L1300,60Z" fill="url(#va)"/><path d="{edge}" fill="none" stroke="url(#gold)" stroke-width="3"/>'
    over=logo(400,286,54,CREAM)+seal(812,318,112,'url(#gold)',OLIVE)
    d,_=text_path('dione-dogcare.com',12.5,1.6,488,372,anchor='middle')
    over+=f'<path d="{d}" fill="{CREAM}" opacity=".85"/>'
    return svg(1280,520,van('v1',OLIVE,layers,over),bg='#ebe6da',defs=defs)
def vehicle2():
    defs=GOLDGRAD+arcade_pattern('vb',CREAM,scale=.5,x=18,y=268)
    layers=f'<rect x="60" y="262" width="1160" height="160" fill="{OLIVE}"/><rect x="60" y="268" width="1160" height="132" fill="url(#vb)"/><rect x="60" y="260" width="1160" height="3" fill="url(#gold)"/>'
    over=logo(812,142,80,OLIVE)
    return svg(1280,520,van('v2',CREAM,layers,over,rearwin=False,line='#2d311a40'),bg='#dedccd',defs=defs)
def vehicle3():
    bg,l,m=OG['deep']
    defs=GOLDGRAD+ogee_pattern('vc','#5c5433','#6f6238',scale=.44,x=20,y=14)
    layers=f'<rect x="60" y="60" width="1200" height="400" fill="url(#vc)"/>'
    over=seal(650,322,128,'url(#gold)','#2a2e18')
    return svg(1280,520,van('v3','#2a2e18',layers,over,glass='#14160d',line='#ffffff22'),bg='#ebe6da',defs=defs)

def package():
    bg,l,m=OG['olive']; cb,cl,cm=OG['cream']
    defs=GOLDGRAD+SHADOW+ogee_pattern('ka',l,m,scale=.5,x=110,y=180)+ogee_pattern('kc',cl,cm,scale=.42,x=520,y=150)
    defs+=petit_pattern('kp','#c9ccb0','#d3d5bd',scale=.62)+petit_pattern('kq',CREAM,'#c9cda8',scale=.7,x=10,y=6)+arcade_pattern('kb',OLIVE,scale=.25,y=0)+arcade_pattern('kg','#c9ad74',scale=.26,x=6,y=0)
    g=''
    # tissue (back layer)
    g+=f'<g filter="url(#sh)" transform="rotate(-4 700 640)"><rect x="500" y="480" width="400" height="300" fill="{CREAM}"/><rect x="500" y="480" width="400" height="300" fill="url(#kp)"/></g>'
    g+=f'<g filter="url(#sh)">{seal(700,632,150,"url(#gold)",OLIVE)}</g>'
    # shopping bag
    g+=f'<path d="M170,196C170,96 350,96 350,196" fill="none" stroke="#d9cfb8" stroke-width="7" stroke-linecap="round"/>'
    g+=f'<g filter="url(#sh)"><rect x="90" y="190" width="340" height="470" fill="{OLIVE}"/><rect x="90" y="190" width="340" height="470" fill="url(#ka)"/><rect x="90" y="190" width="340" height="34" fill="#000" opacity=".10"/></g>'
    g+=f'<circle cx="170" cy="207" r="5" fill="#2d311a"/><circle cx="350" cy="207" r="5" fill="#2d311a"/>'
    g+=seal(260,430,178,'url(#gold)',OLIVE)
    # gift box with sleeve
    g+=f'<g filter="url(#sh)"><rect x="500" y="130" width="400" height="290" rx="3" fill="{CREAM}"/><rect x="500" y="130" width="400" height="290" rx="3" fill="url(#kc)"/><rect x="500" y="130" width="400" height="290" rx="3" fill="none" stroke="#d8d1bd"/></g>'
    g+=f'<rect x="500" y="228" width="400" height="94" fill="{OLIVE}"/><rect x="500" y="231" width="400" height="1.4" fill="url(#gold)"/><rect x="500" y="317.6" width="400" height="1.4" fill="url(#gold)"/>'
    g+=logo(617,250,50,CREAM)
    # cards
    g+=f'<g filter="url(#sh)" transform="rotate(5 1130 230)"><rect x="985" y="150" width="290" height="170" rx="4" fill="{CREAM}"/><svg x="985" y="254" width="290" height="66" viewBox="0 0 290 66"><rect width="290" height="66" fill="url(#kb)"/></svg>'+logo(1058,178,44,OLIVE)+'</g>'
    g+=f'<g filter="url(#sh)" transform="rotate(-3 1110 400)"><rect x="965" y="330" width="290" height="170" rx="4" fill="#2a2e18"/><rect x="975" y="340" width="270" height="150" rx="2" fill="none" stroke="url(#gold)" stroke-width="1"/>'+seal(1110,415,116,'url(#gold)','#2a2e18')+'</g>'
    # bandana
    g+=f'<g filter="url(#sh)"><path id="bd" d="M960,560H1300L1130,790Z" fill="{OLIVE}"/><clipPath id="bdc"><path d="M960,560H1300L1130,790Z"/></clipPath><g clip-path="url(#bdc)"><rect x="940" y="540" width="380" height="270" fill="url(#kq)"/><path d="M960,560H1300L1130,790Z" fill="none" stroke="{OLIVE}" stroke-width="26"/><path d="M983,574H1277L1130,772Z" fill="none" stroke="{CREAM}" stroke-width="1.2"/></g></g>'
    # tape
    g+=f'<g filter="url(#sh)" transform="rotate(-2 300 760)"><rect x="70" y="727" width="400" height="66" fill="#2a2e18"/><svg x="70" y="727" width="400" height="66" viewBox="0 0 400 68.6"><rect width="400" height="68.6" fill="url(#kg)"/></svg></g>'
    return svg(1400,860,g,bg='#e6e1d4',defs=defs)

def hero():
    bg,l,m=OG['olive']
    defs=GOLDGRAD+ogee_pattern('ha',l,m,scale=1,x=60,y=-52)
    return svg(1080,1350,f'<rect width="1080" height="1350" fill="url(#ha)"/>'+seal(540,675,470,'url(#gold)',OLIVE),bg=bg,defs=defs)

if __name__=='__main__':
    import os; os.makedirs('out',exist_ok=True)
    for n,fn in (('vehicle-1',vehicle1),('vehicle-2',vehicle2),('vehicle-3',vehicle3),('package',package),('hero',hero)):
        open(f'out/{n}.svg','w').write(fn())
