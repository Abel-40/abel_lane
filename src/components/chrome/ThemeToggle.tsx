"use client";

import { useSyncExternalStore } from "react";

/* System / light / dark, persisted in localStorage and applied before paint by the inline script in
   layout.tsx (no flash). "system" removes [data-theme] so tokens.css follows prefers-color-scheme. */

export const THEME_KEY = "abel-theme";
type Theme = "system" | "light" | "dark";
const ORDER: Theme[] = ["system", "light", "dark"];
const LABEL: Record<Theme, string> = { system: "System", light: "Light", dark: "Dark" };

const listeners = new Set<() => void>();
function read(): Theme {
  const t = document.documentElement.getAttribute("data-theme");
  return t === "light" || t === "dark" ? t : "system";
}
function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}
function setTheme(t: Theme) {
  const html = document.documentElement;
  if (t === "system") html.removeAttribute("data-theme");
  else html.setAttribute("data-theme", t);
  try {
    if (t === "system") localStorage.removeItem(THEME_KEY);
    else localStorage.setItem(THEME_KEY, t);
  } catch {
    /* storage unavailable: the choice lasts for this page view */
  }
  listeners.forEach((l) => l());
}

const ICONS: Record<Theme, string> = {
  system: '<circle cx="12" cy="12" r="8"/><path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor" stroke="none"/>',
  light:
    '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/>',
  dark: '<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>',
};

export function ThemeToggle({ variant = "nav" }: { variant?: "nav" | "menu" }) {
  const theme = useSyncExternalStore(subscribe, read, () => "system" as Theme);
  const next = ORDER[(ORDER.indexOf(theme) + 1) % ORDER.length];
  const label = `Theme: ${LABEL[theme]}. Switch to ${LABEL[next].toLowerCase()}.`;
  const icon = (
    <svg className="ico" viewBox="0 0 24 24" aria-hidden="true" focusable="false" dangerouslySetInnerHTML={{ __html: ICONS[theme] }} />
  );
  if (variant === "menu") {
    return (
      <button type="button" className="theme-menu" aria-label={label} onClick={() => setTheme(next)} suppressHydrationWarning>
        {icon}
        <span suppressHydrationWarning>Theme: {LABEL[theme]}</span>
      </button>
    );
  }
  return (
    <button type="button" className="theme-btn" aria-label={label} title={label} onClick={() => setTheme(next)} suppressHydrationWarning>
      {icon}
    </button>
  );
}
