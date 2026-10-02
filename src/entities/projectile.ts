import { CONFIG } from '../config';

export class Projectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  damage: number;
  life: number;
  alive: boolean;

  constructor(x: number, y: number, angle: number, damage: number) {
    this.x = x;
    this.y = y;
    this.vx = Math.cos(angle) * CONFIG.projectile.speed;
    this.vy = Math.sin(angle) * CONFIG.projectile.speed;
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

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = CONFIG.colors.projectile;
    ctx.fill();
  }
}
