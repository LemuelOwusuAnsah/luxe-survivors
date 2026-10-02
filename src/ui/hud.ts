import { CONFIG } from '../config';

export class Hud {
  draw(
    ctx: CanvasRenderingContext2D,
    hp: number,
    maxHp: number,
    kills: number,
    coins: number,
    elapsed: number,
    level: number,
    killsThisLevel: number,
    killsTarget: number
  ): void {
    const pad = 14;
    const barW = 240;
    const barH = 18;

    ctx.textBaseline = 'middle';

    const hpRatio = Math.max(0, hp / maxHp);
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(pad, pad, barW, barH);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(pad, pad, barW * hpRatio, barH);
    ctx.strokeStyle = '#f8fafc';
    ctx.lineWidth = 1;
    ctx.strokeRect(pad + 0.5, pad + 0.5, barW - 1, barH - 1);

    ctx.fillStyle = '#f8fafc';
    ctx.font = '10px PressStart2P, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(
      'HP ' + Math.max(0, Math.ceil(hp)) + '/' + maxHp,
      pad + barW / 2,
      pad + barH / 2 + 1
    );

    const xpY = pad + barH + 8;
    const xpH = 16;
    const xpRatio = Math.max(0, Math.min(1, killsThisLevel / killsTarget));
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(pad, xpY, barW, xpH);
    ctx.fillStyle = CONFIG.colors.xpBar;
    ctx.fillRect(pad, xpY, barW * xpRatio, xpH);
    ctx.strokeStyle = '#f8fafc';
    ctx.strokeRect(pad + 0.5, xpY + 0.5, barW - 1, xpH - 1);

    ctx.fillStyle = '#f8fafc';
    ctx.font = '10px PressStart2P, monospace';
    ctx.fillText(
      'LV ' + level + '   ' + killsThisLevel + '/' + killsTarget,
      pad + barW / 2,
      xpY + xpH / 2 + 1
    );

    const mins = Math.floor(elapsed / 60);
    const secs = Math.floor(elapsed % 60);
    const time = String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');

    ctx.fillStyle = '#f8fafc';
    ctx.font = '10px PressStart2P, monospace';
    ctx.textAlign = 'right';
    ctx.fillText('KILLS ' + kills, CONFIG.canvas.width - pad, pad + barH / 2);
    ctx.fillText('COINS ' + coins, CONFIG.canvas.width - pad, pad + barH + 14);
    ctx.fillText(time, CONFIG.canvas.width - pad, pad + barH + 32);

    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
  }

  drawBossBar(
    ctx: CanvasRenderingContext2D,
    bossName: string,
    hp: number,
    maxHp: number
  ): void {
    const w = CONFIG.canvas.width;
    const barW = 480;
    const barH = 20;
    const x = (w - barW) / 2;
    const y = 56;
    const ratio = Math.max(0, Math.min(1, hp / maxHp));

    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fca5a5';
    ctx.font = '10px PressStart2P, monospace';
    ctx.fillText(bossName, w / 2, y - 14);

    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(x, y, barW, barH);
    const g = ctx.createLinearGradient(x, 0, x + barW, 0);
    g.addColorStop(0, '#7f1d1d');
    g.addColorStop(0.5, '#ef4444');
    g.addColorStop(1, '#b91c1c');
    ctx.fillStyle = g;
    ctx.fillRect(x, y, barW * ratio, barH);
    ctx.strokeStyle = '#f8fafc';
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, barW - 1, barH - 1);

    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
  }
}
