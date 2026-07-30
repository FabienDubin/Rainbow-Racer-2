// Reactive audio, synthesised entirely in Web Audio — no files to load, nothing to wait
// for, and it can respond to gameplay on the beat because the music IS the code.
//
// The score is LAYERED, and a layer arrives with every PALIER you cross. Altitude only ever
// goes up, so the music only ever builds: by the top you are hearing the whole band, and the
// climb has an audible arc.
//
// It was driven by the chain at first, which was wrong — a chain breaks the moment a bolt
// catches you, so the music collapsed mid-run and the intensity told you nothing about how
// far you had come.
//
// Voice: dreamy electronic, and the DREAMY half is the one to protect. Stacking six layers
// and a thunderclap on top pulls naturally toward percussive and busy, so the choices below
// deliberately pull the other way: three detuned pad voices with a slow attack, brushed
// drums instead of a kit, triangles rather than squares, a generous feedback delay on
// everything plucked, and a thunder that swells instead of cracking. Loud is easy; this is
// supposed to feel like altitude, not like a drum machine.
//
// Everything is gated behind the first user gesture, per autoplay policy.

const BPM = 124;
const BEAT = 60 / BPM;
const BAR = BEAT * 4;

// A major, with a dreamy I–V–vi–IV shape. Roots plus the chord tones above them.
const PROGRESSION: { root: number; chord: number[] }[] = [
  { root: 45, chord: [57, 61, 64] }, // A
  { root: 40, chord: [52, 56, 59] }, // E
  { root: 42, chord: [54, 57, 61] }, // F#m
  { root: 38, chord: [50, 54, 57] }, // D
];

// The end-of-run screens get their own music: same key, minor turn, half the tempo and only
// the quiet layers. A run ending on the same upbeat loop as the run itself felt indifferent
// to what just happened.
const AFTERMATH: { root: number; chord: number[] }[] = [
  { root: 42, chord: [54, 57, 61] }, // F#m
  { root: 38, chord: [50, 53, 57] }, // Dm-ish
  { root: 40, chord: [52, 55, 59] }, // Em
  { root: 33, chord: [45, 48, 52] }, // A minor low
];

const PENTATONIC = [0, 2, 4, 7, 9];

const midi = (n: number) => 440 * Math.pow(2, (n - 69) / 12);

export type Layer = "pad" | "bass" | "arp" | "drums" | "lead" | "shimmer";
// Index order IS the order they arrive in, one per palier
const LAYERS: Layer[] = ["pad", "bass", "arp", "drums", "lead", "shimmer"];

export class GameAudio {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private busses = new Map<Layer, GainNode>();
  private delayIn: GainNode | null = null;
  private noise: AudioBuffer | null = null;

  private timer: number | null = null;
  private nextNoteTime = 0;
  private step = 0; // 16th steps since start
  muted = false;

  /** 0..4 — how many layers should be audible. Driven by the player's chain. */
  private targetTier = 0;
  private mood: "play" | "aftermath" = "play";

