import { CONFIG } from '../config';
import { Enemy } from '../entities/enemy';
import type { Player } from '../entities/player';
import { ENEMY_TYPES } from '../data/enemies';
import { getLevel } from '../data/levels';

export class Spawner {
  level: number;
  killsThisLevel: number;
  spawnedThisLevel: number;
  levelElapsed: number;
  spawnTimer: number;
  splashTimer: number;
  splashText: string;
  bossSpawned: boolean;
  groupCursor: number;
  blockCount: number;
  onLevelAdvance: ((level: number) => void) | null;

  constructor() {
    this.level = 1;
    this.killsThisLevel = 0;
    this.spawnedThisLevel = 0;
    this.levelElapsed = 0;
    this.spawnTimer = 0;
    this.splashTimer = 3;
    this.splashText = 'LEVEL 1';
    this.bossSpawned = false;
    this.groupCursor = 0;
    this.blockCount = 0;
    this.onLevelAdvance = null;
  }

  get levelTarget(): number {
    return getLevel(this.level).totalEnemies;
  }

  get killsRemaining(): number {
    return Math.max(0, this.levelTarget - this.killsThisLevel);
  }

  notifyKill(): void {
    this.killsThisLevel += 1;
    if (this.killsThisLevel >= this.levelTarget) {
      this.level += 1;
      this.killsThisLevel = 0;
      this.spawnedThisLevel = 0;
      this.levelElapsed = 0;
      this.bossSpawned = false;
      this.groupCursor = 0;
      this.blockCount = 0;
      this.splashText = 'LEVEL ' + this.level;
      this.splashTimer = 3;
      if (this.onLevelAdvance) this.onLevelAdvance(this.level);
    }
  }

  update(dt: number, player: Player, enemies: Enemy[]): void {
    this.levelElapsed += dt;
    if (this.splashTimer > 0) this.splashTimer -= dt;

    const bossActive = enemies.some((e) => e.isBoss && e.alive);
    if (
      this.level % 3 === 0 &&
      !this.bossSpawned &&
      !bossActive &&
      this.killsThisLevel >= Math.floor(this.levelTarget * 0.75)
    ) {
      this.bossSpawned = true;
      this.spawnBoss(player, enemies);
    }

    if (this.spawnedThisLevel >= this.levelTarget) return;

    this.spawnTimer -= dt;
    if (this.spawnTimer > 0) return;

    const alive = enemies.filter((e) => e.alive).length;
    if (alive >= CONFIG.enemy.maxAlive) return;

    const levelDef = getLevel(this.level);
    this.spawnOne(player, enemies, levelDef.speedMultiplier, levelDef.hpMultiplier);
    this.spawnedThisLevel += 1;

    const interval = Math.max(
      CONFIG.enemy.spawnIntervalMinMs,
      CONFIG.enemy.spawnIntervalMs - this.level * 40
    );
    this.spawnTimer = interval / 1000;
  }

  private spawnOne(
    player: Player,
    enemies: Enemy[],
    speedMul: number,
    hpMul: number
  ): void {
    const type = this.pickType();
    const angle = Math.random() * Math.PI * 2;
    const dist = CONFIG.enemy.spawnDistance;
    const x = player.x + Math.cos(angle) * dist;
    const y = player.y + Math.sin(angle) * dist;

    const hp = CONFIG.enemy.baseHp * type.hpMultiplier * hpMul;
    const speed = CONFIG.enemy.baseSpeed * type.speedMultiplier * speedMul;
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

    const tier = Math.floor(this.level / 3) - 1;
    const hp = CONFIG.boss.baseHp * Math.pow(CONFIG.boss.hpGrowth, tier);
    const speed = CONFIG.boss.baseSpeed * (1 + tier * 0.1);
    const damage = CONFIG.boss.baseDamage * (1 + tier * 0.15);

    const boss = new Enemy(x, y, hp, speed, damage, 'boss_cyclops');
    boss.isBoss = true;
    boss.radius = CONFIG.boss.radius;
    boss.xpValue = CONFIG.boss.xpValue;
    enemies.push(boss);
  }

  private pickType() {
    const type = ENEMY_TYPES[this.groupCursor % ENEMY_TYPES.length];
    this.blockCount += 1;
    if (this.blockCount >= 5) {
      this.blockCount = 0;
      this.groupCursor = (this.groupCursor + 1) % ENEMY_TYPES.length;
    }
    return type;
  }
}
