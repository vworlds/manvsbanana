import Phaser from 'phaser';
import { Person } from '../art/Person';
import { music, sfx } from '../audio/sfx';
import { caption } from '../fx/Bubble';
import { SHOUT, TALK } from '../fonts';
import { state } from '../state/GameState';
import { homeLine } from '../logic/lines';
import { commonKeys, tweenP, waitForInput } from './common';
import { addFlies, buildRoom, cut, H, sayAt, SPOTS, W, type Room, waitRead } from './room';

/**
 * Act 3. The father fails, face-plants into the rotten bananas, and the kid
 * declares himself father. Time speeds up and the kid grows into the very
 * man he swore he would never become. Then the next generation drives.
 */
export class Finale extends Phaser.Scene {
  private r!: Room;
  private alive = true;
  private burst?: Phaser.GameObjects.Image;

  constructor() {
    super('Finale');
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
    const r = (this.r = buildRoom(this));
    addFlies(this, r, 6);
    cut(this, W / 2, H / 2, 1);
    r.dad.setPose('down');

    // "No. No. No no no no no."
    const close = () => cut(this, SPOTS.dad.x + 30, SPOTS.dad.y + 40, 1.9);
    close();
    r.dad.setFace('worried', 'frown');
    sayAt(this, r, 'man', r.dad, homeLine('dad_no'), { ms: 700, dy: 130 });
    await this.w(900);
    cut(this, SPOTS.dad.x + 30, SPOTS.dad.y + 30, 2.4);
    r.dad.setFace('crying', 'frown');
    sayAt(this, r, 'man', r.dad, homeLine('dad_no'), { ms: 700, dy: 120 });
    await this.w(900);
    cut(this, W / 2, H / 2, 1);
    r.dad.setFace('crying', 'wail').setPose('face');
    r.dad.shout(1200);
    sayAt(this, r, 'man', r.dad, 'NO NO NO NO NO NO', { ms: 1200 });
    sfx.sad();
    await this.w(1300);
    close();
    sayAt(this, r, 'man', r.dad, homeLine('dad_tried'), { ms: 2200, dy: 130 });
    await this.w(2400);
    if (!this.alive) return;

    // Face-plant into the bag.
    cut(this, W / 2 - 100, H / 2 + 40, 1.25);
    r.dad.stopIdle().setFace('shut', 'wail').setPose('down');
    await tweenP(this, { targets: r.dad, angle: -8, duration: 300, ease: 'Sine.out' });
    await tweenP(this, { targets: r.dad, x: SPOTS.bag.x - 70, y: SPOTS.bag.y - 150, angle: 65, duration: 200, ease: 'Quad.in' });
    sfx.splat();
    sfx.boom();
    this.cameras.main.shake(350, 0.025);
    this.cameras.main.flash(80, 255, 240, 160);
    const splat = this.add.image(SPOTS.bag.x - 10, SPOTS.bag.y - 190, 'splat').setScale(0.2);
    r.world.add(splat);
    this.tweens.add({ targets: splat, scale: 0.75, duration: 140, ease: 'Back.out' });
    this.tweens.add({ targets: r.bag, scaleY: 0.68, scaleX: 0.9, duration: 120, ease: 'Quad.out' });
    this.tweens.add({ targets: r.bananas, y: r.bananas.y + 60, angle: 40, duration: 120 });
    const bits = this.add.particles(SPOTS.bag.x - 20, SPOTS.bag.y - 200, 'dot', {
      speed: { min: 200, max: 520 },
      angle: { min: 200, max: 340 },
      gravityY: 900,
      lifespan: 1200,
      scale: { start: 1.6, end: 0.6 },
      tint: [0x6b3e1e, 0xe7cf6a, 0x8a5a2a],
      emitting: false,
    });
    r.world.add(bits);
    bits.explode(40);
    r.kid.setFace('wide', 'o');
    r.wife.setFace('wide', 'o');
    r.baby.setTexture('baby_scream');
    await this.w(1300);
    r.baby.setTexture('baby_calm');
    sfx.buzz();
    await this.w(700);
    if (!this.alive) return;

    // The kid steps up.
    const kid = r.kid;
    kid.stopIdle();
    cut(this, SPOTS.kid.x, SPOTS.kid.y + 20, 1.6);
    kid.setFace('smug', 'flat');
    sayAt(this, r, 'kid', kid, homeLine('kid_failed'), { ms: 1500, dy: 130 });
    await this.w(1700);
    const burst = (this.burst = this.add.image(SPOTS.kid.x, SPOTS.kid.y, 'burst_yellow').setScale(0.6).setAlpha(0));
    r.world.addAt(burst, 1);
    this.tweens.add({ targets: burst, alpha: 0.9, duration: 200 });
    this.tweens.add({ targets: burst, angle: 90, duration: 6000 });
    await tweenP(this, { targets: kid, y: SPOTS.kid.y - 70, duration: 400, ease: 'Back.out' });
    kid.setFace('angry', 'smirk').setPose('hips');
    sfx.sting();
    cut(this, SPOTS.kid.x, SPOTS.kid.y - 20, 1.9);
    const iam = caption(this, W / 2, H - 120, 'I AM FATHER NOW.', 110, '#F7D93A');
    r.ui.add(iam);
    iam.setScale(2.2);
    this.tweens.add({ targets: iam, scale: 1, duration: 260, ease: 'Back.out' });
    await this.w(2300);
    this.tweens.add({ targets: iam, alpha: 0, duration: 300 });
    kid.setFace('smug', 'smirk');
    sayAt(this, r, 'kid', kid, homeLine('kid_vow'), { ms: 1800, dy: 130 });
    await this.w(2000);
    if (!this.alive) return;

    // Time accelerates.
    await this.timeLapse();
    if (!this.alive) return;
    await this.card();
  }

