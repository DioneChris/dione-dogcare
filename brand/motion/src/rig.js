// Dione motion rig — flat gouache-style dogs and a walker, drawn from tapered capsules.
// Everything is a pure function of time so frames can be rendered deterministically.
const TAU = Math.PI * 2, cos = Math.cos, sin = Math.sin, PI = Math.PI;
const n = v => Math.round(v * 10) / 10;
const rad = d => d * PI / 180;
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const ease = t => { t = clamp(t); return t * t * (3 - 2 * t); };
const frac = v => ((v % 1) + 1) % 1;

const C = {
  cream: '#f7f3ec', creamD: '#ede8df', paper: '#f2ede1', olive: '#4a502e', oliveL: '#71794c', oliveP: '#a8b084',
  dark: '#2a2e18', gold: '#b8975a', goldL: '#d4b07a', brick: '#b4694c', brickD: '#96553d', ink: '#2b2a25',
  liver: '#6e4a36', tan: '#c9925e', fawn: '#d9b98b', rust: '#a9603a', white: '#fbf6ea', gray: '#9c988d',
  black: '#35322e', golden: '#d3a55c', pink: '#d98a7e', skin: '#ecc9aa', hair: '#5a3a2a',
};
function shade(hex, k) { // k<1 darker, k>1 lighter
  const v = parseInt(hex.slice(1), 16); let r = v >> 16, g = (v >> 8) & 255, b = v & 255;
  const f = c => Math.round(k <= 1 ? c * k : c + (255 - c) * (k - 1));
  return '#' + [f(r), f(g), f(b)].map(c => clamp(c, 0, 255).toString(16).padStart(2, '0')).join('');
}

// ---------- primitives ----------
function capD(x1, y1, r1, x2, y2, r2) {
  const dx = x2 - x1, dy = y2 - y1, d = Math.hypot(dx, dy);
  if (d <= Math.abs(r1 - r2) + 0.01) {
    const [x, y, r] = r1 >= r2 ? [x1, y1, r1] : [x2, y2, r2];
    return `M${n(x - r)},${n(y)}a${n(r)},${n(r)} 0 1 0 ${n(2 * r)},0a${n(r)},${n(r)} 0 1 0 ${n(-2 * r)},0Z`;
  }
  const a = Math.atan2(dy, dx), b = Math.acos((r1 - r2) / d);
  const p1 = [x1 + r1 * cos(a + b), y1 + r1 * sin(a + b)], p2 = [x2 + r2 * cos(a + b), y2 + r2 * sin(a + b)];
  const p3 = [x2 + r2 * cos(a - b), y2 + r2 * sin(a - b)], p4 = [x1 + r1 * cos(a - b), y1 + r1 * sin(a - b)];
  return `M${n(p1[0])},${n(p1[1])}L${n(p2[0])},${n(p2[1])}A${n(r2)},${n(r2)} 0 ${2 * b > PI ? 1 : 0} 0 ${n(p3[0])},${n(p3[1])}` +
    `L${n(p4[0])},${n(p4[1])}A${n(r1)},${n(r1)} 0 ${TAU - 2 * b > PI ? 1 : 0} 0 ${n(p1[0])},${n(p1[1])}Z`;
}
const cap = (x1, y1, r1, x2, y2, r2, fill, extra = '') => `<path d="${capD(x1, y1, r1, x2, y2, r2)}" fill="${fill}" ${extra}/>`;
const circ = (x, y, r, fill, extra = '') => `<circle cx="${n(x)}" cy="${n(y)}" r="${n(r)}" fill="${fill}" ${extra}/>`;
const ell = (x, y, rx, ry, rot, fill, extra = '') => `<ellipse rx="${n(rx)}" ry="${n(ry)}" fill="${fill}" transform="translate(${n(x)},${n(y)}) rotate(${n(rot)})" ${extra}/>`;
const poly = (pts, fill, extra = '') => `<path d="M${pts.map(p => n(p[0]) + ',' + n(p[1])).join('L')}Z" fill="${fill}" ${extra}/>`;

function ik(ax, ay, bx, by, l1, l2, dir) {
  let dx = bx - ax, dy = by - ay, d = Math.hypot(dx, dy); const mx = l1 + l2 - 0.01;
  if (d > mx) { bx = ax + dx / d * mx; by = ay + dy / d * mx; d = mx; dx = bx - ax; dy = by - ay; }
  const a = Math.acos(clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1)), base = Math.atan2(dy, dx), ang = base + dir * a;
  return { jx: ax + l1 * cos(ang), jy: ay + l1 * sin(ang), ex: bx, ey: by };
}
function foot(p, duty, stride, lift) {
  p = frac(p);
  if (p < duty) return { x: stride / 2 - stride * (p / duty), y: 0, air: 0 };
  const s = (p - duty) / (1 - duty);
  return { x: -stride / 2 + stride * (0.5 - 0.5 * cos(PI * s)), y: -lift * sin(PI * s), air: sin(PI * s) };
}

