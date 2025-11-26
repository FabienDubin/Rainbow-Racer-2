/**
 * KeyState - Tracks the state of a single key across frames
 */
interface KeyState {
  isPressed: boolean
  justPressed: boolean
  justReleased: boolean
}

/**
 * InputManager - Handles keyboard input for the game
 *
 * Supports WASD and Arrow keys for movement.
 * Tracks key states across frames for proper input handling.
 * Automatically cleans up when window loses focus to prevent stuck keys.
 */
export class InputManager {
  // Current key states
  private keys: Map<string, KeyState>

  // Keys pressed this frame (before update() processes them)
  private keysDown: Set<string>
  private keysUp: Set<string>

  // Bound event handlers (for cleanup)
  private boundKeyDown: (e: KeyboardEvent) => void
  private boundKeyUp: (e: KeyboardEvent) => void
  private boundBlur: () => void

  constructor() {
    this.keys = new Map()
    this.keysDown = new Set()
    this.keysUp = new Set()

    // Bind handlers to preserve 'this' context
    this.boundKeyDown = this.handleKeyDown.bind(this)
    this.boundKeyUp = this.handleKeyUp.bind(this)
    this.boundBlur = this.handleBlur.bind(this)

    // Add event listeners
    window.addEventListener('keydown', this.boundKeyDown)
    window.addEventListener('keyup', this.boundKeyUp)
    window.addEventListener('blur', this.boundBlur)
  }

  /**
   * Handle keydown event
   */
  private handleKeyDown(e: KeyboardEvent): void {
    // Prevent default for game keys (arrows, space) to avoid scrolling
    if (this.isGameKey(e.code)) {
      e.preventDefault()
    }

    // Only register if not already pressed (avoid key repeat)
    if (!this.keys.get(e.code)?.isPressed) {
      this.keysDown.add(e.code)
    }
  }

  /**
   * Handle keyup event
   */
  private handleKeyUp(e: KeyboardEvent): void {
    this.keysUp.add(e.code)
  }

  /**
   * Handle window blur - release all keys to prevent stuck inputs
   */
  private handleBlur(): void {
    // Clear all key states when window loses focus
    this.keys.forEach((state, key) => {
      if (state.isPressed) {
        this.keysUp.add(key)
      }
    })
  }

  /**
   * Check if a key code is a game control key
   */
  private isGameKey(code: string): boolean {
    return [
      'KeyW', 'KeyA', 'KeyS', 'KeyD',
      'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
      'Space',
    ].includes(code)
  }

  /**
   * Update key states - call once per frame BEFORE processing input
   */
  update(): void {
    // Process keys that were just pressed
    for (const key of this.keysDown) {
      const state = this.keys.get(key) || { isPressed: false, justPressed: false, justReleased: false }
      state.isPressed = true
      state.justPressed = true
      state.justReleased = false
      this.keys.set(key, state)
    }

    // Process keys that were just released
    for (const key of this.keysUp) {
      const state = this.keys.get(key) || { isPressed: false, justPressed: false, justReleased: false }
      state.isPressed = false
      state.justPressed = false
      state.justReleased = true
      this.keys.set(key, state)
    }

    // Clear "just" states from previous frame for keys not in current events
    for (const [key, state] of this.keys) {
      if (!this.keysDown.has(key)) {
        state.justPressed = false
      }
      if (!this.keysUp.has(key)) {
        state.justReleased = false
      }
    }

    // Clear event queues
    this.keysDown.clear()
    this.keysUp.clear()
  }

  /**
   * Check if a key is currently pressed
   */
  isPressed(code: string): boolean {
    return this.keys.get(code)?.isPressed || false
  }

  /**
   * Check if a key was just pressed this frame
   */
  justPressed(code: string): boolean {
    return this.keys.get(code)?.justPressed || false
  }

  /**
   * Check if a key was just released this frame
   */
  justReleased(code: string): boolean {
    return this.keys.get(code)?.justReleased || false
  }

  /**
   * Check if left movement key is pressed (A or Left Arrow)
   */
  isLeftPressed(): boolean {
    return this.isPressed('KeyA') || this.isPressed('ArrowLeft')
  }

  /**
   * Check if right movement key is pressed (D or Right Arrow)
   */
  isRightPressed(): boolean {
    return this.isPressed('KeyD') || this.isPressed('ArrowRight')
  }

  /**
   * Clean up event listeners - call when destroying the game
   */
  destroy(): void {
    window.removeEventListener('keydown', this.boundKeyDown)
    window.removeEventListener('keyup', this.boundKeyUp)
    window.removeEventListener('blur', this.boundBlur)
    this.keys.clear()
    this.keysDown.clear()
    this.keysUp.clear()
  }
}
