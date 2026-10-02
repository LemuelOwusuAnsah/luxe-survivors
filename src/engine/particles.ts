import { CONFIG } from '../config';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  alive: boolean;
}

interface DamageText {
  x: number;
  y: number;
  value: number;
  life: number;
  alive: boolean;
}

export class Particles {
  private parts: Particle[];
  private texts: DamageText[];
  private pool: Particle[];
  private textPool: DamageText[];

  constructor() {
    this.parts = [];
    this.texts = [];
    this.pool = [];
    this.textPool = [];
  }

  burst(x: number, y: number, count: number, color: string): void {
    for (let i = 0; i < count; i++) {
      const p = this.pool.pop() ?? ({} as Particle);
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 120;
      p.x = x;
      p.y = y;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed;
      p.maxLife = 0.35 + Math.random() * 0.25;
      p.life = p.maxLife;
      p.size = 1 + Math.random() * 2;
      p.color = color;
      p.alive = true;
      this.parts.push(p);
    }
  }

  damage(x: number, y: number, value: number): void {
    const t = this.textPool.pop() ?? ({} as DamageText);
    t.x = x;
    t.y = y;
    t.value = value;
    t.life = CONFIG.damageNumber.lifetime;
    t.alive = true;
    this.texts.push(t);
  }

  update(dt: number): void {
    for (let i = this.parts.length - 1; i >= 0; i--) {
      const p = this.parts[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.9;
      p.vy *= 0.9;
      p.life -= dt;
      if (p.life <= 0) {
        p.alive = false;
        this.parts.splice(i, 1);
        this.pool.push(p);
      }
    }
    for (let i = this.texts.length - 1; i >= 0; i--) {
      const t = this.texts[i];
      t.y -= CONFIG.damageNumber.riseSpeed * dt;
      t.life -= dt;
      if (t.life <= 0) {
        t.alive = false;
        this.texts.splice(i, 1);
        this.textPool.push(t);
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    for (const p of this.parts) {
      ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - p.size, p.y - p.size, p.size * 2, p.size * 2);
    }
    ctx.globalAlpha = 1;
    ctx.font = CONFIG.damageNumber.fontSize + 'px monospace';
    ctx.textAlign = 'center';
    for (const t of this.texts) {
      ctx.globalAlpha = Math.max(0, t.life / CONFIG.damageNumber.lifetime);
      ctx.fillStyle = CONFIG.colors.damage;
      ctx.fillText(String(t.value), t.x, t.y);
    }
    ctx.globalAlpha = 1;
    ctx.textAlign = 'left';
  }
}
