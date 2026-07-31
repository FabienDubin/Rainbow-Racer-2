"use client";

// The language picker, top-left, as the counterpart to the sound button top-right.
//
// It is a real <select> rather than a custom popover on purpose: this is a phone game
// first, and a native select opens the system picker, which is bigger, scrollable and
// already familiar. The select is then made invisible and stretched over a small round
// button, so it reads as a 34px pendant to the mute control while keeping every native
// behaviour — keyboard, screen reader, and the OS wheel on iOS.

import { audio } from "@/game/v3/audio";
import { isLocale, LOCALE_LABEL, LOCALE_NAME, LOCALES, setLocale, t } from "@/game/v3/i18n";

import { useLocale } from "./useLocale";

export default function LangSwitch() {
  const locale = useLocale();

  return (
    <div className="proto-lang">
      <span className="proto-lang-code" aria-hidden>
        {LOCALE_LABEL[locale]}
      </span>
      <select
        className="proto-lang-select"
        aria-label={t("ui.language")}
        value={locale}
        onPointerEnter={() => audio.uiHover()}
        onChange={(e) => {
          if (!isLocale(e.target.value)) return;
          audio.uiClick();
          setLocale(e.target.value);
        }}
      >
        {LOCALES.map((l) => (
          <option key={l} value={l}>
            {LOCALE_NAME[l]}
          </option>
        ))}
      </select>
    </div>
  );
}
