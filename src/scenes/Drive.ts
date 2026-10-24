import Phaser from 'phaser';
import { Person, type Eyes, type Mouth } from '../art/Person';
import { makeCar, makeNpcCar, type Car } from '../art/car';
import { music, setTempo, sfx, speak } from '../audio/sfx';
import { bus } from '../bus';
import { SHOUT } from '../fonts';
import { crash, freshen, isRotten, stageOf, tick, type Stage } from '../logic/ripeness';
import {
  crowdSize,
  eventInterval,
  lightAt,
  lightPlan,
  NPC_OWN,
  pickCorridor,
  planEvents,
  rowGap,
  rowLanes,
  twoCarChance,
  worksLength,
  type EventKind,
  type Light,
  type LightPlan,
  type Works,
} from '../logic/traffic';
import { baseSpeed, BRAKE_SPEED, homeDistance, PX_PER_M, stepGauge, TURBO, TURBO_SPEED, type Gauge } from '../logic/trip';
import { debug, state } from '../state/GameState';
import { commonKeys } from './common';

const W = 1280;
const ROAD_TOP = 385;
const ROAD_BOT = 665;
const LANE_Y = [432, 525, 618];
const GROUND = (lane: number) => LANE_Y[lane] + 36;
const CAR_X = 260;
const CAR_SCALE = 0.55;
const CAR_HALF = 100;
const SPAWN_X = W + 160;
/** The wife doesn't text once the bananas are nearly brown: the brown cut-in would bury her message. */
const PHONE_MAX_RIPENESS = 0.76;

type Kind = 'car' | 'police' | 'ped' | 'ice' | 'fresh' | 'chant' | 'nitro' | 'decor' | 'works' | 'light';
type Obj = Phaser.GameObjects.Components.Transform & Phaser.GameObjects.GameObject & { setDepth(d: number): unknown };

interface Thing {
  kind: Kind;
  obj: Obj;
  lane: number;
  /** Own forward speed as a fraction of the player's speed (road objects: 0). */
  own: number;
  vy: number;
  hit: boolean;
  car?: Car;
  /** Roadworks length in px. */
  len?: number;
  /** Traffic light. */
  plan?: LightPlan;
  clock?: number;
  light?: Light;
  lamp?: Phaser.GameObjects.Arc;
  passed?: boolean;
}

interface Police {
  thing: Thing;
  mode: 'chase' | 'block' | 'leave';
  passes: number;
  laneTimer: number;
  /** Seconds the player has been outrunning it on turbo while it's off-screen. */
  lost: number;
  /** Seconds spent chasing without getting past (it gives up eventually). */
  chaseTime: number;
  lamps: Phaser.GameObjects.Rectangle[];
  marker: Phaser.GameObjects.Text;
}

const CRASH_LINES = ['FUCK!', 'SHIT SHIT SHIT!', 'MOVE, ASSHOLE!', 'GODDAMN IT!', 'OUT OF MY WAY!', 'COME ON COME ON COME ON!', 'LEARN TO DRIVE, DICKHEAD!'];
const PED_LINES = ['YIELD MY ASS!', 'SORRY! BANANA EMERGENCY!', 'GET OFF THE ROAD!', 'I GOT BANANAS HERE!'];
const IDLE_LINES = [
  'I GOTTA GET THESE BANANAS HOME!',
  'COME ON COME ON, I GOT BANANAS HERE!',
  "DON'T TURN YELLOW. DON'T TURN YELLOW.",
  "Breathe. They're just bananas.",
  "THEY'RE NOT JUST BANANAS!",
  "Hold on, babies. Daddy's coming.",
  'Why is every light red? WHY?',
];
const PICKUP_TEXT: Record<string, string> = { ice: 'CHILLED!', fresh: 'FRESH BUNCH!', chant: "DON'T TURN YELLOW!", nitro: 'TURBO REFILL!' };
const HOME_LINES = ['I CAN SEE THE HOUSE!', 'ALMOST THERE, BABIES!', 'HOME STRETCH! HOME STRETCH!', "HOLD ON, BANANAS! WE'RE CLOSE!"];
const pick = <T,>(a: readonly T[]) => a[Math.floor(Math.random() * a.length)];

