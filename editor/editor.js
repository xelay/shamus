import { getLevel } from '../src/game/levelgen.js';
import {
  TILE, ROOM_COLS, ROOM_ROWS, LEVEL_COLS, NUM_LEVELS, ROOMS_PER_LEVEL,
  TILE_EMPTY, TILE_WALL, TILE_ELECTRIC, TILE_LOCKED_DOOR,
} from '../src/game/constants.js';

const canvas = document.getElementById('canvas');
canvas.width = ROOM_COLS * TILE;
canvas.height = ROOM_ROWS * TILE;
const ctx = canvas.getContext('2d');

const levelSel = document.getElementById('level');
const roomSel = document.getElementById('room');
const toolSel = document.getElementById('tool');
const hasKeyBox = document.getElementById('hasKey');
const isExitBox = document.getElementById('isExit');
const output = document.getElementById('output');
const statusEl = document.getElementById('status');

// Editor overrides: key `${level}:${roomId}` -> partial room description.
// Source of truth on startup — two persistence layers:
//  1) src/data/room-overrides.json — what's actually committed and picked up by the game;
//  2) this browser's localStorage draft — a safety net against an accidental page
//     refresh BEFORE you clicked "Export". The draft updates on every change and
//     survives a reload, but it's NOT the same as saving into the game — that
//     still needs an export + replacing the file.
const DRAFT_KEY = 'shamus_editor_draft_v1';

let overrides = {};
let currentLevel = 0, currentRoomId = 0;
let grid = [], enemies = [];

for (let i = 0; i < NUM_LEVELS; i++) {
  const opt = document.createElement('option');
  opt.value = i; opt.textContent = `Level ${i + 1}`;
  levelSel.appendChild(opt);
}
for (let i = 0; i < ROOMS_PER_LEVEL; i++) {
  const opt = document.createElement('option');
  opt.value = i; opt.textContent = `Room ${i} (${i % LEVEL_COLS}, ${Math.floor(i / LEVEL_COLS)})`;
  roomSel.appendChild(opt);
}

function setStatus(msg) { if (statusEl) statusEl.textContent = msg; }

function persistDraft() {
  try { localStorage.setItem(DRAFT_KEY, JSON.stringify(overrides)); } catch { /* storage unavailable — not critical */ }
}

function saveCurrentToOverrides() {
  const key = `${currentLevel}:${currentRoomId}`;
  overrides[key] = {
    grid: grid.map((r) => r.slice()),
    enemies: enemies.map((e) => ({ ...e })),
    hasKey: hasKeyBox.checked,
    isExit: isExitBox.checked,
  };
}

// Call after EVERY change — commits the edit and immediately writes the draft to localStorage.
function commit() {
  saveCurrentToOverrides();
  persistDraft();
}

function loadRoom() {
  currentLevel = Number(levelSel.value);
  currentRoomId = Number(roomSel.value);
  const def = getLevel(currentLevel).rooms[currentRoomId];
  const ov = overrides[`${currentLevel}:${currentRoomId}`];
  grid = (ov?.grid ?? def.grid).map((r) => r.slice());
  enemies = (ov?.enemies ?? def.enemies).map((e) => ({ ...e }));
  hasKeyBox.checked = ov?.hasKey ?? def.hasKey;
  isExitBox.checked = ov?.isExit ?? def.isExit;
  draw();
}

function draw() {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  for (let r = 0; r < ROOM_ROWS; r++) {
    for (let c = 0; c < ROOM_COLS; c++) {
      const t = grid[r][c];
      if (t === TILE_WALL) ctx.fillStyle = '#3a5a40';
      else if (t === TILE_ELECTRIC) ctx.fillStyle = '#ef476f';
      else if (t === TILE_LOCKED_DOOR) ctx.fillStyle = '#8d99ae';
      else ctx.fillStyle = '#1a1c22';
      ctx.fillRect(c * TILE, r * TILE, TILE - 1, TILE - 1);
    }
  }
  for (const e of enemies) {
    ctx.fillStyle = e.type === 'enemy1' ? '#d62828' : '#f77f00';
    ctx.fillRect(e.col * TILE + 4, e.row * TILE + 4, TILE - 8, TILE - 8);
  }
}

