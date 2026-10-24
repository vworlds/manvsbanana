import { describe, expect, it } from 'vitest';
import { crash, freshen, isRotten, rate, stageOf, tick, BASE_LIFETIME } from '../src/logic/ripeness';
import { lightAt, lightPlan, pickCorridor, planEvents, rowGap, rowLanes, ROW_GAP_MIN, crowdSize } from '../src/logic/traffic';
import { DAD_REPLY, STORE_NAMES, WIFE_TEXTS } from '../src/logic/texts';
import { BRAKE_SPEED, homeDistance, simulate, stepGauge, TURBO, type Gauge } from '../src/logic/trip';
import { MEMBERS, TONES, dealRound, familyOrder, pickFresh, redeemed, resultOf, startingRespect, threshold } from '../src/logic/plead';

const base = { trip: 1, generation: 1, turbo: false, chilled: false };

describe('ripeness', () => {
  it('walks through the stages in order', () => {
    expect(stageOf(0)).toBe('green');
    expect(stageOf(0.4)).toBe('yellow');
    expect(stageOf(0.7)).toBe('spotty');
    expect(stageOf(0.9)).toBe('brown');
  });

  it('a fresh bunch lasts about BASE_LIFETIME seconds at rest', () => {
    let r = 0;
    let t = 0;
    while (!isRotten(r) && t < 200) {
      r = tick(r, { ...base, dt: 0.1 });
      t += 0.1;
    }
    expect(t).toBeCloseTo(BASE_LIFETIME, 0);
  });

  it('chill slows ripening; later trips and generations speed it up', () => {
    const r0 = rate(base);
    expect(rate({ ...base, turbo: true })).toBeGreaterThan(r0);
    expect(rate({ ...base, chilled: true })).toBeLessThan(r0);
    expect(rate({ ...base, trip: 3 })).toBeCloseTo(r0 * 1.2);
    expect(rate({ ...base, generation: 3 })).toBeGreaterThan(r0);
  });

  it('crash and freshen stay within 0..1', () => {
    expect(crash(0.95)).toBe(1);
    expect(crash(0)).toBeGreaterThan(0);
    expect(freshen(0.05, 0.2)).toBe(0);
  });
});

describe('plead', () => {
  const seq = (...v: number[]) => {
    let i = 0;
    return () => v[i++ % v.length];
  };

  it('the pool is big: every member has 12+ lines per tone, 6 moods, 3 hints each', () => {
    for (const m of MEMBERS) {
      for (const t of TONES) expect(m.lines[t].length).toBeGreaterThanOrEqual(12);
      expect(m.moods.length).toBeGreaterThanOrEqual(6);
      for (const mood of m.moods) {
        expect(mood.hints.length).toBeGreaterThanOrEqual(3);
        expect(Object.keys(mood.scores).sort()).toEqual([...TONES].sort());
        expect(Math.max(...Object.values(mood.scores))).toBe(3); // every mood has a right answer
      }
    }
  });

  it('no duplicate lines anywhere in a member pool', () => {
    for (const m of MEMBERS) {
      const all = TONES.flatMap((t) => m.lines[t]);
      expect(new Set(all).size).toBe(all.length);
    }
  });

  it('a dealt round offers exactly one line per tone', () => {
    for (const m of MEMBERS) {
      const r = dealRound(m);
      expect(r.choices.map((c) => c.tone).sort()).toEqual([...TONES].sort());
      expect(r.mood.hints).toContain(r.hint);
      for (const c of r.choices) expect(m.lines[c.tone]).toContain(c.line);
    }
  });

  it('rounds vary between games', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 30; i++) seen.add(dealRound(MEMBERS[0]).choices.map((c) => c.line).sort().join('|'));
    expect(seen.size).toBeGreaterThan(25);
  });

  it('recently shown lines are avoided while fresh ones remain', () => {
    const wife = MEMBERS[0];
    const recent = new Set(wife.lines.sweet.slice(0, 11));
    for (let i = 0; i < 20; i++) expect(pickFresh(wife.lines.sweet, Math.random, recent)).toBe(wife.lines.sweet[11]);
    // everything recent: still returns something
    expect(wife.lines.sweet).toContain(pickFresh(wife.lines.sweet, Math.random, new Set(wife.lines.sweet)));
  });

  it('family order is a permutation', () => {
    expect(familyOrder(seq(0.9, 0.1, 0.5)).map((m) => m.id).sort()).toEqual(['baby', 'kid', 'wife']);
  });

  it('a perfect read of every mood redeems early on, but not forever', () => {
    const perfect = MEMBERS.length * 3;
    expect(redeemed(perfect, 0)).toBe(true);
    // Even perfect play plus maximum effort eventually fails: history repeats.
    expect(redeemed(perfect + 2, 10)).toBe(false);
  });

  it('threshold rises with redemptions', () => {
    expect(threshold(1)).toBeGreaterThan(threshold(0));
  });

  it('starting respect rewards effort and punishes ignored texts', () => {
    expect(startingRespect(0, 0)).toBe(0);
    expect(startingRespect(5000, 0)).toBe(2);
    expect(startingRespect(5000, 3)).toBe(-1);
  });

  it('resultOf buckets scores', () => {
    expect(resultOf(3)).toBe('great');
    expect(resultOf(0)).toBe('ok');
    expect(resultOf(-1)).toBe('bad');
  });
});

