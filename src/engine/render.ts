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
  shakeTimer: number;
  shakeMagnitude: number;
  private ground: Sprite | null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) throw new Error('2d context unavailable');
    this.ctx = ctx;
    this.camera = { x: 0, y: 0 };
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.shakeTimer = 0;
    this.shakeMagnitude = 0;
    this.ground = null;
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  setGround(sprite: Sprite): void {
    this.ground = sprite;
  }

  shake(magnitude: number, duration: number): void {
    if (magnitude > this.shakeMagnitude) {
      this.shakeMagnitude = magnitude;
      this.shakeTimer = duration;
    }
  }

  updateShake(dt: number): void {
    if (this.shakeTimer <= 0) return;
    this.shakeTimer -= dt;
    const decay = CONFIG.shake.decay;
    this.shakeMagnitude *= Math.pow(1 / (1 + decay * dt), 1);
    if (this.shakeTimer <= 0) {
      this.shakeTimer = 0;
      this.shakeMagnitude = 0;
    }
  }

  private shakeOffset(): { x: number; y: number } {
    if (this.shakeMagnitude <= 0.05) return { x: 0, y: 0 };
    return {
      x: (Math.random() * 2 - 1) * this.shakeMagnitude,
      y: (Math.random() * 2 - 1) * this.shakeMagnitude,
    };
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
    const s = this.shakeOffset();
    this.ctx.save();
    this.ctx.translate(
      CONFIG.canvas.width / 2 - this.camera.x + s.x,
      CONFIG.canvas.height / 2 - this.camera.y + s.y
    );
  }

  endWorld(): void {
    this.ctx.restore();
  }

  drawGround(): void {
    const { width, height } = CONFIG.canvas;
    const tile = CONFIG.world.tileSize;
    const s = this.shakeOffset();
    if (!this.ground || !this.ground.loaded) {
      this.ctx.fillStyle = CONFIG.colors.bg;
      this.ctx.fillRect(0, 0, width, height);
      return;
    }
    const img = this.ground.image;
    const offsetX = -((this.camera.x - s.x) % tile + tile) % tile;
    const offsetY = -((this.camera.y - s.y) % tile + tile) % tile;
    for (let y = offsetY; y < height; y += tile) {
      for (let x = offsetX; x < width; x += tile) {
        this.ctx.drawImage(img, Math.floor(x), Math.floor(y), tile, tile);
      }
    }
  }
}
