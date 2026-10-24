import Phaser from 'phaser';

export type Eyes = 'neutral' | 'worried' | 'angry' | 'wide' | 'crying' | 'smug' | 'shut' | 'disdain';
export type Mouth = 'flat' | 'frown' | 'smile' | 'smirk' | 'open' | 'grit' | 'o' | 'wail' | 'chew';
export type Kind = 'man' | 'kid' | 'wife';
export type Pose = 'down' | 'up' | 'hips' | 'reach' | 'face' | 'wheel' | 'hold' | 'drive';

/** Face textures are loaded at this multiple of their 200px design size. */
export const FACE_RES = 3;
/** Body textures are loaded at this multiple of their design size. */
export const BODY_RES = 2;

/**
 * A stick figure. The container origin is the centre of the head, and the
 * head is 180px across at scale 1. Body, arms and face layers can be swapped
 * or faded, which is how the kid turns into the man.
 */
export class Person extends Phaser.GameObjects.Container {
  kind: Kind;
  torso?: Phaser.GameObjects.Image;
  torso2?: Phaser.GameObjects.Image;
  arms: Phaser.GameObjects.Graphics;
  head: Phaser.GameObjects.Image;
  layers: Record<string, Phaser.GameObjects.Image> = {};
  eyes: Phaser.GameObjects.Image;
  mouth: Phaser.GameObjects.Image;
  pose: Pose = 'down';
  private bobTween?: Phaser.Tweens.Tween;
  armSwing = 0;
  /** Arm length multiplier; the kid has shorter arms (tweened up when he grows). */
  armScale = 1;

  constructor(scene: Phaser.Scene, x: number, y: number, kind: Kind, opts: { body?: boolean } = {}) {
    super(scene, x, y);
    this.kind = kind;
    this.armScale = kind === 'kid' ? 0.8 : 1;
    const withBody = opts.body ?? true;
    const face = (key: string, dx = 0, dy = 0) => scene.add.image(dx, dy, key).setScale(1 / FACE_RES);

    if (withBody) {
      const bodyKey = kind === 'man' ? 'body_man' : kind === 'kid' ? 'body_kid' : 'body_wife';
      this.torso = scene.add.image(0, 78, bodyKey).setOrigin(0.5, 0).setScale(1 / BODY_RES);
      this.add(this.torso);
      // a second body for cross-fades (kid -> man)
      this.torso2 = scene.add.image(0, 78, 'body_man').setOrigin(0.5, 0).setScale(1 / BODY_RES).setAlpha(0);
      this.add(this.torso2);
    }
    this.arms = scene.add.graphics();
    this.add(this.arms);

    if (kind === 'wife') {
      this.head = face('wife_head', 20, 6);
      this.add(this.head);
    } else {
      this.head = face('head_plain');
      this.add(this.head);
      this.layers.manHair = face('man_hair');
      this.layers.stubble = face('stubble');
      this.layers.kidHair = face('kid_hair');
      this.add([this.layers.manHair, this.layers.stubble]);
      const isMan = kind === 'man';
      this.layers.manHair.setAlpha(isMan ? 1 : 0);
      this.layers.stubble.setAlpha(isMan ? 1 : 0);
    }
    this.eyes = face('eyes_neutral');
    this.mouth = face('mouth_flat');
    this.add([this.eyes, this.mouth]);
    if (kind !== 'wife') {
      this.layers.glasses = face('glasses').setAlpha(kind === 'man' ? 1 : 0);
      this.add(this.layers.glasses);
      this.add(this.layers.kidHair); // over the eyes line, under nothing
      this.layers.kidHair.setAlpha(kind === 'kid' ? 1 : 0);
    }
    this.drawArms();
    scene.add.existing(this);
  }

  setFace(eyes: Eyes, mouth: Mouth): this {
    this.eyes.setTexture(`eyes_${eyes}`);
    this.mouth.setTexture(`mouth_${mouth}`);
    return this;
  }

  setPose(p: Pose): this {
    this.pose = p;
    this.drawArms();
    return this;
  }

  drawArms() {
    const g = this.arms;
    g.clear();
    if (!this.torso) return;
    const s = this.armScale;
    const sh = 100 * s; // shoulder y
    const sx = 28 * s;
    const sw = this.armSwing;
    g.lineStyle(7, 0x141414, 1);
    const arm = (side: number, pts: number[][]) => {
      g.beginPath();
      g.moveTo(side * sx, sh);
      for (const [x, y] of pts) g.lineTo(side * x * s, y * s);
      g.strokePath();
      // round black hand, like the short
      const [hx, hy] = pts[pts.length - 1];
      g.fillStyle(0x141414, 1).fillCircle(side * hx * s, hy * s, 8.5 * s);
    };
    for (const side of [-1, 1]) {
      switch (this.pose) {
        case 'down':
          arm(side, [[50, 150 + sw * side * 6], [54, 196 + sw * side * 8]]);
          break;
        case 'up':
          arm(side, [[84, 70], [96, -10 + sw * side * 10]]);
          break;
        case 'hips':
          arm(side, [[72, 140], [42, 176]]);
          break;
        case 'reach':
          arm(side, [[86, 120], [150, 116 + side * 10]]);
          break;
        case 'face':
          arm(side, [[70, 150], [36, 128]]);
          break;
        case 'wheel':
          arm(side, [[60, 150], [side > 0 ? 110 : 70, 150]]);
          break;
        case 'drive':
          // elbows out, hands up on the steering wheel (the in-car close-up)
          arm(side, [[100, 132], [74, 110]]);
          break;
        case 'hold':
          arm(side, [[62, 160], [30, 170]]);
          break;
      }
    }
  }

  /** Little idle bob, like the jittery shorts animation. */
  idle(amount = 4, speed = 380): this {
    this.bobTween?.stop();
    const y0 = this.y;
    this.bobTween = this.scene.tweens.add({ targets: this, y: y0 - amount, duration: speed, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    return this;
  }

  stopIdle(): this {
    this.bobTween?.stop();
    return this;
  }

  /** Quick shake used when shouting. */
  shout(ms = 500): this {
    const x0 = this.x;
    this.scene.tweens.add({ targets: this, x: x0 + 5, duration: 40, yoyo: true, repeat: Math.round(ms / 80), onComplete: () => (this.x = x0) });
    return this;
  }
}
