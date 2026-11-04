"use client";

import { useCallback, useEffect, useState } from "react";
import { signOutEverywhere } from "../lib/session";
import { friendlyError, supabase } from "../lib/supabase";
import { CodeInput } from "./CodeInput";
import { AlertIcon } from "./Icons";

type Factor = { id: string; name: string; created: string };
type Enrolling = { factorId: string; qr: string; secret: string };

const LOCK_CHOICES = [1, 2, 5, 10, 15, 30];

type Props = {
  lockMinutes: number;
  onLockMinutes: (minutes: number) => void;
  hideBalances: boolean;
  onHideBalances: (hide: boolean) => void;
};

export function SecuritySection({ lockMinutes, onLockMinutes, hideBalances, onHideBalances }: Props) {
  const [factors, setFactors] = useState<Factor[] | null>(null);
  const [enrolling, setEnrolling] = useState<Enrolling | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data, error: e } = await supabase().auth.mfa.listFactors();
    if (e) return setError(friendlyError(e));
    setFactors(data.totp.map((f) => ({ id: f.id, name: f.friendly_name || "Authenticator", created: f.created_at.slice(0, 10) })));
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function startBackup() {
    setBusy(true);
    setError(null);
    try {
      const sb = supabase();
      const { data: list } = await sb.auth.mfa.listFactors();
      for (const f of list?.all ?? []) if (f.status === "unverified") await sb.auth.mfa.unenroll({ factorId: f.id });
      const { data, error: e } = await sb.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: `Backup ${new Date().toISOString().slice(0, 16).replace("T", " ")}`,
        issuer: "Mezgeb",
      });
      if (e) throw e;
      setCode("");
      setEnrolling({ factorId: data.id, qr: data.totp.qr_code, secret: data.totp.secret });
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setBusy(false);
    }
  }

  async function verifyBackup(value = code) {
    if (!enrolling || value.length !== 6 || busy) return;
    setBusy(true);
    setError(null);
    const { error: e } = await supabase().auth.mfa.challengeAndVerify({ factorId: enrolling.factorId, code: value });
    setBusy(false);
    if (e) {
      setCode("");
      setError("That code did not work. Wait for the next code and try again.");
      return;
    }
    setEnrolling(null);
    await load();
  }

  async function cancelBackup() {
    if (enrolling) await supabase().auth.mfa.unenroll({ factorId: enrolling.factorId });
    setEnrolling(null);
    setError(null);
  }

  async function remove(f: Factor) {
    if (!factors || factors.length < 2) return;
    if (!window.confirm(`Remove "${f.name}"? That app will no longer be able to sign in to Mezgeb.`)) return;
    setBusy(true);
    const { error: e } = await supabase().auth.mfa.unenroll({ factorId: f.id });
    setBusy(false);
    if (e) return setError(friendlyError(e));
    await supabase().auth.refreshSession();
    await load();
  }

  return (
    <>
      <span className="mz-section-label">Security</span>
      <div className="mz-list mz-list--16">
        <div className="mz-check-row" style={{ borderBottom: "1px solid var(--mz-border)" }}>
          <span>Two-step sign-in</span>
          <span className="mz-pill">On</span>
        </div>
        {factors?.map((f) => (
          <div key={f.id} className="mz-check-row" style={{ borderBottom: "1px solid var(--mz-border)" }}>
            <span className="mz-row__main">
              <span>{f.name}</span>
              <span className="mz-row__sub">Added {f.created}</span>
            </span>
            {factors.length > 1 && (
              <button type="button" className="mz-link-btn" onClick={() => remove(f)} disabled={busy} aria-label={`Remove ${f.name}`}>
                Remove
              </button>
            )}
          </div>
        ))}
        <label className="mz-check-row" style={{ borderBottom: "1px solid var(--mz-border)" }}>
          <span>Lock after inactivity</span>
          <select
            className="mz-select"
            style={{ width: "auto", height: 40, fontSize: 14, background: "var(--mz-bg)" }}
            value={lockMinutes}
            onChange={(e) => onLockMinutes(Number(e.target.value))}
          >
            {Array.from(new Set([...LOCK_CHOICES, lockMinutes]))
              .sort((a, b) => a - b)
              .map((m) => (
                <option key={m} value={m}>
                  {m} {m === 1 ? "minute" : "minutes"}
                </option>
              ))}
          </select>
        </label>
        <div className="mz-check-row">
          <span id="mz-hide-label">Hide balances on open</span>
          <button
            type="button"
            role="switch"
            aria-checked={hideBalances}
            aria-labelledby="mz-hide-label"
            className="mz-switch"
            onClick={() => onHideBalances(!hideBalances)}
          >
            {hideBalances ? "On" : "Off"}
          </button>
        </div>
      </div>

      {factors && factors.length < 2 && !enrolling && (
        <div className="mz-card mz-card--amber mz-card--sm" style={{ gap: 10 }}>
          <span className="mz-warn mz-strong" style={{ fontSize: 14 }}>
            Add a backup authenticator
          </span>
          <span className="mz-small mz-muted" style={{ lineHeight: 1.5 }}>
            There are no recovery codes. If you lose your phone, a second authenticator (another phone, or the same app on a tablet) is the only
            way back in.
          </span>
          <button type="button" className="mz-btn mz-btn--md mz-btn--amber-outline" onClick={startBackup} disabled={busy}>
            Add backup authenticator
          </button>
        </div>
      )}
      {factors && factors.length >= 2 && !enrolling && (
        <button type="button" className="mz-btn mz-btn--md mz-btn--secondary" onClick={startBackup} disabled={busy}>
          Add another authenticator
        </button>
      )}

      {enrolling && (
        <div className="mz-card mz-card--lg">
          <span className="mz-strong">Scan with the backup device</span>
          <div className="mz-qr">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={enrolling.qr.startsWith("data:") ? enrolling.qr : `data:image/svg+xml;utf-8,${encodeURIComponent(enrolling.qr)}`}
              alt="QR code for the backup authenticator"
            />
          </div>
          <span className="mz-small mz-muted">Or type this key:</span>
          <span className="mz-secret">{enrolling.secret}</span>
          <CodeInput value={code} onChange={setCode} onComplete={verifyBackup} disabled={busy} label="Code from the backup device" />
          <div className="mz-grid-2">
            <button type="button" className="mz-btn mz-btn--md mz-btn--dark" onClick={cancelBackup} disabled={busy}>
              Cancel
            </button>
            <button type="button" className="mz-btn mz-btn--md" onClick={() => verifyBackup()} disabled={busy || code.length !== 6}>
              Verify
            </button>
          </div>
        </div>
      )}

      {error && (
        <p className="mz-error" role="alert">
          <AlertIcon />
          <span>{error}</span>
        </p>
      )}
    </>
  );
}

export function SignOutEverywhereButton() {
  return (
    <button
      type="button"
      className="mz-btn mz-btn--md mz-btn--amber-quiet"
      style={{ fontWeight: 600, height: 48 }}
      onClick={() => {
        if (window.confirm("Sign out of Mezgeb on every device?")) void signOutEverywhere();
      }}
    >
      Sign out everywhere
    </button>
  );
}
