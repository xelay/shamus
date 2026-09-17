import { ENEMY_BASE_SPEED } from '../constants.js';
import { moveWithCollision } from '../../engine/collision.js';
import { sprite } from '../sprites.js';

// Два типа врагов: enemy1 — случайное блуждание, enemy2 — изредка "подруливает"
// в сторону игрока (лёгкое преследование), оба респаунятся при входе в комнату.
export class Enemy {
  constructor(x, y, type, rng) {
    this.x = x; this.y = y; this.w = 16; this.h = 16;
    this.type = type;
    this.rng = rng;
    this.dir = { dx: rng() < 0.5 ? 1 : -1, dy: 0 };
    this.changeTimer = 1 + rng() * 2;
    this.alive = true;
  }
  update(dt, grid, player, speedMul) {
    this.changeTimer -= dt;
    if (this.changeTimer <= 0) {
      this.changeTimer = 1 + this.rng() * 2;
      const opts = [[1, 0], [-1, 0], [0, 1], [0, -1]];
      const [dx, dy] = opts[Math.floor(this.rng() * opts.length)];
      this.dir = { dx, dy };
    }
    if (this.type === 'enemy2' && this.rng() < 0.02) {
      this.dir = { dx: Math.sign(player.x - this.x), dy: Math.sign(player.y - this.y) };
    }
    const speed = ENEMY_BASE_SPEED * speedMul;
    moveWithCollision(grid, this, this.dir.dx * speed * dt, this.dir.dy * speed * dt);
  }
  draw(ctx) {
    ctx.drawImage(sprite(this.type), this.x, this.y, this.w, this.h);
  }
}
