# Reprise — à coller dans une nouvelle conversation

> Copie tout ce qui est entre les lignes ci-dessous.

---

Salut Claude. On reprend **Rainbow Racer — L'Ascension**, un jeu déjà bien avancé dans
`/Users/fabiendubin/FabLab/Rainbow Racer/rainbow-racer-v2`, branche `v3-ascent`.

Parle-moi en français, tutoie-moi, je m'appelle Fab.

**Commence par lire, dans cet ordre :** `README.md`, `game/v3/__tests__/README.md`,
`game/v3/proto.constants.ts`. Puis lance `npm run dev` et fais une partie sur `/`.
Ne code rien avant d'avoir lu ces trois fichiers — ils contiennent le *pourquoi* de
décisions qui ont chacune coûté plusieurs itérations.

## Ce qu'est le jeu

Une ascension verticale au pouce, en portrait, pensée mobile. Tu appuies pour accrocher
ton arc-en-ciel à un prisme, tu tiens pour enrouler le treuil et lancer le pendule, tu
lâches pour être catapulté — et *le moment* du lâcher décide de tout. Un orage monte
depuis le bas et ne s'arrête jamais : rien ne tue à part perdre de l'altitude.

Le personnage, Prism, est une gamine déguisée en licorne (ma fille l'est en permanence).
Tout est dessiné en vectoriel dans le canvas, aucun bitmap.

## La méthode de travail — c'est le plus important

**On mesure, on ne devine pas.** Il y a une douzaine de sondes headless dans
`game/v3/__tests__` qui pilotent le moteur sans navigateur. Elles ne vérifient pas que le
code tourne : elles vérifient que **le jeu récompense le skill**. Elles ont attrapé, entre
autres :

- un spam d'entrée qui battait le jeu habile
- un pendule dont la vitesse de sortie était de 10 px/s, donc sans aucun lancer à minuter
- une punition d'éclair annulée une ligne plus loin (être touché *récompensait*)
- une vitesse qui composait à l'infini
- une loterie qui distribuait ses cartes dans l'ordre croissant
- un danger qui augmentait mesurablement le score du joueur négligent

**Lance `ablate.js` après toute modification d'un danger.** Il coupe chaque danger
isolément et compare le gradient de skill. C'est le seul moyen de distinguer une mécanique
d'un simple bruit — et une perturbation aléatoire profite *toujours* au moins bon joueur.

**24 graines minimum.** À 10 graines ces chiffres bougent de 0,8, et une conclusion a déjà
été publiée à tort à partir de ce bruit.

**Calibre le contenu sur mes vraies parties, pas sur les bots.** Mes bots plafonnent à
~120 m ; moi je fais 147 m détendu et ~650 m en 2-3 min. Deux fois, du contenu a été placé
hors de ma portée parce qu'il était calibré sur eux.

## Décisions à ne pas défaire sans mesurer

- **Le treuil et la poussée sont payés par la qualité du lâcher précédent.** C'est le cœur :
  le skill se compose, la maladresse s'effondre.
- **La poussée tangentielle doit dépasser la gravité**, sinon le pendule cale avant le
  sommet et il n'y a plus de lancer.
- **Un temps de vol libre obligatoire après chaque lâcher.** Sans ça, rester accroché 100 %
  du temps était la stratégie gagnante.
- **La corde n'emprunte jamais le raccourci par le bord de l'écran.** Le passage par les
  bords est une propriété du vol libre uniquement.
- **On ne me retire pas mes ailes.** Le battement est le filet de sauvetage ; l'essai a fait
  chuter les runs experts de 161 à 75 m.
- **Les courants sont des colonnes**, jamais des bandes pleine largeur — une bande n'offre
  aucun choix, donc son bonus devient inconditionnel.
- **La gravité n'est coupée que hors accroche.** La couper accroché supprime le pendule.
- **Les couches musicales suivent les paliers, pas la chaîne** (une chaîne se casse, une
  altitude non).

## Ce qui reste à faire

1. **L'hébergement, c'est la prochaine tâche.** Déployer sur Vercel, et surtout créer un
   projet Supabase gratuit pour que le classement hebdomadaire soit vraiment partagé — le
   SQL est dans le README, les variables dans `.env.example`. Sans ça les scores vont dans
   `.data/leaderboard.json`, ce qui s'efface sur du serverless.
2. **Le Titan d'Orage** : le boss tous les ~1200 m, à motifs télégraphiés. Jamais construit.
3. **Le défi du jour** à graine partagée, pour comparer honnêtement entre amis.
4. Des sons et de l'habillage à affiner — je juge à l'oreille et à l'œil, demande-moi.

## Comment je fonctionne

Je te laisse gérer et je teste au feeling. Mes retours sont des sensations
(« c'est dégueulasse », « ça fait rectiligne », « je vois que des poussières ») — à toi de
traduire ça en cause technique, et de me dire quand mon diagnostic est à côté tout en
gardant l'intention. Plusieurs de mes remarques ont révélé de vrais bugs que les tests ne
voyaient pas, et plusieurs de mes idées étaient meilleures que ton plan.

Dis-moi franchement quand quelque chose ne marche pas, quand tu t'es trompé, et ce que tu
n'as pas fait. Ne me vends rien.

---

## Notes techniques rapides

- `npm run dev` → `/` le jeu · `/proto/prism` la planche de personnage · `/v2` l'ancienne
  version horizontale gardée comme comparaison
- Tout le réglage du gameplay est dans `game/v3/proto.constants.ts`, avec la raison de
  chaque valeur écrite à côté
- Le rendu est isolé dans `game/v3/art/` en fonctions pures : l'habillage se refait sans
  toucher à la physique
- Next 16 : lis `node_modules/next/dist/docs/` avant d'utiliser une API, il y a des
  changements de rupture
- `turbopack.root` est épinglé dans `next.config.ts` — ne le retire pas, un lockfile
  orphelin dans un dossier parent cassait le dev server
