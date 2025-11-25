# Game Brief: Rainbow Racer V2

**Date:** 2025-11-23
**Author:** Fab
**Status:** Draft for GDD Development

---

## Executive Summary

**Rainbow Racer V2** est un action-platformer roguelite 2.5D où une licorne cosmique traverse des dimensions procédurales. Développé en **Next.js + Supabase** avec un budget de **20 heures**, ce projet démontre une maîtrise fullstack moderne tout en créant une expérience de jeu addictive inspirée de Hollow Knight et Hades.

**Vision Core** : Prouver qu'un jeu web peut rivaliser avec des jeux natifs en termes de qualité et d'engagement, tout en restant accessible instantanément (zéro friction, juste une URL).

**Audience Cible** : Développeurs web et gamers casual (25-35 ans) qui apprécient les roguelites accessibles et reconnaissent les exploits techniques. Portfolio piece principal visant à impressionner recruteurs et communauté dev.

**Gameplay Pillars** :
1. **Movement Mastery** - Contrôles ultra-responsifs (dash, jump, wall-slide)
2. **Roguelite Loop** - Meta-progression permanente, chaque run compte
3. **Social Competition** - Leaderboards globaux + ghost racing asynchrone
4. **Visual Spectacle** - Parallax 2.5D, particules explosives, geometric art style

**Différenciateurs Clés** :
- Premier roguelite platformer de qualité en browser (niche vide)
- Stack technique moderne (Next.js 14 + Supabase + Canvas avancé)
- Ghost racing et leaderboards temps réel (viral potential)
- Style "Wholesome Dark Fantasy" unique (Hollow Knight meets kawaii unicorns)
- Cacalicorne Bomb power-up 💩✨ (humour + satisfaction)

**MVP Scope** (20h) :
- Core gameplay : Mouvement fluide, 1 biome, génération procédurale
- Meta-progression : 5-8 upgrades permanents
- Online : Auth + leaderboard global
- Polish : Particles, screenshake, audio, UI

**Success Metrics** :
- **Technique** : 60 FPS constant, code portfolio-quality, Lighthouse >85
- **Engagement** : >15 min session moyenne, >40% return rate
- **Social** : 500+ joueurs première semaine, featured on dev communities
- **Carrière** : Projet pinned GitHub, talking point interviews

**Risques Majeurs** : Scope creep (HIGH), procgen balance (MEDIUM), performance (MEDIUM). Mitigations : MVP strict, early playtesting, profiling dès jour 1.

**Next Steps** : Validation technique Supabase (1h) → Setup Next.js → Prototype mouvement → Itération sur game feel → Features online → Polish.

---

## Game Vision

### Core Concept

Un action-platformer 2.5D roguelite où une licorne traverse des dimensions arc-en-ciel en perpétuelle évolution, avec meta-progression permanente et ghost racing asynchrone contre les runs d'autres joueurs.

### Elevator Pitch

Rainbow Racer V2 fusionne l'élégance visuelle de Hollow Knight avec la boucle addictive de Hades dans un univers onirique de licornes cosmiques. Chaque run débloque des upgrades permanents, chaque mort te rend plus fort, et tu peux affronter les fantômes des meilleurs runs de tes amis. Un showcase technique fullstack (Next.js + Supabase + Canvas avancé) déguisé en jeu addictif de 5 minutes... qui finit par durer 5 heures.

### Vision Statement

Créer un jeu web qui démontre une maîtrise complète du développement moderne : architecture fullstack Next.js, temps réel avec Supabase, rendering 2.5D avancé, et game design roguelite qui récompense chaque seconde de jeu. Ce n'est pas juste "un jeu de licorne" - c'est une preuve technique que le web peut délivrer des expériences comparables aux jeux natifs, avec l'avantage du zéro-friction (pas d'install, partage d'URL, leaderboards instantanés). Le jeu doit être impossible à poser, tout en restant réalisable en 20h grâce à des choix techniques malins et un scope laser-focused sur ce qui crée l'addiction.

---

## Target Market

### Primary Audience

**Profil principal** : Développeurs web et gamers casual (25-35 ans)
- Joueurs qui apprécient les jeux browser de qualité (Slither.io, Agar.io évolution)
- Fans de roguelites accessibles (Hades, Dead Cells, Vampire Survivors)
- Développeurs tech-savvy qui reconnaissent l'exploit technique
- Audience Reddit/Twitter/LinkedIn qui partage des side projects impressionnants

**Comportement** :
- Sessions courtes (5-15 min) mais fréquentes
- Aime la compétition sociale (leaderboards, partage de scores)
- Sensible à l'esthétique et au polish
- Apprécie les jeux "one more run"

### Secondary Audience

**Profils secondaires** :
1. **Recruteurs tech** : Portfolio piece qui démontre des compétences fullstack modernes
2. **Communauté gamedev indie** : Intéressée par le processus et les choix techniques
3. **Joueurs casual mobile** : Pourraient jouer sur mobile si l'UX est bonne
4. **Streamers/YouTubers** : Contenu potentiel pour petits créateurs (speedruns, challenges)

### Market Context

**Opportunité** :
- Les jeux browser ont connu une renaissance (COVID boost toujours actif)
- Le marché des roguelites est saturé sur Steam, mais quasi vide sur web
- Les side projects techniques bien exécutés génèrent énormément d'engagement social (HackerNews, Reddit gamedev)
- Next.js + Supabase = stack hyped, bon pour la visibility technique

**Timing** :
- Portfolio piece parfait pour 2025 (montre maîtrise stack moderne)
- Les "cozy games" et aesthetics wholesome sont en croissance
- Ghost racing est une feature unique dans l'espace browser roguelite

**Compétition web** :
- Pas de vrai équivalent roguelite/platformer de qualité en browser
- Most browser games = idle/clicker ou .io games basiques
- Hollow Knight-like en browser = niche complètement vide

---

## Game Fundamentals

### Core Gameplay Pillars

