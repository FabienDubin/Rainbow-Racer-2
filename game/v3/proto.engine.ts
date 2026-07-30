// PHASE 0 — the verb, naked.
//
// Purpose: answer one question honestly — is swinging on the Arc already fun
// for three minutes with no art, no sound, no score juice? Nothing here is
// meant to survive into the real game except the physics, which is the point.
//
// Control (context-sensitive, one input):
//   press  → attach to the best anchor in range; if none in range, flap
//   hold   → stay attached (rope reels in, you climb)
//   release→ launch along your tangential velocity
//
// World Y points UP. Screen conversion happens only at draw time.

import {
  AIR_DRAG, CAM_FOLLOW_SPEED, CAM_PLAYER_SCREEN_FRAC, CHAIN_DROP_TOLERANCE,
  DEATH_MARGIN, FLAP_CHARGES, FLAP_COOLDOWN, FLAP_IMPULSE, GRAVITY, MAX_FALL_SPEED,
  CAM_SPEED_LOOKAHEAD, MAX_ATTACH_TIME_DIVE, MAX_ATTACH_TIME_LIFT, MAX_SWING_SPEED,
  MAX_SWING_TANGENTIAL, MIN_SWING_ANGLE, PX_PER_METER,
  GRAB_COOLDOWN, REEL_SPEED, REF_RELEASE_SPEED, REGRAB_LOCKOUT, ROPE_MIN, ROW_MARGIN_X,
  ROW_SPACING, WRAP_MARGIN,
  START_VY, STORM_ACCEL, STORM_SPEED_BASE, STORM_START_BELOW,
  STREAK_COUNT, STREAK_MAX_SPEED, STREAK_MIN_SPEED, SWING_PUMP, SWING_RECOVERY_DRIVE,
  SWING_STALL_FLOOR, RELEASE_KICK, TETHER_RANGE, VIEW_H, VIEW_W, WHIP_RECOVERY,
  WINCH_BUDGET, WINCH_FLOOR,
} from "./proto.constants";

interface Anchor {
  x: number;
  y: number;
  used: boolean; // visual only: shows the route you actually took
  skip: boolean; // a high rung, only reachable off a strong vertical launch
}

export interface ProtoStats {
  altitudeM: number;
  bestChain: number;
  attaches: number;
  flaps: number;
  slips: number; // releases with no real swing behind them
  pureFlight: boolean; // reached the end without a single flap
  timeSurvived: number;
}

export class ProtoEngine {
  private ctx: CanvasRenderingContext2D;

  // Player
  private px = VIEW_W / 2;
  private py = 0;
  private vx = 0;
  private vy = START_VY;

  // Tether
  private anchor: Anchor | null = null;
  private ropeLen = 0;
  private swingSign = 0; // which way the pendulum is being driven
  private sweptAngle = 0; // rad swept while taut — a real swing vs a spam tap
  private attachTime = 0; // s on the current rung
  private attachLimit = MAX_ATTACH_TIME_LIFT; // set per grab: a dive earns a longer arc
  private divedOn = false; // did we grab an anchor that was below us?
  private lastAngle = 0;
  private wasTaut = false; // was the rope taut last frame — gates the whip to the catch
  private whipFlash = 0; // visual feedback on a strong catch
  private whipCount = 0; // diagnostic: catches per run. Repeated whips = free energy.
  private slips = 0; // releases that never earned a swing
  private lastReleased: Anchor | null = null;
  private regrabTimer = 0;
  private grabCooldown = 0; // forced free flight after any release
  private autoReleases = 0; // swings the player let run to the end of the arc
  private reelLeft = 0; // rope this rung will still give you
  private skipsTaken = 0; // high rungs reached — the expert-play payoff
  private winchCharge = 1; // 0..1, set by the quality of your last release
  private lastReleaseQuality = 1;
  private stormY = -STORM_START_BELOW; // Le Grondement, rising from below

  // Wings
  private flapCharges = FLAP_CHARGES;
  private flapTimer = 0;

  // Run state
  private anchors: Anchor[] = [];
  private generatedTo = 0;
  private lastGenX = VIEW_W / 2;
  private rowsSinceSkip = 0;
  private camY = 0;
  private peakY = 0;
  private chain = 0;
  private bestChain = 0;
  private attaches = 0;
  private flaps = 0;
  private time = 0;
  private over = false;