  init(): void {
    if (this.ctx || typeof window === "undefined") return;
    try {
      this.muted = localStorage.getItem("rr3.muted") === "1";
    } catch {
      /* storage blocked — default to sound on */
    }

    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    this.ctx = new Ctor();

    const master = this.ctx.createGain();
    master.gain.value = this.muted ? 0 : 0.85;
    // A gentle limiter keeps the layered mix from clipping when everything is in
    const comp = this.ctx.createDynamicsCompressor();
    comp.threshold.value = -12;
    comp.ratio.value = 6;
    comp.attack.value = 0.004;
    comp.release.value = 0.2;
    master.connect(comp).connect(this.ctx.destination);
    this.master = master;

    // A feedback delay in sync with the tempo. This one node is most of what makes the
    // whole thing read as dreamy rather than as a chiptune.
    const delay = this.ctx.createDelay(1.5);
    delay.delayTime.value = BEAT * 0.75;
    const fb = this.ctx.createGain();
    fb.gain.value = 0.42;
    const tone = this.ctx.createBiquadFilter();
    tone.type = "lowpass";
    tone.frequency.value = 2600;
    const send = this.ctx.createGain();
    send.gain.value = 1;
    send.connect(delay);
    delay.connect(tone).connect(fb).connect(delay);
    tone.connect(master);
    this.delayIn = send;

    for (const layer of LAYERS) {
      const g = this.ctx.createGain();
      g.gain.value = 0;
      g.connect(master);
      // Plucked and bell-like voices go to the delay; pad, bass and drums stay dry
      if (layer === "arp" || layer === "lead" || layer === "shimmer") {
        const tap = this.ctx.createGain();
        tap.gain.value = 0.7;
        g.connect(tap).connect(send);
      }
      this.busses.set(layer, g);
    }

    // One shared noise buffer for hats, snares and impacts
    const len = Math.floor(this.ctx.sampleRate * 0.5);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    this.noise = buf;
  }

  /** Called on the first real gesture; browsers will not start audio before one. */
  async resume(): Promise<void> {
    this.init();
    if (!this.ctx) return;
    if (this.ctx.state === "suspended") await this.ctx.resume();
  }

  startMusic(mood: "play" | "aftermath" = "play"): void {
    void this.resume();
    if (!this.ctx) return;
    this.mood = mood;
    if (mood === "aftermath") {
      this.targetTier = 0;
      // Only the pad and a sparse bass; deliberately thin
      LAYERS.forEach((layer, i) => {
        const g = this.busses.get(layer);
        if (g) g.gain.setTargetAtTime(i <= 1 ? (i === 0 ? 0.3 : 0.16) : 0, this.ctx!.currentTime, 0.4);
      });
    }
    if (this.timer !== null) return;
    this.step = 0;
    this.nextNoteTime = this.ctx.currentTime + 0.06;
    // Schedule ahead on a coarse timer: the classic Web Audio pattern, because setInterval
    // is far too jittery to place notes with but perfectly fine to schedule from.
    this.timer = window.setInterval(() => this.schedule(), 25);
  }

  stopMusic(): void {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
    for (const g of this.busses.values()) {
      if (this.ctx) g.gain.setTargetAtTime(0, this.ctx.currentTime, 0.25);
    }
  }

  /**
   * One layer per palier crossed. Altitude only rises, so the arrangement only builds —
   * which makes the music a record of how far you have come rather than of your last few
   * seconds.
   */
  setPaliers(crossed: number): void {
    const tier = Math.min(LAYERS.length - 1, crossed);
    if (tier === this.targetTier) return;
    this.targetTier = tier;
    if (!this.ctx) return;
    LAYERS.forEach((layer, i) => {
      const g = this.busses.get(layer);
      if (!g) return;
      const on = i <= tier;
      const level =
        layer === "pad" ? 0.3 : layer === "drums" ? 0.16 : layer === "shimmer" ? 0.14 : 0.2;
      // Slow fades so a layer arrives musically rather than snapping in
      g.gain.setTargetAtTime(on ? level : 0, this.ctx!.currentTime, 1.1);
    });
  }

