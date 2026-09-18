import {
  ENEMY_BASE_SPEED, SHOOTER_SPEED_MUL, SHOOTER_FIRE_MIN, SHOOTER_FIRE_MAX,
  ENEMY_SHOT_SPEED, TILE,
} from '../constants.js';
import { moveWithCollision } from '../../engine/collision.js';
import { sprite } from '../sprites.js';
import { Projectile } from './projectile.js';

// Три типа врагов: enemy1 — случайное блуждание, enemy2 — изредка "подруливает"
// в сторону игрока (лёгкое преследование), enemy3 — медленный "стрелок"
// (почти не преследует, зато раз в несколько секунд выпускает один
// прицельный заряд в игрока; пока этот заряд летит, новый не выпускается).
// Все три респаунятся при входе в комнату.
export class Enemy {
  constructor(x, y, type, rng) {
    this.x = x; this.y = y; this.w = 16; this.h = 16;
    this.type = type;
    this.rng = rng;
    this.dir = { dx: rng() < 0.5 ? 1 : -1, dy: 0 };
    this.changeTimer = 1 + rng() * 2;
    this.alive = true;
    this.shots = []; // only used by 'enemy3', harmless empty array for the others
    this.fireTimer = SHOOTER_FIRE_MIN + rng() * (SHOOTER_FIRE_MAX - SHOOTER_FIRE_MIN);
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
    const speedScale = this.type === 'enemy3' ? SHOOTER_SPEED_MUL : 1;
    const speed = ENEMY_BASE_SPEED * speedMul * speedScale;
    moveWithCollision(grid, this, this.dir.dx * speed * dt, this.dir.dy * speed * dt);

    if (this.type === 'enemy3') {
      for (const s of this.shots) s.update(dt, grid);
      this.shots = this.shots.filter((s) => !s.dead);

      this.fireTimer -= dt;
      // Never more than one of this enemy's own shots in flight at a time
      // (shots.length === 0 gate), and never faster than SHOOTER_FIRE_MIN/MAX
      // apart (fireTimer gate) -- together these keep it a slow, deliberate
      // single-shot threat rather than rapid fire.
      if (this.fireTimer <= 0 && this.shots.length === 0) {
        const cx = this.x + this.w / 2, cy = this.y + this.h / 2;
        const pdx = (player.x + player.w / 2) - cx;
        const pdy = (player.y + player.h / 2) - cy;
        const len = Math.hypot(pdx, pdy) || 1;
        const dx = pdx / len, dy = pdy / len;
        const sx = cx - 3 + dx * TILE * 0.4;
        const sy = cy - 3 + dy * TILE * 0.4;
        this.shots.push(new Projectile(sx, sy, dx, dy, ENEMY_SHOT_SPEED, 'enemy'));
        this.fireTimer = SHOOTER_FIRE_MIN + this.rng() * (SHOOTER_FIRE_MAX - SHOOTER_FIRE_MIN);
      }
    }
  }
  draw(ctx) {
    ctx.drawImage(sprite(this.type), this.x, this.y, this.w, this.h);
    for (const s of this.shots) s.draw(ctx);
  }
}
