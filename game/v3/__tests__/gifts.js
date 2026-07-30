// Fab's casino shape: learn the prize exists early, then wait for it.
//
// THIS PROBE LIED ONCE. It only ever ran the omniscient player — one who finds the gift
// whenever a card holds it. But the cards are FACE DOWN: you cannot see through them, so
// the only honest model is a uniform random pick. Measuring the OFFER cadence while the
// player experiences the RECEIVE cadence is how Fab went eight runs without a single gift
// while this probe reported a healthy "one every 5.7 runs". Offered ≠ received.
const M = require("./meta");

// resetMeta writes to localStorage which does not exist here
M.resetMetaLike = () => ({
  dust: 0, permanents: [], consumables: [], mode: null, modeRunsLeft: 0,
  runs: 0, bestM: 0, lotteriesPlayed: 0, giftsTaken: 0, sinceGiftOffered: 99,
});

// The real player: three identical backs, so a blind 1-in-3 pick
function simulate(runs) {
  let s = M.resetMetaLike();
  const timeline = [];
  let offers = 0;
  for (let run = 1; run <= runs; run++) {
    const cards = M.rollLottery(60, s);
    const offered = cards.some((c) => c.gift !== null);
    if (offered) offers++;
    const idx = Math.floor(Math.random() * 3);
    s = M.applyCard(s, cards[idx], offered);
    timeline.push(offered ? (cards[idx].gift ? "G" : "o") : ".");
  }
  return { timeline: timeline.join(""), taken: s.giftsTaken, offers };
}

console.log("30 parties, choix à l'aveugle (la seule stratégie possible).");
console.log("G = cadeau reçu   o = cadeau sur la table mais raté   . = rien\n");
let firstRun = [];
for (let t = 0; t < 8; t++) {
  const r = simulate(30);
  console.log(`  ${r.timeline}   reçus ${r.taken} / posés ${r.offers}`);
  firstRun.push(r.timeline.indexOf("G") + 1);
}

// The number that matters: how long before a new player HOLDS their first gift
const firsts = [];
for (let t = 0; t < 2000; t++) {
  let s = M.resetMetaLike();
  for (let run = 1; run <= 40; run++) {
    const cards = M.rollLottery(60, s);
    const offered = cards.some((c) => c.gift !== null);
    const idx = Math.floor(Math.random() * 3);
    s = M.applyCard(s, cards[idx], offered);
    if (s.giftsTaken > 0) { firsts.push(run); break; }
  }
}
firsts.sort((a, b) => a - b);
console.log(`\nPremier cadeau REÇU, sur ${firsts.length} nouveaux joueurs :`);
console.log(`  médiane : partie ${firsts[Math.floor(firsts.length / 2)]}`);
console.log(`  pire cas sur 2000 : partie ${firsts[firsts.length - 1]}`);
console.log(`  reçu dès la 1re : ${((firsts.filter((f) => f === 1).length / firsts.length) * 100).toFixed(0)}%`);
console.log(`  toujours rien après 3 parties : ${((firsts.filter((f) => f > 3).length / firsts.length) * 100).toFixed(1)}%`);
