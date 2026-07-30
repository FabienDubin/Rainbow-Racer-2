# Phase 0 harness

Headless probes for the Arc physics. They drive the engine's internals directly
(TypeScript `private` is compile-time only) with a stubbed canvas, so they run in
plain Node with no browser and no test framework.

```bash
npx tsc game/v3/proto.engine.ts --outDir /tmp/proto-build \
  --module commonjs --target es2020 --esModuleInterop --skipLibCheck --lib es2020,dom
cp game/v3/__tests__/*.js /tmp/proto-build/
node /tmp/proto-build/bot.js
```

- **swing.js** — measures ONE swing: brute-forces every release frame and reports the
  best altitude gain, duration and exit speed. Run this first when tuning; if the
  primitive is weak nothing downstream can save it.
- **bot.js** — six strategies, 8 seeds each. Two invariants must hold: skilled play
  beats careless play, and no degenerate strategy (spam / hold / never-let-go) tops
  the table.
- **attribute.js** — splits altitude gain into "attached" vs "free flight". This is
  what caught the real bug: the winning strategy was staying attached 100% of the
  time, so a bad release never cost anything.

- **arc.js** — rides one swing without ever releasing and prints the trajectory by
  clock position (12 = above the anchor, 6 = below). Use it to check the grapple
  survives a full dive arc instead of being torn away mid-swing.
- **dive.js** — grab a ring BELOW you, fall past it, and measure how much extra launch
  height the dive bought versus grabbing from a standstill.
- **limits.js** — asserts the two grab types get different arc lengths and that the
  grip is always eventually lost.
- **whip.js / sweep.js** — parameter sweeps. Both tuning knobs trade one objective
  against another, so they are swept rather than guessed: WHIP_RECOVERY trades momentum
  retention against the skill gradient, and SWING_PUMP trades dive reward against
  baseline playability.

Each of these found a distinct design flaw that playtesting by feel would have
hidden behind "it's a bit weird". Keep them running as the physics changes.

- **policy.js** — re-derives the best release policy by sweep. Run it after any change
  to the speed scale: hand-tuned bot thresholds go stale silently, and a stale "expert"
  bot makes skilled play look worse than careless play, which reads as a broken game
  when the harness is what broke.
- **speedcap.js** — checks speed is not compounding. The release kick is multiplicative,
  so it needs a real governor; the screen walls used to be one by accident.

- **marker.js** — the off-screen indicator. Uses a canvas stub that *records* draw
  calls instead of discarding them, so placement and rotation can be asserted without a
  browser. Handy pattern for any other HUD element that is hard to catch on camera.

A note on what the numbers can and cannot say: the bots are crude and do not chain
momentum the way a person does, so treat the absolute altitudes as a floor. What they
are genuinely good at is catching *ordering* bugs — a degenerate strategy quietly
beating skilled play — which is exactly the class of problem that hides from feel.
