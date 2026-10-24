import Phaser from 'phaser';
import { Person } from '../art/Person';
import { makeCar } from '../art/car';
import { tweenP, wait } from './common';
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

/** The car screeches up outside the house and takes out the bins. */
export async function crashPark(scene: Phaser.Scene, stage: string) {
  const bg = scene.add.image(W / 2, H / 2, 'street');
  const trash = scene.add.image(820, 655, 'trash').setOrigin(0.5, 1).setScale(0.9);
  const car = makeCar(scene, -300, 690, stage, 0.75);
  car.driver.setFace(stage === 'brown' ? 'angry' : 'wide', stage === 'brown' ? 'open' : 'smile');
  sfx.screech();
  const spin = scene.time.addEvent({ delay: 16, loop: true, callback: () => car.roll(22) });
  await tweenP(scene, { targets: car.root, x: 640, duration: 520, ease: 'Quad.out' });
  spin.remove();
  sfx.crash();
  scene.cameras.main.shake(250, 0.02);
  scene.tweens.add({ targets: car.body, angle: 4, duration: 80, yoyo: true });
  await tweenP(scene, { targets: trash, x: 1150, y: 420, angle: 400, duration: 450, ease: 'Quad.out' });
  await wait(scene, 150);
  bg.destroy();
  trash.destroy();
  car.root.destroy();
}
