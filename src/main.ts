import Phaser from 'phaser';
import { audio, unlock } from './audio/sfx';
import { setupFullscreen } from './fullscreen';
import { Boot } from './scenes/Boot';
import { Title } from './scenes/Title';
import { Drive } from './scenes/Drive';
import { Hud } from './scenes/Hud';
import { Plead } from './scenes/Plead';
import { Store } from './scenes/Store';
import { Finale } from './scenes/Finale';
import { Home } from './scenes/Home';

async function fontsReady() {
  const wait = Promise.all([document.fonts.load('40px Bangers'), document.fonts.load('900 20px Nunito')]);
  await Promise.race([wait, new Promise((r) => setTimeout(r, 2500))]);
}

// Audio can only start after a user gesture: unlock it on the first key or tap anywhere.
for (const ev of ['pointerdown', 'keydown', 'touchstart'] as const) window.addEventListener(ev, unlock, { once: true, capture: true });

// Upright phone: the game is covered by "turn your phone sideways", so pause it (and its sound) meanwhile.
let game: Phaser.Game | null = null;
let upright = false;
const pauseFor = (portrait: boolean) => {
  upright = portrait;
  if (!game) return;
  if (portrait) game.pause();
  else {
    game.resume();
    game.scale.refresh(); // the screen turned while paused
  }
  const a = audio();
  if (a) void (portrait ? a.ctx.suspend() : a.ctx.resume()).catch(() => undefined);
};
setupFullscreen(pauseFor);

void fontsReady().then(() => {
  game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game',
    width: 1280,
    height: 720,
    backgroundColor: '#000000',
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    input: { activePointers: 3 },
    scene: [Boot, Title, Drive, Hud, Plead, Home, Store, Finale],
  });
  (window as unknown as { game: Phaser.Game }).game = game;
  if (upright) game.events.once('ready', () => pauseFor(true));
});