export class Drive extends Phaser.Scene {
  private things: Thing[] = [];
  private car!: Phaser.GameObjects.Container;
  private carBody!: Phaser.GameObjects.Container;
  private driver!: Person;
  private carBananas!: Phaser.GameObjects.Image;
  private playerCar!: Car;
  private exhaust!: Phaser.GameObjects.Particles.ParticleEmitter;
  private lane = 1;
  private ripeness = 0;
  private stage: Stage = 'green';
  private elapsed = 0;
  private speed = 0;
  private mult = 1;
  private slowmo = 1;
  private recover = 1;
  private invuln = 0;
  private chilled = 0;
  private boost = 0;
  private gauge: Gauge = { level: 1, empty: false };
  private wasEmpty = false;
  private turboTouch = false;
  private brakeTouch = false;
  private tripDist = 0;
  private home = 0;
  private over = false;
  private houseSpawned = false;
  private homeLineSaid = false;
  // traffic + road events
  private rowScroll = 0;
  private roadPlan: EventKind[] = [];
  private nextEvent = 3;
  private pending: EventKind | null = null;
  private eventAnchor: Thing | null = null;
  private works: (Works & { thing: Thing }) | null = null;
  private police: Police | null = null;
  private sirenTimer = 0;
  // pickups, phone, chatter
  private nextPickup = 4;
  private phoneMarks: number[] = [];
  private cutinUntil = 0;
  private nextIdleLine = 6;
  private bg: Record<string, Phaser.GameObjects.TileSprite> = {};
  private speedLines!: Phaser.GameObjects.Image;
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private swipeStart?: { x: number; y: number };

  constructor() {
    super('Drive');
  }

  init(data: { mode?: 'new' | 'redeemed' | 'delivery' }) {
    this.things = [];
    this.lane = 1;
    this.ripeness = 0;
    this.stage = 'green';
    this.elapsed = 0;
    this.mult = 1;
    this.slowmo = 1;
    this.recover = 1;
    this.invuln = 0;
    this.chilled = 0;
    this.boost = 0;
    this.gauge = { level: 1, empty: false };
    this.wasEmpty = false;
    this.turboTouch = false;
    this.brakeTouch = false;
    this.tripDist = 0;
    this.home = homeDistance(state.trip);
    this.over = false;
    this.houseSpawned = false;
    this.homeLineSaid = false;
    this.rowScroll = 0;
    // roughly how many events fit in this trip (about 22 m/s)
    const expected = Math.max(2, Math.floor(this.home / 22 / eventInterval(state.trip)));
    this.roadPlan = [...debug.events, ...planEvents(state.trip, expected, Math.random)];
    this.nextEvent = 3 + Math.random() * 2;
    this.pending = null;
    this.eventAnchor = null;
    this.works = null;
    this.police = null;
    this.sirenTimer = 0;
    this.nextPickup = 4;
    // the wife texts once or twice, at random points of the trip
    const texts = state.trip === 1 || Math.random() < 0.4 ? 1 : 2;
    this.phoneMarks = texts === 1 ? [0.2 + Math.random() * 0.45] : [0.15 + Math.random() * 0.2, 0.5 + Math.random() * 0.25];
    this.cutinUntil = 0;
    this.nextIdleLine = 6;
    this.registry.set('driveMode', data.mode ?? 'new');
  }

