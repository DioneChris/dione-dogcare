// Dione logo pointer — skeletal rig and walk.
// The logo silhouette is skinned to a 2D skeleton (linear blend skinning on the Bezier control points),
// so the rest pose is the logo artwork exactly and every other pose is a smooth deformation of it.
// Units are the logo's own SVG units; the dog faces -x (left).
(function (root) {
'use strict';
const LOGO = root.LOGO2 || (typeof require !== 'undefined' ? require('./logo2_data.js') : null);
const { PI, sin, cos, atan2, hypot, acos, max, min, abs, exp, sqrt } = Math;
const TAU = 2 * PI, D2R = PI / 180;
const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
const ss = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const s5 = t => { t = clamp(t); return t * t * t * (t * (6 * t - 15) + 10); };
const lerp = (a, b, t) => a + (b - a) * t;
const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
const rot = (v, a) => [v[0] * cos(a) - v[1] * sin(a), v[0] * sin(a) + v[1] * cos(a)];
const ang = v => atan2(v[1], v[0]);
const frac = v => v - Math.floor(v);

// ---------------------------------------------------------------- rest skeleton
const R = {
  Pt: [420, 258], Pp: [456, 256],                       // thorax / pelvis pivots
  Q: [413, 241], S: [390, 258], E: [402, 271], C: [401, 308], Ff: [400, 316], Tf: [390.9, 321.8],
  H: [462, 257], K: [455, 278], J: [488, 302.5], Fh: [488.5, 318], Th: [477.6, 325],
  B: [408, 244], A: [392, 219], Nz: [356, 207],          // neck base, atlas, nose
  Pe: [387, 206], Et: [386, 224],                        // ear pivot, ear tip
  Tr: [467, 251], Tt: [474, 241],                        // tail root, tail tip
};
const FAR = [-1.5, -6.5];                                // far-side legs sit a little higher in the logo's view
const farP = p => add(p, FAR);

// bones: name -> rest head/tail
const BONES = {
  thorax: [R.Pt, [R.Pt[0] + 30, R.Pt[1]]], pelvis: [R.Pp, [R.Pp[0] + 30, R.Pp[1]]],
  neck: [R.B, R.A], head: [R.A, R.Nz], ear: [R.Pe, R.Et], tail: [R.Tr, R.Tt],
  hum: [R.S, R.E], rad: [R.E, R.C], metF: [R.C, R.Ff], pawF: [R.Ff, R.Tf],
  fem: [R.H, R.K], tib: [R.K, R.J], metH: [R.J, R.Fh], pawH: [R.Fh, R.Th],
};
for (const k of ['hum', 'rad', 'metF', 'pawF', 'fem', 'tib', 'metH', 'pawH']) BONES[k + '_f'] = BONES[k].map(farP);
const BNAMES = Object.keys(BONES), BI = {}; BNAMES.forEach((n, i) => (BI[n] = i));
const LEN = {}; for (const n of BNAMES) LEN[n] = hypot(...sub(BONES[n][1], BONES[n][0]));

// ---------------------------------------------------------------- skin weights
// signed distance to a line through a->b, positive on the +y (distal) side
function sdl(p, a, b) { const d = sub(b, a), l = hypot(...d); let n = [-d[1] / l, d[0] / l]; if (n[1] < 0) n = [-n[0], -n[1]]; return (p[0] - a[0]) * n[0] + (p[1] - a[1]) * n[1]; }
function chain(p, lines, names) {           // nested zone boundaries down a limb
  const w = {}; let acc = 1;
  for (let i = 0; i < lines.length; i++) { const [a, b, band] = lines[i], s = ss(-band, band, sdl(p, a, b)); w[names[i]] = acc * (1 - s); acc *= s; }
  w[names[lines.length]] = acc; return w;
}
const wFore = p => chain(p, [[[389, 277], [409, 275], 4], [[394, 307.5], [407, 307.5], 3], [[393, 315.5], [406, 316.5], 2]], ['hum', 'rad', 'metF', 'pawF']);
const wHind = p => chain(p, [[[444, 276], [476, 262], 6], [[451, 274.5], [477.2, 285.5], 3.5], [[479.5, 303.5], [493, 301.9], 2.5], [[485.5, 316.5], [492, 318.5], 2]], ['pelvis', 'fem', 'tib', 'metH', 'pawH']);
function wTorso(p) { const pel = ss(424, 452, p[0]); return { thorax: 1 - pel, pelvis: pel }; }
function wNeck(p) {
  const ab = sub(R.A, R.B), s = ((p[0] - R.B[0]) * ab[0] + (p[1] - R.B[1]) * ab[1]) / (ab[0] * ab[0] + ab[1] * ab[1]);
  const head = ss(0.72, 1.02, s), tho = 1 - ss(-0.1, 0.3, s), neck = max(0, 1 - head - tho);
  const n = head + tho + neck; return { head: head / n, thorax: tho / n, neck: neck / n };
}
function wEar(p) { const e = ss(3.5, 9, hypot(...sub(p, R.Pe))), w = wNeck(p); for (const k in w) w[k] *= 1 - e; w.ear = e; return w; }
function wTail(p) { const ab = sub(R.Tt, R.Tr), s = ((p[0] - R.Tr[0]) * ab[0] + (p[1] - R.Tr[1]) * ab[1]) / (ab[0] * ab[0] + ab[1] * ab[1]); const t = ss(0, 0.45, s); return { tail: t, pelvis: 1 - t }; }
function wFlank(p) { const f = 0.5 * ss(424, 446, p[0]), w = wTorso(p); w.thorax *= 1 - f; w.pelvis *= 1 - f; w.fem = f; return w; }
function wChest(p) { const h = 0.8 * ss(262, 275, p[1]); return { thorax: 1 - h, hum: h }; }
function wBrisket(p) { const h = 0.8 * (1 - ss(410, 418, p[0])) * ss(262, 268, p[1]); const w = wTorso(p); w.thorax *= 1 - h; w.pelvis *= 1 - h; w.hum = h; return w; }

const NOTCH = 191, SLIT = 158;            // elbow notch tip, slit top (found from the artwork)
function regionFn(k) {                     // node index on the dog's outer contour -> weight function
  if (k <= 12) return wHind;
  if (k <= 26) return wTail;
  if (k <= 39) return wTorso;
  if (k >= 76 && k <= 83) return wEar;
  if (k <= 128) return wNeck;
  if (k <= 150) return wChest;
  if (k <= NOTCH) return wFore;
  if (k <= 221) return wBrisket;
  if (k <= 213) return wTorso;
  if (k <= 226) return wFlank;
  return wHind;
}
const pack = w => { const o = []; let s = 0; for (const k in w) if (w[k] > 1e-4) { o.push([BI[k], w[k]]); s += w[k]; } return o.map(([i, v]) => [i, v / s]); };
const farName = w => { const o = {}; for (const k in w) o[BONES[k + '_f'] ? k + '_f' : k] = w[k]; return o; };

// a skin = list of subpaths; each segment = 4 points [x,y,weights]
function seg4(s) { return [[s[0], s[1]], [s[2], s[3]], [s[4], s[5]], [s[6], s[7]]]; }
const line4 = (a, b) => [a, [lerp(a[0], b[0], 1 / 3), lerp(a[1], b[1], 1 / 3)], [lerp(a[0], b[0], 2 / 3), lerp(a[1], b[1], 2 / 3)], b];
function buildDog() {
  return LOGO.dog.map((sp, si) => sp.map((s, k) => {
    const P = seg4(s), n = sp.length;
    const f0 = si ? () => ({ head: 1 }) : regionFn(k), f1 = si ? f0 : regionFn((k + 1) % n);
    return P.map((p, j) => [p[0], p[1], pack((j === 0 || j === 1 ? f0 : f1)(p))]);
  }));
}
function buildFarLeg(fromK, toK, cap, fn) {          // copy of the near leg contour, closed through the body
  const sp = LOGO.dog[0], n = sp.length, segs = [];
  for (let k = fromK; ; k = (k + 1) % n) { segs.push(seg4(sp[k])); if (k === toK) break; }
  const pts = [segs[segs.length - 1][3], ...cap, segs[0][0]];
  for (let i = 0; i < pts.length - 1; i++) segs.push(line4(pts[i], pts[i + 1]));
  return [segs.map(P => P.map(p => { const q = farP(p); return [q[0], q[1], pack(farName(fn(p)))]; }))];
}
const SKIN = {
  dog: buildDog(),
  nose: LOGO.nose.map(n => n.map(sp => sp.map(s => seg4(s).map(p => [p[0], p[1], [[BI.head, 1]]])))),
  farFore: buildFarLeg(SLIT, NOTCH - 1, [[406, 260], [396, 258], [389, 264]], wFore),
  farHind: buildFarLeg(227, 10, [[467, 262], [456, 259], [446, 264]], wHind),
};

// ---------------------------------------------------------------- transforms
function M(h0, h, th) { const c = cos(th), s = sin(th); return [c, s, -s, c, h[0] - (c * h0[0] - s * h0[1]), h[1] - (s * h0[0] + c * h0[1])]; }
const ap = (m, p) => [m[0] * p[0] + m[2] * p[1] + m[4], m[1] * p[0] + m[3] * p[1] + m[5]];
const boneM = (n, h, t) => M(BONES[n][0], h, ang(sub(t, h)) - ang(sub(BONES[n][1], BONES[n][0])));
function skinD(skin, mats, nd = 2) {
  const f = v => v.toFixed(nd), out = [];
  const tp = p => { if (p[2].length === 1) return ap(mats[p[2][0][0]], p); const m = [0, 0, 0, 0, 0, 0]; for (const [i, w] of p[2]) { const q = mats[i]; for (let j = 0; j < 6; j++) m[j] += q[j] * w; } return ap(m, p); };
  for (const sp of skin) {
    const first = tp(sp[0][0]); out.push('M' + f(first[0]) + ',' + f(first[1]));
    for (const s of sp) { const a = tp(s[1]), b = tp(s[2]), c = tp(s[3]); out.push('C' + f(a[0]) + ',' + f(a[1]) + ' ' + f(b[0]) + ',' + f(b[1]) + ' ' + f(c[0]) + ',' + f(c[1])); }
    out.push('Z');
  }
  return out.join('');
}
function ik(s, c, l1, l2, side) {           // two-bone IK; side picks the bend (+1/-1 by cross product sign)
  let d = sub(c, s), dl = hypot(...d); const mx = l1 + l2 - 1e-4, mn = abs(l1 - l2) + 1e-4, reach = dl / (l1 + l2);
  if (dl > mx) { d = [d[0] * mx / dl, d[1] * mx / dl]; dl = mx; } if (dl < mn) { d = [d[0] * mn / dl, d[1] * mn / dl]; dl = mn; }
  const a = acos(clamp((l1 * l1 + dl * dl - l2 * l2) / (2 * l1 * dl), -1, 1)), b = ang(d);
  const j1 = add(s, [l1 * cos(b + a), l1 * sin(b + a)]), j2 = add(s, [l1 * cos(b - a), l1 * sin(b - a)]);
  const cr = j => d[0] * (j[1] - s[1]) - d[1] * (j[0] - s[0]);
  return { j: Math.sign(cr(j1)) === side ? j1 : j2, end: add(s, d), reach };
}
const SIDE = { fore: Math.sign((R.C[0] - R.S[0]) * (R.E[1] - R.S[1]) - (R.C[1] - R.S[1]) * (R.E[0] - R.S[0])), hind: Math.sign((R.J[0] - R.H[0]) * (R.K[1] - R.H[1]) - (R.J[1] - R.H[1]) * (R.K[0] - R.H[0])) };

// keyframed curve: keys [[s, v], ...], Catmull-Rom with clamped ends
function curve(keys, s) {
  if (s <= keys[0][0]) return keys[0][1]; const n = keys.length; if (s >= keys[n - 1][0]) return keys[n - 1][1];
  let i = 0; while (keys[i + 1][0] < s) i++;
  const [x1, y1] = keys[i], [x2, y2] = keys[i + 1], y0 = i > 0 ? keys[i - 1][1] : y1, y3 = i + 2 < n ? keys[i + 2][1] : y2;
  const x0 = i > 0 ? keys[i - 1][0] : x1 - (x2 - x1), x3 = i + 2 < n ? keys[i + 2][0] : x2 + (x2 - x1);
  const t = (s - x1) / (x2 - x1), h = x2 - x1, m1 = (y2 - y0) / (x2 - x0) * h, m2 = (y3 - y1) / (x3 - x1) * h;
  const t2 = t * t, t3 = t2 * t; return (2 * t3 - 3 * t2 + 1) * y1 + (t3 - 2 * t2 + t) * m1 + (-2 * t3 + 3 * t2) * y2 + (t3 - t2) * m2;
}

// ---------------------------------------------------------------- gait
// lateral-sequence walk: near hind, near fore, far hind, far fore — four beats per stride
const LEGS = [
  { id: 'hn', kind: 'hind', far: false, off: 0.00, duty: 0.62 },
  { id: 'fn', kind: 'fore', far: false, off: 0.24, duty: 0.64 },
  { id: 'hf', kind: 'hind', far: true, off: 0.50, duty: 0.62 },
  { id: 'ff', kind: 'fore', far: true, off: 0.74, duty: 0.64 },
];
const FLEX = {   // swing keyframes (degrees): pastern/metatarsus world rotation and paw rotation
  fore: { lift: 10, liftPk: 0.42, ho: 0.70, rho: 42, kap: 0.7, st: [3, -8],
    g: [[0, null], [0.26, -92], [0.52, -58], [0.78, -2], [1, 3]], paw: [[0, null], [0.26, -128], [0.55, -70], [0.82, -6], [1, 0]] },
  hind: { lift: 6, liftPk: 0.48, ho: 0.66, rho: 36, kap: 0.55, st: [10, -14],
    g: [[0, null], [0.3, -42], [0.6, -16], [0.84, 12], [1, 10]], paw: [[0, null], [0.3, -52], [0.6, -22], [0.86, -2], [1, 0]] },
};

function makeWalk(cfg) {
  // cfg: v0 (units/s), f0 (strides/s), t1 (start slowing), t2 (stopped), end toe x per leg in the final pose
  const dt = 1 / 600, T0 = -3, T3 = cfg.dur + 1, N = Math.ceil((T3 - T0) / dt) + 1;
  const vt = t => (t < cfg.t1 ? cfg.v0 : t < cfg.t2 ? cfg.v0 * (0.5 + 0.5 * cos(PI * (t - cfg.t1) / (cfg.t2 - cfg.t1))) : 0);
  const X = new Float64Array(N), PH = new Float64Array(N);
  let x = 0, ph = 0; const tIdx = t => (t - T0) / dt;
  for (let i = 0; i < N; i++) { const t = T0 + i * dt, v = vt(t); X[i] = x; PH[i] = ph; x -= v * dt; ph += cfg.f0 * (cfg.fMin + (1 - cfg.fMin) * v / cfg.v0) * dt; }
  const xEnd = X[Math.round(tIdx(cfg.t2 + 0.2))]; for (let i = 0; i < N; i++) X[i] -= xEnd;  // X(stop) = 0
  const samp = (A, t) => { const f = clamp(tIdx(t), 0, N - 1), i = Math.floor(f), u = f - i; return i + 1 < N ? A[i] * (1 - u) + A[i + 1] * u : A[i]; };
  const tAt = target => { let lo = 0, hi = N - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (PH[m] < target) lo = m; else hi = m; } const u = (target - PH[lo]) / (PH[hi] - PH[lo] || 1); return T0 + (lo + u) * dt; };
  const Xt = t => samp(X, t), PHt = t => samp(PH, t), V = vt;

  const plans = LEGS.map(L => {
    const toe0 = L.kind === 'fore' ? R.Tf : R.Th, g = toe0[1] + (L.far ? FAR[1] : 0);
    const neutral = (L.kind === 'fore' ? cfg.neutral.fore : cfg.neutral.hind) + (L.far ? FAR[0] : 0);
    const endX = cfg.end[L.id];
    const nt = t => lerp(neutral, endX, ss(cfg.t1, cfg.t2 + 0.15, t));
    const steps = [];
    let n = Math.ceil(PH[0] - L.off) + 1, last = null;
    for (; ; n++) {
      const td = tAt(L.off + n), lo = tAt(L.off + n + L.duty); if (td > T3 - 0.5) break;
      const target = Xt(td) + nt(td) - 0.5 * (Xt(td) - Xt(lo));
      if (last && abs(target - last.x) < cfg.eps) break;
      if (last) last.lo = tAt(L.off + n - 1 + L.duty);
      last = { x: target, td, lo: Infinity }; steps.push(last);
    }
    // land the final step exactly on the logo pose
    const fin = steps[steps.length - 1];
    if (abs(fin.x - endX) > 0.01) {
      if (abs(fin.x - endX) < cfg.eps * 2.5 || fin.td > cfg.t2) fin.x = endX;
      else { const lo = Math.max(tAt(L.off + n - 1 + L.duty), fin.td + 0.25); fin.lo = lo; steps.push({ x: endX, td: lo + 0.5 / cfg.f0 * (1 - L.duty) * 1.4, lo: Infinity }); }
    }
    return { L, g, steps };
  });
  return { cfg, Xt, PHt, V, plans, T0, T3 };
}

// foot state for one leg at time t -> {F (fetlock), U (carpus/hock target), T (toe), gam, pawRot}
function footAt(W, P, t) {
  const L = P.L, fx = FLEX[L.kind], rest = L.kind === 'fore' ? { T: R.Tf, F: R.Ff, U: R.C } : { T: R.Th, F: R.Fh, U: R.J };
  const vPaw = sub(rest.F, rest.T), vUp = sub(rest.U, rest.F);
  const st = P.steps; let i = 0; while (i + 1 < st.length && st[i + 1].td <= t) i++;
  const s0 = st[i];
  const stanceState = (step, tt) => {
    const u = isFinite(step.lo) ? clamp((tt - step.td) / (step.lo - step.td)) : 0;
    const rho = fx.rho * D2R * Math.pow(ss(fx.ho, 1, u), 1.15);
    const T = [step.x, P.g], F = add(T, rot(vPaw, -rho));
    const settle = isFinite(step.lo) ? 1 : 1 - ss(step.td, step.td + 0.6, tt);   // the last step settles into the logo stance
    const gam = lerp(fx.st[0], fx.st[1], ss(0, fx.ho, u)) * D2R * settle - rho * fx.kap;
    return { T, F, gam, pawRot: -rho };
  };
  if (t < s0.lo || i + 1 >= st.length) return finish(stanceState(s0, t));
  // swing from s0 to s1
  const s1 = st[i + 1], a = stanceState(s0, s0.lo), s = clamp((t - s0.lo) / (s1.td - s0.lo));
  const Ftd = add([s1.x, P.g], vPaw);
  const ex = s5(lerp(s, s * s * (3 - 2 * s), 0.35));
  const lift = Math.pow(sin(PI * Math.pow(s, Math.log(0.5) / Math.log(fx.liftPk))), 1.4) * fx.lift * clamp(abs(s1.x - s0.x) / 30, 0.35, 1);
  const F = [lerp(a.F[0], Ftd[0], ex), lerp(a.F[1], Ftd[1], s5(s)) - lift];
  const g = fx.g.map(k => [k[0], k[1] === null ? a.gam / D2R : k[1]]), pw = fx.paw.map(k => [k[0], k[1] === null ? a.pawRot / D2R : k[1]]);
  const amp = clamp(abs(s1.x - s0.x) / 40, 0.3, 1);                 // short adjusting steps flex less
  const gam = lerp(lerp(a.gam, fx.g[fx.g.length - 1][1] * D2R, s), curve(g, s) * D2R, amp);
  const pawRot = lerp(lerp(a.pawRot, 0, s), curve(pw, s) * D2R, amp);
  return finish({ F, gam, pawRot });
  function finish(o) { o.U = add(o.F, rot(vUp, o.gam)); o.T = add(o.F, rot(sub(rest.T, rest.F), o.pawRot)); return o; }
}

// ---------------------------------------------------------------- pose
// extra: {neck, head, tail, ear} offsets in degrees, plus body bob/pitch; filled by the scene
function pose(W, t, extra) {
  const mats = new Array(BNAMES.length), info = { reach: {} };
  const X = W.Xt(t), act = clamp(W.V(t) / W.cfg.v0), ph = W.PHt(t);
  const bobT = -1.1 * act * cos(TAU * 2 * (ph - (0.24 + 0.32))), bobP = -0.9 * act * cos(TAU * 2 * (ph - (0.0 + 0.31)));
  const pitch = atan2(bobP - bobT, R.Pp[0] - R.Pt[0]) + (extra.pitch || 0) * D2R;
  const dy = extra.dy || 0;
  mats[BI.thorax] = M(R.Pt, [R.Pt[0] + X, R.Pt[1] + bobT + dy], pitch);
  mats[BI.pelvis] = M(R.Pp, [R.Pp[0] + X, R.Pp[1] + bobP + dy], pitch + (extra.pelvis || 0) * D2R);
  const mt = mats[BI.thorax], mp = mats[BI.pelvis];
  const neckA = pitch + (extra.neck || 0) * D2R, headA = neckA + (extra.head || 0) * D2R;
  const B = ap(mt, R.B); mats[BI.neck] = M(R.B, B, neckA);
  const A = ap(mats[BI.neck], R.A); mats[BI.head] = M(R.A, A, headA);
  mats[BI.ear] = M(R.Pe, ap(mats[BI.head], R.Pe), headA + (extra.ear || 0) * D2R);
  mats[BI.tail] = M(R.Tr, ap(mp, R.Tr), pitch + (extra.tail || 0) * D2R);
  for (const P of W.plans) {
    const L = P.L, f = L.far ? '_f' : '', o = L.far ? FAR : [0, 0], ft = footAt(W, P, t);
    if (L.kind === 'fore') {
      const Q = add(R.Q, o), S0 = add(R.S, o), U0 = add(R.C, o);
      // scapula follows the limb: rotate the shoulder joint about the scapula top
      const dAng = ang(sub(ft.U, ap(mt, Q))) - (ang(sub(U0, Q)) + pitch);
      const S = ap(mt, add(Q, rot(sub(S0, Q), clamp(0.42 * dAng, -0.32, 0.32))));
      const k = ik(S, ft.U, LEN.hum, LEN.rad, SIDE.fore); info.reach[L.id] = k.reach;
      mats[BI['hum' + f]] = boneM('hum' + f, S, k.j); mats[BI['rad' + f]] = boneM('rad' + f, k.j, k.end);
      mats[BI['metF' + f]] = boneM('metF' + f, k.end, ft.F); mats[BI['pawF' + f]] = boneM('pawF' + f, ft.F, ft.T);
    } else {
      const Hh = ap(mp, add(R.H, o)), k = ik(Hh, ft.U, LEN.fem, LEN.tib, SIDE.hind); info.reach[L.id] = k.reach;
      mats[BI['fem' + f]] = boneM('fem' + f, Hh, k.j); mats[BI['tib' + f]] = boneM('tib' + f, k.j, k.end);
      mats[BI['metH' + f]] = boneM('metH' + f, k.end, ft.F); mats[BI['pawH' + f]] = boneM('pawH' + f, ft.F, ft.T);
    }
  }
  return { mats, X, info, act, ph };
}

// joints for debug overlays
function joints(mats) {
  const J = {};
  for (const n of BNAMES) J[n] = [ap(mats[BI[n]], BONES[n][0]), ap(mats[BI[n]], BONES[n][1])];
  return J;
}

const api = { R, FAR, BONES, BNAMES, BI, SKIN, LOGO, makeWalk, pose, skinD, joints, footAt, curve, ss, s5, clamp, lerp, D2R };
root.DOGRIG = api; if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
