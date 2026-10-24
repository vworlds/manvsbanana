import Phaser from 'phaser';
import { Person } from './Person';

/** Wheel centres in car-image space (380x180 image, origin bottom-centre). */
const WHEELS: [number, number][] = [
  [84 - 190, 146 - 180],
  [300 - 190, 146 - 180],
];

export interface Car {
  root: Phaser.GameObjects.Container;
  body: Phaser.GameObjects.Container;
  wheels: Phaser.GameObjects.Image[];
  /** Spin the wheels for `px` pixels of travel (positive = forward). */
  roll(px: number): void;
}

export interface PlayerCar extends Car {
  driver: Person;
  bananas: Phaser.GameObjects.Image;
}

function addWheels(scene: Phaser.Scene, body: Phaser.GameObjects.Container) {
  return WHEELS.map(([x, y]) => {
    const w = scene.add.image(x, y, 'wheel');
    body.add(w);
    return w;
  });
}

function roller(wheels: Phaser.GameObjects.Image[], scale: number) {
  // circumference of a 31px wheel at this scale
  const circ = 2 * Math.PI * 31 * scale;
  return (px: number) => {
    for (const w of wheels) w.rotation += (px / circ) * Math.PI * 2;
  };
}

/** The dad's blue sedan, facing right. Origin is the bottom of the wheels. Driver and bananas visible through the windows. */
export function makeCar(scene: Phaser.Scene, x: number, y: number, stage = 'green', scale = 0.55): PlayerCar {
  const root = scene.add.container(x, y);
  const body = scene.add.container(0, 0);
  const img = (k: string) => scene.add.image(0, 0, k).setOrigin(0.5, 1);
  const bananas = scene.add.image(-58, -140, `banana_${stage}`).setScale(0.4).setAngle(-10);
  const driver = new Person(scene, 18, -126, 'man', { body: false }).setScale(0.36).setFace('worried', 'grit');
  body.add([img('car_back'), bananas, driver, img('car_front'), img('car_glass')]);
  const wheels = addWheels(scene, body);
  body.setScale(scale);
  root.add(body);
  return { root, body, driver, bananas, wheels, roll: roller(wheels, scale) };
}

/** A traffic car (driver baked into the image), facing right, with spinning wheels. */
export function makeNpcCar(scene: Phaser.Scene, x: number, y: number, key: string, scale = 0.55): Car {
  const root = scene.add.container(x, y);
  const body = scene.add.container(0, 0);
  body.add(scene.add.image(0, 0, key).setOrigin(0.5, 1));
  const wheels = addWheels(scene, body);
  body.setScale(scale);
  root.add(body);
  return { root, body, wheels, roll: roller(wheels, scale) };
}
