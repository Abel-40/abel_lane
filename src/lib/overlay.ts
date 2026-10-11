"use client";

/* The element a project overlay expands from (and collapses back to): the clicked card. */

let source: HTMLElement | null = null;

export function setOverlaySource(el: HTMLElement | null) {
  source = el;
}

export function takeOverlaySource(): HTMLElement | null {
  return source;
}
