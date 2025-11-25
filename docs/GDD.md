# Rainbow Racer V2 - Game Design Document

**Author:** Fab
**Game Type:** Action Platformer / Roguelite
**Target Platform(s):** Web Browser (Desktop primary, Mobile stretch)
**Date:** 2025-11-23

---

## Executive Summary

### Core Concept

Rainbow Racer V2 est un action-platformer roguelite 2.5D où une licorne cosmique nommée **Prism** traverse des dimensions arc-en-ciel procédurales. Chaque run débloque des upgrades permanents, chaque mort rend le joueur plus fort. Le jeu combine des contrôles ultra-responsifs inspirés de Celeste/Hollow Knight avec une meta-progression addictive type Hades, le tout dans un browser web accessible instantanément.

**Core Loop** : Spawner → Traverser niveau procédural → Collecter gems/power-ups → Mourir ou finir → Acheter upgrades → Recommencer plus fort.

### Target Audience

**Primary** : Développeurs web et gamers casual (25-35 ans)
- Fans de roguelites accessibles (Hades, Dead Cells, Vampire Survivors)
- Développeurs tech-savvy qui reconnaissent les exploits techniques
- Joueurs qui apprécient les jeux browser de qualité
- Sessions courtes (5-15 min) mais répétées

**Secondary** : Recruteurs tech, communauté gamedev indie, joueurs casual mobile

### Unique Selling Points (USPs)

1. **Zero-Friction Access** : Pas d'install, juste une URL - joue en 2 secondes
2. **Premier roguelite platformer browser de qualité** : Niche complètement vide
3. **Stack moderne showcase** : Next.js 14 + Supabase + Canvas avancé (portfolio piece)
4. **Ghost Racing asynchrone** : Affronter les runs fantômes de tes amis
5. **Wholesome Dark Fantasy** : Hollow Knight vibes meets kawaii unicorns
6. **Cacalicorne Bomb** 💩 : Power-up ultime décalé et satisfaisant

---

## Goals and Context

### Project Goals

1. **Portfolio Technique** : Démontrer maîtrise fullstack moderne (Next.js, Supabase, game dev patterns)
2. **Jeu Addictif** : Créer une boucle "one more run" impossible à lâcher
3. **Social Traction** : 500+ joueurs première semaine, featured on dev communities
4. **Career Boost** : Talking point interviews, projet pinned GitHub
5. **Learning** : Approfondir procgen, game feel, et architecture temps réel

### Background and Rationale

**Pourquoi maintenant** :
- V1 de Rainbow Racer réalisée il y a 1 an = montrer la progression technique
- Roguelites browser quasi inexistants alors que la formule est prouvée addictive
- Stack Next.js + Supabase en vogue = visibility garantie
- Budget 20h = faisable en 2-3 semaines soirs/weekends

**Contraintes** :
- Solo dev, budget 0€, max 20h de développement
- Doit rester fun à développer (pas de burn-out)
- Code portfolio-quality (clean, typed, documented)

---

## Core Gameplay

### Game Pillars

**1. Movement Mastery**
- Contrôles ultra-responsifs (tight controls)
- Flap Wings system (jump → flap → glide) unique et thématique 🪽
- Dash avec i-frames, wall-slide
- "Game feel" parfait : screenshake, particles, wing animations, sound design
- Courbe d'apprentissage satisfaisante (easy to learn, hard to master)

**2. Risk/Reward Roguelite Loop**
- Chaque run garantit progression permanente (currencies)
- Morts = learning opportunities, pas frustration
- Choix stratégiques : routes dangereuses = meilleurs rewards
- Meta-progression visible et gratifiante

**3. Social Competition**
- Leaderboards globaux et entre amis
- Ghost racing : voir les runs fantômes des autres joueurs
- Shareable replays (URL unique par run)
- Daily/Weekly challenges (stretch)

**4. Visual Spectacle**
- Cascades de particules lors des combos
- Parallax multi-couches (profondeur 2.5D)
- Camera shake et effets screen-space
- Chaque action = feedback visuel/audio immédiat

### Core Gameplay Loop

```
1. Spawner dans niveau procédural
   ↓
2. Traverser sections platforming (jump, dash, éviter obstacles)
   ↓
3. Collecter gems (currency) + stars (score) + power-ups
   ↓
4. (Optional) Affronter mini-boss pour gros rewards
   ↓
5. Mourir OU compléter le niveau
   ↓
6. Écran de mort : voir stats du run, comparer au ghost des amis
   ↓
7. Dépenser gems pour acheter upgrades permanents
   ↓
8. Retour à étape 1 (PLUS FORT)
```

