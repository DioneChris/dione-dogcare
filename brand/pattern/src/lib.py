import json, math, re, os
_HERE=os.path.dirname(os.path.abspath(__file__))
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

OLIVE='#4a502e'; OLIVE_L='#71794c'; OLIVE_P='#a8b084'; CREAM='#f7f3ec'; CREAM_D='#ede8df'
DARK='#222512'; TEXT='#2d311a'; GOLD='#b8975a'; GOLD_L='#d4b07a'

_P=json.load(open(os.path.join(_HERE,'logo_paths.json')))
DOG=re.sub(r'-?\d+\.\d+', lambda m: ('%.1f'%float(m.group())).rstrip('0').rstrip('.'), _P['dog'])
FONT=TTFont(os.path.join(_HERE,'..','..','..','Nephilm.ttf')); GS=FONT.getGlyphSet(); CMAP=FONT.getBestCmap(); HMTX=FONT['hmtx']
def f(v): return ('%.2f'%v).rstrip('0').rstrip('.')

def dog(cx,cy,w,fill,flip=False,extra=''):
    s=w/383
    return f'<path fill="{fill}" {extra} transform="translate({f(cx)},{f(cy)}) scale({f(-s if flip else s)},{f(s)}) translate(-191.5,-190)" d="{DOG}"/>'

def _glyph(ch, aff):
    name=CMAP[ord(ch)]; pen=SVGPathPen(GS); GS[name].draw(TransformPen(pen, aff)); return pen.getCommands(), HMTX[name][0]

def text_path(text,size,tracking=0,x=0,y=0,anchor='start'):
    """returns (d,width). baseline at y."""
    s=size/1000; adv=[HMTX[CMAP[ord(c)]][0]*s for c in text]
    width=sum(adv)+tracking*(len(text)-1)
    x0=x-(width/2 if anchor=='middle' else width if anchor=='end' else 0)
    d=[]; cx=x0
    for c,a in zip(text,adv):
        if c!=' ':
            d.append(_glyph(c,(s,0,0,-s,cx,y))[0])
        cx+=a+tracking
    return ' '.join(d), width

def text_on_ellipse(text,size,a,b,cx,cy,tracking=0,bottom=False):
    """Text centred at top (or bottom) of ellipse with radii a,b. Returns path d."""
    s=size/1000; N=4000
    pts=[(a*math.cos(2*math.pi*i/N), b*math.sin(2*math.pi*i/N)) for i in range(N+1)]
    cum=[0]
    for i in range(N): cum.append(cum[-1]+math.dist(pts[i],pts[i+1]))
    total=cum[-1]
    adv=[HMTX[CMAP[ord(c)]][0]*s for c in text]
    width=sum(adv)+tracking*(len(text)-1)
    def at(sv):
        sv%=total
        lo,hi=0,N
        while hi-lo>1:
            m=(lo+hi)//2
            if cum[m]<=sv: lo=m
            else: hi=m
        t=2*math.pi*(lo+(sv-cum[lo])/(cum[lo+1]-cum[lo]))/N
        return a*math.cos(t), b*math.sin(t), math.atan2(b*math.cos(t), -a*math.sin(t))  # tangent dir for increasing t (clockwise on screen)
    # arclength at top = t=-90deg => 3/4 total ; at bottom t=90 => 1/4 total
    d=[]
    if not bottom:
        pos=total*0.75-width/2
        for c,ad in zip(text,adv):
            px,py,ang=at(pos+ad/2)
            ca,sa=math.cos(ang),math.sin(ang)
            # glyph local (gx, gy up) -> screen: x' = px + ca*(gx*s - ad/2) + sa*(gy*s) ; y' = py + sa*(gx*s-ad/2) - ca*(gy*s)
            aff=(ca*s, sa*s, sa*s, -ca*s, cx+px-ca*ad/2, cy+py-sa*ad/2)
            if c!=' ': d.append(_glyph(c,aff)[0])
            pos+=ad+tracking
    else:
        pos=total*0.25+width/2
        for c,ad in zip(text,adv):
            px,py,ang=at(pos-ad/2); ang+=math.pi
            ca,sa=math.cos(ang),math.sin(ang)
            aff=(ca*s, sa*s, sa*s, -ca*s, cx+px-ca*ad/2, cy+py-sa*ad/2)
            if c!=' ': d.append(_glyph(c,aff)[0])
            pos-=ad+tracking
    return ' '.join(d)

