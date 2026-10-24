// Cuts the iconic voice lines out of the original short into public/audio/vo/.
// Run with `npm run voice` (needs ffmpeg and the video in video/).
//
// Cut points come from a word-level transcription of the video's audio.
// Tweak `from`/`to` (seconds) and re-run if a cut clips a word.
//
// NOTE: these clips are audio from the original Cyanide & Happiness short.
// Fine for playing the game privately; if you ever publish the game, get
// permission or delete public/audio/vo/ (the game falls back to text only).

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const VIDEO_DIR = join(ROOT, 'video');
const OUT = join(ROOT, 'public', 'audio', 'vo');

export const CLIPS = [
  { id: 'intro', from: 2.1, to: 6.75, who: 'dad', text: 'OH SHIT SHIT SHIT SHIT. I GOTTA GET THESE BANANAS HOME BEFORE THEY GO BAD!' },
  { id: 'dont_turn_yellow', from: 7.6, to: 11.65, who: 'dad', text: "DON'T TURN YELLOW, DON'T TURN YELLOW! DON'T TURN YELLOW, DON'T TURN YELLOW!" },
  { id: 'dont_turn_yellow_short', from: 7.6, to: 9.55, who: 'dad', text: "DON'T TURN YELLOW, DON'T TURN YELLOW!" },
  { id: 'come_on', from: 17.25, to: 19.6, who: 'dad', text: "COME ON, COME ON, COME ON. I'VE GOT BANANAS HERE!" },
  { id: 'fuck', from: 19.6, to: 20.45, who: 'dad', text: 'FUCK!' },
  { id: 'family', from: 34.08, to: 36.25, who: 'dad', text: 'FAMILY! I HAVE BANANAS!' },
  { id: 'fuck_bananas', from: 36.28, to: 39.48, who: 'dad', text: 'FUCK FUCK FUCK FUCK, BANANAS! HOLY FUCKING SHIT!' },
  { id: 'emergency', from: 39.55, to: 46.75, who: 'dad', text: 'BANANA EMERGENCY! EAT THESE FUCKING BANANAS BEFORE THEY GO BAD, YOU GODDAMN MONSTERS! WHAT ARE YOU WAITING FOR, YOU PIECES OF SHIT?' },
  { id: 'no_1', from: 47.02, to: 47.5, who: 'dad', text: 'No.' },
  { id: 'no_2', from: 50.33, to: 51.0, who: 'dad', text: 'No.' },
  { id: 'no_3', from: 52.68, to: 53.2, who: 'dad', text: 'No.' },
  { id: 'no_no_no', from: 53.55, to: 55.42, who: 'dad', text: 'No, no, no, no, no.' },
  { id: 'tried', from: 55.55, to: 60.2, who: 'dad', text: "I... I tried. Don't you see? I... I tried so hard." },
  { id: 'father_failed', from: 60.45, to: 62.08, who: 'kid', text: 'Father has failed.' },
  { id: 'father_now', from: 62.28, to: 63.9, who: 'kid', text: 'I AM FATHER NOW.' },
  { id: 'scream', from: 64.95, to: 66.1, who: 'dad', text: 'AAAAAAAAH!' },
];

function main() {
  const video = readdirSync(VIDEO_DIR).find((f) => /\.(mkv|mp4|webm)$/i.test(f));
  if (!video) throw new Error('No video found in video/');
  mkdirSync(OUT, { recursive: true });
  for (const c of CLIPS) {
    const dur = (c.to - c.from).toFixed(3);
    const fadeOut = Math.min(0.08, (c.to - c.from) / 4).toFixed(3);
    execFileSync('ffmpeg', [
      '-v', 'error', '-y',
      '-ss', String(c.from), '-t', dur, '-i', join(VIDEO_DIR, video),
      '-vn', '-ac', '1', '-ar', '44100',
      '-af', `afade=t=in:d=0.02,afade=t=out:st=${(c.to - c.from - fadeOut).toFixed(3)}:d=${fadeOut},loudnorm=I=-16:TP=-1.5:LRA=11`,
      '-c:a', 'libmp3lame', '-b:a', '96k',
      join(OUT, `${c.id}.mp3`),
    ]);
    console.log(`${c.id.padEnd(24)} ${c.from}s → ${c.to}s  ${c.text}`);
  }
  const manifest = Object.fromEntries(CLIPS.map((c) => [c.id, { text: c.text, who: c.who, seconds: +(c.to - c.from).toFixed(2) }]));
  writeFileSync(join(ROOT, 'src', 'audio', 'voiceClips.json'), JSON.stringify(manifest, null, 1));
  console.log(`\n${CLIPS.length} clips written to public/audio/vo/`);
}

if (existsSync(VIDEO_DIR)) main();
