// The playable prototype. Grown phase by phase in place — there is no separate build
// to switch to.
//
// Phase 0 (done): the verb, naked. Is swinging on the Arc already fun with no art, no
//   sound and no score juice? Answered yes, after the harness found four design flaws.
// Phase 1 (here): the run loop. Le Grondement rising from below, paliers that shove it
//   back, and telegraphed thunderheads that cost you tempo rather than a life.
//
// Control (context-sensitive, one input):
//   press  → attach to the best anchor in range; if none in range, flap
//   hold   → stay attached (rope reels in, you climb)
//   release→ launch along your tangential velocity
//
// World Y points UP. Screen conversion happens only at draw time.

import { RunConfig } from "./meta";
import { audio, haptic } from "./audio";
import { skyAt, SkyState } from "./art/palette";
import {
  Camera, drawAnchor, drawDustMote, drawGarlandGem, drawGarlandThread, drawParallax,
  drawGust, drawPalier, drawPrism, drawRaider, drawSky, drawStorm, drawTether,
  drawThundercloud, PrismPose,
  prismGrip,
} from "./art/draw";
import {
  AIR_DRAG, CAM_FOLLOW_SPEED, CAM_PLAYER_SCREEN_FRAC, CHAIN_DROP_TOLERANCE,
  DEATH_MARGIN, FLAP_CHARGES, FLAP_COOLDOWN, FLAP_IMPULSE, GRAVITY, MAX_FALL_SPEED,
  CAM_SPEED_LOOKAHEAD, MAX_ATTACH_TIME_DIVE, MAX_ATTACH_TIME_LIFT, MAX_SWING_SPEED,
  MAX_SWING_TANGENTIAL, MIN_SWING_ANGLE, PX_PER_METER,
  GRAB_COOLDOWN, REEL_SPEED, REF_RELEASE_SPEED, REGRAB_LOCKOUT, ROPE_MIN, ROW_MARGIN_X,
  ROW_SPACING, WRAP_MARGIN, BOLT_ARM_RANGE, BOLT_COOLDOWN, BOLT_ROWS_APART, RAIDER_FLEE_SPEED,
  BOLT_START_M, BOLT_STRIKE, BOLT_TELEGRAPH, BOLT_THICKNESS,
  CHECKPOINT_PUSHBACK, STUN_DROP, STUN_TIME, HIT_FLASH, HIT_SHAKE, HIT_STOP,
  GUST_DOWN_FORCE, GUST_HEIGHT_MAX, GUST_HEIGHT_MIN, GUST_ROWS_APART, GUST_START_M,
  GUST_UP_ACCEL, GUST_UP_GRAVITY, GUST_UP_MAX,
  GUST_UP_CHANCE, GUST_WIDTH_MAX, GUST_WIDTH_MIN,
  RAIDER_RANGE,
  RAIDER_ROWS_APART, RAIDER_SPEED, RAIDER_START_M, RAIDER_STEAL,
  CHECKPOINT_FIRST_M, CHECKPOINT_GROWTH, DUST_BONUS_CHANCE, DUST_BONUS_VALUE,
  DUST_LINE_PER_ROW, DUST_MAGNET_RADIUS, DUST_RADIUS,
  START_VY, STORM_ACCEL, STORM_SPEED_BASE, STORM_START_BELOW,
  STREAK_COUNT, STREAK_MAX_SPEED, STREAK_MIN_SPEED, SWING_PUMP, SWING_RECOVERY_DRIVE,
  SWING_STALL_FLOOR, RELEASE_KICK, TETHER_RANGE, VIEW_H, VIEW_W, WHIP_RECOVERY,
  WINCH_BUDGET, WINCH_FLOOR,
} from "./proto.constants";

// A thunderhead that strikes its own altitude lane on a cycle. The whole point is the
// telegraph: it flashes first, so being hit is a misread rather than bad luck.
type BoltState = "dormant" | "telegraph" | "strike" | "cooldown";

interface Bolt {
  x: number; // where the cloud sits — the strike spans the full width
  y: number;
  state: BoltState;
  timer: number; // seconds spent in the current state
}

