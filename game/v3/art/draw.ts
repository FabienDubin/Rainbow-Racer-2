// Every visual in the game, as pure drawing functions. The engine owns simulation and
// calls in here to render — so art can be reworked without touching a line of physics.
//
// Direction: flat vector shapes, long gradients, layered silhouettes and rim light.
// Everything, Prism included, is drawn — no bitmaps at all. Reusing the V1 unicorn sprite
// seemed like nice continuity, but a soft cartoon PNG sitting on faceted vector art simply
// clashed, and Fab called it: "elle va pas du tout avec le reste". Continuity now lives in
// the palette and the spirit rather than in a reused file.

import { SkyState, SPECTRUM } from "./palette";

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

// Le Grondement: a rising mass of storm with a turbulent lip, not a flat band. It is the
// pacer of the whole game, so it has to feel like weather closing in.
export function drawStorm(
  ctx: CanvasRenderingContext2D,
  cam: Camera,
  topY: number,
  time: number,
  gapM: number
): void {
  if (topY > cam.viewH + 40) return;

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
  ctx.fillText(`ORAGE  ${Math.max(0, Math.round(gapM))} m`, cam.viewW / 2, topY + 30);
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
  ctx.save();
  if (crossed) {
    ctx.globalAlpha = 0.18;
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 9]);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(viewW, y);
    ctx.stroke();
  } else {
    SPECTRUM.forEach((colour, i) => {
      ctx.strokeStyle = colour;
      ctx.globalAlpha = 0.85;
      ctx.lineWidth = 2;
      ctx.beginPath();
      const off = (i - (SPECTRUM.length - 1) / 2) * 2.4;
      // A shallow arc, like a bridge rather than a ruled line
      ctx.moveTo(0, y + off + 7);
      ctx.quadraticCurveTo(viewW / 2, y + off - 9, viewW, y + off + 7);
      ctx.stroke();
    });
    ctx.globalAlpha = 1;
    ctx.textAlign = "right";
    ctx.font = "600 11px ui-monospace, monospace";
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.fillText(label, viewW - 10, y - 16);
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
  /** 0..1, decays after each wingbeat. */
  flapPulse: number;
  /** 0..1, decays after catching an anchor. */
  justAttached: number;
  /** 0..1, decays after letting go. */
  justReleased: number;
  light: string;
  time: number;
}

// The lean she is drawn at. The tether has to leave her HORN rather than her middle — she
// is a unicorn projecting a rainbow, and that should be visible — so the engine needs the
// same rotation to know where the horn tip actually is.
export function prismLean(vx: number, vy: number, tumbling: number): number {
  if (tumbling > 0) return tumbling * 14;
  return Math.max(-0.5, Math.min(0.55, -vy / 1700 + vx / 4200));
}

export function prismHornTip(pose: PrismPose): { dx: number; dy: number } {
  const a = prismLean(pose.vx, pose.vy, pose.tumbling);
  const hx = 29 * pose.scale;
  const hy = -13 * pose.scale;
  return {
    dx: hx * Math.cos(a) - hy * Math.sin(a),
    dy: hx * Math.sin(a) + hy * Math.cos(a),
  };
}

// One leg, as two tapered segments. Four of them, posed per state — tucked while climbing
// or carried, reaching while gliding, and paddling on each wingbeat, which is the detail
// that makes her look alive rather than pivoted.
function leg(
  ctx: CanvasRenderingContext2D,
  hipX: number,
  hipY: number,
  thigh: number,
  shin: number,
  len: number
): void {
  const kx = hipX + Math.cos(thigh) * len;
  const ky = hipY + Math.sin(thigh) * len;
  const fx = kx + Math.cos(shin) * len * 0.85;
  const fy = ky + Math.sin(shin) * len * 0.85;
  ctx.beginPath();
  ctx.moveTo(hipX, hipY);
  ctx.lineTo(kx, ky);
  ctx.lineWidth = 2.6;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(kx, ky);
  ctx.lineTo(fx, fy);
  ctx.lineWidth = 1.9;
  ctx.stroke();
  // Hoof: a tiny prism, matching the world's vocabulary
  ctx.beginPath();
  ctx.arc(fx, fy, 1.5, 0, Math.PI * 2);
  ctx.fill();
}

