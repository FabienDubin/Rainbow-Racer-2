import { ImageResponse } from "next/og";

// The share card. Two constraints, and the second is why this file looks the way it does.
//
// First: it must be a PNG. openGraph.images used to point at /icon.svg, and LinkedIn, Slack and
// iMessage all refuse SVG — the link would have previewed with no image at all, on the one post
// whose purpose is showing this game next to the 2024 one.
//
// Second: it must look like the GAME. The first version was a dark gradient with 100px caps over
// a stray rainbow, and Fab called it: "ça ressemble trop à un truc d'IA, on attend un truc
// mignon". He is right — big type on a dark gradient is the house style of every soulless SaaS
// landing page, and this is a pastel game about a kid in a unicorn costume. So the card IS the
// game's opening scene, drawn with the real palette from game/v3/art/palette.ts (Aube des
// Prairies) and the real SPECTRUM, with the type kept small and out of the way.

export const alt =
  "Rainbow Racer — L'Ascension : accroche ton arc-en-ciel aux prismes et grimpe avant l'orage";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Straight from the game's own palette: the first band, the pastel dawn
const SKY_TOP = "#8fb6e8";
const SKY_BOTTOM = "#ffd9a8";
const HILL_FAR = "#b98fa8";
const HILL_NEAR = "#7d5f80";
const SPECTRUM = ["#ff5f6d", "#ff9e5e", "#ffd166", "#7ed957", "#4bc0ff", "#8b5cf6"];

const DUST: [number, number, number][] = [
  [120, 300, 15], [232, 190, 11], [318, 402, 13], [156, 486, 9],
  [402, 268, 12], [560, 150, 10], [742, 214, 13], [880, 330, 11],
  [1010, 188, 14], [1092, 400, 10], [640, 452, 12], [470, 130, 9],
];

