import { CONFIG } from '../config';

export interface HintEntry {
  keys: string;
  action: string;
}

export class Hints {
  draw(
    ctx: CanvasRenderingContext2D,
    entries: HintEntry[],
    y: number
  ): void {
    const w = CONFIG.canvas.width;
    const pad = 10;
    const rowH = 18;

    ctx.font = '9px PressStart2P, monospace';
    ctx.textBaseline = 'middle';

    let totalW = 0;
    const measured: Array<{ keyW: number; actW: number; total: number }> = [];
    for (const e of entries) {
      const keyW = ctx.measureText(e.keys).width;
      const actW = ctx.measureText(e.action).width;
      const total = keyW + 10 + actW;
      measured.push({ keyW, actW, total });
      totalW += total + pad * 2;
    }
    totalW -= pad * 2;

    let x = (w - totalW) / 2;
    for (let i = 0; i < entries.length; i++) {
      const e = entries[i];
      const m = measured[i];

      ctx.fillStyle = 'rgba(110,231,255,0.12)';
      ctx.fillRect(x - 5, y - rowH / 2 - 2, m.keyW + 10, rowH);
      ctx.strokeStyle = 'rgba(110,231,255,0.5)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x - 4.5, y - rowH / 2 - 1.5, m.keyW + 9, rowH - 1);

      ctx.fillStyle = '#6ee7ff';
      ctx.textAlign = 'left';
      ctx.fillText(e.keys, x, y);

      x += m.keyW + 10;

      ctx.fillStyle = 'rgba(248,250,252,0.75)';
      ctx.fillText(e.action, x, y);

      x += m.actW + pad * 2;
    }
  }
}
