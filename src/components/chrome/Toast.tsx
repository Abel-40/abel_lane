"use client";

import { useEffect, useState } from "react";
import { useUI } from "@/lib/ui-store";

/** Bottom toast (role=status). Each message shows for 2.8s, as in the reference. */
export function Toast() {
  const t = useUI((s) => s.toast);
  const [on, setOn] = useState(false);

  useEffect(() => {
    if (!t) return;
    setOn(true);
    const id = setTimeout(() => setOn(false), 2800);
    return () => clearTimeout(id);
  }, [t]);

  return (
    <div className={`toast${on ? " on" : ""}`} role="status" aria-live="polite">
      {t?.text}
    </div>
  );
}
