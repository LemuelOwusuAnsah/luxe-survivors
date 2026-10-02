import { CONFIG } from '../config';
import type { Scene } from '../engine/scene';
import type { GameContext } from '../engine/context';

export class HelpScene implements Scene {
  private ctx: GameContext;
  private returnTo: Scene;
  private time: number;
  private exiting: boolean;

  constructor(ctx: GameContext, returnTo: Scene) {
    this.ctx = ctx;
    this.returnTo = returnTo;
    this.time = 0;
    this.exiting = false;
  }

  enter(): void {
    this.time = 0;
    this.exiting = false;
  }

  exit(): void {
    return;
  }

  update(dt: number): void {
    this.time += dt;
    if (this.exiting) return;
    if (this.time < 0.35) return;

    const input = this.ctx.input;
    const codes = [
      'Space',
      'Enter',
      'Escape',
      'KeyH',
      'KeyP',
      'KeyX',
      'KeyY',
      'ArrowUp',
      'ArrowDown',
      'ArrowLeft',
      'ArrowRight',
    ];
    for (const c of codes) {
      if (input.wasPressed(c)) {
        this.exiting = true;
        this.ctx.scenes.switchTo(this.returnTo);
        return;
      }
    }
    if (input.wasClicked()) {
      this.exiting = true;
      this.ctx.scenes.switchTo(this.returnTo);
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    const w = CONFIG.canvas.width;
    const h = CONFIG.canvas.height;

    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#050813');
    g.addColorStop(1, '#15102a');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#6ee7ff';
    ctx.font = '24px PressStart2P, monospace';
    ctx.fillText('CONTROLS', w / 2, 60);

    const colL = w * 0.25;
    const colR = w * 0.75;
    const startY = 130;
    const rowH = 34;

    ctx.fillStyle = '#fce029';
    ctx.font = '12px PressStart2P, monospace';
    ctx.fillText('KEYBOARD', colL, startY - 20);
    ctx.fillText('GAMEPAD', colR, startY - 20);

    const rows: Array<{ left: string; right: string }> = [
      { left: 'WASD / ARROWS  -  MOVE', right: 'LEFT STICK  -  MOVE' },
      { left: 'DPAD  -  MOVE', right: 'DPAD  -  MOVE' },
      { left: 'AUTO  -  ATTACK', right: 'AUTO  -  ATTACK' },
      { left: 'ENTER  -  CONFIRM', right: 'A / CROSS  -  CONFIRM' },
      { left: 'X  -  RESUME', right: 'A / CROSS  -  RESUME' },
      { left: 'Y  -  MAIN MENU', right: 'Y / TRIANGLE  -  MAIN MENU' },
      { left: 'ESC / P  -  PAUSE', right: 'START  -  PAUSE' },
      { left: 'M  -  MUTE', right: 'SELECT  -  MUTE' },
      { left: 'H  -  HELP', right: 'DPAD UP + A  -  HELP' },
      { left: 'R  -  RESTART (DEAD)', right: 'A / CROSS  -  RESTART (DEAD)' },
    ];

    ctx.font = '9px PressStart2P, monospace';
    for (let i = 0; i < rows.length; i++) {
      const y = startY + i * rowH;
      ctx.fillStyle = '#f8fafc';
      ctx.fillText(rows[i].left, colL, y);
      ctx.fillStyle = '#a3e635';
      ctx.fillText(rows[i].right, colR, y);
    }

    if (Math.floor(this.time * 2) % 2 === 0) {
      ctx.fillStyle = 'rgba(248,250,252,0.7)';
      ctx.font = '10px PressStart2P, monospace';
      ctx.fillText('PRESS ANY KEY TO RETURN', w / 2, h - 40);
    }
  }
}
