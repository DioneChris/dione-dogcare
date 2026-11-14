import re, math
def tokens(d):
    for m in re.finditer(r'[MmLlHhVvCcSsQqTtAaZz]|-?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?', d): yield m.group()
def parse(d):
    """-> list of subpaths; each = list of cubic segs [(x0,y0),(x1,y1),(x2,y2),(x3,y3)]"""
    toks=list(tokens(d)); i=0; cmd=None; cur=(0,0); start=(0,0); subs=[]; seg=[]; lastc=None
    def num():
        nonlocal i; v=float(toks[i]); i+=1; return v
    def line(a,b): return [a,(a[0]+(b[0]-a[0])/3,a[1]+(b[1]-a[1])/3),(a[0]+2*(b[0]-a[0])/3,a[1]+2*(b[1]-a[1])/3),b]
    while i<len(toks):
        t=toks[i]
        if re.match(r'[A-Za-z]',t): cmd=t; i+=1
        rel=cmd.islower(); C=cmd.upper()
        if C=='Z':
            if cur!=start: seg.append(line(cur,start))
            if seg: subs.append(seg)
            seg=[]; cur=start; lastc=None; continue
        if C=='M':
            x,y=num(),num(); 
            if rel: x+=cur[0]; y+=cur[1]
            if seg: subs.append(seg); seg=[]
            cur=start=(x,y); cmd='l' if rel else 'L'; lastc=None; continue
        if C in 'LHV':
            if C=='L': x,y=num(),num(); x,y=(x+cur[0],y+cur[1]) if rel else (x,y)
            elif C=='H': x=num(); x=x+cur[0] if rel else x; y=cur[1]
            else: y=num(); y=y+cur[1] if rel else y; x=cur[0]
            seg.append(line(cur,(x,y))); cur=(x,y); lastc=None; continue
        if C=='C':
            p=[num() for _ in range(6)]
            if rel: p=[p[k]+cur[k%2] for k in range(6)]
            seg.append([cur,(p[0],p[1]),(p[2],p[3]),(p[4],p[5])]); lastc=(p[2],p[3]); cur=(p[4],p[5]); continue
        if C=='S':
            p=[num() for _ in range(4)]
            if rel: p=[p[k]+cur[k%2] for k in range(4)]
            c1=(2*cur[0]-lastc[0],2*cur[1]-lastc[1]) if lastc else cur
            seg.append([cur,c1,(p[0],p[1]),(p[2],p[3])]); lastc=(p[0],p[1]); cur=(p[2],p[3]); continue
        if C=='A':
            rx,ry,phi,fa,fs,x,y=[num() for _ in range(7)]
            if rel: x+=cur[0]; y+=cur[1]
            seg+=arc(cur,rx,ry,phi,int(fa),int(fs),(x,y)); cur=(x,y); lastc=None; continue
        raise Exception('cmd '+cmd)
    if seg: subs.append(seg)
    return subs
def arc(p0,rx,ry,phi,fa,fs,p1):
    # endpoint -> center parameterization, then split into <=90deg cubic pieces
    x1,y1=p0; x2,y2=p1; ph=math.radians(phi); cp,sp=math.cos(ph),math.sin(ph)
    dx,dy=(x1-x2)/2,(y1-y2)/2; x1p=cp*dx+sp*dy; y1p=-sp*dx+cp*dy
    rx,ry=abs(rx),abs(ry); lam=x1p**2/rx**2+y1p**2/ry**2
    if lam>1: rx*=math.sqrt(lam); ry*=math.sqrt(lam)
    num=rx*rx*ry*ry-rx*rx*y1p*y1p-ry*ry*x1p*x1p; den=rx*rx*y1p*y1p+ry*ry*x1p*x1p
    co=math.sqrt(max(0,num/den))*(-1 if fa==fs else 1)
    cxp,cyp=co*rx*y1p/ry,-co*ry*x1p/rx; cx=cp*cxp-sp*cyp+(x1+x2)/2; cy=sp*cxp+cp*cyp+(y1+y2)/2
    def ang(u,v): a=math.atan2(u[0]*v[1]-u[1]*v[0],u[0]*v[0]+u[1]*v[1]); return a
    t1=ang((1,0),((x1p-cxp)/rx,(y1p-cyp)/ry)); dt=ang(((x1p-cxp)/rx,(y1p-cyp)/ry),((-x1p-cxp)/rx,(-y1p-cyp)/ry))
    if not fs and dt>0: dt-=2*math.pi
    if fs and dt<0: dt+=2*math.pi
    n=max(1,math.ceil(abs(dt)/(math.pi/2))); out=[]; d=dt/n; k=4/3*math.tan(d/4)
    def pt(t): x,y=rx*math.cos(t),ry*math.sin(t); return (cp*x-sp*y+cx,sp*x+cp*y+cy)
    def dv(t): x,y=-rx*math.sin(t),ry*math.cos(t); return (cp*x-sp*y,sp*x+cp*y)
    for j in range(n):
        a,b=t1+j*d,t1+(j+1)*d; pa,pb=pt(a),pt(b); da,db=dv(a),dv(b)
        out.append([pa,(pa[0]+k*da[0],pa[1]+k*da[1]),(pb[0]-k*db[0],pb[1]-k*db[1]),pb])
    return out
def split(seg,t=0.5):
    p0,p1,p2,p3=seg; L=lambda a,b:(a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t)
    a=L(p0,p1); b=L(p1,p2); c=L(p2,p3); d=L(a,b); e=L(b,c); f=L(d,e)
    return [p0,a,d,f],[f,e,c,p3]
def to_d(subs,nd=2):
    f=lambda v:('%.*f'%(nd,v)).rstrip('0').rstrip('.')
    out=[]
    for sp in subs:
        out.append('M%s,%s'%(f(sp[0][0][0]),f(sp[0][0][1])))
        for s in sp: out.append('C%s,%s %s,%s %s,%s'%(f(s[1][0]),f(s[1][1]),f(s[2][0]),f(s[2][1]),f(s[3][0]),f(s[3][1])))
        out.append('Z')
    return ''.join(out)
