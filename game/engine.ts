// Game engine: owns the loop, physics, collisions, scoring and canvas rendering.
// React never touches the loop — it only starts the engine and receives the final stats.

import {
  BASE_WORLD_SPEED, BOMB_GEMS_REQUIRED, BOMB_MAX_CHARGES, CLOUD_BOMB_POINTS,
  COMBO_PER_MULTIPLIER, DASH_COOLDOWN, DASH_DURATION, DASH_IFRAMES, DASH_SPEED_BONUS,
  FLAP_IMPULSE, GAME_HEIGHT, GAME_WIDTH, GEM_POINTS, GLIDE_GRAVITY_FACTOR, GLIDE_MAX_FALL,
  GRAVITY, HIT_IFRAMES, MAGNET_RADIUS, MAX_FALL_SPEED, MAX_LIVES, MAX_MULTIPLIER,
  MAX_WORLD_SPEED, NEAR_MISS_POINTS, PLAYER_HITBOX_SCALE, PLAYER_X, PX_PER_METER,
  RUSH_DURATION, RUSH_SCORE_FACTOR, RUSH_SPEED_FACTOR, SPEED_RAMP_PER_SEC,
  STAR_POINTS, START_LIVES,
} from "./constants";
import { assets } from "./assets.manager";
import { audio } from "./audio.manager";
import { InputManager } from "./input.manager";
import { ParticleSystem } from "./particles.system";
import { BackgroundSystem } from "./background.system";
import { SpawnerSystem } from "./spawner.system";
import { updateEntity, WorldEntity } from "./entities";
import { GhostData, GhostRecorder, ghostYAt, loadGhost } from "./ghost";

export interface RunStats {
  score: number;
  distanceM: number;
  gems: number;
  stars: number;
  maxCombo: number;
  rushes: number;
  bombs: number;
  timeSurvived: number;
}

interface FloatingText {
  x: number; y: number; text: string; color: string; life: number; size: number;
}

export class GameEngine {
  private ctx: CanvasRenderingContext2D;
  private input = new InputManager();
  private particles = new ParticleSystem();
  private background = new BackgroundSystem();
  private spawner = new SpawnerSystem();
  private ghostRecorder = new GhostRecorder();
  private ghost: GhostData | null = null;

  private entities: WorldEntity[] = [];
  private floatingTexts: FloatingText[] = [];

  // Player state
  private playerY = GAME_HEIGHT / 2;
  private playerVy = 0;
  private wingFrame = 1; // 0 up, 1 mid, 2 down
  private flapAnimTime = 0;

  // Run state
  private time = 0;
  private distancePx = 0;
  private worldSpeed = BASE_WORLD_SPEED;
  private score = 0;
  private lives = START_LIVES;
  private combo = 0;
  private maxCombo = 0;
  private gems = 0;
  private starsCollected = 0;
  private rushTime = 0;
  private rushes = 0;
  private bombGauge = 0;
  private bombCharges = 0;
  private bombsUsed = 0;
  private dashTime = 0;
  private dashCooldown = 0;
  private iframes = 0;
  private shake = 0;
  private hitFlash = 0;
  private lastBiomeIndex = -1;
  private biomeToast = 0;
  private biomeToastName = "";

  private paused = false;
  private over = false;
  private rafId = 0;
  private lastTs = 0;

  constructor(
    private canvas: HTMLCanvasElement,
    private onGameOver: (stats: RunStats) => void
  ) {
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D context unavailable");
    this.ctx = ctx;
  }

  start(): void {
    this.ghost = loadGhost();
    this.ghostRecorder.reset();
    this.input.attach(this.canvas);
    document.addEventListener("visibilitychange", this.onVisibilityChange);
    audio.startMusic();
    this.lastTs = performance.now();
    this.rafId = requestAnimationFrame(this.frame);
  }

  destroy(): void {
    cancelAnimationFrame(this.rafId);
    document.removeEventListener("visibilitychange", this.onVisibilityChange);
    this.input.detach();
    audio.stopMusic();
    audio.setMusicRate(1);
  }

  // Auto-pause when the tab loses visibility — no unfair deaths in a background tab
  private onVisibilityChange = (): void => {
    if (document.hidden && !this.over && !this.paused) {
      this.paused = true;
      audio.pauseMusic();
    }
  };

