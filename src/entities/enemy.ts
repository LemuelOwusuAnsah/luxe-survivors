import { CONFIG } from '../config';
import type { Player } from './player';

export class Enemy {
  x: number;
  y: number;
  radius: number;
  speed: number;
  hp: number;
  maxHp: number;
  damage: number;
  alive: boolean;
  flashTimer: number;
  touchCooldown: number;
  xpValue: number;

  constructor(x: number, y: number, hp: number, speed: number, damage: number) {
    this.x = x;
    this.y = y;
    this.radius = CONFIG.enemy.baseRadius;
    this.speed = speed;
    this.hp = hp;
    this.maxHp = hp;
    this.damage = damage;
    this.alive = true;
    this.flashTimer = 0;
    this.touchCooldown = 0;
    this.xpValue = CONFIG.xp.baseValue;
  }

  update(dt: number, player: Player): void {
    if (!this.alive) return;
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const len = Math.hypot(dx, dy) || 1;
    this.x += (dx / len) * this.speed * dt;
    this.y += (dy / len) * this.speed * dt;
    if (this.flashTimer > 0) this.flashTimer -= dt;
    if (this.touchCooldown > 0) this.touchCooldown -= dt;
  }

  hit(damage: number): void {
    this.hp -= damage;
    this.flashTimer = 0.05;
    if (this.hp <= 0) this.alive = false;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const flashing = this.flashTimer > 0;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = flashing ? '#ffffff' : CONFIG.colors.enemy;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = flashing ? '#ffffff' : CONFIG.colors.enemyOutline;
    ctx.stroke();
  }
}
