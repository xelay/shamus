// Процедурная генерация 4 уровней по 32 комнаты (итого 128, как в оригинале).
// Генерация детерминирована (BASE_SEED) — мир персистентен между запусками.
// Поверх процедурной базы можно накладывать ручные правки из редактора
// (src/data/room-overrides.json), см. setOverrides().
import {
  LEVEL_COLS, LEVEL_ROWS, ROOMS_PER_LEVEL, ROOM_COLS, ROOM_ROWS,
  TILE_EMPTY, TILE_WALL, TILE_ELECTRIC, TILE_LOCKED_DOOR,
  DIRS, BASE_SEED,
} from './constants.js';
import { mulberry32 } from '../engine/prng.js';

function idx(col, row) { return row * LEVEL_COLS + col; }

// Строит связный граф комнат уровня: остовное дерево (гарантирует связность
// всех 32 комнат) + немного дополнительных рёбер для петель/вариативности.
function buildGraph(rng) {
  const N = ROOMS_PER_LEVEL;
  const visited = new Array(N).fill(false);
  const adj = Array.from({ length: N }, () => ({}));

  function neighbors(i) {
    const col = i % LEVEL_COLS, row = Math.floor(i / LEVEL_COLS);
    const res = [];
    for (const dir of Object.keys(DIRS)) {
      const { dx, dy } = DIRS[dir];
      const nc = col + dx, nr = row + dy;
      if (nc >= 0 && nc < LEVEL_COLS && nr >= 0 && nr < LEVEL_ROWS) res.push({ dir, idx: idx(nc, nr) });
    }
    return res;
  }

  const start = 0;
  visited[start] = true;
  let frontier = neighbors(start).map((n) => ({ from: start, ...n }));

  while (frontier.length) {
    const pick = Math.floor(rng() * frontier.length);
    const { from, dir, idx: to } = frontier.splice(pick, 1)[0];
    if (visited[to]) continue;
    visited[to] = true;
    adj[from][dir] = to;
    adj[to][DIRS[dir].opposite] = from;
    for (const n of neighbors(to)) if (!visited[n.idx]) frontier.push({ from: to, ...n });
  }

  // немного петель, чтобы уровень не был чисто "деревом" (10% шанс на ребро)
  for (let i = 0; i < N; i++) {
    for (const n of neighbors(i)) {
      if (adj[i][n.dir] == null && rng() < 0.1) {
        adj[i][n.dir] = n.idx;
        adj[n.idx][DIRS[n.dir].opposite] = i;
      }
    }
  }

  return adj;
}

function bfs(adj, start, blockedEdge) {
  const N = adj.length;
  const dist = new Array(N).fill(-1);
  const prev = new Array(N).fill(-1);
  dist[start] = 0;
  const queue = [start];
  while (queue.length) {
    const cur = queue.shift();
    for (const dir of Object.keys(DIRS)) {
      const to = adj[cur][dir];
      if (to == null) continue;
      if (blockedEdge && ((blockedEdge.a === cur && blockedEdge.b === to) || (blockedEdge.a === to && blockedEdge.b === cur))) continue;
      if (dist[to] === -1) { dist[to] = dist[cur] + 1; prev[to] = cur; queue.push(to); }
    }
  }
  return { dist, prev };
}

function farthest(dist) {
  let best = 0, bestD = -1;
  dist.forEach((d, i) => { if (d > bestD) { bestD = d; best = i; } });
  return best;
}

function buildRoomTiles(rng, doors, allowElectricBorder) {
  const grid = Array.from({ length: ROOM_ROWS }, () => new Array(ROOM_COLS).fill(TILE_EMPTY));
  for (let c = 0; c < ROOM_COLS; c++) { grid[0][c] = TILE_WALL; grid[ROOM_ROWS - 1][c] = TILE_WALL; }
  for (let r = 0; r < ROOM_ROWS; r++) { grid[r][0] = TILE_WALL; grid[r][ROOM_COLS - 1] = TILE_WALL; }

  const midC = Math.floor(ROOM_COLS / 2), midR = Math.floor(ROOM_ROWS / 2);
  if (doors.N) { grid[0][midC - 1] = TILE_EMPTY; grid[0][midC] = TILE_EMPTY; }
  if (doors.S) { grid[ROOM_ROWS - 1][midC - 1] = TILE_EMPTY; grid[ROOM_ROWS - 1][midC] = TILE_EMPTY; }
  if (doors.W) { grid[midR - 1][0] = TILE_EMPTY; grid[midR][0] = TILE_EMPTY; }
  if (doors.E) { grid[midR - 1][ROOM_COLS - 1] = TILE_EMPTY; grid[midR][ROOM_COLS - 1] = TILE_EMPTY; }

  // немного внутренних препятствий; центр комнаты нарочно оставляем свободным
  const obstacles = 5 + Math.floor(rng() * 5);
  for (let i = 0; i < obstacles; i++) {
    const c = 2 + Math.floor(rng() * (ROOM_COLS - 4));
    const r = 2 + Math.floor(rng() * (ROOM_ROWS - 4));
    if (Math.abs(c - midC) < 2 && Math.abs(r - midR) < 2) continue;
    grid[r][c] = rng() < 0.35 ? TILE_ELECTRIC : TILE_WALL;
  }

  if (allowElectricBorder) {
    for (let c = 1; c < ROOM_COLS - 1; c++) {
      if (grid[0][c] === TILE_WALL && rng() < 0.08) grid[0][c] = TILE_ELECTRIC;
      if (grid[ROOM_ROWS - 1][c] === TILE_WALL && rng() < 0.08) grid[ROOM_ROWS - 1][c] = TILE_ELECTRIC;
    }
  }
  return grid;
}

