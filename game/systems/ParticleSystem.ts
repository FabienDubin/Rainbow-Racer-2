import { Particle } from '../entities/Particle'
import { ObjectPool } from '../utils/ObjectPool'
import { GAME_CONFIG } from '@/lib/constants'

/**
 * ParticleSystem - Manages particle effects with object pooling
 *
 * Spawns, updates, and renders particles efficiently using
 * an object pool to avoid garbage collection during gameplay.
 */
export class ParticleSystem {
  // Object pool for particles
  private pool: ObjectPool<Particle>

  constructor() {
    // Create pool with factory function
    this.pool = new ObjectPool<Particle>(
      () => new Particle(),
      GAME_CONFIG.PARTICLES.POOL_SIZE,
      GAME_CONFIG.PARTICLES.MAX_COUNT
    )
  }

  /**
   * Spawn dust particles at a position
   * Used when player jumps from the ground
   * @param x X position (typically player center)
   * @param y Y position (typically player feet)
   * @param count Number of particles to spawn
   * @param playerVelocityX Player's horizontal velocity (particles go opposite direction)
   */
  spawnDustParticles(x: number, y: number, count: number, playerVelocityX: number = 0): void {
    const { DUST_LIFETIME, DUST_SPEED_MIN, DUST_SPEED_MAX } = GAME_CONFIG.PARTICLES

    for (let i = 0; i < count; i++) {
      const particle = this.pool.acquire()
      if (!particle) break // Pool exhausted

      // Base angle pointing upward (270° = straight up)
      // Bias based on player movement: particles go opposite to movement direction
      const baseAngle = Math.PI * 1.5
      const spreadAngle = Math.PI * 0.4

      // Add directional bias based on player velocity (opposite direction)
      const directionBias = playerVelocityX !== 0
        ? -Math.sign(playerVelocityX) * Math.PI * 0.3 // Bias 54° opposite to movement
        : 0

      const angle = baseAngle + directionBias + (Math.random() - 0.5) * spreadAngle
      const speed = DUST_SPEED_MIN + Math.random() * (DUST_SPEED_MAX - DUST_SPEED_MIN)
      const velocityX = Math.cos(angle) * speed
      const velocityY = Math.sin(angle) * speed

      // Slight position variation
      const offsetX = (Math.random() - 0.5) * 20
      const offsetY = Math.random() * 5

      // Dust color (light tan/brown)
      const dustColors = ['#d4c4a8', '#c9b896', '#bfae87', '#e0d5c1']
      const color = dustColors[Math.floor(Math.random() * dustColors.length)]

      // Random size
      const size = 3 + Math.random() * 4

      particle.init(
        x + offsetX,
        y + offsetY,
        velocityX,
        velocityY,
        color,
        DUST_LIFETIME + Math.random() * 0.1, // Slight lifetime variation
        size,
        0.3 // Light gravity for dust
      )
    }
  }

  /**
   * Spawn feather particles for flap effect
   * Radial dispersion with rainbow colors and longer lifetime
   * @param x X position (center of player)
   * @param y Y position (center of player)
   * @param count Number of particles (8-12 typically)
   */
  spawnFeatherParticles(x: number, y: number, count: number): void {
    const { FEATHER_LIFETIME, FEATHER_SIZE, FEATHER_SPEED_MIN, FEATHER_SPEED_MAX } = GAME_CONFIG.PARTICLES

    // Rainbow colors for unicorn theme
    const rainbowColors = [
      '#ff6b6b', // Red
      '#ffa502', // Orange
      '#ffd93d', // Yellow
      '#6bcb77', // Green
      '#4d96ff', // Blue
      '#6f42c1', // Indigo
      '#cc65fe', // Violet
      '#ff85a1', // Pink
      '#00d4ff', // Cyan
    ]

    for (let i = 0; i < count; i++) {
      const particle = this.pool.acquire()
      if (!particle) break // Pool exhausted

      // Radial dispersion: particles go in all directions
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5
      const speed = FEATHER_SPEED_MIN + Math.random() * (FEATHER_SPEED_MAX - FEATHER_SPEED_MIN)
      const velocityX = Math.cos(angle) * speed
      const velocityY = Math.sin(angle) * speed

      // Random rainbow color
      const color = rainbowColors[Math.floor(Math.random() * rainbowColors.length)]

      // Random size within range (4-8 pixels)
      const size = FEATHER_SIZE - 2 + Math.random() * 4

      // Lifetime with slight variation (0.5-1s as per AC)
      const lifetime = FEATHER_LIFETIME + (Math.random() - 0.5) * 0.4

      particle.init(
        x,
        y,
        velocityX,
        velocityY,
        color,
        lifetime,
        size,
        0.2 // Light gravity so feathers float
      )
    }
  }

  /**
   * Spawn sparkle particles (for collectibles, power-ups)
   * @param x X position
   * @param y Y position
   * @param count Number of particles
   * @param color Particle color
   */
  spawnSparkles(x: number, y: number, count: number, color: string = '#f9ed69'): void {
    for (let i = 0; i < count; i++) {
      const particle = this.pool.acquire()
      if (!particle) break

      // Random direction
      const angle = Math.random() * Math.PI * 2
      const speed = 30 + Math.random() * 50
      const velocityX = Math.cos(angle) * speed
      const velocityY = Math.sin(angle) * speed

      particle.init(
        x,
        y,
        velocityX,
        velocityY,
        color,
        0.4 + Math.random() * 0.2,
        2 + Math.random() * 3,
        0
      )
    }
  }

  /**
   * Update all active particles
   * @param deltaTime Time elapsed since last frame in seconds
   */
  update(deltaTime: number): void {
    this.pool.update(deltaTime, (particle, dt) => {
      particle.update(dt)
    })
  }

  /**
   * Render all active particles
   * @param ctx Canvas 2D context
   * @param cameraX Camera X offset
   * @param cameraY Camera Y offset
   */
  render(ctx: CanvasRenderingContext2D, cameraX: number, cameraY: number): void {
    const activeParticles = this.pool.getActive()

    for (const particle of activeParticles) {
      particle.render(ctx, cameraX, cameraY)
    }
  }

  /**
   * Get current active particle count
   */
  getActiveCount(): number {
    return this.pool.getActiveCount()
  }

  /**
   * Clear all particles
   */
  clear(): void {
    this.pool.clear()
  }
}
