// Run-wide state shared by every scene. Only `best` and `fathers` persist.

import type { EventKind } from '../logic/traffic';

export interface Father {
  generation: number;
  distance: number;
  redemptions: number;
  deliveries: number;
}

const KEY = 'man-vs-banana';

function load(): { best: number; fathers: Father[] } {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const v = JSON.parse(raw);
      return { best: Number(v.best) || 0, fathers: Array.isArray(v.fathers) ? v.fathers.slice(-20) : [] };
    }
  } catch {
    /* storage unavailable: play without saving */
  }
  return { best: 0, fathers: [] };
}

const saved = load();

export const state = {
  generation: 1,
  /** Metres driven this generation, across redemptions. */
  distance: 0,
  redemptions: 0,
  ignoredTexts: 0,
  /** Current trip number (1-based). Goes up after every successful delivery. */
  trip: 1,
  /** Bananas successfully delivered (and eaten with contempt) this generation. */
  deliveries: 0,
  /** Stores visited this game; the first one is the store from the short. */
  storeVisits: 0,
  /** Every father so far in this dynasty (this session). */
  dynasty: [] as Father[],
  best: saved.best,
  fathers: saved.fathers,

  newDynasty() {
    this.generation = 1;
    this.dynasty = [];
    this.storeVisits = 0;
    this.newFather();
  },

  newFather() {
    this.distance = 0;
    this.redemptions = 0;
    this.ignoredTexts = 0;
    this.trip = 1;
    this.deliveries = 0;
  },

  /** The current father has failed. Record him and hand over to his son. */
  fatherFailed() {
    const f: Father = { generation: this.generation, distance: Math.round(this.distance), redemptions: this.redemptions, deliveries: this.deliveries };
    this.dynasty.push(f);
    this.fathers = [...this.fathers, f].slice(-20);
    this.best = Math.max(this.best, f.distance);
    this.persist();
    this.generation += 1;
    this.newFather();
  },

  /** Bananas got home in time: the family wants more, and the next trip is harder. */
  delivered() {
    this.deliveries += 1;
    this.trip += 1;
  },

  legacy(): number {
    return this.dynasty.reduce((s, f) => s + f.distance, 0) + Math.round(this.distance);
  },

  year(): number {
    return 2026 + 30 * (this.generation - 1);
  },

  persist() {
    try {
      localStorage.setItem(KEY, JSON.stringify({ best: this.best, fathers: this.fathers }));
    } catch {
      /* ignore */
    }
  },
};

/** Debug flags from the URL, e.g. ?fastripe=1&scene=plead */
export const debug = (() => {
  const p = new URLSearchParams(location.search);
  return {
    fastRipe: p.has('fastripe') ? Number(p.get('fastripe')) || 8 : 1,
    scene: p.get('scene'),
    /** Force the crash-park outcome: trash, lady, kid, tree, parked. */
    park: p.get('park'),
    /** Start at this trip number (testing difficulty). */
    trip: Number(p.get('trip')) || 0,
    /** Force the first road events, e.g. ?events=crossroad,works,accident,dirt */
    events: (p.get('events') ?? '').split(',').filter((e): e is EventKind => ['crosswalk', 'crossroad', 'works', 'accident', 'dirt'].includes(e)),
  };
})();
