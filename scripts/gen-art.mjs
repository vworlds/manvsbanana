// Generates every SVG asset in public/assets. Run with `npm run art`.
// Style: flat colours, thick black outlines, round stick-figure heads.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'assets');
mkdirSync(OUT, { recursive: true });

const INK = '#141414';
const SKIN = '#F9C99A';
const SKIN_SHADE = '#EDAF80';
const HAIR_MAN = '#5A3E30';
const W = 7; // outline width on a 200px head

let seed = 7;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

const svg = (w, h, body, extra = '') =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" ${extra}>${body}</svg>`;
const save = (name, content) => writeFileSync(join(OUT, `${name}.svg`), content);

const polar = (cx, cy, r, deg) => {
  const a = (deg * Math.PI) / 180;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
};
const arcPath = (cx, cy, r, a1, a2) => {
  const [x1, y1] = polar(cx, cy, r, a1);
  const [x2, y2] = polar(cx, cy, r, a2);
  const large = Math.abs(a2 - a1) > 180 ? 1 : 0;
  const sweep = a2 > a1 ? 1 : 0;
  return `M${x1.toFixed(1)} ${y1.toFixed(1)} A${r} ${r} 0 ${large} ${sweep} ${x2.toFixed(1)} ${y2.toFixed(1)}`;
};

// ---------------------------------------------------------------- heads
// All face layers share one 200x200 frame so they stack exactly.
const shadeOf = (fill) => (fill === SKIN ? SKIN_SHADE : fill === '#F2CDA8' ? '#E3B48A' : fill === '#F9B6CF' ? '#EE9CBA' : fill);
// flat skin with a darker crescent along the bottom (the short's cel shading)
const headCircle = (fill = SKIN) => `<defs><clipPath id="hs"><circle cx="100" cy="100" r="90"/></clipPath></defs>
  <circle cx="100" cy="100" r="90" fill="${shadeOf(fill)}"/><circle cx="100" cy="86" r="88" fill="${fill}" clip-path="url(#hs)"/>`;
const headOutline = `<circle cx="100" cy="100" r="90" fill="none" stroke="${INK}" stroke-width="${W}"/>`;
const clip = `<defs><clipPath id="hc"><circle cx="100" cy="100" r="90"/></clipPath></defs>`;

// The man (from man.png): bald top, short dark hair on the sides, a few
// sad strands on top, forehead shine.
const sideHair = `M26 44 A90 90 0 0 0 10.5 106 L31 104 Q27 88 34 74 Q38 64 52 52 Q40 56 36 60 Q42 46 56 38 Q40 40 26 44 Z`;
const manHair = `
  <g clip-path="url(#hc)" fill="${HAIR_MAN}" stroke="${INK}" stroke-width="4" stroke-linejoin="round">
    <path d="${sideHair}"/>
    <path d="${sideHair}" transform="translate(200,0) scale(-1,1)"/>
  </g>
  <g fill="none" stroke-linecap="round">
    <path d="M78 22 Q96 10 116 20" stroke="${INK}" stroke-width="5.5"/><path d="M78 22 Q96 10 116 20" stroke="${HAIR_MAN}" stroke-width="2.5"/>
    <path d="M90 28 Q104 18 120 26" stroke="${INK}" stroke-width="5"/><path d="M90 28 Q104 18 120 26" stroke="${HAIR_MAN}" stroke-width="2"/>
  </g>
  <ellipse cx="78" cy="42" rx="22" ry="11" fill="#fff" opacity="0.35" transform="rotate(-20 78 42)"/>`;
save('man_head', svg(200, 200, clip + headCircle() + manHair + headOutline));
save('man_hair', svg(200, 200, clip + manHair));

const glasses = `
  <g fill="none" stroke="#5E5F66" stroke-width="3" stroke-linejoin="round">
    <rect x="57" y="83" width="42" height="30" rx="9" fill="#dff3ff" fill-opacity="0.12"/>
    <rect x="101" y="83" width="42" height="30" rx="9" fill="#dff3ff" fill-opacity="0.12"/>
    <path d="M57 93 L16 90"/><path d="M143 93 L184 90"/>
  </g>
  <path d="M63 88 l8 -3" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity="0.8"/>
  <path d="M107 88 l8 -3" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity="0.8"/>`;
save('glasses', svg(200, 200, glasses));