def leaf(x,y,L,wd,ang,fill,rib=True):
    d=f'M0,0C{f(wd)},{f(-.28*L)} {f(wd)},{f(-.66*L)} 0,{f(-L)}C{f(-wd)},{f(-.66*L)} {f(-wd)},{f(-.28*L)} 0,0Z'
    if rib:
        m=max(.45,wd*.1)
        d+=f'M0,{f(-.14*L)}L{f(m)},{f(-.45*L)}L0,{f(-.8*L)}L{f(-m)},{f(-.45*L)}Z'
    return f'<path fill="{fill}" fill-rule="evenodd" transform="translate({f(x)},{f(y)}) rotate({f(ang)})" d="{d}"/>'

def olive(x,y,rx,ry,ang,fill):
    return f'<ellipse fill="{fill}" cx="0" cy="0" rx="{f(rx)}" ry="{f(ry)}" transform="translate({f(x)},{f(y)}) rotate({f(ang)})"/>'

def sprig(cx,cy,sc,col):
    """Upright symmetric olive sprig, ~92 wide x 170 tall at sc=1, centred."""
    g=[f'<g transform="translate({f(cx)},{f(cy)}) scale({f(sc)})">']
    g.append(f'<path d="M0,84C-1,40 1,-20 0,-58" fill="none" stroke="{col}" stroke-width="1.7" stroke-linecap="round"/>')
    rows=[(58,60,40,7.2),(28,54,42,7.6),(-2,47,37,7),(-29,40,30,6.2)]
    for y,ang,L,wd in rows:
        g.append(leaf(0,y,L,wd,ang,col)); g.append(leaf(0,y,L,wd,-ang,col))
    g.append(leaf(0,-54,28,6.2,0,col))
    for sx in (-1,1):
        g.append(f'<path d="M0,72C{4*sx},70 {9*sx},72 {12*sx},78" fill="none" stroke="{col}" stroke-width="1.2" stroke-linecap="round"/>')
        g.append(olive(14*sx,85,5.2,7,-14*sx,col))
    g.append('</g>'); return ''.join(g)

def wreath(cx,cy,R,col,span=64,n=5,sc=1.0):
    """Two olive branches curving up from bottom centre; arc centre (cx,cy), radius R."""
    g=[]
    for sx in (-1,1):
        a0,a1=math.radians(8),math.radians(span)
        def pt(a): return cx+sx*R*math.sin(a), cy+R*math.cos(a)
        x0,y0=pt(a0); x1,y1=pt(a1)
        g.append(f'<path d="M{f(x0)},{f(y0)}A{f(R)},{f(R)} 0 0 {1 if sx<0 else 0} {f(x1)},{f(y1)}" fill="none" stroke="{col}" stroke-width="{f(1.4*sc)}" stroke-linecap="round"/>')
        for i in range(n):
            a=a0+(a1-a0)*(i+.35)/n
            x,y=pt(a)
            tang=sx*(90-math.degrees(a))  # direction of travel as rotate() angle (0=up)
            L=(17-i*1.1)*sc
            g.append(leaf(x,y,L,3.9*sc,tang+sx*-34,col))
            g.append(leaf(x,y,L*.92,3.7*sc,tang+sx*30,col))
        x,y=pt(a1); g.append(leaf(x,y,13*sc,3.3*sc,sx*(90-math.degrees(a1)),col))
        xo,yo=pt(a0+(a1-a0)*.5); 
    g.append(f'<circle cx="{f(cx)}" cy="{f(cy+R)}" r="{f(2.6*sc)}" fill="{col}"/>')
    return ''.join(g)

def node(cx,cy,col,sc=1.0):
    g=[f'<g transform="translate({f(cx)},{f(cy)}) scale({f(sc)})">']
    for ang,L,wd in ((0,17,3.8),(180,17,3.8),(90,10,3.1),(-90,10,3.1)):
        g.append(leaf(0,0,L,wd,ang,col,rib=False))
    g.append('</g>'); return ''.join(g)

