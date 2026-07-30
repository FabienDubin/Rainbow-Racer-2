// Phase 0 tuning. Deliberately tiny: this file exists so the swing can be
// re-felt in seconds. Everything is in px, px/s, px/s², world Y points UP.

export const VIEW_W = 540;
export const VIEW_H = 960;

// ---- Gravity / flight ----
// Low gravity is a deliberate mobile decision, not a taste one. Launch height goes
// as v²/2g while the release window goes as r/v, so a big rise AND a fair window
// both want high speed and a big radius — but a big radius does not fit a portrait
// screen. Dropping gravity buys both at a modest speed, and floaty happens to suit
// a unicorn in the sky.
export const GRAVITY = 750;
export const MAX_FALL_SPEED = 1000;
export const AIR_DRAG = 0.05; // per second, horizontal only — keeps launches readable

// ---- The Arc (tether) ----
// Two forces do the work while you hold: the winch reels you toward the anchor
// (that is the climb), and the drive spins you around it (that is the launch speed).
// Speed is capped, so holding longer stops paying — the skill is WHEN you let go.
export const TETHER_RANGE = 300; // auto-aim pickup radius
// Rope floor also sets the swing's angular speed (ω = v / r). Too short and the
// release window shrinks to a few milliseconds — unplayable on a phone. At 210px
// with a 1050px/s cap, ω ≈ 5 rad/s, so a ±20° window is ~70ms: tight but fair,
// and release quality is scored continuously so there is no cliff to fall off.
export const ROPE_MIN = 145; // swing diameter ≈ 290px, comfortably inside 540

// The winch is the ONLY engine in the game: a pendulum cannot climb on its own.
// So the winch is deliberately fuelled by skill — the quality of your last release
// decides how much rope the next rung gives you. Chain good releases and you climb
// fast; flail and you sink. That coupling is the whole design.
export const REEL_SPEED = 240; // px/s pulled in while attached
export const WINCH_BUDGET = 230; // px of rope per rung, at full charge
export const WINCH_FLOOR = 0.15; // never fully dead — always a way back
export const REF_RELEASE_SPEED = 640; // reference speed for scoring a release

// The pendulum needs an energy input or it cannot climb at all — that is physics,
// not a bug. The drive MUST exceed gravity, or the swing stalls before the top and
// there is no launch to time at all (measured: exit speed of 10px/s). It tops out
// at a cap, and what stops "just hold on" from winning is the storm, not a weak rope.
export const SWING_DRIVE = 1500; // px/s² tangential — must stay comfortably above GRAVITY
export const SWING_STALL_FLOOR = 280; // minimum tangential speed kept, anti-dead-hang
export const MAX_SWING_TANGENTIAL = 720; // ω = 720/145 ≈ 5 rad/s → ~70ms release window
export const MAX_SWING_SPEED = 1100; // hard safety clamp on total speed
export const MAX_ATTACH_TIME = 1.6; // s — the rope gives out. A swept-angle limit was
                                    // wrong here: at 5 rad/s it fired in 0.3s, before
                                    // the swing had spun up at all.

// ---- Le Grondement: the rising storm ----
// This is the pacer that gives the verb its meaning. Absolute altitude is not the
// goal — outrunning this is. It closes every degenerate strategy for free: hang
// around on one rung, or spam the input, and it simply eats you.
export const STORM_START_BELOW = 1400; // px below the player at spawn — room to learn
// A single good swing climbs at 10-17 m/s, but sustained play measured far lower:
// most of the time goes into the transition between rungs. The storm is tuned
// against the sustained rate, not the peak, or it kills everyone in 6 seconds.
export const STORM_SPEED_BASE = 55; // px/s ≈ 1.8 m/s, gentle at first
export const STORM_ACCEL = 1.1; // px/s² — ~4 m/s at 1min, ~6 m/s at 2min
export const MIN_SWING_ANGLE = 0.35; // rad (~20°) — below this a release is a "slip":
                                     // no chain credit, no wing refill. Kills spam.
export const REGRAB_LOCKOUT = 0.35; // s before the anchor you just left can be grabbed again
export const GRAB_COOLDOWN = 0.3; // s of forced free flight after ANY release.
// Without this, the winning strategy was to be attached 100% of the time — measured
// exactly that — so a bad release never cost anything. Mandatory free flight is what
// makes the launch matter: fly well and you gain, flail and you fall.

// ---- Wings (the assist, never the main verb) ----
export const FLAP_IMPULSE = 320;
export const FLAP_CHARGES = 2; // refilled by a completed swing, not by touching an anchor
export const FLAP_COOLDOWN = 0.18;

// ---- Chain ----
export const CHAIN_DROP_TOLERANCE = 260; // fall this far below your peak → chain broken

// ---- Camera ----
export const CAM_PLAYER_SCREEN_FRAC = 0.62; // player sits this far down the view
export const CAM_FOLLOW_SPEED = 7;
export const DEATH_MARGIN = 120; // px below the view before the run ends

// ---- World generation ----
export const ROW_SPACING = 195; // vertical gap between anchor rows
export const ROW_MARGIN_X = 70;
export const PX_PER_METER = 30;

// ---- Launch ----
export const START_VY = 380; // initial toss so the first attach is immediate
