// Central tuning file — every gameplay value lives here so balancing is one-file work.

export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;

// ---- Player physics (px, px/s, px/s²) ----
export const PLAYER_X = 260;
export const GRAVITY = 2300;
export const FLAP_IMPULSE = -640;
export const MAX_FALL_SPEED = 950;
export const GLIDE_GRAVITY_FACTOR = 0.18;
export const GLIDE_MAX_FALL = 130;
export const PLAYER_HITBOX_SCALE = 0.62; // forgiving hitbox = feels fair

// ---- Dash ----
export const DASH_DURATION = 0.28;
export const DASH_COOLDOWN = 1.1;
export const DASH_SPEED_BONUS = 620; // extra world speed while dashing
export const DASH_IFRAMES = 0.45;

// ---- World / difficulty ----
export const BASE_WORLD_SPEED = 330;
export const MAX_WORLD_SPEED = 760;
export const SPEED_RAMP_PER_SEC = 4.2; // world speed gained per second
export const PX_PER_METER = 42;

// ---- Combat / lives ----
export const START_LIVES = 3;
export const MAX_LIVES = 5;
export const HIT_IFRAMES = 1.6;

// ---- Score ----
export const GEM_POINTS = 10;
export const STAR_POINTS = 30;
export const NEAR_MISS_POINTS = 8;
export const CLOUD_BOMB_POINTS = 50;
export const COMBO_PER_MULTIPLIER = 6; // combo steps needed per +1 multiplier
export const MAX_MULTIPLIER = 8;

// ---- Rainbow Rush (fever mode) ----
export const RUSH_DURATION = 7.5;
export const RUSH_SPEED_FACTOR = 1.35;
export const RUSH_SCORE_FACTOR = 2;
export const MAGNET_RADIUS = 260;

// ---- Cacalicorne Bomb ----
export const BOMB_GEMS_REQUIRED = 25;
export const BOMB_MAX_CHARGES = 2;

// ---- Ghost ----
export const GHOST_SAMPLE_INTERVAL = 0.08; // seconds between recorded frames

// ---- Biomes: the world mutates with distance to kill repetitiveness ----
export interface Biome {
  name: string;
  skyTop: string;
  skyBottom: string;
  hillColor: string;
  cloudTint: string;
  ambientStars: boolean;
  // Enemy behaviour flags unlocked in this biome
  sineClouds: boolean;
  homingClouds: boolean;
  gateWalls: boolean;
}

export const BIOMES: Biome[] = [
  {
    name: "Crystal Cloudscape",
    skyTop: "#8ec5fc",
    skyBottom: "#e0c3fc",
    hillColor: "#c9a7eb",
    cloudTint: "rgba(255,255,255,0.9)",
    ambientStars: false,
    sineClouds: false,
    homingClouds: false,
    gateWalls: false,
  },
  {
    name: "Sunset Drift",
    skyTop: "#fda085",
    skyBottom: "#f6d365",
    hillColor: "#e8927c",
    cloudTint: "rgba(255,240,230,0.9)",
    ambientStars: false,
    sineClouds: true,
    homingClouds: false,
    gateWalls: true,
  },
  {
    name: "Neon Abyss",
    skyTop: "#0f0c29",
    skyBottom: "#4b2d84",
    hillColor: "#2b1b5e",
    cloudTint: "rgba(160,160,255,0.85)",
    ambientStars: true,
    sineClouds: true,
    homingClouds: true,
    gateWalls: true,
  },
  {
    name: "Stardust Sanctuary",
    skyTop: "#000428",
    skyBottom: "#004e92",
    hillColor: "#0b2d5e",
    cloudTint: "rgba(190,220,255,0.8)",
    ambientStars: true,
    sineClouds: true,
    homingClouds: true,
    gateWalls: true,
  },
];

export const BIOME_LENGTH_M = 600; // metres per biome before switching
