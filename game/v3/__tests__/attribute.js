// Attribution: for a given strategy, where does the altitude actually come from?
// Splits every frame's altitude delta into "attached" vs "free flight", and reports
// the average winch charge it flies with. Guessing has been wrong three times.

const { ProtoEngine } = require("./proto.engine");
const C = require("./proto.constants");

function stubCanvas() {
  const noop = () => {};
  const ctx = new Proxy({}, { get: (t, k) => (k in t ? t[k] : noop), set: (t, k, v) => ((t[k] = v), true) });
  return { getContext: () => ctx, addEventListener: noop, removeEventListener: noop };
}

const offVertical = (e) => Math.abs((Math.atan2(e.vx, e.vy) * 180) / Math.PI);

const STRATS = {
  EXPERT: {
    grab: (e, t) => e.vy <= 60 || t.y > e.py + 120,
    release: (e) => e.sweptAngle > C.MIN_SWING_ANGLE && e.vy > 340 && offVertical(e) < 30,
  },
  WINCH: { grab: () => true, release: (e) => e.vy < -300 },
};

function attribute(name, strat, seeds = 6) {
  const acc = { attached: 0, free: 0, tAttached: 0, tFree: 0, chargeSum: 0, frames: 0, alt: 0, time: 0 };
  for (let s = 0; s < seeds; s++) {
    let seed = (s + 1) * 7919;
    const orig = Math.random;
    Math.random = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);

    let done = null;
    const engine = new ProtoEngine(stubCanvas(), (st) => (done = st));
    const dt = 1 / 60;
    for (let f = 0; f < 60 * 60 && !done; f++) {
      if (engine.anchor === null) {
        const t = engine.pickAnchor();
        if (t && strat.grab(engine, t)) { engine.pressed = true; engine.pressEdge = true; }
      } else if (strat.release(engine)) {
        engine.pressed = false; engine.releaseEdge = true;
      }
      const before = engine.py;
      const wasAttached = engine.anchor !== null || engine.pressEdge;
      engine.update(dt);
      engine.pressEdge = false;
      engine.releaseEdge = false;
      const delta = engine.py - before;
      if (wasAttached) { acc.attached += delta; acc.tAttached += dt; }
      else { acc.free += delta; acc.tFree += dt; }
      acc.chargeSum += engine.winchCharge;
      acc.frames++;
    }
    acc.alt += done ? done.altitudeM : Math.max(0, engine.peakY) / C.PX_PER_METER;
    acc.time += done ? done.timeSurvived : 60;
    Math.random = orig;
  }

  const n = seeds;
  console.log(`${name}`);
  console.log(`  altitude moyenne      ${(acc.alt / n).toFixed(0)}m en ${(acc.time / n).toFixed(0)}s`);
  console.log(`  gain accroché         ${(acc.attached / n / C.PX_PER_METER).toFixed(0)}m  (${(acc.tAttached / n).toFixed(1)}s attaché)`);
  console.log(`  gain en vol libre     ${(acc.free / n / C.PX_PER_METER).toFixed(0)}m  (${(acc.tFree / n).toFixed(1)}s libre)`);
  console.log(`  part du temps accroché ${((acc.tAttached / (acc.tAttached + acc.tFree)) * 100).toFixed(0)}%`);
  console.log(`  charge treuil moyenne  ${(acc.chargeSum / acc.frames).toFixed(2)}`);
  console.log();
}

for (const [name, strat] of Object.entries(STRATS)) attribute(name, strat);
