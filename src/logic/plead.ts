// Act 2: begging the family to eat the bananas.
// Each family member gets a random mood, hinted by their opening line. You
// pick one of four lines, one per tone, dealt at random from a big pool (see
// pleadLines.ts). The right tone for the mood earns respect. Reach the
// threshold and you're sent back to the store. The threshold climbs with
// every redemption.

import { deal } from './deck';
import { MEMBER_DEFS, type MemberDef, type MoodDef } from './pleadLines';

export type MemberId = 'wife' | 'kid' | 'baby';
export type Tone = 'sweet' | 'yell' | 'bribe' | 'guilt';
export type Result = 'great' | 'ok' | 'bad';
export const TONES: Tone[] = ['sweet', 'yell', 'bribe', 'guilt'];

export type Member = MemberDef;
export type Mood = MoodDef;

export interface Choice {
  tone: Tone;
  line: string;
}

export interface Round {
  member: Member;
  mood: Mood;
  hint: string;
  choices: Choice[];
}

export const MEMBERS = MEMBER_DEFS;

type Rand = () => number;

export function shuffle<T>(arr: readonly T[], rand: Rand): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1)) % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Deals one round: a mood, its hint and four lines (one per tone, shuffled).
 * Hints and lines come from no-repeat decks, so nothing is said twice until
 * its whole pool has been used.
 */
export function dealRound(member: Member, rand: Rand = Math.random): Round {
  const mood = member.moods[Math.floor(rand() * member.moods.length) % member.moods.length];
  const hint = deal(`plead.${member.id}.hint.${mood.id}`, mood.hints, rand);
  const choices = shuffle(
    TONES.map((tone) => ({ tone, line: deal(`plead.${member.id}.${tone}`, member.lines[tone], rand) })),
    rand,
  );
  return { member, mood, hint, choices };
}

/** A family member's reaction line. */
export function reaction(member: Member, res: Result): string {
  return deal(`plead.${member.id}.react.${res}`, member.reactions[res]);
}

/** The family members in a random order for this game. */
export function familyOrder(rand: Rand = Math.random): Member[] {
  return shuffle(MEMBERS, rand);
}

/** Respect needed to be sent back to the store. Rises with each redemption. */
export function threshold(redemptionsUsed: number): number {
  return 3 + 2 * redemptionsUsed;
}

/** Respect you start with: effort counts a little, ignored texts count against you. */
export function startingRespect(distance: number, ignoredTexts: number): number {
  const effort = Math.min(2, Math.floor(distance / 1500));
  return effort - ignoredTexts;
}

export function resultOf(score: number): Result {
  if (score >= 3) return 'great';
  if (score >= 0) return 'ok';
  return 'bad';
}

export function score(mood: Mood, tone: Tone): number {
  return mood.scores[tone];
}

export function redeemed(respect: number, redemptionsUsed: number): boolean {
  return respect >= threshold(redemptionsUsed);
}
