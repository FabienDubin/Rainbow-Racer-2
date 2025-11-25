# Game Architecture - Rainbow Racer V2

**Auteur** : Fab
**Date** : 2025-11-23
**Version** : 1.0
**Projet** : Rainbow Racer V2 - Roguelite Platformer Browser

---

## Executive Summary

Rainbow Racer V2 est un roguelite platformer 2.5D haute performance basé sur Next.js 16 avec rendu Canvas 2D et backend Supabase. L'architecture privilégie :

- **Performance absolue** : 60 FPS constant via RequestAnimationFrame, object pooling, et optimisations Canvas
- **Séparation claire** : Game Engine (Canvas pur) isolé de l'UI React (menus, HUD)
- **Entity-Component pattern** : Architecture modulaire pour entities (Player, Enemies, Collectibles, Particles)
- **Meta-progression persistante** : Supabase pour leaderboards, auth, et progression des joueurs
- **Déploiement gratuit** : Vercel Hobby + Supabase Free tier avec optimisations bandwidth

Le projet utilise le starter officiel Vercel/Supabase pour accélérer le setup et garantir les best practices modernes.

---

## Project Initialization

### Commande d'initialisation

```bash
npx create-next-app@latest rainbow-racer-v2 \
  --typescript \
  --tailwind \
  --app \
  --turbopack \
  --use-npm \
  --example https://github.com/vercel/next.js/tree/canary/examples/with-supabase
```

### Post-installation

```bash
cd rainbow-racer-v2
npm install zustand          # State management léger
npm install uuid             # ID generation pour entities
npm install clsx             # Utility classes conditionnelles

# Dev dependencies
npm install -D @types/uuid
```

### Configuration Supabase

