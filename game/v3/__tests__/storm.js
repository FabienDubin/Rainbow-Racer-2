// Is Le Grondement — the one thing that kills you — ever actually ON SCREEN?
//
// Fab's report: "jamais je vois l'orage monter, je ne vois rien de tout ça". The storm is
// implemented and it IS what ends every run, but implemented is not the same as present.
// This measures, per frame, how far below the player's feet the storm front sits, and what
// fraction of a run it is inside the visible view at all.
const { ProtoEngine } = require("./proto.engine");
const C = require("./proto.constants");

function stubCanvas() {
  const noop = () => {};
  const ctx = new Proxy({}, {
    get: (t, k) => (k in t ? t[k] : k === "createLinearGradient" ? () => ({ addColorStop: noop }) : noop),
    set: (t, k, v) => ((t[k] = v), true),
  });
  return { getContext: () => ctx, addEventListener: noop, removeEventListener: noop };
}

// How much world is visible BELOW the player: the player sits at CAM_PLAYER_SCREEN_FRAC
// down the view, so everything under them is the remaining fraction.
const BELOW_PLAYER_PX = C.VIEW_H * (1 - C.CAM_PLAYER_SCREEN_FRAC);

function run(player, seed, seconds = 90) {
  let s = seed;
  const rnd = () => ((s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
  const orig = Math.random;
  Math.random = rnd;

  let stats = null;
  const engine = new ProtoEngine(stubCanvas(), (st) => (stats = st));
  let cause = "survécu";
  const dt = 1 / 60;
  let frames = 0, visible = 0, closest = Infinity;
  let firstVisibleAt = null;

  for (let f = 0; f < 60 * seconds && !stats; f++) {
    if (engine.anchor === null) {
      const target = engine.pickAnchor();
      if (target && player.grab(engine, target)) { engine.pressed = true; engine.pressEdge = true; }
    } else if (player.release(engine)) {
      engine.pressed = false;
      engine.releaseEdge = true;
    }
    engine.update(dt);
    engine.pressEdge = false;
    engine.releaseEdge = false;
    frames++;
    const gap = engine.py - engine.stormY; // px between player and the storm front
    // The frame that ends the run is the frame that set `stats`, so judge the cause here
    if (stats) cause = gap <= 0 ? "orage" : "chute hors champ";
    closest = Math.min(closest, gap);
    if (gap < BELOW_PLAYER_PX) {
      visible++;
      if (firstVisibleAt === null) firstVisibleAt = engine.time;
    }
  }
  Math.random = orig;
  return {
    m: stats ? stats.altitudeM : Math.round(engine.py / C.PX_PER_METER),
    secs: engine.time,
    visiblePct: (visible / frames) * 100,
    closestPx: closest,
    firstVisibleAt,
    died: !!stats,
    cause,
  };
}

// A player who climbs (aims the release near the top) and one who mashes
const skilled = {
  grab: (e, t) => t.y > e.py - 40,
  release: (e) => e.swingAngle > 1.1 && e.vy > 0,
};
const careless = { grab: () => true, release: (e) => e.time % 0.4 < 1 / 60 };
const idle = { grab: () => false, release: () => false };

console.log(`Vue : ${C.VIEW_H}px, joueur à ${(C.CAM_PLAYER_SCREEN_FRAC * 100).toFixed(0)}% du haut`);
console.log(`=> ${BELOW_PLAYER_PX.toFixed(0)}px de monde visible SOUS le joueur.`);
console.log(`Retard de l'orage : ${C.STORM_LAG_START}px au départ -> ${C.STORM_LAG_MIN}px (tau ${C.STORM_LAG_TAU}s).`);
console.log(`Masse dessinée ${C.STORM_HAZE}px au-dessus de la lèvre, donc visible dès un retard < ${(BELOW_PLAYER_PX + C.STORM_HAZE).toFixed(0)}px.\n`);

for (const [name, p] of [["expert", skilled], ["négligent", careless], ["immobile", idle]]) {
  const rs = [];
  for (let seed = 1; seed <= 24; seed++) rs.push(run(p, seed * 7919));
  const avg = (f) => rs.reduce((a, r) => a + f(r), 0) / rs.length;
  const seen = rs.filter((r) => r.firstVisibleAt !== null).length;
  console.log(
    `${name.padEnd(10)} ${avg((r) => r.m).toFixed(0).padStart(4)}m  ` +
    `orage visible ${avg((r) => r.visiblePct).toFixed(1).padStart(5)}% du temps  ` +
    `approche la plus près ${avg((r) => r.closestPx).toFixed(0).padStart(5)}px  ` +
    `vu au moins une fois : ${seen}/24`
  );
  const causes = {};
  for (const r of rs) causes[r.cause] = (causes[r.cause] ?? 0) + 1;
  console.log(`${" ".repeat(11)}causes de fin : ${JSON.stringify(causes)}`);
}
