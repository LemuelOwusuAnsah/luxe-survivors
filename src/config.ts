export const CONFIG = {
  canvas: {
    width: 960,
    height: 540,
    targetFps: 60,
  },
  world: {
    tileSize: 32,
    gridWidth: 64,
    gridHeight: 64,
  },
  player: {
    radius: 12,
    speed: 180,
    maxHp: 100,
    invulnMs: 500,
  },
  camera: {
    lerp: 0.12,
    mouseOffset: 0.15,
  },
  colors: {
    bg: '#10131a',
    grid: '#1b2030',
    player: '#6ee7ff',
    playerOutline: '#0ea5e9',
    enemy: '#f87171',
    enemyOutline: '#b91c1c',
    projectile: '#fde68a',
    xp: '#a3e635',
    text: '#f8fafc',
    shadow: 'rgba(0,0,0,0.35)',
  },
  debug: {
    showFps: true,
    showHitboxes: false,
  },
} as const;

export type Config = typeof CONFIG;
