// Act 2 dialogue. The words live in lines/family.json (a big pool, dealt with
// no repeats); the game logic (which tone each mood wants) lives here.
//
// Scores: 3 = exactly what they needed, 0 = meh, negative = you made it worse.

import family from './lines/family.json';
import type { MemberId, Result, Tone } from './plead';

export interface MoodDef {
  id: string;
  hints: string[];
  scores: Record<Tone, number>;
}

export interface MemberDef {
  id: MemberId;
  name: string;
  lines: Record<Tone, string[]>;
  moods: MoodDef[];
  reactions: Record<Result, string[]>;
}

/** Which tone each mood responds to. */
const SCORES: Record<MemberId, Record<string, Record<Tone, number>>> = {
  wife: {
    tired: { sweet: 1, yell: -2, bribe: 3, guilt: 0 },
    romantic: { sweet: 3, yell: -2, bribe: 1, guilt: -1 },
    worried: { sweet: 0, yell: -3, bribe: -1, guilt: 3 },
    petty: { sweet: -1, yell: -2, bribe: 3, guilt: 1 },
    fedup: { sweet: 3, yell: -3, bribe: 0, guilt: 1 },
    amused: { sweet: 0, yell: 3, bribe: -1, guilt: 1 },
  },
  kid: {
    smug: { sweet: -1, yell: 0, bribe: 3, guilt: -2 },
    bored: { sweet: 3, yell: -2, bribe: 1, guilt: -1 },
    hungry: { sweet: 3, yell: -2, bribe: 2, guilt: 0 },
    scared: { sweet: 2, yell: -3, bribe: 0, guilt: 3 },
    rebel: { sweet: -2, yell: 3, bribe: 0, guilt: -1 },
    sleepy: { sweet: 3, yell: -3, bribe: 1, guilt: 0 },
  },
  baby: {
    hungry: { sweet: 2, yell: -2, bribe: 3, guilt: 0 },
    cranky: { sweet: -1, yell: -3, bribe: 1, guilt: 3 },
    sleepy: { sweet: 3, yell: -3, bribe: 0, guilt: 1 },
    playful: { sweet: 3, yell: -1, bribe: 2, guilt: -1 },
    suspicious: { sweet: 0, yell: -2, bribe: 3, guilt: 1 },
    teething: { sweet: 1, yell: -2, bribe: 3, guilt: 0 },
  },
};

const NAMES: Record<MemberId, string> = { wife: 'Wife', kid: 'Kid', baby: 'Baby' };

type FamilyMember = { lines: Record<Tone, string[]>; hints: Record<string, string[]>; reactions: Record<Result, string[]> };

function build(id: MemberId): MemberDef {
  const m = (family.members as Record<MemberId, FamilyMember>)[id];
  return {
    id,
    name: NAMES[id],
    lines: m.lines,
    reactions: m.reactions,
    moods: Object.entries(SCORES[id]).map(([mood, scores]) => ({ id: mood, hints: m.hints[mood], scores })),
  };
}

export const WIFE = build('wife');
export const KID = build('kid');
export const BABY = build('baby');
export const MEMBER_DEFS: MemberDef[] = [WIFE, KID, BABY];

export const ENTRANCE: string[] = family.entrance;
export const EMERGENCY: string[] = family.emergency;
export const PARDON: string[] = family.pardon;
export const PROMISE: string[] = family.promise;