**1. Movement Mastery**
- Contrôles ultra-responsive (comme Celeste/Hollow Knight)
- Dash, double-jump, wall-slide fluides
- "Game feel" parfait : screenshake, particles, sound design
- Courbe d'apprentissage satisfaisante

**2. Risk/Reward Roguelite Loop**
- Chaque run = progression permanente garantie (currencies)
- Morts = learning opportunities, pas frustration
- Choix stratégiques : routes dangereuses = meilleurs rewards
- Meta-progression visible et gratifiante

**3. Social Competition**
- Ghost racing : voir les runs de tes amis en temps réel
- Leaderboards globaux et entre amis
- Shareable replays/runs (URL unique)
- Daily/Weekly challenges avec leaderboards dédiés

**4. Visual Spectacle**
- Cascades de particules lors des combos
- Transformations visuelles de l'environnement
- Camera shake et effets screen-space
- Chaque action = feedback visuel/audio immédiat

### Primary Mechanics

**Core Loop (Run-based)** :
1. Spawner dans un niveau procédural
2. Traverser des sections avec obstacles/ennemis
3. Collecter gems/powerups
4. Affronter mini-boss optionnel (high risk/reward)
5. Mourir ou finir le niveau
6. Dépenser currencies pour upgrades permanents
7. Recommencer plus fort

**Movement** :
- **WASD/Arrow keys** : déplacement 8-directions
- **Space** : jump (hold for variable height)
- **Shift** : dash avec i-frames (cooldown court)
- **Double jump** (unlock)
- **Wall slide** (unlock)

**Combat (simplifié)** :
- **Click/Z** : attaque rapide (optional, peut être unlock)
- Focus sur évitement plutôt que combat
- Enemies = obstacles dynamiques

**Progression** :
- **Gems** : currency permanente pour upgrades
- **Stars** : score/leaderboard
- **Rainbow fragments** : unlock de nouvelles licornes (skins avec abilities)

**Power-ups temporaires** (dans le run) :
- Speed boost
- Invincibility
- Magnet (auto-collect gems)
- Ghost mode (traverse obstacles)

**Special Ultimate : Cacalicorne Bomb** 💩✨ :
- Collecte après X gems OU trouve un bonus rare
- Activation : Clear TOUS les ennemis à l'écran
- Visual : Explosion rainbow de cacas cosmiques
- Sound : Satisfying "BOOM" + rires
- Cooldown/Limited uses (pas spam)

### Player Experience Goals

**Émotions ciblées** :

**Flow State** (70% du temps) :
- Contrôles si fluides qu'on ne pense plus, on réagit
- Musique hypnotique synchronisée aux actions
- Difficulté qui scale avec le skill du joueur
- "Je suis dans la zone"

**Triumph** (Moments clés) :
- Battre son record personnel
- Dépasser le ghost d'un ami
- Débloquer un upgrade game-changing
- Survivre une section "impossible" de justesse

**Discovery/Surprise** :
- Nouveaux biomes visuellement distincts
- Unlocks qui changent le gameplay
- Secrets cachés dans les niveaux
- Easter eggs et références

**"One More Run" Compulsion** :
- "J'étais SI proche de mon record"
- "Je veux essayer ce nouvel upgrade"
- "Je vais battre le ghost de mon pote"
- "Juste un dernier run avant de dormir..." (5 runs plus tard)

**Fierté sociale** :
- Partager son score sur Twitter/LinkedIn
- Top du leaderboard entre amis
- Montrer le jeu à d'autres devs ("regarde c'est fait en Next.js!")

---

## Scope and Constraints

### Target Platforms

**Primary** : Desktop Web (Chrome, Firefox, Safari)
- 1920x1080 optimisé
- Keyboard controls (WASD + Space + Shift)
- 60 FPS stable

**Secondary** : Mobile Web (stretch goal, pas prioritaire)
- Touch controls (virtual joystick + buttons)
- Responsive design
- Performance degradée acceptable

**Distribution** :
- Vercel deployment (gratuit, Next.js natif)
- Custom domain (rainbowracer.dev ou fabien.dev/rainbow-racer)
- Shareable via simple URL (zero friction)

### Development Timeline

**Budget total** : Maximum 20 heures de dev (soirs/weekends)

**Phase 1 - Foundation** (6h) :
- Setup Next.js + Supabase + Canvas boilerplate
- Mouvement de base (WASD, jump, gravity)
- Collision detection système
- 1 biome de test avec parallax layers

**Phase 2 - Core Loop** (8h) :
- Génération procédurale basique (platforming sections)
- Système de gems/score
- Meta-progression (upgrades menu + persistence)
- Mort/respawn flow
- Polish du game feel (particles, screenshake, audio)

**Phase 3 - Online Features** (4h) :
- Supabase auth (Google/GitHub OAuth)
- Leaderboards (global + friends)
- Ghost recording/playback basique
- Replay sharing (URL avec run ID)

**Phase 4 - Polish** (2h) :
- UI/UX refinement
- Menu screens
- Responsive tweaks
- Bug fixes

**Stretch Goals** (si temps restant) :
- Boss battle (prototype simple)
- 2e biome visuel
- Daily challenges
- Plus d'upgrades

### Budget Considerations

**Coûts** : ~0€ (gratuit pour un side project)

**Services gratuits** :
- Supabase Free Tier : 500MB DB, 2GB storage, 50K users
- Vercel Hobby Plan : Hosting illimité, 100GB bandwidth
- GitHub : versioning
- Assets : free/CC0 ou création perso

**Assets** :
- Sprites : Pixel art simple (auto-généré ou itch.io CC0)
- Audio : Freesound.org, incompetech (royalty-free)
- Fonts : Google Fonts
- Particules : custom canvas rendering

**Évitements** :
- Pas de paid assets
- Pas de services premium
- Pas de CDN payant

### Team Resources

**Team** : Solo dev (Fab)

