// Every player-facing string, in one place, in three languages.
//
// Two consumers with very different needs share this module:
//
//   - the React shell, which re-renders on a language change (useLocale below)
//   - the engine's canvas HUD, which redraws every frame and simply calls t()
//
// So the current locale lives in a tiny module-level store rather than in React
// state: the engine has no access to a context, and a HUD that only updated on the
// next React render would keep showing the old language for the rest of the run.
//
// FR is the reference. EN and DE are typed against its key set, so a forgotten
// translation is a compile error rather than a French word surfacing in German.

export type Locale = "fr" | "en" | "de";

export const LOCALES: Locale[] = ["fr", "en", "de"];

// What the selector shows. Short codes, not flags: a flag names a country, not a
// language, and this button has to fit next to the sound one.
export const LOCALE_LABEL: Record<Locale, string> = {
  fr: "FR",
  en: "EN",
  de: "DE",
};

// Full names, for the selector's options and its accessible label
export const LOCALE_NAME: Record<Locale, string> = {
  fr: "Français",
  en: "English",
  de: "Deutsch",
};

// BCP 47 tags, used for number formatting — the board prints "2 228" in French and
// "2,228" in English, and getting that from the same constant keeps them in step.
const TAG: Record<Locale, string> = {
  fr: "fr-FR",
  en: "en-GB",
  de: "de-DE",
};

const STORE_KEY = "rr3.lang";

// ---------------------------------------------------------------- the strings

