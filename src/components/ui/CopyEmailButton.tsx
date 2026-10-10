"use client";

import { copyEmail } from "@/lib/clipboard";
import { MarkupIcon } from "./Icon";

export function CopyEmailButton({ variant = "mini" }: { variant?: "mini" | "icon" }) {
  return (
    <button
      type="button"
      className={variant === "mini" ? "mini-btn" : "icon-btn"}
      aria-label="Copy email address"
      onClick={(e) => copyEmail(e.currentTarget)}
    >
      <MarkupIcon name={variant === "mini" ? "copy" : "mail"} />
    </button>
  );
}
