import { CONFIG } from '../config';
import { Enemy } from '../entities/enemy';
import { Projectile } from '../entities/projectile';
import { XpOrb } from '../entities/pickup';
import type { Player } from '../entities/player';
import type { Particles } from '../engine/particles';
import type { UpgradeSystem } from './upgrades';
import type { Audio } from '../engine/audio';
import type { SpriteSheet } from '../engine/sprites';

export class Combat {
  fireTimer: number;
  kills: number;
  enemies: Enemy[];
  projectiles: Projectile[];
  orbs: XpOrb[];
  private upgrades: UpgradeSystem;
  private audio: Audio;

  constructor(upgrades: UpgradeSystem, audio: Audio) {
    this.fireTimer = 0;
    this.kills = 0;
    this.enemies = [];
    this.projectiles = [];
    this.orbs = [];
    this.upgrades = upgrades;
    this.audio = audio;
  }

  update(dt: number, player: Player, particles: Particles): void {
    for (const e of this.enemies) {
      if (e.alive) e.update(dt, player);
    }
    for (const p of this.projectiles) p.update(dt);

    const baseInterval = CONFIG.projectile.fireIntervalMs / 1000;
    const interval = baseInterval * this.upgrades.stats.fireIntervalMultiplier;

    this.fireTimer -= dt;
    if (this.fireTimer <= 0) {
      const target = this.nearestEnemy(player);
      if (target) {
        const baseAngle = Math.atan2(target.y - player.y, target.x - player.x);
        const count = this.upgrades.stats.projectileCount;
        const spread = 0.18;
        const start = baseAngle - (spread * (count - 1)) / 2;
        for (let i = 0; i < count; i++) {
          const angle = start + spread * i;
          const dmg = CONFIG.projectile.damage + this.upgrades.stats.damage;
          this.projectiles.push(new Projectile(player.x, player.y, angle, dmg));
        }
        this.fireTimer = interval;
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
          this.audio.hit();
          particles.damage(e.x, e.y - e.radius, Math.round(p.damage));
          particles.burst(p.x, p.y, 6, CONFIG.colors.enemy);
          p.alive = false;
          if (!e.alive) {
            this.kills += 1;
            particles.burst(e.x, e.y, 12, CONFIG.colors.enemy);
            this.orbs.push(new XpOrb(e.x, e.y, e.xpValue));
            if (this.upgrades.stats.healOnKill > 0) {
              player.hp = Math.min(player.maxHp, player.hp + this.upgrades.stats.healOnKill);
            }
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
        this.audio.hurt();
      }
    }
  }

  updateOrbs(dt: number, player: Player, pickupRadius: number, audio: Audio): void {
    for (let i = this.orbs.length - 1; i >= 0; i--) {
      const o = this.orbs[i];
      o.update(dt, player, pickupRadius, audio);
      if (!o.alive) this.orbs.splice(i, 1);
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

  draw(ctx: CanvasRenderingContext2D, sprites: SpriteSheet): void {
    for (const o of this.orbs) {
      o.draw(ctx, sprites.get('xp_orb'));
    }
    for (const e of this.enemies) {
      e.draw(ctx, sprites.get(e.spriteKey));
    }
    for (const p of this.projectiles) {
      p.draw(ctx, null);
    }
  }
}
