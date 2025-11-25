# Story 1.1: Setup Next.js + Supabase + Canvas Boilerplate

Status: done

## Story

En tant que **développeur**,
Je veux **initialiser le projet avec Next.js 16, Supabase et un Canvas de jeu fonctionnel**,
Afin que **toute l'infrastructure technique soit prête pour le développement du game engine**.

## Acceptance Criteria

1. **Given** le projet n'existe pas encore **When** j'exécute la commande d'initialisation Next.js avec le template Supabase **Then** un projet Next.js 16 est créé avec TypeScript strict mode activé

2. Supabase client est installé et configuré avec les clés d'environnement (.env.local)

3. Un composant GameCanvas.tsx est créé qui rend un canvas HTML5 en plein écran

4. Le canvas est accessible uniquement côté client (ssr: false)

5. La structure de dossiers suit l'architecture définie (src/game/, src/components/game/, src/lib/)

6. ESLint et Prettier sont configurés

7. Le projet build sans erreurs TypeScript

8. npm run dev lance le serveur sur localhost:3000

## Tasks / Subtasks

- [x] **Initialiser le projet Next.js avec template Supabase** (AC: #1)
  - [x] Projet Next.js 16.0.3 déjà initialisé avec template Supabase
  - [x] Next.js 16.x installé (version 16.0.3)
  - [x] TypeScript strict mode activé dans tsconfig.json

- [x] **Installer les dépendances additionnelles** (AC: #2)
  - [x] Zustand installé (v5.0.8)
  - [x] UUID installé (v13.0.0) avec @types/uuid
  - [x] clsx déjà présent (v2.1.1)

- [x] **Configurer Supabase** (AC: #2)
  - [x] Créé .env.local avec les clés Supabase
  - [x] Projet Supabase configuré (fbzkswpdxgffkruosvuh)
  - [x] Variables NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY configurées

- [x] **Créer la structure de dossiers du projet** (AC: #5)
  - [x] Créé game/core/ (adapté sans /src car template Supabase)
  - [x] Créé game/entities/
  - [x] Créé game/systems/
  - [x] Créé game/utils/
  - [x] Créé game/types/
  - [x] Créé components/game/
  - [x] lib/ déjà présent
  - [x] Créé store/
  - [x] Créé public/audio/music/
  - [x] Créé public/audio/sfx/
  - [x] Créé public/sprites/

- [x] **Créer le composant GameCanvas** (AC: #3, #4)
  - [x] Créé components/game/GameCanvas.tsx avec 'use client'
  - [x] Canvas HTML5 responsive qui prend tout l'espace
  - [x] useRef pour référencer le canvas
  - [x] useEffect pour initialiser le canvas au mount

- [x] **Créer une route /play pour le jeu** (AC: #3)
  - [x] Créé app/play/page.tsx
  - [x] Dynamic import avec 'use client' + ssr: false
  - [x] Loader avec spinner pendant le chargement

- [x] **Configurer ESLint et Prettier** (AC: #6)
  - [x] ESLint déjà configuré (eslint.config.mjs)
  - [x] Créé .prettierrc avec règles de base
  - [x] Ajouté scripts lint:fix, format, typecheck dans package.json

- [x] **Tester le build et le dev server** (AC: #7, #8)
  - [x] `npm run build` passe sans erreur
  - [x] `npm run dev` démarre sur localhost:3000
  - [x] Route /play fonctionne et affiche le canvas

## Dev Notes

### Architecture Patterns et Contraintes

Cette story établit les fondations du projet selon l'architecture définie dans `game-architecture.md`. Les points clés :

**Séparation Canvas/React :**
- Le game engine (dans `/src/game`) sera en pur TypeScript, sans dépendances React
- Les composants React (dans `/src/components`) ne toucheront JAMAIS directement le canvas
- Communication unidirectionnelle : GameEngine → Zustand Store → React Components

**Structure de dossiers :**
- `/src/game/` : Code du game engine (classes TS pures)
- `/src/components/game/` : Composants React UI (HUD, menus, overlays)
- `/src/lib/` : Utilitaires partagés (Supabase clients, constants, helpers)
- `/src/store/` : Zustand stores pour l'état UI

**Canvas Setup :**
- Le canvas doit être créé dans un Client Component (`'use client'`)
- Utiliser dynamic import avec `ssr: false` pour éviter le SSR
- Le canvas prendra la totalité de l'espace viewport pour une expérience immersive

**Performance :**
- TypeScript strict mode pour éviter les bugs runtime
- Turbopack activé pour des builds ultra-rapides
- Pas de SSR sur le game pour éviter l'overhead

### Project Structure Notes

La structure suit exactement celle définie dans `game-architecture.md` section "Project Structure" :

```
rainbow-racer-v2/
├── public/
│   ├── audio/
│   │   ├── music/
│   │   └── sfx/
│   └── sprites/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── play/
│   │       └── page.tsx        # Route du jeu
│   ├── components/
│   │   └── game/
│   │       └── GameCanvas.tsx  # Canvas wrapper
│   ├── game/                   # Game Engine
│   │   ├── core/
│   │   ├── entities/
│   │   ├── systems/
│   │   ├── utils/
│   │   └── types/
│   ├── lib/
│   │   ├── supabase/
│   │   ├── utils.ts
│   │   └── constants.ts
│   └── store/
│       └── useGameUIStore.ts
```

### Testing Standards Summary

Pour cette story initiale, les tests seront manuels :
- Vérifier que `npm run build` passe sans erreur TypeScript
- Vérifier que `npm run dev` démarre correctement
- Vérifier que la route `/play` affiche un canvas vide
- Vérifier que les variables d'environnement Supabase sont chargées

### References

- [Source: docs/game-architecture.md#Project-Initialization] - Commande d'initialisation exacte
- [Source: docs/game-architecture.md#Project-Structure] - Structure de dossiers complète
- [Source: docs/game-architecture.md#Technology-Stack-Details] - Détails Next.js 16 + Supabase
- [Source: docs/game-architecture.md#Game-Engine-↔-React-UI] - Pattern de séparation Canvas/React
- [Source: docs/epics.md#Story-1.1] - Spécification complète de la story

## Dev Agent Record

### Context Reference

<!-- Path(s) to story context XML will be added here by context workflow -->

### Agent Model Used

<!-- To be filled during story execution -->

### Debug Log References

<!-- To be filled during story execution -->

### Completion Notes List

<!-- To be filled during story execution -->

### File List

<!-- To be filled during story execution -->

## Change Log

**2025-11-24** - Story créée (status: drafted)
- Story extraite de epics.md Epic 1, Story 1.1
- Acceptance Criteria définis selon spécification des epics
- Tasks décomposés en subtasks actionnables
- Dev Notes ajoutées avec références architecture
