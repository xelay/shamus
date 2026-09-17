import { rectHitsSolid } from '../../engine/collision.js';

// "Ion SHIV" — снаряд игрока/врага, летит по прямой до стены.
export class Projectile {
  constructor(x, y, dx, dy, speed, owner) {
    this.x = x; this.y = y; this.w = 6; this.h = 6;
    this.dx = dx; this.dy = dy; this.speed = speed;
    this.owner = owner; // 'player' | 'enemy'
    this.dead = false;
  }
  update(dt, grid) {
    const nx = this.x + this.dx * this.speed * dt;
    const ny = this.y + this.dy * this.speed * dt;
    if (rectHitsSolid(grid, nx, ny, this.w, this.h)) { this.dead = true; return; }
    this.x = nx; this.y = ny;
  }
  draw(ctx) {
    ctx.fillStyle = this.owner === 'player' ? '#ffd60a' : '#ef476f';
    ctx.fillRect(this.x, this.y, this.w, this.h);
  }
}
