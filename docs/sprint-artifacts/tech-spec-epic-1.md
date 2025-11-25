# Epic Technical Specification: Foundation & Core Movement

Date: 2025-11-24
Author: Fab
Epic ID: 1
Status: Draft

---

## Overview

L'Epic 1 établit les fondations techniques du jeu Rainbow Racer V2 et implémente le système de mouvement ultra-responsive du joueur. Cet epic couvre l'initialisation complète du projet Next.js 16 avec Supabase, la mise en place du Canvas 2D pour le rendu du jeu, et l'implémentation de toutes les mécaniques de mouvement core : déplacement WASD, saut à hauteur variable, le système unique de Flap Wings (double jump aérien), plané (glide), et dash avec invincibilité. L'objectif principal est de créer un "game feel" fluide et satisfaisant qui servira de base pour toutes les features gameplay ultérieures.

Cette epic représente environ 30-40% de l'effort total du MVP et établit les patterns architecturaux critiques (séparation Game Engine / React UI, object pooling, time-based physics) qui seront réutilisés dans tous les epics suivants. Le deliverable final est un joueur contrôlable dans un environnement parallax avec performance garantie à 60 FPS constant.

## Objectives and Scope

**In-Scope:**
- ✅ Initialisation projet Next.js 16 + TypeScript + Supabase + Canvas boilerplate
- ✅ Game Engine core (GameLoop avec RequestAnimationFrame, delta time, game states)
- ✅ Input Manager pour clavier (WASD, Space, Shift, ESC)
- ✅ Player entity avec propriétés physiques (position, velocity, collision box)
- ✅ Physics System avec gravité, accélération, et time-based movement
- ✅ Mouvement horizontal 8-directions avec réponse instantanée
- ✅ Système de saut avec hauteur variable (tap vs hold Space)
- ✅ Flap Wings mechanic (double jump aérien avec boost vertical)
- ✅ Glide system (plané après flap avec chute ralentie)
- ✅ Dash mechanic avec i-frames, cooldown, et screenshake
- ✅ Premier biome "Crystal Cloudscape" avec parallax 5-7 couches
- ✅ Rendering System avec pipeline back-to-front
- ✅ Particle System basique avec object pooling
- ✅ Audio Manager avec préchargement SFX (jump, flap, glide, dash)
- ✅ Camera System qui follow le player avec smooth lerp
- ✅ Optimisations performance : object pooling, viewport culling, 60 FPS garanti

**Out-of-Scope (Epics ultérieurs):**
- ❌ Ennemis et collision avec ennemis (Epic 2)
- ❌ Collectibles (gems, stars, fragments) (Epic 2)
- ❌ Génération procédurale des niveaux (Epic 2)
- ❌ Système de mort et respawn (Epic 2)
- ❌ HUD React overlay (Epic 2)
- ❌ Meta-progression et upgrades (Epic 3)
- ❌ Power-ups temporaires (Epic 4)
- ❌ Menu principal et pause (Epic 4)
- ❌ Audio complet (musique, SFX additionnels) (Epic 4)
- ❌ Features online (auth, leaderboards) (Epic 5)

## System Architecture Alignment

**Composants Architecturaux Créés:**

L'Epic 1 implémente les couches fondamentales de l'architecture définie dans `game-architecture.md` :

- **Game Core Layer** : `src/game/core/`
  - `GameEngine.ts` : Orchestrateur principal, gère les states (MENU, PLAYING, PAUSED)
  - `GameLoop.ts` : RAF loop avec delta time calculation
  - `InputManager.ts` : Keyboard event handling (keydown/keyup)
  - `AudioManager.ts` : Web Audio API wrapper pour SFX playback
  - `Camera.ts` : Camera follow avec parallax calculation

- **Entities Layer** : `src/game/entities/`
  - `Entity.ts` : Base class (x, y, width, height, velocityX, velocityY)
  - `Player.ts` : Licorne avec jump states, flap count, dash cooldown
  - `Particle.ts` : Particule basique pour VFX

- **Systems Layer** : `src/game/systems/`
  - `PhysicsSystem.ts` : Gravity application, velocity integration
  - `CollisionSystem.ts` : AABB collision avec sol/plateformes (pas ennemis)
  - `RenderSystem.ts` : Canvas pipeline (clear → background → entities → particles)
  - `ParticleSystem.ts` : Spawn et update de particules poolées

- **Utils Layer** : `src/game/utils/`
  - `ObjectPool.ts` : Generic pooling pour particules
  - `Vector2D.ts` : Vector math helpers
  - `MathUtils.ts` : Lerp, clamp, random utils

**Contraintes Architecturales Respectées:**

1. **Séparation stricte Game / React** : Aucun code React dans `/game`, communication unidirectionnelle via Zustand (setup dans Epic 2)
2. **Canvas 2D natif** : Pas de framework (Phaser, PixiJS), contrôle total du rendering
3. **Performance-first** : Object pooling obligatoire, RAF loop, time-based physics
4. **TypeScript strict mode** : Tous les fichiers typés, pas de `any`
5. **60 FPS non-négociable** : Viewport culling, limite de 500 particules max

**Décisions Architecturales Appliquées (ADRs):**
- ADR-001 : Canvas 2D vs WebGL → Canvas 2D pour simplicité et contrôle
- ADR-004 : Object Pooling mandatory pour particules (éviter GC pauses)
- Pattern Novel Design : Flap Wings System (3-state aerial : jumped → flapped → gliding)

## Detailed Design

### Services and Modules

