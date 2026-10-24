// Generates every SVG asset in public/assets. Run with `npm run art`.
// Style: flat colours, thick black outlines, round stick-figure heads.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'assets');
mkdirSync(OUT, { recursive: true });

const INK = '#141414';
const SKIN = '#F7C796';
const HAIR_MAN = '#4B362B';
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
const headCircle = (fill = SKIN) => `<circle cx="100" cy="100" r="90" fill="${fill}"/>`;
const headOutline = `<circle cx="100" cy="100" r="90" fill="none" stroke="${INK}" stroke-width="${W}"/>`;
const clip = `<defs><clipPath id="hc"><circle cx="100" cy="100" r="90"/></clipPath></defs>`;

// The man (from man.png): bald top, short dark hair on the sides, a few
// sad strands on top, forehead shine.
const manHair = `
  <g clip-path="url(#hc)" stroke="${HAIR_MAN}" stroke-linecap="round" fill="none">
    <path d="${arcPath(100, 100, 84, 172, 218)}" stroke-width="22"/>
    <path d="${arcPath(100, 100, 84, -38, 8)}" stroke-width="22"/>
  </g>
  <g stroke="${HAIR_MAN}" stroke-width="2.2" fill="none" stroke-linecap="round" opacity="0.55">
    <path d="M80 22 q14 -8 30 2"/><path d="M86 28 q12 -7 26 1"/><path d="M93 19 q9 -5 18 1"/>
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
const dot = (x, y, r = 8.5) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${INK}"/>`;
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
const tie = `<path d="M100 8 L92 18 L98 24 L92 80 L100 92 L108 80 L102 24 L108 18 Z" fill="${INK}"/>
  <path d="M80 6 L96 26 M120 6 L104 26" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>
  <path d="M76 60 q-6 8 0 16 M124 60 q6 8 0 16" stroke="#bbb" stroke-width="3" fill="none"/>`;
save('body_man', svg(200, 220, legs(108, 214) + torso('#FFFFFF') + tie));
save('body_kid', svg(200, 220, legs(84, 160, 12) + torso('#D8401F', 88, 54, 66)));
save('body_wife', svg(200, 220, legs(110, 214) + torso('#9B6BD6', 112, 60, 92)));

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
const carBodyPath = `M12 96 Q12 72 40 70 L80 66 L114 22 Q120 14 132 14 L206 14 Q216 14 222 22 L262 64 L340 70 Q370 74 372 100 L372 132 Q372 146 356 146 L26 146 Q10 146 10 132 Z`;
const winFront = `M170 24 L204 24 Q210 24 214 30 L244 62 L170 62 Z`;
const winBack = `M160 24 L160 62 L100 62 L126 28 Q128 24 134 24 Z`;
const wheel = svg(72, 72, `<circle cx="36" cy="36" r="31" fill="#2A2A33" stroke="${INK}" stroke-width="6"/>
  <circle cx="36" cy="36" r="15" fill="#C9CCD6" stroke="${INK}" stroke-width="4"/>
  <path d="M36 22 L36 50 M22 36 L50 36" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>
  <path d="M14 30 A23 23 0 0 1 30 14" stroke="#55556A" stroke-width="4" fill="none" stroke-linecap="round"/>`);
save('wheel', wheel);
const carDetails = (color) => `
  <path d="M14 108 L370 108" stroke="${INK}" stroke-width="3" opacity="0.35"/>
  <path d="M268 72 Q320 76 362 84" stroke="${INK}" stroke-width="3" opacity="0.35" fill="none"/>
  <path d="M344 82 L368 86 L368 100 L346 98 Z" fill="#FFE97A" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
  <rect x="10" y="78" width="12" height="18" rx="3" fill="#E33" stroke="${INK}" stroke-width="4"/>
  <rect x="332" y="118" width="44" height="16" rx="6" fill="#B8BBC6" stroke="${INK}" stroke-width="4"/>
  <rect x="6" y="118" width="34" height="16" rx="6" fill="#B8BBC6" stroke="${INK}" stroke-width="4"/>
  <path d="M248 56 L262 52 L264 64 L250 66 Z" fill="${color}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
  <path d="M196 78 L216 78 M126 78 L146 78" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>
  <path d="M165 18 L165 140" stroke="${INK}" stroke-width="4" opacity="0.5"/>
  <path d="M40 74 Q200 64 350 76" stroke="#fff" stroke-width="4" opacity="0.25" fill="none"/>
  <path d="M84 146 m-40 0 a40 40 0 0 1 80 0 M300 146 m-40 0 a40 40 0 0 1 80 0" fill="#1A1A22" stroke="${INK}" stroke-width="5"/>`;