interface Gust {
  x: number;
  y: number;
  w: number;
  h: number;
  dir: number; // +1 lifts (Ascendance), -1 sinks (Rabattant)
}

interface Raider {
  x: number;
  y: number;
  awake: boolean;
  fleeing: number; // 0 = still hunting, otherwise the direction it bolted
  flap: number; // wing phase
}

interface Dust {
  x: number;
  y: number;
  value: number;
  taken: boolean;
  arc: number; // 0 = line dust, >0 = id of the bonus garland it belongs to
}

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
  hits: number; // times caught by a bolt
  stolen: number; // dust taken by raiders
  checkpoints: number; // paliers crossed
  dust: number; // poussière collected — kept whatever happens
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
  private bolts: Bolt[] = [];
  private stunTime = 0; // s of lost control after being hit
  private hits = 0;
  private nextCheckpointM = CHECKPOINT_FIRST_M;
  private checkpointGap = CHECKPOINT_FIRST_M;
  private dusts: Dust[] = [];
  private dustEarned = 0;
  private nextArcId = 1;
  private gusts: Gust[] = [];
  private raiders: Raider[] = [];
  private rowsSinceGust = 0;
  private rowsSinceRaider = 0;
  private stolen = 0;
  private inGust = 0; // -1/0/+1, for the HUD and the drawing
  private pickups: { x: number; y: number; text: string; life: number; big: boolean }[] = [];
  private talismanLeft = 0;
  private checkpoints = 0;
  private checkpointToast = 0;
  private hitFlash = 0;
  private shake = 0;
  private hitStop = 0; // frames are frozen while this runs down

  // Wings
  private flapCharges = FLAP_CHARGES;
  private flapTimer = 0;

  // Run state
  private anchors: Anchor[] = [];
  private generatedTo = 0;
  private lastGenX = VIEW_W / 2;
  private rowsSinceSkip = 0;
  private rowsSinceBolt = 0;
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
  private flapPulse = 0; // decays after each wingbeat, drives the wing and leg animation
  private facing = 1; // which way she is turned; a deadband stops it flickering at vx ~ 0

  private rafId = 0;
  private lastTs = 0;
  private detachFns: (() => void)[] = [];

  // Logical width is fixed; logical HEIGHT follows the real canvas box. Phones range
  // from 16:9 to 20:9, and a fixed 540x960 buffer stretched into a taller box turned
  // every swing circle into an ellipse — which quietly misreads the physics you are
  // trying to feel. Taller screens now simply show more sky.
  private viewH = VIEW_H;
  private sky: SkyState = skyAt(0);

  constructor(
    private canvas: HTMLCanvasElement,
    private onEnd: (stats: ProtoStats) => void,
    private cfg: RunConfig = {
      extraWings: 0, extraTetherRange: 0, startBoost: false, talisman: false,
      magnet: false, stormFactor: 1, dustFactor: 1, noBolts: false, noWings: false,
      anchorScarcity: 1,
    }
  ) {
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D context unavailable");
    this.ctx = ctx;

    const boxW = canvas.clientWidth || VIEW_W;
    const boxH = canvas.clientHeight || this.viewH;
    this.viewH = Math.round(VIEW_W * (boxH / boxW));
    canvas.width = VIEW_W;
    canvas.height = this.viewH;

    this.flapCharges = this.maxWings();
    this.talismanLeft = this.cfg.talisman ? 1 : 0;
    if (this.cfg.startBoost) {
      this.py = 30 * PX_PER_METER;
      this.peakY = this.py;
      this.stormY = this.py - STORM_START_BELOW;
    }
    this.camY = this.py + (0.5 - CAM_PLAYER_SCREEN_FRAC) * this.viewH * -1;
    this.generateUpTo(this.camY + this.viewH * 1.5);
  }

  // Prism reads at ~55px tall on a phone at this scale — big enough to be the hero of the
  // frame, small enough that the swing arc stays the thing you are reading.
  private dashScale(): number {
    return 1.35 + this.flashAttach * 0.12;
  }

  private pose(): PrismPose {
    return {
      vx: this.vx,
      vy: this.vy,
      scale: this.dashScale(),
      tumbling: this.stunTime > 0 ? STUN_TIME - this.stunTime : 0,
      tethered: this.anchor !== null,
      hangAngle: this.anchor
        ? Math.atan2(this.screenY(this.anchor.y) - this.screenY(this.py), this.anchor.x - this.px)
        : null,
      facing: this.facing,
      wingBoost: this.cfg.extraWings,
      flapPulse: this.flapPulse,
      justAttached: this.flashAttach,
      justReleased: this.flashRelease,
      light: this.sky.light,
      time: this.time,
    };
  }

  private camera(): Camera {
    return {
      camY: this.camY,
      viewW: VIEW_W,
      viewH: this.viewH,
      toScreen: (worldY: number) => this.screenY(worldY),
    };
  }

  private maxWings(): number {
    if (this.cfg.noWings) return 0;
    return FLAP_CHARGES + this.cfg.extraWings;
  }

  // ------------------------------------------------------------- lifecycle
  start(): void {
    this.attachInput();
    audio.startMusic();
    this.lastTs = performance.now();
    this.rafId = requestAnimationFrame(this.frame);
  }

  destroy(): void {
    audio.stopMusic();
    cancelAnimationFrame(this.rafId);
    this.detachFns.forEach((fn) => fn());
    this.detachFns = [];
  }

  private attachInput(): void {
    // Only a press that STARTED on the canvas counts. The release listener has to sit on
    // the window so a finger sliding off the play area still lets go of the rope — but that
    // meant tapping the mute button fired a release and dropped you off your tether.
    let pressedOnCanvas = false;

    const down = (e: Event) => {
      e.preventDefault();
      pressedOnCanvas = true;
      if (!this.pressed) this.pressEdge = true;
      this.pressed = true;
    };
    const up = () => {
      if (!pressedOnCanvas) return;
      pressedOnCanvas = false;
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
    // Hit-stop: the world holds still for a moment on impact. Cheapest way to give a
    // hit weight, and it reads even without sound.
    if (this.hitStop > 0) {
      this.hitStop -= dt;
    } else if (!this.over) {
      this.update(dt);
    }
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
    this.flapPulse = Math.max(0, this.flapPulse - dt * 3.6);
    // Turn to face where she is actually going — swinging backwards looked wrong
    if (this.vx > 60) this.facing = 1;
    else if (this.vx < -60) this.facing = -1;
    this.stunTime = Math.max(0, this.stunTime - dt);
    this.checkpointToast = Math.max(0, this.checkpointToast - dt);
    this.hitFlash = Math.max(0, this.hitFlash - dt * 3.5);
    this.shake = Math.max(0, this.shake - dt * 45);

    // ---- Input resolution: one press means "attach", or "flap" if nothing in range.
    // Stunned means exactly that: no grabbing, no flapping, you just fall.
    if (this.pressEdge && this.stunTime <= 0) {
      const target = this.pickAnchor();
      if (target) this.attach(target);
      else this.flap();
    }
    if (this.releaseEdge && this.anchor) this.release();

    // ---- Which current are we inside? This has to be known before gravity is applied,
    // because an Ascendance suspends gravity rather than opposing it.
    this.inGust = 0;
    for (const g of this.gusts) {
      if (Math.abs(this.py - g.y) < g.h / 2 && Math.abs(this.px - g.x) < g.w / 2) {
        this.inGust = g.dir;
      }
    }

    // ---- Integrate
    // Weightless inside a lift — but only in free flight. Cutting gravity while roped would
    // stop the pendulum being a pendulum, and the swing is the whole game.
    const lifting = this.inGust > 0 && this.anchor === null;
    this.vy -= GRAVITY * (lifting ? GUST_UP_GRAVITY : 1) * dt;
    if (lifting) {
      this.vy = Math.min(this.vy + GUST_UP_ACCEL * dt, GUST_UP_MAX);
    } else if (this.inGust > 0) {
      // Roped inside a lift: a plain upward push, so the arc survives
      this.vy += GUST_UP_ACCEL * 0.4 * dt;
    } else if (this.inGust < 0) {
      this.vy -= GUST_DOWN_FORCE * dt;
    }
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

    this.sky = skyAt(this.peakY / PX_PER_METER);
    audio.setPaliers(this.checkpoints);

    // ---- Poussière
    const magnetR = this.cfg.magnet ? DUST_MAGNET_RADIUS : DUST_RADIUS;
    for (const d of this.dusts) {
      if (d.taken) continue;
      const dx = d.x - this.px;
      const dy = d.y - this.py;
      if (Math.hypot(dx, dy) < magnetR) {
        d.taken = true;
        this.dustEarned += d.value;
        // Naming the value teaches the difference between the two kinds by feel
        audio.dust(this.chain + this.dustEarned, d.value > 1);
        this.pickups.push({
          x: d.x, y: d.y, text: `+${d.value}`, life: 0.6, big: d.value > 1,
        });
        if (this.pickups.length > 14) this.pickups.shift();
      }
    }
    this.dusts = this.dusts.filter((d) => !d.taken && d.y > this.camY - this.viewH);
    for (const p of this.pickups) { p.life -= dt; p.y += 40 * dt; }
    this.pickups = this.pickups.filter((p) => p.life > 0);

    // ---- Paliers: crossing one shoves the storm back down
    const altM = this.peakY / PX_PER_METER;
    if (altM >= this.nextCheckpointM) {
      this.checkpoints++;
      this.checkpointGap *= CHECKPOINT_GROWTH;
      this.nextCheckpointM += this.checkpointGap;
      this.stormY -= CHECKPOINT_PUSHBACK;
      this.checkpointToast = 2.2;
      audio.palier();
      haptic([12, 60, 12]);
    }

    this.gusts = this.gusts.filter((g) => g.y > this.camY - this.viewH);

    // ---- Pilleurs: they steal dust and break the chain
    for (const r of this.raiders) {
      r.flap += dt * (r.fleeing ? 20 : 12);

      if (r.fleeing) {
        // Bolt for the nearest edge and keep climbing out of frame
        r.x += r.fleeing * RAIDER_FLEE_SPEED * dt;
        r.y += RAIDER_FLEE_SPEED * 0.45 * dt;
        continue;
      }

      const dx = this.px - r.x;
      const dy = this.py - r.y;
      const dist = Math.hypot(dx, dy);
      if (!r.awake && dist < RAIDER_RANGE) r.awake = true;
      if (r.awake) {
        r.x += (dx / (dist || 1)) * RAIDER_SPEED * dt;
        r.y += (dy / (dist || 1)) * RAIDER_SPEED * dt;
      }
      if (dist < 30 && this.dustEarned > 0) {
        const taken = Math.min(RAIDER_STEAL, this.dustEarned);
        this.dustEarned -= taken;
        this.stolen += taken;
        this.chain = 0;
        // It got what it came for: away it goes, toward whichever side is closer
        r.fleeing = r.x < VIEW_W / 2 ? -1 : 1;
        this.shake = Math.max(this.shake, 6);
        audio.steal();
        haptic(30);
        this.pickups.push({ x: r.x, y: r.y, text: `-${taken}`, life: 0.8, big: true });
      }
    }
    this.raiders = this.raiders.filter(
      (r) =>
        r.y > this.camY - this.viewH &&
        r.x > -WRAP_MARGIN - 120 &&
        r.x < VIEW_W + WRAP_MARGIN + 120
    );

    // ---- Éclairs
    this.updateBolts(dt);

    // ---- Le Grondement rises, and accelerates
    this.stormY += (STORM_SPEED_BASE + STORM_ACCEL * this.time) * this.cfg.stormFactor * dt;

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
      if (dist > TETHER_RANGE + this.cfg.extraTetherRange || dist < 30) continue;
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
    audio.grab();
    haptic(8);
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
  // `rewarded: false` detaches you without paying out anything — used when a bolt tears
  // the rope away. Routing a stunned detach through the normal path meant the release was
  // *scored*, which handed back the winch charge the hit had just dumped and even granted
  // a chain link and fresh wings. Getting hit was quietly rewarding you.
  private release(auto = false, rewarded = true): void {
    this.lastReleased = this.anchor;
    this.regrabTimer = REGRAB_LOCKOUT;
    this.grabCooldown = GRAB_COOLDOWN;
    this.anchor = null;
    this.flashRelease = rewarded ? 1 : 0;
    if (auto) this.autoReleases++;
    if (!rewarded) return;

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
    this.flapPulse = 1;
    audio.flap();
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

  // A bolt cycles: quiet → telegraph (it flashes) → strike (its lane is live) → quiet.
  // Being hit costs tempo, never a life: you are stunned, you drop, the storm closes.
  private updateBolts(dt: number): void {
    for (const b of this.bolts) {
      b.timer += dt;

      switch (b.state) {
        case "dormant": {
          // Wakes only when you are climbing into its lane from below
          const below = b.y - this.py;
          if (below > 0 && below < BOLT_ARM_RANGE) {
            b.state = "telegraph";
            b.timer = 0;
            audio.boltCharge(BOLT_TELEGRAPH);
          }
          break;
        }
        case "telegraph":
          if (b.timer >= BOLT_TELEGRAPH) {
            b.state = "strike";
            b.timer = 0;
            // Sound it now, and tell the music whether it landed on us
            const willCatch =
              this.stunTime <= 0 &&
              this.talismanLeft <= 0 &&
              Math.abs(this.py - b.y) < BOLT_THICKNESS / 2;
            audio.boltStrike(willCatch);
          }
          break;
        case "strike":
          if (b.timer >= BOLT_STRIKE) { b.state = "cooldown"; b.timer = 0; }
          break;
        case "cooldown":
          if (b.timer >= BOLT_COOLDOWN) { b.state = "dormant"; b.timer = 0; }
          break;
      }

      if (b.state === "strike" && this.stunTime <= 0 && Math.abs(this.py - b.y) < BOLT_THICKNESS / 2) {
        if (this.talismanLeft > 0) {
          this.talismanLeft--;
          this.hitFlash = HIT_FLASH * 0.5;
          continue; // the Talisman eats it whole: no stun, no losses
        }
        this.hits++;
        this.stunTime = STUN_TIME;
        this.hitFlash = HIT_FLASH;
        this.shake = HIT_SHAKE;
        this.hitStop = HIT_STOP;
        haptic([26, 40, 26]);
        if (this.anchor) this.release(true, false);
        // Order matters: the punishment lands after the detach, or the detach undoes it.
        this.chain = 0;
        this.winchCharge = WINCH_FLOOR;
        this.vy = Math.min(this.vy, 0) - STUN_DROP;
        // Wings are deliberately NOT taken. They are the recovery tool, and confiscating
        // them at the exact moment you are stunned and falling turned one mistake into a
        // death sentence (expert runs fell 161m -> 75m). A hit should cost tempo, not
        // remove your ability to save yourself.
      }
    }
    this.bolts = this.bolts.filter((b) => b.y > this.camY - this.viewH);
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

      // LINE dust: on the natural route, the baseline income
      for (let i = 0; i < DUST_LINE_PER_ROW; i++) {
        this.dusts.push({
          x: clampX(prevX + (x - prevX) * ((i + 1) / (DUST_LINE_PER_ROW + 1)) + (Math.random() - 0.5) * 70),
          y: this.generatedTo - rise * ((i + 1) / (DUST_LINE_PER_ROW + 1)),
          value: 1,
          taken: false,
          arc: 0,
        });
      }

      // BONUS arc: out on the wide part of this rung's swing circle, so only a later
      // release sweeps it. Sometimes out in the wrap margin instead, which pays for
      // riding the edge.
      if (Math.random() < DUST_BONUS_CHANCE) {
        const arcId = this.nextArcId++;
        const edge = Math.random() < 0.3;
        const cx = edge ? (Math.random() < 0.5 ? -70 : VIEW_W + 70) : x;
        const r = ROPE_MIN + 55;
        for (let i = 0; i < 4; i++) {
          const a = -0.6 + i * 0.4 + (Math.random() - 0.5) * 0.15;
          this.dusts.push({
            x: edge ? cx + (Math.random() - 0.5) * 90 : cx + Math.cos(a) * r,
            y: this.generatedTo + (edge ? (i - 1.5) * 45 : Math.sin(a) * r * 0.8),
            value: DUST_BONUS_VALUE,
            taken: false,
            arc: arcId,
          });
        }
      }

      // A band of side-wind across this stretch
      this.rowsSinceGust++;
      if (
        this.generatedTo / PX_PER_METER > GUST_START_M &&
        this.rowsSinceGust >= GUST_ROWS_APART &&
        Math.random() < 0.5
      ) {
        this.rowsSinceGust = 0;
        const lift = Math.random() < GUST_UP_CHANCE;
        const w = GUST_WIDTH_MIN + Math.random() * (GUST_WIDTH_MAX - GUST_WIDTH_MIN);
        // Updrafts run taller than downdrafts: a gift is worth a long ride, a hazard only
        // needs to be long enough to be a real decision.
        const h =
          GUST_HEIGHT_MIN +
          Math.random() * (GUST_HEIGHT_MAX - GUST_HEIGHT_MIN) * (lift ? 1 : 0.55);
        this.gusts.push({
          // Offset from the anchor chain, so taking a current is a detour worth choosing
          x: clampX(x + (Math.random() < 0.5 ? -1 : 1) * (110 + Math.random() * 130)),
          y: this.generatedTo + h * 0.35,
          w,
          h,
          dir: lift ? 1 : -1,
        });
      }

      // A magpie perched, waiting for someone carrying dust
      this.rowsSinceRaider++;
      if (
        this.generatedTo / PX_PER_METER > RAIDER_START_M &&
        this.rowsSinceRaider >= RAIDER_ROWS_APART &&
        Math.random() < 0.55
      ) {
        this.rowsSinceRaider = 0;
        this.raiders.push({
          x: clampX(x + (Math.random() - 0.5) * 320),
          y: this.generatedTo + ROW_SPACING * 0.7,
          awake: false,
          fleeing: 0,
          flap: Math.random() * 6,
        });
      }

      // A thunderhead guarding this stretch. Never at the very first altitudes: the Arc
      // has to be learned before it is tested.
      if (
        !this.cfg.noBolts &&
        this.generatedTo / PX_PER_METER > BOLT_START_M &&
        this.rowsSinceBolt >= BOLT_ROWS_APART &&
        Math.random() < 0.6
      ) {
        this.rowsSinceBolt = 0;
        this.bolts.push({
          x: clampX(x + (Math.random() - 0.5) * 300),
          y: this.generatedTo + ROW_SPACING * 0.5,
          state: "dormant",
          timer: 0,
        });
      }
      this.rowsSinceBolt++;

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
    audio.death();
    this.onEnd({
      altitudeM: Math.round(Math.max(0, this.peakY) / PX_PER_METER),
      bestChain: this.bestChain,
      attaches: this.attaches,
      flaps: this.flaps,
      slips: this.slips,
      hits: this.hits,
      stolen: this.stolen,
      checkpoints: this.checkpoints,
      dust: Math.round(this.dustEarned * this.cfg.dustFactor),
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
    const cam = this.camera();
    drawSky(ctx, cam, this.sky, this.time);
    drawParallax(ctx, cam, this.sky);

    ctx.save();
    if (this.shake > 0) {
      ctx.translate((Math.random() - 0.5) * this.shake, (Math.random() - 0.5) * this.shake);
    }

    this.drawCheckpoints(ctx);
    this.drawDust(ctx);
    this.drawGusts(ctx);
    this.drawBolts(ctx);
    this.drawRaiders(ctx);
    this.drawStreaks(ctx);
    this.drawStorm(ctx);

    // Anchors: hollow ring, filled once used. The one currently in range gets a halo
    // so the context-sensitive input is never a guess.
    const inRange = this.anchor ? null : this.pickAnchor();
    for (const a of this.anchors) {
      const sy = this.screenY(a.y);
      if (sy < -40 || sy > this.viewH + 40) continue;
      drawAnchor(ctx, a.x, sy, this.sky.light, a.used, a === inRange, a.skip, this.time);
    }

    // Rope + swing circle. The rope is the game's name made literal: a rainbow ribbon.
    if (this.anchor) {
      const ay = this.screenY(this.anchor.y);
      ctx.save();
      ctx.strokeStyle = "rgba(255,255,255,0.16)";
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 7]);
      ctx.beginPath();
      ctx.arc(this.anchor.x, ay, this.ropeLen, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // The release window: where your velocity points straight up
      for (const side of [-1, 1]) {
        const mx = this.anchor.x + side * this.ropeLen;
        ctx.strokeStyle = "rgba(255,255,255,0.7)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(mx - 8, ay);
        ctx.lineTo(mx + 8, ay);
        ctx.moveTo(mx, ay - 3);
        ctx.lineTo(mx, ay - 12);
        ctx.stroke();
      }
      ctx.restore();

      // The rope ends in her HANDS, and the body hangs from it — that is the whole read
      const grip = prismGrip(this.pose());
      drawTether(
        ctx,
        this.anchor.x,
        ay,
        this.px + grip.dx,
        this.screenY(this.py) + grip.dy,
        this.sky.light,
        this.time
      );
    }

    // Prism herself — the V1 sprite. Not mirrored across the seam: vanishing off one
    // side and reappearing on the other is deliberate.
    const psy = this.screenY(this.py);
    drawPrism(ctx, this.px, psy, this.pose());

    this.drawOffscreenMarker(ctx);
    ctx.restore();

    if (this.hitFlash > 0) {
      ctx.fillStyle = `rgba(255,255,255,${this.hitFlash * 0.55})`;
      ctx.fillRect(0, 0, VIEW_W, this.viewH);
    }

    this.drawHud(ctx);
  }


  // Dust: a plain dot on the line, a ring for the valuable arcs so the two read apart
  // at a glance and you can decide whether the detour is worth it.
  private drawDust(ctx: CanvasRenderingContext2D): void {
    const arcs = new Map<number, { x: number; y: number }[]>();
    for (const d of this.dusts) {
      if (d.arc === 0) continue;
      const pt = { x: d.x, y: this.screenY(d.y) };
      const list = arcs.get(d.arc);
      if (list) list.push(pt);
      else arcs.set(d.arc, [pt]);
    }
    for (const list of arcs.values()) drawGarlandThread(ctx, list);

    for (const d of this.dusts) {
      const sy = this.screenY(d.y);
      if (sy < -24 || sy > this.viewH + 24) continue;
      if (d.value > 1) drawGarlandGem(ctx, d.x, sy, this.time, d.arc);
      else drawDustMote(ctx, d.x, sy, this.time);
    }

    ctx.textAlign = "center";
    for (const p of this.pickups) {
      ctx.globalAlpha = Math.min(1, p.life * 2.2);
      ctx.fillStyle = p.big ? "#fff3c4" : "#ffffff";
      ctx.font = `${p.big ? "bold 17px" : "12px"} ui-monospace, monospace`;
      ctx.fillText(p.text, p.x, this.screenY(p.y));
    }
    ctx.globalAlpha = 1;
    ctx.textAlign = "left";
  }

  // The next palier, drawn as a line you can aim at. Seeing the reward coming is what
  // turns the storm from a monotone squeeze into a rhythm.
  private drawCheckpoints(ctx: CanvasRenderingContext2D): void {
    const top = this.camY + this.viewH;
    const bottom = this.camY - this.viewH;
    let gap = CHECKPOINT_FIRST_M;
    let m = CHECKPOINT_FIRST_M;
    for (let guard = 0; guard < 200 && m * PX_PER_METER < top; guard++) {
      const y = m * PX_PER_METER;
      const thisM = m;
      gap *= CHECKPOINT_GROWTH;
      m += gap;
      if (y < bottom) continue;
      drawPalier(ctx, this.screenY(y), VIEW_W, `PALIER ${Math.round(thisM)} m`, thisM < this.nextCheckpointM);
    }
  }

  // Telegraph first, strike second. The warning is the mechanic — without it a bolt is
  // just bad luck, and dodging has nothing to be good at.
  private drawBolts(ctx: CanvasRenderingContext2D): void {
    for (const b of this.bolts) {
      const sy = this.screenY(b.y);
      if (sy < -70 || sy > this.viewH + 70) continue;
      const charge = b.state === "telegraph" ? Math.min(1, b.timer / BOLT_TELEGRAPH) : 0;
      drawThundercloud(ctx, b.x, sy, b.state, charge, VIEW_W, this.time);
    }
  }

  private drawGusts(ctx: CanvasRenderingContext2D): void {
    for (const g of this.gusts) {
      const sy = this.screenY(g.y);
      if (sy < -g.h || sy > this.viewH + g.h) continue;
      drawGust(ctx, g.x, sy, g.w, g.h, g.dir, this.time);
    }
  }

  private drawRaiders(ctx: CanvasRenderingContext2D): void {
    for (const r of this.raiders) {
      const sy = this.screenY(r.y);
      if (sy < -40 || sy > this.viewH + 40) continue;
      drawRaider(ctx, r.x, sy, r.awake, r.fleeing !== 0, r.flap, r.fleeing || this.px - r.x);
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
    drawStorm(
      ctx,
      this.camera(),
      this.screenY(this.stormY),
      this.time,
      (this.py - this.stormY) / PX_PER_METER
    );
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

    if (this.stunTime > 0) {
      const cx = VIEW_W / 2;
      const cy = this.viewH * 0.4;
      ctx.textAlign = "center";
      ctx.font = "bold 26px ui-monospace, monospace";
      ctx.fillStyle = "#fff";
      ctx.globalAlpha = 0.5 + 0.5 * Math.abs(Math.sin(this.time * 24));
      ctx.fillText("ÉTOURDI", cx, cy);
      ctx.globalAlpha = 1;
      ctx.font = "12px ui-monospace, monospace";
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.fillText("chaîne perdue · treuil vidé", cx, cy + 20);
      // Countdown to regaining control
      const w = 130;
      ctx.strokeStyle = "rgba(255,255,255,0.5)";
      ctx.lineWidth = 1;
      ctx.strokeRect(cx - w / 2, cy + 30, w, 7);
      ctx.fillStyle = "#fff";
      ctx.fillRect(cx - w / 2 + 1, cy + 31, (w - 2) * (this.stunTime / STUN_TIME), 5);
      ctx.textAlign = "left";
    }

    if (this.checkpointToast > 0) {
      ctx.textAlign = "center";
      ctx.globalAlpha = Math.min(1, this.checkpointToast);
      ctx.font = "bold 20px ui-monospace, monospace";
      ctx.fillStyle = "#fff";
      ctx.fillText("PALIER FRANCHI", VIEW_W / 2, this.viewH * 0.3);
      ctx.font = "13px ui-monospace, monospace";
      ctx.fillText("l'orage recule", VIEW_W / 2, this.viewH * 0.3 + 20);
      ctx.globalAlpha = 1;
      ctx.textAlign = "left";
    }

    // Speed readout, and what kind of grab you are on — the arc length differs
    const speed = Math.round(Math.hypot(this.vx, this.vy));
    ctx.fillStyle = speed > STREAK_MIN_SPEED ? "#fff" : "rgba(255,255,255,0.5)";
    ctx.fillText(`${speed} px/s`, 18, 140);
    ctx.fillStyle = "#fff";
    ctx.fillText(`poussière ${Math.round(this.dustEarned * this.cfg.dustFactor)}`, 18, 180);
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
