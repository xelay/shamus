// Игровой цикл с фиксированным таймстепом (60 Гц логики), не зависящим от
// частоты обновления экрана — иначе на мониторах с разным Hz игра шла бы
// с разной скоростью.
export class GameLoop {
  constructor(update, render, hz = 60) {
    this.update = update;
    this.render = render;
    this.step = 1 / hz;
    this.acc = 0;
    this.last = 0;
    this.running = false;
    this._frame = this._frame.bind(this);
  }
  start() {
    this.running = true;
    this.last = performance.now();
    requestAnimationFrame(this._frame);
  }
  stop() { this.running = false; }
  _frame(now) {
    if (!this.running) return;
    let dt = (now - this.last) / 1000;
    this.last = now;
    if (dt > 0.25) dt = 0.25; // защита от "спирали смерти" при переключении вкладок
    this.acc += dt;
    while (this.acc >= this.step) {
      this.update(this.step);
      this.acc -= this.step;
    }
    this.render(this.acc / this.step);
    requestAnimationFrame(this._frame);
  }
}
