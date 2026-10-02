export interface EnemyType {
  id: string;
  spriteKey: string;
  hpMultiplier: number;
  speedMultiplier: number;
  damageMultiplier: number;
  radiusMultiplier: number;
  xpMultiplier: number;
  minTimeSeconds: number;
  weight: number;
}

export const ENEMY_TYPES: EnemyType[] = [
  {
    id: 'basic',
    spriteKey: 'enemy_slime',
    hpMultiplier: 1,
    speedMultiplier: 1,
    damageMultiplier: 1,
    radiusMultiplier: 1,
    xpMultiplier: 1,
    minTimeSeconds: 0,
    weight: 10,
  },
  {
    id: 'fast',
    spriteKey: 'enemy_rat',
    hpMultiplier: 0.6,
    speedMultiplier: 1.8,
    damageMultiplier: 0.8,
    radiusMultiplier: 0.85,
    xpMultiplier: 1,
    minTimeSeconds: 30,
    weight: 7,
  },
  {
    id: 'tanky',
    spriteKey: 'enemy_minotaur',
    hpMultiplier: 4,
    speedMultiplier: 0.6,
    damageMultiplier: 1.6,
    radiusMultiplier: 1.4,
    xpMultiplier: 3,
    minTimeSeconds: 90,
    weight: 4,
  },
  {
    id: 'ranged',
    spriteKey: 'enemy_spider',
    hpMultiplier: 1.2,
    speedMultiplier: 0.9,
    damageMultiplier: 1.2,
    radiusMultiplier: 1,
    xpMultiplier: 2,
    minTimeSeconds: 120,
    weight: 4,
  },
  {
    id: 'exploder',
    spriteKey: 'enemy_skeleton',
    hpMultiplier: 1.5,
    speedMultiplier: 1.3,
    damageMultiplier: 2,
    radiusMultiplier: 1.1,
    xpMultiplier: 2,
    minTimeSeconds: 180,
    weight: 4,
  },
];
