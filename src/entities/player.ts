import { CONFIG } from '../config';

export class Player {
  x: number;
  y: number;
  radius: number;
  speed: number;
  hp: number;
  maxHp: number;
  invulnTimer: number;
  facing: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.radius = CONFIG.player.radius;
    this.speed = CONFIG.player.speed;
    this.hp = CONFIG.player.maxHp;
    this.maxHp = CONFIG.player.maxHp;
    this.invulnTimer = 0;
    this.facing = 0;
  }

  update(dt: number, move: { x: number; y: number }): void {
    this.x += move.x * this.speed * dt;
    this.y += move.y * this.speed * dt;
    if (move.x !== 0 || move.y !== 0) {
      this.facing = Math.atan2(move.y, move.x);
    }
    if (this.invulnTimer > 0) this.invulnTimer -= dt;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (this.invulnTimer > 0 && Math.floor(this.invulnTimer * 20) % 2 === 0) return;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = CONFIG.colors.player;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = CONFIG.colors.playerOutline;
    ctx.stroke();
  }
}
