// The meta layer: dust you keep, things you buy with it, and the end-of-run lottery.
//
// Design notes worth keeping in view while tuning:
//
//  - Dust is NEVER lost on death. Every run advances something, which is what makes a
//    failed run acceptable. Runs here are 20s to 3min, so that matters a lot.
//  - Purchases come in three natures because they do three different jobs: permanents
//    remove friction, consumables are the recurring decision, and modes change how the
//    game feels rather than how strong you are.
//  - Calibrated against real play, not bots: a beginner run is ~80m, a relaxed run ~147m
//    in 40s, a serious one ~650m in 2-3min. Bots top out around 75m and badly
//    under-represent a real player, so they are not used for pricing.

const STORE_KEY = "rr3.meta";

export type UpgradeKind = "permanent" | "consumable" | "mode";

export interface Upgrade {
  id: string;
  name: string;
  blurb: string;
  price: number;
  kind: UpgradeKind;
}

// Permanents are deliberately about *friction*, not power: they widen your options and
// raise the floor for a beginner without making a good player untouchable.
export const CATALOGUE: Upgrade[] = [
  {
    id: "wings",
    name: "Ailes renforcées",
    blurb: "Une aile de plus, pour toujours. De quoi se rattraper.",
    price: 450,
    kind: "permanent",
  },
  {
    id: "rope",
    name: "Corde longue",
    blurb: "Portée du grappin étendue : plus d'ancres, donc plus de routes.",
    price: 600,
    kind: "permanent",
  },
  {
    id: "boost",
    name: "Départ lancé",
    blurb: "Tu commences à 30 m, l'orage déjà repoussé.",
    price: 30,
    kind: "consumable",
  },
  {
    id: "talisman",
    name: "Talisman",
    blurb: "Le premier éclair du run te traverse sans te toucher.",
    price: 45,
    kind: "consumable",
  },
  {
    id: "magnet",
    name: "Aimant",
    blurb: "La poussière vient à toi. Moins de détours.",
    price: 40,
    kind: "consumable",
  },
  {
    id: "mode_storm",
    name: "Orage furieux",
    blurb: "3 runs : l'orage monte une fois et demie plus vite, poussière doublée.",
    price: 70,
    kind: "mode",
  },
  {
    id: "mode_calm",
    name: "Ciel calme",
    blurb: "3 runs : aucun éclair, mais moins d'ancres pour se rattraper.",
    price: 70,
    kind: "mode",
  },
  {
    id: "mode_pure",
    name: "Vol pur",
    blurb: "3 runs : plus d'ailes du tout, poussière et distance comptées x1,5.",
    price: 70,
    kind: "mode",
  },
];

export const byId = (id: string): Upgrade | undefined =>
  CATALOGUE.find((u) => u.id === id);

export interface MetaState {
  dust: number;
  permanents: string[]; // owned forever
  consumables: string[]; // armed for the NEXT run, then spent
  mode: string | null;
  modeRunsLeft: number;
  runs: number;
  bestM: number;
  lotteriesPlayed: number;
}

const EMPTY: MetaState = {
  dust: 0,
  permanents: [],
  consumables: [],
  mode: null,
  modeRunsLeft: 0,
  runs: 0,
  bestM: 0,
  lotteriesPlayed: 0,
};

export function loadMeta(): MetaState {
  if (typeof window === "undefined") return { ...EMPTY };
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return { ...EMPTY };
    const parsed = JSON.parse(raw) as Partial<MetaState>;
    return {
      ...EMPTY,
      ...parsed,
      permanents: Array.isArray(parsed.permanents) ? parsed.permanents : [],
      consumables: Array.isArray(parsed.consumables) ? parsed.consumables : [],
    };
  } catch {
    return { ...EMPTY };
  }
}

export function saveMeta(state: MetaState): void {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
  } catch {
    // Storage full or blocked — the meta is a bonus, never break the game over it
  }
}

// What the engine needs to know for one run.
export interface RunConfig {
  extraWings: number;
  extraTetherRange: number;
  startBoost: boolean;
  talisman: boolean;
  magnet: boolean;
  stormFactor: number;
  dustFactor: number;
  noBolts: boolean;
  noWings: boolean;
  anchorScarcity: number; // 1 = normal, <1 = fewer branch anchors
}