const FR = {
  // ---- Title / shell
  "title.main": "RAINBOW RACER",
  "title.sub": "L'ASCENSION",
  "aside.title": "Rainbow Racer — L'Ascension",
  "aside.note":
    "Tout est dessiné en vectoriel, généré à l'image — Prism comprise. Sa crinière et la corde sont la même matière.",

  // ---- Legend (desktop sidebar)
  "legend.press": "Appuyer",
  "legend.press.d": "s'accrocher à l'ancre la plus proche",
  "legend.hold": "Maintenir",
  "legend.hold.d": "le treuil enroule, le pendule prend de la vitesse",
  "legend.release": "Lâcher",
  "legend.release.d": "catapulte le long de la tangente",
  "legend.marks": "Repères ⊥",
  "legend.marks.d": "là où ta vitesse pointe droit vers le haut",
  "legend.dive": "Plonger",
  "legend.dive.d": "arriver vite sur une ancre basse relance plus haut",
  "legend.dust": "Poussière",
  "legend.dust.d":
    "les points suivent la route, les guirlandes valent double mais sont hors ligne",
  "legend.garlands": "Guirlandes",
  // Split in three so the emphasis survives translation: the bold word is the whole
  // point of the line, and a single string would have forced it to a fixed position.
  "legend.garlands.a": "s'accrocher ",
  "legend.garlands.b": "de loin",
  "legend.garlands.c":
    " garde la corde longue et les balaie ; de près on monte mieux mais on les rate",
  "legend.paliers": "Paliers",
  "legend.paliers.d": "de plus en plus espacés ; les franchir repousse l'orage",
  "legend.bolts": "Éclairs",
  "legend.bolts.d": "le nuage clignote, puis sa ligne frappe",
  "legend.gusts": "Bourrasques",
  "legend.gusts.d":
    "elles ne blessent pas, elles poussent — recalcule ton point de lâcher",
  "legend.raiders": "Pilleurs",
  "legend.raiders.d": "les pies volent ta poussière et brisent ta chaîne",

  // ---- Menu
  "menu.pitch1": "Accroche-toi, balance-toi, lâche au bon moment.",
  "menu.pitch2": "Ramasse la poussière et grimpe avant l'orage.",
  "menu.namePlaceholder": "ton pseudo",
  "menu.play": "Jouer",
  "menu.armed": "équipé : {list}",
  // Two forms rather than a "{n} run{s}" suffix: German pluralises Lauf as Läufe, so a
  // glued-on "s" would have produced "2 Laufs" the day the game learned German.
  "menu.mode.one": "mode {name} — {n} run",
  "menu.mode.many": "mode {name} — {n} runs",
  "menu.shop": "Boutique",
  "menu.board": "Classement",
  "menu.best.one": "record perso : {m} m · {runs} run",
  "menu.best.many": "record perso : {m} m · {runs} runs",

  // ---- Lottery
  "lottery.pick": "Choisis une carte",
  "lottery.reveal": "Les trois cartes",
  "lottery.hint": "Ta poussière s'échange en boutique.",

  // ---- Summary
  "summary.title": "Ta montée",
  "summary.paliers": "paliers",
  "summary.chain": "chaîne max",
  "summary.hits": "éclairs pris",
  "summary.stolen": "volé par les pies",
  "summary.dust": "poussière",
  "summary.replay": "Rejouer",
  "summary.thisRun": "ce run : {list}",

  // ---- Weekly board
  "board.title": "Classement de la semaine",
  "board.claim": "Ton pseudo pour enregistrer ce score :",
  "board.claimPlaceholder": "pseudo",
  "board.save": "Enregistrer",
  "board.rank": "#{n} cette semaine",
  "board.seeAll": "voir tout le classement",
  "board.empty": "Personne cette semaine. La place est à prendre.",
  "board.weekly": "Remis à zéro chaque lundi : tout le monde a sa chance.",
  "board.back": "Retour",

  // ---- Shop
  "shop.title": "Boutique",
  "shop.dust": "{n} poussière",
  "shop.permanent": "Pour toujours",
  "shop.consumable": "Le prochain run",
  "shop.mode": "3 runs",
  "shop.owned": "acquis",
  "shop.active": "actif",
  "shop.reset": "réinitialiser la progression",
  "shop.resetConfirm": "Effacer la poussière et les achats ?",

  // ---- Catalogue. Names and blurbs live here, not in meta.ts: the shop is text, and
  // text belongs with the other text.
  "item.wings.name": "Ailes renforcées",
  "item.wings.blurb": "Une aile de plus, pour toujours. De quoi se rattraper.",
  "item.rope.name": "Corde longue",
  "item.rope.blurb": "Portée du grappin étendue : plus d'ancres, donc plus de routes.",
  "item.boost.name": "Départ lancé",
  "item.boost.blurb": "Tu commences à 30 m, l'orage déjà repoussé.",
  "item.talisman.name": "Talisman",
  "item.talisman.blurb": "Le premier éclair du run te traverse sans te toucher.",
  "item.magnet.name": "Aimant",
  "item.magnet.blurb": "La poussière vient à toi. Moins de détours.",
  "item.mode_storm.name": "Orage furieux",
  "item.mode_storm.blurb":
    "3 runs : l'orage monte une fois et demie plus vite, poussière doublée.",
  "item.mode_calm.name": "Ciel calme",
  "item.mode_calm.blurb": "3 runs : aucun éclair, mais moins d'ancres pour se rattraper.",
  "item.mode_pure.name": "Vol pur",
  "item.mode_pure.blurb":
    "3 runs : plus d'ailes du tout, poussière et distance comptées x1,5.",

  // ---- Sharing
  "share.label": "Partager",
  "share.copied": "Copié",
  "share.text": "🦄 {m} m dans Rainbow Racer{rank}. Tu me bats ? 🌈",
  "share.rank": " — #{n} cette semaine",

  // ---- Controls
  "ui.mute": "Couper le son",
  "ui.unmute": "Activer le son",
  "ui.language": "Langue",

  // ---- In-run HUD (drawn on the canvas)
  "hud.chain": "chaîne {n}  (max {max})",
  "hud.pureFlight": "VOL PUR — aucune aile",
  "hud.wingsUsed": "ailes utilisées {n}",
  "hud.winch": "TREUIL",
  "hud.stunned": "ÉTOURDI",
  "hud.stunnedSub": "chaîne perdue · treuil vidé",
  "hud.palierToast": "PALIER FRANCHI",
  "hud.palierToastSub": "l'orage recule",
  "hud.dust": "poussière {n}",
  "hud.dive": "PLONGEON",
  "hud.lift": "PORTÉ",
  "hud.attached": "ACCROCHÉ — lâche pour partir",
  "hud.detached": "appuie pour t'accrocher",
  "hud.palier": "PALIER {n} m",
  "hud.storm": "ORAGE  {n} m",
} as const;

export type StringKey = keyof typeof FR;

