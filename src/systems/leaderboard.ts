export interface ScoreEntry {
  name: string;
  kills: number;
  level: number;
  seconds: number;
  coins: number;
  hero: string;
  timestamp: number;
}

const SCORES_KEY = 'luxe.scores.v1';
const NAME_KEY = 'luxe.name.v1';
const MAX_ENTRIES = 10;

export class Leaderboard {
  private entries: ScoreEntry[];

  constructor() {
    this.entries = this.load();
  }

  private load(): ScoreEntry[] {
    try {
      const raw = localStorage.getItem(SCORES_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as ScoreEntry[];
      if (!Array.isArray(parsed)) return [];
      return parsed;
    } catch {
      return [];
    }
  }

  private save(): void {
    try {
      localStorage.setItem(SCORES_KEY, JSON.stringify(this.entries));
    } catch {
      return;
    }
  }

  private rank(a: ScoreEntry, b: ScoreEntry): number {
    if (b.kills !== a.kills) return b.kills - a.kills;
    if (b.seconds !== a.seconds) return b.seconds - a.seconds;
    return b.level - a.level;
  }

  add(entry: ScoreEntry): number {
    this.entries.push(entry);
    this.entries.sort((a, b) => this.rank(a, b));
    this.entries = this.entries.slice(0, MAX_ENTRIES);
    this.save();
    return this.entries.findIndex((e) => e.timestamp === entry.timestamp);
  }

  qualifies(kills: number, seconds: number, level: number): boolean {
    if (this.entries.length < MAX_ENTRIES) return true;
    const worst = this.entries[this.entries.length - 1];
    if (kills > worst.kills) return true;
    if (kills === worst.kills && seconds > worst.seconds) return true;
    if (kills === worst.kills && seconds === worst.seconds && level > worst.level) return true;
    return false;
  }

  top(): ScoreEntry[] {
    return this.entries.slice();
  }

  removeAt(index: number): void {
    if (index < 0 || index >= this.entries.length) return;
    this.entries.splice(index, 1);
    this.save();
  }

  getName(): string {
    try {
      const n = localStorage.getItem(NAME_KEY);
      if (n && n.length > 0) return n.slice(0, 8);
    } catch {
      return 'PLAYER';
    }
    return 'PLAYER';
  }

  setName(name: string): void {
    const clean = name.trim().slice(0, 8).toUpperCase() || 'PLAYER';
    try {
      localStorage.setItem(NAME_KEY, clean);
    } catch {
      return;
    }
  }
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
}
