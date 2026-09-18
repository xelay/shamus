// Все "настройки мира" собраны здесь, чтобы менять баланс/размеры в одном месте.
export const TILE = 24;
export const ROOM_COLS = 16;
export const ROOM_ROWS = 10;
export const ROOM_W = ROOM_COLS * TILE; // 384
export const ROOM_H = ROOM_ROWS * TILE; // 240
export const HUD_H = 40; // two text lines (score/level/lives, then room coords/key)
export const LOGICAL_W = ROOM_W;
export const LOGICAL_H = ROOM_H + HUD_H;
export const DISPLAY_SCALE = 2;
export const DOOR_EDGE = 2; // порог в пикселях для срабатывания перехода в соседнюю комнату

export const LEVEL_COLS = 8;
export const LEVEL_ROWS = 4;
export const ROOMS_PER_LEVEL = LEVEL_COLS * LEVEL_ROWS; // 32
export const NUM_LEVELS = 4; // итого 128 комнат, как в оригинале

// фиксированный сид мира: уровни персистентны и одинаковы при каждом запуске,
// а не генерируются заново случайно (как и в оригинальном Shamus в пику Berzerk)
export const BASE_SEED = 1337;

export const TILE_EMPTY = 0;
export const TILE_WALL = 1;
export const TILE_ELECTRIC = 2; // мгновенная смерть при касании
export const TILE_DOOR = 3; // декоративно, реально дверь = пустой тайл в проёме
export const TILE_LOCKED_DOOR = 4; // требует ключ

export const DIRS = {
  N: { dx: 0, dy: -1, opposite: 'S' },
  S: { dx: 0, dy: 1, opposite: 'N' },
  E: { dx: 1, dy: 0, opposite: 'W' },
  W: { dx: -1, dy: 0, opposite: 'E' },
};

export const PLAYER_SPEED = 90;
export const ENEMY_BASE_SPEED = 40;
export const SHOT_SPEED = 220;
export const SHADOW_SPEED = 55;
export const SHADOW_TIMEOUT = 14; // сек. в комнате до появления Тени
export const SHADOW_STUN_TIME = 2.5;
export const INVULN_TIME = 1.5;
export const LIVES_START = 3;
