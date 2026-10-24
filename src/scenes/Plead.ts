import Phaser from 'phaser';
import type { Eyes, Mouth } from '../art/Person';
import { music, sfx } from '../audio/sfx';
import { SHOUT, TALK } from '../fonts';
import { dealRound, familyOrder, loadRecent, pickFresh, redeemed, rememberLines, resultOf, score, startingRespect, threshold, type Choice, type Member, type Mood, type Result, type Tone } from '../logic/plead';
import { EMERGENCY, ENTRANCE, PARDON, PROMISE } from '../logic/pleadLines';
import { state } from '../state/GameState';
import { commonKeys, tweenP, wait } from './common';
import { addFlies, buildRoom, crashPark, cut, H, sayAt, SPOTS, W, type Room } from './room';

const DAD_FACE: Record<Tone, [Eyes, Mouth]> = {
  sweet: ['worried', 'smile'],
  yell: ['angry', 'open'],
  bribe: ['neutral', 'smile'],
  guilt: ['crying', 'frown'],
};
const REACT_FACE: Record<'wife' | 'kid', Record<Result, [Eyes, Mouth]>> = {
  wife: { great: ['neutral', 'smile'], ok: ['shut', 'flat'], bad: ['angry', 'frown'] },
  kid: { great: ['neutral', 'smile'], ok: ['smug', 'flat'], bad: ['smug', 'smirk'] },
};
const WIFE_MOOD_FACE: Record<string, [Eyes, Mouth]> = {
  tired: ['shut', 'flat'], romantic: ['neutral', 'frown'], worried: ['wide', 'o'], petty: ['smug', 'flat'], fedup: ['angry', 'flat'], amused: ['neutral', 'smirk'],
};
const KID_MOOD_FACE: Record<string, [Eyes, Mouth]> = {
  smug: ['smug', 'smirk'], bored: ['shut', 'flat'], hungry: ['neutral', 'o'], scared: ['wide', 'frown'], rebel: ['angry', 'smirk'], sleepy: ['shut', 'o'],
};
const ICON: Record<Result, [string, string]> = { great: ['♥', '#E8457A'], ok: ['...', '#ffffff'], bad: ['💢', '#D3202A'] };

export class Plead extends Phaser.Scene {
  private r!: Room;
  private alive = true;
  /** Lines shown recently (this game and previous ones) so we avoid repeats. */
  private recent = new Set<string>();
  private shown: string[] = [];

  constructor() {
    super('Plead');
  }

  create() {
    commonKeys(this);
    this.alive = true;
    this.events.once('shutdown', () => {
      this.alive = false;
      rememberLines(this.shown);
    });
    music('none');
    this.recent = loadRecent();
    this.shown = [];
    void this.run();
  }

  /** Pick a line from a pool, avoiding recent ones, and remember it. */
  private line(pool: readonly string[]) {
    const l = pickFresh(pool, Math.random, this.recent);
    this.recent.add(l);
    this.shown.push(l);
    return l;
  }

  private w(ms: number) {
    return wait(this, ms);
  }