let stubble = '';
seed = 42;
for (let i = 0; i < 140; i++) {
  const x = 30 + rnd() * 140;
  const y = 118 + rnd() * 70;
  const d = Math.hypot(x - 100, y - 100);
  if (d > 84) continue;
  if (Math.abs(x - 100) < 15 && Math.abs(y - 141) < 6) continue; // keep the mouth clean
  stubble += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="1.3"/>`;
}
save('stubble', svg(200, 200, `<g fill="#6A5244" opacity="0.38">${stubble}</g>`));

// Kid: yellow bowl cut.
const kidHair = `
  <path d="M8 112 C4 40 50 4 100 4 C150 4 196 40 192 112 L172 112 C170 92 168 84 164 80 L36 80 C32 84 30 92 28 112 Z"
        fill="${HAIR_MAN}" stroke="${INK}" stroke-width="${W}" stroke-linejoin="round"/>
  <path d="M60 80 l6 -14 M100 80 l3 -16 M140 80 l-5 -14" stroke="#6E5243" stroke-width="3" stroke-linecap="round"/>`;
save('kid_head', svg(200, 200, headCircle() + headOutline + kidHair));
save('kid_hair', svg(200, 200, kidHair));
save('head_plain', svg(200, 200, headCircle() + headOutline));

// Wife: big brown hair with scalloped bangs, ponytail.
const wifeBack = `<path d="M10 120 C-6 40 40 -6 104 -2 C170 2 214 50 196 140 C192 170 200 196 186 212 L14 212 C2 190 14 160 10 120 Z" fill="#5A3826" stroke="${INK}" stroke-width="${W}"/>
  <path d="M182 30 C214 10 236 40 220 70" fill="#5A3826" stroke="${INK}" stroke-width="${W}"/>`;
const wifeBangs = `<path d="M14 92 C10 30 60 6 104 6 C154 6 194 36 188 92 C178 74 166 80 160 90 C152 72 136 74 128 86 C120 70 104 70 96 84 C88 70 72 70 64 86 C56 72 40 72 34 90 C28 80 20 82 14 92 Z" fill="#5A3826" stroke="${INK}" stroke-width="${W}" stroke-linejoin="round"/>`;
save('wife_head', svg(240, 220, `<g transform="translate(0,4)">${wifeBack}${headCircle()}${headOutline}${wifeBangs}</g>`));

// ---------------------------------------------------------------- eyes & mouths
const dot = (x, y, r = 10.5) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${INK}"/>`;
const brow = (x1, y1, x2, y2) => `<path d="M${x1} ${y1} L${x2} ${y2}" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>`;
const EYES = {
  neutral: dot(78, 98) + dot(122, 98),
  worried: dot(78, 100) + dot(122, 100) + brow(62, 80, 90, 72) + brow(110, 72, 138, 80),
  angry: dot(80, 100) + dot(120, 100) + brow(62, 74, 92, 86) + brow(108, 86, 138, 74),
  wide: dot(78, 98, 12) + dot(122, 98, 12) + `<circle cx="74" cy="94" r="3" fill="#fff"/><circle cx="118" cy="94" r="3" fill="#fff"/>` + brow(64, 70, 90, 66) + brow(110, 66, 136, 70),
  crying: `<path d="M64 96 q14 10 28 0 M108 96 q14 10 28 0" stroke="${INK}" stroke-width="6" fill="none" stroke-linecap="round"/>` +
    brow(62, 82, 90, 74) + brow(110, 74, 138, 82) +
    `<path d="M70 104 q-6 16 0 22 q6 -6 0 -22 Z M130 104 q-6 16 0 22 q6 -6 0 -22 Z" fill="#4FB3F0" stroke="${INK}" stroke-width="2"/>`,
  smug: `<path d="M68 98 a10 10 0 0 0 20 0 Z M112 98 a10 10 0 0 0 20 0 Z" fill="${INK}"/>` +
    `<path d="M64 97 L92 97 M108 97 L136 97" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>`,
  disdain: `<path d="M66 100 a10 10 0 0 0 20 0 Z M110 100 a10 10 0 0 0 20 0 Z" fill="${INK}" transform="translate(-3,3)"/>` +
    `<path d="M62 99 L92 99 M106 99 L136 99" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>` +
    `<path d="M62 80 Q76 70 92 78" stroke="${INK}" stroke-width="6" fill="none" stroke-linecap="round"/>` +
    `<path d="M108 66 Q124 54 140 66" stroke="${INK}" stroke-width="6" fill="none" stroke-linecap="round"/>`,
  shut: `<path d="M64 98 l12 -8 l12 8 M112 98 l12 -8 l12 8" stroke="${INK}" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
};
for (const [k, v] of Object.entries(EYES)) save(`eyes_${k}`, svg(200, 200, v));

const MOUTHS = {
  flat: `<path d="M86 142 L114 142" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>`,
  frown: `<path d="M84 150 Q100 134 116 150" stroke="${INK}" stroke-width="6" fill="none" stroke-linecap="round"/>`,
  smile: `<path d="M82 136 Q100 154 118 136" stroke="${INK}" stroke-width="6" fill="none" stroke-linecap="round"/>`,
  smirk: `<path d="M84 144 Q104 146 118 132" stroke="${INK}" stroke-width="6" fill="none" stroke-linecap="round"/>`,
  open: `<path d="M78 128 Q100 120 122 128 Q126 166 100 172 Q74 166 78 128 Z" fill="${INK}"/>
         <path d="M86 160 Q100 150 114 160 Q108 170 100 170 Q92 170 86 160 Z" fill="#D9475A"/>
         <path d="M84 128 L116 128 L114 136 L86 136 Z" fill="#fff"/>`,
  grit: `<rect x="76" y="132" width="48" height="20" rx="5" fill="#fff" stroke="${INK}" stroke-width="5"/>
         <path d="M76 142 L124 142 M88 132 L88 152 M100 132 L100 152 M112 132 L112 152" stroke="${INK}" stroke-width="2.5"/>`,
  chew: `<path d="M84 140 Q92 148 100 140 Q108 148 116 140" stroke="${INK}" stroke-width="6" fill="none" stroke-linecap="round"/><circle cx="122" cy="132" r="6" fill="#E8A87C" opacity="0.7"/>`,
  o: `<ellipse cx="100" cy="146" rx="9" ry="12" fill="${INK}"/>`,
  wail: `<path d="M74 150 Q100 122 126 150 Q100 140 74 150 Z" fill="${INK}" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>`,
};
for (const [k, v] of Object.entries(MOUTHS)) save(`mouth_${k}`, svg(200, 200, v));

// ---------------------------------------------------------------- bodies
// Torsos hang from the top centre of a 200x220 frame; arms are drawn in-game.
const legs = (y0, y1, spread = 14) =>
  `<path d="M${100 - spread} ${y0} L${100 - spread - 6} ${y1} M${100 + spread} ${y0} L${100 + spread + 6} ${y1}" stroke="${INK}" stroke-width="7" stroke-linecap="round"/>`;
const torso = (fill, h = 110, wTop = 64, wBot = 80) =>
  `<path d="M${100 - wTop / 2} 6 Q100 0 ${100 + wTop / 2} 6 L${100 + wBot / 2} ${h} Q100 ${h + 6} ${100 - wBot / 2} ${h} Z" fill="${fill}" stroke="${INK}" stroke-width="${W}" stroke-linejoin="round"/>`;
const tie = `<path d="M118 10 L140 110 L128 112 L112 12 Z" fill="#D9DCE4"/>
  <path d="M100 8 L92 18 L98 24 L92 80 L100 92 L108 80 L102 24 L108 18 Z" fill="${INK}"/>
  <path d="M78 4 L97 24 L86 30 Z M122 4 L103 24 L114 30 Z" fill="#fff" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
  <g fill="${INK}"><circle cx="86" cy="52" r="3"/><circle cx="86" cy="74" r="3"/><circle cx="86" cy="96" r="3"/></g>`;
save('body_man', svg(200, 220, legs(108, 214) + torso('#FFFFFF') + tie));
save('body_kid', svg(200, 220, legs(84, 160, 12) + torso('#D8401F', 88, 54, 66) + `<path d="M114 10 L130 88 L118 90 L108 12 Z" fill="#000" opacity="0.15"/>`));
save('body_wife', svg(200, 220, legs(110, 214) + torso('#9B6BD6', 112, 60, 92) + `<path d="M116 10 L144 110 L130 112 L110 12 Z" fill="#000" opacity="0.15"/>`));

const baby = (mouth) => svg(160, 170, `
  <path d="M30 70 C10 110 20 160 80 166 C140 160 150 110 130 70 Z" fill="#F4A6C8" stroke="${INK}" stroke-width="6"/>
  <circle cx="80" cy="66" r="52" fill="#F9B6CF" stroke="${INK}" stroke-width="6"/>
  <path d="M104 22 l18 -12 l4 16 Z M104 22 l-6 -16 l-12 10 Z" fill="#FF6FA8" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
  ${mouth === 'scream'
    ? `<circle cx="62" cy="58" r="5" fill="${INK}"/><circle cx="98" cy="58" r="5" fill="${INK}"/><path d="M62 46 l12 6 M98 46 l-12 6" stroke="${INK}" stroke-width="4" stroke-linecap="round"/><ellipse cx="80" cy="86" rx="16" ry="20" fill="${INK}"/><ellipse cx="80" cy="96" rx="9" ry="7" fill="#D9475A"/>`
    : `<circle cx="62" cy="60" r="5" fill="${INK}"/><circle cx="98" cy="60" r="5" fill="${INK}"/><ellipse cx="80" cy="84" rx="18" ry="11" fill="#FF6FA8" stroke="${INK}" stroke-width="4"/><circle cx="80" cy="84" r="5" fill="${INK}"/>`}
`);
save('baby_calm', baby('calm'));
save('baby_scream', baby('scream'));

// ---------------------------------------------------------------- vehicles
// Side view facing RIGHT, 380x180: short trunk at the back (left), cabin set
// back, raked windshield and a long hood up front (right). Window holes are cut
// with evenodd so a driver's head can sit behind the body. Wheels are separate
// sprites (wheel.svg) so they can spin in-game; their centres are at
// x=84 and x=300, y=146.
// Colour helpers for cel shading.
const hexToRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const shade = (h, f) => '#' + hexToRgb(h).map((c) => Math.round(Math.max(0, Math.min(255, f > 0 ? c + (255 - c) * f : c * (1 + f)))).toString(16).padStart(2, '0')).join('');
const NAVY = '#1F1B3A';

// The short's car: a boxy three-box sedan (trunk, cabin, hood) with dark navy
// lines, lighter top surfaces, a darker lower body, grey bumpers and dark glass.
// Side view facing RIGHT, 380x180. Wheel centres x=84 and x=300, y=146 (wheel sprites).
const carBodyPath = `M14 98 Q14 74 30 72 L96 70 L124 26 Q128 20 136 20 L216 19 Q224 19 228 25 L266 66 L352 70 Q368 72 370 90 L370 132 Q370 142 358 142 L22 142 Q12 142 12 130 Z`;
const winBack = `M104 66 L128 30 Q130 27 134 27 L160 27 L160 66 Z`;
const winFront = `M168 27 L214 27 Q219 27 222 31 L254 66 L168 66 Z`;
const wheel = svg(72, 72, `<circle cx="36" cy="36" r="31" fill="#34343E" stroke="${NAVY}" stroke-width="4"/>
  <path d="M10 44 A27 27 0 0 0 62 44" stroke="#24242C" stroke-width="7" fill="none"/>
  <circle cx="36" cy="36" r="16" fill="#C9CDD7" stroke="${NAVY}" stroke-width="3"/>
  <circle cx="36" cy="36" r="9" fill="#9EA3B0"/><circle cx="36" cy="36" r="4" fill="#E9ECF2"/>
  <path d="M24 28 A14 14 0 0 1 34 22" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"/>`);
save('wheel', wheel);
const carShading = (color) => `
  <clipPath id="cb"><path d="${carBodyPath}"/></clipPath>
  <g clip-path="url(#cb)">
    <path d="M0 106 L380 106 L380 180 L0 180 Z" fill="${shade(color, -0.22)}"/>
    <path d="M0 0 L380 0 L380 78 L0 78 Z" fill="${shade(color, 0.16)}" opacity="0.9"/>
    <path d="M60 96 Q200 88 350 96" stroke="${shade(color, 0.35)}" stroke-width="4" fill="none" opacity="0.7"/>
  </g>`;
const carDetails = (color) => `
  <path d="M84 146 m-42 0 a42 42 0 0 1 84 0 M300 146 m-42 0 a42 42 0 0 1 84 0" fill="${shade(color, -0.55)}" stroke="${NAVY}" stroke-width="3"/>
  <path d="M14 106 L370 106" stroke="${NAVY}" stroke-width="2.5" opacity="0.6"/>
  <path d="M164 24 L164 140 M102 70 L102 140" stroke="${NAVY}" stroke-width="3" opacity="0.8"/>
  <rect x="190" y="80" width="18" height="6" rx="2" fill="${shade(color, 0.45)}" stroke="${NAVY}" stroke-width="2"/>
  <rect x="128" y="80" width="18" height="6" rx="2" fill="${shade(color, 0.45)}" stroke="${NAVY}" stroke-width="2"/>
  <path d="M348 78 L368 80 L368 96 L350 94 Z" fill="#FFF3B0" stroke="${NAVY}" stroke-width="3" stroke-linejoin="round"/>
  <rect x="13" y="78" width="11" height="20" rx="2" fill="#D7262E" stroke="${NAVY}" stroke-width="3"/>
  <path d="M240 54 L258 48 L262 64 L244 66 Z" fill="#C9CDD7" stroke="${NAVY}" stroke-width="3" stroke-linejoin="round"/>
  <path d="M326 118 L376 118 L376 134 Q376 140 368 140 L326 140 Z" fill="#BDBEC6" stroke="${NAVY}" stroke-width="3"/>
  <path d="M4 118 L48 118 L48 140 L12 140 Q4 140 4 132 Z" fill="#BDBEC6" stroke="${NAVY}" stroke-width="3"/>
  <path d="M8 135 L46 135 M330 135 L374 135" stroke="#8C8E98" stroke-width="3"/>
  <rect x="14" y="100" width="20" height="10" fill="#fff" stroke="${NAVY}" stroke-width="2"/>`;
// Player car: window holes stay transparent (driver and bananas sit behind the body).
const carFront = (color) => svg(380, 180, `
  <defs><clipPath id="cbw"><path d="${carBodyPath} ${winFront} ${winBack}" clip-rule="evenodd"/></clipPath></defs>
  <path d="${carBodyPath} ${winFront} ${winBack}" fill="${color}" fill-rule="evenodd"/>
  <g clip-path="url(#cbw)">
    <path d="M0 106 L380 106 L380 180 L0 180 Z" fill="${shade(color, -0.22)}"/>
    <path d="M0 0 L380 0 L380 78 L0 78 Z" fill="${shade(color, 0.16)}" opacity="0.9"/>
    <path d="M60 96 Q200 88 350 96" stroke="${shade(color, 0.35)}" stroke-width="4" fill="none" opacity="0.7"/>
  </g>
  <path d="${carBodyPath} ${winFront} ${winBack}" fill="none" fill-rule="evenodd" stroke="${NAVY}" stroke-width="4" stroke-linejoin="round"/>
  ${carDetails(color)}`);
// glass: dark tint + diagonal reflections (drawn over the driver)
const carGlass = svg(380, 180, `<path d="${winFront} ${winBack}" fill="#465074" opacity="0.32"/>
  <path d="M190 30 L172 62 M206 30 L188 62 M128 34 L114 60" stroke="#fff" stroke-width="5" opacity="0.35"/>`);
const carBack = svg(380, 180, `<path d="${winFront} ${winBack}" fill="#3B3F57"/><path d="M160 32 L160 66 L142 66 L148 32 Z" fill="#545A78"/><circle cx="232" cy="64" r="15" fill="none" stroke="#1E2033" stroke-width="7"/>`);
save('car_front', carFront('#5B4FE0'));
save('car_glass', carGlass);
save('car_back', carBack);

// NPC cars: body + interior + simple driver baked in (wheels added in-game).
const npcHead = (hair, skin = SKIN, extra = '') => `<g transform="translate(-48,0)">
  <circle cx="246" cy="54" r="30" fill="${skin}" stroke="${INK}" stroke-width="5"/>
  ${hair}
  <circle cx="254" cy="52" r="3.5" fill="${INK}"/><circle cx="266" cy="52" r="3.5" fill="${INK}"/>
  <path d="M254 66 L266 66" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>${extra}</g>`;
const npcCar = (color, head, extra = '') => svg(380, 180, `
  <defs><clipPath id="cb"><path d="${carBodyPath}"/></clipPath></defs>
  <path d="${winFront} ${winBack}" fill="#3B3F57"/>
  ${head}
  <path d="${carBodyPath} ${winFront} ${winBack}" fill="${color}" fill-rule="evenodd"/>
  <g clip-path="url(#cb)">
    <path d="M0 106 L380 106 L380 180 L0 180 Z" fill="${shade(color, -0.22)}"/>
    <path d="M0 0 L380 0 L380 78 L0 78 Z" fill="${shade(color, 0.16)}" opacity="0.9"/>
    <path d="M60 96 Q200 88 350 96" stroke="${shade(color, 0.35)}" stroke-width="4" fill="none" opacity="0.7"/>
  </g>
  <path d="${winFront} ${winBack}" fill="#465074" opacity="0.32"/>
  <path d="M190 30 L172 62 M128 34 L114 60" stroke="#fff" stroke-width="5" opacity="0.3"/>
  <path d="${carBodyPath} ${winFront} ${winBack}" fill="none" fill-rule="evenodd" stroke="${NAVY}" stroke-width="4" stroke-linejoin="round"/>
  ${carDetails(color)}${extra}`);
save('car_green', npcCar('#22C02E', npcHead(`<path d="M218 46 Q230 18 260 26" stroke="#2b1d16" stroke-width="10" fill="none" stroke-linecap="round"/>`, '#8D5524')));
save('car_red', npcCar('#E8501E', npcHead(
  `<circle cx="236" cy="30" r="14" fill="#C9C9D2" stroke="${INK}" stroke-width="4"/><circle cx="222" cy="44" r="12" fill="#C9C9D2" stroke="${INK}" stroke-width="4"/>`,
  '#F2CDA8',
  `<circle cx="254" cy="52" r="8" fill="none" stroke="#E04BA0" stroke-width="3"/><circle cx="268" cy="52" r="8" fill="none" stroke="#E04BA0" stroke-width="3"/>`)));
save('car_taxi', npcCar('#F2C12E', npcHead(`<path d="M218 40 Q240 18 270 34" stroke="#111" stroke-width="10" fill="none" stroke-linecap="round"/>`, '#C68B59'),
  `<rect x="150" y="2" width="44" height="14" rx="3" fill="#fff" stroke="${NAVY}" stroke-width="3"/><text x="172" y="13" font-family="Arial" font-weight="900" font-size="10" text-anchor="middle" fill="#111">TAXI</text>
   <path d="M30 102 h320" stroke="#111" stroke-width="7" stroke-dasharray="12 12"/>`));
save('car_white', npcCar('#E9E9EE', npcHead(`<path d="M220 40 Q244 14 274 36" stroke="#9A5A2B" stroke-width="12" fill="none" stroke-linecap="round"/>`, '#C68B59')));

// Parked car: white body, no driver; tinted to any colour in-game.
save('car_parked', npcCar('#FFFFFF', ''));

// Big leafy street tree (crash-park scene).
save('tree', svg(320, 440, `<path d="M146 440 L150 250 Q152 230 140 214 M170 440 L168 250 Q170 228 186 212" stroke="${INK}" stroke-width="6" fill="none"/>
  <path d="M138 440 L146 250 L174 250 L182 440 Z" fill="#7A4A26" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>
  <path d="M160 18 C220 10 262 52 258 98 C300 110 312 168 284 200 C300 246 262 290 214 280 C196 312 128 316 106 282 C58 296 18 258 34 214 C4 186 14 130 56 118 C52 64 104 26 160 18 Z" fill="#3E9B4A" stroke="${INK}" stroke-width="7" stroke-linejoin="round"/>
  <path d="M110 90 Q140 70 170 84 M200 140 Q228 128 246 146 M80 190 Q104 176 132 188 M170 220 Q196 206 222 222" stroke="#2C7A37" stroke-width="6" fill="none" stroke-linecap="round"/>`));

// Old lady with a cane (crash-park scene).
save('old_lady', svg(120, 200, `<path d="M48 130 L42 196 M70 130 L76 196" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>
  <path d="M86 92 L104 196" stroke="#7A4A26" stroke-width="6" stroke-linecap="round"/>
  <path d="M40 84 L30 128 M78 84 L88 100" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>
  <path d="M38 78 L82 78 L90 140 L30 140 Z" fill="#E88AB4" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>
  <circle cx="60" cy="46" r="34" fill="#F2CDA8" stroke="${INK}" stroke-width="5"/>
  <circle cx="60" cy="14" r="14" fill="#D9D9E0" stroke="${INK}" stroke-width="4"/>
  <path d="M28 40 Q32 16 60 14 Q88 16 92 40" fill="#D9D9E0" stroke="${INK}" stroke-width="4"/>
  <circle cx="50" cy="48" r="8" fill="none" stroke="#E04BA0" stroke-width="3"/><circle cx="70" cy="48" r="8" fill="none" stroke="#E04BA0" stroke-width="3"/>
  <circle cx="50" cy="48" r="3" fill="${INK}"/><circle cx="70" cy="48" r="3" fill="${INK}"/><path d="M52 64 L68 64" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`));

// Kid on a bike: rider and bike are separate so they can fly apart.
save('bike', svg(180, 110, `<circle cx="38" cy="72" r="30" fill="none" stroke="${INK}" stroke-width="6"/><circle cx="142" cy="72" r="30" fill="none" stroke="${INK}" stroke-width="6"/>
  <path d="M38 72 L76 30 L124 30 L142 72 M76 30 L92 72 L124 30 M38 72 L92 72 M118 18 L128 18 M124 30 L120 16" stroke="#D3202A" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M66 26 L86 26" stroke="${INK}" stroke-width="7" stroke-linecap="round"/>`));
save('kid_rider', svg(110, 160, `<path d="M46 108 L34 150 M60 108 L78 140" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>
  <path d="M40 76 L62 70 L66 112 L40 112 Z" fill="#2EAA3A" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>
  <path d="M60 80 L92 96" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>
  <circle cx="54" cy="40" r="32" fill="${SKIN}" stroke="${INK}" stroke-width="5"/>
  <path d="M22 36 Q24 4 56 6 Q86 8 86 34 Z" fill="#E33" stroke="${INK}" stroke-width="4"/><path d="M84 30 L102 32" stroke="${INK}" stroke-width="5"/>
  <circle cx="64" cy="44" r="4" fill="${INK}"/><circle cx="80" cy="44" r="4" fill="${INK}"/><path d="M66 58 Q74 62 82 58" stroke="${INK}" stroke-width="3" fill="none"/>`));

// Neighbourhood entrance pillar.
save('pillar', svg(70, 200, `<rect x="10" y="30" width="50" height="170" fill="#B5553C" stroke="${INK}" stroke-width="5"/>
  <path d="M10 70 H60 M10 110 H60 M10 150 H60 M35 30 V70 M22 70 V110 M48 110 V150 M35 150 V200" stroke="#7E3524" stroke-width="3"/>
  <rect x="4" y="16" width="62" height="18" fill="#D8CBB8" stroke="${INK}" stroke-width="5"/><circle cx="35" cy="8" r="9" fill="#FFE97A" stroke="${INK}" stroke-width="4"/>`));
save('hedge', svg(200, 70, `<path d="M6 66 Q0 30 26 26 Q30 4 60 10 Q80 -2 104 12 Q130 0 150 16 Q186 10 192 38 Q204 54 194 66 Z" fill="#3E9B4A" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>`));

// ---------------------------------------------------------------- in-car close-up
// The short's signature shot: from the dashboard, looking at the driver.
// cabin_frame is an overlay: roof, rear-view mirror, A-pillars and dashboard,
// with the windscreen left transparent (the burst shows through).
const CAB = '#3F3A56';
const CAB_LIGHT = '#5A5476';
// Behind the driver: roof lining and the car's pillars/side frames.
save('cabin_back', svg(1280, 720, `
  <path d="M0 0 H1280 V46 Q640 74 0 46 Z" fill="${CAB}" stroke="${NAVY}" stroke-width="4"/>
  <path d="M120 40 L196 40 L96 600 L18 600 Z" fill="${CAB}" stroke="${NAVY}" stroke-width="4"/>
  <path d="M182 46 L104 590" stroke="${CAB_LIGHT}" stroke-width="8"/>
  <path d="M1084 40 L1160 40 L1262 600 L1184 600 Z" fill="${CAB}" stroke="${NAVY}" stroke-width="4"/>
  <path d="M1098 46 L1196 590" stroke="${CAB_LIGHT}" stroke-width="8"/>
  <path d="M0 40 L120 40 L18 600 L0 600 Z M1280 40 L1160 40 L1262 600 L1280 600 Z" fill="#2E2A42" opacity="0.55"/>`));
// In front of the camera: the dashboard along the bottom and the rear-view mirror at the top.
save('cabin_dash', svg(1280, 720, `
  <rect x="520" y="-10" width="240" height="62" rx="18" fill="#2C283E" stroke="${NAVY}" stroke-width="4"/>
  <rect x="534" y="4" width="212" height="36" rx="10" fill="#6E7898"/>
  <path d="M548 30 L600 8 M590 34 L640 10" stroke="#B7C0DA" stroke-width="6" opacity="0.6"/>
  <path d="M-20 700 Q640 664 1300 700 L1300 740 L-20 740 Z" fill="#35304A" stroke="${NAVY}" stroke-width="5"/>
  <path d="M40 698 Q640 668 1240 698" stroke="${CAB_LIGHT}" stroke-width="6" fill="none"/>`));
save('car_seat', svg(360, 460, `<path d="M40 70 Q40 20 90 18 L270 18 Q320 20 320 70 L330 460 L30 460 Z" fill="#6A6688" stroke="${NAVY}" stroke-width="5"/>
  <path d="M70 60 Q70 44 90 44 L270 44 Q290 44 290 60 L296 440 L64 440 Z" fill="#7C78A0"/>
  <path d="M120 120 L118 430 M240 120 L242 430" stroke="#5E5A7C" stroke-width="5"/>`));
save('steering', svg(560, 300, `<ellipse cx="280" cy="230" rx="250" ry="150" fill="none" stroke="#24223A" stroke-width="40"/>
  <ellipse cx="280" cy="230" rx="250" ry="150" fill="none" stroke="#3B3858" stroke-width="10" transform="translate(0,-8)"/>
  <path d="M60 250 Q280 200 500 250" stroke="#24223A" stroke-width="30" fill="none"/>
  <ellipse cx="280" cy="250" rx="60" ry="40" fill="#24223A"/>`));
// Grocery bag with a loaf of bread and tins (bananas are a separate sprite so they can ripen).
save('bag_full', svg(300, 330, `<path d="M90 120 Q70 40 116 30 Q140 24 152 52 L170 34 L182 64 L152 118 Z" fill="#F4F1EA" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>
  <path d="M100 56 Q120 48 140 60" stroke="#D8D0BC" stroke-width="6" fill="none"/>
  <ellipse cx="226" cy="108" rx="34" ry="12" fill="#C9CDD7" stroke="${INK}" stroke-width="4"/><path d="M192 108 L192 140 L260 140 L260 108" fill="#B5BAC6" stroke="${INK}" stroke-width="4"/>
  <rect x="34" y="92" width="50" height="60" fill="#3C7DD9" stroke="${INK}" stroke-width="4" transform="rotate(-8 59 122)"/>
  <path d="M20 140 L36 118 L52 138 L70 116 L88 138 L106 116 L124 138 L142 116 L160 138 L178 116 L196 138 L214 116 L232 138 L250 116 L268 138 L282 120 L290 326 L10 326 Z" fill="#A87230" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>
  <path d="M150 150 L154 320" stroke="#7E5220" stroke-width="5"/><path d="M200 150 L206 326 L290 326 L282 150 Z" fill="#000" opacity="0.12"/>`));

// Turbo refill pickup: an energy drink can.
save('nitro', svg(80, 120, `<rect x="10" y="12" width="60" height="100" rx="10" fill="#1F8FD6" stroke="${INK}" stroke-width="6"/>
  <rect x="16" y="4" width="48" height="14" rx="5" fill="#C9CCD6" stroke="${INK}" stroke-width="5"/>
  <path d="M46 26 L24 66 L40 66 L32 98 L58 54 L42 54 L52 26 Z" fill="#F7D93A" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>`));
// Coffee pickup: takeaway cup with a lid and steam.
save('coffee', svg(90, 130, `<path d="M30 22 q-8 -10 0 -18 M48 22 q-8 -10 0 -18 M66 22 q-8 -10 0 -18" stroke="#BBBBBB" stroke-width="4" fill="none" stroke-linecap="round"/>
  <path d="M16 40 L74 40 L66 126 L24 126 Z" fill="#F4F1EA" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>
  <rect x="10" y="26" width="70" height="16" rx="6" fill="#5E3A1E" stroke="${INK}" stroke-width="5"/>
  <path d="M20 70 L70 70 L67 100 L23 100 Z" fill="#8A5A2B" stroke="${INK}" stroke-width="4"/>
  <text x="45" y="91" text-anchor="middle" font-family="Arial Black,Arial" font-weight="900" font-size="13" fill="#F7E7B0">JAVA</text>`));
// Exhaust puff.
save('puff', svg(40, 40, `<circle cx="20" cy="20" r="16" fill="#D9D9E0" stroke="${INK}" stroke-width="3" opacity="0.9"/>`));

// ---------------------------------------------------------------- pedestrians
const SKINS = ['#F9C99A', '#C68B59', '#8D5524', '#F1D2B6', '#E0A878', '#A86B3C'];
const SHIRTS = ['#E8501E', '#2EAA3A', '#F2C12E', '#1F8FA8', '#D9428B', '#22C02E', '#C7262E', '#6A5AD9'];
// hair shapes on a 100px-wide head centred at (50,44), r=38
const HAIRS = [
  '',
  `<path d="M14 40 Q14 2 52 4 Q88 6 88 36 Q70 22 50 24 Q28 24 14 40 Z" fill="#2B1D16" stroke="${INK}" stroke-width="4"/>`,
  `<path d="M12 56 Q6 4 52 4 Q96 6 88 58 L80 40 Q76 26 52 26 Q28 26 22 42 Z" fill="#F2C12E" stroke="${INK}" stroke-width="4"/><path d="M70 14 l10 -6" stroke="#2F7CF6" stroke-width="6" stroke-linecap="round"/>`,
  `<path d="M16 34 Q22 0 56 4 Q90 10 86 40 Q66 18 40 22 Q24 26 16 34 Z" fill="#111" stroke="${INK}" stroke-width="4"/>`,
  `<path d="M10 70 Q2 6 50 2 Q100 4 92 70 L82 52 Q82 26 50 24 Q20 26 18 52 Z" fill="#5A3826" stroke="${INK}" stroke-width="4"/><circle cx="84" cy="22" r="12" fill="#5A3826" stroke="${INK}" stroke-width="4"/>`,
  `<g fill="#3A2A20" stroke="${INK}" stroke-width="3"><circle cx="24" cy="22" r="10"/><circle cx="40" cy="12" r="11"/><circle cx="58" cy="10" r="11"/><circle cx="76" cy="18" r="10"/><circle cx="86" cy="32" r="8"/></g>`,
];
for (let i = 0; i < 8; i++) {
  const skin = SKINS[i % SKINS.length];
  const shirt = SHIRTS[i];
  const hair = HAIRS[i % HAIRS.length];
  save(`ped_${i}`, svg(100, 190, `
    <path d="M42 128 L38 186 M58 128 L64 186" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>
    <path d="M30 86 Q28 78 40 78 L60 78 Q72 78 70 86 L72 130 L28 130 Z" fill="${shirt}" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>
    <path d="M58 82 L66 82 L68 128 L60 128 Z" fill="#000" opacity="0.15"/>
    <path d="M32 88 L26 126 M68 88 L74 126" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>
    <circle cx="26" cy="128" r="5" fill="${INK}"/><circle cx="74" cy="128" r="5" fill="${INK}"/>
    <defs><clipPath id="ph"><circle cx="50" cy="44" r="38"/></clipPath></defs>
    <circle cx="50" cy="44" r="38" fill="${shade(skin, -0.12)}"/><circle cx="50" cy="38" r="37" fill="${skin}" clip-path="url(#ph)"/>
    <circle cx="50" cy="44" r="38" fill="none" stroke="${INK}" stroke-width="5"/>
    ${hair}
    <circle cx="40" cy="48" r="4.5" fill="${INK}"/><circle cx="62" cy="48" r="4.5" fill="${INK}"/>
    <path d="M44 64 L58 64" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`));
}

// ---------------------------------------------------------------- bananas
const bananaShape = (rot, fill, spots) => `
  <g transform="rotate(${rot} 100 110)">
    <path d="M40 60 C40 130 120 170 176 120 C182 114 176 106 168 110 C120 140 70 120 58 58 Z" fill="${fill}" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>
    <path d="M60 80 C76 118 120 132 160 118" stroke="#000" stroke-width="3" fill="none" opacity="0.18"/>
    <path d="M38 62 L44 44 L58 50 L56 62 Z" fill="#5A4426" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>
    ${spots}
  </g>`;
const STAGES = {
  green: ['#8BE23A', ''],
  yellow: ['#F7D93A', ''],
  spotty: ['#E9C23A', '<g fill="#5B3A1C"><circle cx="90" cy="120" r="5"/><circle cx="120" cy="134" r="4"/><circle cx="70" cy="96" r="4"/><circle cx="140" cy="128" r="6"/><circle cx="104" cy="112" r="3"/></g>'],
  brown: ['#6B3E1E', '<g fill="#2E180A"><circle cx="90" cy="120" r="8"/><circle cx="124" cy="132" r="7"/><circle cx="70" cy="96" r="6"/></g>'],
};
for (const [k, [fill, spots]] of Object.entries(STAGES)) {
  save(`banana_${k}`, svg(200, 200, bananaShape(-18, fill, spots) + bananaShape(0, fill, spots) + bananaShape(18, fill, spots)));
}

// ---------------------------------------------------------------- props
save('bag', svg(220, 260, `
  <path d="M74 70 Q60 20 92 14 Q110 10 118 30 L132 18 L140 40 L120 76 Z" fill="#F4F4F4" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>
  <rect x="130" y="40" width="54" height="50" rx="4" fill="#3C7DD9" stroke="${INK}" stroke-width="5" transform="rotate(8 157 65)"/>
  <path d="M30 80 L40 64 L52 78 L66 62 L80 78 L94 62 L108 78 L122 62 L136 78 L150 62 L164 78 L178 62 L190 80 L196 252 L24 252 Z" fill="#9C6A2C" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>
  <path d="M70 100 L64 240 M150 100 L156 240" stroke="#7A4F1C" stroke-width="4"/>`));
save('ice', svg(110, 90, `<rect x="6" y="10" width="98" height="72" rx="14" fill="#7FD4FF" stroke="${INK}" stroke-width="6"/>
  <path d="M55 22 L55 70 M34 34 L76 58 M76 34 L34 58" stroke="#fff" stroke-width="6" stroke-linecap="round"/>`));
save('chant', svg(150, 110, `<path d="M10 10 L140 10 L140 76 L60 76 L34 104 L38 76 L10 76 Z" fill="#fff" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>
  <text x="75" y="38" text-anchor="middle" font-family="Arial Black,Arial" font-weight="900" font-size="18" fill="#E33">DON'T TURN</text>
  <text x="75" y="62" text-anchor="middle" font-family="Arial Black,Arial" font-weight="900" font-size="20" fill="#E0B400" stroke="${INK}" stroke-width="1">YELLOW</text>`));
save('yield', svg(120, 300, `<rect x="54" y="90" width="12" height="210" fill="#777" stroke="${INK}" stroke-width="4"/>
  <path d="M8 10 L112 10 L60 100 Z" fill="#fff" stroke="#D3202A" stroke-width="12" stroke-linejoin="round"/>
  <path d="M8 10 L112 10 L60 100 Z" fill="none" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
  <text x="60" y="38" text-anchor="middle" font-family="Arial Black,Arial" font-weight="900" font-size="18" fill="#D3202A">YIELD</text>
  <text x="60" y="56" text-anchor="middle" font-family="Arial" font-weight="700" font-size="12" fill="#D3202A">TO</text>
  <circle cx="60" cy="68" r="6" fill="#333"/><path d="M60 74 L60 84 M54 78 L66 78" stroke="#333" stroke-width="3"/>`));
save('light', svg(160, 320, `<rect x="20" y="40" width="14" height="280" fill="#555" stroke="${INK}" stroke-width="4"/>
  <rect x="20" y="30" width="130" height="12" fill="#555" stroke="${INK}" stroke-width="4"/>
  <rect x="92" y="6" width="64" height="30" rx="8" fill="#3A3A2A" stroke="${INK}" stroke-width="4"/>
  <circle cx="106" cy="21" r="8" fill="#F23"/><circle cx="124" cy="21" r="8" fill="#553"/><circle cx="142" cy="21" r="8" fill="#353"/>`));
save('trash', svg(80, 110, `<path d="M10 20 L70 20 L64 106 L16 106 Z" fill="#8B93A1" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>
  <rect x="4" y="8" width="72" height="14" rx="5" fill="#9AA3B2" stroke="${INK}" stroke-width="5"/>
  <path d="M28 34 L30 94 M40 34 L40 94 M52 34 L50 94" stroke="${INK}" stroke-width="3" opacity="0.5"/>`));
save('fly', svg(30, 24, `<ellipse cx="9" cy="8" rx="7" ry="5" fill="#cfe9ff" stroke="${INK}" stroke-width="1.5" opacity="0.9"/><ellipse cx="21" cy="8" rx="7" ry="5" fill="#cfe9ff" stroke="${INK}" stroke-width="1.5" opacity="0.9"/><circle cx="15" cy="15" r="6" fill="#111"/>`));
save('phone', svg(360, 600, `<rect x="6" y="6" width="348" height="588" rx="42" fill="#1C1C22" stroke="#000" stroke-width="6"/>
  <rect x="24" y="64" width="312" height="470" rx="8" fill="#F1F2F6"/>
  <rect x="24" y="64" width="312" height="56" fill="#DADCE4"/>
  <text x="180" y="100" text-anchor="middle" font-family="Arial" font-weight="700" font-size="24" fill="#333">Wife</text>
  <rect x="140" y="30" width="80" height="10" rx="5" fill="#333"/>`));
save('keys', svg(90, 90, `<circle cx="30" cy="30" r="20" fill="none" stroke="#C9A800" stroke-width="8"/><path d="M44 44 L80 80 M66 66 L58 74 M74 74 L66 82" stroke="#C9A800" stroke-width="8" stroke-linecap="round"/>`));
save('splat', svg(300, 140, `<path d="M10 110 Q30 96 60 100 L40 70 L80 92 Q96 60 120 84 L128 40 L146 82 Q170 58 186 86 L230 56 L214 94 Q262 90 290 112 Q270 132 220 130 L90 132 Q20 134 10 110 Z" fill="#C9A43A" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>
  <g fill="#6B3E1E"><ellipse cx="100" cy="112" rx="14" ry="7"/><ellipse cx="170" cy="106" rx="10" ry="6"/><ellipse cx="226" cy="118" rx="12" ry="6"/><circle cx="62" cy="76" r="5"/><circle cx="240" cy="62" r="5"/></g>
  <g fill="#F2E08A"><ellipse cx="140" cy="118" rx="18" ry="5"/></g>`));

// Wall clock for the time-lapse; hands drawn in-game.
let ticks = '';
for (let i = 0; i < 12; i++) {
  const [x1, y1] = polar(150, 150, 118, i * 30);
  const [x2, y2] = polar(150, 150, i % 3 === 0 ? 96 : 106, i * 30);
  ticks += `<path d="M${x1} ${y1} L${x2} ${y2}" stroke="${INK}" stroke-width="${i % 3 === 0 ? 10 : 5}" stroke-linecap="round"/>`;
}
save('clock', svg(300, 300, `<circle cx="150" cy="150" r="140" fill="#FFF8E6" stroke="${INK}" stroke-width="12"/>${ticks}`));

// ---------------------------------------------------------------- backgrounds
const rays = (cx, cy, n, c1, c2, w, h) => {
  let p = `<rect width="${w}" height="${h}" fill="${c2}"/>`;
  for (let i = 0; i < n; i++) {
    const a1 = (i / n) * 360;
    const a2 = a1 + 360 / n / 2;
    const [x1, y1] = polar(cx, cy, 2000, a1);
    const [x2, y2] = polar(cx, cy, 2000, a2);
    p += `<path d="M${cx} ${cy} L${x1.toFixed(0)} ${y1.toFixed(0)} L${x2.toFixed(0)} ${y2.toFixed(0)} Z" fill="${c1}"/>`;
  }
  return p;
};
{
  let b = `<defs><radialGradient id="bg" cx="0.5" cy="0.45" r="0.75"><stop offset="0" stop-color="#FFF7B0"/><stop offset="0.35" stop-color="#F2D23A"/><stop offset="1" stop-color="#9A6410"/></radialGradient>
    <radialGradient id="glow" cx="0.5" cy="0.45" r="0.5"><stop offset="0" stop-color="#fff" stop-opacity="1"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>
    <rect width="1280" height="720" fill="url(#bg)"/>`;
  seed = 77;
  const cx = 640, cy = 320;
  for (let i = 0; i < 90; i++) {
    const a = rnd() * 360;
    const w = 0.4 + rnd() * 2.6;
    const r0 = 60 + rnd() * 220;
    const [x1, y1] = polar(cx, cy, r0, a - w / 2);
    const [x2, y2] = polar(cx, cy, 1700, a - w);
    const [x3, y3] = polar(cx, cy, 1700, a + w);
    const [x4, y4] = polar(cx, cy, r0, a + w / 2);
    const col = rnd() < 0.5 ? '#FFF3A0' : rnd() < 0.5 ? '#E7A21C' : '#FFFFFF';
    b += `<path d="M${x1.toFixed(0)} ${y1.toFixed(0)} L${x2.toFixed(0)} ${y2.toFixed(0)} L${x3.toFixed(0)} ${y3.toFixed(0)} L${x4.toFixed(0)} ${y4.toFixed(0)} Z" fill="${col}" opacity="${(0.25 + rnd() * 0.55).toFixed(2)}"/>`;
  }
  b += `<ellipse cx="${cx}" cy="${cy}" rx="420" ry="300" fill="url(#glow)"/>`;
  save('burst_yellow', svg(1280, 720, b));
}
let speed = `<defs><linearGradient id="b" x1="0" x2="1"><stop offset="0" stop-color="#0E3A7A"/><stop offset="1" stop-color="#1F8FD6"/></linearGradient></defs><rect width="1280" height="720" fill="url(#b)"/>`;
seed = 3;
for (let i = 0; i < 60; i++) {
  const y = rnd() * 720;
  const len = 300 + rnd() * 900;
  const x = rnd() * 1280;
  const th = 2 + rnd() * 10;
  speed += `<path d="M${x.toFixed(0)} ${y.toFixed(0)} L${(x + len).toFixed(0)} ${(y - len * 0.35).toFixed(0)}" stroke="${rnd() > 0.5 ? '#BFF4FF' : '#5FD0FF'}" stroke-width="${th.toFixed(1)}" stroke-linecap="round" opacity="${(0.4 + rnd() * 0.6).toFixed(2)}"/>`;
}
save('burst_blue', svg(1280, 720, speed));

// Tileable skyline and trees (nothing crosses the left/right edges).
let sky = '';
seed = 11;
let x = 0;
while (x < 1240) {
  const w = 60 + rnd() * 90;
  if (x + w > 1280) break;
  const h = 80 + rnd() * 160;
  sky += `<rect x="${x.toFixed(0)}" y="${(260 - h).toFixed(0)}" width="${w.toFixed(0)}" height="${h.toFixed(0)}" fill="#8C95D8"/>`;
  for (let wy = 260 - h + 16; wy < 240; wy += 28)
    sky += `<rect x="${(x + 10).toFixed(0)}" y="${wy.toFixed(0)}" width="${(w - 20).toFixed(0)}" height="6" fill="#A4ACE4"/>`;
  x += w + 4 + rnd() * 20;
}
save('skyline', svg(1280, 260, sky));
let trees = '';
seed = 5;
for (let tx = 40; tx < 1240; tx += 110 + rnd() * 160) {
  const s = 0.7 + rnd() * 0.6;
  trees += `<g transform="translate(${tx.toFixed(0)},${(200 - 190 * s).toFixed(0)}) scale(${s.toFixed(2)})">
    <rect x="44" y="150" width="14" height="40" fill="#6B4423" stroke="${INK}" stroke-width="4"/>
    <path d="M51 0 L94 70 L76 70 L104 120 L84 120 L110 160 L-8 160 L18 120 L-2 120 L26 70 L8 70 Z" fill="#2E8B57" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>
    <path d="M51 10 L30 70 M51 60 L24 120" stroke="#3FAE6E" stroke-width="6" opacity="0.7"/></g>`;
}
save('trees', svg(1280, 200, trees));

// Street facades for the drive, like the short's city blocks: colourful
// shopfronts and row houses with stone corner blocks, white-framed windows with
// reflections, doors and steps. Tileable (buildings exactly fill 1280px).
// Background linework is thinner and dark brown/navy, not the characters' black.
const BG_LINE = '#3A2E3A';
const win = (x, y, w, h) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#FFFFFF" stroke="${BG_LINE}" stroke-width="2.5"/>
  <rect x="${x + 5}" y="${y + 5}" width="${w - 10}" height="${h - 10}" fill="#8EC5F0"/>
  <path d="M${x + 5} ${y + h - 5} L${x + w * 0.6} ${y + 5} L${x + w - 5} ${y + 5} L${x + w - 5} ${y + 12} L${x + 14} ${y + h - 5} Z" fill="#B7DCFA"/>
  <path d="M${x + w / 2} ${y + 5} V${y + h - 5} M${x + 5} ${y + h / 2} H${x + w - 5}" stroke="#FFFFFF" stroke-width="4"/>`;
const pilaster = (x, top, h) => {
  let p = `<rect x="${x}" y="${top}" width="18" height="${h}" fill="#D3CEC6" stroke="${BG_LINE}" stroke-width="2.5"/>`;
  for (let y = top + 6; y < top + h - 10; y += 26) p += `<rect x="${x - 3}" y="${y}" width="24" height="16" fill="#E2DED7" stroke="${BG_LINE}" stroke-width="2"/>`;
  return p;
};
let blocks = '';
seed = 21;
const FACADES = ['#2E9E5B', '#3D7DC4', '#C0603F', '#D9A63A', '#3AA7A0', '#8CC08C', '#B9A24E', '#5A86C8', '#D97C5A'];
{
  const widths = [];
  let total = 0;
  while (total < 1280) {
    const w = 150 + Math.floor(rnd() * 110);
    widths.push(w);
    total += w;
  }
  widths[widths.length - 1] -= total - 1280;
  let x = 0;
  widths.forEach((w, i) => {
    const color = FACADES[(i * 4 + Math.floor(rnd() * 3)) % FACADES.length];
    const h = 170 + Math.floor(rnd() * 120);
    const top = 300 - h;
    const shop = rnd() < 0.5;
    blocks += `<rect x="${x}" y="${top}" width="${w}" height="${h}" fill="${color}" stroke="${BG_LINE}" stroke-width="3"/>`;
    // big soft cel-shadow across part of the wall
    blocks += `<path d="M${x} ${top} L${x + w * 0.45} ${top} L${x} ${top + h * 0.7} Z" fill="#000" opacity="0.08"/>`;
    blocks += `<rect x="${x - 2}" y="${top - 10}" width="${w + 4}" height="14" fill="${shade(color, -0.25)}" stroke="${BG_LINE}" stroke-width="2.5"/>`;
    // upper windows
    const cols = Math.max(1, Math.floor((w - 40) / 62));
    const gap = (w - 36 - cols * 44) / (cols + 1);
    for (let row = top + 22; row < 300 - (shop ? 120 : 80); row += 70)
      for (let c = 0; c < cols; c++) blocks += win(x + 18 + gap + c * (44 + gap), row, 44, 52);
    if (shop) {
      // ground-floor shopfront with a door
      blocks += `<rect x="${x + 22}" y="${300 - 92}" width="${w - 44}" height="92" fill="${shade(color, -0.35)}" stroke="${BG_LINE}" stroke-width="2.5"/>`;
      blocks += `<rect x="${x + 30}" y="${300 - 84}" width="${w - 100}" height="70" fill="#8EC5F0" stroke="${BG_LINE}" stroke-width="2.5"/>`;
      blocks += `<path d="M${x + 36} ${300 - 20} L${x + 70} ${300 - 80} L${x + 90} ${300 - 80} L${x + 56} ${300 - 20} Z" fill="#B7DCFA"/>`;
      blocks += `<rect x="${x + w - 64}" y="${300 - 84}" width="34" height="84" fill="${shade(color, 0.3)}" stroke="${BG_LINE}" stroke-width="2.5"/>`;
    } else {
      blocks += `<rect x="${x + w / 2 - 22}" y="${300 - 78}" width="44" height="78" fill="#8A5A3A" stroke="${BG_LINE}" stroke-width="2.5"/>
        <rect x="${x + w / 2 - 15}" y="${300 - 70}" width="30" height="28" fill="none" stroke="${shade('#8A5A3A', -0.3)}" stroke-width="2"/>
        <circle cx="${x + w / 2 + 14}" cy="${300 - 36}" r="3" fill="#E0B400"/>`;
      blocks += `<rect x="${x + w / 2 - 32}" y="${300 - 10}" width="64" height="10" fill="#C9C4BB" stroke="${BG_LINE}" stroke-width="2"/>`;
    }
    blocks += pilaster(x + 2, top + 4, h - 4) + pilaster(x + w - 20, top + 4, h - 4);
    x += w;
  });
}
save('buildings', svg(1280, 300, blocks));

// Street trees + lamp posts that sit on the top sidewalk, in front of the facades (tileable).
let street = '';
seed = 33;
for (let x = 120; x < 1180; x += 260 + Math.floor(rnd() * 140)) {
  if (rnd() < 0.7) {
    street += `<g transform="translate(${x - 70},10) scale(0.44)">
      <path d="M138 440 L146 250 L174 250 L182 440 Z" fill="#7A4A26" stroke="${BG_LINE}" stroke-width="7" stroke-linejoin="round"/>
      <path d="M160 18 C220 10 262 52 258 98 C300 110 312 168 284 200 C300 246 262 290 214 280 C196 312 128 316 106 282 C58 296 18 258 34 214 C4 186 14 130 56 118 C52 64 104 26 160 18 Z" fill="#3E9B4A" stroke="${BG_LINE}" stroke-width="8" stroke-linejoin="round"/>
      <path d="M200 60 C250 70 270 120 260 170 C280 210 250 260 210 262 C190 290 150 290 130 270 C190 240 220 160 200 60 Z" fill="#2E7D3A"/></g>`;
  } else {
    street += `<rect x="${x - 4}" y="40" width="8" height="160" fill="#4A4A55" stroke="${BG_LINE}" stroke-width="2"/>
      <path d="M${x} 44 Q${x + 30} 20 ${x + 44} 40" stroke="#4A4A55" stroke-width="6" fill="none"/>
      <path d="M${x + 34} 38 L${x + 56} 38 L${x + 50} 50 L${x + 40} 50 Z" fill="#FFF3B0" stroke="${BG_LINE}" stroke-width="2"/>`;
  }
}
save('streetfront', svg(1280, 205, street));

// Soft cartoon clouds (tileable).
let clouds = '';
seed = 8;
for (let x = 80; x < 1200; x += 300 + rnd() * 200) {
  const y = 30 + rnd() * 70;
  const sc = 0.7 + rnd() * 0.6;
  clouds += `<g transform="translate(${x.toFixed(0)},${y.toFixed(0)}) scale(${sc.toFixed(2)})" fill="#FFFFFF" opacity="0.9">
    <ellipse cx="0" cy="20" rx="70" ry="22"/><circle cx="-24" cy="6" r="24"/><circle cx="14" cy="-2" r="30"/><circle cx="44" cy="12" r="20"/></g>`;
}
save('clouds', svg(1280, 160, clouds));

// Row houses for the arrival shot, like the short's street (f_33): stone corner
// blocks, white-framed windows with reflections, a front door up some steps
// with a railing, bushes, slab sidewalk and kerb.
{
  let st = `<rect width="1280" height="720" fill="#9FD5F2"/>`;
  const houses = [['#E7B85A', -40, false], ['#A99A4E', 270, true], ['#3F78B8', 580, false], ['#C9B25A', 890, true], ['#D98C6A', 1200, false]];
  for (const [color, hx, door] of houses) {
    st += `<rect x="${hx}" y="0" width="310" height="560" fill="${color}" stroke="${BG_LINE}" stroke-width="3"/>`;
    st += `<path d="M${hx} 0 L${hx + 180} 0 Q${hx + 60} 260 ${hx} 420 Z" fill="#000" opacity="0.07"/>`;
    st += `<rect x="${hx - 4}" y="40" width="318" height="16" fill="${shade(color, -0.25)}" stroke="${BG_LINE}" stroke-width="2.5"/>`;
    st += win(hx + 50, 110, 92, 120) + win(hx + 170, 110, 92, 120);
    if (door) {
      st += `<rect x="${hx + 118}" y="300" width="84" height="170" fill="#8A5A3A" stroke="${BG_LINE}" stroke-width="3"/>
        <rect x="${hx + 128}" y="312" width="64" height="60" fill="none" stroke="#6A4028" stroke-width="3"/><rect x="${hx + 128}" y="384" width="64" height="70" fill="none" stroke="#6A4028" stroke-width="3"/>
        <circle cx="${hx + 190}" cy="392" r="5" fill="#E0B400" stroke="${BG_LINE}" stroke-width="1.5"/>
        <path d="M${hx + 104} 470 H${hx + 216} V500 H${hx + 104} Z M${hx + 92} 500 H${hx + 228} V530 H${hx + 92} Z M${hx + 80} 530 H${hx + 240} V560 H${hx + 80} Z" fill="#C9C4BB" stroke="${BG_LINE}" stroke-width="2.5"/>
        <path d="M${hx + 96} 440 L${hx + 96} 560 M${hx + 96} 440 L${hx + 60} 520 L${hx + 60} 560 M${hx + 84} 466 V560 M${hx + 72} 492 V560" stroke="#3A3236" stroke-width="5" fill="none"/>`;
    } else {
      st += win(hx + 50, 330, 92, 110) + win(hx + 170, 330, 92, 110);
      st += `<rect x="${hx + 60}" y="500" width="190" height="40" fill="#8EC5F0" stroke="${BG_LINE}" stroke-width="2.5"/>`;
    }
    st += pilaster(hx + 4, 56, 504) + pilaster(hx + 288, 56, 504);
  }
  // bushes
  for (const bx of [60, 470, 760, 1120]) st += `<path d="M${bx - 70} 560 Q${bx - 80} 520 ${bx - 40} 518 Q${bx - 30} 490 ${bx} 500 Q${bx + 30} 486 ${bx + 44} 516 Q${bx + 80} 516 ${bx + 74} 560 Z" fill="#3E9B4A" stroke="${BG_LINE}" stroke-width="3"/><path d="M${bx - 10} 560 Q${bx + 10} 520 ${bx + 50} 528 Q${bx + 70} 540 ${bx + 70} 560 Z" fill="#2E7D3A"/>`;
  // sidewalk slabs, kerb, road
  st += `<rect y="560" width="1280" height="44" fill="#CFCBC4" stroke="${BG_LINE}" stroke-width="2.5"/>`;
  for (let x = 0; x < 1280; x += 130) st += `<path d="M${x} 560 V604" stroke="#A9A49C" stroke-width="2"/>`;
  st += `<rect y="600" width="1280" height="12" fill="#A9A59E"/><rect y="600" width="1280" height="3" fill="#E4E0D9"/>`;
  st += `<rect y="612" width="1280" height="108" fill="#86868F"/><rect y="612" width="1280" height="20" fill="#000" opacity="0.08"/>`;
  save('street', svg(1280, 720, st));
}

// The dining room: striped wallpaper + table (table is a separate layer).
let room = '';
const stripeCols = ['#9A9442', '#BDB461', '#8C7E3E', '#B3AB5B'];
for (let sx = 0, i = 0; sx < 1280; i++) {
  const sw = i % 2 ? 70 : 100;
  room += `<rect x="${sx}" y="0" width="${sw}" height="720" fill="${stripeCols[i % 4]}"/>`;
  sx += sw;
}
// the short's room lighting: the left of the wall falls into a big warm shadow,
// with a soft pool of lamp light on the right
room += `<path d="M0 0 L560 0 Q330 160 300 430 L0 430 Z" fill="#5A3210" opacity="0.32"/>
  <path d="M560 0 Q330 160 300 430" stroke="#5A3210" stroke-width="40" opacity="0.08" fill="none"/>
  <ellipse cx="820" cy="380" rx="560" ry="420" fill="#FFF2C0" opacity="0.10"/>`;
room += `<defs><radialGradient id="v" cx="0.5" cy="0.35" r="0.8"><stop offset="0.4" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.45"/></radialGradient></defs>
  <rect y="430" width="1280" height="290" fill="#7E8466" stroke="${INK}" stroke-width="5"/>
  <rect x="140" y="90" width="150" height="120" fill="#6B4A2A" stroke="${INK}" stroke-width="6"/><rect x="158" y="108" width="114" height="84" fill="#9FB5C9"/>
  <circle cx="215" cy="146" r="22" fill="${SKIN}" stroke="${INK}" stroke-width="4"/>
  <rect width="1280" height="720" fill="url(#v)"/>`;
save('room', svg(1280, 720, room));
save('table', svg(1280, 260, `<path d="M20 60 Q640 -20 1260 60 L1240 150 Q640 210 40 150 Z" fill="#B9B4A2" stroke="${INK}" stroke-width="7" stroke-linejoin="round"/>
  <path d="M40 150 L40 260 M1240 150 L1240 260" stroke="${INK}" stroke-width="10"/>
  <path d="M200 80 Q640 40 1080 80" stroke="#fff" stroke-width="4" opacity="0.3" fill="none"/>
  <path d="M40 150 Q640 210 1240 150 L1236 136 Q640 196 44 136 Z" fill="#000" opacity="0.18"/>
  <path d="M20 60 L60 60 L60 150 L40 150 Z" fill="#000" opacity="0.12"/>`));



console.log('art written to', OUT);
