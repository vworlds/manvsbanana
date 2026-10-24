import Phaser from 'phaser';
import { SHOUT, TALK } from '../fonts';

export interface BubbleOpts {
  /** Where the tail points (world coords). */
  tailX?: number;
  tailY?: number;
  width?: number;
  ms?: number;
  shout?: boolean;
  size?: number;
  depth?: number;
  /** Final container scale (world bubbles are counter-scaled against camera zoom). */
  scale?: number;
}

/** How long a line stays up so it can be read: ~1.2s plus 60ms per character (never less than asked). */
export function readTime(text: string, ms = 0): number {
  return Math.max(ms, 1200 + text.length * 60);
}

/** True when a line is written in capitals, so it gets the shouty treatment. */
export const isShout = (text: string) => /[A-Z]{3}/.test(text) && text === text.toUpperCase();

/** Size of a bubble's body in local units (for keeping it on screen). */
export function bubbleSize(c: Phaser.GameObjects.Container) {
  const t = c.list[1] as Phaser.GameObjects.Text;
  return { w: Math.max(t.width + 40, 120), h: t.height + 30 };
}

/** Comic speech bubble. Shout lines get a jagged red outline and a punchier font. */
export function bubble(scene: Phaser.Scene, x: number, y: number, text: string, o: BubbleOpts = {}) {
  const shout = o.shout ?? isShout(text);
  const width = o.width ?? 380;
  const size = o.size ?? (shout ? 34 : 24);
  const label = scene.add
    .text(0, 0, text, {
      fontFamily: shout ? SHOUT : TALK,
      fontSize: `${size}px`,
      fontStyle: shout ? 'normal' : '900',
      color: shout ? '#D3202A' : '#141414',
      align: 'center',
      wordWrap: { width: width - 36 },
      lineSpacing: shout ? -2 : 2,
    })
    .setOrigin(0.5);
  const w = Math.max(label.width + 40, 120);
  const h = label.height + 30;
  const g = scene.add.graphics();
  const sc = o.scale ?? 1;
  const tx = ((o.tailX ?? x) - x) / sc;
  const ty = ((o.tailY ?? y + h / 2 + 40) - y) / sc;

  g.fillStyle(0xffffff, 1);
  g.lineStyle(5, 0x141414, 1);
  if (shout) {
    // jagged burst
    const pts: Phaser.Math.Vector2[] = [];
    const n = 22;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const r = i % 2 ? 1 : 1.16;
      pts.push(new Phaser.Math.Vector2(Math.cos(a) * (w / 2) * r, Math.sin(a) * (h / 2 + 8) * r));
    }
    g.fillPoints(pts, true);
    g.strokePoints(pts, true);
  } else {
    g.fillRoundedRect(-w / 2, -h / 2, w, h, 22);
    g.strokeRoundedRect(-w / 2, -h / 2, w, h, 22);
  }
  // tail: points at the speaker, always poking out of the bubble. When the
  // speaker is beside the bubble (e.g. the HUD face panel) it comes out of the side.
  const side = Math.abs(tx) > w / 2 && Math.abs(ty) < h / 2 + 20;
  let b1: [number, number];
  let b2: [number, number];
  let tip: [number, number];
  if (side) {
    const sx = Math.sign(tx);
    const edge = sx * (w / 2 - (shout ? -2 : 4));
    const by = Phaser.Math.Clamp(ty, -h / 2 + 18, h / 2 - 18);
    b1 = [edge, by - 14];
    b2 = [edge, by + 14];
    tip = [sx * (w / 2 + (shout ? 46 : 32)), Phaser.Math.Clamp(ty, -h / 2, h / 2)];
  } else {
    const tipX = Phaser.Math.Clamp(tx * 0.6, -w / 2 + 10, w / 2 - 10);
    const tipY = Math.sign(ty || 1) * Math.max(Math.abs(ty * 0.6), h / 2 + (shout ? 34 : 26));
    const bx = Phaser.Math.Clamp(tx * 0.25, -w / 2 + 30, w / 2 - 30);
    const by = (ty > 0 ? h / 2 - 3 : -h / 2 + 3) + (shout ? Math.sign(ty || 1) * 8 : 0);
    b1 = [bx - 14, by];
    b2 = [bx + 14, by];
    tip = [tipX, tipY];
  }
  g.fillTriangle(b1[0], b1[1], b2[0], b2[1], tip[0], tip[1]);
  g.lineBetween(b1[0], b1[1], tip[0], tip[1]);
  g.lineBetween(b2[0], b2[1], tip[0], tip[1]);

  const c = scene.add.container(x, y, [g, label]).setDepth(o.depth ?? 1000);
  c.setScale(0.2 * sc);
  scene.tweens.add({ targets: c, scale: sc, duration: 140, ease: 'Back.out' });
  if (o.ms !== 0) {
    scene.time.delayedCall(o.ms ?? 1800, () => {
      scene.tweens.add({ targets: c, scale: 0, alpha: 0, duration: 120, onComplete: () => c.destroy() });
    });
  }
  return c;
}

/** Big centred caption with a heavy outline, like the cards in the short. */
export function caption(scene: Phaser.Scene, x: number, y: number, text: string, size = 72, color = '#FFFFFF') {
  return scene.add
    .text(x, y, text, {
      fontFamily: SHOUT,
      fontSize: `${size}px`,
      color,
      stroke: '#141414',
      strokeThickness: Math.round(size / 7),
      align: 'center',
    })
    .setOrigin(0.5)
    .setDepth(2000);
}
