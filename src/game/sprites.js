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
  player: { '1': '#0d1b2a', '0': '#e0e1dd', '2': '#3a86ff' },
  enemy1: { '1': '#1a0000', '3': '#d62828', '0': '#ffd166' },
  enemy2: { '1': '#1a0f00', '4': '#f77f00', '0': '#03071e' },
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
