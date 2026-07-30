// Every visual in the game, as pure drawing functions. The engine owns simulation and
// calls in here to render — so art can be reworked without touching a line of physics.
//
// Direction: flat vector shapes, long gradients, layered silhouettes and rim light.
// Everything, Prism included, is drawn — no bitmaps at all. Reusing the V1 unicorn sprite
// seemed like nice continuity, but a soft cartoon PNG sitting on faceted vector art simply
// clashed, and Fab called it: "elle va pas du tout avec le reste". Continuity now lives in
// the palette and the spirit rather than in a reused file.

import { STORM_HAZE } from "../proto.constants";
import { SkyState, SPECTRUM } from "./palette";

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

// Samples the spectrum as a continuous loop, so a gradient can be offset over time and
// flow smoothly instead of stepping between six fixed bands.
function spectrumAt(t: number): string {
  const n = SPECTRUM.length;
  const x = ((t % 1) + 1) % 1;
  const i = Math.floor(x * n);
  const f = x * n - i;
  const a = SPECTRUM[i % n];
  const b = SPECTRUM[(i + 1) % n];
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const mix = (sa: number, sb: number) => Math.round(sa * (1 - f) + sb * f);
  return `rgb(${mix((pa >> 16) & 255, (pb >> 16) & 255)},${mix((pa >> 8) & 255, (pb >> 8) & 255)},${mix(pa & 255, pb & 255)})`;
}

export interface Camera {
  /** World Y at the centre of the view. */
  camY: number;
  viewW: number;
  viewH: number;
  /** World Y -> screen Y. */
  toScreen: (worldY: number) => number;
}

// ---------------------------------------------------------------- sky & depth

interface Star {
  x: number;
  y: number; // 0..1 of view height, parallaxed by camera
  r: number;
  tw: number;
}

let starField: Star[] | null = null;

function stars(count: number): Star[] {
  if (starField) return starField;
  starField = Array.from({ length: count }, (_, i) => ({
    x: ((i * 2654435761) % 10000) / 10000,
    y: ((i * 40503) % 10000) / 10000,
    r: 0.4 + (((i * 7919) % 100) / 100) * 1.4,
    tw: ((i * 104729) % 628) / 100,
  }));
  return starField;
}

