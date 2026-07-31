// Does the camera change the GAME, or only the view?
//
// Two things landed at once that both smell like "it's only rendering":
//
//   thumbGuard — lets the camera give ground so Prism never slides under the thumb.
//                That is not free: the camera used to rise only, and the DEATH_MARGIN
//                backstop is expressed in SCREEN space, so allowing the camera down
//                retires that backstop and leaves the storm as the only killer.
//   follow     — a 1400px corridor instead of 540, with the camera tracking you. The
//                wrap seam moves, the anchor chain roams three times wider, and the
//                garlands that used to sit in the wrap margin move somewhere else.
//                None of that is rendering.
//
// So both get measured the same way everything else here does: does skilled play still
// beat careless play by the same margin, and does any degenerate strategy come out on
// top? A comfort feature that quietly flattens the skill gradient is not a comfort
// feature, it is a difficulty change wearing a disguise.
//
// 24 seeds, per the note in the README: at 8 these numbers move by 0.8 on their own.

const { ProtoEngine } = require("./proto.engine");
const C = require("./proto.constants");
const { DEFAULTS } = require("./settings");

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
const SEEDS = 24;

function run(player, seed, opts) {
  let s = seed;
  const rnd = () => ((s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
  const orig = Math.random;
  Math.random = rnd;

  let stats = null;
  const engine = new ProtoEngine(stubCanvas(), (st) => (stats = st), undefined, opts);
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
    time: read("timeSurvived", TEST_SECONDS),
    died: Boolean(stats),
  };
}

const offVertical = (e) => Math.abs((Math.atan2(e.vx, e.vy) * 180) / Math.PI);

const PLAYERS = {
  EXPERT: {
    grab: (e, t) => e.vy <= 60 || t.y > e.py + 120,
    release: (e) => e.sweptAngle > C.MIN_SWING_ANGLE && e.vy > 350 && offVertical(e) < 35,
  },
  AVERAGE: {
    grab: () => true,
    release: (e) => e.sweptAngle > C.MIN_SWING_ANGLE && e.vy > 200,
  },
  PASSIVE: { grab: () => true, release: () => false },
  MASHER: { grab: () => true, release: () => true },
};

const CONFIGS = [
  ["cheminée, sans zone pouce", { ...DEFAULTS, camera: "chimney", thumbGuard: false }],
  ["cheminée + zone pouce", { ...DEFAULTS, camera: "chimney", thumbGuard: true }],
  ["suivi + zone pouce", { ...DEFAULTS, camera: "follow", thumbGuard: true }],
];

console.log(`Caméra — ${TEST_SECONDS}s, ${SEEDS} graines par joueur\n`);
console.log("configuration                 EXPERT   AVERAGE   PASSIVE   MASHER   gradient   survie exp.");

const results = [];
for (const [label, opts] of CONFIGS) {
  const cell = {};
  for (const [name, player] of Object.entries(PLAYERS)) {
    const runs = Array.from({ length: SEEDS }, (_, i) => run(player, (i + 1) * 7919, opts));
    cell[name] = {
      alt: Math.round(runs.reduce((a, r) => a + r.alt, 0) / runs.length),
      time: Math.round(runs.reduce((a, r) => a + r.time, 0) / runs.length),
      deaths: runs.filter((r) => r.died).length,
    };
  }
  const grad = cell.EXPERT.alt / Math.max(1, cell.AVERAGE.alt);
  results.push({ label, cell, grad });
  console.log(
    `${label.padEnd(28)} ${String(cell.EXPERT.alt).padStart(5)}m  ${String(cell.AVERAGE.alt).padStart(7)}m  ` +
      `${String(cell.PASSIVE.alt).padStart(7)}m  ${String(cell.MASHER.alt).padStart(6)}m   ` +
      `x${grad.toFixed(1).padStart(6)}   ${String(cell.EXPERT.time).padStart(3)}s ` +
      `(${cell.EXPERT.deaths}/${SEEDS} morts)`
  );
}

// The verdicts. Differences under ~0.2 in the gradient mean nothing at this seed count.
const base = results[0];
console.log("\nVerdicts (référence : cheminée sans zone pouce)");
for (const r of results.slice(1)) {
  const d = r.grad - base.grad;
  const noise = Math.abs(d) < 0.2;
  console.log(
    `  ${r.label.padEnd(26)} gradient ${d >= 0 ? "+" : ""}${d.toFixed(1)}  ` +
      `${noise ? "— dans le bruit, le skill est payé pareil" : "— ÉCART RÉEL, à regarder"}`
  );
}

for (const r of results) {
  const worst = Math.max(r.cell.PASSIVE.alt, r.cell.MASHER.alt);
  const beaten = worst >= r.cell.EXPERT.alt;
  console.log(
    `  ${r.label.padEnd(26)} stratégie dégénérée devant l'expert ? ${beaten ? "OUI — exploit" : "non"}`
  );
}

// The thumb band retires the screen-space death backstop, so runs must still END.
console.log("\nLes runs se terminent-ils toujours ? (sinon l'orage ne tue plus)");
for (const r of results) {
  const d = r.cell.EXPERT.deaths;
  console.log(
    `  ${r.label.padEnd(26)} ${d}/${SEEDS} morts en ${TEST_SECONDS}s  ` +
      `${d === 0 ? "— PERSONNE NE MEURT, la pression a disparu" : "— ok"}`
  );
}
