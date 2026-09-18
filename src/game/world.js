import { TILE, ROOM_COLS, ROOM_ROWS, NUM_LEVELS, SHADOW_TIMEOUT, LIVES_START, DOOR_EDGE } from './constants.js';
import { getLevel } from './levelgen.js';
import { RoomRuntime } from './room.js';
import { Player } from './entities/player.js';
import { Shadow } from './entities/shadow.js';
import { ExitMarker } from './entities/pickups.js';
import { aabbIntersect } from '../engine/collision.js';
import { loadSave, writeSave } from '../engine/save.js';

// Верхнеуровневое игровое состояние: текущий уровень/комната, игрок,
// счёт/жизни/ключи, переходы между комнатами (flip-screen), сохранение.
export class World {
  constructor(audio) {
    this.audio = audio;
    this.roomCache = new Map();
    this.reset();
  }

  reset(fromSave = true) {
    const save = fromSave ? loadSave() : null;
    this.levelIndex = save?.levelIndex ?? 0;
    this.score = save?.score ?? 0;
    this.keysCollected = save?.keysCollected ?? {};
    this.speedMul = 1 + this.levelIndex * 0.15;
    this.player = new Player(0, 0);
    this.player.lives = LIVES_START;
    this.roomCache.clear();
    this.gameOver = false;
    this.levelCompleteTimer = 0;
    this._saveTimer = 0;
    this._enterLevel(this.levelIndex, save?.roomId ?? null);
  }

  _enterLevel(levelIndex, roomId = null) {
    this.level = getLevel(levelIndex);
    const startId = roomId != null ? roomId : this.level.startRoom;
    this._enterRoom(startId, 'center');
  }

  _getRoomRuntime(levelIndex, roomId) {
    const key = `${levelIndex}:${roomId}`;
    if (!this.roomCache.has(key)) {
      const def = this.level.rooms[roomId];
      const rt = new RoomRuntime(def);
      if (def.lockedSide && this.keysCollected[levelIndex]) rt.unlockDoor();
      this.roomCache.set(key, rt);
    }
    return this.roomCache.get(key);
  }

  _enterRoom(roomId, from) {
    this.roomId = roomId;
    this.room = this._getRoomRuntime(this.levelIndex, roomId);
    this.room.reenter();
    if (this.room.key && this.keysCollected[this.levelIndex]) this.room.key.taken = true;

    this.exitMarker = this.room.def.isExit
      ? new ExitMarker(Math.floor(ROOM_COLS / 2) * TILE - 10, Math.floor(ROOM_ROWS / 2) * TILE - 10)
      : null;

    const midC = Math.floor(ROOM_COLS / 2) * TILE, midR = Math.floor(ROOM_ROWS / 2) * TILE;
    const p = this.player;
    if (from === 'N') { p.x = midC - p.w / 2; p.y = TILE * 1.2; }
    else if (from === 'S') { p.x = midC - p.w / 2; p.y = ROOM_ROWS * TILE - TILE * 2.2; }
    else if (from === 'W') { p.x = TILE * 1.2; p.y = midR - p.h / 2; }
    else if (from === 'E') { p.x = ROOM_COLS * TILE - TILE * 2.2; p.y = midR - p.h / 2; }
    else { p.x = midC - p.w / 2; p.y = midR - p.h / 2; }
  }

  _tryTransition() {
    const p = this.player;
    const def = this.room.def;
    if (p.x <= DOOR_EDGE && def.adj.W != null) { this._enterRoom(def.adj.W, 'E'); return true; }
    if (p.x + p.w >= ROOM_COLS * TILE - DOOR_EDGE && def.adj.E != null) { this._enterRoom(def.adj.E, 'W'); return true; }
    if (p.y <= DOOR_EDGE && def.adj.N != null) { this._enterRoom(def.adj.N, 'S'); return true; }
    if (p.y + p.h >= ROOM_ROWS * TILE - DOOR_EDGE && def.adj.S != null) { this._enterRoom(def.adj.S, 'N'); return true; }
    return false;
  }

