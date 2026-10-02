import { CONFIG } from '../config';
import { Player } from '../entities/player';
import { Combat } from '../systems/combat';
import { Spawner } from '../systems/spawner';
import { UpgradeSystem } from '../systems/upgrades';
import { Hud } from '../ui/hud';
import { LevelUpUi } from '../ui/levelup';
import { HEROES } from '../data/heroes';
import { WEAPONS } from '../data/weapons';
import type { HeroDefinition } from '../data/heroes';
import type { Upgrade } from '../data/upgrades';
import type { Scene } from '../engine/scene';
import type { GameContext } from '../engine/context';

type State = 'playing' | 'levelup' | 'paused' | 'dead';

export class GameScene implements Scene {
  private ctx: GameContext;
  private hero: HeroDefinition;
  private player!: Player;
  private combat!: Combat;
  private spawner!: Spawner;
  private upgrades!: UpgradeSystem;
  private hud: Hud;
  private levelUi: LevelUpUi;
  private state!: State;
  private elapsed!: number;
  private offers!: Upgrade[];
  private hover!: Upgrade | null;
  private muted: boolean;
  private hurtFlashTimer!: number;
  private lastHp!: number;
  private fpsAccum: number;
  private fpsFrames: number;
  private fpsDisplay: number;

  constructor(ctx: GameContext, heroId: string) {
    this.ctx = ctx;
    this.hud = new Hud();
    this.levelUi = new LevelUpUi();
    this.muted = false;
    this.fpsAccum = 0;
    this.fpsFrames = 0;
    this.fpsDisplay = 0;
    const found = HEROES.find((h) => h.id === heroId);
    this.hero = found ?? HEROES[0];
  }

  enter(): void {
    this.reset();
  }

  exit(): void {
    return;
  }

  private reset(): void {
    const hero = this.hero;
    this.player = new Player(0, 0);
    this.player.maxHp = hero.maxHp;
    this.player.hp = hero.maxHp;
    this.player.speed = hero.speed;
    this.upgrades = new UpgradeSystem();
    this.upgrades.setWeapon(WEAPONS[hero.weaponId]);
    this.combat = new Combat(this.upgrades, this.ctx.audio, this.ctx.renderer);
    this.spawner = new Spawner();
    this.state = 'playing';
    this.elapsed = 0;
    this.offers = [];
    this.hover = null;
    this.hurtFlashTimer = 0;
    this.lastHp = this.player.hp;
    this.ctx.renderer.camera.x = this.player.x;
    this.ctx.renderer.camera.y = this.player.y;
  }

  private openLevelUp(): void {
    this.offers = this.upgrades.offer(3);
    if (this.offers.length === 0) {
      this.player.pendingLevelUps = 0;
      return;
    }
    this.levelUi.layout(this.offers);
    this.state = 'levelup';
    this.hover = null;
    this.ctx.audio.levelUp();
  }

  private toCanvasCoords(): { x: number; y: number } {
    const canvas = this.ctx.renderer.canvas;
    const rect = canvas.getBoundingClientRect();
    const sx = CONFIG.canvas.width / rect.width;
    const sy = CONFIG.canvas.height / rect.height;
    return {
      x: (this.ctx.input.mouseX - rect.left) * sx,
      y: (this.ctx.input.mouseY - rect.top) * sy,
    };
  }

