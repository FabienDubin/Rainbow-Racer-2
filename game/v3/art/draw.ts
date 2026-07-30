// Every visual in the game, as pure drawing functions. The engine owns simulation and
// calls in here to render — so art can be reworked without touching a line of physics.
//
// Direction: flat vector shapes, long gradients, layered silhouettes and rim light. No
// bitmap art except Prism herself, who is the V1 sprite. It costs nothing to ship, stays
// crisp at any resolution, runs fast on a phone, and looks deliberate rather than cheap.

import { SkyState, SPECTRUM } from "./palette";

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
  glow: string
): void {
  const dx = px - ax;
  const dy = py - ay;
  const len = Math.hypot(dx, dy) || 1;
  // Perpendicular, to fan the bands out across the ribbon's width
  const nx = -dy / len;
  const ny = dx / len;
  // A gentle sag makes it read as a rope under load instead of a laser
  const sag = Math.min(18, len * 0.06);
  const mx = (ax + px) / 2 + nx * 0;
  const my = (ay + py) / 2 + sag;

  ctx.save();
  ctx.lineCap = "round";
  ctx.shadowColor = glow;
  ctx.shadowBlur = 10;
  SPECTRUM.forEach((colour, i) => {
    const off = (i - (SPECTRUM.length - 1) / 2) * 1.9;
    ctx.strokeStyle = colour;
    ctx.lineWidth = 2.2;
    ctx.globalAlpha = 0.95;
    ctx.beginPath();
    ctx.moveTo(ax + nx * off, ay + ny * off);
    ctx.quadraticCurveTo(mx + nx * off, my + ny * off, px + nx * off, py + ny * off);
    ctx.stroke();
  });
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

// Prism is the V1 unicorn sprite — Fab's own asset, and the continuity with the first
// game he asked to keep. Wing frame is chosen by vertical speed, so she beats upward and
// glides downward without any animation state to track.
export function drawPrism(
  ctx: CanvasRenderingContext2D,
  frames: (HTMLImageElement | undefined)[],
  x: number,
  y: number,
  vx: number,
  vy: number,
  scale: number,
  tumbling: number
): void {
  const frame = vy > 120 ? 0 : vy < -260 ? 2 : 1;
  const img = frames[frame];
  ctx.save();
  ctx.translate(x, y);
  if (tumbling > 0) {
    ctx.rotate(tumbling * 14);
    ctx.globalAlpha = 0.6 + 0.4 * Math.abs(Math.sin(tumbling * 30));
  } else {
    // Lean into the direction of travel — reads as intent, not just a moving sprite
    ctx.rotate(Math.max(-0.5, Math.min(0.55, -vy / 1600 + vx / 4000)));
  }
  if (img && img.width) {
    const w = 86 * scale;
    const h = (w * img.height) / img.width;
    ctx.drawImage(img, -w / 2, -h / 2, w, h);
  } else {
    // Sprite not loaded yet: a lit lozenge rather than nothing
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.ellipse(0, 0, 18 * scale, 12 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
