import { CONFIG } from '../config';
import type { Scene } from '../engine/scene';
import type { GameContext } from '../engine/context';
import { MenuScene } from './menu';
import { Hints } from '../ui/hints';
import { HelpScene } from './help';

interface Star {
  x: number;
  y: number;
  size: number;
  phase: number;
  speed: number;
}

export class TitleScene implements Scene {
  private ctx: GameContext;
  private time: number;
  private started: boolean;
  private stars: Star[];
  private hints: Hints;

  constructor(ctx: GameContext) {
    this.ctx = ctx;
    this.time = 0;
    this.started = false;
    this.stars = [];
    this.hints = new Hints();
    this.buildStars();
  }

  private buildStars(): void {
    this.stars = [];
    for (let i = 0; i < 90; i++) {
      this.stars.push({
        x: Math.floor(Math.random() * CONFIG.canvas.width),
        y: Math.floor(Math.random() * 260),
        size: Math.random() < 0.75 ? 1 : 2,
        phase: Math.random() * Math.PI * 2,
        speed: 1 + Math.random() * 2.5,
      });
    }
  }

  enter(): void {
    this.time = 0;
    this.started = false;
  }

  exit(): void {
    return;
  }

  update(dt: number): void {
    this.time += dt;
    if (this.started) return;

    const input = this.ctx.input;

    if (input.wasPressed('KeyH')) {
      this.ctx.scenes.switchTo(new HelpScene(this.ctx, this));
      return;
    }

    const codes = [
      'Space',
      'Enter',
      'KeyW',
      'KeyA',
      'KeyS',
      'KeyD',
      'ArrowUp',
      'ArrowDown',
      'ArrowLeft',
      'ArrowRight',
    ];
    for (const c of codes) {
      if (input.wasPressed(c)) {
        this.started = true;
        this.ctx.scenes.switchTo(new MenuScene(this.ctx));
        return;
      }
    }
    if (input.wasClicked()) {
      this.started = true;
      this.ctx.scenes.switchTo(new MenuScene(this.ctx));
    }
  }

  private drawSky(ctx: CanvasRenderingContext2D): void {
    const w = CONFIG.canvas.width;
    const h = CONFIG.canvas.height;
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#050813');
    g.addColorStop(0.55, '#0d1330');
    g.addColorStop(1, '#1b1030');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }

  private drawStars(ctx: CanvasRenderingContext2D): void {
    for (const s of this.stars) {
      const tw = 0.55 + Math.sin(this.time * s.speed + s.phase) * 0.45;
      ctx.globalAlpha = tw;
      ctx.fillStyle = '#e7f4ff';
      ctx.fillRect(s.x, s.y, s.size, s.size);
    }
    ctx.globalAlpha = 1;
  }

