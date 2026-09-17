// Звук через Web Audio API — простые синтезированные эффекты в духе чиптюна,
// без внешних аудиофайлов (никаких сэмплов из оригинальной игры).
export class AudioManager {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }
  ensure() {
    if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }
  tone(freq, dur, type = 'square', vol = 0.15, glideTo = null) {
    if (this.muted) return;
    this.ensure();
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    if (glideTo) osc.frequency.exponentialRampToValueAtTime(glideTo, ctx.currentTime + dur);
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + dur);
  }
  noise(dur, vol = 0.2) {
    if (this.muted) return;
    this.ensure();
    const ctx = this.ctx;
    const bufferSize = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    src.connect(gain);
    gain.connect(ctx.destination);
    src.start();
  }
  shoot() { this.tone(700, 0.08, 'square', 0.1, 300); }
  hit() { this.noise(0.15, 0.2); }
  death() { this.tone(220, 0.5, 'sawtooth', 0.2, 40); }
  key() { this.tone(500, 0.12, 'square', 0.15, 900); }
  door() { this.tone(300, 0.2, 'triangle', 0.15, 500); }
  shadowAppear() { this.tone(80, 0.6, 'sawtooth', 0.2, 60); }
  levelComplete() {
    [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => this.tone(f, 0.2, 'square', 0.15), i * 120));
  }
  gameOver() { this.tone(200, 1.0, 'sawtooth', 0.2, 50); }
}
