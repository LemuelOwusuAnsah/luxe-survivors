import { CONFIG } from '../config';
import { Enemy } from '../entities/enemy';
import { Projectile } from '../entities/projectile';
import { XpOrb } from '../entities/pickup';
import { Coin } from '../entities/coin';
import { Crate } from '../entities/crate';
import type { Player } from '../entities/player';
import type { Particles } from '../engine/particles';
import type { UpgradeSystem } from './upgrades';
import type { Audio } from '../engine/audio';
import type { SpriteSheet } from '../engine/sprites';
import type { Renderer } from '../engine/render';
import type { Spawner } from './spawner';

export class Combat {
  fireTimer: number;
  kills: number;
  coinsCollected: number;
  enemies: Enemy[];
  projectiles: Projectile[];
  orbs: XpOrb[];
  coins: Coin[];
  crates: Crate[];
  private upgrades: UpgradeSystem;
  private audio: Audio;
  private renderer: Renderer;
  private spawner: Spawner | null;

  constructor(upgrades: UpgradeSystem, audio: Audio, renderer: Renderer) {
    this.fireTimer = 0;
    this.kills = 0;
    this.coinsCollected = 0;
    this.enemies = [];
    this.projectiles = [];
    this.orbs = [];
    this.coins = [];
    this.crates = [];
    this.upgrades = upgrades;
    this.audio = audio;
    this.renderer = renderer;
    this.spawner = null;
  }

  setSpawner(s: Spawner): void {
    this.spawner = s;
  }

  update(dt: number, player: Player, particles: Particles, manualFire: boolean): void {
    for (const e of this.enemies) {
      if (e.alive) e.update(dt, player);
    }
    for (const p of this.projectiles) p.update(dt);

    const stats = this.upgrades.stats;
    const interval = (stats.fireIntervalMs / 1000) * stats.fireIntervalMultiplier;

    this.fireTimer -= dt;
    const firing = manualFire;
    if (this.fireTimer <= 0 && firing) {
      const target = this.nearestEnemy(player);
      if (target) {
        const baseAngle = Math.atan2(target.y - player.y, target.x - player.x);
        const count = stats.projectileCount;
        const spread = stats.spread;
        const start = baseAngle - (spread * (count - 1)) / 2;
        for (let i = 0; i < count; i++) {
          const angle = count === 1 ? baseAngle : start + spread * i;
          this.projectiles.push(
            new Projectile(
              player.x,
              player.y,
              angle,
              stats.damage,
              stats.projectileSpeed,
              stats.projectileLifetime,
              stats.projectileRadius
            )
          );
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
          e.hit(e.isBoss ? p.damage : 99999);
          this.audio.hit();
          particles.damage(e.x, e.y - e.radius, Math.round(p.damage));
          particles.burst(p.x, p.y, 6, CONFIG.colors.projectile);
          p.alive = false;
          if (!e.alive) {
            this.kills += 1;
            if (this.spawner) this.spawner.notifyKill();
            particles.burst(e.x, e.y, 14, CONFIG.colors.blood);

            const roll = Math.random();
            if (e.isBoss) {
              for (let c = 0; c < CONFIG.boss.coinDrops; c++) {
                const a = Math.random() * Math.PI * 2;
                const d = 12 + Math.random() * 24;
                this.crates.push(new Crate(e.x + Math.cos(a) * d, e.y + Math.sin(a) * d, 'coin'));
              }
              this.crates.push(new Crate(e.x, e.y, 'health'));
            } else if (e.spriteKey === 'enemy_minotaur') {
              if (roll < 0.25) {
                this.crates.push(new Crate(e.x, e.y, 'coin'));
              } else if (roll < 0.40) {
                this.crates.push(new Crate(e.x, e.y, 'health'));
              }
            } else if (e.spriteKey === 'enemy_skeleton') {
              if (roll < 0.20) {
                this.crates.push(new Crate(e.x, e.y, 'health'));
              } else if (roll < 0.30) {
                this.coins.push(new Coin(e.x, e.y, CONFIG.coin.value));
              }
            } else if (e.spriteKey === 'enemy_spider') {
              if (roll < 0.10) {
                this.coins.push(new Coin(e.x, e.y, CONFIG.coin.value));
              }
            } else if (roll < 0.05) {
              this.coins.push(new Coin(e.x, e.y, CONFIG.coin.value));
            }

            this.renderer.shake(CONFIG.shake.killMagnitude, CONFIG.shake.killDuration);
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
        this.renderer.shake(CONFIG.shake.hurtMagnitude, CONFIG.shake.hurtDuration);
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

  updateCoins(dt: number, player: Player, audio: Audio): void {
    for (let i = this.coins.length - 1; i >= 0; i--) {
      const c = this.coins[i];
      c.update(dt, player, audio, (v) => {
        this.coinsCollected += v;
      });
      if (!c.alive) this.coins.splice(i, 1);
    }
  }

  updateCrates(dt: number, player: Player, audio: Audio): void {
    for (let i = this.crates.length - 1; i >= 0; i--) {
      const c = this.crates[i];
      c.update(dt, player, audio, (kind) => {
        if (kind === 'coin') {
          this.coinsCollected += 5;
        } else if (kind === 'health') {
          player.hp = Math.min(player.maxHp, player.hp + 25);
        }
      });
      if (!c.alive) this.crates.splice(i, 1);
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
    for (const c of this.coins) c.draw(ctx, sprites.get('coin'));
    for (const c of this.crates) c.draw(ctx, sprites.get('coin'), sprites.get('xp_orb'));
    for (const o of this.orbs) o.draw(ctx, sprites.get('xp_orb'));
    for (const e of this.enemies) e.draw(ctx, sprites.get(e.spriteKey));
    for (const p of this.projectiles) p.draw(ctx, null);
  }
}
