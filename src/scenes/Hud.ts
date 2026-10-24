import Phaser from 'phaser';
import { Person, type Eyes, type Mouth } from '../art/Person';
import { sfx } from '../audio/sfx';
import { bus } from '../bus';
import { SHOUT, TALK } from '../fonts';
import { STAGE_START, type Stage } from '../logic/ripeness';
import { state } from '../state/GameState';
import { bubble } from '../fx/Bubble';

const W = 1280;
const H = 720;

interface Say {
  text: string;
  eyes: Eyes;
  mouth: Mouth;
  ms: number;
  stage?: Stage;
}

export class Hud extends Phaser.Scene {
  private bar!: Phaser.GameObjects.Graphics;
  private bananaIcon!: Phaser.GameObjects.Image;
  private distText!: Phaser.GameObjects.Text;
  private chillText!: Phaser.GameObjects.Text;
  private turboLabel!: Phaser.GameObjects.Text;
  private homeIcon!: Phaser.GameObjects.Text;
  private face!: Person;
  private faceBubble?: Phaser.GameObjects.Container;
  private phone?: Phaser.GameObjects.Container;
  private phoneTimer?: Phaser.Time.TimerEvent;
  private cut?: Phaser.GameObjects.Container;

  constructor() {
    super('Hud');
  }

  create() {
    this.registry.set('phoneOpen', false);
    // ---- banana meter (top-left)
    const panel = this.add.graphics();
    panel.fillStyle(0x000000, 0.45).fillRoundedRect(14, 14, 420, 170, 18);
    this.bananaIcon = this.add.image(70, 64, 'banana_green').setScale(0.5);
    this.bar = this.add.graphics();
    this.add.text(124, 20, 'BANANA FRESHNESS', { fontFamily: TALK, fontStyle: '900', fontSize: '15px', color: '#fff' });
    this.turboLabel = this.add.text(124, 70, 'TURBO', { fontFamily: TALK, fontStyle: '900', fontSize: '15px', color: '#9FD5F2' });
    this.homeIcon = this.add.text(408, 124, '🏠', { fontSize: '26px' }).setOrigin(0.5);
    this.distText = this.add.text(30, 146, '', { fontFamily: SHOUT, fontSize: '26px', color: '#F7D93A', stroke: '#141414', strokeThickness: 5 });
    this.chillText = this.add
      .text(30, 190, '❄ CHILLED', { fontFamily: SHOUT, fontSize: '28px', color: '#7FD4FF', stroke: '#141414', strokeThickness: 5 })
      .setVisible(false);

    // ---- face inset (top-right), like the in-car close-ups
    const fx = W - 140;
    const fy = 110;
    const burst = this.add.image(fx, fy, 'burst_yellow').setScale(0.3);
    this.tweens.add({ targets: burst, angle: 360, duration: 20000, repeat: -1 });
    const m = this.make.graphics({}, false).fillRect(fx - 115, fy - 90, 230, 180);
    burst.setMask(m.createGeometryMask());
    this.face = new Person(this, fx, fy + 18, 'man', { body: false }).setScale(0.85).setFace('worried', 'grit');
    this.add.graphics().lineStyle(6, 0x141414).strokeRect(fx - 115, fy - 90, 230, 180);
    this.tweens.add({ targets: this.face, y: fy + 12, duration: 120, yoyo: true, repeat: -1 });

    // ---- touch turbo button
    if (this.sys.game.device.input.touch) {
      const b = this.add.circle(W - 110, H - 110, 70, 0x1f8fd6, 0.55).setStrokeStyle(5, 0xffffff);
      this.add.text(b.x, b.y, 'TURBO', { fontFamily: SHOUT, fontSize: '30px', color: '#fff' }).setOrigin(0.5);
    }

    const onSay = (s: Say) => this.say(s);
    const onCut = (s: Say) => this.cutIn(s);
    const onStats = (s: Parameters<Hud['stats']>[0]) => this.stats(s);
    const onStage = (st: Stage) => {
      this.bananaIcon.setTexture(`banana_${st}`);
      this.tweens.add({ targets: this.bananaIcon, scale: 0.7, duration: 120, yoyo: true });
    };
    const onPhone = () => this.openPhone();
    bus.on('hud:say', onSay);
    bus.on('hud:cutin', onCut);
    bus.on('hud:stats', onStats);
    bus.on('hud:stage', onStage);
    bus.on('hud:phone', onPhone);
    this.input.keyboard?.on('keydown-ENTER', () => this.reply());
    this.events.once('shutdown', () => {
      bus.off('hud:say', onSay);
      bus.off('hud:cutin', onCut);
      bus.off('hud:stats', onStats);
      bus.off('hud:stage', onStage);
      bus.off('hud:phone', onPhone);
      this.registry.set('phoneOpen', false);
    });
  }

