import { CONFIG } from '../config';

export type InputMode = 'touch' | 'keyboard' | 'gamepad';

export interface HintEntry {
  keys: string;
  action: string;
  touchAction?: string;
  id?: string;
}

interface BadgeRect {
  x: number;
  y: number;
  w: number;
  h: number;
  id: string;
}

export class Hints {
  private rects: BadgeRect[];
  mode: InputMode;

  constructor() {
    this.rects = [];
    this.mode = Hints.detectMode();
  }

  static detectMode(): InputMode {
    if (typeof window === 'undefined') return 'keyboard';
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (hasTouch) return 'touch';
    return 'keyboard';
  }

  draw(
    ctx: CanvasRenderingContext2D,
    entries: HintEntry[],
    y: number
  ): void {
    this.rects = [];
    const w = CONFIG.canvas.width;
    const pad = 10;
    const rowH = 22;

    ctx.font = '9px PressStart2P, monospace';
    ctx.textBaseline = 'middle';

    const visible: Array<{ key: string; action: string; id: string }> = [];
    for (const e of entries) {
      let key = e.keys;
      if (this.mode === 'touch' && e.touchAction) {
        key = e.touchAction;
      }
      visible.push({ key, action: e.action, id: e.id ?? e.action });
    }

    let totalW = 0;
    const measured: Array<{ keyW: number; actW: number }> = [];
    for (const v of visible) {
      const keyW = ctx.measureText(v.key).width;
      const actW = ctx.measureText(v.action).width;
      measured.push({ keyW, actW });
      totalW += keyW + 10 + actW + pad * 2;
    }
    totalW -= pad * 2;

    let x = (w - totalW) / 2;
    for (let i = 0; i < visible.length; i++) {
      const v = visible[i];
      const m = measured[i];

      ctx.fillStyle = 'rgba(110,231,255,0.14)';
      ctx.fillRect(x - 6, y - rowH / 2 - 3, m.keyW + 12, rowH);
      ctx.strokeStyle = 'rgba(110,231,255,0.55)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x - 5.5, y - rowH / 2 - 2.5, m.keyW + 11, rowH - 1);

      ctx.fillStyle = '#6ee7ff';
      ctx.textAlign = 'left';
      ctx.fillText(v.key, x, y);

      this.rects.push({
        x: x - 6,
        y: y - rowH / 2 - 3,
        w: m.keyW + 12,
        h: rowH,
        id: v.id,
      });

      x += m.keyW + 10;

      ctx.fillStyle = 'rgba(248,250,252,0.75)';
      ctx.fillText(v.action, x, y);

      x += m.actW + pad * 2;
    }
  }

  hitTest(mx: number, my: number): string | null {
    for (const r of this.rects) {
      if (mx >= r.x && mx <= r.x + r.w && my >= r.y && my <= r.y + r.h) {
        return r.id;
      }
    }
    return null;
  }
}