// ---------- breeds ----------
// L body length (joint to joint), leg = joint height, legR [top, knee, ankle]
const BREEDS = {
  pointer: { L: 132, chestR: 43, hipR: 33, leg: 128, legR: [15, 9.5, 7], hindR: 24, neckLen: 66, neckAng: 52, headR: 24, snoutLen: 38, snoutR: 10.5, snoutAng: 6,
    ear: { type: 'drop', len: 34, w: 13, ang: -8 }, tail: { type: 'whip', len: 78, ang: 28, r: 7.5 }, color: C.liver, marks: ['chest', 'socks'] },
  pointerOlive: { base: 'pointer', color: C.olive, marks: [], mono: true },
  lab: { base: 'pointer', L: 138, chestR: 47, hipR: 38, leg: 118, legR: [17, 11, 8.5], hindR: 27, neckLen: 56, headR: 27, snoutLen: 34, snoutR: 12.5, color: C.black, marks: [],
    tail: { type: 'whip', len: 82, ang: 5, r: 9.5 }, ear: { type: 'drop', len: 30, w: 14, ang: -6 } },
  golden: { base: 'lab', color: C.golden, tail: { type: 'plume', len: 86, ang: 0, r: 10 }, marks: ['fluff'], ear: { type: 'drop', len: 34, w: 15, ang: -6 } },
  dalmatian: { base: 'pointer', color: C.white, ear: { type: 'drop', len: 32, w: 12, ang: -8, color: C.black }, marks: ['spots'], tail: { type: 'whip', len: 80, ang: 12, r: 6.5 } },
  dachshund: { L: 150, chestR: 30, hipR: 25, leg: 44, legR: [11, 8, 7], hindR: 14, neckLen: 40, neckAng: 48, headR: 19, snoutLen: 34, snoutR: 8, snoutAng: 8,
    ear: { type: 'drop', len: 34, w: 13, ang: -4 }, tail: { type: 'whip', len: 70, ang: 18, r: 5.5 }, color: C.rust, marks: [] },
  corgi: { L: 118, chestR: 34, hipR: 31, leg: 42, legR: [12, 9, 8], hindR: 16, neckLen: 36, neckAng: 55, headR: 24, snoutLen: 26, snoutR: 9, snoutAng: 6,
    ear: { type: 'prick', len: 30, w: 20 }, tail: { type: 'stub', r: 11 }, color: C.tan, marks: ['chest', 'socks', 'muzzle'] },
  shiba: { L: 100, chestR: 34, hipR: 29, leg: 82, legR: [12, 8.5, 7], hindR: 19, neckLen: 40, neckAng: 55, headR: 24, snoutLen: 24, snoutR: 9, snoutAng: 6,
    ear: { type: 'prick', len: 24, w: 18 }, tail: { type: 'curl', r: 9, cr: 22 }, color: C.rust, marks: ['chest', 'socks', 'muzzle'] },
  pug: { L: 80, chestR: 32, hipR: 29, leg: 54, legR: [11, 8.5, 7.5], hindR: 16, neckLen: 26, neckAng: 50, headR: 27, snoutLen: 5, snoutR: 15, snoutAng: 10,
    ear: { type: 'drop', len: 15, w: 10, ang: 10, color: C.black }, tail: { type: 'curl', r: 6.5, cr: 13 }, color: C.fawn, marks: ['mask'] },
  poodle: { L: 78, chestR: 31, hipR: 28, leg: 78, legR: [11, 8, 9.5], hindR: 16, neckLen: 46, neckAng: 62, headR: 21, snoutLen: 26, snoutR: 8, snoutAng: 4,
    ear: { type: 'drop', len: 30, w: 17, ang: -4 }, tail: { type: 'pom', len: 30, ang: 60, r: 4, pr: 13 }, color: '#c98f5f', marks: ['topknot'] },
  maltese: { L: 62, chestR: 33, hipR: 31, leg: 36, legR: [14, 12, 11], hindR: 17, neckLen: 22, neckAng: 50, headR: 26, snoutLen: 12, snoutR: 10, snoutAng: 8,
    ear: { type: 'drop', len: 26, w: 15, ang: -2 }, tail: { type: 'plume', len: 40, ang: 62, r: 9 }, color: C.white, marks: ['fluff'] },
  pom: { L: 46, chestR: 33, hipR: 32, leg: 38, legR: [12, 9, 8], hindR: 15, neckLen: 20, neckAng: 55, headR: 22, snoutLen: 13, snoutR: 7, snoutAng: 6,
    ear: { type: 'prick', len: 15, w: 13 }, tail: { type: 'plume', len: 36, ang: 80, r: 12 }, color: '#d99a52', marks: ['mane'] },
  schnauzer: { L: 84, chestR: 30, hipR: 27, leg: 66, legR: [12, 10, 10], hindR: 17, neckLen: 40, neckAng: 58, headR: 20, snoutLen: 28, snoutR: 11, snoutAng: 4,
    ear: { type: 'prick', len: 18, w: 14, fold: true }, tail: { type: 'whip', len: 26, ang: 70, r: 6 }, color: C.gray, marks: ['beard', 'socks'] },
  beagle: { L: 96, chestR: 34, hipR: 29, leg: 70, legR: [12, 9, 8], hindR: 19, neckLen: 42, neckAng: 52, headR: 22, snoutLen: 28, snoutR: 10, snoutAng: 6,
    ear: { type: 'drop', len: 34, w: 15, ang: -4, color: '#9a5f38' }, tail: { type: 'whip', len: 58, ang: 62, r: 6.5, tip: C.white }, color: C.white, marks: ['saddle', 'headTan'] },
};
function breed(name, over = {}) {
  let b = BREEDS[name]; if (!b) throw new Error('breed ' + name);
  if (b.base) b = Object.assign({}, breed(b.base), b);
  return Object.assign({}, b, over);
}