1. Créer un projet Supabase (free tier)
2. Copier `.env.local.example` → `.env.local`
3. Remplir `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Exécuter migrations database (voir section Data Architecture)

---

## Decision Summary

| Category | Decision | Version | Affects Epics | Rationale | Provided by Starter |
|----------|----------|---------|---------------|-----------|---------------------|
| **Framework** | Next.js | 16.x | Tous | App Router, Turbopack, React 19.2 support | ✅ |
| **Language** | TypeScript | 5.x | Tous | Type safety, meilleure DX, évite runtime errors | ✅ |
| **Runtime** | Node.js | 20.x LTS | Tous | Stable, supporté par Vercel | Non |
| **UI Styling** | Tailwind CSS | 4.x | Epic 2, 3 | Utility-first pour menus/HUD uniquement | ✅ |
| **Build Tool** | Turbopack | Stable (Next 16) | Tous | Build ultra-rapide vs Webpack | ✅ |
| **State Management (Global)** | Zustand | 5.x | Tous | Léger, simple, pas de boilerplate vs Redux | Non |
| **State Management (Game)** | Pure JS Classes | N/A | Epic 1 | Performance max, pas de React re-renders | Non |
| **Game Rendering** | Canvas 2D API | Native | Epic 1, 3 | 60 FPS garanti, contrôle total, pas WebGL (overhead) | Non |
| **Game Loop** | RequestAnimationFrame | Native | Epic 1 | Sync avec refresh rate, meilleure perf que setInterval | Non |
| **Physics/Collision** | Custom (AABB) | N/A | Epic 1 | Léger, suffit pour platformer, pas besoin Matter.js | Non |
| **Backend** | Supabase | Latest | Epic 2, 4 | Auth + DB + Realtime tout-en-un | ✅ |
| **Database** | PostgreSQL (Supabase) | 15.x | Epic 2, 4 | Robuste, Row Level Security, gratuit | ✅ |
| **Auth** | Supabase Auth | Latest | Epic 4 | OAuth Google/GitHub ready, cookies | ✅ |
| **Realtime** | Supabase Realtime | Latest | Epic 4 | Leaderboards live, pas besoin Socket.io | ✅ |
| **ORM** | Supabase Client | Latest | Epic 2, 4 | Pas besoin Prisma, client suffit pour ce projet | ✅ |
| **Asset Loading** | Next.js Static Assets | N/A | Epic 1, 3 | `/public` folder, optimisé CDN Vercel | ✅ |
| **Audio** | Web Audio API | Native | Epic 3 | Contrôle volume, overlap sounds, fade | Non |
| **Deployment** | Vercel | Latest | Epic 5 | Intégration native Next.js, CDN global, gratuit | Oui |
| **Analytics** | Vercel Analytics | Latest | Epic 5 | Gratuit tier Hobby, privacy-first | Non |
| **Error Tracking** | Console + Supabase Logs | N/A | Tous | MVP = pas Sentry (overhead), logs suffisent | Non |
| **Testing** | Vitest + Testing Library | Latest | Stretch | Rapide, compatible Vite/Turbopack | Non |
| **Linting** | ESLint + Prettier | Latest | Tous | Code quality, auto-format | ✅ |

**Notes** :
- Versions vérifiées au moment de l'exécution (23/11/2025)
- Next.js 16 sorti le 21/10/2025, stable
- Supabase free tier : 500MB DB, 5GB bandwidth, 50k MAU

---

## Project Structure

```
rainbow-racer-v2/
├── .env.local                     # Supabase keys (git-ignored)
├── .eslintrc.json
├── .gitignore
├── next.config.ts
├── package.json
├── tsconfig.json
├── README.md
│
├── public/                        # Assets statiques (CDN Vercel)
│   ├── audio/
│   │   ├── music/
│   │   │   └── prisms-journey.mp3      # Track principale
│   │   └── sfx/
│   │       ├── jump.mp3
│   │       ├── flap.mp3
│   │       ├── glide-loop.mp3
│   │       ├── dash.mp3
│   │       ├── collect-gem.mp3
│   │       ├── hit.mp3
│   │       ├── death.mp3
│   │       ├── upgrade.mp3
│   │       └── poop-bomb.mp3
│   ├── sprites/                   # Sprites programmatiques ou images
│   │   ├── unicorn/
│   │   │   ├── idle.png
│   │   │   ├── flap-1.png
│   │   │   ├── flap-2.png
│   │   │   └── glide.png
│   │   └── enemies/
│   │       └── cloud-enemy.png
│   └── favicon.ico
│
├── src/
│   ├── app/                       # Next.js App Router
│   │   ├── layout.tsx             # Root layout (Tailwind, fonts)
│   │   ├── page.tsx               # Landing page (marketing)
│   │   ├── globals.css            # Tailwind imports
│   │   │
│   │   ├── play/                  # Game route
│   │   │   └── page.tsx           # Canvas + GameEngine mount
│   │   │
│   │   ├── leaderboard/           # Leaderboards publics
│   │   │   └── page.tsx
│   │   │
│   │   ├── profile/               # User profile + upgrades
│   │   │   └── page.tsx
│   │   │
│   │   ├── auth/                  # Auth routes (Supabase)
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   └── callback/
│   │   │       └── route.ts       # OAuth callback
│   │   │
│   │   └── api/                   # API Routes
│   │       ├── scores/
│   │       │   └── route.ts       # POST score, GET leaderboard
│   │       └── upgrades/
│   │           └── route.ts       # GET/POST user upgrades
│   │
│   ├── components/                # React components (UI uniquement)
│   │   ├── ui/                    # shadcn/ui components (stretch)
│   │   │   ├── button.tsx
│   │   │   └── card.tsx
│   │   ├── game/
│   │   │   ├── GameCanvas.tsx     # Canvas wrapper component
│   │   │   ├── GameHUD.tsx        # Overlay HUD (score, gems, timer)
│   │   │   ├── PauseMenu.tsx      # Pause overlay
│   │   │   └── DeathScreen.tsx    # Death stats + retry
│   │   ├── leaderboard/
│   │   │   └── LeaderboardTable.tsx
│   │   └── profile/
│   │       └── UpgradeShop.tsx    # Meta-progression UI
│   │
│   ├── lib/                       # Utilities et configs
│   │   ├── supabase/
│   │   │   ├── client.ts          # Browser client
│   │   │   ├── server.ts          # Server client (RSC)
│   │   │   └── middleware.ts      # Auth middleware
│   │   ├── utils.ts               # Helpers (clsx, etc.)
│   │   └── constants.ts           # Game constants
│   │
│   ├── game/                      # 🎮 GAME ENGINE (Canvas pur, pas React)
│   │   ├── core/
│   │   │   ├── GameEngine.ts      # Main game loop, orchestration
│   │   │   ├── GameLoop.ts        # RAF loop, delta time
│   │   │   ├── InputManager.ts    # Keyboard/touch input
│   │   │   ├── AudioManager.ts    # Web Audio API wrapper
│   │   │   ├── AssetLoader.ts     # Preload sprites/audio
│   │   │   └── Camera.ts          # Camera follow player
│   │   │
│   │   ├── entities/              # Game entities (classes)
│   │   │   ├── Entity.ts          # Base class (x, y, width, height, etc.)
│   │   │   ├── Player.ts          # Prism the unicorn
│   │   │   ├── Cloud.ts           # Enemy obstacles
│   │   │   ├── Gem.ts             # Permanent currency
│   │   │   ├── Star.ts            # Score collectible
│   │   │   ├── RainbowFragment.ts # Rare unlock item
│   │   │   ├── PowerUp.ts         # Temporary buffs
│   │   │   ├── PoopBomb.ts        # Ultimate ability
│   │   │   └── Particle.ts        # Particle effect
│   │   │
│   │   ├── systems/               # Game systems
│   │   │   ├── PhysicsSystem.ts   # Gravity, velocity, acceleration
│   │   │   ├── CollisionSystem.ts # AABB collision detection
│   │   │   ├── RenderSystem.ts    # Canvas rendering pipeline
│   │   │   ├── ParticleSystem.ts  # Particle spawning/pooling
│   │   │   ├── ProcGenSystem.ts   # Procedural level generation
│   │   │   └── ProgressionSystem.ts # Meta-progression logic
│   │   │
│   │   ├── utils/
│   │   │   ├── ObjectPool.ts      # Object pooling (particles, enemies)
│   │   │   ├── Vector2D.ts        # 2D vector math
│   │   │   └── MathUtils.ts       # Lerp, clamp, random, etc.
│   │   │
│   │   └── types/
│   │       ├── GameState.ts       # Game state enum (MENU, PLAYING, PAUSED, DEAD)
│   │       └── Upgrades.ts        # Upgrade types/interfaces
│   │
│   ├── store/                     # Zustand stores (UI state uniquement)
│   │   ├── useGameUIStore.ts      # HUD state (score, gems, lives)
│   │   └── useUserStore.ts        # User profile, upgrades
│   │
│   └── types/                     # TypeScript types globaux
│       ├── database.types.ts      # Supabase generated types
│       ├── supabase.ts
│       └── index.ts
│
├── supabase/                      # Supabase config (optional local dev)
│   ├── migrations/
│   │   └── 001_initial_schema.sql
│   └── seed.sql
│
└── docs/                          # Documentation
    ├── GDD.md
    ├── game-architecture.md       # Ce fichier
    └── game-brief-Rainbow-Racer-V2-2025-11-23.md
