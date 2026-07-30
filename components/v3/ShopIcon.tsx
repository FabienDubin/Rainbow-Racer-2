// Shop icons, drawn by hand as SVG rather than shipped as images: they stay crisp at any
// size, weigh nothing, and inherit the surrounding colour so one stroke width change
// restyles the whole set. Each is built from the same vocabulary as the game's art —
// faceted prisms, spectrum arcs, wing curves — so the shop looks like the same world.

const SPECTRUM = ["#ff5f6d", "#ffd166", "#7ed957", "#4bc0ff", "#8b5cf6"];

function Wings() {
  return (
    <>
      <path
        d="M12 15c-4-1-7-4-8-8 4 0 8 2 10 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M12 15c4-1 7-4 8-8-4 0-8 2-10 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path d="M12 13v8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </>
  );
}

function Rope() {
  return (
    <>
      {SPECTRUM.map((c, i) => (
        <path
          key={c}
          d={`M3 ${19 - i * 1.4}Q12 ${5 - i * 1.4} 21 ${19 - i * 1.4}`}
          fill="none"
          stroke={c}
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      ))}
    </>
  );
}

function Boost() {
  return (
    <>
      <path
        d="M12 3l4 7h-3l2 5h-3l1 6-6-9h3L8 7h3z"
        fill="currentColor"
        opacity="0.9"
      />
      <path d="M5 21h14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity="0.5" />
    </>
  );
}

function Talisman() {
  return (
    <>
      <path
        d="M12 3l7 3v6c0 4-3 7.5-7 9-4-1.5-7-5-7-9V6z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path d="M12 8l2.6 3L12 14l-2.6-3z" fill="currentColor" />
    </>
  );
}

function Magnet() {
  return (
    <>
      <path
        d="M7 4v8a5 5 0 0010 0V4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path d="M4 4h6M14 4h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="12" cy="20" r="1.6" fill="#ffd166" />
    </>
  );
}

function StormMode() {
  return (
    <>
      <path
        d="M4 12c1-3 4-4 6-3 1-3 5-3 6 0 3-1 5 1 4 4z"
        fill="currentColor"
        opacity="0.75"
      />
      <path d="M11 13l-2 5h3l-1 4 4-6h-3l1-3z" fill="#ffd166" />
    </>
  );
}

function CalmMode() {
  return (
    <>
      <path
        d="M3 14c2-4 6-5 8-3 2-3 7-2 7 2 2 0 3 2 2 4H3z"
        fill="currentColor"
        opacity="0.55"
      />
      <circle cx="17" cy="6" r="3" fill="none" stroke="#ffd166" strokeWidth="1.5" />
    </>
  );
}

function PureMode() {
  return (
    <>
      <path
        d="M12 21c-3-4-6-7-6-11a6 6 0 0112 0c0 4-3 7-6 11z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path d="M12 6l3 4-3 4-3-4z" fill="#8b5cf6" />
    </>
  );
}

function Dust() {
  return (
    <>
      <path d="M12 4l1.6 5.2L19 11l-5.4 1.8L12 18l-1.6-5.2L5 11l5.4-1.8z" fill="#ffd166" />
      <circle cx="18.5" cy="6" r="1.1" fill="#ffe9a8" />
      <circle cx="6" cy="17" r="0.9" fill="#ffe9a8" />
    </>
  );
}

const ICONS: Record<string, () => React.JSX.Element> = {
  wings: Wings,
  rope: Rope,
  boost: Boost,
  talisman: Talisman,
  magnet: Magnet,
  mode_storm: StormMode,
  mode_calm: CalmMode,
  mode_pure: PureMode,
  dust: Dust,
};

export default function ShopIcon({ id, size = 22 }: { id: string; size?: number }) {
  const Glyph = ICONS[id];
  if (!Glyph) return null;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      style={{ flex: "0 0 auto", display: "block" }}
    >
      <Glyph />
    </svg>
  );
}
