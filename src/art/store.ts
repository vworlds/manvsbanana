import Phaser from 'phaser';
import { SHOUT, TALK } from '../fonts';

// Stores are drawn in-game from a style, so every visit can look different.
// The first one copies the store from the short: a long green "GROCERY MART"
// with a boxed sign and FOOD / PHARMACY on either side.

export type Roof = 'flat' | 'gable' | 'false-front' | 'awning' | 'arch';
export type SignStyle = 'panel' | 'band' | 'rooftop' | 'round';

export interface StoreStyle {
  name: string;
  body: number;
  trim: number;
  roof: Roof;
  roofColor: number;
  sign: SignStyle;
  signBg: number;
  signText: string;
  font: string;
  width: number;
  height: number;
  door: 'center' | 'left' | 'right';
  labels: [string, string] | null;
  awning: [number, number];
}

const INK = 0x141414;
const GROUND = 540;

/** The store from the video. */
export function videoStore(): StoreStyle {
  return {
    name: 'GROCERY MART',
    body: 0x3daa4a,
    trim: 0x9aa0a8,
    roof: 'flat',
    roofColor: 0xb8bcc4,
    sign: 'panel',
    signBg: 0xb9b9b4,
    signText: '#8E1B1B',
    font: TALK,
    width: 1000,
    height: 250,
    door: 'center',
    labels: ['FOOD', 'PHARMACY'],
    awning: [0xffffff, 0xd3202a],
  };
}

const BODIES = [0x3daa4a, 0xe7c35a, 0xd96b4a, 0x6fa8dc, 0xb07cd8, 0xe8e2d2, 0xf28ab2, 0x7fc8a9, 0xf2994a, 0x9aa7b5];
const ROOFS = [0x8a3b2a, 0x3e4a5c, 0x6b6f78, 0x2e6b3a, 0x7a4a26];
const SIGNS = [0xd3202a, 0x1f8fd6, 0xf7d93a, 0x141414, 0xffffff, 0x2eaa3a, 0xe8457a];
const LABELS = ['FOOD', 'PHARMACY', 'DELI', 'BAKERY', 'PRODUCE', 'OPEN 24H', 'FRUIT', 'DAIRY', 'LIQUOR', 'FLOWERS', 'ATM', 'LOTTO'];
const FONTS = [SHOUT, TALK, 'Georgia, serif', 'Courier New, monospace', 'Impact, sans-serif'];

const pick = <T,>(a: readonly T[], r: () => number) => a[Math.floor(r() * a.length) % a.length];

export function randomStore(name: string, r: () => number = Math.random): StoreStyle {
  const signBg = pick(SIGNS, r);
  const dark = signBg === 0x141414 || signBg === 0xd3202a || signBg === 0x1f8fd6 || signBg === 0x2eaa3a || signBg === 0xe8457a;
  const l1 = pick(LABELS, r);
  let l2 = pick(LABELS, r);
  if (l2 === l1) l2 = 'FRUIT';
  return {
    name,
    body: pick(BODIES, r),
    trim: pick([0xffffff, 0x9aa0a8, 0x5e4a3a, 0x2b2b2b], r),
    roof: pick(['flat', 'gable', 'false-front', 'awning', 'arch'] as const, r),
    roofColor: pick(ROOFS, r),
    sign: pick(['panel', 'band', 'rooftop', 'round'] as const, r),
    signBg,
    signText: dark ? '#FFFFFF' : '#141414',
    font: pick(FONTS, r),
    width: 700 + Math.floor(r() * 380),
    height: 210 + Math.floor(r() * 120),
    door: pick(['center', 'left', 'right'] as const, r),
    labels: r() < 0.6 ? [l1, l2] : null,
    awning: [0xffffff, pick([0xd3202a, 0x2eaa3a, 0x1f8fd6, 0xf2994a], r)],
  };
}

