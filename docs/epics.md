# Rainbow-Racer - Epic Breakdown

**Author:** Fab
**Date:** 2025-11-23
**Project Level:** Solo Side Project
**Target Scale:** 20h MVP, Browser Game

---

## Overview

Ce document fournit la décomposition complète en epics et stories pour Rainbow Racer V2, transformant les exigences du [GDD](./GDD.md) en stories implémentables.

**Living Document Notice:** Ce document évoluera si des workflows UX Design ou Architecture ajoutent des détails d'implémentation.

## Epic Summary

- **Epic 1:** Foundation & Core Movement (infrastructure + mouvement fluide)
- **Epic 2:** Complete Gameplay Loop (runs complets avec collecte et mort)
- **Epic 3:** Meta-Progression System (upgrades permanents entre runs)
- **Epic 4:** Polish, Power-Ups & Game Feel (juice + power-ups + ultimate)
- **Epic 5:** Online & Social Features (auth + leaderboards + ghost racing)
- **Epic 6:** Production Deployment (Vercel + optimisations + monitoring)

---

## Functional Requirements Inventory

**Mouvement & Contrôles:**
- FR1: Déplacement 8-directions (WASD/Arrow keys)
- FR2: Saut avec hauteur variable (Space tap/hold)
- FR3: Flap Wings en l'air (2e Space = boost vertical)
- FR4: Planer après flap (hold Space = descente ralentie)
- FR5: Dash avec i-frames (Shift + cooldown 1s)
- FR6: Wall-slide (unlock via upgrade)
- FR7: Attaque rapide (Click/Z, optional unlock)

**Système de Collecte:**
- FR8: Collecter des gems (currency permanente)
- FR9: Collecter des stars (score/leaderboard)
- FR10: Collecter des Rainbow Fragments (unlock skins)

**Power-ups Temporaires:**
- FR11: Speed Boost
- FR12: Invincibility
- FR13: Magnet (auto-collect gems)
- FR14: Ghost Mode (traverse obstacles)

**Cacalicorne Bomb:**
- FR15: Activation Cacalicorne Bomb (touche P)
- FR16: Bomb détruit tous ennemis à l'écran
- FR17: Bomb se collecte via gems OU bonus rare

**Génération Procédurale:**
- FR18: Niveaux générés via assemblage de chunks
- FR19: Chunks avec difficulté variable (easy/medium/hard/reward)
- FR20: Difficulté augmente avec temps (+10% tous les 30s)
- FR21: Premiers 30s = chunks "easy" uniquement (tutorial)

**Meta-Progression:**
- FR22: Acheter upgrades permanents avec gems
- FR23: Upgrades débloquent capacités mouvement
- FR24: Upgrades améliorent survie
- FR25: Upgrades boostent économie
- FR26: Upgrades persistent via localStorage/Supabase

**Système de Run:**
- FR27: Run commence par spawn dans niveau procédural
- FR28: Run termine par mort OU complétion
- FR29: Écran de stats à la mort
- FR30: Gems persistent après mort

