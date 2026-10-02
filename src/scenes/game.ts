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
import { TitleScene } from './title';
import { HelpScene } from './help';
import { NameEntryScene } from './nameentry';
import { LeaderboardScene } from './leaderboard';

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
  private selectedIndex!: number;
  private muted: boolean;
  private hurtFlashTimer!: number;
  private lastHp!: number;
  private fpsAccum: number;
  private fpsFrames: number;
  private fpsDisplay: number;
  private scoreSubmitted: boolean;

  constructor(ctx: GameContext, heroId: string) {
    this.ctx = ctx;
    this.hud = new Hud();
    this.levelUi = new LevelUpUi();
    this.muted = false;
    this.fpsAccum = 0;
    this.fpsFrames = 0;
    this.fpsDisplay = 0;
    this.scoreSubmitted = false;
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
    this.selectedIndex = 0;
    this.hurtFlashTimer = 0;
    this.lastHp = this.player.hp;
    this.scoreSubmitted = false;
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
    this.selectedIndex = 0;
    this.hover = this.offers[0];
    this.ctx.audio.levelUp();
  }

  private confirmUpgrade(): void {
    const chosen = this.offers[this.selectedIndex];
    if (!chosen) return;
    this.upgrades.apply(chosen, this.player);
    this.offers = [];
    if (this.player.pendingLevelUps > 0) {
      this.player.pendingLevelUps -= 1;
      this.openLevelUp();
    } else {
      this.state = 'playing';
    }
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

  private submitScore(): void {
    if (this.scoreSubmitted) return;
    this.scoreSubmitted = true;
    const kills = this.combat.kills;
    const seconds = this.elapsed;
    const level = this.player.level;
    const coins = this.combat.coinsCollected;
    const hero = this.hero.id;
    if (!this.ctx.leaderboard.qualifies(kills, seconds, level)) {
      return;
    }
    const entryTimestamp = Date.now();
    const nameScene = new NameEntryScene(this.ctx, (name) => {
      this.ctx.leaderboard.add({
        name,
        kills,
        level,
        seconds,
        coins,
        hero,
        timestamp: entryTimestamp,
      });
      this.ctx.scenes.switchTo(new LeaderboardScene(this.ctx, new TitleScene(this.ctx)));
    });
    this.ctx.scenes.switchTo(nameScene);
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
      if (input.wasPressed('ArrowLeft') || input.wasPressed('KeyA')) {
        this.selectedIndex = (this.selectedIndex - 1 + this.offers.length) % this.offers.length;
        this.hover = this.offers[this.selectedIndex];
      }
      if (input.wasPressed('ArrowRight') || input.wasPressed('KeyD')) {
        this.selectedIndex = (this.selectedIndex + 1) % this.offers.length;
        this.hover = this.offers[this.selectedIndex];
      }
      if (
        input.wasPressed('Enter') ||
        input.wasPressed('Space') ||
        input.wasPressed('KeyX')
      ) {
        this.confirmUpgrade();
      } else if (input.mouseMovedThisFrame) {
        const c = this.toCanvasCoords();
        const moused = this.levelUi.hitTest(c.x, c.y);
        if (moused) {
          const idx = this.offers.findIndex((u) => u.id === moused.id);
          if (idx >= 0) {
            this.selectedIndex = idx;
            this.hover = this.offers[this.selectedIndex];
          }
        }
      }

      if (input.wasClicked()) {
        const c2 = this.toCanvasCoords();
        const moused2 = this.levelUi.hitTest(c2.x, c2.y);
        if (moused2) {
          const idx2 = this.offers.findIndex((u) => u.id === moused2.id);
          if (idx2 >= 0) {
            this.selectedIndex = idx2;
            this.hover = this.offers[this.selectedIndex];
          }
          this.confirmUpgrade();
        }
      }
    } else if (this.state === 'paused') {
      if (input.wasPressed('KeyH')) {
        this.ctx.scenes.switchTo(new HelpScene(this.ctx, this));
      } else if (
        input.wasPressed('Escape') ||
        input.wasPressed('KeyP') ||
        input.wasPressed('KeyX') ||
        input.wasPressed('Enter')
      ) {
        this.state = 'playing';
      } else if (input.wasPressed('KeyY')) {
        this.ctx.scenes.switchTo(new TitleScene(this.ctx));
      }
    } else if (this.state === 'dead') {
      if (!this.scoreSubmitted) {
        this.submitScore();
        return;
      }
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
      this.levelUi.draw(ctx, this.hover, this.selectedIndex, this.ctx.sprites);
    }

    if (this.state === 'paused') {
      const w = CONFIG.canvas.width;
      const h = CONFIG.canvas.height;
      ctx.fillStyle = 'rgba(0,0,0,' + CONFIG.pause.overlayAlpha + ')';
      ctx.fillRect(0, 0, w, h);

      ctx.textAlign = 'center';
      ctx.fillStyle = '#6ee7ff';
      ctx.font = '24px PressStart2P, monospace';
      ctx.fillText('PAUSED', w / 2, h / 2 - 70);

      ctx.fillStyle = '#f8fafc';
      ctx.font = '10px PressStart2P, monospace';
      ctx.fillText('X / PAD A  -  RESUME', w / 2, h / 2 - 10);
      ctx.fillStyle = '#fca5a5';
      ctx.fillText('Y / PAD Y  -  MAIN MENU', w / 2, h / 2 + 20);
      ctx.fillStyle = '#a3e635';
      ctx.fillText('H  -  HELP', w / 2, h / 2 + 50);
      ctx.textAlign = 'left';
    }

    if (this.state === 'dead' && !this.scoreSubmitted) {
      const w = CONFIG.canvas.width;
      const h = CONFIG.canvas.height;
      ctx.fillStyle = 'rgba(0,0,0,0.72)';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#f87171';
      ctx.textAlign = 'center';
      ctx.font = '28px PressStart2P, monospace';
      ctx.fillText('YOU DIED', w / 2, h / 2 - 50);
      ctx.fillStyle = '#f8fafc';
      ctx.font = '11px PressStart2P, monospace';
      ctx.fillText('KILLS  ' + this.combat.kills, w / 2, h / 2 + 5);
      ctx.fillText('LEVEL  ' + this.player.level, w / 2, h / 2 + 30);
      ctx.fillText('COINS  ' + this.combat.coinsCollected, w / 2, h / 2 + 55);
      ctx.fillStyle = '#a3e635';
      ctx.font = '9px PressStart2P, monospace';
      ctx.fillText('R  -  RESTART', w / 2, h / 2 + 100);
      ctx.textAlign = 'left';
    }

    if (CONFIG.debug.showFps) {
      ctx.fillStyle = CONFIG.colors.text;
      ctx.font = '10px PressStart2P, monospace';
      ctx.fillText('FPS ' + this.fpsDisplay, 12, CONFIG.canvas.height - 12);
      if (this.muted) {
        ctx.fillText('MUTED', 12, CONFIG.canvas.height - 28);
      }
    }
  }
}
