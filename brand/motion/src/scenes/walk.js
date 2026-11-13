// 01 산책 — a walk with two dogs. Seamless 7 s loop.
const SCENE = { render(t, f) {
  const G = 1088, V = 2400 / DUR, sx = t * V;           // ground speed px/s
  const P = 2400, PF = 1440;                              // scroll periods (near, far)
  let far = '', near = '';
  // far trees (parallax 0.6)
  const cols = [C.oliveP, '#bfc59e', '#dcc893', C.oliveP, '#c9cfa9', '#b3ba8c'];
  for (let k = -1; k <= 1; k++) for (let i = 0; i < 6; i++) {
    const x = i * 240 + 60 + rnd(i, 1) * 60 - (sx * 0.6) % PF + k * PF; if (x < -220 || x > W + 220) continue;
    far += tree(x, G - 96, 330 + rnd(i, 2) * 130, 92 + rnd(i, 3) * 30, cols[i]);
  }
  // hedge + lamp posts + sign (parallax 1)
  for (let k = -1; k <= 1; k++) {
    const ox = -(sx % P) + k * P;
    for (let i = 0; i < 16; i++) { const x = ox + i * 150 + 40; if (x < -160 || x > W + 160) continue; near += circ(x, G - 96, 62 + rnd(i, 5) * 16, '#aab187') + circ(x + 74, G - 78, 52 + rnd(i, 6) * 10, '#9da57a'); }
    for (const lx of [520, 1720]) { const x = ox + lx; if (x < -120 || x > W + 120) continue;
      near += cap(x, G - 20, 7, x, G - 430, 4.5, C.dark) + cap(x, G - 430, 4.5, x + 44, G - 452, 4, C.dark) + `<path d="M${x + 30},${G - 448}h30l-6,36h-18z" fill="${C.goldL}"/>` + cap(x - 12, G - 24, 6, x + 12, G - 24, 6, C.dark); }
    { const x = ox + 1180; if (x > -200 && x < W + 200) near += `<g transform="translate(${n(x)},${G - 150})"><path d="M-60,-64H60V26H-60Z" fill="${C.olive}" stroke="${C.olive}" stroke-width="8" stroke-linejoin="round"/><path d="M-36,26V96M36,26V96" stroke="${C.dark}" stroke-width="7" stroke-linecap="round"/>${LOGODOG(0, -20, 52, C.cream)}</g>`; }
  }
  let ground = `<rect x="-20" y="${G - 34}" width="${W + 40}" height="${H - G + 60}" fill="#e5decd"/><rect x="-20" y="${G - 40}" width="${W + 40}" height="12" fill="#d2c9b3"/>`;
  for (let i = -1; i < 9; i++) { const x = i * 200 - (sx % 200); ground += `<path d="M${n(x)},${G + 44}l-28,150" stroke="#d2c9b3" stroke-width="4" stroke-linecap="round"/>`; }
  // characters
  const wp = t * 6 / DUR, wk = walker({ x: 470, y: G + 8, s: 1.12, p: wp, t });
  const d1 = dog('pointer', { x: 806, y: G + 30, s: 1.1, gait: 'walk', p: t * 9 / DUR + 0.2, stride: V * 0.62 * (DUR / 9) / 1.1, t, collar: C.goldL, seed: 1 });
  const d2 = dog('poodle', { x: 178, y: G + 44, s: 0.95, gait: 'trot', p: t * 18 / DUR, stride: V * 0.5 * (DUR / 18) / 0.95, t, bandana: C.olive, seed: 2, tongue: true });
  const sag1 = 46 + 10 * sin(TAU * t * 9 / DUR), sag2 = 58 + 12 * sin(TAU * t * 6 / DUR + 1);
  let ch = shadow(470, G + 16, 160, 20) + shadow(815, G + 34, 165, 18) + shadow(178, G + 48, 92, 12);
  ch += d2.svg + wk.back + leash(wk.hand, d2.world('neck'), sag2) + wk.front + leash(wk.hand, d1.world('neck'), sag1) + d1.svg;
  // drifting leaves
  let lv = '';
  for (let i = 0; i < 7; i++) { const u = frac(t / DUR + rnd(i, 9)), x = 80 + rnd(i, 10) * 920 - u * 260 + 30 * sin(TAU * (u * 3 + rnd(i, 11))), y = -40 + u * (G + 20);
    lv += leafShape(x, y, 26, 360 * (u * 2 + rnd(i, 12)), i % 3 ? C.oliveP : C.goldL); }
  return defs(f) + `<rect width="${W}" height="${H}" fill="${C.paper}"/>` + rough(far + near + ground, 'still') + rough(lv + ch) + footer(C.olive) + grain();
} };
