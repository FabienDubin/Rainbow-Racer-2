// Confirms the Phase 1 elements actually draw, in each state, without needing to fly
// there by hand: checkpoint lines with their labels, and a thunderhead dormant /
// telegraphing / striking.
const C = require("./proto.constants");
const { ProtoEngine } = require("./proto.engine");

function recording() {
  const calls = [];
  const noop = () => {};
  const ctx = new Proxy({}, {
    get: (t, k) => {
      if (k in t) return t[k];
      if (k === "createLinearGradient") return () => ({ addColorStop: noop });
      return (...a) => { calls.push({ fn: String(k), args: a }); };
    },
    set: (t, k, v) => ((t[k] = v), true),
  });
  return { canvas: { getContext: () => ctx, addEventListener: noop, removeEventListener: noop }, calls };
}

function probe(state) {
  const { canvas, calls } = recording();
  const e = new ProtoEngine(canvas, () => {});
  const highY = 140 * C.PX_PER_METER; // just below the 150m palier, so its label is in view
  e.py = highY; e.peakY = highY; e.camY = highY;
  e.stormY = highY - 900;
  e.nextCheckpointM = C.CHECKPOINT_EVERY_M;
  e.anchors = []; e.anchor = null;
  e.bolts = [{ x: 270, y: highY + 60, state, timer: state === "telegraph" ? C.BOLT_TELEGRAPH * 0.8 : 0 }];
  calls.length = 0;
  e.draw();

  const cloud = calls.some(c => c.fn === "ellipse");
  const liveLane = calls.some(c => c.fn === "fillRect" && c.args[3] === C.BOLT_THICKNESS);
  const dashed = calls.some(c => c.fn === "setLineDash" && Array.isArray(c.args[0]) && c.args[0].length === 2 && c.args[0][0] === 6);
  const palier = calls.some(c => c.fn === "fillText" && String(c.args[0]).startsWith("PALIER "));
  console.log(
    `bolt ${state.padEnd(10)} nuage ${cboo(cloud)}  couloir actif ${cboo(liveLane)}` +
    `  télégraphe pointillé ${cboo(dashed)}  ligne de palier ${cboo(palier)}`
  );
}
const cboo = b => (b ? "oui" : "non ").padEnd(4);

console.log(`palier tous les ${C.CHECKPOINT_EVERY_M}m · arm ${C.BOLT_ARM_RANGE}px · couloir ${C.BOLT_THICKNESS}px\n`);
["dormant", "telegraph", "strike", "cooldown"].forEach(probe);

// And the arming behaviour itself
const { canvas } = recording();
const e = new ProtoEngine(canvas, () => {});
const y = 200 * C.PX_PER_METER;
e.py = y; e.peakY = y; e.camY = y; e.stormY = -1e9; e.anchors = []; e.anchor = null;
e.bolts = [{ x: 270, y: y + C.BOLT_ARM_RANGE - 30, state: "dormant", timer: 0 }];
const seq = [];
for (let f = 0; f < 90; f++) { e.updateBolts(1/60); seq.push(e.bolts[0].state); }
const order = seq.filter((s, i) => s !== seq[i-1]);
console.log(`\nS'arme en approche : ${order.join(" -> ")}`);

// Standing IN the lane when it fires must hurt; standing clear of it must not.
function laneTest(offsetFromLane, label) {
  const { canvas } = recording();
  const g = new ProtoEngine(canvas, () => {});
  const yy = 200 * C.PX_PER_METER;
  g.py = yy; g.peakY = yy; g.camY = yy; g.stormY = -1e9; g.anchors = []; g.anchor = null;
  g.bolts = [{ x: 270, y: yy + offsetFromLane, state: "telegraph", timer: 0 }];
  for (let f = 0; f < 60; f++) g.updateBolts(1/60);
  console.log(`  ${label.padEnd(34)} touches=${g.hits}  étourdi=${g.stunTime > 0 ? "oui" : "non"}`);
}
console.log("Collision :");
laneTest(0, "pile dans le couloir");
laneTest(C.BOLT_THICKNESS, "juste au-dessus du couloir");
laneTest(-C.BOLT_THICKNESS, "juste en dessous du couloir");
