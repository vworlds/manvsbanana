// "Shuffle-bag" dealing: every pool of lines is a deck. A line never repeats
// until every other line in its pool has been used, and the decks are saved
// in the browser so this holds across games too. When a deck runs out it is
// reshuffled, making sure the next line isn't the one that was just said.

type Rand = () => number;

interface DeckState {
  /** Lines still to deal this round, in order. */
  left: string[];
  /** Lines already dealt this round. */
  seen: string[];
  /** The last line dealt (never the first line of a fresh shuffle). */
  last?: string;
}

const KEY = 'man-vs-banana-decks';
let decks: Record<string, DeckState> | null = null;

function load(): Record<string, DeckState> {
  if (decks) return decks;
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? '{}');
    decks = v && typeof v === 'object' ? v : {};
  } catch {
    decks = {};
  }
  return decks!;
}

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(decks));
  } catch {
    /* storage unavailable: decks still work for this session */
  }
}

function shuffle<T>(a: T[], rand: Rand): T[] {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1)) % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Deal the next line from the deck called `name`, built from `pool`.
 * If the pool changed since the deck was saved, removed lines are dropped and
 * new lines are shuffled into the current round.
 */
export function deal(name: string, pool: readonly string[], rand: Rand = Math.random): string {
  if (pool.length === 0) return '';
  if (pool.length === 1) return pool[0];
  const all = load();
  const d: DeckState = all[name] && Array.isArray(all[name].left) ? all[name] : { left: [], seen: [] };
  all[name] = d;
  d.seen = Array.isArray(d.seen) ? d.seen : [];
  const inPool = new Set(pool);
  d.left = d.left.filter((l) => inPool.has(l));
  d.seen = d.seen.filter((l) => inPool.has(l));
  const known = new Set([...d.left, ...d.seen]);
  for (const l of pool) if (!known.has(l)) d.left.splice(Math.floor(rand() * (d.left.length + 1)), 0, l);
  if (d.left.length === 0) {
    d.left = shuffle([...pool], rand);
    d.seen = [];
    if (d.left[0] === d.last) d.left.push(d.left.shift()!);
  }
  const line = d.left.shift()!;
  d.seen.push(line);
  d.last = line;
  save();
  return line;
}

/** Deal several distinct lines at once (e.g. four choices). */
export function dealMany(name: string, pool: readonly string[], n: number, rand: Rand = Math.random): string[] {
  const out: string[] = [];
  for (let i = 0; i < n && out.length < pool.length; i++) {
    let l = deal(name, pool, rand);
    // a reshuffle mid-hand could hand back a line already in this hand
    let guard = 0;
    while (out.includes(l) && guard++ < pool.length) l = deal(name, pool, rand);
    out.push(l);
  }
  return out;
}

/** For tests: forget all decks. */
export function resetDecks() {
  decks = {};
  save();
}
