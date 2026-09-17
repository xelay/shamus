import { TILE, PLAYER_SPEED, SHOT_SPEED, INVULN_TIME } from '../constants.js';
import { moveWithCollision, rectHitsElectric } from '../../engine/collision.js';
import { Projectile } from './projectile.js';
import { sprite } from '../sprites.js';

export class Player {
  constructor(x, y) {
    this.x = x; this.y = y; this.w = 18; this.h = 18;
    this.facing = { dx: 0, dy: 1 };
    this.shots = [];
    this.lives = 3;
    this.invuln = 0;
    this.dead = false;
  }

  update(dt, input, grid, speedMul) {
    if (this.invuln > 0) this.invuln -= dt;

    let dx = 0, dy = 0;
    if (input.isDown('ArrowLeft') || input.isDown('KeyA')) dx -= 1;
    if (input.isDown('ArrowRight') || input.isDown('KeyD')) dx += 1;
    if (input.isDown('ArrowUp') || input.isDown('KeyW')) dy -= 1;
    if (input.isDown('ArrowDown') || input.isDown('KeyS')) dy += 1;
    if (dx !== 0 || dy !== 0) {
      const len = Math.hypot(dx, dy);
      dx /= len; dy /= len;
      this.facing = { dx, dy };
      moveWithCollision(grid, this, dx * PLAYER_SPEED * speedMul * dt, dy * PLAYER_SPEED * speedMul * dt);
    }

    let event = null;

    // Игрок может держать в полёте до двух зарядов одновременно — как в оригинале.
    if (input.wasPressed('Space') && this.shots.length < 2) {
      const sx = this.x + this.w / 2 - 3 + this.facing.dx * TILE * 0.5;
      const sy = this.y + this.h / 2 - 3 + this.facing.dy * TILE * 0.5;
      this.shots.push(new Projectile(sx, sy, this.facing.dx, this.facing.dy, SHOT_SPEED, 'player'));
      event = 'shoot';
    }

    for (const s of this.shots) s.update(dt, grid);
    this.shots = this.shots.filter((s) => !s.dead);

    if (this.invuln <= 0 && rectHitsElectric(grid, this.x, this.y, this.w, this.h)) {
      event = 'electrocuted';
    }
    return event;
  }

  hit() {
    if (this.invuln > 0 || this.dead) return false;
    this.lives -= 1;
    this.invuln = INVULN_TIME;
    if (this.lives <= 0) this.dead = true;
    return true;
  }

  draw(ctx) {
    if (this.invuln > 0 && Math.floor(this.invuln * 12) % 2 === 0) return; // мигание при неуязвимости
    ctx.drawImage(sprite('player'), this.x, this.y, this.w, this.h);
    for (const s of this.shots) s.draw(ctx);
  }
}