const carFront = (color) => svg(380, 180, `
  <path d="${carBodyPath} ${winFront} ${winBack}" fill="${color}" fill-rule="evenodd" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>
  <path d="${winFront} ${winBack}" fill="none" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>
  ${carDetails(color)}`);
const carGlass = svg(380, 180, `<path d="${winFront} ${winBack}" fill="#BFE6FF" opacity="0.28"/><path d="M222 32 l-16 26 M236 40 l-12 20" stroke="#fff" stroke-width="5" opacity="0.5"/>`);
const carBack = svg(380, 180, `<path d="${winFront} ${winBack}" fill="#3E3E52"/><path d="M160 30 L160 62 L140 62 L146 30 Z" fill="#55556E"/><circle cx="236" cy="62" r="16" fill="none" stroke="#222" stroke-width="7"/>`);
save('car_front', carFront('#4B49C8'));
save('car_glass', carGlass);
save('car_back', carBack);

// NPC cars: body + interior + simple driver baked in (wheels added in-game).
const npcHead = (hair, skin = SKIN, extra = '') => `<g transform="translate(-44,0)">
  <circle cx="246" cy="54" r="30" fill="${skin}" stroke="${INK}" stroke-width="5"/>
  ${hair}
  <circle cx="254" cy="52" r="3.5" fill="${INK}"/><circle cx="266" cy="52" r="3.5" fill="${INK}"/>
  <path d="M254 66 L266 66" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>${extra}</g>`;
const npcCar = (color, head, extra = '') => svg(380, 180, `
  <path d="${winFront} ${winBack}" fill="#3E3E52"/>
  ${head}
  <path d="${carBodyPath} ${winFront} ${winBack}" fill="${color}" fill-rule="evenodd" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>
  <path d="${winFront} ${winBack}" fill="#BFE6FF" opacity="0.28" stroke="${INK}" stroke-width="5"/>
  ${carDetails(color)}${extra}`);
save('car_green', npcCar('#2EAA3A', npcHead(`<path d="M218 46 Q230 18 260 26" stroke="#2b1d16" stroke-width="10" fill="none" stroke-linecap="round"/>`)));
save('car_red', npcCar('#E8501E', npcHead(
  `<circle cx="236" cy="30" r="14" fill="#C9C9D2" stroke="${INK}" stroke-width="4"/><circle cx="222" cy="44" r="12" fill="#C9C9D2" stroke="${INK}" stroke-width="4"/>`,
  '#F2CDA8',
  `<circle cx="254" cy="52" r="8" fill="none" stroke="#E04BA0" stroke-width="3"/><circle cx="268" cy="52" r="8" fill="none" stroke="#E04BA0" stroke-width="3"/>`)));
save('car_taxi', npcCar('#F2C12E', npcHead(`<path d="M218 40 Q240 18 270 34" stroke="#111" stroke-width="10" fill="none" stroke-linecap="round"/>`, '#8D5524'),
  `<rect x="146" y="0" width="44" height="14" rx="3" fill="#fff" stroke="${INK}" stroke-width="4"/><text x="168" y="11" font-family="Arial" font-weight="900" font-size="10" text-anchor="middle" fill="#111">TAXI</text>
   <path d="M30 100 h320" stroke="#111" stroke-width="8" stroke-dasharray="12 12"/>`));
save('car_white', npcCar('#E9E9EE', npcHead(`<path d="M220 40 Q244 14 274 36" stroke="#9A5A2B" stroke-width="12" fill="none" stroke-linecap="round"/>`, '#C68B59')));

// Police car: white with black doors, POLICE on the side, a cop with a hat. Light bar lamps are drawn in-game.
save('car_police', npcCar('#F4F4F8', npcHead(
  `<path d="M214 34 L278 34 L270 18 L222 18 Z" fill="#1B2A55" stroke="${INK}" stroke-width="4"/><rect x="238" y="22" width="16" height="8" fill="#E0B400"/>`, '#C68B59'),
  `<path d="M100 76 L242 76 L242 140 L100 140 Z" fill="#1B2A55" stroke="${INK}" stroke-width="4"/>
   <text x="171" y="118" text-anchor="middle" font-family="Arial Black,Arial" font-weight="900" font-size="26" fill="#fff">POLICE</text>
   <rect x="136" y="2" width="70" height="14" rx="4" fill="#666" stroke="${INK}" stroke-width="4"/>`));

