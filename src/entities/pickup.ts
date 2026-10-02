import { CONFIG } from '../config';
import type { Player } from './player';
import type { Audio } from '../engine/audio';
import type { Sprite } from '../engine/sprites';

export class XpOrb {
  x: number;
  y: number;
  radius: number;
  value: number;
  alive: boolean;
  attracted: boolean;

  constructor(x: number, y: number, value: number) {
    this.x = x;
    this.y = y;
    this.radius = CONFIG.xp.orbRadius;
    this.value = value;
    this.alive = true;
    this.attracted = false;
  }

  update(dt: number, player: Player, pickupRadius: number, audio: Audio): void {
    if (!this.alive) return;
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const d2 = dx * dx + dy * dy;
    if (d2 <= pickupRadius * pickupRadius) this.attracted = true;
    if (this.attracted) {
      const len = Math.sqrt(d2) || 1;
      const speed = CONFIG.xp.flySpeed;
      this.x += (dx / len) * speed * dt;
      this.y += (dy / len) * speed * dt;
    }
    const pr = player.radius + this.radius;
    if (d2 <= pr * pr) {
      player.gainXp(this.value);
      audio.pickup();
      this.alive = false;
    }
  }

  draw(ctx: CanvasRenderingContext2D, sprite: Sprite | null): void {
    if (sprite && sprite.loaded) {
      sprite.draw(ctx, this.x, this.y, this.radius * 4, false);
      return;
    }
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = CONFIG.colors.xp;
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = CONFIG.colors.xpOutline;
    ctx.stroke();
  }
}
