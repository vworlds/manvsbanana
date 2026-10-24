// Tiny WebAudio synth: every sound is generated, no audio files.

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let musicGain: GainNode | null = null;
let muted = readBool('mvb-muted', false);
let voice = readBool('mvb-voice', false);

function readBool(k: string, d: boolean): boolean {
  try {
    const v = localStorage.getItem(k);
    return v === null ? d : v === '1';
  } catch {
    return d;
  }
}
function writeBool(k: string, v: boolean) {
  try {
    localStorage.setItem(k, v ? '1' : '0');
  } catch {
    /* ignore */
  }
}

/** Call from a user gesture. */
export function unlock() {
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 0.5;
    master.connect(ctx.destination);
    musicGain = ctx.createGain();
    musicGain.gain.value = 0.35;
    musicGain.connect(master);
  }
  if (ctx.state === 'suspended') void ctx.resume();
}

export const isMuted = () => muted;
export function toggleMute() {
  muted = !muted;
  writeBool('mvb-muted', muted);
  if (master && ctx) master.gain.setTargetAtTime(muted ? 0 : 0.5, ctx.currentTime, 0.02);
  if (muted) window.speechSynthesis?.cancel();
  return muted;
}
export const isVoice = () => voice;
export function toggleVoice() {
  voice = !voice;
  writeBool('mvb-voice', voice);
  if (!voice) window.speechSynthesis?.cancel();
  return voice;
}

function tone(freq: number, dur: number, type: OscillatorType = 'square', vol = 0.3, slideTo?: number, when = 0, dest?: AudioNode) {
  if (!ctx || !master) return;
  const t = ctx.currentTime + when;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g).connect(dest ?? master);
  o.start(t);
  o.stop(t + dur + 0.05);
}

