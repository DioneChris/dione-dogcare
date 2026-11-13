// 07 로고 — the pointer walks in and settles into the mark. One-shot 7 s (intro / outro).
const SCENE = { render(t, f) {
  const LH = 230, LS = LH / 395, LW = 1291 * LS, LX = (W - LW) / 2, LY = 596, GY = LY + 357 * LS;
  const stop = 3.0, xs = LX + 196 * LS + 6, x0 = 1290;
  // decelerating approach: v(u) falls to zero at the stop
  const u = clamp(t / stop), pos = 1 - Math.pow(1 - u, 1.7), x = lerp(x0, xs, pos), vel = Math.pow(1 - u, 0.7), sc = 0.8;
  const cyc = 6.2 * (1 - Math.pow(1 - u, 1.7));
  const d = dog('pointerOlive', { x, y: GY + 2, s: sc, flip: true, gait: 'walk', p: cyc, stride: 190 * vel, liftK: clamp(vel * 1.4), t, wag: t > stop ? 1.8 : 1, seed: 0.4 });
  const xf = ease((t - 3.25) / 0.45), pop = 1 + 0.07 * sin(PI * clamp((t - 3.25) / 0.6));
  let s = `<g opacity="${n((1 - xf) * 100) / 100}">${shadow(x - 4, GY + 6, 120 * (1 - xf * 0.2), 12, 0.14)}${rough(d.svg)}</g>`;
  s += `<g opacity="${n(xf * 100) / 100}" transform="translate(${n(LX + 191.5 * LS)},${n(GY)}) scale(${n(pop * 1000) / 1000}) translate(${n(-(LX + 191.5 * LS))},${n(-GY)})"><path fill="${C.olive}" transform="translate(${n(LX)},${LY}) scale(${LS})" d="${ASSETS.DOG_D}"/></g>`;
  // wordmark wipe
  const w1 = ease((t - 3.6) / 1.1), w2 = ease((t - 4.55) / 0.7);
  s += `<clipPath id="wipe"><rect x="${n(LX + 420 * LS)}" y="${LY - 20}" width="${n((LW - 420 * LS + 20) * w1)}" height="${LH + 40}"/></clipPath>`;
  s += `<g clip-path="url(#wipe)"><path fill="${C.olive}" transform="translate(${n(LX)},${LY}) scale(${LS})" d="${ASSETS.LOGO_DIONE_D}"/></g>`;
  s += `<path fill="${C.olive}" opacity="${n(w2 * 100) / 100}" transform="translate(${n(LX)},${n(LY + 10 * (1 - w2))}) scale(${LS})" d="${ASSETS.LOGO_SUB_D}"/>`;
  // gold rule + services
  const w3 = ease((t - 5.1) / 0.8), w4 = ease((t - 5.5) / 0.8);
  s += `<rect x="${n(W / 2 - 190 * w3)}" y="${LY + LH + 54}" width="${n(380 * w3)}" height="2.5" fill="${C.gold}"/>`;
  s += label('CARE  ·  SALON  ·  TRAINING', LY + LH + 112, C.olive, 27, w4 * 0.9, 0.28);
  [[W / 2 - 230, LY + LH + 55, 9], [W / 2 + 230, LY + LH + 55, 9]].forEach(([sx2, sy2, r]) => { s += star(sx2, sy2, r * w3, C.gold, w3); });
  // a few leaves settling as the dog arrives
  let lv = '';
  for (let i = 0; i < 6; i++) { const uu = clamp((t - 0.2 - i * 0.25) / 5.5), xx = 120 + rnd(i, 3) * 860 + 50 * sin(TAU * (uu * 1.5 + rnd(i, 4))), yy = -40 + uu * 1560; lv += leafShape(xx, yy, 24, 500 * uu + 360 * rnd(i, 5), i % 2 ? C.oliveP : C.goldL); }
  return defs(f) + `<rect width="${W}" height="${H}" fill="${C.paper}"/>` + rough(lv) + s + grain();
} };
