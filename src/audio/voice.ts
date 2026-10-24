// Voice clips cut from the original short (see scripts/cut-voice.mjs).
// They're optional: if public/audio/vo/ is missing, `voice()` returns null and
// callers fall back to a text line.

import clips from './voiceClips.json';
import { audio, duckMusic, whenAudioReady } from './sfx';

export type ClipId = keyof typeof clips;

const raw: Partial<Record<ClipId, ArrayBuffer>> = {};
const decoded: Partial<Record<ClipId, AudioBuffer>> = {};
let playing: AudioBufferSourceNode | null = null;

/** Fetch every clip (call once at boot). Decoding waits for the audio context. */
export function preloadVoices() {
  for (const id of Object.keys(clips) as ClipId[]) {
    fetch(`audio/vo/${id}.mp3`)
      .then((r) => (r.ok ? r.arrayBuffer() : null))
      .then((b) => {
        if (!b) return;
        raw[id] = b;
        whenAudioReady(() => decode(id));
      })
      .catch(() => undefined);
  }
}

function decode(id: ClipId) {
  const a = audio();
  const b = raw[id];
  if (!a || !b || decoded[id]) return;
  delete raw[id];
  a.ctx.decodeAudioData(b).then((buf) => (decoded[id] = buf)).catch(() => undefined);
}

/**
 * Play a clip from the short and get its exact line and length, or null if the
 * clip isn't available (callers then use a text line instead).
 */
export function voice(id: ClipId): { text: string; ms: number } | null {
  const buf = decoded[id];
  const a = audio();
  if (!buf || !a) return null;
  playing?.stop();
  const src = a.ctx.createBufferSource();
  src.buffer = buf;
  src.connect(a.master);
  duckMusic(true);
  src.onended = () => {
    if (playing === src) {
      playing = null;
      duckMusic(false);
    }
  };
  src.start();
  playing = src;
  return { text: clips[id].text, ms: Math.round(buf.duration * 1000) + 350 };
}
