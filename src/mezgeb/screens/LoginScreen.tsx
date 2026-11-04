"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { CodeInput } from "../components/CodeInput";
import { AlertIcon } from "../components/Icons";
import { currentAal, lockExpired, markActive, takeLoginReason } from "../lib/session";
import { friendlyError, isConfigured, supabase } from "../lib/supabase";

type Step =
  | { kind: "loading" }
  | { kind: "password" }
  | { kind: "code"; factors: { id: string; name: string }[]; factorId: string }
  | { kind: "enroll"; factorId: string; qr: string; secret: string };

function qrSrc(qr: string): string {
  return qr.startsWith("data:") ? qr : `data:image/svg+xml;utf-8,${encodeURIComponent(qr)}`;
}

export function LoginScreen() {
  const [step, setStep] = useState<Step>({ kind: "loading" });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [showSecret, setShowSecret] = useState(false);

  const finish = useCallback(() => {
    markActive();
    window.location.replace("/mezgeb");
  }, []);

  /** After the password: ask for the code, or set up the authenticator the first time. */
  const toSecondStep = useCallback(async () => {
    const sb = supabase();
    const { data, error: listError } = await sb.auth.mfa.listFactors();
    if (listError) throw listError;
    const verified = data.totp.map((f) => ({ id: f.id, name: f.friendly_name || "Authenticator" }));
    if (verified.length > 0) {
      setStep({ kind: "code", factors: verified, factorId: verified[0].id });
      return;
    }
    // Clear half-finished enrollments, then start a fresh one.
    for (const f of data.all) {
      if (f.status === "unverified") await sb.auth.mfa.unenroll({ factorId: f.id });
    }
    const { data: enrolled, error: enrollError } = await sb.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: `Mezgeb ${new Date().toISOString().slice(0, 10)}`,
      issuer: "Mezgeb",
    });
    if (enrollError) throw enrollError;
    setStep({ kind: "enroll", factorId: enrolled.id, qr: enrolled.totp.qr_code, secret: enrolled.totp.secret });
  }, []);

  useEffect(() => {
    const reason = takeLoginReason();
    if (reason === "locked") setNotice("Locked after a while without use. Sign in again.");
    if (reason === "signed_out") setNotice("Signed out.");
    if (!isConfigured()) {
      setStep({ kind: "password" });
      setError("Mezgeb is not configured yet. Add the Supabase URL and anon key to the build environment.");
      return;
    }
    (async () => {
      const sb = supabase();
      const { data } = await sb.auth.getSession();
      if (!data.session) return setStep({ kind: "password" });
      if (lockExpired()) {
        await sb.auth.signOut({ scope: "local" });
        setNotice("Locked after a while without use. Sign in again.");
        return setStep({ kind: "password" });
      }
      const aal = await currentAal();
      if (aal.current === "aal2") return finish();
      try {
        await toSecondStep();
      } catch (e) {
        setError(friendlyError(e));
        setStep({ kind: "password" });
      }
    })();
  }, [finish, toSecondStep]);

  async function submitPassword(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const { error: signInError } = await supabase().auth.signInWithPassword({ email: email.trim(), password });
      if (signInError) {
        setError(/invalid/i.test(signInError.message) ? "Email or password is wrong." : friendlyError(signInError));
        return;
      }
      setPassword("");
      setCode("");
      await toSecondStep();
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  }

  async function submitCode(value = code) {
    if (busy || value.length !== 6 || (step.kind !== "code" && step.kind !== "enroll")) return;
    setBusy(true);
    setError(null);
    try {
      const { error: verifyError } = await supabase().auth.mfa.challengeAndVerify({ factorId: step.factorId, code: value });
      if (verifyError) {
        setCode("");
        setError("That code did not work. Wait for the next code and try again.");
        return;
      }
      finish();
    } catch (err) {
      setCode("");
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  }

  async function startOver() {
    await supabase().auth.signOut({ scope: "local" });
    setCode("");
    setError(null);
    setStep({ kind: "password" });
  }

  return (
    <main className="mz-app">
      <div className="mz-page--full mz-stack" style={{ gap: 28, paddingTop: "calc(72px + var(--mz-safe-top))", paddingInline: 24 }}>
        <div className="mz-stack" style={{ gap: 14 }}>
          <div className="mz-mark" aria-hidden="true">
            መ
          </div>
          <h1 className="mz-display" style={{ fontWeight: 700, fontSize: 30, letterSpacing: "-0.02em" }}>
            Mezgeb
          </h1>
          <p className="mz-muted" style={{ fontSize: 15, lineHeight: 1.5 }}>
            Private. Only the owner can sign in.
          </p>
        </div>

        {notice && !error && <p className="mz-note" role="status">{notice}</p>}

        {step.kind === "loading" && (
          <div className="mz-row-center mz-muted" role="status">
            <span className="mz-spinner" aria-hidden="true" /> Checking your session…
          </div>
        )}

        {step.kind === "password" && (
          <form className="mz-form" onSubmit={submitPassword} noValidate>
            <label className="mz-field">
              Email
              <input
                className="mz-input"
                type="email"
                name="email"
                autoComplete="username"
                inputMode="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <label className="mz-field">
              Password
              <input
                className="mz-input"
                type="password"
                name="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            {error && <ErrorLine text={error} />}
            <button className="mz-btn" type="submit" disabled={busy || !email || !password || !isConfigured()}>
              {busy ? "Checking…" : "Continue"}
            </button>
          </form>
        )}

        {step.kind === "code" && (
          <section aria-label="Step 2" className="mz-card mz-card--lg" style={{ padding: 18, gap: 14 }}>
            <div className="mz-row-between">
              <span className="mz-strong" style={{ fontSize: 15 }}>
                Authenticator code
              </span>
              <span className="mz-small mz-dim">Step 2 of 2</span>
            </div>
            <CodeInput value={code} onChange={setCode} onComplete={submitCode} disabled={busy} autoFocus />
            {step.factors.length > 1 && (
              <label className="mz-field">
                Authenticator
                <select
                  className="mz-select mz-input--dark"
                  value={step.factorId}
                  onChange={(e) => setStep({ ...step, factorId: e.target.value })}
                >
                  {step.factors.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <p className="mz-muted" style={{ fontSize: 13, lineHeight: 1.5 }}>
              Open your authenticator app and enter the code for Mezgeb.
            </p>
            {error && <ErrorLine text={error} />}
            <div className="mz-row-between" style={{ alignItems: "center" }}>
              <button type="button" className="mz-link-btn" onClick={startOver}>
                Use another account
              </button>
              <button type="button" className="mz-btn mz-btn--sm" disabled={busy || code.length !== 6} onClick={() => submitCode()}>
                {busy ? "Checking…" : "Verify"}
              </button>
            </div>
          </section>
        )}

        {step.kind === "enroll" && (
          <section aria-label="Set up two-step sign-in" className="mz-card mz-card--lg" style={{ padding: 18, gap: 14 }}>
            <div className="mz-row-between">
              <span className="mz-strong" style={{ fontSize: 15 }}>
                Set up your authenticator
              </span>
              <span className="mz-small mz-dim">Once</span>
            </div>
            <p className="mz-muted" style={{ fontSize: 13, lineHeight: 1.5 }}>
              Mezgeb always asks for a code from an authenticator app (Google Authenticator, Aegis, 2FAS…). Scan this code with it, then enter the
              six digits it shows.
            </p>
            <div className="mz-qr">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrSrc(step.qr)} alt="QR code to add Mezgeb to your authenticator app" />
            </div>
            {showSecret ? (
              <div className="mz-stack">
                <span className="mz-small mz-muted">Or type this key into the app:</span>
                <span className="mz-secret">{step.secret}</span>
              </div>
            ) : (
              <button type="button" className="mz-link-btn" style={{ alignSelf: "flex-start" }} onClick={() => setShowSecret(true)}>
                Can&apos;t scan? Show the key
              </button>
            )}
            <CodeInput value={code} onChange={setCode} onComplete={submitCode} disabled={busy} />
            {error && <ErrorLine text={error} />}
            <button type="button" className="mz-btn" disabled={busy || code.length !== 6} onClick={() => submitCode()}>
              {busy ? "Checking…" : "Turn on two-step sign-in"}
            </button>
            <p className="mz-note">Afterwards, add a second authenticator as a backup in Settings › Security. There are no recovery codes.</p>
          </section>
        )}

        <p className="mz-note mz-push" style={{ textAlign: "center" }}>
          No sign-up here. Accounts are created in the database dashboard only.
        </p>
      </div>
    </main>
  );
}

function ErrorLine({ text }: { text: string }) {
  return (
    <p className="mz-error" role="alert">
      <AlertIcon />
      <span>{text}</span>
    </p>
  );
}
