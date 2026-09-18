// On-screen virtual controls for touch devices: a drag joystick (bottom-left)
// that maps to the arrow-key codes, and a fire button (bottom-right) that
// maps to Space. Both just call Input.simulateKeyDown/Up, so Player/World
// never need to know input came from a finger instead of a keyboard.
// Uses the Pointer Events API (works for touch AND mouse, useful for
// testing this on a desktop browser too) with touch-action: none to stop
// iOS Safari from scrolling/zooming the page while dragging.
const DIR_CODES = { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' };
const DEADZONE_RATIO = 0.3; // fraction of max knob travel before a direction counts as "pressed"

export function isTouchDevice() {
  return window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0;
}

export class TouchControls {
  constructor(input, { onFirstInteraction } = {}) {
    this.input = input;
    this.onFirstInteraction = onFirstInteraction;
    this.activeDirs = new Set();
    this.joystickPointerId = null;
    this.maxRadius = 40;

    this.root = document.getElementById('touch-controls');
    this.base = document.getElementById('joystick-base');
    this.knob = document.getElementById('joystick-knob');
    this.fireBtn = document.getElementById('fire-btn');

    if (!this.root || !this.base || !this.knob || !this.fireBtn) return; // markup missing, no-op

    this._wireJoystick();
    this._wireFireButton();
  }

  _fireFirstInteraction() {
    if (this.onFirstInteraction) { this.onFirstInteraction(); this.onFirstInteraction = null; }
  }

  _wireJoystick() {
    const base = this.base;

    const start = (e) => {
      e.preventDefault();
      this._fireFirstInteraction();
      this.joystickPointerId = e.pointerId;
      base.setPointerCapture(e.pointerId);
      this._updateFromPointer(e);
    };
    const move = (e) => {
      if (e.pointerId !== this.joystickPointerId) return;
      e.preventDefault();
      this._updateFromPointer(e);
    };
    const end = (e) => {
      if (e.pointerId !== this.joystickPointerId) return;
      e.preventDefault();
      this.joystickPointerId = null;
      this.knob.style.transform = 'translate(-50%, -50%)';
      this._applyDirs(new Set());
    };

    base.addEventListener('pointerdown', start);
    base.addEventListener('pointermove', move);
    base.addEventListener('pointerup', end);
    base.addEventListener('pointercancel', end);
  }

  _updateFromPointer(e) {
    const rect = this.base.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    let dx = e.clientX - cx;
    let dy = e.clientY - cy;
    const dist = Math.hypot(dx, dy);
    const clamped = Math.min(dist, this.maxRadius);
    if (dist > 0) { dx = (dx / dist) * clamped; dy = (dy / dist) * clamped; }
    this.knob.style.transform = `translate(${dx - this.knob.offsetWidth / 2}px, ${dy - this.knob.offsetHeight / 2}px)`;

    const dirs = new Set();
    const dead = this.maxRadius * DEADZONE_RATIO;
    if (dx > dead) dirs.add('right');
    if (dx < -dead) dirs.add('left');
    if (dy > dead) dirs.add('down');
    if (dy < -dead) dirs.add('up');
    this._applyDirs(dirs);
  }

  _applyDirs(newDirs) {
    for (const dir of Object.keys(DIR_CODES)) {
      const isActive = newDirs.has(dir);
      const wasActive = this.activeDirs.has(dir);
      if (isActive && !wasActive) this.input.simulateKeyDown(DIR_CODES[dir]);
      if (!isActive && wasActive) this.input.simulateKeyUp(DIR_CODES[dir]);
    }
    this.activeDirs = newDirs;
  }

  _wireFireButton() {
    const btn = this.fireBtn;
    const press = (e) => {
      e.preventDefault();
      this._fireFirstInteraction();
      this.input.simulateKeyDown('Space');
      btn.classList.add('pressed');
    };
    const release = (e) => {
      e.preventDefault();
      this.input.simulateKeyUp('Space');
      btn.classList.remove('pressed');
    };
    btn.addEventListener('pointerdown', press);
    btn.addEventListener('pointerup', release);
    btn.addEventListener('pointercancel', release);
    btn.addEventListener('pointerleave', release);
  }
}
