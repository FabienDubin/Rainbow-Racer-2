// Prices are calibrated against REAL runs, because bots badly under-represent a person:
// Fab does 147m relaxed and ~650m when trying, my best bot manages 75m. So instead of
// asking a bot to earn the dust, this measures DUST DENSITY per metre and multiplies it
// out across the three real profiles Fab gave me.
const C = require("./proto.constants");
const M = require("./meta");
const { ProtoEngine } = require("./proto.engine");
const stub = () => { const n=()=>{}; const c=new Proxy({},{get:(t,k)=>k in t?t[k]:n,set:(t,k,v)=>((t[k]=v),true)}); return {getContext:()=>c,addEventListener:n,removeEventListener:n}; };

// How much dust exists per metre of climb, and how much of it sits ON the natural line
// versus out on the bonus arcs.
function density(seed) {
  let s = seed; const orig = Math.random;
  Math.random = () => ((s = (s*1103515245+12345) & 0x7fffffff)/0x7fffffff);
  const e = new ProtoEngine(stub(), () => {});
  e.generateUpTo(e.camY + 400 * C.PX_PER_METER); // generate ~400m of world
  const metres = (e.generatedTo - 0) / C.PX_PER_METER;
  const line = e.dusts.filter(d => d.value === 1);
  const bonus = e.dusts.filter(d => d.value > 1);
  Math.random = orig;
  return {
    perM: e.dusts.reduce((a,d)=>a+d.value,0) / metres,
    linePerM: line.length / metres,
    bonusPerM: bonus.reduce((a,d)=>a+d.value,0) / metres,
  };
}

const runs = [1,2,3,4,5].map(i => density(i*7919));
const avg = f => runs.reduce((a,r)=>a+r[f],0)/runs.length;
const perM = avg("perM"), linePerM = avg("linePerM"), bonusPerM = avg("bonusPerM");

console.log("Poussière disponible par mètre grimpé");
console.log(`  total          ${perM.toFixed(2)}/m`);
console.log(`  sur la ligne   ${linePerM.toFixed(2)}/m  (revenu de base, sans effort)`);
console.log(`  arcs bonus     ${bonusPerM.toFixed(2)}/m  (hors ligne, x3 l'unité)\n`);

// Three real profiles, at two levels of greed.
const PROFILES = [
  ["débutant       ", 80],
  ["Fab détendu    ", 147],
  ["Fab sérieux    ", 650],
];
console.log("Gain par run (avant loterie)");
console.log("profil            ligne seule   + moitié des bonus   tout ramassé");
for (const [name, m] of PROFILES) {
  const lazy = Math.round(m * linePerM * 0.75);      // misses a quarter even on-line
  const mid  = Math.round(m * (linePerM * 0.9 + bonusPerM * 0.5));
  const full = Math.round(m * perM);
  console.log(`${name}  ${String(lazy).padStart(9)}   ${String(mid).padStart(17)}   ${String(full).padStart(12)}`);
}

console.log("\nCombien de runs pour s'offrir chaque chose");
console.log("achat                        débutant   Fab détendu   Fab sérieux");
for (const u of M.CATALOGUE) {
  const cells = PROFILES.map(([, m]) => {
    const mid = m * (linePerM * 0.9 + bonusPerM * 0.5);
    const lottery = 15 + mid * 0.35; // rough average lottery payout
    return Math.max(1, Math.ceil(u.price / (mid + lottery)));
  });
  console.log(
    // Names moved into i18n when the game learned English and German, so ask meta for it
    `${(M.itemName(u.id) + " (✦" + u.price + ")").padEnd(28)} ${String(cells[0]).padStart(8)}   ${String(cells[1]).padStart(11)}   ${String(cells[2]).padStart(11)}`
  );
}

// Palier count per profile, with the growing gaps
console.log("\nPaliers franchis (espacement croissant)");
for (const [name, m] of PROFILES) {
  let gap = C.CHECKPOINT_FIRST_M, at = C.CHECKPOINT_FIRST_M, n = 0;
  while (at <= m && n < 100) { n++; gap *= C.CHECKPOINT_GROWTH; at += gap; }
  console.log(`${name}  ${m}m -> ${n} paliers`);
}
