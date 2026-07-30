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

Each of these found a distinct design flaw that playtesting by feel would have
hidden behind "it's a bit weird". Keep them running as the physics changes.