  private async timeLapse() {
    const r = this.r;
    const kid = r.kid;
    const startYear = state.year();
    state.fatherFailed(); // record him; the kid is now the father
    cut(this, W / 2, H / 2, 1);
    sfx.whoosh(4.2, true);

    // tint sits just above the wallpaper so it colours the room, not the people
    const tint = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0);
    r.world.addAt(tint, 1);
    if (this.burst) this.tweens.add({ targets: this.burst, x: W / 2, y: H / 2, scale: 1.3, duration: 1200, ease: 'Sine.inOut' });
    const clock = this.add.image(W / 2 - 120, 110, 'clock').setScale(0.5);
    const hands = this.add.graphics();
    r.world.add([clock, hands]);
    const yearText = this.add
      .text(W / 2 + 90, 110, String(startYear), { fontFamily: SHOUT, fontSize: '80px', color: '#fff', stroke: '#141414', strokeThickness: 10 })
      .setOrigin(0, 0.5);
    r.ui.add(yearText);

    const seasons = [0x8be23a, 0xe8901e, 0xffffff, 0xff9ad5];
    const dur = 4200;
    const t0 = this.time.now;
    const ticker = this.time.addEvent({
      delay: 16,
      loop: true,
      callback: () => {
        const p = Math.min(1, (this.time.now - t0) / dur);
        const spin = p * p * 120; // accelerating
        hands.clear().lineStyle(10, 0x141414);
        const a1 = spin * Math.PI * 2;
        const a2 = (spin / 12) * Math.PI * 2;
        const cx = W / 2 - 120;
        const cy = 110;
        hands.lineBetween(cx, cy, cx + Math.sin(a1) * 58, cy - Math.cos(a1) * 58);
        hands.lineStyle(12, 0x141414).lineBetween(cx, cy, cx + Math.sin(a2) * 38, cy - Math.cos(a2) * 38);
        yearText.setText(String(Math.floor(startYear + p * 30)));
        const season = seasons[Math.floor(p * 40) % seasons.length];
        tint.setFillStyle(season, 0.12 + 0.1 * Math.sin(p * 60));
      },
    });

