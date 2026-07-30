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
// The drive is deliberately two-tier, because a single strong drive homogenised the
// whole game: it topped every swing up to the same ceiling, so where your speed came
// from stopped mattering and a dive bought nothing (measured: 0% gain below 900px/s).
//
//  below SWING_STALL_FLOOR → strong recovery, so a dead start or a bad fall is never
//                            a soft lock and you can always do *something*
//  above it                → a gentle pump only, so momentum you brought with you is
//                            what decides how hard you launch
export const SWING_RECOVERY_DRIVE = 1400; // px/s², below the stall floor
// Zero on purpose. Any pump above the stall floor is a motor, and a motor drags every
// swing toward the same ceiling — which is exactly what made a dive worthless and the
// movement feel synthetic. With no motor the pendulum simply conserves what you bring
// to it, so speed earned by falling is speed you still have on the way back up.
//
// Height is not lost when you trade it for speed: you bank it by catching a higher rung
// at the top of the launch. That is the loop, and it needs no energy source beyond the
// winch, which is bounded and paid for by your last release.
export const SWING_PUMP = 0;
export const SWING_STALL_FLOOR = 280; // minimum tangential speed kept, anti-dead-hang
// No longer a governor on the swing — only the reach of the recovery nudge. Clipping
// tangential speed here confiscated momentum the player had genuinely earned.
export const MAX_SWING_TANGENTIAL = 1400;
export const MAX_SWING_SPEED = 1400; // hard safety clamp. Kept well above the drive's
// own ceiling so speed *earned* by diving is never confiscated — that clamp was
// quietly deleting the reward for a good dive.

// How much of the speed killed by the rope going taut is whipped into the tangent.
// 0 = the old behaviour (a dive buys you nothing), 1 = fully elastic (too springy).
// Swept: 0.68 lost so much speed that a dive bought only 1.2m and the skill gradient
// collapsed to x1.0. Keeping nearly all of it (0.95) is what makes momentum readable —
// a dive is worth ~6m of extra launch height — while staying energy-honest, since a
// pendulum still cannot return higher than it started.
export const WHIP_RECOVERY = 0.95;
// You always lose the grip eventually — but how long you keep it depends on where the
// anchor was when you grabbed it, because the two grabs are different moves:
//
//   anchor ABOVE you → a lift. Short and snappy; hold, swing, go.
//   anchor BELOW you → a dive. You need the whole arc: fall past it, through 6 o'clock,
//                      and back up the far side to release around 9. One fixed short
//                      timer tore the rope away mid-swing and killed this move entirely.
//
// A measured full swing is ~1.9s, so the dive limit allows one complete arc plus a
// margin — enough to commit to the move, not enough to live on one rung.
export const MAX_ATTACH_TIME_LIFT = 1.6;
export const MAX_ATTACH_TIME_DIVE = 3.2;

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
// The corridor is wider than the view: you fly off one side, are genuinely gone for a
// beat, then come back in on the other. A plain edge-to-edge wrap teleports you
// instantly and you are never actually absent — the brief disappearance is the point.
export const WRAP_MARGIN = 150; // px of off-screen space on each side
export const PX_PER_METER = 30;

// ---- Launch ----
export const START_VY = 380; // initial toss so the first attach is immediate

// ---- Sense of speed ----
// Speed should be *felt as acceleration*, not drawn as decoration. A clean release
// therefore pays a real kick, scaled by how well it was aimed, so letting go at the
// right moment is a burst you feel rather than a number you read.
//
// An unconditional release boost used to be the worst exploit in the build — tap-grab,
// tap-release, free speed, forever. It is safe now only because a release that has not
// swept a real arc is a "slip" and earns nothing at all, and because every release
// forces a spell of free flight before you can grab again.
export const RELEASE_KICK = 0.2; // +20% speed on a perfectly aimed release
export const STREAK_MIN_SPEED = 380; // px/s before streaks appear
export const STREAK_MAX_SPEED = 1100; // px/s where they are at full strength
export const STREAK_COUNT = 14;
export const CAM_SPEED_LOOKAHEAD = 0.16; // how far ahead the camera leans, per px/s

// ---- PHASE 1: paliers (checkpoints) ----
// The storm alone is a monotone squeeze. Checkpoints give the run a pulse: reach one and
// it is shoved back down, which turns constant pressure into tension-then-relief and
// gives you something to aim at other than "not dying".
// Paliers get FURTHER APART as you climb, rather than sitting on a fixed interval.
// Fixed spacing cannot serve both ends of the skill range: at 50m apart a beginner's 80m
// run gets one (right), but a real 650m run got thirteen (far too many). Growing the gap
// 25% each time keeps the opening identical — 147m still gives two — while a 650m run
// gives six. Gaps: 50, 112, 190, 288, 410, 563, 754…
export const CHECKPOINT_FIRST_M = 50;
export const CHECKPOINT_GROWTH = 1.25;
export const CHECKPOINT_PUSHBACK = 260; // px the storm loses when you cross one

