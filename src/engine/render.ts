import { CONFIG } from '../config';

export interface Camera {
  x: number;
  y: number;
}

export class Renderer {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  camera: Camera;
  dpr: number;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) throw new Error('2d context unavailable');
    this.ctx = ctx;
    this.camera = { x: 0, y: 0 };
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize(): void {
    const w = CONFIG.canvas.width;
    const h = CONFIG.canvas.height;
    this.canvas.width = w * this.dpr;
    this.canvas.height = h * this.dpr;
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.canvas.style.display = 'block';
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

  drawGrid(): void {
    const { tileSize, gridWidth, gridHeight } = CONFIG.world;
    const { width, height } = CONFIG.canvas;
    const startX = Math.max(0, Math.floor((this.camera.x - width / 2) / tileSize));
    const endX = Math.min(gridWidth, Math.ceil((this.camera.x + width / 2) / tileSize));
    const startY = Math.max(0, Math.floor((this.camera.y - height / 2) / tileSize));
    const endY = Math.min(gridHeight, Math.ceil((this.camera.y + height / 2) / tileSize));

    this.ctx.strokeStyle = CONFIG.colors.grid;
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    for (let x = startX; x <= endX; x++) {
      const px = x * tileSize;
      this.ctx.moveTo(px, startY * tileSize);
      this.ctx.lineTo(px, endY * tileSize);
    }
    for (let y = startY; y <= endY; y++) {
      const py = y * tileSize;
      this.ctx.moveTo(startX * tileSize, py);
      this.ctx.lineTo(endX * tileSize, py);
    }
    this.ctx.stroke();
  }
}
