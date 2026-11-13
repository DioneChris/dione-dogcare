// 04 픽업 — the Dione van on its way, passengers at the window. Seamless 7 s loop.
const SCENE = { render(t, f) {
  const G = 1040, S = 0.8, V = 2400 * 3 / DUR, sx = t * V;       // scenery moves right (van drives left)
  let far = '', mid = '', road = '';
  const cols = ['#c4caa4', '#b3ba8c', '#dcc893', '#c4caa4', '#aab187', '#d5d9bd'];
  for (let k = -1; k <= 1; k++) for (let i = 0; i < 6; i++) { const x = ((sx * 0.25) % 1200) + i * 200 + rnd(i, 1) * 50 + k * 1200 - 100; if (x < -220 || x > W + 220) continue; far += tree(x, G - 120, 300 + rnd(i, 2) * 120, 96 + rnd(i, 3) * 26, cols[i]); }
  // brick shopfronts with arches (parallax 0.5, period 1200)
  for (let k = -1; k <= 1; k++) { const ox = ((sx * 0.5) % 1200) + k * 1200;
    for (const [bx, bw, bh, c] of [[40, 300, 300, C.brick], [420, 240, 220, '#e3d9c3'], [760, 330, 360, '#c98a6c']]) { const x = ox + bx; if (x > W + 60 || x + bw < -60) continue;
      mid += `<rect x="${n(x)}" y="${G - 100 - bh}" width="${bw}" height="${bh + 20}" fill="${c}"/>`;
      for (let a = 0; a < Math.floor(bw / 90); a++) { const ax = x + 28 + a * 90; mid += `<path d="M${n(ax)},${G - 90}V${G - 190}a27,27 0 0 1 54,0V${G - 90}Z" fill="${c === '#e3d9c3' ? C.olive : C.dark}" opacity=".8"/>`; for (let r = 0; r < Math.floor((bh - 150) / 70); r++) mid += `<rect x="${n(ax + 6)}" y="${G - 300 - r * 70}" width="42" height="44" fill="${C.cream}" opacity=".8"/>`; }
    } }
  // hedge (parallax 1)
  for (let k = -1; k <= 1; k++) { const ox = (sx % 2400) + k * 2400; for (let i = 0; i < 16; i++) { const x = ox + i * 150 + 40; if (x < -160 || x > W + 160) continue; mid += circ(x, G - 84, 58 + rnd(i, 5) * 14, '#9da57a') + circ(x + 74, G - 70, 48 + rnd(i, 6) * 10, '#8d966a'); } }
  road += `<rect x="-40" y="${G - 46}" width="${W + 80}" height="${H}" fill="#75776a"/><rect x="-40" y="${G - 54}" width="${W + 80}" height="14" fill="#d8d0bc"/>`;
  for (let i = -2; i < 6; i++) { const x = i * 300 + (sx % 300); road += `<rect x="${n(x)}" y="${G + 96}" width="150" height="12" rx="6" fill="${C.cream}"/>`; }
  // van
  const bob = 3 * sin(TAU * t * 12 / DUR) + 1.5 * sin(TAU * t * 5 / DUR + 1), tilt = 0.25 * sin(TAU * t * 5 / DUR);
  const vx = (W - 1280 * S) / 2 + 8, vy = G - 471 * S, ang = -TAU * 22 * t / DUR;
  const flap = t * 6, e1 = -52 + 12 * sin(TAU * flap), e2 = -46 + 14 * sin(TAU * flap + 1.3);
  const d1 = dog('pointer', { x: 724, y: 379, s: 0.9, flip: true, gait: 'stand', bust: true, t, ear: e1, nod: 4 * sin(TAU * t * 2 / DUR), tongue: true, collar: C.goldL });
  const d2 = dog('pom', { x: 760, y: 286, s: 1.05, flip: true, gait: 'stand', bust: true, t: t + 1, ear: 0, nod: 5 * sin(TAU * t * 4 / DUR + 1), tongue: true, bandana: C.cream });
  const drv = `<g transform="translate(474,486) scale(-0.5,0.5)">${walker({ x: 0, y: 0, s: 1, p: 0.25, t, id: 'v' }).svg}</g>`;
  let van = `<g transform="translate(${n(vx)},${n(vy + bob)}) scale(${S}) rotate(${n(tilt)} 640 400)">${ASSETS.VAN}` +
    `<clipPath id="wf"><path d="M300,246L352,150C362,130 380,120 400,118L520,118V246Z"/></clipPath><clipPath id="ws"><rect x="536" y="118" width="224" height="128" rx="6"/></clipPath>` +
    `<path d="M300,246L352,150C362,130 380,120 400,118L520,118V246Z" fill="#3a3d2c"/><g clip-path="url(#wf)">${drv}</g><path d="M312,236L356,154C364,138 380,128 398,126L440,126L372,236Z" fill="#fff" opacity=".12"/>` +
    `<rect x="536" y="118" width="224" height="128" rx="6" fill="#3a3d2c"/><g clip-path="url(#ws)">${d2.svg}${d1.svg}</g></g>`;
  const wheels = `<g transform="translate(${n(vx)},${n(vy)}) scale(${S})"><path d="M232,406A78,78 0 0 1 388,406Z" fill="#14150f" transform="translate(0,${n(bob / S)})"/><path d="M872,406A78,78 0 0 1 1028,406Z" fill="#14150f" transform="translate(0,${n(bob / S)})"/>${wheelSvg(310, 405, ang)}${wheelSvg(950, 405, ang)}</g>`;
  // speed lines + a few leaves swept past
  let fx = '';
  for (let i = 0; i < 5; i++) { const u = frac(t * 2 / DUR + rnd(i, 3)), x = 900 + u * 420, y = 640 + rnd(i, 4) * 300; fx += `<path d="M${n(x)},${n(y)}h${n(60 + 80 * rnd(i, 5))}" stroke="${C.cream}" stroke-width="5" stroke-linecap="round" opacity="${n(0.7 * sin(PI * u))}"/>`; }
  for (let i = 0; i < 6; i++) { const u = frac(t * 2 / DUR + rnd(i, 9)), x = -60 + u * 1250, y = 300 + rnd(i, 10) * 520 + 40 * sin(TAU * (u * 2 + rnd(i, 11))); fx += leafShape(x, y, 24, 720 * u + 360 * rnd(i, 12), i % 2 ? '#dcc893' : C.oliveP); }
  const gdef = ASSETS.GOLDGRAD + ASSETS.PAT_OGEE;
  const over = `<g transform="translate(${n(vx)},${n(vy + bob)}) scale(${S}) rotate(${n(tilt)} 640 400)">${ASSETS.VAN_OVER}</g>`;
  return defs(f, gdef) + `<rect width="${W}" height="${H}" fill="${C.paper}"/>` + rough(far + mid + road, 'still') + shadow(W / 2 + 8, G + 6, 440, 16, 0.25) + rough(van + wheels) + over + rough(fx) + footer(C.cream, 1300) + grain();
} };
