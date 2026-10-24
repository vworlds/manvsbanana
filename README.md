# Man VS Banana — the game

A satire game based on the short in `video/`. The hero is drawn after `video/man.png`.

**Play:** https://vworlds.github.io/manvsbanana/

**Branches:** work happens on `dev` (the default branch). `master` is the release branch: every push to it runs the
tests, builds, and publishes the game to GitHub Pages (`.github/workflows/pages.yml`). To release:
`git push origin dev:master`.

```
npm install
npm run dev      # play at the printed localhost URL
npm run dev:lan  # also serve on your network (0.0.0.0): open the printed Network URL on your phone
npm test         # logic tests (ripeness timer, pleading)
npm run build    # typecheck + production build in dist/
npm run art      # regenerate the SVG art in public/assets from scripts/gen-art.mjs
npm run voice    # re-cut the voice clips from the video into public/audio/vo (cut points in scripts/cut-voice.mjs)
```

**Loop:** drive home before the bananas rot. Trip 1 is easy; each later trip is longer and the bananas ripen faster.
- **Made it home:** the family eats them, looking down their noses at you, and demands more → back to the store, next trip.
- **Bananas rotted:** plead with the family (lines dealt at random from a big pool, see `src/logic/pleadLines.ts`) →
  either a second chance at the store, or the father fails, the kid declares "I am father now", grows up into him,
  and the next generation drives.

Difficulty lives in `src/logic/trip.ts` (distances, speed, turbo gauge) and `src/logic/ripeness.ts`;
`npm test` simulates a perfect driver to keep the curve honest (trip 1 easy, trip 3 needs clean driving, trip 4 needs turbo plus pickups).

**Controls:** ↑/↓ or swipe to change lanes · Space/→ (or hold the right edge) for turbo · ←/A (or hold the left edge)
to brake, which also refills turbo a little · Enter / tap the phone to text your wife back · 1–4 to pick pleading lines ·
M mute · Esc quit.

**On a phone:** the first tap goes fullscreen (the ⛶ button in the top-right corner toggles it). On iPhone, Safari can't do
fullscreen for web pages, so use Share → Add to Home Screen and open it from there.

**On the road:** traffic comes in rows that never block all three lanes; crosswalks (more crowded on later trips),
crossroads with a traffic light (brake and wait, or turbo through; run the red and the police come after you),
and roadworks (traffic keeps one lane free for you). The rules that guarantee there is always a way through are in
`src/logic/traffic.ts` and covered by `npm test`.

**Debug URLs:** `?scene=drive|home|plead|finale|store`, `?fastripe=8` (bananas rot 8x faster), `?trip=4` (start on a later trip),
`?events=crossroad,works,crosswalk` (force the first road events), `?park=trash|lady|kid|tree|parked`
(force the crash-park ending).

**Voice clips:** the iconic lines ("Oh shit shit shit shit…", "Don't turn yellow", "Family! I have bananas!",
"Banana emergency!…", "No.", "I tried so hard", "Father has failed.", "I am father now.") are cut from the original short
into `public/audio/vo/`. That audio belongs to Explosm: fine for playing privately, but if you ever publish the game,
get permission or delete that folder. The game then falls back to text-only lines.
