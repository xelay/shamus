import { sprite } from '../sprites.js';

export class Key {
  constructor(x, y) { this.x = x; this.y = y; this.w = 14; this.h = 14; this.taken = false; }
  draw(ctx) { if (!this.taken) ctx.drawImage(sprite('key'), this.x, this.y, this.w, this.h); }
}

export class ExitMarker {
  constructor(x, y) { this.x = x; this.y = y; this.w = 20; this.h = 20; }
  draw(ctx) { ctx.drawImage(sprite('exit'), this.x, this.y, this.w, this.h); }
}
