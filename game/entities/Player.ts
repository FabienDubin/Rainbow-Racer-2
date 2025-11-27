import { Entity } from './Entity'
import { GAME_CONFIG } from '@/lib/constants'

/**
 * JumpState - Tracks the player's vertical movement state
 */
export type JumpState = 'grounded' | 'jumping' | 'falling' | 'flapped' | 'gliding'

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
  public maxFlaps: number

  // Animation state
  public flapAnimationTimer: number

  // Tracks if player was gliding when landing (for SFX cleanup)
  public wasGliding: boolean

  // Movement tracking
  private movementDirection: MovementDirection

  constructor(x: number, y: number) {
    super(x, y, GAME_CONFIG.PLAYER.WIDTH, GAME_CONFIG.PLAYER.HEIGHT)
    this.jumpState = 'grounded'
    this.flapCount = 0
    this.maxFlaps = GAME_CONFIG.PLAYER.MAX_FLAPS
    this.flapAnimationTimer = 0
    this.wasGliding = false
    this.movementDirection = 'none'
  }

  /**
   * Handle horizontal movement input
   * Sets velocity based on direction; stops immediately when direction is 'none'
   * Applies horizontal speed boost when gliding
   */
  handleMovement(direction: MovementDirection): void {
    this.movementDirection = direction

    // Calculate speed with glide multiplier if applicable
    const baseSpeed = GAME_CONFIG.PLAYER.SPEED
    const speed = this.jumpState === 'gliding'
      ? baseSpeed * GAME_CONFIG.PLAYER.GLIDE_HORIZONTAL_MULT
      : baseSpeed

    switch (direction) {
      case 'left':
        this.velocityX = -speed
        break
      case 'right':
        this.velocityX = speed
        break
      case 'none':
        // Stop immediately - no momentum (as per AC #2)
        this.velocityX = 0
        break
    }
  }

  /**
   * Handle jump input
   * Applies JUMP_FORCE to velocityY if grounded
   * Returns true if jump was executed, false otherwise
   */
  handleJump(): boolean {
    if (this.jumpState !== 'grounded') {
      return false
    }

    this.velocityY = GAME_CONFIG.PLAYER.JUMP_FORCE
    this.jumpState = 'jumping'
    return true
  }

  /**
   * Handle flap input (double jump)
   * Applies FLAP_FORCE to velocityY if in air and flaps remaining
   * Returns true if flap was executed, false otherwise
   */
  handleFlap(): boolean {
    // Can only flap if in the air (not grounded) and have flaps remaining
    if (this.jumpState === 'grounded') {
      return false
    }

    if (this.flapCount >= this.maxFlaps) {
      return false
    }

    // Apply flap force (stronger than jump)
    this.velocityY = GAME_CONFIG.PLAYER.FLAP_FORCE

    // Update state
    this.jumpState = 'flapped'
    this.flapCount++

    // Start flap animation
    this.flapAnimationTimer = GAME_CONFIG.PLAYER.FLAP_ANIMATION_DURATION

    return true
  }

  /**
   * Handle glide input
   * Enters glide mode if in 'flapped' state and Space is held
   * Maintains glide mode while Space is held
   * Exits glide mode when Space is released
   * Returns true if currently gliding, false otherwise
   */
  handleGlide(isHolding: boolean): boolean {
    // Can only enter glide if in 'flapped' state and holding Space
    if (this.jumpState === 'flapped' && isHolding) {
      this.jumpState = 'gliding'
      return true
    }

    // Maintain glide while holding Space
    if (this.jumpState === 'gliding' && isHolding) {
      return true
    }

    // Exit glide when Space is released
    if (this.jumpState === 'gliding' && !isHolding) {
      this.jumpState = 'falling'
      return false
    }

    return false
  }

  /**
   * Check if player is currently gliding
   */
  isGliding(): boolean {
    return this.jumpState === 'gliding'
  }

  /**
   * Called when player lands on ground or platform
   * Resets jump state and flap count
   * Sets wasGliding flag for GameEngine to stop SFX if needed
   */
  onLand(): void {
    // Track if we were gliding for SFX cleanup
    this.wasGliding = this.jumpState === 'gliding'

    this.jumpState = 'grounded'
    this.flapCount = 0
    this.flapAnimationTimer = 0
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
  update(deltaTime: number): void {
    // Update flap animation timer
    if (this.flapAnimationTimer > 0) {
      this.flapAnimationTimer -= deltaTime
      if (this.flapAnimationTimer < 0) {
        this.flapAnimationTimer = 0
      }
    }

    // Update jump state based on vertical velocity
    // Note: 'flapped' and 'gliding' states are managed by handleFlap()/handleGlide()
    // Don't override these states automatically
    if (!this.isGrounded()) {
      if (this.jumpState === 'flapped' && this.velocityY > 0) {
        // After flap, when falling down, transition to falling state
        // (only if not transitioning to glide - glide is handled in handleGlide)
        this.jumpState = 'falling'
      } else if (this.jumpState !== 'flapped' && this.jumpState !== 'gliding') {
        // Normal jump state transitions (not during flapped or gliding state)
        if (this.velocityY < 0) {
          this.jumpState = 'jumping'
        } else if (this.velocityY > 0) {
          this.jumpState = 'falling'
        }
      }
      // Note: 'gliding' state is preserved - it's only changed by handleGlide() or onLand()
    }
  }

  /**
   * Render the player as a white rectangle (temporary placeholder)
   * Will be replaced with sprite rendering in future stories
   * Includes flap animation effect (scale pulse + color cycling)
   */
  render(ctx: CanvasRenderingContext2D, cameraX: number, cameraY: number): void {
    if (!this.isActive) return

    // Calculate screen position (world position minus camera offset)
    const screenX = this.x - cameraX
    const screenY = this.y - cameraY

    // Check if flap animation is active
    const isFlapping = this.flapAnimationTimer > 0
    const flapDuration = GAME_CONFIG.PLAYER.FLAP_ANIMATION_DURATION

    if (isFlapping) {
      // Calculate animation progress (0 to 1)
      const progress = 1 - (this.flapAnimationTimer / flapDuration)

      // Scale pulse effect: grow and shrink rapidly (2-3 cycles during 0.2s)
      const pulseSpeed = 15 // Controls number of cycles
      const scalePulse = 1 + Math.sin(progress * Math.PI * pulseSpeed) * 0.15

      // Rainbow color cycling during flap (signature rainbow unicorn effect)
      const hue = (progress * 360 * 3) % 360 // 3 full rainbow cycles
      const color = `hsl(${hue}, 100%, 75%)`

      // Save context for transformation
      ctx.save()

      // Translate to center of player for scaling
      const centerX = screenX + this.width / 2
      const centerY = screenY + this.height / 2
      ctx.translate(centerX, centerY)
      ctx.scale(scalePulse, scalePulse)
      ctx.translate(-this.width / 2, -this.height / 2)

      // Draw with rainbow color
      ctx.fillStyle = color
      ctx.fillRect(0, 0, this.width, this.height)

      // Restore context
      ctx.restore()
    } else if (this.jumpState === 'gliding') {
      // Glide animation: wings spread with slight rotation
      ctx.save()

      // Translate to center for rotation
      const centerX = screenX + this.width / 2
      const centerY = screenY + this.height / 2
      ctx.translate(centerX, centerY)

      // Slight rotation (5-10 degrees) for aerodynamic effect - direction based on movement
      const rotationAngle = this.velocityX >= 0 ? 0.12 : -0.12 // ~7 degrees
      ctx.rotate(rotationAngle)

      // Draw main body (slightly compressed vertically for glide pose)
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(-this.width / 2, -this.height / 2 + 5, this.width, this.height - 10)

      // Draw extended wings (horizontal rectangles on each side)
      const wingWidth = 25
      const wingHeight = 8
      ctx.fillStyle = 'rgba(200, 220, 255, 0.9)' // Light blue-ish white for wings

      // Left wing
      ctx.fillRect(-this.width / 2 - wingWidth + 5, -wingHeight / 2, wingWidth, wingHeight)

      // Right wing
      ctx.fillRect(this.width / 2 - 5, -wingHeight / 2, wingWidth, wingHeight)

      ctx.restore()
    } else {
      // Normal rendering: white rectangle (64x64 as per AC #1)
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(screenX, screenY, this.width, this.height)
    }
  }
}
