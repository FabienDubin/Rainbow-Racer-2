<div align="center">

# Rainbow Racer — L'Ascension 🦄🌈

**Accroche ton arc-en-ciel. Balance-toi. Lâche au bon moment.**

Un jeu d'ascension pour navigateur, pensé pour le téléphone. Refonte complète de mon
tout premier projet de bootcamp.

</div>

## Jouer

```bash
npm install
npm run dev
```

Puis http://localhost:3000. Sur téléphone, ajoute-le à l'écran d'accueil : c'est une PWA
installable, jouable en plein écran et hors-ligne après le premier chargement.

| Route | |
|---|---|
| `/` | le jeu |
| `/proto/prism` | planche de personnage : Prism dans chacun de ses états |
| `/v2` | la V2 horizontale, gardée comme point de comparaison |

## Le verbe

Un seul geste, au pouce : **tu appuies, tu tiens, tu relâches.**

Appuyer près d'un prisme y accroche ton arc-en-ciel. Tenir enroule le treuil et lance le
pendule. Lâcher te catapulte le long de la tangente — et *le moment* du lâcher décide de
tout. Les deux repères `⊥` marquent l'endroit où ta vitesse pointe droit vers le haut.

Loin de toute ancre, appuyer bat des ailes. C'est le filet de sauvetage, pas le plat
principal.

**Le treuil et la poussée sont payés par la qualité de ton lâcher précédent.** Le skill se
compose, la maladresse s'effondre. C'est le cœur du système.

**Plonger paie.** Attrape une ancre *sous* toi, tombe au-delà, et la corde fouette ta
vitesse de chute dans le balancier — jusqu'à +240 % de hauteur de lancer.

## Ce qui te met en danger

Rien ne tue à part **perdre de l'altitude**. Le Grondement monte depuis le bas et ne
s'arrête jamais ; tout le reste te coûte du tempo, et le tempo le laisse gagner.

- **Paliers** — de plus en plus espacés. Les franchir repousse l'orage.
- **Éclairs** — le nuage s'arme à ton approche, clignote, puis sa ligne d'altitude devient
  mortelle. Un danger qu'on lit.
- **Courants** — colonnes verticales. Une ascendance qu'on cherche, un rabattant qu'on
  évite.
- **Pilleurs** — des pies qui volent ta poussière et brisent ta chaîne. Elles ne te
  blessent pas : elles te prennent ce que tu as amassé.

## La boucle longue

La **poussière** ne se perd jamais à la mort. Les points suivent la route ; les
**guirlandes** valent double mais sont hors ligne — s'accrocher *de loin* garde la corde
longue et les balaie.

Chaque partie finit sur une **loterie** : trois cartes, tu en choisis une, les trois se
révèlent. Le premier cadeau tombe dans tes trois premières parties, puis environ une fois
sur sept.

La **boutique** vend trois natures de choses : du permanent qui enlève de la friction, du
consommable pour le prochain run, et des **modes** qui changent la sensation du jeu pendant
trois parties.

## Le son

Entièrement synthétisé en Web Audio, aucun fichier. La partition est **en couches, et les
couches arrivent avec ta chaîne** : nappe seule quand tu galères, puis basse, arpège,
batterie, et un lead quand tu enchaînes bien. Ta performance devient audible.

## Les langues

Français, anglais, allemand. Le sélecteur est en haut à gauche, en pendant du bouton de
son ; il disparaît pendant une partie, où ce coin appartient à l'altimètre. Le choix est
gardé dans `localStorage`, et à la toute première visite c'est la langue du navigateur qui
décide.

Tous les textes vivent dans `game/v3/i18n.ts` — y compris les noms et descriptions de la
boutique, qui ne sont donc plus dans `meta.ts`. Le français est la référence : les deux
autres sont typées sur son jeu de clés, donc une traduction oubliée est une erreur de
compilation et non un mot français qui surgit en allemand.

Le HUD est dessiné dans le canvas et se redessine à chaque image : il appelle `t()`
directement, sans passer par React, donc changer de langue est visible immédiatement même
au milieu d'une partie.

## Le classement

Hebdomadaire, remis à zéro chaque lundi — un classement de tous les temps est mort à
l'arrivée pour un nouveau joueur. Une ligne par personne : son meilleur de la semaine.

Par défaut les scores vont dans `.data/leaderboard.json`, ce qui suffit en local mais
s'efface sur un hébergement serverless. Pour un vrai classement partagé, crée un projet
[Supabase](https://supabase.com) gratuit et exécute :

```sql
create table scores (
  id bigint generated always as identity primary key,
  name text not null,
  score int not null,
  distance int not null,
  max_combo int not null,
  created_at timestamptz default now()
);

-- The board is always "this week", so every read filters on created_at
create index scores_created_at_idx on scores (created_at desc);

-- RLS on with NO policy at all: the anon key (which ships to the browser) can neither
-- read nor write, and only the server's secret key gets through, because a secret key
-- bypasses RLS. Without this, a public anon key on a table is an open write endpoint —
-- anyone can post a fake score, and the whole point of the board is that it is credible.
alter table scores enable row level security;
```

Then put the two values in the environment — **the secret key, not the anon key**:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
SUPABASE_SECRET_KEY=sb_secret_...
```

`SUPABASE_SECRET_KEY` has no `NEXT_PUBLIC_` prefix on purpose: it must never reach the
browser. It is only read inside `app/api/leaderboard/route.ts`, which runs on the server.

Puis renseigne les variables de `.env.example` — l'API change de backend toute seule.

## Architecture

```
game/v3/
  proto.engine.ts     boucle, physique, collisions, génération
  proto.constants.ts  chaque valeur de réglage, en un seul fichier
  meta.ts             poussière, boutique, loterie, score
  i18n.ts             tous les textes, en fr / en / de
  audio.ts            musique en couches + SFX + haptique, synthétisés
  art/palette.ts      les sept paliers d'altitude
  art/draw.ts         tout le rendu, en fonctions pures
  __tests__/          sondes headless — voir son README
components/v3/        coquille React : menus, loterie, boutique, planche perso
app/api/leaderboard/  API du classement (fichier ou Supabase)
```

Le moteur est en `requestAnimationFrame` avec une physique en delta-time, se met en pause
quand l'onglet perd le focus, et dessine dans un buffer dont la **hauteur logique suit le
ratio de l'écran** — sur un téléphone plus allongé on voit plus de ciel, jamais une image
étirée.

## Les sondes

`game/v3/__tests__` contient une douzaine de sondes headless qui pilotent le moteur sans
navigateur. Elles ne vérifient pas que le code tourne : elles vérifient que **le jeu
récompense le skill**. Elles ont attrapé, entre autres, un spam d'entrée qui battait le jeu
habile, un pendule sans lancer, une punition d'éclair annulée une ligne plus loin, une
vitesse qui composait à l'infini, une loterie qui distribuait dans l'ordre croissant, et un
danger qui augmentait mesurablement le score du joueur négligent.

Voir [`game/v3/__tests__/README.md`](game/v3/__tests__/README.md).

## Crédits

Conçu avec Fab, dont la fille — perpétuellement déguisée en licorne — est la raison pour
laquelle Prism est une gamine en pyjama-licorne plutôt qu'un cheval ailé.
