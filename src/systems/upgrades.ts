import { UPGRADES } from '../data/upgrades';
import type { Upgrade } from '../data/upgrades';
import type { Player } from '../entities/player';
import type { WeaponDefinition } from '../data/weapons';
import { CONFIG } from '../config';

export interface WeaponStats {
  damage: number;
  fireIntervalMs: number;
  fireIntervalMultiplier: number;
  projectileCount: number;
  spread: number;
  projectileSpeed: number;
  projectileLifetime: number;
  projectileRadius: number;
  pickupRadius: number;
  healOnKill: number;
}

export class UpgradeSystem {
  stacks: Map<string, number>;
  stats: WeaponStats;
  private base: WeaponDefinition;

  constructor() {
    this.stacks = new Map();
    this.base = {
      id: 'wand',
      name: 'Magic Wand',
      fireIntervalMs: CONFIG.projectile.fireIntervalMs,
      damage: CONFIG.projectile.damage,
      projectileCount: 1,
      spread: 0.18,
      speed: CONFIG.projectile.speed,
      lifetime: CONFIG.projectile.lifetime,
      radius: CONFIG.projectile.radius,
    };
    this.stats = this.buildStats();
  }

  setWeapon(weapon: WeaponDefinition): void {
    this.base = weapon;
    this.rebuild();
  }

  private buildStats(): WeaponStats {
    return {
      damage: this.base.damage,
      fireIntervalMs: this.base.fireIntervalMs,
      fireIntervalMultiplier: 1,
      projectileCount: this.base.projectileCount,
      spread: this.base.spread,
      projectileSpeed: this.base.speed,
      projectileLifetime: this.base.lifetime,
      projectileRadius: this.base.radius,
      pickupRadius: CONFIG.xp.pickupRadius,
      healOnKill: 0,
    };
  }

  private rebuild(): void {
    const damageBonus = 0;
    const fireMult = this.stats.fireIntervalMultiplier;
    const countBonus = this.stats.projectileCount - this.base.projectileCount;
    const pickup = this.stats.pickupRadius;
    const heal = this.stats.healOnKill;
    this.stats = this.buildStats();
    this.stats.damage += damageBonus;
    this.stats.fireIntervalMultiplier = fireMult;
    this.stats.projectileCount += countBonus;
    this.stats.pickupRadius = pickup;
    this.stats.healOnKill = heal;
  }

  offer(count: number): Upgrade[] {
    const available = UPGRADES.filter((u) => {
      const s = this.stacks.get(u.id) ?? 0;
      return s < u.maxStacks;
    });
    const pool = available.slice();
    const picks: Upgrade[] = [];
    for (let i = 0; i < count && pool.length > 0; i++) {
      const idx = Math.floor(Math.random() * pool.length);
      picks.push(pool[idx]);
      pool.splice(idx, 1);
    }
    return picks;
  }

  apply(upgrade: Upgrade, player: Player): void {
    const s = (this.stacks.get(upgrade.id) ?? 0) + 1;
    this.stacks.set(upgrade.id, s);
    const e = upgrade.effect;
    if (e.damageBonus) this.stats.damage += e.damageBonus;
    if (e.fireRateMultiplier) this.stats.fireIntervalMultiplier *= e.fireRateMultiplier;
    if (e.projectileCountBonus) this.stats.projectileCount += e.projectileCountBonus;
    if (e.speedBonus) player.speed *= 1 + e.speedBonus;
    if (e.maxHpBonus) {
      player.maxHp += e.maxHpBonus;
      player.hp = Math.min(player.maxHp, player.hp + e.maxHpBonus);
    }
    if (e.pickupRadiusBonus) this.stats.pickupRadius += e.pickupRadiusBonus;
    if (e.healOnKill) this.stats.healOnKill += e.healOnKill;
  }
}