  toggleMute(): boolean {
    this.init();
    this.muted = !this.muted;
    try {
      localStorage.setItem("rr3.muted", this.muted ? "1" : "0");
    } catch {
      /* ignore */
    }
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(this.muted ? 0 : 0.85, this.ctx.currentTime, 0.05);
    }
    return this.muted;
  }

  // ------------------------------------------------------------------ scheduler
  private schedule(): void {
    if (!this.ctx) return;
    const ahead = 0.12;
    // Half tempo on the aftermath screens: the same music slowed down reads as a comedown
    const stepDur = (BEAT / 4) * (this.mood === "aftermath" ? 2 : 1);
    while (this.nextNoteTime < this.ctx.currentTime + ahead) {
      this.playStep(this.step, this.nextNoteTime);
      this.step++;
      this.nextNoteTime += stepDur;
    }
  }

  private playStep(step: number, when: number): void {
    const table = this.mood === "aftermath" ? AFTERMATH : PROGRESSION;
    const bar = Math.floor(step / 16) % table.length;
    const inBar = step % 16;
    const { root, chord } = table[bar];

    if (this.mood === "aftermath") {
      // Pad on the bar, one low bass note halfway through. Nothing else.
      if (inBar === 0) {
        for (const n of chord) this.pad(midi(n), when, BAR * 2.2);
      }
      if (inBar === 8) this.bass(midi(root - 12), when);
      return;
    }

    // Pad: a sustained chord, re-struck at the top of each bar
    if (inBar === 0) {
      for (const n of chord) this.pad(midi(n), when, BAR * 1.05);
      this.pad(midi(root + 12), when, BAR * 1.05, 0.5);
    }

    if (this.targetTier >= 1 && (inBar === 0 || inBar === 6 || inBar === 10)) {
      this.bass(midi(root), when);
    }

    if (this.targetTier >= 2 && inBar % 2 === 0) {
      const note = chord[(step / 2) % chord.length] + (inBar >= 8 ? 12 : 0);
      this.pluck(midi(note), when, "arp");
    }

    if (this.targetTier >= 3) {
      if (inBar === 0 || inBar === 8) this.kick(when);
      if (inBar % 4 === 2) this.hat(when, 0.08);
      if (inBar === 12) this.snare(when);
    }

    if (this.targetTier >= 5 && inBar % 8 === 3) {
      // High bells, two octaves up, well into the delay: the "we are very high now" sound
      const deg = PENTATONIC[(step / 5) % PENTATONIC.length];
      this.pluck(midi(root + 36 + deg), when, "shimmer", 0.16);
    }

    if (this.targetTier >= 4 && (inBar === 4 || inBar === 11)) {
      const deg = PENTATONIC[(step / 3) % PENTATONIC.length];
      this.lead(midi(root + 24 + deg), when);
    }
  }

  // ------------------------------------------------------------------ voices
  private voice(layer: Layer): GainNode | null {
    return this.busses.get(layer) ?? null;
  }

  private pad(freq: number, when: number, dur: number, level = 1): void {
    const ctx = this.ctx!;
    const bus = this.voice("pad");
    if (!bus) return;
    // Two slightly detuned saws through a soft filter: the classic warm pad
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, when);
    g.gain.linearRampToValueAtTime(0.16 * level, when + 1.1);
    g.gain.setTargetAtTime(0, when + dur * 0.55, dur * 0.3);
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 1250;
    filter.Q.value = 0.5;
    // Three voices, widely detuned: the beating between them IS the dreaminess
    for (const detune of [-11, 0, 11]) {
      const o = ctx.createOscillator();
      o.type = "sawtooth";
      o.frequency.value = freq;
      o.detune.value = detune;
      o.connect(filter);
      o.start(when);
      o.stop(when + dur + 0.4);
    }
    filter.connect(g).connect(bus);
  }

  private bass(freq: number, when: number): void {
    const ctx = this.ctx!;
    const bus = this.voice("bass");
    if (!bus) return;
    // Saw through a filter with its own envelope: the electro bass sound, rather than a
    // plain triangle, which read as chiptune
    const o = ctx.createOscillator();
    o.type = "sawtooth";
    o.frequency.setValueAtTime(freq * 1.01, when);
    o.frequency.exponentialRampToValueAtTime(freq, when + 0.05);
    const sub = ctx.createOscillator();
    sub.type = "sine";
    sub.frequency.value = freq / 2;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.Q.value = 7;
    filter.frequency.setValueAtTime(freq * 7, when);
    filter.frequency.exponentialRampToValueAtTime(Math.max(90, freq * 1.6), when + 0.26);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(0.42, when + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, when + 0.38);
    o.connect(filter);
    sub.connect(filter);
    filter.connect(g).connect(bus);
    o.start(when);
    o.stop(when + 0.44);
    sub.start(when);
    sub.stop(when + 0.44);
  }

  private pluck(freq: number, when: number, layer: Layer, gain = 0.28): void {
    const ctx = this.ctx!;
    const bus = this.voice(layer);
    if (!bus) return;
    const o = ctx.createOscillator();
    o.type = "triangle";
    o.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(gain, when + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, when + 0.22);
    o.connect(g).connect(bus);
    o.start(when);
    o.stop(when + 0.26);
  }

  private lead(freq: number, when: number): void {
    const ctx = this.ctx!;
    const bus = this.voice("lead");
    if (!bus) return;
    // Triangle, not square: a square lead is bright and cheap and cuts straight through the
    // dream. The slow attack keeps it singing rather than plinking.
    const o = ctx.createOscillator();
    o.type = "triangle";
    o.frequency.value = freq;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 1900;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(0.13, when + 0.09);
    g.gain.exponentialRampToValueAtTime(0.0001, when + 0.8);
    o.connect(filter).connect(g).connect(bus);
    o.start(when);
    o.stop(when + 0.85);
  }

  private noiseBurst(when: number, dur: number, gain: number, type: BiquadFilterType, freq: number, layer: Layer): void {
    const ctx = this.ctx!;
    const bus = this.voice(layer);
    if (!bus || !this.noise) return;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const filter = ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, when);
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    src.connect(filter).connect(g).connect(bus);
    src.start(when);
    src.stop(when + dur + 0.02);
  }

  // A soft, round kick with a slower decay. A punchy one turned the whole thing into a
  // dance track, which is not what this is.
  private kick(when: number): void {
    const ctx = this.ctx!;
    const bus = this.voice("drums");
    if (!bus) return;
    const o = ctx.createOscillator();
    o.type = "sine";
    o.frequency.setValueAtTime(115, when);
    o.frequency.exponentialRampToValueAtTime(44, when + 0.16);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.5, when);
    g.gain.exponentialRampToValueAtTime(0.0001, when + 0.34);
    o.connect(g).connect(bus);
    o.start(when);
    o.stop(when + 0.36);
  }

  private hat(when: number, gain: number): void {
    this.noiseBurst(when, 0.06, gain, "highpass", 9000, "drums");
  }

  // A brushed swell rather than a snare crack: it marks the bar without puncturing the mood
  private snare(when: number): void {
    this.noiseBurst(when, 0.3, 0.12, "bandpass", 1100, "drums");
  }

  // ------------------------------------------------------------------ SFX
  // Deliberately routed to the pad bus so they are always audible, whatever the tier.
  private sfx(): GainNode | null {
    return this.master;
  }

  private blip(when: number, from: number, to: number, dur: number, gain: number, type: OscillatorType): void {
    const ctx = this.ctx;
    const bus = this.sfx();
    if (!ctx || !bus) return;
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(from, when);
    o.frequency.exponentialRampToValueAtTime(Math.max(20, to), when + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(gain, when + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    o.connect(g).connect(bus);
    o.start(when);
    o.stop(when + dur + 0.03);
  }

  private now(): number {
    return this.ctx ? this.ctx.currentTime : 0;
  }

  /** The root note currently under the arrangement, so events can land in key. */
  private currentRoot(): number {
    const table = this.mood === "aftermath" ? AFTERMATH : PROGRESSION;
    return table[Math.floor(this.step / 16) % table.length].root;
  }

  grab(): void {
    if (!this.ctx) return;
    this.blip(this.now(), 420, 880, 0.14, 0.2, "triangle");
  }

  /** Release, pitched by how well it was aimed — you hear your own timing. */
  release(quality: number): void {
    if (!this.ctx) return;
    const t = this.now();
    this.blip(t, 500 + quality * 400, 1500 + quality * 900, 0.2, 0.16 + quality * 0.12, "sawtooth");
    this.noiseBurst(t, 0.18, 0.1 + quality * 0.12, "highpass", 3000 + quality * 4000, "pad");
  }

  flap(): void {
    if (!this.ctx) return;
    this.noiseBurst(this.now(), 0.12, 0.12, "bandpass", 900, "pad");
  }

  /** Dust chime, climbing with the chain so a streak sounds like a streak. */
  dust(chain: number, bonus: boolean): void {
    if (!this.ctx) return;
    const deg = PENTATONIC[chain % PENTATONIC.length];
    const base = 69 + deg + (bonus ? 12 : 0) + Math.floor(chain / PENTATONIC.length) * 2;
    this.blip(this.now(), midi(base), midi(base), 0.16, bonus ? 0.2 : 0.12, "sine");
    if (bonus) this.blip(this.now() + 0.05, midi(base + 7), midi(base + 7), 0.2, 0.12, "sine");
  }

  palier(): void {
    if (!this.ctx) return;
    const t = this.now();
    // A rising arpeggio: the sound of pressure being relieved
    [0, 4, 7, 12].forEach((semi, i) =>
      this.blip(t + i * 0.07, midi(69 + semi), midi(69 + semi), 0.5, 0.15, "triangle")
    );
  }

  /**
   * The telegraph, as sound. A rising tone on the current root: you can hear a bolt arming
   * even while looking somewhere else, which matters a lot on a phone where the flash may
   * be off in a corner of your eye.
   */
  boltCharge(seconds: number): void {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const bus = this.master;
    if (!bus) return;
    const t = this.now();
    const root = midi(this.currentRoot() + 24);

    const o = ctx.createOscillator();
    o.type = "triangle";
    // A fifth's worth of rise over the warning, so it reads as tension rather than a beep
    o.frequency.setValueAtTime(root, t);
    o.frequency.exponentialRampToValueAtTime(root * 1.5, t + seconds);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.09, t + seconds * 0.85);
    g.gain.exponentialRampToValueAtTime(0.0001, t + seconds + 0.05);
    o.connect(g).connect(bus);
    o.start(t);
    o.stop(t + seconds + 0.1);

    // A noise sweep underneath, rising with it
    const src = ctx.createBufferSource();
    if (this.noise) {
      src.buffer = this.noise;
      src.loop = true;
      const f = ctx.createBiquadFilter();
      f.type = "bandpass";
      f.Q.value = 3;
      f.frequency.setValueAtTime(600, t);
      f.frequency.exponentialRampToValueAtTime(4200, t + seconds);
      const ng = ctx.createGain();
      ng.gain.setValueAtTime(0.0001, t);
      ng.gain.exponentialRampToValueAtTime(0.06, t + seconds * 0.9);
      ng.gain.exponentialRampToValueAtTime(0.0001, t + seconds + 0.05);
      src.connect(f).connect(ng).connect(bus);
      src.start(t);
      src.stop(t + seconds + 0.1);
    }
  }

  /**
   * The strike itself: a big musical moment rather than a noise. A sub drop on the current
   * root plus a stab of the chord, so the thunder belongs to the track. If it caught you, a
   * tritone goes on top and the whole thing sours.
   */
  boltStrike(caughtMe: boolean): void {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const bus = this.master;
    if (!bus) return;
    const t = this.now();
    const root = this.currentRoot();

    // Sub drop
    const o = ctx.createOscillator();
    o.type = "sine";
    o.frequency.setValueAtTime(midi(root + 12), t);
    o.frequency.exponentialRampToValueAtTime(midi(root - 12), t + 0.5);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.5, t + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
    o.connect(g).connect(bus);
    o.start(t);
    o.stop(t + 0.75);

    // The stab: in key, and soured with a tritone when it actually hit you
    const stab = caughtMe ? [0, 6, 11] : [0, 7, 12];
    for (const semi of stab) {
      const so = ctx.createOscillator();
      so.type = "sawtooth";
      so.frequency.value = midi(root + 12 + semi);
      const f = ctx.createBiquadFilter();
      f.type = "lowpass";
      // Swells in over 90ms and filters down: dramatic without a hard transient
      f.frequency.setValueAtTime(2400, t);
      f.frequency.exponentialRampToValueAtTime(420, t + 0.55);
      const sg = ctx.createGain();
      sg.gain.setValueAtTime(0.0001, t);
      sg.gain.exponentialRampToValueAtTime(caughtMe ? 0.1 : 0.06, t + 0.09);
      sg.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
      so.connect(f).connect(sg).connect(bus);
      so.start(t);
      so.stop(t + 0.5);
    }

    // The crack
    this.noiseBurst(t, caughtMe ? 0.55 : 0.35, caughtMe ? 0.16 : 0.09, "bandpass", 1400, "pad");
  }

  hit(): void {
    if (!this.ctx) return;
    const t = this.now();
    this.blip(t, 220, 40, 0.4, 0.4, "square");
    this.noiseBurst(t, 0.32, 0.34, "lowpass", 700, "pad");
  }

  steal(): void {
    if (!this.ctx) return;
    // Descending, cartoonish: something has been taken from you
    this.blip(this.now(), 900, 260, 0.3, 0.22, "sawtooth");
  }

  gust(): void {
    if (!this.ctx) return;
    this.noiseBurst(this.now(), 0.7, 0.1, "bandpass", 500, "pad");
  }

  death(): void {
    if (!this.ctx) return;
    const t = this.now();
    [0, -3, -7, -12].forEach((semi, i) =>
      this.blip(t + i * 0.13, midi(64 + semi), midi(64 + semi), 0.6, 0.16, "triangle")
    );
    this.noiseBurst(t, 1.2, 0.16, "lowpass", 400, "pad");
  }

  /** A card turning over: a short shuffle-flick, then the value lands. */
  cardFlip(): void {
    if (!this.ctx) return;
    const t = this.now();
    this.noiseBurst(t, 0.07, 0.2, "highpass", 4200, "pad");
    this.blip(t + 0.05, 500, 760, 0.12, 0.13, "triangle");
  }

  /** A gift on the card: worth an actual fanfare, since it is the hook. */
  giftFanfare(): void {
    if (!this.ctx) return;
    const t = this.now();
    [0, 4, 7, 12, 16, 19].forEach((semi, i) =>
      this.blip(t + i * 0.075, midi(69 + semi), midi(69 + semi), 0.55, 0.17, "triangle")
    );
    this.noiseBurst(t + 0.1, 0.5, 0.1, "highpass", 6000, "pad");
  }

  uiHover(): void {
    if (!this.ctx) return;
    this.blip(this.now(), 620, 700, 0.05, 0.05, "sine");
  }

  uiClick(): void {
    if (!this.ctx) return;
    this.blip(this.now(), 740, 480, 0.09, 0.13, "triangle");
  }

  /** A purchase: heavier than a click, so spending feels like spending. */
  purchase(): void {
    if (!this.ctx) return;
    const t = this.now();
    [0, 7, 12].forEach((semi, i) =>
      this.blip(t + i * 0.06, midi(64 + semi), midi(64 + semi), 0.3, 0.15, "triangle")
    );
  }

  reward(): void {
    if (!this.ctx) return;
    const t = this.now();
    [0, 5, 9, 12, 16].forEach((semi, i) =>
      this.blip(t + i * 0.06, midi(72 + semi), midi(72 + semi), 0.4, 0.14, "sine")
    );
  }
}

export const audio = new GameAudio();

// ---------------------------------------------------------------- haptics
// On a phone the thumb carries half the game feel, and a vibration lands even when the
// player has the sound off. Silently absent on desktop and on iOS Safari.
export function haptic(pattern: number | number[]): void {
  if (typeof navigator === "undefined") return;
  const nav = navigator as Navigator & { vibrate?: (p: number | number[]) => boolean };
  try {
    nav.vibrate?.(pattern);
  } catch {
    /* not supported — nothing to do */
  }
}
