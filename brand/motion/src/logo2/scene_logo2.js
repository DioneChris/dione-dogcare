// 07 로고 (v2) — the Dione pointer walks in, stops, looks up, and the arch and wordmark form around it.
// renderAt(t) returns the SVG markup for one frame. 1080 x 1440, any frame rate.
(function (root) {
'use strict';
const G = root.DOGRIG, L = G.LOGO, { ss, s5, clamp, lerp } = G;
const { sin, cos, exp, sqrt, PI } = Math, TAU = 2 * PI;
const W = 1080, H = 1440, K = 2.5, CX = 424.28, CY = 297.3;   // logo units -> px
const CREAM = L.colors.cream, OLIVE = L.colors.olive;
const ARCH_TOP = 83.06, ARCH_BOT = 350.8;

const TL = {
  dur: 8,
  v0: 92, f0: 1.27, fMin: 0.72, t1: 1.7, t2: 3.3, eps: 2,       // walk: cruise, slow down, stop
  lift: 3.0,                                                     // head comes up to the logo pose
  lock0: 3.62, lock1: 4.15,                                      // every bone eases to the exact logo pose
  cam0: 3.45, cam1: 4.9,                                         // camera pulls back to the logo framing
  arch0: 4.2, arch1: 5.08,                                       // arch rises out of the floor line
  word0: 4.98, sub0: 5.65,                                       // wordmark, then "Dog Care"                                       // wordmark, then "Dog Care"
};
const CAM_WALK = { k: 3.4, cx: 424, cy: 268 }, CAM_LOGO = { k: 2.5, cx: CX, cy: CY };
const WALK = G.makeWalk({ dur: TL.dur, v0: TL.v0, f0: TL.f0, fMin: TL.fMin, t1: TL.t1, t2: TL.t2, eps: TL.eps,
  neutral: { fore: 389, hind: 470 }, end: { hn: 477.6, fn: 390.9, hf: 455.8, ff: 384.2 } });

// damped spring step response 0 -> 1
function spring(tau, f = 1.0, z = 0.68) { if (tau <= 0) return 0; const w = TAU * f, wd = w * sqrt(1 - z * z); return 1 - exp(-z * w * tau) * (cos(wd * tau) + (z * w / wd) * sin(wd * tau)); }

// head, neck and tail carriage (degrees) before the ear simulation
function carriage(t) {
  const lock = 1 - ss(TL.lock0, TL.lock1, t);
  const up = spring(t - TL.lift, 0.95, 0.62);                   // head lifts to look up
  const walkness = 1 - up;
  const wagAmp = (9 * (1 - ss(TL.t2 - 0.4, TL.t2 + 0.3, t)) + 11 * Math.max(0, sin(PI * clamp((t - TL.t2 + 0.1) / 1.1)))) * lock;
  const wag = wagAmp * sin(TAU * 2.3 * t + 0.6);
  return {
    neck: (-17 * walkness) * lock,
    head: (5 * walkness - 3.5 * sin(PI * clamp((t - TL.lift - 0.05) / 0.55)) * (t > TL.lift ? 1 : 0)) * lock,
    tail: (20 * (1 - spring(t - TL.lift + 0.15, 0.9, 0.6)) + wag) * lock,
    lock,
  };
}

// ear: a damped pendulum hanging from the head, pushed by the head's vertical motion and rotation
const EAR = (() => {
  const dt = 1 / 480, n = Math.ceil((TL.dur + 0.5) / dt) + 1, T0 = -1;
  const y = new Float64Array(n + 2), a = new Float64Array(n + 2), out = new Float64Array(n + 2);
  for (let i = 0; i < n + 2; i++) {
    const t = T0 + i * dt, c = carriage(t), P = G.pose(WALK, t, { neck: c.neck, head: c.head, tail: 0 });
    const m = P.mats[G.BI.head], pe = G.R.Pe; y[i] = m[1] * pe[0] + m[3] * pe[1] + m[5]; a[i] = Math.atan2(m[1], m[0]);
  }
  let th = 0, om = 0; const w = TAU * 2.4, z = 0.2;
  for (let i = 1; i < n + 1; i++) {
    const acc = (y[i + 1] - 2 * y[i] + y[i - 1]) / (dt * dt), angAcc = (a[i + 1] - 2 * a[i] + a[i - 1]) / (dt * dt);
    const al = -w * w * th - 2 * z * w * om - 0.0009 * acc - angAcc;
    om += al * dt; th += om * dt; out[i] = th;
  }
  return t => { const f = clamp((t - T0) / dt, 0, n), i = Math.floor(f), u = f - i; return (out[i] * (1 - u) + out[i + 1] * u) * 180 / PI; };
})();

function extraAt(t) {
  const c = carriage(t);
  const gravity = -0.45 * (c.neck + c.head);                     // the flap keeps hanging when the head tips
  return { neck: c.neck, head: c.head, tail: c.tail, ear: (gravity + EAR(t)) * c.lock };
}

// ---------------------------------------------------------------- drawing
const ease3 = t => (t = clamp(t), t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const out3 = t => 1 - Math.pow(1 - clamp(t), 3);
const f2 = v => (Math.round(v * 100) / 100).toString();

function dogLayers(P, t, fill, halo, art) {
  let s = '';
  const exact = t >= TL.lock1;                                  // after the lock the near dog is the artwork itself
  if (art) {                                                    // inside the arch: the logo exactly, far legs included
    s += `<path d="${L.farHindD}" fill="${fill}"/><path d="${L.farForeD}" fill="${fill}"/>`;
    s += `<path d="${exact ? L.dogD : G.skinD(G.SKIN.dog, P.mats)}" fill="${fill}"/>`;
  } else {
    s += `<path d="${G.skinD(G.SKIN.farHind, P.mats)}" fill="${fill}"/><path d="${G.skinD(G.SKIN.farFore, P.mats)}" fill="${fill}"/>`;
    s += `<path d="${exact ? L.dogD : G.skinD(G.SKIN.dog, P.mats)}" fill="${fill}" stroke="${halo}" stroke-width="2.6" stroke-linejoin="round" paint-order="stroke"/>`;
  }
  s += exact ? L.noseD.map(n => `<path d="${n}" fill="${fill}"/>`).join('') : G.SKIN.nose.map(n => `<path d="${G.skinD(n, P.mats)}" fill="${fill}"/>`).join('');
  return s;
}

function camera(t) {
  const u = ease3((t - TL.cam0) / (TL.cam1 - TL.cam0));
  return { k: Math.exp(lerp(Math.log(CAM_WALK.k), Math.log(CAM_LOGO.k), u)), cx: lerp(CAM_WALK.cx, CAM_LOGO.cx, u), cy: lerp(CAM_WALK.cy, CAM_LOGO.cy, u) };
}

function renderAt(t) {
  const P = G.pose(WALK, t, extraAt(t)), cam = camera(t);
  const archK = ease3((t - TL.arch0) / (TL.arch1 - TL.arch0));
  const archDy = (1 - archK) * (ARCH_BOT - ARCH_TOP + 2);       // the whole arch slides up out of the floor line
  const shOp = 0.14 * (1 - ss(TL.cam0, TL.arch0 + 0.2, t));
  let s = `<rect width="${W}" height="${H}" fill="${CREAM}"/>`;
  s += `<g transform="translate(${W / 2},${H / 2}) scale(${f2(cam.k * 1000) / 1000}) translate(${f2(-cam.cx)},${f2(-cam.cy)})">`;
  s += `<defs><filter id="blur" x="-50%" y="-200%" width="200%" height="500%"><feGaussianBlur stdDeviation="2.2"/></filter>`;
  s += `<clipPath id="floor"><rect x="200" y="0" width="450" height="${archK >= 1 ? ARCH_BOT + 5 : ARCH_BOT}"/></clipPath>`;   // no floor clip once the arch has landed
  s += `<clipPath id="archClip"><path d="${L.arch}" transform="translate(0,${f2(archDy)})"/></clipPath></defs>`;
  s += dogLayers(P, t, OLIVE, CREAM, false);                     // the dog in olive on cream
  // soft contact shadow, drawn over the dog: same olive, so it only shows on the floor
  if (shOp > 0.001) { const cx = 436 + P.X; s += `<ellipse cx="${f2(cx)}" cy="325.5" rx="58" ry="3.4" fill="${OLIVE}" opacity="${f2(shOp)}" filter="url(#blur)"/>`; }
  if (archK > 0) {                                               // the arch rises behind it; inside, the dog turns cream
    s += `<g clip-path="url(#floor)"><path d="${L.arch}" fill="${OLIVE}" transform="translate(0,${f2(archDy)})"/>`;
    s += `<g clip-path="url(#archClip)">${dogLayers(P, t, CREAM, OLIVE, true)}</g></g>`;
  }
  s += wordmark(t);
  s += '</g>';
  return s;
}

function wordmark(t) {
  let s = '';
  const top = L.word.filter(w => w.line === 0), sub = L.word.filter(w => w.line === 1);
  // "Dione": each letter rises out of a mask under its baseline
  s += `<clipPath id="wmask"><rect x="280" y="380" width="300" height="86.5"/></clipPath><g clip-path="url(#wmask)">`;
  top.forEach((g, i) => {
    const u = out3((t - TL.word0 - i * 0.075) / 0.75); if (u <= 0) return;
    s += `<g transform="translate(0,${f2((1 - u) * 72)})" opacity="${f2(Math.min(1, u * 1.6))}">${g.d.map(d => `<path d="${d}" fill="${OLIVE}"/>`).join('')}</g>`;
  });
  s += '</g>';
  // "Dog Care": fades in while its tracking settles
  sub.forEach((g, i) => {
    const u = out3((t - TL.sub0 - i * 0.05) / 0.7); if (u <= 0) return;
    const dx = (i - 3.5) * 2.2 * (1 - u);
    s += `<g transform="translate(${f2(dx)},${f2((1 - u) * 4)})" opacity="${f2(u)}">${g.d.map(d => `<path d="${d}" fill="${OLIVE}"/>`).join('')}</g>`;
  });
  return s;
}

root.SCENE = { renderAt, TL, W, H, WALK, extraAt, camera };
})(typeof window !== 'undefined' ? window : globalThis);
