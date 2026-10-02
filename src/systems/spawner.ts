import { CONFIG } from '../config';
import { Enemy } from '../entities/enemy';
import type { Player } from '../entities/player';

export class Spawner {
  timer: number;
  elapsed: number;

  constructor() {
    this.timer = 0;
    this.elapsed = 0;
  }

  update(dt: number, player: Player, enemies: Enemy[]): void {
    this.elapsed += dt;
    this.timer -= dt;
    if (this.timer > 0) return;

    const ramp = Math.min(1, this.elapsed / CONFIG.enemy.spawnRampSeconds);
    const interval =
      CONFIG.enemy.spawnIntervalMs * (1 - ramp) + CONFIG.enemy.spawnIntervalMinMs * ramp;
    this.timer = interval / 1000;

    const alive = enemies.filter((e) => e.alive).length;
    if (alive >= CONFIG.enemy.maxAlive) return;

    const angle = Math.random() * Math.PI * 2;
    const dist = CONFIG.enemy.spawnDistance;
    const x = player.x + Math.cos(angle) * dist;
    const y = player.y + Math.sin(angle) * dist;

    const hpScale = 1 + this.elapsed / 120;
    const speedScale = 1 + this.elapsed / 300;
    const hp = CONFIG.enemy.baseHp * hpScale;
    const speed = CONFIG.enemy.baseSpeed * speedScale;

    enemies.push(new Enemy(x, y, hp, speed, CONFIG.enemy.baseDamage));
  }
}
