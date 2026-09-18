// Программная пиксель-графика: спрайты рисуются кодом (без внешних PNG),
// один раз кешируются в offscreen-канвасы и масштабируются при отрисовке.
const CELL = 3; // внутреннее разрешение "пикселя" паттерна

const PATTERNS = {
  player: [
    '..1111..',
    '.111111.',
    '11022011',
    '11022011',
    '11111111',
    '.111111.',
    '..1..1..',
    '.11..11.',
  ],
  enemy1: [
    '.111111.',
    '11333311',
    '13033031',
    '13333331',
    '11333311',
    '.111111.',
    '..1..1..',
    '.1....1.',
  ],
  enemy2: [
    '..1111..',
    '.144441.',
    '14044041',
    '14444441',
    '.144441.',
    '..1441..',
    '.1.11.1.',
    '1.1..1.1',
  ],
  // enemy3: slow, heavily-armored "turret" build -- flat plated top/bottom
  // rows instead of the rounded/diamond silhouette of enemy1/enemy2, so it
  // reads as visually distinct at a glance.
  enemy3: [
    '11111111',
    '13333331',
    '13033031',
    '13333331',
    '13333331',
    '11111111',
    '.1.11.1.',
    '.1.11.1.',
  ],
  shadow: [
    '..5555..',
    '.555555.',
    '55555555',
    '55555555',
    '55555555',
    '.555555.',
    '.55..55.',
    '.5....5.',
  ],
  key: [
    '..66....',
    '.6666...',
    '.6006...',
    '.6666...',
    '..66....',
    '..66....',
    '..6666..',
    '..6.6...',
  ],
  exit: [
    '77777777',
    '70000007',
    '70777707',
    '70700707',
    '70700707',
    '70777707',
    '70000007',
    '77777777',
  ],
};

const PALETTES = {
  // Body ('1') was near-black (#0d1b2a) and disappeared against the black
  // room background -- only the eye/visor pixels ('0'/'2', ~3 cells out of
  // ~30) were visible. Swapped to a bright, saturated blue for the body so
  // the whole silhouette reads clearly, with the old near-black promoted to
  // an accent color for the visor stripe so the "face" detail still pops
  // against the now-bright body.
  player: { '1': '#4cc9f0', '0': '#f8f9fa', '2': '#0d1b2a' },
  // enemy1/enemy2 outlines ('1') were near-black (#1a0000 / #1a0f00) and
  // disappeared against the black room background -- same issue the player
  // sprite had, just less total screen area since each still has a large
  // bright body ('3'/'4'). Brightened both outlines to a dark shade of their
  // own hue (still reads as shading/contour, not the main body color) so the
  // full silhouette -- including the legs, which are outline-only pixels --
  // stays visible. enemy2's eye pixels ('0') were also brightened slightly;
  // they're nested inside the body and never touch the background directly,
  // so this is a smaller legibility polish rather than a visibility fix.
  enemy1: { '1': '#8f2a2a', '3': '#d62828', '0': '#ffd166' },
  enemy2: { '1': '#7a4218', '4': '#f77f00', '0': '#2e0f42' },
  // Steel grey so it reads as a distinct "heavy turret" archetype next to
  // the red/orange/purple already used by enemy1/enemy2/Shadow; the small
  // red lens pixels hint that it's the one that aims and shoots.
  enemy3: { '1': '#495057', '3': '#adb5bd', '0': '#e63946' },
  shadow: { '5': '#7b2cbf' },
  key: { '6': '#ffd60a', '0': '#1a1a1a' },
  exit: { '7': '#06d6a0', '0': '#073b3a' },
};

const CACHE = new Map();

function render(pattern, colorMap) {
  const rows = pattern.length;
  const cols = pattern[0].length;
  const cnv = document.createElement('canvas');
  cnv.width = cols * CELL;
  cnv.height = rows * CELL;
  const ctx = cnv.getContext('2d');
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const ch = pattern[r][c];
      if (ch === '.') continue;
      ctx.fillStyle = colorMap[ch] || '#fff';
      ctx.fillRect(c * CELL, r * CELL, CELL, CELL);
    }
  }
  return cnv;
}

export function sprite(name) {
  if (!CACHE.has(name)) CACHE.set(name, render(PATTERNS[name], PALETTES[name]));
  return CACHE.get(name);
}
