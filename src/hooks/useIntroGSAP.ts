"use client";

import type { RefObject } from "react";
import { useGSAP } from "@/lib/gsap";
import { whenIdle } from "@/lib/idle";
import { whenIntro } from "@/lib/intro";

export interface IntroHandle {
  /** Play the entrance (`covered`: the loader/shutter hid the page while it mounted) or jump to its end. */
  start(covered: boolean): void;
  cleanup?: () => void;
}

/**
 * Above-the-fold entrances without blocking first paint. Whether the page mounted under a cover is captured
 * at mount; the paused entrance is built after first paint in an idle chunk, while the cover still hides the
 * page, and plays when the cover lifts. Without a cover the content is already painted, so it jumps to its
 * final state. Everything is created inside the component's GSAP context and reverted on unmount.
 */
export function useIntroGSAP(setup: () => IntroHandle | void, opts: { scope: RefObject<Element | null> }) {
  useGSAP((context) => {
    const state: { covered: boolean | null; handle: IntroHandle | null; built: boolean; started: boolean } = {
      covered: null,
      handle: null,
      built: false,
      started: false,
    };
    const maybeStart = () => {
      if (state.started || !state.handle || state.covered === null) return;
      state.started = true;
      state.handle.start(state.covered);
    };
    const build = () => {
      if (state.built || !opts.scope.current) return;
      state.built = true;
      context.add(() => {
        state.handle = setup() ?? null;
      });
      maybeStart();
    };
    let mounting = true;
    const cancelGate = whenIntro((covered) => {
      state.covered = covered;
      // The cover lifted before the idle chunk ran: build now so the entrance still plays from its start.
      if (!mounting) build();
      maybeStart();
    });
    mounting = false;
    const cancelIdle = whenIdle(build);
    return () => {
      cancelIdle();
      cancelGate();
      state.handle?.cleanup?.();
    };
  }, opts);
}