const ANCHORS: [number, number][] = [[760, 300], [852, 232], [944, 168], [1036, 104]];

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          background: `linear-gradient(to bottom, ${SKY_TOP} 0%, #bcc9e0 46%, ${SKY_BOTTOM} 100%)`,
        }}
      >
        {/* One SVG for the scene: Satori composes flexbox, but a landscape wants real geometry,
            and a single <svg> is far more legible than forty positioned divs. */}
        <svg width="1200" height="630" viewBox="0 0 1200 630">
          <defs>
            <linearGradient id="tether" x1="0" y1="1" x2="1" y2="0">
              {SPECTRUM.map((c, i) => (
                <stop key={c} offset={i / (SPECTRUM.length - 1)} stopColor={c} />
              ))}
            </linearGradient>
          </defs>

          {/* The palier bow: the reward line you cross, bowed as it is in the game */}
          {SPECTRUM.map((c, i) => (
            <path
              key={`bow-${c}`}
              d={`M-40 ${196 + i * 7} Q600 ${58 + i * 7} 1240 ${196 + i * 7}`}
              fill="none"
              stroke={c}
              strokeWidth="6"
              strokeLinecap="round"
              opacity={0.85}
            />
          ))}

          {DUST.map(([x, y, r]) => (
            <g key={`d-${x}-${y}`}>
              <circle cx={x} cy={y} r={r * 1.9} fill="#ffd166" opacity={0.18} />
              <path
                d={`M${x} ${y - r} L${x + r * 0.72} ${y} L${x} ${y + r} L${x - r * 0.72} ${y} Z`}
                fill="#ffe9a8"
                stroke="#ffb703"
                strokeWidth="2"
              />
            </g>
          ))}

          <path
            d={`M${ANCHORS[0][0]} ${ANCHORS[0][1]} L${ANCHORS[1][0]} ${ANCHORS[1][1]} L${ANCHORS[2][0]} ${ANCHORS[2][1]} L${ANCHORS[3][0]} ${ANCHORS[3][1]}`}
            fill="none"
            stroke="#ffffff"
            strokeWidth="2"
            strokeDasharray="5 9"
            opacity={0.5}
          />
          {ANCHORS.map(([x, y]) => (
            <g key={`a-${x}`}>
              <circle cx={x} cy={y} r="26" fill="none" stroke="#ffb703" strokeWidth="2.5" opacity={0.75} />
              <path d={`M${x} ${y - 13} L${x + 10} ${y} L${x} ${y + 13} L${x - 10} ${y} Z`} fill="#ffcf8f" />
            </g>
          ))}

          {/* The tether, from Prism to the prism she is swinging on: the verb of the game */}
          <path
            d={`M482 292 Q630 276 ${ANCHORS[0][0]} ${ANCHORS[0][1]}`}
            fill="none"
            stroke="url(#tether)"
            strokeWidth="11"
            strokeLinecap="round"
          />

          {/* PRISM — the kid in the unicorn onesie: one wing, tutu, hood with horn, ribbons */}
          <g transform="translate(452 366) scale(2.05) rotate(-16)">
            {SPECTRUM.map((c, i) => (
              <path
                key={`r-${c}`}
                d={`M-13 ${2 + i * 3.6} Q-44 ${(i % 2 ? 7 : -3) + i * 3.6} -80 ${1 + i * 3.6}`}
                fill="none"
                stroke={c}
                strokeWidth="3.2"
                strokeLinecap="round"
                opacity={0.92}
              />
            ))}
            <path d="M-6 -6 Q-52 -68 -6 -54 Q18 -46 6 -4 Z" fill="#ffc2dd" opacity={0.92} />
            <path d="M-6 -6 Q-52 -68 -6 -54 Q18 -46 6 -4 Z" fill="none" stroke="#ff9ecb" strokeWidth="2" />
            <path d="M-16 6 Q0 34 20 8 Q4 22 -16 6 Z" fill="#ff9ecb" />
            <path d="M-13 2 Q0 26 17 4 Q2 16 -13 2 Z" fill="#ffc2dd" />
            <path d="M-8 -12 L10 -14 L14 6 L-12 8 Z" fill="#ffffff" />
            <path d="M2 8 L6 26" stroke="#ffe3ef" strokeWidth="6" strokeLinecap="round" />
            <path d="M-6 8 L-8 26" stroke="#ffe3ef" strokeWidth="6" strokeLinecap="round" />
            <circle cx="14" cy="-22" r="17" fill="#ffffff" />
            <circle cx="19" cy="-19" r="10" fill="#f6c9a0" />
            <path d="M20 -38 L27 -60 L14 -40 Z" fill="#ffd166" />
            <circle cx="23" cy="-20" r="2" fill="#3b2a2a" />
            <path d="M4 -30 Q-4 -18 2 -8" fill="none" stroke="#c99a5e" strokeWidth="5" strokeLinecap="round" />
          </g>

          {/* Hills, back to front, in the band's own silhouette colours */}
          <path d="M0 470 Q220 424 430 466 Q700 512 940 452 Q1090 418 1200 448 L1200 630 L0 630 Z" fill={HILL_FAR} opacity={0.85} />
          <path d="M0 534 Q260 486 520 528 Q790 570 1010 516 Q1120 490 1200 512 L1200 630 L0 630 Z" fill={HILL_NEAR} />

          {/* Le Grondement biting at the bottom edge: one contour, filled once */}
          <path
            d="M0 630 L0 596 Q70 552 148 592 Q214 540 300 586 Q372 546 448 590 Q520 548 600 588 Q676 546 754 590 Q826 550 904 588 Q980 548 1058 590 Q1128 556 1200 594 L1200 630 Z"
            fill="#1a1e3c"
          />
          <path
            d="M0 596 Q70 552 148 592 Q214 540 300 586 Q372 546 448 590 Q520 548 600 588 Q676 546 754 590 Q826 550 904 588 Q980 548 1058 590 Q1128 556 1200 594"
            fill="none"
            stroke="#cfd8ff"
            strokeWidth="2.5"
            opacity={0.7}
          />
        </svg>

        {/* Type: a caption on a picture, not a headline on a slide. A soft plate keeps it
            readable over the pastel sky without dimming the scene. */}
        <div
          style={{
            position: "absolute",
            left: 56,
            top: 44,
            display: "flex",
            flexDirection: "column",
            padding: "26px 34px",
            borderRadius: 22,
            background: "rgba(24,18,46,0.48)",
          }}
        >
          <div style={{ display: "flex", fontSize: 52, fontWeight: 800, color: "#ffffff", lineHeight: 1.1 }}>
            Rainbow Racer
          </div>
          <div style={{ display: "flex", fontSize: 40, fontWeight: 700, color: "#ffd166", lineHeight: 1.2 }}>
            L&apos;Ascension
          </div>
          <div style={{ display: "flex", fontSize: 25, color: "rgba(255,255,255,0.88)", marginTop: 14 }}>
            Accroche-toi, balance-toi, lâche au bon moment.
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            right: 44,
            bottom: 30,
            display: "flex",
            fontSize: 23,
            color: "rgba(255,255,255,0.72)",
          }}
        >
          rainbow-racer.themarcelle.com
        </div>
      </div>
    ),
    size
  );
}
