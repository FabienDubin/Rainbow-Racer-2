// World entities: enemy clouds, collectibles. Plain objects updated/drawn by the engine.

import { GAME_HEIGHT } from "./constants";
import { ImageKey } from "./assets.manager";

export type EntityKind = "cloud" | "gem" | "star" | "rainbow" | "heart";

export type CloudBehavior = "straight" | "sine" | "homing";

export interface WorldEntity {
  kind: EntityKind;
  x: number;
  y: number;
  width: number;
  height: number;
  image: ImageKey;
  // Movement
  behavior: CloudBehavior;
  baseY: number;
  phase: number; // sine phase / generic timer
  vy: number;
  speedFactor: number; // multiplies world speed
  // State
  dead: boolean;
  nearMissAwarded: boolean;
  magnetized: boolean;
  wobble: number;
}

const GEM_IMAGES: ImageKey[] = ["gemGreen", "gemPink", "gemPurple", "gemYellow"];
const STAR_IMAGES: ImageKey[] = ["starYellow", "starPink", "starGreen", "starPurple"];

function base(kind: EntityKind, x: number, y: number, w: number, h: number, image: ImageKey): WorldEntity {
  return {
    kind, x, y, width: w, height: h, image,
    behavior: "straight", baseY: y, phase: Math.random() * Math.PI * 2,
    vy: 0, speedFactor: 1, dead: false, nearMissAwarded: false,
    magnetized: false, wobble: Math.random() * Math.PI * 2,
  };
}

export function makeCloud(x: number, y: number, behavior: CloudBehavior, sizeScale = 1): WorldEntity {
  const e = base("cloud", x, y, 120 * sizeScale, 78 * sizeScale, "cloud");
  e.behavior = behavior;
  e.speedFactor = behavior === "homing" ? 1.15 : 1 + Math.random() * 0.25;
  return e;
}

export function makeGem(x: number, y: number): WorldEntity {
  return base("gem", x, y, 42, 42, GEM_IMAGES[Math.floor(Math.random() * GEM_IMAGES.length)]);
}

export function makeStar(x: number, y: number): WorldEntity {
  return base("star", x, y, 52, 52, STAR_IMAGES[Math.floor(Math.random() * STAR_IMAGES.length)]);
}

export function makeRainbow(x: number, y: number): WorldEntity {
  return base("rainbow", x, y, 110, 78, "rainbow");
}

export function makeHeart(x: number, y: number): WorldEntity {
  return base("heart", x, y, 46, 42, "life");
}

export function updateEntity(
  e: WorldEntity,
  dt: number,
  worldSpeed: number,
  playerX: number,
  playerY: number,
  magnetActive: boolean
): void {
  e.x -= worldSpeed * e.speedFactor * dt;
  e.phase += dt;
  e.wobble += dt * 3;

  if (e.kind === "cloud") {
    if (e.behavior === "sine") {
      e.y = e.baseY + Math.sin(e.phase * 2.2) * 90;
    } else if (e.behavior === "homing") {
      // Drift gently toward the player's altitude — menacing but dodgeable
      const dy = playerY - e.y;
      e.y += Math.sign(dy) * Math.min(Math.abs(dy), 110 * dt);
    }
  } else {
    // Collectibles bob softly; fly to the player when magnetized (Rainbow Rush)
    if (magnetActive && e.kind !== "heart") {
      const dx = playerX - e.x;
      const dy = playerY - e.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 320) e.magnetized = true;
    }
    if (e.magnetized) {
      const dx = playerX - e.x;
      const dy = playerY - e.y;
      const dist = Math.max(Math.hypot(dx, dy), 1);
      e.x += (dx / dist) * 780 * dt;
      e.y += (dy / dist) * 780 * dt;
    } else {
      e.y = e.baseY + Math.sin(e.wobble) * 8;
    }
  }

  // Clamp inside vertical play area
  e.y = Math.max(30, Math.min(GAME_HEIGHT - 60, e.y));
  if (e.x < -220) e.dead = true;
}