  // Input
  private pressed = false; // level: is the finger/key down right now
  private pressEdge = false; // edge: went down this frame
  private releaseEdge = false; // edge: came up this frame

  // Feedback (minimal — just enough to judge feel, no juice)
  private flashRelease = 0;
  private flashAttach = 0;

  private rafId = 0;
  private lastTs = 0;
  private detachFns: (() => void)[] = [];

  // Logical width is fixed; logical HEIGHT follows the real canvas box. Phones range
  // from 16:9 to 20:9, and a fixed 540x960 buffer stretched into a taller box turned
  // every swing circle into an ellipse — which quietly misreads the physics you are
  // trying to feel. Taller screens now simply show more sky.
  private viewH = VIEW_H;

  constructor(
    private canvas: HTMLCanvasElement,
    private onEnd: (stats: ProtoStats) => void
  ) {
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D context unavailable");
    this.ctx = ctx;

    const boxW = canvas.clientWidth || VIEW_W;
    const boxH = canvas.clientHeight || this.viewH;
    this.viewH = Math.round(VIEW_W * (boxH / boxW));
    canvas.width = VIEW_W;
    canvas.height = this.viewH;
    this.camY = this.py + (0.5 - CAM_PLAYER_SCREEN_FRAC) * this.viewH * -1;
    this.generateUpTo(this.camY + this.viewH * 1.5);
  }

  // ------------------------------------------------------------- lifecycle
  start(): void {
    this.attachInput();
    this.lastTs = performance.now();
    this.rafId = requestAnimationFrame(this.frame);
  }

  destroy(): void {
    cancelAnimationFrame(this.rafId);
    this.detachFns.forEach((fn) => fn());
    this.detachFns = [];
  }

  private attachInput(): void {
    const down = (e: Event) => {
      e.preventDefault();
      if (!this.pressed) this.pressEdge = true;
      this.pressed = true;
    };
    const up = () => {
      if (this.pressed) this.releaseEdge = true;
      this.pressed = false;
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code !== "Space" || e.repeat) return;
      down(e);
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") up();
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    this.canvas.addEventListener("pointerdown", down);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);

