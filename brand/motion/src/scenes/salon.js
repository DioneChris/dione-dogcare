// 06 살롱 — bath time. Seamless 7 s loop.
const SCENE = { render(t, f) {
  const FY = 1040, RIM = 826;
  let bg = `<rect x="-40" y="-40" width="${W + 80}" height="${FY + 40}" fill="${C.olive}"/><rect x="-40" y="-40" width="${W + 80}" height="${FY + 40}" fill="url(#pogeeb)"/>`;
  bg += `<rect x="-40" y="${FY}" width="${W + 80}" height="${H}" fill="#e7dfcd"/><rect x="-40" y="${FY - 6}" width="${W + 80}" height="16" fill="${C.goldL}"/>`;
  for (let i = 0; i < 9; i++) for (let j = 0; j < 3; j++) if ((i + j) % 2) bg += `<rect x="${i * 130 - 40}" y="${FY + 10 + j * 78}" width="130" height="78" fill="#d9d0ba" opacity=".7"/>`;
  // shelf with bottles + towel
  bg += `<rect x="640" y="356" width="330" height="14" rx="4" fill="${C.cream}"/><path d="M670,370v24M940,370v24" stroke="${C.goldL}" stroke-width="6"/>`;
  [[680, 96, 44, C.dark], [742, 124, 40, C.cream], [800, 84, 50, C.goldL], [870, 110, 42, C.dark]].forEach(([x, h, w, c], i) => { bg += `<rect x="${x}" y="${356 - h}" width="${w}" height="${h}" rx="7" fill="${c}"/><rect x="${x + w / 2 - 8}" y="${356 - h - 18}" width="16" height="20" rx="3" fill="${c === C.cream ? C.olive : C.cream}"/>` + (c === C.goldL ? '' : LOGODOG(x + w / 2, 356 - h / 2 + 4, w * 0.62, c === C.cream ? C.olive : C.cream)); });
  bg += `<path d="M96,300H300" stroke="${C.goldL}" stroke-width="9" stroke-linecap="round"/><rect x="128" y="300" width="140" height="250" fill="${C.cream}"/><rect x="128" y="300" width="140" height="250" fill="url(#ppetit2)"/><rect x="128" y="510" width="140" height="10" fill="${C.goldL}"/>`;
  // tub
  let tub = `<path d="M318,1034l-34,70c-4,10 10,16 18,8l48,-70ZM762,1034l34,70c4,10 -10,16 -18,8l-48,-70Z" fill="${C.gold}"/>`;
  tub += `<path d="M196,${RIM}H884C884,960 812,1052 700,1056H380C268,1052 196,960 196,${RIM}Z" fill="#f4eddd"/><path d="M228,930C262,1010 320,1050 380,1056H700C760,1050 818,1010 852,930C800,990 740,1014 690,1016H390C340,1014 280,990 228,930Z" fill="#dcd2bb"/>`;
  // faucet
  tub += `<path d="M150,${RIM + 6}V700a52,52 0 0 1 104,0v22" fill="none" stroke="${C.gold}" stroke-width="18" stroke-linecap="round"/><rect x="236" y="716" width="36" height="20" rx="6" fill="${C.gold}"/><circle cx="150" cy="760" r="16" fill="${C.goldL}"/>`;
  let drops = '';
  for (let k = 0; k < 2; k++) { const u = frac(t * 4 / DUR + k * 0.5); drops += `<path transform="translate(254,${n(744 + 70 * u * u)})" d="M0,-9C5,-2 6,3 0,7C-6,3 -5,-2 0,-9Z" fill="#dfeae2" opacity="${n(1 - u * 0.5)}"/>`; }
  // dog in the tub
  const nod = 7 * sin(TAU * t * 2 / DUR), d = dog('pointer', { x: 500, y: 1090, s: 1.75, pitch: -30, gait: 'stand', bust: true, t, nod, ear: -6 * sin(TAU * t * 2 / DUR + 0.6), tongue: true, look: -4, collar: C.goldL });
  const hd = d.world('head');
  let foamHat = circ(hd[0] - 14, hd[1] - 44, 30, C.white) + circ(hd[0] + 18, hd[1] - 50, 24, C.white) + circ(hd[0] + 2, hd[1] - 72, 22, C.white) + circ(hd[0] - 36, hd[1] - 26, 16, C.white);
  const dogIn = `<clipPath id="tubclip"><rect x="0" y="0" width="${W}" height="${RIM + 6}"/></clipPath><g clip-path="url(#tubclip)">${d.svg}</g>`;
  // foam along the rim
  let foam = '';
  for (let i = 0; i < 17; i++) { const x = 226 + i * 39 + 6 * rnd(i, 1), r = 30 + 18 * rnd(i, 2), y = RIM - 6 - 10 * rnd(i, 3) + 3.5 * sin(TAU * (t * 2 / DUR + rnd(i, 4))); foam += circ(x, y, r, i % 3 ? C.white : '#f0ebe0'); }
  for (let i = 0; i < 9; i++) { const x = 250 + i * 72 + 10 * rnd(i, 5), y = RIM - 40 - 22 * rnd(i, 6) + 4 * sin(TAU * (t * 2 / DUR + rnd(i, 7))); foam += circ(x, y, 20 + 10 * rnd(i, 8), C.white); }
  const rim = `<rect x="176" y="${RIM - 8}" width="728" height="36" rx="18" fill="#fbf6ea"/><rect x="176" y="${RIM + 14}" width="728" height="8" rx="4" fill="#e3dac4"/>`;
  // duck
  const dk = 5 * sin(TAU * t * 2 / DUR + 1), dr = 6 * sin(TAU * t * 2 / DUR + 2.2);
  const duck = `<g transform="translate(826,${n(RIM - 64 + dk)}) rotate(${n(dr)})">${ell(0, 14, 38, 26, 0, '#e2bd62')}${circ(22, -16, 20, '#e2bd62')}<path d="M38,-18l22,6l-22,8Z" fill="${C.brick}"/>${circ(27, -21, 3.2, C.ink)}<path d="M-34,10q-14,-22 6,-22" fill="#e2bd62"/></g>`;
  // bubbles
  let bub = '';
  for (let i = 0; i < 14; i++) { const u = frac(t / DUR + rnd(i, 11)), x = 200 + rnd(i, 12) * 680 + 46 * sin(TAU * (u * 2 + rnd(i, 13))), y = RIM - 60 - u * 780, r = 13 + 24 * rnd(i, 14), op = u < 0.08 ? u / 0.08 : u > 0.9 ? (1 - u) / 0.1 : 1;
    bub += `<g opacity="${n(op * 100) / 100}"><circle cx="${n(x)}" cy="${n(y)}" r="${n(r)}" fill="#ffffff" fill-opacity=".14" stroke="${C.cream}" stroke-width="3"/><path d="M${n(x - r * 0.55)},${n(y - r * 0.2)}a${n(r * 0.6)},${n(r * 0.6)} 0 0 1 ${n(r * 0.42)},${n(-r * 0.42)}" fill="none" stroke="${C.white}" stroke-width="3.5" stroke-linecap="round"/></g>`; }
  let sp = '';
  [[330, 560, 20], [820, 520, 16], [900, 700, 13], [250, 690, 12], [560, 440, 14]].forEach(([x, y, r], i) => { const tw = 0.5 + 0.5 * sin(TAU * (t * 3 / DUR + i * 0.23)); sp += star(x, y, r * (0.6 + 0.6 * tw), C.goldL, tw); });
  const pd = ASSETS.PAT_OGEE_BIG + ASSETS.PAT_PETIT.replace('id="ppetit"', 'id="ppetit2"').replace(/#f7f3ec/g, C.olive).replace(/#c9cda8/g, C.oliveL);
  return defs(f, pd) + rough(bg, 'still') + rough(tub + drops) + rough(dogIn + foamHat) + rough(rim + foam + duck) + bub + sp + footer(C.olive, 1318) + grain();
} };
