import { CONFIG } from '../config';
import type { Player } from './player';
import type { Audio } from '../engine/audio';
import type { Sprite } from '../engine/sprites';

export type CrateKind = 'coin' | 'health';

export class Crate {
  x: number;
  y: number;
  radius: number;
  kind: CrateKind;
  alive: boolean;
  life: number;
  bobPhase: number;

  constructor(x: number, y: number, kind: CrateKind) {
    this.x = x;
    this.y = y;
    this.radius = 11;
    this.kind = kind;
    this.alive = true;
    this.life = 20;
    this.bobPhase = Math.random() * Math.PI * 2;
  }

  update(
    dt: number,
    player: Player,
    audio: Audio,
    onCollect: (kind: CrateKind) => void
  ): void {
    if (!this.alive) return;
    this.life -= dt;
    if (this.life <= 0) {
      this.alive = false;
      return;
    }
    this.bobPhase += dt * 3;
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const cr = player.radius + this.radius + 4;
    if (dx * dx + dy * dy <= cr * cr) {
      onCollect(this.kind);
      audio.coin();
      this.alive = false;
    }
  }

  draw(
    ctx: CanvasRenderingContext2D,
    coinSprite: Sprite | null,
    healthSprite: Sprite | null
  ): void {
    const bob = Math.sin(this.bobPhase) * 1.5;
    const cx = this.x;
    const cy = this.y + bob;
    const size = this.radius * 3;

    const sprite = this.kind === 'coin' ? coinSprite : healthSprite;
    if (sprite && sprite.loaded) {
      sprite.draw(ctx, cx, cy, size, false);
    } else {
      ctx.beginPath();
      ctx.arc(cx, cy, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = this.kind === 'coin' ? CONFIG.colors.coin : '#ef4444';
      ctx.fill();
    }

    if (this.kind === 'health') {
      const s = 6;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(cx - s / 2, cy - 1.5, s, 3);
      ctx.fillRect(cx - 1.5, cy - s / 2, 3, s);
    } else {
      const pulse = 0.85 + Math.sin(this.bobPhase * 2) * 0.15;
      ctx.save();
      ctx.globalAlpha = pulse;
      ctx.strokeStyle = '#fce029';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, this.radius + 3, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }
}
