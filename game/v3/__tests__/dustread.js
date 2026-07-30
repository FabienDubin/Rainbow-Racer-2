// Fab: "je vois que des poussières donc forcément je ne vois pas le reste".
// The two kinds must be distinguishable BEFORE you reach them, and the value must be
// named when you take one. Asserts both, plus that a bonus arc draws as one garland.
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
    set: (t, k, v) => { t[k] = v; calls.push({ fn: "set:" + String(k), args: [v] }); return true; },
  });
  return { canvas: { getContext: () => ctx, addEventListener: noop, removeEventListener: noop }, calls };
}

const y = 100 * C.PX_PER_METER;
const { canvas, calls } = recording();
const e = new ProtoEngine(canvas, () => {});
e.py = y; e.peakY = y; e.camY = y; e.stormY = -1e9; e.anchors = []; e.anchor = null;
e.bolts = [];
e.dusts = [
  { x: 200, y: y + 40, value: 1, taken: false, arc: 0 },
  { x: 300, y: y + 60, value: 2, taken: false, arc: 7 },
  { x: 340, y: y + 90, value: 2, taken: false, arc: 7 },
  { x: 380, y: y + 120, value: 2, taken: false, arc: 7 },
];
calls.length = 0;
e.draw();

const radii = calls.filter(c => c.fn === "arc").map(c => c.args[2]);
const lineDot = radii.some(r => Math.abs(r - 2.5) < 0.01);
const bonusRing = radii.some(r => Math.abs(r - 6.5) < 0.01);
const halo = radii.some(r => r > 10);
// A garland: one path with several lineTo through the arc's members
const lineTos = calls.filter(c => c.fn === "lineTo").length;

console.log("Lisibilité des deux types de poussière :");
console.log(`  point de ligne (r 2.5)      ${lineDot ? "oui" : "non"}`);
console.log(`  anneau bonus  (r 6.5)       ${bonusRing ? "oui" : "non"}`);
console.log(`  halo pulsant  (r > 10)      ${halo ? "oui" : "non"}`);
console.log(`  fil de guirlande (lineTo)   ${lineTos >= 2 ? "oui (" + lineTos + " segments)" : "non"}`);

// Collect one of each and check the value is announced
e.px = 200; e.py = y + 40;
e.updateDustForTest = null;
e.update(1 / 60);
const first = e.pickups.map(p => p.text + (p.big ? " (gros)" : ""));
e.px = 300; e.py = y + 60;
e.update(1 / 60);
const both = e.pickups.map(p => p.text + (p.big ? " (gros)" : ""));
console.log(`\nValeur annoncée à la collecte : ${both.join(", ") || "aucune"}`);
console.log(`poussière cumulée : ${e.dustEarned}`);
