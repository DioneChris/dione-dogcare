// 03 등원길 — dogs on their way to Dione, crossing in single file. Seamless 7 s loop.
const SCENE = { render(t, f) {
  const VX = 540, VY = 610, road = '#75776a';
  const ray = (xb, y, yb = 1440) => VX + (xb - VX) * (y - VY) / (yb - VY);
  let bg = `<rect x="-40" y="${VY - 6}" width="${W + 80}" height="${H}" fill="#a9b184"/>`;
  // Dione at the end of the street
  bg += `<g transform="translate(${VX},${VY})"><rect x="-74" y="-236" width="148" height="238" fill="${C.brick}"/>`;
  for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) bg += `<rect x="${-56 + c * 42}" y="${-216 + r * 40}" width="28" height="24" fill="${C.cream}" opacity=".85"/>`;
  bg += `<rect x="-74" y="-58" width="148" height="26" fill="${C.olive}"/>${LOGODOG(0, -45, 26, C.cream)}<rect x="-58" y="-28" width="116" height="30" fill="${C.dark}"/><rect x="-10" y="-28" width="26" height="30" fill="${C.goldL}" opacity=".7"/></g>`;
  // road, kerbs, brick walls
  bg += poly([[VX, VY], [ray(1500, 1440), 1440], [1500, 1500], [-420, 1500], [ray(-420, 1440), 1440]], road);
  bg += poly([[VX, VY], [ray(-420, 1440), 1440], [ray(-520, 1440), 1440]], '#d8d0bc') + poly([[VX, VY], [ray(1500, 1440), 1440], [ray(1600, 1440), 1440]], '#d8d0bc');
  for (const sgn of [-1, 1]) bg += poly([[VX, VY], [VX + sgn * 640, VY + 150], [VX + sgn * 640, VY + 290], [VX, VY + 3]], C.brick) + poly([[VX, VY], [VX + sgn * 640, VY + 140], [VX + sgn * 640, VY + 156]], C.brickD);
  // centre line
  for (let i = 0; i < 5; i++) { const y1 = VY + 40 + i * i * 14 + i * 30, y2 = y1 + 16 + i * 9; if (y2 > 960) break; bg += poly([[ray(536, y1, 1250), y1], [ray(544, y1, 1250), y1], [ray(548, y2, 1250), y2], [ray(532, y2, 1250), y2]], C.cream); }
  // ginkgo rows
  let trees = '';
  const gk = ['#dcbb5e', '#e3c876', '#cfa94e', '#e8d08a'];
  for (let i = 6; i >= 0; i--) { const u = 1 / (1 + i * 0.75), k = 0.25 + u * 1.0;
    for (const sgn of [-1, 1]) { const x = VX + sgn * (40 + 560 * u), y = VY + 4 + 205 * u; trees += tree(x, y, 330 * k, 120 * k, gk[(i + (sgn > 0 ? 1 : 0)) % 4], '#6f5a43'); } }
  // zebra
  let zebra = '';
  for (let i = -6; i <= 6; i++) { const xb = VX + i * 150, y1 = 1022, y2 = 1262; zebra += poly([[ray(xb - 44, y1, y2), y1], [ray(xb + 44, y1, y2), y1], [xb + 44, y2], [xb - 44, y2]], C.cream); }
  // clouds
  let sky = '';
  for (const [cx, cy, k, ph] of [[230, 210, 1, 0], [800, 330, 0.75, 0.4]]) { const dx = 14 * sin(TAU * (t / DUR + ph)); sky += `<g transform="translate(${n(cx + dx)},${cy}) scale(${k})">${cap(-90, 0, 34, 90, 0, 30, C.white)}${circ(-30, -30, 44, C.white)}${circ(30, -22, 36, C.white)}</g>`; }
  // parade
  const PP = 1700, V = PP / DUR, gy = 1178;
  const D = [
    ['maltese', 1.3, 'trot', 17, { bandana: C.brick }],
    ['corgi', 1.25, 'trot', 15, { bandana: C.olive }],
    ['schnauzer', 1.2, 'walk', 12, { collar: C.goldL }],
    ['golden', 1.15, 'walk', 7, { hat: C.olive, bandana: C.cream, tongue: true }],
    ['pointer', 1.15, 'walk', 7, { collar: C.goldL }],
  ];
  let ch = '';
  D.forEach(([nm, s, gait, cyc, o], i) => {
    const x = frac(t / DUR + i / D.length) * PP - 310, duty = gait === 'walk' ? 0.62 : 0.5;
    const d = dog(nm, Object.assign({ x, y: gy, s, gait, p: t * cyc / DUR + i * 0.37, stride: V * duty * (DUR / cyc) / s, t, seed: i * 2.1 }, o));
    ch += shadow(x + 10, gy + 6, d.len * 0.47, 12 * s, 0.22) + d.svg;
  });
  let lv = '';
  for (let i = 0; i < 9; i++) { const u = frac(t / DUR + rnd(i, 9)), x = 60 + rnd(i, 10) * 960 + 40 * sin(TAU * (u * 2 + rnd(i, 11))), y = -40 + u * 1100;
    lv += leafShape(x, y, 24, 360 * (u * 2 + rnd(i, 12)), gk[i % 4]); }
  return defs(f) + `<rect width="${W}" height="${H}" fill="#e9efe6"/>` + rough(sky + bg + trees + zebra, 'still') + rough(lv + ch) + footer(C.cream, 1326) + grain();
} };
