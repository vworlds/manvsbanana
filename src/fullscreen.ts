// Fullscreen on phones and tablets: the first tap goes fullscreen (and tries to
// lock landscape), and a small button toggles it after that.
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

export function setupFullscreen() {
  const touch = matchMedia('(pointer: coarse)').matches;
  const standalone = matchMedia('(display-mode: standalone), (display-mode: fullscreen)').matches;
  if (!touch || standalone || !canFull()) return;

  const btn = document.createElement('button');
  btn.id = 'fs';
  btn.setAttribute('aria-label', 'Fullscreen');
  document.body.appendChild(btn);
  const sync = () => {
    btn.textContent = isFull() ? '✕' : '⛶';
    btn.setAttribute('aria-label', isFull() ? 'Exit fullscreen' : 'Fullscreen');
  };
  sync();
  document.addEventListener('fullscreenchange', sync);
  document.addEventListener('webkitfullscreenchange', sync);

  btn.addEventListener('pointerdown', (e) => e.stopPropagation());
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (isFull()) exit();
    else void enter();
  });

  // first tap anywhere goes fullscreen
  window.addEventListener('pointerup', (e) => {
    if (e.target !== btn && !isFull()) void enter();
  }, { once: true });
}
