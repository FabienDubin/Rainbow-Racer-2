/**
 * Game Configuration Constants
 * All game-related constants are centralized here for easy tuning.
 * These values are defined as `const` to ensure type safety and immutability.
 */

export const GAME_CONFIG = {
  // Canvas settings
  CANVAS_WIDTH: 1920,
  CANVAS_HEIGHT: 1080,
  TARGET_FPS: 60,

  // Physics
  GRAVITY: 0.8,

  // Player settings
  PLAYER: {
    WIDTH: 64,
    HEIGHT: 64,
    SPEED: 5,                    // Horizontal movement speed (pixels/frame)
    JUMP_FORCE: -12,             // Initial jump velocity (negative = up)
    FLAP_FORCE: -15,             // Flap boost velocity (stronger than jump)
    GLIDE_FALL_SPEED: -2,        // Max fall speed during glide
    GLIDE_GRAVITY_MULT: 0.3,     // Gravity multiplier when gliding
    GLIDE_HORIZONTAL_MULT: 1.3,  // Horizontal speed multiplier when gliding
    DASH_SPEED: 20,              // Dash velocity
    DASH_DURATION: 200,          // Dash duration in milliseconds
    DASH_COOLDOWN: 1000,         // Dash cooldown in milliseconds
  },

  // Particle system
  PARTICLES: {
    MAX_COUNT: 500,              // Maximum active particles at once
    POOL_SIZE: 500,              // Pre-allocated particle pool size
  },

  // Camera settings
  CAMERA: {
    LERP_FACTOR: 0.1,            // Smooth follow speed (0-1, higher = faster)
  },

  // Colors - Crystal Cloudscape biome palette
  COLORS: {
    BACKGROUND_DEEP: '#1a1a2e',  // Deep purple background
    BACKGROUND_MID: '#16213e',   // Mid blue
    BACKGROUND_LIGHT: '#0f3460', // Light blue
    PLATFORM: '#533483',         // Purple platforms
    ACCENT_DANGER: '#e94560',    // Pink/red for danger
    ACCENT_GOLD: '#f9ed69',      // Gold for collectibles
  },
} as const

// Type for the entire game config
export type GameConfig = typeof GAME_CONFIG
