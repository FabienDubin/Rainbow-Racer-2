// Tiny audio layer over HTMLAudioElement: clones short SFX so they can overlap,
// keeps one looping music channel, global mute persisted in localStorage.

const SFX_SOURCES = {
  flap: "/sound/Flapping.mp3",
  gem: "/sound/getBall.wav",
  star: "/sound/StarShoot.wav",
  rainbow: "/sound/Rainbows.mp3",
  hit: "/sound/LiveDown.wav",
  life: "/sound/LifeUp.wav",
  cloudPop: "/sound/Cloud.wav",
  bomb: "/sound/DropPoop.wav",
  bombReady: "/sound/GotPoop.wav",
  gameOver: "/sound/GameOver.mp3",
  notification: "/sound/Notification.mp3",
} as const;

export type SfxKey = keyof typeof SFX_SOURCES;

const VOLUMES: Partial<Record<SfxKey, number>> = {
  flap: 0.25,
  gem: 0.3,
  star: 0.35,
  rainbow: 0.4,
  hit: 0.45,
  bomb: 0.5,
  gameOver: 0.4,
};

export class AudioManager {
  private base = {} as Record<SfxKey, HTMLAudioElement>;
  private music: HTMLAudioElement | null = null;
  muted = false;

  init(): void {
    if (typeof window === "undefined" || this.music) return;
    this.muted = localStorage.getItem("rr2.muted") === "1";
    for (const [key, src] of Object.entries(SFX_SOURCES) as [SfxKey, string][]) {
      const audio = new Audio(src);
      audio.preload = "auto";
      this.base[key] = audio;
    }
    this.music = new Audio("/sound/RainbowRaceTheme.mp3");
    this.music.loop = true;
    this.music.volume = 0.16;
  }

  play(key: SfxKey): void {
    if (this.muted || !this.base[key]) return;
    // Clone so rapid-fire sounds (gems!) overlap instead of cutting each other
    const node = this.base[key].cloneNode() as HTMLAudioElement;
    node.volume = VOLUMES[key] ?? 0.3;
    void node.play().catch(() => {});
  }

  startMusic(): void {
    if (this.muted || !this.music) return;
    this.music.currentTime = 0;
    void this.music.play().catch(() => {});
  }

  stopMusic(): void {
    this.music?.pause();
  }

  pauseMusic(): void {
    this.music?.pause();
  }

  resumeMusic(): void {
    if (!this.muted) void this.music?.play().catch(() => {});
  }

  setMusicRate(rate: number): void {
    if (this.music) this.music.playbackRate = rate;
  }

  toggleMute(): boolean {
    this.muted = !this.muted;
    localStorage.setItem("rr2.muted", this.muted ? "1" : "0");
    if (this.muted) this.stopMusic();
    else void this.music?.play().catch(() => {});
    return this.muted;
  }
}

export const audio = new AudioManager();
