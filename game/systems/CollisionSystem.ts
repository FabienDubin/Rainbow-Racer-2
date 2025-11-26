import { Player } from '../entities/Player'

/**
 * CollisionSystem - Handles collision detection and resolution
 *
 * Currently handles:
 * - Ground collision (bottom of canvas)
 * - Left/right boundary collision (canvas edges)
 *
 * Future stories will add platform and obstacle collisions.
 */
export class CollisionSystem {
  private canvasWidth: number
  private canvasHeight: number

  constructor(canvasWidth: number, canvasHeight: number) {
    this.canvasWidth = canvasWidth
    this.canvasHeight = canvasHeight
  }

  /**
   * Update canvas dimensions (for responsive resizing)
   */
  setCanvasSize(width: number, height: number): void {
    this.canvasWidth = width
    this.canvasHeight = height
  }

  /**
   * Check and resolve collisions for the player
   */
  update(player: Player): void {
    this.checkGroundCollision(player)
    this.checkBoundaryCollision(player)
  }

  /**
   * Check collision with ground (bottom of canvas)
   * Calls player.onLand() when landing
   */
  private checkGroundCollision(player: Player): void {
    const groundY = this.canvasHeight - player.height

    // Player is at or below ground level
    if (player.y >= groundY) {
      // Clamp to ground
      player.y = groundY

      // Only call onLand if player was falling (not already grounded)
      if (!player.isGrounded() && player.velocityY >= 0) {
        player.onLand()
      }
    }
  }

  /**
   * Check collision with left/right canvas boundaries
   * Prevents player from leaving the screen
   */
  private checkBoundaryCollision(player: Player): void {
    // Left boundary
    if (player.x < 0) {
      player.x = 0
      player.velocityX = 0
    }

    // Right boundary
    const maxX = this.canvasWidth - player.width
    if (player.x > maxX) {
      player.x = maxX
      player.velocityX = 0
    }
  }
}
