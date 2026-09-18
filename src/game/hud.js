import { LOGICAL_W, HUD_H, NUM_LEVELS, LEVEL_COLS } from './constants.js';

export function drawHud(ctx, world) {
  ctx.fillStyle = '#0a0a12';
  ctx.fillRect(0, 0, LOGICAL_W, HUD_H);
  ctx.fillStyle = '#e0e1dd';
  ctx.font = '10px monospace';
  ctx.textBaseline = 'middle';

  const y1 = HUD_H * 0.32;
  const y2 = HUD_H * 0.76;

  // Line 1: score / level / lives
  ctx.fillText(`SCORE ${String(world.score).padStart(6, '0')}`, 6, y1);
  ctx.fillText(`LEVEL ${world.levelIndex + 1}/${NUM_LEVELS}`, 150, y1);
  ctx.fillText(`LIVES ${'*'.repeat(Math.max(0, world.player.lives))}`, 250, y1);

  // Line 2: room coordinates (1-indexed column,row within the level's 8x4
  // grid — deliberately 1-indexed for the player-facing HUD, unlike the
  // 0-indexed (col, row) the room editor shows for the same room) / key state
  const col = (world.roomId % LEVEL_COLS) + 1;
  const row = Math.floor(world.roomId / LEVEL_COLS) + 1;
  ctx.fillText(`ROOM ${col},${row}`, 6, y2);
  const keyState = world.keysCollected[world.levelIndex] ? 'KEY OK' : (world.level.lockedEdge ? 'KEY --' : '');
  ctx.fillText(keyState, 150, y2);
}