| Module | Responsabilité | Inputs | Outputs | Owner/Story |
|--------|----------------|--------|---------|-------------|
| **GameEngine** | Orchestrateur principal du jeu, gère le lifecycle complet (init, start, pause, destroy) | Canvas element, config | Game state updates | Story 1.1, 1.2 |
| **GameLoop** | Boucle RAF avec delta time, appelle update() de tous les systems | Timestamp RAF | Delta time (seconds) | Story 1.2, 1.8 |
| **InputManager** | Capture et normalise les inputs clavier (keydown/keyup), expose état des touches | Keyboard events | Key states (isPressed, isHeld, justPressed) | Story 1.2, 1.3 |
| **AudioManager** | Gère préchargement et playback des SFX via Web Audio API | Sound URLs, playback commands | Audio playback | Story 1.3, 1.4 |
| **Camera** | Suit le player avec smooth lerp, calcule offsets parallax pour chaque layer | Player position | Camera position (x, y) | Story 1.7 |
| **PhysicsSystem** | Applique gravité, intègre vélocités, gère time-based movement | Delta time, entities | Updated positions/velocities | Story 1.2, 1.3 |
| **CollisionSystem** | Détecte collisions AABB (player/sol, player/platformes) | Entities, platforms | Collision events | Story 1.2, 1.3 |
| **RenderSystem** | Pipeline de rendu Canvas (clear, background, entities, particles) | All renderable entities | Canvas pixels | Story 1.7, 1.8 |
| **ParticleSystem** | Gère spawn, update, et pooling de particules pour VFX | Spawn requests, delta time | Active particles | Story 1.3, 1.4, 1.8 |
| **Player** | Entity joueur avec states (grounded, jumped, flapped, gliding, dashing) | Input commands, delta time | Position, velocity, state | Stories 1.2-1.6 |
| **Particle** | Entity particule simple (position, velocity, lifetime, color, alpha fade) | Init params | Render state | Story 1.3, 1.4 |
| **ObjectPool** | Generic pooling pour réutiliser objets (évite allocations GC) | Factory function, pool size | Acquired/released objects | Story 1.8 |

