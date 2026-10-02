import { CONFIG } from './config';
import { Renderer } from './engine/render';
import { Input } from './engine/input';
import { GameLoop } from './engine/loop';
import { Player } from './entities/player';
import './style.css';

function boot(): void {
  const canvas = document.querySelector<HTMLCanvasElement>('#game');
  if (!canvas) throw new Error('canvas #game not found');

  const renderer = new Renderer(canvas);
  const input = new Input();
  const player = new Player(0, 0);
  renderer.camera.x = player.x;
  renderer.camera.y = player.y;

  let fpsAccum = 0;
  let fpsFrames = 0;
  let fpsDisplay = 0;

  const update = (dt: number): void => {
    const move = input.getMoveVector();
    player.update(dt, move);

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
    player.draw(renderer.ctx);
    renderer.endWorld();

    if (CONFIG.debug.showFps) {
      renderer.ctx.fillStyle = CONFIG.colors.text;
      renderer.ctx.font = '14px monospace';
      renderer.ctx.fillText('FPS ' + fpsDisplay, 12, 22);
      renderer.ctx.fillText('X ' + player.x.toFixed(0) + ' Y ' + player.y.toFixed(0), 12, 40);
    }
  };

  const loop = new GameLoop(update, render);
  loop.start();
}

boot();
