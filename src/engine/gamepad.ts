export class GamepadInput {
  private pressedThisFrame: Set<number>;
  private heldThisFrame: Set<number>;
  private stickLeftWas: boolean;
  private stickRightWas: boolean;
  private stickUpWas: boolean;
  private stickDownWas: boolean;
  moveX: number;
  moveY: number;
  connected: boolean;
  lastButtonPressed: number;
  private pressedStickDirs: Set<string>;

  constructor() {
    this.pressedThisFrame = new Set();
    this.heldThisFrame = new Set();
    this.stickLeftWas = false;
    this.stickRightWas = false;
    this.stickUpWas = false;
    this.stickDownWas = false;
    this.moveX = 0;
    this.moveY = 0;
    this.connected = false;
    this.lastButtonPressed = -1;
    this.pressedStickDirs = new Set();
    window.addEventListener('gamepadconnected', () => {
      this.connected = true;
    });
    window.addEventListener('gamepaddisconnected', () => {
      this.connected = false;
    });
  }

  poll(): void {
    this.pressedThisFrame.clear();
    this.pressedStickDirs.clear();
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    let pad: Gamepad | null = null;
    for (const p of pads) {
      if (p && p.connected) {
        pad = p;
        break;
      }
    }
    if (!pad) {
      this.connected = false;
      this.moveX = 0;
      this.moveY = 0;
      this.heldThisFrame.clear();
      this.stickLeftWas = false;
      this.stickRightWas = false;
      this.stickUpWas = false;
      this.stickDownWas = false;
      return;
    }
    this.connected = true;

    const dz = 0.22;
    let ax = pad.axes[0] ?? 0;
    let ay = pad.axes[1] ?? 0;
    if (Math.abs(ax) < dz) ax = 0;
    if (Math.abs(ay) < dz) ay = 0;

    const stickPressThreshold = 0.55;
    const stickLeftNow = ax <= -stickPressThreshold;
    const stickRightNow = ax >= stickPressThreshold;
    const stickUpNow = ay <= -stickPressThreshold;
    const stickDownNow = ay >= stickPressThreshold;

    if (stickLeftNow && !this.stickLeftWas) this.pressedStickDirs.add('left');
    if (stickRightNow && !this.stickRightWas) this.pressedStickDirs.add('right');
    if (stickUpNow && !this.stickUpWas) this.pressedStickDirs.add('up');
    if (stickDownNow && !this.stickDownWas) this.pressedStickDirs.add('down');

    this.stickLeftWas = stickLeftNow;
    this.stickRightWas = stickRightNow;
    this.stickUpWas = stickUpNow;
    this.stickDownWas = stickDownNow;

    const dpadUp = pad.buttons[12]?.pressed ?? false;
    const dpadDown = pad.buttons[13]?.pressed ?? false;
    const dpadLeft = pad.buttons[14]?.pressed ?? false;
    const dpadRight = pad.buttons[15]?.pressed ?? false;
    if (dpadLeft) ax = -1;
    if (dpadRight) ax = 1;
    if (dpadUp) ay = -1;
    if (dpadDown) ay = 1;

    const len = Math.hypot(ax, ay);
    if (len > 1) {
      ax /= len;
      ay /= len;
    }
    this.moveX = ax;
    this.moveY = ay;

    const nowHeld = new Set<number>();
    for (let i = 0; i < pad.buttons.length; i++) {
      if (pad.buttons[i].pressed) {
        nowHeld.add(i);
        if (!this.heldThisFrame.has(i)) {
          this.pressedThisFrame.add(i);
          this.lastButtonPressed = i;
        }
      }
    }
    this.heldThisFrame = nowHeld;
  }

  isDown(button: number): boolean {
    return this.heldThisFrame.has(button);
  }

  wasPressed(button: number): boolean {
    return this.pressedThisFrame.has(button);
  }

  wasStickPressed(dir: 'left' | 'right' | 'up' | 'down'): boolean {
    return this.pressedStickDirs.has(dir);
  }

  getMoveVector(): { x: number; y: number } {
    return { x: this.moveX, y: this.moveY };
  }
}

export const PAD = {
  A: 0,
  B: 1,
  X: 2,
  Y: 3,
  LB: 4,
  RB: 5,
  LT: 6,
  RT: 7,
  SELECT: 8,
  START: 9,
  L3: 10,
  R3: 11,
  DPAD_UP: 12,
  DPAD_DOWN: 13,
  DPAD_LEFT: 14,
  DPAD_RIGHT: 15,
} as const;
