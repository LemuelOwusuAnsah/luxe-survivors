import { CONFIG } from './config';
import { Renderer } from './engine/render';
import { Input } from './engine/input';
import { GameLoop } from './engine/loop';
import { Particles } from './engine/particles';
import { Audio } from './engine/audio';
import { SpriteSheet } from './engine/sprites';
import { SceneManager } from './engine/scene';
import { Leaderboard } from './systems/leaderboard';
import type { GameContext } from './engine/context';
import { TitleScene } from './scenes/title';
import './style.css';

import heroMage from './assets/sprites/hero_mage.png';
import heroWarrior from './assets/sprites/hero_warrior.png';
import heroRogue from './assets/sprites/hero_rogue.png';
import enemySlime from './assets/sprites/enemy_slime.png';
import enemyRat from './assets/sprites/enemy_rat.png';
import enemyMinotaur from './assets/sprites/enemy_minotaur.png';
import enemySpider from './assets/sprites/enemy_spider.png';
import enemySkeleton from './assets/sprites/enemy_skeleton.png';
import bossCyclops from './assets/sprites/boss_cyclops.png';
import xpOrb from './assets/sprites/xp_orb.png';
import coinSprite from './assets/sprites/coin.png';
import groundSprite from './assets/sprites/ground.png';
import iconDamage from './assets/icons/icon_damage.png';
import iconFirerate from './assets/icons/icon_firerate.png';
import iconMultishot from './assets/icons/icon_multishot.png';
import iconSpeed from './assets/icons/icon_speed.png';
import iconMaxhp from './assets/icons/icon_maxhp.png';
import iconPickup from './assets/icons/icon_pickup.png';

function boot(): void {
  const canvas = document.querySelector<HTMLCanvasElement>('#game');
  if (!canvas) throw new Error('canvas #game not found');

  const renderer = new Renderer(canvas);
  const input = new Input();
  const particles = new Particles();
  const audio = new Audio();
  const sprites = new SpriteSheet();
  const scenes = new SceneManager();
  const leaderboard = new Leaderboard();

  sprites.load('hero_mage', heroMage);
  sprites.load('hero_warrior', heroWarrior);
  sprites.load('hero_rogue', heroRogue);
  sprites.load('enemy_slime', enemySlime);
  sprites.load('enemy_rat', enemyRat);
  sprites.load('enemy_minotaur', enemyMinotaur);
  sprites.load('enemy_spider', enemySpider);
  sprites.load('enemy_skeleton', enemySkeleton);
  sprites.load('boss_cyclops', bossCyclops);
  sprites.load('xp_orb', xpOrb);
  sprites.load('coin', coinSprite);
  sprites.load('ground', groundSprite);
  sprites.load('icon_damage', iconDamage);
  sprites.load('icon_firerate', iconFirerate);
  sprites.load('icon_multishot', iconMultishot);
  sprites.load('icon_speed', iconSpeed);
  sprites.load('icon_maxhp', iconMaxhp);
  sprites.load('icon_pickup', iconPickup);
  const groundReady = sprites.get('ground');
  if (groundReady) renderer.setGround(groundReady);

  const context: GameContext = {
    renderer,
    input,
    audio,
    sprites,
    particles,
    scenes,
    leaderboard,
  };

  let audioUnlocked = false;
  const unlockAudio = (): void => {
    if (audioUnlocked) return;
    audioUnlocked = true;
    audio.unlock();
    window.removeEventListener('keydown', unlockAudio);
    window.removeEventListener('mousedown', unlockAudio);
  };
  window.addEventListener('keydown', unlockAudio);
  window.addEventListener('mousedown', unlockAudio);
  window.addEventListener('touchstart', unlockAudio);

  input.attachTouch(canvas);

  scenes.switchTo(new TitleScene(context));

  const update = (dt: number): void => {
    input.poll();
    if (!audioUnlocked && input.padActive()) unlockAudio();
    scenes.update(dt);
    particles.update(dt);
    input.endFrame();
  };

  const render = (): void => {
    scenes.render(renderer.ctx);
  };

  const loop = new GameLoop(update, render);
  loop.start();

  void CONFIG;
}

boot();