def svg(w,h,inner,bg=None,defs='',vb=None,pxw=None,pxh=None):
    vb=vb or f'0 0 {f(w)} {f(h)}'
    r=f'<rect width="{f(w)}" height="{f(h)}" fill="{bg}"/>' if bg else ''
    d=f'<defs>{defs}</defs>' if defs else ''
    return f'<svg xmlns="http://www.w3.org/2000/svg" width="{f(pxw or w)}" height="{f(pxh or h)}" viewBox="{vb}">{d}{r}{inner}</svg>'

# ---------- Pattern A : Ogee ----------
OW,OH=240,344
def ogee_inner(line,motif,W=OW,H=OH,lw=1.8):
    k=.27*H; g=[]
    for sx in (0,W):
        g.append(f'<path d="M{f(W/2)},0C{f(W/2)},{f(k)} {sx},{f(H/2-k)} {sx},{f(H/2)}C{sx},{f(H/2+k)} {f(W/2)},{f(H-k)} {f(W/2)},{f(H)}" fill="none" stroke="{line}" stroke-width="{lw}"/>')
    for x,y in ((W/2,0),(W/2,H),(0,H/2),(W,H/2)): g.append(node(x,y,line,1.15))
    # A cell: dog over wreath
    g.append(dog(W/2+2,H/2-12,112,motif))
    g.append(wreath(W/2,H/2-8,78,motif,span=66,n=5))
    g.append(f'<path transform="translate({f(W/2)},{f(H/2-92)})" d="M0,-6L3.2,0L0,6L-3.2,0Z" fill="{motif}"/>')
    # B cell at corners: olive sprig
    for x in (0,W):
        for y in (0,H): g.append(sprig(x,y-8,1.02,motif))
    return ''.join(g)
def ogee_tile(bg,line,motif,**k): return svg(OW,OH,ogee_inner(line,motif,**k),bg)
def ogee_pattern(pid,line,motif,scale=1,x=0,y=0,bg=None,**k):
    r=f'<rect width="{OW}" height="{OH}" fill="{bg}"/>' if bg else ''
    return f'<pattern id="{pid}" width="{OW}" height="{OH}" patternUnits="userSpaceOnUse" patternTransform="translate({f(x)},{f(y)}) scale({f(scale)})">{r}{ogee_inner(line,motif,**k)}</pattern>'

# ---------- Pattern B : Arcade ----------
BW,BH=180,264   # one bay
def bay(x0,col,kind,fillcol=None,H=BH,W=BW,lw=1.3):
    """One arch bay, origin x0 at the centre of the left pilaster."""
    fc=fillcol or col; g=[f'<g transform="translate({f(x0)},0)" fill="none" stroke="{col}" stroke-width="{lw}" stroke-linecap="round" stroke-linejoin="round">']
    spring=122; base=232; pw=11; r=(W-2*pw)/2-5
    # entablature
    g.append(f'<path d="M0,8H{W}M0,13H{W}M0,27H{W}"/>')
    n=9
    for i in range(n):
        x=W*(i+.5)/n; g.append(f'<path d="M{f(x-4)},17v6h8v-6" stroke-width="{f(lw*.8)}"/>')
    # arch (double) + keystone
    cx=W/2
    g.append(f'<path d="M{f(cx-r)},{spring}A{f(r)},{f(r)} 0 0 1 {f(cx+r)},{spring}"/>')
    g.append(f'<path d="M{f(cx-r-7)},{spring}A{f(r+7)},{f(r+7)} 0 0 1 {f(cx+r+7)},{spring}" stroke-width="{f(lw*.8)}"/>')
    g.append(f'<path d="M{f(cx-5)},{f(spring-r-9.5)}L{f(cx-3.6)},{f(spring-r+2.5)}H{f(cx+3.6)}L{f(cx+5)},{f(spring-r-9.5)}Z" fill="{fc}" stroke="none"/>')
    # jambs
    g.append(f'<path d="M{f(cx-r)},{spring}V{base}M{f(cx+r)},{spring}V{base}"/>')
    # floor
    g.append(f'<path d="M0,{base+8}H{W}M0,{base+13}H{W}"/>')
    g.append('</g>')
    # pilaster centred on x0 (drawn once per bay: left one)
    g.append(f'<g transform="translate({f(x0)},0)" fill="none" stroke="{col}" stroke-width="{lw}">')
    g.append(f'<path d="M{-pw-3},{spring-7}H{pw+3}V{spring}H{-pw-3}ZM{-pw},{spring}V{base}M{pw},{spring}V{base}M{-pw-3},{base}H{pw+3}V{base+8}H{-pw-3}Z"/>')
    g.append(f'<path d="M-5.5,{spring+6}V{base-6}M0,{spring+6}V{base-6}M5.5,{spring+6}V{base-6}" stroke-width="{f(lw*.7)}" stroke-linecap="round"/>')
    g.append(f'<path d="M{-pw},27V{spring-7}M{pw},27V{spring-7}" stroke-width="{f(lw*.7)}"/>')
    g.append('</g>')
    if kind=='dog':
        g.append(dog(x0+cx+1,base-41.5,92,fc))
    elif kind=='dogf':
        g.append(dog(x0+cx-1,base-41.5,92,fc,flip=True))
    elif kind=='tree':
        # olive tree in an urn
        g.append(f'<g transform="translate({f(x0+cx)},{base})">')
        g.append(f'<path d="M-13,-30H13L9.5,-4H-9.5ZM-16,-34H16V-30H-16ZM-11,-4H11V0H-11Z" fill="{fc}"/>')
        g.append('</g>')
        g.append(f'<g transform="translate({f(x0+cx)},{base-34-78})">'+sprig(0,0,.84,fc)+'</g>')
    return ''.join(g)