export function configFor(state: MetaState): RunConfig {
  const has = (id: string) =>
    state.permanents.includes(id) || state.consumables.includes(id);
  const mode = state.modeRunsLeft > 0 ? state.mode : null;

  return {
    extraWings: state.permanents.includes("wings") ? 1 : 0,
    extraTetherRange: state.permanents.includes("rope") ? 70 : 0,
    startBoost: has("boost"),
    talisman: has("talisman"),
    magnet: has("magnet"),
    stormFactor: mode === "mode_storm" ? 1.5 : 1,
    dustFactor:
      (mode === "mode_storm" ? 2 : 1) * (mode === "mode_pure" ? 1.5 : 1),
    noBolts: mode === "mode_calm",
    noWings: mode === "mode_pure",
    anchorScarcity: mode === "mode_calm" ? 0.5 : 1,
  };
}

// ---------------------------------------------------------------- the lottery
// Every run ends on a reward rather than a plain failure screen, and it is the last
// thing you see before Rejouer. Payouts are a flat floor PLUS a share of what you
// actually earned, so a bad run still gets something while a good run is amplified —
// a flat lottery would have quietly undercut skill.

export interface LotteryCard {
  label: string;
  dust: number;
  gift: string | null; // an upgrade id, armed free for the next run
}

const GIFTABLE = ["boost", "talisman", "magnet"];

export function rollLottery(runDust: number, state: MetaState): LotteryCard[] {
  const floor = [6, 14, 25];
  // A player's very first lottery always contains a gift: it teaches what gifts are and
  // lets them try a consumable without paying for it.
  const guaranteeGift = state.lotteriesPlayed === 0;
  const giftIndex = guaranteeGift || Math.random() < 0.25
    ? Math.floor(Math.random() * 3)
    : -1;

  const cards = [0, 1, 2].map((i) => {
    const share = Math.round(runDust * (0.15 + i * 0.2));
    const dust = floor[i] + share;
    const gift =
      i === giftIndex ? GIFTABLE[Math.floor(Math.random() * GIFTABLE.length)] : null;
    return { label: gift ? "cadeau" : `${dust}`, dust, gift };
  });

  // Shuffle, or the payouts always come out ascending and the "choice" is just
  // "always take the third card" — a fake decision dressed up as a gamble.
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards;
}

export function applyCard(state: MetaState, card: LotteryCard): MetaState {
  const next: MetaState = {
    ...state,
    dust: state.dust + card.dust,
    lotteriesPlayed: state.lotteriesPlayed + 1,
  };
  if (card.gift && !next.consumables.includes(card.gift)) {
    next.consumables = [...next.consumables, card.gift];
  }
  return next;
}

// ---------------------------------------------------------------- transactions
export function buy(state: MetaState, id: string): MetaState {
  const up = byId(id);
  if (!up || state.dust < up.price) return state;
  if (up.kind === "permanent" && state.permanents.includes(id)) return state;
  if (up.kind === "consumable" && state.consumables.includes(id)) return state;

  const next: MetaState = { ...state, dust: state.dust - up.price };
  if (up.kind === "permanent") next.permanents = [...state.permanents, id];
  else if (up.kind === "consumable") next.consumables = [...state.consumables, id];
  else {
    next.mode = id;
    next.modeRunsLeft = 3;
  }
  return next;
}

// Called when a run starts: consumables are spent, a mode burns one of its three runs.
export function startRun(state: MetaState): MetaState {
  return {
    ...state,
    consumables: [],
    modeRunsLeft: Math.max(0, state.modeRunsLeft - 1),
    mode: state.modeRunsLeft - 1 > 0 ? state.mode : null,
    runs: state.runs + 1,
  };
}

export function recordRun(state: MetaState, dust: number, distanceM: number): MetaState {
  return {
    ...state,
    dust: state.dust + dust,
    bestM: Math.max(state.bestM, distanceM),
  };
}
