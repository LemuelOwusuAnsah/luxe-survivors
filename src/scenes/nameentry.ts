import { CONFIG } from '../config';
import type { Scene } from '../engine/scene';
import type { GameContext } from '../engine/context';
import { Hints } from '../ui/hints';

interface Key {
  label: string;
  value: string;
  action: 'char' | 'back' | 'clear' | 'ok';
  w: number;
}

export class NameEntryScene implements Scene {
  private ctx: GameContext;
  private onConfirm: (name: string) => void;
  private name: string;
  private time: number;
  private hints: Hints;
  private rows: Key[][];
  private row: number;
  private col: number;
  private colOffsets: number[][];

  constructor(ctx: GameContext, onConfirm: (name: string) => void) {
    this.ctx = ctx;
    this.onConfirm = onConfirm;
    this.name = ctx.leaderboard.getName();
    this.time = 0;
    this.hints = new Hints();
    this.row = 0;
    this.col = 0;
    this.colOffsets = [];
    this.rows = this.buildKeys();
  }

  private buildKeys(): Key[][] {
    const lettersRow1 = 'ABCDEFGHI';
    const lettersRow2 = 'JKLMNOPQR';
    const lettersRow3 = 'STUVWXYZ';
    const digits = '0123456789';

    const mkChar = (c: string): Key => ({ label: c, value: c, action: 'char', w: 1 });

    const r1 = lettersRow1.split('').map(mkChar);
    const r2 = lettersRow2.split('').map(mkChar);
    const r3 = lettersRow3.split('').map(mkChar);
    const r4: Key[] = digits.split('').map(mkChar);
    r4.push({ label: '<-', value: '', action: 'back', w: 1.5 });
    r4.push({ label: 'CLR', value: '', action: 'clear', w: 1.5 });
    r4.push({ label: 'OK', value: '', action: 'ok', w: 1.5 });

    return [r1, r2, r3, r4];
  }

  enter(): void {
    this.time = 0;
    this.row = 0;
    this.col = 0;
  }

  exit(): void {
    return;
  }

  private finish(): void {
    const finalName = this.name.trim() || 'PLAYER';
    this.ctx.leaderboard.setName(finalName);
    this.onConfirm(finalName);
  }

  private applyKey(key: Key): void {
    if (key.action === 'char') {
      if (this.name.length < 8) {
        this.name += key.value;
        this.ctx.audio.select();
      }
      return;
    }
    if (key.action === 'back') {
      this.name = this.name.slice(0, -1);
      this.ctx.audio.select();
      return;
    }
    if (key.action === 'clear') {
      this.name = '';
      this.ctx.audio.select();
      return;
    }
    if (key.action === 'ok') {
      this.finish();
    }
  }

  update(dt: number): void {
    this.time += dt;
    const input = this.ctx.input;

    if (input.wasPressed('ArrowUp') || input.wasPressed('KeyW')) {
      this.row = (this.row - 1 + this.rows.length) % this.rows.length;
      this.col = Math.min(this.col, this.rows[this.row].length - 1);
      this.ctx.audio.select();
    }
    if (input.wasPressed('ArrowDown') || input.wasPressed('KeyS')) {
      this.row = (this.row + 1) % this.rows.length;
      this.col = Math.min(this.col, this.rows[this.row].length - 1);
      this.ctx.audio.select();
    }
    if (input.wasPressed('ArrowLeft') || input.wasPressed('KeyA')) {
      this.col = (this.col - 1 + this.rows[this.row].length) % this.rows[this.row].length;
      this.ctx.audio.select();
    }
    if (input.wasPressed('ArrowRight') || input.wasPressed('KeyD')) {
      this.col = (this.col + 1) % this.rows[this.row].length;
      this.ctx.audio.select();
    }
    if (
      input.wasPressed('Enter') ||
      input.wasPressed('Space') ||
      input.wasPressed('KeyX')
    ) {
      this.applyKey(this.rows[this.row][this.col]);
    }
    if (input.wasPressed('KeyY') || input.wasPressed('Escape')) {
      this.name = '';
      this.ctx.audio.select();
    }
    if (input.wasPressed('KeyZ')) {
      this.name = this.name.slice(0, -1);
      this.ctx.audio.select();
    }
  }

  private layout(): void {
    const w = CONFIG.canvas.width;
    const boxW = 560;
    const cellW = 48;
    const gap = 8;
    const startX = (w - boxW) / 2;
    const startY = CONFIG.canvas.height / 2 + 20;

    this.colOffsets = [];
    for (let r = 0; r < this.rows.length; r++) {
      const row = this.rows[r];
      const totalW = row.reduce((s, k) => s + k.w * cellW + gap, 0) - gap;
      let x = startX + (boxW - totalW) / 2;
      const offsets: number[] = [];
      for (const k of row) {
        offsets.push(x);
        x += k.w * cellW + gap;
      }
      this.colOffsets.push(offsets);
    }
    void startY;
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
    ctx.font = '16px PressStart2P, monospace';
    ctx.fillText('ENTER YOUR NAME', w / 2, 60);

    const boxW = 400;
    const boxH = 56;
    const boxX = (w - boxW) / 2;
    const boxY = 100;

    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.fillRect(boxX, boxY, boxW, boxH);
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#6ee7ff';
    ctx.strokeRect(boxX + 0.5, boxY + 0.5, boxW - 1, boxH - 1);

    const cursor = Math.floor(this.time * 2) % 2 === 0 ? '_' : ' ';
    ctx.fillStyle = '#f8fafc';
    ctx.font = '20px PressStart2P, monospace';
    ctx.fillText(this.name + cursor, w / 2, boxY + boxH / 2 + 2);

    const cellW = 48;
    const cellH = 40;
    const gap = 8;
    const startY = h / 2 + 30;

    this.layout();

    for (let r = 0; r < this.rows.length; r++) {
      for (let c = 0; c < this.rows[r].length; c++) {
        const key = this.rows[r][c];
        const x = this.colOffsets[r][c];
        const y = startY + r * (cellH + gap);
        const wCell = key.w * cellW;
        const active = r === this.row && c === this.col;

        ctx.fillStyle = active ? 'rgba(252,224,41,0.25)' : 'rgba(110,231,255,0.08)';
        ctx.fillRect(x, y, wCell, cellH);
        ctx.lineWidth = active ? 3 : 1;
        ctx.strokeStyle = active ? '#fce029' : 'rgba(110,231,255,0.35)';
        ctx.strokeRect(x + 0.5, y + 0.5, wCell - 1, cellH - 1);

        ctx.fillStyle = active ? '#fce029' : '#f8fafc';
        ctx.font = '12px PressStart2P, monospace';
        ctx.fillText(key.label, x + wCell / 2, y + cellH / 2 + 2);
      }
    }

    this.hints.draw(
      ctx,
      [
        { keys: 'ARROWS', action: 'MOVE' },
        { keys: 'A', action: 'PICK' },
        { keys: 'Y', action: 'CLEAR' },
      ],
      h - 30
    );

    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
  }
}
