export interface UpgradeEffect {
  damageBonus?: number;
  fireRateMultiplier?: number;
  projectileCountBonus?: number;
  speedBonus?: number;
  maxHpBonus?: number;
  pickupRadiusBonus?: number;
  healOnKill?: number;
}

export interface Upgrade {
  id: string;
  title: string;
  description: string;
  iconKey: string;
  effect: UpgradeEffect;
  maxStacks: number;
}

export const UPGRADES: Upgrade[] = [
  {
    id: 'damage',
    title: 'Sharper Bolts',
    iconKey: 'icon_damage',
    description: '+5 projectile damage',
    effect: { damageBonus: 5 },
    maxStacks: 10,
  },
  {
    id: 'firerate',
    title: 'Quick Cast',
    iconKey: 'icon_firerate',
    description: '+20% fire rate',
    effect: { fireRateMultiplier: 0.8 },
    maxStacks: 8,
  },
  {
    id: 'multishot',
    title: 'Split Shot',
    iconKey: 'icon_multishot',
    description: '+1 projectile',
    effect: { projectileCountBonus: 1 },
    maxStacks: 4,
  },
  {
    id: 'speed',
    title: 'Swift Boots',
    iconKey: 'icon_speed',
    description: '+15% move speed',
    effect: { speedBonus: 0.15 },
    maxStacks: 6,
  },
  {
    id: 'maxhp',
    title: 'Iron Heart',
    iconKey: 'icon_maxhp',
    description: '+20 max HP and heal 20',
    effect: { maxHpBonus: 20 },
    maxStacks: 8,
  },
  {
    id: 'pickup',
    title: 'Magnet',
    iconKey: 'icon_pickup',
    description: '+40 pickup radius',
    effect: { pickupRadiusBonus: 40 },
    maxStacks: 5,
  },
];
