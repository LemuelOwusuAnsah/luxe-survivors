import { CONFIG } from '../config';
import type { Scene } from '../engine/scene';
import type { GameContext } from '../engine/context';
import { Hints } from '../ui/hints';
import { formatTime } from '../systems/leaderboard';

export class LeaderboardScene implements Scene {
  private ctx: GameContext;
  private returnTo: Scene;
  private time: number;
  private exiting: boolean;
  private hints: Hints;
  private index: number;
  private confirming: boolean;
  private confirmYes: boolean;
  private pendingDelete: number;

  constructor(ctx: GameContext, returnTo: Scene) {
    this.ctx = ctx;
    this.returnTo = returnTo;
    this.time = 0;
    this.exiting = false;
    this.hints = new Hints();
    this.index = 0;
    this.confirming = false;
    this.confirmYes = false;
    this.pendingDelete = -1;
  }

  enter(): void {
    this.time = 0;
    this.exiting = false;
    this.index = 0;
    this.confirming = false;
    this.confirmYes = false;
    this.pendingDelete = -1;
  }

  exit(): void {
    return;
  }

  private toCanvasCoords(): { x: number; y: number } {
    const canvas = this.ctx.renderer.canvas;
    const rect = canvas.getBoundingClientRect();
    const sx = CONFIG.canvas.width / rect.width;
    const sy = CONFIG.canvas.height / rect.height;
    const touch = this.ctx.input.getTouch();
    const usingTouch = touch.wasTapped();
    const clientX = usingTouch ? touch.tapX + rect.left : this.ctx.input.mouseX;
    const clientY = usingTouch ? touch.tapY + rect.top : this.ctx.input.mouseY;
    return {
      x: (clientX - rect.left) * sx,
      y: (clientY - rect.top) * sy,
    };
  }

  private handleBadgeTap(id: string): void {
    if (id === 'back') {
      this.exiting = true;
      this.ctx.scenes.switchTo(this.returnTo);
      return;
    }
    if (id === 'delete') {
      const entries = this.ctx.leaderboard.top();
      if (entries.length === 0) return;
      this.confirming = true;
      this.confirmYes = false;
      this.pendingDelete = this.index;
      this.ctx.audio.select();
    }
  }

  private rowHitTest(mx: number, my: number, count: number): number {
    const w = CONFIG.canvas.width;
    const startY = 130;
    const rowH = 30;
    const left = w * 0.18;
    const right = w * 0.82;
    if (mx < left || mx > right) return -1;
    for (let i = 0; i < count; i++) {
      const y = startY + 20 + i * rowH;
      if (my >= y - 12 && my <= y - 12 + rowH - 4) return i;
    }
    return -1;
  }

