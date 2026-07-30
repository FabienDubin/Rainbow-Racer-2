// Ghost racing against your own best run: record altitude samples during a run,
// replay them as a translucent unicorn next time. Stored in localStorage.

import { GHOST_SAMPLE_INTERVAL } from "./constants";

const STORAGE_KEY = "rr2.bestGhost";

export interface GhostData {
  score: number;
  samples: number[]; // player Y at fixed intervals
}

export class GhostRecorder {
  private samples: number[] = [];
  private accumulator = 0;

  reset(): void {
    this.samples = [];
    this.accumulator = 0;
  }

  record(dt: number, y: number): void {
    this.accumulator += dt;
    while (this.accumulator >= GHOST_SAMPLE_INTERVAL) {
      this.accumulator -= GHOST_SAMPLE_INTERVAL;
      this.samples.push(Math.round(y));
    }
  }

  // Persist as the new best ghost if this run beat the stored score
  saveIfBest(score: number): void {
    const existing = loadGhost();
    if (existing && existing.score >= score) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ score, samples: this.samples }));
    } catch {
      // localStorage full or unavailable — ghost is a bonus, never break the game
    }
  }
}

export function loadGhost(): GhostData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as GhostData;
    if (!Array.isArray(data.samples) || typeof data.score !== "number") return null;
    return data;
  } catch {
    return null;
  }
}

// Interpolated ghost altitude at a given run time; null when the ghost run ended
export function ghostYAt(ghost: GhostData, time: number): number | null {
  const idx = time / GHOST_SAMPLE_INTERVAL;
  const i = Math.floor(idx);
  if (i >= ghost.samples.length - 1) return null;
  const t = idx - i;
  return ghost.samples[i] * (1 - t) + ghost.samples[i + 1] * t;
}