  update(dt, input) {
    if (this.gameOver) return;
    if (this.levelCompleteTimer > 0) {
      this.levelCompleteTimer -= dt;
      if (this.levelCompleteTimer <= 0) this._advanceLevel();
      return;
    }

    const room = this.room;
    const grid = room.grid;
    const p = this.player;

    const result = p.update(dt, input, grid, this.speedMul);
    if (result === 'shoot') this.audio.shoot();
    if (result === 'electrocuted') this._killPlayer();

    room.timeInRoom += dt;
    if (!room.shadow && room.timeInRoom > SHADOW_TIMEOUT) {
      room.shadow = new Shadow(2 * TILE, 2 * TILE);
      this.audio.shadowAppear();
    }

    for (const e of room.enemies) e.update(dt, grid, p, this.speedMul);
    if (room.shadow) room.shadow.update(dt, grid, p, this.speedMul);

    for (const shot of p.shots) {
      for (const e of room.enemies) {
        if (e.alive && aabbIntersect(shot, e)) { e.alive = false; shot.dead = true; this.score += 100; this.audio.hit(); }
      }
      if (room.shadow && !shot.dead && aabbIntersect(shot, room.shadow)) { room.shadow.hit(); shot.dead = true; this.audio.hit(); }
    }
    room.enemies = room.enemies.filter((e) => e.alive);
    p.shots = p.shots.filter((s) => !s.dead);

    for (const e of room.enemies) if (aabbIntersect(p, e)) this._killPlayer();
    if (room.shadow && room.shadow.stun <= 0 && aabbIntersect(p, room.shadow)) this._killPlayer();

    // Shots fired by a shooting enemy (currently only 'enemy3'): they hurt the
    // player like any other damage source, and a player shot destroys one on
    // contact (shots cancel each other out -- both are marked dead).
    for (const e of room.enemies) {
      for (const eshot of e.shots) {
        if (eshot.dead) continue;
        if (aabbIntersect(eshot, p)) { eshot.dead = true; this._killPlayer(); continue; }
        for (const pshot of p.shots) {
          if (!pshot.dead && aabbIntersect(eshot, pshot)) { eshot.dead = true; pshot.dead = true; this.audio.hit(); break; }
        }
      }
      e.shots = e.shots.filter((s) => !s.dead);
    }
    p.shots = p.shots.filter((s) => !s.dead); // a shot may have just been cancelled above

    if (room.key && !room.key.taken && aabbIntersect(p, room.key)) {
      room.key.taken = true;
      this.keysCollected[this.levelIndex] = true;
      this.score += 250;
      this.audio.key();
      if (this.level.lockedEdge) {
        const { a, b } = this.level.lockedEdge;
        for (const rid of [a, b]) {
          const rt = this.roomCache.get(`${this.levelIndex}:${rid}`);
          if (rt) rt.unlockDoor();
        }
      }
      this.audio.door();
      this._save();
    }

    if (this.exitMarker && aabbIntersect(p, this.exitMarker)) {
      this.levelCompleteTimer = 2;
      this.score += 1000;
      this.audio.levelComplete();
      this._save();
      return;
    }

    if (this._tryTransition()) { this._save(); return; }

    this._saveTimer += dt;
    if (this._saveTimer > 5) { this._saveTimer = 0; this._save(); }
  }

  _killPlayer() {
    const died = this.player.hit();
    if (died) {
      this.audio.death();
      if (this.player.lives <= 0) { this.gameOver = true; this.audio.gameOver(); }
    }
  }

  _advanceLevel() {
    if (this.levelIndex + 1 >= NUM_LEVELS) { this.gameOver = 'win'; this._save(); return; }
    this.levelIndex += 1;
    this.speedMul = 1 + this.levelIndex * 0.15;
    this.roomCache.clear();
    this._enterLevel(this.levelIndex);
    this._save();
  }

  _save() {
    writeSave({ levelIndex: this.levelIndex, roomId: this.roomId, score: this.score, keysCollected: this.keysCollected });
  }
}