  private async run() {
    await crashPark(this, 'brown');
    if (!this.alive) return;

    const r = (this.r = buildRoom(this));
    r.dad.x = -200;
    r.bag.setVisible(false);
    r.bananas.setVisible(false);
    cut(this, W / 2, H / 2, 1);
    this.cameras.main.flash(100);

    // He storms in.
    await tweenP(this, { targets: r.dad, x: SPOTS.dad.x, duration: 260, ease: 'Quad.out' });
    r.dad.setFace('wide', 'open').setPose('up').shout(600);
    sayAt(this, r, 'man', r.dad, this.line(ENTRANCE), { ms: 1300 });
    await this.w(1300);

    // Bag slam.
    r.bag.setVisible(true).setY(-200);
    r.bananas.setVisible(true).setY(-400);
    this.tweens.add({ targets: r.bananas, y: SPOTS.bag.y - 190, duration: 220, ease: 'Quad.in' });
    await tweenP(this, { targets: r.bag, y: SPOTS.bag.y, duration: 220, ease: 'Quad.in' });
    sfx.boom();
    this.cameras.main.shake(200, 0.015);
    addFlies(this, r, 4);
    r.dad.setPose('reach');

    cut(this, SPOTS.dad.x + 40, SPOTS.dad.y + 30, 1.7);
    r.dad.setFace('angry', 'open').shout(1600);
    sayAt(this, r, 'man', r.dad, this.line(EMERGENCY), { ms: 2200, dy: 150, size: 30 });
    await this.w(2300);

    // The stare.
    cut(this, W / 2, H / 2, 1);
    r.dad.setFace('angry', 'grit').setPose('hips');
    sfx.buzz();
    await this.w(900);
    sfx.buzz();

    let respect = startingRespect(state.distance, state.ignoredTexts);
    if (state.ignoredTexts > 0) {
      sayAt(this, r, 'wife', r.wife, `You ignored my texts. ${state.ignoredTexts > 1 ? `${state.ignoredTexts} times.` : ''}`, { ms: 1500 });
      r.wife.setFace('angry', 'flat');
      await this.w(1600);
    }

    for (const m of familyOrder()) {
      if (!this.alive) return;
      respect += await this.round(m);
    }

    // Verdict
    cut(this, W / 2, H / 2, 1);
    r.dad.setFace('worried', 'grit').setPose('down');
    for (let i = 0; i < 3; i++) {
      sfx.buzz();
      await this.w(450);
    }
    const need = threshold(state.redemptions);
    const ok = redeemed(respect, state.redemptions);
    const meter = this.add
      .text(W / 2, 40, `FAMILY RESPECT  ${Math.max(0, respect)} / ${need}`, { fontFamily: SHOUT, fontSize: '40px', color: ok ? '#8BE23A' : '#D3202A', stroke: '#141414', strokeThickness: 7 })
      .setOrigin(0.5, 0);
    r.ui.add(meter);
    await this.w(900);

    if (ok) {
      r.wife.setFace('shut', 'flat');
      sayAt(this, r, 'wife', r.wife, this.line(PARDON), { ms: 2000 });
      await this.w(2100);
      r.dad.setFace('wide', 'open').setPose('up').shout(800);
      sayAt(this, r, 'man', r.dad, this.line(PROMISE), { ms: 1300 });
      await this.w(1300);
      await tweenP(this, { targets: r.dad, x: -250, duration: 300, ease: 'Quad.in' });
      state.redemptions += 1;
      this.cameras.main.fadeOut(200);
      await this.w(220);
      if (this.alive) this.scene.start('Store', { mode: 'redeemed' });
    } else {
      r.kid.setFace('smug', 'smirk');
      sayAt(this, r, 'kid', r.kid, '...', { ms: 1000 });
      await this.w(1200);
      if (this.alive) this.scene.start('Finale');
    }
  }

