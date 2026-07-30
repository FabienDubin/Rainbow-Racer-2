// Is the telegraph enough to make a bolt genuinely dodgeable?
// A hazard is only a skill if a player who READS it does measurably better than one who
// ignores it. If both take the same number of hits, the telegraph is decoration and the
// bolt is just bad luck wearing a costume.
const C = require("./proto.constants");
const { ProtoEngine } = require("./proto.engine");
const stub = () => { const n=()=>{}; const c=new Proxy({},{get:(t,k)=>k in t?t[k]:n,set:(t,k,v)=>((t[k]=v),true)}); return {getContext:()=>c,addEventListener:n,removeEventListener:n}; };
const dt = 1/60;
const offVertical = (e) => Math.abs((Math.atan2(e.vx, e.vy) * 180) / Math.PI);

// Is a bolt about to strike the lane just above us? Only uses information the player
// can see on screen: the cloud is flashing, and it is in our path.
function laneThreatened(e, lookahead) {
  for (const b of e.bolts) {
    const st = b.state;
    if (st === "dormant" || st === "cooldown") continue;
    const ahead = b.y - e.py;
    if (ahead > -C.BOLT_THICKNESS && ahead < lookahead) return true;
  }
  return false;
}

const RELEASE_AIMED = (e) =>
  e.sweptAngle > C.MIN_SWING_ANGLE && e.vy > 350 && offVertical(e) < 35;

const PLAYERS = {
  "IGNORE les éclairs      ": {
    grab: (e, t) => e.vy <= 60 || t.y > e.py + 120,
    release: RELEASE_AIMED,
  },
  "LIT le télégraphe       ": {
    grab: (e, t) => e.vy <= 60 || t.y > e.py + 120,
    // Holds the swing rather than launching into a lane that is about to go live
    release: (e) => RELEASE_AIMED(e) && !laneThreatened(e, 320),
  },
};

function play(player, seed) {
  let s = seed; const orig = Math.random;
  Math.random = () => ((s = (s*1103515245+12345) & 0x7fffffff)/0x7fffffff);
  let stats = null;
  const e = new ProtoEngine(stub(), st => stats = st);
  for (let f = 0; f < 60*120 && !stats; f++) {
    if (e.anchor === null) { const t = e.pickAnchor(); if (t && player.grab(e,t)) { e.pressed=true; e.pressEdge=true; } }
    else if (player.release(e)) { e.pressed=false; e.releaseEdge=true; }
    e.update(dt); e.pressEdge=false; e.releaseEdge=false;
  }
  Math.random = orig;
  return stats || { altitudeM: Math.round(Math.max(0,e.peakY)/C.PX_PER_METER), hits: e.hits, checkpoints: e.checkpoints, timeSurvived: 120 };
}

console.log(`Éclairs : télégraphe ${C.BOLT_TELEGRAPH}s, frappe ${C.BOLT_STRIKE}s, couloir ${C.BOLT_THICKNESS}px`);
console.log(`Paliers : tous les ${C.CHECKPOINT_EVERY_M}m, recul de ${C.CHECKPOINT_PUSHBACK}px\n`);
const out = {};
for (const [name, p] of Object.entries(PLAYERS)) {
  const runs = Array.from({length:10},(_,i)=>play(p,(i+1)*7919));
  const avg = f => runs.reduce((a,r)=>a+r[f],0)/runs.length;
  const alt = avg("altitudeM"), hits = avg("hits"), cps = avg("checkpoints"), t = avg("timeSurvived");
  out[name.trim()] = { alt, hits };
  console.log(
    `${name} altitude ${alt.toFixed(0).padStart(4)}m  éclairs pris ${hits.toFixed(1).padStart(4)}` +
    `  paliers ${cps.toFixed(1).padStart(4)}  survie ${t.toFixed(0).padStart(3)}s` +
    `  (${(hits/Math.max(1,t)*60).toFixed(1)} touches/min)`
  );
}
const ig = out["IGNORE les éclairs"], rd = out["LIT le télégraphe"];
console.log(`\nLire le télégraphe évite ${((1 - rd.hits/Math.max(0.01,ig.hits))*100).toFixed(0)}% des touches`);
console.log(`et rapporte x${(rd.alt/Math.max(1,ig.alt)).toFixed(2)} en altitude`);
