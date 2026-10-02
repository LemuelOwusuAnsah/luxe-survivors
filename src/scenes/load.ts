import { CONFIG } from '../config';
import type { Scene } from '../engine/scene';
import type { GameContext } from '../engine/context';
import { Hints } from '../ui/hints';
import { formatTime } from '../systems/leaderboard';
import { GameScene } from './game';

export class LoadScene implements Scene {
  private ctx: GameContext;
  private returnTo: Scene;
  private time: number;
  private confirmingDelete: boolean;
  private confirmYes: boolean;
  private hints: Hints;

  constructor(ctx: GameContext, returnTo: Scene) {
    this.ctx = ctx;
    this.returnTo = returnTo;
    this.time = 0;
    this.confirmingDelete = false;
    this.confirmYes = false;
    this.hints = new Hints();
  }

  enter(): void {
    this.time = 0;
    this.confirmingDelete = false;
    this.confirmYes = false;
  }

  exit(): void {
    return;
  }

  private resume(): void {
    const run = this.ctx.savegame.read();
    if (!run) return;
    this.ctx.scenes.switchTo(new GameScene(this.ctx, run.hero, run));
  }

  update(dt: number): void {
    this.time += dt;
    if (this.time < 0.25) return;
    const input = this.ctx.input;
    const run = this.ctx.savegame.read();

    if (this.confirmingDelete) {
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
          this.ctx.savegame.clear();
          this.ctx.audio.hurt();
        } else {
          this.ctx.audio.select();
        }
        this.confirmingDelete = false;
        this.confirmYes = false;
      }
      if (input.wasPressed('KeyO') || input.wasPressed('Escape') || input.wasPressed('KeyY')) {
        this.confirmingDelete = false;
        this.confirmYes = false;
      }
      return;
    }

    if (input.wasPressed('Escape') || input.wasPressed('KeyO') || input.wasPressed('KeyY')) {
      this.ctx.scenes.switchTo(this.returnTo);
      return;
    }

    if (run) {
      if (
        input.wasPressed('Enter') ||
        input.wasPressed('Space') ||
        input.wasPressed('KeyX')
      ) {
        this.resume();
      }
      if (input.wasPressed('KeyZ')) {
        this.confirmingDelete = true;
        this.confirmYes = false;
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
    ctx.fillText('LOAD GAME', w / 2, 56);

    const run = this.ctx.savegame.read();

    if (!run) {
      ctx.fillStyle = 'rgba(248,250,252,0.5)';
      ctx.font = '12px PressStart2P, monospace';
      ctx.fillText('NO SAVED RUN', w / 2, h / 2 - 10);
      ctx.font = '9px PressStart2P, monospace';
      ctx.fillText('PLAY A RUN TO CREATE ONE', w / 2, h / 2 + 20);
    } else {
      const boxW = 560;
      const boxH = 240;
      const boxX = (w - boxW) / 2;
      const boxY = h / 2 - boxH / 2 - 20;

      ctx.fillStyle = 'rgba(255,255,255,0.05)';
      ctx.fillRect(boxX, boxY, boxW, boxH);
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgba(110,231,255,0.5)';
      ctx.strokeRect(boxX + 0.5, boxY + 0.5, boxW - 1, boxH - 1);

      ctx.fillStyle = '#fce029';
      ctx.font = '12px PressStart2P, monospace';
      ctx.fillText(run.name, w / 2, boxY + 30);

      ctx.fillStyle = '#f8fafc';
      ctx.font = '10px PressStart2P, monospace';
      ctx.fillText('HERO  ' + run.hero.toUpperCase(), w / 2, boxY + 70);
      ctx.fillText('LEVEL  ' + run.level, w / 2, boxY + 100);
      ctx.fillText('TIME  ' + formatTime(run.elapsed), w / 2, boxY + 130);
      ctx.fillText('KILLS  ' + run.kills, w / 2, boxY + 160);
      ctx.fillText('COINS  ' + run.coins, w / 2, boxY + 190);

      ctx.fillStyle = 'rgba(248,250,252,0.45)';
      ctx.font = '9px PressStart2P, monospace';
      ctx.fillText('SAVED ' + new Date(run.timestamp).toLocaleString(), w / 2, boxY + 220);
    }

    if (this.confirmingDelete) {
      ctx.fillStyle = 'rgba(0,0,0,0.82)';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#fca5a5';
      ctx.font = '16px PressStart2P, monospace';
      ctx.fillText('DELETE THIS SAVE?', w / 2, h / 2 - 40);

      const btnW = 160;
      const btnH = 56;
      const gap = 40;
      const yesX = w / 2 - btnW - gap / 2;
      const noX = w / 2 + gap / 2;
      const btnY = h / 2 + 20;

      ctx.fillStyle = this.confirmYes ? 'rgba(34,197,94,0.25)' : 'rgba(34,197,94,0.06)';
      ctx.fillRect(yesX, btnY, btnW, btnH);
      ctx.lineWidth = this.confirmYes ? 3 : 1;
      ctx.strokeStyle = this.confirmYes ? '#22c55e' : 'rgba(34,197,94,0.4)';
      ctx.strokeRect(yesX + 0.5, btnY + 0.5, btnW - 1, btnH - 1);
      ctx.fillStyle = '#22c55e';
      ctx.font = '14px PressStart2P, monospace';
      ctx.fillText('YES', yesX + btnW / 2, btnY + btnH / 2 + 1);

      ctx.fillStyle = !this.confirmYes ? 'rgba(239,68,68,0.25)' : 'rgba(239,68,68,0.06)';
      ctx.fillRect(noX, btnY, btnW, btnH);
      ctx.lineWidth = !this.confirmYes ? 3 : 1;
      ctx.strokeStyle = !this.confirmYes ? '#ef4444' : 'rgba(239,68,68,0.4)';
      ctx.strokeRect(noX + 0.5, btnY + 0.5, btnW - 1, btnH - 1);
      ctx.fillStyle = '#ef4444';
      ctx.fillText('NO', noX + btnW / 2, btnY + btnH / 2 + 1);

      this.hints.draw(
        ctx,
        [
          { keys: 'LEFT/RIGHT', action: 'PICK' },
          { keys: 'A / ENTER', action: 'CONFIRM' },
          { keys: 'B / ESC', action: 'CANCEL' },
        ],
        h - 40
      );
    } else if (run) {
      this.hints.draw(
        ctx,
        [
          { keys: 'ENTER', action: 'LOAD' },
          { keys: 'X / PAD X', action: 'DELETE' },
          { keys: 'ESC', action: 'BACK' },
        ],
        h - 30
      );
    } else {
      this.hints.draw(
        ctx,
        [{ keys: 'ESC', action: 'BACK' }],
        h - 30
      );
    }

    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
  }
}
