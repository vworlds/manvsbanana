// Banana ripeness is the runner's clock: 0 = fresh green, 1 = brown, run over.

export type Stage = 'green' | 'yellow' | 'spotty' | 'brown';

export const STAGE_START: Record<Stage, number> = {
  green: 0,
  yellow: 0.3,
  spotty: 0.58,
  brown: 0.82,
};

/** Seconds a fresh bunch survives at base speed with no crashes. */
export const BASE_LIFETIME = 46;
export const CRASH_PENALTY = 0.09;
/** Turbo shakes the bananas a bit, but it's still worth it. */
export const TURBO_FACTOR = 1.05;
export const CHILL_FACTOR = 0.35;

export function stageOf(r: number): Stage {
  if (r >= STAGE_START.brown) return 'brown';
  if (r >= STAGE_START.spotty) return 'spotty';
  if (r >= STAGE_START.yellow) return 'yellow';
  return 'green';
}

export interface TickInput {
  dt: number; // seconds
  trip: number; // 1-based delivery number within this generation
  generation: number; // 1-based
  turbo: boolean;
  chilled: boolean;
  debugMultiplier?: number;
}

/** Per-second ripening rate. Faster on every trip and every generation. */
export function rate(i: Omit<TickInput, 'dt'>): number {
  let r = 1 / BASE_LIFETIME;
  r *= 1 + 0.13 * (i.trip - 1);
  r *= 1 + 0.12 * (i.generation - 1);
  if (i.turbo) r *= TURBO_FACTOR;
  if (i.chilled) r *= CHILL_FACTOR;
  return r * (i.debugMultiplier ?? 1);
}

export function tick(ripeness: number, i: TickInput): number {
  return clamp01(ripeness + rate(i) * i.dt);
}

export function crash(ripeness: number): number {
  return clamp01(ripeness + CRASH_PENALTY);
}

export function freshen(ripeness: number, amount: number): number {
  return clamp01(ripeness - amount);
}

export const isRotten = (r: number) => r >= 1;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