canvas.addEventListener('click', (ev) => {
  const rect = canvas.getBoundingClientRect();
  const x = (ev.clientX - rect.left) * (canvas.width / rect.width);
  const y = (ev.clientY - rect.top) * (canvas.height / rect.height);
  const c = Math.floor(x / TILE), r = Math.floor(y / TILE);
  if (r < 0 || c < 0 || r >= ROOM_ROWS || c >= ROOM_COLS) return;

  const tool = toolSel.value;
  if (tool === 'cycle') {
    const order = [TILE_EMPTY, TILE_WALL, TILE_ELECTRIC];
    const cur = grid[r][c];
    const curPos = order.indexOf(cur);
    grid[r][c] = curPos === -1 ? TILE_EMPTY : order[(curPos + 1) % order.length];
  } else if (tool === 'enemy1' || tool === 'enemy2') {
    const i = enemies.findIndex((e) => e.col === c && e.row === r);
    if (i >= 0) enemies.splice(i, 1);
    else enemies.push({ col: c, row: r, type: tool });
  }
  draw();
  commit(); // every click is committed immediately and written to the localStorage draft
});

[levelSel, roomSel].forEach((el) => el.addEventListener('change', () => { commit(); loadRoom(); }));
hasKeyBox.addEventListener('change', commit);
isExitBox.addEventListener('change', commit);

document.getElementById('resetBtn').addEventListener('click', () => {
  delete overrides[`${currentLevel}:${currentRoomId}`];
  persistDraft();
  loadRoom();
});

document.getElementById('exportBtn').addEventListener('click', () => {
  commit();
  const json = JSON.stringify(overrides, null, 2);
  output.value = json;
  const blob = new Blob([json], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'room-overrides.json';
  a.click();
  setStatus(`Exported ${Object.keys(overrides).length} room(s). Don't forget to replace src/data/room-overrides.json and restart the game.`);
});

document.getElementById('loadBtn').addEventListener('click', () => document.getElementById('fileInput').click());
document.getElementById('fileInput').addEventListener('change', async (ev) => {
  const file = ev.target.files[0];
  if (!file) return;
  try {
    const text = await file.text();
    overrides = JSON.parse(text);
    persistDraft();
    output.value = text;
    loadRoom();
    setStatus(`Loaded from file: ${Object.keys(overrides).length} room(s).`);
  } catch {
    alert('Invalid JSON');
  }
});

document.getElementById('clearDraftBtn').addEventListener('click', () => {
  try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
  init();
});

// Startup load: first what's actually committed in src/data/room-overrides.json,
// then layered with this browser's localStorage draft (it takes priority, being
// more recent unsaved edits). If neither exists, start from a clean procedural
// generation.
async function init() {
  overrides = {};
  let committedCount = 0, draftCount = 0;

  try {
    const res = await fetch('../src/data/room-overrides.json', { cache: 'no-store' });
    if (res.ok) {
      const committed = await res.json();
      Object.assign(overrides, committed);
      committedCount = Object.keys(committed).length;
    }
  } catch { /* file doesn't exist yet, or the editor isn't served over http — not critical */ }

  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (raw) {
      const draft = JSON.parse(raw);
      Object.assign(overrides, draft);
      draftCount = Object.keys(draft).length;
    }
  } catch { /* corrupted draft — ignore */ }

  const parts = [];
  if (committedCount) parts.push(`${committedCount} room(s) from room-overrides.json`);
  if (draftCount) parts.push(`${draftCount} room(s) from the browser draft`);
  setStatus(parts.length ? `Loaded: ${parts.join(', ')}.` : 'No edits yet — editing the clean procedural generation.');

  loadRoom();
}

init();
