/**
 * Poolable interface - Objects that can be managed by ObjectPool
 *
 * Objects implementing this interface can be recycled instead of
 * created/destroyed, avoiding garbage collection pauses.
 */
export interface Poolable {
  /**
   * Reset the object to its initial state for reuse
   */
  reset(): void

  /**
   * Check if the object should be returned to the pool
   */
  isDead(): boolean

  /**
   * Whether the object is currently active (in use)
   */
  isActive: boolean
}

/**
 * ObjectPool - Generic object pooling for performance
 *
 * Pre-allocates objects to avoid runtime allocations during gameplay.
 * Objects are acquired from the pool, used, then released back when done.
 * This prevents garbage collection pauses that would cause frame drops.
 *
 * @template T - Type of objects in the pool, must implement Poolable
 */
export class ObjectPool<T extends Poolable> {
  // Objects available for use
  private available: T[]

  // Objects currently in use
  private active: T[]

  // Factory function to create new objects
  private factory: () => T

  // Maximum pool size
  private maxSize: number

  /**
   * Create a new ObjectPool
   * @param factory Function that creates new objects
   * @param initialSize Initial number of objects to pre-allocate
   * @param maxSize Maximum number of objects allowed (default: initialSize)
   */
  constructor(factory: () => T, initialSize: number = 50, maxSize?: number) {
    this.factory = factory
    this.available = []
    this.active = []
    this.maxSize = maxSize ?? initialSize

    // Pre-allocate objects
    for (let i = 0; i < initialSize; i++) {
      const obj = factory()
      obj.isActive = false
      this.available.push(obj)
    }
  }

  /**
   * Acquire an object from the pool
   * Returns an existing object if available, or creates a new one if pool has room
   * @returns The acquired object, or null if pool is at max capacity
   */
  acquire(): T | null {
    let obj: T | undefined

    // Try to get from available pool
    if (this.available.length > 0) {
      obj = this.available.pop()!
    }
    // Create new if under max size
    else if (this.active.length < this.maxSize) {
      obj = this.factory()
    }
    // Pool exhausted
    else {
      return null
    }

    obj.reset()
    obj.isActive = true
    this.active.push(obj)
    return obj
  }

  /**
   * Release an object back to the pool
   * @param obj The object to release
   */
  release(obj: T): void {
    const index = this.active.indexOf(obj)
    if (index > -1) {
      this.active.splice(index, 1)
      obj.isActive = false
      this.available.push(obj)
    }
  }

  /**
   * Update all active objects and release dead ones
   * @param deltaTime Time elapsed since last frame
   * @param updateFn Function to call on each active object
   */
  update(deltaTime: number, updateFn: (obj: T, dt: number) => void): void {
    // Iterate backwards to safely remove items
    for (let i = this.active.length - 1; i >= 0; i--) {
      const obj = this.active[i]

      // Update the object
      updateFn(obj, deltaTime)

      // Release if dead
      if (obj.isDead()) {
        this.release(obj)
      }
    }
  }

  /**
   * Get all active objects (for rendering, etc.)
   */
  getActive(): readonly T[] {
    return this.active
  }

  /**
   * Get current number of active objects
   */
  getActiveCount(): number {
    return this.active.length
  }

  /**
   * Get current number of available objects
   */
  getAvailableCount(): number {
    return this.available.length
  }

  /**
   * Clear all objects from the pool
   */
  clear(): void {
    this.active.length = 0
    this.available.length = 0
  }
}
