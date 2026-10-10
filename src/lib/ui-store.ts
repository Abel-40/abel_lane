"use client";

import { useSyncExternalStore } from "react";

/* Tiny shared UI state for chrome that lives outside any one page (nav, menu, overlay, toast). */

export interface UIState {
  menuOpen: boolean;
  /** Close the menu without its clip animation (route change). */
  menuInstant?: boolean;
  /** True while a pinned section (the request journey) wants the nav out of the way. */
  navForceHide: boolean;
  overlayOpen: boolean;
  toast: { id: number; text: string } | null;
}

const initial: UIState = { menuOpen: false, navForceHide: false, overlayOpen: false, toast: null };
let state: UIState = initial;
const listeners = new Set<() => void>();

export const uiStore = {
  get: () => state,
  set(patch: Partial<UIState>) {
    state = { ...state, ...patch };
    listeners.forEach((l) => l());
  },
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

export function useUI<T>(select: (s: UIState) => T): T {
  return useSyncExternalStore(
    uiStore.subscribe,
    () => select(uiStore.get()),
    () => select(initial),
  );
}

let toastId = 0;
export function toast(text: string) {
  uiStore.set({ toast: { id: ++toastId, text } });
}
