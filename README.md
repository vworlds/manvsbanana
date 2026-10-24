# Man VS Banana — the game

A satire game based on the short in `video/`. The hero is drawn after `video/man.png`.

```
npm install
npm run dev      # play at the printed localhost URL
npm test         # logic tests (ripeness timer, pleading)
npm run build    # typecheck + production build in dist/
npm run art      # regenerate the SVG art in public/assets from scripts/gen-art.mjs
```

**Loop:** drive home before the bananas rot. Trip 1 is easy; each later trip is longer and the bananas ripen faster.
- **Made it home:** the family eats them, looking down their noses at you, and demands more → back to the store, next trip.
- **Bananas rotted:** plead with the family (lines dealt at random from a big pool, see `src/logic/pleadLines.ts`) →
  either a second chance at the store, or the father fails, the kid declares "I am father now", grows up into him,
  and the next generation drives.

Difficulty lives in `src/logic/trip.ts` (distances, speed, turbo gauge) and `src/logic/ripeness.ts`;
`npm test` simulates a perfect driver to keep the curve honest (trip 1 easy, trip 4 needs turbo, trip 8 hopeless).

**Controls:** ↑/↓ or swipe to change lanes · Space (or hold the right side) for turbo · Enter / tap phone to text back ·
1–4 to pick pleading lines · M mute · V browser voices · Esc quit.

**Debug URLs:** `?scene=drive|home|plead|finale|store`, `?fastripe=8` (bananas rot 8x faster).
