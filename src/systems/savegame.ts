export interface SavedRun {
  name: string;
  hero: string;
  level: number;
  xp: number;
  xpToNext: number;
  hp: number;
  maxHp: number;
  speed: number;
  elapsed: number;
  kills: number;
  coins: number;
  upgradeStacks: Array<[string, number]>;
  fireIntervalMultiplier: number;
  damage: number;
  projectileCount: number;
  pickupRadius: number;
  healOnKill: number;
  timestamp: number;
}

const KEY = 'luxe.run.v1';

export class SaveGame {
  write(run: SavedRun): void {
    try {
      localStorage.setItem(KEY, JSON.stringify(run));
    } catch {
      return;
    }
  }

  read(): SavedRun | null {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as SavedRun;
      if (!parsed || typeof parsed !== 'object') return null;
      return parsed;
    } catch {
      return null;
    }
  }

  clear(): void {
    try {
      localStorage.removeItem(KEY);
    } catch {
      return;
    }
  }

  exists(): boolean {
    return this.read() !== null;
  }
}