  private frame = (ts: number): void => {
    const dt = Math.min((ts - this.lastTs) / 1000, 1 / 20); // clamp to avoid tunnel on tab switch
    this.lastTs = ts;

    if (this.input.pausePressed && !this.over) {
      this.paused = !this.paused;
      if (this.paused) audio.pauseMusic();
      else audio.resumeMusic();
    }

    if (!this.paused && !this.over) this.update(dt);
    this.draw();
    this.input.clearFrame();

    if (!this.over) this.rafId = requestAnimationFrame(this.frame);
  };

  // ------------------------------------------------------------------ UPDATE
  private update(dt: number): void {
    this.time += dt;
    const rushActive = this.rushTime > 0;

    // World speed: ramps with time, boosted during rush and dash
    const ramp = Math.min(BASE_WORLD_SPEED + this.time * SPEED_RAMP_PER_SEC, MAX_WORLD_SPEED);
    this.worldSpeed = ramp * (rushActive ? RUSH_SPEED_FACTOR : 1) + (this.dashTime > 0 ? DASH_SPEED_BONUS : 0);
    this.distancePx += this.worldSpeed * dt;

    // Timers
    this.rushTime = Math.max(0, this.rushTime - dt);
    this.dashTime = Math.max(0, this.dashTime - dt);
    this.dashCooldown = Math.max(0, this.dashCooldown - dt);
    this.iframes = Math.max(0, this.iframes - dt);
    this.shake = Math.max(0, this.shake - dt * 30);
    this.hitFlash = Math.max(0, this.hitFlash - dt * 2);
    this.biomeToast = Math.max(0, this.biomeToast - dt);
    if (!rushActive) audio.setMusicRate(1);

    // ---- Player physics ----
    if (this.input.flapPressed) {
      this.playerVy = FLAP_IMPULSE;
      this.flapAnimTime = 0.28;
      audio.play("flap");
      this.particles.burst(PLAYER_X - 20, this.playerY + 30, "#ffffff", 5, 120);
    }
    if (this.input.dashPressed && this.dashCooldown <= 0) {
      this.dashTime = DASH_DURATION;
      this.dashCooldown = DASH_COOLDOWN;
      this.iframes = Math.max(this.iframes, DASH_IFRAMES);
      audio.play("star");
      this.particles.rainbowBurst(PLAYER_X, this.playerY, 12);
    }
    if (this.input.bombPressed) this.useBomb();

    const gliding = this.input.holdingGlide && this.playerVy > 0;
    const g = gliding ? GRAVITY * GLIDE_GRAVITY_FACTOR : GRAVITY;
    this.playerVy = Math.min(this.playerVy + g * dt, gliding ? GLIDE_MAX_FALL : MAX_FALL_SPEED);
    this.playerY += this.playerVy * dt;

    // Soft ceiling / floor: bounce instead of instant death (kid-friendly, V1 spirit)
    if (this.playerY < 40) { this.playerY = 40; this.playerVy = Math.max(this.playerVy, 0); }
    if (this.playerY > GAME_HEIGHT - 50) {
      this.playerY = GAME_HEIGHT - 50;
      this.playerVy = FLAP_IMPULSE * 0.6; // trampoline floor
    }

    // Wing animation: flap cycle when impulse is fresh, else pose by velocity
    this.flapAnimTime = Math.max(0, this.flapAnimTime - dt);
    if (this.flapAnimTime > 0) {
      this.wingFrame = Math.floor(this.flapAnimTime * 20) % 3;
    } else {
      this.wingFrame = this.playerVy < -80 ? 0 : this.playerVy > 220 ? 2 : 1;
    }

    // Trails
    if (this.dashTime > 0 || rushActive) {
      this.particles.rainbowTrail(PLAYER_X - 40, this.playerY);
      this.particles.rainbowTrail(PLAYER_X - 40, this.playerY);
    } else if (Math.random() < 0.5) {
      this.particles.rainbowTrail(PLAYER_X - 40, this.playerY);
    }

    // Ghost recording
    this.ghostRecorder.record(dt, this.playerY);

    // ---- Spawning ----
    const distanceM = this.distancePx / PX_PER_METER;
    const { biome, index } = this.background.biomeAt(distanceM);
    if (index !== this.lastBiomeIndex) {
      this.lastBiomeIndex = index;
      if (this.time > 1) {
        this.biomeToast = 3;
        this.biomeToastName = biome.name;
        audio.play("notification");
      }
    }
    const difficulty = Math.min(this.time / 150, 1); // full difficulty at 2min30
    this.spawner.update(dt, difficulty, biome, this.lives, this.entities);

    // ---- Entities update + collisions ----
    const pw = 96 * PLAYER_HITBOX_SCALE;
    const ph = 96 * PLAYER_HITBOX_SCALE;
    for (const e of this.entities) {
      updateEntity(e, dt, this.worldSpeed, PLAYER_X, this.playerY, rushActive);
      if (e.dead) continue;

      const hw = (e.width * (e.kind === "cloud" ? 0.7 : 1)) / 2;
      const hh = (e.height * (e.kind === "cloud" ? 0.7 : 1)) / 2;
      const dx = Math.abs(e.x - PLAYER_X);
      const dy = Math.abs(e.y - this.playerY);
      const hit = dx < hw + pw / 2 && dy < hh + ph / 2;

      if (e.kind === "cloud") {
        if (hit) {
          if (rushActive || this.iframes > 0) {
            if (rushActive || this.dashTime > 0) this.destroyCloud(e); // plow through
          } else {
            this.takeHit(e);
          }
        } else if (!e.nearMissAwarded && e.x < PLAYER_X && dx < 140 && dy < 120) {
          // Passed a cloud closely without touching → near-miss bonus
          e.nearMissAwarded = true;
          this.addScore(NEAR_MISS_POINTS, e.x, e.y, "#ffffff", "frôlé !");
        }
      } else if (hit) {
        this.collect(e);
      }
    }
    this.entities = this.entities.filter((e) => !e.dead);

    // Floating texts
    for (const t of this.floatingTexts) {
      t.life -= dt;
      t.y -= 40 * dt;
    }
    this.floatingTexts = this.floatingTexts.filter((t) => t.life > 0);

    this.particles.update(dt);
    this.background.update(dt, this.worldSpeed);
  }