  update(dt: number): void {
    this.time += dt;
    if (this.exiting) return;
    if (this.time < 0.25) return;

    const input = this.ctx.input;
    const entries = this.ctx.leaderboard.top();

    if (this.confirming) {
      if (
        input.wasPressed('ArrowLeft') ||
        input.wasPressed('KeyA') ||
        input.wasPressed('ArrowRight') ||
        input.wasPressed('KeyD')
      ) {
        this.confirmYes = !this.confirmYes;
        this.ctx.audio.select();
      }
      if (
        input.wasPressed('Enter') ||
        input.wasPressed('Space') ||
        input.wasPressed('KeyX')
      ) {
        if (this.confirmYes) {
          this.ctx.leaderboard.removeAt(this.pendingDelete);
          this.ctx.audio.hurt();
          const after = this.ctx.leaderboard.top();
          if (this.index >= after.length) {
            this.index = Math.max(0, after.length - 1);
          }
        } else {
          this.ctx.audio.select();
        }
        this.confirming = false;
        this.confirmYes = false;
        this.pendingDelete = -1;
      }
      if (input.wasPressed('KeyO') || input.wasPressed('Escape') || input.wasPressed('KeyY')) {
        this.confirming = false;
        this.confirmYes = false;
        this.pendingDelete = -1;
        this.ctx.audio.select();
      }

      if (input.wasClicked()) {
        const c = this.toCanvasCoords();
        const w = CONFIG.canvas.width;
        const h = CONFIG.canvas.height;
        const btnW = 160;
        const btnH = 56;
        const gap = 40;
        const yesX = w / 2 - btnW - gap / 2;
        const noX = w / 2 + gap / 2;
        const btnY = h / 2 + 20;
        if (c.x >= yesX && c.x <= yesX + btnW && c.y >= btnY && c.y <= btnY + btnH) {
          this.ctx.leaderboard.removeAt(this.pendingDelete);
          this.ctx.audio.hurt();
          const after = this.ctx.leaderboard.top();
          if (this.index >= after.length) {
            this.index = Math.max(0, after.length - 1);
          }
          this.confirming = false;
          this.confirmYes = false;
          this.pendingDelete = -1;
        } else if (c.x >= noX && c.x <= noX + btnW && c.y >= btnY && c.y <= btnY + btnH) {
          this.confirming = false;
          this.confirmYes = false;
          this.pendingDelete = -1;
          this.ctx.audio.select();
        }
      }
      return;
    }

    if (input.wasPressed('Escape') || input.wasPressed('KeyO') || input.wasPressed('KeyY')) {
      this.exiting = true;
      this.ctx.scenes.switchTo(this.returnTo);
      return;
    }

    if (entries.length > 0) {
      if (input.wasPressed('ArrowUp') || input.wasPressed('KeyW')) {
        this.index = (this.index - 1 + entries.length) % entries.length;
        this.ctx.audio.select();
      }
      if (input.wasPressed('ArrowDown') || input.wasPressed('KeyS')) {
        this.index = (this.index + 1) % entries.length;
        this.ctx.audio.select();
      }
      if (input.wasPressed('KeyZ')) {
        this.confirming = true;
        this.confirmYes = false;
        this.pendingDelete = this.index;
        this.ctx.audio.select();
      }
      if (input.mouseMovedThisFrame) {
        const c = this.toCanvasCoords();
        const hovered = this.rowHitTest(c.x, c.y, entries.length);
        if (hovered >= 0 && hovered !== this.index) {
          this.index = hovered;
        }
      }
      if (input.wasClicked()) {
        const c = this.toCanvasCoords();
        const badge = this.hints.hitTest(c.x, c.y);
        if (badge) {
          this.handleBadgeTap(badge);
          return;
        }
        const clicked = this.rowHitTest(c.x, c.y, entries.length);
        if (clicked >= 0) {
          if (clicked === this.index) {
            this.confirming = true;
            this.confirmYes = false;
            this.pendingDelete = this.index;
            this.ctx.audio.select();
          } else {
            this.index = clicked;
            this.ctx.audio.select();
          }
        }
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
    ctx.fillText('LEADERBOARD', w / 2, 56);

    ctx.fillStyle = 'rgba(248,250,252,0.55)';
    ctx.font = '9px PressStart2P, monospace';
    ctx.fillText('TOP 10 SURVIVORS', w / 2, 90);

    const entries = this.ctx.leaderboard.top();

    if (entries.length === 0) {
      ctx.fillStyle = 'rgba(248,250,252,0.5)';
      ctx.font = '12px PressStart2P, monospace';
      ctx.fillText('NO SCORES YET', w / 2, h / 2 - 10);
      ctx.font = '9px PressStart2P, monospace';
      ctx.fillText('PLAY A RUN TO CLAIM A SPOT', w / 2, h / 2 + 20);
    } else {
      const colName = w * 0.28;
      const colKills = w * 0.55;
      const colTime = w * 0.72;
      const colLv = w * 0.86;
      const startY = 130;
      const rowH = 30;

      ctx.font = '9px PressStart2P, monospace';
      ctx.fillStyle = 'rgba(110,231,255,0.7)';
      ctx.fillText('NAME', colName, startY - 8);
      ctx.fillText('KILLS', colKills, startY - 8);
      ctx.fillText('TIME', colTime, startY - 8);
      ctx.fillText('LV', colLv, startY - 8);

      for (let i = 0; i < entries.length; i++) {
        const e = entries[i];
        const y = startY + 20 + i * rowH;
        const active = i === this.index;

        ctx.fillStyle = active
          ? 'rgba(252,224,41,0.16)'
          : i % 2 === 0
          ? 'rgba(255,255,255,0.03)'
          : 'rgba(255,255,255,0.06)';
        ctx.fillRect(w * 0.18, y - 12, w * 0.64, rowH - 4);

        if (active) {
          ctx.lineWidth = 2;
          ctx.strokeStyle = '#fce029';
          ctx.strokeRect(w * 0.18 + 0.5, y - 12 + 0.5, w * 0.64 - 1, rowH - 5);
        }

        const rankColor =
          i === 0 ? '#fce029' : i === 1 ? '#cbd5e1' : i === 2 ? '#d97706' : '#f8fafc';
        ctx.fillStyle = rankColor;
        ctx.font = '10px PressStart2P, monospace';
        ctx.fillText(String(i + 1), w * 0.21, y + 1);

        ctx.fillStyle = '#f8fafc';
        ctx.fillText(e.name, colName, y + 1);

        ctx.fillStyle = '#fca5a5';
        ctx.fillText(String(e.kills), colKills, y + 1);

        ctx.fillStyle = '#a3e635';
        ctx.fillText(formatTime(e.seconds), colTime, y + 1);

        ctx.fillStyle = '#6ee7ff';
        ctx.fillText(String(e.level), colLv, y + 1);
      }
    }

    if (this.confirming) {
      ctx.fillStyle = 'rgba(0,0,0,0.78)';
      ctx.fillRect(0, 0, w, h);

      const px = w / 2;
      const py = h / 2;

      ctx.fillStyle = '#fca5a5';
      ctx.font = '16px PressStart2P, monospace';
      ctx.fillText('DELETE THIS SCORE?', px, py - 60);

      const entry = this.ctx.leaderboard.top()[this.pendingDelete];
      if (entry) {
        ctx.fillStyle = 'rgba(248,250,252,0.7)';
        ctx.font = '10px PressStart2P, monospace';
        ctx.fillText(
          entry.name + '   KILLS ' + entry.kills + '   ' + formatTime(entry.seconds),
          px,
          py - 20
        );
      }

      const btnW = 160;
      const btnH = 56;
      const gap = 40;
      const yesX = px - btnW - gap / 2;
      const noX = px + gap / 2;

      ctx.fillStyle = this.confirmYes ? 'rgba(34,197,94,0.25)' : 'rgba(34,197,94,0.06)';
      ctx.fillRect(yesX, py + 20, btnW, btnH);
      ctx.lineWidth = this.confirmYes ? 3 : 1;
      ctx.strokeStyle = this.confirmYes ? '#22c55e' : 'rgba(34,197,94,0.4)';
      ctx.strokeRect(yesX + 0.5, py + 20.5, btnW - 1, btnH - 1);
      ctx.fillStyle = '#22c55e';
      ctx.font = '14px PressStart2P, monospace';
      ctx.fillText('YES', yesX + btnW / 2, py + 20 + btnH / 2 + 1);

      ctx.fillStyle = !this.confirmYes ? 'rgba(239,68,68,0.25)' : 'rgba(239,68,68,0.06)';
      ctx.fillRect(noX, py + 20, btnW, btnH);
      ctx.lineWidth = !this.confirmYes ? 3 : 1;
      ctx.strokeStyle = !this.confirmYes ? '#ef4444' : 'rgba(239,68,68,0.4)';
      ctx.strokeRect(noX + 0.5, py + 20.5, btnW - 1, btnH - 1);
      ctx.fillStyle = '#ef4444';
      ctx.fillText('NO', noX + btnW / 2, py + 20 + btnH / 2 + 1);

      this.hints.draw(
        ctx,
        [
          { keys: 'LEFT/RIGHT', action: 'PICK' },
          { keys: 'A / ENTER', action: 'CONFIRM' },
          { keys: 'B / ESC', action: 'CANCEL' },
        ],
        h - 40
      );
    } else {
      const hints =
        entries.length > 0
          ? [
              { keys: 'UP/DOWN', action: 'MOVE', id: 'move' },
              { keys: 'X / PAD X', action: 'DELETE', touchAction: 'TAP HERE', id: 'delete' },
              { keys: 'ESC', action: 'BACK', touchAction: 'TAP HERE', id: 'back' },
            ]
          : [
              { keys: 'ESC / PAD B', action: 'BACK', touchAction: 'TAP HERE', id: 'back' },
            ];
      this.hints.draw(ctx, hints, h - 30);
    }

    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
  }
}