const EN: Record<StringKey, string> = {
  "title.main": "RAINBOW RACER",
  "title.sub": "THE ASCENT",
  "aside.title": "Rainbow Racer — The Ascent",
  "aside.note":
    "Everything is vector-drawn, generated frame by frame — Prism included. Her mane and the rope are the same material.",

  "legend.press": "Press",
  "legend.press.d": "grapple the nearest anchor",
  "legend.hold": "Hold",
  "legend.hold.d": "the winch reels in, the pendulum picks up speed",
  "legend.release": "Release",
  "legend.release.d": "catapults you along the tangent",
  "legend.marks": "⊥ marks",
  "legend.marks.d": "where your speed points straight up",
  "legend.dive": "Dive",
  "legend.dive.d": "hitting a low anchor fast launches you higher",
  "legend.dust": "Dust",
  "legend.dust.d":
    "dots follow the route, garlands are worth double but sit off the line",
  "legend.garlands": "Garlands",
  "legend.garlands.a": "grappling ",
  "legend.garlands.b": "from far",
  "legend.garlands.c":
    " keeps the rope long and sweeps them up; from close you climb better but miss them",
  "legend.paliers": "Checkpoints",
  "legend.paliers.d": "further and further apart; crossing one pushes the storm back",
  "legend.bolts": "Bolts",
  "legend.bolts.d": "the cloud flashes, then its lane strikes",
  "legend.gusts": "Currents",
  "legend.gusts.d": "they don't hurt, they push — recompute your release point",
  "legend.raiders": "Raiders",
  "legend.raiders.d": "magpies steal your dust and break your chain",

  "menu.pitch1": "Grapple, swing, release at the right moment.",
  "menu.pitch2": "Collect the dust and climb ahead of the storm.",
  "menu.namePlaceholder": "your name",
  "menu.play": "Play",
  "menu.armed": "carrying: {list}",
  "menu.mode.one": "{name} mode — {n} run",
  "menu.mode.many": "{name} mode — {n} runs",
  "menu.shop": "Shop",
  "menu.board": "Leaderboard",
  "menu.best.one": "personal best: {m} m · {runs} run",
  "menu.best.many": "personal best: {m} m · {runs} runs",

  "lottery.pick": "Pick a card",
  "lottery.reveal": "All three cards",
  "lottery.hint": "Your dust is spent in the shop.",

  "summary.title": "Your climb",
  "summary.paliers": "checkpoints",
  "summary.chain": "best chain",
  "summary.hits": "bolts taken",
  "summary.stolen": "stolen by magpies",
  "summary.dust": "dust",
  "summary.replay": "Play again",
  "summary.thisRun": "this run: {list}",

  "board.title": "This week's leaderboard",
  "board.claim": "Your name, to save this score:",
  "board.claimPlaceholder": "name",
  "board.save": "Save",
  "board.rank": "#{n} this week",
  "board.seeAll": "see the whole leaderboard",
  "board.empty": "Nobody yet this week. The spot is up for grabs.",
  "board.weekly": "Reset every Monday: everyone gets a shot.",
  "board.back": "Back",

  "shop.title": "Shop",
  "shop.dust": "{n} dust",
  "shop.permanent": "Forever",
  "shop.consumable": "Next run",
  "shop.mode": "3 runs",
  "shop.owned": "owned",
  "shop.active": "active",
  "shop.reset": "reset progress",
  "shop.resetConfirm": "Erase your dust and everything you bought?",

  "item.wings.name": "Reinforced wings",
  "item.wings.blurb": "One extra flap, forever. Room to catch yourself.",
  "item.rope.name": "Long rope",
  "item.rope.blurb": "Extended grapple range: more anchors, so more routes.",
  "item.boost.name": "Flying start",
  "item.boost.blurb": "You start at 30 m, with the storm already pushed back.",
  "item.talisman.name": "Talisman",
  "item.talisman.blurb": "The run's first bolt passes straight through you.",
  "item.magnet.name": "Magnet",
  "item.magnet.blurb": "The dust comes to you. Fewer detours.",
  "item.mode_storm.name": "Raging storm",
  "item.mode_storm.blurb":
    "3 runs: the storm rises half again as fast, dust doubled.",
  "item.mode_calm.name": "Calm sky",
  "item.mode_calm.blurb": "3 runs: no bolts at all, but fewer anchors to catch.",
  "item.mode_pure.name": "Pure flight",
  "item.mode_pure.blurb":
    "3 runs: no wings at all, dust and distance counted x1.5.",

  "share.label": "Share",
  "share.copied": "Copied",
  "share.text": "🦄 {m} m in Rainbow Racer{rank}. Think you can beat me? 🌈",
  "share.rank": " — #{n} this week",

  "ui.mute": "Mute",
  "ui.unmute": "Unmute",
  "ui.language": "Language",

  "hud.chain": "chain {n}  (max {max})",
  "hud.pureFlight": "PURE FLIGHT — no wings",
  "hud.wingsUsed": "wings used {n}",
  "hud.winch": "WINCH",
  "hud.stunned": "STUNNED",
  "hud.stunnedSub": "chain lost · winch drained",
  "hud.palierToast": "CHECKPOINT CLEARED",
  "hud.palierToastSub": "the storm falls back",
  "hud.dust": "dust {n}",
  "hud.dive": "DIVE",
  "hud.lift": "LIFT",
  "hud.attached": "ATTACHED — release to launch",
  "hud.detached": "press to grapple",
  "hud.palier": "CHECKPOINT {n} m",
  "hud.storm": "STORM  {n} m",
};

