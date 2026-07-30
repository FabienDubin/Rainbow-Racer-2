// The meta state machine: buying, arming, spending, and mode countdowns. Pure logic, so
// it is worth asserting rather than clicking through 20 runs by hand.
const M = require("./meta");

let s = { dust: 0, permanents: [], consumables: [], mode: null, modeRunsLeft: 0, runs: 0, bestM: 0,
          lotteriesPlayed: 0, name: '', giftsTaken: 0, sinceGiftOffered: 99 };
const show = (label) =>
  console.log(
    `${label.padEnd(34)} ✦${String(s.dust).padStart(4)}  perm[${s.permanents.join(",")}]` +
    `  conso[${s.consumables.join(",")}]  mode=${s.mode ?? "-"}(${s.modeRunsLeft})`
  );

s = M.recordRun(s, 120, 147); show("run terminé, +120");
s = M.buy(s, "talisman");     show("achat Talisman (45)");
s = M.buy(s, "talisman");     show("re-achat (doit être refusé)");
s = M.buy(s, "wings");        show("achat Ailes 450 (pas assez)");

let cfg = M.configFor(s);
console.log(`\nconfig du prochain run : talisman=${cfg.talisman} ailes+=${cfg.extraWings} orage=${cfg.stormFactor}`);

s = M.startRun(s);            show("\nle run démarre");
cfg = M.configFor(s);
console.log(`config après démarrage : talisman=${cfg.talisman}  (le consommable est dépensé)`);

s = M.recordRun(s, 400, 300);
s = M.buy(s, "mode_storm");   show("\nachat Orage furieux");
for (let i = 1; i <= 4; i++) {
  const c = M.configFor(s);
  console.log(`  avant run ${i}: orage x${c.stormFactor}  poussière x${c.dustFactor}  (restant ${s.modeRunsLeft})`);
  s = M.startRun(s);
}
show("après 4 runs");

// Lottery: floor plus a share, and the first one always gifts
const fresh = { ...s, lotteriesPlayed: 0 };
const first = M.rollLottery(100, { ...fresh, giftsTaken: 0, sinceGiftOffered: 99 });
const later = M.rollLottery(100, { ...s, lotteriesPlayed: 9, giftsTaken: 1, sinceGiftOffered: 1 });
console.log(`\nloterie 1re fois : ${first.map(c => c.dust + (c.gift ? " +" + c.gift : "")).join(" | ")}`);
console.log(`cadeau garanti au 1er run : ${first.some(c => c.gift) ? "oui" : "NON — à corriger"}`);
console.log(`loterie plus tard : ${later.map(c => c.dust + (c.gift ? " +" + c.gift : "")).join(" | ")}`);
const zero = M.rollLottery(0, { ...s, lotteriesPlayed: 5, giftsTaken: 1, sinceGiftOffered: 1 });
console.log(`run catastrophique (0 poussière) rapporte quand même : ${zero.map(c => c.dust).join(", ")}`);
