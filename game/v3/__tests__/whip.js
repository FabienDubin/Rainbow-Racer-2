// How much momentum should a rope catch keep?
// A pendulum can never return HIGHER than it started — that would be free energy.
// So the question is only how much it loses. Sweeps WHIP_RECOVERY against:
//   - height recovered on the far side of the arc (1.0 = keeps all its speed)
//   - launch height gained by diving vs grabbing from a standstill
//   - whether the game stays survivable and skill still wins

const C = require("./proto.constants");
const { ProtoEngine } = require("./proto.engine");

function stubCanvas() {
  const noop = () => {};
  const ctx = new Proxy({}, { get: (t, k) => (k in t ? t[k] : noop), set: (t, k, v) => ((t[k] = v), true) });
  return { getContext: () => ctx, addEventListener: noop, removeEventListener: noop };
}
const dt = 1 / 60;
const offVertical = (e) => Math.abs((Math.atan2(e.vx, e.vy) * 180) / Math.PI);

function fresh(entryVy, below) {
  const e = new ProtoEngine(stubCanvas(), () => {});
  e.stormY = -1e9;
  e.px = C.VIEW_W / 2; e.py = 0; e.vx = 0; e.vy = entryVy;
  e.anchors = [{ x: C.VIEW_W / 2 + 30, y: -below, used: false, skip: false }];
  e.pressed = true; e.pressEdge = true; e.update(dt); e.pressEdge = false;
  return e.anchor ? e : null;
}

// Highest point reached on the far side of the arc, holding throughout.
function returnHeight(below) {
  const e = fresh(0, below);
  if (!e) return NaN;
  let bottomSeen = false, peak = -Infinity;
  for (let f = 0; f < 150; f++) {
    e.update(dt);
    const dy = e.py - e.anchors[0].y;
    if (dy < 0 && Math.abs(e.px - e.anchors[0].x) < 40) bottomSeen = true;
    if (bottomSeen) peak = Math.max(peak, e.py);
  }
  return peak;
}

// Best launch height, brute-forcing the release frame.
function launchHeight(entryVy, below) {
  let best = -Infinity;
  for (let hold = 1; hold <= 200; hold++) {
    const e = fresh(entryVy, below);
    if (!e) continue;
    for (let i = 0; i < hold && e.anchor !== null; i++) e.update(dt);
    if (e.anchor !== null) { e.pressed = false; e.releaseEdge = true; e.update(dt); e.releaseEdge = false; }
    let g = 0;
    while (e.vy > 0 && g++ < 900) e.update(dt);
    best = Math.max(best, e.py);
  }
  return best;
}

const PLAYERS = {
  expert: {
    grab: (e, t) => e.vy <= 60 || t.y > e.py + 120,
    release: (e) => e.sweptAngle > C.MIN_SWING_ANGLE && e.vy > 340 && offVertical(e) < 30,
  },
  average: { grab: () => true, release: (e) => e.sweptAngle > C.MIN_SWING_ANGLE && e.vy > 250 },
  passive: { grab: () => true, release: () => false },
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
const avg = (p) => {
  const r = Array.from({ length: 8 }, (_, i) => play(p, (i + 1) * 7919));
  return {
    alt: Math.round(r.reduce((a, x) => a + x.alt, 0) / 8),
    time: Math.round(r.reduce((a, x) => a + x.time, 0) / 8),
  };
};

console.log("WHIP   retour arc   plongeon -600     expert       moyen      passif   gradient");
console.log("       (m vs 0)     vs à l'arrêt      alt/survie   alt/survie  alt              ");

for (const w of [0.68, 0.8, 0.9, 0.97, 1.0]) {
  C.WHIP_RECOVERY = w;
  const ret = returnHeight(180) / C.PX_PER_METER;
  const rest = launchHeight(0, 180);
  const dive = launchHeight(-600, 180);
  const ex = avg(PLAYERS.expert), av = avg(PLAYERS.average), pa = avg(PLAYERS.passive);
  console.log(
    `${w.toFixed(2).padStart(5)}${ret.toFixed(1).padStart(11)}m` +
      `${((dive - rest) / C.PX_PER_METER).toFixed(1).padStart(13)}m plus haut` +
      `${(ex.alt + "m/" + ex.time + "s").padStart(13)}` +
      `${(av.alt + "m/" + av.time + "s").padStart(12)}` +
      `${(pa.alt + "m").padStart(9)}` +
      `${("x" + (ex.alt / Math.max(1, av.alt)).toFixed(1)).padStart(10)}`
  );
}
