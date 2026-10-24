import Phaser from 'phaser';
import { makeCar } from '../art/car';
import { sfx } from '../audio/sfx';
import { caption } from '../fx/Bubble';
import { TALK } from '../fonts';
import { drawStore, randomStore, videoStore } from '../art/store';
import { homeDistance } from '../logic/trip';
import { homeLine } from '../logic/lines';
import { state } from '../state/GameState';
import { commonKeys, tweenP, wait } from './common';

/**
 * A quick cut to the store for fresh green bananas, then onto the road.
 * Shown at the start of every father's first trip, after each delivery, and after a redemption.
 */
export class Store extends Phaser.Scene {
  private alive = true;
  private mode: 'new' | 'redeemed' | 'delivery' = 'redeemed';

  constructor() {
    super('Store');
  }

  init(data: { mode?: 'new' | 'redeemed' | 'delivery' }) {
    this.mode = data.mode ?? 'redeemed';
  }

  create() {
    commonKeys(this);
    this.alive = true;
    this.events.once('shutdown', () => (this.alive = false));
    this.cameras.main.fadeIn(150);
    void this.run();
    this.input.once('pointerdown', () => this.go());
    this.input.keyboard?.once('keydown-SPACE', () => this.go());
  }

  private go() {
    if (!this.alive) return;
    this.alive = false;
    this.scene.start('Drive', { mode: this.mode });
  }

  private subtitle() {
    const dist = `${homeDistance(state.trip).toLocaleString()} m`;
    if (this.mode === 'new')
      return state.generation > 1
        ? `Generation ${state.generation}. Home is ${dist} away. You'll do better than him. Surely.`
        : `Home is ${dist} away. Get them there before they turn brown.`;
    if (this.mode === 'delivery') return `Trip ${state.trip}: ${dist}. They want more. They always want more.`;
    return `Redemption #${state.redemptions}. They won't be this nice again.`;
  }

  private async run() {
    // The game's first store is the one from the short; after that, a different shop every time.
    let style;
    if (state.storeVisits === 0) style = videoStore();
    else {
      style = randomStore(homeLine('store_names'));
    }
    state.storeVisits += 1;
    drawStore(this, style);
    const car = makeCar(this, -300, 690, 'brown', 0.8);
    car.driver.setFace('angry', 'grit');
    sfx.screech();
    await tweenP(this, { targets: car.root, x: 420, duration: 380, ease: 'Quad.out' });
    if (!this.alive) return;
    this.add.rectangle(640, 85, 1280, 170, 0x000000, 0.6);
    const title = this.mode === 'new' ? (state.generation > 1 ? 'YOUR TURN, DAD' : 'BANANA RUN') : 'BACK TO THE STORE';
    const t = caption(this, 640, 62, title, 88, '#F7D93A');
    t.setScale(2);
    this.tweens.add({ targets: t, scale: 1, duration: 200, ease: 'Back.out' });
    this.add
      .text(640, 135, this.subtitle(), { fontFamily: TALK, fontStyle: '900', fontSize: '26px', color: '#fff', stroke: '#141414', strokeThickness: 6 })
      .setOrigin(0.5);
    await wait(this, this.mode === 'new' ? 1300 : 700);
    if (!this.alive) return;
    // fresh bunch
    sfx.pickup();
    car.bananas.setTexture('banana_green');
    car.driver.setFace('wide', 'smile');
    const pop = this.add.image(420, 560, 'banana_green').setScale(0.2);
    await tweenP(this, { targets: pop, scale: 0.8, y: 520, duration: 300, ease: 'Back.out' });
    await wait(this, 500);
    if (!this.alive) return;
    sfx.screech();
    this.tweens.add({ targets: pop, alpha: 0, duration: 150 });
    await tweenP(this, { targets: car.root, x: 1600, duration: 450, ease: 'Quad.in' });
    this.go();
  }
}
