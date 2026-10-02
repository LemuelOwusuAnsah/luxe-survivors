import { UPGRADES } from '../data/upgrades';
import type { Upgrade } from '../data/upgrades';
import type { Player } from '../entities/player';
import { CONFIG } from '../config';

export interface WeaponStats {
  damage: number;
  fireIntervalMultiplier: number;
  projectileCount: number;
  pickupRadius: number;
  healOnKill: number;
}

export class UpgradeSystem {
  stacks: Map<string, number>;
  stats: WeaponStats;

  constructor() {
    this.stacks = new Map();
    this.stats = {
      damage: 0,
      fireIntervalMultiplier: 1,
      projectileCount: 1,
      pickupRadius: CONFIG.xp.pickupRadius,
      healOnKill: 0,
    };
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
