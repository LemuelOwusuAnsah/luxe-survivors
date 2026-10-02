export class TouchInput {
  active: boolean;
  stickId: number;
  stickOriginX: number;
  stickOriginY: number;
  stickCurrentX: number;
  stickCurrentY: number;
  moveX: number;
  moveY: number;
  maxRadius: number;
  deadzone: number;
  tapThisFrame: boolean;
  tapX: number;
  tapY: number;
  private tappedId: number;

  constructor() {
    this.active = false;
    this.stickId = -1;
    this.stickOriginX = 0;
    this.stickOriginY = 0;
    this.stickCurrentX = 0;
    this.stickCurrentY = 0;
    this.moveX = 0;
    this.moveY = 0;
    this.maxRadius = 70;
    this.deadzone = 6;
    this.tapThisFrame = false;
    this.tapX = 0;
    this.tapY = 0;
    this.tappedId = -1;
  }

  attach(el: HTMLElement): void {
    el.addEventListener('touchstart', (e) => this.onStart(e), { passive: false });
    el.addEventListener('touchmove', (e) => this.onMove(e), { passive: false });
    el.addEventListener('touchend', (e) => this.onEnd(e), { passive: false });
    el.addEventListener('touchcancel', (e) => this.onEnd(e), { passive: false });
  }

  private onStart(e: TouchEvent): void {
    e.preventDefault();
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      const x = t.clientX - rect.left;
      const y = t.clientY - rect.top;
      const halfW = rect.width / 2;
      if (x < halfW && !this.active) {
        this.active = true;
        this.stickId = t.identifier;
        this.stickOriginX = x;
        this.stickOriginY = y;
        this.stickCurrentX = x;
        this.stickCurrentY = y;
        this.moveX = 0;
        this.moveY = 0;
      } else if (x >= halfW) {
        this.tappedId = t.identifier;
        this.tapX = x;
        this.tapY = y;
      }
    }
  }

  private onMove(e: TouchEvent): void {
    e.preventDefault();
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      if (t.identifier === this.stickId) {
        const x = t.clientX - rect.left;
        const y = t.clientY - rect.top;
        this.stickCurrentX = x;
        this.stickCurrentY = y;
        let dx = x - this.stickOriginX;
        let dy = y - this.stickOriginY;
        const len = Math.hypot(dx, dy);
        if (len > this.maxRadius) {
          dx = (dx / len) * this.maxRadius;
          dy = (dy / len) * this.maxRadius;
          this.stickCurrentX = this.stickOriginX + dx;
          this.stickCurrentY = this.stickOriginY + dy;
        }
        if (len < this.deadzone) {
          this.moveX = 0;
          this.moveY = 0;
        } else {
          this.moveX = dx / this.maxRadius;
          this.moveY = dy / this.maxRadius;
          const mlen = Math.hypot(this.moveX, this.moveY);
          if (mlen > 1) {
            this.moveX /= mlen;
            this.moveY /= mlen;
          }
        }
      }
    }
  }

  private onEnd(e: TouchEvent): void {
    e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      if (t.identifier === this.stickId) {
        this.active = false;
        this.stickId = -1;
        this.moveX = 0;
        this.moveY = 0;
      } else if (t.identifier === this.tappedId) {
        this.tapThisFrame = true;
        const rect = (e.target as HTMLElement).getBoundingClientRect();
        this.tapX = t.clientX - rect.left;
        this.tapY = t.clientY - rect.top;
        this.tappedId = -1;
      }
    }
  }

  getMoveVector(): { x: number; y: number } {
    return { x: this.moveX, y: this.moveY };
  }

  getStickState(): { active: boolean; ox: number; oy: number; cx: number; cy: number; r: number } {
    return {
      active: this.active,
      ox: this.stickOriginX,
      oy: this.stickOriginY,
      cx: this.stickCurrentX,
      cy: this.stickCurrentY,
      r: this.maxRadius,
    };
  }

  wasTapped(): boolean {
    return this.tapThisFrame;
  }

  endFrame(): void {
    this.tapThisFrame = false;
  }
}
