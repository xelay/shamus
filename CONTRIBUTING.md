# Contributing / developer notes

This file covers local setup and the codebase layout for the Shamus-like personal
project. See [README.md](README.md) for what the project is, controls, and gameplay
design notes (available in English, 中文, and Русский).

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

Then open `http://localhost:8000/`. The room editor lives at
`http://localhost:8000/editor/editor.html`.

## Project structure

```
index.html              entry point
serve.js                 zero-dependency dev server (node serve.js)
src/
  main.js                 bootstrap: canvas, game loop, state machine
                           (menu / playing / paused / game over)
  engine/                 reusable "engine" layer, knows nothing Shamus-specific
    loop.js                fixed-timestep game loop (60 Hz)
    input.js                keyboard (isDown / wasPressed)
    collision.js             AABB/tile collision
    audio.js                  sound synthesis (Web Audio, no samples)
    save.js                    localStorage save/load
    prng.js                     deterministic PRNG (mulberry32) for procedural generation
  game/
    constants.js               all sizes/speeds/timings in one place
    sprites.js                  procedural pixel sprites (no external PNGs)
    levelgen.js                  generator for the 4x32 rooms: connectivity,
                                  lock-and-key, enemy placement, entrance-safety buffer
    room.js                       runtime for a single room (enemy respawn, Shadow timer)
    world.js                       game state: level/room/score/lives/transitions
    hud.js / render.js             HUD and scene rendering
    entities/                       player, enemy, shadow, projectile, pickups (key/exit)
  data/
    room-overrides.json             manual room edits layered on top of procedural
                                     generation (see the "Room editor" section in README)
editor/
  editor.html, editor.js             standalone tool for manually editing rooms
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
