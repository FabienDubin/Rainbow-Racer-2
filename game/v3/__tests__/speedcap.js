// Is speed compounding? The release kick is multiplicative and MAX_SWING_SPEED only
// clamps while the rope is taut — free flight was previously capped only by the walls,
// which are now gone.
const C = require("./proto.constants");
const { ProtoEngine } = require("./proto.engine");
const stub = () => { const n=()=>{}; const c=new Proxy({},{get:(t,k)=>k in t?t[k]:n,set:(t,k,v)=>((t[k]=v),true)}); return {getContext:()=>c,addEventListener:n,removeEventListener:n}; };
const dt = 1/60;
const player = { grab: () => true, release: (e) => e.sweptAngle > C.MIN_SWING_ANGLE && e.vy > 250 };

for (const s0 of [7919, 15838, 23757]) {
  let seed = s0;
  const orig = Math.random;
  Math.random = () => ((seed = (seed*1103515245+12345) & 0x7fffffff)/0x7fffffff);
  let stats = null;
  const e = new ProtoEngine(stub(), st => stats = st);
  let maxSpeed = 0, maxVx = 0;
  const speedAt = [];
  for (let f = 0; f < 60*60 && !stats; f++) {
    if (e.anchor === null) { const t = e.pickAnchor(); if (t && player.grab(e,t)) { e.pressed=true; e.pressEdge=true; } }
    else if (player.release(e)) { e.pressed=false; e.releaseEdge=true; }
    e.update(dt); e.pressEdge=false; e.releaseEdge=false;
    const sp = Math.hypot(e.vx, e.vy);
    maxSpeed = Math.max(maxSpeed, sp);
    maxVx = Math.max(maxVx, Math.abs(e.vx));
    if (f % 300 === 0) speedAt.push(Math.round(sp));
  }
  Math.random = orig;
  console.log(
    `seed ${String(s0).padStart(5)}  vitesse max ${String(Math.round(maxSpeed)).padStart(5)}` +
    `  |vx| max ${String(Math.round(maxVx)).padStart(5)}` +
    `  altitude ${stats?stats.altitudeM:'-'}m  toutes les 5s: ${speedAt.join(', ')}`
  );
}
console.log(`\nMAX_SWING_SPEED (appliqué seulement corde tendue) = ${C.MAX_SWING_SPEED}`);
console.log(`MAX_FALL_SPEED (vy seulement) = ${C.MAX_FALL_SPEED}`);
