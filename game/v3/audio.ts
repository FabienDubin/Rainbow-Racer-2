// Reactive audio, synthesised entirely in Web Audio — no files to load, nothing to wait
// for, and it can respond to gameplay on the beat because the music IS the code.
//
// The idea worth the effort: the score is LAYERED, and the layers come in as your chain
// grows. Struggling, you hear a bare pad. Chaining well, you hear pad, bass, arpeggio,
// drums and finally a lead. Your performance becomes audible, which is a dopamine ladder
// you climb with your ears — and nothing else in a browser game does it.
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

const PENTATONIC = [0, 2, 4, 7, 9];

const midi = (n: number) => 440 * Math.pow(2, (n - 69) / 12);

export type Layer = "pad" | "bass" | "arp" | "drums" | "lead";
const LAYERS: Layer[] = ["pad", "bass", "arp", "drums", "lead"];

export class GameAudio {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private busses = new Map<Layer, GainNode>();
  private noise: AudioBuffer | null = null;

  private timer: number | null = null;
  private nextNoteTime = 0;
  private step = 0; // 16th steps since start
  muted = false;

  /** 0..4 — how many layers should be audible. Driven by the player's chain. */
  private targetTier = 0;

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

    for (const layer of LAYERS) {
      const g = this.ctx.createGain();
      g.gain.value = 0;
      g.connect(master);
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

  startMusic(): void {
    void this.resume();
    if (!this.ctx || this.timer !== null) return;
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

  /** Chain length decides how much of the band is playing. */
  setChain(chain: number): void {
    const tier = chain >= 15 ? 4 : chain >= 10 ? 3 : chain >= 6 ? 2 : chain >= 3 ? 1 : 0;
    this.targetTier = tier;
    if (!this.ctx) return;
    LAYERS.forEach((layer, i) => {
      const g = this.busses.get(layer);
      if (!g) return;
      const on = i === 0 || i <= tier;
      const level = layer === "pad" ? 0.32 : layer === "drums" ? 0.26 : 0.22;
      // Slow fades so layers arrive musically rather than snapping in
      g.gain.setTargetAtTime(on ? level : 0, this.ctx!.currentTime, 0.5);
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
    const stepDur = BEAT / 4;
    while (this.nextNoteTime < this.ctx.currentTime + ahead) {
      this.playStep(this.step, this.nextNoteTime);
      this.step++;
      this.nextNoteTime += stepDur;
    }
  }

  private playStep(step: number, when: number): void {
    const bar = Math.floor(step / 16) % PROGRESSION.length;
    const inBar = step % 16;
    const { root, chord } = PROGRESSION[bar];

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
      if (inBar % 4 === 2) this.hat(when, 0.16);
      if (inBar === 12) this.snare(when);
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
    g.gain.linearRampToValueAtTime(0.16 * level, when + 0.6);
    g.gain.setTargetAtTime(0, when + dur * 0.55, dur * 0.3);
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 1400;
    filter.Q.value = 0.6;
    for (const detune of [-6, 6]) {
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
    const o = ctx.createOscillator();
    o.type = "triangle";
    o.frequency.setValueAtTime(freq * 1.01, when);
    o.frequency.exponentialRampToValueAtTime(freq, when + 0.05);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(0.5, when + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, when + 0.34);
    o.connect(g).connect(bus);
    o.start(when);
    o.stop(when + 0.4);
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
    const o = ctx.createOscillator();
    o.type = "square";
    o.frequency.value = freq;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 2600;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(0.14, when + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, when + 0.5);
    o.connect(filter).connect(g).connect(bus);
    o.start(when);
    o.stop(when + 0.55);
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

  private kick(when: number): void {
    const ctx = this.ctx!;
    const bus = this.voice("drums");
    if (!bus) return;
    const o = ctx.createOscillator();
    o.type = "sine";
    o.frequency.setValueAtTime(150, when);
    o.frequency.exponentialRampToValueAtTime(46, when + 0.1);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.9, when);
    g.gain.exponentialRampToValueAtTime(0.0001, when + 0.22);
    o.connect(g).connect(bus);
    o.start(when);
    o.stop(when + 0.25);
  }

  private hat(when: number, gain: number): void {
    this.noiseBurst(when, 0.045, gain, "highpass", 7500, "drums");
  }

  private snare(when: number): void {
    this.noiseBurst(when, 0.14, 0.3, "bandpass", 1900, "drums");
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

  reward(): void {
    if (!this.ctx) return;
    const t = this.now();
    [0, 5, 9, 12, 16].forEach((semi, i) =>
      this.blip(t + i * 0.06, midi(72 + semi), midi(72 + semi), 0.4, 0.14, "sine")
    );
  }
}

export const audio = new GameAudio();
