// Простой трекер клавиатуры: isDown — удержание, wasPressed — однократное
// нажатие (edge-triggered), сбрасывается вызовом endFrame() каждый тик.
const PREVENT_DEFAULT = new Set([
  'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space',
]);

export class Input {
  constructor() {
    this.keys = new Set();
    this.pressed = new Set();
    window.addEventListener('keydown', (e) => {
      if (!this.keys.has(e.code)) this.pressed.add(e.code);
      this.keys.add(e.code);
      if (PREVENT_DEFAULT.has(e.code)) e.preventDefault();
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));
    window.addEventListener('blur', () => this.keys.clear());
  }
  isDown(code) { return this.keys.has(code); }
  wasPressed(code) { return this.pressed.has(code); }
  endFrame() { this.pressed.clear(); }
}
