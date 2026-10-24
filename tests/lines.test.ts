import { describe, expect, it } from 'vitest';
import drive from '../src/logic/lines/drive.json';
import home from '../src/logic/lines/home.json';
import family from '../src/logic/lines/family.json';

/** Every string array in a JSON tree, with its path. */
function pools(node: unknown, path = ''): [string, string[]][] {
  if (Array.isArray(node)) return [[path, node as string[]]];
  if (node && typeof node === 'object') return Object.entries(node).flatMap(([k, v]) => pools(v, path ? `${path}.${k}` : k));
  return [];
}

describe('line pools', () => {
  const all = [...pools(drive, 'drive'), ...pools(home, 'home'), ...pools(family, 'family')];

  it('every pool has lines and no duplicates', () => {
    for (const [path, lines] of all) {
      expect(lines.length, path).toBeGreaterThan(0);
      expect(new Set(lines).size, `${path} has duplicates`).toBe(lines.length);
      for (const l of lines) expect(typeof l === 'string' && l.trim().length > 0, `${path}: empty line`).toBe(true);
    }
  });

  it('the canon lines from the short are kept', () => {
    expect(drive.start_new).toContain('FUCK FUCK FUCK FUCK! I GOTTA GET THESE BANANAS HOME BEFORE THEY GO BAD!');
    expect(drive.light_close).toContain("DON'T TURN YELLOW, DON'T TURN YELLOW!");
    expect(home.kid_failed).toContain('Father has failed.');
  });

  it("the dad's yell lines are shouted (all caps)", () => {
    for (const m of Object.values(family.members)) for (const l of m.lines.yell) expect(l, l).toBe(l.toUpperCase());
  });
});
