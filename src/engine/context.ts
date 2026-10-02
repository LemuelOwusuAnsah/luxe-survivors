import type { Renderer } from './render';
import type { Input } from './input';
import type { Audio } from './audio';
import type { SpriteSheet } from './sprites';
import type { Particles } from './particles';
import type { SceneManager } from './scene';

export interface GameContext {
  renderer: Renderer;
  input: Input;
  audio: Audio;
  sprites: SpriteSheet;
  particles: Particles;
  scenes: SceneManager;
}
