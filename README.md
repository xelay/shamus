# Shamus-like — personal fan clone

**Languages:** [English](README.md) · [中文](README.zh.md) · [Русский](README.ru.md)

A personal, non-commercial fan clone of *Shamus* (Synapse Software, 1982, designed by
Cathryn Mataga) — no original assets or code, everything here is original: procedural
pixel sprites, synthesized Web Audio sound, and procedurally generated rooms. Not
intended for publication or commercial use.

For setup instructions and the project structure, see
[CONTRIBUTING.md](CONTRIBUTING.md) (English only).

### Screenshots

| | |
|---|---|
| ![Menu screen](docs/screenshots/01-menu.png)<br>Menu screen | ![Exploring a room, an enemy nearby](docs/screenshots/02-monster.png)<br>Exploring a room — an Amber Stalker nearby |
| ![Firing at an enemy](docs/screenshots/03-shot.png)<br>A shot in flight | ![Key collected, HUD populated](docs/screenshots/04-key-hud.png)<br>Key collected — HUD shows KEY OK |
| ![Game over screen](docs/screenshots/05-gameover.png)<br>Game over | |

### Controls

- **WASD / Arrow keys** — move
- **Space** — shoot (up to 2 shots in flight at once, like the original)
- **P** — pause
- **N** — new game (from the menu; clears the save)
- **Enter** — confirm / continue a saved game

On a touch device (phone/tablet), a virtual joystick and a fire button appear
automatically in place of the keyboard hints — see "Touch controls & installing on
iOS" below.

Progress (level, room, score, collected keys) is saved automatically to the browser's
`localStorage` — no server needed.

### Touch controls & installing on iOS

On a touch-capable device the game detects the lack of a keyboard and shows an
on-screen virtual joystick (drag to move) plus a fire button, wired into the same input
system as the keyboard — no separate touch codepath to keep in sync.

The project is also installable as a standalone app (PWA):

- **iOS (Safari):** open the game's URL, tap the Share icon, then "Add to Home
  Screen". It launches full-screen with its own icon, no browser chrome.
- **Android (Chrome):** open the URL, then use the menu → "Add to Home screen" /
  "Install app" (Chrome may also offer this automatically via a banner).

Once installed, a service worker caches the game's files so it keeps working offline
after the first load. Since this project has no build step, the service worker uses a
network-first strategy (always tries the network first, falls back to the cache) so
that local edits during development are never masked by a stale cache — see
[CONTRIBUTING.md](CONTRIBUTING.md) for details.

### How level generation works

Each level is a graph of 32 rooms (an 8×4 grid); connectivity is guaranteed by a
spanning tree (plus a few extra edges for variety/loops). Generation is deterministic
(a fixed seed) — every run produces the same persistent world, just like the original
(unlike Berzerk, whose rooms were randomized).

Lock-and-key progression: an edge on the graph path from the start room to the exit is
chosen such that removing it actually splits the graph into two disconnected parts
(verified with BFS — if the exit is still reachable another way after removing an edge,
that edge doesn't qualify and the next one is tried). The key is placed in a room
reachable without crossing that edge. This guarantees the exit is physically
unreachable without the key. Occasionally (if every edge on the path turns out to be
"non-critical" because of loops) a level may end up with no lock at all — it's then
simply fully open; this is a safe fallback, not a bug.

### Monsters & Artifacts

| Sprite | Name | Description |
|---|---|---|
| ![Crimson Drone](docs/sprites/enemy1.png) | **Crimson Drone** | Wanders the room at random, changing direction every 1–3 seconds. No memory of the player — pure chance decides whether you cross paths. |
| ![Amber Stalker](docs/sprites/enemy2.png) | **Amber Stalker** | Wanders like the Crimson Drone most of the time, but each frame has a small chance (~2%) to turn and head straight for you instead — a light, unpredictable pursuit. |
| ![Shadow](docs/sprites/shadow.png) | **Shadow** | Appears if you linger too long in one room (see `SHADOW_TIMEOUT` in `constants.js`). Relentless and unkillable — it heads straight for you, and a shot only stuns it briefly rather than destroying it. |
| ![Key](docs/sprites/key.png) | **Key** | Unlocks the locked door blocking the path to the level's exit. Always placed somewhere reachable without crossing that door. |
| ![Exit](docs/sprites/exit.png) | **Exit** | Reach it to clear the level and move to the next. Unreachable until the level's key (if it has one) is collected. |

### Known simplifications and quirks (intentional, not bugs)

- All damage sources (enemies, electric walls) currently take away one life with a
  short invulnerability window — in the original, electric walls killed instantly and
  unconditionally; this was simplified on purpose so the game isn't overly punishing.
- Interior obstacles are placed procedurally with a "don't block the center, and never
  block the area right around a door" rule; in theory a very awkward room could still
  slip through — it can be hand-fixed by editing that room's entry in
  `src/data/room-overrides.json` (see [CONTRIBUTING.md](CONTRIBUTING.md)).
- No backend and no cloud saves — only `localStorage`, scoped to one browser on one
  device.
- The original title screen used "Marche funèbre d'une marionnette" (Gounod) — public
  domain, but not reproduced here at all: all audio is procedural synthesis.

### Ideas for future development

- More elaborate enemy AI patterns.
- Gamepad support.
