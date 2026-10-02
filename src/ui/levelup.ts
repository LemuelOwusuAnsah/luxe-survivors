import { CONFIG } from '../config';
import type { Upgrade } from '../data/upgrades';

export interface CardRect {
  x: number;
  y: number;
  w: number;
  h: number;
  upgrade: Upgrade;
}

export class LevelUpUi {
  cards: CardRect[];

  constructor() {
    this.cards = [];
  }

  layout(upgrades: Upgrade[]): void {
    this.cards = [];
    const w = 240;
    const h = 200;
    const gap = 24;
    const totalW = upgrades.length * w + (upgrades.length - 1) * gap;
    const startX = (CONFIG.canvas.width - totalW) / 2;
    const y = (CONFIG.canvas.height - h) / 2;
    for (let i = 0; i < upgrades.length; i++) {
      this.cards.push({
        x: startX + i * (w + gap),
        y,
        w,
        h,
        upgrade: upgrades[i],
      });
    }
  }

  hitTest(mx: number, my: number): Upgrade | null {
    for (const c of this.cards) {
      if (mx >= c.x && mx <= c.x + c.w && my >= c.y && my <= c.y + c.h) {
        return c.upgrade;
      }
    }
    return null;
  }

  draw(ctx: CanvasRenderingContext2D, hover: Upgrade | null): void {
    ctx.fillStyle = 'rgba(0,0,0,0.75)';
    ctx.fillRect(0, 0, CONFIG.canvas.width, CONFIG.canvas.height);

    ctx.fillStyle = CONFIG.colors.text;
    ctx.textAlign = 'center';
    ctx.font = '28px monospace';
    ctx.fillText('LEVEL UP', CONFIG.canvas.width / 2, 110);

    for (const c of this.cards) {
      const isHover = hover && hover.id === c.upgrade.id;
      ctx.fillStyle = isHover ? CONFIG.colors.cardHover : CONFIG.colors.card;
      ctx.fillRect(c.x, c.y, c.w, c.h);
      ctx.lineWidth = 2;
      ctx.strokeStyle = CONFIG.colors.cardBorder;
      ctx.strokeRect(c.x + 0.5, c.y + 0.5, c.w - 1, c.h - 1);

      ctx.fillStyle = CONFIG.colors.accent;
      ctx.font = '18px monospace';
      ctx.fillText(c.upgrade.title, c.x + c.w / 2, c.y + 50);

      ctx.fillStyle = CONFIG.colors.text;
      ctx.font = '14px monospace';
      this.wrapText(ctx, c.upgrade.description, c.x + c.w / 2, c.y + 90, c.w - 24, 18);
    }

    ctx.textAlign = 'left';
  }

  private wrapText(
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