// ---- PHASE 1: les Éclairs ----
// Danger you read, not danger you're unlucky about: a thunderhead flashes, and only
// strikes its lane BOLT_TELEGRAPH seconds later. Getting hit costs tempo rather than a
// life — you are stunned, you drop, and the storm gains on you. That is the whole
// failure model: nothing kills you but losing altitude.
// A thunderhead ARMS when you come near, rather than cycling on its own clock. That
// distinction is the whole mechanic: measured, a self-cycling bolt striking 0.16s out of
// every 3s only overlapped the player ~5% of the time, so reading the telegraph bought
// nothing (the "reader" bot actually took MORE hits than the one ignoring it). Arming on
// approach means every thunderhead you meet is a real timing decision — rush the lane
// before it fires, or hold back and let it pass.
// Same correction: at 110m the first thunderhead was past the end of a typical run.
// 40m still leaves the opening quiet enough to learn the swing in peace.
export const BOLT_START_M = 40;
export const BOLT_ARM_RANGE = 430; // px below the lane at which it wakes up
export const BOLT_TELEGRAPH = 0.5; // s of warning before the strike
export const BOLT_STRIKE = 0.35; // s the lane is live — long enough that waiting costs you
export const BOLT_COOLDOWN = 1.7; // s before it can arm again
export const BOLT_THICKNESS = 34; // px of live lane
export const BOLT_ROWS_APART = 3; // one thunderhead every N anchor rows, at most
export const STUN_TIME = 0.55; // s of no control after a hit
export const STUN_DROP = 260; // px/s downward kick, so a hit visibly costs you altitude

// ---- Impact feedback ----
// Being hit already cost a lot — chain reset, winch dumped to its floor, upward momentum
// cancelled, half a second of no control — but none of it was visible, so it read as
// nothing more than "my rope vanished". These make the hit unmistakable.
export const HIT_STOP = 0.07; // s of frozen frame on impact — the classic weight cue
export const HIT_FLASH = 1.0; // starting intensity of the white flash
export const HIT_SHAKE = 14; // px of screen shake on impact

// ---- Poussière d'étoile ----
// Placement is the whole design. Dust sitting on your optimal line is free, and free
// means meaningless. So it comes in two kinds:
//
//   LINE dust    — near the natural route between rungs. The baseline income, so a
//                  beginner who ignores the economy entirely still earns something.
//   BONUS arcs   — out on the WIDE part of a swing circle, and in the off-screen wrap
//                  margins. Reaching them means releasing later or riding the edge, i.e.
//                  playing the Arc better. Worth several times as much.
//
// This ties earning to the core verb instead of bolting a scavenger hunt on top.
export const DUST_RADIUS = 26; // collection radius, generous
export const DUST_LINE_PER_ROW = 2;
export const DUST_BONUS_VALUE = 2;
export const DUST_BONUS_CHANCE = 0.35; // rows that also get a bonus arc
export const DUST_MAGNET_RADIUS = 150; // only with the Aimant consumable

// ---- Les Courants ----
// VERTICAL, not sideways. A lateral shove sounded good on paper but measured as pure noise:
// with it, the careless bot's altitude went UP (76m -> 102m) and the skill gradient fell
// from x1.68 to x1.14, because random perturbation always helps the worse player more.
//
// A vertical current is a positional CHOICE instead. An Ascendance lifts you and is worth
// routing through; a Rabattant sinks you and is worth going around. Both are visible long
// before you reach them, so a good line is rewarded and a careless one is punished — which
// is the opposite of noise.
export const GUST_START_M = 90;
// COLUMNS, not full-width bands. A band spanning the whole screen offers no choice at all
// — you cannot route around it — so its lift was an unconditional gift, and unconditional
// gifts help careless play most (measured: the gradient fell to x1.22 either way). A column
// you can enter or avoid is finally a decision.
// Sizes vary per current, so no two feel the same: a narrow chimney you thread, a broad
// shelf you ride. WIDTH IS CAPPED well under the corridor, because a current wide enough to
// block the whole way stops being a choice — which is precisely how the first version of
// this mechanic ended up rewarding careless play.
export const GUST_WIDTH_MIN = 110;
export const GUST_WIDTH_MAX = 260; // vs a 540px corridor: always room to go around
export const GUST_HEIGHT_MIN = 360;
export const GUST_HEIGHT_MAX = 760; // tall enough to be a real stretch of the climb
export const GUST_UP_FORCE = 520; // px/s² — near weightless inside an updraft
export const GUST_DOWN_FORCE = 400; // px/s² of extra sink in a downdraft
export const GUST_UP_CHANCE = 0.62; // updrafts are the commoner kind, so the net is a gift
export const GUST_ROWS_APART = 4;

// ---- Les Pilleurs ----
// Magpies. They do not damage you: they steal dust and break your chain. Losing what you
// have accumulated lands harder than losing a life, which is the strongest emotional lever
// in the whole design — and it is a threat you can chase off by simply not being there.
export const RAIDER_START_M = 160;
export const RAIDER_ROWS_APART = 5;
export const RAIDER_SPEED = 210; // px/s toward the player
export const RAIDER_RANGE = 340; // px at which it wakes and starts hunting
export const RAIDER_STEAL = 6; // dust taken, once, and then it is gone
// A magpie used to keep hunting on a cooldown, which meant four of them could pile up and
// never let go — harassment rather than a threat. Now a theft is a discrete EVENT: it takes
// its dust and flees off the side of the screen. You can lose to several of them, but never
// to the same one twice.
export const RAIDER_FLEE_SPEED = 520; // px/s once it has what it came for
