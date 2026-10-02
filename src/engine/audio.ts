export class Audio {
  ctx: AudioContext | null;
  master: GainNode | null;
  sfxGain: GainNode | null;
  musicGain: GainNode | null;
  muted: boolean;
  unlocked: boolean;
  noiseBuffer: AudioBuffer | null;

  constructor() {
    this.ctx = null;
    this.master = null;
    this.sfxGain = null;
    this.musicGain = null;
    this.muted = false;
    this.unlocked = false;
    this.noiseBuffer = null;
  }

  init(): void {
    if (this.ctx) return;
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new Ctor();
    this.master = this.ctx.createGain();
    this.sfxGain = this.ctx.createGain();
    this.musicGain = this.ctx.createGain();
    this.master.gain.value = 1;
    this.sfxGain.gain.value = 0.7;
    this.musicGain.gain.value = 0.35;
    this.sfxGain.connect(this.master);
    this.musicGain.connect(this.master);
    this.master.connect(this.ctx.destination);
    this.buildNoise();
  }

  private buildNoise(): void {
    if (!this.ctx) return;
    const len = Math.floor(this.ctx.sampleRate * 0.5);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    this.noiseBuffer = buf;
  }

  unlock(): void {
    this.init();
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    this.unlocked = true;
  }

  toggleMute(): boolean {
    this.muted = !this.muted;
    if (this.master) {
      this.master.gain.value = this.muted ? 0 : 1;
    }
    return this.muted;
  }

  private tone(
    freq: number,
    duration: number,
    type: OscillatorType,
    gain: number,
    slideTo?: number,
    delay = 0
  ): void {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (slideTo !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(1, slideTo), now + duration);
    }
    g.gain.setValueAtTime(gain, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(g);
    g.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  private noise(duration: number, gain: number, filterHz: number, delay = 0): void {
    if (!this.ctx || !this.sfxGain || !this.noiseBuffer) return;
    const now = this.ctx.currentTime + delay;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = filterHz;
    filter.Q.value = 1.2;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(gain, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    src.connect(filter);
    filter.connect(g);
    g.connect(this.sfxGain);
    src.start(now);
    src.stop(now + duration + 0.02);
  }

  hit(): void {
    const base = 180 + Math.random() * 60;
    this.tone(base, 0.05, 'square', 0.15, 90);
    this.noise(0.06, 0.22, 1400 + Math.random() * 400);
  }

  hurt(): void {
    this.tone(120, 0.3, 'sawtooth', 0.35, 45);
    this.tone(80, 0.35, 'square', 0.2, 40, 0.02);
    this.noise(0.2, 0.3, 300);
  }

  pickup(): void {
    this.tone(660, 0.05, 'triangle', 0.12, 990);
    this.tone(990, 0.09, 'triangle', 0.1, 1320, 0.04);
  }

  select(): void {
    this.tone(720, 0.05, 'square', 0.12, 900);
  }

  coin(): void {
    this.tone(1180, 0.04, 'square', 0.1, 1180);
    this.tone(1560, 0.1, 'square', 0.08, 1560, 0.04);
  }

  levelUp(): void {
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5];
    notes.forEach((f, i) => {
      this.tone(f, 0.2, 'triangle', 0.22, f * 1.005, i * 0.075);
      this.tone(f * 2, 0.14, 'sine', 0.08, f * 2, i * 0.075);
    });
  }

  death(): void {
    this.tone(220, 0.9, 'sawtooth', 0.4, 30);
    this.tone(110, 1.1, 'square', 0.25, 20, 0.05);
    this.noise(0.7, 0.25, 180);
  }

  bossEntrance(): void {
    this.tone(55, 1.2, 'sawtooth', 0.45, 30);
    this.tone(82, 1.0, 'square', 0.3, 40, 0.05);
    this.noise(0.9, 0.35, 120);
  }
}
