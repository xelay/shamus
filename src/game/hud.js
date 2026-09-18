import { LOGICAL_W, HUD_H, NUM_LEVELS, LEVEL_COLS } from './constants.js';

// Gap between fields, in px, at the logical (unscaled) resolution — tight on
// purpose so all 5 fields fit on the HUD's single line. Fields are laid out
// left-to-right using the actual measured width of each one (rather than
// fixed x positions), so the packing stays tight and correct no matter how
// the score/lives/etc. text length varies from frame to frame.
const FIELD_GAP = 14;

export function drawHud(ctx, world) {
  ctx.fillStyle = '#0a0a12';
  ctx.fillRect(0, 0, LOGICAL_W, HUD_H);
  ctx.fillStyle = '#e0e1dd';
  ctx.font = '10px monospace';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  const y = HUD_H / 2;

  // Room coordinates: 1-indexed (column, row) within the level's 8x4 grid —
  // deliberately 1-indexed for this player-facing HUD, unlike the 0-indexed
  // (col, row) the room editor shows for the same room.
  const col = (world.roomId % LEVEL_COLS) + 1;
  const row = Math.floor(world.roomId / LEVEL_COLS) + 1;
  const keyState = world.keysCollected[world.levelIndex] ? 'KEY OK' : (world.level.lockedEdge ? 'KEY --' : '');

  const fields = [
    `SCORE ${String(world.score).padStart(6, '0')}`,
    `LVL ${world.levelIndex + 1}/${NUM_LEVELS}`,
    `LIVES ${'*'.repeat(Math.max(0, world.player.lives))}`,
    `ROOM ${col},${row}`,
    keyState, // '' when the level has no lock at all — simply contributes nothing
  ].filter(Boolean);

  let x = 6;
  for (const text of fields) {
    ctx.fillText(text, x, y);
    x += ctx.measureText(text).width + FIELD_GAP;
  }
}
