import { CONFIG } from '../config';
import type { Upgrade } from '../data/upgrades';
import type { SpriteSheet } from '../engine/sprites';

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
    const h = 240;
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

  draw(
    ctx: CanvasRenderingContext2D,
    hover: Upgrade | null,
    selectedIndex: number,
    sprites: SpriteSheet
  ): void {
    ctx.fillStyle = 'rgba(0,0,0,0.78)';
    ctx.fillRect(0, 0, CONFIG.canvas.width, CONFIG.canvas.height);

    ctx.fillStyle = '#6ee7ff';
    ctx.textAlign = 'center';
    ctx.font = '24px PressStart2P, monospace';
    ctx.fillText('LEVEL UP', CONFIG.canvas.width / 2, 80);
    ctx.font = '9px PressStart2P, monospace';
    ctx.fillStyle = 'rgba(248,250,252,0.6)';
    ctx.fillText('CHOOSE AN UPGRADE', CONFIG.canvas.width / 2, 106);

    for (let i = 0; i < this.cards.length; i++) {
      const c = this.cards[i];
      const isSelected = i === selectedIndex;
      const isHover = hover && hover.id === c.upgrade.id;
      const active = isSelected || isHover;

      ctx.fillStyle = active ? CONFIG.colors.cardHover : CONFIG.colors.card;
      ctx.fillRect(c.x, c.y, c.w, c.h);

      ctx.lineWidth = isSelected ? 4 : active ? 3 : 2;
      ctx.strokeStyle = isSelected ? '#fce029' : active ? CONFIG.colors.accent : CONFIG.colors.cardBorder;
      ctx.strokeRect(c.x + 0.5, c.y + 0.5, c.w - 1, c.h - 1);

      if (isSelected) {
        ctx.save();
        ctx.shadowColor = '#fce029';
        ctx.shadowBlur = 18;
        ctx.strokeRect(c.x + 0.5, c.y + 0.5, c.w - 1, c.h - 1);
        ctx.restore();
      }

      const icon = sprites.get(c.upgrade.iconKey);
      if (icon && icon.loaded) {
        icon.draw(ctx, c.x + c.w / 2, c.y + 72, 56, false);
      }

      ctx.fillStyle = active ? '#fce029' : CONFIG.colors.accent;
      ctx.font = '11px PressStart2P, monospace';
      ctx.fillText(c.upgrade.title, c.x + c.w / 2, c.y + 140);

      ctx.fillStyle = CONFIG.colors.text;
      ctx.font = '9px PressStart2P, monospace';
      this.wrapText(ctx, c.upgrade.description, c.x + c.w / 2, c.y + 175, c.w - 30, 18);
    }

    ctx.fillStyle = 'rgba(248,250,252,0.55)';
    ctx.font = '9px PressStart2P, monospace';
    ctx.fillText('ARROWS TO PICK   ENTER TO CONFIRM', CONFIG.canvas.width / 2, CONFIG.canvas.height - 40);

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
