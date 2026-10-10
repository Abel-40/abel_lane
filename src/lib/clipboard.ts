"use client";

import { site } from "@/content/site";
import { toast } from "./ui-store";

function selectText(el: Element) {
  try {
    const r = document.createRange();
    r.selectNodeContents(el);
    const s = window.getSelection();
    s?.removeAllRanges();
    s?.addRange(r);
  } catch {
    /* selection is best effort */
  }
}

/** Copy the email address; falls back to selecting the visible address next to the button. */
export function copyEmail(button?: Element | null) {
  const near = button?.parentElement?.querySelector(".email-text") ?? null;
  const fallback = () => {
    if (near) selectText(near);
    toast(near ? "Email selected. Press Ctrl+C to copy it." : `Email: ${site.email}`);
  };
  try {
    navigator.clipboard.writeText(site.email).then(() => toast(`Email copied: ${site.email}`), fallback);
  } catch {
    fallback();
  }
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export { selectText };
