import Phaser from 'phaser';
import { isMuted, toggleMute, unlock } from '../audio/sfx';
import { TALK } from '../fonts';

/** Audio unlock + M (mute) toggle + a small status toast. */
export function commonKeys(scene: Phaser.Scene) {
  const kb = scene.input.keyboard;
  scene.input.on('pointerdown', unlock);
  kb?.on('keydown', unlock);
  kb?.on('keydown-M', () => toast(scene, isMutedLabel(toggleMute())));
}

const isMutedLabel = (m: boolean) => (m ? 'Sound OFF' : 'Sound ON');

export function toast(scene: Phaser.Scene, text: string) {
  const t = scene.add
    .text(scene.scale.width / 2, 30, text, { fontFamily: TALK, fontStyle: '900', fontSize: '22px', color: '#fff', backgroundColor: '#000a', padding: { x: 12, y: 6 } })
    .setOrigin(0.5, 0)
    .setDepth(5000);
  scene.tweens.add({ targets: t, alpha: 0, delay: 1000, duration: 400, onComplete: () => t.destroy() });
}

export const soundState = () => (isMuted() ? 'muted' : 'sound on');

/** Promise-based wait on the scene clock (respects scene pause/timeScale). */
export function wait(scene: Phaser.Scene, ms: number) {
  return new Promise<void>((resolve) => scene.time.delayedCall(ms, resolve));
}

/** Promise-based tween. */
export function tweenP(scene: Phaser.Scene, cfg: Phaser.Types.Tweens.TweenBuilderConfig) {
  return new Promise<void>((resolve) => scene.tweens.add({ ...cfg, onComplete: () => resolve() }));
}

/** Resolves on the first key in `keys` or a tap anywhere. */
export function waitForInput(scene: Phaser.Scene, keys = ['SPACE', 'ENTER']) {
  return new Promise<string>((resolve) => {
    const kb = scene.input.keyboard;
    let done = false;
    const finish = (v: string) => {
      if (done) return;
      done = true;
      for (const k of keys) kb?.off(`keydown-${k}`);
      scene.input.off('pointerdown', onPtr);
      resolve(v);
    };
    const onPtr = () => finish('TAP');
    for (const k of keys) kb?.once(`keydown-${k}`, () => finish(k));
    scene.input.on('pointerdown', onPtr);
  });
}
