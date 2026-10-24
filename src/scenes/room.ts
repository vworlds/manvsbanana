import Phaser from 'phaser';
import { Person } from '../art/Person';
import { makeCar } from '../art/car';
import { tweenP, wait } from './common';
import { debug } from '../state/GameState';
import { homeLine } from '../logic/lines';
import { bubble, bubbleSize, type BubbleOpts } from '../fx/Bubble';
import { speak } from '../audio/sfx';
import { sfx } from '../audio/sfx';

export const W = 1280;
export const H = 720;

export interface Room {
  world: Phaser.GameObjects.Layer;
  ui: Phaser.GameObjects.Layer;
  uiCam: Phaser.Cameras.Scene2D.Camera;
  dad: Person;
  kid: Person;
  wife: Person;
  baby: Phaser.GameObjects.Image;
  bag: Phaser.GameObjects.Image;
  bananas: Phaser.GameObjects.Image;
  table: Phaser.GameObjects.Image;
  flies: Phaser.GameObjects.Image[];
}

export const SPOTS = { dad: { x: 250, y: 290 }, kid: { x: 720, y: 380 }, wife: { x: 960, y: 290 }, baby: { x: 1030, y: 470 }, bag: { x: 480, y: 540 } };

/** The dining room from the short: striped wallpaper, family behind the table, rotten bananas in the bag. */
export function buildRoom(scene: Phaser.Scene): Room {
  const world = scene.add.layer();
  const ui = scene.add.layer().setDepth(10000);
  const uiCam = scene.cameras.add(0, 0, W, H);
  scene.cameras.main.ignore(ui);
  uiCam.ignore(world);

  world.add(scene.add.image(W / 2, H / 2, 'room'));
  const dad = new Person(scene, SPOTS.dad.x, SPOTS.dad.y, 'man').setScale(0.95).setFace('worried', 'grit');
  const kid = new Person(scene, SPOTS.kid.x, SPOTS.kid.y, 'kid').setScale(0.72).setFace('neutral', 'flat');
  const wife = new Person(scene, SPOTS.wife.x, SPOTS.wife.y, 'wife').setScale(0.95).setFace('shut', 'flat').setPose('hold');
  const baby = scene.add.image(SPOTS.baby.x, SPOTS.baby.y, 'baby_calm').setScale(0.42);
  const table = scene.add.image(W / 2, 470, 'table').setOrigin(0.5, 0);
  const bananas = scene.add.image(SPOTS.bag.x - 30, SPOTS.bag.y - 190, 'banana_brown').setScale(0.6).setAngle(-20);
  const bag = scene.add.image(SPOTS.bag.x, SPOTS.bag.y, 'bag').setOrigin(0.5, 1).setScale(0.8);
  world.add([dad, kid, wife, baby, table, bananas, bag]);
  for (const p of [kid, wife]) p.idle(3, 500 + Math.random() * 300);
  scene.tweens.add({ targets: baby, angle: { from: -4, to: 4 }, duration: 500, yoyo: true, repeat: -1 });

  const flies: Phaser.GameObjects.Image[] = [];
  return { world, ui, uiCam, dad, kid, wife, baby, bag, bananas, table, flies };
}

export function addFlies(scene: Phaser.Scene, r: Room, n = 4) {
  for (let i = 0; i < n; i++) {
    const f = scene.add.image(SPOTS.bag.x, SPOTS.bag.y - 220, 'fly').setScale(0.8);
    r.world.add(f);
    r.flies.push(f);
    const loop = () => {
      if (!f.active) return;
      scene.tweens.add({
        targets: f,
        x: SPOTS.bag.x + Phaser.Math.Between(-90, 90),
        y: SPOTS.bag.y - Phaser.Math.Between(170, 290),
        duration: Phaser.Math.Between(200, 450),
        ease: 'Sine.inOut',
        onComplete: loop,
      });
    };
    loop();
  }
}

export type Who = 'man' | 'kid' | 'wife' | 'baby';

