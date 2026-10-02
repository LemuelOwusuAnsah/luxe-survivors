import { CONFIG } from './config';
import { Renderer } from './engine/render';
import { Input } from './engine/input';
import { GameLoop } from './engine/loop';
import { Particles } from './engine/particles';
import { Player } from './entities/player';
import { Combat } from './systems/combat';
import { Spawner } from './systems/spawner';
import { Hud } from './ui/hud';
import './style.css';

type State = 'playing' | 'dead';

function boot(): void {
  const canvas = document.querySelector<HTMLCanvasElement>('#game');
  if (!canvas) throw new Error('canvas #game not found');

  const renderer = new Renderer(canvas);
  const input = new Input();
  const particles = new Particles();
  const hud = new Hud();

  let player: Player;
  let combat: Combat;
  let spawner: Spawner;
  let state: State;
  let elapsed: number;

  const reset = (): void => {
    player = new Player(0, 0);
    combat = new Combat();
    spawner = new Spawner();
    state = 'playing';
    elapsed = 0;
    renderer.camera.x = player.x;
    renderer.camera.y = player.y;
  };

  reset();

  let fpsAccum = 0;
  let fpsFrames = 0;
  let fpsDisplay = 0;

  const update = (dt: number): void => {
    if (state === 'playing') {
      elapsed += dt;
      const move = input.getMoveVector();
      player.update(dt, move);
      spawner.update(dt, player, combat.enemies);
      combat.update(dt, player, particles);
      if (player.hp <= 0) state = 'dead';
    }

    if (input.wasPressed('KeyR') && state === 'dead') reset();

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
    combat.draw(renderer.ctx);
    player.draw(renderer.ctx);
    particles.draw(renderer.ctx);
    renderer.endWorld();

    hud.draw(renderer.ctx, player.hp, player.maxHp, combat.kills, elapsed);

    if (state === 'dead') {
      const w = CONFIG.canvas.width;
      const h = CONFIG.canvas.height;
      renderer.ctx.fillStyle = 'rgba(0,0,0,0.65)';
      renderer.ctx.fillRect(0, 0, w, h);
      renderer.ctx.fillStyle = CONFIG.colors.text;
      renderer.ctx.textAlign = 'center';
      renderer.ctx.font = '36px monospace';
      renderer.ctx.fillText('YOU DIED', w / 2, h / 2 - 20);
      renderer.ctx.font = '18px monospace';
      renderer.ctx.fillText('Kills: ' + combat.kills, w / 2, h / 2 + 20);
      renderer.ctx.fillText('Press R to restart', w / 2, h / 2 + 50);
      renderer.ctx.textAlign = 'left';
    }

    if (CONFIG.debug.showFps) {
      renderer.ctx.fillStyle = CONFIG.colors.text;
      renderer.ctx.font = '14px monospace';
      renderer.ctx.fillText('FPS ' + fpsDisplay, 12, CONFIG.canvas.height - 12);
    }
  };

  const loop = new GameLoop(update, render);
  loop.start();
}

boot();
