import { LOGICAL_W, LOGICAL_H, DISPLAY_SCALE } from './game/constants.js';
import { GameLoop } from './engine/loop.js';
import { Input } from './engine/input.js';
import { AudioManager } from './engine/audio.js';
import { TouchControls, isTouchDevice } from './engine/touchControls.js';
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

// iOS Safari only unlocks Web Audio when AudioContext creation/resume happens
// synchronously inside a real user-gesture event (tap/keypress) -- not from a
// later requestAnimationFrame callback, even if it runs moments afterwards.
// So this is wired directly to the raw event, independent of game state.
function unlockAudioOnce() {
  audio.ensure();
  window.removeEventListener('pointerdown', unlockAudioOnce);
  window.removeEventListener('keydown', unlockAudioOnce);
}
window.addEventListener('pointerdown', unlockAudioOnce, { once: true });
window.addEventListener('keydown', unlockAudioOnce, { once: true });

if (isTouchDevice()) document.body.classList.add('touch-device');
const touchControls = new TouchControls(input, { onFirstInteraction: () => audio.ensure() });
void touchControls; // wired via DOM event listeners, no further use needed here

let world = null;
let state = 'LOADING'; // LOADING | MENU | PLAYING | PAUSED | GAMEOVER | WIN
let t = 0;

function startNewGame() { clearSave(); world = new World(audio); state = 'PLAYING'; }
function continueGame() { world = new World(audio); state = 'PLAYING'; }

function update(dt) {
  t += dt;
  if (state === 'LOADING') { /* waiting for room-overrides.json to load */ }
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

  if (state === 'LOADING') overlay('Loading...', '');
  else if (state === 'MENU') overlay('SHAMUS-LIKE — personal fan clone', 'ENTER — continue   N — new game');
  else if (state === 'PAUSED') overlay('PAUSED', 'P — resume');
  else if (state === 'GAMEOVER') overlay('GAME OVER', `score ${world.score}  —  ENTER — menu`);
  else if (state === 'WIN') overlay('ALL LEVELS CLEARED', `score ${world.score}  —  ENTER — menu`);
  else if (world.levelCompleteTimer > 0) overlay(`LEVEL ${world.levelIndex + 1} COMPLETE`, 'get ready...');
}

const loop = new GameLoop(update, render, 60);

async function boot() {
  try {
    const res = await fetch('src/data/room-overrides.json', { cache: 'no-store' });
    if (res.ok) setOverrides(await res.json());
  } catch { /* overrides are optional */ }
  state = 'MENU';
  loop.start();
}

boot();

// Service worker: makes the game installable and playable offline once
// visited once. Registered last and guarded so it never blocks booting the
// game itself if registration fails (unsupported browser, no https, etc.).
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => { /* offline support just won't be available */ });
  });
}