    // Everyone else fades into the past.
    this.tweens.add({ targets: [r.dad, r.wife, r.baby, r.bag, r.bananas, ...r.flies, ...r.world.list.filter((o) => o.type === 'Image' && (o as Phaser.GameObjects.Image).texture.key === 'splat')], alpha: 0, duration: 1600, delay: 300 });
    // The kid grows up and becomes him.
    kid.setFace('smug', 'smirk').setPose('down');
    const L = kid.layers;
    this.tweens.add({ targets: kid, x: W / 2, y: 330, scale: 1.05, duration: dur, ease: 'Sine.inOut' });
    this.tweens.add({ targets: kid, armScale: 1, duration: dur, onUpdate: () => kid.drawArms() });
    this.tweens.add({ targets: L.kidHair, alpha: 0, duration: dur * 0.6, delay: dur * 0.2 });
    this.tweens.add({ targets: L.manHair, alpha: 1, duration: dur * 0.6, delay: dur * 0.3 });
    this.tweens.add({ targets: L.stubble, alpha: 1, duration: dur * 0.4, delay: dur * 0.5 });
    this.tweens.add({ targets: L.glasses, alpha: 1, duration: dur * 0.3, delay: dur * 0.65 });
    this.tweens.add({ targets: kid.torso, alpha: 0, duration: dur * 0.5, delay: dur * 0.25 });
    this.tweens.add({ targets: kid.torso2, alpha: 1, duration: dur * 0.5, delay: dur * 0.25 });
    this.time.delayedCall(dur * 0.45, () => kid.setFace('neutral', 'flat'));
    this.time.delayedCall(dur * 0.8, () => kid.setFace('worried', 'grit'));

    await this.w(dur + 100);
    ticker.remove();
    this.tweens.add({ targets: [clock, hands, tint], alpha: 0, duration: 400 });
    this.tweens.add({ targets: yearText, alpha: 0, duration: 400 });

    // History repeats: his own smug kid shows up.
    const son = new Person(this, 960, 400, 'kid').setScale(0.65).setFace('smug', 'smirk').setPose('hips');
    r.world.addAt(son, r.world.list.indexOf(r.table));
    son.setAlpha(0);
    await tweenP(this, { targets: son, alpha: 1, duration: 200 });
    sayAt(this, r, 'kid', son, homeLine('grandson_jab'), { ms: 1800, dy: 130 });
    await this.w(1900);
    cut(this, W / 2, 330, 1.9);
    kid.setFace('wide', 'o');
    sayAt(this, r, 'man', kid, homeLine('oh_no'), { ms: 1400, dy: 130 });
    await this.w(1600);
  }

  private async card() {
    const r = this.r;
    const shade = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0);
    r.ui.add(shade);
    await tweenP(this, { targets: shade, fillAlpha: 0.88, duration: 300 });
    const title = caption(this, W / 2, 130, `GENERATION ${state.generation}`, 110, '#F7D93A');
    r.ui.add(title);
    sfx.sting();
    const rows = state.dynasty
      .slice(-6)
      .map((f) => `Father #${f.generation}   ·   ${f.deliveries ?? 0} deliver${f.deliveries === 1 ? 'y' : 'ies'}   ·   ${f.redemptions} redemption${f.redemptions === 1 ? '' : 's'}   ·   ${f.distance.toLocaleString()} m   ·   FAILED`);
    const list = this.add
      .text(W / 2, 250, rows.join('\n'), { fontFamily: TALK, fontStyle: '900', fontSize: '24px', color: '#ddd', align: 'center', lineSpacing: 10 })
      .setOrigin(0.5, 0);
    const legacy = this.add
      .text(W / 2, 520, `Family legacy: ${state.legacy().toLocaleString()} m of bananas nobody ate   ·   Year ${state.year()}`, { fontFamily: TALK, fontStyle: '900', fontSize: '22px', color: '#9FD5F2' })
      .setOrigin(0.5);
    const go = this.add
      .text(W / 2, 610, 'SPACE / TAP: you are father now   ·   ESC: give up', { fontFamily: SHOUT, fontSize: '40px', color: '#fff' })
      .setOrigin(0.5);
    this.tweens.add({ targets: go, alpha: 0.4, duration: 450, yoyo: true, repeat: -1 });
    r.ui.add([list, legacy, go]);
    const k = await waitForInput(this, ['SPACE', 'ENTER', 'ESC']);
    if (!this.alive) return;
    sfx.select();
    if (k === 'ESC') this.scene.start('Title');
    else this.scene.start('Store', { mode: 'new' });
  }
}
