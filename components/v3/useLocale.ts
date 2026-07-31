"use client";

import { useEffect, useSyncExternalStore } from "react";

import {
  getLocale,
  Locale,
  preferredLocale,
  setLocale,
  subscribeLocale,
} from "@/game/v3/i18n";

// Subscribes a component to the language, and applies the saved one on mount.
//
// The saved language is deliberately NOT read during the first render: the server
// renders French, so reading localStorage synchronously would hand React a different
// tree on the client and blow up hydration. Instead the store starts on French, the
// effect switches it, and every subscriber re-renders one frame later — invisible in
// practice, and correct.
export function useLocale(): Locale {
  const locale = useSyncExternalStore(
    subscribeLocale,
    getLocale,
    () => "fr" as Locale
  );

  useEffect(() => {
    setLocale(preferredLocale());
  }, []);

  return locale;
}
