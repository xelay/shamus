import { TILE, ROOM_COLS, ROOM_ROWS, TILE_LOCKED_DOOR, TILE_EMPTY } from './constants.js';
import { mulberry32 } from '../engine/prng.js';
import { isEntranceBuffer } from './levelgen.js';
import { Enemy } from './entities/enemy.js';
import { Key } from './entities/pickups.js';

// Рантайм-обёртка над процедурным описанием комнаты (room def из levelgen.js):
// хранит изменяемую копию сетки тайлов (чтобы дверь можно было "отпереть"),
// таймер присутствия (для Тени) и список живых врагов текущего захода.
export class RoomRuntime {
  constructor(def) {
    this.def = def;
    this.grid = def.grid.map((row) => row.slice());
    this.timeInRoom = 0;
    this.shadow = null;
    this.enemies = [];
    this.key = null;
    this._spawn();
  }

  _spawn() {
    const rng = mulberry32(1000 + this.def.levelIndex * 97 + this.def.id);
    this.enemies = this.def.enemies.map((e) => new Enemy(e.col * TILE + 3, e.row * TILE + 3, e.type, rng));
    this.key = null;
    if (this.def.hasKey) {
      let kc = 2, kr = 2, tries = 0;
      while (
        (this.grid[kr]?.[kc] !== TILE_EMPTY || isEntranceBuffer(kr, kc, this.def.doors)) &&
        tries < 40
      ) {
        kc = 2 + Math.floor(rng() * (ROOM_COLS - 4));
        kr = 2 + Math.floor(rng() * (ROOM_ROWS - 4));
        tries++;
      }
      this.key = new Key(kc * TILE + 5, kr * TILE + 5);
    }
    this.timeInRoom = 0;
    this.shadow = null;
  }

  // Враги (и Тень) сбрасываются при каждом повторном входе — как в оригинале.
  reenter() { this._spawn(); }

  unlockDoor() {
    if (!this.def.lockedSide) return;
    for (let r = 0; r < ROOM_ROWS; r++) {
      for (let c = 0; c < ROOM_COLS; c++) {
        if (this.grid[r][c] === TILE_LOCKED_DOOR) this.grid[r][c] = TILE_EMPTY;
      }
    }
  }
}
