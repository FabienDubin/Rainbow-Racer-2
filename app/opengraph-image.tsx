import { ImageResponse } from "next/og";

// The share card: a PNG, because openGraph.images once pointed at /icon.svg and LinkedIn, Slack
// and iMessage all refuse SVG — the link would have previewed with no image at all.
//
// It has been through three directions. Big type on a dark gradient read as a SaaS landing page
// ("ça ressemble trop à un truc d'IA"). Then the full scene with Prism, the prisms and the dust,
// which was busy and, in Fab's words, "vraiment moche". His call, and it is the right one: a
// cover is not a screenshot. Landscape, not character — sky, mountains, storm, and the bow the
// game is named after. Everything drawn from the real values in art/palette.ts.

export const alt =
  "Rainbow Racer — L'Ascension : grimpe de l'aube des prairies jusqu'à la dimension prisme avant que l'orage ne te rattrape";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// The first band, Aube des Prairies, straight from the game's palette
const SKY_TOP = "#8fb6e8";
const SKY_BOTTOM = "#ffd9a8";
const HILL_FAR = "#b98fa8";
const HILL_NEAR = "#7d5f80";
const SPECTRUM = ["#ff5f6d", "#ff9e5e", "#ffd166", "#7ed957", "#4bc0ff", "#8b5cf6"];

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          background: `linear-gradient(to bottom, ${SKY_TOP} 0%, #b9c8e2 44%, ${SKY_BOTTOM} 100%)`,
        }}
      >
        <svg width="1200" height="630" viewBox="0 0 1200 630">
          {/* The bow, high and calm. Softer than the in-game palier: on a cover it is weather,
              not a game element to be read. */}
          {SPECTRUM.map((c, i) => (
            <path
              key={c}
              d={`M-60 ${272 + i * 9} Q600 ${62 + i * 9} 1260 ${272 + i * 9}`}
              fill="none"
              stroke={c}
              strokeWidth="9"
              strokeLinecap="round"
              opacity={0.5}
            />
          ))}

          {/* Three ridges instead of two: depth is what makes a landscape feel like distance */}
          {/* Three ranges. The trap here is regularity: identical summits at identical spacing
              read as a zigzag border, which is the same "trop linéaire" Fab called out on the
              storm. So heights vary a lot, spacing varies, and the ranges are deliberately out
              of phase — no summit sits directly above another. */}
          <path
            d="M0 402 L108 288 Q124 272 142 292 L214 374 L296 232 Q316 212 334 234 L410 352
               L470 302 Q486 288 502 304 L548 342 L664 210 Q686 188 706 212 L806 358 L878 288
               Q896 270 914 290 L968 346 L1084 246 Q1104 226 1122 248 L1200 336 L1200 630 L0 630 Z"
            fill={HILL_FAR}
            opacity={0.38}
          />
          <path
            d="M0 420 L58 372 Q74 358 90 374 L168 442 L242 330 Q262 310 282 332 L360 428
               L436 388 Q452 374 468 390 L512 434 L604 316 Q626 294 646 318 L738 430 L816 366
               Q834 350 852 368 L928 442 L1032 344 Q1052 324 1072 346 L1160 448 L1200 424
               L1200 630 L0 630 Z"
            fill={HILL_FAR}
            opacity={0.86}
          />
          <path
            d="M0 496 L136 412 Q158 396 180 418 L306 504 L438 384 Q462 362 486 386 L622 508
               L720 446 Q740 430 762 450 L860 512 L1004 400 Q1028 378 1052 402 L1180 510
               L1200 500 L1200 630 L0 630 Z"
            fill={HILL_NEAR}
          />

          {/* Le Grondement. Lobe widths run 78-132px and the crests sit at very different
              heights — an even scallop is what made the first version read as a lace border. */}
          <path
            d="M0 630 L0 508 Q40 456 98 492 Q142 418 216 474 Q252 500 296 480 Q346 400 424 466
               Q472 498 516 474 Q564 428 638 470 Q694 502 734 478 Q784 408 864 464 Q912 496 956 472
               Q1014 424 1088 468 Q1134 496 1200 456 L1200 630 Z"
            fill="#1a1e3c"
          />
          <path
            d="M0 508 Q40 456 98 492 Q142 418 216 474 Q252 500 296 480 Q346 400 424 466
               Q472 498 516 474 Q564 428 638 470 Q694 502 734 478 Q784 408 864 464 Q912 496 956 472
               Q1014 424 1088 468 Q1134 496 1200 456"
            fill="none"
            stroke="#cfd8ff"
            strokeWidth="2.5"
            opacity={0.75}
          />
        </svg>

        {/* Type, bottom left, over the storm where it has real contrast and needs no plate —
            the dark slab the old version used was the ugliest thing on it. */}
        <div
          style={{
            position: "absolute",
            left: 64,
            bottom: 46,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 64,
              fontWeight: 800,
              color: "#ffffff",
              lineHeight: 1.05,
            }}
          >
            Rainbow Racer
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 40,
              fontWeight: 700,
              color: "#ffd166",
              lineHeight: 1.3,
            }}
          >
            L&apos;Ascension
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            right: 64,
            bottom: 58,
            display: "flex",
            fontSize: 24,
            color: "rgba(255,255,255,0.78)",
          }}
        >
          rainbow-racer.themarcelle.com
        </div>
      </div>
    ),
    size
  );
}
