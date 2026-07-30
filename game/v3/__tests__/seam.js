// Can the player grab an anchor "through" the screen seam, and get yanked across?
const C = require("./proto.constants");
const { ProtoEngine } = require("./proto.engine");
const stub = () => { const n=()=>{}; const c=new Proxy({},{get:(t,k)=>k in t?t[k]:n,set:(t,k,v)=>((t[k]=v),true)}); return {getContext:()=>c,addEventListener:n,removeEventListener:n}; };
const dt = 1/60;

function test(px, anchorX, label) {
  const e = new ProtoEngine(stub(), () => {});
  e.stormY = -1e9;
  e.px = px; e.py = 0; e.vx = 0; e.vy = 0;
  e.anchors = [{ x: anchorX, y: 60, used:false, skip:false }];
  const picked = e.pickAnchor();
  const direct = Math.abs(anchorX - px);
  if (!picked) { console.log(`${label.padEnd(40)} pas d'accroche (direct ${direct.toFixed(0)}px)`); return; }
  e.pressed = true; e.pressEdge = true;
  const before = e.px;
  for (let i = 0; i < 30; i++) { e.update(dt); e.pressEdge = false; }
  const jumped = Math.abs(e.px - before) > 250;
  console.log(
    `${label.padEnd(40)} accroche OUI  distance directe ${String(Math.round(direct)).padStart(3)}px` +
    `  x: ${Math.round(before)} -> ${Math.round(e.px)}${jumped ? "   << TÉLÉPORTÉ" : ""}`
  );
}

console.log(`VIEW_W=${C.VIEW_W}  WRAP_MARGIN=${C.WRAP_MARGIN}  portée=${C.TETHER_RANGE}  demi-tour=${(C.VIEW_W+2*C.WRAP_MARGIN)/2}\n`);
test(-120, 80,  "marge gauche -> ancre proche gauche");
test(-120, 470, "marge gauche -> ancre a l'extreme DROITE");
test(660, 90,   "marge droite -> ancre a l'extreme GAUCHE");
test(270, 300,  "centre -> ancre proche (temoin)");
