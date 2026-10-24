import Phaser from 'phaser';
import { Person, type Eyes, type Mouth } from '../art/Person';
import { makeCar, makeNpcCar, type Car } from '../art/car';
import { music, setTempo, sfx, speak } from '../audio/sfx';
import { bus } from '../bus';
import { SHOUT } from '../fonts';
import { crash, freshen, isRotten, stageOf, tick, type Stage } from '../logic/ripeness';
import { baseSpeed, homeDistance, PX_PER_M, stepGauge, trafficInterval, TURBO, TURBO_SPEED, type Gauge } from '../logic/trip';
import { debug, state } from '../state/GameState';
import { commonKeys } from './common';

const W = 1280;
const ROAD_TOP = 385;
const ROAD_BOT = 665;
const LANES = [432, 525, 618];
const GROUND = (lane: number) => LANES[lane] + 36;
const CAR_X = 260;
const CAR_SCALE = 0.55;
const CAR_HALF = 100;

type Kind = 'car' | 'ped' | 'ice' | 'fresh' | 'chant' | 'nitro' | 'decor';
interface Thing {
  kind: Kind;
  obj: Phaser.GameObjects.Components.Transform & Phaser.GameObjects.GameObject & { setDepth(d: number): unknown };
  lane: number;
  own: number; // own forward speed as a fraction of world speed
  vy: number;
  hit: boolean;
  /** Traffic cars: spin their wheels. */
  car?: Car;
}

const CRASH_LINES = ['FUCK!', 'SHIT SHIT SHIT!', 'MOVE, ASSHOLE!', 'GODDAMN IT!', 'OUT OF MY WAY!', 'COME ON COME ON COME ON!', 'LEARN TO DRIVE, DICKHEAD!'];
const PED_LINES = ['YIELD MY ASS!', 'SORRY! BANANA EMERGENCY!', 'GET OFF THE ROAD!', 'I GOT BANANAS HERE!'];
const IDLE_LINES = [
  'I GOTTA GET THESE BANANAS HOME!',
  'COME ON COME ON, I GOT BANANAS HERE!',
  "DON'T TURN YELLOW. DON'T TURN YELLOW.",
  "Breathe. They're just bananas.",
  "THEY'RE NOT JUST BANANAS!",
  'Hold on, babies. Daddy\'s coming.',
  'Why is every light red? WHY?',
];
const PICKUP_TEXT: Record<string, string> = { ice: 'CHILLED!', fresh: 'FRESH BUNCH!', chant: "DON'T TURN YELLOW!", nitro: 'TURBO REFILL!' };
const HOME_LINES = ['I CAN SEE THE HOUSE!', 'ALMOST THERE, BABIES!', 'HOME STRETCH! HOME STRETCH!', 'HOLD ON, BANANAS! WE\'RE CLOSE!'];

export class Drive extends Phaser.Scene {
  private things: Thing[] = [];
  private car!: Phaser.GameObjects.Container;
  private carBody!: Phaser.GameObjects.Container;
  private driver!: Person;
  private carBananas!: Phaser.GameObjects.Image;
  private playerCar!: Car;
  private exhaust!: Phaser.GameObjects.Particles.ParticleEmitter;
  private gauge: Gauge = { level: 1, empty: false };
  private tripDist = 0;
  private home = 0;
  private houseSpawned = false;
  private homeLineSaid = false;
  private wasEmpty = false;
  private lane = 1;
  private ripeness = 0;
  private stage: Stage = 'green';
  private elapsed = 0;
  private speed = 0;
  private slowmo = 1;
  private recover = 1;
  private invuln = 0;
  private chilled = 0;
  private boost = 0;
  private turboTouch = false;
  private nextTraffic = 1.2;
  private nextCrosswalk = 6;
  private nextPickup = 4;
  private nextPhone = 14;
  private nextIdleLine = 5;
  private over = false;
  private bg: Record<string, Phaser.GameObjects.TileSprite> = {};
  private speedLines!: Phaser.GameObjects.Image;
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private swipeStart?: { x: number; y: number; t: number };

  constructor() {
    super('Drive');
  }

