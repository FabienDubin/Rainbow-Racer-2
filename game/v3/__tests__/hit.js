// Fab: "quand je suis frappé par un éclair, je perds juste ma corde, c'est ça."
// The hit already cost plenty; none of it was visible. This asserts each consequence
// now both HAPPENS and is DRAWN.
global.requestAnimationFrame = () => 0;
global.cancelAnimationFrame = () => {};
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

const y = 200 * C.PX_PER_METER;
const { canvas, calls } = recording();
const e = new ProtoEngine(canvas, () => {});
e.py = y; e.peakY = y; e.camY = y; e.stormY = -1e9;
e.anchors = [{ x: 300, y: y + 40, used: false, skip: false }];
e.anchor = e.anchors[0];
e.ropeLen = 150;
e.vx = 200; e.vy = 600;      // climbing hard, on a rope
e.chain = 7; e.winchCharge = 1; e.flapCharges = 2; e.sweptAngle = 1.2;
e.bolts = [{ x: 270, y, state: "strike", timer: 0 }];

const before = { chain: e.chain, winch: e.winchCharge, vy: e.vy, roped: e.anchor !== null, wings: e.flapCharges };
e.updateBolts(1/60);
const after = { chain: e.chain, winch: e.winchCharge, vy: e.vy, roped: e.anchor !== null, wings: e.flapCharges };

console.log("Conséquences d'une touche :");
console.log(`  corde          ${before.roped ? "accrochée" : "libre"} -> ${after.roped ? "accrochée" : "libre"}`);
console.log(`  chaîne         ${before.chain} -> ${after.chain}`);
console.log(`  treuil         ${before.winch.toFixed(2)} -> ${after.winch.toFixed(2)}`);
console.log(`  vitesse vert.  ${Math.round(before.vy)} -> ${Math.round(after.vy)}  (l'élan vers le haut est annulé)`);
console.log(`  ailes          ${before.wings} -> ${after.wings}`);
console.log(`  étourdi        ${e.stunTime.toFixed(2)}s`);
console.log(`  hit-stop       ${e.hitStop.toFixed(3)}s   flash ${e.hitFlash.toFixed(2)}   shake ${e.shake.toFixed(0)}px`);

e.stunTime = C.STUN_TIME * 0.6; // partway through, so the tumble has rotated
calls.length = 0;
e.draw();
const flash = calls.some(c => c.fn === "set:fillStyle" && String(c.args[0]).startsWith("rgba(255,255,255,") && parseFloat(String(c.args[0]).split(",")[3]) > 0.2);
const stunText = calls.some(c => c.fn === "fillText" && c.args[0] === "ÉTOURDI");
const lossText = calls.some(c => c.fn === "fillText" && String(c.args[0]).includes("chaîne perdue"));
const tumble = calls.some(c => c.fn === "rotate" && Math.abs(c.args[0]) > 0);
const shook = calls.some(c => c.fn === "translate" && (c.args[0] !== 0 || c.args[1] !== 0));
console.log("\nRendu pendant l'étourdissement :");
console.log(`  flash blanc      ${flash ? "oui" : "non"}`);
console.log(`  texte ÉTOURDI    ${stunText ? "oui" : "non"}`);
console.log(`  perte annoncée   ${lossText ? "oui" : "non"}`);
console.log(`  joueur qui vrille ${tumble ? "oui" : "non"}`);
console.log(`  écran secoué      ${shook ? "oui" : "non"}`);

// And the frame really does freeze
const posBefore = e.py;
e.frame(performance.now() + 16);
console.log(`\nHit-stop gèle la simulation : ${e.py === posBefore ? "oui" : "non"}`);
