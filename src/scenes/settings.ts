import { CONFIG } from '../config';
import type { Scene } from '../engine/scene';
import type { GameContext } from '../engine/context';
import { Hints } from '../ui/hints';

interface SettingRow {
  id: string;
  label: string;
  getValue: () => string;
}

export class SettingsScene implements Scene {
  private ctx: GameContext;
  private returnTo: Scene;
  private rows: SettingRow[];
  private index: number;
  private time: number;
  private hints: Hints;

  constructor(ctx: GameContext, returnTo: Scene) {
    this.ctx = ctx;
    this.returnTo = returnTo;
    this.index = 0;
    this.time = 0;

    this.hints = new Hints();
    this.rows = [
      {
        id: 'mute',
        label: 'SOUND',
        getValue: () => (this.ctx.audio.muted ? 'OFF' : 'ON'),
      },
    ];
  }

  enter(): void {
    this.time = 0;

    this.index = 0;
  }

  exit(): void {
    return;
  }

  update(dt: number): void {
    this.time += dt;
    const input = this.ctx.input;

    if (input.wasPressed('Escape') || input.wasPressed('KeyX')) {
      this.ctx.scenes.switchTo(this.returnTo);
      return;
    }

    if (input.wasPressed('ArrowUp') || input.wasPressed('KeyW')) {
      this.index = (this.index - 1 + this.rows.length) % this.rows.length;
      this.ctx.audio.select();
    }
    if (input.wasPressed('ArrowDown') || input.wasPressed('KeyS')) {
      this.index = (this.index + 1) % this.rows.length;
      this.ctx.audio.select();
    }

    if (
      input.wasPressed('ArrowLeft') ||
      input.wasPressed('ArrowRight') ||
      input.wasPressed('KeyA') ||
      input.wasPressed('KeyD') ||
      input.wasPressed('Enter') ||
      input.wasPressed('Space')
    ) {
      const row = this.rows[this.index];
      if (row.id === 'mute') {
        this.ctx.audio.toggleMute();
        this.ctx.audio.select();
      }
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
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#6ee7ff';
    ctx.font = '22px PressStart2P, monospace';
    ctx.fillText('SETTINGS', w / 2, 70);

    const startY = h / 2 - 30;
    const rowH = 56;
    for (let i = 0; i < this.rows.length; i++) {
      const row = this.rows[i];
      const active = i === this.index;
      const y = startY + i * rowH;

      ctx.fillStyle = active ? 'rgba(110,231,255,0.14)' : 'rgba(255,255,255,0.03)';
      ctx.fillRect(w / 2 - 200, y - 22, 400, 44);

      ctx.lineWidth = active ? 3 : 1;
      ctx.strokeStyle = active ? '#6ee7ff' : 'rgba(110,231,255,0.25)';
      ctx.strokeRect(w / 2 - 200 + 0.5, y - 22 + 0.5, 400 - 1, 44 - 1);

      ctx.fillStyle = '#f8fafc';
      ctx.font = '12px PressStart2P, monospace';
      ctx.textAlign = 'left';
      ctx.fillText(row.label, w / 2 - 180, y);

      ctx.fillStyle = active ? '#fce029' : '#a3e635';
      ctx.textAlign = 'right';
      ctx.fillText(row.getValue(), w / 2 + 180, y);
      ctx.textAlign = 'center';
    }

    this.hints.draw(
      ctx,
      [
        { keys: 'UP/DOWN', action: 'MOVE' },
        { keys: 'LEFT/RIGHT', action: 'CHANGE' },
        { keys: 'ESC', action: 'BACK' },
      ],
      h - 40
    );

    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
  }
}
