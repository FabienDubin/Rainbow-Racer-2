// Unified keyboard + pointer input. Exposes edge-triggered "pressed" flags
// (consumed once per frame) and level-triggered "held" flags.

export class InputManager {
  flapPressed = false;
  dashPressed = false;
  bombPressed = false;
  pausePressed = false;
  holdingGlide = false;

  private detachFns: (() => void)[] = [];

  attach(target: HTMLElement): void {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      switch (e.code) {
        case "Space":
        case "ArrowUp":
        case "KeyW":
          e.preventDefault();
          this.flapPressed = true;
          this.holdingGlide = true;
          break;
        case "ShiftLeft":
        case "ShiftRight":
        case "KeyD":
          this.dashPressed = true;
          break;
        case "KeyB":
        case "ArrowDown":
        case "KeyS":
          this.bombPressed = true;
          break;
        case "Escape":
        case "KeyP":
          this.pausePressed = true;
          break;
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (["Space", "ArrowUp", "KeyW"].includes(e.code)) this.holdingGlide = false;
    };

    // Touch / mouse: tap = flap+glide hold, two-finger tap = dash
    let lastTap = 0;
    const onPointerDown = (e: PointerEvent) => {
      e.preventDefault();
      const now = performance.now();
      if (now - lastTap < 260) {
        this.dashPressed = true; // double-tap = dash
      } else {
        this.flapPressed = true;
      }
      lastTap = now;
      this.holdingGlide = true;
    };
    const onPointerUp = () => {
      this.holdingGlide = false;
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    target.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointerup", onPointerUp);

    this.detachFns = [
      () => window.removeEventListener("keydown", onKeyDown),
      () => window.removeEventListener("keyup", onKeyUp),
      () => target.removeEventListener("pointerdown", onPointerDown),
      () => window.removeEventListener("pointerup", onPointerUp),
    ];
  }

  detach(): void {
    this.detachFns.forEach((fn) => fn());
    this.detachFns = [];
  }

  // Call at end of each frame: edge-triggered flags only live one frame
  clearFrame(): void {
    this.flapPressed = false;
    this.dashPressed = false;
    this.bombPressed = false;
    this.pausePressed = false;
  }
}
