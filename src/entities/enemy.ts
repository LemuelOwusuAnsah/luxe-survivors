import { CONFIG } from '../config';
import type { Sprite } from '../engine/sprites';
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
  spriteKey: string;
  bobPhase: number;

  constructor(
    x: number,
    y: number,
    hp: number,
    speed: number,
    damage: number,
    spriteKey: string
  ) {
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
    this.spriteKey = spriteKey;
    this.bobPhase = Math.random() * Math.PI * 2;
  }

  update(dt: number, player: Player): void {
    if (!this.alive) return;
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const len = Math.hypot(dx, dy) || 1;
    this.x += (dx / len) * this.speed * dt;
    this.y += (dy / len) * this.speed * dt;
    this.bobPhase += dt * 8;
    if (this.flashTimer > 0) this.flashTimer -= dt;
    if (this.touchCooldown > 0) this.touchCooldown -= dt;
  }

  hit(damage: number): void {
    this.hp -= damage;
    this.flashTimer = 0.05;
    if (this.hp <= 0) this.alive = false;
  }

  draw(ctx: CanvasRenderingContext2D, sprite: Sprite | null): void {
    const flashing = this.flashTimer > 0;
    const size = this.radius * 3;
    const bobY = Math.sin(this.bobPhase) * 1.2;
    const squash = 1 + Math.sin(this.bobPhase * 2) * 0.05;

    if (sprite && sprite.loaded) {
      ctx.save();
      ctx.translate(this.x, this.y + bobY);
      ctx.scale(1 / squash, squash);
      sprite.draw(ctx, 0, 0, size, flashing);
      ctx.restore();
    } else {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = flashing ? '#ffffff' : CONFIG.colors.enemy;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = flashing ? '#ffffff' : CONFIG.colors.enemyOutline;
      ctx.stroke();
    }
  }
}