// ---------- dog ----------
// o: {x, y, s, flip, gait:'walk'|'trot'|'run'|'stand', p, stride, t, collar, bandana, tongue, wag, hat, look}
function dog(name, o) {
  const B = typeof name === 'string' ? breed(name, o.over || {}) : name;
  const col = B.color, far = B.mono ? shade(col, 0.86) : shade(col, 0.8), light = B.light || C.white;
  const gait = o.gait || 'walk', p = frac(o.p || 0), t = o.t || 0, leg = B.leg;
  let duty, ph, stride = o.stride, lift, bob = 0, pitch = 0, earSwing = 0, headNod = 0;
  if (gait === 'walk') { duty = 0.62; ph = { hn: 0, fn: 0.25, hf: 0.5, ff: 0.75 }; lift = leg * 0.17 * (o.liftK ?? 1); stride = stride ?? leg * 1.05; bob = leg * 0.018 * (o.liftK ?? 1) * sin(2 * TAU * p); headNod = 2.5 * (o.liftK ?? 1) * sin(2 * TAU * p + 0.6); earSwing = 4 * (o.liftK ?? 1) * sin(2 * TAU * p + 1.2); }
  else if (gait === 'trot') { duty = 0.5; ph = { fn: 0, hf: 0, ff: 0.5, hn: 0.5 }; lift = leg * 0.24; stride = stride ?? leg * 0.9; bob = leg * 0.045 * sin(2 * TAU * p); headNod = 3 * sin(2 * TAU * p + 0.6); earSwing = 9 * sin(2 * TAU * p + 1.2); }
  else if (gait === 'run') { duty = 0.3; ph = { hf: 0, hn: 0.07, ff: 0.5, fn: 0.57 }; lift = leg * 0.42; stride = stride ?? leg * 1.9; bob = -leg * 0.13 * (0.5 + 0.5 * cos(2 * TAU * (p - 0.4))); pitch = -7 * cos(TAU * (p - 0.03)); headNod = -5 * cos(TAU * (p - 0.1)); earSwing = -38 + 14 * sin(2 * TAU * p); }
  else { duty = 1; ph = { hn: 0, fn: 0, hf: 0, ff: 0 }; lift = 0; stride = 0; bob = leg * 0.008 * sin(TAU * t / 3.5); }
  if (o.ear != null) earSwing = o.ear;
  if (o.nod != null) headNod = o.nod;
  if (o.pitch != null) pitch = o.pitch;
  const L = B.L, rot = rad(pitch), pivot = [0, -leg];
  const R = (x, y) => { const dx = x - pivot[0], dy = y - pivot[1]; return [pivot[0] + dx * cos(rot) - dy * sin(rot), pivot[1] + dx * sin(rot) + dy * cos(rot) + bob]; };
  const Jf = R(L / 2, -leg), Jh = R(-L / 2, -leg);
  const Cc = R(L / 2 + B.chestR * 0.1, -leg - B.chestR * 0.35), Hc = R(-L / 2 - B.hipR * 0.1, -leg - B.hipR * 0.3);
  const g = [];
  // legs
  const l1 = leg * 0.54, l2 = leg * 0.54, lr = B.legR, pawR = lr[2];
  function legShape(J, front, phase, c, farSide) {
    let f;
    if (gait === 'stand') f = { x: farSide ? leg * 0.1 : -leg * 0.03, y: 0, air: 0 };
    else if (gait === 'run') {
      const q = frac(p - phase);
      if (q < duty) { const u = q / duty; f = { x: (front ? 0.62 : 0.5) * leg - (front ? 1.15 : 1.3) * leg * u, y: 0, air: 0 }; }
      else { const s = (q - duty) / (1 - duty), e = 0.5 - 0.5 * cos(PI * s); f = { x: (front ? -0.53 : -0.8) * leg + (front ? 1.15 : 1.3) * leg * e, y: -lift * sin(PI * s) * (front ? 1 : 0.8), air: sin(PI * s) }; }
    } else f = foot(p - phase, duty, stride, lift);
    const neutral = front ? 0 : -leg * 0.1;
    const tx = (front ? L / 2 : -L / 2) + neutral + f.x + (farSide && gait !== 'run' ? leg * 0.04 : 0), ty = -pawR + f.y;
    const k = ik(J[0], J[1], tx, ty, l1, l2, front ? -1 : 1);
    const top = front ? lr[0] : (B.hindR || lr[0] * 1.3);
    let s = cap(J[0], J[1], top, k.jx, k.jy, lr[1], c) + cap(k.jx, k.jy, lr[1], k.ex, k.ey, lr[2], c);
    const pc = (B.marks.includes('socks') && !B.mono) ? (farSide ? shade(light, 0.86) : light) : c;
    const pa = f.air * (front ? 28 : 18);
    s += ell(k.ex + pawR * 0.45, k.ey + pawR * 0.05, pawR * 1.45, pawR * 0.98, pa, pc);
    if (B.marks.includes('socks') && !B.mono) s += cap(lerp(k.jx, k.ex, 0.55), lerp(k.jy, k.ey, 0.55), lerp(lr[1], lr[2], 0.55), k.ex, k.ey, lr[2], pc);
    return s;
  }
  if (!o.bust) g.push(legShape(Jh, false, ph.hf, far, true), legShape(Jf, true, ph.ff, far, true));
  // tail
  const Tb = R(-L / 2 - B.hipR * 0.75, -leg - B.hipR * 0.7), T = B.tail;
  const wag = (o.wag ?? 1) * (gait === 'run' ? 6 : 12) * sin(TAU * t * (gait === 'stand' ? 2.2 : 1.8) + (o.seed || 0));
  if (o.bust || o.noTail) {} else if (T.type === 'whip') {
    const a = rad(T.ang + wag - pitch + (gait === 'run' ? -14 : 0)), tx = Tb[0] - T.len * cos(a), ty = Tb[1] - T.len * sin(a);
    g.push(cap(Tb[0] + 6, Tb[1] + 4, T.r * 1.25, tx, ty, T.r * 0.38, col));
    if (T.tip) g.push(cap(lerp(Tb[0], tx, 0.62), lerp(Tb[1], ty, 0.62), T.r * 0.75, tx, ty, T.r * 0.4, T.tip));
  } else if (T.type === 'plume') {
    const a = rad(T.ang + wag * 0.8), mx = Tb[0] - T.len * 0.55 * cos(a), my = Tb[1] - T.len * 0.55 * sin(a), a2 = a + rad(gait === 'run' ? -10 : 28);
    g.push(cap(Tb[0] + 6, Tb[1] + 4, T.r, mx, my, T.r * 1.45, col), cap(mx, my, T.r * 1.45, mx - T.len * 0.5 * cos(a2), my - T.len * 0.5 * sin(a2), T.r * 0.7, col));
  } else if (T.type === 'curl') {
    const cx = Tb[0] + T.cr * 0.2, cy = Tb[1] - T.cr * 0.75 + wag * 0.15;
    g.push(`<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(T.cr)}" fill="none" stroke="${col}" stroke-width="${n(T.r * 2)}" stroke-linecap="round" stroke-dasharray="${n(T.cr * 4.6)} 999" transform="rotate(${n(100 + wag * 0.4)} ${n(cx)} ${n(cy)})"/>`);
  } else if (T.type === 'stub') g.push(circ(Tb[0] + 4, Tb[1] + 6, T.r, col));
  else if (T.type === 'pom') {
    const a = rad(T.ang + wag), tx = Tb[0] - T.len * cos(a), ty = Tb[1] - T.len * sin(a);
    g.push(cap(Tb[0] + 6, Tb[1] + 6, T.r * 1.2, tx, ty, T.r, col), circ(tx, ty, T.pr, col));
  }
  // torso
  g.push(cap(Cc[0], Cc[1], B.chestR, Hc[0], Hc[1], B.hipR, col));
  const M = B.marks;
  if (M.includes('fluff')) for (let i = 0; i <= 4; i++) { const u = i / 4; g.push(circ(lerp(Cc[0], Hc[0], u), lerp(Cc[1], Hc[1], u) + lerp(B.chestR, B.hipR, u) * 0.72, lerp(B.chestR, B.hipR, u) * 0.42, col)); }
  if (M.includes('mane')) g.push(circ(Cc[0] + B.chestR * 0.3, Cc[1] - B.chestR * 0.25, B.chestR * 1.02, shade(col, 1.12)), circ(Hc[0] - 4, Hc[1] + 2, B.hipR * 1.05, col));
  if (M.includes('saddle')) g.push(cap(Cc[0] - B.chestR * 0.25, Cc[1] - B.chestR * 0.3, B.chestR * 0.64, Hc[0], Hc[1] - B.hipR * 0.22, B.hipR * 0.72, C.black));
  if (M.includes('spots')) { const sp = [[0.08, -0.45, 6], [0.25, 0.2, 8], [0.42, -0.5, 5], [0.55, 0.05, 7], [0.72, -0.35, 6.5], [0.9, 0.25, 6], [0.98, -0.5, 5], [0.38, 0.5, 4.5], [0.7, 0.45, 5], [-0.12, 0.1, 6]];
    for (const [u, v, r] of sp) { const rr = lerp(B.chestR, B.hipR, u); g.push(ell(lerp(Cc[0], Hc[0], u), lerp(Cc[1], Hc[1], u) + v * rr * 0.9, r * 1.15, r * 0.9, u * 140, C.black)); } }
  // neck + head
  const na = rad(B.neckAng + headNod + (o.look || 0) - pitch * 0.7 + (gait === 'run' ? -18 : 0));
  const Nb = [Cc[0] + B.chestR * 0.3, Cc[1] - B.chestR * 0.3];
  const Hd = [Nb[0] + B.neckLen * cos(na), Nb[1] - B.neckLen * sin(na)];
  g.push(cap(Cc[0] + B.chestR * 0.12, Cc[1] - B.chestR * 0.1, B.chestR * 0.8, Hd[0], Hd[1], B.headR * 0.86, col));
  if (M.includes('chest') && !B.mono) g.push(ell(Cc[0] + B.chestR * 0.3, Cc[1] + B.chestR * 0.22, B.chestR * 0.52, B.chestR * 0.62, -25, light));
  // near legs
  if (!o.bust) g.push(legShape(Jh, false, ph.hn, col, false), legShape(Jf, true, ph.fn, col, false));
  // collar / bandana
  const nm = [lerp(Nb[0], Hd[0], 0.5), lerp(Nb[1], Hd[1], 0.5)], nr = lerp(B.chestR * 0.8, B.headR * 0.86, 0.55), px = -sin(na), py = -cos(na);
  if (o.bandana) {
    const a = [nm[0] + px * nr * 1.02, nm[1] + py * nr * 1.02], b = [nm[0] - px * nr * 1.02, nm[1] - py * nr * 1.02];
    const tip = [b[0] - cos(na) * nr * 1.25 + px * nr * 0.2, b[1] + sin(na) * nr * 1.25 + py * nr * 0.2 + nr * 0.25];
    g.push(`<path d="M${n(a[0])},${n(a[1])}L${n(b[0])},${n(b[1])}L${n(tip[0])},${n(tip[1])}Z" fill="${o.bandana}" stroke="${o.bandana}" stroke-width="5" stroke-linejoin="round"/>`);
    g.push(circ(lerp(a[0], tip[0], 0.55), lerp(a[1], tip[1], 0.55), 2.2, C.cream), circ(lerp(b[0], tip[0], 0.3), lerp(b[1], tip[1], 0.3) - 5, 1.8, C.cream));
  } else if (o.collar) g.push(cap(nm[0] + px * nr * 0.98, nm[1] + py * nr * 0.98, 3.6, nm[0] - px * nr * 0.98, nm[1] - py * nr * 0.98, 3.6, o.collar));
  // head
  const hc = M.includes('headTan') ? '#9a5f38' : col, sa = rad(B.snoutAng - (headNod + (o.look || 0)) * 0.6 + pitch * 0.5);
  const tip = [Hd[0] + (B.headR * 0.5 + B.snoutLen) * cos(sa), Hd[1] + B.headR * 0.18 + (B.headR * 0.5 + B.snoutLen) * sin(sa)];
  const sc = M.includes('mask') ? C.black : (M.includes('muzzle') || M.includes('headTan')) ? light : hc;
  if (o.tongue) { const mx = lerp(Hd[0], tip[0], 0.72), my = lerp(Hd[1], tip[1], 0.72) + B.snoutR * 0.9; g.push(cap(mx, my, 4.2, mx + 3 + 2 * sin(TAU * t * 3), my + 13 + 2 * sin(TAU * t * 3), 4.8, C.pink)); }
  g.push(circ(Hd[0], Hd[1], B.headR, hc));
  g.push(cap(Hd[0] + B.headR * 0.3, Hd[1] + B.headR * 0.14, B.headR * 0.7, tip[0], tip[1], B.snoutR, sc));
  if (M.includes('beard')) g.push(cap(tip[0] - 4, tip[1] + 2, B.snoutR * 1.0, tip[0] - 2, tip[1] + B.snoutR * 1.5, B.snoutR * 0.75, light));
  if (M.includes('topknot')) g.push(circ(Hd[0] - 2, Hd[1] - B.headR * 0.62, B.headR * 0.88, col));
  if (!B.mono) {
    g.push(circ(tip[0] + B.snoutR * 0.45 * cos(sa), tip[1] - B.snoutR * 0.45, Math.max(3, B.snoutR * 0.5), M.includes('mask') ? '#1d1b19' : C.ink));
    g.push(circ(Hd[0] + B.headR * 0.34, Hd[1] - B.headR * 0.1, Math.max(2.3, B.headR * 0.1), M.includes('mask') ? '#1d1b19' : C.ink));
  }
  // ear
  const E = B.ear, ec = E.color || (B.mono ? shade(col, 0.86) : shade(col, 0.82));
  if (E.type === 'drop') {
    const A = [Hd[0] - B.headR * 0.3, Hd[1] - B.headR * 0.48], th = rad(E.ang + earSwing * (E.len / 30));
    g.push(cap(A[0], A[1], E.w * 0.6, A[0] + E.len * sin(th), A[1] + E.len * cos(th), E.w * 0.95, ec));
  } else {
    const bx = Hd[0] - B.headR * 0.42, by = Hd[1] - B.headR * 0.62, lean = gait === 'run' ? -0.5 : -0.12;
    g.push(`<path d="M${n(bx - E.w * 0.5)},${n(by + 5)}L${n(bx + E.len * lean)},${n(by - E.len)}L${n(bx + E.w * 0.55)},${n(by + 2)}Z" fill="${ec}" stroke="${ec}" stroke-width="5" stroke-linejoin="round"/>`);
    if (E.fold) g.push(cap(bx + E.len * lean, by - E.len, 4, bx + E.len * lean + 9, by - E.len + 9, 5, ec));
  }
  if (o.hat) { const hx = Hd[0] - 2, hy = Hd[1] - B.headR * 0.82; g.push(ell(hx, hy, B.headR * 1.25, B.headR * 0.22, -8, o.hat), cap(hx - 4, hy - 3, B.headR * 0.62, hx + 6, hy - 5, B.headR * 0.6, o.hat), ell(hx + 1, hy - 1, B.headR * 0.68, 3.2, -8, C.cream)); }
  const anchor = { neck: [nm[0], nm[1]], head: Hd, back: [lerp(Cc[0], Hc[0], 0.5), lerp(Cc[1], Hc[1], 0.5) - lerp(B.chestR, B.hipR, 0.5)] };
  const sx = (o.flip ? -1 : 1) * (o.s || 1), sy = o.s || 1;
  const svg = `<g transform="translate(${n(o.x)},${n(o.y)}) scale(${sx},${sy})">${g.join('')}</g>`;
  return { svg, world: k => [o.x + anchor[k][0] * sx, o.y + anchor[k][1] * sy], len: (L + B.chestR + B.hipR + B.neckLen) * sy, B };
}
function shadow(x, y, rx, ry = rx * 0.14, op = 0.16) { return `<ellipse cx="${n(x)}" cy="${n(y)}" rx="${n(rx)}" ry="${n(ry)}" fill="${C.dark}" opacity="${op}"/>`; }