def arcade_row(col,kinds,y=0,xoff=0,fillcol=None):
    return f'<g transform="translate({f(xoff)},{f(y)})">'+''.join(bay(i*BW,col,k,fillcol) for i,k in enumerate(kinds))+'</g>'
def arcade_band_inner(col,fillcol=None):       # 360 x 264, repeat-x
    return arcade_row(col,['dog','tree','dog'],xoff=0,fillcol=fillcol)   # third bay overflows -> gives right pilaster continuity when clipped
def arcade_all_inner(col,fillcol=None):        # 360 x 528, all-over
    return arcade_row(col,['dog','tree','dog'],0,0,fillcol)+arcade_row(col,['dog','tree','dog','tree'],BH,-BW,fillcol)
def arcade_pattern(pid,col,scale=1,x=0,y=0,allover=False,fillcol=None,bg=None):
    h=BH*2 if allover else BH
    r=f'<rect width="{2*BW}" height="{h}" fill="{bg}"/>' if bg else ''
    inner=arcade_all_inner(col,fillcol) if allover else arcade_band_inner(col,fillcol)
    return f'<pattern id="{pid}" width="{2*BW}" height="{h}" patternUnits="userSpaceOnUse" patternTransform="translate({f(x)},{f(y)}) scale({f(scale)})">{r}{inner}</pattern>'

# ---------- Pattern C : Petit ----------
CW=CH=132
def petit_inner(col,col2=None):
    c2=col2 or col; g=[]
    q=CW/4
    g.append(dog(q,q,40,col))
    g.append(dog(3*q,3*q,40,col,flip=True))
    # olive twig
    for (x,y,rot) in ((3*q,q,-18),(q,3*q,18)):
        g.append(f'<g transform="translate({f(x)},{f(y+10)}) rotate({rot})">'+leaf(0,0,20,4.2,-36,c2)+leaf(0,0,20,4.2,36,c2)+leaf(0,-3,22,4.2,0,c2)+olive(-6.5,5.5,2.9,3.8,20,c2)+olive(6.5,5.5,2.9,3.8,-20,c2)+'</g>')
    for (x,y) in ((2*q,0),(0,2*q),(2*q,2*q),(0,0),(CW,0),(0,CH),(CW,CH),(2*q,CH),(CW,2*q)):
        g.append(f'<path transform="translate({f(x)},{f(y)})" d="M0,-4.2L2.3,0L0,4.2L-2.3,0Z" fill="{c2}"/>')
    return ''.join(g)
