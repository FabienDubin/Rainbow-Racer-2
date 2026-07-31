// Comfort settings: the things a phone in a real hand needs that a desk monitor hides.
//
// This exists because the game was designed on a 540px-wide logical canvas and judged
// on a laptop, then played on an iPhone where that canvas is 393 points across. A dust
// mote 2.6px across is 1.9 points there — Fab's word was "rikiki", and he was right.
//
// So the sizes are knobs rather than constants, and they are knobs the PLAYER owns:
// friends are testing on different phones at the same time, and one baked-in number
// cannot be right for a 6.7" screen and a 5.4" one at once.
//
// Everything here is local to the device. Nothing is sent anywhere, nothing is scored
// differently: these change how the game READS, never how it plays. The one exception
// is the camera, which is a genuine mode and is labelled as such.

const STORE_KEY = "rr3.settings";

export type CameraMode = "chimney" | "follow";

export interface Settings {
  /** Multiplier on dust and garland size. 1 = the size they shipped at. */
  dustScale: number;
  /** Multiplier on anchor rings. */
  anchorScale: number;
  /** Multiplier on Prism herself. */
  prismScale: number;
  /**
   * chimney — the original: a fixed corridor, you fly off one edge and come back the
   *           other. The whole world is always in frame.
   * follow  — a much wider corridor with the camera tracking you, so Prism stays near
   *           the middle of the screen and the scenery moves instead.
   */
  camera: CameraMode;
  /**
   * Keeps Prism out of the bottom quarter of the screen, which is where a thumb rests
   * on a phone. Without it a long fall slides her right under your own thumb, and you
   * are flying blind at the exact moment you most need to see.
   */
  thumbGuard: boolean;
  /** Race the translucent replay of your best run. */
  ghost: boolean;
}

export const DEFAULTS: Settings = {
  // 1.5, not 1: the shipped size measured too small on a real phone. The slider is
  // still centred on "the size it shipped at" so the comparison stays honest.
  dustScale: 1.5,
  anchorScale: 1,
  prismScale: 1,
  camera: "chimney",
  thumbGuard: true,
  ghost: true,
};

// The range each slider offers. Below 0.6 things vanish; above 2.5 the swing circle
// stops being readable because everything on it overlaps.
export const SCALE_MIN = 0.6;
export const SCALE_MAX = 2.5;
export const SCALE_STEP = 0.05;

const clampScale = (v: unknown, fallback: number): number =>
  typeof v === "number" && Number.isFinite(v)
    ? Math.max(SCALE_MIN, Math.min(SCALE_MAX, v))
    : fallback;

// ---------------------------------------------------------------- the store
//
// Same shape as i18n's: a module-level value plus listeners, because the engine draws
// on a canvas and has no way to read a React context.

let current: Settings = { ...DEFAULTS };
const listeners = new Set<() => void>();

export function getSettings(): Settings {
  return current;
}

export function subscribeSettings(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function loadSettings(): Settings {
  if (typeof window === "undefined") return { ...DEFAULTS };
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return { ...DEFAULTS };
    const p = JSON.parse(raw) as Partial<Settings>;
    return {
      dustScale: clampScale(p.dustScale, DEFAULTS.dustScale),
      anchorScale: clampScale(p.anchorScale, DEFAULTS.anchorScale),
      prismScale: clampScale(p.prismScale, DEFAULTS.prismScale),
      camera: p.camera === "follow" ? "follow" : "chimney",
      thumbGuard: p.thumbGuard !== false,
      ghost: p.ghost !== false,
    };
  } catch {
    return { ...DEFAULTS };
  }
}

export function setSettings(next: Settings): void {
  current = next;
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(next));
  } catch {
    // Storage blocked — the settings still hold for this session
  }
  listeners.forEach((fn) => fn());
}

/** Change one field and persist. */
export function patchSettings<K extends keyof Settings>(key: K, value: Settings[K]): void {
  setSettings({ ...current, [key]: value });
}

export function resetSettings(): void {
  setSettings({ ...DEFAULTS });
}

/** Applies what was saved. Called once from the client, never during render. */
export function initSettings(): Settings {
  const loaded = loadSettings();
  setSettings(loaded);
  return loaded;
}
