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

import { StringKey, t } from "./i18n";

const STORE_KEY = "rr3.meta";

export type UpgradeKind = "permanent" | "consumable" | "mode";

export interface Upgrade {
  id: string;
  price: number;
  kind: UpgradeKind;
}

// Permanents are deliberately about *friction*, not power: they widen your options and
// raise the floor for a beginner without making a good player untouchable.
//
// Only the economy lives here. The name and the blurb are text, so they live with the
// rest of the text in i18n.ts and are read through itemName/itemBlurb below.
export const CATALOGUE: Upgrade[] = [
  { id: "wings", price: 450, kind: "permanent" },
  { id: "rope", price: 600, kind: "permanent" },
  { id: "boost", price: 30, kind: "consumable" },
  { id: "talisman", price: 45, kind: "consumable" },
  { id: "magnet", price: 40, kind: "consumable" },
  { id: "mode_storm", price: 70, kind: "mode" },
  { id: "mode_calm", price: 70, kind: "mode" },
  { id: "mode_pure", price: 70, kind: "mode" },
];

export const byId = (id: string): Upgrade | undefined =>
  CATALOGUE.find((u) => u.id === id);

/** The shop name of an upgrade, in the language currently selected. */
export const itemName = (id: string): string => t(`item.${id}.name` as StringKey);

/** Its one-line description, same deal. */
export const itemBlurb = (id: string): string => t(`item.${id}.blurb` as StringKey);

export interface MetaState {
  dust: number;
  permanents: string[]; // owned forever
  consumables: string[]; // armed for the NEXT run, then spent
  mode: string | null;
  modeRunsLeft: number;
  runs: number;
  bestM: number;
  lotteriesPlayed: number;
  name: string; // for the weekly board
  giftsTaken: number; // gifts actually collected
  sinceGiftOffered: number; // lotteries since one last held a gift
  // Whether a gift was ever surfaced to the player. Before the in-run boon banner existed,
  // a won gift was announced on a card for one second and then silently spent on the next
  // run — Fab's save counted one taken and he had no idea. Saves from that era get their
  // guaranteed first gift back, once.
  sawGift: boolean;
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
  name: "",
  giftsTaken: 0,
  sinceGiftOffered: 99, // a brand-new player is due one immediately
  sawGift: false, // set the first time a gift is actually SHOWN as armed
};

export function loadMeta(): MetaState {
  if (typeof window === "undefined") return { ...EMPTY };
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return { ...EMPTY };
    const parsed = JSON.parse(raw) as Partial<MetaState>;
    const state: MetaState = {
      ...EMPTY,
      ...parsed,
      permanents: Array.isArray(parsed.permanents) ? parsed.permanents : [],
      consumables: Array.isArray(parsed.consumables) ? parsed.consumables : [],
    };
    // One-time migration: a gift counted before the banner shipped was never seen, so it
    // does not count as the first one. Nobody loses anything; the guaranteed gift returns.
    if (parsed.sawGift === undefined && state.giftsTaken > 0) {
      state.giftsTaken = 0;
      state.sinceGiftOffered = 99;
    }
    return state;
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

// Gift cadence, following the casino shape Fab described: first you learn the prize
// exists, then you wait for it.
//
//   runs 1-3 — a gift is guaranteed to appear by the third lottery, but can land sooner.
//              Putting it strictly on run 1 was worse: you have not understood the loop
//              yet, so the prize means nothing to you.
//   after    — roughly one in seven, with a hard pity at ten so a dry streak cannot drag.
//
// The counter tracks gifts OFFERED, not taken. Seeing one on the table and picking the
// wrong card is the gamble, and that near-miss is doing real work — but NOT for the very
// first one. Fab played eight runs and never received a gift: a card carried one on seven
// of those tables, and he lost the 1-in-3 pick every time (an 8.8% streak, so just bad
// luck, not a bug). From the outside that is indistinguishable from "gifts do not exist",
// which loses exactly the player the first gift is meant to hook. So the first one is
// dealt on all three cards — guaranteed received, and the choice becomes WHICH gift.
export function giftChance(state: MetaState): number {
  // Coalesced: a save written before these fields existed must still get its first gift
  const taken = state.giftsTaken ?? 0;
  const played = state.lotteriesPlayed ?? 0;
  const since = state.sinceGiftOffered ?? 99;
  if (taken === 0) {
    if (played >= 2) return 1; // by the third, certain
    return played === 0 ? 0.4 : 0.6;
  }
  if (since >= 9) return 1; // pity
  return 1 / 7;
}

export function rollLottery(runDust: number, state: MetaState): LotteryCard[] {
  const floor = [6, 14, 25];
  const hasGift = Math.random() < giftChance(state);
  const firstEver = (state.giftsTaken ?? 0) === 0;
  // The first gift goes on every card; later ones on a single card you have to find
  const giftIndex = hasGift && !firstEver ? Math.floor(Math.random() * 3) : -1;
  // Three different gifts, shuffled, so the guaranteed one is still a decision
  const pool = [...GIFTABLE].sort(() => Math.random() - 0.5);

  const cards = [0, 1, 2].map((i) => {
    const share = Math.round(runDust * (0.15 + i * 0.2));
    const dust = floor[i] + share;
    const gift =
      hasGift && firstEver
        ? pool[i % pool.length]
        : i === giftIndex
          ? GIFTABLE[Math.floor(Math.random() * GIFTABLE.length)]
          : null;
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

// `offeredGift` is whether ANY of the three cards held one, which is what drives the
// cadence — distinct from whether the player actually picked it up.
export function applyCard(
  state: MetaState,
  card: LotteryCard,
  offeredGift: boolean
): MetaState {
  const next: MetaState = {
    ...state,
    dust: state.dust + card.dust,
    lotteriesPlayed: state.lotteriesPlayed + 1,
    sinceGiftOffered: offeredGift ? 0 : state.sinceGiftOffered + 1,
  };
  if (card.gift) {
    next.giftsTaken = state.giftsTaken + 1;
    if (!next.consumables.includes(card.gift)) {
      next.consumables = [...next.consumables, card.gift];
    }
  }
  return next;
}

// Wipes progress. Exists because a browser can inherit somebody else's local state —
// mine leaked 700 dust into Fab's game while I was checking the shop's price tiers.
export function resetMeta(): MetaState {
  const fresh = { ...EMPTY };
  saveMeta(fresh);
  return fresh;
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
    // The run is about to name its boons over the canvas, so they count as seen
    sawGift: state.sawGift || state.consumables.length > 0,
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

// ---------------------------------------------------------------- scoring
// One number for the weekly board. Distance leads because it is what the run is ABOUT, with
// dust and the best chain folded in so a player who only climbs and a player who also
// collects and chains are not scored identically.
export function runScore(stats: {
  altitudeM: number;
  dust: number;
  bestChain: number;
  checkpoints: number;
}): number {
  return Math.round(
    stats.altitudeM * 10 + stats.dust * 4 + stats.bestChain * 12 + stats.checkpoints * 40
  );
}