**Compétences disponibles** :
- ✅ Next.js/React (maîtrisé)
- ✅ JavaScript/TypeScript
- ✅ Canvas API (V1 experience)
- ✅ Backend/API design
- ⚠️ Game development patterns (apprentissage en cours)
- ⚠️ Advanced rendering techniques (learning by doing)
- ❌ Pixel art (assets externes ou style minimaliste)
- ❌ Audio design (assets gratuits)

**Disponibilité** :
- Soirs : 2-3h/session (3-4 soirs/semaine)
- Weekends : 4-6h/jour potentiel
- Objectif : finir en 2-3 semaines max

**Mitigation solo dev** :
- Scope très serré (focus sur le core)
- Réutilisation de code (V1 patterns)
- Assets génériques acceptables
- Pas de perfectionnisme paralysant

### Technical Constraints

**Performance targets** :
- 60 FPS constant sur laptop moderne (2020+)
- <5s cold load time
- <100ms input latency
- Fonctionne offline après premier load (PWA optionnel)

**Browser support** :
- Chrome/Edge (primary)
- Firefox (secondary)
- Safari (best effort)
- No IE11 (on est en 2025)

**Tech stack** :
- **Frontend** : Next.js 14+ (App Router)
- **Rendering** : Canvas API (pas WebGL pour simplicité)
- **State** : React Context ou Zustand (léger)
- **Backend** : Next.js API Routes
- **Database** : Supabase (Postgres)
- **Auth** : Supabase Auth (OAuth providers)
- **Realtime** : Supabase Realtime (WebSocket abstrait)
- **Deployment** : Vercel
- **TypeScript** : Strict mode

**Contraintes techniques** :
- Pas de WebGL/Three.js (trop complexe pour le budget)
- Pas de physics engine (custom simple physics)
- Pas de tilemap editor (génération programmatique)
- Code modulaire pour faciliter ajouts futurs

---

## Reference Framework

### Inspiration Games

| Jeu | Ce qu'on prend | Ce qu'on NE prend PAS |
|-----|----------------|----------------------|
| **Hollow Knight** | - Esthétique onirique sombre/belle<br>- Controls ultra-tight<br>- Atmosphere immersive | - Métroidvania complexity<br>- Combat depth<br>- Map exploration |
| **Hades** | - Meta-progression addictive<br>- "Chaque run compte"<br>- Upgrade choices meaningful | - Narrative depth<br>- Build diversity complexity<br>- Multiple weapons/styles |
| **Vampire Survivors** | - "One more run" compulsion<br>- Simple controls, deep meta<br>- Auto-progression satisfaction | - Auto-combat<br>- Top-down perspective<br>- Survivor gameplay |
| **Celeste** | - Platforming feel parfait<br>- Dash mechanic<br>- Screenshake/juice | - Level design handcrafted<br>- Story focus<br>- Extreme difficulty |
| **Flappy Bird / Doodle Jump** | - Simple à comprendre<br>- Leaderboard driven<br>- Browser-friendly | - Simplisme extrême<br>- Pas de progression<br>- Repetitiveness |

### Competitive Analysis

**Browser Platformers** :
- **The Unfair Platformer, VVVVVV (web port)** : Single-player, pas de progression
  - ✅ Prouvent que platformer browser peut marcher
  - ❌ Aucune meta-progression ni features online
  - 🎯 **Notre edge** : Roguelite loop + social features

**Roguelites populaires** :
- **Dead Cells, Risk of Rain 2** : Steam/console only
  - ✅ Formule éprouvée addictive
  - ❌ Pas accessibles en un clic
  - 🎯 **Notre edge** : Zero friction, browser, gratuit

**Browser .io games** :
- **Slither.io, Agar.io** : Multiplayer temps réel simple
  - ✅ Viral potential énorme
  - ❌ Shallow gameplay, pas de progression
  - 🎯 **Notre edge** : Depth via meta-progression

**Jeux similaires directs** :
- ❌ **Aucun roguelite platformer de qualité en browser**
- Niche complètement vide

### Key Differentiators

**1. Stack Technique Moderne (Portfolio angle)** :
- Premier roguelite platformer fait en Next.js + Supabase
- Démontre expertise fullstack moderne
- Code open-sourceable = learning resource pour la communauté

**2. Zero-Friction Access** :
- Pas d'install, pas de store, juste une URL
- Play instantly, share instantly
- Works on any device avec browser moderne

**3. Social-First Design** :
- Leaderboards intégrés dès le début
- Ghost racing (voir runs de tes amis)
- Shareable replay URLs (viral potential)
- Friends-only leaderboards