// Traffic signal on the kerb with an arm over the road; lamp colours drawn in-game.
save('signal', svg(220, 360, `<rect x="14" y="40" width="16" height="320" fill="#555" stroke="${INK}" stroke-width="4"/>
  <rect x="14" y="30" width="170" height="14" fill="#555" stroke="${INK}" stroke-width="4"/>
  <rect x="160" y="10" width="50" height="130" rx="10" fill="#2B2B22" stroke="${INK}" stroke-width="5"/>
  <circle cx="185" cy="38" r="15" fill="#4A2222"/><circle cx="185" cy="75" r="15" fill="#4A4422"/><circle cx="185" cy="112" r="15" fill="#224A22"/>`));
save('cone', svg(50, 60, `<path d="M25 4 L44 54 L6 54 Z" fill="#FF7A1A" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
  <path d="M17 26 L33 26 M12 40 L38 40" stroke="#fff" stroke-width="6"/><rect x="2" y="52" width="46" height="7" rx="2" fill="#333"/>`));
save('barrier', svg(150, 130, `<rect x="16" y="60" width="8" height="66" fill="#555"/><rect x="126" y="60" width="8" height="66" fill="#555"/>
  <rect x="4" y="54" width="142" height="30" fill="#fff" stroke="${INK}" stroke-width="4"/>
  <path d="M10 84 L34 54 M40 84 L64 54 M70 84 L94 54 M100 84 L124 54 M130 84 L146 64" stroke="#FF7A1A" stroke-width="12"/>
  <rect x="4" y="54" width="142" height="30" fill="none" stroke="${INK}" stroke-width="4"/>
  <path d="M75 2 L120 46 L75 50 L30 46 Z" fill="#F7B500" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
  <text x="75" y="38" text-anchor="middle" font-family="Arial Black,Arial" font-weight="900" font-size="11" fill="#141414">ROAD</text>
  <text x="75" y="48" text-anchor="middle" font-family="Arial Black,Arial" font-weight="900" font-size="9" fill="#141414">WORK</text>`));
save('stopline', svg(24, 280, `<rect x="2" y="0" width="20" height="280" fill="#fff" opacity="0.95"/>`));

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
const SKINS = ['#F7C796', '#C68B59', '#8D5524', '#F1D2B6', '#E0A878'];
const SHIRTS = ['#E8501E', '#2EAA3A', '#F2C12E', '#3C7DD9', '#D9428B', '#18A3A3'];
const HAIRS = ['', `<path d="M22 30 Q50 0 78 30" stroke="#2b1d16" stroke-width="12" fill="none" stroke-linecap="round"/>`,
  `<path d="M18 40 Q20 4 50 4 Q80 4 82 40 L72 26 L28 26 Z" fill="#F6D70E" stroke="${INK}" stroke-width="4"/>`,
  `<path d="M20 34 Q50 -4 80 34" stroke="#111" stroke-width="14" fill="none"/>`];