def petit_pattern(pid,col,col2=None,scale=1,x=0,y=0,bg=None):
    r=f'<rect width="{CW}" height="{CH}" fill="{bg}"/>' if bg else ''
    return f'<pattern id="{pid}" width="{CW}" height="{CH}" patternUnits="userSpaceOnUse" patternTransform="translate({f(x)},{f(y)}) scale({f(scale)})">{r}{petit_inner(col,col2)}</pattern>'

# ---------- Logo (vector) ----------
def logo(x,y,h,fill):
    """Horizontal logo, top-left at x,y, height h (source 1291x395)."""
    s=h/395
    d1,_=text_path('Dione',318,0,438,238)
    parts=[]
    # 'Dog care' widely tracked, x 444..1284
    d2,w2=text_path('Dog care',104,0,0,0)
    tr=(840-w2)/7
    d2,_=text_path('Dog care',104,tr,444,365)
    return f'<g transform="translate({f(x)},{f(y)}) scale({f(s)})" fill="{fill}"><path transform="translate(191.5,190)  translate(-191.5,-190)" d="{DOG}"/><path d="{d1}"/><path d="{d2}"/></g>'
def logo_stacked(cx,y,w,fill):
    """Dog above wordmark, centred at cx; width w of wordmark."""
    d1,w1=text_path('Dione',100,0,0,0)
    s=w/w1
    d1,_=text_path('Dione',100*s,0,cx,y+ w*.62+ w*.36,anchor='middle')
    d2,w2=text_path('Dog care',100,0,0,0); s2=.3*s
    tr=(w*.98-w2*s2)/7
    d2,_=text_path('Dog care',100*s2,tr,cx-w*.49,y+w*.62+w*.36+w*.2)
    return dog(cx,y+w*.29,w*.62,fill)+f'<path fill="{fill}" d="{d1}"/><path fill="{fill}" d="{d2}"/>'

# ---------- Seal ----------
def seal(cx,cy,h,stroke,fill,textcol=None):
    """Oval seal, height h (design 300x380)."""
    tc=textcol or stroke; s=h/380
    g=[f'<g transform="translate({f(cx)},{f(cy)}) scale({f(s)})">']
    g.append(f'<ellipse rx="150" ry="190" fill="{fill}"/>')
    g.append(f'<ellipse rx="146.5" ry="186.5" fill="none" stroke="{stroke}" stroke-width="5"/>')
    g.append(f'<ellipse rx="137" ry="177" fill="none" stroke="{stroke}" stroke-width="1"/>')
    g.append(f'<path fill="{tc}" d="{text_on_ellipse("DIONE DOG CARE",25,113,153,0,0,tracking=7)}"/>')
    g.append(f'<path fill="{tc}" d="{text_on_ellipse("CARE  SALON  TRAINING",17.5,128,168,0,0,tracking=4.6,bottom=True)}"/>')
    for sx in (-1,1):
        g.append(f'<path transform="translate({122*sx},8)" d="M0,-5.5L3,0L0,5.5L-3,0Z" fill="{tc}"/>')
    # inner frame: notched rounded frame
    a,b,n=96,128,13
    d=(f'M{-a+n},{-b}H{a-n}A{n},{n} 0 0 0 {a},{-b+n}V{b-n}A{n},{n} 0 0 0 {a-n},{b}H{-a+n}A{n},{n} 0 0 0 {-a},{b-n}V{-b+n}A{n},{n} 0 0 0 {-a+n},{-b}Z')
    # use an oval-ish inner frame instead: superellipse via two ellipses
    g.append(f'<ellipse rx="100" ry="138" fill="none" stroke="{stroke}" stroke-width="2.2"/>')
    g.append(f'<ellipse rx="94" ry="132" fill="none" stroke="{stroke}" stroke-width=".9"/>')
    g.append(dog(3,-14,132,stroke))
    g.append(wreath(0,-10,92,stroke,span=62,n=5,sc=1.25))
    g.append(f'<path transform="translate(0,-108)" d="M0,-7L3.6,0L0,7L-3.6,0Z" fill="{stroke}"/>')
    g.append('</g>'); return ''.join(g)
