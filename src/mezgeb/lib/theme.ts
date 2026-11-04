// Light / dark / system appearance. The choice is a per-device preference, so it lives in localStorage
// (no database row, no network). A tiny inline script in the Mezgeb root layout applies it before first paint.

export type ThemePref = "dark" | "light" | "system";
export type Theme = "dark" | "light";

const KEY = "mezgeb-theme";
const COLORS: Record<Theme, string> = { dark: "#0E1311", light: "#F3F6F2" };

/** Runs before first paint (inlined in the layout). Keep it in sync with resolveTheme/applyTheme. */
export const THEME_BOOT_SCRIPT = `(function(){try{var p=localStorage.getItem("${KEY}");var t=p==="light"?"light":p==="system"&&window.matchMedia("(prefers-color-scheme: light)").matches?"light":"dark";document.documentElement.setAttribute("data-mz-theme",t);}catch(e){document.documentElement.setAttribute("data-mz-theme","dark");}})();`;

export function readThemePref(): ThemePref {
  try {
    const v = localStorage.getItem(KEY);
    return v === "light" || v === "system" ? v : "dark";
  } catch {
    return "dark";
  }
}

export function resolveTheme(pref: ThemePref): Theme {
  if (pref === "system") return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  return pref;
}

export function applyTheme(theme: Theme) {
  document.documentElement.setAttribute("data-mz-theme", theme);
  document.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.setAttribute("content", COLORS[theme]));
}

export function saveThemePref(pref: ThemePref) {
  try {
    localStorage.setItem(KEY, pref);
  } catch {
    /* private mode: still applies for this visit */
  }
  applyTheme(resolveTheme(pref));
  window.dispatchEvent(new CustomEvent("mezgeb-theme", { detail: pref }));
}
