import { CONFIG } from '../config';
import type { Player } from './player';
import type { Audio } from '../engine/audio';
import type { Sprite } from '../engine/sprites';

export class Coin {
  x: number;
  y: number;
  radius: number;
  value: number;
  alive: boolean;
  life: number;
  bobPhase: number;

  constructor(x: number, y: number, value: number) {
    this.x = x;
    this.y = y;
    this.radius = CONFIG.coin.radius;
    this.value = value;
    this.alive = true;
    this.life = CONFIG.coin.lifetime;
    this.bobPhase = Math.random() * Math.PI * 2;
  }

  update(dt: number, player: Player, audio: Audio, onCollect: (value: number) => void): void {
    if (!this.alive) return;
    this.life -= dt;
    if (this.life <= 0) {
      this.alive = false;
      return;
    }
    this.bobPhase += dt * 4;
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const cr = player.radius + this.radius + 4;
    if (dx * dx + dy * dy <= cr * cr) {
      onCollect(this.value);
      audio.pickup();
      this.alive = false;
    }
  }

  draw(ctx: CanvasRenderingContext2D, sprite: Sprite | null): void {
    void sprite;
    const bob = Math.sin(this.bobPhase) * 1.5;
    const cx = this.x;
    const cy = this.y + bob;

    ctx.save();
    ctx.shadowColor = CONFIG.colors.coin;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(cx, cy, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = CONFIG.colors.coin;
    ctx.fill();
    ctx.restore();

    ctx.beginPath();
    ctx.arc(cx, cy, this.radius, 0, Math.PI * 2);
    ctx.lineWidth = 2;
    ctx.strokeStyle = CONFIG.colors.coinOutline;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx - this.radius * 0.3, cy - this.radius * 0.3, this.radius * 0.25, 0, Math.PI * 2);
    ctx.fillStyle = '#fff7cc';
    ctx.fill();
  }
}
