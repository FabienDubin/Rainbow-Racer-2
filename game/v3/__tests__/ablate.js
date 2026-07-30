// Which new hazard flattened the skill gradient? Turning each off in isolation answers it
// in one run, where guessing would take several.
const C = require("./proto.constants");
const { ProtoEngine } = require("./proto.engine");
const stub = () => { const n=()=>{}; const c=new Proxy({},{get:(t,k)=>k in t?t[k]:n,set:(t,k,v)=>((t[k]=v),true)}); return {getContext:()=>c,addEventListener:n,removeEventListener:n}; };
const dt = 1/60;
const off = (e) => Math.abs((Math.atan2(e.vx, e.vy) * 180) / Math.PI);
const P = {
  expert: { grab: (e,t) => e.vy <= 60 || t.y > e.py + 120,
            release: (e) => e.sweptAngle > C.MIN_SWING_ANGLE && e.vy > 350 && off(e) < 35 },
  average:{ grab: () => true,
            release: (e) => e.sweptAngle > C.MIN_SWING_ANGLE && e.vy > 200 },
};

function play(p, seed, strip) {
  let s = seed; const orig = Math.random;
  Math.random = () => ((s = (s*1103515245+12345) & 0x7fffffff)/0x7fffffff);
  let stats = null;
  const e = new ProtoEngine(stub(), st => stats = st);
  for (let f = 0; f < 60*90 && !stats; f++) {
    if (strip.gusts) e.gusts.length = 0;
    if (strip.raiders) e.raiders.length = 0;
    if (strip.bolts) e.bolts.length = 0;
    if (e.anchor === null) {
      const t = e.pickAnchor();
      if (t && p.grab(e,t)) { e.pressed = true; e.pressEdge = true; }
    } else if (p.release(e)) { e.pressed = false; e.releaseEdge = true; }
    e.update(dt); e.pressEdge = false; e.releaseEdge = false;
  }
  Math.random = orig;
  return { alt: stats ? stats.altitudeM : Math.round(Math.max(0,e.peakY)/C.PX_PER_METER),
           time: stats ? stats.timeSurvived : 90 };
}
const avg = (p, strip) => {
  const r = Array.from({length:24},(_,i)=>play(p,(i+1)*7919,strip));
  return { alt: Math.round(r.reduce((a,x)=>a+x.alt,0)/24), time: Math.round(r.reduce((a,x)=>a+x.time,0)/24) };
};

const CASES = [
  ["tout actif          ", {}],
  ["sans Bourrasques    ", { gusts: true }],
  ["sans Pilleurs       ", { raiders: true }],
  ["sans Éclairs        ", { bolts: true }],
  ["sans aucun des trois", { gusts: true, raiders: true, bolts: true }],
];
console.log("configuration          expert        moyen        gradient");
for (const [label, strip] of CASES) {
  const ex = avg(P.expert, strip), av = avg(P.average, strip);
  console.log(
    `${label}  ${(ex.alt+"m/"+ex.time+"s").padStart(11)}  ${(av.alt+"m/"+av.time+"s").padStart(11)}` +
    `  x${(ex.alt/Math.max(1,av.alt)).toFixed(2)}`
  );
}
