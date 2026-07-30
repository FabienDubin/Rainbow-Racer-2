// Verifies the two grab types get different arc lengths, and that the grip is always
// eventually lost — Fab's two constraints.
const C = require("./proto.constants");
const { ProtoEngine } = require("./proto.engine");
const stub = () => { const n=()=>{}; const c=new Proxy({},{get:(t,k)=>k in t?t[k]:n,set:(t,k,v)=>((t[k]=v),true)}); return {getContext:()=>c,addEventListener:n,removeEventListener:n}; };
const dt = 1/60;
for (const [label, offset] of [["ancre AU-DESSUS (porté)", +170], ["ancre EN DESSOUS (plongeon)", -170]]) {
  const e = new ProtoEngine(stub(), () => {});
  e.stormY = -1e9; e.px = C.VIEW_W/2; e.py = 0; e.vx = 0; e.vy = 0;
  e.anchors = [{ x: C.VIEW_W/2 + 30, y: offset, used:false, skip:false }];
  e.pressed = true; e.pressEdge = true; e.update(dt); e.pressEdge = false;
  if (!e.anchor) { console.log(`${label.padEnd(30)} hors de portée`); continue; }
  const dived = e.divedOn, limit = e.attachLimit;
  let f = 0;
  while (e.anchor !== null && f < 60*12) { e.update(dt); f++; }
  console.log(`${label.padEnd(30)} divedOn=${String(dived).padEnd(5)} limite=${limit}s  grip perdu à ${(f*dt).toFixed(2)}s`);
}
