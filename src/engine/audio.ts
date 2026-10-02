export class Audio {
  ctx: AudioContext | null;
  master: GainNode | null;
  sfxGain: GainNode | null;
  musicGain: GainNode | null;
  muted: boolean;
  unlocked: boolean;

  constructor() {
    this.ctx = null;
    this.master = null;
    this.sfxGain = null;
    this.musicGain = null;
    this.muted = false;
    this.unlocked = false;
  }

  init(): void {
    if (this.ctx) return;
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
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

  playTone(
    freq: number,
    duration: number,
    type: OscillatorType,
    gain: number,
    slideTo?: number
  ): void {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
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
    osc.stop(now + duration);
  }

  hit(): void {
    this.playTone(220 + Math.random() * 60, 0.06, 'square', 0.18, 120);
  }

  hurt(): void {
    this.playTone(140, 0.22, 'sawtooth', 0.35, 60);
  }

  pickup(): void {
    this.playTone(880, 0.08, 'triangle', 0.15, 1320);
  }

  levelUp(): void {
    if (!this.ctx || !this.sfxGain) return;
    const notes = [523.25, 659.25, 783.99, 1046.5];
    const now = this.ctx.currentTime;
    notes.forEach((f, i) => {
      const osc = this.ctx!.createOscillator();
      const g = this.ctx!.createGain();
      osc.type = 'triangle';
      osc.frequency.value = f;
      const t = now + i * 0.08;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.25, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
      osc.connect(g);
      g.connect(this.sfxGain!);
      osc.start(t);
      osc.stop(t + 0.2);
    });
  }

  death(): void {
    this.playTone(180, 0.9, 'sawtooth', 0.4, 40);
  }
}