function generateLevel(levelIndex) {
  const seed = BASE_SEED + levelIndex * 97531;
  const rng = mulberry32(seed);
  const adj = buildGraph(rng);

  const startRoom = 0;
  const { dist: distFromStart, prev } = bfs(adj, startRoom, null);
  const exitRoom = farthest(distFromStart);

  const path = [];
  for (let cur = exitRoom; cur !== -1; cur = prev[cur]) path.unshift(cur);

  // Ищем реальную "мостовую" грань на пути к выходу: если после удаления
  // ребра выход всё ещё достижим (из-за петель), это ребро не подходит —
  // ищем дальше. Так гарантируется, что замок реально перекрывает путь.
  let lockedEdge = null;
  for (let i = Math.floor(path.length * 0.4); i < path.length - 1; i++) {
    const candidate = { a: path[i], b: path[i + 1] };
    const { dist: d2 } = bfs(adj, startRoom, candidate);
    if (d2[exitRoom] === -1) { lockedEdge = candidate; break; }
  }

  let keyRoom = startRoom;
  if (lockedEdge) {
    const { dist: distNoLock } = bfs(adj, startRoom, lockedEdge);
    keyRoom = farthest(distNoLock);
  }

  const rooms = [];
  for (let i = 0; i < ROOMS_PER_LEVEL; i++) {
    const doors = { N: adj[i].N != null, S: adj[i].S != null, E: adj[i].E != null, W: adj[i].W != null };
    const roomRng = mulberry32(seed + i * 733);
    const grid = buildRoomTiles(roomRng, doors, levelIndex >= 1);

    let lockedSide = null;
    if (lockedEdge && (lockedEdge.a === i || lockedEdge.b === i)) {
      const other = lockedEdge.a === i ? lockedEdge.b : lockedEdge.a;
      for (const dir of Object.keys(DIRS)) if (adj[i][dir] === other) lockedSide = dir;
    }
    if (lockedSide) {
      const midC = Math.floor(ROOM_COLS / 2), midR = Math.floor(ROOM_ROWS / 2);
      if (lockedSide === 'N') { grid[0][midC - 1] = TILE_LOCKED_DOOR; grid[0][midC] = TILE_LOCKED_DOOR; }
      if (lockedSide === 'S') { grid[ROOM_ROWS - 1][midC - 1] = TILE_LOCKED_DOOR; grid[ROOM_ROWS - 1][midC] = TILE_LOCKED_DOOR; }
      if (lockedSide === 'W') { grid[midR - 1][0] = TILE_LOCKED_DOOR; grid[midR][0] = TILE_LOCKED_DOOR; }
      if (lockedSide === 'E') { grid[midR - 1][ROOM_COLS - 1] = TILE_LOCKED_DOOR; grid[midR][ROOM_COLS - 1] = TILE_LOCKED_DOOR; }
    }

    const enemyCount = i === startRoom ? 0 : 1 + Math.floor(roomRng() * (1 + levelIndex));
    const enemies = [];
    for (let e = 0; e < enemyCount; e++) {
      let ex = 2, ey = 2, tries = 0;
      do {
        ex = 2 + Math.floor(roomRng() * (ROOM_COLS - 4));
        ey = 2 + Math.floor(roomRng() * (ROOM_ROWS - 4));
        tries++;
      } while (grid[ey][ex] !== TILE_EMPTY && tries < 20);
      enemies.push({ col: ex, row: ey, type: roomRng() < 0.5 ? 'enemy1' : 'enemy2' });
    }

    rooms.push({
      id: i,
      levelIndex,
      col: i % LEVEL_COLS,
      row: Math.floor(i / LEVEL_COLS),
      doors,
      lockedSide,
      grid,
      enemies,
      hasKey: i === keyRoom && !!lockedEdge,
      isStart: i === startRoom,
      isExit: i === exitRoom,
      adj: adj[i],
    });
  }

  return { rooms, startRoom, exitRoom, keyRoom, lockedEdge };
}

const LEVEL_CACHE = new Map();
let OVERRIDES = {};

// Применяется один раз при старте (см. main.js), после fetch файла с
// ручными правками комнат, сделанными в редакторе (editor/).
export function setOverrides(data) {
  OVERRIDES = data || {};
  LEVEL_CACHE.clear();
}

export function getLevel(levelIndex) {
  if (!LEVEL_CACHE.has(levelIndex)) {
    const level = generateLevel(levelIndex);
    for (const room of level.rooms) {
      const ov = OVERRIDES[`${levelIndex}:${room.id}`];
      if (ov) Object.assign(room, ov);
    }
    LEVEL_CACHE.set(levelIndex, level);
  }
  return LEVEL_CACHE.get(levelIndex);
}
