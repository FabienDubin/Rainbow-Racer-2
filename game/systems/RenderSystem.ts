import { Entity } from '../entities/Entity'
import { GAME_CONFIG } from '@/lib/constants'

/**
 * RenderSystem - Handles all canvas rendering
 *
 * Clears the canvas and renders all active entities each frame.
 * Currently uses a static camera (no scrolling).
 * Future stories will add camera follow and parallax backgrounds.
 */
export class RenderSystem {
  private ctx: CanvasRenderingContext2D
  private canvasWidth: number
  private canvasHeight: number

  // Camera offset (for future scrolling)
  private cameraX: number
  private cameraY: number

  constructor(ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number) {
    this.ctx = ctx
    this.canvasWidth = canvasWidth
    this.canvasHeight = canvasHeight
    this.cameraX = 0
    this.cameraY = 0
  }

  /**
   * Update canvas dimensions (for responsive resizing)
   */
  setCanvasSize(width: number, height: number): void {
    this.canvasWidth = width
    this.canvasHeight = height
  }

  /**
   * Clear the entire canvas with background color
   */
  clear(): void {
    this.ctx.fillStyle = GAME_CONFIG.COLORS.BACKGROUND_DEEP
    this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight)
  }

  /**
   * Render all entities
   */
  render(entities: Entity[]): void {
    // Clear canvas first
    this.clear()

    // Draw a simple ground line for visual reference
    this.drawGround()

    // Render all active entities
    for (const entity of entities) {
      if (entity.isActive) {
        entity.render(this.ctx, this.cameraX, this.cameraY)
      }
    }
  }

  /**
   * Draw a simple ground line for visual feedback
   * (Temporary - will be replaced by actual platforms/terrain)
   */
  private drawGround(): void {
    this.ctx.strokeStyle = GAME_CONFIG.COLORS.PLATFORM
    this.ctx.lineWidth = 2
    this.ctx.beginPath()
    this.ctx.moveTo(0, this.canvasHeight - 2)
    this.ctx.lineTo(this.canvasWidth, this.canvasHeight - 2)
    this.ctx.stroke()
  }
}
