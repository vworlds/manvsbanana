import Phaser from 'phaser';
import type { Person } from '../art/Person';
import { music, sfx } from '../audio/sfx';
import { caption } from '../fx/Bubble';
import { TALK } from '../fonts';
import { ENTRANCE } from '../logic/pleadLines';
import { homeLine, lineFrom } from '../logic/lines';
import { voice } from '../audio/voice';
import { state } from '../state/GameState';
import { commonKeys, tweenP } from './common';
import { addFlies, buildRoom, crashPark, cut, H, sayAt, SPOTS, W, waitRead } from './room';

/**
 * He made it home in time. The family eats the bananas while looking down
 * their noses at him with pure disdain, then demands more. Back to the store.
 */
export class Home extends Phaser.Scene {
  private alive = true;

  constructor() {
    super('Home');
  }

  create() {
    commonKeys(this);
    this.alive = true;
    this.events.once('shutdown', () => (this.alive = false));
    music('none');
    void this.run();
  }

  /** Wait, but never cut a line off before it has been read. */
  private w(ms: number) {
    return waitRead(this, ms);
  }


  private async run() {
    const stage = (this.registry.get('arrivalStage') as string) ?? 'yellow';
    await crashPark(this, stage);
    if (!this.alive) return;

    const r = buildRoom(this);
    r.bananas.setTexture(`banana_${stage}`);
    r.dad.x = -200;
    r.bag.setVisible(false);
    r.bananas.setVisible(false);
    cut(this, W / 2, H / 2, 1);
    this.cameras.main.flash(100);

    // Proud entrance.
    await tweenP(this, { targets: r.dad, x: SPOTS.dad.x, duration: 260, ease: 'Quad.out' });
    r.dad.setFace('wide', 'smile').setPose('up');
    const fam = voice('family');
    sayAt(this, r, 'man', r.dad, fam?.text ?? lineFrom('plead.entrance', ENTRANCE), { ms: fam?.ms ?? 1300 });
    await this.w(1300);
    r.bag.setVisible(true).setY(-200);
    r.bananas.setVisible(true).setY(-400);
    this.tweens.add({ targets: r.bananas, y: SPOTS.bag.y - 190, duration: 220, ease: 'Quad.in' });
    await tweenP(this, { targets: r.bag, y: SPOTS.bag.y, duration: 220, ease: 'Quad.in' });
    sfx.boom();
    this.cameras.main.shake(150, 0.01);
    if (stage === 'spotty') addFlies(this, r, 2);
    r.dad.setFace('neutral', 'smile').setPose('hips');
    cut(this, SPOTS.dad.x + 40, SPOTS.dad.y + 30, 1.6);
    sayAt(this, r, 'man', r.dad, homeLine('proud'), { ms: 1700, dy: 150 });
    await this.w(1800);
    if (!this.alive) return;

    // Silence. They take the bananas without a word.
    cut(this, W / 2, H / 2, 1);
    await this.w(500);
    const eaters: { who: Person | Phaser.GameObjects.Image; x: number; y: number }[] = [
      { who: r.wife, x: SPOTS.wife.x - 10, y: SPOTS.wife.y + 45 },
      { who: r.kid, x: SPOTS.kid.x - 10, y: SPOTS.kid.y + 35 },
      { who: r.baby, x: SPOTS.baby.x, y: SPOTS.baby.y + 10 },
    ];
    for (const e of eaters) {
      const b = this.add.image(SPOTS.bag.x - 20, SPOTS.bag.y - 200, `banana_${stage}`).setScale(0.25);
      r.world.add(b);
      sfx.blip();
      await tweenP(this, { targets: b, x: e.x, y: e.y, angle: 360, duration: 280, ease: 'Sine.inOut' });
      b.destroy();
      sfx.chomp();
    }

    // Chewing, chins up, looking down their noses at him.
    for (const p of [r.wife, r.kid]) {
      p.stopIdle();
      p.setFace('disdain', 'chew');
      this.tweens.add({ targets: p, angle: p === r.kid ? 7 : 6, y: p.y - 6, duration: 600, ease: 'Sine.out' });
    }
    this.tweens.add({ targets: r.baby, angle: 10, duration: 600 });
    const chew = this.time.addEvent({
      delay: 260,
      loop: true,
      callback: () => {
        const open = Math.floor(this.time.now / 260) % 2 === 0;
        r.wife.setFace('disdain', open ? 'chew' : 'flat');
        r.kid.setFace('disdain', open ? 'flat' : 'chew');
        if (open) sfx.chomp();
      },
    });
    r.dad.setFace('neutral', 'smile').setPose('down');
    // Slow push-in on the stare, like the short's long silent hold.
    this.cameras.main.pan(W / 2 + 40, H / 2 + 30, 2600, 'Sine.easeInOut');
    this.cameras.main.zoomTo(1.15, 2600, 'Sine.easeInOut');
    await this.w(1300);
    r.dad.setFace('worried', 'smile');
    await this.w(1300);
    r.dad.setFace('worried', 'flat');
    chew.remove();
    r.wife.setFace('disdain', 'flat');
    r.kid.setFace('disdain', 'smirk');
    if (!this.alive) return;

    // The verdicts.
    sayAt(this, r, 'wife', r.wife, homeLine('disdain_wife'), { ms: 1900 });
    await this.w(2000);
    sayAt(this, r, 'kid', r.kid, homeLine('disdain_kid'), { ms: 1900, dy: 140 });
    await this.w(2000);

    // The baby throws the peel at him.
    const peel = this.add.image(SPOTS.baby.x, SPOTS.baby.y - 20, 'banana_yellow').setScale(0.36);
    r.world.add(peel);
    r.baby.setTexture('baby_scream');
    sfx.whoosh(0.4, false);
    await tweenP(this, { targets: peel, x: SPOTS.dad.x + 10, y: SPOTS.dad.y - 95, angle: -700, duration: 600, ease: 'Sine.inOut' });
    sfx.splat();
    // it stays on his head for the rest of the scene
    r.dad.add(peel);
    peel.setPosition(10, -95).setScale(0.36 / r.dad.scale).setAngle(200);
    r.baby.setTexture('baby_calm');
    r.dad.setFace('shut', 'flat');
    await this.w(500);

    cut(this, W / 2 + 100, H / 2, 1.05);
    sayAt(this, r, Math.random() < 0.5 ? 'wife' : 'kid', Math.random() < 0.5 ? r.wife : r.kid, homeLine('demands'), { ms: 1700 });
    await this.w(1800);
    cut(this, SPOTS.dad.x + 30, SPOTS.dad.y + 30, 1.9);
    r.dad.setFace('worried', 'grit');
    sayAt(this, r, 'man', r.dad, homeLine('resigned'), { ms: 1700, dy: 120 });
    await this.w(1800);
    if (!this.alive) return;

    // Score card.
    state.delivered();
    cut(this, W / 2, H / 2, 1);
    const shade = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0);
    r.ui.add(shade);
    await tweenP(this, { targets: shade, fillAlpha: 0.75, duration: 250 });
    const t = caption(this, W / 2, 260, `DELIVERY #${state.deliveries}`, 100, '#8BE23A');
    const sub = this.add
      .text(W / 2, 360, 'Respect earned: 0', { fontFamily: TALK, fontStyle: '900', fontSize: '34px', color: '#fff', stroke: '#141414', strokeThickness: 6 })
      .setOrigin(0.5);
    r.ui.add([t, sub]);
    sfx.sting();
    await this.w(1600);
    if (this.alive) this.scene.start('Store', { mode: 'delivery' });
  }
}
