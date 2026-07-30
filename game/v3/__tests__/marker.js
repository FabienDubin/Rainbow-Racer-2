// Verifies the off-screen marker: it must appear only when the player is outside the
// visible corridor, sit on the correct edge at the player's altitude, and point along
// the direction of travel.
const C = require("./proto.constants");
const { ProtoEngine } = require("./proto.engine");

function recordingCanvas() {
  const calls = [];
  const noop = () => {};
  const ctx = new Proxy({}, {
    get: (t, k) => {
      if (k in t) return t[k];
      if (k === "createLinearGradient") return () => ({ addColorStop: noop });
      return (...args) => { calls.push({ fn: String(k), args }); };
    },
    set: (t, k, v) => ((t[k] = v), true),
  });
  return { canvas: { getContext: () => ctx, addEventListener: noop, removeEventListener: noop }, calls };
}

function probe(px, vx, vy, label) {
  const { canvas, calls } = recordingCanvas();
  const e = new ProtoEngine(canvas, () => {});
  e.stormY = -1e9;
  e.anchors = [];
  e.anchor = null;
  e.px = px; e.py = 0; e.vx = vx; e.vy = vy;
  calls.length = 0;
  e.draw();

  // The marker is the only thing drawing a 13px ring
  const ring = calls.find(c => c.fn === "arc" && c.args[2] === 13);
  const rot = calls.find(c => c.fn === "rotate");
  const translate = calls.filter(c => c.fn === "translate");
  const edge = translate.length ? translate[translate.length - 1].args : null;
  const expectDeg = (Math.atan2(-vy, vx) * 180 / Math.PI).toFixed(0);
  const gotDeg = rot ? (rot.args[0] * 180 / Math.PI).toFixed(0) : "—";
  console.log(
    `${label.padEnd(34)} marqueur ${(ring ? "OUI" : "non").padEnd(4)}` +
    `  bord x=${edge ? String(Math.round(edge[0])).padStart(4) : "  —"}` +
    `  angle ${String(gotDeg).padStart(5)}°  (attendu ${String(expectDeg).padStart(5)}°)`
  );
}

console.log(`VIEW_W=${C.VIEW_W}  WRAP_MARGIN=${C.WRAP_MARGIN}\n`);
probe(270, 300, 400, "au centre de l'écran");
probe(-95, -520, 340, "sorti à gauche, monte à gauche");
probe(-95, -520, -340, "sorti à gauche, descend");
probe(C.VIEW_W + 100, 600, 300, "sorti à droite, monte à droite");
probe(0, 100, 100, "pile sur le bord gauche");