  private stats(s: { ripeness: number; distance: number; chilled: number; turbo: number; turboEmpty: boolean; fast: boolean; trip: number; left: number; home: number }) {
    const g = this.bar;
    g.clear();
    // freshness
    const x = 124;
    const w = 290;
    g.fillStyle(0x222222).fillRoundedRect(x, 40, w, 22, 8);
    const col = s.ripeness < STAGE_START.yellow ? 0x8be23a : s.ripeness < STAGE_START.spotty ? 0xf7d93a : s.ripeness < STAGE_START.brown ? 0xd9a93a : 0x6b3e1e;
    g.fillStyle(col).fillRoundedRect(x + 2, 42, Math.max(0, (w - 4) * (1 - s.ripeness)), 18, 7);
    g.lineStyle(3, 0xffffff).strokeRoundedRect(x, 40, w, 22, 8);
    // turbo gauge
    const tx = 184;
    const tw = 230;
    g.fillStyle(0x222222).fillRoundedRect(tx, 72, tw, 16, 6);
    const flash = s.turboEmpty && Math.floor(this.time.now / 200) % 2 === 0;
    g.fillStyle(s.turboEmpty ? 0xd3202a : s.fast ? 0x7fe8ff : 0x1f8fd6).fillRoundedRect(tx + 2, 74, Math.max(0, (tw - 4) * s.turbo), 12, 5);
    g.lineStyle(2, flash ? 0xd3202a : 0xffffff).strokeRoundedRect(tx, 72, tw, 16, 6);
    this.turboLabel.setText(s.turboEmpty ? 'EMPTY' : 'TURBO').setColor(s.turboEmpty ? '#FF6B6B' : '#9FD5F2');
    // progress to home
    const px0 = 30;
    const px1 = 390;
    const p = 1 - s.left / s.home;
    g.lineStyle(6, 0x555566).lineBetween(px0, 124, px1, 124);
    g.lineStyle(6, 0xf7d93a).lineBetween(px0, 124, px0 + (px1 - px0) * p, 124);
    g.fillStyle(0x4b49c8).fillCircle(px0 + (px1 - px0) * p, 124, 10).lineStyle(3, 0x141414).strokeCircle(px0 + (px1 - px0) * p, 124, 10);
    this.homeIcon.setScale(s.left < s.home * 0.2 ? 1 + 0.15 * Math.sin(this.time.now / 90) : 1);
    this.distText.setText(`TRIP ${s.trip}  ·  ${Math.ceil(s.left)} m TO HOME  ·  GEN ${state.generation}`);
    this.chillText.setVisible(s.chilled > 0);
  }

  private say(s: Say) {
    this.face.setFace(s.eyes, s.mouth);
    this.faceBubble?.destroy();
    this.faceBubble = bubble(this, W - 470, 110, s.text, { tailX: W - 250, tailY: 110, width: 360, ms: s.ms, size: undefined });
    this.time.delayedCall(s.ms, () => this.face.setFace('worried', 'grit'));
  }

