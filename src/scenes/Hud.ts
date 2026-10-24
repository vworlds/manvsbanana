import Phaser from 'phaser';
import type { Eyes, Mouth, Person } from '../art/Person';
import { DAD_X, DAD_Y, makeCabin } from '../art/cabin';
import { sfx } from '../audio/sfx';
import { bus } from '../bus';
import { SHOUT, TALK } from '../fonts';
import { STAGE_START, type Stage } from '../logic/ripeness';
import { state } from '../state/GameState';
import { bubble, bubbleSize } from '../fx/Bubble';
import { lineFrom } from '../logic/lines';
import { DAD_OPENER, DAD_REPLY, WIFE_GIVE_UP, WIFE_NAGS, WIFE_TEXTS } from '../logic/texts';


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
  private insetBananas?: Phaser.GameObjects.Image;
  private faceBubble?: Phaser.GameObjects.Container;
  private phone?: Phaser.GameObjects.Container;
  private phoneTimer?: Phaser.Time.TimerEvent;
  private phoneY: () => number = () => 0;
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
    // a small in-car shot: the dad at the wheel, framed by the windscreen pillar
    const cab = makeCabin(this, 'green');
    const cs = 0.3;
    cab.root.setScale(cs).setPosition(fx - DAD_X * cs - 10, fy - DAD_Y * cs + 18);
    const m = this.make.graphics({}, false).fillRect(fx - 115, fy - 90, 230, 180);
    cab.root.setMask(m.createGeometryMask());
    this.face = cab.dad;
    this.insetBananas = cab.bananas;
    this.add.graphics().lineStyle(6, 0x141414).strokeRect(fx - 115, fy - 90, 230, 180);
    this.tweens.add({ targets: cab.root, y: cab.root.y - 4, duration: 120, yoyo: true, repeat: -1 });

    // ---- touch buttons: hold left edge = brake, right edge = turbo
    if (this.sys.game.device.input.touch) {
      const br = this.add.circle(110, H - 110, 70, 0xd3202a, 0.5).setStrokeStyle(5, 0xffffff);
      this.add.text(br.x, br.y, 'BRAKE', { fontFamily: SHOUT, fontSize: '30px', color: '#fff' }).setOrigin(0.5);
      const b = this.add.circle(W - 110, H - 110, 70, 0x1f8fd6, 0.55).setStrokeStyle(5, 0xffffff);
      this.add.text(b.x, b.y, 'TURBO', { fontFamily: SHOUT, fontSize: '30px', color: '#fff' }).setOrigin(0.5);
    }

    const onSay = (s: Say) => this.say(s);
    const onCut = (s: Say) => this.cutIn(s);
    const onStats = (s: Parameters<Hud['stats']>[0]) => this.stats(s);
    const onStage = (st: Stage) => {
      this.bananaIcon.setTexture(`banana_${st}`);
      this.insetBananas?.setTexture(`banana_${st}`);
      this.tweens.add({ targets: this.bananaIcon, scale: 0.7, duration: 120, yoyo: true });
    };
    const onPhone = (at?: { x?: number }) => this.openPhone(at);
    const onPhoneClose = () => this.dropPhone();
    bus.on('hud:say', onSay);
    bus.on('hud:cutin', onCut);
    bus.on('hud:stats', onStats);
    bus.on('hud:stage', onStage);
    bus.on('hud:phone', onPhone);
    bus.on('hud:phone-close', onPhoneClose);
    this.input.keyboard?.on('keydown-ENTER', () => this.reply());
    this.events.once('shutdown', () => {
      bus.off('hud:say', onSay);
      bus.off('hud:cutin', onCut);
      bus.off('hud:stats', onStats);
      bus.off('hud:stage', onStage);
      bus.off('hud:phone', onPhone);
      bus.off('hud:phone-close', onPhoneClose);
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
    // sits just left of the face panel, tail pointing right at him
    const b = bubble(this, W - 470, 110, s.text, { tailX: W - 250, tailY: 110, width: 360, ms: s.ms });
    b.x = W - 255 - 44 - bubbleSize(b).w / 2;
    this.faceBubble = b;
    this.time.delayedCall(s.ms, () => this.face.setFace('worried', 'grit'));
  }

  /** Full-screen punch-in on the dad's face over the yellow burst. */
  private cutIn(s: Say) {
    this.cut?.destroy();
    // Container sits at screen centre so the punch-in zoom scales around the middle.
    const c = this.add.container(W / 2, H / 2).setDepth(3000);
    const flash = this.add.rectangle(0, 0, W, H, 0xffffff);
    // the in-car close-up from the short: bananas on the passenger seat, dad at the wheel
    const cab = makeCabin(this, s.stage ?? 'green', s.eyes, s.mouth);
    cab.root.setPosition(-W / 2, -H / 2);
    this.tweens.add({ targets: cab.burst, scale: 1.4, duration: s.ms + 400 });
    cab.dad.shout(s.ms);
    const b = bubble(this, -W * 0.14, -H * 0.3, s.text, { tailX: W * 0.14, tailY: -H * 0.08, width: 560, ms: 0, size: 50 });
    c.add([cab.root, flash, b]);
    this.tweens.add({ targets: flash, alpha: 0, duration: 120 });
    c.setScale(1.15);
    this.tweens.add({ targets: c, scale: 1, duration: s.ms, ease: 'Quad.out' });
    this.cut = c;
    this.time.delayedCall(s.ms, () => {
      this.tweens.add({ targets: c, x: -W / 2 - 200, duration: 140, ease: 'Quad.in', onComplete: () => c.destroy() });
    });
  }

  // ---------------------------------------------------------------- phone
  /** The wife texts. It pops up at a random spot so you have to find it and tap it, fast. */
  private openPhone(at?: { x?: number }) {
    if (this.phone) return;
    const x = Phaser.Math.Clamp(at?.x ?? 640, 170, W - 170);
    const c = this.add.container(x, H + 340).setDepth(3500); // above any cut-in
    const body = this.add.image(0, 0, 'phone').setScale(0.75);
    c.add(body);
    let y = -150;
    const msg = (text: string, mine: boolean) => {
      const t = this.add
        .text(mine ? 105 : -105, y, text, {
          fontFamily: TALK, fontStyle: '900', fontSize: '20px',
          color: mine ? '#fff' : '#141414',
          backgroundColor: mine ? '#2F7CF6' : '#D8D9E0',
          padding: { x: 10, y: 7 },
          wordWrap: { width: 190 },
        })
        .setOrigin(mine ? 1 : 0, 0);
      c.add(t);
      y += t.height + 8;
      return t;
    };
    msg(DAD_OPENER, true);
    msg(lineFrom('wife.texts', WIFE_TEXTS), false);
    const hint = this.add
      .text(0, -262, this.sys.game.device.input.touch ? 'TAP PHONE TO REPLY!' : 'ENTER TO REPLY!', { fontFamily: SHOUT, fontSize: '32px', color: '#D3202A', stroke: '#ffffff', strokeThickness: 6 })
      .setOrigin(0.5);
    c.add(hint);
    this.tweens.add({ targets: hint, alpha: 0.3, duration: 300, yoyo: true, repeat: -1 });
    c.setAngle(Phaser.Math.Between(-7, 7));
    this.tweens.add({ targets: c, y: H - 150, duration: 230, ease: 'Back.out' });
    this.tweens.add({ targets: c, x: x + 6, duration: 50, yoyo: true, repeat: 5, delay: 230 }); // buzz
    body.setInteractive().on('pointerdown', () => this.reply());
    this.phone = c;
    this.phoneY = () => y;
    this.registry.set('phoneOpen', true);
    this.registry.set('phoneHit', (px: number, py: number) => Math.abs(px - c.x) < 150 && py > c.y - 240);

    this.phoneTimer = this.time.delayedCall(3200, () => {
      msg(lineFrom('wife.nags', WIFE_NAGS), false);
      sfx.phone();
      this.phoneTimer = this.time.delayedCall(2200, () => {
        msg(lineFrom('wife.giveup', WIFE_GIVE_UP), false);
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
      .text(105, this.phoneY(), DAD_REPLY, { fontFamily: TALK, fontStyle: '900', fontSize: '22px', color: '#fff', backgroundColor: '#2F7CF6', padding: { x: 10, y: 7 } })
      .setOrigin(1, 0);
    this.phone.add(t);
    bus.emit('drive:phone-reply');
    this.closePhone(500);
  }

  /** Put the phone away without counting it as ignored (the run is ending). */
  private dropPhone() {
    this.phoneTimer?.remove();
    this.closePhone(0);
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
