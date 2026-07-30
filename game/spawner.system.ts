// Pattern-based procedural spawner. Handcrafted micro-patterns assembled randomly,
// weighted by difficulty — the Spelunky "chunks" idea applied to a flier.

import { GAME_HEIGHT, GAME_WIDTH } from "./constants";
import {
  WorldEntity,
  makeCloud,
  makeGem,
  makeHeart,
  makeRainbow,
  makeStar,
} from "./entities";
import { Biome } from "./constants";

const SPAWN_X = GAME_WIDTH + 140;
const MIN_Y = 80;
const MAX_Y = GAME_HEIGHT - 140;

function randY(margin = 0): number {
  return MIN_Y + margin + Math.random() * (MAX_Y - MIN_Y - margin * 2);
}

export class SpawnerSystem {
  private nextWaveIn = 1.2;
  private rainbowCooldown = 18; // seconds before first rainbow can appear
  private heartCooldown = 30;

  update(
    dt: number,
    difficulty: number, // 0..1 normalized progression
    biome: Biome,
    lives: number,
    out: WorldEntity[]
  ): void {
    this.nextWaveIn -= dt;
    this.rainbowCooldown -= dt;
    this.heartCooldown -= dt;
    if (this.nextWaveIn > 0) return;

    // Waves come faster as difficulty rises
    this.nextWaveIn = 1.7 - difficulty * 0.9 + Math.random() * 0.7;

    // Rare pickups get priority slots
    if (this.rainbowCooldown <= 0 && Math.random() < 0.35) {
      out.push(makeRainbow(SPAWN_X, randY(60)));
      this.rainbowCooldown = 22 + Math.random() * 14;
      return;
    }
    if (this.heartCooldown <= 0 && lives < 3 && Math.random() < 0.4) {
      out.push(makeHeart(SPAWN_X, randY(40)));
      this.heartCooldown = 25 + Math.random() * 15;
      return;
    }

    // 60% obstacle wave / 40% collectible wave, shifting harder with difficulty
    if (Math.random() < 0.42 + difficulty * 0.2) {
      this.spawnObstaclePattern(difficulty, biome, out);
    } else {
      this.spawnCollectiblePattern(out);
    }
  }

  private spawnObstaclePattern(difficulty: number, biome: Biome, out: WorldEntity[]): void {
    const roll = Math.random();

    // Gate wall: vertical cloud stack with a gap to thread (unlocked biome 2+)
    if (biome.gateWalls && roll < 0.28 + difficulty * 0.15) {
      const gapCenter = randY(120);
      const gapHalf = 130 - difficulty * 35; // gap shrinks as you get better
      for (let y = MIN_Y - 20; y < GAME_HEIGHT - 40; y += 95) {
        if (Math.abs(y - gapCenter) > gapHalf) {
          out.push(makeCloud(SPAWN_X + (Math.random() - 0.5) * 20, y, "straight", 0.85));
        }
      }
      // Reward inside the gap — thread the needle, get paid
      out.push(makeGem(SPAWN_X, gapCenter));
      return;
    }

    // Homing cloud (biome 3+): stalks the player's altitude
    if (biome.homingClouds && roll < 0.5) {
      out.push(makeCloud(SPAWN_X, randY(), "homing", 1.05));
      if (difficulty > 0.5) out.push(makeCloud(SPAWN_X + 260, randY(), "straight"));
      return;
    }

    // Sine pair (biome 2+): two weaving clouds
    if (biome.sineClouds && roll < 0.75) {
      out.push(makeCloud(SPAWN_X, randY(100), "sine"));
      if (difficulty > 0.3) out.push(makeCloud(SPAWN_X + 300, randY(100), "sine"));
      return;
    }

    // Default: 1-3 straight clouds at random altitudes
    const count = 1 + Math.floor(Math.random() * (1.6 + difficulty * 2));
    for (let i = 0; i < count; i++) {
      out.push(makeCloud(SPAWN_X + i * 180, randY(), "straight", 0.9 + Math.random() * 0.4));
    }
  }

  private spawnCollectiblePattern(out: WorldEntity[]): void {
    const roll = Math.random();
    const startY = randY(90);

    if (roll < 0.4) {
      // Sine wave line of gems — satisfying to sweep through
      for (let i = 0; i < 7; i++) {
        out.push(makeGem(SPAWN_X + i * 68, startY + Math.sin(i * 0.9) * 70));
      }
    } else if (roll < 0.7) {
      // Rising / falling arc of gems ending in a star
      const dir = Math.random() < 0.5 ? 1 : -1;
      for (let i = 0; i < 6; i++) {
        out.push(makeGem(SPAWN_X + i * 62, startY + dir * i * 34));
      }
      out.push(makeStar(SPAWN_X + 6 * 62, startY + dir * 6 * 34));
    } else if (roll < 0.88) {
      // Star cluster guarded by a cloud — the risk/reward bite
      out.push(makeStar(SPAWN_X, startY));
      out.push(makeStar(SPAWN_X + 70, startY - 50));
      out.push(makeStar(SPAWN_X + 70, startY + 50));
      out.push(makeCloud(SPAWN_X + 240, startY, "straight"));
    } else {
      // Vertical gem column: forces a deliberate climb or dive
      for (let i = 0; i < 5; i++) {
        out.push(makeGem(SPAWN_X, MIN_Y + 60 + i * 90));
      }
    }
  }
}
