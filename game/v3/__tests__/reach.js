// Bonus garlands sit at ROPE_MIN + 55 from their anchor, but the winch reels you IN
// toward ROPE_MIN while you swing. So: are they hard because reaching them takes skill,
// or hard because the geometry quietly puts them outside your arc?
//
// "Hard by design" = there is a deliberate action that reaches them.
// "Hard by accident" = only a lucky grab distance ever gets close.
const C = require("./proto.constants");
const { ProtoEngine } = require("./proto.engine");
const stub = () => { const n=()=>{}; const c=new Proxy({},{get:(t,k)=>k in t?t[k]:n,set:(t,k,v)=>((t[k]=v),true)}); return {getContext:()=>c,addEventListener:n,removeEventListener:n}; };
const dt = 1/60;
const GARLAND_R = C.ROPE_MIN + 55;

function swing(grabDist) {
  const e = new ProtoEngine(stub(), () => {});
  e.stormY = -1e9;
  e.px = C.VIEW_W / 2; e.py = 0; e.vx = 0; e.vy = 0;
  const a = { x: C.VIEW_W / 2 + 30, y: grabDist, used: false, skip: false };
  e.anchors = [a];
  e.pressed = true; e.pressEdge = true; e.update(dt); e.pressEdge = false;
  if (!e.anchor) return null;

  let framesInBand = 0, minR = Infinity, maxR = 0;
  for (let f = 0; f < 200 && e.anchor !== null; f++) {
    e.update(dt);
    const r = Math.hypot(e.px - a.x, e.py - a.y);
    minR = Math.min(minR, r); maxR = Math.max(maxR, r);
    // within collection radius of the garland's circle
    if (Math.abs(r - GARLAND_R) < C.DUST_RADIUS) framesInBand++;
  }
  return { framesInBand, seconds: framesInBand * dt, minR, maxR };
}

console.log(`Guirlande à ${GARLAND_R}px de l'ancre · rayon de collecte ${C.DUST_RADIUS}px`);
console.log(`Treuil : de la distance d'accroche vers ${C.ROPE_MIN}px, budget ${C.WINCH_BUDGET}px\n`);
console.log("accroche à   rayon parcouru    temps dans la bande de la guirlande");
for (const d of [150, 200, 240, 290, 340]) {
  const r = swing(d);
  if (!r) { console.log(`${String(d).padStart(9)}px   hors de portée`); continue; }
  const verdict = r.seconds > 0.25 ? "large" : r.seconds > 0.05 ? "étroite" : "JAMAIS";
  console.log(
    `${String(d).padStart(9)}px   ${Math.round(r.minR)}–${Math.round(r.maxR)}px`.padEnd(30) +
    `${r.seconds.toFixed(2)}s  (${verdict})`
  );
}
console.log("\nLecture : si seules les accroches lointaines touchent la bande, la guirlande");
console.log("est atteignable en visant une ancre éloignée — donc un choix, pas de la chance.");