  /** One family member: hint, choose a line, they react. Returns the respect gained. */
  private async round(m: Member): Promise<number> {
    const r = this.r;
    const round = dealRound(m, Math.random, this.recent);
    const mood: Mood = round.mood;
    for (const l of [round.hint, ...round.choices.map((c) => c.line)]) {
      this.recent.add(l);
      this.shown.push(l);
    }
    const target = m.id === 'baby' ? { x: r.baby.x, y: r.baby.y - 10 } : m.id === 'kid' ? r.kid : r.wife;

    // Close-up on them with their hint line.
    cut(this, target.x - 40, target.y + 40, 1.5);
    if (m.id === 'kid') r.kid.setFace(...KID_MOOD_FACE[mood.id] ?? ['neutral', 'flat']);
    if (m.id === 'wife') r.wife.setFace(...WIFE_MOOD_FACE[mood.id] ?? ['shut', 'flat']);
    if (m.id === 'baby') r.baby.setTexture(mood.id === 'cranky' || mood.id === 'teething' ? 'baby_scream' : 'baby_calm');
    const hintBubble = sayAt(this, r, m.id === 'baby' ? 'baby' : m.id, target, round.hint, { ms: 0, dy: m.id === 'baby' ? 130 : 160 });
    await this.w(500);

    const choice = await this.choose(m, round.choices);
    hintBubble.destroy();

    // Dad delivers the line (wide shot so you see everyone's faces).
    cut(this, W / 2 - 120, H / 2 + 20, 1.2);
    const [de, dm] = DAD_FACE[choice.tone];
    r.dad.setFace(de, dm).setPose(choice.tone === 'yell' ? 'up' : choice.tone === 'guilt' ? 'face' : 'reach');
    if (choice.tone === 'yell') {
      r.dad.shout(1200);
      this.cameras.main.shake(400, 0.008);
    }
    sayAt(this, r, 'man', r.dad, choice.line, { ms: 1900, size: choice.tone === 'yell' ? 32 : 24 });
    await this.w(2000);

    // Reaction.
    const pts = score(mood, choice.tone);
    const res = resultOf(pts);
    cut(this, target.x - 40, target.y + 40, 1.5);
    if (m.id === 'baby') {
      r.baby.setTexture(res === 'bad' ? 'baby_scream' : 'baby_calm');
      if (res === 'bad') this.tweens.add({ targets: r.baby, x: r.baby.x + 4, duration: 40, yoyo: true, repeat: 12 });
    } else {
      const [e, mo] = REACT_FACE[m.id][res];
      (m.id === 'kid' ? r.kid : r.wife).setFace(e, mo);
    }
    sayAt(this, r, m.id === 'baby' ? 'baby' : m.id, target, this.line(m.reactions[res]), { ms: 1500, dy: m.id === 'baby' ? 130 : 160 });
    const [icon, col] = ICON[res];
    const ic = this.add.text(target.x + 90, target.y - 120, icon, { fontFamily: SHOUT, fontSize: '64px', color: col, stroke: '#141414', strokeThickness: 6 }).setOrigin(0.5);
    r.world.add(ic);
    this.tweens.add({ targets: ic, y: ic.y - 40, alpha: 0, delay: 900, duration: 500, onComplete: () => ic.destroy() });
    if (res === 'bad') sfx.honk();
    else if (res === 'great') sfx.pickup();
    await this.w(1600);
    return pts;
  }

  /** Bottom panel with four lines. Keys 1-4 or tap. */
  private choose(m: Member, choices: Choice[]): Promise<Choice> {
    const r = this.r;
    return new Promise((resolve) => {
      const items: Phaser.GameObjects.GameObject[] = [];
      const panel = this.add.rectangle(W / 2, H - 120, W, 240, 0x000000, 0.82);
      const title = this.add.text(30, H - 232, `What do you say to the ${m.name.toLowerCase()}?`, { fontFamily: SHOUT, fontSize: '30px', color: '#F7D93A' });
      items.push(panel, title);
      let done = false;
      const pick = (i: number) => {
        if (done) return;
        done = true;
        sfx.select();
        this.input.keyboard?.off('keydown', onKey);
        for (const o of items) o.destroy();
        resolve(choices[i]);
      };
      choices.forEach((c, i) => {
        const x = i % 2 ? W / 2 + 10 : 20;
        const y = H - 190 + Math.floor(i / 2) * 90;
        const btn = this.add.rectangle(x, y, W / 2 - 30, 80, 0x2a2a35).setOrigin(0).setStrokeStyle(3, 0x555566).setInteractive({ useHandCursor: true });
        const t = this.add.text(x + 16, y + 40, `${i + 1}   ${c.line}`, {
          fontFamily: c.tone === 'yell' ? SHOUT : TALK,
          fontStyle: c.tone === 'yell' ? 'normal' : '700',
          fontSize: c.tone === 'yell' ? '24px' : '20px',
          color: c.tone === 'yell' ? '#FF6B6B' : '#ffffff',
          wordWrap: { width: W / 2 - 70 },
        }).setOrigin(0, 0.5);
        btn.on('pointerover', () => btn.setFillStyle(0x3d3d50));
        btn.on('pointerout', () => btn.setFillStyle(0x2a2a35));
        btn.on('pointerdown', () => pick(i));
        items.push(btn, t);
      });
      r.ui.add(items);
      const onKey = (e: KeyboardEvent) => {
        const n = Number(e.key);
        if (n >= 1 && n <= 4) pick(n - 1);
      };
      this.input.keyboard?.on('keydown', onKey);
    });
  }
}