/** Speech bubble above a character, added to the world layer so it zooms with the camera. */
export function sayAt(scene: Phaser.Scene, r: Room, who: Who, target: { x: number; y: number }, text: string, o: BubbleOpts & { dy?: number } = {}) {
  const cam = scene.cameras.main;
  const z = cam.zoom;
  // visible world rect (computed from scroll, since worldView only refreshes on render)
  const vw = W / z;
  const vh = H / z;
  const vx = cam.scrollX + W / 2 - vw / 2;
  const vy = cam.scrollY + H / 2 - vh / 2;
  const sc = 1 / z;
  let x = target.x + (target.x > vx + vw / 2 ? -60 : 60) * sc;
  let y = target.y - (o.dy ?? 170) * Math.max(sc, 0.75);
  const b = bubble(scene, x, y, text, { tailX: target.x, tailY: target.y - 60 * sc, width: 420, ...o, scale: sc });
  const { w, h } = bubbleSize(b);
  const m = 16 * sc;
  x = Phaser.Math.Clamp(x, vx + (w / 2) * sc + m, vx + vw - (w / 2) * sc - m);
  y = Phaser.Math.Clamp(y, vy + (h / 2) * sc + m + 20 * sc, vy + vh - (h / 2) * sc - m);
  b.destroy();
  const b2 = bubble(scene, x, y, text, { tailX: target.x, tailY: target.y - 60 * sc, width: 420, ...o, scale: sc });
  r.world.add(b2);
  speak(text, who);
  sfx.blip();
  return b2;
}

/** Hard cut: instantly frame a point at a zoom level, like the short's editing. */
export function cut(scene: Phaser.Scene, x: number, y: number, zoom: number) {
  const cam = scene.cameras.main;
  cam.setZoom(zoom);
  cam.centerOn(x, y);
}

export type ParkCrash = 'trash' | 'lady' | 'kid' | 'tree' | 'parked';
const CRASHES: ParkCrash[] = ['trash', 'lady', 'kid', 'tree', 'parked'];
const PARKED_TINTS = [0xd3202a, 0x2eaa3a, 0xe9e9ee, 0x6fa8dc, 0xf2c12e, 0x9b6bd6, 0x555566, 0xf28ab2];

/**
 * The car screeches up outside the house and parks... badly. The street always
 * has a tree, a neighbour's parked car and a bin; one random thing gets hit:
 * the bin, an old lady, a kid on a bike, the tree, or the neighbour's car.
 */