  init(data: { mode?: 'new' | 'redeemed' | 'delivery' }) {
    this.things = [];
    this.gauge = { level: 1, empty: false };
    this.tripDist = 0;
    this.home = homeDistance(state.trip);
    this.houseSpawned = false;
    this.homeLineSaid = false;
    this.wasEmpty = false;
    this.lane = 1;
    this.ripeness = 0;
    this.stage = 'green';
    this.elapsed = 0;
    this.slowmo = 1;
    this.recover = 1;
    this.invuln = 0;
    this.chilled = 0;
    this.boost = 0;
    this.turboTouch = false;
    this.nextTraffic = 1.2;
    this.nextCrosswalk = 6 + Math.random() * 3;
    this.nextPickup = 4;
    this.nextPhone = 12 + Math.random() * 6;
    this.nextIdleLine = 6;
    this.over = false;
    this.registry.set('driveMode', data.mode ?? 'new');
  }

  create() {
    commonKeys(this);
    music('drive');
    setTempo(1);
    this.buildBackground();
    this.buildCar();

    this.speedLines = this.add.image(W / 2, 360, 'burst_blue').setAlpha(0).setDepth(900).setBlendMode(Phaser.BlendModes.ADD);

    this.cursors = this.input.keyboard?.createCursorKeys();
    const kb = this.input.keyboard;
    kb?.on('keydown-UP', () => this.changeLane(-1));
    kb?.on('keydown-W', () => this.changeLane(-1));
    kb?.on('keydown-DOWN', () => this.changeLane(1));
    kb?.on('keydown-S', () => this.changeLane(1));
    kb?.on('keydown-ESC', () => this.quitToTitle());

    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (this.registry.get('phoneOpen') && this.registry.get('phoneHit')?.(p.x, p.y)) return;
      if (p.x > W * 0.72) this.turboTouch = true;
      else this.swipeStart = { x: p.x, y: p.y, t: this.time.now };
    });
    this.input.on('pointerup', (p: Phaser.Input.Pointer) => {
      this.turboTouch = false;
      if (!this.swipeStart) return;
      const dy = p.y - this.swipeStart.y;
      if (Math.abs(dy) > 30) this.changeLane(dy < 0 ? -1 : 1);
      else this.changeLane(p.y < this.car.y - 50 ? -1 : 1); // tap above/below the car
      this.swipeStart = undefined;
    });

    const onReply = () => {
      this.boost = 2.5;
      sfx.send();
      this.say('Sent. Now GO!', 'angry', 'grit');
    };
    const onIgnore = () => {
      state.ignoredTexts += 1;
      this.say('Shit. She\'s gonna kill me.', 'worried', 'frown');
    };
    bus.on('drive:phone-reply', onReply);
    bus.on('drive:phone-ignored', onIgnore);
    this.events.once('shutdown', () => {
      bus.off('drive:phone-reply', onReply);
      bus.off('drive:phone-ignored', onIgnore);
      this.scene.stop('Hud');
    });

    this.scene.launch('Hud');
    this.scene.bringToTop('Hud');

    this.cameras.main.fadeIn(250);
    const mode = this.registry.get('driveMode');
    const smug = mode === 'new' && state.generation > 1;
    const line =
      mode === 'redeemed'
        ? 'I WILL NOT FAIL YOU AGAIN, BANANAS!'
        : mode === 'delivery'
          ? Phaser.Utils.Array.GetRandom(['MORE?! FINE! MORE BANANAS!', 'THEY WANT MORE. OF COURSE THEY WANT MORE.', 'ONE MORE RUN. FOR RESPECT. FOR NOTHING.'])
          : smug
            ? 'Ha. I will NEVER end up like Dad.'
            : 'FUCK FUCK FUCK FUCK! I GOTTA GET THESE BANANAS HOME BEFORE THEY GO BAD!';
    this.time.delayedCall(350, () => this.cutIn(line, smug ? 'smug' : 'worried', smug ? 'smirk' : 'grit', 1500));
  }

  // ------------------------------------------------------------- building
  private buildBackground() {
    const sky = this.add.graphics().setDepth(0);
    sky.fillGradientStyle(0x7ec8f0, 0x7ec8f0, 0xd6eefa, 0xd6eefa, 1).fillRect(0, 0, W, 340);
    this.bg.skyline = this.add.tileSprite(0, 70, W, 260, 'skyline').setOrigin(0).setDepth(1);
    this.bg.trees = this.add.tileSprite(0, 140, W, 200, 'trees').setOrigin(0).setDepth(2);
    this.add.rectangle(0, 330, W, 55, 0xc9c9cf).setOrigin(0).setDepth(3);
    this.bg.walkTop = this.add.tileSprite(0, 335, W, 50, 'sidewalk').setOrigin(0).setDepth(3);
    this.add.rectangle(0, ROAD_TOP, W, ROAD_BOT - ROAD_TOP, 0x8e8e96).setOrigin(0).setDepth(4);
    this.add.rectangle(0, ROAD_TOP - 4, W, 8, 0x5e5e66).setOrigin(0).setDepth(4);
    this.add.rectangle(0, ROAD_BOT - 4, W, 8, 0x5e5e66).setOrigin(0).setDepth(4);
    this.bg.dash1 = this.add.tileSprite(0, (LANES[0] + LANES[1]) / 2 + 22, W, 8, 'dash').setOrigin(0).setDepth(5);
    this.bg.dash2 = this.add.tileSprite(0, (LANES[1] + LANES[2]) / 2 + 22, W, 8, 'dash').setOrigin(0).setDepth(5);
    this.bg.walkBot = this.add.tileSprite(0, ROAD_BOT + 4, W, 60, 'sidewalk').setOrigin(0).setDepth(4);
  }

  private buildCar() {
    const c = makeCar(this, CAR_X, GROUND(this.lane), 'green', CAR_SCALE);
    this.car = c.root;
    this.carBody = c.body;
    this.driver = c.driver;
    this.carBananas = c.bananas;
    this.playerCar = c;
    this.car.setDepth(100 + this.car.y);
    // exhaust puffs out of the back (left) so it's obvious which way we're going
    this.exhaust = this.add.particles(0, 0, 'puff', {
      follow: this.car,
      followOffset: { x: -108, y: -22 },
      speedX: { min: -260, max: -140 },
      speedY: { min: -40, max: -10 },
      lifespan: 450,
      scale: { start: 0.35, end: 1.1 },
      alpha: { start: 0.85, end: 0 },
      frequency: 90,
    });
    this.exhaust.setDepth(99 + this.car.y);
    this.tweens.add({ targets: this.carBody, y: -3, duration: 90, yoyo: true, repeat: -1 });
  }

  // ------------------------------------------------------------- input
  private changeLane(d: number) {
    if (this.over) return;
    const next = Phaser.Math.Clamp(this.lane + d, 0, 2);
    if (next === this.lane) return;
    this.lane = next;
    sfx.lane();
    this.tweens.add({ targets: this.car, y: GROUND(next), duration: 110, ease: 'Quad.out' });
    this.tweens.add({ targets: this.carBody, angle: d * -5, duration: 70, yoyo: true });
  }

  private quitToTitle() {
    music('none');
    this.scene.stop('Hud');
    this.scene.start('Title');
  }

  // ------------------------------------------------------------- speech
  private say(text: string, eyes: Eyes, mouth: Mouth, ms = 1400) {
    this.driver.setFace(eyes, mouth);
    bus.emit('hud:say', { text, eyes, mouth, ms });
    speak(text);
  }

  private cutIn(text: string, eyes: Eyes, mouth: Mouth, ms = 1100) {
    this.driver.setFace(eyes, mouth);
    sfx.sting();
    this.slowmo = 0.12;
    bus.emit('hud:cutin', { text, eyes, mouth, ms, stage: this.stage });
    speak(text);
    this.time.delayedCall(ms, () => {
      if (!this.over) this.slowmo = 1;
    });
  }

  // ------------------------------------------------------------- spawning
  private spawnCar(lane: number) {
    const key = Phaser.Utils.Array.GetRandom(['car_green', 'car_red', 'car_taxi', 'car_white']);
    const c = makeNpcCar(this, W + 160 + Math.random() * 60, GROUND(lane), key, CAR_SCALE);
    this.tweens.add({ targets: c.body, y: -2, duration: 110 + Math.random() * 40, yoyo: true, repeat: -1 });
    this.things.push({ kind: 'car', obj: c.root, lane, own: 0.25 + Math.random() * 0.25, vy: 0, hit: false, car: c });
    if (key === 'car_red' && Math.random() < 0.6) this.time.delayedCall(400, () => sfx.honk());
  }

  private spawnTraffic() {
    const recent = this.things.filter((t) => t.kind === 'car' && t.obj.x > W - 120).map((t) => t.lane);
    const difficulty = Math.min(1, this.elapsed / 90 + (state.trip - 1) * 0.15);
    const count = Math.random() < 0.15 + difficulty * 0.45 ? 2 : 1;
    const lanes = Phaser.Utils.Array.Shuffle([0, 1, 2]).filter((l) => !recent.includes(l));
    const free = new Set([0, 1, 2].filter((l) => !recent.includes(l)));
    for (const l of lanes.slice(0, count)) {
      if (free.size <= 1) break; // always leave one lane open
      free.delete(l);
      this.spawnCar(l);
    }
  }

  private spawnCrosswalk() {
    const x = W + 200;
    const stripes = this.add.image(x, ROAD_TOP + 4, 'crosswalk').setOrigin(0.5, 0).setDepth(6);
    this.things.push({ kind: 'decor', obj: stripes, lane: -1, own: 0, vy: 0, hit: false });
    const sign = this.add.image(x + 90, ROAD_TOP + 2, Math.random() < 0.5 ? 'yield' : 'light').setOrigin(0.5, 1).setScale(0.6).setDepth(50);
    this.things.push({ kind: 'decor', obj: sign, lane: -1, own: 0, vy: 0, hit: false });
    const n = 2 + (Math.random() < Math.min(0.7, this.elapsed / 80) ? 1 : 0);
    const startLanes = Phaser.Utils.Array.Shuffle([0, 1, 2]).slice(0, n);
    startLanes.forEach((l, i) => {
      const down = Math.random() < 0.5;
      const y = GROUND(l) + (down ? -50 : 50);
      const p = this.add.image(x - 30 + i * 30, y, `ped_${Phaser.Math.Between(0, 5)}`).setOrigin(0.5, 1).setScale(0.55);
      if (!down) p.setFlipX(true);
      this.things.push({ kind: 'ped', obj: p, lane: -1, own: 0, vy: (down ? 1 : -1) * (60 + Math.random() * 50), hit: false });
      this.tweens.add({ targets: p, angle: { from: -4, to: 4 }, duration: 220, yoyo: true, repeat: -1 });
    });
    if (Math.random() < 0.6) this.time.delayedCall(500, () => this.say(Phaser.Utils.Array.GetRandom(['YIELD TO WHAT?!', 'Oh come ON. Pedestrians?', 'WALK FASTER!']), 'angry', 'grit'));
  }

  private spawnPickup() {
    const busy = new Set(this.things.filter((t) => t.kind === 'car' && t.obj.x > W - 300).map((t) => t.lane));
    const lanes = [0, 1, 2].filter((l) => !busy.has(l));
    if (!lanes.length) return;
    const lane = Phaser.Utils.Array.GetRandom(lanes);
    const r = Math.random();
    // nitro shows up more often when the gauge is low
    const nitroChance = this.gauge.level < 0.4 ? 0.4 : 0.2;
    const kind: Kind = r < nitroChance ? 'nitro' : r < nitroChance + 0.3 ? 'ice' : r < nitroChance + 0.6 ? 'fresh' : 'chant';
    const key = kind === 'fresh' ? 'banana_green' : kind;
    const img = this.add.image(W + 100, GROUND(lane) - 40, key).setScale(kind === 'fresh' ? 0.45 : kind === 'chant' ? 0.85 : kind === 'nitro' ? 0.55 : 0.6);
    this.tweens.add({ targets: img, y: img.y - 12, duration: 300, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    this.things.push({ kind, obj: img, lane, own: 0, vy: 0, hit: false });
  }

  // ------------------------------------------------------------- loop
  update(_t: number, dms: number) {
    if (this.over) return;
    const realDt = Math.min(dms, 50) / 1000;
    const dt = realDt * this.slowmo;
    this.elapsed += dt;

    const holding = this.turboTouch || !!this.cursors?.space?.isDown || !!this.cursors?.right?.isDown;
    const turbo = stepGauge(this.gauge, holding, dt);
    if (holding && this.gauge.empty && !this.wasEmpty) {
      sfx.honk();
      this.say(Phaser.Utils.Array.GetRandom(['OUT OF TURBO! SHIT!', 'COME ON, CAR! COME ON!', 'Why did I buy a sedan?!']), 'worried', 'grit');
    }
    this.wasEmpty = this.gauge.empty;
    this.recover = Math.min(1, this.recover + dt * 0.8);
    this.invuln = Math.max(0, this.invuln - dt);
    this.chilled = Math.max(0, this.chilled - dt);
    this.boost = Math.max(0, this.boost - dt);
    const fast = turbo || this.boost > 0;
    this.speed = baseSpeed(state.trip, this.elapsed) * (fast ? TURBO_SPEED : 1) * this.recover;
    const metres = (this.speed * dt) / PX_PER_M;
    state.distance += metres;
    this.tripDist += metres;
    setTempo(fast ? 1.25 : 1);
    this.playerCar.roll(this.speed * dt);
    this.exhaust.frequency = fast ? 35 : 90;
    this.exhaust.setDepth(99 + this.car.y);

    // ripening
    this.ripeness = tick(this.ripeness, {
      dt,
      trip: state.trip,
      generation: state.generation,
      turbo,
      chilled: this.chilled > 0,
      debugMultiplier: debug.fastRipe,
    });
    const st = stageOf(this.ripeness);
    if (st !== this.stage) this.onStage(st);
    if (isRotten(this.ripeness)) return this.rotten();
    const left = this.home - this.tripDist;
    if (left <= 0) return this.arrive();
    if (!this.houseSpawned && left * PX_PER_M < W + 200) this.spawnHouse(left);
    if (!this.homeLineSaid && left < this.home * 0.25) {
      this.homeLineSaid = true;
      this.say(Phaser.Utils.Array.GetRandom(HOME_LINES), 'wide', 'open');
    }
    const homeStretch = left < 70; // keep the last bit clear so arriving feels good

    // background scroll
    const px = this.speed * dt;
    this.bg.skyline.tilePositionX += px * 0.05;
    this.bg.trees.tilePositionX += px * 0.25;
    this.bg.walkTop.tilePositionX += px;
    this.bg.walkBot.tilePositionX += px;
    this.bg.dash1.tilePositionX += px;
    this.bg.dash2.tilePositionX += px;
    this.speedLines.setAlpha(Phaser.Math.Linear(this.speedLines.alpha, fast ? 0.45 : 0, 0.15));
    this.speedLines.setVisible(this.speedLines.alpha > 0.01);
    this.car.setDepth(100 + this.car.y);
    this.car.setAlpha(this.invuln > 0 ? (Math.floor(this.elapsed * 14) % 2 ? 0.4 : 1) : 1);

    // spawns
    this.nextTraffic -= dt;
    this.nextCrosswalk -= dt;
    this.nextPickup -= dt;
    this.nextPhone -= dt;
    this.nextIdleLine -= dt;
    if (this.nextTraffic <= 0 && !homeStretch) {
      this.spawnTraffic();
      this.nextTraffic = trafficInterval(state.trip, this.elapsed) * (0.8 + Math.random() * 0.4);
    }
    if (this.nextCrosswalk <= 0 && !homeStretch) {
      this.spawnCrosswalk();
      this.nextTraffic = Math.max(this.nextTraffic, 1.1);
      this.nextCrosswalk = 9 + Math.random() * 6;
    }
    if (this.nextPickup <= 0) {
      this.spawnPickup();
      this.nextPickup = 5 + Math.random() * 4;
    }
    if (this.nextPhone <= 0) {
      bus.emit('hud:phone');
      sfx.phone();
      this.nextPhone = 20 + Math.random() * 10;
    }
    if (this.nextIdleLine <= 0) {
      const l = Phaser.Utils.Array.GetRandom(IDLE_LINES);
      this.say(l, l === l.toUpperCase() ? 'angry' : 'worried', l === l.toUpperCase() ? 'open' : 'grit');
      this.nextIdleLine = 6 + Math.random() * 5;
    }

    // move + collide
    for (const t of this.things) {
      t.obj.x -= this.speed * (1 - t.own) * dt;
      t.car?.roll(this.speed * t.own * dt);
      if (t.vy) t.obj.y += t.vy * dt;
      if (t.kind === 'ped') {
        // stop on the far kerb
        if (t.vy > 0 && t.obj.y > ROAD_BOT + 45) t.vy = 0;
        if (t.vy < 0 && t.obj.y < ROAD_TOP - 5) t.vy = 0;
      }
      if (t.kind !== 'decor') t.obj.setDepth(100 + t.obj.y);
      if (!t.hit) this.collide(t);
    }
    this.things = this.things.filter((t) => {
      if (t.obj.x < -300 || !t.obj.active) {
        t.obj.destroy();
        return false;
      }
      return true;
    });

    bus.emit('hud:stats', {
      ripeness: this.ripeness,
      stage: this.stage,
      distance: state.distance,
      chilled: this.chilled,
      fast,
      turbo: this.gauge.level,
      turboEmpty: this.gauge.empty,
      trip: state.trip,
      left: Math.max(0, left),
      home: this.home,
    });
  }

  private collide(t: Thing) {
    const dx = Math.abs(t.obj.x - CAR_X);
    if (t.kind === 'car') {
      if (t.lane === this.lane && dx < CAR_HALF * 2 - 20 && this.invuln <= 0) this.crashInto(t);
    } else if (t.kind === 'ped') {
      const y = t.obj.y;
      if (y > ROAD_TOP + 10 && y < ROAD_BOT + 30 && Math.abs(y - this.car.y) < 38 && dx < CAR_HALF && this.invuln <= 0) this.hitPed(t);
    } else if (t.kind !== 'decor') {
      if (t.lane === this.lane && dx < CAR_HALF) this.collect(t);
    }
  }

  private crashInto(t: Thing) {
    t.hit = true;
    this.ripeness = crash(this.ripeness);
    this.invuln = 1.3;
    this.recover = 0.35;
    sfx.crash();
    sfx.screech();
    this.cameras.main.shake(260, 0.012);
    this.tweens.add({ targets: t.obj, x: t.obj.x + 500, y: t.obj.y - 160, angle: 220, alpha: 0, duration: 700, ease: 'Quad.out' });
    this.tweens.add({ targets: this.carBody, angle: -10, duration: 80, yoyo: true, repeat: 1 });
    this.carBananas.setScale(0.48);
    this.tweens.add({ targets: this.carBananas, scale: 0.42, duration: 300 });
    this.pop(CAR_X, this.car.y - 120, 'BRUISED!', '#D3202A');
    this.say(Phaser.Utils.Array.GetRandom(CRASH_LINES), 'angry', 'open');
  }

  private hitPed(t: Thing) {
    t.hit = true;
    t.vy = 0;
    this.ripeness = crash(this.ripeness);
    this.invuln = 1.3;
    this.recover = 0.5;
    sfx.crash();
    this.cameras.main.shake(200, 0.01);
    this.tweens.killTweensOf(t.obj);
    this.tweens.add({ targets: t.obj, x: t.obj.x + 700, y: t.obj.y - 420, angle: 900, duration: 900, ease: 'Quad.out' });
    this.pop(t.obj.x, t.obj.y - 140, 'AAAAH!', '#141414');
    this.say(Phaser.Utils.Array.GetRandom(PED_LINES), 'wide', 'open');
  }

  private collect(t: Thing) {
    t.hit = true;
    sfx.pickup();
    this.tweens.killTweensOf(t.obj);
    this.tweens.add({ targets: t.obj, scale: 1.2, alpha: 0, y: t.obj.y - 60, duration: 300, onComplete: () => t.obj.destroy() });
    if (t.kind === 'ice') this.chilled = 6;
    if (t.kind === 'nitro') {
      this.gauge.level = Math.min(1, this.gauge.level + TURBO.pickup);
      this.gauge.empty = false;
    }
    if (t.kind === 'fresh') this.ripeness = freshen(this.ripeness, 0.12);
    if (t.kind === 'chant') {
      this.ripeness = freshen(this.ripeness, 0.05);
      this.invuln = 3;
      this.say("DON'T TURN YELLOW DON'T TURN YELLOW DON'T TURN YELLOW", 'shut', 'open', 1800);
    }
    this.pop(CAR_X + 40, this.car.y - 130, PICKUP_TEXT[t.kind], '#2EAA3A');
  }

  private pop(x: number, y: number, text: string, color: string) {
    const p = this.add
      .text(x, y, text, { fontFamily: SHOUT, fontSize: '40px', color, stroke: '#fff', strokeThickness: 7 })
      .setOrigin(0.5)
      .setDepth(950);
    this.tweens.add({ targets: p, y: y - 70, alpha: 0, duration: 800, ease: 'Quad.out', onComplete: () => p.destroy() });
  }

  private onStage(st: Stage) {
    const prev = this.stage;
    this.stage = st;
    this.carBananas.setTexture(`banana_${st}`);
    bus.emit('hud:stage', st);
    const worse = ['green', 'yellow', 'spotty', 'brown'].indexOf(st) > ['green', 'yellow', 'spotty', 'brown'].indexOf(prev);
    if (!worse) return;
    if (st === 'yellow') this.cutIn("DON'T TURN YELLOW DON'T TURN YELLOW!", 'wide', 'open');
    if (st === 'spotty') this.cutIn('NO NO NO NO! NOT THE SPOTS!', 'angry', 'open');
    if (st === 'brown') this.cutIn("THEY'RE GOING BROWN! FUUUUCK!", 'crying', 'wail');
  }

  /** The house (with a HOME flag) slides in on the top sidewalk exactly at the finish line. */
  private spawnHouse(left: number) {
    this.houseSpawned = true;
    const x = CAR_X + left * PX_PER_M;
    const house = this.add.image(x, ROAD_TOP + 2, 'house').setOrigin(0.5, 1).setScale(0.55).setDepth(60);
    this.things.push({ kind: 'decor', obj: house, lane: -1, own: 0, vy: 0, hit: false });
    const flag = this.add
      .text(x, ROAD_TOP - 250, 'HOME', { fontFamily: SHOUT, fontSize: '46px', color: '#F7D93A', stroke: '#141414', strokeThickness: 8 })
      .setOrigin(0.5)
      .setDepth(61);
    this.tweens.add({ targets: flag, y: flag.y - 12, duration: 300, yoyo: true, repeat: -1 });
    this.things.push({ kind: 'decor', obj: flag, lane: -1, own: 0, vy: 0, hit: false });
  }

  /** Made it home before the bananas rotted. */
  private arrive() {
    this.over = true;
    music('none');
    sfx.screech();
    this.exhaust.stop();
    this.driver.setFace('wide', 'smile');
    bus.emit('hud:cutin', { text: Phaser.Utils.Array.GetRandom(['I MADE IT! I FUCKING MADE IT!', 'HOME! HOME! THE BANANAS LIVE!', 'WHO\'S THE MAN?! I\'M THE MAN!']), eyes: 'wide', mouth: 'open', ms: 1300, stage: this.stage });
    speak('I made it!');
    this.registry.set('arrivalStage', this.stage);
    this.time.delayedCall(1400, () => {
      this.cameras.main.fadeOut(250, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.stop('Hud');
        this.scene.start('Home');
      });
    });
  }

  private rotten() {
    this.over = true;
    this.slowmo = 0.05;
    music('none');
    this.carBananas.setTexture('banana_brown');
    this.driver.setFace('crying', 'wail');
    sfx.sad();
    bus.emit('hud:cutin', { text: 'NOOOOOOOOOOO!', eyes: 'crying', mouth: 'wail', ms: 1600, stage: 'brown' });
    speak('NOOOOOOOOO!');
    this.time.delayedCall(1700, () => {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.stop('Hud');
        this.scene.start('Plead');
      });
    });
  }
}
