import { CONFIG } from '../config';
import { Enemy } from '../entities/enemy';
import type { Player } from '../entities/player';
import { ENEMY_TYPES } from '../data/enemies';
import type { EnemyType } from '../data/enemies';

export class Spawner {
  timer: number;
  elapsed: number;
  bossTimer: number;
  bossesSpawned: number;

  constructor() {
    this.timer = 0;
    this.elapsed = 0;
    this.bossTimer = CONFIG.boss.intervalSeconds;
    this.bossesSpawned = 0;
  }

  update(dt: number, player: Player, enemies: Enemy[]): void {
    this.elapsed += dt;
    this.timer -= dt;
    this.bossTimer -= dt;

    if (this.bossTimer <= 0) {
      this.spawnBoss(player, enemies);
      this.bossesSpawned += 1;
      this.bossTimer = CONFIG.boss.intervalSeconds;
    }

    if (this.timer > 0) return;

    const ramp = Math.min(1, this.elapsed / CONFIG.enemy.spawnRampSeconds);
    const interval =
      CONFIG.enemy.spawnIntervalMs * (1 - ramp) + CONFIG.enemy.spawnIntervalMinMs * ramp;
    this.timer = interval / 1000;

    const alive = enemies.filter((e) => e.alive).length;
    if (alive >= CONFIG.enemy.maxAlive) return;

    const type = this.pickType();
    const angle = Math.random() * Math.PI * 2;
    const dist = CONFIG.enemy.spawnDistance;
    const x = player.x + Math.cos(angle) * dist;
    const y = player.y + Math.sin(angle) * dist;

    const hpScale = 1 + this.elapsed / 120;
    const speedScale = 1 + this.elapsed / 300;
    const hp = CONFIG.enemy.baseHp * hpScale * type.hpMultiplier;
    const speed = CONFIG.enemy.baseSpeed * speedScale * type.speedMultiplier;
    const damage = CONFIG.enemy.baseDamage * type.damageMultiplier;
    const radius = CONFIG.enemy.baseRadius * type.radiusMultiplier;

    const e = new Enemy(x, y, hp, speed, damage, type.spriteKey);
    e.radius = radius;
    e.xpValue = Math.max(1, Math.round(CONFIG.xp.baseValue * type.xpMultiplier));
    enemies.push(e);
  }

  private spawnBoss(player: Player, enemies: Enemy[]): void {
    const angle = Math.random() * Math.PI * 2;
    const dist = CONFIG.enemy.spawnDistance;
    const x = player.x + Math.cos(angle) * dist;
    const y = player.y + Math.sin(angle) * dist;

    const tier = this.bossesSpawned;
    const hp = CONFIG.boss.baseHp * Math.pow(CONFIG.boss.hpGrowth, tier);
    const speed = CONFIG.boss.baseSpeed * (1 + tier * 0.1);
    const damage = CONFIG.boss.baseDamage * (1 + tier * 0.15);

    const boss = new Enemy(x, y, hp, speed, damage, 'boss_cyclops');
    boss.isBoss = true;
    boss.radius = CONFIG.boss.radius;
    boss.xpValue = CONFIG.boss.xpValue;
    enemies.push(boss);
  }

  private pickType(): EnemyType {
    let total = 0;
    for (const t of ENEMY_TYPES) {
      if (this.elapsed >= t.minTimeSeconds) total += t.weight;
    }
    let roll = Math.random() * total;
    for (const t of ENEMY_TYPES) {
      if (this.elapsed < t.minTimeSeconds) continue;
      roll -= t.weight;
      if (roll <= 0) return t;
    }
    return ENEMY_TYPES[0];
  }
}