  private multiplier(): number {
    return Math.min(1 + Math.floor(this.combo / COMBO_PER_MULTIPLIER), MAX_MULTIPLIER);
  }

  private addScore(points: number, x: number, y: number, color: string, label?: string): void {
    const rushFactor = this.rushTime > 0 ? RUSH_SCORE_FACTOR : 1;
    const total = points * this.multiplier() * rushFactor;
    this.score += total;
    this.floatingTexts.push({
      x, y, text: label ?? `+${total}`, color, life: 0.9, size: label ? 20 : 24,
    });
    if (this.floatingTexts.length > 12) this.floatingTexts.shift();
  }

  private collect(e: WorldEntity): void {
    e.dead = true;
    switch (e.kind) {
      case "gem": {
        this.gems++;
        this.combo++;
        this.maxCombo = Math.max(this.maxCombo, this.combo);
        this.addScore(GEM_POINTS, e.x, e.y, "#ffe066");
        audio.play("gem");
        this.particles.burst(e.x, e.y, "#ffe066", 8, 180);
        // Bomb gauge fills with gems
        if (this.bombCharges < BOMB_MAX_CHARGES) {
          this.bombGauge++;
          if (this.bombGauge >= BOMB_GEMS_REQUIRED) {
            this.bombGauge = 0;
            this.bombCharges++;
            audio.play("bombReady");
            this.floatingTexts.push({
              x: PLAYER_X, y: this.playerY - 70, text: "💩 CACALICORNE PRÊTE !",
              color: "#ff9ff3", life: 1.4, size: 26,
            });
          }
        }
        break;
      }
      case "star":
        this.starsCollected++;
        this.combo += 2;
        this.maxCombo = Math.max(this.maxCombo, this.combo);
        this.addScore(STAR_POINTS, e.x, e.y, "#fdcb6e");
        audio.play("star");
        this.particles.rainbowBurst(e.x, e.y, 16);
        break;
      case "rainbow":
        this.rushes++;
        this.rushTime = RUSH_DURATION;
        audio.play("rainbow");
        audio.setMusicRate(1.12);
        this.addScore(50, e.x, e.y, "#ff6b9d", "RAINBOW RUSH !");
        this.particles.rainbowBurst(e.x, e.y, 40);
        this.shake = Math.max(this.shake, 6);
        break;
      case "heart":
        if (this.lives < MAX_LIVES) this.lives++;
        audio.play("life");
        this.addScore(20, e.x, e.y, "#ff6b6b", "+1 ❤️");
        this.particles.burst(e.x, e.y, "#ff6b6b", 14, 220);
        break;
    }
  }

  private destroyCloud(e: WorldEntity): void {
    e.dead = true;
    this.addScore(CLOUD_BOMB_POINTS, e.x, e.y, "#a29bfe");
    audio.play("cloudPop");
    this.particles.burst(e.x, e.y, "#dfe6e9", 12, 240);
    this.shake = Math.max(this.shake, 3);
  }

