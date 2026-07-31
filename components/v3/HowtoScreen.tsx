"use client";

// The first thing a new player sees, before their first run starts.
//
// The whole game is one gesture, and a player who does not know that spends their first
// run tapping — which is the single strategy the game punishes hardest. So this is shown
// once, before the world starts moving, and it says exactly three things: press, hold,
// let go. Everything else is learnable by playing.
//
// It names the right input for the device it is being read on. Telling someone holding a
// phone to "press the space bar" is the fastest way to be closed.

import { useEffect, useState } from "react";

import { audio } from "@/game/v3/audio";
import { t } from "@/game/v3/i18n";

/** A thumb pressing, holding and lifting, on a loop. The instruction, made visible. */
function ThumbLoop() {
  return (
    <svg className="proto-howto-art" viewBox="0 0 120 120" aria-hidden>
      {/* The ripple under the press */}
      <circle className="proto-howto-ring" cx="60" cy="48" r="16" />
      <circle className="proto-howto-ring proto-howto-ring--late" cx="60" cy="48" r="16" />
      <g className="proto-howto-thumb">
        {/* Fist */}
        <rect x="40" y="62" width="42" height="40" rx="14" />
        {/* Thumb, standing up */}
        <rect x="52" y="30" width="19" height="42" rx="9.5" />
      </g>
    </svg>
  );
}

/** The same beat, drawn as a space bar going down and up. */
function SpaceLoop() {
  return (
    <svg className="proto-howto-art" viewBox="0 0 120 120" aria-hidden>
      <circle className="proto-howto-ring" cx="60" cy="60" r="30" />
      <g className="proto-howto-thumb">
        <rect x="20" y="48" width="80" height="26" rx="7" />
        <rect className="proto-howto-keycap" x="24" y="52" width="72" height="18" rx="5" />
      </g>
    </svg>
  );
}

export default function HowtoScreen({ onStart }: { onStart: () => void }) {
  // Resolved after mount: the server has no idea what is holding the page, and guessing
  // during render would mean a hydration mismatch on every phone.
  const [touch, setTouch] = useState(true);

  useEffect(() => {
    setTouch(window.matchMedia("(hover: none) and (pointer: coarse)").matches);
  }, []);

  // Any key or tap starts, not just the button — the lesson IS the gesture, so let them
  // perform it right here.
  useEffect(() => {
    const go = () => onStart();
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "Enter") {
        e.preventDefault();
        go();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onStart]);

  return (
    <section className="proto-sec proto-howto">
      <h2 className="proto-draw-title">{t("howto.title")}</h2>

      {touch ? <ThumbLoop /> : <SpaceLoop />}

      <ol className="proto-howto-steps">
        <li>
          <b>1</b> {t(touch ? "howto.press.touch" : "howto.press.key")}
        </li>
        <li>
          <b>2</b> {t("howto.hold")}
        </li>
        <li>
          <b>3</b> {t(touch ? "howto.release.touch" : "howto.release.key")}
        </li>
      </ol>

      <p className="proto-howto-note">{t("howto.aim")}</p>
      <p className="proto-howto-note proto-howto-note--warn">{t("howto.storm")}</p>

      <button
        className="proto-btn"
        onPointerEnter={() => audio.uiHover()}
        onPointerDown={() => audio.uiClick()}
        onClick={onStart}
      >
        {t("howto.go")}
      </button>
    </section>
  );
}
