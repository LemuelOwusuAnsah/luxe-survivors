export interface HeroDefinition {
  id: string;
  name: string;
  tagline: string;
  spriteKey: string;
  maxHp: number;
  speed: number;
  weaponId: string;
  weaponName: string;
  weaponDescription: string;
}

export const HEROES: HeroDefinition[] = [
  {
    id: 'mage',
    name: 'MAGE',
    tagline: 'Balanced caster',
    spriteKey: 'hero_mage',
    maxHp: 100,
    speed: 180,
    weaponId: 'wand',
    weaponName: 'Magic Wand',
    weaponDescription: 'Fires bolts at the nearest enemy',
  },
  {
    id: 'warrior',
    name: 'WARRIOR',
    tagline: 'Tanky brawler',
    spriteKey: 'hero_warrior',
    maxHp: 140,
    speed: 155,
    weaponId: 'cleave',
    weaponName: 'Heavy Cleave',
    weaponDescription: 'Slow, high damage, wide arc',
  },
  {
    id: 'rogue',
    name: 'ROGUE',
    tagline: 'Fast striker',
    spriteKey: 'hero_rogue',
    maxHp: 80,
    speed: 210,
    weaponId: 'knife',
    weaponName: 'Throwing Knife',
    weaponDescription: 'Rapid fire, lower damage',
  },
];