  private useBomb(): void {
    if (this.bombCharges <= 0) return;
    this.bombCharges--;
    this.bombsUsed++;
    audio.play("bomb");
    this.particles.poopExplosion(PLAYER_X, this.playerY);
    this.shake = 10;
    // Wipe every cloud currently on screen
    for (const e of this.entities) {
      if (e.kind === "cloud" && !e.dead && e.x < GAME_WIDTH + 60) this.destroyCloud(e);
    }
  }

  private takeHit(cloud: WorldEntity): void {
    cloud.dead = true;
    this.lives--;
    this.combo = 0;
    this.iframes = HIT_IFRAMES;
    this.shake = 8;
    this.hitFlash = 1;
    audio.play("hit");
    this.particles.burst(PLAYER_X, this.playerY, "#636e72", 18, 300);
    if (this.lives <= 0) this.endRun();
  }

  private endRun(): void {
    this.over = true;
    audio.stopMusic();
    audio.play("gameOver");
    this.ghostRecorder.saveIfBest(this.score);
    const stats: RunStats = {
      score: Math.round(this.score),
      distanceM: Math.round(this.distancePx / PX_PER_METER),
      gems: this.gems,
      stars: this.starsCollected,
      maxCombo: this.maxCombo,
      rushes: this.rushes,
      bombs: this.bombsUsed,
      timeSurvived: Math.round(this.time),
    };
    // Small delay so the death burst is visible before the overlay
    setTimeout(() => this.onGameOver(stats), 650);
  }

  // -------------------------------------------------------------------- DRAW
  private draw(): void {
    const ctx = this.ctx;
    const rushActive = this.rushTime > 0;
    ctx.save();

    // Screenshake
    if (this.shake > 0) {
      ctx.translate((Math.random() - 0.5) * this.shake * 2, (Math.random() - 0.5) * this.shake * 2);
    }

    this.background.draw(ctx, this.distancePx / PX_PER_METER, rushActive);

    // Ghost (best run replay)
    if (this.ghost) {
      const gy = ghostYAt(this.ghost, this.time);
      if (gy !== null) {
        ctx.globalAlpha = 0.28;
        this.drawUnicorn(ctx, PLAYER_X - 90, gy, 1, 0);
        ctx.globalAlpha = 1;
      }
    }

    // Entities
    for (const e of this.entities) {
      const img = assets.images[e.image];
      if (!img) continue;
      if (e.kind === "star" || e.kind === "rainbow") {
        // Gentle pulse on high-value pickups
        const s = 1 + Math.sin(e.wobble * 2) * 0.08;
        ctx.drawImage(img, e.x - (e.width * s) / 2, e.y - (e.height * s) / 2, e.width * s, e.height * s);
      } else {
        ctx.drawImage(img, e.x - e.width / 2, e.y - e.height / 2, e.width, e.height);
      }
    }

    this.particles.draw(ctx, assets.images.poop);

    // Player (blinks during i-frames)
    const blinking = this.iframes > 0 && this.dashTime <= 0 && Math.floor(this.iframes * 10) % 2 === 0;
    if (!blinking) {
      const angle = Math.max(-0.45, Math.min(0.6, this.playerVy / 1200));
      this.drawUnicorn(ctx, PLAYER_X, this.playerY, this.dashTime > 0 ? 1.12 : 1, angle);
    }

    this.drawHud(ctx, rushActive);

    // Hit flash vignette
    if (this.hitFlash > 0) {
      ctx.fillStyle = `rgba(255, 60, 60, ${this.hitFlash * 0.25})`;
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    }

    if (this.paused) {
      ctx.fillStyle = "rgba(20, 10, 40, 0.6)";
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 64px 'Trebuchet MS', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("PAUSE", GAME_WIDTH / 2, GAME_HEIGHT / 2);
      ctx.font = "24px 'Trebuchet MS', sans-serif";
      ctx.fillText("Échap / P pour reprendre", GAME_WIDTH / 2, GAME_HEIGHT / 2 + 50);
    }

    ctx.restore();
  }

  private drawUnicorn(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, angle: number): void {
    const frames = [assets.images.unicornUp, assets.images.unicornMid, assets.images.unicornDown];
    const img = frames[this.wingFrame];
    if (!img) return;
    const w = 110 * scale;
    const h = (110 * img.height) / img.width * scale;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.drawImage(img, -w / 2, -h / 2, w, h);
    ctx.restore();
  }

