import { TILE_WALL, TILE_ELECTRIC, TILE_LOCKED_DOOR } from '../game/constants.js';

export function isSolidTile(t) {
  return t === TILE_WALL || t === TILE_ELECTRIC || t === TILE_LOCKED_DOOR;
}
export function isElectricTile(t) {
  return t === TILE_ELECTRIC;
}

// grid — двумерный массив grid[row][col]. Координаты вне сетки считаются стеной,
// чтобы объекты не "проваливались" за пределы комнаты по ошибке.
export function tileAt(grid, px, py) {
  const col = Math.floor(px / 24);
  const row = Math.floor(py / 24);
  if (row < 0 || col < 0 || row >= grid.length || col >= grid[0].length) return TILE_WALL;
  return grid[row][col];
}

function corners(x, y, w, h) {
  const left = x, right = x + w - 1, top = y, bottom = y + h - 1;
  return [[left, top], [right, top], [left, bottom], [right, bottom]];
}

export function rectHitsSolid(grid, x, y, w, h) {
  for (const [cx, cy] of corners(x, y, w, h)) {
    if (isSolidTile(tileAt(grid, cx, cy))) return true;
  }
  return false;
}

export function rectHitsElectric(grid, x, y, w, h) {
  for (const [cx, cy] of corners(x, y, w, h)) {
    if (isElectricTile(tileAt(grid, cx, cy))) return true;
  }
  return false;
}

// Двигает entity (объект с полями x,y,w,h) на dx,dy, независимо блокируя
// движение по каждой оси при столкновении со стеной — так можно "скользить"
// вдоль стены по диагонали, как в оригинальных играх этой эпохи.
export function moveWithCollision(grid, entity, dx, dy) {
  if (dx !== 0) {
    const nx = entity.x + dx;
    if (!rectHitsSolid(grid, nx, entity.y, entity.w, entity.h)) entity.x = nx;
  }
  if (dy !== 0) {
    const ny = entity.y + dy;
    if (!rectHitsSolid(grid, entity.x, ny, entity.w, entity.h)) entity.y = ny;
  }
}

export function aabbIntersect(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}
