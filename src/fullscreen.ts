// Fullscreen on phones and tablets: the first tap goes fullscreen (and tries to
// lock landscape), and a small button toggles it after that. Until they've been
// fullscreen once, a note with a bouncing arrow points at the button.
// In portrait the game is covered by "turn your phone sideways" and paused.
// iPhone Safari has no fullscreen for pages; there the way is "Add to Home
// Screen", which opens the game without browser bars (see manifest.webmanifest).

type FsDoc = Document & { webkitFullscreenElement?: Element; webkitExitFullscreen?: () => Promise<void>; webkitFullscreenEnabled?: boolean };
type FsEl = HTMLElement & { webkitRequestFullscreen?: () => Promise<void> };

const doc = document as FsDoc;
const isFull = () => !!(doc.fullscreenElement ?? doc.webkitFullscreenElement);
const canFull = () => !!(doc.fullscreenEnabled ?? doc.webkitFullscreenEnabled);

async function enter() {
  const el = document.documentElement as FsEl;
  try {
    await (el.requestFullscreen?.({ navigationUI: 'hide' }) ?? el.webkitRequestFullscreen?.());
    await (screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> }).lock?.('landscape');
  } catch {
    // not allowed here; the button stays so they can try again
  }
}

function exit() {
  void (doc.exitFullscreen?.() ?? doc.webkitExitFullscreen?.())?.catch(() => undefined);
}

/** `onPortrait(true)` when the game should pause because the device is upright, `false` to carry on. */
export function setupFullscreen(onPortrait: (portrait: boolean) => void = () => undefined) {
  const touch = matchMedia('(pointer: coarse)').matches;
  const standalone = matchMedia('(display-mode: standalone), (display-mode: fullscreen)').matches;
  if (!touch) return;

  const hint = document.createElement('div');
  hint.id = 'orientation-hint';
  hint.setAttribute('role', 'status');
  document.body.appendChild(hint);

  let wasPortrait: boolean | null = null;
  let beenFull = false; // once they've used fullscreen, leaving it is their choice: stop nagging
  const syncOrientation = () => {
    const portrait = matchMedia('(orientation: portrait)').matches;
    if (isFull()) beenFull = true;
    document.body.classList.toggle('portrait-gate', portrait);
    document.body.classList.toggle('landscape-gate', !portrait && !standalone && canFull() && !isFull() && !beenFull);
    hint.innerHTML = portrait
      ? 'Turn your phone sideways<small>Rotate to landscape to play</small>'
      : 'Go full screen<small>Tap the ⛶ button to get the best view</small>';
    if (portrait !== wasPortrait) {
      wasPortrait = portrait;
      onPortrait(portrait);
    }
  };
  syncOrientation();
  window.addEventListener('resize', syncOrientation);
  screen.orientation?.addEventListener?.('change', syncOrientation);

  if (standalone || !canFull()) return;

  const btn = document.createElement('button');
  btn.id = 'fs';
  btn.setAttribute('aria-label', 'Fullscreen');
  document.body.appendChild(btn);
  const sync = () => {
    btn.textContent = isFull() ? '✕' : '⛶';
    btn.setAttribute('aria-label', isFull() ? 'Exit fullscreen' : 'Fullscreen');
    syncOrientation();
  };
  sync();
  document.addEventListener('fullscreenchange', sync);
  document.addEventListener('webkitfullscreenchange', sync);
  const arrow = document.createElement('div');
  arrow.id = 'fs-arrow';
  arrow.textContent = '↑';
  arrow.setAttribute('aria-hidden', 'true');
  document.body.appendChild(arrow);

  btn.addEventListener('pointerdown', (e) => e.stopPropagation());
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (isFull()) exit();
    else void enter();
    requestAnimationFrame(syncOrientation);
  });

  // first tap anywhere goes fullscreen
  window.addEventListener('pointerup', (e) => {
    if (e.target !== btn && !isFull()) void enter();
  }, { once: true });
}
