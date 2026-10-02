import { CONFIG } from '../config';
import type { Sprite } from './sprites';

export interface Camera {
  x: number;
  y: number;
}

export class Renderer {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  camera: Camera;
  dpr: number;
  private ground: Sprite | null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) throw new Error('2d context unavailable');
    this.ctx = ctx;
    this.camera = { x: 0, y: 0 };
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.ground = null;
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  setGround(sprite: Sprite): void {
    this.ground = sprite;
  }

  resize(): void {
    const w = CONFIG.canvas.width;
    const h = CONFIG.canvas.height;
    this.canvas.width = w * this.dpr;
    this.canvas.height = h * this.dpr;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.ctx.imageSmoothingEnabled = false;
  }

  clear(): void {
    const { width, height } = CONFIG.canvas;
    this.ctx.fillStyle = CONFIG.colors.bg;
    this.ctx.fillRect(0, 0, width, height);
  }

  beginWorld(): void {
    this.ctx.save();
    this.ctx.translate(
      CONFIG.canvas.width / 2 - this.camera.x,
      CONFIG.canvas.height / 2 - this.camera.y
    );
  }

  endWorld(): void {
    this.ctx.restore();
  }

  drawGround(): void {
    const { width, height } = CONFIG.canvas;
    const tile = CONFIG.world.tileSize;
    if (!this.ground || !this.ground.loaded) {
      this.ctx.fillStyle = CONFIG.colors.bg;
      this.ctx.fillRect(0, 0, width, height);
      return;
    }
    const img = this.ground.image;
    const offsetX = -((this.camera.x % tile) + tile) % tile;
    const offsetY = -((this.camera.y % tile) + tile) % tile;
    for (let y = offsetY; y < height; y += tile) {
      for (let x = offsetX; x < width; x += tile) {
        this.ctx.drawImage(img, Math.floor(x), Math.floor(y), tile, tile);
      }
    }
  }
}