let noiseBuf: AudioBuffer | null = null;
function noise(dur: number, vol = 0.4, filterFrom = 3000, filterTo = 200, when = 0, type: BiquadFilterType = 'lowpass', dest?: AudioNode) {
  if (!ctx || !master) return;
  if (!noiseBuf) {
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const t = ctx.currentTime + when;
  const s = ctx.createBufferSource();
  s.buffer = noiseBuf;
  const f = ctx.createBiquadFilter();
  f.type = type;
  f.frequency.setValueAtTime(filterFrom, t);
  f.frequency.exponentialRampToValueAtTime(Math.max(20, filterTo), t + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  s.connect(f).connect(g).connect(dest ?? master);
  s.start(t, Math.random());
  s.stop(t + dur + 0.05);
}

export const sfx = {
  blip: () => tone(880, 0.08, 'square', 0.15, 1320),
  select: () => {
    tone(523, 0.08, 'square', 0.15);
    tone(784, 0.12, 'square', 0.15, undefined, 0.07);
  },
  lane: () => tone(300, 0.06, 'triangle', 0.15, 420),
  crash: () => {
    noise(0.5, 0.7, 2500, 80);
    tone(90, 0.4, 'sawtooth', 0.4, 40);
  },
  screech: () => {
    tone(1400, 0.45, 'sawtooth', 0.08, 900);
    noise(0.45, 0.15, 6000, 3000, 0, 'bandpass');
  },
  honk: () => {
    tone(392, 0.25, 'square', 0.18);
    tone(330, 0.25, 'square', 0.18);
  },
  pickup: () => {
    tone(660, 0.08, 'square', 0.18);
    tone(990, 0.12, 'square', 0.18, undefined, 0.08);
    tone(1320, 0.16, 'square', 0.15, undefined, 0.16);
  },
  siren: () => {
    tone(960, 0.4, 'triangle', 0.07, 760);
    tone(760, 0.4, 'triangle', 0.07, 960, 0.45);
  },
  chomp: () => {
    noise(0.08, 0.5, 1800, 300);
    tone(180, 0.06, 'square', 0.1, 90);
  },
  buzz: () => tone(140, 0.3, 'sawtooth', 0.06, 180),
  phone: () => {
    for (let i = 0; i < 3; i++) tone(1200, 0.06, 'sine', 0.2, undefined, i * 0.12);
  },
  send: () => tone(600, 0.15, 'sine', 0.2, 1400),
  splat: () => {
    noise(0.35, 0.9, 900, 60);
    tone(120, 0.3, 'sine', 0.6, 40);
  },
  whoosh: (dur = 1.5, up = true) => {
    if (!ctx) return;
    noise(dur, 0.35, up ? 300 : 4000, up ? 6000 : 200, 0, 'bandpass');
    tone(up ? 80 : 600, dur, 'sine', 0.15, up ? 900 : 60);
  },
  sting: () => {
    // dramatic chord for cut-ins
    [220, 277, 330].forEach((f) => tone(f, 0.5, 'sawtooth', 0.08, f * 0.98));
    noise(0.2, 0.3, 8000, 1000, 0, 'highpass');
  },
  sad: () => {
    [392, 370, 349, 330].forEach((f, i) => tone(f, 0.5, 'triangle', 0.18, undefined, i * 0.45));
  },
  boom: () => {
    tone(60, 0.9, 'sine', 0.7, 30);
    noise(0.8, 0.4, 600, 40);
  },
};

// ---------------------------------------------------------------- music
type Track = 'drive' | 'sad' | 'none';
let current: Track = 'none';
let timer: number | undefined;
let step = 0;
let nextTime = 0;
let tempoMul = 1;

const DRIVE_BASS = [55, 55, 65.4, 55, 73.4, 73.4, 65.4, 61.7];
const DRIVE_LEAD = [440, 0, 523, 0, 587, 523, 440, 0, 392, 0, 440, 0, 523, 587, 659, 0];
const SAD = [261.6, 0, 246.9, 0, 220, 0, 196, 0, 174.6, 0, 196, 0, 220, 0, 0, 0];

export function setTempo(m: number) {
  tempoMul = m;
}

export function music(track: Track) {
  if (track === current) return;
  current = track;
  if (timer) window.clearInterval(timer);
  timer = undefined;
  if (track === 'none' || !ctx) return;
  step = 0;
  nextTime = ctx.currentTime + 0.05;
  timer = window.setInterval(schedule, 25);
}

function schedule() {
  if (!ctx || !musicGain) return;
  while (nextTime < ctx.currentTime + 0.12) {
    const when = nextTime - ctx.currentTime;
    if (current === 'drive') {
      const s16 = step % 16;
      if (s16 % 2 === 0) tone(DRIVE_BASS[(step / 2) % 8 | 0] * 2, 0.18, 'square', 0.22, undefined, when, musicGain);
      if (s16 % 4 === 0) tone(120, 0.12, 'sine', 0.5, 40, when, musicGain); // kick
      if (s16 % 8 === 4) noise(0.12, 0.25, 4000, 1500, when, 'highpass', musicGain); // snare
      noise(0.03, 0.08, 9000, 7000, when, 'highpass', musicGain); // hat
      const n = DRIVE_LEAD[s16];
      if (n && step % 32 >= 16) tone(n, 0.12, 'square', 0.08, undefined, when, musicGain);
      nextTime += (60 / (150 * tempoMul)) / 4;
    } else if (current === 'sad') {
      const n = SAD[step % 16];
      if (n) {
        tone(n, 0.9, 'triangle', 0.25, undefined, when, musicGain);
        tone(n / 2, 0.9, 'sine', 0.2, undefined, when, musicGain);
      }
      nextTime += 60 / 70 / 2;
    }
    step++;
  }
}

// ---------------------------------------------------------------- voice
/** Optional browser text-to-speech for dialogue (off by default, V toggles). */
export function speak(text: string, who: 'man' | 'kid' | 'wife' | 'baby' = 'man') {
  if (!voice || muted || !('speechSynthesis' in window)) return;
  const clean = text.replace(/[*]/g, '').replace(/[^\p{L}\p{N}\s.,!?'-]/gu, '');
  if (!clean.trim()) return;
  const u = new SpeechSynthesisUtterance(clean);
  u.pitch = who === 'kid' ? 1.6 : who === 'wife' ? 1.3 : who === 'baby' ? 2 : 0.8;
  u.rate = text === text.toUpperCase() ? 1.35 : 1.1;
  u.volume = 0.9;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
}
