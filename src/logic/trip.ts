// A trip is one drive from the store to home. Trip 1 is easy. Every
// successful delivery the family demands more, and the next trip is longer
// and the bananas ripen faster, until the father inevitably fails.

import { isRotten, rate, tick, CRASH_PENALTY } from './ripeness';

export const PX_PER_M = 24;
export const SPEED_MAX = 1050;
export const TURBO_SPEED = 1.7;

/** Metres from the store to home on trip `trip` (1-based). */
export function homeDistance(trip: number): number {
  return 420 + 240 * (trip - 1);
}

/** World speed in px/s, `t` seconds into a trip. */
export function baseSpeed(trip: number, t: number): number {
  return Math.min(SPEED_MAX, 470 + 30 * (trip - 1) + 7 * t);
}

/** Seconds between traffic spawns. Busier on later trips. */
export function trafficInterval(trip: number, t: number): number {
  return Math.max(0.5, 1.7 - 0.12 * (trip - 1) - t * 0.012);
}

// ------------------------------------------------------------- turbo gauge
export const TURBO = {
  /** Gauge is 0..1. A full gauge is 1/drain seconds of turbo. */
  drain: 0.25,
  /** Refill per second while not boosting. */
  recharge: 0.05,
  /** Refill from a nitro can. */
  pickup: 0.5,
  /** Must refill to this before turbo works again after running dry. */
  restart: 0.15,
  /** Extra refill per second while braking. */
  brakeRecharge: 0.06,
};

/** Speed multipliers. Easing back up from a brake is free (no turbo used). */
export const BRAKE_SPEED = 0.5;

export interface Gauge {
  level: number;
  /** True after the gauge ran dry, until it refills to TURBO.restart. */
  empty: boolean;
}

/** Advance the gauge. Returns whether turbo is actually firing this frame. */
export function stepGauge(g: Gauge, holding: boolean, dt: number, braking = false): boolean {
  if (g.empty && g.level >= TURBO.restart) g.empty = false;
  const firing = holding && !g.empty && g.level > 0;
  if (firing) {
    g.level = Math.max(0, g.level - TURBO.drain * dt);
    if (g.level === 0) g.empty = true;
  } else {
    g.level = Math.min(1, g.level + (TURBO.recharge + (braking ? TURBO.brakeRecharge : 0)) * dt);
  }
  return firing;
}

// ------------------------------------------------------------- simulation
export interface SimResult {
  arrived: boolean;
  /** Fraction of the way home reached. */
  progress: number;
  seconds: number;
  ripeness: number;
}

/**
 * Plays a trip with a perfect driver and no pickups: never crashes except
 * `crashes` times, and always uses turbo when the gauge allows it (if
 * `turbo`). Used by tests to tune difficulty.
 */
export function simulate(trip: number, generation = 1, opts: { turbo?: boolean; crashes?: number } = {}): SimResult {
  const dt = 0.05;
  let t = 0;
  let dist = 0;
  let r = 0;
  const gauge: Gauge = { level: 1, empty: false };
  let crashes = opts.crashes ?? 0;
  const goal = homeDistance(trip);
  while (t < 600) {
    const firing = stepGauge(gauge, !!opts.turbo, dt);
    const speed = baseSpeed(trip, t) * (firing ? TURBO_SPEED : 1);
    dist += (speed * dt) / PX_PER_M;
    r = tick(r, { dt, trip, generation, turbo: firing, chilled: false });
    if (crashes > 0 && t > 3 * (opts.crashes! - crashes + 1)) {
      r += CRASH_PENALTY;
      crashes--;
    }
    t += dt;
    if (dist >= goal) return { arrived: true, progress: 1, seconds: t, ripeness: r };
    if (isRotten(r)) return { arrived: false, progress: dist / goal, seconds: t, ripeness: r };
  }
  return { arrived: false, progress: dist / goal, seconds: t, ripeness: r };
}

export { rate };