describe('trips (difficulty curve)', () => {
  it('trip 1 is easy: arrives with 3 crashes and no turbo', () => {
    expect(simulate(1, 1, { crashes: 3 }).arrived).toBe(true);
  });

  it('trip 2 is fine without turbo if you drive clean', () => {
    expect(simulate(2).arrived).toBe(true);
  });

  it('trip 4 needs the turbo', () => {
    expect(simulate(4).arrived).toBe(false);
    expect(simulate(4, 1, { turbo: true }).arrived).toBe(true);
  });

  it('eventually even perfect driving fails (history repeats)', () => {
    expect(simulate(8, 1, { turbo: true }).arrived).toBe(false);
  });

  it('every trip is further than the last', () => {
    expect(homeDistance(2)).toBeGreaterThan(homeDistance(1));
  });
});

describe('turbo gauge', () => {
  it('drains while held and runs dry in about 1/drain seconds', () => {
    const g: Gauge = { level: 1, empty: false };
    let t = 0;
    while (stepGauge(g, true, 0.1)) t += 0.1;
    expect(t).toBeCloseTo(1 / TURBO.drain, 0);
    expect(g.empty).toBe(true);
  });

  it('cannot fire again until it refills past the restart level', () => {
    const g: Gauge = { level: 0, empty: true };
    expect(stepGauge(g, true, 0.1)).toBe(false);
    g.level = TURBO.restart;
    expect(stepGauge(g, true, 0.1)).toBe(true);
  });

  it('recharges slowly when not held', () => {
    const g: Gauge = { level: 0.2, empty: false };
    stepGauge(g, false, 1);
    expect(g.level).toBeCloseTo(0.2 + TURBO.recharge);
  });
});

describe('turbo + brake', () => {
  it('braking refills the gauge faster than coasting', () => {
    const a: Gauge = { level: 0.2, empty: false };
    const b: Gauge = { level: 0.2, empty: false };
    stepGauge(a, false, 1);
    stepGauge(b, false, 1, true);
    expect(b.level).toBeGreaterThan(a.level);
  });
});

describe('fair traffic', () => {
  const rnd = (seed: number) => () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

  it('a row never blocks all three lanes', () => {
    const r = rnd(3);
    for (let i = 0; i < 500; i++) expect(new Set(rowLanes(1 + (i % 3), r)).size).toBeLessThan(3);
  });

  it('during roadworks rows only use the lane that is neither works nor corridor', () => {
    const r = rnd(5);
    for (let works = 0; works < 3; works++)
      for (let player = 0; player < 3; player++) {
        const corridor = pickCorridor(works, player, r);
        expect(corridor).not.toBe(works);
        if (player !== works) expect(corridor).toBe(player); // never forces you to move
        for (let i = 0; i < 50; i++) {
          const lanes = rowLanes(2, r, { lane: works, corridor });
          expect(lanes).not.toContain(works);
          expect(lanes).not.toContain(corridor);
          expect(lanes.length).toBeLessThanOrEqual(1);
        }
      }
  });

  it('rows always leave room to change lanes', () => {
    for (let trip = 1; trip < 15; trip++) for (let t = 0; t < 200; t += 10) expect(rowGap(trip, t)).toBeGreaterThanOrEqual(ROW_GAP_MIN);
  });

  it('every trip has at least one crossroad, at a random spot', () => {
    const r = rnd(9);
    const spots = new Set<number>();
    for (let i = 0; i < 40; i++) {
      const plan = planEvents(1, 4, r);
      expect(plan.filter((k) => k === 'crossroad').length).toBe(1);
      spots.add(plan.indexOf('crossroad'));
    }
    expect(spots.size).toBeGreaterThan(1);
  });

  it('crosswalks get more crowded on later trips', () => {
    expect(crowdSize(6, () => 0.9)).toBeGreaterThan(crowdSize(1, () => 0.9));
  });

  it('the light is red if you just keep going; braking always beats it, a quick turbo does too', () => {
    const T = 3; // seconds to the stop line at the current speed
    const p = lightPlan(T);
    expect(lightAt(p, T)).toBe('red');
    // turbo from normal speed, reacting within the first ~12% of the approach
    const react = 0.12 * T;
    expect(lightAt(p, react + (T - react) / 1.7)).not.toBe('red');
    // braking, even from full turbo (brake speed is 0.5/1.7 of the current speed), reacting at 25%
    for (const current of [1, 1.7]) {
      const r = 0.25 * T;
      const covered = r + (p.greenAt - r) * (BRAKE_SPEED / current);
      expect(covered).toBeLessThan(T); // still before the line when it turns green
    }
  });
});

describe('texts', () => {
  it('a big pool of wife texts, one fixed reply, many store names', () => {
    expect(WIFE_TEXTS.length).toBeGreaterThanOrEqual(30);
    expect(new Set(WIFE_TEXTS).size).toBe(WIFE_TEXTS.length);
    expect(DAD_REPLY).toBe('🍌🍌🍌!!FUCK!!!');
    expect(new Set(STORE_NAMES).size).toBeGreaterThanOrEqual(25);
  });
});
