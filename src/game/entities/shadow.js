import { SHADOW_SPEED, SHADOW_STUN_TIME } from '../constants.js';
import { moveWithCollision } from '../../engine/collision.js';
import { sprite } from '../sprites.js';

// "Тень" — неубиваемый преследователь, появляется если задержаться в комнате.
// Выстрел не убивает её, а лишь временно оглушает (stun).
export class Shadow {
  constructor(x, y) {
    this.x = x; this.y = y; this.w = 18; this.h = 18;
    this.stun = 0;
  }
  hit() { this.stun = SHADOW_STUN_TIME; }
  update(dt, grid, player, speedMul) {
    if (this.stun > 0) { this.stun -= dt; return; }
    const dx = Math.sign(player.x - this.x) || 0;
    const dy = Math.sign(player.y - this.y) || 0;
    moveWithCollision(grid, this, dx * SHADOW_SPEED * speedMul * dt, dy * SHADOW_SPEED * speedMul * dt);
  }
  draw(ctx) {
    ctx.globalAlpha = this.stun > 0 ? 0.4 : 0.9;
    ctx.drawImage(sprite('shadow'), this.x, this.y, this.w, this.h);
    ctx.globalAlpha = 1;
  }
}
