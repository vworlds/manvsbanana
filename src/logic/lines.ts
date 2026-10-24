// Every random line in the game comes from here, dealt from a no-repeat deck.
import drive from './lines/drive.json';
import { deal } from './deck';

export type DriveKey = keyof typeof drive;

/** Next line for a driving moment (never repeats until its pool is used up). */
export function driveLine(key: DriveKey): string {
  return deal(`drive.${key}`, drive[key]);
}

/** Next line from any named pool. */
export function lineFrom(name: string, pool: readonly string[]): string {
  return deal(name, pool);
}

import home from './lines/home.json';
export type HomeKey = keyof typeof home;

/** Next line for the home / finale / street / store moments. */
export function homeLine(key: HomeKey): string {
  return deal(`home.${key}`, home[key]);
}
