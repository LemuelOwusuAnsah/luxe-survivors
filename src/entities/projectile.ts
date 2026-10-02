import { CONFIG } from '../config';
import type { Sprite } from '../engine/sprites';

export class Projectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  radius: number;
  damage: number;
  life: number;
  alive: boolean;

  constructor(x: number, y: number, angle: number, damage: number) {
    this.x = x;
    this.y = y;
    this.vx = Math.cos(angle) * CONFIG.projectile.speed;
    this.vy = Math.sin(angle) * CONFIG.projectile.speed;
    this.angle = angle;
    this.radius = CONFIG.projectile.radius;
    this.damage = damage;
    this.life = CONFIG.projectile.lifetime;
    this.alive = true;
  }

  update(dt: number): void {
    if (!this.alive) return;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.life -= dt;
    if (this.life <= 0) this.alive = false;
  }

  draw(ctx: CanvasRenderingContext2D, sprite: Sprite | null): void {
    if (sprite && sprite.loaded) {
      sprite.draw(ctx, this.x, this.y, this.radius * 3, false);
      return;
    }

    const trailLen = this.radius * 5;
    const tx = this.x - Math.cos(this.angle) * trailLen;
    const ty = this.y - Math.sin(this.angle) * trailLen;

    ctx.save();
    ctx.globalAlpha = 0.35;
    ctx.strokeStyle = CONFIG.colors.projectile;
    ctx.lineWidth = this.radius * 1.6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.lineTo(this.x, this.y);
    ctx.stroke();
    ctx.restore();

    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = CONFIG.colors.projectile;
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();
  }
}
