"use client";

import { useEffect, useSyncExternalStore } from "react";

import {
  DEFAULTS,
  getSettings,
  initSettings,
  Settings,
  subscribeSettings,
} from "@/game/v3/settings";

// Same shape as useLocale: defaults on both sides of hydration, the saved values applied
// in an effect. Reading localStorage during the first render would give the server and
// the client different trees.
export function useSettings(): Settings {
  const settings = useSyncExternalStore(
    subscribeSettings,
    getSettings,
    () => DEFAULTS
  );

  useEffect(() => {
    initSettings();
  }, []);

  return settings;
}
