// Pooled particle system — one array, no allocation churn during gameplay.

interface Particle {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  gravity: number;
  shape: "circle" | "star" | "poop";
}

const POOL_SIZE = 600;
const RAINBOW = ["#ff5f6d", "#ffc371", "#f9ed69", "#7ed957", "#4bc0ff", "#b06ab3"];

export class ParticleSystem {
  private pool: Particle[] = [];

  constructor() {
    for (let i = 0; i < POOL_SIZE; i++) {
      this.pool.push({
        active: false, x: 0, y: 0, vx: 0, vy: 0,
        life: 0, maxLife: 1, size: 3, color: "#fff", gravity: 0, shape: "circle",
      });
    }
  }

  private spawn(cfg: Partial<Particle>): void {
    const p = this.pool.find((p) => !p.active);
    if (!p) return; // pool exhausted: silently skip, never allocate
    Object.assign(p, {
      active: true, x: 0, y: 0, vx: 0, vy: 0,
      life: 0, maxLife: 0.8, size: 4, color: "#fff", gravity: 0, shape: "circle",
    }, cfg);
  }

  rainbowTrail(x: number, y: number): void {
    this.spawn({
      x, y: y + (Math.random() - 0.5) * 26,
      vx: -80 - Math.random() * 60, vy: (Math.random() - 0.5) * 40,
      maxLife: 0.5 + Math.random() * 0.3,
      size: 3 + Math.random() * 4,
      color: RAINBOW[Math.floor(Math.random() * RAINBOW.length)],
    });
  }

  burst(x: number, y: number, color: string, count = 14, speed = 260): void {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const v = speed * (0.4 + Math.random() * 0.6);
      this.spawn({
        x, y,
        vx: Math.cos(angle) * v, vy: Math.sin(angle) * v,
        maxLife: 0.5 + Math.random() * 0.4,
        size: 3 + Math.random() * 5,
        color,
        gravity: 300,
      });
    }
  }

  rainbowBurst(x: number, y: number, count = 30): void {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const v = 150 + Math.random() * 350;
      this.spawn({
        x, y,
        vx: Math.cos(angle) * v, vy: Math.sin(angle) * v,
        maxLife: 0.7 + Math.random() * 0.5,
        size: 4 + Math.random() * 6,
        color: RAINBOW[i % RAINBOW.length],
        gravity: 250,
        shape: Math.random() < 0.4 ? "star" : "circle",
      });
    }
  }

  poopExplosion(x: number, y: number): void {
    for (let i = 0; i < 10; i++) {
      const angle = Math.random() * Math.PI * 2;
      const v = 120 + Math.random() * 260;
      this.spawn({
        x, y,
        vx: Math.cos(angle) * v, vy: Math.sin(angle) * v - 150,
        maxLife: 0.9 + Math.random() * 0.4,
        size: 10 + Math.random() * 8,
        color: "#8d5a2b",
        gravity: 600,
        shape: "poop",
      });
    }
    this.rainbowBurst(x, y, 18);
  }

  update(dt: number): void {
    for (const p of this.pool) {
      if (!p.active) continue;
      p.life += dt;
      if (p.life >= p.maxLife) {
        p.active = false;
        continue;
      }
      p.vy += p.gravity * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
  }

  draw(ctx: CanvasRenderingContext2D, poopImg?: HTMLImageElement): void {
    for (const p of this.pool) {
      if (!p.active) continue;
      const alpha = 1 - p.life / p.maxLife;
      ctx.globalAlpha = alpha;
      if (p.shape === "poop" && poopImg) {
        ctx.drawImage(poopImg, p.x - p.size, p.y - p.size, p.size * 2, p.size * 2);
      } else if (p.shape === "star") {
        this.drawStar(ctx, p.x, p.y, p.size, p.color);
      } else {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }

  private drawStar(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string): void {
    ctx.fillStyle = color;
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const outer = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
      const inner = outer + Math.PI / 5;
      ctx.lineTo(x + Math.cos(outer) * r, y + Math.sin(outer) * r);
      ctx.lineTo(x + Math.cos(inner) * r * 0.5, y + Math.sin(inner) * r * 0.5);
    }
    ctx.closePath();
    ctx.fill();
  }
}