export async function crashPark(scene: Phaser.Scene, stage: string, which: ParkCrash = (debug.park as ParkCrash) || CRASHES[Math.floor(Math.random() * CRASHES.length)]) {
  const objs: Phaser.GameObjects.GameObject[] = [];
  const keep = <T extends Phaser.GameObjects.GameObject>(o: T) => (objs.push(o), o);
  keep(scene.add.image(W / 2, H / 2, 'street'));
  const tree = keep(scene.add.image(1030, 604, 'tree').setOrigin(0.5, 1).setScale(0.62));
  const parked = keep(scene.add.container(1185, 705).setScale(-0.62, 0.62));
  parked.add(scene.add.image(0, 0, 'car_parked').setOrigin(0.5, 1).setTint(PARKED_TINTS[Math.floor(Math.random() * PARKED_TINTS.length)]));
  parked.add([scene.add.image(84 - 190, -34, 'wheel'), scene.add.image(300 - 190, -34, 'wheel')]);
  const trash = keep(scene.add.image(865, 606, 'trash').setOrigin(0.5, 1).setScale(0.8));
  const car = makeCar(scene, -320, 705, stage, 0.75);
  keep(car.root);
  car.driver.setFace(stage === 'brown' ? 'angry' : 'wide', stage === 'brown' ? 'open' : 'smile');
  const spin = scene.time.addEvent({ delay: 16, loop: true, callback: () => car.roll(20) });
  const HALF = 142; // half the car's length at this scale
  const say = (x: number, y: number, text: string, ms = 1100) => keep(bubble(scene, x, y, text, { ms, width: 300, size: 30 }));
  const impact = (strength = 0.02) => {
    spin.remove();
    sfx.crash();
    scene.cameras.main.shake(260, strength);
    scene.tweens.add({ targets: car.body, angle: -5, duration: 70, yoyo: true });
    const smoke = keep(scene.add.particles(car.root.x + HALF * 0.8, car.root.y - 70, 'puff', { speedY: { min: -80, max: -40 }, speedX: { min: -20, max: 20 }, lifespan: 900, scale: { start: 0.6, end: 1.6 }, alpha: { start: 0.7, end: 0 }, frequency: 120 }));
    scene.time.delayedCall(1200, () => smoke.stop());
  };
  sfx.screech();

  if (which === 'trash') {
    await tweenP(scene, { targets: car.root, x: 865 - HALF + 10, y: 690, duration: 560, ease: 'Quad.out' });
    impact();
    const junk = keep(scene.add.particles(900, 560, 'dot', { speed: { min: 150, max: 380 }, angle: { min: 200, max: 330 }, gravityY: 800, lifespan: 1000, tint: [0x8b93a1, 0x6b8e23, 0xe7cf6a, 0xffffff], scale: { start: 1.2, end: 0.6 }, emitting: false }));
    junk.explode(26);
    say(760, 420, homeLine('park_trash'));
    await tweenP(scene, { targets: trash, x: 1240, y: 380, angle: 420, duration: 480, ease: 'Quad.out' });
  } else if (which === 'lady') {
    const lady = keep(scene.add.image(770, 606, 'old_lady').setOrigin(0.5, 1).setScale(0.75));
    scene.tweens.add({ targets: lady, y: 690, duration: 700, ease: 'Sine.inOut' });
    scene.tweens.add({ targets: lady, angle: { from: -3, to: 3 }, duration: 160, yoyo: true, repeat: 4 });
    await tweenP(scene, { targets: car.root, x: 770 - HALF + 10, duration: 620, ease: 'Quad.out' });
    impact();
    scene.tweens.killTweensOf(lady);
    say(820, 330, homeLine('park_lady'));
    await tweenP(scene, { targets: lady, x: 1250, y: 200, angle: 540, duration: 650, ease: 'Quad.out' });
  } else if (which === 'kid') {
    const rider = keep(scene.add.container(1150, 700).setScale(-0.75, 0.75));
    rider.add([scene.add.image(0, 0, 'bike').setOrigin(0.5, 1), scene.add.image(10, -40, 'kid_rider').setOrigin(0.5, 1)]);
    scene.tweens.add({ targets: rider, x: 680 + HALF, duration: 600, ease: 'Linear' });
    await tweenP(scene, { targets: car.root, x: 680 - HALF + 20, duration: 600, ease: 'Quad.out' });
    impact();
    scene.tweens.killTweensOf(rider);
    const [bike, kid] = rider.list as Phaser.GameObjects.Image[];
    say(760, 330, homeLine('park_kid'));
    scene.tweens.add({ targets: kid, y: -520, x: -200, angle: 400, duration: 700, ease: 'Quad.out' });
    await tweenP(scene, { targets: bike, x: -380, y: -60, angle: -300, duration: 650, ease: 'Quad.out' });
  } else if (which === 'tree') {
    // swerves up onto the sidewalk, straight into the tree
    car.body.setAngle(-6);
    await tweenP(scene, { targets: car.root, x: 1030 - HALF + 25, y: 640, duration: 640, ease: 'Quad.out' });
    impact(0.03);
    scene.tweens.add({ targets: tree, angle: { from: -5, to: 5 }, duration: 70, yoyo: true, repeat: 5, onComplete: () => tree.setAngle(0) });
    const leaves = keep(scene.add.particles(1030, 380, 'dot', { x: { min: -90, max: 90 }, speedY: { min: 40, max: 140 }, speedX: { min: -40, max: 40 }, gravityY: 120, lifespan: 1600, tint: [0x3e9b4a, 0x2c7a37, 0x8bc34a], scale: { start: 0.9, end: 0.5 }, emitting: false }));
    leaves.explode(30);
    say(820, 420, homeLine('park_tree'));
    await wait(scene, 450);
  } else {
    // rear-ends the neighbour's parked car: car alarm
    await tweenP(scene, { targets: car.root, x: 1185 - 118 - HALF + 20, duration: 640, ease: 'Quad.out' });
    impact();
    scene.tweens.add({ targets: parked, x: parked.x + 45, duration: 160, ease: 'Quad.out' });
    sfx.alarm();
    const wee = say(1150, 470, homeLine('park_alarm'), 1300);
    scene.tweens.add({ targets: wee, angle: { from: -4, to: 4 }, duration: 120, yoyo: true, repeat: 5 });
    await wait(scene, 450);
  }
  car.driver.setFace('shut', 'grit');
  await wait(scene, 550);
  for (const o of objs) o.destroy();
}