  private drawMoon(ctx: CanvasRenderingContext2D): void {
    const mx = CONFIG.canvas.width - 130;
    const my = 90;
    ctx.save();
    ctx.shadowColor = 'rgba(255,240,180,0.55)';
    ctx.shadowBlur = 40;
    ctx.beginPath();
    ctx.arc(mx, my, 38, 0, Math.PI * 2);
    ctx.fillStyle = '#f5e9b8';
    ctx.fill();
    ctx.restore();

    ctx.beginPath();
    ctx.arc(mx - 12, my - 8, 6, 0, Math.PI * 2);
    ctx.arc(mx + 14, my + 6, 8, 0, Math.PI * 2);
    ctx.arc(mx - 2, my + 16, 4, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(180,168,120,0.55)';
    ctx.fill();
  }

  private drawCastle(ctx: CanvasRenderingContext2D): void {
    const w = CONFIG.canvas.width;
    const baseY = CONFIG.canvas.height - 130;
    ctx.fillStyle = '#0a0f1f';
    ctx.fillRect(0, baseY, w, CONFIG.canvas.height - baseY);

    const towers: Array<{ x: number; w: number; h: number; flag: boolean }> = [
      { x: 60, w: 70, h: 120, flag: true },
      { x: 170, w: 50, h: 90, flag: false },
      { x: 260, w: 90, h: 150, flag: true },
      { x: 400, w: 60, h: 110, flag: false },
      { x: 520, w: 110, h: 170, flag: true },
      { x: 680, w: 55, h: 95, flag: false },
      { x: 780, w: 85, h: 130, flag: true },
      { x: 900, w: 60, h: 100, flag: false },
    ];

    for (const t of towers) {
      ctx.fillRect(t.x, baseY - t.h, t.w, t.h);
      for (let i = 0; i < t.w; i += 16) {
        ctx.fillRect(t.x + i, baseY - t.h - 8, 10, 8);
      }
      if (t.flag) {
        const wave = Math.sin(this.time * 1.5 + t.x) * 2;
        ctx.strokeStyle = '#0a0f1f';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(t.x + t.w / 2, baseY - t.h - 8);
        ctx.lineTo(t.x + t.w / 2, baseY - t.h - 30);
        ctx.stroke();
        ctx.fillStyle = '#c8324a';
        ctx.beginPath();
        ctx.moveTo(t.x + t.w / 2, baseY - t.h - 30);
        ctx.lineTo(t.x + t.w / 2 + 16 + wave, baseY - t.h - 24);
        ctx.lineTo(t.x + t.w / 2, baseY - t.h - 18);
        ctx.closePath();
        ctx.fill();
      }
    }

    const windows = [
      { x: 82, y: baseY - 70 },
      { x: 290, y: baseY - 100 },
      { x: 545, y: baseY - 115 },
      { x: 800, y: baseY - 75 },
    ];
    for (const wdw of windows) {
      const flicker = 0.7 + Math.sin(this.time * 4 + wdw.x) * 0.3;
      ctx.globalAlpha = flicker;
      ctx.fillStyle = '#f0a742';
      ctx.fillRect(wdw.x, wdw.y, 8, 10);
      ctx.globalAlpha = 1;
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    const w = CONFIG.canvas.width;
    const h = CONFIG.canvas.height;

    this.drawSky(ctx);
    this.drawStars(ctx);
    this.drawMoon(ctx);
    this.drawCastle(ctx);

    const pulse = 1 + Math.sin(this.time * 2.2) * 0.03;
    const drift = Math.sin(this.time * 1.1) * 4;
    const logoY = 150;

    ctx.save();
    ctx.translate(w / 2 + drift, logoY);
    ctx.scale(pulse, pulse);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '40px PressStart2P, monospace';

    ctx.fillStyle = '#06121a';
    ctx.fillText('LAST', 5, -38);
    ctx.fillText('SURVIVORS', 5, 22);

    ctx.fillStyle = '#6ee7ff';
    ctx.fillText('LAST', 0, -42);

    ctx.fillStyle = '#f8fafc';
    ctx.fillText('SURVIVORS', 0, 18);

    ctx.restore();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#fce029';
    ctx.font = '12px PressStart2P, monospace';
    ctx.fillText('A LEMSY GAMES SERIES', w / 2, logoY + 78);

    const heroes: Array<{ key: string; x: number; label: string }> = [
      { key: 'hero_mage', x: w / 2 - 110, label: 'MAGE' },
      { key: 'hero_warrior', x: w / 2, label: 'WARRIOR' },
      { key: 'hero_rogue', x: w / 2 + 110, label: 'ROGUE' },
    ];

    for (let i = 0; i < heroes.length; i++) {
      const hero = heroes[i];
      const bob = Math.sin(this.time * 3 + i * 1.7) * 3;
      const sprite = this.ctx.sprites.get(hero.key);
      if (sprite && sprite.loaded) {
        sprite.draw(ctx, hero.x, logoY + 190 + bob, 56, false);
      }
      ctx.fillStyle = 'rgba(248,250,252,0.6)';
      ctx.font = '10px PressStart2P, monospace';
      ctx.fillText(hero.label, hero.x, logoY + 236);
    }

    if (!this.started && Math.floor(this.time * 2) % 2 === 0) {
      ctx.fillStyle = '#f8fafc';
      ctx.font = '16px PressStart2P, monospace';
      ctx.fillText('PRESS ANY KEY TO START', w / 2, h - 55);
    }

    this.hints.draw(
      ctx,
      [
        { keys: 'WASD', action: 'MOVE' },
        { keys: 'ENTER', action: 'CONFIRM' },
        { keys: 'PAD A', action: 'CONFIRM' },
      ],
      h - 22
    );
  }
}