  create() {
    commonKeys(this);
    music('drive');
    setTempo(1);
    this.buildBackground();
    this.buildCar();
    this.speedLines = this.add.image(W / 2, 360, 'burst_blue').setAlpha(0).setDepth(900).setBlendMode(Phaser.BlendModes.ADD);

    const kb = this.input.keyboard!;
    this.keys = kb.addKeys('UP,DOWN,LEFT,RIGHT,W,S,A,D,SPACE') as Record<string, Phaser.Input.Keyboard.Key>;
    kb.on('keydown-UP', () => this.changeLane(-1));
    kb.on('keydown-W', () => this.changeLane(-1));
    kb.on('keydown-DOWN', () => this.changeLane(1));
    kb.on('keydown-S', () => this.changeLane(1));
    kb.on('keydown-ESC', () => this.quitToTitle());

    // Touch: hold left edge = brake, hold right edge = turbo, swipe or tap above/below the car = change lane.
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (this.registry.get('phoneOpen') && this.registry.get('phoneHit')?.(p.x, p.y)) return;
      this.swipeStart = { x: p.x, y: p.y };
      if (p.x > W * 0.78) this.turboTouch = true;
      else if (p.x < W * 0.2) this.brakeTouch = true;
    });
    this.input.on('pointerup', (p: Phaser.Input.Pointer) => {
      const wasEdge = this.turboTouch || this.brakeTouch;
      this.turboTouch = false;
      this.brakeTouch = false;
      if (!this.swipeStart) return;
      const dy = p.y - this.swipeStart.y;
      if (Math.abs(dy) > 30) this.changeLane(dy < 0 ? -1 : 1);
      else if (!wasEdge) this.changeLane(p.y < this.car.y - 50 ? -1 : 1);
      this.swipeStart = undefined;
    });

    const onReply = () => {
      this.boost = 2.5;
      sfx.send();
      this.say('Sent. Now GO!', 'angry', 'grit');
    };
    const onIgnore = () => {
      state.ignoredTexts += 1;
      this.say("Shit. She's gonna kill me.", 'worried', 'frown');
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
          ? pick(['MORE?! FINE! MORE BANANAS!', 'THEY WANT MORE. OF COURSE THEY WANT MORE.', 'ONE MORE RUN. FOR RESPECT. FOR NOTHING.'])
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
    this.bg.dash1 = this.add.tileSprite(0, (LANE_Y[0] + LANE_Y[1]) / 2 + 22, W, 8, 'dash').setOrigin(0).setDepth(5);
    this.bg.dash2 = this.add.tileSprite(0, (LANE_Y[1] + LANE_Y[2]) / 2 + 22, W, 8, 'dash').setOrigin(0).setDepth(5);
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
    // exhaust out of the back (left), so it's obvious which way we're going
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
  }

  // ------------------------------------------------------------- input
  private changeLane(d: number) {
    if (this.over) return;
    const next = Phaser.Math.Clamp(this.lane + d, 0, 2);
    if (next === this.lane) return;
    this.lane = next;
    sfx.lane();
    this.tweens.add({ targets: this.car, y: GROUND(next), duration: 110, ease: 'Quad.out' });
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

  /** Full-screen close-up. Never while the phone is up (it would hide it): then it's a normal line. */
  private cutIn(text: string, eyes: Eyes, mouth: Mouth, ms = 1100) {
    if (this.registry.get('phoneOpen')) return this.say(text, eyes, mouth, ms);
    this.driver.setFace(eyes, mouth);
    sfx.sting();
    this.slowmo = 0.12;
    this.cutinUntil = this.time.now + ms + 900; // plus a breather before the phone may ring
    bus.emit('hud:cutin', { text, eyes, mouth, ms, stage: this.stage });
    speak(text);
    this.time.delayedCall(ms, () => {
      if (!this.over) this.slowmo = 1;
    });
  }

  // ------------------------------------------------------------- traffic rows
  private spawnRow() {
    const count = Math.random() < twoCarChance(state.trip, this.elapsed) ? 2 : 1;
    const w = this.works;
    const worksActive = w && w.thing.obj.x + (w.thing.len ?? 0) > W - 100 ? w : undefined;
    for (const lane of rowLanes(count, Math.random, worksActive)) {
      const key = pick(['car_green', 'car_red', 'car_taxi', 'car_white']);
      const c = makeNpcCar(this, SPAWN_X, GROUND(lane), key, CAR_SCALE);
      this.tweens.add({ targets: c.body, y: -2, duration: 110 + Math.random() * 40, yoyo: true, repeat: -1 });
      this.things.push({ kind: 'car', obj: c.root, lane, own: NPC_OWN, vy: 0, hit: false, car: c });
      if (key === 'car_red' && Math.random() < 0.5) this.time.delayedCall(400, () => sfx.honk());
    }
  }

  /** Rows pause while an event waits for a clear road, and right after a crosswalk/crossroad appears. */
  private rowsAllowed(left: number) {
    if (this.pending || left < 70) return false;
    const a = this.eventAnchor;
    if (a && a.kind !== 'works' && a.obj.x > W - 100) return false;
    return true;
  }

  private roadClearAhead() {
    return !this.things.some((t) => t.kind === 'car' && t.obj.x > CAR_X + 120);
  }

  // ------------------------------------------------------------- road events
  private startEvent(kind: EventKind) {
    if (kind === 'crosswalk') this.spawnCrosswalk(false);
    else if (kind === 'crossroad') this.spawnCrosswalk(true);
    else this.spawnWorks();
  }

  private spawnCrosswalk(crossroad: boolean) {
    const x = W + (crossroad ? 320 : 200);
    const c = this.add.container(x, 0).setDepth(6);
    const walkX = crossroad ? 70 : 0;
    const anchor: Thing = { kind: crossroad ? 'light' : 'decor', obj: c, lane: -1, own: 0, vy: 0, hit: false };
    if (crossroad) {
      // side street crossing ours, a stop line, and the signal
      c.add(this.add.rectangle(walkX, 330, 170, 55, 0x8e8e96).setOrigin(0.5, 0));
      c.add(this.add.rectangle(walkX, ROAD_BOT, 170, 60, 0x8e8e96).setOrigin(0.5, 0));
      c.add(this.add.image(walkX, ROAD_TOP + 4, 'crosswalk').setOrigin(0.5, 0));
      c.add(this.add.image(-10, ROAD_TOP + 2, 'stopline').setOrigin(0.5, 0));
      const sigX = -150;
      c.add(this.add.image(sigX, ROAD_TOP + 2, 'signal').setOrigin(22 / 220, 1).setScale(0.85));
      const lamp = this.add.circle(sigX + (185 - 22) * 0.85, 0, 13, 0x22ee66).setStrokeStyle(3, 0x141414);
      c.add(lamp);
      anchor.lamp = lamp;
      // red exactly when you'd arrive at normal speed: turbo through, or brake and wait
      const v = baseSpeed(state.trip, this.elapsed) * this.recover;
      anchor.plan = lightPlan((x - 10 - (CAR_X + CAR_HALF)) / v);
      anchor.clock = 0;
      anchor.light = 'green';
      this.time.delayedCall(300, () => this.say(pick(['A LIGHT. OF COURSE THERE IS A LIGHT.', 'Make it... make it... MAKE IT!', "Don't you DARE turn red."]), 'wide', 'grit'));
    } else {
      c.add(this.add.image(walkX, ROAD_TOP + 4, 'crosswalk').setOrigin(0.5, 0));
      c.add(this.add.image(90, ROAD_TOP + 2, 'yield').setOrigin(0.5, 1).setScale(0.6));
      if (Math.random() < 0.6) this.time.delayedCall(500, () => this.say(pick(['YIELD TO WHAT?!', 'Oh come ON. Pedestrians?', 'WALK FASTER!']), 'angry', 'grit'));
    }
    this.things.push(anchor);
    this.eventAnchor = anchor;
    // Crossroads are about the light; crosswalks are about pedestrians, who always reach the kerb
    // before you can get there while braking.
    const n = crossroad ? 0 : crowdSize(state.trip, Math.random);
    const lanes = Phaser.Utils.Array.Shuffle([0, 1, 2, 0, 1, 2]).slice(0, n);
    lanes.forEach((l, i) => {
      const down = Math.random() < 0.5;
      const y = GROUND(l) + (down ? -50 : 50);
      const px = x + walkX - 40 + (i % 3) * 30;
      const p = this.add.image(px, y, `ped_${Phaser.Math.Between(0, 5)}`).setOrigin(0.5, 1).setScale(0.55);
      if (!down) p.setFlipX(true);
      this.things.push({ kind: 'ped', obj: p, lane: -1, own: 0, vy: (down ? 1 : -1) * (90 + Math.random() * 40), hit: false });
      this.tweens.add({ targets: p, angle: { from: -4, to: 4 }, duration: 220, yoyo: true, repeat: -1 });
    });
  }

  private spawnWorks() {
    const lane = Phaser.Math.Between(0, 2);
    const corridor = pickCorridor(lane, this.lane, Math.random);
    const len = worksLength(state.trip, Math.random);
    const c = this.add.container(W + 220, 0);
    const y = GROUND(lane);
    for (let cx = 70; cx < len; cx += 85) c.add(this.add.image(cx, y - 6, 'cone').setOrigin(0.5, 1).setScale(0.8));
    c.add(this.add.image(len * 0.5, y - 10, `ped_${Phaser.Math.Between(0, 5)}`).setOrigin(0.5, 1).setScale(0.5));
    c.add(this.add.image(20, y, 'barrier').setOrigin(0.5, 1).setScale(0.75));
    c.add(this.add.image(len, y, 'barrier').setOrigin(0.5, 1).setScale(0.6));
    const thing: Thing = { kind: 'works', obj: c, lane, own: 0, vy: 0, hit: false, len };
    this.things.push(thing);
    this.works = { lane, corridor, thing };
    this.eventAnchor = thing;
    this.time.delayedCall(300, () => this.say(pick(['ROADWORKS?! NOW?!', 'Who schedules roadworks at banana hour?!', 'CONES. FUCKING CONES.']), 'angry', 'open'));
  }

  private spawnPickup() {
    const busy = new Set(this.things.filter((t) => (t.kind === 'car' || t.kind === 'police') && t.obj.x > W - 300).map((t) => t.lane));
    if (this.works && this.works.thing.obj.x + (this.works.thing.len ?? 0) > W) busy.add(this.works.lane);
    const lanes = [0, 1, 2].filter((l) => !busy.has(l));
    if (!lanes.length) return;
    const lane = pick(lanes);
    const r = Math.random();
    const nitroChance = this.gauge.level < 0.4 ? 0.4 : 0.2;
    const kind: Kind = r < nitroChance ? 'nitro' : r < nitroChance + 0.3 ? 'ice' : r < nitroChance + 0.6 ? 'fresh' : 'chant';
    const key = kind === 'fresh' ? 'banana_green' : kind;
    const img = this.add.image(W + 100, GROUND(lane) - 40, key).setScale(kind === 'fresh' ? 0.45 : kind === 'chant' ? 0.85 : kind === 'nitro' ? 0.55 : 0.6);
    this.tweens.add({ targets: img, y: img.y - 12, duration: 300, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    this.things.push({ kind, obj: img, lane, own: 0, vy: 0, hit: false });
  }

  // ------------------------------------------------------------- police
  private spawnPolice() {
    if (this.police || this.over) return;
    // come up from behind, in a lane that's free behind the player
    const free = [0, 1, 2].filter((l) => !this.things.some((t) => t.kind === 'car' && t.lane === l && t.obj.x < CAR_X + 260));
    const lane = free.includes(this.lane) ? this.lane : free.length ? pick(free) : this.lane;
    const c = makeNpcCar(this, -220, GROUND(lane), 'car_police', CAR_SCALE);
    const red = this.add.rectangle(-36, -171, 30, 12, 0xff2a2a);
    const blue = this.add.rectangle(0, -171, 30, 12, 0x2a6bff);
    c.body.add([red, blue]);
    const thing: Thing = { kind: 'police', obj: c.root, lane, own: 0, vy: 0, hit: false, car: c };
    this.things.push(thing);
    const marker = this.add.text(8, GROUND(lane) - 60, '🚨', { fontSize: '34px' }).setDepth(940);
    this.police = { thing, mode: 'chase', passes: 0, laneTimer: 0, lost: 0, chaseTime: 0, lamps: [red, blue], marker };
    this.sirenTimer = 0;
  }

  /** Is `lane` free of traffic, roadworks (and optionally the player) around screen x? */
  private laneFree(lane: number, x: number, span = 240, includePlayer = true) {
    if (includePlayer && lane === this.lane && Math.abs(x - CAR_X) < span) return false;
    if (this.works && lane === this.works.lane) {
      const w = this.works.thing;
      if (x + span > w.obj.x && x - span < w.obj.x + (w.len ?? 0)) return false;
    }
    return !this.things.some((t) => t.kind === 'car' && t.lane === lane && Math.abs(t.obj.x - x) < span);
  }

  private policeMove(p: Police, dt: number, fast: boolean) {
    const t = p.thing;
    const base = baseSpeed(state.trip, this.elapsed);
    // chase: faster than you, unless you're on full turbo.
    // block: keep pace until it's in your lane, then annoyingly slower than you.
    const inFront = p.mode === 'block' && t.lane === this.lane;
    let vp = p.mode === 'chase' ? base * 1.3 : p.mode === 'block' ? (inFront ? base * 0.78 : Math.max(this.speed, base) * 1.02) : this.speed * 0.4;
    const ahead = this.things.find((o) => o.kind === 'car' && o.lane === t.lane && o.obj.x > t.obj.x && o.obj.x - t.obj.x < 260);
    const worksAhead = this.works && this.works.lane === t.lane && this.works.thing.obj.x > t.obj.x && this.works.thing.obj.x - t.obj.x < 300;
    const playerAhead = t.lane === this.lane && CAR_X > t.obj.x && CAR_X - t.obj.x < 250;
    p.laneTimer -= dt;
    // something in the way: change lane if traffic allows, otherwise follow it
    if ((ahead || worksAhead || playerAhead) && p.laneTimer <= 0) {
      const options = [t.lane - 1, t.lane + 1].filter((l) => l >= 0 && l <= 2 && this.laneFree(l, t.obj.x));
      if (options.length) this.policeLane(p, pick(options));
      else p.laneTimer = 0.3;
    }
    if (ahead && ahead.lane === t.lane) vp = Math.min(vp, this.speed * ahead.own);
    if (worksAhead && this.works!.lane === t.lane) vp = Math.min(vp, 0);
    if (playerAhead && t.lane === this.lane && p.mode !== 'leave') vp = Math.min(vp, this.speed * 0.98);
    // block mode: slide in front of the player, with a human delay
    if (p.mode === 'block' && t.lane !== this.lane && p.laneTimer <= 0 && t.obj.x > CAR_X + 230) {
      const step = this.lane > t.lane ? t.lane + 1 : t.lane - 1;
      if (this.laneFree(step, t.obj.x, 240, false)) this.policeLane(p, step);
      else p.laneTimer = 0.4;
    }
    t.obj.x += (vp - this.speed) * dt;
    t.car?.roll(Math.max(0, vp) * dt);
    // state changes
    if (p.mode === 'chase') {
      p.chaseTime += dt;
      if (p.chaseTime > 12) {
        p.mode = 'leave';
        this.say(pick(['Ha! They gave up!', 'Too much traffic for you, officer?']), 'smug', 'smirk');
      }
    }
    // off-screen behind you: it keeps up, unless you're outrunning it on turbo
    if (p.mode === 'chase' && t.obj.x < -260) {
      p.lost = fast ? p.lost + dt : 0;
      if (p.lost < 1.5) t.obj.x = -260;
    }
    p.marker.setVisible(t.obj.x < -60).setY(GROUND(t.lane) - 70).setAlpha(Math.floor(this.time.now / 200) % 2 ? 1 : 0.4);
    if (p.mode === 'chase' && t.obj.x > CAR_X + 260) {
      p.mode = 'block';
      p.laneTimer = 0.6;
      this.say(pick(['Oh, you have GOT to be kidding me.', 'PULL OVER? I HAVE BANANAS!', 'Officer, please, the bananas!']), 'worried', 'grit');
    }
    if (p.mode === 'block' && t.obj.x < CAR_X - 230) {
      p.passes += 1;
      p.mode = p.passes >= 2 ? 'leave' : 'chase';
      p.chaseTime = 0;
    }
    if (t.obj.x < -300) {
      if (p.mode === 'chase') this.say(pick(['LOST THEM! HA!', 'EAT MY BANANA DUST!', 'Bye, officer!']), 'wide', 'smile');
      this.removePolice();
    }
  }

  private policeLane(p: Police, lane: number) {
    p.thing.lane = lane;
    p.laneTimer = 0.7;
    this.tweens.add({ targets: p.thing.obj, y: GROUND(lane), duration: 260, ease: 'Sine.inOut' });
  }

  private removePolice() {
    if (!this.police) return;
    this.police.marker.destroy();
    const thing = this.police.thing;
    this.things = this.things.filter((t) => t !== thing);
    thing.obj.destroy();
    this.police = null;
  }

  private bumpPolice() {
    const p = this.police!;
    p.thing.hit = true;
    this.recover = 0.3; // it's gone, but it slowed you down
    this.invuln = 0.8;
    sfx.crash();
    this.cameras.main.shake(200, 0.01);
    this.things = this.things.filter((t) => t !== p.thing);
    p.marker.destroy();
    const o = p.thing.obj;
    this.tweens.add({ targets: o, x: o.x + 400, y: ROAD_BOT + 120, angle: 160, alpha: 0, duration: 700, ease: 'Quad.out', onComplete: () => o.destroy() });
    this.police = null;
    this.say(pick(['SORRY OFFICER! BANANA EMERGENCY!', 'Oops. That was a cop.', "I DIDN'T SEE YOU! I SAW YOU!"]), 'wide', 'open');
  }

  // ------------------------------------------------------------- loop
  update(_t: number, dms: number) {
    if (this.over) return;
    const realDt = Math.min(dms, 50) / 1000;
    const dt = realDt * this.slowmo;
    this.elapsed += dt;
    const k = this.keys;

    const braking = this.brakeTouch || k.LEFT.isDown || k.A.isDown;
    const holding = !braking && (this.turboTouch || k.SPACE.isDown || k.RIGHT.isDown || k.D.isDown);
    const turbo = stepGauge(this.gauge, holding, dt, braking);
    if (holding && this.gauge.empty && !this.wasEmpty) {
      sfx.honk();
      this.say(pick(['OUT OF TURBO! SHIT!', 'COME ON, CAR! COME ON!', 'Why did I buy a sedan?!']), 'worried', 'grit');
    }
    this.wasEmpty = this.gauge.empty;
    this.recover = Math.min(1, this.recover + dt * 0.8);
    this.invuln = Math.max(0, this.invuln - dt);
    this.chilled = Math.max(0, this.chilled - dt);
    this.boost = Math.max(0, this.boost - dt);
    const fast = !braking && (turbo || this.boost > 0);
    const target = braking ? BRAKE_SPEED : fast ? TURBO_SPEED : 1;
    // ease toward the target speed; coming back up from a brake costs no turbo
    this.mult += (target - this.mult) * Math.min(1, dt * 5);
    this.speed = baseSpeed(state.trip, this.elapsed) * this.mult * this.recover;
    const metres = (this.speed * dt) / PX_PER_M;
    state.distance += metres;
    this.tripDist += metres;
    setTempo(fast ? 1.25 : braking ? 0.85 : 1);
    this.playerCar.roll(this.speed * dt);
    this.exhaust.frequency = fast ? 35 : braking ? 220 : 90;
    this.exhaust.setDepth(99 + this.car.y);
    // nose dips when braking, lifts on turbo
    this.carBody.angle = Phaser.Math.Linear(this.carBody.angle, braking ? 2.5 : fast ? -2 : 0, 0.2);
    this.carBody.y = Math.sin(this.elapsed * 60) * 1.5;

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
      this.say(pick(HOME_LINES), 'wide', 'open');
    }

    // background
    const px = this.speed * dt;
    this.bg.skyline.tilePositionX += px * 0.05;
    this.bg.trees.tilePositionX += px * 0.25;
    this.bg.walkTop.tilePositionX += px;
    this.bg.walkBot.tilePositionX += px;
    this.bg.dash1.tilePositionX += px;
    this.bg.dash2.tilePositionX += px;
    this.speedLines.setAlpha(Phaser.Math.Linear(this.speedLines.alpha, this.mult > 1.3 ? 0.45 : 0, 0.15));
    this.speedLines.setVisible(this.speedLines.alpha > 0.01);
    this.car.setDepth(100 + this.car.y);
    this.car.setAlpha(this.invuln > 0 ? (Math.floor(this.elapsed * 14) % 2 ? 0.4 : 1) : 1);

    // traffic rows (spawned by distance, so there's always a gap between them)
    this.rowScroll += this.speed * (1 - NPC_OWN) * dt;
    if (this.rowScroll >= rowGap(state.trip, this.elapsed) && this.rowsAllowed(left)) {
      this.spawnRow();
      this.rowScroll = 0;
    }

    // road events: one at a time, and only once the road ahead is clear
    if (this.eventAnchor) {
      const a = this.eventAnchor;
      if (a.obj.x + (a.len ?? 200) < CAR_X - 150 || !a.obj.active) {
        if (a === this.works?.thing) this.works = null;
        this.eventAnchor = null;
        this.nextEvent = eventInterval(state.trip) * (0.7 + Math.random() * 0.5);
      }
    } else if (!this.pending) {
      this.nextEvent -= dt;
      if (this.nextEvent <= 0 && left > 140) this.pending = this.roadPlan.shift() ?? (state.trip > 1 && Math.random() < 0.3 ? 'works' : 'crosswalk');
    }
    if (this.pending && this.roadClearAhead() && left > 110) {
      this.startEvent(this.pending);
      this.pending = null;
    }

    // pickups, phone, chatter
    this.nextPickup -= dt;
    this.nextIdleLine -= dt;
    if (this.nextPickup <= 0) {
      this.spawnPickup();
      this.nextPickup = 5 + Math.random() * 4;
    }
    this.maybePhone(left);
    if (this.nextIdleLine <= 0) {
      const l = pick(IDLE_LINES);
      this.say(l, l === l.toUpperCase() ? 'angry' : 'worried', l === l.toUpperCase() ? 'open' : 'grit');
      this.nextIdleLine = 6 + Math.random() * 5;
    }

    // police
    if (this.police) {
      const p = this.police;
      this.policeMove(p, dt, fast);
      const on = Math.floor(this.time.now / 150) % 2 === 0;
      p.lamps[0].setAlpha(on ? 1 : 0.25);
      p.lamps[1].setAlpha(on ? 0.25 : 1);
      this.sirenTimer -= realDt;
      if (this.police && this.sirenTimer <= 0) {
        sfx.siren();
        this.sirenTimer = 0.9;
      }
    }

    // move + collide
    for (const t of this.things) {
      if (t.kind !== 'police') {
        t.obj.x -= this.speed * (1 - t.own) * dt;
        t.car?.roll(this.speed * t.own * dt);
      }
      if (t.vy) t.obj.y += t.vy * dt;
      if (t.kind === 'ped') {
        // stop on the far kerb
        if (t.vy > 0 && t.obj.y > ROAD_BOT + 45) t.vy = 0;
        if (t.vy < 0 && t.obj.y < ROAD_TOP - 5) t.vy = 0;
      }
      if (t.kind === 'light') this.updateLight(t, dt);
      if (t.kind === 'works') t.obj.setDepth(100 + GROUND(t.lane) - 1);
      else if (t.kind !== 'decor' && t.kind !== 'light') t.obj.setDepth(100 + t.obj.y);
      if (!t.hit) this.collide(t);
    }
    this.things = this.things.filter((t) => {
      if ((t.obj.x + (t.len ?? 0) < -320 && t.kind !== 'police') || !t.obj.active) {
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
      braking,
      turbo: this.gauge.level,
      turboEmpty: this.gauge.empty,
      trip: state.trip,
      left: Math.max(0, left),
      home: this.home,
    });
  }

  private updateLight(t: Thing, dt: number) {
    t.clock = (t.clock ?? 0) + dt;
    const l = lightAt(t.plan!, t.clock);
    if (l !== t.light) {
      t.light = l;
      if (!t.passed) sfx.blip();
    }
    const lampY = { red: 38, yellow: 75, green: 112 }[l];
    t.lamp!.setY(ROAD_TOP + 2 - (360 - lampY) * 0.85);
    t.lamp!.setFillStyle(l === 'red' ? 0xff2a2a : l === 'yellow' ? 0xffd21a : 0x22ee66);
    // the stop line passes the front of the car
    if (!t.passed && t.obj.x - 10 <= CAR_X + CAR_HALF) {
      t.passed = true;
      if (l === 'red') this.ranRed();
      else if (this.mult > 1.2) this.say(pick(['MADE IT! HA HA!', 'YELLOW MEANS FASTER!', 'GREEN! GREEN! GO!']), 'wide', 'smile');
    }
  }

  private ranRed() {
    sfx.honk();
    this.say(pick(['Was that red? That was red.', 'Oh shit. Oh shit.', 'Technically it was orange.']), 'wide', 'grit');
    this.time.delayedCall(900, () => {
      if (this.over) return;
      this.spawnPolice();
      this.say(pick(['COPS?! NOW?!', 'NO NO NO, NOT THE COPS!', 'I CAN EXPLAIN! I HAVE BANANAS!']), 'wide', 'open');
    });
  }

  /** The wife texts 1-2 times per trip, never during a full-screen moment, at a random spot on screen. */
  private maybePhone(left: number) {
    if (!this.phoneMarks.length) return;
    const progress = 1 - left / this.home;
    if (progress > 0.88) {
      this.phoneMarks = [];
      return;
    }
    const ok =
      progress >= this.phoneMarks[0] &&
      !this.registry.get('phoneOpen') &&
      this.time.now > this.cutinUntil &&
      this.ripeness < PHONE_MAX_RIPENESS &&
      left > this.home * 0.15;
    if (!ok) return;
    this.phoneMarks.shift();
    bus.emit('hud:phone', { x: pick([250, 640, 1030]) + Phaser.Math.Between(-40, 40) });
    sfx.phone();
  }

  private collide(t: Thing) {
    const pickup = t.kind === 'ice' || t.kind === 'fresh' || t.kind === 'chant' || t.kind === 'nitro';
    const dx = Math.abs(t.obj.x - CAR_X);
    if (pickup) {
      if (t.lane === this.lane && dx < CAR_HALF) this.collect(t);
      return;
    }
    if (this.invuln > 0) return;
    // cars are ~210px long; a little forgiveness for near-misses when cutting in
    if (t.kind === 'car') {
      if (t.lane === this.lane && dx < CAR_HALF * 2 - 45) this.crashInto(t);
    } else if (t.kind === 'police') {
      if (t.lane === this.lane && dx < CAR_HALF * 2 - 45) this.bumpPolice();
    } else if (t.kind === 'ped') {
      const y = t.obj.y;
      if (y > ROAD_TOP + 10 && y < ROAD_BOT + 30 && Math.abs(y - this.car.y) < 38 && dx < CAR_HALF) this.hitPed(t);
    } else if (t.kind === 'works') {
      const x0 = t.obj.x;
      if (t.lane === this.lane && CAR_X + CAR_HALF > x0 && CAR_X - CAR_HALF < x0 + (t.len ?? 0)) this.hitWorks();
    }
  }

  private hitWorks() {
    this.ripeness = crash(this.ripeness);
    this.invuln = 1.3;
    this.recover = 0.35;
    sfx.crash();
    this.cameras.main.shake(240, 0.012);
    this.pop(CAR_X, this.car.y - 120, 'CONES!', '#FF7A1A');
    this.say(pick(['FUCKING CONES!', 'WHO PUTS A HOLE IN A ROAD?!', 'MY BANANAS!']), 'angry', 'open');
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
    this.carBananas.setScale(0.46);
    this.tweens.add({ targets: this.carBananas, scale: 0.4, duration: 300 });
    this.pop(CAR_X, this.car.y - 120, 'BRUISED!', '#D3202A');
    this.say(pick(CRASH_LINES), 'angry', 'open');
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
    this.say(pick(PED_LINES), 'wide', 'open');
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
    const order = ['green', 'yellow', 'spotty', 'brown'];
    const worse = order.indexOf(st) > order.indexOf(this.stage);
    this.stage = st;
    this.carBananas.setTexture(`banana_${st}`);
    bus.emit('hud:stage', st);
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

  /** Full-screen moments end the run: put the phone away first so it never hides behind them. */
  private endRun() {
    this.over = true;
    this.phoneMarks = [];
    bus.emit('hud:phone-close');
    music('none');
    this.exhaust.stop();
  }

  private arrive() {
    this.endRun();
    sfx.screech();
    this.driver.setFace('wide', 'smile');
    bus.emit('hud:cutin', { text: pick(['I MADE IT! I FUCKING MADE IT!', 'HOME! HOME! THE BANANAS LIVE!', "WHO'S THE MAN?! I'M THE MAN!"]), eyes: 'wide', mouth: 'open', ms: 1300, stage: this.stage });
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
    this.endRun();
    this.slowmo = 0.05;
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
