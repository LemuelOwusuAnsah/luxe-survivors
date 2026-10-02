export interface WeaponDefinition {
  id: string;
  name: string;
  fireIntervalMs: number;
  damage: number;
  projectileCount: number;
  spread: number;
  speed: number;
  lifetime: number;
  radius: number;
}

export const WEAPONS: Record<string, WeaponDefinition> = {
  wand: {
    id: 'wand',
    name: 'Magic Wand',
    fireIntervalMs: 550,
    damage: 10,
    projectileCount: 1,
    spread: 0,
    speed: 420,
    lifetime: 1.6,
    radius: 7,
  },
  cleave: {
    id: 'cleave',
    name: 'Heavy Cleave',
    fireIntervalMs: 950,
    damage: 24,
    projectileCount: 3,
    spread: 0.45,
    speed: 300,
    lifetime: 1.4,
    radius: 10,
  },
  knife: {
    id: 'knife',
    name: 'Throwing Knife',
    fireIntervalMs: 280,
    damage: 6,
    projectileCount: 1,
    spread: 0.05,
    speed: 540,
    lifetime: 1.2,
    radius: 5,
  },
};