for (let i = 0; i < 6; i++) {
  const skin = SKINS[i % SKINS.length];
  const shirt = SHIRTS[i];
  const hair = HAIRS[i % HAIRS.length];
  save(`ped_${i}`, svg(100, 190, `
    <path d="M40 120 L32 186 M60 120 L68 186" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>
    <path d="M36 72 L20 118 M64 72 L80 118" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>
    <path d="M34 70 L66 70 L70 124 L30 124 Z" fill="${shirt}" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>
    <circle cx="50" cy="40" r="34" fill="${skin}" stroke="${INK}" stroke-width="5"/>
    ${hair}
    <circle cx="40" cy="42" r="4" fill="${INK}"/><circle cx="60" cy="42" r="4" fill="${INK}"/>
    <path d="M42 58 L58 58" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`));
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
save('burst_yellow', svg(1280, 720, `<defs><radialGradient id="g"><stop offset="0" stop-color="#fff" stop-opacity="0.95"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>
  ${rays(640, 360, 28, '#F9E25A', '#E9B812', 1280, 720)}<circle cx="640" cy="360" r="360" fill="url(#g)"/>`));
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

// Row houses for the arrival shot.
const house = (hx, color, door) => `
  <rect x="${hx}" y="140" width="300" height="420" fill="${color}" stroke="${INK}" stroke-width="6"/>
  <rect x="${hx}" y="120" width="300" height="30" fill="#CFC6B0" stroke="${INK}" stroke-width="6"/>
  <rect x="${hx + 30}" y="200" width="90" height="110" fill="#BFE6FF" stroke="${INK}" stroke-width="6"/><path d="M${hx + 75} 200 L${hx + 75} 310 M${hx + 30} 255 L${hx + 120} 255" stroke="#fff" stroke-width="6"/>
  <rect x="${hx + 180}" y="200" width="90" height="110" fill="#BFE6FF" stroke="${INK}" stroke-width="6"/><path d="M${hx + 225} 200 L${hx + 225} 310 M${hx + 180} 255 L${hx + 270} 255" stroke="#fff" stroke-width="6"/>
  ${door ? `<rect x="${hx + 110}" y="380" width="80" height="140" fill="#8A5A3A" stroke="${INK}" stroke-width="6"/><circle cx="${hx + 176}" cy="452" r="6" fill="#E0B400"/>
  <path d="M${hx + 90} 520 L${hx + 210} 520 L${hx + 220} 540 L${hx + 80} 540 Z M${hx + 70} 540 L${hx + 230} 540 L${hx + 240} 560 L${hx + 60} 560 Z" fill="#B9B3A6" stroke="${INK}" stroke-width="5"/>`
    : `<rect x="${hx + 30}" y="380" width="90" height="110" fill="#BFE6FF" stroke="${INK}" stroke-width="6"/><rect x="${hx + 180}" y="380" width="90" height="110" fill="#BFE6FF" stroke="${INK}" stroke-width="6"/>`}`;
// Single house for the finish line in the runner.
save('house', svg(320, 520, `<path d="M0 104 L160 6 L320 104 Z" fill="#A0412D" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>
  <g transform="translate(10,-50)">${house(0, '#C9B25A', true)}</g>`));
save('street', svg(1280, 720, `<rect width="1280" height="720" fill="#9FD5F2"/>
  ${house(-40, '#E7C35A', false)}${house(262, '#C9B25A', true)}${house(564, '#6FA8DC', false)}${house(866, '#E7C35A', true)}${house(1168, '#D98C6A', false)}
  <rect y="560" width="1280" height="40" fill="#C9C9CF" stroke="${INK}" stroke-width="5"/><rect y="600" width="1280" height="120" fill="#8E8E96"/>
  <path d="M0 600 L1280 600" stroke="${INK}" stroke-width="6"/>`));

// The dining room: striped wallpaper + table (table is a separate layer).
let room = '';
const stripeCols = ['#9A9442', '#BDB461', '#8C7E3E', '#B3AB5B'];
for (let sx = 0, i = 0; sx < 1280; i++) {
  const sw = i % 2 ? 70 : 100;
  room += `<rect x="${sx}" y="0" width="${sw}" height="720" fill="${stripeCols[i % 4]}"/>`;
  sx += sw;
}
room += `<defs><radialGradient id="v" cx="0.5" cy="0.35" r="0.8"><stop offset="0.4" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.45"/></radialGradient></defs>
  <rect y="430" width="1280" height="290" fill="#7E8466" stroke="${INK}" stroke-width="5"/>
  <rect x="140" y="90" width="150" height="120" fill="#6B4A2A" stroke="${INK}" stroke-width="6"/><rect x="158" y="108" width="114" height="84" fill="#9FB5C9"/>
  <circle cx="215" cy="146" r="22" fill="${SKIN}" stroke="${INK}" stroke-width="4"/>
  <rect width="1280" height="720" fill="url(#v)"/>`;
save('room', svg(1280, 720, room));
save('table', svg(1280, 260, `<path d="M20 60 Q640 -20 1260 60 L1240 150 Q640 210 40 150 Z" fill="#B9B4A2" stroke="${INK}" stroke-width="7" stroke-linejoin="round"/>
  <path d="M40 150 L40 260 M1240 150 L1240 260" stroke="${INK}" stroke-width="10"/>
  <path d="M200 80 Q640 40 1080 80" stroke="#fff" stroke-width="4" opacity="0.3" fill="none"/>`));



console.log('art written to', OUT);