**Session Typique** : 5-10 runs de 1-5 minutes chacun = 15-30 min total

### Win/Loss Conditions

**Loss** (primaire dans roguelite):
- Toucher un ennemi/obstacle sans power-up
- Health bar optionnelle (stretch) sinon 1-hit = mort
- Mort = fin du run, retour au hub des upgrades

**Win** :
- MVP : Survivre X secondes OU atteindre score Y
- Stretch : Battre boss final du biome
- Post-"Win" : Endless mode infini pour leaderboards

**Pas de Game Over permanent** : Meta-progression garantit que chaque mort = progrès

---

## Game Mechanics

### Primary Mechanics

**Movement** :
- **WASD / Arrow Keys** : Déplacement 8-directions
- **Space (tap)** : Jump normal (hold pour variable height)
- **Space (tap en l'air)** : Flap Wings - boost vertical avec animation ailes 🪽
- **Space (hold après flap)** : Vol plané - descente ralentie, +distance horizontale
- **Shift** : Dash avec i-frames (cooldown ~1s)
- **Wall Slide** : Unlock via upgrade

**Flap Wings System** (3-en-1) :
1. Premier Space = Jump standard
2. Deuxième Space en l'air = Flap Wings (boost up + animation battement ailes)
3. Hold Space après flap = Planer (falling speed réduite, contrôle horizontal accru)

**Collection** :
- **Gems** 💎 : Currency permanente (persiste après mort)
- **Stars** ⭐ : Score/leaderboard (perdu à la mort)
- **Rainbow Fragments** 🌈 : Unlock nouvelles licornes (skins avec abilities différentes)

**Power-ups Temporaires** (durée du run) :
- Speed Boost (vitesse x1.5)
- Invincibility (5-10s)
- Magnet (auto-collect gems)
- Ghost Mode (traverse obstacles)

**Special Ultimate : Cacalicorne Bomb** 💩 :
- Activation : Clear TOUS les ennemis à l'écran
- Collecte après X gems OU trouve bonus rare
- Visual : Explosion rainbow de cacas cosmiques
- Limited uses (1-3 par run)

**Combat** (minimal, focus sur évitement) :
- **Click / Z** : Attaque rapide (optional unlock)
- Enemies = obstacles dynamiques plus qu'adversaires à combattre
- Focus : éviter > tuer

### Controls and Input

**Keyboard** (Primary) :
```
WASD / Arrows : Movement
Space (tap)   : Jump / Flap Wings
Space (hold)  : Glide (après flap)
Shift         : Dash
P             : Use Cacalicorne Bomb
ESC           : Pause menu
```

**Touch** (Stretch - Mobile) :
- Virtual joystick (gauche)
- Jump button (droite bas)
- Dash button (droite haut)

**Gamepad Support** (Stretch) :
- Left Stick : Movement
- A : Jump
- B : Dash
- X : Attack (if unlocked)

---

## Game Type Specific: Roguelite Platformer

### Procedural Generation System

**Pattern-Based Assembly** :
- 10-15 "chunks" prédéfinis (platforming patterns)
- Assemblage aléatoire avec règles de difficulty scaling
- Seed-based generation (pour replay identiques si voulu)

**Chunk Types** :
1. **Easy** : Plateformes larges, spacing généreux (early game)
2. **Medium** : Gaps plus grands, obstacles basiques
3. **Hard** : Timing précis, ennemis multiples
4. **Reward** : Gems concentrés, risque élevé
5. **Boss Arena** : Zone spéciale, mini-boss optional

**Difficulty Ramp** :
- Premiers 30s : Easy chunks only (tutorial implicite)
- 30s-2min : Mix Easy/Medium
- 2min+ : All chunk types, weighted vers Hard

### Run Structure

**Phases d'un run** :
1. **Spawn** (0-10s) : Safe zone, tutorial hints si first run
2. **Early Game** (10s-1min) : Build momentum, collecte safe
3. **Mid Game** (1-3min) : Difficulté increase, choix risk/reward
4. **Late Game** (3min+) : Survie pure, high score chase
5. **Death / Victory** : Stats screen, progression

**Run Length Estimée** :
- First run (newbie) : 30s-1min
- Average run : 2-4min
- Expert run : 5-10min (si endless mode)

### Meta-Progression Tree

**Currency** : Gems (collectés dans runs, persistent)

**Upgrade Categories** :

**Movement Unlocks** :
1. Longer Glide (Cost: 50 gems) - Planer 2x plus longtemps
2. Double Flap (Cost: 100 gems) - 3e jump (2 flaps au lieu d'1)
3. Wall Slide (Cost: 150 gems) - Glisser sur les murs
4. Faster Dash Cooldown (Cost: 200 gems) - Dash plus fréquent
5. Air Dash (Cost: 250 gems) - Dash utilisable en plein vol

**Survival Upgrades** :
1. Start with 1 Power-up (Cost: 75 gems)
2. Longer Invincibility (Cost: 100 gems)
3. Extra Cacalicorne Bomb (Cost: 150 gems)

**Economy Boosts** :
1. Gem Multiplier x1.25 (Cost: 100 gems)
2. Magnet Radius +50% (Cost: 75 gems)

**Cosmetic Unlocks** (Stretch) :
- Nouvelle licorne skin avec ability unique
- Trail effects
- Victory animations

**Total MVP Upgrades** : 8-10 (faisable en 3-5h de jeu)

---

## Progression and Balance

### Player Progression

**Short-term** (Per Run) :
- Score accumulation (Stars)
- Temporary power-ups collection
- Skill improvement (learning patterns)

**Long-term** (Meta) :
- Gem accumulation pour unlocks permanents
- Déblocage upgrades qui changent le gameplay
- Nouvelles licornes avec abilities
- Leaderboard climb

**Pas de grind artificiel** :
- Chaque run rapporte gems (minimum garanti)
- Death penalty = 0 gems perdu
- Upgrades pas trop chers (avoid excessive grind)

### Difficulty Curve

**In-Run Difficulty** :
- Linear ramp : +10% difficulty every 30s
- Manifestations : Faster enemies, tighter gaps, more obstacles

**Meta Difficulty** :
- Upgrades rendent le joueur BEAUCOUP plus fort
- Difficulté ne scale pas avec upgrades (player power fantasy)
- Leaderboards = skill differentiator

**Accessibility** :
- Assist mode (stretch) : Slower game, more forgiving
- Visual/audio cues pour timing
- Pas de punition pour échec

### Economy and Resources

**Gems** 💎 :
- Drop rate : 1 gem par 2-3 obstacles évités
- Average per run : 10-30 gems (selon skill)
- Spent on : Permanent upgrades

**Stars** ⭐ :
- Leaderboard currency uniquement
- Lost on death
- Combos multiplient le gain

**Rainbow Fragments** 🌈 (Stretch) :
- Rare drops (1-5% chance)
- 10 fragments = unlock nouvelle licorne

---

## Level Design Framework

### Level Types

**MVP** : 1 Biome unique

**Biome 1 : "Crystal Cloudscape"**
- Environment : Ciel mauve/rose, nuages géométriques
- Plateformes : Cristaux flottants
- Enemies : Nuages noirs (obstacles lents)
- Aesthetic : Dreamy, geometric, pastel colors

**Stretch Goals** :

**Biome 2 : "Neon Abyss"**
- Environment : Cyber-espace sombre, néons vifs
- Verticality focus
- Faster, plus dangereux

**Biome 3 : "Stardust Sanctuary"**
- Final zone cosmique
- Boss battle potential
- Géométries impossibles (Escher-like)

### Level Progression

**MVP** : Endless procedural dans 1 biome
- Pas de "levels" distincts
- Infinite scroll vertical ou horizontal
- Difficulty ramp continu

**Stretch** : Biome transitions
- Tous les X points/temps, transition vers biome 2
- Visual shift dynamique
- New enemy types

**Unlock System** (Stretch) :
- Biome 2/3 unlockés après atteindre score Y

---

## Art and Audio Direction

### Art Style

**Direction** : "Geometric Dreams" - Minimalist 2.5D

**Visuals** :
- Geometric shapes + smooth gradients (PAS de pixel art)
- Parallax scrolling 5-7 layers pour profondeur
- Inspirations : Monument Valley, Hollow Knight, Gris

**Color Palette** (Biome 1) :
```
Background   : #1a1a2e (deep purple)
Mid-ground   : #16213e → #0f3460 (gradient blues)
Foreground   : #533483 (purple platforms)
Accents      : #e94560 (hot pink danger)
Collectibles : #f9ed69 (gold gems)
Player       : #ffffff (white iridescent unicorn)
Particles    : Rainbow gradient
```

**Effects** :
- Particle systems (dash trails, jump dust, explosions)
- Screen shake sur impacts
- Chromatic aberration subtile
- Glow/bloom sur éléments importants

**Production** :
- Geometric rendering via Canvas API
- Pas besoin d'artiste = programmatic art

### Audio and Music

**Music** : Ambient Electronic Dreamy

**Track 1 (MVP)** : "Prism's Journey"
- 120-140 BPM, synth pads + light percussion
- Loop 3-4 minutes
- Build-up subtil progressif
- Reference mood : C418 (Minecraft), Lena Raine (Celeste)

**SFX List** (9 sons MVP) :
1. Jump : Soft whoosh
2. **Flap Wings** : Wing flap + magical sparkle ✨
3. **Glide** : Subtle wind loop (while holding)
4. Land : Impact + pitch variation
5. Dash : Sharp whoosh + sparkle
6. Collect Gem : Satisfying chime
7. Hit/Damage : Low thud + brief silence
8. Death : Ethereal dispersal
9. Upgrade Purchase : Victory chime
10. Cacalicorne Bomb : BOOM + rires

**Sources** :
- Music : Incompetech, Purple Planet (Royalty-free)
- SFX : Freesound.org (CC0)

---

## Technical Specifications

### Performance Requirements

**Target** :
- **60 FPS constant** (non-négociable pour platformer)
- **<5s cold load time**
- **<100ms input latency**
- **Lighthouse score >85**

**Optimization Strategies** :
- Object pooling (particles/entities)
- Canvas layering (static background séparé)
- RequestAnimationFrame (pas setInterval)
- Capped entities (max 500 particles, 20 enemies)

### Platform-Specific Details

**Desktop Web** (Primary) :
- 1920x1080 optimized
- Chrome/Firefox/Safari support
- Keyboard controls
- Fullscreen mode

**Mobile Web** (Stretch) :
- Touch controls (virtual joystick)
- Responsive layout
- Performance degradée acceptable (30 FPS ok)

**Tech Stack** :
- **Frontend** : Next.js 14 (App Router), TypeScript strict
- **Rendering** : Canvas 2D API (pas WebGL = trop complexe)
- **State** : React Context ou Zustand
- **Backend** : Next.js API Routes
- **Database** : Supabase (Postgres)
- **Auth** : Supabase Auth (Google/GitHub OAuth)
- **Realtime** : Supabase Realtime (leaderboards)
- **Deployment** : Vercel (gratuit)

### Asset Requirements

**Art Assets** :
- 1 Unicorn sprite avec ailes animées (4 directions, 3-4 frames wing flap) ou geometric shape
- 3 Enemy types (geometric obstacles)
- 1 Biome (5 parallax layers = gradients)
- 10 UI elements (buttons, HUD, menus)
- 20+ particle effects (programmatic)
- Wing trail effects (feathers, sparkles)

**Audio Assets** :
- 1 Music track (MP3, ~3MB)
- 8 SFX (WAV/MP3, <100KB each)

**Code Estimate** :
- 2000-3000 lignes TypeScript
- 10-15 composants React
- 5-8 game systems (physics, collision, procgen, progression, etc.)

---

## Development Epics

### Epic Structure

**Budget Total** : 20 heures sur 2-3 semaines

#### Epic 1 : Core Gameplay Foundation (8h)
**Goal** : Mouvement fluide + collision + 1 biome jouable

**Stories** :
1. Setup Next.js + Supabase + Canvas boilerplate (1h)
2. Player entity : WASD movement + jump + gravity (1.5h)
3. Flap Wings system : 2e jump + glide avec wing animation (1.5h)
4. Collision detection system (platforms, enemies) (1.5h)
5. Dash mechanic avec i-frames (1h)
6. 1 Biome avec parallax (gradients programmatiques) (1.5h)
7. Génération procédurale basique (5-10 chunks) (1.5h)

#### Epic 2 : Game Loop & Progression (6h)
**Goal** : Boucle run-death-upgrade complète

**Stories** :
1. Collectibles system (gems, stars) (0.5h)
2. Death detection + respawn flow (0.5h)
3. Upgrade shop UI + persistence (localStorage) (1.5h)
4. 5 upgrades fonctionnels (longer glide, double flap, wall slide, etc.) (2h)
5. Meta-progression logic (gem accumulation, unlock gates) (1h)
6. Cacalicorne Bomb power-up (0.5h)

#### Epic 3 : Polish & Game Feel (4h)
**Goal** : Juice, audio, particles - rendre le jeu satisfaisant

**Stories** :
1. Particle systems (wing feathers, dash trail, jump dust, death explosion) (1.5h)
2. Wing flap animation + glide visual feedback (0.5h)
3. Screen shake + camera effects (0.5h)
4. Audio integration (1 music track, 10 SFX) (1h)
5. UI/UX polish (HUD, menus, transitions) (1h)

#### Epic 4 : Online Features (4h)
**Goal** : Auth, leaderboards, social

**Stories** :
1. Supabase Auth setup (Google OAuth) (1h)
2. Database schema (users, scores, runs) (0.5h)
3. Leaderboard global (top 100) (1h)
4. Score submission + display (0.5h)
5. Friends leaderboard (si temps) (1h)

#### Epic 5 : Bug Fixes & Deployment (2h)
**Goal** : Production-ready

**Stories** :
1. Bug fixes critiques (1h)
2. Vercel deployment + domain setup (0.5h)
3. README + documentation (0.5h)

**Total Estimated** : 24h (avec buffer) → Scope cuts si dépassement

**Stretch Epics** (Post-MVP) :
- Ghost Racing Playback
- Boss Battles
- Biomes 2 & 3
- Daily Challenges
- Mobile Optimization

---

## Success Metrics

### Technical Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Frame Rate | 60 FPS constant | Chrome DevTools |
| Load Time | <5s cold start | Lighthouse |
| Input Latency | <100ms | Manual testing |
| Lighthouse Score | >85 | Lighthouse CI |
| Code Coverage | >60% (stretch) | Jest |
| TypeScript Errors | 0 | tsc --noEmit |

### Gameplay Metrics

| Metric | MVP Target | Stretch |
|--------|-----------|---------|
| First Session Length | >10 min avg | >20 min |
| Run Completion Rate | >30% | >50% |
| Return Rate (Day 2) | >40% | >60% |
| Avg Runs per Session | 5+ | 10+ |
| Unique Players (Week 1) | 50+ | 500+ |
| Leaderboard Entries | 30+ | 100+ |

**Qualitative** :
- Playtesters mention "one more run" syndrome
- Friends play >15 min voluntarily
- Reddit/HN comments positive on game feel

---

## Out of Scope

**Définitivement Out** (MVP) :
- ❌ Multiplayer temps réel
- ❌ Boss battles
- ❌ Multiple biomes
- ❌ Narrative/story/dialogues
- ❌ Animations complexes (cutscenes)
- ❌ Mobile optimization (stretch only)
- ❌ Achievements system
- ❌ Microtransactions/monetization

**Déferred / Stretch** :
- ⚠️ Ghost Racing Playback (recording MVP, playback stretch)
- ⚠️ Daily/Weekly challenges
- ⚠️ Friends-only leaderboards
- ⚠️ Multiple licorn skins avec abilities
- ⚠️ Sound settings (volume sliders)

---

## Assumptions and Dependencies

**Assumptions** :
- Supabase free tier suffit (<500 users concurrents)
- Canvas 2D peut rendre à 60 FPS avec optimisations
- Procgen patterns seront fun (besoin playtest validation)
- 20h budget est réaliste pour MVP scope
- Royalty-free assets disponibles et de qualité suffisante

**Dependencies** :
- **Supabase** : Auth, DB, Realtime (gratuit, SLA incertain)
- **Vercel** : Hosting (gratuit, fiable)
- **Next.js** : Framework (stable, v14+)
- **Browser APIs** : Canvas, RequestAnimationFrame, Web Audio (standard)

**Technical Risks** :
1. Performance issues (particle overload) → Mitigation : Object pooling early
2. Supabase learning curve → Mitigation : 1h tutorial avant integration
3. Procgen balance → Mitigation : Playtest dès chunk system working
4. Scope creep → Mitigation : Strict MVP doc, time tracking

**External Factors** :
- Solo dev = single point of failure (Fab availability)
- First time with Supabase (learning overhead)
- Asset quality depends on CC0 availability

---

**GDD Version** : 1.0
**Last Updated** : 2025-11-23
**Next Steps** : Architecture workflow → Setup Next.js → Prototype Core Gameplay

