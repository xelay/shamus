import { LOGICAL_W, HUD_H, NUM_LEVELS } from './constants.js';

export function drawHud(ctx, world) {
  ctx.fillStyle = '#0a0a12';
  ctx.fillRect(0, 0, LOGICAL_W, HUD_H);
  ctx.fillStyle = '#e0e1dd';
  ctx.font = '10px monospace';
  ctx.textBaseline = 'middle';
  const y = HUD_H / 2;
  ctx.fillText(`SCORE ${String(world.score).padStart(6, '0')}`, 6, y);
  ctx.fillText(`LEVEL ${world.levelIndex + 1}/${NUM_LEVELS}`, 150, y);
  ctx.fillText(`LIVES ${'*'.repeat(Math.max(0, world.player.lives))}`, 250, y);
  const keyState = world.keysCollected[world.levelIndex] ? 'KEY OK' : (world.level.lockedEdge ? 'KEY --' : '');
  ctx.fillText(keyState, 330, y);
}
