import Phaser from 'phaser';

/** Cross-scene event bus (Drive -> HUD and friends). */
export const bus = new Phaser.Events.EventEmitter();
