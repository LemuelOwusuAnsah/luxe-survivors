import { CONFIG } from '../config';
import type { Scene } from '../engine/scene';

export class MobileBlockScene implements Scene {
  private time: number;

  constructor() {
    this.time = 0;
  }

  enter(): void {
    this.time = 0;
  }

  exit(): void {
    return;
  }

  update(dt: number): void {
    this.time += dt;
  }

  render(ctx: CanvasRenderingContext2D): void {
    const w = CONFIG.canvas.width;
    const h = CONFIG.canvas.height;

    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#050813');
    g.addColorStop(1, '#1b1030');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.fillStyle = '#6ee7ff';
    ctx.font = '20px PressStart2P, monospace';
    ctx.fillText('LAST', w / 2, h / 2 - 80);
    ctx.fillStyle = '#f8fafc';
    ctx.fillText('SURVIVORS', w / 2, h / 2 - 50);

    ctx.fillStyle = '#fce029';
    ctx.font = '12px PressStart2P, monospace';
    ctx.fillText('DESKTOP ONLY', w / 2, h / 2 + 10);

    ctx.fillStyle = 'rgba(248,250,252,0.7)';
    ctx.font = '10px PressStart2P, monospace';
    ctx.fillText('THIS GAME NEEDS A KEYBOARD', w / 2, h / 2 + 60);
    ctx.fillText('OR GAMEPAD TO PLAY', w / 2, h / 2 + 85);

    ctx.fillStyle = 'rgba(248,250,252,0.45)';
    ctx.font = '9px PressStart2P, monospace';
    ctx.fillText('MOBILE VERSION COMING SOON', w / 2, h / 2 + 140);

    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
  }
}