**Notes d'intégration:**
- Tous les modules Game Engine sont isolés de React (pas d'imports React)
- Communication externe via Zustand stores (Epic 2)
- Chaque système a une méthode `update(deltaTime)` standard
- RenderSystem dépend de Camera pour offset calculations

### Data Models and Contracts

#### Entity Base Class
```typescript
// src/game/entities/Entity.ts
abstract class Entity {
  x: number              // Position X (pixels)
  y: number              // Position Y (pixels)
  width: number          // Collision box width
  height: number         // Collision box height
  velocityX: number      // Horizontal velocity (pixels/sec)
  velocityY: number      // Vertical velocity (pixels/sec)
  isActive: boolean      // Entity enabled/disabled

  abstract update(deltaTime: number): void
  abstract render(ctx: CanvasRenderingContext2D, camera: Camera): void
}
```

#### Player Entity
```typescript
// src/game/entities/Player.ts
class Player extends Entity {
  // Jump/Movement States
  jumpState: 'grounded' | 'jumped' | 'flapped' | 'gliding'
  flapCount: number                    // Current flaps used (max 1, upgradable)
  maxFlaps: number = 1                 // Max flaps allowed

  // Dash Properties
  isDashing: boolean
  dashTimeRemaining: number            // ms
  dashCooldownRemaining: number        // ms
  isInvincible: boolean

  // Movement Constants (from lib/constants.ts)
  readonly SPEED = 5                   // Horizontal speed
  readonly JUMP_FORCE = -12           // Initial jump velocity
  readonly FLAP_FORCE = -15           // Flap boost velocity
  readonly GLIDE_FALL_SPEED = -2      // Max fall speed during glide
  readonly DASH_SPEED = 20
  readonly DASH_DURATION = 200        // ms
  readonly DASH_COOLDOWN = 1000       // ms

  // Methods
  handleJump(): void
  handleFlap(): void
  handleGlide(isHolding: boolean): void
  handleDash(): void
  onLand(): void                      // Reset jump state
}
```

#### Particle Entity
```typescript
// src/game/entities/Particle.ts
class Particle extends Entity implements Poolable {
  color: string           // CSS color
  lifetime: number        // Total lifetime (seconds)
  age: number            // Current age (seconds)
  alpha: number          // Opacity (0-1)

  reset(): void          // Reset for pooling
  isDead(): boolean      // Check if lifetime expired
}
```

#### Camera Model
```typescript
// src/game/core/Camera.ts
class Camera {
  x: number              // Camera position X
  y: number              // Camera position Y
  targetX: number        // Target to follow
  targetY: number
  lerpFactor: number = 0.1   // Smooth follow speed
  shakeOffset: Vector2D      // Screenshake offset
  shakeAmplitude: number
  shakeDuration: number

  follow(target: Entity, deltaTime: number): void
  shake(amplitude: number, duration: number): void
  getParallaxOffset(layer: number): number
}
```

#### Input State Model
```typescript
// src/game/core/InputManager.ts
interface KeyState {
  isPressed: boolean      // Currently pressed
  justPressed: boolean    // Pressed this frame
  justReleased: boolean   // Released this frame
}

type KeyMap = Record<string, KeyState>

class InputManager {
  private keys: KeyMap = {}

  isPressed(key: string): boolean
  justPressed(key: string): boolean
  update(): void          // Clear just* flags each frame
}
```

#### Game Constants
```typescript
// src/lib/constants.ts
export const GAME_CONFIG = {
  CANVAS_WIDTH: 1920,
  CANVAS_HEIGHT: 1080,
  TARGET_FPS: 60,
  GRAVITY: 0.8,

  PLAYER: {
    WIDTH: 64,
    HEIGHT: 64,
    SPEED: 5,
    JUMP_FORCE: -12,
    FLAP_FORCE: -15,
    GLIDE_FALL_SPEED: -2,
    GLIDE_GRAVITY_MULT: 0.3,
    GLIDE_HORIZONTAL_MULT: 1.3,
    DASH_SPEED: 20,
    DASH_DURATION: 200,
    DASH_COOLDOWN: 1000,
  },

  PARTICLES: {
    MAX_COUNT: 500,
    POOL_SIZE: 500,
  },

  CAMERA: {
    LERP_FACTOR: 0.1,
  }
} as const
```

### APIs and Interfaces

#### GameEngine Public API
```typescript
// src/game/core/GameEngine.ts
export class GameEngine {
  constructor(canvas: HTMLCanvasElement) {}

  // Lifecycle
  start(): void                          // Start game loop
  pause(): void                          // Pause game (state = PAUSED)
  resume(): void                         // Resume from pause
  destroy(): void                        // Cleanup, cancel RAF

  // State queries
  getState(): GameState                  // Current game state
  getFPS(): number                       // Current framerate
}
```

#### AudioManager Public API
```typescript
// src/game/core/AudioManager.ts
export class AudioManager {
  // Initialization
  static async preloadSounds(urls: string[]): Promise<void>

  // Playback
  static play(soundName: string, volume?: number): void
  static playLoop(soundName: string, volume?: number): void
  static stopLoop(soundName: string): void
  static stop(soundName: string): void

  // Pitch variation
  static playWithPitchVariation(soundName: string, range?: number): void
}
```

#### ObjectPool Public API
```typescript
// src/game/utils/ObjectPool.ts
export class ObjectPool<T extends Poolable> {
  constructor(factory: () => T, initialSize: number) {}

  acquire(): T                           // Get object from pool
  release(obj: T): void                  // Return object to pool
  update(deltaTime: number): void        // Update all active objects
  getActiveCount(): number               // Debug info
}

interface Poolable {
  reset(): void                          // Reset state for reuse
  update(deltaTime: number): void
  isDead(): boolean                      // Should return to pool?
}
```

#### React Component Interface (GameCanvas)
```typescript
// src/components/game/GameCanvas.tsx
'use client'

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const engineRef = useRef<GameEngine | null>(null)

  useEffect(() => {
    // Mount: create GameEngine
    // Unmount: destroy GameEngine
  }, [])

  return <canvas ref={canvasRef} width={1920} height={1080} />
}
```

### Workflows and Sequencing

#### Game Loop Sequence (60 FPS)
```
[Every Frame - ~16.67ms]

1. RequestAnimationFrame callback
   └─> Calculate deltaTime = (timestamp - lastTimestamp) / 1000

2. InputManager.update()
   └─> Clear justPressed/justReleased flags

3. IF gameState !== PAUSED:

   3.1 PhysicsSystem.update(deltaTime)
       ├─> Apply gravity to Player: velocityY += GRAVITY * deltaTime
       ├─> Apply gravity modifiers (gliding, jumping)
       └─> Integrate velocities: position += velocity * deltaTime

   3.2 Player.update(deltaTime)
       ├─> Handle jump input
       ├─> Handle flap input
       ├─> Handle glide input
       ├─> Handle dash input (cooldown decrement)
       └─> Update dash/invincibility timers

   3.3 CollisionSystem.update()
       ├─> Check Player vs Ground (y + height >= groundY)
       ├─> Check Player vs Platforms (AABB overlap)
       └─> Call player.onLand() if collision detected

   3.4 ParticleSystem.update(deltaTime)
       ├─> Update all active particles (age, position, alpha fade)
       └─> Release dead particles to pool

   3.5 Camera.update(deltaTime)
       ├─> Smooth follow player: lerp(camera.x, player.x, LERP_FACTOR)
       └─> Update screenshake offset if active

4. RenderSystem.render()
   ├─> ctx.clearRect(0, 0, width, height)
   ├─> Render parallax background layers (5-7 layers)
   ├─> Render platforms
   ├─> Render player (sprite + dash trail if dashing)
   └─> Render particles

5. Schedule next frame: requestAnimationFrame(loop)
```

#### Jump → Flap → Glide Sequence
```
[Player on Ground]
State: grounded, flapCount = 0

[Press Space]
└─> jumpState = 'jumped'
└─> velocityY = JUMP_FORCE (-12)
└─> Play SFX: jump.mp3
└─> Spawn dust particles at ground

[In Air, Press Space again]
└─> IF flapCount < maxFlaps:
    ├─> jumpState = 'flapped'
    ├─> velocityY = FLAP_FORCE (-15)
    ├─> flapCount++
    ├─> Play SFX: flap.mp3
    ├─> Spawn feather particles (8-12)
    └─> Play animation: flap-1, flap-2 cycle

[Hold Space after Flap]
└─> IF jumpState === 'flapped':
    ├─> jumpState = 'gliding'
    ├─> Apply glide physics:
    │   ├─> velocityY = max(velocityY, GLIDE_FALL_SPEED)
    │   ├─> gravity *= GLIDE_GRAVITY_MULT (0.3)
    │   └─> horizontal speed *= GLIDE_HORIZONTAL_MULT (1.3)
    ├─> Play SFX loop: glide-loop.mp3
    └─> Spawn trail particles

[Release Space OR Land]
└─> Stop glide-loop.mp3
└─> IF landed: jumpState = 'grounded', flapCount = 0
```

#### Dash Sequence
```
[Press Shift]
└─> IF dashCooldownRemaining === 0:
    ├─> isDashing = true
    ├─> dashTimeRemaining = DASH_DURATION (200ms)
    ├─> dashCooldownRemaining = DASH_COOLDOWN (1000ms)
    ├─> isInvincible = true
    ├─> velocityX = DASH_SPEED (20) * direction
    ├─> Play SFX: dash.mp3
    ├─> Camera.shake(amplitude: 3, duration: 100)
    └─> Spawn trail particles (15-20 per frame)

[Every Frame during Dash]
└─> dashTimeRemaining -= deltaTime * 1000
└─> Render player with alpha flicker (opacity 0.5-1.0)
└─> Spawn rainbow trail particles

[Dash Ends (timeRemaining <= 0)]
└─> isDashing = false
└─> isInvincible = false
└─> velocityX = SPEED (normal)

[Cooldown Countdown]
└─> Every frame: dashCooldownRemaining -= deltaTime * 1000
└─> When <= 0: dash available again
```

#### Asset Loading Sequence (Mount)
```
[GameCanvas Component Mount]

1. Create canvas element, get 2D context

2. AudioManager.preloadSounds([
     '/audio/sfx/jump.mp3',
     '/audio/sfx/flap.mp3',
     '/audio/sfx/glide-loop.mp3',
     '/audio/sfx/dash.mp3',
   ])
   └─> Fetch + decode audio (Web Audio API)

3. Create ObjectPool<Particle>(500)
   └─> Pre-instantiate 500 particles

4. Initialize GameEngine(canvas)
   ├─> Create Player entity
   ├─> Create Camera
   ├─> Create all Systems (Physics, Collision, Render, Particle)
   └─> Initialize InputManager

5. GameEngine.start()
   └─> gameState = PLAYING
   └─> Start RAF loop
```

## Non-Functional Requirements

### Performance

**Cibles Mesurables:**

| Métrique | Target | Méthode de Mesure | Justification (lien PRD/Architecture) |
|----------|--------|-------------------|---------------------------------------|
| **Framerate** | 60 FPS stable (58-60 FPS) | Chrome DevTools FPS meter pendant 5 min de gameplay | FR47 : Platformer exige fluidité absolue pour précision |
| **Input Latency** | <100ms (keypress → visual feedback) | Mesure manuelle avec high-speed camera | FR49 : Controls responsifs critiques pour game feel |
| **Cold Load Time** | <5s (landing → canvas jouable) | Lighthouse Performance, Network throttling | FR48 : Retention joueur dépend de load rapide |
| **Memory Usage** | <150MB heap stable | Chrome DevTools Memory profiler | Object pooling évite GC thrashing |
| **Frame Budget** | <16.67ms par frame (60 FPS) | Performance.now() dans game loop | Chaque frame doit compléter en temps |
| **Particle Count** | Max 500 actives simultanément | Counter interne | Cap pour garantir 60 FPS même avec VFX intenses |

**Optimisations Implémentées:**

1. **Object Pooling** (Story 1.8)
   - Pool de 500 particules pré-instanciées
   - Zéro allocation durant game loop
   - Évite GC pauses (target : <5ms GC pause max)

2. **Time-Based Physics** (Story 1.2, 1.8)
   - Mouvement indépendant du framerate via `deltaTime`
   - Garantit cohérence gameplay sur devices variés

3. **RequestAnimationFrame** (Story 1.2)
   - Sync avec VSync du browser (60Hz)
   - Pas de setInterval/setTimeout (inefficaces)

4. **Viewport Culling** (Story 1.8)
   - Entities hors écran skip rendering
   - Économise draw calls Canvas API

5. **Canvas Layering** (Story 1.7)
   - Background parallax sur layer séparé (update moins fréquent possible - stretch)
   - Game entities sur layer principal (update 60 FPS)

**Performance Monitoring:**
- FPS counter affiché en dev mode (toggle avec touche F)
- Performance.mark() pour profiler sections critiques
- Console warnings si frame >20ms (rate limiting)

**Référence Architecture:**
- Section "60 FPS Target" : optimisations obligatoires listées
- Section "Object Pooling for Performance" : pattern appliqué
- ADR-004 : Object pooling mandatory pour éviter GC

### Security

**Pour Epic 1 (Foundation):**

Cet epic établit les fondations techniques mais ne gère pas encore de données sensibles. Les considérations de sécurité sont minimales.

**Mesures Appliquées:**

1. **Input Sanitization** (Story 1.2)
   - InputManager valide uniquement inputs clavier attendus (WASD, Space, Shift, ESC)
   - Pas d'eval() ou exécution de code utilisateur
   - Pas d'injection possible (game engine isolé du DOM)

2. **Content Security Policy** (Story 1.1)
   - Next.js CSP headers par défaut
   - Pas de inline scripts dans canvas rendering
   - Assets audio/sprites servis depuis `/public` (domaine contrôlé)

3. **TypeScript Strict Mode** (Story 1.1)
   - Évite type coercion errors (potentiels bugs sécurité)
   - Null checks obligatoires
   - Pas de `any` type (risque de bypass type safety)

**Authentification/Autorisation:**
- ⚠️ **Out of scope pour Epic 1**
- Géré dans Epic 5 (Supabase Auth, RLS policies)

**Notes:**
- Game engine côté client = pas de données sensibles
- Supabase keys publiques (NEXT_PUBLIC_*) OK car RLS protège backend
- Référence Architecture section "Security Architecture" : détaillé dans Epic 5

### Reliability/Availability

**Cibles:**

| Métrique | Target | Implémentation |
|----------|--------|----------------|
| **Crash Recovery** | Aucun crash fatal autorisé | Try-catch dans game loop, graceful degradation |
| **Error Handling** | Tous les modules doivent fail gracefully | Defensive programming, fallbacks |
| **Canvas Support** | Fallback si Canvas 2D indisponible | Message utilisateur "Browser non supporté" |
| **Audio Fallback** | Jeu jouable sans audio | AudioManager continue si preload échoue |

**Stratégies de Résilience:**

1. **Game Loop Error Handling** (Story 1.2)
   ```typescript
   update(deltaTime: number) {
     try {
       this.physicsSystem.update(deltaTime)
       this.collisionSystem.update()
       this.renderSystem.render()
     } catch (error) {
       console.error('Game loop error:', error)
       this.pause()
       // Show error modal to user: "Une erreur est survenue"
     }
   }
   ```

2. **Audio Loading Resilience** (Story 1.3)
   - Si preload échoue (réseau, format non supporté), log warning mais continue
   - play() methods check si sound exists avant playback
   - Pas de crash si audio unavailable

3. **Canvas Compatibility Check** (Story 1.1)
   ```typescript
   const canvas = canvasRef.current
   if (!canvas || !canvas.getContext('2d')) {
     return <div>Votre navigateur ne supporte pas Canvas 2D</div>
   }
   ```

4. **Input Manager Resilience** (Story 1.2)
   - Ignore touches inconnues (pas de crash sur keycode bizarre)
   - Clear state on window blur (évite stuck keys)

**Availability:**
- Client-side rendering = pas de dépendance backend pour jouer (sauf Epic 5)
- Jeu continue même si Supabase down (pas de features online, mais jouable)
- Static assets servis via Vercel CDN (99.9% uptime)

**Référence Architecture:**
- Section "Error Handling" : patterns try-catch appliqués
- Game Engine doit "fail gracefully, ne jamais crasher le game loop"

### Observability

**Logging Strategy:**

1. **Development Mode** (console.log autorisé)
   ```typescript
   const isDev = process.env.NODE_ENV === 'development'

   function devLog(...args: any[]) {
     if (isDev) console.log(...args)
   }

   // Usage
   devLog('Player position:', player.x, player.y)
   devLog('FPS:', this.currentFPS)
   ```

2. **Production Mode** (logging minimal)
   - Console.error uniquement pour crashes critiques
   - Pas de console.log (pollue console user)
   - Logs structurés pour Epic 6 (Monitoring)

3. **Performance Metrics Tracking** (Story 1.8)
   ```typescript
   class GameEngine {
     private frameCount = 0
     private fpsHistory: number[] = []

     getFPS(): number {
       return this.currentFPS
     }

     logPerformanceStats() {
       devLog('Avg FPS:', average(this.fpsHistory))
       devLog('Active particles:', particlePool.getActiveCount())
       devLog('Entities:', this.entities.length)
     }
   }
   ```

4. **Debug Mode Toggle** (Story 1.8)
   - Touche 'D' active debug overlay
   - Affiche collision boxes (rectangles rouges)
   - Affiche FPS counter, entity count
   - Affiche player state (jumpState, isDashing, etc.)

**Signaux Requis pour Monitoring:**

| Signal | Quand Logger | Destination |
|--------|--------------|-------------|
| **Game Start** | GameEngine.start() | DevTools console (dev) |
| **Game Crash** | Catch dans game loop | Console.error + Epic 6 (Sentry) |
| **FPS Drop** | FPS <30 pendant >1s | Console.warn (dev) |
| **Asset Load Failure** | AudioManager.preload échoue | Console.error |
| **Performance Stats** | Toutes les 10s (dev mode) | Console.log |

**Traces (Epic 6 - Future):**
- Performance.mark() pour mesurer sections critiques
- Web Vitals (FCP, LCP, CLS) via Vercel Analytics
- Custom events : `track('game_started')`, `track('player_jumped')`

**Référence Architecture:**
- Section "Logging Strategy" : patterns Dev vs Prod
- "Development Workflow" section : debug tools

## Dependencies and Integrations

### External Dependencies

**Note:** Le projet sera initialisé dans Story 1.1. Voici les dépendances planifiées basées sur `game-architecture.md`.

#### Production Dependencies
| Package | Version | Utilisation | Justification | Story |
|---------|---------|-------------|---------------|-------|
| **next** | 16.x | Framework React, App Router, SSR | Framework principal, Turbopack fast builds | 1.1 |
| **react** | 19.2 (canary) | UI library pour menus/HUD | Inclus avec Next.js 16 | 1.1 |
| **react-dom** | 19.2 (canary) | React renderer | Inclus avec Next.js 16 | 1.1 |
| **@supabase/supabase-js** | Latest | Supabase client (auth, DB, realtime) | Backend pour Epic 5, setup dès Epic 1 | 1.1 |
| **@supabase/ssr** | Latest | Server-side Supabase client | RSC support, cookies auth | 1.1 |
| **zustand** | 5.x | State management (UI) | Léger, pas de boilerplate vs Redux (Epic 2) | Epic 2 |
| **uuid** | Latest | Generate unique IDs for entities | Entity identification | Epic 2 |
| **clsx** | Latest | Conditional CSS classes | Tailwind utilities | Epic 2 |

#### Dev Dependencies
| Package | Version | Utilisation | Story |
|---------|---------|-------------|-------|
| **typescript** | 5.x | Type safety | 1.1 |
| **@types/react** | Latest | React types | 1.1 |
| **@types/react-dom** | Latest | React DOM types | 1.1 |
| **@types/node** | 20.x | Node.js types | 1.1 |
| **@types/uuid** | Latest | UUID types | Epic 2 |
| **eslint** | Latest | Linting | 1.1 |
| **prettier** | Latest | Code formatting | 1.1 |
| **tailwindcss** | 4.x | Utility-first CSS (menus/HUD) | 1.1 |

#### Native Browser APIs (No Install)
- **Canvas 2D API** : Rendering du jeu (aucune lib externe)
- **Web Audio API** : SFX playback (pas de howler.js, natif suffit)
- **RequestAnimationFrame** : Game loop
- **Keyboard Events** : Input handling

**Installation Command (Story 1.1):**
```bash
# Via starter template Vercel/Supabase
npx create-next-app@latest rainbow-racer-v2 \
  --typescript \
  --tailwind \
  --app \
  --turbopack \
  --use-npm \
  --example https://github.com/vercel/next.js/tree/canary/examples/with-supabase

cd rainbow-racer-v2

# Additional dependencies
npm install zustand uuid clsx
npm install -D @types/uuid
```

### Integration Points

#### 1. Next.js ↔ Canvas Game Engine

**Pattern:** React wrapper component qui monte/démonte le game engine

```typescript
// src/components/game/GameCanvas.tsx
'use client' // Client Component

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const engineRef = useRef<GameEngine | null>(null)

  useEffect(() => {
    if (!canvasRef.current) return

    // Mount: instantiate GameEngine
    engineRef.current = new GameEngine(canvasRef.current)
    engineRef.current.start()

    // Unmount: cleanup
    return () => {
      engineRef.current?.destroy()
    }
  }, [])

  return (
    <div className="relative w-full h-screen">
      <canvas
        ref={canvasRef}
        width={1920}
        height={1080}
        className="absolute inset-0"
      />
    </div>
  )
}
```

**Communication:** Unidirectionnelle (Game → React via Zustand dans Epic 2)

#### 2. Game Engine ↔ Web Audio API

**Integration:** AudioManager wrapper autour de Web Audio API

```typescript
// src/game/core/AudioManager.ts
class AudioManager {
  private static context: AudioContext
  private static buffers: Map<string, AudioBuffer> = new Map()

  static async preloadSounds(urls: string[]): Promise<void> {
    this.context = new (window.AudioContext || window.webkitAudioContext)()

    await Promise.all(urls.map(async (url) => {
      const response = await fetch(url)
      const arrayBuffer = await response.arrayBuffer()
      const audioBuffer = await this.context.decodeAudioData(arrayBuffer)
      this.buffers.set(url, audioBuffer)
    }))
  }

  static play(soundName: string, volume = 1.0): void {
    const buffer = this.buffers.get(soundName)
    if (!buffer) return

    const source = this.context.createBufferSource()
    const gainNode = this.context.createGain()

    source.buffer = buffer
    gainNode.gain.value = volume

    source.connect(gainNode)
    gainNode.connect(this.context.destination)
    source.start(0)
  }
}
```

**Assets Location:** `/public/audio/sfx/*.mp3`

#### 3. TypeScript ↔ Game Constants

**Integration:** Centralized constants file pour cohérence

```typescript
// src/lib/constants.ts
export const GAME_CONFIG = {
  CANVAS_WIDTH: 1920,
  CANVAS_HEIGHT: 1080,
  TARGET_FPS: 60,
  GRAVITY: 0.8,
  // ... (voir section Data Models)
} as const

// Type inference
type GameConfig = typeof GAME_CONFIG
```

**Usage:** Import dans tous les modules Game qui ont besoin de constantes

#### 4. Canvas Rendering ↔ Camera System

**Integration:** Camera calcule offsets pour toutes les entités et layers parallax

```typescript
// RenderSystem utilise Camera
class RenderSystem {
  render() {
    const cameraX = this.camera.x

    // Parallax background
    this.layers.forEach((layer, index) => {
      const offsetX = this.camera.getParallaxOffset(index)
      layer.render(ctx, offsetX)
    })

    // Entities (world-space → screen-space)
    this.entities.forEach(entity => {
      const screenX = entity.x - cameraX
      const screenY = entity.y - this.camera.y
      entity.render(ctx, screenX, screenY)
    })
  }
}
```

### Version Constraints

**Critical Constraints:**
- **Node.js:** 20.x LTS (supporté par Vercel, stable)
- **Next.js:** 16.x (Turbopack stable, React 19 support)
- **TypeScript:** 5.x (strict mode)
- **React:** 19.2 canary (inclus Next 16, pas besoin upgrade manual)

**Rationale Next.js 16:**
- Turbopack stable (builds 5x plus rapides vs Webpack)
- App Router mature
- React 19 support (features modernes)
- Vercel deployment optimisé

**Supabase Free Tier Limits:**
- 500MB database storage
- 5GB bandwidth/month
- 50,000 monthly active users
- Suffisant pour MVP + early launch

### Third-Party Services

| Service | Utilisation | Epic | Credentials |
|---------|-------------|------|-------------|
| **Supabase** | Auth, Database, Realtime | 5 | NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY (Epic 1 setup) |
| **Vercel** | Hosting, CDN, Edge Functions | 6 | Auto via GitHub integration |
| **Vercel Analytics** (optional) | Web Vitals, custom events | 6 | Auto-activé |

**Setup dans Epic 1 (Story 1.1):**
- Créer projet Supabase (dashboard.supabase.com)
- Copier keys dans `.env.local`
- Pas besoin d'utiliser Supabase dans Epic 1 (auth/DB dans Epic 5)
- Setup anticipé pour éviter refactor ultérieur

## Acceptance Criteria (Authoritative)

**Note:** Les acceptance criteria détaillés par story sont définis dans `epics.md`. Cette section agrège les critères au niveau Epic pour validation globale.

### Epic 1 Acceptance Criteria

**AC-E1-1: Projet Initialisé et Buildable**
- **Given** le repository est cloné
- **When** je run `npm install && npm run build`
- **Then** le projet build sans erreurs TypeScript
- **And** `npm run dev` lance le serveur sur localhost:3000
- **And** la page affiche un canvas vide (prêt pour le jeu)

**AC-E1-2: Player Controllable avec Inputs Responsifs**
- **Given** le jeu est lancé
- **When** j'appuie sur WASD/Arrows
- **Then** le player se déplace horizontalement à 5 unités/frame
- **And** l'input latency est <100ms (perceptible immédiatement)
- **And** le player ne peut pas sortir des bords du canvas

**AC-E1-3: Jump System Fonctionnel**
- **Given** le player est au sol
- **When** j'appuie sur Space (tap court)
- **Then** le player saute à ~100px de hauteur
- **And** quand je hold Space, le saut atteint ~180px
- **And** un SFX "jump.mp3" joue au décollage
- **And** des particules de poussière apparaissent au sol

**AC-E1-4: Flap Wings System Complet**
- **Given** le player est en l'air après un saut
- **When** j'appuie sur Space une 2e fois
- **Then** le player effectue un flap avec boost vertical (velocityY = -15)
- **And** un SFX "flap.mp3" joue
- **And** 8-12 particules de plumes apparaissent radialement
- **And** l'animation de battement d'ailes joue
- **And** je ne peux faire qu'1 flap par saut (compteur limité)

**AC-E1-5: Glide System Actif**
- **Given** le player a flappé
- **When** je maintiens Space
- **Then** le player entre en mode glide (fall speed limité à -2)
- **And** le contrôle horizontal est augmenté (speed x1.3)
- **And** un SFX loop "glide-loop.mp3" joue
- **And** une trainée de particules suit le player
- **And** quand je relâche Space, le glide s'arrête

**AC-E1-6: Dash Mechanic avec i-Frames**
- **Given** le dash n'est pas en cooldown
- **When** j'appuie sur Shift
- **Then** le player dash à vitesse 20 pendant 200ms
- **And** pendant le dash, le player est invincible (i-frames actifs)
- **And** le sprite clignote (opacity 0.5-1.0)
- **And** un screenshake subtil se produit (amplitude 3px)
- **And** 15-20 particules rainbow trail apparaissent par frame
- **And** un SFX "dash.mp3" joue
- **And** un cooldown de 1 seconde empêche de re-dasher

**AC-E1-7: Parallax Environment Visuel**
- **Given** le jeu affiche le niveau
- **When** je me déplace horizontalement
- **Then** 5-7 couches de parallax scrollent à vitesses différentes
- **And** la couche background scroll à ~10% vitesse player
- **And** les couches intermédiaires scroll à 30%, 50%, 70%
- **And** la couche foreground (platforms) scroll à 100%
- **And** les couleurs respectent la palette "Crystal Cloudscape" (#1a1a2e, #533483, etc.)

**AC-E1-8: Performance 60 FPS Garanti**
- **Given** le jeu tourne avec toutes features Epic 1 activées
- **When** je joue pendant 5 minutes avec mouvements/particules intenses
- **Then** le framerate reste stable à 58-60 FPS (Chrome DevTools FPS meter)
- **And** l'object pooling est actif (500 particules max simultanées)
- **And** aucune nouvelle allocation mémoire durant game loop
- **And** le cold load time est <5 secondes
- **And** Lighthouse Performance score >85

**AC-E1-9: Audio System Fonctionnel**
- **Given** les assets audio sont dans `/public/audio/sfx/`
- **When** le jeu charge
- **Then** les 4 SFX (jump, flap, glide, dash) sont préchargés
- **And** les SFX jouent au moment approprié
- **And** le pitch des SFX varie légèrement (0.9-1.1) pour variété
- **And** le jeu continue si audio unavailable (pas de crash)

## Traceability Mapping

**Format:** AC → Spec Section → Component/API → Test Idea

| Acceptance Criteria | Spec Section | Component(s) | API(s) | Test Idea |
|---------------------|--------------|--------------|--------|-----------|
| **AC-E1-1: Projet Buildable** | Overview, Dependencies | Next.js setup, tsconfig.json | N/A | CI: npm run build success |
| **AC-E1-2: Player Controllable** | Detailed Design → Player, InputManager | Player.ts, InputManager.ts | handleMove() | Manual: Test WASD response time |
| **AC-E1-3: Jump System** | Detailed Design → Player, PhysicsSystem | Player.ts, PhysicsSystem.ts | handleJump() | Unit test: jump heights (tap vs hold) |
| **AC-E1-4: Flap Wings** | Detailed Design → Player, ParticleSystem | Player.ts, ParticleSystem.ts | handleFlap() | Manual: Verify particle spawn, SFX |
| **AC-E1-5: Glide System** | Detailed Design → Player, AudioManager | Player.ts, AudioManager.ts | handleGlide() | Manual: Verify glide physics, SFX loop |
| **AC-E1-6: Dash Mechanic** | Detailed Design → Player, Camera | Player.ts, Camera.ts | handleDash(), shake() | Manual: i-frames, cooldown, screenshake |
| **AC-E1-7: Parallax** | Detailed Design → RenderSystem, Camera | RenderSystem.ts, Camera.ts | getParallaxOffset() | Visual inspection: scroll speeds |
| **AC-E1-8: 60 FPS** | NFR Performance, ObjectPool | GameLoop.ts, ObjectPool.ts | update(deltaTime) | Chrome DevTools: FPS meter 5 min |
| **AC-E1-9: Audio** | Detailed Design → AudioManager | AudioManager.ts | preloadSounds(), play() | Manual: Audio playback, pitch variation |

**Coverage Analysis:**
- ✅ Tous les AC Epic 1 mappés à des composants spécifiques
- ✅ Toutes les APIs publiques utilisées dans les tests
- ✅ Mix de tests automatisables (unit) et manuels (game feel)

## Risks, Assumptions, Open Questions

### Risks

| Risk | Probabilité | Impact | Mitigation | Owner |
|------|-------------|--------|------------|-------|
| **R1: Performance <60 FPS sur devices bas de gamme** | Medium | High | Object pooling strict, viewport culling, profiling Chrome DevTools | Story 1.8 |
| **R2: Flap Wings mechanic pas fun/intuitive** | Medium | High | Playtesting early, ajuster timings (FLAP_FORCE, cooldowns) | Story 1.4 |
| **R3: Audio ne load pas (CORS, format unsupported)** | Low | Medium | Fallback graceful, try-catch dans preload, jeu jouable sans audio | Story 1.3 |
| **R4: Canvas 2D limité pour VFX avancés** | Low | Low | Acceptable pour MVP, Canvas 2D suffit pour aesthetic géométrique | Epic 4 |
| **R5: TypeScript strict mode ralentit dev** | Low | Low | Trade-off accepté, évite bugs runtime critiques | Story 1.1 |
| **R6: Next.js 16 trop récent (bugs?)** | Low | Medium | Next 16 sorti Oct 2024, stable depuis, Turbopack mature | Story 1.1 |

**Risk Response Plan:**
- **R1:** Si FPS <55 constamment, réduire particle count à 300, simplifier parallax à 3 layers
- **R2:** Ajuster constantes FLAP_FORCE (essayer -12 à -18), ajouter animation feedback
- **R3:** Déjà mitigé (fallback dans spec), pas d'action additionnelle
- **R4:** Monitorer, si VFX insufficient en Epic 4, évaluer PixiJS (hors scope Epic 1)

### Assumptions

| Assumption | Impact si Faux | Validation |
|------------|----------------|------------|
| **A1: Canvas 2D supporté par 95%+ browsers modernes** | Game unplayable pour certains users | MDN compatibility table, caniuse.com |
| **A2: 60 FPS atteignable avec Canvas 2D natif** | Besoin refactor vers WebGL/PixiJS | Prototyping Story 1.2, profiling Story 1.8 |
| **A3: Web Audio API suffit (pas besoin Howler.js)** | Audio features limitées | Test SFX overlap, loops, pitch variation Story 1.3 |
| **A4: Object pooling élimine GC pauses** | Frame drops persistent | Chrome DevTools Memory profiler Story 1.8 |
| **A5: Supabase free tier suffisant pour dev** | Dépassement limites, besoin upgrade | Monitor Supabase dashboard usage |
| **A6: Vercel Hobby plan OK pour MVP launch** | Bandwidth/compute dépassés | Vercel Analytics monitoring Epic 6 |

**Validation Plan:**
- A1: Testé au build Story 1.1
- A2: Validé en continu, critical checkpoint Story 1.8
- A3: Validé Story 1.3-1.4
- A4: Validé Story 1.8 via profiling
- A5-A6: Monitoring continu Epic 5-6

### Open Questions

| Question | Impact | Owner | Deadline |
|----------|--------|-------|----------|
| **Q1: Platformes statiques ou dynamiques pour Epic 1?** | Scope Story 1.7 | Story 1.7 | Avant implémentation 1.7 |
| **Q2: Sprites custom ou géométrie pure pour MVP?** | Visual quality, art time | Story 1.7 | Avant implémentation 1.7 |
| **Q3: Debug mode (touche D) dans Epic 1 ou Epic 4?** | Developer experience | Story 1.8 | Optional, can defer |
| **Q4: Screenshake amplitude trop forte/faible?** | Game feel | Story 1.6 | Playtesting post-Story 1.6 |

**Answers (à mettre à jour pendant implémentation):**
- Q1: **Statiques** - plateformes dynamiques dans Epic 2 (procgen)
- Q2: **Géométrie pure** - rectangles colorés OK pour Epic 1, sprites custom en Epic 4 si temps
- Q3: **Epic 1 (Story 1.8)** - utile immédiatement pour debug physics/collision
- Q4: **À tester** - commencer amplitude 3-5px, ajuster selon feedback

## Test Strategy Summary

### Test Levels

**Pour Epic 1 (Foundation), priorité sur tests manuels et exploratory testing car focus "game feel".**

#### 1. Unit Tests (Stretch Goal)

**Scope:** Fonctions pures, helpers mathématiques, constantes

```typescript
// Example: src/game/utils/MathUtils.test.ts
describe('MathUtils', () => {
  test('lerp interpolates correctly', () => {
    expect(lerp(0, 100, 0.5)).toBe(50)
    expect(lerp(10, 20, 0)).toBe(10)
    expect(lerp(10, 20, 1)).toBe(20)
  })

  test('clamp restricts value to range', () => {
    expect(clamp(5, 0, 10)).toBe(5)
    expect(clamp(-5, 0, 10)).toBe(0)
    expect(clamp(15, 0, 10)).toBe(10)
  })
})
```

**Frameworks (si implémentés):**
- Vitest (compatible Next.js, rapide)
- @testing-library/react (pour GameCanvas component mount/unmount)

**Coverage Target:** >70% pour utils, pas de target strict pour game logic

#### 2. Manual Testing (Primaire)

**Scope:** Tout le gameplay, game feel, performance

**Test Cases Critiques:**

| Test Case | Steps | Expected Result | Story |
|-----------|-------|-----------------|-------|
| **TC-1: Basic Movement** | 1. Launch game<br>2. Press WASD/Arrows | Player moves smoothly, no lag | 1.2 |
| **TC-2: Jump Heights** | 1. Tap Space (release quickly)<br>2. Hold Space (release at peak) | Short jump ~100px, long jump ~180px | 1.3 |
| **TC-3: Flap Sequence** | 1. Jump<br>2. Mid-air Space press | Flap activates, boost vertical, particle effect | 1.4 |
| **TC-4: Glide Control** | 1. Jump → Flap<br>2. Hold Space | Fall speed capped, horizontal speed boosted | 1.5 |
| **TC-5: Dash i-Frames** | 1. Press Shift<br>2. Verify invincibility (future: collide enemy) | Sprite flickers, screenshake, trail particles | 1.6 |
| **TC-6: Parallax Scroll** | 1. Move right 500px<br>2. Observe layers | Background scrolls slower than foreground | 1.7 |
| **TC-7: 60 FPS Sustained** | 1. Play 5 minutes<br>2. Spam dash/jump/particles | FPS stays 58-60, no drops | 1.8 |
| **TC-8: Audio Playback** | 1. Perform jump, flap, glide, dash<br>2. Listen | All SFX play correctly, pitch varies slightly | 1.3-1.6 |

**Tester:** Développeur (Fab) pendant implémentation, puis friends/family pour feedback game feel

#### 3. Performance Testing (Critique)

**Tools:**
- Chrome DevTools Performance tab (flame graph, FPS meter)
- Chrome DevTools Memory profiler (heap snapshots)
- Lighthouse (cold load performance)

**Test Scenarios:**

| Scenario | Metrics | Pass Criteria | Story |
|----------|---------|---------------|-------|
| **Sustained Gameplay** | FPS, Memory | 58-60 FPS pendant 5 min, <150MB heap | 1.8 |
| **Particle Stress Test** | FPS, Active Particles | 60 FPS avec 500 particules actives | 1.8 |
| **Cold Load** | LCP, FCP, TTI | <5s cold load, Lighthouse >85 | 1.1, Epic 6 |
| **GC Pauses** | GC duration | <5ms max GC pause | 1.8 |

**Pass Criteria:** Tous les NFRs Performance doivent être atteints

#### 4. Exploratory Testing (Game Feel)

**Scope:** Subjective feel, polish, feedback satisfaisant

**Focus Areas:**
- Jump feel responsive? Trop floaty ou trop snappy?
- Flap timing intuitif?
- Glide contrôle fun?
- Dash impactful? Screenshake trop fort?
- Particules satisfaisantes?
- Audio bien synchronisé avec actions?

**Method:** Sessions 30-60 minutes, prendre notes, ajuster constantes

**Iteration:** Ajuster JUMP_FORCE, FLAP_FORCE, timings basés sur feedback

#### 5. Regression Testing (Epic 2+)

**Scope:** Quand Epic 2+ modifie core systems

**Strategy:**
- Re-run TC-1 à TC-8 après chaque epic
- Vérifier aucun break de mouvement/physiques
- Automated tests (si écrits) run en CI

### Test Coverage Mapping

| Story | Unit Tests | Manual Tests | Performance Tests | Exploratory |
|-------|------------|--------------|-------------------|-------------|
| 1.1 Setup | ✅ Build success | ✅ Dev server runs | ✅ Cold load <5s | - |
| 1.2 Movement | (Stretch) | ✅ TC-1 | ✅ FPS check | ✅ Feel test |
| 1.3 Jump | ✅ Heights calc | ✅ TC-2 | - | ✅ Feel test |
| 1.4 Flap | - | ✅ TC-3 | - | ✅ Feel test |
| 1.5 Glide | - | ✅ TC-4 | - | ✅ Feel test |
| 1.6 Dash | - | ✅ TC-5 | - | ✅ Feel test |
| 1.7 Parallax | - | ✅ TC-6 | - | ✅ Visual inspect |
| 1.8 Performance | ✅ ObjectPool | ✅ TC-7 | ✅ Sustained, Stress | - |

### Edge Cases & Boundary Conditions

| Edge Case | Expected Behavior | Test Method |
|-----------|-------------------|-------------|
| Spam Space très rapidement | Flap count respecté, pas de double flap | Manual spam test |
| Dash pendant jump | Dash fonctionne normalement en l'air | Manual test |
| Player hors limites canvas | Clamped aux bords, pas de sortie | Manual edge test |
| Audio files 404 | Game continue, console.warn logged | Mock 404 response |
| Canvas context null | Show error message, pas de crash | Remove canvas element test |
| 0 deltaTime (rare RAF bug) | Skip frame, pas de division by zero | Mock RAF with 0 delta |

### Acceptance Sign-Off

**Epic 1 est considéré DONE quand:**
1. ✅ Tous les AC Epic 1 (AC-E1-1 à AC-E1-9) passent
2. ✅ Tous les test cases manuels critiques (TC-1 à TC-8) passent
3. ✅ Performance NFRs atteints (60 FPS, <5s load, <150MB heap)
4. ✅ Code review passé (TypeScript strict, pas de `any`, commenting des APIs publiques)
5. ✅ Game feel subjectivement satisfaisant (developer + 1-2 playtesters)

**Sign-Off:** Fab (Developer) après completion Story 1.8 et validation complète
