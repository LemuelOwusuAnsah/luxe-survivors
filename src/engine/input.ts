import { GamepadInput, PAD } from './gamepad';

export class Input {
  private keys: Set<string>;
  private pressedThisFrame: Set<string>;
  mouseX: number;
  mouseY: number;
  private clickedThisFrame: boolean;
  private pad: GamepadInput;

  constructor() {
    this.keys = new Set();
    this.pressedThisFrame = new Set();
    this.mouseX = 0;
    this.mouseY = 0;
    this.clickedThisFrame = false;
    this.pad = new GamepadInput();
    window.addEventListener('keydown', (e) => {
      if (!this.keys.has(e.code)) this.pressedThisFrame.add(e.code);
      this.keys.add(e.code);
      if (
        e.code === 'ArrowUp' ||
        e.code === 'ArrowDown' ||
        e.code === 'ArrowLeft' ||
        e.code === 'ArrowRight' ||
        e.code === 'Space'
      ) {
        e.preventDefault();
      }
    });
    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.code);
    });
    window.addEventListener('blur', () => {
      this.keys.clear();
    });
    window.addEventListener('mousemove', (e) => {
      this.mouseX = e.clientX;
      this.mouseY = e.clientY;
    });
    window.addEventListener('mousedown', () => {
      this.clickedThisFrame = true;
    });
  }

  poll(): void {
    this.pad.poll();
  }

  padActive(): boolean {
    if (!this.pad.connected) return false;
    const mv = this.pad.getMoveVector();
    if (Math.abs(mv.x) > 0.1 || Math.abs(mv.y) > 0.1) return true;
    if (this.pad.lastButtonPressed >= 0) return true;
    return false;
  }

  isDown(code: string): boolean {
    if (this.keys.has(code)) return true;
    const btn = this.mapPad(code);
    if (btn >= 0 && this.pad.isDown(btn)) return true;
    return false;
  }

  wasPressed(code: string): boolean {
    if (this.pressedThisFrame.has(code)) return true;
    const btn = this.mapPad(code);
    if (btn >= 0 && this.pad.wasPressed(btn)) return true;
    if (code === 'ArrowLeft' || code === 'KeyA') return this.pad.wasStickPressed('left');
    if (code === 'ArrowRight' || code === 'KeyD') return this.pad.wasStickPressed('right');
    if (code === 'ArrowUp' || code === 'KeyW') return this.pad.wasStickPressed('up');
    if (code === 'ArrowDown' || code === 'KeyS') return this.pad.wasStickPressed('down');
    return false;
  }

  wasClicked(): boolean {
    if (this.clickedThisFrame) return true;
    if (this.pad.wasPressed(PAD.A)) return true;
    if (this.pad.wasPressed(PAD.START)) return true;
    return false;
  }

  private mapPad(code: string): number {
    switch (code) {
      case 'KeyA':
      case 'ArrowLeft':
        return PAD.DPAD_LEFT;
      case 'KeyD':
      case 'ArrowRight':
        return PAD.DPAD_RIGHT;
      case 'KeyW':
      case 'ArrowUp':
        return PAD.DPAD_UP;
      case 'KeyS':
      case 'ArrowDown':
        return PAD.DPAD_DOWN;
      case 'Enter':
      case 'Space':
        return PAD.A;
      case 'Escape':
      case 'KeyP':
        return PAD.START;
      case 'KeyM':
        return PAD.SELECT;
      case 'KeyX':
        return PAD.X;
      case 'KeyO':
        return PAD.B;
      default:
        return -1;
    }
  }

  getMoveVector(): { x: number; y: number } {
    let x = 0;
    let y = 0;
    if (this.isDown('KeyA') || this.isDown('ArrowLeft')) x -= 1;
    if (this.isDown('KeyD') || this.isDown('ArrowRight')) x += 1;
    if (this.isDown('KeyW') || this.isDown('ArrowUp')) y -= 1;
    if (this.isDown('KeyS') || this.isDown('ArrowDown')) y += 1;

    const padMove = this.pad.getMoveVector();
    x += padMove.x;
    y += padMove.y;

    const len = Math.hypot(x, y);
    if (len > 1) {
      x /= len;
      y /= len;
    }
    return { x, y };
  }

  endFrame(): void {
    this.pressedThisFrame.clear();
    this.clickedThisFrame = false;
  }
}
