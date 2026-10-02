export interface LevelDefinition {
  level: number;
  totalEnemies: number;
  waves: number;
  enemiesPerWave: number;
  speedMultiplier: number;
  hpMultiplier: number;
}

export const LEVELS: LevelDefinition[] = [
  { level: 1, totalEnemies: 150, waves: 5, enemiesPerWave: 30, speedMultiplier: 1.0, hpMultiplier: 1.0 },
  { level: 2, totalEnemies: 200, waves: 5, enemiesPerWave: 40, speedMultiplier: 1.1, hpMultiplier: 1.2 },
  { level: 3, totalEnemies: 250, waves: 5, enemiesPerWave: 50, speedMultiplier: 1.2, hpMultiplier: 1.4 },
  { level: 4, totalEnemies: 300, waves: 5, enemiesPerWave: 60, speedMultiplier: 1.3, hpMultiplier: 1.6 },
  { level: 5, totalEnemies: 350, waves: 5, enemiesPerWave: 70, speedMultiplier: 1.4, hpMultiplier: 1.8 },
  { level: 6, totalEnemies: 400, waves: 5, enemiesPerWave: 80, speedMultiplier: 1.5, hpMultiplier: 2.0 },
  { level: 7, totalEnemies: 450, waves: 5, enemiesPerWave: 90, speedMultiplier: 1.6, hpMultiplier: 2.2 },
  { level: 8, totalEnemies: 500, waves: 5, enemiesPerWave: 100, speedMultiplier: 1.7, hpMultiplier: 2.4 },
  { level: 9, totalEnemies: 550, waves: 5, enemiesPerWave: 110, speedMultiplier: 1.8, hpMultiplier: 2.6 },
  { level: 10, totalEnemies: 600, waves: 5, enemiesPerWave: 120, speedMultiplier: 1.9, hpMultiplier: 2.8 },
];

export function getLevel(n: number): LevelDefinition {
  if (n <= LEVELS.length) return LEVELS[n - 1];
  const last = LEVELS[LEVELS.length - 1];
  const over = n - LEVELS.length;
  return {
    level: n,
    totalEnemies: last.totalEnemies + 50 * over,
    waves: last.waves,
    enemiesPerWave: Math.floor((last.totalEnemies + 50 * over) / last.waves),
    speedMultiplier: last.speedMultiplier + 0.1 * over,
    hpMultiplier: last.hpMultiplier + 0.2 * over,
  };
}
