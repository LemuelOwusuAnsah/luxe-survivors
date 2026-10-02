import { CONFIG } from '../config';
import type { Scene } from '../engine/scene';
import type { GameContext } from '../engine/context';
import { SelectScene } from './select';
import { TitleScene } from './title';
import { LeaderboardScene } from './leaderboard';
import { SettingsScene } from './settings';
import { Hints } from '../ui/hints';

interface MenuItem {
  id: string;
  label: string;
}

export class MenuScene implements Scene {
  private ctx: GameContext;
  private items: MenuItem[];
  private index: number;
  private time: number;
  private hints: Hints;

  constructor(ctx: GameContext) {
    this.ctx = ctx;
    this.items = [
      { id: 'new', label: 'NEW GAME' },
      { id: 'scores', label: 'LEADERBOARD' },
      { id: 'settings', label: 'SETTINGS' },
      { id: 'quit', label: 'QUIT' },
    ];
    this.index = 0;
    this.time = 0;
    this.hints = new Hints();
  }

  enter(): void {
    this.index = 0;
    this.time = 0;
  }

  exit(): void {
    return;
  }

  private activate(): void {
    const item = this.items[this.index];
    if (item.id === 'new') {
      this.ctx.scenes.switchTo(new SelectScene(this.ctx));
    } else if (item.id === 'scores') {
      this.ctx.scenes.switchTo(new LeaderboardScene(this.ctx, this));
    } else if (item.id === 'settings') {
      this.ctx.scenes.switchTo(new SettingsScene(this.ctx, this));
    } else if (item.id === 'quit') {
      this.ctx.scenes.switchTo(new TitleScene(this.ctx));
    }
  }

  update(dt: number): void {
    this.time += dt;
    const input = this.ctx.input;

    if (input.wasPressed('ArrowUp') || input.wasPressed('KeyW')) {
      this.index = (this.index - 1 + this.items.length) % this.items.length;
      this.ctx.audio.select();
    }
    if (input.wasPressed('ArrowDown') || input.wasPressed('KeyS')) {
      this.index = (this.index + 1) % this.items.length;
      this.ctx.audio.select();
    }
    if (
      input.wasPressed('Enter') ||
      input.wasPressed('Space') ||
      input.wasPressed('KeyX')
    ) {
      this.activate();
      return;
    }
    if (input.wasClicked()) {
      const c = this.toCanvasCoords();
      for (let i = 0; i < this.items.length; i++) {
        const rect = this.itemRect(i);
        if (c.x >= rect.x && c.x <= rect.x + rect.w && c.y >= rect.y && c.y <= rect.y + rect.h) {
          if (i === this.index) {
            this.activate();
          } else {
            this.index = i;
            this.ctx.audio.select();
          }
          return;
        }
      }
    }
  }

  private toCanvasCoords(): { x: number; y: number } {
    const canvas = this.ctx.renderer.canvas;
    const rect = canvas.getBoundingClientRect();
    const sx = CONFIG.canvas.width / rect.width;
    const sy = CONFIG.canvas.height / rect.height;
    return {
      x: (this.ctx.input.mouseX - rect.left) * sx,
      y: (this.ctx.input.mouseY - rect.top) * sy,
    };
  }

  private itemRect(i: number): { x: number; y: number; w: number; h: number } {
    const w = 320;
    const h = 46;
    const gap = 12;
    const total = this.items.length * h + (this.items.length - 1) * gap;
    const startY = (CONFIG.canvas.height - total) / 2 + 40;
    return {
      x: (CONFIG.canvas.width - w) / 2,
      y: startY + i * (h + gap),
      w,
      h,
    };
  }

  render(ctx: CanvasRenderingContext2D): void {
    const w = CONFIG.canvas.width;
    const h = CONFIG.canvas.height;

    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#050813');
    g.addColorStop(0.55, '#0d1330');
    g.addColorStop(1, '#1b1030');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const pulse = 1 + Math.sin(this.time * 2.2) * 0.02;
    ctx.save();
    ctx.translate(w / 2, 110);
    ctx.scale(pulse, pulse);
    ctx.font = '32px PressStart2P, monospace';
    ctx.fillStyle = '#6ee7ff';
    ctx.fillText('LAST', 0, -22);
    ctx.fillStyle = '#f8fafc';
    ctx.fillText('SURVIVORS', 0, 18);
    ctx.restore();

    ctx.fillStyle = '#fce029';
    ctx.font = '10px PressStart2P, monospace';
    ctx.fillText('A LEMSY GAMES SERIES', w / 2, 158);

    for (let i = 0; i < this.items.length; i++) {
      const item = this.items[i];
      const rect = this.itemRect(i);
      const active = i === this.index;

      ctx.fillStyle = active ? 'rgba(110,231,255,0.16)' : 'rgba(255,255,255,0.04)';
      ctx.fillRect(rect.x, rect.y, rect.w, rect.h);

      ctx.lineWidth = active ? 3 : 1;
      ctx.strokeStyle = active ? '#6ee7ff' : 'rgba(110,231,255,0.25)';
      ctx.strokeRect(rect.x + 0.5, rect.y + 0.5, rect.w - 1, rect.h - 1);

      if (active) {
        ctx.save();
        ctx.shadowColor = '#6ee7ff';
        ctx.shadowBlur = 14;
        ctx.strokeRect(rect.x + 0.5, rect.y + 0.5, rect.w - 1, rect.h - 1);
        ctx.restore();
      }

      ctx.fillStyle = active ? '#fce029' : '#f8fafc';
      ctx.font = '14px PressStart2P, monospace';
      ctx.fillText(item.label, rect.x + rect.w / 2, rect.y + rect.h / 2 + 1);
    }

    this.hints.draw(
      ctx,
      [
        { keys: 'UP/DOWN', action: 'MOVE' },
        { keys: 'ENTER', action: 'SELECT' },
        { keys: 'PAD A', action: 'SELECT' },
      ],
      h - 28
    );

    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
  }
}
