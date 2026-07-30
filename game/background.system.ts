// Parallax background with smooth biome transitions driven by distance travelled.

import { Biome, BIOMES, BIOME_LENGTH_M, GAME_HEIGHT, GAME_WIDTH } from "./constants";

interface BgLayer {
  offset: number;
  speedFactor: number;
}

interface AmbientStar {
  x: number;
  y: number;
  size: number;
  twinkle: number;
}

// Linear interpolation between two hex colors
function lerpColor(a: string, b: string, t: number): string {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const r = Math.round(((pa >> 16) & 255) + (((pb >> 16) & 255) - ((pa >> 16) & 255)) * t);
  const g = Math.round(((pa >> 8) & 255) + (((pb >> 8) & 255) - ((pa >> 8) & 255)) * t);
  const bl = Math.round((pa & 255) + ((pb & 255) - (pa & 255)) * t);
  return `rgb(${r},${g},${bl})`;
}

export class BackgroundSystem {
  private layers: BgLayer[] = [
    { offset: 0, speedFactor: 0.12 }, // far hills
    { offset: 0, speedFactor: 0.3 }, // near hills
    { offset: 0, speedFactor: 0.55 }, // drifting puffs
  ];
  private stars: AmbientStar[] = [];
  private time = 0;

  constructor() {
    for (let i = 0; i < 70; i++) {
      this.stars.push({
        x: Math.random() * GAME_WIDTH,
        y: Math.random() * GAME_HEIGHT * 0.7,
        size: 1 + Math.random() * 2.2,
        twinkle: Math.random() * Math.PI * 2,
      });
    }
  }

  // Current biome index + interpolation factor toward the next one
  biomeAt(distanceM: number): { biome: Biome; next: Biome; t: number; index: number } {
    const raw = distanceM / BIOME_LENGTH_M;
    const index = Math.floor(raw) % BIOMES.length;
    const nextIndex = (index + 1) % BIOMES.length;
    // Blend during the last 15% of each biome for a smooth sky shift
    const frac = raw - Math.floor(raw);
    const t = frac > 0.85 ? (frac - 0.85) / 0.15 : 0;
    return { biome: BIOMES[index], next: BIOMES[nextIndex], t, index };
  }

  update(dt: number, worldSpeed: number): void {
    this.time += dt;
    for (const layer of this.layers) {
      layer.offset = (layer.offset + worldSpeed * layer.speedFactor * dt) % GAME_WIDTH;
    }
  }

  draw(ctx: CanvasRenderingContext2D, distanceM: number, rushActive: boolean): void {
    const { biome, next, t } = this.biomeAt(distanceM);
    const skyTop = lerpColor(biome.skyTop, next.skyTop, t);
    const skyBottom = lerpColor(biome.skyBottom, next.skyBottom, t);

    // Sky gradient (hue-shifted during Rainbow Rush)
    const grad = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
    if (rushActive) {
      const hue = (this.time * 120) % 360;
      grad.addColorStop(0, `hsl(${hue}, 75%, 72%)`);
      grad.addColorStop(1, `hsl(${(hue + 90) % 360}, 75%, 82%)`);
    } else {
      grad.addColorStop(0, skyTop);
      grad.addColorStop(1, skyBottom);
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Ambient stars for night biomes
    if (biome.ambientStars || rushActive) {
      for (const s of this.stars) {
        const a = 0.4 + 0.6 * Math.abs(Math.sin(this.time * 1.5 + s.twinkle));
        ctx.globalAlpha = a * (rushActive ? 0.9 : 1);
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    // Two hill layers drawn as repeating sine silhouettes
    const hillColor = lerpColor(biome.hillColor, next.hillColor, t);
    this.drawHills(ctx, this.layers[0].offset, GAME_HEIGHT - 90, 55, hillColor, 0.35);
    this.drawHills(ctx, this.layers[1].offset, GAME_HEIGHT - 40, 80, hillColor, 0.6);

    // Soft drifting puffs (cheap depth cue)
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = "#ffffff";
    const off = this.layers[2].offset;
    for (let i = 0; i < 5; i++) {
      const x = ((i * 320 - off) % (GAME_WIDTH + 300)+ GAME_WIDTH + 300) % (GAME_WIDTH + 300) - 150;
      const y = 90 + ((i * 137) % 300);
      ctx.beginPath();
      ctx.ellipse(x, y, 90, 26, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  private drawHills(
    ctx: CanvasRenderingContext2D,
    offset: number,
    baseY: number,
    amplitude: number,
    color: string,
    alpha: number
  ): void {
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, GAME_HEIGHT);
    for (let x = 0; x <= GAME_WIDTH; x += 16) {
      const wx = (x + offset) * 0.008;
      const y = baseY - Math.abs(Math.sin(wx)) * amplitude - Math.sin(wx * 2.7) * amplitude * 0.3;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(GAME_WIDTH, GAME_HEIGHT);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}
