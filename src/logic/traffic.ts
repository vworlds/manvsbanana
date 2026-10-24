// Fair traffic: rules that guarantee there is always a way through.
//
// * Traffic cars come in "rows" (spawned together at the right edge, all with
//   the same speed, so rows never drift into each other). A row never blocks
//   all lanes, and rows are spaced at least ROW_GAP_MIN apart so there is room
//   to change lanes between them.
// * Road events (crosswalk, crossroad, lane blocks) only start once the road
//   ahead is clear of traffic, and only one event is on the road at a time.
// * Lane blocks are roadworks, an accident (two crashed cars) or a stretch of
//   dirt road (slows you down; traffic and police steer clear of it).
// * During a lane block in lane R, the player gets a fixed "corridor" lane C, and
//   rows may only use the remaining lane X. So at any slice of road at most
//   two lanes are blocked and the open lane never requires crossing the works.
// * Pedestrians always clear the road within the time it takes to reach the
//   crosswalk while braking, and a red light can always be waited out by
//   braking. Braking needs no turbo.

export type Rand = () => number;
export const LANES = [0, 1, 2] as const;

/** All traffic cars share this speed (fraction of the player's speed), so rows stay rigid. */
export const NPC_OWN = 0.35;
export const ROW_GAP_MIN = 470;

/** Pixels (in traffic space) between rows. Tighter on later trips and later in a trip. */
export function rowGap(trip: number, t: number): number {
  return Math.max(ROW_GAP_MIN, 820 - 45 * (trip - 1) - 4 * t);
}

/** Chance that a row has two cars instead of one. */
export function twoCarChance(trip: number, t: number): number {
  return Math.min(0.7, 0.15 + 0.1 * (trip - 1) + t / 150);
}

export interface Works {
  lane: number;
  corridor: number;
}

/** Picks a corridor lane for roadworks in `lane`: the one the player is (or can get) in, never the works lane. */
export function pickCorridor(worksLane: number, playerLane: number, rand: Rand): number {
  const options = LANES.filter((l) => l !== worksLane);
  if (options.includes(playerLane as 0 | 1 | 2)) return playerLane;
  return options[Math.floor(rand() * options.length) % options.length];
}

/** Lanes a new row will block. Respects active roadworks. Never blocks every open lane. */
export function rowLanes(count: number, rand: Rand, works?: Works): number[] {
  if (works) {
    // only the lane that is neither the works nor the corridor may get traffic
    const x = LANES.find((l) => l !== works.lane && l !== works.corridor)!;
    return count > 0 ? [x] : [];
  }
  const lanes = shuffled([...LANES], rand);
  return lanes.slice(0, Math.min(count, 2));
}

// ------------------------------------------------------------- events
export type BlockKind = 'works' | 'accident' | 'dirt';
export type EventKind = 'crosswalk' | 'crossroad' | BlockKind;

export const isBlock = (k: EventKind): k is BlockKind => k === 'works' || k === 'accident' || k === 'dirt';

/** Which kind of lane block: trip 1 only gets dirt (it just slows you); later trips get all three. */
export function blockKind(trip: number, rand: Rand): BlockKind {
  if (trip < 2) return 'dirt';
  const r = rand();
  return r < 0.4 ? 'works' : r < 0.7 ? 'accident' : 'dirt';
}

/** Seconds between road events. More frequent on later trips. */
export function eventInterval(trip: number): number {
  return Math.max(4.5, 10 - 1.2 * (trip - 1));
}

/** Pedestrians on a crosswalk: more crowded on later trips. */
export function crowdSize(trip: number, rand: Rand): number {
  const base = Math.min(5, 2 + Math.floor((trip - 1) / 1.5));
  return Math.max(1, base - (rand() < 0.4 ? 1 : 0));
}

/** Chance an event is a lane block (roadworks, accident, dirt) rather than a crosswalk. */
export function worksChance(trip: number): number {
  return trip < 2 ? 0.15 : Math.min(0.45, 0.2 + 0.06 * trip);
}

/** Lane block length in px. An accident is just the two cars. */
export function worksLength(trip: number, rand: Rand, kind: BlockKind = 'works'): number {
  if (kind === 'accident') return 330;
  if (kind === 'dirt') return 600 + Math.min(600, 100 * trip) + rand() * 300;
  return 450 + Math.min(700, 120 * trip) + rand() * 250;
}

/** How many crossroads (with a traffic light) this trip has. */
export function crossroadCount(trip: number): number {
  return trip >= 3 ? 2 : 1;
}

/** Decide the event sequence of a trip up front: which crosswalks are crossroads. */
export function planEvents(trip: number, expectedEvents: number, rand: Rand): EventKind[] {
  const n = Math.max(expectedEvents, crossroadCount(trip) + 1);
  const plan: EventKind[] = [];
  for (let i = 0; i < n; i++) plan.push(rand() < worksChance(trip) ? blockKind(trip, rand) : 'crosswalk');
  // turn some crosswalks into crossroads, at random positions (never the very first event on trip 1)
  // (crosswalks first; a lane block only gives way if there aren't enough crosswalks)
  const spots = plan.map((_, i) => i).filter((i) => !(trip === 1 && i === 0));
  const candidates = [...shuffled(spots.filter((i) => plan[i] === 'crosswalk'), rand), ...shuffled(spots.filter((i) => plan[i] !== 'crosswalk'), rand)];
  for (const i of candidates.slice(0, crossroadCount(trip))) plan[i] = 'crossroad';
  return plan;
}

// ------------------------------------------------------------- traffic light
export type Light = 'green' | 'yellow' | 'red';

export interface LightPlan {
  yellowAt: number;
  redAt: number;
  greenAt: number;
}

/**
 * A light that is red when you would arrive if you just keep going at your
 * current speed. So you have to react: brake and arrive after it turns green
 * again (always possible, no turbo needed), or, if you're not already on
 * turbo, floor it straight away and make it through on yellow.
 * `T` = seconds to reach the stop line at your current speed.
 */
export function lightPlan(T: number): LightPlan {
  return { yellowAt: 0.5 * T, redAt: 0.69 * T, greenAt: 1.6 * T };
}

export function lightAt(p: LightPlan, t: number): Light {
  if (t < p.yellowAt) return 'green';
  if (t < p.redAt) return 'yellow';
  if (t < p.greenAt) return 'red';
  return 'green';
}

function shuffled<T>(a: T[], rand: Rand): T[] {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1)) % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
