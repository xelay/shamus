import { TILE, ROOM_COLS, ROOM_ROWS, HUD_H, TILE_WALL, TILE_ELECTRIC, TILE_LOCKED_DOOR } from './constants.js';
import { drawHud } from './hud.js';

export function renderWorld(ctx, world, t) {
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, ROOM_COLS * TILE, HUD_H + ROOM_ROWS * TILE);

  ctx.save();
  ctx.translate(0, HUD_H);

  const grid = world.room.grid;
  const flick = Math.floor(t * 8) % 2 === 0;
  for (let r = 0; r < ROOM_ROWS; r++) {
    for (let c = 0; c < ROOM_COLS; c++) {
      const tile = grid[r][c];
      if (tile === TILE_WALL) { ctx.fillStyle = '#3a5a40'; ctx.fillRect(c * TILE, r * TILE, TILE, TILE); }
      else if (tile === TILE_ELECTRIC) { ctx.fillStyle = flick ? '#ffd60a' : '#ef476f'; ctx.fillRect(c * TILE, r * TILE, TILE, TILE); }
      else if (tile === TILE_LOCKED_DOOR) {
        ctx.fillStyle = '#8d99ae';
        ctx.fillRect(c * TILE, r * TILE, TILE, TILE);
        ctx.strokeStyle = '#000';
        ctx.strokeRect(c * TILE + 4, r * TILE + 4, TILE - 8, TILE - 8);
      }
    }
  }

  if (world.room.key) world.room.key.draw(ctx);
  if (world.exitMarker) world.exitMarker.draw(ctx);
  for (const e of world.room.enemies) e.draw(ctx);
  if (world.room.shadow) world.room.shadow.draw(ctx);
  world.player.draw(ctx);

  ctx.restore();
  drawHud(ctx, world);
}