  private drawHud(ctx: CanvasRenderingContext2D, rushActive: boolean): void {
    ctx.textAlign = "left";
    ctx.textBaseline = "top";

    // Score
    ctx.font = "bold 44px 'Trebuchet MS', sans-serif";
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.fillText(`${Math.round(this.score)}`, 26, 22);
    ctx.fillStyle = "#ffffff";
    ctx.fillText(`${Math.round(this.score)}`, 24, 20);

    // Multiplier chip
    const mult = this.multiplier();
    if (mult > 1) {
      ctx.font = "bold 26px 'Trebuchet MS', sans-serif";
      ctx.fillStyle = rushActive ? "#ff6b9d" : "#ffe066";
      ctx.fillText(`x${mult}${rushActive ? " x2 🌈" : ""}`, 26, 72);
    }

    // Combo progress bar toward next multiplier
    if (this.combo > 0) {
      const progress = (this.combo % COMBO_PER_MULTIPLIER) / COMBO_PER_MULTIPLIER;
      ctx.fillStyle = "rgba(255,255,255,0.3)";
      ctx.fillRect(24, 108, 120, 8);
      ctx.fillStyle = "#ffe066";
      ctx.fillRect(24, 108, 120 * progress, 8);
    }

    // Distance (top center)
    ctx.textAlign = "center";
    ctx.font = "bold 28px 'Trebuchet MS', sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.fillText(`${Math.round(this.distancePx / PX_PER_METER)} m`, GAME_WIDTH / 2, 24);

    // Lives (top right)
    const lifeImg = assets.images.life;
    if (lifeImg) {
      for (let i = 0; i < this.lives; i++) {
        ctx.drawImage(lifeImg, GAME_WIDTH - 30 - (i + 1) * 44, 20, 38, 38);
      }
    }

    // Bomb gauge (bottom left)
    const poopImg = assets.images.poop;
    if (poopImg) {
      for (let i = 0; i < this.bombCharges; i++) {
        ctx.drawImage(poopImg, 24 + i * 48, GAME_HEIGHT - 66, 42, 42);
      }
      if (this.bombCharges < BOMB_MAX_CHARGES) {
        const gx = 24 + this.bombCharges * 48;
        ctx.globalAlpha = 0.35;
        ctx.drawImage(poopImg, gx, GAME_HEIGHT - 66, 42, 42);
        ctx.globalAlpha = 1;
        // Fill ring
        ctx.strokeStyle = "#ff9ff3";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(gx + 21, GAME_HEIGHT - 45, 26, -Math.PI / 2,
          -Math.PI / 2 + (this.bombGauge / BOMB_GEMS_REQUIRED) * Math.PI * 2);
        ctx.stroke();
      }
      if (this.bombCharges > 0) {
        ctx.textAlign = "left";
        ctx.font = "16px 'Trebuchet MS', sans-serif";
        ctx.fillStyle = "rgba(255,255,255,0.8)";
        ctx.fillText("[B] BOOM", 24, GAME_HEIGHT - 92);
      }
    }

    // Rush timer bar
    if (rushActive) {
      const w = 300 * (this.rushTime / RUSH_DURATION);
      const grad = ctx.createLinearGradient(GAME_WIDTH / 2 - 150, 0, GAME_WIDTH / 2 + 150, 0);
      ["#ff5f6d", "#ffc371", "#f9ed69", "#7ed957", "#4bc0ff", "#b06ab3"].forEach((c, i, arr) =>
        grad.addColorStop(i / (arr.length - 1), c)
      );
      ctx.fillStyle = grad;
      ctx.fillRect(GAME_WIDTH / 2 - w / 2, 64, w, 10);
    }

    // Biome toast
    if (this.biomeToast > 0) {
      const alpha = Math.min(1, this.biomeToast);
      ctx.globalAlpha = alpha;
      ctx.textAlign = "center";
      ctx.font = "bold 36px 'Trebuchet MS', sans-serif";
      ctx.fillStyle = "#ffffff";
      ctx.shadowColor = "rgba(0,0,0,0.4)";
      ctx.shadowBlur = 12;
      ctx.fillText(`✨ ${this.biomeToastName} ✨`, GAME_WIDTH / 2, 120);
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
    }

    // Floating score texts
    ctx.textAlign = "center";
    for (const t of this.floatingTexts) {
      ctx.globalAlpha = Math.min(1, t.life * 2);
      ctx.font = `bold ${t.size}px 'Trebuchet MS', sans-serif`;
      ctx.fillStyle = t.color;
      ctx.fillText(t.text, t.x, t.y);
    }
    ctx.globalAlpha = 1;
  }
}
