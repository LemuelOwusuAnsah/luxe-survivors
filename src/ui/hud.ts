import { CONFIG } from '../config';

export class Hud {
  draw(
    ctx: CanvasRenderingContext2D,
    hp: number,
    maxHp: number,
    kills: number,
    elapsed: number,
    level: number,
    xp: number,
    xpToNext: number
  ): void {
    const pad = 12;
    const barW = 240;
    const barH = 16;
    const ratio = Math.max(0, hp / maxHp);

    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(pad, pad, barW, barH);

    ctx.fillStyle = '#ef4444';
    ctx.fillRect(pad, pad, barW * ratio, barH);

    ctx.strokeStyle = CONFIG.colors.text;
    ctx.lineWidth = 1;
    ctx.strokeRect(pad + 0.5, pad + 0.5, barW - 1, barH - 1);

    ctx.fillStyle = CONFIG.colors.text;
    ctx.font = '14px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('HP ' + Math.max(0, Math.ceil(hp)) + '/' + maxHp, pad + 6, pad + 12);

    const xpY = pad + barH + 6;
    const xpRatio = Math.max(0, Math.min(1, xp / xpToNext));
    ctx.fillStyle = CONFIG.colors.xpBarBg;
    ctx.fillRect(pad, xpY, barW, 10);
    ctx.fillStyle = CONFIG.colors.xpBar;
    ctx.fillRect(pad, xpY, barW * xpRatio, 10);
    ctx.strokeStyle = CONFIG.colors.text;
    ctx.strokeRect(pad + 0.5, xpY + 0.5, barW - 1, 9);
    ctx.fillStyle = CONFIG.colors.text;
    ctx.font = '12px monospace';
    ctx.fillText('LV ' + level, pad + 6, xpY + 9);

    const mins = Math.floor(elapsed / 60);
    const secs = Math.floor(elapsed % 60);
    const time = String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');

    ctx.textAlign = 'right';
    ctx.fillText('KILLS ' + kills, CONFIG.canvas.width - pad, pad + 12);
    ctx.fillText(time, CONFIG.canvas.width - pad, pad + 30);
    ctx.textAlign = 'left';
  }
}