// ---------- walker (side view, facing right) ----------
// o: {x, y, s, p, t}. Returns svg split in layers so leashes can pass behind/in front.
function walker(o) {
  const p = frac(o.p), t = o.t || 0, duty = 0.6, stride = o.stride ?? 240, bob = 5 * cos(2 * TAU * p);
  const hx = 0, hy = -322 + bob, Sx = 8, Sy = hy - 198;
  const coat = o.coat || C.olive, trou = o.trousers || '#dcd2bc', shoe = '#2e2a26';
  const back = [], front = [];
  function leg(phase, col, farSide) {
    const q = frac(p - phase), f = foot(q, duty, stride, 30);
    let phi;
    if (q < duty) { const u = q / duty; phi = u < 0.15 ? lerp(-16, 0, u / 0.15) : u < 0.62 ? 0 : lerp(0, 30, (u - 0.62) / 0.38); }
    else phi = lerp(30, -16, ease((q - duty) / (1 - duty)));
    const ax = hx + (farSide ? 6 : -2) + f.x, ay = -22 + f.y - (phi > 0 && q < duty ? sin(rad(phi)) * 40 : 0);
    const k = ik(hx + (farSide ? 4 : -4), hy, ax, ay, 160, 152, -1);
    let s2 = `<g transform="translate(${n(ax)},${n(ay)}) rotate(${n(phi)})"><path d="M-17,-2C-19,8 -18,16 -16,20L50,20C55,20 55,12 48,8C38,3 24,-1 12,-6Z" fill="${shoe}"/><path d="M-17,14H52" stroke="#4a4038" stroke-width="3"/></g>`;
    s2 += cap(hx + (farSide ? 4 : -4), hy, 40, k.jx, k.jy, 33, col) + cap(k.jx, k.jy, 33, ax + 4, ay - 30, 37, col);
    return s2;
  }
  back.push(leg(0.5, shade(trou, 0.86), true));
  back.push(leg(0, trou, false));
  // coat
  const sw1 = 12 * sin(2 * TAU * p + 2.2), sw2 = 9 * sin(2 * TAU * p + 0.4), hemY = hy + 212;
  const coatD = `M${n(Sx - 12)},${n(Sy - 16)}C${n(Sx - 50)},${n(Sy - 6)} ${n(Sx - 66)},${n(Sy + 60)} ${n(hx - 60)},${n(hy - 40)}` +
    `C${n(hx - 70)},${n(hy + 30)} ${n(hx - 80 + sw1 * 0.4)},${n(hy + 120)} ${n(hx - 100 + sw1)},${n(hemY)}` +
    `Q${n(hx - 10 + (sw1 + sw2) / 2)},${n(hemY + 12)} ${n(hx + 70 + sw2)},${n(hemY - 8)}` +
    `C${n(hx + 64 + sw2 * 0.4)},${n(hy + 110)} ${n(hx + 60)},${n(hy + 30)} ${n(hx + 58)},${n(hy - 30)}C${n(hx + 60)},${n(Sy + 80)} ${n(Sx + 52)},${n(Sy + 20)} ${n(Sx + 32)},${n(Sy - 12)}Z`;
  const cid = 'coat' + (o.id || '');
  let c = `<clipPath id="${cid}"><path d="${coatD}"/></clipPath><path d="${coatD}" fill="${coat}"/>`;
  c += `<g clip-path="url(#${cid})"><rect x="-140" y="${n(Sy - 40)}" width="280" height="470" fill="url(#check)" transform="translate(${n(sw1 * 0.2)},${n(bob)})"/>`;
  // lining peeking at the front hem + front edge
  c += `<path d="M${n(hx + 70 + sw2)},${n(hemY - 8)}C${n(hx + 60 + sw2 * 0.4)},${n(hy + 110)} ${n(hx + 56)},${n(hy + 30)} ${n(hx + 52)},${n(hy - 30)}L${n(hx + 40)},${n(hy - 30)}C${n(hx + 42)},${n(hy + 40)} ${n(hx + 40 + sw2 * 0.4)},${n(hy + 120)} ${n(hx + 44 + sw2)},${n(hemY - 2)}Z" fill="${shade(coat, 0.82)}"/></g>`;
  // collar, buttons, pocket
  c += `<path d="M${n(Sx - 14)},${n(Sy - 16)}C${n(Sx)},${n(Sy - 26)} ${n(Sx + 26)},${n(Sy - 20)} ${n(Sx + 34)},${n(Sy - 8)}L${n(Sx + 46)},${n(Sy + 44)}L${n(Sx + 22)},${n(Sy + 26)}L${n(Sx + 2)},${n(Sy + 34)}Z" fill="${shade(coat, 0.84)}"/>`;
  c += circ(hx + 30, hy - 82, 5, C.gold) + circ(hx + 32, hy - 34, 5, C.gold);
  c += `<path d="M${n(hx - 30)},${n(hy + 22)}L${n(hx + 14)},${n(hy + 14)}" stroke="${shade(coat, 0.8)}" stroke-width="5" stroke-linecap="round"/>`;
  back.push(c);
  // bag (tote on the shoulder, hanging at the back hip)
  const ba = 3 * sin(TAU * p * 2 + 1), bx = hx - 66, by = hy - 62;
  front.push(`<g transform="rotate(${n(ba)} ${n(Sx - 8)} ${n(Sy)})"><path d="M${n(Sx - 6)},${n(Sy + 2)}L${n(bx - 30)},${n(by)}M${n(Sx + 4)},${n(Sy + 4)}L${n(bx + 34)},${n(by)}" stroke="#cdbd9a" stroke-width="6" stroke-linecap="round" fill="none"/>` +
    `<path d="M${n(bx - 50)},${n(by - 4)}H${n(bx + 52)}L${n(bx + 46)},${n(by + 92)}Q${n(bx)},${n(by + 100)} ${n(bx - 46)},${n(by + 92)}Z" fill="#eee4cc" stroke="#eee4cc" stroke-width="6" stroke-linejoin="round"/>` +
    LOGODOG(bx + 1, by + 44, 52, C.olive) + `</g>`);
  // near arm
  const hand = [hx + 74 + 5 * sin(TAU * p), hy - 34 + 3 * sin(2 * TAU * p)], sh = [Sx - 2, Sy + 12];
  const e = ik(sh[0], sh[1], hand[0], hand[1], 100, 96, 1), sl = shade(coat, 1.07);
  front.push(cap(sh[0], sh[1], 28, e.jx, e.jy, 22, sl) + cap(e.jx, e.jy, 22, lerp(e.jx, hand[0], 0.86), lerp(e.jy, hand[1], 0.86), 18, sl) + circ(hand[0], hand[1], 12.5, C.skin));
  // scarf, neck, head
  const hb = 1.5 * sin(2 * TAU * p + 0.8), Hx = Sx + 20, Hy = Sy - 78 + hb, fl = 8 * sin(2 * TAU * p + 1.4);
  let h = cap(Sx + 8, Sy - 4, 14, Sx + 14, Sy - 42, 12.5, shade(C.skin, 0.93));
  h += cap(Sx - 22, Sy + 2, 10, Sx - 40 - fl, Sy + 62, 13, C.goldL) + cap(Sx - 12, Sy - 6, 17, Sx + 30, Sy, 14, C.goldL);
  h += ell(Hx - 12, Hy - 6, 36, 39, -8, C.hair) + circ(Hx - 44, Hy - 22, 20, C.hair);
  h += `<g transform="rotate(7 ${n(Hx)} ${n(Hy)})">` + ell(Hx + 3, Hy + 4, 30, 37, 0, C.skin) +
    `<path d="M${n(Hx + 30)},${n(Hy - 2)}L${n(Hx + 39)},${n(Hy + 10)}L${n(Hx + 29)},${n(Hy + 14)}Z" fill="${C.skin}" stroke="${C.skin}" stroke-width="3" stroke-linejoin="round"/>` +
    cap(Hx - 26, Hy - 24, 19, Hx + 20, Hy - 30, 11, C.hair) + cap(Hx - 30, Hy - 10, 14, Hx - 22, Hy + 14, 9, C.hair) +
    `<path d="M${n(Hx + 14)},${n(Hy)}q6,4 12,0" fill="none" stroke="${C.ink}" stroke-width="2.4" stroke-linecap="round"/>` +
    `<path d="M${n(Hx + 12)},${n(Hy - 9)}q7,-4 14,-1" fill="none" stroke="${C.hair}" stroke-width="2.4" stroke-linecap="round"/>` +
    circ(Hx + 14, Hy + 14, 7.5, C.pink, 'opacity=".42"') + ell(Hx + 26, Hy + 23, 4, 2.2, 0, '#b4574a') + `</g>`;
  h += cap(Hx - 42, Hy - 36, 3.2, Hx - 30, Hy - 30, 3.2, C.gold);
  front.push(h);
  const sx = o.s || 1, wrap = inner => `<g transform="translate(${n(o.x)},${n(o.y)}) scale(${sx})">${inner}</g>`;
  return { back: wrap(back.join('')), front: wrap(front.join('')), hand: [o.x + hand[0] * sx, o.y + hand[1] * sx], svg: wrap(back.join('') + front.join('')) };
}
function leash(a, b, sag, col = C.brickD, w = 4.5) { const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2 + sag; return `<path d="M${n(a[0])},${n(a[1])}Q${n(mx)},${n(my)} ${n(b[0])},${n(b[1])}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round"/>`; }

if (typeof module !== 'undefined') module.exports = { C, shade, capD, cap, circ, ell, poly, ik, foot, dog, breed, BREEDS, shadow, lerp, clamp, ease, frac, rad, n, TAU };