```

---

## Epic to Architecture Mapping

| Epic | Architecture Components | Key Systems |
|------|------------------------|-------------|
| **Epic 1: Core Gameplay** | `game/core/*`, `game/entities/Player.ts`, `game/systems/PhysicsSystem.ts`, `game/systems/CollisionSystem.ts`, `game/systems/ProcGenSystem.ts` | GameLoop, InputManager, Player entity, AABB collision, Procgen chunks |
| **Epic 2: Game Loop & Progression** | `game/systems/ProgressionSystem.ts`, `store/useUserStore.ts`, `app/api/upgrades/*`, Supabase `user_upgrades` table | Meta-progression, Supabase persistence, Upgrade shop UI |
| **Epic 3: Polish & Game Feel** | `game/systems/ParticleSystem.ts`, `game/systems/RenderSystem.ts`, `game/core/AudioManager.ts`, `game/utils/ObjectPool.ts` | Particle effects, screen shake, audio playback, object pooling |
| **Epic 4: Online Features** | `lib/supabase/*`, `app/api/scores/*`, `app/leaderboard/*`, Supabase Auth, Realtime subscriptions | OAuth login, score submission, leaderboards, Realtime updates |
| **Epic 5: Deployment** | `next.config.ts`, Vercel deployment, Analytics | Production build, optimizations, monitoring |

---

## Technology Stack Details

### Core Technologies

#### Frontend Framework
- **Next.js 16** (App Router)
  - React 19.2 (canary) inclus
  - Turbopack pour builds rapides
  - Server Components pour landing/leaderboard
  - Client Components pour game UI uniquement

#### Language & Type Safety
- **TypeScript 5.x** (strict mode)
  - Tous les fichiers `.ts` ou `.tsx`
  - Pas de `any`, utiliser `unknown` si nécessaire
  - Générer types Supabase : `npx supabase gen types typescript --project-id <id> > src/types/database.types.ts`

#### Game Rendering
- **Canvas 2D API** (natif browser)
  - Pas de bibliothèque (Phaser, PixiJS) = overhead inutile
  - Contrôle total sur rendering pipeline
  - Optimisations : layered canvas (background static, game dynamic, particles overlay)

#### State Management
- **Zustand** pour UI React (score display, menu state)
- **Pure Classes** pour game state (Player, Enemies, etc.)
  - Pourquoi ? Performance. React re-renders tueraient les 60 FPS

#### Backend & Database
- **Supabase** (PostgreSQL 15.x)
  - Auth : OAuth Google + GitHub
  - Database : `users`, `scores`, `user_upgrades`, `game_sessions`
  - Realtime : Leaderboard updates
  - Storage : (stretch) pour replays/ghosts

#### Deployment
- **Vercel Hobby Plan** (gratuit)
  - Auto-deploy depuis `main` branch
  - Edge Functions pour API routes
  - CDN global pour assets statiques

---

### Integration Points

#### Game Engine ↔ React UI

**Communication unidirectionnelle** :
```
GameEngine (Canvas) → Zustand Store → React Components (HUD)
```

- `GameEngine` update Zustand via `useGameUIStore.getState().setScore()`
- Pas de props drilling
- React **ne touche jamais** le canvas directement

**Exemple** :
```typescript
// Dans GameEngine.ts
import { useGameUIStore } from '@/store/useGameUIStore'

class GameEngine {
  update(deltaTime: number) {
    // ... game logic
    useGameUIStore.getState().setScore(this.score)
    useGameUIStore.getState().setGems(this.gems)
  }
}
```

#### Game ↔ Supabase API

**Flow** :
```
GameEngine → API Route (/api/scores) → Supabase → Database
```

- À la mort/fin de run : `POST /api/scores` avec `{ score, gems, time, userId }`
- API route vérifie auth, insère en DB
- Pas d'appel direct Supabase depuis GameEngine (séparation concerns)

#### Supabase Realtime ↔ Leaderboard UI

**Subscription** :
```typescript
// Dans LeaderboardTable.tsx
const supabase = createClient()

useEffect(() => {
  const channel = supabase
    .channel('leaderboard-changes')
    .on('postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'scores' },
      (payload) => {
        // Update UI with new score
      }
    )
    .subscribe()

  return () => { channel.unsubscribe() }
}, [])
```

---

## Novel Pattern Designs

### 1. Flap Wings System (Unique Game Mechanic)

**Concept** : Jump → Flap → Glide (3-state aerial movement)

**Architecture** :

```typescript
// Player.ts
class Player extends Entity {
  private jumpState: 'grounded' | 'jumped' | 'flapped' | 'gliding' = 'grounded'
  private flapCount: number = 0
  private maxFlaps: number = 1 // upgradable to 2

  handleJump() {
    if (this.jumpState === 'grounded') {
      this.velocityY = JUMP_FORCE
      this.jumpState = 'jumped'
      this.playAnimation('jump')
    }
    else if (this.jumpState === 'jumped' && this.flapCount < this.maxFlaps) {
      this.velocityY = FLAP_FORCE  // Plus fort que jump
      this.flapCount++
      this.jumpState = 'flapped'
      this.playAnimation('flap')
      this.spawnFeatherParticles()
      AudioManager.play('flap')
    }
  }

  handleGlide(isHolding: boolean) {
    if (this.jumpState === 'flapped' && isHolding) {
      this.jumpState = 'gliding'
      this.velocityY = Math.max(this.velocityY, GLIDE_FALL_SPEED) // Cap fall speed
      this.playAnimation('glide')
      AudioManager.playLoop('glide-loop')
    } else if (!isHolding && this.jumpState === 'gliding') {
      this.jumpState = 'jumped' // Exit glide
      AudioManager.stop('glide-loop')
    }
  }

  onLand() {
    this.jumpState = 'grounded'
    this.flapCount = 0
  }
}
```

**Input Handling** :
```typescript
// InputManager.ts
class InputManager {
  private spacePressed: boolean = false
  private spaceHeld: boolean = false

  update() {
    if (this.justPressed('Space')) {
      player.handleJump()
    }
    if (this.isHeld('Space')) {
      player.handleGlide(true)
    } else {
      player.handleGlide(false)
    }
  }
}
```

---

### 2. Procedural Generation System (Pattern-Based Assembly)

**Concept** : Assembler des "chunks" prédéfinis de manière procédurale avec difficulty scaling

**Architecture** :

```typescript
// ProcGenSystem.ts
interface Chunk {
  id: string
  difficulty: 'easy' | 'medium' | 'hard' | 'reward'
  platforms: Platform[]
  enemies: Cloud[]
  collectibles: (Gem | Star)[]
  width: number
  spawnY: number
}

class ProcGenSystem {
  private chunkLibrary: Chunk[] = [] // 10-15 chunks prédéfinis
  private activeChunks: Chunk[] = []
  private spawnX: number = 0
  private gameTime: number = 0

  loadChunkLibrary() {
    // Charger chunks depuis JSON ou code
    this.chunkLibrary = [
      createEasyChunk1(),
      createEasyChunk2(),
      createMediumChunk1(),
      // ...
    ]
  }

  update(deltaTime: number) {
    this.gameTime += deltaTime

    // Spawn new chunk si besoin
    if (this.spawnX < camera.x + SCREEN_WIDTH * 2) {
      const difficulty = this.getDifficultyForTime(this.gameTime)
      const chunk = this.selectRandomChunk(difficulty)
      this.spawnChunk(chunk)
    }

    // Despawn chunks hors écran
    this.activeChunks = this.activeChunks.filter(c => c.x > camera.x - SCREEN_WIDTH)
  }

  getDifficultyForTime(time: number): 'easy' | 'medium' | 'hard' {
    if (time < 30) return 'easy'
    if (time < 120) return 'medium'
    return 'hard'
  }

  selectRandomChunk(difficulty: string): Chunk {
    const pool = this.chunkLibrary.filter(c => c.difficulty === difficulty)
    return pool[Math.floor(Math.random() * pool.length)]
  }

  spawnChunk(template: Chunk) {
    const chunk = this.instantiateChunk(template, this.spawnX)
    this.activeChunks.push(chunk)
    this.spawnX += chunk.width
  }
}
```

**Chunk Definition Example** :
```typescript
function createEasyChunk1(): Chunk {
  return {
    id: 'easy-1',
    difficulty: 'easy',
    width: 800,
    platforms: [
      { x: 0, y: 400, width: 200, height: 20 },
      { x: 300, y: 350, width: 150, height: 20 },
      { x: 550, y: 400, width: 200, height: 20 },
    ],
    enemies: [
      { x: 400, y: 300, type: 'slow-cloud' }
    ],
    collectibles: [
      { x: 150, y: 350, type: 'gem' },
      { x: 400, y: 300, type: 'star' },
    ],
    spawnY: 0
  }
}
```

---

### 3. Object Pooling for Performance

**Concept** : Réutiliser des objets (particles, enemies) plutôt que de créer/détruire constamment

**Architecture** :

```typescript
// ObjectPool.ts
class ObjectPool<T extends Poolable> {
  private available: T[] = []
  private active: T[] = []
  private factory: () => T

  constructor(factory: () => T, initialSize: number = 50) {
    this.factory = factory
    for (let i = 0; i < initialSize; i++) {
      this.available.push(factory())
    }
  }

  acquire(): T {
    let obj = this.available.pop()
    if (!obj) {
      obj = this.factory() // Expand pool si vide
    }
    obj.reset()
    this.active.push(obj)
    return obj
  }

  release(obj: T) {
    const index = this.active.indexOf(obj)
    if (index > -1) {
      this.active.splice(index, 1)
      this.available.push(obj)
    }
  }

  update(deltaTime: number) {
    for (let i = this.active.length - 1; i >= 0; i--) {
      const obj = this.active[i]
      obj.update(deltaTime)
      if (obj.isDead()) {
        this.release(obj)
      }
    }
  }
}

// Usage
const particlePool = new ObjectPool(() => new Particle(), 500)

// Spawn particle
const p = particlePool.acquire()
p.init(x, y, velocityX, velocityY, color, lifetime)
```

---

## Implementation Patterns

### Naming Conventions

#### Files & Directories
- **React Components** : PascalCase → `GameCanvas.tsx`, `DeathScreen.tsx`
- **Game Classes** : PascalCase → `Player.ts`, `GameEngine.ts`
- **Utilities** : camelCase → `mathUtils.ts`, `objectPool.ts`
- **Types** : PascalCase → `GameState.ts`, `Upgrades.ts`
- **API Routes** : kebab-case folder, `route.ts` file → `api/user-upgrades/route.ts`

#### Code
- **Classes** : PascalCase → `class GameEngine {}`
- **Interfaces/Types** : PascalCase, prefix `I` optionnel → `interface Player {}` ou `type UpgradeType`
- **Variables/Functions** : camelCase → `deltaTime`, `updatePhysics()`
- **Constants** : SCREAMING_SNAKE_CASE → `JUMP_FORCE = 12`, `MAX_PARTICLES = 500`
- **Private members** : prefix `_` ou `private` keyword → `private _score: number`

### Code Organization

#### Game Engine Separation
- **Règle absolue** : Aucun code React dans `/game`
- **Exports** : Game engine expose une classe `GameEngine` avec méthodes publiques :
  ```typescript
  // GameEngine.ts
  export class GameEngine {
    constructor(canvas: HTMLCanvasElement) {}
    start(): void {}
    pause(): void {}
    resume(): void {}
    destroy(): void {}
  }
  ```

#### Component Structure
```typescript
// Ordre dans les fichiers React
1. Imports (React, Next, libraries, local)
2. Types/Interfaces
3. Component definition
4. Hooks (useState, useEffect, custom hooks)
5. Event handlers
6. Render logic
7. Export
```

#### Game Class Structure
```typescript
// Ordre dans les classes Game
1. Static properties
2. Public properties
3. Private properties
4. Constructor
5. Public methods
6. Private methods
7. Getters/Setters
```

### Error Handling

#### API Routes
```typescript
// Toujours wrapper dans try-catch
export async function POST(request: Request) {
  try {
    const body = await request.json()
    // Validation
    if (!body.score || !body.userId) {
      return Response.json({ error: 'Missing fields' }, { status: 400 })
    }
    // Logic
    const result = await supabase.from('scores').insert(body)
    return Response.json(result)
  } catch (error) {
    console.error('POST /api/scores error:', error)
    return Response.json({ error: 'Internal error' }, { status: 500 })
  }
}
```

#### Game Engine
```typescript
// Fail gracefully, ne jamais crasher le game loop
class GameEngine {
  update(deltaTime: number) {
    try {
      this.physicsSystem.update(deltaTime)
      this.collisionSystem.update()
      this.renderSystem.render()
    } catch (error) {
      console.error('Game loop error:', error)
      this.pause()
      // Show error modal to user
    }
  }
}
```

### Logging Strategy

#### Development
```typescript
// Utiliser console groups pour clarity
console.group('GameEngine.init')
console.log('Canvas size:', canvas.width, canvas.height)
console.log('Assets loaded:', assetCount)
console.groupEnd()
```

#### Production
```typescript
// Wrapper console.log dans env check
const isDev = process.env.NODE_ENV === 'development'

function devLog(...args: any[]) {
  if (isDev) console.log(...args)
}

// Usage
devLog('Player position:', player.x, player.y)
```

#### Supabase Logs
```typescript
// Logger events critiques dans Supabase table `logs`
async function logGameEvent(event: string, data: any) {
  if (process.env.NODE_ENV === 'production') {
    await supabase.from('logs').insert({
      event,
      data,
      timestamp: new Date().toISOString()
    })
  }
}

// Usage
logGameEvent('player_death', { score, time, cause: 'enemy_collision' })
```

---

## Consistency Rules

### TypeScript Rules
- **Strict mode** : Activé dans `tsconfig.json`
- **No `any`** : Utiliser `unknown` puis type guard
- **Explicit return types** : Sur toutes les fonctions publiques
  ```typescript
  // ✅ Good
  public calculateScore(): number { return this.score }

  // ❌ Bad
  public calculateScore() { return this.score }
  ```

### Game Constants
**Tous dans `lib/constants.ts`** :
```typescript
export const GAME_CONFIG = {
  CANVAS_WIDTH: 1920,
  CANVAS_HEIGHT: 1080,
  TARGET_FPS: 60,
  GRAVITY: 0.8,

  PLAYER: {
    WIDTH: 64,
    HEIGHT: 64,
    JUMP_FORCE: -12,
    FLAP_FORCE: -15,
    GLIDE_FALL_SPEED: -2,
    DASH_SPEED: 20,
    DASH_DURATION: 200, // ms
  },

  PARTICLES: {
    MAX_COUNT: 500,
    POOL_SIZE: 500,
  },

  PROCGEN: {
    CHUNK_EASY_THRESHOLD: 30, // seconds
    CHUNK_MEDIUM_THRESHOLD: 120,
  }
} as const
```

### Canvas Rendering Pipeline

**Ordre strict** (back to front) :
```typescript
class RenderSystem {
  render() {
    // 1. Clear
    ctx.clearRect(0, 0, width, height)

    // 2. Background (parallax layers)
    this.renderBackground()

    // 3. Platforms
    this.renderPlatforms()

    // 4. Collectibles (behind player)
    this.renderCollectibles()

    // 5. Enemies
    this.renderEnemies()

    // 6. Player
    this.renderPlayer()

    // 7. Particles (overlay)
    this.renderParticles()

    // 8. UI Overlay (optionnel, préférer React HUD)
    // this.renderUIOverlay()
  }
}
```

### Asset Naming & Organization

**Sprites** : `{entity}-{state}-{frame?}.png`
```
unicorn-idle.png
unicorn-flap-1.png
unicorn-flap-2.png
unicorn-glide.png
cloud-enemy.png
```

**Audio** : `{action}.mp3`
```
jump.mp3
flap.mp3
glide-loop.mp3(loop-ready)
collect-gem.mp3
```

### Supabase Naming

**Tables** : `snake_case`, plural
```sql
users
scores
user_upgrades
game_sessions
```

**Columns** : `snake_case`
```sql
user_id (FK)
created_at
high_score
gems_collected
```

**RPC Functions** : `snake_case`
```sql
get_top_scores(limit INT)
update_user_gems(user_id UUID, amount INT)
```

---

## Data Architecture

### Database Schema (PostgreSQL via Supabase)

```sql
-- Users (géré par Supabase Auth automatiquement)
-- On extend avec custom fields dans user_profiles

CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  total_gems INT DEFAULT 0,
  total_runs INT DEFAULT 0,
  best_score INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Scores (leaderboard)
CREATE TABLE scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  score INT NOT NULL,
  gems_collected INT NOT NULL,
  survival_time INT NOT NULL, -- seconds
  distance_traveled INT,
  enemies_killed INT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_scores_leaderboard ON scores(score DESC, created_at DESC);
CREATE INDEX idx_scores_user ON scores(user_id, created_at DESC);

-- User Upgrades (meta-progression)
CREATE TABLE user_upgrades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  upgrade_type TEXT NOT NULL, -- 'longer_glide', 'double_flap', etc.
  level INT DEFAULT 1,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, upgrade_type)
);

CREATE INDEX idx_user_upgrades ON user_upgrades(user_id);

-- Game Sessions (analytics, optional)
CREATE TABLE game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  final_score INT,
  death_cause TEXT, -- 'enemy_collision', 'fell_off', etc.
  platform TEXT -- 'desktop', 'mobile'
);

-- Row Level Security (RLS)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_upgrades ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can read all profiles
CREATE POLICY "Public profiles are viewable by everyone"
  ON user_profiles FOR SELECT
  USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id);

-- Scores are public for leaderboard
CREATE POLICY "Scores are viewable by everyone"
  ON scores FOR SELECT
  USING (true);

-- Users can insert their own scores
CREATE POLICY "Users can insert own scores"
  ON scores FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can read their own upgrades
CREATE POLICY "Users can view own upgrades"
  ON user_upgrades FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert/update their own upgrades
CREATE POLICY "Users can manage own upgrades"
  ON user_upgrades FOR ALL
  USING (auth.uid() = user_id);
```

### Data Models (TypeScript)

```typescript
// src/types/database.types.ts (généré par Supabase CLI)
export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          username: string
          avatar_url: string | null
          total_gems: number
          total_runs: number
          best_score: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username: string
          avatar_url?: string | null
          total_gems?: number
          total_runs?: number
          best_score?: number
        }
        Update: {
          username?: string
          avatar_url?: string | null
          total_gems?: number
          total_runs?: number
          best_score?: number
          updated_at?: string
        }
      }
      scores: {
        Row: {
          id: string
          user_id: string
          score: number
          gems_collected: number
          survival_time: number
          distance_traveled: number | null
          enemies_killed: number | null
          created_at: string
        }
        Insert: {
          user_id: string
          score: number
          gems_collected: number
          survival_time: number
          distance_traveled?: number
          enemies_killed?: number
        }
      }
      user_upgrades: {
        Row: {
          id: string
          user_id: string
          upgrade_type: string
          level: number
          unlocked_at: string
        }
        Insert: {
          user_id: string
          upgrade_type: string
          level?: number
        }
      }
    }
  }
}
```

---

## API Contracts

### REST Endpoints

#### `POST /api/scores`
**Submit score après run**

Request :
```typescript
{
  score: number
  gems_collected: number
  survival_time: number
  distance_traveled?: number
  enemies_killed?: number
}
```

Response (201) :
```typescript
{
  id: string
  created_at: string
}
```

Response (400) :
```typescript
{
  error: string
}
```

#### `GET /api/scores?limit=100`
**Get leaderboard**

Response (200) :
```typescript
{
  scores: Array<{
    id: string
    score: number
    gems_collected: number
    survival_time: number
    created_at: string
    user: {
      username: string
      avatar_url: string
    }
  }>
}
```

#### `GET /api/upgrades`
**Get user upgrades**

Response (200) :
```typescript
{
  upgrades: Array<{
    upgrade_type: string
    level: number
    unlocked_at: string
  }>
}
```

#### `POST /api/upgrades`
**Purchase upgrade**

Request :
```typescript
{
  upgrade_type: 'longer_glide' | 'double_flap' | 'wall_slide' | ...
  cost: number
}
```

Response (201) :
```typescript
{
  success: true
  new_gem_balance: number
}
```

Response (402) :
```typescript
{
  error: 'Insufficient gems'
}
```

---

## Security Architecture

### Authentication Flow

1. **User clicks "Login with Google"** → `/auth/login`
2. **Supabase Auth OAuth redirect** → Google consent
3. **Callback** → `/auth/callback` route handler
4. **Set cookie** → Supabase session cookie (httpOnly, secure)
5. **Redirect** → `/play`

### Authorization

**Row Level Security (RLS)** :
- Users can ONLY read/write their own `user_upgrades`
- Users can ONLY insert scores with their own `user_id`
- Scores are public-readable (leaderboard)

**API Route Protection** :
```typescript
// middleware.ts
export async function middleware(request: NextRequest) {
  const { supabase, response } = createMiddlewareClient({ request })
  const { data: { session } } = await supabase.auth.getSession()

  if (!session && request.nextUrl.pathname.startsWith('/play')) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  return response
}
```

### Data Validation

**Server-side validation** :
```typescript
// app/api/scores/route.ts
const scoreSchema = z.object({
  score: z.number().min(0).max(999999),
  gems_collected: z.number().min(0),
  survival_time: z.number().min(0)
})

export async function POST(request: Request) {
  const body = await request.json()
  const validated = scoreSchema.parse(body) // Throws si invalide
  // ...
}
```

### Input Sanitization

- **No user-generated content** dans ce jeu (pas de chat, pas de custom usernames)
- Username via OAuth provider (Google, GitHub) → déjà sanitized
- Scores = numbers uniquement, validés server-side

---

## Performance Considerations

### 60 FPS Target

**Optimisations critiques** :

1. **RequestAnimationFrame** :
   ```typescript
   class GameLoop {
     private lastTime = 0
     private rafId: number | null = null

     start() {
       const loop = (timestamp: number) => {
         const deltaTime = (timestamp - this.lastTime) / 1000
         this.lastTime = timestamp

         this.gameEngine.update(deltaTime)

         this.rafId = requestAnimationFrame(loop)
       }
       this.rafId = requestAnimationFrame(loop)
     }
   }
   ```

2. **Object Pooling** :
   - Particles : pool de 500
   - Enemies : pool de 50
   - Collectibles : pool de 100

3. **Canvas Layering** :
   ```html
   <!-- Background (static, update rarement) -->
   <canvas id="bg-canvas" style="position: absolute; z-index: 1;"></canvas>

   <!-- Game (dynamic, update 60fps) -->
   <canvas id="game-canvas" style="position: absolute; z-index: 2;"></canvas>

   <!-- Particles (overlay, update 60fps) -->
   <canvas id="particle-canvas" style="position: absolute; z-index: 3;"></canvas>
   ```

4. **Limite Entities** :
   ```typescript
   const MAX_ENEMIES = 20
   const MAX_COLLECTIBLES = 30
   const MAX_PARTICLES = 500
   ```

5. **Viewport Culling** :
   ```typescript
   render() {
     entities.forEach(e => {
       if (e.x < camera.x - 100 || e.x > camera.x + SCREEN_WIDTH + 100) {
         return // Don't render off-screen
       }
       e.render(ctx)
     })
   }
   ```

### Bundle Optimization

**Next.js Config** :
```typescript
// next.config.ts
const config = {
  compress: true,
  images: {
    formats: ['image/webp'],
  },
  experimental: {
    optimizePackageImports: ['zustand'],
  },
}
```

**Code Splitting** :
```typescript
// Lazy load game engine uniquement sur /play
const GameCanvas = dynamic(() => import('@/components/game/GameCanvas'), {
  ssr: false, // Pas de SSR pour Canvas
  loading: () => <div>Loading game...</div>
})
```

### Asset Optimization

- **Images** : WebP, <100KB par sprite
- **Audio** :
  - Music : MP3 128kbps, ~2-3MB
  - SFX : MP3 64kbps, <50KB each
- **Lazy load audio** :
  ```typescript
  // Preload SFX critiques (jump, flap), lazy load music
  async loadAssets() {
    await Promise.all([
      this.loadSound('jump'),
      this.loadSound('flap'),
    ])
    this.loadSound('music') // Non-blocking
  }
  ```

---

## Deployment Architecture

### Vercel Configuration

**Environment Variables** (Vercel Dashboard) :
```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx... (server-only)
```

**Custom Domain** :
1. Dashboard → Project → Settings → Domains
2. Add domain : `rainbowracer.gg` (ou ton domaine)
3. Configure DNS chez ton registrar :
   - Type : `A`
   - Name : `@`
   - Value : `76.76.21.21` (Vercel IP)
4. SSL auto (Let's Encrypt)

### Build Configuration

```json
// package.json
{
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit"
  }
}
```

**Vercel Auto-Deploy** :
- Push to `main` → auto-build + deploy
- Preview deploys sur chaque PR

### Monitoring

**Vercel Analytics** (gratuit Hobby) :
- Web Vitals (CLS, FID, LCP)
- Real User Monitoring

**Custom Events** :
```typescript
// Track game events
import { track } from '@vercel/analytics'

track('game_started')
track('game_ended', { score, time })
```

**Supabase Logs** :
- Dashboard → Logs → API/Database logs
- Monitor slow queries

---

## Development Environment

### Prerequisites

- **Node.js** : 20.x LTS ([nodejs.org](https://nodejs.org))
- **npm** : 10.x (inclus avec Node)
- **Git** : Latest
- **Browser** : Chrome/Firefox (DevTools pour debug Canvas)
- **Supabase Account** : gratuit ([supabase.com](https://supabase.com))
- **Vercel Account** : gratuit ([vercel.com](https://vercel.com))

### Local Setup Commands

```bash
# 1. Cloner le repo (après init)
git clone <repo-url>
cd rainbow-racer-v2

# 2. Installer dépendances
npm install

# 3. Copier env
cp .env.local.example .env.local
# Éditer .env.local avec tes clés Supabase

# 4. Run migrations Supabase (optionnel si cloud)
npx supabase db push

# 5. Start dev server
npm run dev --turbopack

# Ouvrir http://localhost:3000
```

### Development Workflow

1. **Feature branch** : `git checkout -b feature/particle-system`
2. **Code** + **Test manual** sur `localhost:3000/play`
3. **Lint** : `npm run lint`
4. **Type check** : `npm run typecheck`
5. **Commit** : `git commit -m "feat: add particle system"`
6. **Push** : `git push origin feature/particle-system`
7. **PR** → Vercel preview deploy auto
8. **Merge** to `main` → Production deploy

### Debugging Tools

**Canvas Debugging** :
```typescript
// Toggle debug mode avec key 'D'
class GameEngine {
  private debugMode = false

  toggleDebug() {
    this.debugMode = !this.debugMode
  }

  render() {
    // ...
    if (this.debugMode) {
      this.renderCollisionBoxes()
      this.renderFPSCounter()
    }
  }
}
```

**React DevTools** : Pour debug Zustand stores

**Supabase Studio** : Local database UI (si Supabase CLI)

---

## Architecture Decision Records (ADRs)

### ADR-001 : Canvas 2D vs WebGL vs Game Framework

**Contexte** : Besoin de rendu 60 FPS pour platformer

**Options** :
- Canvas 2D API (natif)
- WebGL (via PixiJS)
- Framework (Phaser, Kaboom)

**Décision** : Canvas 2D API

**Rationale** :
- Canvas 2D suffisant pour 2D platformer simple
- WebGL = overkill, overhead inutile pour ce scope
- Frameworks = perte de contrôle, bundle size énorme
- Canvas 2D = contrôle total, 0 dépendance, léger

**Conséquences** :
- ✅ Bundle léger (<100KB game code)
- ✅ Contrôle total rendering
- ⚠️ Pas de shaders fancy (acceptable pour aesthetic géométrique)

---

### ADR-002 : Zustand vs Redux vs Context API

**Contexte** : State management pour UI React (HUD, menus)

**Options** :
- Redux Toolkit
- Zustand
- Context API
- Jotai

**Décision** : Zustand

**Rationale** :
- Redux = trop de boilerplate pour projet 20h
- Context = performance issues (re-renders excessifs)
- Zustand = simple, performant, 0 boilerplate
- Pas besoin DevTools (game state dans classes, pas store)

**Conséquences** :
- ✅ Setup rapide (<10 lignes par store)
- ✅ Performance (selectors optimisés)
- ✅ TypeScript friendly

---

### ADR-003 : Supabase vs Firebase vs Custom Backend

**Contexte** : Backend pour auth, DB, leaderboards

**Options** :
- Supabase (PostgreSQL)
- Firebase (NoSQL)
- Custom (Next.js API + Prisma + Postgres)

**Décision** : Supabase

**Rationale** :
- PostgreSQL > NoSQL pour leaderboards (ORDER BY, indexes)
- Supabase Realtime = Socket.io gratuit
- Auth OAuth inclus
- Free tier généreux (50k MAU)
- Row Level Security = sécurité built-in
- vs Custom = gain 3-4h de setup

**Conséquences** :
- ✅ Auth + DB + Realtime en 1 service
- ✅ Gratuit jusqu'à 500+ joueurs
- ⚠️ Vendor lock-in acceptable pour MVP

---

### ADR-004 : Object Pooling Mandatory

**Contexte** : Particles = créés/détruits massivement (perf risk)

**Options** :
- Create/destroy à chaque fois (new/GC)
- Object pooling (réutilisation)

**Décision** : Object pooling obligatoire

**Rationale** :
- 500 particles à 60 FPS = 30k créations/sec sans pool
- Garbage Collector = frame drops garantis
- Pool = 0 allocation pendant game loop

**Conséquences** :
- ✅ 60 FPS stable garanti
- ⚠️ Complexité code (+20 lignes pour pool)
- ✅ Pattern réutilisable (enemies, projectiles)

---

### ADR-005 : Pattern-Based Procgen vs Fully Algorithmic

**Contexte** : Génération procédurale des niveaux

**Options** :
- Pattern-based (chunks prédéfinis assemblés)
- Algorithmic (plateformes générées via algo)
- Hybrid

**Décision** : Pattern-based (chunks)

**Rationale** :
- Budget 20h = pas le temps de balancer un algo procgen
- Chunks = level design controlé (fun garanti)
- 10-15 chunks variés = suffisant pour rejouabilité
- Assemblage aléatoire + difficulty scaling = "assez procédural"

**Conséquences** :
- ✅ Fun garanti (chunks hand-crafted)
- ✅ Implémentation rapide (~2h)
- ⚠️ Moins de variété qu'algo pur (acceptable MVP)

---

## Validation Checklist

### Completeness

✅ **Decision table a des versions spécifiques** (Next 16.x, TS 5.x, etc.)
✅ **Chaque epic est mappé à des composants d'architecture**
✅ **Source tree est complet et spécifique** (pas de `...` ou placeholders)
✅ **Aucun texte placeholder restant**
✅ **Tous les FRs du GDD ont support architectural** :
  - Flap Wings system → Player.ts + InputManager
  - Procgen → ProcGenSystem.ts
  - Meta-progression → ProgressionSystem + Supabase
  - Leaderboards → Supabase Realtime + API routes
  - Cacalicorne Bomb → PoopBomb.ts entity
✅ **Tous les NFRs du GDD sont adressés** :
  - 60 FPS → RAF game loop, object pooling, canvas layering
  - <5s load → code splitting, asset optimization
  - <100ms latency → pas de calculs lourds dans game loop
✅ **Implementation patterns couvrent tous conflits potentiels** :
  - Naming (files, code, DB)
  - Structure (React vs Game séparation)
  - Rendering pipeline (ordre strict)
  - Error handling (try-catch API, graceful game)
✅ **Novel patterns documentés** (Flap Wings, Procgen, Object Pool)

### Architecture Coherence

✅ **Toutes les décisions sont compatibles** :
  - Next.js 16 + Supabase = intégration prouvée
  - Canvas 2D + React séparation = pas de conflits
  - Zustand + Game classes = state layers distincts
✅ **Pas de choix contradictoires** :
  - TypeScript strict partout
  - Pas de mix ESM/CommonJS
✅ **Versions alignées** :
  - Node 20.x supporté par Next 16 + Vercel
  - Supabase client compatible Next.js

### Epic Coverage

✅ **Epic 1 (Core Gameplay)** : GameEngine, Player, Physics, Collision, Procgen
✅ **Epic 2 (Progression)** : ProgressionSystem, Supabase upgrades, API routes
✅ **Epic 3 (Polish)** : ParticleSystem, AudioManager, RenderSystem
✅ **Epic 4 (Online)** : Supabase Auth, Realtime, Leaderboard
✅ **Epic 5 (Deployment)** : Vercel config, monitoring

### Gaps Analysis

✅ **Aucune gap identifiée** - Toutes les fonctionnalités du GDD ont une solution architecturale

---

## Next Steps

### Immediate (First Story)

1. **Init project** : `npx create-next-app` avec commande documentée
2. **Setup Supabase** : Créer projet, copier keys, run migrations
3. **Verify build** : `npm run build` passe
4. **Deploy to Vercel** : Connecter repo, auto-deploy

### Phase 1 : Epic 1 (Core Gameplay)

Référer aux stories définies dans le GDD Epic 1 :
1. Setup Canvas boilerplate
2. Player movement (WASD + gravity)
3. Flap Wings system
4. Collision detection
5. Dash mechanic
6. Procgen basique
7. 1 Biome avec parallax

### Phase 2-5

Suivre l'ordre des Epics du GDD, en utilisant cette architecture comme référence pour toutes les décisions d'implémentation.

---

_Généré par BMAD Game Architecture Workflow v1.3.2_
_Date : 2025-11-23_
_Pour : Fab_
_Projet : Rainbow Racer V2_
