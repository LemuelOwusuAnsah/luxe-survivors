import { CONFIG } from '../config';
import { Player } from '../entities/player';
import { Combat } from '../systems/combat';
import { Spawner } from '../systems/spawner';
import { UpgradeSystem } from '../systems/upgrades';
import { Hud } from '../ui/hud';
import { LevelUpUi } from '../ui/levelup';
import { HEROES } from '../data/heroes';
import type { SavedRun } from '../systems/savegame';
import { WEAPONS } from '../data/weapons';
import type { HeroDefinition } from '../data/heroes';
import type { Upgrade } from '../data/upgrades';
import type { Scene } from '../engine/scene';
import type { GameContext } from '../engine/context';
import { TitleScene } from './title';
import { HelpScene } from './help';
import { NameEntryScene } from './nameentry';
import { LeaderboardScene } from './leaderboard';

type State = 'playing' | 'levelup' | 'paused' | 'dead' | 'levelclear' | 'failed';

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
  private bossAlerted!: boolean;
  private savedRun: SavedRun | null;
  private autosaveTimer: number;
  private hearts: number;
  private levelTimeLeft: number;

  constructor(ctx: GameContext, heroId: string, savedRun: SavedRun | null = null) {
    this.ctx = ctx;
    this.hud = new Hud();
    this.levelUi = new LevelUpUi();
    this.muted = false;
    this.fpsAccum = 0;
    this.fpsFrames = 0;
    this.fpsDisplay = 0;
    this.scoreSubmitted = false;
    this.savedRun = savedRun;
    this.autosaveTimer = 0;
    this.hearts = CONFIG.run.startingHearts;
    this.levelTimeLeft = 0;
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
    this.combat.setSpawner(this.spawner);
    this.spawner.onLevelAdvance = () => {
      this.openLevelClear();
    };
    this.levelTimeLeft = CONFIG.run.level1Seconds + (this.spawner.level - 1) * CONFIG.run.secondsPerLevel;
    this.state = 'playing';
    this.elapsed = 0;
    this.offers = [];
    this.hover = null;
    this.selectedIndex = 0;
    this.hurtFlashTimer = 0;
    this.lastHp = this.player.hp;
    this.scoreSubmitted = false;
    this.bossAlerted = false;
    this.ctx.renderer.camera.x = this.player.x;
    this.ctx.renderer.camera.y = this.player.y;

    if (this.savedRun) {
      const r = this.savedRun;
      this.player.level = r.level;
      this.player.xp = r.xp;
      this.player.xpToNext = r.xpToNext;
      this.player.maxHp = r.maxHp;
      this.player.hp = r.hp;
      this.player.speed = r.speed;
      this.elapsed = r.elapsed;
      this.combat.kills = r.kills;
      this.combat.coinsCollected = r.coins;
      this.upgrades.stats.damage = r.damage;
      this.upgrades.stats.fireIntervalMultiplier = r.fireIntervalMultiplier;
      this.upgrades.stats.projectileCount = r.projectileCount;
      this.upgrades.stats.pickupRadius = r.pickupRadius;
      this.upgrades.stats.healOnKill = r.healOnKill;
      for (const [id, count] of r.upgradeStacks) {
        this.upgrades.stacks.set(id, count);
      }
      this.savedRun = null;
    }
  }

  private writeSave(): void {
    if (this.state !== 'playing' && this.state !== 'paused') return;
    const stacks: Array<[string, number]> = [];
    for (const [k, v] of this.upgrades.stacks.entries()) {
      stacks.push([k, v]);
    }
    this.ctx.savegame.write({
      name: this.ctx.leaderboard.getName(),
      hero: this.hero.id,
      level: this.player.level,
      xp: this.player.xp,
      xpToNext: this.player.xpToNext,
      hp: this.player.hp,
      maxHp: this.player.maxHp,
      speed: this.player.speed,
      elapsed: this.elapsed,
      kills: this.combat.kills,
      coins: this.combat.coinsCollected,
      upgradeStacks: stacks,
      fireIntervalMultiplier: this.upgrades.stats.fireIntervalMultiplier,
      damage: this.upgrades.stats.damage,
      projectileCount: this.upgrades.stats.projectileCount,
      pickupRadius: this.upgrades.stats.pickupRadius,
      healOnKill: this.upgrades.stats.healOnKill,
      timestamp: Date.now(),
    });
  }

  private retryLevel(): void {
    this.combat.enemies.length = 0;
    this.combat.projectiles.length = 0;
    this.combat.orbs.length = 0;
    this.combat.coins.length = 0;
    this.combat.crates.length = 0;
    this.spawner.killsThisLevel = 0;
    this.spawner.spawnedThisLevel = 0;
    this.spawner.spawnTimer = 0;
    this.levelTimeLeft = CONFIG.run.level1Seconds + (this.spawner.level - 1) * CONFIG.run.secondsPerLevel;
    this.state = 'playing';
  }

  private openLevelClear(): void {
    this.offers = this.upgrades.offer(3);
    if (this.offers.length === 0) {
      this.offers = [];
      this.state = 'playing';
      return;
    }
    this.levelUi.layout(this.offers);
    this.levelTimeLeft = CONFIG.run.level1Seconds + (this.spawner.level - 1) * CONFIG.run.secondsPerLevel;
    this.state = 'levelclear';
    this.selectedIndex = 0;
    this.hover = this.offers[0];
    this.ctx.audio.levelUp();
  }

  private confirmLevelClear(): void {
    const chosen = this.offers[this.selectedIndex];
    if (chosen) this.upgrades.apply(chosen, this.player);
    this.offers = [];
    this.state = 'playing';
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
      const firing = input.isDown('KeyX');
      this.combat.update(dt, this.player, particles, firing);
      this.combat.updateOrbs(dt, this.player, this.upgrades.stats.pickupRadius, audio);
      this.combat.updateCoins(dt, this.player, audio);
      this.combat.updateCrates(dt, this.player, audio);

      this.levelTimeLeft -= dt;
      if (this.levelTimeLeft <= 0) {
        this.hearts -= 1;
        audio.hurt();
        renderer.shake(12, 0.6);
        if (this.hearts <= 0) {
          audio.death();
          this.ctx.savegame.clear();
          this.state = 'dead';
        } else {
          this.state = 'failed';
        }
      }

      this.autosaveTimer += dt;
      if (this.autosaveTimer >= 5) {
        this.autosaveTimer = 0;
        this.writeSave();
      }

      const bossAlive = this.combat.enemies.some((e) => e.isBoss && e.alive);
      if (bossAlive && !this.bossAlerted) {
        this.bossAlerted = true;
        audio.bossEntrance();
        renderer.shake(10, 0.5);
      } else if (!bossAlive) {
        this.bossAlerted = false;
      }

      if (this.player.hp < this.lastHp) {
        this.hurtFlashTimer = CONFIG.flash.hurtDuration;
      }
      this.lastHp = this.player.hp;

      this.player.pendingLevelUps = 0;
      if (this.player.hp <= 0) {
        audio.death();
        this.ctx.savegame.clear();
        this.state = 'dead';
      } else if (input.wasPressed('Escape') || input.wasPressed('KeyP')) {
        this.state = 'paused';
      }
    } else if (this.state === 'levelclear') {
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
        this.confirmLevelClear();
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
          this.confirmLevelClear();
        }
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
    } else if (this.state === 'failed') {
      if (
        input.wasPressed('Enter') ||
        input.wasPressed('Space') ||
        input.wasPressed('KeyX')
      ) {
        this.retryLevel();
      } else if (input.wasPressed('KeyY') || input.wasPressed('Escape')) {
        this.ctx.savegame.clear();
        this.ctx.scenes.switchTo(new TitleScene(this.ctx));
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
        this.writeSave();
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
      this.spawner.level,
      this.spawner.killsThisLevel,
      this.spawner.levelTarget
    );

    const sp = this.spawner;
    const remaining = sp.levelTarget - sp.killsThisLevel;
    const waveInfo = 'LEVEL ' + sp.level + '   ENEMIES LEFT ' + remaining;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.font = '10px PressStart2P, monospace';
    const waveW = ctx.measureText(waveInfo).width + 24;
    ctx.fillRect(CONFIG.canvas.width / 2 - waveW / 2, 14, waveW, 26);
    ctx.fillStyle = '#fce029';
    ctx.fillText(waveInfo, CONFIG.canvas.width / 2, 28);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';

    if (sp.splashTimer > 0) {
      const a = Math.min(1, sp.splashTimer);
      ctx.save();
      ctx.globalAlpha = a;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#6ee7ff';
      ctx.font = '40px PressStart2P, monospace';
      ctx.fillText(sp.splashText, CONFIG.canvas.width / 2, CONFIG.canvas.height / 2 - 40);
      ctx.restore();
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
    }

    const boss = this.combat.enemies.find((e) => e.isBoss && e.alive);
    if (boss) {
      this.hud.drawBossBar(ctx, 'CYCLOPS', boss.hp, boss.maxHp);
    }

    if (this.hurtFlashTimer > 0) {
      const alpha = (this.hurtFlashTimer / CONFIG.flash.hurtDuration) * CONFIG.flash.hurtAlpha;
      ctx.fillStyle = 'rgba(127,29,29,' + alpha.toFixed(3) + ')';
      ctx.fillRect(0, 0, CONFIG.canvas.width, CONFIG.canvas.height);
    }

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const secs = Math.max(0, Math.ceil(this.levelTimeLeft));
    const timeStr = secs + 's';
    ctx.fillStyle = secs < 15 ? '#ef4444' : '#f8fafc';
    ctx.font = '12px PressStart2P, monospace';
    ctx.fillText(timeStr, CONFIG.canvas.width / 2, 58);

    const heartStartX = CONFIG.canvas.width / 2 - (this.hearts * 14) / 2;
    for (let i = 0; i < this.hearts; i++) {
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(heartStartX + i * 14, 78, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';

    if (this.state === 'failed') {
      ctx.fillStyle = 'rgba(0,0,0,0.82)';
      ctx.fillRect(0, 0, CONFIG.canvas.width, CONFIG.canvas.height);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ef4444';
      ctx.font = '28px PressStart2P, monospace';
      ctx.fillText('MISSION FAILED', CONFIG.canvas.width / 2, CONFIG.canvas.height / 2 - 50);
      ctx.fillStyle = '#f8fafc';
      ctx.font = '11px PressStart2P, monospace';
      ctx.fillText('HEARTS REMAINING  ' + this.hearts, CONFIG.canvas.width / 2, CONFIG.canvas.height / 2 + 10);
      ctx.fillStyle = '#6ee7ff';
      ctx.fillText('A / ENTER   RETRY', CONFIG.canvas.width / 2, CONFIG.canvas.height / 2 + 60);
      ctx.fillStyle = '#fca5a5';
      ctx.fillText('Y / ESC   MAIN MENU', CONFIG.canvas.width / 2, CONFIG.canvas.height / 2 + 90);
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
    }

    if (this.state === 'levelclear') {
      ctx.fillStyle = 'rgba(0,0,0,0.82)';
      ctx.fillRect(0, 0, CONFIG.canvas.width, CONFIG.canvas.height);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#fce029';
      ctx.font = '20px PressStart2P, monospace';
      ctx.fillText('LEVEL ' + (this.spawner.level - 1) + ' COMPLETE', CONFIG.canvas.width / 2, 70);
      ctx.textAlign = 'left';
      this.levelUi.draw(ctx, this.hover, this.selectedIndex, this.ctx.sprites);
    } else if (this.state === 'levelup') {
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

    const stick = this.ctx.input.getTouch().getStickState();
    if (stick.active) {
      ctx.save();
      ctx.globalAlpha = 0.35;
      ctx.beginPath();
      ctx.arc(stick.ox, stick.oy, stick.r, 0, Math.PI * 2);
      ctx.strokeStyle = '#6ee7ff';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      ctx.arc(stick.cx, stick.cy, 22, 0, Math.PI * 2);
      ctx.fillStyle = '#6ee7ff';
      ctx.fill();
      ctx.restore();
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
