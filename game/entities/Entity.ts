/**
 * Entity - Abstract base class for all game objects
 *
 * All game entities (Player, obstacles, collectibles, etc.) inherit from this class.
 * Entities have position, size, velocity and can be rendered/updated each frame.
 */
export abstract class Entity {
  // Position
  public x: number
  public y: number

  // Dimensions
  public width: number
  public height: number

  // Velocity (pixels per second)
  public velocityX: number
  public velocityY: number

  // State
  public isActive: boolean

  constructor(x: number, y: number, width: number, height: number) {
    this.x = x
    this.y = y
    this.width = width
    this.height = height
    this.velocityX = 0
    this.velocityY = 0
    this.isActive = true
  }

  /**
   * Update the entity state each frame
   * @param deltaTime Time elapsed since last frame in seconds
   */
  abstract update(deltaTime: number): void

  /**
   * Render the entity to the canvas
   * @param ctx Canvas 2D rendering context
   * @param cameraX Camera X offset for scrolling
   * @param cameraY Camera Y offset for scrolling
   */
  abstract render(ctx: CanvasRenderingContext2D, cameraX: number, cameraY: number): void

  /**
   * Get the bounding box for collision detection (AABB)
   */
  getBounds(): { left: number; right: number; top: number; bottom: number } {
    return {
      left: this.x,
      right: this.x + this.width,
      top: this.y,
      bottom: this.y + this.height,
    }
  }
}
