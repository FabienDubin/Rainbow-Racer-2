// Fab's casino shape: learn the prize exists early, then wait for it.
// Simulates 30 runs and prints when a gift was on the table (and when it was taken),
// so the cadence can be read rather than assumed.
const M = require("./meta");

function simulate(pickBest) {
  let s = M.resetMetaLike();
  const timeline = [];
  for (let run = 1; run <= 30; run++) {
    const cards = M.rollLottery(60, s);
    const offered = cards.some((c) => c.gift !== null);
    // Player either grabs the gift when they spot it, or just takes the biggest pile
    const idx = pickBest && offered
      ? cards.findIndex((c) => c.gift !== null)
      : cards.indexOf(cards.reduce((a, b) => (b.dust > a.dust ? b : a)));
    s = M.applyCard(s, cards[idx], offered);
    timeline.push(offered ? (cards[idx].gift ? "G" : "o") : ".");
  }
  return { timeline: timeline.join(""), s };
}

// resetMeta writes to localStorage which does not exist here
M.resetMetaLike = () => ({
  dust: 0, permanents: [], consumables: [], mode: null, modeRunsLeft: 0,
  runs: 0, bestM: 0, lotteriesPlayed: 0, giftsTaken: 0, sinceGiftOffered: 99,
});

console.log("30 parties.  G = cadeau pris   o = cadeau vu mais manqué   . = rien\n");
for (let t = 0; t < 6; t++) {
  const { timeline, s } = simulate(true);
  console.log(`  ${timeline}   (${s.giftsTaken} cadeaux)`);
}
console.log("\nÉcarts entre cadeaux offerts, sur 400 parties :");
let s = M.resetMetaLike();
const gaps = [];
let last = 0;
for (let run = 1; run <= 400; run++) {
  const cards = M.rollLottery(60, s);
  const offered = cards.some((c) => c.gift !== null);
  const idx = offered ? cards.findIndex((c) => c.gift) : 0;
  s = M.applyCard(s, cards[idx], offered);
  if (offered) { gaps.push(run - last); last = run; }
}
const avg = gaps.reduce((a, b) => a + b, 0) / gaps.length;
console.log(`  premier cadeau à la partie ${gaps[0]}`);
console.log(`  écart moyen ensuite : ${(gaps.slice(1).reduce((a,b)=>a+b,0)/(gaps.length-1)).toFixed(1)} parties`);
console.log(`  écart max : ${Math.max(...gaps)} parties (filet de sécurité à 10)`);