  /** Full-screen punch-in on the dad's face over the yellow burst. */
  private cutIn(s: Say) {
    this.cut?.destroy();
    // Container sits at screen centre so the punch-in zoom scales around the middle.
    const c = this.add.container(W / 2, H / 2).setDepth(3000);
    const flash = this.add.rectangle(0, 0, W, H, 0xffffff);
    const burst = this.add.image(0, 0, 'burst_yellow').setScale(2);
    this.tweens.add({ targets: burst, angle: 30, duration: s.ms + 400 });
    const man = new Person(this, W * 0.2, H * 0.12, 'man').setScale(2.1).setFace(s.eyes, s.mouth).setPose('face');
    man.shout(s.ms);
    const ban = this.add.image(-W * 0.14, H * 0.32, `banana_${s.stage ?? 'green'}`).setScale(1.3).setAngle(-12);
    const b = bubble(this, -W * 0.2, -H * 0.2, s.text, { tailX: W * 0.12, tailY: H * 0.02, width: 560, ms: 0, size: 54 });
    c.add([burst, ban, man, flash, b]);
    this.tweens.add({ targets: flash, alpha: 0, duration: 120 });
    c.setScale(1.15);
    this.tweens.add({ targets: c, scale: 1, duration: s.ms, ease: 'Quad.out' });
    this.cut = c;
    this.time.delayedCall(s.ms, () => {
      this.tweens.add({ targets: c, x: -W / 2 - 200, duration: 140, ease: 'Quad.in', onComplete: () => c.destroy() });
    });
  }

  // ---------------------------------------------------------------- phone
  private openPhone() {
    if (this.phone) return;
    const c = this.add.container(560, H + 340).setDepth(2000);
    const body = this.add.image(0, 0, 'phone').setScale(0.75);
    const msg = (y: number, text: string, mine: boolean) => {
      const t = this.add
        .text(mine ? 105 : -105, y, text, {
          fontFamily: TALK, fontStyle: '900', fontSize: '22px',
          color: mine ? '#fff' : '#141414',
          backgroundColor: mine ? '#2F7CF6' : '#D8D9E0',
          padding: { x: 12, y: 8 },
        })
        .setOrigin(mine ? 1 : 0, 0.5);
      c.add(t);
      return t;
    };
    c.add(body);
    msg(-130, 'OMW home', true);
    msg(-70, 'Where r u??', false);
    const hint = this.add
      .text(0, 150, this.sys.game.device.input.touch ? 'TAP PHONE TO REPLY' : 'ENTER TO REPLY', { fontFamily: SHOUT, fontSize: '30px', color: '#D3202A' })
      .setOrigin(0.5);
    c.add(hint);
    this.tweens.add({ targets: hint, alpha: 0.3, duration: 300, yoyo: true, repeat: -1 });
    this.tweens.add({ targets: c, y: H - 150, duration: 250, ease: 'Back.out' });
    body.setInteractive().on('pointerdown', () => this.reply());
    this.phone = c;
    this.registry.set('phoneOpen', true);
    this.registry.set('phoneHit', (x: number, y: number) => Math.abs(x - c.x) < 140 && y > c.y - 230);

    this.phoneTimer = this.time.delayedCall(3200, () => {
      msg(-10, '???', false);
      sfx.phone();
      this.phoneTimer = this.time.delayedCall(2200, () => {
        msg(50, 'Fine.', false);
        bus.emit('drive:phone-ignored');
        this.closePhone(700);
      });
    });
  }

  private reply() {
    if (!this.phone || !this.registry.get('phoneOpen')) return;
    this.phoneTimer?.remove();
    this.registry.set('phoneOpen', false);
    const t = this.add
      .text(105, 40, '🍌🍌🍌!!FUCK!!!', { fontFamily: TALK, fontStyle: '900', fontSize: '24px', color: '#fff', backgroundColor: '#2F7CF6', padding: { x: 12, y: 8 } })
      .setOrigin(1, 0.5);
    this.phone.add(t);
    bus.emit('drive:phone-reply');
    this.closePhone(500);
  }

  private closePhone(delay: number) {
    const c = this.phone;
    if (!c) return;
    this.registry.set('phoneOpen', false);
    this.time.delayedCall(delay, () => {
      this.tweens.add({ targets: c, y: H + 400, duration: 220, ease: 'Quad.in', onComplete: () => c.destroy() });
      this.phone = undefined;
    });
  }
}
