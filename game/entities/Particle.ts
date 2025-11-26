import { Poolable } from '../utils/ObjectPool'

/**
 * Particle - Simple particle entity for visual effects
 *
 * Implements Poolable for efficient object pooling.
 * Used for dust effects, sparkles, explosions, etc.
 */
export class Particle implements Poolable {
  // Position
  public x: number = 0
  public y: number = 0

  // Velocity
  public velocityX: number = 0
  public velocityY: number = 0

  // Visual properties
  public color: string = '#ffffff'
  public size: number = 4
  public alpha: number = 1

  // Lifetime tracking
  public lifetime: number = 0
  public age: number = 0

  // Poolable interface
  public isActive: boolean = false

  // Gravity effect (optional)
  public gravity: number = 0

  /**
   * Initialize the particle with specific properties
   * Called after acquiring from pool
   */
  init(
    x: number,
    y: number,
    velocityX: number,
    velocityY: number,
    color: string,
    lifetime: number,
    size: number = 4,
    gravity: number = 0
  ): void {
    this.x = x
    this.y = y
    this.velocityX = velocityX
    this.velocityY = velocityY
    this.color = color
    this.lifetime = lifetime
    this.size = size
    this.gravity = gravity
    this.age = 0
    this.alpha = 1
    this.isActive = true
  }

  /**
   * Reset particle state for reuse
   * Called when particle is returned to pool
   */
  reset(): void {
    this.x = 0
    this.y = 0
    this.velocityX = 0
    this.velocityY = 0
    this.color = '#ffffff'
    this.size = 4
    this.alpha = 1
    this.lifetime = 0
    this.age = 0
    this.gravity = 0
    this.isActive = false
  }

  /**
   * Check if particle should be returned to pool
   */
  isDead(): boolean {
    return this.age >= this.lifetime
  }

  /**
   * Update particle each frame
   * @param deltaTime Time elapsed since last frame in seconds
   */
  update(deltaTime: number): void {
    if (!this.isActive) return

    // Update age
    this.age += deltaTime

    // Apply gravity
    this.velocityY += this.gravity * deltaTime * 60 // Scale to frame rate

    // Move particle
    this.x += this.velocityX * deltaTime * 60
    this.y += this.velocityY * deltaTime * 60

    // Fade out based on age
    const lifeRatio = this.age / this.lifetime
    this.alpha = 1 - lifeRatio
  }

  /**
   * Render particle to canvas
   * @param ctx Canvas 2D context
   * @param cameraX Camera X offset
   * @param cameraY Camera Y offset
   */
  render(ctx: CanvasRenderingContext2D, cameraX: number, cameraY: number): void {
    if (!this.isActive || this.alpha <= 0) return

    // Calculate screen position
    const screenX = this.x - cameraX
    const screenY = this.y - cameraY

    // Skip if off-screen (viewport culling)
    if (
      screenX < -this.size ||
      screenX > ctx.canvas.width + this.size ||
      screenY < -this.size ||
      screenY > ctx.canvas.height + this.size
    ) {
      return
    }

    // Save context state
    ctx.save()

    // Apply alpha
    ctx.globalAlpha = this.alpha

    // Draw particle as rectangle (simple and fast)
    ctx.fillStyle = this.color
    ctx.fillRect(
      screenX - this.size / 2,
      screenY - this.size / 2,
      this.size,
      this.size
    )

    // Restore context state
    ctx.restore()
  }
}
