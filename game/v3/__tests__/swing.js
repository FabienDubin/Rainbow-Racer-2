// Measures the primitive the whole game is built on: ONE swing.
// For a grab at a given rope length, it brute-forces every possible release frame
// and reports the best achievable altitude gain and how long it took. If the best
// case is weak, no amount of tuning elsewhere will save the verb.

const { ProtoEngine } = require("./proto.engine");
const C = require("./proto.constants");

function stubCanvas() {
  const noop = () => {};
  const ctx = new Proxy({}, { get: (t, k) => (k in t ? t[k] : noop), set: (t, k, v) => ((t[k] = v), true) });
  return { getContext: () => ctx, addEventListener: noop, removeEventListener: noop };
}

const dt = 1 / 60;

// Drive a single grab → hold for `holdFrames` → release → coast to apex.
function trySwing(holdFrames, grabDist) {
  const engine = new ProtoEngine(stubCanvas(), () => {});
  // Freeze the storm and the world so we measure the swing alone
  engine.stormY = -1e9;
  engine.anchors = [];

  // Put the player at rest, with a single anchor straight-ish above
  engine.px = C.VIEW_W / 2;
  engine.py = 0;
  engine.vx = 0;
  engine.vy = 0;
  const anchor = { x: C.VIEW_W / 2 + 40, y: grabDist, used: false, skip: false };
  engine.anchors = [anchor];

  engine.pressed = true;
  engine.pressEdge = true;
  engine.update(dt);
  engine.pressEdge = false;
  if (engine.anchor === null) return null; // out of range

  let frames = 1;
  for (let i = 0; i < holdFrames && engine.anchor !== null; i++) {
    engine.update(dt);
    frames++;
  }
  const releasedBy = engine.anchor === null ? "auto" : "choice";
  if (engine.anchor !== null) {
    engine.pressed = false;
    engine.releaseEdge = true;
    engine.update(dt);
    engine.releaseEdge = false;
    frames++;
  }
  const exitSpeed = Math.hypot(engine.vx, engine.vy);
  const exitVy = engine.vy;

  // Coast (no input) until we stop rising
  let guard = 0;
  while (engine.vy > 0 && guard++ < 600) {
    engine.update(dt);
    frames++;
  }

  return {
    gainPx: engine.py,
    gainM: engine.py / C.PX_PER_METER,
    seconds: frames * dt,
    exitSpeed,
    exitVy,
    releasedBy,
    quality: engine.lastReleaseQuality,
  };
}

console.log("Un balancier, toutes les fenêtres de relâche testées\n");
console.log("distance   meilleur gain   durée    vitesse sortie   qualité   relâche");
console.log("d'accroche  (m)            (s)      (px/s)                            ");

for (const grabDist of [120, 180, 240, 290]) {
  let best = null;
  for (let hold = 1; hold <= 180; hold++) {
    const r = trySwing(hold, grabDist);
    if (!r) continue;
    if (!best || r.gainPx > best.gainPx) best = { ...r, hold };
  }
  if (!best) {
    console.log(`${String(grabDist).padStart(6)}px   — hors de portée`);
    continue;
  }
  const rate = best.gainM / best.seconds;
  console.log(
    `${String(grabDist).padStart(6)}px  ${best.gainM.toFixed(1).padStart(8)}m` +
      `${best.seconds.toFixed(2).padStart(9)}s` +
      `${Math.round(best.exitSpeed).toString().padStart(12)}` +
      `${best.quality.toFixed(2).padStart(12)}` +
      `${best.releasedBy.padStart(10)}` +
      `   → ${rate.toFixed(1)} m/s`
  );
}

// How fast must a player climb to survive the storm?
console.log("\nExigence de l'orage :");
for (const t of [0, 15, 30, 60]) {
  const need = (C.STORM_SPEED_BASE + C.STORM_ACCEL * t) / C.PX_PER_METER;
  console.log(`  à ${String(t).padStart(2)}s : ${need.toFixed(1)} m/s`);
}
