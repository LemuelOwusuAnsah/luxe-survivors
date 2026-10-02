import { CONFIG } from '../config';
import { Enemy } from '../entities/enemy';
import { Projectile } from '../entities/projectile';
import type { Player } from '../entities/player';
import type { Particles } from '../engine/particles';

export class Combat {
  fireTimer: number;
  kills: number;
  enemies: Enemy[];
  projectiles: Projectile[];

  constructor() {
    this.fireTimer = 0;
    this.kills = 0;
    this.enemies = [];
    this.projectiles = [];
  }

  update(dt: number, player: Player, particles: Particles): void {
    for (const e of this.enemies) {
      if (e.alive) e.update(dt, player);
    }
    for (const p of this.projectiles) p.update(dt);

    this.fireTimer -= dt;
    if (this.fireTimer <= 0) {
      const target = this.nearestEnemy(player);
      if (target) {
        const angle = Math.atan2(target.y - player.y, target.x - player.x);
        this.projectiles.push(
          new Projectile(player.x, player.y, angle, CONFIG.projectile.damage)
        );
        this.fireTimer = CONFIG.projectile.fireIntervalMs / 1000;
      }
    }

    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      if (!p.alive) {
        this.projectiles.splice(i, 1);
        continue;
      }
      for (const e of this.enemies) {
        if (!e.alive) continue;
        const dx = e.x - p.x;
        const dy = e.y - p.y;
        const r = e.radius + p.radius;
        if (dx * dx + dy * dy <= r * r) {
          e.hit(p.damage);
          particles.damage(e.x, e.y - e.radius, Math.round(p.damage));
          particles.burst(p.x, p.y, 6, CONFIG.colors.enemy);
          p.alive = false;
          if (!e.alive) {
            this.kills += 1;
            particles.burst(e.x, e.y, 12, CONFIG.colors.enemy);
          }
          break;
        }
      }
    }

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      if (!e.alive) {
        this.enemies.splice(i, 1);
        continue;
      }
      const dx = e.x - player.x;
      const dy = e.y - player.y;
      const r = e.radius + player.radius;
      if (dx * dx + dy * dy <= r * r && e.touchCooldown <= 0 && player.invulnTimer <= 0) {
        player.hp -= e.damage;
        player.invulnTimer = CONFIG.player.invulnMs / 1000;
        e.touchCooldown = 0.6;
      }
    }
  }

  private nearestEnemy(player: Player): Enemy | null {
    let best: Enemy | null = null;
    let bestDist = CONFIG.projectile.range * CONFIG.projectile.range;
    for (const e of this.enemies) {
      if (!e.alive) continue;
      const dx = e.x - player.x;
      const dy = e.y - player.y;
      const d = dx * dx + dy * dy;
      if (d < bestDist) {
        bestDist = d;
        best = e;
      }
    }
    return best;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    for (const e of this.enemies) e.draw(ctx);
    for (const p of this.projectiles) p.draw(ctx);
  }
}
