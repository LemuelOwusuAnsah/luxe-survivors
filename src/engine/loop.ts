export type UpdateFn = (dt: number) => void;
export type RenderFn = (alpha: number) => void;

export class GameLoop {
  private update: UpdateFn;
  private render: RenderFn;
  private rafId: number;
  private lastTime: number;
  private accumulator: number;
  private fixedStep: number;
  private running: boolean;

  constructor(update: UpdateFn, render: RenderFn) {
    this.update = update;
    this.render = render;
    this.rafId = 0;
    this.lastTime = 0;
    this.accumulator = 0;
    this.fixedStep = 1 / 60;
    this.running = false;
    this.tick = this.tick.bind(this);
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.rafId = requestAnimationFrame(this.tick);
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.rafId);
  }

  private tick(now: number): void {
    if (!this.running) return;
    let frameTime = (now - this.lastTime) / 1000;
    this.lastTime = now;
    if (frameTime > 0.25) frameTime = 0.25;
    this.accumulator += frameTime;

    while (this.accumulator >= this.fixedStep) {
      this.update(this.fixedStep);
      this.accumulator -= this.fixedStep;
    }

    const alpha = this.accumulator / this.fixedStep;
    this.render(alpha);
    this.rafId = requestAnimationFrame(this.tick);
  }
}
