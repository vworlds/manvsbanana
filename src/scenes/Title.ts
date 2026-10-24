import Phaser from 'phaser';
import { Person } from '../art/Person';
import { music, sfx } from '../audio/sfx';
import { SHOUT, TALK } from '../fonts';
import { state } from '../state/GameState';
import { commonKeys, soundState } from './common';

export class Title extends Phaser.Scene {
  constructor() {
    super('Title');
  }

  create() {
    commonKeys(this);
    music('none');
    const { width: W, height: H } = this.scale;
    this.cameras.main.setBackgroundColor('#000');

    const burst = this.add.image(W * 0.72, H * 0.55, 'burst_yellow').setScale(0.75).setAlpha(0.95);
    this.tweens.add({ targets: burst, angle: 360, duration: 60000, repeat: -1 });
    const mask = this.add.graphics().fillCircle(W * 0.72, H * 0.55, 270).createGeometryMask();
    burst.setMask(mask);

    const man = new Person(this, W * 0.72, H * 0.47, 'man').setScale(1.15).setFace('worried', 'grit').setPose('face');
    man.idle(6, 300);
    const bunch = this.add.image(W * 0.72 - 170, H * 0.8, 'banana_green').setScale(0.9).setAngle(-15);
    this.tweens.add({ targets: bunch, angle: 15, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.inOut' });

    this.add.text(70, 120, 'Man VS Banana', { fontFamily: SHOUT, fontSize: '104px', color: '#fff', stroke: '#141414', strokeThickness: 10 });
    this.add.text(76, 240, 'An endless banana emergency', { fontFamily: TALK, fontStyle: '900', fontSize: '28px', color: '#F7D93A' });

    const lines = [
      '↑ ↓  or swipe  —  change lane',
      'SPACE / →  or right edge  —  TURBO (it runs out)',
      '←  or left edge  —  BRAKE (refills turbo a bit)',
      'ENTER  or tap the phone  —  text your wife back',
      'Get home before they go brown. They will want more.',
    ];
    this.add.text(78, 300, lines.join('\n'), { fontFamily: TALK, fontStyle: '700', fontSize: '21px', color: '#ddd', lineSpacing: 9 });

    if (state.best > 0)
      this.add.text(78, 500, `Best father: ${state.best.toLocaleString()} m   ·   Fathers who failed: ${state.fathers.length}`, {
        fontFamily: TALK, fontStyle: '900', fontSize: '20px', color: '#9FD5F2',
      });

    const start = this.add.text(78, 570, 'PRESS SPACE / TAP TO DRIVE', { fontFamily: SHOUT, fontSize: '48px', color: '#F7D93A', stroke: '#141414', strokeThickness: 6 });
    this.tweens.add({ targets: start, alpha: 0.35, duration: 450, yoyo: true, repeat: -1 });
    const sound = this.add.text(78, 650, `M: mute · V: voices (${soundState()})`, { fontFamily: TALK, fontSize: '16px', color: '#888' });
    this.input.keyboard?.on('keydown', () => this.time.delayedCall(10, () => sound.setText(`M: mute · V: voices (${soundState()})`)));

    const go = () => {
      sfx.select();
      state.newDynasty();
      this.cameras.main.flash(120, 255, 255, 255);
      this.time.delayedCall(120, () => this.scene.start('Store', { mode: 'new' }));
    };
    this.input.keyboard?.once('keydown-SPACE', go);
    this.input.keyboard?.once('keydown-ENTER', go);
    this.input.once('pointerdown', go);
  }
}