const DE: Record<StringKey, string> = {
  "title.main": "RAINBOW RACER",
  "title.sub": "DER AUFSTIEG",
  "aside.title": "Rainbow Racer — Der Aufstieg",
  "aside.note":
    "Alles ist vektoriell gezeichnet, Bild für Bild erzeugt — Prism eingeschlossen. Ihre Mähne und das Seil sind aus demselben Stoff.",

  "legend.press": "Drücken",
  "legend.press.d": "am nächsten Anker einhaken",
  "legend.hold": "Halten",
  "legend.hold.d": "die Winde zieht ein, das Pendel nimmt Fahrt auf",
  "legend.release": "Loslassen",
  "legend.release.d": "katapultiert dich entlang der Tangente",
  "legend.marks": "⊥-Marken",
  "legend.marks.d": "dort zeigt deine Geschwindigkeit senkrecht nach oben",
  "legend.dive": "Tauchen",
  "legend.dive.d": "schnell an einen tiefen Anker heran wirft dich höher",
  "legend.dust": "Sternenstaub",
  "legend.dust.d":
    "Punkte liegen auf der Route, Girlanden zählen doppelt, liegen aber abseits",
  "legend.garlands": "Girlanden",
  "legend.garlands.a": "hakst du ",
  "legend.garlands.b": "von weit weg",
  "legend.garlands.c":
    " ein, bleibt das Seil lang und sammelt sie ein; von nah steigst du besser, verpasst sie aber",
  "legend.paliers": "Etappen",
  "legend.paliers.d": "immer weiter auseinander; wer eine nimmt, drängt den Sturm zurück",
  "legend.bolts": "Blitze",
  "legend.bolts.d": "die Wolke blinkt, dann schlägt ihre Bahn ein",
  "legend.gusts": "Böen",
  "legend.gusts.d":
    "sie verletzen nicht, sie schieben — berechne deinen Loslasspunkt neu",
  "legend.raiders": "Räuber",
  "legend.raiders.d": "Elstern stehlen deinen Staub und brechen deine Kette",

  "menu.pitch1": "Einhaken, schwingen, im richtigen Moment loslassen.",
  "menu.pitch2": "Sammle den Staub und steige vor dem Sturm auf.",
  "menu.namePlaceholder": "dein Name",
  "menu.play": "Spielen",
  "menu.armed": "dabei: {list}",
  "menu.mode.one": "Modus {name} — {n} Lauf",
  "menu.mode.many": "Modus {name} — {n} Läufe",
  "menu.shop": "Laden",
  "menu.board": "Rangliste",
  "menu.best.one": "persönlicher Rekord: {m} m · {runs} Lauf",
  "menu.best.many": "persönlicher Rekord: {m} m · {runs} Läufe",

  "lottery.pick": "Wähle eine Karte",
  "lottery.reveal": "Die drei Karten",
  "lottery.hint": "Deinen Staub gibst du im Laden aus.",

  "summary.title": "Dein Aufstieg",
  "summary.paliers": "Etappen",
  "summary.chain": "beste Kette",
  "summary.hits": "Blitze kassiert",
  "summary.stolen": "von Elstern gestohlen",
  "summary.dust": "Staub",
  "summary.replay": "Nochmal",
  "summary.thisRun": "dieser Lauf: {list}",

  "board.title": "Rangliste der Woche",
  "board.claim": "Dein Name, um diesen Punktestand zu speichern:",
  "board.claimPlaceholder": "Name",
  "board.save": "Speichern",
  "board.rank": "#{n} diese Woche",
  "board.seeAll": "ganze Rangliste ansehen",
  "board.empty": "Diese Woche noch niemand. Der Platz ist frei.",
  "board.weekly": "Jeden Montag zurückgesetzt: alle bekommen ihre Chance.",
  "board.back": "Zurück",

  "shop.title": "Laden",
  "shop.dust": "{n} Staub",
  "shop.permanent": "Für immer",
  "shop.consumable": "Nächster Lauf",
  "shop.mode": "3 Läufe",
  "shop.owned": "gekauft",
  "shop.active": "aktiv",
  "shop.reset": "Fortschritt zurücksetzen",
  "shop.resetConfirm": "Staub und alle Käufe löschen?",

  "item.wings.name": "Verstärkte Flügel",
  "item.wings.blurb": "Ein Flügelschlag mehr, für immer. Genug, um sich zu fangen.",
  "item.rope.name": "Langes Seil",
  "item.rope.blurb": "Größere Greifreichweite: mehr Anker, also mehr Wege.",
  "item.boost.name": "Fliegender Start",
  "item.boost.blurb": "Du startest bei 30 m, der Sturm ist schon zurückgedrängt.",
  "item.talisman.name": "Talisman",
  "item.talisman.blurb": "Der erste Blitz des Laufs geht durch dich hindurch.",
  "item.magnet.name": "Magnet",
  "item.magnet.blurb": "Der Staub kommt zu dir. Weniger Umwege.",
  "item.mode_storm.name": "Wütender Sturm",
  "item.mode_storm.blurb":
    "3 Läufe: Der Sturm steigt anderthalbmal so schnell, Staub verdoppelt.",
  "item.mode_calm.name": "Ruhiger Himmel",
  "item.mode_calm.blurb": "3 Läufe: keine Blitze, aber weniger Anker zum Fangen.",
  "item.mode_pure.name": "Reiner Flug",
  "item.mode_pure.blurb":
    "3 Läufe: gar keine Flügel, Staub und Distanz zählen x1,5.",

  "share.label": "Teilen",
  "share.copied": "Kopiert",
  "share.text": "🦄 {m} m in Rainbow Racer{rank}. Schlägst du mich? 🌈",
  "share.rank": " — #{n} diese Woche",

  "ui.mute": "Ton aus",
  "ui.unmute": "Ton an",
  "ui.language": "Sprache",

  "hud.chain": "Kette {n}  (max {max})",
  "hud.pureFlight": "REINER FLUG — keine Flügel",
  "hud.wingsUsed": "Flügel benutzt {n}",
  "hud.winch": "WINDE",
  "hud.stunned": "BETÄUBT",
  "hud.stunnedSub": "Kette weg · Winde leer",
  "hud.palierToast": "ETAPPE GESCHAFFT",
  "hud.palierToastSub": "der Sturm weicht zurück",
  "hud.dust": "Staub {n}",
  "hud.dive": "TAUCHER",
  "hud.lift": "GETRAGEN",
  "hud.attached": "EINGEHAKT — loslassen zum Start",
  "hud.detached": "drücken zum Einhaken",
  "hud.palier": "ETAPPE {n} m",
  "hud.storm": "STURM  {n} m",
};

