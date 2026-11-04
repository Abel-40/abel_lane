// Session helpers: assurance level, auto-lock bookkeeping and signing out.
// Only timestamps and the lock length are kept in localStorage, never data.

import { supabase } from "./supabase";

const LAST_ACTIVE = "mezgeb:last-active";
const LOCK_MINUTES = "mezgeb:lock-minutes";
export const DEFAULT_LOCK_MINUTES = 5;

function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* private mode: auto-lock still works in memory */
  }
}

export function lockMinutes(): number {
  const v = Number(read(LOCK_MINUTES));
  return Number.isInteger(v) && v >= 1 && v <= 120 ? v : DEFAULT_LOCK_MINUTES;
}

export function rememberLockMinutes(minutes: number) {
  write(LOCK_MINUTES, String(minutes));
}

export function markActive(now = Date.now()) {
  write(LAST_ACTIVE, String(now));
}

/** True when the last recorded activity is older than the lock length. */
export function lockExpired(now = Date.now()): boolean {
  const last = Number(read(LAST_ACTIVE));
  if (!last) return false;
  return now - last > lockMinutes() * 60_000;
}

export async function currentAal(): Promise<{ current: string | null; next: string | null }> {
  const { data, error } = await supabase().auth.mfa.getAuthenticatorAssuranceLevel();
  if (error) return { current: null, next: null };
  return { current: data.currentLevel, next: data.nextLevel };
}

/** Signs out on this device and reloads the login screen (clears everything in memory). */
export async function lockNow(reason: "locked" | "signed_out" = "locked") {
  try {
    await supabase().auth.signOut({ scope: "local" });
  } finally {
    try {
      window.sessionStorage.setItem("mezgeb:login-reason", reason);
    } catch {
      /* ignore */
    }
    window.location.replace("/mezgeb/login");
  }
}

/** Ends every session of this user on every device. */
export async function signOutEverywhere() {
  try {
    await supabase().auth.signOut({ scope: "global" });
  } finally {
    try {
      window.sessionStorage.setItem("mezgeb:login-reason", "signed_out");
    } catch {
      /* ignore */
    }
    window.location.replace("/mezgeb/login");
  }
}

/** One-shot message for the login screen ("Locked after 5 minutes"…). */
export function takeLoginReason(): string | null {
  try {
    const r = window.sessionStorage.getItem("mezgeb:login-reason");
    window.sessionStorage.removeItem("mezgeb:login-reason");
    return r;
  } catch {
    return null;
  }
}
