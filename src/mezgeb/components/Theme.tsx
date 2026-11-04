"use client";

import { useEffect, useSyncExternalStore } from "react";
import { applyTheme, readThemePref, resolveTheme, saveThemePref, type Theme, type ThemePref } from "../lib/theme";
import { MoonIcon, SunIcon } from "./Icons";
import { Tabs } from "./ui";

function subscribe(onChange: () => void) {
  const mql = window.matchMedia("(prefers-color-scheme: light)");
  window.addEventListener("mezgeb-theme", onChange);
  window.addEventListener("storage", onChange);
  mql.addEventListener("change", onChange);
  return () => {
    window.removeEventListener("mezgeb-theme", onChange);
    window.removeEventListener("storage", onChange);
    mql.removeEventListener("change", onChange);
  };
}

const snapshot = () => {
  const pref = readThemePref();
  return `${pref}|${resolveTheme(pref)}`;
};

/** The saved preference and the theme it resolves to right now (system follows the phone). */
export function useTheme(): { pref: ThemePref; theme: Theme } {
  const value = useSyncExternalStore(subscribe, snapshot, () => "dark|dark");
  const [pref, theme] = value.split("|") as [ThemePref, Theme];
  return { pref, theme };
}

/** Keeps the page and the browser bar colour in step with the preference (and the phone, for "system"). */
export function ThemeSync() {
  const { theme } = useTheme();
  useEffect(() => applyTheme(theme), [theme]);
  return null;
}

/** Sun / moon button: switches between light and dark. */
export function ThemeToggleButton() {
  const { theme } = useTheme();
  const next: Theme = theme === "dark" ? "light" : "dark";
  return (
    <button type="button" className="mz-icon-btn" aria-label={`Switch to ${next} mode`} onClick={() => saveThemePref(next)}>
      {theme === "dark" ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}

/** Dark / Light / System choice for Settings. */
export function ThemeChoice() {
  const { pref } = useTheme();
  return (
    <Tabs
      label="Appearance"
      value={pref}
      onChange={(v) => saveThemePref(v)}
      options={[
        { value: "dark", label: "Dark" },
        { value: "light", label: "Light" },
        { value: "system", label: "System" },
      ]}
    />
  );
}