**Features Online:**
- FR31: Auth via Google/GitHub OAuth
- FR32: Soumission scores au leaderboard global
- FR33: Leaderboard top 100
- FR34: Ghost racing (voir runs d'autres joueurs)
- FR35: Partage runs via URL unique

**Environnement:**
- FR36: Au moins 1 biome jouable (Crystal Cloudscape)
- FR37: Parallax multi-couches (5-7 layers)
- FR38: Biomes additionnels (stretch)

**Polish:**
- FR39: Particules visuelles (dash, jump, collect)
- FR40: Camera shake sur impacts
- FR41: Feedback audio (8+ SFX)
- FR42: Musique ambient en loop

**UI & Menus:**
- FR43: HUD temps réel (score, gems, combo)
- FR44: Menu principal (Play, Upgrades, Leaderboard)
- FR45: Upgrade shop fonctionnel
- FR46: Menu pause (ESC)

**Performance:**
- FR47: 60 FPS constant
- FR48: <5s cold load
- FR49: <100ms input latency

---

## FR Coverage Map

**Epic 1 (Foundation & Core Movement):**
- FR1, FR2, FR3, FR4, FR5, FR27, FR36, FR37 (basique), FR47, FR48, FR49

**Epic 2 (Complete Gameplay Loop):**
- FR8, FR9, FR10, FR18, FR19, FR20, FR21, FR28, FR29, FR30, FR43

**Epic 3 (Meta-Progression System):**
- FR22, FR23, FR24, FR25, FR26, FR45

**Epic 4 (Polish, Power-Ups & Game Feel):**
- FR6, FR7, FR11, FR12, FR13, FR14, FR15, FR16, FR17, FR39, FR40, FR41, FR42, FR44, FR46

**Epic 5 (Online & Social Features):**
- FR31, FR32, FR33, FR34, FR35

**Epic 6 (Production Deployment):**
- Vercel deployment, optimisations finales, monitoring

---

## Epic 1: Foundation & Core Movement

**Goal:** Établir l'infrastructure technique et implémenter un système de mouvement fluide et satisfaisant pour le joueur, créant les fondations pour tout le gameplay.

**Valeur utilisateur:** Le joueur peut se déplacer de manière ultra-responsive dans le monde du jeu avec des contrôles qui "feel good".

**FRs couverts:** FR1, FR2, FR3, FR4, FR5, FR27, FR36, FR37 (basique), FR47, FR48, FR49

---

### Story 1.1: Setup Next.js + Supabase + Canvas Boilerplate

En tant que **développeur**,
Je veux **initialiser le projet avec Next.js 16, Supabase et un Canvas de jeu fonctionnel**,
Afin que **toute l'infrastructure technique soit prête pour le développement du game engine**.

**Acceptance Criteria:**

**Given** le projet n'existe pas encore
**When** j'exécute la commande d'initialisation Next.js avec le template Supabase
**Then** un projet Next.js 16 est créé avec TypeScript strict mode activé

**And** Supabase client est installé et configuré avec les clés d'environnement (.env.local)
**And** un composant GameCanvas.tsx est créé qui rend un canvas HTML5 en plein écran
**And** le canvas est accessible uniquement côté client (ssr: false)
**And** la structure de dossiers suit l'architecture définie (src/game/, src/components/game/, src/lib/)
**And** ESLint et Prettier sont configurés
**And** le projet build sans erreurs TypeScript
**And** npm run dev lance le serveur sur localhost:3000

**Prerequisites:** Aucun (première story)

**Technical Notes:**
- Utiliser `npx create-next-app@latest rainbow-racer-v2 --typescript --tailwind --app --turbopack --use-npm --example https://github.com/vercel/next.js/tree/canary/examples/with-supabase`
- Installer Zustand (`npm install zustand`), UUID (`npm install uuid`), clsx
- Créer `.env.local` avec NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY
- Canvas doit être créé dans un Client Component avec `'use client'`
- Référence architecture: `game-architecture.md` sections "Project Structure" et "Project Initialization"

---

### Story 1.2: Player Entity avec Mouvement WASD et Gravité

En tant que **joueur**,
Je veux **contrôler une licorne qui se déplace à gauche/droite et tombe avec la gravité**,
Afin que **je puisse me déplacer dans le monde du jeu de manière naturelle**.

**Acceptance Criteria:**

**Given** le canvas de jeu est affiché à l'écran
**When** j'appuie sur les touches WASD ou flèches directionnelles
**Then** la licorne (représentée par un rectangle blanc temporaire) se déplace horizontalement à 5 unités/frame

**And** quand je relâche les touches, la licorne s'arrête immédiatement (pas de momentum horizontal)
**And** la gravité applique une accélération descendante constante de 0.8 unités/frame²
**And** la licorne ne peut pas sortir des limites du canvas (collision avec bords gauche/droite)
**And** quand la licorne touche le sol (bottom du canvas ou plateforme), elle s'arrête de tomber
**And** le mouvement est fluide à 60 FPS via RequestAnimationFrame
**And** la position de la licorne est rendue à chaque frame

**Prerequisites:** Story 1.1 (Canvas setup)

**Technical Notes:**
- Créer `src/game/entities/Player.ts` classe avec propriétés: x, y, width, height, velocityX, velocityY
- Créer `src/game/core/InputManager.ts` pour gérer les événements clavier (keydown/keyup)
- Créer `src/game/core/GameEngine.ts` avec une méthode `update(deltaTime)` appelée via RAF
- Créer `src/game/systems/PhysicsSystem.ts` pour appliquer gravité et vélocité
- Utiliser constantes depuis `lib/constants.ts`: `GRAVITY = 0.8`, `PLAYER_SPEED = 5`, `PLAYER_WIDTH = 64`, `PLAYER_HEIGHT = 64`
- Le player doit avoir une collision AABB basique avec le sol (y + height >= CANVAS_HEIGHT)
- Référence architecture: sections "Novel Pattern Designs" et "Game Engine ↔ React UI"

---

### Story 1.3: Système de Saut avec Hauteur Variable

En tant que **joueur**,
Je veux **sauter en appuyant sur Space avec contrôle de la hauteur selon la durée de pression**,
Afin que **je puisse effectuer des sauts précis et variés selon les obstacles**.

**Acceptance Criteria:**

**Given** la licorne est au sol (grounded)
**When** j'appuie brièvement sur Space (tap)
**Then** la licorne saute avec une vélocité verticale initiale de -12 (vers le haut)

**And** si je maintiens Space enfoncé pendant le saut ascendant, la vélocité est réduite moins rapidement (gravity x 0.5)
**And** si je relâche Space pendant le saut ascendant, la gravité normale s'applique immédiatement (gravity x 1)
**And** la hauteur maximale d'un saut court (tap) est environ 100 pixels
**And** la hauteur maximale d'un saut long (hold) est environ 180 pixels
**And** un SFX "jump.mp3" joue au moment du décollage
**And** des particules de poussière apparaissent au sol lors du saut (3-5 particules)
**And** je ne peux pas sauter à nouveau tant que je ne suis pas retourné au sol

**Prerequisites:** Story 1.2 (Player movement + gravity)

**Technical Notes:**
- Ajouter propriété `jumpState` à Player: 'grounded' | 'jumping' | 'falling'
- Constantes: `JUMP_FORCE = -12`, `GRAVITY_MULTIPLIER_JUMPING = 0.5`
- Détecter collision avec sol pour réinitialiser `jumpState` à 'grounded'
- Créer `src/game/core/AudioManager.ts` pour jouer SFX via Web Audio API
- Créer `src/game/entities/Particle.ts` classe basique (x, y, velocityX, velocityY, lifetime, color)
- Précharger jump.mp3 depuis `/public/audio/sfx/jump.mp3`
- Animation de saut: changer le sprite/shape du player pendant le saut (stretch: utiliser sprite sheets)

---

### Story 1.4: Flap Wings System (Double Jump avec Animation)

En tant que **joueur**,
Je veux **faire un battement d'ailes (flap) en l'air pour obtenir un boost vertical additionnel**,
Afin que **je puisse atteindre des plateformes plus hautes et corriger mes trajectoires en vol**.

**Acceptance Criteria:**

**Given** la licorne est en l'air après un premier saut
**When** j'appuie sur Space une seconde fois
**Then** la licorne effectue un "flap" qui réinitialise sa vélocité verticale à -15 (boost plus fort que le jump initial)

**And** un compteur `flapCount` empêche de faire plus de 1 flap par saut (upgradable à 2 plus tard)
**And** une animation de battement d'ailes joue (2-3 frames alternées rapidement)
**And** un SFX "flap.mp3" avec effet de sparkle joue
**And** 8-12 particules de plumes (feather particles) apparaissent autour de la licorne, se dispersant radialement
**And** les particules ont une durée de vie de 0.5-1 seconde avec fade out
**And** le compteur de flap se réinitialise quand la licorne touche le sol
**And** le jumpState passe à 'flapped' pour tracker l'état

**Prerequisites:** Story 1.3 (Jump system)

**Technical Notes:**
- Ajouter `jumpState` states: 'grounded' | 'jumped' | 'flapped' | 'gliding'
- Constantes: `FLAP_FORCE = -15`, `MAX_FLAPS = 1`
- Animation: créer cycle entre 3 sprites d'ailes (ou rotation géométrique si pas de sprites)
- Particules: couleurs rainbow, vélocités aléatoires dans toutes directions (Math.random() * 360 degrees)
- SFX flap.mp3 avec pitch légèrement varié (random entre 0.9-1.1) pour variété
- Les particules doivent utiliser object pooling (voir Story 1.8)
- Référence architecture: section "Flap Wings System (Unique Game Mechanic)"

---

### Story 1.5: Système de Plané (Glide après Flap)

En tant que **joueur**,
Je veux **planer en maintenant Space après avoir flappé mes ailes**,
Afin que **je puisse contrôler ma descente et atteindre des plateformes éloignées horizontalement**.

**Acceptance Criteria:**

**Given** la licorne est en état 'flapped' (après un flap)
**When** je maintiens la touche Space enfoncée
**Then** la licorne entre en mode 'gliding' et sa vélocité de chute est limitée (cap à -2 unités/frame max)

**And** en mode glide, la gravité est réduite (gravity x 0.3)
**And** le contrôle horizontal est augmenté (vitesse x 1.3 pour meilleures manœuvres)
**And** une animation de plané statique s'affiche (ailes déployées)
**And** un SFX "glide-loop.mp3" joue en boucle tant que le glide est actif
**And** quand je relâche Space, le glide s'arrête et la gravité normale reprend
**And** quand je touche le sol en gliding, le glide s'arrête et le son loop s'arrête
**And** une trainée visuelle subtile apparaît derrière la licorne pendant le glide (5-8 particules par frame)

**Prerequisites:** Story 1.4 (Flap Wings)

**Technical Notes:**
- Ajouter logique dans `handleGlide(isHolding: boolean)` méthode de Player
- Constantes: `GLIDE_FALL_SPEED = -2`, `GLIDE_GRAVITY_MULT = 0.3`, `GLIDE_HORIZONTAL_MULT = 1.3`
- AudioManager doit supporter `playLoop(soundName)` et `stopLoop(soundName)`
- Trail particles: petites, semi-transparentes, durée 0.3s, couleur blanche/argentée
- Transition fluide entre animations: jump → flap → glide → fall
- Si le joueur relâche Space en gliding, jumpState revient à 'jumped' (falling normally)

---

### Story 1.6: Dash Mechanic avec i-Frames et Cooldown

En tant que **joueur**,
Je veux **dasher dans la direction de mon mouvement en appuyant sur Shift**,
Afin que **je puisse esquiver rapidement des obstacles et traverser des gaps dangereux**.

**Acceptance Criteria:**

**Given** le cooldown du dash est terminé (1 seconde écoulée depuis dernier dash)
**When** j'appuie sur Shift en me déplaçant horizontalement
**Then** la licorne dash dans la direction actuelle à vitesse 20 unités/frame pendant 200ms

**And** pendant le dash, la licorne est invincible (i-frames actifs, pas de collision avec ennemis)
**And** un indicateur visuel montre l'invincibilité (sprite clignote ou devient semi-transparent)
**And** une trainée de particules rainbow intense suit la licorne (15-20 particules par frame)
**And** un SFX "dash.mp3" avec whoosh aigu joue au démarrage du dash
**And** un screenshake subtil (amplitude 3-5 pixels) se produit à l'activation
**And** après le dash, un cooldown de 1 seconde empêche de dasher à nouveau
**And** un indicateur UI ou icône montre visuellement le cooldown restant
**And** le dash fonctionne aussi en l'air (pas uniquement au sol)

**Prerequisites:** Story 1.2 (Player movement)

**Technical Notes:**
- Ajouter propriétés à Player: `isDashing: boolean`, `dashCooldownRemaining: number`, `isInvincible: boolean`
- Constantes: `DASH_SPEED = 20`, `DASH_DURATION = 200` (ms), `DASH_COOLDOWN = 1000` (ms)
- Créer `src/game/systems/RenderSystem.ts` avec méthode pour gérer alpha/opacity du sprite
- Effet de clignotement: alterner opacity entre 1.0 et 0.5 toutes les 50ms pendant dash
- Screenshake: offset aléatoire de la caméra dans `Camera.ts` classe
- Cooldown UI: cercle ou barre qui se remplit progressivement (peut être dans HUD React ou canvas overlay)
- Les i-frames doivent être checké dans CollisionSystem (Story 2.x)

---

### Story 1.7: Premier Biome avec Parallax Multi-Couches

En tant que **joueur**,
Je veux **voir un environnement visuellement riche avec de la profondeur**,
Afin que **le monde du jeu soit immersif et esthétiquement plaisant**.

**Acceptance Criteria:**

**Given** le jeu est lancé
**When** je me déplace horizontalement dans le niveau
**Then** je vois 5-7 couches de parallax qui scrollent à des vitesses différentes créant un effet de profondeur 2.5D

**And** la couche la plus éloignée (background profond) scroll à 10% de la vitesse du joueur
**And** les couches intermédiaires scrollent à 30%, 50%, 70% de la vitesse
**And** la couche foreground (plateformes) scroll à 100% (suit exactement la caméra)
**And** les couleurs suivent la palette du biome "Crystal Cloudscape":
  - Background: #1a1a2e (deep purple)
  - Midground gradients: #16213e → #0f3460 (blues)
  - Foreground: #533483 (purple platforms)
  - Accents: #e94560 (pink/danger), #f9ed69 (gold collectibles)
**And** les couches sont des gradients géométriques (pas besoin d'assets bitmap complexes)
**And** les plateformes sont visibles et distinctes du background

**Prerequisites:** Story 1.1 (Canvas setup)

**Technical Notes:**
- Créer `src/game/core/Camera.ts` avec position (x, y) qui suit le player
- Créer couches parallax dans un array: `ParallaxLayer[]` avec propriétés { scrollFactor, color/gradient, shapes }
- Rendering: boucler sur layers en ordre (back to front) et appliquer camera.x * scrollFactor
- Utiliser Canvas API: `ctx.createLinearGradient()` pour backgrounds
- Plateformes: rectangles avec `ctx.fillRect()`, couleur #533483
- Optimisation: background layers peuvent être sur canvas séparé (mis à jour moins fréquemment)
- Référence architecture: "Canvas Layering" et "Rendering Pipeline" sections

---

### Story 1.8: Optimisation Performance pour 60 FPS

En tant que **joueur**,
Je veux **que le jeu tourne à 60 FPS constant sans lag**,
Afin que **le gameplay soit fluide et responsive comme un vrai platformer**.

**Acceptance Criteria:**

**Given** le jeu tourne avec toutes les features des stories 1.1-1.7 activées
**When** je joue pendant 5 minutes avec mouvements, sauts, dashs et particules
**Then** le framerate reste stable à 58-60 FPS (mesuré via Chrome DevTools FPS meter)

**And** l'object pooling est implémenté pour les particules (pool size 500)
**And** aucune nouvelle allocation mémoire n'est faite pendant le game loop (particules réutilisées)
**And** le game loop utilise RequestAnimationFrame (pas setInterval)
**And** le deltaTime est calculé pour gérer les variations de framerate (time-based movement)
**And** les particules mortes sont automatiquement retournées au pool
**And** maximum 500 particules actives simultanément (cap strict)
**And** le rendering utilise viewport culling: objets hors écran ne sont pas rendus
**And** le cold load time est <5 secondes (Lighthouse Performance score >85)

**Prerequisites:** Stories 1.1-1.7 (toutes les features de base)

**Technical Notes:**
- Créer `src/game/utils/ObjectPool.ts` classe générique pour pooling
- Instancier `particlePool = new ObjectPool(() => new Particle(), 500)`
- GameLoop: stocker `lastFrameTime` et calculer `deltaTime = (currentTime - lastFrameTime) / 1000`
- Movement: multiplier toutes velocités par `deltaTime` pour time-based (pas frame-based)
- Viewport culling dans RenderSystem: `if (entity.x < camera.x - 100 || entity.x > camera.x + SCREEN_WIDTH + 100) return`
- Profiling: utiliser Chrome DevTools Performance tab pour identifier bottlenecks
- Asset preloading: charger tous assets au mount du GameCanvas (pas lazy)
- Référence architecture: "Object Pooling for Performance" et "60 FPS Target" sections

---

## Epic 2: Complete Gameplay Loop

**Goal:** Créer le cycle complet de jeu (run-death-restart) avec génération procédurale, collectibles, et système de mort, permettant au joueur de faire des runs répétés.

**Valeur utilisateur:** Le joueur peut jouer des runs complets, collecter des items, mourir, et recommencer avec une boucle de jeu addictive.

**FRs couverts:** FR8, FR9, FR10, FR18, FR19, FR20, FR21, FR28, FR29, FR30, FR43

---

### Story 2.1: Système de Collectibles (Gems, Stars, Rainbow Fragments)

En tant que **joueur**,
Je veux **collecter différents types d'items pendant mon run**,
Afin que **je puisse accumuler des ressources et des points**.

**Acceptance Criteria:**

**Given** des collectibles sont présents dans le niveau
**When** la licorne entre en collision avec un collectible (overlap AABB)
**Then** le collectible disparaît avec une animation de collecte (particules + scale up)

**And** les **gems** (💎) augmentent le compteur de gems permanent (persiste après mort)
**And** les **stars** (⭐) augmentent le score/leaderboard (perdu à la mort)
**And** les **Rainbow Fragments** (🌈) sont rares (5% spawn) et comptent pour unlock de skins
**And** un SFX "collect-gem.mp3" joue à la collecte (pitch varié selon type)
**And** le HUD affiche en temps réel: gems collectés, score actuel, fragments
**And** chaque type a une apparence visuelle distincte (couleur, forme, taille)

**Prerequisites:** Story 1.2 (Player entity), Story 1.1 (Canvas)

**Technical Notes:**
- Créer `src/game/entities/Gem.ts`, `Star.ts`, `RainbowFragment.ts` héritant d'`Entity`
- CollisionSystem: ajouter méthode `checkPlayerCollectibleCollision()`
- Utiliser AABB overlap: `player.x < item.x + item.width && player.x + player.width > item.x && ...`
- Gems: couleur #f9ed69 (gold), valeur +1
- Stars: couleur #ffffff (white), valeur +10 score
- Rainbow Fragments: couleur rainbow gradient, rare spawn
- Créer Zustand store: `useGameUIStore` avec `{gems, score, fragments, setGems, setScore, ...}`
- GameEngine update le store à chaque collecte
- Référence: "Game Engine ↔ React UI" integration pattern

---

### Story 2.2: Génération Procédurale Pattern-Based

En tant que **joueur**,
Je veux **que chaque run génère un niveau différent et imprévisible**,
Afin que **le jeu reste frais et rejouable à l'infini**.

**Acceptance Criteria:**

**Given** un nouveau run démarre
**When** le niveau se génère
**Then** 10-15 "chunks" prédéfinis (patterns de platforming) sont assemblés aléatoirement

**And** les chunks sont catégorisés par difficulté: easy, medium, hard, reward
**And** chaque chunk contient des plateformes, ennemis optionnels, et collectibles
**And** les chunks sont spawned horizontalement de manière continue à l'avance (2 screens ahead)
**And** les chunks hors écran (derrière la caméra) sont despawnés pour économiser mémoire
**And** le niveau est infini (scrolling horizontal sans fin)
**And** les chunks se connectent sans gaps non-sautables (validation de continuité)

**Prerequisites:** Story 1.7 (Biome + platforms), Story 2.1 (Collectibles)

**Technical Notes:**
- Créer `src/game/systems/ProcGenSystem.ts` avec chunk library
- Définir interface `Chunk { id, difficulty, platforms[], enemies[], collectibles[], width, spawnY }`
- Créer 10-15 fonctions: `createEasyChunk1()`, `createMediumChunk1()`, etc.
- ProcGenSystem.update(): si `spawnX < camera.x + SCREEN_WIDTH * 2`, spawner nouveau chunk
- Sélection chunk: filtrer par difficulty, pick random depuis pool
- Despawn: `activeChunks = activeChunks.filter(c => c.x > camera.x - SCREEN_WIDTH)`
- Chunks sont des templates instanciés à position spécifique
- Référence architecture: "Procedural Generation System (Pattern-Based Assembly)"

---

### Story 2.3: Difficulty Scaling Dynamique

En tant que **joueur**,
Je veux **que la difficulté augmente progressivement au cours d'un run**,
Afin que **le challenge reste intéressant et teste mes compétences**.

**Acceptance Criteria:**

**Given** un run est en cours depuis plus de 30 secondes
**When** le temps de jeu augmente
**Then** la difficulté augmente selon ces paliers:
  - 0-30s: chunks "easy" uniquement (tutorial implicite)
  - 30s-2min: mix easy (60%) / medium (40%)
  - 2min+: mix medium (40%) / hard (50%) / reward (10%)

**And** la vitesse de scroll augmente de +10% tous les 30 secondes (cap à +50%)
**And** les ennemis deviennent plus rapides (+5% speed tous les 30s)
**And** les gaps entre plateformes s'élargissent légèrement
**And** la fréquence de spawn des chunks dangéreux augmente
**And** le joueur ressent une progression naturelle du challenge

**Prerequisites:** Story 2.2 (Procgen system)

**Technical Notes:**
- Ajouter `gameTime` counter dans GameEngine (incrémenté par deltaTime)
- Méthode `getDifficultyForTime(time: number): 'easy' | 'medium' | 'hard'`
- Méthode `getScrollSpeedMultiplier(time: number): number` retourne 1.0 à 1.5
- Chunk selection pondérée: `selectRandomChunk(difficulty, weights)`
- Appliquer speedMultiplier aux ennemis et camera follow speed
- Constantes: `DIFFICULTY_RAMP_INTERVAL = 30`, `MAX_SPEED_MULT = 1.5`

---

### Story 2.4: Système de Mort et Respawn

En tant que **joueur**,
Je veux **mourir quand je touche un ennemi ou tombe dans le vide, puis recommencer**,
Afin que **chaque run ait des stakes et que je puisse apprendre de mes erreurs**.

**Acceptance Criteria:**

**Given** la licorne est vivante et en jeu
**When** la licorne entre en collision avec un ennemi SANS i-frames actifs
**Then** un SFX "hit.mp3" joue et l'écran freeze brièvement (50ms)

**And** une animation de mort joue (particules explosives, fade out du sprite)
**And** un SFX "death.mp3" ethereal joue
**And** après 1 seconde, l'écran de mort (DeathScreen) s'affiche avec stats du run:
  - Score final
  - Gems collectés (persistent)
  - Temps de survie
  - Distance parcourue
  - Meilleur combo
**And** les gems collectés sont sauvegardés (persistent dans localStorage ou Supabase)
**And** un bouton "Retry" permet de recommencer un nouveau run
**And** un bouton "Upgrades" redirige vers le shop d'upgrades
**And** quand je tombe hors écran (y > CANVAS_HEIGHT + 200), la mort est aussi déclenchée

**Prerequisites:** Story 1.2 (Player), Story 2.1 (Collectibles), Epic 1 complet

**Technical Notes:**
- Créer enum `GameState { MENU, PLAYING, PAUSED, DEAD }`
- GameEngine.state initial = MENU, passe à PLAYING au start, à DEAD à la mort
- CollisionSystem: `checkPlayerEnemyCollision()` déclenche mort si `!player.isInvincible`
- Créer `src/components/game/DeathScreen.tsx` React component
- DeathScreen reçoit props: `{score, gems, time, distance, onRetry, onUpgrades}`
- localStorage: `localStorage.setItem('totalGems', currentGems.toString())`
- Animation mort: spawn 30-50 particules blanches explosant radialement, fade player alpha 0
- Retry: réinitialiser GameEngine, générer nouveau niveau, gameState = PLAYING

---

### Story 2.5: HUD Temps Réel

En tant que **joueur**,
Je veux **voir en permanence mon score, mes gems, et mon temps de survie**,
Afin que **je puisse tracker ma performance pendant le run**.

**Acceptance Criteria:**

**Given** un run est en cours
**When** je joue et collecte des items
**Then** le HUD affiché en overlay montre en temps réel:
  - **Score** (stars collectées x10)
  - **Gems** (gems collectés ce run)
  - **Temps** (timer croissant depuis spawn)
  - **Combo** (streak de collectes sans toucher le sol - stretch)

**And** le HUD est positionné en haut de l'écran (top-left ou top-center)
**And** les valeurs s'animent quand elles changent (scale up 1.2x puis retour)
**And** le HUD utilise une typo lisible avec outline/shadow pour contraste sur background
**And** le HUD est implémenté en React (pas canvas overlay) pour facilité

**Prerequisites:** Story 2.1 (Collectibles), Zustand store setup

**Technical Notes:**
- Créer `src/components/game/GameHUD.tsx` React component
- Utiliser Zustand: `const { score, gems, time } = useGameUIStore()`
- GameEngine met à jour store: `useGameUIStore.getState().setScore(newScore)`
- Timer: incrémenter `gameTime` dans GameEngine.update(), publier au store
- Styling: Tailwind avec `text-shadow` ou `drop-shadow`, police Google Fonts (ex: "Press Start 2P")
- Animation: Framer Motion ou CSS `@keyframes` pour scale pulse sur changement
- Position: `absolute top-4 left-4` ou `top-4 left-1/2 -translate-x-1/2`

---

## Epic 3: Meta-Progression System

**Goal:** Implémenter un système d'upgrades permanents qui permet au joueur de progresser entre les runs et de débloquer de nouvelles capacités.

**Valeur utilisateur:** Le joueur devient plus fort à chaque run grâce aux upgrades, créant une boucle "one more run" addictive.

**FRs couverts:** FR22, FR23, FR24, FR25, FR26, FR45

---

### Story 3.1: LocalStorage Persistence des Gems

En tant que **joueur**,
Je veux **que mes gems soient sauvegardés même si je ferme le navigateur**,
Afin que **ma progression ne soit jamais perdue**.

**Acceptance Criteria:**

**Given** j'ai collecté 50 gems durant plusieurs runs
**When** je ferme le navigateur et reviens plus tard
**Then** mon total de gems est restoré correctement (50 gems affichés)

**And** à chaque fin de run (mort), les gems sont sauvegardés dans localStorage
**And** au chargement de l'application, les gems sont chargés depuis localStorage
**And** si aucune donnée n'existe, le total gems démarre à 0
**And** les achats d'upgrades déduisent les gems du total et sauvegardent immédiatement

**Prerequisites:** Story 2.1 (Collectibles system), Story 2.4 (Death system)

**Technical Notes:**
- Créer `src/lib/storage.ts` avec fonctions: `saveGems(amount)`, `loadGems(): number`, `saveUpgrades(upgrades)`, `loadUpgrades()`
- localStorage key: `'rainbow-racer-gems'`, value: stringified number
- Charger au mount de GameCanvas: `const savedGems = loadGems(); useUserStore.setState({totalGems: savedGems})`
- Sauvegarder à la mort et après chaque achat
- Fallback: si localStorage unavailable (private browsing), utiliser in-memory store

---

### Story 3.2: Upgrade Shop UI

En tant que **joueur**,
Je veux **voir tous les upgrades disponibles avec leurs coûts et descriptions**,
Afin que **je puisse choisir stratégiquement comment dépenser mes gems**.

**Acceptance Criteria:**

**Given** je suis sur l'écran d'upgrade shop (accessible depuis menu ou death screen)
**When** j'affiche le shop
**Then** je vois une liste de 8-10 upgrades avec pour chacun:
  - Nom de l'upgrade
  - Description de l'effet
  - Coût en gems
  - Statut: "Locked" (pas assez gems), "Available" (peut acheter), "Owned" (déjà acheté)
  - Icône ou visuel représentatif

**And** les upgrades sont organisés par catégories: Movement, Survival, Economy
**And** quand je clique sur un upgrade "Available", un dialog de confirmation apparaît
**And** après confirmation, les gems sont déduits et l'upgrade devient "Owned"
**And** les upgrades "Owned" sont grisés et ne peuvent plus être achetés
**And** mon solde de gems total est affiché en haut du shop
**And** un bouton "Back to Game" me ramène au menu principal

**Prerequisites:** Story 3.1 (Gems persistence)

**Technical Notes:**
- Créer `src/components/profile/UpgradeShop.tsx`
- Définir upgrades dans `src/game/types/Upgrades.ts`:
  ```typescript
  interface Upgrade {
    id: string
    name: string
    description: string
    cost: number
    category: 'movement' | 'survival' | 'economy'
    effect: UpgradeEffect
  }
  ```
- Utiliser Zustand `useUserStore` avec `{totalGems, ownedUpgrades: string[], purchaseUpgrade(id)}`
- UI: Tailwind cards en grid, disabled state pour locked/owned
- Confirmation dialog: modal Tailwind ou shadcn/ui Dialog component
- Référence `game-architecture.md` section "ProgressionSystem"

---

### Story 3.3: Implémentation des Upgrades de Mouvement

En tant que **joueur**,
Je veux **acheter des upgrades qui améliorent mes capacités de mouvement**,
Afin que **je puisse atteindre des zones inaccessibles et survivre plus longtemps**.

**Acceptance Criteria:**

**Given** j'ai acheté un upgrade de mouvement dans le shop
**When** je commence un nouveau run
**Then** l'upgrade est actif et modifie le gameplay:

**Movement Upgrades:**
1. **Longer Glide** (50 gems): Temps de plané x2 (GLIDE_DURATION doublé)
2. **Double Flap** (100 gems): Permet 2 flaps au lieu d'1 (MAX_FLAPS = 2)
3. **Wall Slide** (150 gems): Permet de glisser sur les murs verticaux pour ralentir chute
4. **Faster Dash Cooldown** (200 gems): Cooldown dash réduit à 0.6s (au lieu de 1s)
5. **Air Dash** (250 gems): Dash utilisable en plein vol (pas uniquement au sol)

**And** chaque upgrade acheté persiste entre les runs (localStorage)
**And** l'effet est immédiatement visible dans le gameplay
**And** les constantes de jeu sont modifiées au runtime selon les upgrades actifs

**Prerequisites:** Story 3.2 (Shop UI), Story 1.4-1.6 (Movement mechanics)

**Technical Notes:**
- Créer `src/game/systems/ProgressionSystem.ts` qui charge les upgrades au start de run
- Méthode `applyUpgrades(player: Player, upgrades: string[])` qui modifie les constantes
- Exemple: si 'longer-glide' in upgrades, `player.glideDuration *= 2`
- Wall Slide: ajouter détection de collision latérale avec platforms, appliquer friction verticale
- Air Dash: enlever check `if (player.isGrounded)` dans dash logic
- Les upgrades doivent être chargés depuis `useUserStore.ownedUpgrades` au mount de GameEngine

---

### Story 3.4: Implémentation des Upgrades de Survie et Économie

En tant que **joueur**,
Je veux **acheter des upgrades qui me rendent plus résistant et augmentent mes gains**,
Afin que **mes runs soient plus rentables et moins punitifs**.

**Acceptance Criteria:**

**Given** j'ai acheté des upgrades de survie ou économie
**When** je joue un run
**Then** les effets suivants sont actifs:

**Survival Upgrades:**
1. **Start with Power-Up** (75 gems): Commence chaque run avec 1 invincibility power-up actif
2. **Longer Invincibility** (100 gems): Durée invincibility power-up passe de 5s à 8s
3. **Extra Cacalicorne Bomb** (150 gems): +1 bomb au compteur de départ (2 au lieu de 1)

**Economy Upgrades:**
4. **Gem Multiplier x1.25** (100 gems): Chaque gem collecté vaut 1.25 gems
5. **Magnet Radius +50%** (75 gems): Rayon du magnet power-up augmenté de 50%

**And** les upgrades de survie réduisent la frustration sans rendre le jeu trop facile
**And** les upgrades économiques accélèrent la progression sans grind excessif
**And** tous les effets sont cumulables avec d'autres upgrades

**Prerequisites:** Story 3.3 (Upgrade system), Epic 4 stories (Power-ups)

**Technical Notes:**
- Start with Power-Up: au spawn, activer `player.activatePowerUp('invincibility')`
- Longer Invincibility: modifier `INVINCIBILITY_DURATION` constant selon upgrade
- Extra Bomb: `player.poopBombCount = upgrades.includes('extra-bomb') ? 2 : 1`
- Gem Multiplier: dans collecte logic, `gems += upgrades.includes('gem-mult') ? 1.25 : 1`
- Magnet Radius: `MAGNET_RADIUS = BASE_RADIUS * (upgrades.includes('magnet-plus') ? 1.5 : 1)`

---

## Epic 4: Polish, Power-Ups & Game Feel

**Goal:** Ajouter le polish, les power-ups, et tous les éléments de "juice" qui rendent le jeu addictif et satisfaisant à jouer.

**Valeur utilisateur:** Le jeu devient visuellement spectaculaire et extrêmement satisfaisant avec des power-ups stratégiques et l'ultimate Cacalicorne Bomb.

**FRs couverts:** FR6, FR7, FR11, FR12, FR13, FR14, FR15, FR16, FR17, FR39, FR40, FR41, FR42, FR44, FR46

---

### Story 4.1: Power-Ups Temporaires (Speed, Invincibility, Magnet, Ghost)

En tant que **joueur**,
Je veux **collecter des power-ups temporaires qui modifient mon gameplay pendant un run**,
Afin que **j'aie des moments de puissance et des choix stratégiques**.

**Acceptance Criteria:**

**Given** des power-ups apparaissent dans le niveau (spawn aléatoire dans chunks)
**When** je collecte un power-up
**Then** un effet temporaire s'active pendant 5-10 secondes:

**Power-Up Types:**
1. **Speed Boost** ⚡: Vitesse x1.5, trail particles intensifiés
2. **Invincibility** 🛡️: Immunity complète aux ennemis, sprite glow doré
3. **Magnet** 🧲: Auto-collecte gems dans rayon 150px, visualisation du rayon
4. **Ghost Mode** 👻: Traverse obstacles, sprite semi-transparent

**And** un timer visuel (cercle/barre) montre la durée restante du power-up actif
**And** un SFX unique joue à la collecte de chaque power-up
**And** les effets visuels sont clairs et distincts pour chaque power-up
**And** un seul power-up peut être actif à la fois (nouveau remplace l'ancien)
**And** le HUD affiche l'icône du power-up actif avec timer

**Prerequisites:** Story 2.1 (Collectibles system)

**Technical Notes:**
- Créer `src/game/entities/PowerUp.ts` avec enum `PowerUpType`
- Player propriétés: `activePowerUp: PowerUpType | null`, `powerUpTimeRemaining: number`
- Chaque frame, décrémenter `powerUpTimeRemaining`, désactiver si 0
- Magnet: dans update loop, check distance de chaque gem: `if (distance < MAGNET_RADIUS) gem.moveTowards(player)`
- Ghost Mode: skip enemy collision checks pendant actif
- Durées: Speed/Magnet = 8s, Invincibility = 5s (upgradable), Ghost = 6s
- Timer UI: canvas overlay ou React component avec circular progress

---

### Story 4.2: Cacalicorne Bomb Ultimate

En tant que **joueur**,
Je veux **activer un pouvoir ultime qui détruit tous les ennemis à l'écran**,
Afin que **j'aie un outil de secours spectaculaire dans les moments critiques**.

**Acceptance Criteria:**

**Given** j'ai au moins 1 Cacalicorne Bomb dans mon compteur
**When** j'appuie sur la touche P
**Then** une animation explosive se déclenche:
  - Explosion rainbow de particules 💩✨ depuis la licorne
  - TOUS les ennemis à l'écran sont détruits instantanément
  - Un SFX "poop-bomb.mp3" avec BOOM + rires joue
  - Screenshake intense (amplitude 10px, durée 300ms)
  - Flash blanc de l'écran (100ms)

**And** le compteur de bombs décrémente de 1
**And** un compteur de bombs est affiché dans le HUD (ex: "💩 x2")
**And** les bombs se collectent via:
  - Spawn rare dans les niveaux (1-2% chance)
  - Après avoir collecté 50 gems d'affilée
  - Upgrade "Extra Bomb" donne +1 au départ
**And** la bomb est désactivée si le compteur est à 0

**Prerequisites:** Story 2.1 (Collectibles), Story 1.6 (Screenshake)

**Technical Notes:**
- Player propriétés: `poopBombCount: number`
- InputManager: écouter touche 'P', appeler `player.usePoopBomb()`
- Animation: spawn 100+ particules avec couleurs rainbow, directions radialesScreenshake: `camera.shake(amplitude: 10, duration: 300)`
- Flash: overlay blanc canvas avec fade out rapide
- Ennemis: `enemies.forEach(e => e.destroy())` + spawn particules par ennemi
- SFX: fichier avec effet comique (peut être trouvé sur freesound)
- Constantes: `POOP_BOMB_SPAWN_CHANCE = 0.02`, `GEMS_FOR_BOMB = 50`

---

### Story 4.3: Système de Particules Avancé et Screenshake

En tant que **joueur**,
Je veux **voir des effets visuels explosifs et satisfaisants pour chaque action**,
Afin que **le jeu ait un "game feel" addictif et polish**.

**Acceptance Criteria:**

**Given** je joue au jeu
**When** j'effectue des actions (dash, jump, collecte, mort, bomb)
**Then** des effets visuels appropriés se déclenchent:

**Particle Effects:**
- **Dash**: 15-20 particules rainbow trailing, durée 0.4s
- **Jump/Land**: 5-8 particules poussière au sol
- **Flap Wings**: 10-15 plumes dispersées radialement
- **Collecte**: 8 particules sparkle de la couleur de l'item
- **Mort**: 40+ particules explosives blanches
- **Poop Bomb**: 100+ particules rainbow massives

**Screenshake:**
- **Dash activé**: shake amplitude 3px, durée 100ms
- **Hit ennemi**: shake amplitude 5px, durée 150ms
- **Mort**: shake amplitude 8px, durée 250ms
- **Poop Bomb**: shake amplitude 10px, durée 300ms

**And** toutes les particules utilisent object pooling (pas de GC lag)
**And** les particules ont fade out progressif (alpha décroit avec lifetime)
**And** le screenshake ne casse pas le gameplay (modéré, pas épileptique)
**And** les effets sont synchronisés avec les SFX

**Prerequisites:** Story 1.8 (Object pooling), Story 1.6 (Screenshake base)

**Technical Notes:**
- Utiliser `particlePool` existant de Story 1.8
- ParticleSystem: méthodes `spawnDashTrail()`, `spawnJumpDust()`, `spawnExplosion()`
- Chaque méthode acquiert N particules du pool, les init avec propriétés spécifiques
- Screenshake: `Camera.shake(amplitude, duration)` ajoute random offset pendant duration
- Limiter particules actives: si pool full, skip spawn (dégradation graceful)
- Couleurs: utiliser HSL et randomiser hue pour rainbow effects

---

### Story 4.4: Audio Integration Complète

En tant que **joueur**,
Je veux **entendre de la musique ambient et des SFX satisfaisants**,
Afin que **l'expérience soit immersive et feedback audio renforce le gameplay**.

**Acceptance Criteria:**

**Given** le jeu est lancé
**When** je joue
**Then** les audio suivants sont présents:

**Music:**
- 1 track ambient loop pendant gameplay (120-140 BPM, dreamy synth)
- Volume musique réglable (option dans settings - stretch)

**SFX (11 sons minimum):**
1. jump.mp3 - Saut
2. flap.mp3 - Battement d'ailes
3. glide-loop.mp3 - Plané (loop)
4. dash.mp3 - Dash
5. collect-gem.mp3 - Collecte item
6. hit.mp3 - Hit ennemi
7. death.mp3 - Mort joueur
8. upgrade.mp3 - Achat upgrade
9. poop-bomb.mp3 - Ultimate bomb
10. powerup.mp3 - Collecte power-up
11. ui-click.mp3 - Click UI

**And** tous les SFX sont préchargés au mount du jeu (pas de lag)
**And** les SFX ont pitch variation aléatoire (0.9-1.1) pour variété
**And** la musique joue en loop sans gap audible
**And** les SFX ne se coupent pas mutuellement (overlap OK)

**Prerequisites:** Story 1.3 (AudioManager base)

**Technical Notes:**
- AudioManager: `preloadSounds(urls: string[])` appelé au GameCanvas mount
- Web Audio API: créer AudioContext, charger via `fetch` + `decodeAudioData`
- Pitch variation: `source.playbackRate.value = 0.9 + Math.random() * 0.2`
- Music loop: `source.loop = true`
- Assets: télécharger depuis freesound.org (CC0) ou incompetech.com
- Stockage: `/public/audio/sfx/` et `/public/audio/music/`

---

### Story 4.5: Menu Principal et Pause

En tant que **joueur**,
Je veux **accéder à un menu principal au lancement et pouvoir pauser le jeu**,
Afin que **je contrôle quand je joue et accède aux différentes sections**.

**Acceptance Criteria:**

**Given** je lance le jeu
**When** l'application charge
**Then** un menu principal s'affiche avec options:
  - **Play** → Lance un nouveau run
  - **Upgrades** → Ouvre le shop d'upgrades
  - **Leaderboard** → Affiche les scores (Epic 5)
  - **Settings** → Options (volume, controls - stretch)

**And** pendant un run actif, appuyer sur **ESC** ouvre le menu pause
**And** le menu pause affiche:
  - **Resume** → Reprend le jeu
  - **Restart** → Nouveau run
  - **Main Menu** → Retour au menu principal
**And** quand le jeu est en pause, le GameEngine.update() ne s'exécute pas
**And** les menus ont des transitions smooth (fade in/out)

**Prerequisites:** Story 2.4 (GameState management)

**Technical Notes:**
- Créer `src/app/page.tsx` comme landing avec menu principal
- Créer `src/components/game/PauseMenu.tsx` overlay
- GameEngine: `if (this.state === GameState.PAUSED) return` dans update loop
- InputManager: écouter ESC, toggle `gameEngine.pause()` / `gameEngine.resume()`
- Méthodes: `gameEngine.pause()` set state PAUSED, `resume()` set PLAYING
- UI: Tailwind avec backdrop-blur, animations Framer Motion
- Routing: utiliser Next.js App Router, `/play` route pour le jeu

---

## Epic 5: Online & Social Features

**Goal:** Permettre aux joueurs de se connecter, compétitionner sur des leaderboards globaux, et partager leurs runs.

**Valeur utilisateur:** Le joueur peut compétitionner avec ses amis et la communauté, ajoutant une dimension sociale au jeu.

**FRs couverts:** FR31, FR32, FR33, FR34, FR35

---

### Story 5.1: Supabase Auth Setup (Google/GitHub OAuth)

En tant que **joueur**,
Je veux **me connecter avec mon compte Google ou GitHub**,
Afin que **mes scores et ma progression soient liés à mon identité**.

**Acceptance Criteria:**

**Given** je visite la page de login
**When** je clique sur "Login with Google" ou "Login with GitHub"
**Then** une fenêtre OAuth s'ouvre pour autoriser l'application

**And** après autorisation, je suis redirigé vers le jeu avec une session active
**And** mon username et avatar sont chargés depuis le provider OAuth
**And** un cookie httpOnly sécurisé stocke ma session Supabase
**And** je peux me déconnecter via un bouton "Logout" dans les menus
**And** si je ne suis pas connecté, je peux toujours jouer mais les scores ne sont pas sauvegardés online

**Prerequisites:** Story 1.1 (Supabase setup)

**Technical Notes:**
- Configurer Supabase Auth providers: Google + GitHub dans Dashboard
- Créer `/app/auth/login/page.tsx` avec boutons OAuth
- Créer `/app/auth/callback/route.ts` pour gérer redirection OAuth
- Utiliser `@supabase/ssr` pour cookies: `createServerClient()`
- Middleware: `src/middleware.ts` pour protéger routes `/play` si auth required (optionnel)
- Créer table `user_profiles`: extend auth.users avec username, avatar_url, total_gems
- Référence architecture: "Authentication Flow" et "Authorization" sections

---

### Story 5.2: Leaderboard Global (Top 100)

En tant que **joueur**,
Je veux **voir les 100 meilleurs scores de tous les joueurs**,
Afin que **je puisse comparer ma performance à la communauté**.

**Acceptance Criteria:**

**Given** je suis sur la page Leaderboard
**When** j'affiche le leaderboard
**Then** je vois une table avec top 100 scores contenant:
  - Rang (#1, #2, etc.)
  - Username du joueur
  - Avatar (si disponible)
  - Score final
  - Temps de survie
  - Date du run

**And** les scores sont triés par score DESC (plus haut en premier)
**And** mon propre score est highlighted si je suis dans le top 100
**And** le leaderboard se met à jour automatiquement quand de nouveaux scores arrivent (Supabase Realtime)
**And** je peux filtrer: "All Time", "Today", "This Week"
**And** je peux search/filter par username

**Prerequisites:** Story 5.1 (Auth), Story 2.4 (Score tracking)

**Technical Notes:**
- Créer table `scores`: id, user_id (FK), score, survival_time, gems_collected, created_at
- Index: `CREATE INDEX idx_scores_leaderboard ON scores(score DESC, created_at DESC)`
- API Route: `GET /api/scores?limit=100&timeframe=all` 
- Supabase query: `supabase.from('scores').select('*, user_profiles(username, avatar_url)').order('score', {ascending: false}).limit(100)`
- Créer `/app/leaderboard/page.tsx` avec React table component
- Realtime: subscribe to postgres_changes INSERT on scores table
- Référence architecture: "Supabase Realtime ↔ Leaderboard UI" pattern

---

### Story 5.3: Score Submission Automatique

En tant que **joueur**,
Je veux **que mon score soit automatiquement envoyé au leaderboard à chaque mort**,
Afin que **je n'aie pas à faire d'action manuelle**.

**Acceptance Criteria:**

**Given** je suis authentifié et je meurs pendant un run
**When** l'écran de mort s'affiche
**Then** mon score est automatiquement soumis au leaderboard via API

**And** la soumission inclut: score final, gems collectés, temps de survie, distance
**And** une confirmation visuelle "Score submitted!" apparaît brièvement
**And** si la soumission échoue (réseau), un retry automatique se produit après 2s
**And** si toujours failed, un message "Failed to submit score" s'affiche avec bouton "Retry"
**And** si je ne suis pas authentifié, un CTA "Login to save your score" s'affiche

**Prerequisites:** Story 5.1 (Auth), Story 5.2 (Leaderboard table), Story 2.4 (Death screen)

**Technical Notes:**
- API Route: `POST /api/scores` avec body: `{score, gems_collected, survival_time, distance_traveled}`
- Vérifier auth: `const session = await supabase.auth.getSession()`, return 401 si null
- RLS Policy: users can only insert scores with their own user_id
- GameEngine: à la mort, appeler `submitScore(data)` async function
- Error handling: try-catch avec retry logic (max 3 attempts)
- Toast notification: utiliser react-hot-toast ou custom Toast component

---

### Story 5.4: Ghost Racing Recording (Stretch)

En tant que **joueur**,
Je veux **enregistrer mon run pour créer un "ghost" que d'autres peuvent voir**,
Afin que **mes amis puissent affronter mon meilleur run**.

**Acceptance Criteria:**

**Given** je fais un run
**When** je joue
**Then** ma position (x, y) est enregistrée toutes les 100ms dans un array

**And** à la fin du run, si c'est mon meilleur score, le ghost est sauvegardé
**And** le ghost data est compressé (positions interpolables)
**And** le ghost est stocké dans Supabase Storage ou table `ghosts`
**And** un unique URL est généré: `/replay/{runId}` pour partager le run
**And** d'autres joueurs peuvent charger ce ghost et voir mon run rejoué en transparence pendant qu'ils jouent
**And** le ghost ne bloque pas le gameplay (visuel uniquement, pas de collision)

**Prerequisites:** Story 5.3 (Score submission), Supabase Storage setup

**Technical Notes:**
- Créer `GhostRecorder` classe: `record(player: Player)` appelé toutes les 100ms
- Stocker: `ghostData = [{t: 0, x: 100, y: 200}, {t: 100, x: 150, y: 180}, ...]`
- Compression: ne stocker que positions où changement > threshold (delta encoding)
- Table `ghosts`: id, user_id, score, data (JSONB), created_at
- Playback: `GhostPlayer` classe qui interpolate entre positions enregistrées
- Render: dessiner sprite fantôme semi-transparent (alpha 0.4)
- Référence architecture: "Ghost Racing" mentions dans GDD et game-brief

---

### Story 5.5: Partage de Run via URL

En tant que **joueur**,
Je veux **partager un lien de mon run avec mes amis**,
Afin que **ils puissent voir mon score et rejouer mon ghost**.

**Acceptance Criteria:**

**Given** je viens de finir un run et mon score est soumis
**When** je clique sur "Share Run" dans le death screen
**Then** un lien unique est copié dans mon clipboard: `https://rainbowracer.gg/replay/{runId}`

**And** une notification "Link copied!" s'affiche
**And** quand quelqu'un visite ce lien, il voit:
  - Stats du run (score, temps, gems)
  - Leaderboard position
  - Bouton "Play against this Ghost" qui lance un run avec le ghost chargé
**And** je peux partager ce lien sur Twitter/Discord avec Open Graph preview (image, title, description)

**Prerequisites:** Story 5.4 (Ghost recording)

**Technical Notes:**
- Utiliser Clipboard API: `navigator.clipboard.writeText(url)`
- Créer route `/replay/[runId]/page.tsx` qui fetch ghost data
- Open Graph meta tags: `<meta property="og:title" content="Check out my Rainbow Racer run!" />`
- Screenshot generation (stretch): canvas.toBlob() pour créer image du meilleur moment
- Social share buttons: Twitter intent URL, Discord embed

---

## Epic 6: Production Deployment

**Goal:** Déployer le jeu sur Vercel avec optimisations et monitoring pour le rendre accessible publiquement.

**Valeur utilisateur:** Le jeu est accessible via une URL stable, rapide, et fiable pour tous les joueurs.

**FRs couverts:** Deployment, monitoring, optimisations finales

---

### Story 6.1: Vercel Deployment Configuration

En tant que **développeur**,
Je veux **déployer le jeu sur Vercel avec configuration optimale**,
Afin que **le jeu soit accessible publiquement avec bonnes performances**.

**Acceptance Criteria:**

**Given** le code est sur GitHub repository
**When** je connecte le repo à Vercel
**Then** le projet build et deploy automatiquement

**And** toutes les variables d'environnement sont configurées (Supabase keys)
**And** le domaine par défaut Vercel fonctionne: `rainbow-racer-v2.vercel.app`
**And** les déploiements automatiques se font à chaque push sur `main` branch
**And** les preview deployments se créent pour chaque PR
**And** le build time est <3 minutes
**And** les erreurs de build sont envoyées en notification

**Prerequisites:** Story 1.1 (Next.js project), Git repository

**Technical Notes:**
- Créer compte Vercel, import repository GitHub
- Environment Variables: ajouter `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- Build command: `npm run build` (défaut Next.js)
- Output directory: `.next` (défaut)
- Node.js version: 20.x (spécifier dans Vercel settings)
- Désactiver Vercel Analytics (gratuit mais optionnel)

---

### Story 6.2: Custom Domain et SSL

En tant que **joueur**,
Je veux **accéder au jeu via une URL mémorable et sécurisée**,
Afin que **je puisse facilement revenir et partager le jeu**.

**Acceptance Criteria:**

**Given** un domaine est acheté (ex: rainbowracer.gg)
**When** je configure le domaine dans Vercel
**Then** le jeu est accessible via `https://rainbowracer.gg`

**And** SSL/TLS est configuré automatiquement (Let's Encrypt)
**And** HTTP redirige vers HTTPS automatiquement
**And** www.rainbowracer.gg redirige vers rainbowracer.gg (apex domain)
**And** le certificat SSL se renouvelle automatiquement

**Prerequisites:** Story 6.1 (Vercel deployment)

**Technical Notes:**
- Acheter domaine (Namecheap, Google Domains, Cloudflare)
- Vercel Dashboard → Project → Settings → Domains → Add domain
- Configurer DNS records chez registrar:
  - Type A: @ → 76.76.21.21 (Vercel IP)
  - Type CNAME: www → cname.vercel-dns.com
- SSL auto-provisioned par Vercel (gratuit)
- Référence architecture: "Custom Domain" section

---

### Story 6.3: Production Optimizations

En tant que **développeur**,
Je veux **optimiser le bundle et les assets pour performances maximales**,
Afin que **le jeu charge rapidement et performe à 60 FPS**.

**Acceptance Criteria:**

**Given** le jeu est déployé en production
**When** un utilisateur visite le site
**Then** les métriques suivantes sont atteintes:

**Lighthouse Scores:**
- Performance: >85
- Accessibility: >90
- Best Practices: >90
- SEO: >80

**Web Vitals:**
- FCP (First Contentful Paint): <2s
- LCP (Largest Contentful Paint): <2.5s
- TTI (Time to Interactive): <3s
- CLS (Cumulative Layout Shift): <0.1

**And** les images sont optimisées (WebP, lazy loading)
**And** les fonts sont préchargées
**And** le JavaScript est code-split (game engine chargé uniquement sur /play)
**And** les assets statiques (audio, sprites) sont servis depuis CDN Vercel
**And** le jeu fonctionne offline après premier load (PWA - stretch)

**Prerequisites:** Story 6.1 (Deployment), Story 1.8 (Performance optimizations)

**Technical Notes:**
- next.config.ts: activer `compress: true`, `swcMinify: true`
- Images: utiliser next/image avec format WebP
- Fonts: précharger dans layout.tsx avec `<link rel="preload">`
- Code splitting: dynamic import pour GameCanvas: `const GameCanvas = dynamic(() => import('@/components/game/GameCanvas'), {ssr: false})`
- Service Worker (PWA): utiliser `next-pwa` package (stretch)
- Tester avec Lighthouse CI dans GitHub Actions

---

### Story 6.4: Error Tracking et Monitoring

En tant que **développeur**,
Je veux **être notifié des erreurs et monitorer les performances en production**,
Afin que **je puisse réagir rapidement aux problèmes**.

**Acceptance Criteria:**

**Given** le jeu est en production
**When** une erreur se produit chez un utilisateur
**Then** l'erreur est loggée et accessible pour debug

**And** les métriques suivantes sont trackées:
  - Nombre d'utilisateurs actifs (DAU/MAU)
  - Nombre de runs par jour
  - Taux de completion des runs
  - Temps de session moyen
  - Pages les plus visitées
**And** un dashboard simple permet de voir ces métriques
**And** les erreurs critiques (crashes, API failures) génèrent des alertes
**And** les logs Supabase sont consultables (API calls, DB queries)

**Prerequisites:** Story 6.1 (Deployment)

**Technical Notes:**
- Monitoring basic: Vercel Analytics (gratuit tier Hobby)
  - Track custom events: `track('game_started')`, `track('game_ended', {score})`
- Error logging: console.error() en production + Supabase logs table
- Créer table `logs` optionnelle: `{event, data, timestamp, user_id}` pour analytics custom
- Vercel Dashboard: voir logs en temps réel (Build logs, Function logs)
- Supabase Dashboard: Database logs, API logs, Auth logs
- Stretch: intégrer Sentry ou LogRocket pour advanced error tracking

---

### Story 6.5: README et Documentation

En tant que **développeur ou recruteur**,
Je veux **comprendre rapidement le projet via un README complet**,
Afin que **je puisse apprécier les choix techniques et l'architecture**.

**Acceptance Criteria:**

**Given** quelqu'un visite le repository GitHub
**When** il lit le README.md
**Then** il trouve les sections suivantes:

**README Sections:**
1. **Titre + Badges**: Logo, démo link, build status
2. **Description**: Pitch du jeu en 2-3 phrases
3. **Demo**: Lien vers site live + GIF/screenshot
4. **Tech Stack**: Liste complète (Next.js, Supabase, Canvas, TypeScript)
5. **Features**: Liste des features MVP
6. **Architecture**: Lien vers game-architecture.md
7. **Local Setup**: Instructions pour run en local
8. **Deployment**: Comment deployer soi-même
9. **Contributing**: Guidelines (si open-source)
10. **License**: MIT ou autre

**And** le code contient des commentaires TSDoc sur fonctions publiques importantes
**And** le repository a des tags GitHub pour releases (v1.0.0, etc.)

**Prerequisites:** Story 6.3 (Production ready)

**Technical Notes:**
- Créer README.md complet avec markdown
- Ajouter badges: `![Build Status](https://img.shields.io/badge/build-passing-brightgreen)`
- Screenshot: utiliser `canvas.toDataURL()` pour capturer gameplay
- GIF: utiliser LICEcap ou Kap pour screen recording
- TSDoc: `/** Description @param {type} paramName @returns {type} */`
- License: ajouter LICENSE file (recommandé: MIT pour open-source)
- GitHub Topics: ajouter tags (game, roguelike, nextjs, typescript, canvas)

---

## FR Coverage Matrix

Cette matrice valide que TOUTES les 49 exigences fonctionnelles du GDD sont couvertes par au moins une story.

| FR# | Description | Epic | Story |
|-----|-------------|------|-------|
| FR1 | Déplacement 8-directions | Epic 1 | Story 1.2 |
| FR2 | Saut hauteur variable | Epic 1 | Story 1.3 |
| FR3 | Flap Wings (2e jump) | Epic 1 | Story 1.4 |
| FR4 | Planer après flap | Epic 1 | Story 1.5 |
| FR5 | Dash avec i-frames | Epic 1 | Story 1.6 |
| FR6 | Wall-slide (upgrade) | Epic 3 | Story 3.3 |
| FR7 | Attaque rapide (optional) | Epic 4 | Implied in polish |
| FR8 | Collecter gems | Epic 2 | Story 2.1 |
| FR9 | Collecter stars | Epic 2 | Story 2.1 |
| FR10 | Collecter Rainbow Fragments | Epic 2 | Story 2.1 |
| FR11 | Power-up Speed Boost | Epic 4 | Story 4.1 |
| FR12 | Power-up Invincibility | Epic 4 | Story 4.1 |
| FR13 | Power-up Magnet | Epic 4 | Story 4.1 |
| FR14 | Power-up Ghost Mode | Epic 4 | Story 4.1 |
| FR15 | Activer Cacalicorne Bomb | Epic 4 | Story 4.2 |
| FR16 | Bomb détruit ennemis | Epic 4 | Story 4.2 |
| FR17 | Bomb collecte/spawn | Epic 4 | Story 4.2 |
| FR18 | Génération procédurale chunks | Epic 2 | Story 2.2 |
| FR19 | Chunks difficulté variable | Epic 2 | Story 2.2 |
| FR20 | Difficulté augmente avec temps | Epic 2 | Story 2.3 |
| FR21 | Tutorial implicite (easy chunks) | Epic 2 | Story 2.3 |
| FR22 | Acheter upgrades avec gems | Epic 3 | Story 3.2 |
| FR23 | Upgrades capacités mouvement | Epic 3 | Story 3.3 |
| FR24 | Upgrades survie | Epic 3 | Story 3.4 |
| FR25 | Upgrades économie | Epic 3 | Story 3.4 |
| FR26 | Upgrades persistent | Epic 3 | Story 3.1 |
| FR27 | Run commence par spawn | Epic 1 | Story 1.2 |
| FR28 | Run termine par mort/complétion | Epic 2 | Story 2.4 |
| FR29 | Écran stats à mort | Epic 2 | Story 2.4 |
| FR30 | Gems persistent après mort | Epic 2 | Story 2.4 |
| FR31 | Auth Google/GitHub | Epic 5 | Story 5.1 |
| FR32 | Soumission scores leaderboard | Epic 5 | Story 5.3 |
| FR33 | Leaderboard top 100 | Epic 5 | Story 5.2 |
| FR34 | Ghost racing | Epic 5 | Story 5.4 |
| FR35 | Partage run via URL | Epic 5 | Story 5.5 |
| FR36 | 1 biome jouable | Epic 1 | Story 1.7 |
| FR37 | Parallax multi-couches | Epic 1 | Story 1.7 |
| FR38 | Biomes additionnels (stretch) | - | Out of scope MVP |
| FR39 | Particules visuelles | Epic 4 | Story 4.3 |
| FR40 | Camera shake | Epic 4 | Story 4.3 |
| FR41 | Feedback audio (SFX) | Epic 4 | Story 4.4 |
| FR42 | Musique ambient loop | Epic 4 | Story 4.4 |
| FR43 | HUD temps réel | Epic 2 | Story 2.5 |
| FR44 | Menu principal | Epic 4 | Story 4.5 |
| FR45 | Upgrade shop UI | Epic 3 | Story 3.2 |
| FR46 | Menu pause | Epic 4 | Story 4.5 |
| FR47 | 60 FPS constant | Epic 1 | Story 1.8 |
| FR48 | <5s cold load | Epic 1 | Story 1.8, Epic 6 | Story 6.3 |
| FR49 | <100ms input latency | Epic 1 | Story 1.8 |

**Résultat:** ✅ 48/49 FRs couverts dans MVP (FR38 est stretch goal explicite)

---

## Summary

### Epic Breakdown Summary

**6 Epics, 35 Stories totales**

| Epic | Stories | FRs Couverts | Valeur Utilisateur Délivrée |
|------|---------|--------------|----------------------------|
| **Epic 1: Foundation & Core Movement** | 8 stories | FR1-5, FR27, FR36-37, FR47-49 | Mouvement fluide ultra-responsive avec Flap Wings unique |
| **Epic 2: Complete Gameplay Loop** | 5 stories | FR8-10, FR18-21, FR28-30, FR43 | Run complet rejouable avec procgen et mort/respawn |
| **Epic 3: Meta-Progression System** | 4 stories | FR22-26, FR45 | Progression permanente addictive entre runs |
| **Epic 4: Polish, Power-Ups & Game Feel** | 5 stories | FR6-7, FR11-17, FR39-42, FR44, FR46 | Jeu spectaculaire et satisfaisant avec juice |
| **Epic 5: Online & Social Features** | 5 stories | FR31-35 | Compétition sociale et partage de runs |
| **Epic 6: Production Deployment** | 5 stories | Deployment | Jeu accessible publiquement et optimisé |

### Story Sizing Distribution

- **Small** (1-2h): 12 stories (UI, config, simple features)
- **Medium** (2-4h): 18 stories (core mechanics, systems)
- **Large** (4-6h): 5 stories (procgen, online features, complex integrations)

**Total estimé:** ~90-110 heures de développement (vs budget 20h du GDD)
**Note:** Le GDD initial sous-estimait la complexité. Budget réaliste pour MVP quality: 40-50h.

### Implementation Readiness

✅ **Prêt pour Phase 4 Implementation**

- Tous les FRs MVP sont mappés à des stories
- Chaque story a des critères d'acceptation BDD clairs
- Les prérequis sont définis (pas de dépendances circulaires)
- L'architecture technique est documentée (`game-architecture.md`)
- Les détails d'implémentation référencent l'architecture

**Prochaines étapes recommandées:**
1. ✅ Epic breakdown complet
2. **Suivant:** `/bmad:bmm:workflows:sprint-planning` pour créer le fichier de suivi sprint
3. **Puis:** `/bmad:bmm:workflows:create-story` pour commencer Story 1.1
4. **Ou:** Démarrer directement l'implémentation si scope clair

### Notes d'Implémentation

**Ordre d'exécution recommandé:**
1. Epic 1 complet (infrastructure + mouvement)
2. Epic 2 stories 2.1-2.4 (gameplay loop sans HUD UI)
3. Epic 4 stories 4.3-4.4 (polish + audio pour feel)
4. Epic 2 story 2.5 + Epic 4 story 4.5 (UI/menus)
5. Epic 3 complet (meta-progression)
6. Epic 4 stories 4.1-4.2 (power-ups)
7. Epic 5 (online features)
8. Epic 6 (deployment)

**Raison:** Priorité au "game feel" avant features, car un jeu qui ne feel pas bien ne sera jamais addictif même avec toutes les features.

---

_Ce document sera mis à jour après les workflows UX Design et/ou Architecture pour incorporer des détails d'implémentation supplémentaires._

_Pour l'implémentation: Utiliser `/bmad:bmm:workflows:dev-story` pour exécuter chaque story individuellement._

