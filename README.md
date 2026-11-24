# Luxe Survivors

A browser survival game built with TypeScript, Canvas, and Vite. No game engine.

## Live

https://lemuelowusuansah.github.io/luxe-survivors/

## Features

- Top-down survival gameplay on HTML5 Canvas
- Upgrade system with pickups (fire rate, damage, max HP, multishot, speed, pickup radius)
- Scene system: menu, game, game-over
- Entity and system architecture — no engine, no framework
- Runs at 60 FPS in the browser

## Run locally

    npm install
    npm run dev

Then open http://localhost:5173.

## Build

    npm run build

Output: dist/

## Stack

- TypeScript
- Vite
- Canvas 2D

## Project structure

- `src/engine/` — core loop, input, rendering
- `src/entities/` — player, enemies, projectiles, pickups
- `src/scenes/` — menu, gameplay, game-over
- `src/systems/` — collision, spawning, upgrades
- `src/ui/` — HUD and overlays
- `src/data/` — configs and tuning
