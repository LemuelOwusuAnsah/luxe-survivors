export class Sprite {
  image: HTMLImageElement;
  loaded: boolean;
  private flashCanvas: HTMLCanvasElement | null;
  private flashReady: boolean;

  constructor(src: string) {
    this.image = new Image();
    this.loaded = false;
    this.flashCanvas = null;
    this.flashReady = false;
    this.image.onload = () => {
      this.loaded = true;
      this.buildFlash();
    };
    this.image.src = src;
  }

  private buildFlash(): void {
    const c = document.createElement('canvas');
    c.width = this.image.width;
    c.height = this.image.height;
    const cx = c.getContext('2d');
    if (!cx) return;
    cx.drawImage(this.image, 0, 0);
    cx.globalCompositeOperation = 'source-atop';
    cx.fillStyle = 'rgba(255,255,255,0.9)';
    cx.fillRect(0, 0, c.width, c.height);
    this.flashCanvas = c;
    this.flashReady = true;
  }

  draw(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    flash: boolean
  ): void {
    if (!this.loaded) return;
    const half = size / 2;
    const src = flash && this.flashReady && this.flashCanvas ? this.flashCanvas : this.image;
    ctx.drawImage(src, x - half, y - half, size, size);
  }
}

export class SpriteSheet {
  map: Map<string, Sprite>;

  constructor() {
    this.map = new Map();
  }

  load(key: string, src: string): void {
    this.map.set(key, new Sprite(src));
  }

  get(key: string): Sprite | null {
    return this.map.get(key) ?? null;
  }

  allLoaded(): boolean {
    for (const s of this.map.values()) {
      if (!s.loaded) return false;
    }
    return true;
  }
}