/** Draws the store front, parking lot and parked cars. Returns the container (behind the player's car). */
export function drawStore(scene: Phaser.Scene, s: StoreStyle, parkedCars = 5): Phaser.GameObjects.Container {
  const c = scene.add.container(0, 0);
  const W = 1280;
  // sky, city, lot
  c.add(scene.add.rectangle(0, 0, W, 720, 0x9fd5f2).setOrigin(0));
  c.add(scene.add.tileSprite(0, GROUND - 330, W, 260, 'skyline').setOrigin(0).setAlpha(0.9));
  c.add(scene.add.rectangle(0, GROUND, W, 720 - GROUND, 0x8e8e96).setOrigin(0));
  const g = scene.add.graphics();
  c.add(g);
  const x0 = W / 2 - s.width / 2;
  const top = GROUND - s.height;

  // roof shapes behind/above the facade
  g.lineStyle(6, INK);
  if (s.roof === 'gable') {
    g.fillStyle(s.roofColor).fillTriangle(x0 - 30, top + 4, W / 2, top - s.height * 0.45, x0 + s.width + 30, top + 4);
    g.strokeTriangle(x0 - 30, top + 4, W / 2, top - s.height * 0.45, x0 + s.width + 30, top + 4);
  } else if (s.roof === 'false-front') {
    const fw = s.width * 0.5;
    g.fillStyle(s.body).fillRect(W / 2 - fw / 2, top - 70, fw, 80).strokeRect(W / 2 - fw / 2, top - 70, fw, 80);
    g.fillStyle(s.trim).fillRect(W / 2 - fw / 2 - 10, top - 82, fw + 20, 16).strokeRect(W / 2 - fw / 2 - 10, top - 82, fw + 20, 16);
  } else if (s.roof === 'arch') {
    g.fillStyle(s.body).fillCircle(W / 2, top + 10, s.width * 0.18).strokeCircle(W / 2, top + 10, s.width * 0.18);
  }
  // facade
  g.fillStyle(s.body).fillRect(x0, top, s.width, s.height).strokeRect(x0, top, s.width, s.height);
  if (s.roof === 'flat' || s.roof === 'awning' || s.roof === 'arch') {
    g.fillStyle(s.roof === 'flat' ? s.roofColor : s.trim).fillRect(x0 - 16, top - 18, s.width + 32, 22).strokeRect(x0 - 16, top - 18, s.width + 32, 22);
  }
  // shop windows + door
  const winTop = GROUND - 120;
  const doorW = 110;
  const doorX = s.door === 'center' ? W / 2 - doorW / 2 : s.door === 'left' ? x0 + 60 : x0 + s.width - 60 - doorW;
  g.fillStyle(0x9fd8f7).fillRect(x0 + 24, winTop, s.width - 48, 110).strokeRect(x0 + 24, winTop, s.width - 48, 110);
  g.lineStyle(4, s.trim);
  for (let x = x0 + 24 + 90; x < x0 + s.width - 30; x += 90) g.lineBetween(x, winTop + 3, x, winTop + 107);
  g.lineStyle(6, INK);
  g.fillStyle(0x6fb0d6).fillRect(doorX, winTop - 10, doorW, 130).strokeRect(doorX, winTop - 10, doorW, 130);
  g.lineBetween(doorX + doorW / 2, winTop - 10, doorX + doorW / 2, GROUND);
  g.lineStyle(5, 0xffffff, 0.6);
  for (let x = x0 + 60; x < x0 + s.width - 40; x += 140) g.lineBetween(x, winTop + 80, x + 40, winTop + 20);
  // awning over the windows
  if (s.roof === 'awning') {
    const aw = s.width - 20;
    const ax = x0 + 10;
    const ay = winTop - 46;
    const n = Math.floor(aw / 50);
    for (let i = 0; i < n; i++) {
      g.fillStyle(s.awning[i % 2]).fillRect(ax + i * (aw / n), ay, aw / n, 34);
      g.fillStyle(s.awning[i % 2]).fillCircle(ax + i * (aw / n) + aw / n / 2, ay + 34, aw / n / 2);
    }
    g.lineStyle(5, INK).strokeRect(ax, ay, aw, 34);
  }

  // the sign
  const signY = s.roof === 'false-front' ? top - 30 : s.roof === 'gable' ? top + 50 : top + (winTop - 46 - top) / 2;
  let maxW = s.width * 0.55;
  if (s.sign === 'panel') {
    const pw = Math.min(s.width * 0.34, 340);
    const ph = 100;
    g.lineStyle(6, INK).fillStyle(s.signBg).fillRect(W / 2 - pw / 2, signY - ph / 2, pw, ph).strokeRect(W / 2 - pw / 2, signY - ph / 2, pw, ph);
    g.lineStyle(4, 0x8e1b1b).strokeRect(W / 2 - pw / 2 + 8, signY - ph / 2 + 8, pw - 16, ph - 16);
    maxW = pw - 30;
  } else if (s.sign === 'band') {
    g.lineStyle(6, INK).fillStyle(s.signBg).fillRect(x0 + 10, signY - 40, s.width - 20, 80).strokeRect(x0 + 10, signY - 40, s.width - 20, 80);
    maxW = s.width - 60;
  } else if (s.sign === 'round') {
    g.lineStyle(6, INK).fillStyle(s.signBg).fillCircle(W / 2, signY, 70).strokeCircle(W / 2, signY, 70);
    maxW = 120;
  }
  const rooftop = s.sign === 'rooftop';
  const ty = rooftop ? (s.roof === 'gable' ? top - s.height * 0.45 - 40 : top - 70) : signY;
  if (rooftop) {
    g.lineStyle(5, INK);
    for (const dx of [-0.3, 0, 0.3]) g.lineBetween(W / 2 + dx * s.width * 0.5, ty + 20, W / 2 + dx * s.width * 0.5, ty + 70);
  }
  const words = s.sign === 'panel' || s.sign === 'round' ? s.name.replace(' ', '\n') : s.name;
  const t = scene.add
    .text(W / 2, ty, words, {
      fontFamily: s.font,
      fontStyle: s.font === TALK ? '900' : 'bold',
      fontSize: '64px',
      // rooftop letters use the sign colour (white if that colour is black)
      color: rooftop ? (s.signBg === 0x141414 ? '#FFFFFF' : '#' + s.signBg.toString(16).padStart(6, '0')) : s.signText,
      stroke: rooftop || s.signText === '#FFFFFF' ? '#141414' : undefined,
      strokeThickness: rooftop || s.signText === '#FFFFFF' ? 8 : 0,
      align: 'center',
      lineSpacing: -8,
    })
    .setOrigin(0.5);
  const sc = Math.min(1, (rooftop ? s.width * 0.8 : maxW) / t.width, (s.sign === 'round' ? 110 : s.sign === 'panel' ? 80 : 70) / t.height);
  t.setScale(sc);
  c.add(t);
  // side labels, like FOOD / PHARMACY in the short
  if (s.labels && s.sign !== 'band') {
    for (const [i, label] of s.labels.entries()) {
      const lx = W / 2 + (i === 0 ? -1 : 1) * s.width * 0.33;
      c.add(
        scene.add
          .text(lx, signY, label, { fontFamily: TALK, fontStyle: '900', fontSize: '26px', color: s.signText === '#FFFFFF' ? '#ffffff' : '#8E1B1B', stroke: '#141414', strokeThickness: s.signText === '#FFFFFF' ? 4 : 0 })
          .setOrigin(0.5),
      );
    }
  }

  // parking lot lines and parked cars
  const lot = scene.add.graphics();
  lot.lineStyle(6, 0xffffff, 0.9);
  for (let x = 40; x < W; x += 170) lot.lineBetween(x, GROUND + 12, x - 40, GROUND + 70);
  c.add(lot);
  const tints = [0xd3202a, 0x2eaa3a, 0xe9e9ee, 0x6fa8dc, 0xf2c12e, 0x9b6bd6, 0x555566];
  const slots = Phaser.Utils.Array.Shuffle([60, 230, 400, 870, 1040, 1210]).slice(0, parkedCars);
  for (const x of slots) {
    const car = scene.add.container(x + 40, GROUND + 66).setScale(0.42);
    car.add(scene.add.image(0, 0, 'car_parked').setOrigin(0.5, 1).setTint(tints[Math.floor(Math.random() * tints.length)]));
    car.add([scene.add.image(84 - 190, -34, 'wheel'), scene.add.image(300 - 190, -34, 'wheel')]);
    if (Math.random() < 0.5) car.setScale(-0.42, 0.42); // some parked facing the other way
    c.add(car);
  }
  return c;
}
