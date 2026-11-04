"use client";

import { useEffect, useRef, useState } from "react";
import { buildBackup, downloadJson, importPayload, planImport, validateBackup, type Backup, type ImportPlan } from "../lib/backup";
import { daysBetween, todayISO } from "../lib/dates";
import { rpc, updateRow } from "../lib/db";
import { useMz } from "../lib/store";
import { friendlyError } from "../lib/supabase";
import { ErrorLine, Sheet, useToast } from "./ui";

const TABLE_LABEL: Record<string, string> = {
  settings: "Settings",
  institutions: "Banks and wallets",
  accounts: "Accounts",
  categories: "Categories",
  debts: "Debts",
  goals: "Goals",
  cities: "Cities",
  trade_items: "Trade items",
  trips: "Trips",
  transactions: "Entries",
  payday_rules: "Payday rules",
  paydays: "Paydays",
  payday_allocations: "Payday splits",
  price_logs: "Price logs",
  trip_lines: "Trip goods",
  trip_costs: "Trip costs",
  wishes: "Wishes",
  fx_rates: "Exchange rates",
};

export function BackupSection() {
  const { data, reload } = useMz();
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<{ backup: Backup; plan: ImportPlan } | null>(null);
  const s = data?.settings;

  async function exportNow() {
    if (!s) return;
    setBusy(true);
    setError(null);
    try {
      const backup = await buildBackup();
      downloadJson(`mezgeb-backup-${todayISO()}.json`, backup);
      await updateRow("settings", s.id, { last_backup_at: new Date().toISOString() });
      await reload();
      toast("Backup downloaded. Keep it somewhere safe.");
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setBusy(false);
    }
  }

  async function chooseFile(file: File) {
    setError(null);
    setBusy(true);
    try {
      let parsed: unknown;
      try {
        parsed = JSON.parse(await file.text());
      } catch {
        throw new Error("This file is not valid JSON.");
      }
      const problem = validateBackup(parsed);
      if (problem) throw new Error(problem);
      const backup = parsed as Backup;
      setPending({ backup, plan: await planImport(backup) });
    } catch (e) {
      setError(e instanceof Error ? e.message : friendlyError(e));
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function confirmImport() {
    if (!pending) return;
    setBusy(true);
    try {
      await rpc("mz_import", { p: importPayload(pending.backup), p_require_empty: false });
      await reload();
      setPending(null);
      toast("Backup imported.");
    } catch (e) {
      setError(friendlyError(e));
      setPending(null);
    } finally {
      setBusy(false);
    }
  }

  const last = s?.last_backup_at ? daysBetween(s.last_backup_at.slice(0, 10), todayISO()) : null;
  return (
    <>
      <span className="mz-section-label" id="data">
        Your data
      </span>
      <div className="mz-grid-2" style={{ gap: 8 }}>
        <button type="button" className="mz-btn mz-btn--md mz-btn--secondary" onClick={exportNow} disabled={busy}>
          Export backup
        </button>
        <button type="button" className="mz-btn mz-btn--md mz-btn--secondary" onClick={() => fileRef.current?.click()} disabled={busy}>
          Import backup
        </button>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        className="mz-sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void chooseFile(f);
        }}
      />
      <ErrorLine text={error} />
      <p className={`mz-note${last === null || last >= 30 ? " mz-warn" : ""}`}>
        {last === null ? "No backup yet." : last === 0 ? "Last backup: today." : `Last backup: ${last} ${last === 1 ? "day" : "days"} ago.`} The free database pauses after a
        week without use, so open the app at least weekly and export a backup monthly.
      </p>

      <Sheet open={pending !== null} title="Import this backup?" onClose={() => setPending(null)}>
        {pending && (
          <div className="mz-stack" style={{ gap: 14 }}>
            <p className="mz-muted" style={{ fontSize: 14, lineHeight: 1.5 }}>
              From {pending.backup.exported_at.slice(0, 16).replace("T", " ")}. Rows with the same id are replaced by the backup&apos;s version; nothing is
              deleted.
            </p>
            <div className="mz-list mz-list--16">
              {pending.plan.map((p) => (
                <div key={p.table} className="mz-check-row" style={{ borderBottom: "1px solid var(--mz-border)" }}>
                  <span>{TABLE_LABEL[p.table] ?? p.table}</span>
                  <span className="mz-small mz-muted mz-num">
                    {p.added > 0 && `${p.added} new`}
                    {p.added > 0 && p.updated > 0 && " · "}
                    {p.updated > 0 && `${p.updated} replaced`}
                  </span>
                </div>
              ))}
            </div>
            <div className="mz-grid-2">
              <button type="button" className="mz-btn mz-btn--md mz-btn--dark" onClick={() => setPending(null)} disabled={busy}>
                Cancel
              </button>
              <button type="button" className="mz-btn mz-btn--md" onClick={confirmImport} disabled={busy}>
                {busy ? "Importing…" : "Import"}
              </button>
            </div>
          </div>
        )}
      </Sheet>
    </>
  );
}

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

/** "Install app" when the browser offers it; nothing when already installed. */
export function InstallHint() {
  const [event, setEvent] = useState<InstallEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    setInstalled(window.matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone === true);
    setIos(/iphone|ipad|ipod/i.test(navigator.userAgent));
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setEvent(e as InstallEvent);
    };
    const onInstalled = () => setInstalled(true);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed) return null;
  if (event) {
    return (
      <button
        type="button"
        className="mz-btn mz-btn--md"
        onClick={async () => {
          await event.prompt();
          await event.userChoice;
          setEvent(null);
        }}
      >
        Install app
      </button>
    );
  }
  if (ios) return <p className="mz-note">To install: Share › Add to Home Screen.</p>;
  return null;
}
