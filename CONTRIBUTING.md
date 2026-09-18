# Contributing / developer notes

This file covers local setup and the codebase layout for the Shamus-like personal
project. See [README.md](README.md) (English), [README.zh.md](README.zh.md) (中文), or
[README.ru.md](README.ru.md) (Русский) for what the project is, controls, and gameplay
design notes.

## How to run

This is a pure static site (vanilla JS + Canvas, no build step), but browsers won't
load ES modules (`<script type="module">`) directly from `file://` — you need a local
HTTP server. The option that works almost everywhere:

```bash
node serve.js
```

(only needs Node.js, no npm packages; default port 8000, use a different one with
`node serve.js 3000`).

Alternatives if Node isn't installed:

```bash
# Node is present, but you'd rather use an existing server package
npx http-server -p 8000

# Python. On Windows the command is often "python", not "python3" —
# "python3" can be intercepted by the Microsoft Store stub and report
# "Python was not found". If "python" doesn't resolve either, Python
# isn't actually installed, or the alias is disabled in Settings > Apps
# > Advanced app settings > App execution aliases.
python -m http.server 8000
```

Or, in VS Code — the **Live Server** extension: right-click `index.html` → "Open with
Live Server", no terminal needed at all.

Then open `http://localhost:8000/`.

### Testing on a phone / iOS install during development

To test touch controls or "Add to Home Screen" on an actual phone, the phone needs to
reach the dev server over the network (not just `localhost`): start the server, find
your computer's LAN IP, and open `http://<your-lan-ip>:8000/` from the phone (same
Wi-Fi network). iOS Safari only offers "Add to Home Screen" for pages it has actually
loaded, so visit the page there first.

The service worker (see below) caches aggressively across reloads; if a change isn't
showing up on the phone, close the installed app/tab fully and reopen, or clear the
site's data.

## Project structure

```
index.html              entry point; also carries the PWA <meta> tags (manifest link,
                          apple-touch-icon, apple-mobile-web-app-*) and the touch-
                          controls overlay markup (#touch-controls, joystick, fire button)
serve.js                 zero-dependency dev server (node serve.js)
manifest.json             Web App Manifest (name, icons, standalone display, theme color)
sw.js                     service worker: precaches all game files, network-first with
                           cache fallback (see "Notes for future changes" below)
icons/                    app icons referenced by manifest.json / apple-touch-icon
                           (icon-180.png, icon-192.png, icon-512.png, icon-maskable-512.png)
docs/
  screenshots/             gameplay screenshots used in the README files
  sprites/                 monster/artifact sprite images used in the README files
tools/
  icon-gen.html            standalone page that programmatically draws the app icons
                            onto <canvas> elements in the game's own sprite style
                            (regeneration tool, not loaded by the game itself)
  sprite-gallery-gen.html  standalone page that renders each named sprite from
                            src/game/sprites.js (imported as a real ES module, not a
                            copy) onto padded canvases — regenerates docs/sprites/*.png
src/
  main.js                 bootstrap: canvas, game loop, state machine
                           (menu / playing / paused / game over), iOS audio-unlock
                           listener, touch-controls wiring, service worker registration
  engine/                 reusable "engine" layer, knows nothing Shamus-specific
    loop.js                fixed-timestep game loop (60 Hz)
    input.js                keyboard (isDown / wasPressed) + simulateKeyDown/Up, used
                             by touchControls.js to feed touch input through the same
                             state as the keyboard
    touchControls.js         virtual joystick + fire button (Pointer Events), only
                              active on touch-capable devices (isTouchDevice())
    collision.js             AABB/tile collision
    audio.js                  sound synthesis (Web Audio, no samples)
    save.js                    localStorage save/load
    prng.js                     deterministic PRNG (mulberry32) for procedural generation
  game/
    constants.js               all sizes/speeds/timings in one place
    sprites.js                  procedural pixel sprites (no external PNGs) — the
                                 player sprite's pattern/palette is also what
                                 tools/icon-gen.html reuses for the app icon
    levelgen.js                  generator for the 4x32 rooms: connectivity,
                                  lock-and-key, enemy placement, entrance-safety buffer
    room.js                       runtime for a single room (enemy respawn, Shadow timer)
    world.js                       game state: level/room/score/lives/transitions
    hud.js / render.js             HUD and scene rendering
    entities/                       player, enemy, shadow, projectile, pickups (key/exit)
  data/
    room-overrides.json             manual per-room overrides layered on top of
                                     procedural generation (hand-edited JSON — see
                                     "Notes for future changes" below)
```