const DICT: Record<Locale, Record<StringKey, string>> = { fr: FR, en: EN, de: DE };

// ---------------------------------------------------------------- the store

// FR on both sides of hydration. The saved language is applied in an effect once the
// client is mounted (see useLocale), because reading localStorage during the first
// render would make the server's HTML and the client's disagree.
let current: Locale = "fr";
const listeners = new Set<() => void>();

export function getLocale(): Locale {
  return current;
}

export function isLocale(v: unknown): v is Locale {
  return v === "fr" || v === "en" || v === "de";
}

export function setLocale(next: Locale): void {
  if (next === current) return;
  current = next;
  try {
    localStorage.setItem(STORE_KEY, next);
  } catch {
    // Private mode or a full quota — the language still applies for this session
  }
  if (typeof document !== "undefined") document.documentElement.lang = next;
  listeners.forEach((fn) => fn());
}

export function subscribeLocale(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// What the player picked last time, or failing that what their browser is set to —
// so a German phone opens in German rather than in French with a menu to hunt for.
export function preferredLocale(): Locale {
  if (typeof window === "undefined") return "fr";
  try {
    const saved = localStorage.getItem(STORE_KEY);
    if (isLocale(saved)) return saved;
  } catch {
    // fall through to the browser's own preference
  }
  const nav = typeof navigator !== "undefined" ? navigator.languages ?? [] : [];
  for (const tag of nav) {
    const base = tag.slice(0, 2).toLowerCase();
    if (isLocale(base)) return base;
  }
  return "fr";
}

// ---------------------------------------------------------------- lookup

/**
 * Translate `key` in the current language, substituting `{placeholders}`.
 * A missing key falls back to French rather than to an empty box.
 */
export function t(key: StringKey, params?: Record<string, string | number>): string {
  const raw = DICT[current][key] ?? FR[key] ?? key;
  if (!params) return raw;
  return raw.replace(/\{(\w+)\}/g, (whole, name: string) =>
    name in params ? String(params[name]) : whole
  );
}

/** The BCP 47 tag for the current language — number formatting reads it. */
export function localeTag(): string {
  return TAG[current];
}

/** Formats a number the way the current language writes it (2 228 / 2,228). */
export function formatNumber(n: number): string {
  return n.toLocaleString(TAG[current]);
}
