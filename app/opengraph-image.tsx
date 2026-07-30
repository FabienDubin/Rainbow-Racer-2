import { ImageResponse } from "next/og";

// The share card. This exists because openGraph pointed at /icon.svg, and LinkedIn, Slack and
// iMessage all refuse SVG — the link would have previewed with no image at all, which for a
// game you are sharing to be compared against your first one is the whole point of sharing.
// Generated as PNG at request time and cached by Vercel.

export const alt =
  "Rainbow Racer — L'Ascension : accroche ton arc-en-ciel aux prismes et grimpe avant l'orage";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const SPECTRUM = ["#ff4d6d", "#ffb703", "#5fe28a", "#3fa9ff", "#a56bff"];

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 84px",
          background: "linear-gradient(160deg, #2b2260 0%, #14102c 52%, #08060f 100%)",
          position: "relative",
        }}
      >
        {/* The bow, sweeping across behind the type — the game's own signature */}
        <div
          style={{
            // Swung low and right so it sweeps UNDER the headline instead of through it
            position: "absolute",
            bottom: -170,
            left: 150,
            width: 1500,
            height: 900,
            display: "flex",
          }}
        >
          <svg width="1500" height="900" viewBox="0 0 1500 900">
            {SPECTRUM.map((c, i) => (
              <path
                key={c}
                d={`M60 ${820 + i * 26} Q750 ${180 + i * 26} 1440 ${820 + i * 26}`}
                fill="none"
                stroke={c}
                strokeWidth="18"
                strokeLinecap="round"
                opacity={0.78}
              />
            ))}
          </svg>
        </div>

        {/* Scrim: lets the bow stay bright while the headline keeps full contrast */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: 740,
            height: 630,
            background:
              "linear-gradient(to right, rgba(9,7,18,0.94) 0%, rgba(9,7,18,0.86) 52%, rgba(9,7,18,0) 100%)",
            display: "flex",
          }}
        />

        {/* Storm mass along the bottom edge: the thing that is chasing you */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            width: 1200,
            height: 150,
            background: "linear-gradient(to bottom, rgba(26,30,60,0) 0%, #0b0a1c 78%)",
            display: "flex",
          }}
        />

        <div style={{ display: "flex", alignItems: "center", gap: 26 }}>
          <svg width="86" height="86" viewBox="0 0 64 64">
            <path
              d="M11 50 Q32 12 53 50"
              fill="none"
              stroke="#ffb703"
              strokeWidth="9"
              strokeLinecap="round"
            />
            <path d="M26.5 32 L32 6 L37.5 32 Z" fill="#ffe9a8" />
          </svg>
          <div
            style={{
              fontSize: 30,
              letterSpacing: 8,
              color: "rgba(255,255,255,0.62)",
              display: "flex",
            }}
          >
            JEU GRATUIT DANS LE NAVIGATEUR
          </div>
        </div>

        <div
          style={{
            fontSize: 104,
            fontWeight: 800,
            color: "#ffffff",
            lineHeight: 1.04,
            marginTop: 26,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ display: "flex" }}>RAINBOW RACER</div>
          <div style={{ display: "flex", color: "#ffd166" }}>L&apos;ASCENSION</div>
        </div>

        <div
          style={{
            fontSize: 38,
            color: "rgba(255,255,255,0.82)",
            marginTop: 30,
            display: "flex",
          }}
        >
          Accroche-toi, balance-toi, lâche au bon moment.
        </div>

        <div
          style={{
            fontSize: 30,
            color: "rgba(255,255,255,0.5)",
            marginTop: 46,
            display: "flex",
          }}
        >
          rainbow-racer.themarcelle.com
        </div>
      </div>
    ),
    size
  );
}
