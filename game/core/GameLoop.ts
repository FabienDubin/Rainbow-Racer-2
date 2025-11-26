/**
 * GameLoop - RequestAnimationFrame-based game loop
 *
 * Runs the game at 60 FPS (synced with browser VSync).
 * Calculates deltaTime for framerate-independent updates.
 * Automatically pauses when tab is inactive (RAF behavior).
 */
export class GameLoop {
  // Callbacks
  private updateCallback: (deltaTime: number) => void
  private renderCallback: () => void

  // Timing
  private lastTimestamp: number
  private animationFrameId: number | null

  // State
  private isRunning: boolean

  constructor(
    updateCallback: (deltaTime: number) => void,
    renderCallback: () => void
  ) {
    this.updateCallback = updateCallback
    this.renderCallback = renderCallback
    this.lastTimestamp = 0
    this.animationFrameId = null
    this.isRunning = false
  }

  /**
   * Start the game loop
   */
  start(): void {
    if (this.isRunning) return

    this.isRunning = true
    this.lastTimestamp = performance.now()
    this.animationFrameId = requestAnimationFrame(this.loop.bind(this))
  }

  /**
   * Stop the game loop
   */
  stop(): void {
    this.isRunning = false
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }
  }

  /**
   * Main loop - called each frame by requestAnimationFrame
   */
  private loop(timestamp: number): void {
    if (!this.isRunning) return

    // Calculate delta time in seconds
    const deltaTime = (timestamp - this.lastTimestamp) / 1000
    this.lastTimestamp = timestamp

    // Cap deltaTime to prevent physics explosion after long pauses
    // Max 100ms (10 FPS equivalent) to handle tab switching
    const cappedDeltaTime = Math.min(deltaTime, 0.1)

    // Update game state
    this.updateCallback(cappedDeltaTime)

    // Render frame
    this.renderCallback()

    // Schedule next frame
    this.animationFrameId = requestAnimationFrame(this.loop.bind(this))
  }

  /**
   * Check if the loop is currently running
   */
  getIsRunning(): boolean {
    return this.isRunning
  }
}
