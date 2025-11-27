import { Entity } from '../entities/Entity'
import { Player } from '../entities/Player'
import { GAME_CONFIG } from '@/lib/constants'

/**
 * PhysicsSystem - Handles gravity and velocity integration
 *
 * Applies gravity to entities not on the ground and integrates
 * velocity to update positions each frame.
 * Uses deltaTime for framerate-independent physics.
 * Supports variable jump height through gravity multiplier.
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
   * @param isSpaceHeld Whether Space key is currently held (for variable jump height)
   */
  update(deltaTime: number, entities: Entity[], isSpaceHeld: boolean = false): void {
    // Scale factor: convert frame-based values to time-based
    // At 60 FPS, deltaTime ≈ 0.0167s, so we multiply by 60 to get frame-equivalent
    const frameScale = deltaTime * GAME_CONFIG.TARGET_FPS

    for (const entity of entities) {
      if (!entity.isActive) continue

      // Apply gravity to non-grounded entities
      if (entity instanceof Player) {
        if (!entity.isGrounded()) {
          // Calculate gravity multiplier based on jump state and input
          // Reduced gravity when:
          // - Player is in 'jumping' state (ascending) AND Space is held AND still going up
          // - Player is in 'gliding' state (reduced to 30%)
          let gravityMultiplier = 1.0

          if (entity.jumpState === 'gliding') {
            // Gliding: significantly reduced gravity
            gravityMultiplier = GAME_CONFIG.PLAYER.GLIDE_GRAVITY_MULT
          } else if (
            entity.jumpState === 'jumping' &&
            isSpaceHeld &&
            entity.velocityY < 0
          ) {
            // Variable jump height: hold Space for higher jump
            gravityMultiplier = GAME_CONFIG.PLAYER.GRAVITY_MULTIPLIER_JUMPING
          }

          // Apply gravity with multiplier
          entity.velocityY += this.gravity * gravityMultiplier * frameScale

          // Cap fall speed when gliding
          if (entity.jumpState === 'gliding') {
            // GLIDE_FALL_SPEED is negative, so negate it to get max positive velocityY
            const maxFallSpeed = -GAME_CONFIG.PLAYER.GLIDE_FALL_SPEED
            if (entity.velocityY > maxFallSpeed) {
              entity.velocityY = maxFallSpeed
            }
          }
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
