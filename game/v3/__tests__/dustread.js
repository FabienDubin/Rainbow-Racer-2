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

// Sizes are a player setting now, so the assertions are about RELATIONSHIPS and about
// APPARENT size on a real phone — not about magic radii. This second half exists
// because of Fab's second report, from an iPhone 14 Pro: "les poussières... c'est assez
// rikiki". He was right, and nothing here could have told him so: the old check only
// asked whether a 2.5px radius was still exactly 2.5px.
//
// The canvas is VIEW_W logical pixels wide and fills the screen, so on a 393pt-wide
// iPhone one logical pixel is 393/540 = 0.728pt. That conversion is the whole point:
// 2.6px sounds fine and is 3.8pt across, which is smaller than the dot on an i.
const PT_PER_PX = 393 / C.VIEW_W;
const MIN_DIAMETER_PT = 5; // below this a lit dot stops registering in peripheral vision

const halo = calls.filter(c => c.fn === "arc").some(c => c.args[2] > 10);
// A garland: one path with several lineTo through the arc's members
const lineTos = calls.filter(c => c.fn === "lineTo").length;

// Measured by calling the two draw functions in isolation. Reading the smallest arc in a
// whole frame does not work — Prism's own eye is a smaller circle than any dust mote, and
// an earlier version of this check happily reported HER as the collectible.
const draw = require("./art/draw");
const { DEFAULTS } = require("./settings");
const soloRadii = (fn) => {
  const r = recording();
  const ctx = r.canvas.getContext();
  fn(ctx);
  return r.calls.filter(c => c.fn === "arc").map(c => c.args[2]);
};
const mote = Math.max(...soloRadii(c => draw.drawDustMote(c, 50, 50, 0, DEFAULTS.dustScale)));
const gem = Math.max(...soloRadii(c => draw.drawGarlandGem(c, 50, 50, 0, 1, DEFAULTS.dustScale)));
const motePt = mote * 2 * PT_PER_PX;

console.log("Lisibilité des deux types de poussière (réglages par défaut) :");
console.log(
  `  point de ligne              r ${mote.toFixed(2)}px = ${motePt.toFixed(1)}pt de diamètre ` +
    `sur un iPhone 14 Pro — ${motePt >= MIN_DIAMETER_PT ? "visible" : "TROP PETIT"}`
);
console.log(
  `  guirlande distinguable      ${gem ? `oui (r ${gem.toFixed(1)}, x${(gem / mote).toFixed(1)})` : "NON — les deux types se ressemblent"}`
);
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
