import { CONFIG } from '../config';
import type { Scene } from '../engine/scene';
import type { GameContext } from '../engine/context';
import { HEROES } from '../data/heroes';
import { GameScene } from './game';
import { Hints } from '../ui/hints';

export class SelectScene implements Scene {
  private ctx: GameContext;
  private index: number;
  private time: number;
  private confirmed: boolean;
  private hints: Hints;

  constructor(ctx: GameContext) {
    this.ctx = ctx;
    this.index = 0;
    this.time = 0;
    this.confirmed = false;
    this.hints = new Hints();
  }

  enter(): void {
    this.index = 0;
    this.time = 0;
    this.confirmed = false;
  }

  exit(): void {
    return;
  }

  private confirm(): void {
    if (this.confirmed) return;
    this.confirmed = true;
    const hero = HEROES[this.index];
    this.ctx.scenes.switchTo(new GameScene(this.ctx, hero.id));
  }

  update(dt: number): void {
    this.time += dt;
    if (this.confirmed) return;

    const input = this.ctx.input;
    if (input.wasPressed('ArrowLeft') || input.wasPressed('KeyA')) {
      this.index = (this.index - 1 + HEROES.length) % HEROES.length;
      this.ctx.audio.select();
    }
    if (input.wasPressed('ArrowRight') || input.wasPressed('KeyD')) {
      this.index = (this.index + 1) % HEROES.length;
      this.ctx.audio.select();
    }
    if (input.wasPressed('Enter') || input.wasPressed('Space')) {
      this.confirm();
      return;
    }
    if (input.wasClicked()) {
      const c = this.toCanvasCoords();
      for (let i = 0; i < HEROES.length; i++) {
        const card = this.cardRect(i);
        if (c.x >= card.x && c.x <= card.x + card.w && c.y >= card.y && c.y <= card.y + card.h) {
          if (i === this.index) {
            this.confirm();
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

  private cardRect(i: number): { x: number; y: number; w: number; h: number } {
    const w = 240;
    const h = 320;
    const gap = 30;
    const total = HEROES.length * w + (HEROES.length - 1) * gap;
    const startX = (CONFIG.canvas.width - total) / 2;
    return {
      x: startX + i * (w + gap),
      y: (CONFIG.canvas.height - h) / 2 + 20,
      w,
      h,
    };
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
    ctx.fillText('CHOOSE YOUR HERO', w / 2, 70);

    for (let i = 0; i < HEROES.length; i++) {
      const hero = HEROES[i];
      const card = this.cardRect(i);
      const active = i === this.index;

      ctx.fillStyle = active ? '#1e2a44' : '#141a28';
      ctx.fillRect(card.x, card.y, card.w, card.h);

      ctx.lineWidth = active ? 3 : 1;
      ctx.strokeStyle = active ? '#6ee7ff' : '#2a3550';
      ctx.strokeRect(card.x + 0.5, card.y + 0.5, card.w - 1, card.h - 1);

      const bob = active ? Math.sin(this.time * 4) * 3 : 0;
      const sprite = this.ctx.sprites.get(hero.spriteKey);
      if (sprite && sprite.loaded) {
        sprite.draw(ctx, card.x + card.w / 2, card.y + 90 + bob, 80, false);
      }

      ctx.fillStyle = active ? '#f8fafc' : '#8892a8';
      ctx.font = '16px PressStart2P, monospace';
      ctx.fillText(hero.name, card.x + card.w / 2, card.y + 170);

      ctx.fillStyle = 'rgba(248,250,252,0.6)';
      ctx.font = '10px PressStart2P, monospace';
      ctx.fillText(hero.tagline, card.x + card.w / 2, card.y + 195);

      ctx.fillStyle = '#fce029';
      ctx.font = '11px PressStart2P, monospace';
      ctx.fillText(hero.weaponName, card.x + card.w / 2, card.y + 240);

      ctx.fillStyle = 'rgba(248,250,252,0.5)';
      ctx.font = '9px PressStart2P, monospace';
      this.wrap(ctx, hero.weaponDescription, card.x + card.w / 2, card.y + 265, card.w - 30, 16);

      ctx.fillStyle = 'rgba(248,250,252,0.55)';
      ctx.font = '9px PressStart2P, monospace';
      ctx.fillText('HP ' + hero.maxHp, card.x + card.w / 2, card.y + 305);
    }

    this.hints.draw(
      ctx,
      [
        { keys: 'ARROWS', action: 'SELECT' },
        { keys: 'ENTER', action: 'CONFIRM' },
        { keys: 'PAD A', action: 'CONFIRM' },
      ],
      h - 26
    );
  }

  private wrap(
    ctx: CanvasRenderingContext2D,
    text: string,
    cx: number,
    cy: number,
    maxW: number,
    lineH: number
  ): void {
    const words = text.split(' ');
    let line = '';
    let y = cy;
    for (const word of words) {
      const test = line ? line + ' ' + word : word;
      if (ctx.measureText(test).width > maxW && line) {
        ctx.fillText(line, cx, y);
        line = word;
        y += lineH;
      } else {
        line = test;
      }
    }
    if (line) ctx.fillText(line, cx, y);
  }
}
