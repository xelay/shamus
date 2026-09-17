import { LOGICAL_W, LOGICAL_H, DISPLAY_SCALE } from './game/constants.js';
import { GameLoop } from './engine/loop.js';
import { Input } from './engine/input.js';
import { AudioManager } from './engine/audio.js';
import { World } from './game/world.js';
import { renderWorld } from './game/render.js';
import { clearSave } from './engine/save.js';
import { setOverrides } from './game/levelgen.js';

const canvas = document.getElementById('game');
canvas.width = LOGICAL_W * DISPLAY_SCALE;
canvas.height = LOGICAL_H * DISPLAY_SCALE;
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

const input = new Input();
const audio = new AudioManager();

let world = null;
let state = 'LOADING'; // LOADING | MENU | PLAYING | PAUSED | GAMEOVER | WIN
let t = 0;

function startNewGame() { clearSave(); world = new World(audio); state = 'PLAYING'; }
function continueGame() { world = new World(audio); state = 'PLAYING'; }

function update(dt) {
  t += dt;
  if (state === 'LOADING') { /* ждём загрузки overrides */ }
  else if (state === 'MENU') {
    if (input.wasPressed('Enter') || input.wasPressed('Space')) { audio.ensure(); continueGame(); }
    if (input.wasPressed('KeyN')) { audio.ensure(); startNewGame(); }
  } else if (state === 'PLAYING') {
    if (input.wasPressed('KeyP')) { state = 'PAUSED'; }
    else {
      world.update(dt, input);
      if (world.gameOver === true) state = 'GAMEOVER';
      if (world.gameOver === 'win') state = 'WIN';
    }
  } else if (state === 'PAUSED') {
    if (input.wasPressed('KeyP')) state = 'PLAYING';
  } else if (state === 'GAMEOVER' || state === 'WIN') {
    if (input.wasPressed('Enter')) { clearSave(); world = new World(audio); state = 'MENU'; }
  }
  input.endFrame();
}

function overlay(text, sub) {
  ctx.save();
  ctx.scale(DISPLAY_SCALE, DISPLAY_SCALE);
  ctx.fillStyle = 'rgba(0,0,0,0.75)';
  ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);
  ctx.fillStyle = '#e0e1dd';
  ctx.textAlign = 'center';
  ctx.font = 'bold 16px monospace';
  ctx.fillText(text, LOGICAL_W / 2, LOGICAL_H / 2 - 10);
  ctx.font = '10px monospace';
  ctx.fillText(sub, LOGICAL_W / 2, LOGICAL_H / 2 + 14);
  ctx.restore();
}

function render() {
  if (world) {
    ctx.save();
    ctx.scale(DISPLAY_SCALE, DISPLAY_SCALE);
    renderWorld(ctx, world, t);
    ctx.restore();
  } else {
    ctx.fillStyle = '#111318';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  if (state === 'LOADING') overlay('Загрузка...', '');
  else if (state === 'MENU') overlay('SHAMUS-LIKE — личный фан-клон', 'ENTER — продолжить   N — новая игра');
  else if (state === 'PAUSED') overlay('ПАУЗА', 'P — продолжить');
  else if (state === 'GAMEOVER') overlay('ИГРА ОКОНЧЕНА', `счёт ${world.score}  —  ENTER — в меню`);
  else if (state === 'WIN') overlay('ВСЕ УРОВНИ ПРОЙДЕНЫ', `счёт ${world.score}  —  ENTER — в меню`);
  else if (world.levelCompleteTimer > 0) overlay(`УРОВЕНЬ ${world.levelIndex + 1} ПРОЙДЕН`, 'приготовьтесь...');
}

const loop = new GameLoop(update, render, 60);

async function boot() {
  try {
    const res = await fetch('src/data/room-overrides.json', { cache: 'no-store' });
    if (res.ok) setOverrides(await res.json());
  } catch { /* overrides необязательны */ }
  state = 'MENU';
  loop.start();
}

boot();
