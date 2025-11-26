import { Entity } from '../entities/Entity'
import { Player } from '../entities/Player'
import { GAME_CONFIG } from '@/lib/constants'

/**
 * PhysicsSystem - Handles gravity and velocity integration
 *
 * Applies gravity to entities not on the ground and integrates
 * velocity to update positions each frame.
 * Uses deltaTime for framerate-independent physics.
 */
export class PhysicsSystem {
  // Gravity constant (pixels per frame squared, scaled by deltaTime)
  private gravity: number

  constructor() {
    this.gravity = GAME_CONFIG.GRAVITY
  }

  /**
   * Update physics for all entities
   * @param deltaTime Time elapsed since last frame in seconds
   * @param entities Array of entities to update
   */
  update(deltaTime: number, entities: Entity[]): void {
    // Scale factor: convert frame-based values to time-based
    // At 60 FPS, deltaTime ≈ 0.0167s, so we multiply by 60 to get frame-equivalent
    const frameScale = deltaTime * GAME_CONFIG.TARGET_FPS

    for (const entity of entities) {
      if (!entity.isActive) continue

      // Apply gravity to non-grounded entities
      if (entity instanceof Player) {
        if (!entity.isGrounded()) {
          // Gravity increases downward velocity each frame
          entity.velocityY += this.gravity * frameScale
        }
      } else {
        // For non-player entities, always apply gravity
        entity.velocityY += this.gravity * frameScale
      }

      // Integrate velocity into position
      // velocity is in pixels/frame, scale by deltaTime for smooth movement
      entity.x += entity.velocityX * frameScale
      entity.y += entity.velocityY * frameScale
    }
  }
}
