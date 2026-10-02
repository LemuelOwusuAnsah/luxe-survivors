export interface Scene {
  enter(): void;
  exit(): void;
  update(dt: number): void;
  render(ctx: CanvasRenderingContext2D): void;
}

export class SceneManager {
  private current: Scene | null;
  private next: Scene | null;

  constructor() {
    this.current = null;
    this.next = null;
  }

  switchTo(scene: Scene): void {
    this.next = scene;
  }

  update(dt: number): void {
    if (this.next) {
      if (this.current) this.current.exit();
      this.current = this.next;
      this.next = null;
      this.current.enter();
    }
    if (this.current) this.current.update(dt);
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (this.current) this.current.render(ctx);
  }

  get active(): Scene | null {
    return this.current;
  }
}