**4. Meta-Progression Respectueuse** :
- Pas de grind artificiel
- Chaque run garantit progrès
- Pas de pay-to-win (c'est gratuit)
- Skill + progression = winning combo

**5. Aesthetic Unique** :
- Hollow Knight vibes meets kawaii unicorn universe
- "Wholesome Dark Fantasy"
- Stand out visuellement dans le web game space

**6. Dev Transparent** :
- Build in public potential
- Tech blog posts sur l'archi
- Communauté gamedev interested

---

## Content Framework

### World and Setting

**Univers** : Les Dimensions Arc-en-ciel (Rainbow Dimensions)

**Concept** :
Une licorne cosmique nommée **Prism** voyage entre des dimensions parallèles interconnectées par des ponts d'arc-en-ciel. Chaque dimension a sa propre esthétique et dangers. La réalité se déforme à mesure qu'on progresse.

**Tone** :
- **Wholesome Dark Fantasy** : Cute mais avec une edge mystérieuse
- Pas de violence graphique, mais une atmosphère légèrement inquiétante
- Musique ambient/electronic dreamy

**Biomes (MVP = 1, Stretch = 3+)** :

**MVP - Biome 1 : "Crystal Cloudscape"**
- Ciel mauve/rose avec nuages géométriques
- Plateformes cristallines flottantes
- Particules qui scintillent
- Enemies : Nuages noirs basiques (obstacles)

**Stretch - Biome 2 : "Neon Abyss"**
- Cyber-espace sombre avec néons vifs
- Verticality extrême
- Plus rapide, plus dangereux

**Stretch - Biome 3 : "Stardust Sanctuary"**
- Final zone, espace cosmique
- Géométries impossibles (Escher-like)
- Boss fight potentiel

**Lore minimale** :
- Juste assez pour donner du contexte
- Textes courts dans les menus
- Environmental storytelling (pas de dialogues)
- Mysticisme vague = imagination du joueur

### Narrative Approach

**Philosophy** : Environmental storytelling over explicit narrative

**Delivery Method** :
- ❌ Pas de cutscenes
- ❌ Pas de dialogues
- ✅ Visual cues (changements d'environnement)
- ✅ Flavour text sur les upgrades
- ✅ Noms évocateurs (upgrades, biomes, ennemis)
- ✅ Musique qui raconte l'ambiance

**Story Arc (implicite)** :
1. Prism découvre les dimensions
2. Corruption/danger s'intensifie
3. Retour à l'harmonie (endless mode après "win")

**Tone Writing** :
- Mystérieux mais accessible
- Hints de lore profond sans l'imposer
- Noms poétiques : "Starfall Dash", "Crystalline Wings", "Void Echo"

**Scope narrative** :
- **MVP** : Aucun texte obligatoire (pure gameplay)
- **Polish** : Flavour text dans menus
- **Stretch** : Unlockable lore fragments

### Content Volume

**Playtime estimé (MVP)** :

**Premier run** :
- Tutorial implicite : 30 secondes
- First death : 1-2 minutes
- First "good run" : 3-5 minutes

**Session typique** :
- 5-10 runs
- 15-30 minutes total
- Débloque 2-3 upgrades

**Total content (progression complète)** :
- 10-15 upgrades permanents
- 3-5 heures pour "tout débloquer"
- Infinite replayability (leaderboards, perfecting runs)

**Contenu produit (développement)** :

**Art Assets (MVP)** :
- 1 Unicorn sprite (4 directions, 3 animation frames)
- 3 Enemy types (sprites simples)
- 1 Biome (5 parallax layers)
- 10 UI elements
- 20 particle effects (programmatiques)

**Audio Assets (MVP)** :
- 1 Music track (loop ambient)
- 8 SFX (jump, dash, collect, hurt, upgrade, etc.)

**Code** :
- ~2000-3000 lignes TypeScript
- 10-15 composants React
- 5-8 game systems (physics, collision, procedural gen, etc.)

**Générabilité** :
- Levels = 100% procédural (infinite variety)
- Patterns prédéfinis = ~10 platforming "chunks"
- Assemblage aléatoire = endless unique runs

---

## Art and Audio Direction

### Visual Style

**Art Direction** : "Geometric Dreams" - Minimalist 2.5D avec depth

**Style** :
- **Pas de pixel art** (différenciation de la V1)
- Geometric shapes + smooth gradients
- Inspirations : Monument Valley, Hollow Knight, Gris
- Profondeur via parallax multi-layers (5-7 couches)
- Palette limitée mais impactante

**Color Palette (Biome 1 - Crystal Cloudscape)** :
```
Background : #1a1a2e (deep purple)
Mid-ground : #16213e → #0f3460 (gradient blues)
Foreground : #533483 (purple platforms)
Accents : #e94560 (hot pink, danger)
Collectibles : #f9ed69 (gold stars)
Player : #ffffff (white/iridescent unicorn)
Particles : Rainbow gradient
```

**Visual Effects** :
- **Parallax scrolling** : 5-7 layers à vitesses différentes
- **Particle systems** :
  - Dash trail (rainbow)
  - Jump landing (dust)
  - Collectibles sparkle
  - Death explosion (stars dispersing)
- **Screen effects** :
  - Screenshake sur impacts
  - Chromatic aberration subtile
  - Glow/bloom sur éléments importants
  - Slow-mo sur near-misses (juice!)

**UI Style** :
- Minimal, non-intrusive
- Floating elements avec glassmorphism
- Animations micro (smooth transitions)
- Responsive feedback (hover states, clicks)

**Technical** :
- Canvas 2D rendering (pas WebGL)
- Layered rendering avec depth sorting
- Sprite rotation/scaling pour pseudo-3D
- Post-processing via second canvas layer

### Audio Style

**Music Direction** : Ambient Electronic Dreamy

**Reference mood** :
- C418 (Minecraft) - atmospheric, non-intrusive
- Lena Raine (Celeste) - emotional, driving
- Disasterpeace (Hyper Light Drifter) - synth ambiance

**Music (MVP = 1 track)** :
- **Track 1** : "Prism's Journey" (main gameplay loop)
  - 120-140 BPM
  - Synth pads + light percussion
  - Build-up subtil à mesure qu'on progresse
  - Loop parfait (3-4 minutes)

**SFX Philosophy** : Juicy et satisfaisant

**MVP SFX List** :
1. **Jump** : Soft whoosh up
2. **Land** : Impact avec pitch variation
3. **Dash** : Sharp whoosh + sparkle
4. **Collect Gem** : Satisfying chime
5. **Hit/Damage** : Low thud + brief silence
6. **Death** : Ethereal dispersal sound
7. **Upgrade Purchase** : Victory chime
8. **UI Click** : Subtle pop

**Stretch SFX** :
- Ambient sounds (wind, crystalline resonance)
- Enemy sounds
- Boss battle music
- Victory stinger

**Audio Implementation** :
- Web Audio API (pas de lib externe)
- Volume controls dans settings
- Ducking (music quiet pendant SFX importants)
- Spatial audio basique (pan left/right selon position)

### Production Approach

**Art Production** :

**MVP Strategy - Programmetic Art** :
- Geometric shapes via Canvas API (rectangles, circles, polygons)
- Gradients CSS/Canvas pour backgrounds
- Particle systems custom (pas de lib)
- Pas besoin d'artiste = gain temps énorme

**Polish Strategy - Hybrid** :
- Keep geometric style
- Ajouter 1-2 illustrated assets si temps (unicorn sprite)
- Sources : Figma (auto-design), itch.io CC0, ou AI-gen (style consistency)

**Audio Production** :

**MVP Strategy - Royalty-Free Curation** :
- **Music** : Incompetech, Purple Planet, Free Music Archive
  - Chercher : "ambient electronic", "dreamy synthwave"
  - License : Creative Commons ou Royalty-Free
- **SFX** : Freesound.org, Zapsplat
  - Download CC0 sounds
  - Pitch-shift dans code pour variations

**Tools** :
- **Design** : Figma (prototyping UI, color palettes)
- **Audio Editing** : Audacity (trim, normalize, export)
- **Sprites (if needed)** : Aseprite alternative (Piskel web-based)
- **Particles** : Custom code (Canvas drawing)

**Asset Pipeline** :
```
Design → Figma export SVG → Convert to Canvas draw calls
Audio → Download MP3/WAV → Compress to optimal size → Preload in game
Sprites → PNG sequences → Sprite atlas → Canvas drawImage()
```

**Quality Bar** :
- Cohérence stylistique > perfection artistique
- Performance > fidelity (60 FPS non-négociable)
- "Good enough" mindset pour MVP (polish après validation core loop)

**Time Allocation (art/audio dans 20h)** :
- Setup pipeline : 30min
- Geometric rendering code : 2h
- Parallax implementation : 1h
- Particle systems : 1.5h
- Audio integration : 1h
- UI design : 1h
- **Total** : ~7h art/audio (35% du budget total)

---

## Risk Assessment

### Key Risks

**1. Scope Creep (HIGH RISK)** ⚠️
- **Probabilité** : Haute
- **Impact** : Project fail (dépasse 20h)
- **Symptômes** : "Juste un petit feature de plus...", perfectionnisme
- **Déclencheur** : Excitement, comparaison avec jeux AAA

**2. Game Feel Not Addictive (MEDIUM RISK)**
- **Probabilité** : Moyenne
- **Impact** : Jeu techniquement bon mais pas fun
- **Symptômes** : Trop rigid, pas satisfaisant, manque de juice
- **Déclencheur** : Rusher le core loop sans playtesting

**3. Performance Issues (MEDIUM RISK)**
- **Probabilité** : Moyenne
- **Impact** : FPS drops = jeu unplayable
- **Symptômes** : Trop de particles, rendering naïf, memory leaks
- **Déclencheur** : Pas de profiling early

**4. Auth/Backend Complexity (LOW-MEDIUM RISK)**
- **Probabilité** : Faible-Moyenne
- **Impact** : Features online non fonctionnelles
- **Symptômes** : Supabase config hell, CORS issues
- **Déclencheur** : Première fois avec Supabase

**5. Motivation Drop (LOW RISK)**
- **Probabilité** : Faible (side project passion)
- **Impact** : Projet abandonné
- **Symptômes** : Blocage technique frustrant, perte d'intérêt
- **Déclencheur** : Bug impossible, burn-out

### Technical Challenges

**Challenge 1 : Procedural Generation Balanced**
- **Difficulté** : Moyenne-Haute
- **Problème** : Générer levels fun, pas impossibles ni triviaux
- **Pourquoi critique** : Core du roguelite, bad gen = bad game
- **Première expérience** : Oui (V1 était scripted)

**Challenge 2 : Game Feel Polish**
- **Difficulté** : Moyenne
- **Problème** : Faire des contrôles qui "feel good" = art subtil
- **Pourquoi critique** : Différence entre OK et addictif
- **Première expérience** : Partiellement (V1 avait basic feel)

**Challenge 3 : Canvas Performance Optimization**
- **Difficulté** : Moyenne
- **Problème** : Beaucoup d'entities + particles = FPS drop potentiel
- **Pourquoi critique** : 60 FPS = non-négociable pour platformer
- **Première expérience** : Oui (V1 était simple, peu d'optimisations)

**Challenge 4 : Supabase Integration**
- **Difficulté** : Faible-Moyenne
- **Problème** : Première utilisation, courbe d'apprentissage
- **Pourquoi critique** : Leaderboards = pilier social
- **Première expérience** : Oui

**Challenge 5 : Ghost Playback System**
- **Difficulté** : Moyenne-Haute
- **Problème** : Record positions, replay smoothly, sync avec game state
- **Pourquoi critique** : Differentiator majeur
- **Première expérience** : Oui

### Market Risks

**Risk 1 : "Just Another Browser Game"**
- **Probabilité** : Moyenne
- **Impact** : Pas de traction, pas de shares
- **Explication** : Si ça ne se démarque pas visuellement/techniquement
- **Indicateur** : <100 plays première semaine

**Risk 2 : Portfolio Impact Limité**
- **Probabilité** : Faible
- **Impact** : N'impressionne pas les recruteurs
- **Explication** : Si code/archi pas clean ou pas de doc technique
- **Indicateur** : Pas d'intérêt sur LinkedIn/GitHub

**Risk 3 : Niche Trop Petite**
- **Probabilité** : Faible
- **Impact** : Peu de joueurs interested
- **Explication** : Roguelite platformer = niche dans niche
- **Indicateur** : Feedback "c'est cool mais pas mon genre"

**Risk 4 : Competition Emerges**
- **Probabilité** : Très faible (court terme)
- **Impact** : First mover advantage perdu
- **Explication** : Quelqu'un fait mieux pendant qu'on dev
- **Indicateur** : Autre jeu similaire viral sur HN/Reddit

### Mitigation Strategies

**Pour Scope Creep** :
✅ **MVP Document stricte** : Cette section = contrat avec soi-même
✅ **Time tracking** : Logger heures réelles, alert si >15h sans MVP complet
✅ **Feature freeze après Phase 2** : Aucune nouvelle feature, only polish
✅ **"Stretch goals" section** : Parking lot pour idées cool mais non-MVP
✅ **Public commitment** : Tweet "building X in 20h" = accountability

**Pour Game Feel** :
✅ **Prototype vertical slice first** : 2h sur juste movement + 1 obstacle
✅ **Playtest early** : Amis testent dès jour 2-3
✅ **Reference testing** : Jouer 30min à Celeste/Hollow Knight pour feel
✅ **Juice checklist** : Screenshake, particles, sounds = non-négociables
✅ **Iterate on feel before features** : Perfect jump avant d'ajouter dash

**Pour Performance** :
✅ **Profile early** : Chrome DevTools dès jour 1
✅ **Object pooling** : Particles/entities réutilisés, pas new/delete constant
✅ **Capped entities** : Max particles = 500, max enemies = 20
✅ **RequestAnimationFrame** : Pas setInterval
✅ **Canvas layering** : Static background sur canvas séparé
✅ **Test low-end device** : Old laptop test chaque milestone

**Pour Backend/Supabase** :
✅ **Tutorial first** : 1h suivre Supabase quickstart avant d'intégrer
✅ **Fallback plan** : Si Supabase bloque >2h, use localStorage + defer online
✅ **Incremental integration** : Auth first, puis DB, puis realtime
✅ **Community support** : Supabase Discord = responsive

**Pour Ghost Racing** :
✅ **MVP = Recording only** : Save runs, playback = stretch
✅ **Simplified format** : Store positions every 100ms, interpolate
✅ **Test data mocking** : Fake ghosts pour tester avant vraie infra
✅ **Defer if blocked** : Feature cool mais pas core = skippable

**Pour Motivation** :
✅ **Build in public** : Tweet progress = dopamine + accountability
✅ **Micro-victories** : Celebrate chaque milestone (emoji commits)
✅ **Switch tasks when blocked** : Stuck on physics? Do UI instead
✅ **Ask for help** : Discord communities, Reddit, Claude Code 😉
✅ **Remember why** : Portfolio piece + fun project = worth it

---

## Success Criteria

### MVP Definition

**Minimum Viable Product** : "Le core loop est addictif et rejouable"

**Must Have (Non-négociable)** :

✅ **Core Gameplay** :
- Mouvement fluide (WASD, Jump, Dash avec i-frames)
- Physics satisfaisantes (gravity, acceleration)
- Collision detection précise
- 1 biome jouable avec parallax

✅ **Platforming Content** :
- Génération procédurale basique (5-10 patterns réutilisables)
- 2-3 enemy types (obstacles dynamiques)
- Collectibles (gems + stars)
- Difficulté progressive (ramp up naturel)

✅ **Meta-Progression** :
- 5-8 upgrades permanents unlockables
- Currency system (gems = unlock upgrades)
- Persistent save (localStorage minimum)
- Visible progression bars/stats

✅ **Game Feel** :
- Screenshake sur impacts
- Particle effects (dash, jump, collecte)
- SFX pour actions principales (8 sons)
- 1 music track loopable

✅ **UI/Menus** :
- Main menu (Play, Upgrades, Leaderboard)
- In-game HUD (score, gems, combo)
- Upgrade shop UI
- Death screen avec stats

✅ **Online** :
- Leaderboard global (top 100)
- Auth basique (GitHub/Google OAuth via Supabase)
- Score submission

**Success Criteria MVP** :
- ✅ Core loop = fun après 3 runs
- ✅ Joueur teste "un dernier run" après avoir dit stop
- ✅ 60 FPS constant sur laptop moderne
- ✅ Friends playtestent et jouent >15 minutes
- ✅ Code = portfolio-quality (clean, typed, documented)

**Out of Scope MVP** :
- ❌ Ghost racing (stretch)
- ❌ Boss battles (stretch)
- ❌ Multiple biomes (stretch)
- ❌ Daily challenges (stretch)
- ❌ Mobile optimization (stretch)
- ❌ Animations complexes (stretch)
- ❌ Narrative/story (stretch)

### Success Metrics

**Technical Success** (Portfolio Goal) :

| Metric | Target | Measure |
|--------|--------|---------|
| **Code Quality** | 8/10+ | ESLint score, TypeScript strict, component modularity |
| **Performance** | 60 FPS | Chrome DevTools FPS counter |
| **Load Time** | <5s cold | Lighthouse performance score >85 |
| **Mobile-ready** | Functional | Works on 1 mobile device (degraded OK) |
| **Documentation** | Complete | README + architecture doc + inline comments |

**Player Engagement** (Game Success) :

| Metric | MVP Target | Stretch Target |
|--------|------------|----------------|
| **First Session Length** | >10 min average | >20 min |
| **Run Completion Rate** | >30% finish first run | >50% |
| **Return Rate** | >40% play 2+ sessions | >60% |
| **Average Runs per Session** | 5+ | 10+ |
| **"One More Run" trigger** | Playtesters mention | Measurable in analytics |

**Social/Viral** (Distribution Goal) :

| Metric | MVP Target | Stretch Target |
|--------|------------|----------------|
| **Shares** | 10+ personnes partagent | 50+ |
| **Leaderboard Entries** | 50+ unique players | 500+ |
| **Portfolio Views** | Link in resume/LinkedIn | Recruiter mentions it |
| **GitHub Stars** | 10+ (if open-source) | 100+ |
| **Dev Community** | Post on Reddit/HN | Front page HN/Reddit gamedev |

**Portfolio Impact** (Career Goal) :

| Metric | Target | Evidence |
|--------|--------|----------|
| **Resume Addition** | Featured project | Listed with tech stack |
| **Interview Talking Point** | Demonstrates fullstack | Can explain architecture |
| **GitHub Showcase** | Pinned repo | Clean code, good README |
| **Blog Content** | 1-2 posts | Technical deep-dive articles |
| **Recruiter Interest** | At least 1 mention | "Saw your game project..." |

### Launch Goals

**Phase 1 : Soft Launch** (Friends & Family)

**Timeline** : Dès MVP complete (~week 3)

**Distribution** :
- Deploy to Vercel (custom domain)
- Share with 10-15 close dev friends
- Private Discord/Slack groups

**Goals** :
- ✅ 20+ people play
- ✅ Get brutally honest feedback
- ✅ Fix 2-3 critical bugs
- ✅ Validate "it's actually fun"
- ✅ Gauge if worth public launch

**Success = Go/No-Go Decision** :
- If feedback >7/10 → public launch
- If feedback <5/10 → pivot or shelf

---

**Phase 2 : Public Launch** (if soft launch successful)

**Timeline** : +1 week post soft-launch (polish)

**Distribution** :
- Reddit : r/webgames, r/IndieDev, r/roguelites, r/javascript
- Twitter/X : #indiedev, #gamedev, #webdev hashtags
- LinkedIn : Post avec angle "built with Next.js"
- Hacker News : Show HN (si tech angle fort)
- Itch.io : Upload (HTML5 game)

**Goals** :
- 🎯 500+ unique players première semaine
- 🎯 1-2 posts get traction (>100 upvotes/likes)
- 🎯 Leaderboard avec >50 entries
- 🎯 At least 5 people share organically
- 🎯 1-2 dev/gaming YouTubers test (stretch)

**Messaging** :
- Dev angle : "Built a roguelite platformer in Next.js in 20h"
- Player angle : "Free browser game, no install, addictive as hell"
- Tech angle : "How I built ghost racing with Supabase realtime"

---

**Phase 3 : Iteration** (based on feedback)

**Timeline** : Ongoing (low maintenance)

**Potential Additions** :
- Daily challenges (if requested)
- More biomes (if engagement high)
- Boss battles (if gameplay validated)
- Mobile optimization (if traffic warrants)

**Long-term Success** :
- 🎯 2000+ total unique players
- 🎯 Featured on 1+ gaming/dev blog
- 🎯 Mentioned in at least 1 interview
- 🎯 Code becomes learning resource (if open-sourced)

---

## Next Steps

### Immediate Actions

**Priority 1 : Technical Validation** (Avant de coder)

1. **Supabase Quickstart** (1h)
   - Suivre tutorial officiel
   - Setup project Supabase
   - Test auth + DB basique
   - **Deliverable** : Auth fonctionnel en sandbox

2. **Canvas Performance Test** (30min)
   - Setup Next.js + Canvas
   - Spawn 500 particles
   - Test FPS sur laptop
   - **Deliverable** : Confirm 60 FPS possible

3. **Procgen Prototype** (1h)
   - Code 3-4 platform patterns
   - Random assembly test
   - Playability check
   - **Deliverable** : Screenshot de niveau généré

**Priority 2 : Asset Gathering** (1-2h)

4. **Audio Search**
   - Find 1 ambient music track (CC0)
   - Download 8+ SFX candidates
   - **Deliverable** : Audio folder ready

5. **Color Palette Lock**
   - Create Figma doc avec palette
   - Test contrasts (WCAG)
   - **Deliverable** : CSS variables file

**Priority 3 : Architecture Planning** (1h)

6. **Code Structure Design**
   - Plan folder structure
   - Define core interfaces (Player, Entity, Level, etc.)
   - **Deliverable** : Architecture diagram (simple)

7. **MVP Task Breakdown**
   - Break 20h into 10-15 tasks
   - Estimate each task
   - **Deliverable** : GitHub Projects board OR todo.md

**Priority 4 : Development Kickoff** (GO!)

8. **Next.js Setup**
   - `npx create-next-app@latest rainbow-racer-v2`
   - TypeScript strict
   - Install deps (Supabase client, Zustand if needed)

9. **First Playable**
   - Rectangle player moving on screen
   - Jump with gravity
   - First commit 🎉

### Research Needs

**Before Starting Development** :

✅ **Supabase Documentation** (Critical)
- Auth flow (OAuth GitHub/Google)
- Realtime subscriptions
- Row Level Security basics
- **Time** : 1-2h reading/tutorial

✅ **Procedural Generation Patterns** (Important)
- Research platformer procgen techniques
- Study Spelunky/Celeste level design principles
- **Resources** : GDC talks, roguelike tutorials
- **Time** : 1h

⚠️ **Canvas Optimization** (Nice to have)
- Object pooling patterns
- RequestAnimationFrame best practices
- Offscreen canvas techniques
- **Time** : 30min if needed

⚠️ **Game Feel References** (Nice to have)
- Play 30min Celeste (feel jump physics)
- Watch "Juice it or lose it" talk
- **Time** : 1h (fun research!)

**During Development** :

📚 **On-demand Research** :
- Ghost recording format (when implementing)
- Particle system optimization (if FPS issues)
- Leaderboard schema design (before DB setup)
- Collision detection algorithms (if basic version fails)

### Open Questions

**Design Questions** (Need decisions before/during dev) :

❓ **Platformer Orientation** :
- **Horizontal scroller** (like V1) OR **Vertical climber** (like Doodle Jump)?
- **Decision point** : Prototype phase
- **Impact** : Core mechanic design

❓ **Difficulty Curve** :
- **Linear difficulty ramp** OR **Biome-based jumps**?
- **Decision point** : After procgen working
- **Impact** : Player retention

❓ **Death Penalty** :
- **Harsh** (lose all run progress) OR **Soft** (keep some gems)?
- **Decision point** : Playtest feedback
- **Impact** : Frustration vs challenge

❓ **Upgrade System** :
- **Flat unlocks** (just add features) OR **Incremental** (level 1, 2, 3...)?
- **Decision point** : Meta-progression design
- **Impact** : Grind perception

**Technical Questions** (Can defer/decide later) :

❓ **State Management** :
- React Context OR Zustand OR plain JS?
- **Decision** : Start simple (Context), upgrade if needed

❓ **Asset Loading** :
- Preload all OR lazy load?
- **Decision** : Preload for MVP (small asset count)

❓ **Mobile Support** :
- Responsive from day 1 OR desktop-first?
- **Decision** : Desktop-first, mobile = stretch

❓ **Open Source** :
- Public repo from start OR private then release?
- **Decision** : Private initially, public after polish

**Product Questions** (Post-launch considerations) :

❓ **Monetization** :
- Keep 100% free OR add optional donations/cosmetics?
- **Decision** : Free for MVP, revisit if traction

❓ **Expansion Strategy** :
- Standalone game OR add to portfolio site?
- **Decision** : Standalone domain initially

❓ **Community** :
- Discord server OR just GitHub issues?
- **Decision** : If >500 players, consider Discord

**Unknowns to Validate** :

⚠️ **Is roguelite the right genre?**
- Maybe endless runner is simpler/more addictive?
- **Validation** : Early prototype playtesting

⚠️ **Will procgen be fun or repetitive?**
- Risk: All runs feel same
- **Validation** : Playtest 10+ runs, check variety

⚠️ **Is 20h realistic?**
- Might need 25-30h if challenges arise
- **Mitigation** : Track hours religiously, cut scope if needed

---

## Appendices

### A. Research Summary

**V1 Analysis** (Rainbow Racer Original)

**Ce qui marchait** :
- ✅ Thématique licorne/rainbow universellement appréciée
- ✅ Contrôles simples et accessibles (WASD + Space)
- ✅ Cacalicorne power-up = moment de satisfaction
- ✅ Sound design contribuait au fun
- ✅ Difficulté progressive bien dosée

**Ce qui limitait** :
- ❌ Gameplay trop simple (juste éviter)
- ❌ Pas de progression permanente (pas de raison de rejouer)
- ❌ Assets pixel art basiques
- ❌ Aucune feature sociale (scores locaux seulement)
- ❌ Tech stack vanilla = limitations (pas de backend facile)

**Leçons apprises** :
- Le "game feel" est crucial même pour un jeu simple
- Les power-ups créent des moments mémorables
- Le thème wholesome attire mais ne suffit pas pour l'engagement long-terme
- Besoin de meta-progression pour la rétention

**Market Research** (Browser Roguelites)

**Constat** :
- Quasi aucun roguelite platformer de qualité sur browser
- Les .io games dominent mais sont shallow
- Vampire Survivors a prouvé que roguelite browser = viable
- Stack Next.js + Supabase de plus en plus populaire en 2024-2025

**Opportunité** :
- First mover advantage dans cette niche
- Dev community hyped par ce stack
- Portfolio differentiation forte

### B. Stakeholder Input

**Primary Stakeholder** : Fab (Solo Dev)

**Objectifs du projet** :
1. **Portfolio Technique** : Démontrer maîtrise fullstack moderne
2. **Apprentissage** : Approfondir game dev patterns et Supabase
3. **Fun Personnel** : Side project créatif et satisfaisant
4. **Career Boost** : Talking point pour interviews, showcase GitHub

**Contraintes exprimées** :
- Maximum 20h de développement
- Soirs et weekends seulement
- Budget 0€ (services gratuits uniquement)
- Doit rester fun à développer (pas de burn-out)

**Préférences design** :
- Inspiration Hollow Knight (atmosphère + controls)
- Garder l'esprit licorne de la V1
- Ajouter profondeur (roguelite loop)
- Features sociales (leaderboards)
- Cacalicorne power-up preserved 💩

**Success criteria (personal)** :
- Code dont il est fier (clean, documented)
- Jeu que ses amis veulent rejouer
- Impressionne recruteurs/dev community
- Complet en 2-3 semaines max

### C. References

**Games (Design Inspiration)** :

🎮 **Hollow Knight** (Team Cherry)
- Movement feel reference
- Atmospheric world design
- Polish standard

🎮 **Hades** (Supergiant Games)
- Roguelite meta-progression model
- Upgrade system design
- "Every run counts" philosophy

🎮 **Celeste** (Maddy Makes Games)
- Platformer controls gold standard
- Dash mechanic implementation
- Accessibility options

🎮 **Vampire Survivors** (poncle)
- Browser roguelite viability proof
- Addictive loop design
- Simple controls, deep meta

🎮 **Dead Cells** (Motion Twin)
- Procgen platforming patterns
- Risk/reward balancing
- Upgrade variety

**Technical Resources** :

📚 **Supabase**
- Official Docs: https://supabase.com/docs
- Auth Guide: https://supabase.com/docs/guides/auth
- Realtime: https://supabase.com/docs/guides/realtime

📚 **Next.js 14**
- App Router: https://nextjs.org/docs/app
- Canvas integration patterns
- Performance optimization

📚 **Game Development**
- "Game Programming Patterns" (Robert Nystrom)
- "The Art of Game Design" (Jesse Schell)
- "Juice it or Lose it" (GDC Talk)
- r/gamedev, r/roguelikedev (Reddit)

📚 **Procedural Generation**
- Spelunky level generation (Derek Yu articles)
- "Procedural Content Generation in Games" (Shaker et al.)

**Assets & Tools** :

🎨 **Audio**
- Freesound.org (SFX)
- Incompetech (Kevin MacLeod music)
- Purple Planet Music
- Free Music Archive

🎨 **Design**
- Figma (UI prototyping)
- Coolors.co (palette generation)
- Google Fonts

🎨 **Development**
- VS Code
- Chrome DevTools (profiling)
- Git/GitHub
- Vercel (hosting)

**Community & Support** :

💬 **Discord Servers**
- Supabase Official
- Next.js
- Indie Game Devs
- Gamedev.js

💬 **Forums**
- r/webdev
- r/gamedev
- r/roguelitedev
- Hacker News (Show HN)

**V1 Repository** :
- GitHub: fabiendubin/Rainbow-Racer (current repo)
- Deployed: https://fabiendubin.github.io/Rainbow-Racer/

---

_This Game Brief serves as the foundational input for Game Design Document (GDD) creation._

_Next Steps: Use the `/bmad:bmgd:workflows:gdd` command to create detailed game design documentation._
