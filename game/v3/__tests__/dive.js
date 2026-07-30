// Fab's note: "si je redescends je prends de la vitesse pour remonter plus haut".
// This measures exactly that — grab a ring BELOW you, fall past it, and check the
// dive converts into a higher swing. Compares against grabbing the same ring from
// rest, so the gain is attributable to the dive and nothing else.

const { ProtoEngine } = require("./proto.engine");
const C = require("./proto.constants");

function stubCanvas() {
  const noop = () => {};
  const ctx = new Proxy({}, { get: (t, k) => (k in t ? t[k] : noop), set: (t, k, v) => ((t[k] = v), true) });
  return { getContext: () => ctx, addEventListener: noop, removeEventListener: noop };
}

const dt = 1 / 60;

// entryVy < 0 means we arrive at the ring already falling.
function run(entryVy, belowBy, holdFrames) {
  const e = new ProtoEngine(stubCanvas(), () => {});
  e.stormY = -1e9;
  e.px = C.VIEW_W / 2;
  e.py = 0;
  e.vx = 0;
  e.vy = entryVy;
  // Ring sits below the player, offset sideways so there is a tangent to whip into
  e.anchors = [{ x: C.VIEW_W / 2 + 70, y: -belowBy, used: false, skip: false }];

  e.pressed = true;
  e.pressEdge = true;
  e.update(dt);
  e.pressEdge = false;
  if (e.anchor === null) return null;

  let peakWhileHeld = e.py;
  for (let i = 0; i < holdFrames && e.anchor !== null; i++) {
    e.update(dt);
    peakWhileHeld = Math.max(peakWhileHeld, e.py);
  }
  if (e.anchor !== null) {
    e.pressed = false;
    e.releaseEdge = true;
    e.update(dt);
    e.releaseEdge = false;
  }
  const exitSpeed = Math.hypot(e.vx, e.vy);
  let guard = 0;
  while (e.vy > 0 && guard++ < 900) e.update(dt);
  return { peak: e.py, exitSpeed, quality: e.lastReleaseQuality, whip: e.whipFlash };
}

function best(entryVy, belowBy) {
  let b = null;
  for (let hold = 1; hold <= 160; hold++) {
    const r = run(entryVy, belowBy, hold);
    if (r && (!b || r.peak > b.peak)) b = r;
  }
  return b;
}

console.log("Plonger sur un anneau situé EN DESSOUS de soi");
console.log("(hauteur finale mesurée depuis le point d'accroche)\n");
console.log("anneau à   arrivée      hauteur   vitesse    gain vs");
console.log("            (px/s)      finale    sortie     à l'arrêt");

for (const belowBy of [80, 160, 240]) {
  const atRest = best(0, belowBy);
  if (!atRest) { console.log(`  -${belowBy}px  hors de portée`); continue; }
  for (const entryVy of [0, -300, -600, -900]) {
    const r = best(entryVy, belowBy);
    if (!r) continue;
    const gain = ((r.peak / atRest.peak - 1) * 100).toFixed(0);
    console.log(
      `  -${String(belowBy).padEnd(4)}px ${String(entryVy).padStart(8)}` +
        `${(r.peak / C.PX_PER_METER).toFixed(1).padStart(11)}m` +
        `${Math.round(r.exitSpeed).toString().padStart(10)}` +
        `${(entryVy === 0 ? "  (référence)" : `${gain > 0 ? "+" : ""}${gain}%`).padStart(13)}`
    );
  }
  console.log();
}

console.log(`WHIP_RECOVERY = ${C.WHIP_RECOVERY}`);
