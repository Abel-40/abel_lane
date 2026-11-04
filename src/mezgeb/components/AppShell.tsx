"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { currentAal, lockExpired, lockMinutes, lockNow } from "../lib/session";
import { DataProvider, useMz } from "../lib/store";
import { isConfigured, supabase } from "../lib/supabase";
import { BottomNav } from "./BottomNav";
import { PrivacyProvider, ToastProvider } from "./ui";
import { VerdictProvider } from "./Verdict";
import { useAutoLock } from "./useAutoLock";

const NAV_PAGES = ["/mezgeb", "/mezgeb/accounts", "/mezgeb/trading", "/mezgeb/plan", "/mezgeb/transactions"];

/**
 * Wraps every Mezgeb page except login: requires a session at aal2
 * (password + authenticator code), otherwise goes to the login screen.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const [state, setState] = useState<"checking" | "ready" | "unconfigured">("checking");
  const path = (usePathname() ?? "").replace(/\/$/, "");

  useEffect(() => {
    if (!isConfigured()) {
      setState("unconfigured");
      return;
    }
    const sb = supabase();
    let cancelled = false;
    (async () => {
      const { data } = await sb.auth.getSession();
      if (!data.session || lockExpired()) return lockNow(data.session ? "locked" : "signed_out");
      const aal = await currentAal();
      if (aal.current !== "aal2") return window.location.replace("/mezgeb/login");
      if (!cancelled) setState("ready");
    })();
    const { data: sub } = sb.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || (event !== "INITIAL_SESSION" && !session)) window.location.replace("/mezgeb/login");
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  useAutoLock(state === "ready", lockMinutes());

  if (state === "unconfigured") {
    return (
      <main className="mz-center">
        <p className="mz-title mz-title--sm">Mezgeb is not configured</p>
        <p className="mz-muted" style={{ maxWidth: 320 }}>
          Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to the build environment, then deploy again.
        </p>
      </main>
    );
  }
  if (state === "checking") {
    return (
      <main className="mz-center" aria-busy="true">
        <span className="mz-spinner" aria-hidden="true" />
        <span className="mz-sr-only">Checking your session</span>
      </main>
    );
  }
  return (
    <ToastProvider>
      <DataProvider>
        <Privacy>
          <VerdictProvider>
            <div className="mz-app">
              {children}
              {NAV_PAGES.includes(path) && <BottomNav />}
            </div>
          </VerdictProvider>
        </Privacy>
      </DataProvider>
    </ToastProvider>
  );
}

function Privacy({ children }: { children: ReactNode }) {
  const { data } = useMz();
  return <PrivacyProvider hideAll={Boolean(data?.settings?.hide_balances)}>{children}</PrivacyProvider>;
}
