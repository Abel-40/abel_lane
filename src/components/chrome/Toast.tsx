"use client";

import { useEffect, useState } from "react";
import { useUI } from "@/lib/ui-store";

/** Bottom toast (role=status). Each message shows for 2.8s, as in the reference. */
export function Toast() {
  const t = useUI((s) => s.toast);
  const [hiddenId, setHiddenId] = useState<number | null>(null);

  useEffect(() => {
    if (!t) return;
    const id = setTimeout(() => setHiddenId(t.id), 2800);
    return () => clearTimeout(id);
  }, [t]);

  const on = !!t && t.id !== hiddenId;
  return (
    <div className={`toast${on ? " on" : ""}`} role="status" aria-live="polite">
      {t?.text}
    </div>
  );
}
