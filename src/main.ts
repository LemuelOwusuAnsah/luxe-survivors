import { CONFIG } from './config';
import { Renderer } from './engine/render';
import { Input } from './engine/input';
import { GameLoop } from './engine/loop';
import { Particles } from './engine/particles';
import { Audio } from './engine/audio';
import { Player } from './entities/player';
import { XpOrb } from './entities/pickup';
import { Combat } from './systems/combat';
import { Spawner } from './systems/spawner';
import { UpgradeSystem } from './systems/upgrades';
import { Hud } from './ui/hud';
import { LevelUpUi } from './ui/levelup';
import type { Upgrade } from './data/upgrades';
import './style.css';

type State = 'playing' | 'levelup' | 'paused' | 'dead';

function boot(): void {
  const canvas = document.querySelector<HTMLCanvasElement>('#game');
  if (!canvas) throw new Error('canvas #game not found');

  const renderer = new Renderer(canvas);
  const input = new Input();
  const particles = new Particles();
  const hud = new Hud();
  const levelUi = new LevelUpUi();
  const audio = new Audio();

  let player: Player;
  let combat: Combat;
  let spawner: Spawner;
  let upgrades: UpgradeSystem;
  let orbs: XpOrb[];
  let state: State;
  let elapsed: number;
  let offers: Upgrade[];
  let hover: Upgrade | null;
  let muted: boolean;

  muted = false;

  const reset = (): void => {
    player = new Player(0, 0);
    upgrades = new UpgradeSystem();
    combat = new Combat(upgrades, audio);
    spawner = new Spawner();
    orbs = [];
    state = 'playing';
    elapsed = 0;
    offers = [];
    hover = null;
    renderer.camera.x = player.x;
    renderer.camera.y = player.y;
  };

  reset();

  const openLevelUp = (): void => {
    offers = upgrades.offer(3);
    if (offers.length === 0) {
      player.pendingLevelUps = 0;
      return;
    }
    levelUi.layout(offers);
    state = 'levelup';
    hover = null;
    audio.levelUp();
  };

  const toCanvasCoords = (): { x: number; y: number } => {
    const rect = canvas.getBoundingClientRect();
    const sx = CONFIG.canvas.width / rect.width;
    const sy = CONFIG.canvas.height / rect.height;
    return {
      x: (input.mouseX - rect.left) * sx,
      y: (input.mouseY - rect.top) * sy,
    };
  };

  const unlockAudio = (): void => {
    audio.unlock();
    window.removeEventListener('keydown', unlockAudio);
    window.removeEventListener('mousedown', unlockAudio);
  };
  window.addEventListener('keydown', unlockAudio);
  window.addEventListener('mousedown', unlockAudio);

  let fpsAccum = 0;
  let fpsFrames = 0;
  let fpsDisplay = 0;

  const update = (dt: number): void => {
    if (input.wasPressed('KeyM')) {
      muted = audio.toggleMute();
    }

    if (state === 'playing') {
      elapsed += dt;
      const move = input.getMoveVector();
      player.update(dt, move);
      spawner.update(dt, player, combat.enemies);
      combat.update(dt, player, particles);

      for (let i = orbs.length - 1; i >= 0; i--) {
        const o = orbs[i];
        o.update(dt, player, upgrades.stats.pickupRadius, audio);
        if (!o.alive) orbs.splice(i, 1);
      }

      for (let i = combat.enemies.length - 1; i >= 0; i--) {
        const e = combat.enemies[i];
        if (!e.alive) {
          orbs.push(new XpOrb(e.x, e.y, e.xpValue));
        }
      }

      if (player.pendingLevelUps > 0) {
        player.pendingLevelUps -= 1;
        openLevelUp();
      } else if (player.hp <= 0) {
        audio.death();
        state = 'dead';
      } else if (input.wasPressed('Escape') || input.wasPressed('KeyP')) {
        state = 'paused';
      }
    } else if (state === 'levelup') {
      const c = toCanvasCoords();
      hover = levelUi.hitTest(c.x, c.y);
      if (input.wasClicked() && hover) {
        upgrades.apply(hover, player);
        offers = [];
        if (player.pendingLevelUps > 0) {
          player.pendingLevelUps -= 1;
          openLevelUp();
        } else {
          state = 'playing';
        }
      }
    } else if (state === 'paused') {
      if (input.wasPressed('Escape') || input.wasPressed('KeyP')) {
        state = 'playing';
      }
    } else if (state === 'dead') {
      if (input.wasPressed('KeyR')) reset();
    }

    particles.update(dt);

    const lerp = CONFIG.camera.lerp;
    renderer.camera.x += (player.x - renderer.camera.x) * lerp;
    renderer.camera.y += (player.y - renderer.camera.y) * lerp;

    input.endFrame();

    fpsAccum += dt;
    fpsFrames += 1;
    if (fpsAccum >= 0.5) {
      fpsDisplay = Math.round(fpsFrames / fpsAccum);
      fpsAccum = 0;
      fpsFrames = 0;
    }
  };

  const render = (): void => {
    renderer.clear();
    renderer.beginWorld();
    renderer.drawGrid();
    for (const o of orbs) o.draw(renderer.ctx);
    combat.draw(renderer.ctx);
    player.draw(renderer.ctx);
    particles.draw(renderer.ctx);
    renderer.endWorld();

    hud.draw(
      renderer.ctx,
      player.hp,
      player.maxHp,
      combat.kills,
      elapsed,
      player.level,
      player.xp,
      player.xpToNext
    );

    if (state === 'levelup') {
      levelUi.draw(renderer.ctx, hover);
    }

    if (state === 'paused') {
      renderer.ctx.fillStyle = 'rgba(0,0,0,' + CONFIG.pause.overlayAlpha + ')';
      renderer.ctx.fillRect(0, 0, CONFIG.canvas.width, CONFIG.canvas.height);
      renderer.ctx.fillStyle = CONFIG.colors.text;
      renderer.ctx.textAlign = 'center';
      renderer.ctx.font = '36px monospace';
      renderer.ctx.fillText('PAUSED', CONFIG.canvas.width / 2, CONFIG.canvas.height / 2 - 10);
      renderer.ctx.font = '16px monospace';
      renderer.ctx.fillText(
        'ESC or P to resume',
        CONFIG.canvas.width / 2,
        CONFIG.canvas.height / 2 + 25
      );
      renderer.ctx.textAlign = 'left';
    }

    if (state === 'dead') {
      const w = CONFIG.canvas.width;
      const h = CONFIG.canvas.height;
      renderer.ctx.fillStyle = 'rgba(0,0,0,0.65)';
      renderer.ctx.fillRect(0, 0, w, h);
      renderer.ctx.fillStyle = CONFIG.colors.text;
      renderer.ctx.textAlign = 'center';
      renderer.ctx.font = '36px monospace';
      renderer.ctx.fillText('YOU DIED', w / 2, h / 2 - 30);
      renderer.ctx.font = '18px monospace';
      renderer.ctx.fillText('Kills: ' + combat.kills, w / 2, h / 2 + 10);
      renderer.ctx.fillText('Level: ' + player.level, w / 2, h / 2 + 35);
      renderer.ctx.fillText('Press R to restart', w / 2, h / 2 + 70);
      renderer.ctx.textAlign = 'left';
    }

    if (CONFIG.debug.showFps) {
      renderer.ctx.fillStyle = CONFIG.colors.text;
      renderer.ctx.font = '14px monospace';
      renderer.ctx.fillText('FPS ' + fpsDisplay, 12, CONFIG.canvas.height - 12);
      if (muted) {
        renderer.ctx.fillText('MUTED', 12, CONFIG.canvas.height - 30);
      }
    }
  };

  const loop = new GameLoop(update, render);
  loop.start();
}

boot();