  update(dt: number): void {
    const input = this.ctx.input;
    const audio = this.ctx.audio;
    const renderer = this.ctx.renderer;
    const particles = this.ctx.particles;

    if (input.wasPressed('KeyM')) {
      this.muted = audio.toggleMute();
    }

    if (this.state === 'playing') {
      this.elapsed += dt;
      const move = input.getMoveVector();
      this.player.update(dt, move);
      this.spawner.update(dt, this.player, this.combat.enemies);
      this.combat.update(dt, this.player, particles);
      this.combat.updateOrbs(dt, this.player, this.upgrades.stats.pickupRadius, audio);
      this.combat.updateCoins(dt, this.player, audio);

      if (this.player.hp < this.lastHp) {
        this.hurtFlashTimer = CONFIG.flash.hurtDuration;
      }
      this.lastHp = this.player.hp;

      if (this.player.pendingLevelUps > 0) {
        this.player.pendingLevelUps -= 1;
        this.openLevelUp();
      } else if (this.player.hp <= 0) {
        audio.death();
        this.state = 'dead';
      } else if (input.wasPressed('Escape') || input.wasPressed('KeyP')) {
        this.state = 'paused';
      }
    } else if (this.state === 'levelup') {
      const c = this.toCanvasCoords();
      this.hover = this.levelUi.hitTest(c.x, c.y);
      if (input.wasClicked() && this.hover) {
        this.upgrades.apply(this.hover, this.player);
        this.offers = [];
        if (this.player.pendingLevelUps > 0) {
          this.player.pendingLevelUps -= 1;
          this.openLevelUp();
        } else {
          this.state = 'playing';
        }
      }
    } else if (this.state === 'paused') {
      if (input.wasPressed('Escape') || input.wasPressed('KeyP')) {
        this.state = 'playing';
      }
    } else if (this.state === 'dead') {
      if (input.wasPressed('KeyR')) this.reset();
    }

    if (this.hurtFlashTimer > 0) this.hurtFlashTimer -= dt;

    renderer.updateShake(dt);

    const lerp = CONFIG.camera.lerp;
    renderer.camera.x += (this.player.x - renderer.camera.x) * lerp;
    renderer.camera.y += (this.player.y - renderer.camera.y) * lerp;

    this.fpsAccum += dt;
    this.fpsFrames += 1;
    if (this.fpsAccum >= 0.5) {
      this.fpsDisplay = Math.round(this.fpsFrames / this.fpsAccum);
      this.fpsAccum = 0;
      this.fpsFrames = 0;
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    const renderer = this.ctx.renderer;
    renderer.clear();
    renderer.drawGround();
    renderer.beginWorld();
    this.combat.draw(ctx, this.ctx.sprites);
    this.player.draw(ctx, this.ctx.sprites.get(this.hero.spriteKey));
    this.ctx.particles.draw(ctx);
    renderer.endWorld();

    this.hud.draw(
      ctx,
      this.player.hp,
      this.player.maxHp,
      this.combat.kills,
      this.combat.coinsCollected,
      this.elapsed,
      this.player.level,
      this.player.xp,
      this.player.xpToNext
    );

    if (this.hurtFlashTimer > 0) {
      const alpha = (this.hurtFlashTimer / CONFIG.flash.hurtDuration) * CONFIG.flash.hurtAlpha;
      ctx.fillStyle = 'rgba(127,29,29,' + alpha.toFixed(3) + ')';
      ctx.fillRect(0, 0, CONFIG.canvas.width, CONFIG.canvas.height);
    }

    if (this.state === 'levelup') {
      this.levelUi.draw(ctx, this.hover);
    }

    if (this.state === 'paused') {
      ctx.fillStyle = 'rgba(0,0,0,' + CONFIG.pause.overlayAlpha + ')';
      ctx.fillRect(0, 0, CONFIG.canvas.width, CONFIG.canvas.height);
      ctx.fillStyle = CONFIG.colors.text;
      ctx.textAlign = 'center';
      ctx.font = '36px monospace';
      ctx.fillText('PAUSED', CONFIG.canvas.width / 2, CONFIG.canvas.height / 2 - 10);
      ctx.font = '16px monospace';
      ctx.fillText('ESC or P to resume', CONFIG.canvas.width / 2, CONFIG.canvas.height / 2 + 25);
      ctx.textAlign = 'left';
    }

    if (this.state === 'dead') {
      const w = CONFIG.canvas.width;
      const h = CONFIG.canvas.height;
      ctx.fillStyle = 'rgba(0,0,0,0.65)';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = CONFIG.colors.text;
      ctx.textAlign = 'center';
      ctx.font = '36px monospace';
      ctx.fillText('YOU DIED', w / 2, h / 2 - 30);
      ctx.font = '18px monospace';
      ctx.fillText('Kills: ' + this.combat.kills, w / 2, h / 2 + 10);
      ctx.fillText('Level: ' + this.player.level, w / 2, h / 2 + 35);
      ctx.fillText('Press R to restart', w / 2, h / 2 + 70);
      ctx.textAlign = 'left';
    }

    if (CONFIG.debug.showFps) {
      ctx.fillStyle = CONFIG.colors.text;
      ctx.font = '14px monospace';
      ctx.fillText('FPS ' + this.fpsDisplay, 12, CONFIG.canvas.height - 12);
      if (this.muted) {
        ctx.fillText('MUTED', 12, CONFIG.canvas.height - 30);
      }
    }
  }
}
