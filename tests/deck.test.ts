import { beforeEach, describe, expect, it } from 'vitest';
import { deal, dealMany, resetDecks } from '../src/logic/deck';

describe('deck (no repeats until the pool is exhausted)', () => {
  beforeEach(() => resetDecks());
  const pool = Array.from({ length: 12 }, (_, i) => `line ${i}`);

  it('deals every line once before any repeats', () => {
    for (let round = 0; round < 5; round++) {
      const got = Array.from({ length: pool.length }, () => deal('t', pool));
      expect(new Set(got).size).toBe(pool.length);
    }
  });

  it('never says the same line twice in a row, even across a reshuffle', () => {
    let prev = '';
    for (let i = 0; i < 500; i++) {
      const l = deal('t2', pool);
      expect(l).not.toBe(prev);
      prev = l;
    }
  });

  it('lines added to a pool mid-round get dealt in that round; removed ones never come back', () => {
    const first = Array.from({ length: 4 }, () => deal('t3', pool));
    const grown = [...pool.slice(2), 'new A', 'new B'];
    const rest = Array.from({ length: grown.length - first.filter((l) => grown.includes(l)).length }, () => deal('t3', grown));
    expect(rest).toContain('new A');
    expect(rest).toContain('new B');
    expect(rest).not.toContain('line 0');
    expect(new Set([...first, ...rest].filter((l) => grown.includes(l))).size).toBe(grown.length);
  });

  it('dealMany gives distinct lines', () => {
    for (let i = 0; i < 50; i++) expect(new Set(dealMany('t4', pool, 4)).size).toBe(4);
  });
});
