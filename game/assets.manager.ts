// Loads and caches all images once; game code accesses them synchronously afterwards.

const IMAGE_SOURCES = {
  unicornUp: "/img/Unicorn-wings-up.png",
  unicornMid: "/img/Unicorn-wings-middle.png",
  unicornDown: "/img/Unicorn-wings-down.png",
  gemGreen: "/img/GreenBall.png",
  gemPink: "/img/PinkBall.png",
  gemPurple: "/img/PurpleBall.png",
  gemYellow: "/img/YellowBall.png",
  starYellow: "/img/StarYellow.png",
  starPink: "/img/StarPink.png",
  starGreen: "/img/StarGreen.png",
  starPurple: "/img/StarPurple.png",
  rainbow: "/img/Rainbow.png",
  poop: "/img/Poop.png",
  cloud: "/img/NaughtyCloud.png",
  life: "/img/Life.png",
  logo: "/img/Logo.png",
} as const;

export type ImageKey = keyof typeof IMAGE_SOURCES;

export class AssetsManager {
  images = {} as Record<ImageKey, HTMLImageElement>;
  loaded = false;

  async loadAll(): Promise<void> {
    if (this.loaded) return;
    const entries = Object.entries(IMAGE_SOURCES) as [ImageKey, string][];
    await Promise.all(
      entries.map(
        ([key, src]) =>
          new Promise<void>((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve();
            img.onerror = () => reject(new Error(`Failed to load ${src}`));
            img.src = src;
            this.images[key] = img;
          })
      )
    );
    this.loaded = true;
  }
}

export const assets = new AssetsManager();
