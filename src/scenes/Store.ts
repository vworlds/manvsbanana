import Phaser from 'phaser';
import { makeCar } from '../art/car';
import { sfx } from '../audio/sfx';
import { caption } from '../fx/Bubble';
import { TALK } from '../fonts';
import { homeDistance } from '../logic/trip';
import { state } from '../state/GameState';
import { commonKeys, tweenP, wait } from './common';

/** Redemption: a quick cut to the store for fresh green bananas, then back on the road. */
export class Store extends Phaser.Scene {
  private alive = true;
  private mode: 'redeemed' | 'delivery' = 'redeemed';

  constructor() {
    super('Store');
  }

  init(data: { mode?: 'redeemed' | 'delivery' }) {
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

  private async run() {
    this.add.image(640, 360, 'store');
    const car = makeCar(this, -300, 690, 'brown', 0.8);
    car.driver.setFace('angry', 'grit');
    sfx.screech();
    await tweenP(this, { targets: car.root, x: 420, duration: 380, ease: 'Quad.out' });
    if (!this.alive) return;
    this.add.rectangle(640, 300, 1280, 190, 0x000000, 0.55);
    const t = caption(this, 640, 270, 'BACK TO THE STORE', 96, '#F7D93A');
    t.setScale(2);
    this.tweens.add({ targets: t, scale: 1, duration: 200, ease: 'Back.out' });
    this.add
      .text(640, 350, this.mode === 'delivery' ? `Trip ${state.trip}: ${homeDistance(state.trip).toLocaleString()} m. They want more. They always want more.` : `Redemption #${state.redemptions}. They won't be this nice again.`, { fontFamily: TALK, fontStyle: '900', fontSize: '26px', color: '#fff', stroke: '#141414', strokeThickness: 6 })
      .setOrigin(0.5);
    await wait(this, 700);
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
