import { LOGICAL_W, HUD_H, NUM_LEVELS, LEVEL_COLS } from './constants.js';

// 5 fixed, equal-width columns spanning the full HUD width, each field
// left-aligned within its own column — deliberately NOT packed by measured
// text width, so no field's on-screen position ever depends on how long a
// neighboring field's text happens to be this frame (e.g. LIVES losing a
// star, or KEY having no text at all when a level has no lock). Order is
// SCORE, LVL, ROOM, KEY, LIVES — LIVES last so a shrinking star count never
// shifts anything after it (nothing follows it).
const NUM_FIELDS = 5;
const COL_W = LOGICAL_W / NUM_FIELDS;
const COL_PAD = 4; // left padding inside each column

export function drawHud(ctx, world) {
  ctx.fillStyle = '#0a0a12';
  ctx.fillRect(0, 0, LOGICAL_W, HUD_H);
  ctx.fillStyle = '#e0e1dd';
  ctx.font = '10px monospace';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  const y = HUD_H / 2;

  // Room coordinates: 1-indexed (column, row) within the level's 8x4 grid.
  const col = (world.roomId % LEVEL_COLS) + 1;
  const row = Math.floor(world.roomId / LEVEL_COLS) + 1;
  const keyState = world.keysCollected[world.levelIndex] ? 'KEY OK' : (world.level.lockedEdge ? 'KEY --' : '');

  const fields = [
    `SCORE ${String(world.score).padStart(6, '0')}`,
    `LVL ${world.levelIndex + 1}/${NUM_LEVELS}`,
    `ROOM ${col},${row}`,
    keyState, // '' when the level has no lock at all — column just stays blank
    `LIVES ${'*'.repeat(Math.max(0, world.player.lives))}`,
  ];

  fields.forEach((text, i) => {
    if (text) ctx.fillText(text, i * COL_W + COL_PAD, y);
  });
}
