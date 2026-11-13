// Shared frame furniture: hand-painted edge wobble ("boil" on threes), paper grain, logo footer.
const W = 1080, H = 1440, DUR = 7, FPS = 30;
function defs(f, extra = '') {
  const seed = 1 + (Math.floor(f / 3) % 5);
  return `<defs>
<filter id="rough" filterUnits="userSpaceOnUse" x="-30" y="-30" width="${W + 60}" height="${H + 60}"><feTurbulence type="fractalNoise" baseFrequency="0.028" numOctaves="2" seed="${seed}" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="7" xChannelSelector="R" yChannelSelector="G"/></filter>
<filter id="still" filterUnits="userSpaceOnUse" x="-30" y="-30" width="${W + 60}" height="${H + 60}"><feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="2" seed="11" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="9" xChannelSelector="R" yChannelSelector="G"/></filter>
<filter id="soft"><feGaussianBlur stdDeviation="14"/></filter>
<pattern id="check" width="34" height="34" patternUnits="userSpaceOnUse"><path d="M0,8H34M0,12H34M8,0V34M12,0V34" stroke="#8b9163" stroke-width="1.4" opacity=".5"/><path d="M0,25H34M25,0V34" stroke="#2a2e18" stroke-width="2" opacity=".35"/></pattern>
${extra}</defs>`;
}
const grain = (op = 0.17) => `<image href="grain.png" width="${W}" height="${H}" opacity="${op}" style="mix-blend-mode:multiply"/>`;
const rough = (inner, id = 'rough') => `<g filter="url(#${id})">${inner}</g>`;
function footer(fill, y = 1318, h = 58) { const w = h * 1291 / 395; return LOGO(W / 2 - w / 2, y, h, fill); }
function label(txt, y, fill, size = 54, op = 1, ls = 0.04) { return `<text x="${W / 2}" y="${y}" text-anchor="middle" font-family="Nephilm" font-size="${size}" letter-spacing="${ls}em" fill="${fill}" opacity="${op}">${txt}</text>`; }
// deterministic pseudo-random
function rnd(i, k = 0) { const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); }

// ---------- scenery ----------
function tree(x, gy, h, r, col, trunk = '#7a6248') {
  let s = cap(x, gy, 9, x + 3, gy - h, 6, trunk) + cap(x + 2, gy - h * 0.62, 5, x + r * 0.5, gy - h * 0.86, 3.5, trunk);
  s += circ(x + 4, gy - h - r * 0.35, r, col) + circ(x - r * 0.7, gy - h + r * 0.12, r * 0.72, col) + circ(x + r * 0.78, gy - h + r * 0.05, r * 0.7, col) + circ(x + r * 0.2, gy - h - r * 1.05, r * 0.62, shade(col, 1.08));
  return s;
}
function leafShape(x, y, len, rot, col) { return `<path transform="translate(${n(x)},${n(y)}) rotate(${n(rot)})" d="M0,0C${n(len * .28)},${n(-len * .3)} ${n(len * .28)},${n(-len * .7)} 0,${n(-len)}C${n(-len * .28)},${n(-len * .7)} ${n(-len * .28)},${n(-len * .3)} 0,0Z" fill="${col}"/>`; }

function star(x, y, r, col, op = 1) { const k = r * 0.22; return `<path transform="translate(${n(x)},${n(y)})" d="M0,${n(-r)}L${n(k)},${n(-k)}L${n(r)},0L${n(k)},${n(k)}L0,${n(r)}L${n(-k)},${n(k)}L${n(-r)},0L${n(-k)},${n(-k)}Z" fill="${col}" opacity="${n(op * 100) / 100}"/>`; }
function wheelSvg(cx, cy, ang) {
  let g = circ(cx, cy, 66, '#1b1c17') + circ(cx, cy, 43, '#c9c7bf') + `<circle cx="${cx}" cy="${cy}" r="43" fill="none" stroke="#8d8b83" stroke-width="2"/>`;
  for (let i = 0; i < 5; i++) { const a = ang + i * TAU / 5; g += `<path d="M${cx},${cy}L${n(cx + cos(a) * 40)},${n(cy + sin(a) * 40)}" stroke="#8d8b83" stroke-width="9" stroke-linecap="round"/>`; }
  return g + circ(cx, cy, 12, '#77756e');
}
// curled-up sleeping dog, facing right, floor at y
function sleeper(x, y, s, o, t) {
  const col = o.color, ec = o.ear || shade(col, 0.8), b = 1 + 0.045 * sin(TAU * (t / 3.5 + (o.ph || 0))), up = -2.2 * sin(TAU * (t / 3.5 + (o.ph || 0)));
  let g = ell(0, -8, 104, 20, 0, o.cushion || C.goldL) + ell(0, -12, 96, 15, 0, shade(o.cushion || C.goldL, 1.12));
  g += cap(-82, -30, 10, -58, -14, 8, col);
  g += ell(-8, -14 - 36 * b, 76, 38 * b, -3, col) + circ(-46, -46 + up, 39, col);
  if (o.fluff) for (let i = 0; i < 6; i++) g += circ(-70 + i * 26, -80 + up + (i % 2) * 6 + Math.abs(i - 2.5) * 5, 17, col);
  if (o.spots) for (const [sx, sy, r] of [[-50, -62, 7], [-22, -74, 6], [8, -64, 7.5], [-64, -38, 6], [-20, -44, 5], [20, -40, 6]]) g += ell(sx, sy + up, r * 1.2, r, 20, C.black);
  const tw = o.wag ? 10 * Math.max(0, sin(TAU * t * 2)) * (frac(t / 3.5) < 0.45 ? 1 : 0) : 0;
  g += cap(-58, -14, 8, -6, -9 - tw * 0.3, 6, col) + cap(-6, -9 - tw * 0.3, 6, 26, -12 - tw, 4, o.tip || col);
  g += cap(34, -13, 8.5, 86, -10, 7.5, o.paw || col);
  const hy = -38 + up * 0.6, tw2 = o.twitch ? 14 * Math.max(0, sin(TAU * t * 3)) * (frac(t / 3.5 + 0.3) < 0.2 ? 1 : 0) : 0;
  g += circ(50, hy, 26, o.head || col) + cap(60, hy + 6, 17, 88, hy + 17, 10.5, o.mask || o.muzzle || o.head || col);
  if (o.fluff) g += circ(46, hy - 20, 15, col) + circ(64, hy - 16, 12, col);
  g += circ(95, hy + 14, 5, o.mask ? '#1d1b19' : C.ink) + `<path d="M${n(54)},${n(hy)}q7,5 14,0" fill="none" stroke="${o.mask ? '#1d1b19' : C.ink}" stroke-width="2.6" stroke-linecap="round"/>`;
  g += cap(38, hy - 14, 9, 28 - tw2 * 0.4, hy + 14 - tw2, 13, ec);
  return `<g transform="translate(${n(x)},${n(y)}) scale(${s})">${g}</g>`;
}
