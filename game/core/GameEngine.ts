import { Player } from '../entities/Player'
import { Entity } from '../entities/Entity'
import { InputManager } from './InputManager'
import { GameLoop } from './GameLoop'
import { AudioManager } from './AudioManager'
import { PhysicsSystem } from '../systems/PhysicsSystem'
import { CollisionSystem } from '../systems/CollisionSystem'
import { RenderSystem } from '../systems/RenderSystem'
import { ParticleSystem } from '../systems/ParticleSystem'
import { GAME_CONFIG } from '@/lib/constants'

/**
 * GameState - Current state of the game
 */
export enum GameState {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
}

/**
 * GameEngine - Main orchestrator for the game
 *
 * Manages all game systems and coordinates the game loop:
 * 1. Process input
 * 2. Update physics
 * 3. Check collisions
 * 4. Render frame
 */
export class GameEngine {
  // Canvas reference
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D

  // Game state
  private state: GameState

  // Core systems
  private inputManager: InputManager
  private gameLoop: GameLoop
  private physicsSystem: PhysicsSystem
  private collisionSystem: CollisionSystem
  private renderSystem: RenderSystem
  private particleSystem: ParticleSystem

  // Entities
  private player: Player
  private entities: Entity[]

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      throw new Error('Failed to get 2D context from canvas')
    }
    this.ctx = ctx

    // Initialize state
    this.state = GameState.MENU

    // Initialize systems
    this.inputManager = new InputManager()
    this.physicsSystem = new PhysicsSystem()
    this.collisionSystem = new CollisionSystem(canvas.width, canvas.height)
    this.renderSystem = new RenderSystem(ctx, canvas.width, canvas.height)
    this.particleSystem = new ParticleSystem()

    // Initialize player at center-bottom of screen
    const startX = canvas.width / 2 - 32 // Center horizontally (32 = half of 64)
    const startY = canvas.height - 64 - 100 // Above ground with some margin
    this.player = new Player(startX, startY)

    // Entities array for systems to operate on
    this.entities = [this.player]

    // Initialize game loop with callbacks
    this.gameLoop = new GameLoop(
      this.update.bind(this),
      this.render.bind(this)
    )
  }

  /**
   * Start the game
   */
  start(): void {
    this.state = GameState.PLAYING
    this.gameLoop.start()
  }

  /**
   * Pause the game
   */
  pause(): void {
    if (this.state === GameState.PLAYING) {
      this.state = GameState.PAUSED
      this.gameLoop.stop()
    }
  }

  /**
   * Resume from pause
   */
  resume(): void {
    if (this.state === GameState.PAUSED) {
      this.state = GameState.PLAYING
      this.gameLoop.start()
    }
  }

  /**
   * Clean up all resources
   */
  destroy(): void {
    this.gameLoop.stop()
    this.inputManager.destroy()
    this.state = GameState.MENU
  }

  /**
   * Handle canvas resize
   */
  resize(width: number, height: number): void {
    this.collisionSystem.setCanvasSize(width, height)
    this.renderSystem.setCanvasSize(width, height)
  }

  /**
   * Get current game state
   */
  getState(): GameState {
    return this.state
  }

  /**
   * Main update function - called each frame
   * Order: input → player update → physics → collision → entity update
   */
  private update(deltaTime: number): void {
    if (this.state !== GameState.PLAYING) return

    // 1. Update input state
    this.inputManager.update()

    // 2. Process player input
    this.processPlayerInput()

    // 3. Update physics (gravity + velocity integration)
    // Pass Space held state for variable jump height
    const isSpaceHeld = this.inputManager.isPressed('Space')
    this.physicsSystem.update(deltaTime, this.entities, isSpaceHeld)

    // 4. Check and resolve collisions
    this.collisionSystem.update(this.player)

    // 5. Update all entities (state changes, animations, etc.)
    for (const entity of this.entities) {
      entity.update(deltaTime)
    }

    // 6. Update particle system
    this.particleSystem.update(deltaTime)
  }

  /**
   * Process player movement input
   */
  private processPlayerInput(): void {
    // Horizontal movement
    const left = this.inputManager.isLeftPressed()
    const right = this.inputManager.isRightPressed()

    if (left && !right) {
      this.player.handleMovement('left')
    } else if (right && !left) {
      this.player.handleMovement('right')
    } else {
      this.player.handleMovement('none')
    }

    // Jump/Flap input - Space just pressed
    if (this.inputManager.justPressed('Space')) {
      // First, try to jump (only works if grounded)
      const didJump = this.player.handleJump()

      if (didJump) {
        // Jump was successful - play SFX and spawn dust particles
        AudioManager.playWithPitchVariation('jump', 0.1, 0.8)

        // Spawn dust particles at player's feet
        const dustX = this.player.x + this.player.width / 2
        const dustY = this.player.y + this.player.height
        this.particleSystem.spawnDustParticles(
          dustX,
          dustY,
          GAME_CONFIG.PARTICLES.DUST_COUNT,
          this.player.velocityX
        )
      } else {
        // Jump failed (not grounded), try to flap
        const didFlap = this.player.handleFlap()

        if (didFlap) {
          // Flap was successful - play SFX and spawn feather particles
          AudioManager.playWithPitchVariation('flap', 0.1, 0.9)

          // Spawn feather particles at player center
          const flapX = this.player.x + this.player.width / 2
          const flapY = this.player.y + this.player.height / 2
          this.particleSystem.spawnFeatherParticles(
            flapX,
            flapY,
            GAME_CONFIG.PARTICLES.FEATHER_COUNT
          )
        }
      }
    }
  }

  /**
   * Main render function - called each frame after update
   */
  private render(): void {
    // Render entities (includes background clear and ground line)
    this.renderSystem.render(this.entities)

    // Render particles as overlay (after entities)
    this.particleSystem.render(this.ctx, 0, 0) // Camera offset 0 for now
  }
}
