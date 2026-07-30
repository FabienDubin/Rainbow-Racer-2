// The physics changed scale (tangential ceiling 720 -> speeds up to 1400), so the
// hand-tuned "expert" thresholds no longer describe skilled play. Rather than assume a
// skill gradient still exists, re-derive the best release policy and see whether aiming
// the release still beats not aiming it.
const C = require("./proto.constants");
const { ProtoEngine } = require("./proto.engine");
const stub = () => { const n=()=>{}; const c=new Proxy({},{get:(t,k)=>k in t?t[k]:n,set:(t,k,v)=>((t[k]=v),true)}); return {getContext:()=>c,addEventListener:n,removeEventListener:n}; };
const dt = 1/60;
const offVertical = (e) => Math.abs((Math.atan2(e.vx, e.vy) * 180) / Math.PI);

function play(player, seed) {
  let s = seed; const orig = Math.random;
  Math.random = () => ((s = (s*1103515245+12345) & 0x7fffffff)/0x7fffffff);
  let stats = null;
  const e = new ProtoEngine(stub(), st => stats = st);
  for (let f = 0; f < 60*90 && !stats; f++) {
    if (e.anchor === null) { const t = e.pickAnchor(); if (t && player.grab(e,t)) { e.pressed=true; e.pressEdge=true; } }
    else if (player.release(e)) { e.pressed=false; e.releaseEdge=true; }
    e.update(dt); e.pressEdge=false; e.releaseEdge=false;
  }
  Math.random = orig;
  return { alt: stats?stats.altitudeM:Math.round(Math.max(0,e.peakY)/C.PX_PER_METER), time: stats?stats.timeSurvived:90 };
}
const avg = (p) => { const r = Array.from({length:10},(_,i)=>play(p,(i+1)*7919));
  return { alt: Math.round(r.reduce((a,x)=>a+x.alt,0)/10), time: Math.round(r.reduce((a,x)=>a+x.time,0)/10) }; };

const greedy = () => true;
const patient = (e,t) => e.vy <= 60 || t.y > e.py + 120;

console.log("Politique de lâcher (accroche gloutonne)      altitude / survie");
const rows = [];
for (const vy of [200, 350, 500, 700]) {
  for (const ang of [20, 35, 55, 180]) {
    const p = { grab: greedy, release: (e) => e.sweptAngle > C.MIN_SWING_ANGLE && e.vy > vy && offVertical(e) < ang };
    const r = avg(p);
    rows.push({ label: `vy>${vy}, angle<${ang === 180 ? "libre" : ang + "°"}`, ...r });
  }
}
rows.sort((a,b) => b.alt - a.alt);
rows.forEach(r => console.log(`  ${r.label.padEnd(26)} ${String(r.alt).padStart(5)}m / ${r.time}s`));

const best = rows[0];
const unaimed = rows.find(r => r.label.includes("libre") && r.label.startsWith("vy>200"));
console.log(`\nMeilleure politique visée : ${best.label} → ${best.alt}m`);
console.log(`Sans viser du tout        : ${unaimed.label} → ${unaimed.alt}m`);
console.log(`Le fait de viser rapporte : x${(best.alt/Math.max(1,unaimed.alt)).toFixed(1)}`);
