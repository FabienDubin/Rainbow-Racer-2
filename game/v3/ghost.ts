// Your best run, replayed beside you as a translucent Prism.
//
// The weekly board tells you where you stand against other people once a week. This
// tells you where you stand against yourself, continuously, in the only currency the
// run actually deals in: how high you were at this exact second. A run that ends at
// 140m feels identical to one that ends at 138m — until you watch the better one pull
// away from you at the forty-second mark.
//
// Ported from the V2 recorder, with one change: V2 stored altitude alone, which was
// enough for a side-scroller where X is just time. Here the chimney means a ghost with
// no X would drift through walls of the world it never visited, so both are kept.

import { GHOST_SAMPLE_INTERVAL } from "./proto.constants";

const STORE_KEY = "rr3.ghost";

export interface GhostData {
  /** Metres reached — the yardstick for "is this run better than the stored one". */
  best: number;
  xs: number[];
  ys: number[];
}

export class GhostRecorder {
  private xs: number[] = [];
  private ys: number[] = [];
  private acc = 0;

  record(dt: number, x: number, y: number): void {
    this.acc += dt;
    while (this.acc >= GHOST_SAMPLE_INTERVAL) {
      this.acc -= GHOST_SAMPLE_INTERVAL;
      this.xs.push(Math.round(x));
      this.ys.push(Math.round(y));
    }
  }

  /** Keeps this run only if it beat the stored one. */
  saveIfBest(metres: number): void {
    const existing = loadGhost();
    if (existing && existing.best >= metres) return;
    if (this.ys.length < 8) return; // a run too short to be worth chasing
    try {
      localStorage.setItem(
        STORE_KEY,
        JSON.stringify({ best: metres, xs: this.xs, ys: this.ys })
      );
    } catch {
      // Storage full — the ghost is a bonus, never break the game over it
    }
  }
}

export function loadGhost(): GhostData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return null;
    const d = JSON.parse(raw) as GhostData;
    if (!Array.isArray(d.xs) || !Array.isArray(d.ys) || d.ys.length < 2) return null;
    return d;
  } catch {
    return null;
  }
}

export function clearGhost(): void {
  try {
    localStorage.removeItem(STORE_KEY);
  } catch {
    /* nothing to clean up */
  }
}

/** Where the ghost was at this point in the run, or null once its run had ended. */
export function ghostAt(g: GhostData, time: number): { x: number; y: number } | null {
  const idx = time / GHOST_SAMPLE_INTERVAL;
  const i = Math.floor(idx);
  if (i < 0 || i >= g.ys.length - 1) return null;
  const f = idx - i;
  return {
    x: g.xs[i] * (1 - f) + g.xs[i + 1] * f,
    y: g.ys[i] * (1 - f) + g.ys[i + 1] * f,
  };
}
