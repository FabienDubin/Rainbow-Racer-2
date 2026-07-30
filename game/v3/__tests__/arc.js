// Fab's exact scenario, in clock positions relative to the anchor:
// grab an anchor BELOW you (it sits at 6 o'clock from you), fall past it, swing
// through the bottom, and come back up the far side. Two things must hold:
//   1. the grapple survives the whole arc — no timer tearing it away mid-swing
//   2. the speed earned falling is still there on the way back up, so you rise higher
//
// Prints the trajectory by clock position so the swing can be read at a glance.

const C = require("./proto.constants");
const { ProtoEngine } = require("./proto.engine");

function stubCanvas() {
  const noop = () => {};
  const ctx = new Proxy({}, { get: (t, k) => (k in t ? t[k] : noop), set: (t, k, v) => ((t[k] = v), true) });
  return { getContext: () => ctx, addEventListener: noop, removeEventListener: noop };
}

// atan2-based clock face: 12 = above the anchor, 6 = below, 9 = left, 3 = right.
function clockOf(e, a) {
  const dx = e.px - a.x;
  const dy = e.py - a.y;
  const deg = (Math.atan2(dx, dy) * 180) / Math.PI; // 0 = straight up
  const h = ((deg / 30) + 12) % 12;
  const hh = Math.floor(h) === 0 ? 12 : Math.floor(h);
  return `${hh}h`;
}

const dt = 1 / 60;

function ride(anchorBelowBy, seconds) {
  const e = new ProtoEngine(stubCanvas(), () => {});
  e.stormY = -1e9;
  e.px = C.VIEW_W / 2;
  e.py = 0;
  e.vx = 0;
  e.vy = 0;
  const a = { x: C.VIEW_W / 2 + 30, y: -anchorBelowBy, used: false, skip: false };
  e.anchors = [a];

  e.pressed = true;
  e.pressEdge = true;
  e.update(dt);
  e.pressEdge = false;
  if (e.anchor === null) return null;

  const samples = [];
  let lost = null;
  let peakAfterBottom = -Infinity;
  let seenBottom = false;

  for (let f = 0; f < seconds * 60; f++) {
    e.update(dt);
    if (e.anchor === null && lost === null) lost = ((f + 1) * dt).toFixed(2);
    const c = e.anchor ? clockOf(e, a) : "—";
    if (c === "6h") seenBottom = true;
    if (seenBottom) peakAfterBottom = Math.max(peakAfterBottom, e.py);
    if (f % 12 === 0) {
      samples.push(
        `   ${((f + 1) * dt).toFixed(2)}s  ${c.padStart(3)}  ` +
          `hauteur ${(e.py / C.PX_PER_METER).toFixed(1).padStart(6)}m  ` +
          `vitesse ${Math.round(Math.hypot(e.vx, e.vy)).toString().padStart(4)}  ` +
          `${e.anchor ? "accroché" : "LIBRE"}`
      );
    }
  }
  return { samples, lost, peakAfterBottom };
}

for (const below of [180, 260]) {
  console.log(`\n=== Ancre à ${below}px SOUS le joueur, on ne lâche jamais ===`);
  const r = ride(below, 3.2);
  if (!r) { console.log("   hors de portée"); continue; }
  r.samples.forEach((s) => console.log(s));
  console.log(
    `   grappin perdu : ${r.lost ? r.lost + "s" : "jamais (bien)"}` +
      `   |  point le plus haut après 6h : ${(r.peakAfterBottom / C.PX_PER_METER).toFixed(1)}m`
  );
}

console.log(`\nMAX_ATTACH_TIME=${C.MAX_ATTACH_TIME}s  SWING_PUMP=${C.SWING_PUMP}  WHIP_RECOVERY=${C.WHIP_RECOVERY}`);
