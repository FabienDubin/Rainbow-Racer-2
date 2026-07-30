// Headless validation of the Arc physics.
//
// Two things must be true for the verb to be worth building on:
//   1. skilled play must clearly beat careless play (a real skill gradient)
//   2. no degenerate strategy (spam, hold, panic-grab) may top the table
//
// A "player" here is a pair of decisions — WHEN to grab and WHEN to let go —
// because grabbing too early throws away a good launch, and that is exactly the
// mistake a real beginner makes.

const { ProtoEngine } = require("./proto.engine");
const C = require("./proto.constants");

function stubCanvas() {
  const noop = () => {};
  const ctx = new Proxy(
    {},
    {
      get: (t, k) => (k in t ? t[k] : k === "createLinearGradient" ? () => ({ addColorStop: noop }) : noop),
      set: (t, k, v) => ((t[k] = v), true),
    }
  );
  return { getContext: () => ctx, addEventListener: noop, removeEventListener: noop };
}

const TEST_SECONDS = 60;

function run(player, seed) {
  let s = seed;
  const rnd = () => ((s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
  const orig = Math.random;
  Math.random = rnd;

  let stats = null;
  const engine = new ProtoEngine(stubCanvas(), (st) => (stats = st));
  const dt = 1 / 60;

  for (let f = 0; f < 60 * TEST_SECONDS && !stats; f++) {
    if (engine.anchor === null) {
      const target = engine.pickAnchor();
      if (target && player.grab(engine, target)) {
        engine.pressed = true;
        engine.pressEdge = true;
      }
    } else if (player.release(engine)) {
      engine.pressed = false;
      engine.releaseEdge = true;
    }
    engine.update(dt);
    engine.pressEdge = false;
    engine.releaseEdge = false;
  }

  Math.random = orig;
  const read = (f, fallback) => (stats ? stats[f] : fallback);
  return {
    alt: read("altitudeM", Math.round(Math.max(0, engine.peakY) / C.PX_PER_METER)),
    chain: read("bestChain", engine.bestChain),
    slips: read("slips", engine.slips),
    autos: engine.autoReleases,
    time: read("timeSurvived", TEST_SECONDS),
    died: Boolean(stats),
  };
}

// Angle of the velocity vector away from straight up, in degrees.
const offVertical = (e) => Math.abs((Math.atan2(e.vx, e.vy) * 180) / Math.PI);

const GRAB = {
  // Waits for the apex, then takes the highest rung it can reach.
  patient: (e, t) => e.vy <= 60 || t.y > e.py + 120,
  // Grabs the very first thing in range — throws away its own launches.
  greedy: () => true,
};

const RELEASE = {
  // Lets go when the swing is aimed near-vertical and fast: converts timing to height.
  // Thresholds re-derived by sweep (see policy.js) after the physics changed scale —
  // the old vy>340/<30 pair sat on the edge of the good zone and made "expert" play
  // look worse than careless play, which was a stale harness, not a broken game.
  aimed: (e) => e.sweptAngle > C.MIN_SWING_ANGLE && e.vy > 350 && offVertical(e) < 35,
  // Lets go on any decent upward motion, without aiming at all.
  rising: (e) => e.sweptAngle > C.MIN_SWING_ANGLE && e.vy > 200,
  // Lets go the instant it is falling — the winch does all the work.
  falling: (e) => e.vy < -250,
  // Never chooses: rides every arc to the automatic release.
  never: () => false,
  // Taps the input constantly.
  spam: () => true,
};

const PLAYERS = {
  "EXPERT   patient grab + aimed release":  { grab: GRAB.patient, release: RELEASE.aimed },
  "GOOD     patient grab + rising release": { grab: GRAB.patient, release: RELEASE.rising },
  "AVERAGE  greedy grab + rising release":  { grab: GRAB.greedy,  release: RELEASE.rising },
  "PASSIVE  greedy grab + never releases":  { grab: GRAB.greedy,  release: RELEASE.never },
  "WINCH    greedy grab + drops on fall":   { grab: GRAB.greedy,  release: RELEASE.falling },
  "MASHER   greedy grab + spams input":     { grab: GRAB.greedy,  release: RELEASE.spam },
};

console.log(`Arc physics — ${TEST_SECONDS}s runs, 8 seeds per player\n`);
const rows = [];
for (const [name, player] of Object.entries(PLAYERS)) {
  const runs = Array.from({ length: 8 }, (_, i) => run(player, (i + 1) * 7919));
  const avg = (f) => runs.reduce((a, r) => a + r[f], 0) / runs.length;
  const row = {
    name,
    alt: Math.round(avg("alt")),
    chain: Math.round(avg("chain")),
    slips: Math.round(avg("slips")),
    time: Math.round(avg("time")),
    deaths: runs.filter((r) => r.died).length,
  };
  row.rate = (row.alt / Math.max(1, row.time)).toFixed(1);
  rows.push(row);
  console.log(
    `${name.padEnd(40)} ${String(row.alt).padStart(6)}m  ${String(row.rate).padStart(5)} m/s  ` +
      `chaîne ${String(row.chain).padStart(3)}  slips ${String(row.slips).padStart(4)}  ` +
      `survie ${String(row.time).padStart(2)}s  morts ${row.deaths}/8`
  );
}

const get = (p) => rows.find((r) => r.name.startsWith(p));
const best = [...rows].sort((a, b) => b.alt - a.alt)[0];
const expert = get("EXPERT");
const average = get("AVERAGE");

console.log(`\nMeilleur joueur          : ${best.name.trim()}`);
console.log(`Gradient expert/moyen    : x${(expert.alt / Math.max(1, average.alt)).toFixed(1)}`);
for (const p of ["MASHER", "PASSIVE", "WINCH"]) {
  const r = get(p);
  const bad = r.alt >= expert.alt;
  console.log(`${p.padEnd(9)} bat l'expert ?  : ${bad ? "OUI — exploit à corriger" : "non"}`);
}
