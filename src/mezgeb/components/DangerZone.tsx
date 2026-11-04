"use client";

import { useState } from "react";
import { buildBackup, downloadJson } from "../lib/backup";
import { todayISO } from "../lib/dates";
import { useMz } from "../lib/store";
import { friendlyError } from "../lib/supabase";
import { WIPE_CONFIRMATION, WIPE_ORDER, wipeAllData } from "../lib/wipe";
import { AlertIcon } from "./Icons";
import { ErrorLine, Sheet, useToast } from "./ui";

const STEP_LABEL: Partial<Record<(typeof WIPE_ORDER)[number], string>> = {
  trips: "trips and stored goods",
  transactions: "entries",
  payday_rules: "payday rules",
  accounts: "accounts",
  settings: "settings",
};

/** Settings › Danger zone: delete every row of mine and start again with the setup wizard. The login stays. */
export function DangerZone() {
  const { reload } = useMz();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [exported, setExported] = useState(false);
  const ready = typed.trim().toUpperCase() === WIPE_CONFIRMATION;

  async function exportFirst() {
    setError(null);
    try {
      downloadJson(`mezgeb-backup-before-reset-${todayISO()}.json`, await buildBackup());
      setExported(true);
    } catch (e) {
      setError(friendlyError(e));
    }
  }

  async function wipe() {
    if (!ready) return;
    setError(null);
    try {
      await wipeAllData((table, done, total) => setBusy(`Deleting ${STEP_LABEL[table] ?? table.replace(/_/g, " ")}… (${Math.min(done + 1, total)} of ${total})`));
      setBusy("Done. Opening the setup wizard…");
      toast("All data deleted. Set Mezgeb up again.");
      setOpen(false);
      await reload(); // no settings any more → the app opens /mezgeb/setup
    } catch (e) {
      setError(`${friendlyError(e)} Some data may be left. Tap "Delete everything" again to finish.`);
    } finally {
      setBusy(null);
    }
  }

  return (
    <section aria-labelledby="danger-title" className="mz-card mz-card--amber mz-danger">
      <span id="danger-title" className="mz-row-center mz-warn mz-strong" style={{ fontSize: 15 }}>
        <AlertIcon /> Danger zone
      </span>
      <span className="mz-small mz-muted">
        Delete all your data and start again from the setup wizard. Your sign-in (email, password and authenticators) stays.
      </span>
      <button type="button" className="mz-btn mz-btn--md mz-btn--amber-outline" onClick={() => setOpen(true)}>
        Delete all my data…
      </button>

      <Sheet
        open={open}
        title="Delete all my data"
        onClose={() => {
          if (busy) return;
          setOpen(false);
          setTyped("");
          setError(null);
        }}
      >
        <div className="mz-form">
          <div className="mz-verdict__quote mz-danger__box" role="alert">
            This cannot be undone. Every account, entry, payday, debt, person, goal, wish, trip, stored good, price,
            category, rule and setting is deleted for good.
          </div>
          <p className="mz-note">
            <strong>Kept:</strong> your login and authenticator apps, so you can sign in right away. Light or dark mode on this phone is kept too.
          </p>
          <button type="button" className="mz-btn mz-btn--md mz-btn--secondary" onClick={exportFirst} disabled={busy !== null}>
            {exported ? "Backup downloaded ✓ (download again)" : "1. Download a backup first"}
          </button>
          <label className="mz-field">
            2. Type {WIPE_CONFIRMATION} to confirm
            <input
              className="mz-input"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              placeholder={WIPE_CONFIRMATION}
              disabled={busy !== null}
            />
          </label>
          {busy && (
            <p className="mz-note" role="status">
              {busy}
            </p>
          )}
          <ErrorLine text={error} />
          <button type="button" className="mz-btn mz-btn--amber" onClick={wipe} disabled={!ready || busy !== null}>
            {busy ? "Deleting…" : "3. Delete everything"}
          </button>
        </div>
      </Sheet>
    </section>
  );
}