    this.detachFns = [
      () => window.removeEventListener("keydown", onKeyDown),
      () => window.removeEventListener("keyup", onKeyUp),
      () => this.canvas.removeEventListener("pointerdown", down),
      () => window.removeEventListener("pointerup", up),
      () => window.removeEventListener("pointercancel", up),
    ];
  }

  private frame = (ts: number): void => {
    const dt = Math.min((ts - this.lastTs) / 1000, 1 / 30);
    this.lastTs = ts;
    if (!this.over) this.update(dt);
    this.draw();
    this.pressEdge = false;
    this.releaseEdge = false;
    if (!this.over) this.rafId = requestAnimationFrame(this.frame);
  };

  // ---------------------------------------------------------------- update
  private update(dt: number): void {
    this.time += dt;
    this.flapTimer = Math.max(0, this.flapTimer - dt);
    this.regrabTimer = Math.max(0, this.regrabTimer - dt);
    this.grabCooldown = Math.max(0, this.grabCooldown - dt);
    this.flashRelease = Math.max(0, this.flashRelease - dt * 3);
    this.flashAttach = Math.max(0, this.flashAttach - dt * 3);
    this.whipFlash = Math.max(0, this.whipFlash - dt * 2.5);

    // ---- Input resolution: one press means "attach", or "flap" if nothing in range
    if (this.pressEdge) {
      const target = this.pickAnchor();
      if (target) this.attach(target);
      else this.flap();
    }
    if (this.releaseEdge && this.anchor) this.release();

    // ---- Integrate
    this.vy -= GRAVITY * dt;
    this.vy = Math.max(this.vy, -MAX_FALL_SPEED);
    this.vx *= 1 - AIR_DRAG * dt;
    this.px += this.vx * dt;
    this.py += this.vy * dt;

    if (this.anchor) this.solveRope(dt);

    // Leave one side, come back on the other. Bouncing off the walls halved your
    // horizontal speed and flipped its direction — a momentum tax, in a game whose
    // whole point is now momentum. Wrapping keeps the velocity vector untouched, and
    // it turns a narrow portrait corridor into a loop you can route around.
    // Wrap only in free flight. While roped you stay in the anchor's own frame, so the
    // swing can carry you past the edge without the world folding underneath you.
    if (this.anchor === null) this.px = this.wrapX(this.px);

    // Global speed governor. The release kick is multiplicative, and until the walls
    // were removed their 50% damping was quietly capping it — so speed compounded the
    // moment wrapping went in (measured 1667px/s against a 1400 ceiling, still rising).
    // A cap belongs here, explicitly, not as a side effect of the level geometry.
    const speed = Math.hypot(this.vx, this.vy);
    if (speed > MAX_SWING_SPEED) {
      this.vx = (this.vx / speed) * MAX_SWING_SPEED;
      this.vy = (this.vy / speed) * MAX_SWING_SPEED;
    }

    // ---- Chain: broken by losing real altitude below your peak
    if (this.py > this.peakY) this.peakY = this.py;
    if (this.peakY - this.py > CHAIN_DROP_TOLERANCE) this.chain = 0;

    // ---- Camera rises only, never descends. It leans ahead when you are moving fast,
    // which both shows more of what is coming and sells the speed.
    const lookahead = Math.max(0, this.vy) * CAM_SPEED_LOOKAHEAD;
    const camTarget = this.py + (CAM_PLAYER_SCREEN_FRAC - 0.5) * this.viewH + lookahead;
    if (camTarget > this.camY) {
      this.camY += (camTarget - this.camY) * Math.min(1, CAM_FOLLOW_SPEED * dt);
    }

    this.generateUpTo(this.camY + this.viewH * 1.2);
    this.anchors = this.anchors.filter((a) => a.y > this.camY - this.viewH);

    // ---- Le Grondement rises, and accelerates
    this.stormY += (STORM_SPEED_BASE + STORM_ACCEL * this.time) * dt;

    // ---- Fail: caught by the storm, or dropped off the bottom of the view
    if (this.py < this.stormY) this.end();
    if (this.screenY(this.py) > this.viewH + DEATH_MARGIN) this.end();
  }

  // Horizontal distance the short way round the cylinder. Everything that reasons
  // about "how far across" must use this, or the seam becomes a wall again.
  private get wrapW(): number {
    return VIEW_W + WRAP_MARGIN * 2;
  }

  private wrapX(x: number): number {
    const w = this.wrapW;
    if (x < -WRAP_MARGIN) return x + w;
    if (x >= VIEW_W + WRAP_MARGIN) return x - w;
    return x;
  }

  // NOTE: there is deliberately no wrapped-delta helper any more.
  // Wrapping is a property of free flight, not of the rope. Letting the tether take the
  // short way round the cylinder meant you could grab an anchor 590px away on the far
  // side of the screen and get yanked bodily across it — which is what "je sors d'un
  // côté et je réapparais de l'autre" was actually describing. A rope takes no
  // shortcuts: every tether calculation below uses plain, direct geometry.

  // Pick the best anchor in range: nearest, but strongly biased toward ones above us
  private pickAnchor(): Anchor | null {
    if (this.grabCooldown > 0) return null; // the arc has to reform
    let best: Anchor | null = null;
    let bestScore = Infinity;
    for (const a of this.anchors) {
      if (a === this.anchor) continue;
      // Don't let the player re-grab the rung they just left and stall out
      if (a === this.lastReleased && this.regrabTimer > 0) continue;
      const dx = a.x - this.px;
      const dy = a.y - this.py;
      const dist = Math.hypot(dx, dy);
      if (dist > TETHER_RANGE || dist < 30) continue;
      // Still prefer height, but only mildly: now that a catch whips your dive speed
      // into the swing, deliberately grabbing a ring below you and falling past it is
      // a real tactic rather than a mistake, so it must stay selectable.
      const score = dist - dy * 0.45;
      if (score < bestScore) {
        bestScore = score;
        best = a;
      }
    }
    return best;
  }

  private attach(a: Anchor): void {
    this.anchor = a;
    a.used = true;
    this.ropeLen = Math.max(ROPE_MIN, Math.hypot(a.x - this.px, a.y - this.py));
    this.attaches++;
    if (a.skip) this.skipsTaken++;
    this.reelLeft = WINCH_BUDGET * this.winchCharge;
    this.sweptAngle = 0;
    this.attachTime = 0;
    this.wasTaut = false;
    // A dive (anchor below us) is a committed move and gets the whole arc; a lift
    // (anchor above us) stays short and snappy.
    this.divedOn = a.y < this.py;
    this.attachLimit = this.divedOn ? MAX_ATTACH_TIME_DIVE : MAX_ATTACH_TIME_LIFT;
    this.lastAngle = Math.atan2(this.py - a.y, this.px - a.x);
    this.flashAttach = 1;
    // Drive the pendulum the way we're already travelling; fall back to our side
    const adx = this.px - a.x;
    const adist = Math.max(1, Math.hypot(adx, this.py - a.y));
    const nx = adx / adist;
    const ny = (this.py - a.y) / adist;
    const tangential = this.vx * -ny + this.vy * nx;
    this.swingSign = Math.sign(tangential) || Math.sign(this.px - a.x) || 1;
  }

  // Releasing is only worth something if you actually swung. A tap-release is a
  // "slip": you keep your momentum but earn no chain link and no wing refill.
  private release(auto = false): void {
    this.lastReleased = this.anchor;
    this.regrabTimer = REGRAB_LOCKOUT;
    this.grabCooldown = GRAB_COOLDOWN;
    this.anchor = null;
    this.flashRelease = 1;
    if (auto) this.autoReleases++;

    // Score the release: how fast, and how close to straight up. This becomes the
    // fuel for the next rung's winch, so timing directly buys altitude.
    const speed = Math.hypot(this.vx, this.vy);
    const speedFactor = Math.min(1, speed / REF_RELEASE_SPEED);
    const upFactor = speed > 1 ? Math.max(0, this.vy / speed) : 0;
    const quality = speedFactor * 0.35 + upFactor * 0.65;
    this.lastReleaseQuality = quality;
    this.winchCharge = Math.max(WINCH_FLOOR, quality);

    if (this.sweptAngle < MIN_SWING_ANGLE) {
      this.slips++;
      return;
    }
    this.chain++;
    this.bestChain = Math.max(this.bestChain, this.chain);
    this.flapCharges = FLAP_CHARGES;

    // The payoff you actually feel: a clean release accelerates you. Scaled by quality,
    // so a well-aimed let-go is a kick and a scrappy one barely registers.
    const kick = 1 + RELEASE_KICK * quality;
    this.vx *= kick;
    this.vy *= kick;
  }

  private flap(): void {
    if (this.flapCharges <= 0 || this.flapTimer > 0) return;
    this.flapCharges--;
    this.flaps++;
    this.flapTimer = FLAP_COOLDOWN;
    this.vy = Math.max(this.vy, 0) + FLAP_IMPULSE;
  }

  // Rope as a real rope: constrains max distance, allows slack, kills only the
  // outward radial velocity.
  //
  // Two things happen while you hold, and together they are the whole mechanic:
  //   the winch shortens the rope  → you climb toward the anchor
  //   the drive pushes tangentially → you wind up orbital speed, capped
  // Because speed is capped, holding forever stops paying and the only remaining
  // variable is the angle you let go at. Velocity is tangential, so it points
  // straight up exactly when you are level with the anchor — a readable cue.
  private solveRope(dt: number): void {
    const a = this.anchor!;

    // Winch: strong, but each rung only hands out WINCH_BUDGET of rope
    if (this.reelLeft > 0 && this.ropeLen > ROPE_MIN) {
      const pull = Math.min(REEL_SPEED * dt, this.reelLeft, this.ropeLen - ROPE_MIN);
      this.ropeLen -= pull;
      this.reelLeft -= pull;
    }

    const dx = this.px - a.x;
    const dy = this.py - a.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 0.001) return;

    if (dist <= this.ropeLen) {
      this.wasTaut = false; // slack rope: free fall, and the next catch can whip again
      return;
    }

    const nx = dx / dist;
    const ny = dy / dist;
    this.px = a.x + nx * this.ropeLen;
    this.py = a.y + ny * this.ropeLen;

    // The rope can pull but never push, so outward radial velocity has to go.
    // Zeroing it outright threw away everything you earned by diving: grab a ring
    // below you, fall past it, and 100% of that speed was radial — destroyed on the
    // spot. So on the CATCH (and only there) a share of it is whipped into the
    // tangent instead, which is what makes a dive convert into a faster, higher swing.
    //
    // The edge check matters: while the rope stays taut, gravity produces an outward
    // radial component every single frame, and converting that continuously would be
    // a free motor — exactly the class of bug that made "never let go" unbeatable.
    const radial = this.vx * nx + this.vy * ny;
    if (radial > 0) {
      this.vx -= radial * nx;
      this.vy -= radial * ny;

      if (!this.wasTaut) {
        const rawTangential = this.vx * -ny + this.vy * nx;
        const tSign = Math.sign(rawTangential) || this.swingSign;
        this.vx += -ny * tSign * radial * WHIP_RECOVERY;
        this.vy += nx * tSign * radial * WHIP_RECOVERY;
        this.swingSign = tSign; // the dive decides which way we swing
        this.whipFlash = Math.min(1, radial / 700);
        this.whipCount++;
      }
    }
    this.wasTaut = true;

    // Tangential drive — gated by the SAME charge as the winch. This is the keystone:
    // both the climb and the spin-up are paid for by the quality of your last release,
    // so skill compounds and sloppiness spirals. Leaving the drive ungated made
    // "grab anything, drop on the way down" the strongest strategy in the game, because
    // simply being attached was profitable no matter how badly you flew.
    const tx = -ny * this.swingSign;
    const ty = nx * this.swingSign;
    const tangential = this.vx * tx + this.vy * ty;
    const ceiling = Math.max(
      SWING_STALL_FLOOR,
      MAX_SWING_TANGENTIAL * (0.5 + 0.5 * this.winchCharge)
    );
    // Recovery below the floor, gentle pump above it — see the constants for why.
    const base = tangential < SWING_STALL_FLOOR ? SWING_RECOVERY_DRIVE : SWING_PUMP;
    const drive = base * (0.35 + 0.65 * this.winchCharge);
    if (tangential < ceiling) {
      const add = Math.min(drive * dt, ceiling - tangential);
      this.vx += tx * add;
      this.vy += ty * add;
    }

    // Hard safety clamp
    const speed = Math.hypot(this.vx, this.vy);
    if (speed > MAX_SWING_SPEED) {
      this.vx = (this.vx / speed) * MAX_SWING_SPEED;
      this.vy = (this.vy / speed) * MAX_SWING_SPEED;
    }

    // Accumulate swept angle: tells a real swing from a spam tap, and bounds the arc
    const angle = Math.atan2(dy, dx);
    let delta = angle - this.lastAngle;
    while (delta > Math.PI) delta -= Math.PI * 2;
    while (delta < -Math.PI) delta += Math.PI * 2;
    this.sweptAngle += Math.abs(delta);
    this.lastAngle = angle;

    // The rope gives out after a fixed time. You get one swing per rung — so the
    // only question left is where in that arc you choose to let go.
    this.attachTime += dt;
    if (this.attachTime >= this.attachLimit) this.release(true);
  }

  // Anchors are generated as a *reachable chain*, not scattered at random.
  // Random placement was the flaw that made good launches worthless: you would
  // fling yourself perfectly upward and there was simply nothing up there.
  // Now a route always exists — so the skill is executing it, not hoping for it.
  //
  // Every few rungs the chain also offers a "skip" anchor set much higher: only a
  // strong, near-vertical release reaches it, and taking it skips a rung. That is
  // where expert play converts timing into altitude.
  private generateUpTo(topY: number): void {
    const clampX = (x: number) =>
      Math.max(ROW_MARGIN_X, Math.min(VIEW_W - ROW_MARGIN_X, x));

    while (this.generatedTo < topY) {
      const prevX = this.lastGenX;
      const rise = ROW_SPACING * (0.87 + Math.random() * 0.3);
      this.generatedTo += rise;

      // Step sideways within a cone the tether can actually cover: drift wider than
      // TETHER_RANGE and a perfect launch arrives next to nothing at all.
      const drift = (Math.random() - 0.5) * 260;
      const recenter = (VIEW_W / 2 - prevX) * 0.25;
      const x = clampX(prevX + drift + recenter);
      this.anchors.push({ x, y: this.generatedTo, used: false, skip: false });
      this.lastGenX = x;
      this.rowsSinceSkip++;

      // A branch: a second rung at similar height, so there is a real route choice
      if (Math.random() < 0.34) {
        const altX = clampX(x + (Math.random() < 0.5 ? -1 : 1) * (180 + Math.random() * 130));
        this.anchors.push({
          x: altX,
          y: this.generatedTo + (Math.random() - 0.5) * 70,
          used: false,
          skip: false,
        });
      }

      // A high rung to skip toward — the payoff for a well-aimed release
      if (this.rowsSinceSkip >= 3 && Math.random() < 0.55) {
        this.rowsSinceSkip = 0;
        this.anchors.push({
          x: clampX(x + (Math.random() - 0.5) * 220),
          y: this.generatedTo + 300 + Math.random() * 80,
          used: false,
          skip: true,
        });
      }
    }
  }

  private end(): void {
    this.over = true;
    this.onEnd({
      altitudeM: Math.round(Math.max(0, this.peakY) / PX_PER_METER),
      bestChain: this.bestChain,
      attaches: this.attaches,
      flaps: this.flaps,
      slips: this.slips,
      pureFlight: this.flaps === 0,
      timeSurvived: Math.round(this.time),
    });
  }

  private screenY(worldY: number): number {
    return this.viewH / 2 - (worldY - this.camY);
  }

  // ------------------------------------------------------------------ draw
  private draw(): void {
    const ctx = this.ctx;
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, VIEW_W, this.viewH);

    this.drawAltitudeGrid(ctx);
    this.drawStreaks(ctx);
    this.drawStorm(ctx);

    // Anchors: hollow ring, filled once used. The one currently in range gets a halo
    // so the context-sensitive input is never a guess.
    const inRange = this.anchor ? null : this.pickAnchor();
    for (const a of this.anchors) {
      const sy = this.screenY(a.y);
      if (sy < -40 || sy > this.viewH + 40) continue;
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(a.x, sy, 7, 0, Math.PI * 2);
      ctx.stroke();
      if (a.used) {
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(a.x, sy, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
      if (a === inRange) {
        ctx.strokeStyle = "rgba(255,255,255,0.45)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(a.x, sy, 15, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    // Rope + the swing circle, so the arc you're on is legible. Everything here is
    // drawn three times — at x, x-W and x+W — so a swing that crosses the seam reads
    // as one continuous arc instead of snapping across the screen.
    if (this.anchor) {
      const ay = this.screenY(this.anchor.y);
      ctx.save();
      ctx.strokeStyle = "rgba(255,255,255,0.18)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(this.anchor.x, ay, this.ropeLen, 0, Math.PI * 2);
      ctx.stroke();

      // The release window, made visible. Velocity on a circle is tangential, so it
      // points straight up exactly when you are level with the anchor. Marking those
      // two points turns invisible timing into something you can aim at.
      for (const side of [-1, 1]) {
        const mx = this.anchor.x + side * this.ropeLen;
        ctx.strokeStyle = "rgba(255,255,255,0.55)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(mx - 9, ay);
        ctx.lineTo(mx + 9, ay);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(mx, ay - 3);
        ctx.lineTo(mx, ay - 13);
        ctx.stroke();
      }

      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(this.anchor.x, ay);
      ctx.lineTo(this.px, this.screenY(this.py));
      ctx.stroke();
      ctx.restore();
    }

    // Player and velocity vector. Deliberately NOT mirrored across the seam: flying
    // off the side and vanishing for a beat before reappearing is the fun of it.
    const psy = this.screenY(this.py);
    const size = 20 + this.flashAttach * 5;

    for (const off of [0]) {
      const x = this.px + off;
      ctx.strokeStyle = this.flashRelease > 0 ? "#fff" : "rgba(255,255,255,0.4)";
      ctx.lineWidth = this.flashRelease > 0 ? 3 : 1.5;
      ctx.beginPath();
      ctx.moveTo(x, psy);
      ctx.lineTo(x + this.vx * 0.12, psy - this.vy * 0.12);
      ctx.stroke();

      ctx.fillStyle = "#fff";
      ctx.fillRect(x - size / 2, psy - size / 2, size, size);
    }

    this.drawOffscreenMarker(ctx);
    this.drawHud(ctx);
  }

  private drawAltitudeGrid(ctx: CanvasRenderingContext2D): void {
    const step = 10 * PX_PER_METER; // a line every 10 m gives a real sense of speed
    const startM = Math.floor((this.camY - this.viewH / 2) / step) * step;
    ctx.strokeStyle = "rgba(255,255,255,0.09)";
    ctx.fillStyle = "rgba(255,255,255,0.28)";
    ctx.font = "11px ui-monospace, monospace";
    ctx.lineWidth = 1;
    for (let y = startM; y < this.camY + this.viewH / 2 + step; y += step) {
      const sy = this.screenY(y);
      ctx.beginPath();
      ctx.moveTo(0, sy);
      ctx.lineTo(VIEW_W, sy);
      ctx.stroke();
      const m = Math.round(y / PX_PER_METER);
      if (m % 50 === 0 && m >= 0) ctx.fillText(`${m}m`, 6, sy - 5);
    }
  }

  // While you are out in the off-screen margin there is nothing to read — with a rope
  // attached you can infer your position from the arc, but in free flight you are just
  // gone. This puts a small chevron on the edge you left from, at your altitude, angled
  // the way you are actually travelling, so you always know where you are and where you
  // are heading. It fades as you get further out, then you reappear on the far side.
  private drawOffscreenMarker(ctx: CanvasRenderingContext2D): void {
    const onScreen = this.px >= 0 && this.px < VIEW_W;
    if (onScreen) return;

    const offLeft = this.px < 0;
    const dist = offLeft ? -this.px : this.px - VIEW_W;
    const fade = 1 - Math.min(1, dist / (WRAP_MARGIN * 1.15));
    const edgeX = offLeft ? 20 : VIEW_W - 20;
    const y = Math.max(30, Math.min(this.viewH - 30, this.screenY(this.py)));

    // Point along travel; screen Y is inverted relative to world Y
    const angle = Math.atan2(-this.vy, this.vx);

    ctx.save();
    ctx.globalAlpha = 0.35 + fade * 0.55;
    ctx.translate(edgeX, y);

    // A hollow ring marks the altitude, so the marker is readable even head-on
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, 13, 0, Math.PI * 2);
    ctx.stroke();

    ctx.rotate(angle);
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.moveTo(11, 0);
    ctx.lineTo(-4, -7);
    ctx.lineTo(-4, 7);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  // Speed streaks, aligned with travel and fading in above STREAK_MIN_SPEED. Now that
  // momentum is conserved rather than motorised, speed is the resource the player is
  // managing — so it has to be felt, not just implied by the altitude counter.
  private drawStreaks(ctx: CanvasRenderingContext2D): void {
    const speed = Math.hypot(this.vx, this.vy);
    // The burst right after a release is what sells the kick, so streaks spike for a
    // moment even below the usual speed threshold.
    const burst = this.flashRelease;
    if (speed < STREAK_MIN_SPEED && burst <= 0) return;
    const t = Math.min(
      1,
      Math.max(0, (speed - STREAK_MIN_SPEED) / (STREAK_MAX_SPEED - STREAK_MIN_SPEED)) + burst * 0.55
    );
    const ux = this.vx / speed;
    const uy = this.vy / speed;
    const psy = this.screenY(this.py);

    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 1;
    for (let i = 0; i < STREAK_COUNT; i++) {
      // Deterministic scatter around the player so streaks do not strobe frame to frame
      const seed = i * 2.399963;
      const spread = 150 + ((i * 97) % 260);
      const ox = Math.cos(seed) * spread;
      const oy = Math.sin(seed * 1.7) * spread * 1.6 + ((this.time * 400 * (0.6 + (i % 4) * 0.2)) % 900) - 450;
      const len = 26 + t * 90 * (0.5 + (i % 3) * 0.35);
      const x = this.px + ox;
      const y = psy + oy;
      ctx.globalAlpha = t * 0.32;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - ux * len, y + uy * len);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  // Phase 0 storm: a hatched band. No art, but the pressure has to be legible.
  private drawStorm(ctx: CanvasRenderingContext2D): void {
    const sy = this.screenY(this.stormY);
    if (sy < -20) return;
    ctx.fillStyle = "rgba(255,255,255,0.10)";
    ctx.fillRect(0, sy, VIEW_W, this.viewH - sy + DEATH_MARGIN);
    ctx.strokeStyle = "rgba(255,255,255,0.7)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, sy);
    ctx.lineTo(VIEW_W, sy);
    ctx.stroke();
    ctx.strokeStyle = "rgba(255,255,255,0.22)";
    ctx.lineWidth = 1;
    for (let x = -this.viewH; x < VIEW_W; x += 26) {
      ctx.beginPath();
      ctx.moveTo(x, sy);
      ctx.lineTo(x + this.viewH, sy + this.viewH);
      ctx.stroke();
    }
    // Distance to the storm — the number the player actually plays against
    const gap = Math.round((this.py - this.stormY) / PX_PER_METER);
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    ctx.font = "600 13px ui-monospace, monospace";
    ctx.textAlign = "center";
    ctx.fillText(`ORAGE  ${gap}m`, VIEW_W / 2, sy + 20);
  }

  private drawHud(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = "#fff";
    ctx.font = "600 34px ui-monospace, monospace";
    ctx.textAlign = "left";
    ctx.fillText(`${Math.round(Math.max(0, this.peakY) / PX_PER_METER)}m`, 18, 46);

    ctx.font = "14px ui-monospace, monospace";
    ctx.fillStyle = "rgba(255,255,255,0.65)";
    ctx.fillText(`chaîne ${this.chain}  (max ${this.bestChain})`, 18, 70);
    ctx.fillText(
      this.flaps === 0 ? "VOL PUR — aucune aile" : `ailes utilisées ${this.flaps}`,
      18,
      90
    );

    // Winch charge: the single most important thing to teach. It shows that the
    // quality of your last release is what buys your next climb.
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.fillText("TREUIL", 18, 116);
    ctx.strokeStyle = "rgba(255,255,255,0.4)";
    ctx.lineWidth = 1;
    ctx.strokeRect(84, 105, 120, 12);
    ctx.fillStyle = "#fff";
    ctx.fillRect(85, 106, 118 * this.winchCharge, 10);
    if (this.anchor) {
      // How much rope this rung has left to give
      ctx.fillStyle = "rgba(255,255,255,0.35)";
      ctx.fillRect(85, 120, 118 * (this.reelLeft / WINCH_BUDGET), 4);
    }
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.fillText(`${Math.round(this.lastReleaseQuality * 100)}%`, 212, 116);

    // Speed readout, and what kind of grab you are on — the arc length differs
    const speed = Math.round(Math.hypot(this.vx, this.vy));
    ctx.fillStyle = speed > STREAK_MIN_SPEED ? "#fff" : "rgba(255,255,255,0.5)";
    ctx.fillText(`${speed} px/s`, 18, 140);
    if (this.anchor) {
      ctx.fillStyle = "rgba(255,255,255,0.55)";
      const left = Math.max(0, this.attachLimit - this.attachTime);
      ctx.fillText(
        `${this.divedOn ? "PLONGEON" : "PORTÉ"}  ${left.toFixed(1)}s`,
        18,
        160
      );
    }

    // Wing charges as pips, bottom left, in the thumb's eyeline
    for (let i = 0; i < FLAP_CHARGES; i++) {
      ctx.strokeStyle = "rgba(255,255,255,0.5)";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(18 + i * 20, this.viewH - 40, 13, 13);
      if (i < this.flapCharges) {
        ctx.fillStyle = "#fff";
        ctx.fillRect(20 + i * 20, this.viewH - 38, 9, 9);
      }
    }

    ctx.textAlign = "right";
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.fillText(this.anchor ? "ACCROCHÉ — lâche pour partir" : "appuie pour t'accrocher", VIEW_W - 18, this.viewH - 30);
  }
}
