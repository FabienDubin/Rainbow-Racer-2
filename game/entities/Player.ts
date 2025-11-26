import { Entity } from './Entity'
import { GAME_CONFIG } from '@/lib/constants'

/**
 * JumpState - Tracks the player's vertical movement state
 */
export type JumpState = 'grounded' | 'jumping' | 'falling' | 'gliding'

/**
 * MovementDirection - Horizontal movement direction
 */
export type MovementDirection = 'left' | 'right' | 'none'

/**
 * Player - The controllable unicorn entity
 *
 * Handles horizontal movement (WASD/Arrow keys) and tracks jump state.
 * Currently rendered as a white rectangle; sprite will be added in future stories.
 */
export class Player extends Entity {
  // Jump/movement state
  public jumpState: JumpState
  public flapCount: number

  // Movement tracking
  private movementDirection: MovementDirection

  constructor(x: number, y: number) {
    super(x, y, GAME_CONFIG.PLAYER.WIDTH, GAME_CONFIG.PLAYER.HEIGHT)
    this.jumpState = 'grounded'
    this.flapCount = 0
    this.movementDirection = 'none'
  }

  /**
   * Handle horizontal movement input
   * Sets velocity based on direction; stops immediately when direction is 'none'
   */
  handleMovement(direction: MovementDirection): void {
    this.movementDirection = direction

    switch (direction) {
      case 'left':
        this.velocityX = -GAME_CONFIG.PLAYER.SPEED
        break
      case 'right':
        this.velocityX = GAME_CONFIG.PLAYER.SPEED
        break
      case 'none':
        // Stop immediately - no momentum (as per AC #2)
        this.velocityX = 0
        break
    }
  }

  /**
   * Called when player lands on ground or platform
   * Resets jump state and flap count
   */
  onLand(): void {
    this.jumpState = 'grounded'
    this.flapCount = 0
    this.velocityY = 0
  }

  /**
   * Check if player is on the ground
   */
  isGrounded(): boolean {
    return this.jumpState === 'grounded'
  }

  /**
   * Update player state each frame
   * Position integration is handled by PhysicsSystem
   */
  update(_deltaTime: number): void {
    // Update jump state based on vertical velocity
    if (!this.isGrounded()) {
      if (this.velocityY < 0) {
        this.jumpState = 'jumping'
      } else if (this.velocityY > 0) {
        this.jumpState = 'falling'
      }
    }
  }

  /**
   * Render the player as a white rectangle (temporary placeholder)
   * Will be replaced with sprite rendering in future stories
   */
  render(ctx: CanvasRenderingContext2D, cameraX: number, cameraY: number): void {
    if (!this.isActive) return

    // Calculate screen position (world position minus camera offset)
    const screenX = this.x - cameraX
    const screenY = this.y - cameraY

    // Draw white rectangle (64x64 as per AC #1)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(screenX, screenY, this.width, this.height)
  }
}
