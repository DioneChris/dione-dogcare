// 05 굿나잇 — the hotel at night: every guest asleep under an arch. Seamless 7 s loop.
const SCENE = { render(t, f) {
  const K = 1.55, BW = 180 * K, BH = 264 * K, X0 = (W - 3 * BW) / 2, Y0 = 268, night = '#23271a';
  let bg = `<rect x="-40" y="-40" width="${W + 80}" height="${H + 80}" fill="${night}"/><rect x="-40" y="-40" width="${W + 80}" height="${H + 80}" fill="url(#pogeed)" opacity=".55"/>`;
  // moon + stars
  let sky = circ(884, 132, 46, C.goldL) + circ(866, 120, 42, night);
  const st = [[150, 96, 11], [262, 172, 7], [742, 84, 8], [972, 214, 9], [96, 206, 6], [650, 190, 6], [424, 66, 7], [1010, 76, 6]];
  st.forEach(([x, y, r], i) => { const tw = 0.55 + 0.45 * sin(TAU * (t * (i % 2 ? 2 : 3) / DUR + i * 0.21)); sky += star(x, y, r * (0.8 + 0.3 * tw), C.goldL, 0.35 + 0.65 * tw); });
  // rooms
  const guests = [
    { color: C.liver, paw: C.white, wag: 1, ph: 0 }, { color: C.white, ear: '#e9e0cc', fluff: 1, ph: 0.3, cushion: C.oliveL }, { color: C.golden, ph: 0.55, twitch: 1 },
    { color: C.fawn, mask: C.black, ear: C.black, ph: 0.15, cushion: C.oliveL }, { color: C.white, ear: C.black, spots: 1, ph: 0.7 }, { color: '#c98f5f', fluff: 1, ph: 0.45, cushion: C.oliveL },
  ];
  let glow = '', arch = '', dogs = '', zz = '';
  for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++) {
    const i = r * 3 + c, cx = X0 + (c + 0.5) * BW, fy = Y0 + r * BH + 232 * K, g = guests[i];
    const pulse = 0.5 + 0.5 * sin(TAU * (t / 3.5 + g.ph));
    glow += `<ellipse cx="${n(cx)}" cy="${n(fy - 90)}" rx="${n(105 + 8 * pulse)}" ry="${n(150 + 10 * pulse)}" fill="${C.goldL}" opacity="${n((0.13 + 0.06 * pulse) * 100) / 100}" filter="url(#soft)"/>`;
    // little hanging lamp
    arch += `<path d="M${n(cx)},${n(Y0 + r * BH + 40 * K)}v${n(34)}" stroke="#c9ad74" stroke-width="2.5"/><path d="M${n(cx - 15)},${n(Y0 + r * BH + 40 * K + 54)}a15,20 0 0 1 30,0Z" fill="${C.goldL}"/>`;
    dogs += sleeper(cx - 4, fy - 4, 1.12, g, t);
    if (i % 2 === 0) for (let k = 0; k < 3; k++) { const u = frac(t / 3.5 + g.ph + k * 0.33), zx = cx + 70 + 44 * u + 8 * sin(TAU * u * 1.5), zy = fy - 90 - 120 * u;
      zz += `<text x="${n(zx)}" y="${n(zy)}" font-family="Nephilm" font-size="${n(22 + 26 * u)}" fill="${C.cream}" opacity="${n(sin(PI * u) * 0.9 * 100) / 100}">z</text>`; }
  }
  let frame = `<clipPath id="arcclip"><rect x="${n(X0 - 16 * K)}" y="${Y0 - 4}" width="${n(3 * BW + 32 * K)}" height="${n(2 * BH + 8)}"/></clipPath><g clip-path="url(#arcclip)">`;
  for (let r = 0; r < 2; r++) for (let c = 0; c < 4; c++) frame += `<g transform="translate(${n(X0 + c * BW)},${n(Y0 + r * BH)}) scale(${K})">${ASSETS.BAY_GOLD}</g>`;
  frame += '</g>';
  const title = label('Good night', 196, C.goldL, 76, 1, 0.03);
  return defs(f, ASSETS.PAT_OGEE_DEEP) + bg + glow + rough(sky + frame + arch, 'still') + rough(dogs) + zz + title + footer(C.cream, 1312) + grain(0.12);
} };