export function drawSky(ctx: CanvasRenderingContext2D, cam: Camera, sky: SkyState, time: number): void {
  const g = ctx.createLinearGradient(0, 0, 0, cam.viewH);
  g.addColorStop(0, sky.skyTop);
  g.addColorStop(1, sky.skyBottom);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, cam.viewW, cam.viewH);

  if (sky.stars > 0.02) {
    for (const s of stars(90)) {
      // Slow vertical drift so the starfield feels attached to the world, not the screen
      const y = ((s.y + (cam.camY * 0.00002)) % 1) * cam.viewH;
      const twinkle = 0.55 + 0.45 * Math.sin(time * 1.6 + s.tw);
      ctx.globalAlpha = sky.stars * twinkle * 0.9;
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(s.x * cam.viewW, y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}

// Two silhouette layers of cloud banks at different parallax rates. Depth is what stops a
// gradient from looking like a gradient.
export function drawParallax(ctx: CanvasRenderingContext2D, cam: Camera, sky: SkyState): void {
  const layers: [string, number, number, number][] = [
    // colour, parallax factor, base height fraction, amplitude
    [sky.far, 0.06, 0.72, 46],
    [sky.near, 0.16, 0.88, 66],
  ];
  for (const [colour, factor, baseFrac, amp] of layers) {
    const shift = -cam.camY * factor;
    ctx.fillStyle = colour;
    ctx.beginPath();
    ctx.moveTo(0, cam.viewH);
    for (let x = 0; x <= cam.viewW; x += 14) {
      const w = (x + shift) * 0.0055;
      const y =
        cam.viewH * baseFrac +
        Math.sin(w) * amp +
        Math.sin(w * 2.3 + 1.7) * amp * 0.45 +
        Math.sin(w * 0.6) * amp * 0.5;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(cam.viewW, cam.viewH);
    ctx.closePath();
    ctx.fill();
  }
}

// ---------------------------------------------------------------- the tether

// The rope is the game's title made literal: a rainbow arc. Drawn as stacked offset
// strokes so it reads as one ribbon of spectrum rather than six separate lines.
export function drawTether(
  ctx: CanvasRenderingContext2D,
  ax: number,
  ay: number,
  px: number,
  py: number,
  glow: string,
  time: number
): void {
  const dx = px - ax;
  const dy = py - ay;
  const len = Math.hypot(dx, dy) || 1;
  // A gentle sag makes it read as a rope under load instead of a laser
  const sag = Math.min(20, len * 0.07);
  const mx = (ax + px) / 2;
  const my = (ay + py) / 2 + sag;

  // ONE ribbon with the spectrum flowing along it, rather than six stacked strokes.
  // Stacked bands read as separate lines up close; a single moving gradient reads as one
  // piece of rainbow, which is what the thing is supposed to be.
  const g = ctx.createLinearGradient(ax, ay, px, py);
  const STOPS = 14;
  const drift = time * 0.32;
  for (let i = 0; i <= STOPS; i++) {
    g.addColorStop(i / STOPS, spectrumAt(i / STOPS - drift));
  }

  ctx.save();
  ctx.lineCap = "round";
  ctx.shadowColor = glow;
  ctx.shadowBlur = 12;

  // A soft wide pass underneath gives the ribbon body and a halo
  ctx.strokeStyle = g;
  ctx.globalAlpha = 0.32;
  ctx.lineWidth = 11;
  ctx.beginPath();
  ctx.moveTo(ax, ay);
  ctx.quadraticCurveTo(mx, my, px, py);
  ctx.stroke();

  // The ribbon itself
  ctx.globalAlpha = 1;
  ctx.lineWidth = 5.5;
  ctx.beginPath();
  ctx.moveTo(ax, ay);
  ctx.quadraticCurveTo(mx, my, px, py);
  ctx.stroke();

  // A thin bright core sells it as light rather than paint
  ctx.shadowBlur = 0;
  ctx.strokeStyle = "rgba(255,255,255,0.75)";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(ax, ay);
  ctx.quadraticCurveTo(mx, my, px, py);
  ctx.stroke();
  ctx.restore();
}

// An anchor is a cut prism: a faceted diamond that catches the band's light. Used anchors
// keep a lit core so your route reads behind you.
export function drawAnchor(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  light: string,
  used: boolean,
  highlighted: boolean,
  skip: boolean,
  time: number
): void {
  const r = skip ? 13 : 10;
  const spin = time * 0.6 + x * 0.01;

  if (highlighted) {
    ctx.globalAlpha = 0.35 + 0.25 * Math.sin(time * 5);
    ctx.strokeStyle = light;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(x, y, r + 9, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(spin);
  ctx.shadowColor = light;
  ctx.shadowBlur = highlighted ? 18 : 10;

  // Facets: a bright top-left face and a darker bottom-right one give it volume
  ctx.beginPath();
  ctx.moveTo(0, -r);
  ctx.lineTo(r * 0.72, 0);
  ctx.lineTo(0, r);
  ctx.lineTo(-r * 0.72, 0);
  ctx.closePath();
  const g = ctx.createLinearGradient(-r, -r, r, r);
  g.addColorStop(0, "#ffffff");
  g.addColorStop(0.5, light);
  g.addColorStop(1, used ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.22)");
  ctx.fillStyle = g;
  ctx.fill();

  ctx.strokeStyle = "rgba(255,255,255,0.9)";
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // A skip rung is the high one worth aiming for — give it a second ring of facets
  if (skip) {
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.5);
    ctx.lineTo(r * 0.36, 0);
    ctx.lineTo(0, r * 0.5);
    ctx.lineTo(-r * 0.36, 0);
    ctx.closePath();
    ctx.strokeStyle = "rgba(255,255,255,0.7)";
    ctx.stroke();
  }
  ctx.restore();
}

// ---------------------------------------------------------------- collectibles

export function drawDustMote(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  time: number
): void {
  const tw = 0.6 + 0.4 * Math.sin(time * 3 + x * 0.08);
  ctx.save();
  ctx.shadowColor = "#ffe9a8";
  ctx.shadowBlur = 6;
  ctx.fillStyle = `rgba(255,236,176,${0.75 * tw})`;
  ctx.beginPath();
  ctx.arc(x, y, 2.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// A garland gem: bigger, spectrum-lit, with a breathing halo so it is spotted early.
export function drawGarlandGem(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  time: number,
  seed: number
): void {
  const pulse = 0.5 + 0.5 * Math.sin(time * 3.4 + seed * 0.6);
  const colour = SPECTRUM[Math.floor(seed) % SPECTRUM.length];

  ctx.save();
  ctx.globalAlpha = 0.2 + pulse * 0.3;
  ctx.strokeStyle = colour;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(x, y, 11 + pulse * 3.5, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 1;

  ctx.shadowColor = colour;
  ctx.shadowBlur = 14;
  ctx.translate(x, y);
  ctx.rotate(time * 1.1 + seed);
  ctx.beginPath();
  ctx.moveTo(0, -7);
  ctx.lineTo(5, 0);
  ctx.lineTo(0, 7);
  ctx.lineTo(-5, 0);
  ctx.closePath();
  const g = ctx.createLinearGradient(-6, -6, 6, 6);
  g.addColorStop(0, "#ffffff");
  g.addColorStop(1, colour);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.restore();
}

export function drawGarlandThread(
  ctx: CanvasRenderingContext2D,
  points: { x: number; y: number }[]
): void {
  if (points.length < 2) return;
  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.3)";
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 5]);
  ctx.beginPath();
  points.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
  ctx.stroke();
  ctx.restore();
}

// ---------------------------------------------------------------- hazards

// A thunderhead: a lumpy silhouette that brightens as it charges, then throws a jagged
// bolt across its lane. The telegraph is the mechanic, so charging has to be unmissable.
export function drawThundercloud(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  state: "dormant" | "telegraph" | "strike" | "cooldown",
  charge: number,
  viewW: number,
  time: number
): void {
  const lit = state === "telegraph" ? charge : state === "strike" ? 1 : 0;

  if (state === "telegraph") {
    // The lane it is about to take, drawn faint and tightening
    ctx.save();
    ctx.globalAlpha = 0.2 + charge * 0.5;
    ctx.strokeStyle = "#ffe9a8";
    ctx.lineWidth = 1 + charge * 2;
    ctx.setLineDash([10, 12 - charge * 8]);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(viewW, y);
    ctx.stroke();
    ctx.restore();
  }

  if (state === "strike") {
    ctx.save();
    const g = ctx.createLinearGradient(0, y - 26, 0, y + 26);
    g.addColorStop(0, "rgba(255,255,255,0)");
    g.addColorStop(0.5, "rgba(255,246,214,0.5)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, y - 26, viewW, 52);

    // Jagged bolt across the lane
    ctx.strokeStyle = "#fffbe8";
    ctx.lineWidth = 3.5;
    ctx.shadowColor = "#fff3b0";
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.moveTo(0, y);
    for (let bx = 0; bx <= viewW; bx += 34) {
      const jitter = Math.sin(bx * 0.7 + time * 60) * 7;
      ctx.lineTo(bx, y + jitter);
    }
    ctx.stroke();
    ctx.restore();
  }

  // The cloud body — overlapping blobs, dark with a lit underside when charged
  ctx.save();
  ctx.shadowColor = lit > 0 ? "#fff0b8" : "transparent";
  ctx.shadowBlur = lit * 26;
  const body = lit > 0 ? `rgb(${70 + lit * 120},${66 + lit * 110},${92 + lit * 90})` : "#2f2c44";
  ctx.fillStyle = body;
  const blobs: [number, number, number, number][] = [
    [-24, 2, 20, 13],
    [0, -6, 26, 17],
    [24, 3, 19, 12],
  ];
  for (const [ox, oy, rx, ry] of blobs) {
    ctx.beginPath();
    ctx.ellipse(x + ox, y + oy, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// A vertical current. Streaks race up or down through the band, tinted warm for a lift and
// cold for a sink, so which kind it is reads from across the screen.
export function drawGust(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  dir: number,
  time: number
): void {
  const lift = dir > 0;
  const tint = lift ? "255,238,190" : "150,180,255";
  const left = x - width / 2;
  ctx.save();

  // Soft column, faded at both ends so it feels like air rather than a box
  const g = ctx.createLinearGradient(0, y - height / 2, 0, y + height / 2);
  g.addColorStop(0, `rgba(${tint},0)`);
  g.addColorStop(0.5, `rgba(${tint},0.15)`);
  g.addColorStop(1, `rgba(${tint},0)`);
  ctx.fillStyle = g;
  ctx.fillRect(left, y - height / 2, width, height);

  // Edges, so its extent is unmistakable — you have to be able to aim for it
  ctx.strokeStyle = `rgba(${tint},0.4)`;
  ctx.lineWidth = 1.5;
  ctx.setLineDash([7, 9]);
  ctx.beginPath();
  ctx.moveTo(left, y - height / 2);
  ctx.lineTo(left, y + height / 2);
  ctx.moveTo(left + width, y - height / 2);
  ctx.lineTo(left + width, y + height / 2);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.strokeStyle = `rgba(${tint},0.8)`;
  ctx.lineCap = "round";
  for (let i = 0; i < 9; i++) {
    const lane = left + 12 + ((i * 47) % (width - 24));
    const speed = 300 + (i % 3) * 150;
    const len = 24 + (i % 4) * 14;
    const span = height + len;
    const raw = (time * speed + i * 71) % span;
    const sy = lift ? y + height / 2 - raw : y - height / 2 + raw;
    ctx.globalAlpha = 0.24 + ((i * 41) % 30) / 100;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(lane, sy);
    ctx.lineTo(lane + Math.sin(time * 3 + i) * 2.5, sy + (lift ? len : -len));
    ctx.stroke();
  }

  // Chevrons stacked up the column: which way it takes you, at a glance
  ctx.globalAlpha = 0.65;
  ctx.strokeStyle = `rgb(${tint})`;
  ctx.lineWidth = 2.4;
  for (const cy of [-height / 3, 0, height / 3]) {
    ctx.beginPath();
    ctx.moveTo(x - 7, y + cy + (lift ? 5 : -5));
    ctx.lineTo(x, y + cy + (lift ? -5 : 5));
    ctx.lineTo(x + 7, y + cy + (lift ? 5 : -5));
    ctx.stroke();
  }
  ctx.restore();
}

// A magpie. Asleep it is a dark silhouette; awake it opens its wings and comes for your
// dust. It costs you what you have gathered rather than your life, which stings more.
export function drawRaider(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  awake: boolean,
  fleeing: boolean,
  flap: number,
  towardX: number
): void {
  const face = towardX >= 0 ? 1 : -1;
  const beat = awake ? Math.sin(flap) : Math.sin(flap * 0.25) * 0.3;

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(face, 1);
  // Fleeing, it fades as it leaves — you can see the threat is over rather than guessing
  ctx.globalAlpha = fleeing ? 0.7 : 1;

  // Wings behind
  ctx.fillStyle = "#2a2740";
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(-1, -2);
    ctx.quadraticCurveTo(-12, -8 + beat * 9 * side, -20, -3 + beat * 12 * side);
    ctx.quadraticCurveTo(-11, 1 + beat * 5 * side, -1, 2);
    ctx.closePath();
    ctx.fill();
  }

  // Body and head
  ctx.fillStyle = "#332f4d";
  ctx.beginPath();
  ctx.ellipse(0, 0, 11, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(8, -4, 4.6, 0, Math.PI * 2);
  ctx.fill();

  // Beak, and a magpie's white flash on the flank
  ctx.fillStyle = "#ffd166";
  ctx.beginPath();
  ctx.moveTo(11.5, -4);
  ctx.lineTo(18, -2.6);
  ctx.lineTo(11.5, -1.4);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.82)";
  ctx.beginPath();
  ctx.ellipse(-2, 1.5, 5, 3, -0.2, 0, Math.PI * 2);
  ctx.fill();

  // A stolen mote in the beak, so what just happened is legible
  if (fleeing) {
    ctx.fillStyle = "#ffd166";
    ctx.beginPath();
    ctx.arc(19, -2.6, 2.6, 0, Math.PI * 2);
    ctx.fill();
  }

  // Eye: red and open once it has seen you
  ctx.fillStyle = awake ? "#ff6b6b" : "rgba(255,255,255,0.55)";
  ctx.beginPath();
  ctx.arc(9.4, -5, 1.3, 0, Math.PI * 2);
  ctx.fill();

  // Tail
  ctx.strokeStyle = "#2a2740";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-10, 0);
  ctx.lineTo(-20, 3 + beat * 2);
  ctx.stroke();
  ctx.restore();
}

// Le Grondement: a rising mass of storm with a turbulent lip, not a flat band. It is the
// pacer of the whole game, so it has to feel like weather closing in.
export function drawStorm(
  ctx: CanvasRenderingContext2D,
  cam: Camera,
  topY: number,
  time: number,
  gapM: number
): void {
  // The lip can sit below the view while the run is going well. Draw the cloud MASS above
  // it anyway — anvil tops, haze, a glow — or the threat only exists in the frame you die.
  if (topY > cam.viewH + STORM_HAZE) return;

  // Haze above the lip: faint when you are safe, thick when it is about to have you
  const near = clamp01(1 - (topY - cam.viewH) / STORM_HAZE);
  if (topY > cam.viewH - 10) {
    const haze = ctx.createLinearGradient(0, topY - STORM_HAZE, 0, topY);
    haze.addColorStop(0, "rgba(46,22,74,0)");
    haze.addColorStop(1, `rgba(40,18,66,${(0.34 + 0.3 * near).toFixed(3)})`);
    ctx.fillStyle = haze;
    ctx.fillRect(0, topY - STORM_HAZE, cam.viewW, STORM_HAZE + 4);

    // Anvil tops boiling up out of it, so the mass reads as cloud and not as a gradient
    ctx.save();
    ctx.fillStyle = `rgba(58,28,92,${(0.3 + 0.34 * near).toFixed(3)})`;
    for (let i = 0; i < 7; i++) {
      const cx = ((i * 137 + Math.sin(time * 0.24 + i) * 26) % (cam.viewW + 160)) - 80;
      const r = 62 + Math.sin(i * 2.1) * 22;
      const cy = topY - 34 - Math.abs(Math.sin(i * 1.7 + time * 0.3)) * 92;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  const g = ctx.createLinearGradient(0, topY, 0, cam.viewH);
  g.addColorStop(0, "rgba(30,16,48,0.72)");
  g.addColorStop(0.35, "rgba(18,9,32,0.95)");
  g.addColorStop(1, "#0a0414");
  ctx.fillStyle = g;

  ctx.beginPath();
  ctx.moveTo(0, cam.viewH + 60);
  ctx.lineTo(0, topY);
  for (let x = 0; x <= cam.viewW; x += 12) {
    const churn =
      Math.sin(x * 0.021 + time * 1.9) * 11 +
      Math.sin(x * 0.052 - time * 2.7) * 6 +
      Math.sin(x * 0.011 + time * 0.8) * 14;
    ctx.lineTo(x, topY + churn);
  }
  ctx.lineTo(cam.viewW, cam.viewH + 60);
  ctx.closePath();
  ctx.fill();

  // A bright, restless lip so the boundary is unmistakable
  ctx.save();
  ctx.strokeStyle = "rgba(196,150,255,0.65)";
  ctx.lineWidth = 2;
  ctx.shadowColor = "rgba(170,110,255,0.9)";
  ctx.shadowBlur = 14;
  ctx.beginPath();
  for (let x = 0; x <= cam.viewW; x += 12) {
    const churn =
      Math.sin(x * 0.021 + time * 1.9) * 11 +
      Math.sin(x * 0.052 - time * 2.7) * 6 +
      Math.sin(x * 0.011 + time * 0.8) * 14;
    if (x === 0) ctx.moveTo(x, topY + churn);
    else ctx.lineTo(x, topY + churn);
  }
  ctx.stroke();
  ctx.restore();

  // How much air is left, on the thing that is taking it
  ctx.save();
  ctx.textAlign = "center";
  ctx.font = "600 12px ui-monospace, monospace";
  ctx.fillStyle = gapM < 12 ? "#ffd0d0" : "rgba(255,255,255,0.72)";
  // Pinned inside the view: the label is the warning, so it cannot scroll out with the lip
  const labelY = Math.min(topY + 30, cam.viewH - 14);
  ctx.fillText(`ORAGE  ${Math.max(0, Math.round(gapM))} m`, cam.viewW / 2, labelY);
  ctx.restore();
}

// A palier: a rainbow bridge across the sky. Crossed ones dim to a faint memory.
export function drawPalier(
  ctx: CanvasRenderingContext2D,
  y: number,
  viewW: number,
  label: string,
  crossed: boolean
): void {
  // A real bow, not a ruled line. It already had an arc, but 16px of rise across the whole
  // width reads as straight — Fab asked for "une légère courbe comme un bout d'arc-en-ciel".
  // A quadratic's apex sits at (start + 2*control + end)/4, so the control point has to
  // overshoot well past the crown to land it: ends at +20, apex at -34, control at -88.
  const END = 20;
  const CTRL = -88;
  const bow = (dy: number) => {
    ctx.moveTo(0, y + dy + END);
    ctx.quadraticCurveTo(viewW / 2, y + dy + CTRL, viewW, y + dy + END);
  };

  ctx.save();
  if (crossed) {
    ctx.globalAlpha = 0.18;
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 9]);
    ctx.beginPath();
    bow(0);
    ctx.stroke();
  } else {
    SPECTRUM.forEach((colour, i) => {
      ctx.strokeStyle = colour;
      ctx.globalAlpha = 0.85;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      // Bands fan apart towards the crown, the way a rainbow's do
      bow((i - (SPECTRUM.length - 1) / 2) * 2.8);
      ctx.stroke();
    });
    ctx.globalAlpha = 1;
    ctx.textAlign = "right";
    ctx.font = "600 11px ui-monospace, monospace";
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    // Clear of the crown, which now sits 34px above the nominal line
    ctx.fillText(label, viewW - 10, y - 52);
  }
  ctx.restore();
}

// ---------------------------------------------------------------- Prism

export interface PrismPose {
  vx: number;
  vy: number;
  scale: number;
  /** 0 = in control, rising = tumbling from a hit. */
  tumbling: number;
  tethered: boolean;
  /**
   * Screen-space angle from the character TOWARD the anchor. While tethered the whole
   * body is rotated to hang from it, which is what makes a rope read as a rope.
   */
  hangAngle: number | null;
  /**
   * +1 facing right, -1 facing left. Held by the engine with a deadband rather than
   * derived here, so she does not flicker as horizontal speed crosses zero.
   */
  facing: number;
  /**
   * Extra wing charges bought in the shop. Purely for the drawing: an upgrade you cannot
   * SEE on the character is a wasted upgrade, so bigger wings with a spectrum edge.
   */
  wingBoost: number;
  /** 0..1, decays after each wingbeat. */
  flapPulse: number;
  /** 0..1, decays after catching an anchor. */
  justAttached: number;
  /** 0..1, decays after letting go. */
  justReleased: number;
  light: string;
  time: number;
}

// A quadruped was the wrong body for this game and Fab spotted why: a horse in profile is a
// long HORIZONTAL shape, so hanging it from a rope never reads, and a unicorn suspended by
// its horn is plainly absurd. A small humanoid is compact and VERTICAL — it dangles from
// its own hands, exactly as in Hang Line: Mountain Climber, which is the reference he
// pointed at. It also reads far better at 50px on a phone.

export function prismBodyAngle(pose: PrismPose): number {
  if (pose.tumbling > 0) return pose.tumbling * 14;
  if (pose.tethered && pose.hangAngle !== null) {
    // Hang from the rope: the body's own "up" (-y) is aimed at the anchor. Mirroring for
    // facing happens after this and leaves the y axis alone, so the hang still holds.
    return pose.hangAngle + Math.PI / 2;
  }
  // Multiplied by facing because the mirror is applied after the rotation: without it she
  // would tilt nose-down whenever she flew leftward.
  const lean = -pose.vy / 1500 + Math.abs(pose.vx) / 3600;
  return pose.facing * Math.max(-0.6, Math.min(0.6, lean));
}

/** Where the hands are, in screen space relative to the character's centre. */
export function prismGrip(pose: PrismPose): { dx: number; dy: number } {
  const a = prismBodyAngle(pose);
  const gx = 0;
  const gy = -20 * pose.scale;
  return {
    dx: gx * Math.cos(a) - gy * Math.sin(a),
    dy: gx * Math.sin(a) + gy * Math.cos(a),
  };
}

// A streamer with a wave travelling down it. A single quadratic curve reads as a stiff
// arc — "les rubans sont trop rectilignes" — so this is a polyline carrying a sine whose
// amplitude grows toward the free end, which is how cloth actually behaves.
function ribbon(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  dirX: number,
  dirY: number,
  length: number,
  colour: string,
  width: number,
  time: number,
  phase: number,
  amp: number,
  waves: number
): void {
  const len = Math.hypot(dirX, dirY) || 1;
  const ux = dirX / len;
  const uy = dirY / len;
  // Perpendicular, for the wave to swing across
  const nx = -uy;
  const ny = ux;

  ctx.strokeStyle = colour;
  ctx.lineWidth = width;
  ctx.beginPath();
  const STEPS = 12;
  for (let i = 0; i <= STEPS; i++) {
    const s = i / STEPS;
    const sway = Math.sin(s * Math.PI * 2 * waves - time * 6 + phase) * amp * s;
    const px = x0 + ux * length * s + nx * sway;
    const py = y0 + uy * length * s + ny * sway;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();
}

function limb(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  a1: number,
  a2: number,
  l1: number,
  l2: number,
  w: number
): void {
  const kx = x + Math.cos(a1) * l1;
  const ky = y + Math.sin(a1) * l1;
  const ex = kx + Math.cos(a2) * l2;
  const ey = ky + Math.sin(a2) * l2;
  ctx.lineWidth = w;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(kx, ky);
  ctx.stroke();
  ctx.lineWidth = w * 0.8;
  ctx.beginPath();
  ctx.moveTo(kx, ky);
  ctx.lineTo(ex, ey);
  ctx.stroke();
}

export function drawPrism(ctx: CanvasRenderingContext2D, x: number, y: number, pose: PrismPose): void {
  const { vx, vy, scale, tumbling, tethered, flapPulse, justAttached, justReleased, light, time } = pose;

  // Prism is a KID IN A UNICORN COSTUME. That came from Fab — his daughter is permanently
  // dressed as one — and it is the best direction of the whole build, for two reasons.
  // It gives the game some warmth that a generic winged figure never would, and child
  // proportions mean a big head, which is exactly what reads at 50px on a phone. The horn
  // and mane live on the HOOD; the wings are stitched fabric, not raptor feathers.
  const climb = Math.max(0, Math.min(1, vy / 620));
  const dive = Math.max(0, Math.min(1, -vy / 700));
  const speed = Math.hypot(vx, vy);
  const beat = Math.sin(time * 15);
  // Streamers are pulled TAUT by speed, not whipped up by it — I had this backwards.
  // Fast: longer and straighter. Slow: short and loose, with a big lazy wave.
  const stretch = 1 + Math.min(0.7, speed / 1100);
  const slack = 1 - Math.min(0.8, speed / 1050);
  const flow = (t: number) => spectrumAt(t - time * 0.4);

  let wingDeg = 198 + climb * 14 + beat * (8 + climb * 16) + flapPulse * 18;
  let wingLen = 22 + climb * 3;
  if (tethered) { wingDeg = 208 + beat * 4; wingLen = 15; }
  if (justReleased > 0) { wingDeg += justReleased * 22; wingLen += justReleased * 6; }
  if (tumbling > 0) { wingDeg = 162; wingLen = 16; }

  const squashY = 1 - justAttached * 0.12 + justReleased * 0.08;
  const squashX = 1 + justAttached * 0.1 + justReleased * 0.04;

  const SUIT = "#ffffff";
  const SUIT_SHADE = "rgba(116,136,188,0.24)";
  const SKIN = "#ffdcc0";

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.rotate(prismBodyAngle(pose));
  if (tumbling > 0) ctx.globalAlpha = 0.7 + 0.3 * Math.abs(Math.sin(tumbling * 30));
  ctx.scale(squashX * pose.facing, squashY);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const rad = (d: number) => (d * Math.PI) / 180;

  // Butterfly wings: a forewing and a smaller hindwing, drawn in a rotated frame so the
  // shape can be authored cleanly along +x and then simply aimed.
  const butterflyWing = (deg: number, len: number, alpha: number, detail: boolean) => {
    len *= 1 + pose.wingBoost * 0.24;
    ctx.save();
    ctx.translate(-1, -6);
    ctx.rotate(rad(deg));
    ctx.globalAlpha *= alpha;

    // ONE wing per side. A forewing plus a hindwing made the pair read as a V with a pink
    // lobe hanging out below, which Fab rightly called ugly. A single fuller shape, pale at
    // the root and pink at the rim, reads as a wing instead of two stuck-together pieces.
    const fore = ctx.createLinearGradient(0, 0, len * 0.95, -len * 0.28);
    fore.addColorStop(0, "#ffffff");
    fore.addColorStop(0.4, "#ffd9ec");
    fore.addColorStop(1, "#f97fbb");
    ctx.fillStyle = fore;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(len * 0.26, -len * 0.54, len * 0.88, -len * 0.36);
    ctx.quadraticCurveTo(len * 1.12, -len * 0.06, len * 0.74, len * 0.15);
    ctx.quadraticCurveTo(len * 0.36, len * 0.22, 0, 0);
    ctx.closePath();
    ctx.fill();

    if (detail) {
      // Veins and two pale eyespots — the cues that say butterfly rather than petal
      ctx.strokeStyle = "rgba(255,255,255,0.55)";
      ctx.lineWidth = 0.8;
      for (const t of [-0.34, -0.14, 0.06]) {
        ctx.beginPath();
        ctx.moveTo(len * 0.05, 0);
        ctx.quadraticCurveTo(len * 0.5, t * len, len * 0.86, t * len * 0.85);
        ctx.stroke();
      }
      ctx.fillStyle = "rgba(255,255,255,0.72)";
      ctx.beginPath();
      ctx.arc(len * 0.68, -len * 0.26, len * 0.08, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(len * 0.46, -len * 0.32, len * 0.052, 0, Math.PI * 2);
      ctx.fill();
    }

    // Leading edge. Reinforced wings get a spectrum rim, so the purchase is visible.
    ctx.strokeStyle = pose.wingBoost > 0 ? spectrumAt(time * 0.3) : "rgba(255,255,255,0.75)";
    ctx.lineWidth = pose.wingBoost > 0 ? 1.6 : 0.9;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(len * 0.26, -len * 0.54, len * 0.88, -len * 0.36);
    ctx.stroke();
    ctx.restore();
  };

  // ---------- Ribbons off the shoulders, undulating ----------
  for (let i = 0; i < 3; i++) {
    const off = (i - 1) * 2.1;
    ribbon(
      ctx, -3, -5 + off * 0.6, -1, 0.34,
      (20 + i * 2) * stretch, flow(i / 3), 2.6 - i * 0.35,
      time, i * 1.5, 4.2 * slack, 1.5 + (1 - slack) * 0.8
    );
  }

  // ---------- Far wing ----------
  butterflyWing(wingDeg - 16, wingLen * 0.88, 0.6, false);

  // ---------- Costume tail: a short spectrum tuft at the small of the back ----------
  for (let i = 0; i < 3; i++) {
    ribbon(
      ctx, -4, 2.5 + i * 0.6, -1, 0.6,
      (13 + i) * stretch, flow(0.4 + i / 6), 2.4,
      time, i * 2.1, 2.8 * slack, 1.3 + (1 - slack) * 0.7
    );
  }

  // ---------- Legs: short and chunky, with soft feet ----------
  ctx.strokeStyle = SUIT;
  ctx.fillStyle = SUIT;
  const kick = Math.sin(time * 11) * (0.35 + flapPulse * 0.5);
  const tuck = tethered ? 0.2 : Math.max(climb * 0.85, 1 - dive * 0.9) * 0.7;
  for (const side of [-1, 1]) {
    const sw = kick * 0.45 * side;
    const hip = 1.571 - tuck * 1.1 + sw;
    const shin = hip + 0.45 + tuck * 0.95 - sw * 0.6;
    limb(ctx, side * 2, 5, hip, shin, 6, 5.2, 4);
    // Foot
    const kx = side * 2 + Math.cos(hip) * 6;
    const ky = 5 + Math.sin(hip) * 6;
    const fx = kx + Math.cos(shin) * 5.2;
    const fy = ky + Math.sin(shin) * 5.2;
    ctx.beginPath();
    ctx.arc(fx, fy, 2.3, 0, Math.PI * 2);
    ctx.fill();
  }

  // ---------- Onesie torso ----------
  const torso = ctx.createLinearGradient(0, -8, 0, 7);
  torso.addColorStop(0, "#ffffff");
  torso.addColorStop(1, "#cdd8f2");
  ctx.fillStyle = torso;
  ctx.beginPath();
  ctx.moveTo(-5, -7);
  ctx.quadraticCurveTo(-6.4, 0, -4.2, 5.6);
  ctx.quadraticCurveTo(0, 7.4, 4.2, 5.6);
  ctx.quadraticCurveTo(6.4, 0, 5, -7);
  ctx.quadraticCurveTo(0, -8.8, -5, -7);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = SUIT_SHADE;
  ctx.beginPath();
  ctx.moveTo(1, -7.8);
  ctx.quadraticCurveTo(5.6, 0, 4.2, 5.6);
  ctx.quadraticCurveTo(1.4, 6.8, 1, 5.6);
  ctx.closePath();
  ctx.fill();

  // ---------- Pink tutu. Fab's daughter's costume has one, so Prism's does too ----------
  const tutu = ctx.createLinearGradient(0, 2, 0, 10);
  tutu.addColorStop(0, "#ffb3d4");
  tutu.addColorStop(1, "#ff7fb8");
  ctx.fillStyle = tutu;
  // Two scalloped layers, so it reads as tulle rather than a solid skirt
  for (const [spread, drop, alpha] of [[9.5, 9.5, 0.95], [7.4, 7, 1]] as [number, number, number][]) {
    ctx.globalAlpha = tumbling > 0 ? alpha * 0.8 : alpha;
    ctx.beginPath();
    ctx.moveTo(-5.2, 2.6);
    ctx.lineTo(-spread, drop);
    // Scallops along the hem
    const SCALLOPS = 4;
    for (let i = 0; i < SCALLOPS; i++) {
      const x0 = -spread + (2 * spread * i) / SCALLOPS;
      const x1 = -spread + (2 * spread * (i + 1)) / SCALLOPS;
      ctx.quadraticCurveTo((x0 + x1) / 2, drop + 2.6, x1, drop);
    }
    ctx.lineTo(5.2, 2.6);
    ctx.closePath();
    ctx.fill();
  }
  ctx.globalAlpha = tumbling > 0 ? 0.7 + 0.3 * Math.abs(Math.sin(tumbling * 30)) : 1;

  // ---------- Arms. Tethered: both up, gripping the rope ----------
  ctx.strokeStyle = SUIT;
  ctx.fillStyle = SKIN;
  for (const side of [-1, 1]) {
    let shoulderA: number, elbowA: number;
    if (tethered) {
      shoulderA = -1.571 + side * 0.17;
      elbowA = -1.571 + side * 0.05;
    } else if (dive > 0.35) {
      shoulderA = -0.4 + side * 0.55;
      elbowA = -0.15 + side * 0.6;
    } else {
      shoulderA = -1.15 + side * 0.5 - flapPulse * 0.28;
      elbowA = -0.85 + side * 0.55;
    }
    limb(ctx, side * 3.6, -5.5, shoulderA, elbowA, 5.4, 5, 3.6);
    // Bare hand at the end of the sleeve
    const kx = side * 3.6 + Math.cos(shoulderA) * 5.4;
    const ky = -5.5 + Math.sin(shoulderA) * 5.4;
    ctx.beginPath();
    ctx.arc(kx + Math.cos(elbowA) * 5, ky + Math.sin(elbowA) * 5, 1.9, 0, Math.PI * 2);
    ctx.fill();
  }

  // ---------- Hood, face, horn: the costume's whole personality ----------
  // Hood shell, slightly larger than the head and set back
  ctx.fillStyle = "#f3f6ff";
  ctx.beginPath();
  ctx.arc(-0.6, -13.6, 7.6, 0, Math.PI * 2);
  ctx.fill();

  // Her own hair, blonde-chestnut, escaping from under the hood. Keeping the spectrum for
  // the ribbons, tail, horn and tether — and giving her real hair — is what separates the
  // CHILD from the COSTUME she is wearing.
  const HAIR = ["#e0b374", "#cf9a58", "#e8c68d", "#c98f4e"];
  for (let i = 0; i < 4; i++) {
    const f = i / 4;
    ribbon(
      ctx, -4.4, -17.5 + f * 4.5, -1, 0.9,
      (13 + f * 5) * stretch, HAIR[i], 3.2 - f * 0.5,
      time, i * 1.9, 2.6 * slack, 1.2 + (1 - slack) * 0.6
    );
  }

  // Ears on the hood
  ctx.fillStyle = "#f3f6ff";
  for (const [ex, ey, r] of [[-3.6, -19.4, 2.1], [1.4, -20.4, 2.1]] as [number, number, number][]) {
    ctx.beginPath();
    ctx.ellipse(ex, ey, r, r * 1.5, 0.3, 0, Math.PI * 2);
    ctx.fill();
  }

  // The face inside the hood — this is what makes it a child in a costume
  ctx.fillStyle = SKIN;
  ctx.beginPath();
  ctx.arc(2.2, -12.8, 5.4, 0, Math.PI * 2);
  ctx.fill();

  // Fringe peeking out under the brim
  ctx.fillStyle = "#e0b374";
  ctx.beginPath();
  ctx.moveTo(-1.6, -17.4);
  ctx.quadraticCurveTo(3.6, -19.4, 6.6, -15.4);
  ctx.quadraticCurveTo(3.4, -16.4, -1.6, -17.4);
  ctx.closePath();
  ctx.fill();

  // Hood brim across the brow
  ctx.strokeStyle = "#dfe6f8";
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.arc(-0.6, -13.6, 7.2, rad(200), rad(348));
  ctx.stroke();

  // Horn, on the hood's brow
  const horn = ctx.createLinearGradient(2, -19, 7, -28);
  horn.addColorStop(0, "#ffffff");
  horn.addColorStop(1, spectrumAt(time * 0.25));
  ctx.fillStyle = horn;
  if (tethered) { ctx.shadowColor = spectrumAt(time * 0.25); ctx.shadowBlur = 11; }
  ctx.beginPath();
  ctx.moveTo(-0.4, -19.6);
  ctx.lineTo(5.6, -28.4);
  ctx.lineTo(3.6, -18.4);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;

  // Face: one eye, a cheek, and a small smile. Shut eye when stunned.
  ctx.strokeStyle = "rgba(48,44,66,0.9)";
  ctx.fillStyle = "rgba(48,44,66,0.9)";
  if (tumbling > 0) {
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(3.2, -13.4);
    ctx.lineTo(6, -13.4);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.arc(4.6, -13.6, 1.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(4.2, -10.6, 2, rad(20), rad(120));
    ctx.stroke();
  }
  ctx.fillStyle = "rgba(255,150,160,0.45)";
  ctx.beginPath();
  ctx.arc(6.4, -11.2, 1.5, 0, Math.PI * 2);
  ctx.fill();

  // Rim light along the leading edge, in the colour of the sky she is in
  ctx.strokeStyle = light;
  ctx.lineWidth = 1.3;
  ctx.globalAlpha *= 0.75;
  ctx.beginPath();
  ctx.arc(-0.6, -13.6, 7.6, rad(-95), rad(45));
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(5, -7);
  ctx.quadraticCurveTo(6.4, 0, 4.2, 5.6);
  ctx.stroke();
  ctx.globalAlpha = tumbling > 0 ? 0.7 + 0.3 * Math.abs(Math.sin(tumbling * 30)) : 1;

  // ---------- Near wing ----------
  butterflyWing(wingDeg, wingLen, 1, true);

  ctx.restore();

  if (justReleased > 0.05) {
    ctx.save();
    ctx.globalAlpha = justReleased * 0.5;
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, (1 - justReleased) * 44 * scale + 12, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}
