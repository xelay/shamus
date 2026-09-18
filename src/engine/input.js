// Simple keyboard/virtual-input tracker: isDown = held, wasPressed = single
// edge-triggered press, cleared by endFrame() each fixed tick.
// simulateKeyDown/simulateKeyUp let other input sources (touch controls) feed
// into the exact same state machine as real keyboard events, so downstream
// game code never needs to know whether a "key" came from a keyboard or a
// finger on glass.
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

  simulateKeyDown(code) {
    if (!this.keys.has(code)) this.pressed.add(code);
    this.keys.add(code);
  }
  simulateKeyUp(code) {
    this.keys.delete(code);
  }
}