export function drawPrism(ctx: CanvasRenderingContext2D, x: number, y: number, pose: PrismPose): void {
  const { vx, vy, scale, tumbling, tethered, flapPulse, justAttached, justReleased, light, time } = pose;

  // The first pass at this was a faceted wedge and it read as a paper aeroplane, not a
  // horse. What a horse needs before anything else is an ARCHED NECK and a distinct HEAD;
  // without those, no amount of styling reads as equine. So the silhouette is built in
  // proper parts — barrel, neck, head, four long legs, big pegasus wings — and only then
  // faceted and lit.
  const climb = Math.max(0, Math.min(1, vy / 620));
  const dive = Math.max(0, Math.min(1, -vy / 700));
  const speed = Math.hypot(vx, vy);
  const beat = Math.sin(time * 15);

  // Wing angle, in canvas degrees: 180 is straight back, 270 is straight up.
  let wingDeg = 188 + climb * 14 + beat * (10 + climb * 20) + flapPulse * 22;
  let wingLen = 34 + climb * 4;
  if (tethered) {
    wingDeg = 196 + beat * 4; // folded, being carried
    wingLen = 20;
  }
  if (justReleased > 0) {
    wingDeg += justReleased * 26; // snapped wide on the launch
    wingLen += justReleased * 8;
  }
  if (tumbling > 0) {
    wingDeg = 150;
    wingLen = 22;
  }

  const squashY = 1 - justAttached * 0.14 + justReleased * 0.09;
  const squashX = 1 + justAttached * 0.12 + justReleased * 0.05;
  const whip = 1 + Math.min(1.3, speed / 750);
  const flow = (t: number) => spectrumAt(t - time * 0.4);

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.rotate(prismLean(vx, vy, tumbling));
  if (tumbling > 0) ctx.globalAlpha = 0.7 + 0.3 * Math.abs(Math.sin(tumbling * 30));
  ctx.scale(squashX, squashY);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // ---------- Tail: spectrum, rooted at the croup ----------
  for (let i = 0; i < 4; i++) {
    const off = (i - 1.5) * 1.9;
    const wob = Math.sin(time * 6.5 + i * 0.9) * 2.6 * whip;
    ctx.strokeStyle = flow(i / 4);
    ctx.lineWidth = 2.6 - i * 0.25;
    ctx.beginPath();
    ctx.moveTo(-15, -1 + off * 0.5);
    ctx.quadraticCurveTo(-25 * whip, off + wob, (-36 - i * 2.5) * whip, off * 1.5 + wob);
    ctx.stroke();
  }

  // ---------- Far wing, behind everything ----------
  const wingRad = (deg: number) => (deg * Math.PI) / 180;
  const farA = wingRad(wingDeg - 12);
  ctx.fillStyle = "rgba(198,214,250,0.55)";
  ctx.beginPath();
  ctx.moveTo(0, -6);
  ctx.lineTo(Math.cos(farA) * wingLen * 0.82, -6 + Math.sin(farA) * wingLen * 0.82);
  ctx.lineTo(6, -9);
  ctx.closePath();
  ctx.fill();

  // ---------- Legs: long, thin, posed. Front pair reaches, rear pair trails ----------
  ctx.strokeStyle = "rgba(232,239,255,0.96)";
  ctx.fillStyle = "rgba(232,239,255,0.96)";
  const paddle = Math.sin(time * 12) * (0.45 + flapPulse * 0.7);
  const tuck = tethered ? 0.9 : Math.max(climb * 0.85, 1 - dive * 0.95) * 0.75;
  const legSpec: [number, number, number, number][] = [
    // hipX, hipY, phase, length
    [7, 4, 0, 8],
    [4.5, 4.5, 2.3, 7.6],
    [-9, 3, 1.2, 8.4],
    [-12, 2.5, 3.4, 8],
  ];
  for (const [hx, hy, ph, len] of legSpec) {
    const swing = paddle * 0.4 * Math.cos(ph);
    const thigh = 1.5 - tuck * 1.35 + swing;
    const shin = thigh + 0.7 + tuck * 1.25 - swing * 0.6;
    leg(ctx, hx, hy, thigh, shin, len);
  }

  // ---------- Body: a rounded barrel ----------
  const bodyPath = () => {
    ctx.beginPath();
    ctx.moveTo(11, -3); // chest
    ctx.quadraticCurveTo(6, -10, -2, -9); // back, behind the withers
    ctx.quadraticCurveTo(-12, -8, -16, -2); // croup
    ctx.quadraticCurveTo(-18, 4, -11, 6); // haunch
    ctx.quadraticCurveTo(-2, 9, 8, 6); // belly
    ctx.quadraticCurveTo(12, 4, 11, -3); // back to chest
    ctx.closePath();
  };
  const body = ctx.createLinearGradient(0, -10, 0, 9);
  body.addColorStop(0, "#ffffff");
  body.addColorStop(0.6, "#f4f7ff");
  body.addColorStop(1, "#c6d2ef");
  ctx.fillStyle = body;
  bodyPath();
  ctx.fill();

  // ---------- Neck: the arch that makes it read as a horse ----------
  const neck = ctx.createLinearGradient(4, -6, 22, -20);
  neck.addColorStop(0, "#f7f9ff");
  neck.addColorStop(1, "#ffffff");
  ctx.fillStyle = neck;
  ctx.beginPath();
  ctx.moveTo(4, -7);
  ctx.quadraticCurveTo(13, -13, 17, -21); // top line of the neck, arched
  ctx.lineTo(24, -19);
  ctx.quadraticCurveTo(18, -11, 11, -2); // underside
  ctx.closePath();
  ctx.fill();

  // ---------- Head: a distinct wedge with a muzzle ----------
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.moveTo(17, -22); // poll
  ctx.lineTo(29, -17); // bridge of the nose
  ctx.lineTo(31, -13); // muzzle
  ctx.lineTo(24, -13); // jaw
  ctx.quadraticCurveTo(19, -15, 17, -22);
  ctx.closePath();
  ctx.fill();

  // Ear
  ctx.beginPath();
  ctx.moveTo(18, -22);
  ctx.lineTo(16.5, -28);
  ctx.lineTo(21, -23);
  ctx.closePath();
  ctx.fill();

  // Shadow facets: underside of the barrel and of the jaw
  ctx.fillStyle = "rgba(116,136,188,0.3)";
  ctx.beginPath();
  ctx.moveTo(11, 0);
  ctx.quadraticCurveTo(4, 8, -8, 6);
  ctx.quadraticCurveTo(-16, 4, -16, -1);
  ctx.quadraticCurveTo(-4, 3, 11, 0);
  ctx.closePath();
  ctx.fill();

  // ---------- Mane: short tufts hugging the neck ----------
  // Long sweeping strands read as a rainbow passing BEHIND her and merged visually with
  // the tail, so the whole animal looked like it had a rainbow stuck through it. Short
  // tufts that follow the neck's own curve read as hair.
  for (let i = 0; i < 6; i++) {
    const f = i / 5;
    const wob = Math.sin(time * 9 + i * 1.3) * 1.5;
    ctx.strokeStyle = flow(0.1 + f * 0.5);
    ctx.lineWidth = 3.2 - f * 0.7;
    // Along the neck's top line, from withers up to the poll
    const sx = 5 + f * 12;
    const sy = -8 - f * 13;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.quadraticCurveTo(sx - 5, sy - 2.5 + wob, sx - 9 - f * 3, sy + 2.5 + wob);
    ctx.stroke();
  }

  // ---------- Rim light along the top line, in the band's own colour ----------
  ctx.strokeStyle = light;
  ctx.lineWidth = 1.4;
  ctx.globalAlpha *= 0.85;
  ctx.beginPath();
  ctx.moveTo(-16, -2);
  ctx.quadraticCurveTo(-8, -9, -2, -9);
  ctx.quadraticCurveTo(6, -10, 4, -7);
  ctx.quadraticCurveTo(13, -13, 17, -21);
  ctx.lineTo(29, -17);
  ctx.stroke();
  ctx.globalAlpha = tumbling > 0 ? 0.7 + 0.3 * Math.abs(Math.sin(tumbling * 30)) : 1;

  // ---------- Horn: a prism on the forehead, lit while the rope is out of it ----------
  const horn = ctx.createLinearGradient(20, -22, 34, -33);
  horn.addColorStop(0, "#ffffff");
  horn.addColorStop(1, spectrumAt(time * 0.25));
  ctx.fillStyle = horn;
  if (tethered) {
    ctx.shadowColor = spectrumAt(time * 0.25);
    ctx.shadowBlur = 14;
  }
  ctx.beginPath();
  ctx.moveTo(19, -23);
  ctx.lineTo(34, -33);
  ctx.lineTo(23, -20);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;

  // Eye — shuts to a line when she is stunned
  ctx.strokeStyle = "rgba(38,42,68,0.9)";
  ctx.fillStyle = "rgba(38,42,68,0.9)";
  if (tumbling > 0) {
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(21, -18.6);
    ctx.lineTo(24.4, -17.6);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.arc(22.6, -18.4, 1.15, 0, Math.PI * 2);
    ctx.fill();
  }

  // ---------- Near wing: three layered feather planes. Big wings are what read ----------
  for (let i = 0; i < 3; i++) {
    const a = wingRad(wingDeg + i * 13);
    const len = wingLen - i * 6;
    const g = ctx.createLinearGradient(2, -7, Math.cos(a) * len, -7 + Math.sin(a) * len);
    g.addColorStop(0, "#ffffff");
    g.addColorStop(1, i === 0 ? "rgba(226,236,255,0.9)" : "rgba(206,222,255,0.85)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(2, -6);
    ctx.lineTo(Math.cos(a) * len, -7 + Math.sin(a) * len);
    ctx.lineTo(Math.cos(a + 0.3) * len * 0.72, -6 + Math.sin(a + 0.3) * len * 0.72);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.85)";
    ctx.lineWidth = 0.9;
    ctx.stroke();
  }

  ctx.restore();

  // A ring of light on the launch, drawn unrotated so it stays circular
  if (justReleased > 0.05) {
    ctx.save();
    ctx.globalAlpha = justReleased * 0.5;
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, (1 - justReleased) * 50 * scale + 14, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}
