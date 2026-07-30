// Altitude bands. The ascent IS the progression bar, so the sky is the main thing that
// tells you how far you have come — each band has its own light, not just its own hue.
//
// Distances are set against real runs: Fab reaches ~650m when trying, ~147m relaxed. So a
// relaxed run sees two bands change and a good run sees four. Bands must not be so long
// that a normal game only ever shows one.

export interface Band {
  name: string;
  fromM: number;
  skyTop: string;
  skyBottom: string;
  /** Distant silhouette layer — the furthest, palest shapes. */
  far: string;
  /** Nearer silhouette layer. */
  near: string;
  /** Colour of the light that rims clouds and prisms in this band. */
  light: string;
  /** Ambient stars fade in with this weight (0 = none). */
  stars: number;
}

export const BANDS: Band[] = [
  {
    name: "Aube des Prairies",
    fromM: 0,
    skyTop: "#8fb6e8",
    skyBottom: "#ffd9a8",
    far: "#b98fa8",
    near: "#7d5f80",
    light: "#ffcf8f",
    stars: 0,
  },
  {
    name: "Royaume des Nuages",
    fromM: 120,
    skyTop: "#4f8ddb",
    skyBottom: "#c8e6ff",
    far: "#8fb6dd",
    near: "#5d84ad",
    light: "#ffffff",
    stars: 0,
  },
  {
    name: "Ceinture d'Orage",
    fromM: 300,
    skyTop: "#2b2f52",
    skyBottom: "#6b6a94",
    far: "#3f4268",
    near: "#23233d",
    light: "#cfd6ff",
    stars: 0.15,
  },
  {
    name: "Stratosphère de Cristal",
    fromM: 550,
    skyTop: "#0f3f52",
    skyBottom: "#5fd6c4",
    far: "#1d6b78",
    near: "#0d3d47",
    light: "#b9fff0",
    stars: 0.45,
  },
  {
    name: "Mésosphère Néon",
    fromM: 850,
    skyTop: "#1a0b3d",
    skyBottom: "#c2379b",
    far: "#5b1d6e",
    near: "#2b0f42",
    light: "#ff9de0",
    stars: 0.8,
  },
  {
    name: "Orbite",
    fromM: 1200,
    skyTop: "#01030f",
    skyBottom: "#123a7a",
    far: "#0b2350",
    near: "#040b1c",
    light: "#9fc4ff",
    stars: 1,
  },
  {
    name: "Dimension Prisme",
    fromM: 1700,
    skyTop: "#0a0118",
    skyBottom: "#3d1170",
    far: "#5a1d8f",
    near: "#1b0733",
    light: "#ffffff",
    stars: 1,
  },
];

// The rainbow the whole game is named after. Used for the tether, the paliers and any
// spectrum flourish, so they all read as the same material.
export const SPECTRUM = [
  "#ff5f6d",
  "#ff9e5e",
  "#ffd166",
  "#7ed957",
  "#4bc0ff",
  "#8b5cf6",
];

function mix(a: string, b: string, t: number): string {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const r = Math.round(((pa >> 16) & 255) * (1 - t) + ((pb >> 16) & 255) * t);
  const g = Math.round(((pa >> 8) & 255) * (1 - t) + ((pb >> 8) & 255) * t);
  const bl = Math.round((pa & 255) * (1 - t) + (pb & 255) * t);
  return `rgb(${r},${g},${bl})`;
}

export interface SkyState {
  band: Band;
  next: Band;
  /** 0..1 through the crossfade into the next band. */
  blend: number;
  skyTop: string;
  skyBottom: string;
  far: string;
  near: string;
  light: string;
  stars: number;
  /** Name to announce, or null when not in a transition. */
  entering: string | null;
}

// Bands crossfade over their last stretch rather than snapping, so the sky is always
// changing slightly — that slow drift is most of what makes an ascent feel long.
export function skyAt(altitudeM: number): SkyState {
  let i = 0;
  for (let k = 0; k < BANDS.length; k++) {
    if (altitudeM >= BANDS[k].fromM) i = k;
  }
  const band = BANDS[i];
  const next = BANDS[Math.min(i + 1, BANDS.length - 1)];
  const span = next.fromM - band.fromM;
  const through = span > 0 ? (altitudeM - band.fromM) / span : 0;
  // Blend across the final 35% of a band
  const blend = span > 0 ? Math.max(0, (through - 0.65) / 0.35) : 0;

  return {
    band,
    next,
    blend,
    skyTop: mix(band.skyTop, next.skyTop, blend),
    skyBottom: mix(band.skyBottom, next.skyBottom, blend),
    far: mix(band.far, next.far, blend),
    near: mix(band.near, next.near, blend),
    light: mix(band.light, next.light, blend),
    stars: band.stars * (1 - blend) + next.stars * blend,
    entering: blend > 0.5 ? next.name : null,
  };
}