## Notes for future changes

- Level/room generation is deterministic (`BASE_SEED` in `constants.js`) — changing the
  generation algorithm changes every room's layout. If you tweak `levelgen.js`, re-run a
  quick self-check (BFS connectivity across all 128 rooms, lock/key reachability, and
  `isEntranceBuffer()` coverage around every door) before shipping — there's no
  automated test suite wired up yet, this has so far been done ad hoc via a throwaway
  Node script during development.
- `isEntranceBuffer()` (exported from `levelgen.js`) is the single source of truth for
  "don't place obstacles/enemies/keys right next to a door" — reuse it rather than
  duplicating the rule if you add new spawn logic.
- `src/data/room-overrides.json` lets you hand-edit specific rooms on top of the
  procedural generation (see `setOverrides()` / `getLevel()` in `levelgen.js`). There is
  no GUI for this — the room editor that used to generate this file was removed, since
  it wasn't getting used; the format is still read at boot, so edit the JSON directly
  if you need to fix a room. Each key is `"<levelIndex>:<roomId>"` and its value is an
  object whose fields get merged onto that room's generated definition — most useful are
  `grid` (the 10×16 tile array), `enemies` (array of `{col, row, type}`), and `hasKey`.
- `sw.js` uses a **network-first, cache-fallback** strategy on purpose (not cache-first):
  every request tries the network first and writes the result into the cache, only
  falling back to the cache on a network failure. Since there's no build step or cache
  busting, cache-first would mean edits during development silently don't show up until
  the cache is manually cleared. If you add new files to the project that the game
  loads, add them to `PRECACHE_URLS` in `sw.js` too, or they simply won't be available
  offline (this fails soft, not a functional bug, just missing offline coverage).
  Bump `CACHE_NAME` (e.g. `shamus-like-v2`) when you want to force old cached entries
  from a previous session to be discarded on the next visit.
- App icons in `icons/` were generated with `tools/icon-gen.html` (open it directly in
  a browser — it draws 4 `<canvas>` elements you can right-click → "Save image as").
  It deliberately duplicates the player sprite's pixel pattern and palette from
  `src/game/sprites.js` (`PATTERNS.player` / `PALETTES.player`) rather than importing
  the module, since it's meant to be a standalone tool — if you change the player
  sprite's look, update `tools/icon-gen.html`'s copy to match and regenerate the icons.
  The maskable icon (`icon-maskable-512.png`) uses extra inner padding (safe zone) per
  the maskable-icon spec so Android doesn't crop the robot's outline when it applies a
  shape mask.
- `docs/sprites/*.png` (the README's Monsters & Artifacts images) were generated with
  `tools/sprite-gallery-gen.html`. Unlike `icon-gen.html`, it imports `src/game/sprites.js`
  as a real ES module rather than copying its pattern/palette data, so it never needs
  manual syncing when a sprite changes — open it through the same local server and
  screenshot each canvas (or drive it headlessly) to regenerate. `docs/screenshots/*.png`
  are plain gameplay screenshots and have no regeneration tool; retake them by hand if
  the HUD or visuals change enough to make them stale.
- Touch input funnels through `Input.simulateKeyDown/Up` in `input.js`, which is the
  exact same code path real keyboard events use — anything that reacts to keyboard
  state (`isDown`, `wasPressed`) automatically also reacts to touch, so there's no
  separate touch-specific game logic to keep in sync.
- iOS requires `AudioContext` creation/`resume()` to happen synchronously inside a real
  user-gesture event handler, not on a later frame — `main.js` has a one-time
  `pointerdown`/`keydown` listener (`unlockAudioOnce`) specifically for this; don't move
  audio initialization into `requestAnimationFrame` or a game-loop tick, it will silently
  stay muted on iOS Safari.
