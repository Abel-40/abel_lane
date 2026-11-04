"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { Sheet } from "./ui";

export type Verdict = {
  tone: "warn" | "praise";
  title: string;
  message: string;
  detail?: string;
};

const VerdictCtx = createContext<(v: Verdict) => void>(() => {});

/** Shows a spending warning or a word of praise in a sheet that survives navigation (it lives in the app shell). */
export function VerdictProvider({ children }: { children: ReactNode }) {
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const show = useCallback((v: Verdict) => setVerdict(v), []);
  return (
    <VerdictCtx.Provider value={show}>
      {children}
      <Sheet open={verdict !== null} title={verdict?.title ?? ""} onClose={() => setVerdict(null)}>
        {verdict && (
          <div className={`mz-verdict mz-verdict--${verdict.tone}`} role={verdict.tone === "warn" ? "alert" : "status"}>
            <blockquote className="mz-verdict__quote">{verdict.message}</blockquote>
            {verdict.detail && <p className="mz-verdict__detail">{verdict.detail}</p>}
            <button type="button" className={`mz-btn ${verdict.tone === "warn" ? "mz-btn--amber" : ""}`} onClick={() => setVerdict(null)}>
              {verdict.tone === "warn" ? "I hear it. I will stop." : "Keep going"}
            </button>
          </div>
        )}
      </Sheet>
    </VerdictCtx.Provider>
  );
}

export function useVerdict() {
  return useContext(VerdictCtx);
}
