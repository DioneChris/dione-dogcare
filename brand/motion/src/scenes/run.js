// 02 뛰어놀기 — dogs racing across the lawn after a ball. Seamless 7 s loop.
const SCENE = { render(t, f) {
  const HZ = 430, lawn = '#a9b184';
  let bg = '';
  // trees + hedge on the horizon
  const cols = ['#b9c097', C.oliveL, '#dcc893', '#8d966a', '#c4caa4', C.oliveL, '#b9c097'];
  for (let i = 0; i < 7; i++) bg += tree(40 + i * 170 + rnd(i, 1) * 40, HZ + 10, 150 + rnd(i, 2) * 90, 70 + rnd(i, 3) * 24, cols[i]);
  bg += `<rect x="-40" y="${HZ}" width="${W + 80}" height="${H}" fill="${lawn}"/>`;
  for (let i = 0; i < 9; i++) bg += circ(i * 140 + 20, HZ - 4, 46 + rnd(i, 4) * 14, '#8d966a');
  // bunting
  let bunt = '', rope = [];
  for (let i = 0; i < 13; i++) { const u = (i + 0.5) / 13, x = u * 1100 - 10, y = 150 + 70 * sin(PI * frac(u * 2)) * (u < 0.5 ? 1 : 0.7) + 4 * sin(TAU * (t / 3.5 + u)), sw = 7 * sin(TAU * (t / 3.5 + u * 2)), c = [C.olive, C.goldL, C.cream, C.brick][i % 4];
    rope.push([x, y]); bunt += `<path transform="translate(${n(x)},${n(y)}) rotate(${n(sw)})" d="M-22,0H22L0,50Z" fill="${c}" stroke="${c}" stroke-width="4" stroke-linejoin="round"/>`; }
  bunt = `<path d="M-40,140L${rope.map(p => n(p[0]) + ',' + n(p[1])).join('L')}L1120,140" fill="none" stroke="${C.dark}" stroke-width="3" stroke-linejoin="round"/>` + bunt;
  // grass tufts + daisies (static)
  let tuft = '';
  for (let i = 0; i < 70; i++) { const x = rnd(i, 20) * W, y = HZ + 60 + rnd(i, 21) * (1230 - HZ - 60), k = 0.6 + (y - HZ) / 900;
    tuft += i % 5 === 0 ? circ(x, y, 5 * k, C.cream) + circ(x, y, 2 * k, C.goldL) : `<path d="M${n(x)},${n(y)}l${n(-6 * k)},${n(-16 * k)}M${n(x)},${n(y)}l${n(2 * k)},${n(-20 * k)}M${n(x)},${n(y)}l${n(9 * k)},${n(-14 * k)}" stroke="#8d966a" stroke-width="${n(3 * k)}" stroke-linecap="round"/>`; }
  // runners: [breed, row y, scale, laps, phase offset, cycles, opts]
  const WW = W + 640;
  const R = [
    ['shiba', 560, 0.62, 2, 0.05, 20, { collar: C.cream }],
    ['dachshund', 600, 0.66, 2, 0.55, 30, { collar: C.goldL }],
    ['dalmatian', 740, 0.8, 3, 0.3, 15, { collar: C.brick, tongue: true }],
    ['corgi', 790, 0.86, 2, 0.8, 26, { bandana: C.olive }],
    ['golden', 930, 0.98, 3, 0.72, 15, { bandana: C.cream, tongue: true }],
    ['pom', 985, 1.02, 2, 0.28, 28, { collar: C.olive }],
    ['pointer', 1150, 1.2, 3, 0.02, 14, { collar: C.goldL, tongue: true }],
    ['beagle', 1195, 1.2, 2, 0.5, 21, { bandana: C.brick }],
  ];
  let ch = '';
  // ball: bounces along ahead of the pack
  { const u = frac(t * 3 / DUR + 0.2), x = u * WW - 320 + 250, b = Math.abs(sin(PI * t * 9 / DUR)); ch += shadow(x, 1012, 22 - 8 * b, 5) + circ(x, 1000 - 150 * b, 20, C.brick) + `<path d="M${n(x - 18)},${n(1000 - 150 * b)}q18,-12 36,0" stroke="${C.cream}" stroke-width="3" fill="none"/>`; }
  for (const [nm, y, s, laps, off, cyc, o] of R) {
    const u = frac(t * laps / DUR + off), x = u * WW - 320;
    const d = dog(nm, Object.assign({ x, y, s, gait: 'run', p: t * cyc / DUR + off * 3, t, seed: off * 9 }, o));
    const air = 0.5 + 0.5 * cos(2 * TAU * (t * cyc / DUR + off * 3 - 0.4));
    ch += shadow(x, y + 4, d.len * 0.5 * (1 - 0.25 * air), 11 * s, 0.2) + d.svg;
  }
  return defs(f) + `<rect width="${W}" height="${H}" fill="${C.paper}"/>` + rough(bg + tuft, 'still') + rough(bunt + ch) + footer(C.cream, 1322) + grain();
} };
