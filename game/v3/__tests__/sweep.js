// Sweeps SWING_PUMP against two objectives that pull in opposite directions:
//   1. a dive must be clearly rewarded (Fab's note about gaining speed on the way down)
//   2. the game must stay survivable, and skilled play must still beat careless play
// Too much pump and every swing converges to the same ceiling (dive worthless).
// Too little and only a perfect momentum chain survives at all.
//
// Constants are read live through the CommonJS exports object, so mutating them here
// re-tunes the engine without recompiling.

const C = require("./proto.constants");
const { ProtoEngine } = require("./proto.engine");

function stubCanvas() {
  const noop = () => {};
  const ctx = new Proxy({}, { get: (t, k) => (k in t ? t[k] : noop), set: (t, k, v) => ((t[k] = v), true) });
  return { getContext: () => ctx, addEventListener: noop, removeEventListener: noop };
}

const dt = 1 / 60;
const offVertical = (e) => Math.abs((Math.atan2(e.vx, e.vy) * 180) / Math.PI);

// ---- objective 1: dive reward ----
function diveHeight(entryVy, belowBy) {
  let best = -Infinity;
  for (let hold = 1; hold <= 150; hold++) {
    const e = new ProtoEngine(stubCanvas(), () => {});
    e.stormY = -1e9;
    e.px = C.VIEW_W / 2; e.py = 0; e.vx = 0; e.vy = entryVy;
    e.anchors = [{ x: C.VIEW_W / 2 + 70, y: -belowBy, used: false, skip: false }];
    e.pressed = true; e.pressEdge = true; e.update(dt); e.pressEdge = false;
    if (e.anchor === null) continue;
    for (let i = 0; i < hold && e.anchor !== null; i++) e.update(dt);
    if (e.anchor !== null) { e.pressed = false; e.releaseEdge = true; e.update(dt); e.releaseEdge = false; }
    let g = 0;
    while (e.vy > 0 && g++ < 900) e.update(dt);
    best = Math.max(best, e.py);
  }
  return best;
}

// ---- objective 2: playability ----
const PLAYERS = {
  expert: {
    grab: (e, t) => e.vy <= 60 || t.y > e.py + 120,
    release: (e) => e.sweptAngle > C.MIN_SWING_ANGLE && e.vy > 340 && offVertical(e) < 30,
  },
  average: {
    grab: () => true,
    release: (e) => e.sweptAngle > C.MIN_SWING_ANGLE && e.vy > 250,
  },
};

function play(player, seed) {
  let s = seed;
  const orig = Math.random;
  Math.random = () => ((s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
  let stats = null;
  const e = new ProtoEngine(stubCanvas(), (st) => (stats = st));
  for (let f = 0; f < 60 * 90 && !stats; f++) {
    if (e.anchor === null) {
      const t = e.pickAnchor();
      if (t && player.grab(e, t)) { e.pressed = true; e.pressEdge = true; }
    } else if (player.release(e)) { e.pressed = false; e.releaseEdge = true; }
    e.update(dt);
    e.pressEdge = false; e.releaseEdge = false;
  }
  Math.random = orig;
  return {
    alt: stats ? stats.altitudeM : Math.round(Math.max(0, e.peakY) / C.PX_PER_METER),
    time: stats ? stats.timeSurvived : 90,
  };
}

function avg(player, n = 8) {
  const runs = Array.from({ length: n }, (_, i) => play(player, (i + 1) * 7919));
  return {
    alt: Math.round(runs.reduce((a, r) => a + r.alt, 0) / n),
    time: Math.round(runs.reduce((a, r) => a + r.time, 0) / n),
  };
}

console.log("SWING_PUMP   dive -600 vs repos   expert          moyen        gradient");
console.log("                                 alt / survie    alt / survie          ");

for (const pump of [170, 300, 450, 600, 800, 1050]) {
  C.SWING_PUMP = pump;
  const rest = diveHeight(0, 160);
  const dive = diveHeight(-600, 160);
  const diveGain = dive - rest; // px of extra height bought by the dive
  const ex = avg(PLAYERS.expert);
  const av = avg(PLAYERS.average);
  console.log(
    `${String(pump).padStart(9)}   ${(diveGain / C.PX_PER_METER).toFixed(1).padStart(8)}m plus haut` +
      `${(ex.alt + "m").padStart(9)} /${(ex.time + "s").padStart(4)}` +
      `${(av.alt + "m").padStart(9)} /${(av.time + "s").padStart(4)}` +
      `${("x" + (ex.alt / Math.max(1, av.alt)).toFixed(1)).padStart(10)}`
  );
}
