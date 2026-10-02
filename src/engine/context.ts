import type { Renderer } from './render';
import type { Input } from './input';
import type { Audio } from './audio';
import type { SpriteSheet } from './sprites';
import type { Particles } from './particles';
import type { SceneManager } from './scene';
import type { Leaderboard } from '../systems/leaderboard';
import type { SaveGame } from '../systems/savegame';

export interface GameContext {
  renderer: Renderer;
  input: Input;
  audio: Audio;
  sprites: SpriteSheet;
  particles: Particles;
  scenes: SceneManager;
  leaderboard: Leaderboard;
  savegame: SaveGame;
}
