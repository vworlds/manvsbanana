import Phaser from 'phaser';
import { BODY_RES, FACE_RES } from '../art/Person';
import { debug, state } from '../state/GameState';

const FACES = [
  'head_plain', 'man_head', 'man_hair', 'kid_hair', 'kid_head', 'stubble', 'glasses', 'wife_head',
  ...['neutral', 'worried', 'angry', 'wide', 'crying', 'smug', 'shut', 'disdain'].map((e) => `eyes_${e}`),
  ...['flat', 'frown', 'smile', 'smirk', 'open', 'grit', 'o', 'wail', 'chew'].map((m) => `mouth_${m}`),
];
const BODIES = ['body_man', 'body_kid', 'body_wife', 'baby_calm', 'baby_scream'];
const PLAIN = [
  'car_front', 'car_back', 'car_glass', 'car_green', 'car_red', 'car_taxi', 'car_white',
  'ped_0', 'ped_1', 'ped_2', 'ped_3', 'ped_4', 'ped_5',
  'banana_green', 'banana_yellow', 'banana_spotty', 'banana_brown',
  'bag', 'ice', 'chant', 'yield', 'light', 'trash', 'fly', 'phone', 'keys', 'splat', 'clock',
  'wheel', 'nitro', 'coffee', 'puff', 'house', 'car_police', 'signal', 'cone', 'barrier', 'stopline',
  'burst_yellow', 'burst_blue', 'skyline', 'trees', 'street', 'room', 'table',
  'car_parked', 'tree', 'old_lady', 'bike', 'kid_rider', 'pillar', 'hedge',
];

export class Boot extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload() {
    const { width, height } = this.scale;
    const bar = this.add.rectangle(width / 2 - 200, height / 2, 0, 16, 0xf7d93a).setOrigin(0, 0.5);
    this.add.rectangle(width / 2, height / 2, 404, 20).setStrokeStyle(2, 0xffffff);
    this.load.on('progress', (p: number) => (bar.width = 400 * p));

    for (const k of FACES) this.load.svg(k, `assets/${k}.svg`, { scale: FACE_RES });
    for (const k of BODIES) this.load.svg(k, `assets/${k}.svg`, { scale: BODY_RES });
    for (const k of PLAIN) this.load.svg(k, `assets/${k}.svg`);
  }

  create() {
    const g = this.add.graphics();
    // lane dash
    g.fillStyle(0xffffff, 0.9).fillRect(0, 0, 70, 8).generateTexture('dash', 140, 8).clear();
    // sidewalk seams
    g.fillStyle(0xc9c9cf).fillRect(0, 0, 120, 50).lineStyle(3, 0x9d9da6).lineBetween(118, 0, 118, 50).generateTexture('sidewalk', 120, 50).clear();
    // crosswalk stripes
    g.fillStyle(0xffffff, 0.95);
    for (let y = 0; y < 270; y += 30) g.fillRect(0, y, 110, 18);
    g.generateTexture('crosswalk', 110, 270).clear();
    // soft particle
    g.fillStyle(0xffffff).fillCircle(8, 8, 8).generateTexture('dot', 16, 16).destroy();

    state.newDynasty();
    if (debug.trip) state.trip = debug.trip;
    const target = debug.scene;
    if (target === 'plead') {
      state.distance = 1800;
      this.scene.start('Plead');
    } else if (target === 'finale') this.scene.start('Finale');
    else if (target === 'store') this.scene.start('Store');
    else if (target === 'home') this.scene.start('Home');
    else if (target === 'drive') this.scene.start('Drive');
    else this.scene.start('Title');
  }
}
