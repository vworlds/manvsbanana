import Phaser from 'phaser';
import { Person, type Eyes, type Mouth } from './Person';

/** Where the dad's head sits in the 1280x720 shot (the HUD inset frames this). */
export const DAD_X = 990;
export const DAD_Y = 262;

/**
 * The short's signature shot, from the dashboard looking at the driver:
 * a streaky burst through the windscreen, the passenger seat with the grocery
 * bag (bananas in their current ripeness), the dad in his seat holding the
 * wheel, and the car's roof, pillars, mirror and dashboard framing it all.
 * The container is 1280x720 at scale 1, origin top-left.
 */
export interface Cabin {
  root: Phaser.GameObjects.Container;
  dad: Person;
  bananas: Phaser.GameObjects.Image;
  burst: Phaser.GameObjects.Image;
}

export function makeCabin(scene: Phaser.Scene, stage = 'green', eyes: Eyes = 'worried', mouth: Mouth = 'grit'): Cabin {
  const root = scene.add.container(0, 0);
  const burst = scene.add.image(640, 330, 'burst_yellow').setScale(1.25);
  const back = scene.add.image(640, 360, 'cabin_back');
  const passengerSeat = scene.add.image(300, 780, 'car_seat').setOrigin(0.5, 1).setScale(1.1);
  const bag = scene.add.image(290, 790, 'bag_full').setOrigin(0.5, 1).setScale(1.25);
  // bananas sit on top of the bag, in front, like the short
  const bananas = scene.add.image(330, 500, `banana_${stage}`).setScale(1.6).setAngle(-8);
  const driverSeat = scene.add.image(1000, 820, 'car_seat').setOrigin(0.5, 1).setScale(1.6);
  const dad = new Person(scene, DAD_X, DAD_Y, 'man').setScale(2.8).setFace(eyes, mouth).setPose('drive');
  const wheel = scene.add.image(DAD_X, 880, 'steering').setOrigin(0.5, 1).setScale(1.35);
  const dash = scene.add.image(640, 360, 'cabin_dash');
  root.add([burst, back, passengerSeat, bag, bananas, driverSeat, dad, wheel, dash]);
  return { root, dad, bananas, burst };
}
