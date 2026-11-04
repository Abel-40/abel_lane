"use client";

import { useEffect, useState, type FormEvent } from "react";
import { BackHeader, DataFallback, ErrorLine, ProgressBar, Sheet, useToast } from "../components/ui";
import { useVerdict } from "../components/Verdict";
import { savingVerdict } from "../lib/insights";
import { insertRow, rpc, updateRow } from "../lib/db";
import { monthStart } from "../lib/dates";
import { accountLabel } from "../lib/derive";
import { formatMinor, hoursPhrase, parseAmount, sumMinor } from "../lib/money";
import { useMz } from "../lib/store";
import { friendlyError } from "../lib/supabase";
import type { Wish } from "../lib/types";

const WAIT_MS = 48 * 3600_000;

export function WishlistScreen() {
  const { data, error: loadError, reload } = useMz();
  const toast = useToast();
  const showVerdict = useVerdict();
  const [now, setNow] = useState(() => Date.now());
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [buying, setBuying] = useState<Wish | null>(null);

  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(t);
  }, []);

  if (!data?.settings) return <DataFallback error={loadError} onRetry={reload} />;
  const s = data.settings;
  const hours = (m: number) => hoursPhrase(m, s.net_salary_minor, s.work_hours_per_month);
  const month = monthStart();
  const waiting = data.wishes.filter((w) => w.status === "waiting");
  const ready = waiting.filter((w) => new Date(w.ready_at).getTime() <= now);
  const counting = waiting.filter((w) => new Date(w.ready_at).getTime() > now).sort((a, b) => (a.ready_at < b.ready_at ? -1 : 1));
  const decidedThisMonth = data.wishes.filter((w) => w.decided_at && w.decided_at.slice(0, 10) >= month);
  const letGo = decidedThisMonth.filter((w) => w.status === "let_go");
  const bought = decidedThisMonth.filter((w) => w.status === "bought");
  const kept = sumMinor(letGo.map((w) => w.amount_minor));
  const keptHours = hours(kept);

  async function add(e: FormEvent) {
    e.preventDefault();
    const m = parseAmount(amount);
    if (!name.trim()) return setError("What do you want?");
    if (!m) return setError("How much does it cost?");
    setBusy(true);
    setError(null);
    try {
      await insertRow("wishes", { name: name.trim(), amount_minor: m });
      await reload();
      setName("");
      setAmount("");
      toast("Added. Decide in 48 hours.");
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  }

  async function letItGo(w: Wish) {
    setBusy(true);
    try {
      await updateRow("wishes", w.id, { status: "let_go", decided_at: new Date().toISOString() });
      await reload();
      showVerdict(savingVerdict("let_go", w.amount_minor, data?.settings?.base_currency ?? "ETB", w.id));
    } catch (err) {
      toast(friendlyError(err), true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mz-page mz-page--full">
      <BackHeader title="Wishlist" subtitle="Every want waits 48 hours" href="/mezgeb/plan" />

      <section className="mz-hero mz-hero--amber" aria-label="Kept by letting go">
        <span className="mz-hero__label">Kept by letting go, this month</span>
        <span className="mz-hero__value">{formatMinor(kept, s.base_currency)}</span>
        <span style={{ fontSize: 14, fontWeight: 500 }}>{keptHours ? `${keptHours} of work you did not spend` : "Set your salary to see hours of work"}</span>
      </section>

      {ready.map((w) => (
        <article key={w.id} className="mz-card">
          <div className="mz-row-between" style={{ alignItems: "flex-start" }}>
            <span className="mz-head__text">
              <span className="mz-strong" style={{ fontSize: 15 }}>
                {w.name}
              </span>
              <span className="mz-small mz-muted">
                {formatMinor(w.amount_minor)}
                {hours(w.amount_minor) ? ` · ${hours(w.amount_minor)} of work` : ""}
              </span>
            </span>
            <span className="mz-pill">Ready to decide</span>
          </div>
          <div className="mz-grid-2" style={{ gap: 8 }}>
            <button type="button" className="mz-btn mz-btn--sm mz-btn--dark" style={{ width: "100%", borderRadius: 12 }} disabled={busy} onClick={() => setBuying(w)}>
              Still want it
            </button>
            <button type="button" className="mz-btn mz-btn--sm" style={{ width: "100%", borderRadius: 12 }} disabled={busy} onClick={() => letItGo(w)}>
              Let it go
            </button>
          </div>
        </article>
      ))}

      {counting.map((w) => {
        const left = new Date(w.ready_at).getTime() - now;
        // clamp: the database clock may run a few seconds ahead of the phone
        const hoursLeft = Math.min(48, Math.max(1, Math.ceil(left / 3600_000)));
        const elapsed = Math.min(100, Math.max(0, Math.floor(((WAIT_MS - left) * 100) / WAIT_MS)));
        return (
          <article key={w.id} className="mz-card">
            <div className="mz-row-between" style={{ alignItems: "flex-start" }}>
              <span className="mz-head__text">
                <span className="mz-strong" style={{ fontSize: 15 }}>
                  {w.name}
                </span>
                <span className="mz-small mz-muted">
                  {formatMinor(w.amount_minor)}
                  {hours(w.amount_minor) ? ` · ${hours(w.amount_minor)} of work` : ""}
                </span>
              </span>
              <span className="mz-num mz-warn mz-strong" style={{ fontSize: 13 }}>
                {hoursLeft} h left
              </span>
            </div>
            <ProgressBar percent={elapsed} color="var(--mz-amber)" size={6} label={`${w.name}: waiting`} />
          </article>
        );
      })}

      {waiting.length === 0 && <div className="mz-empty">Nothing waiting. When you want something, add it here and decide in two days.</div>}

      <div className="mz-row-between" style={{ fontSize: 13, color: "var(--mz-muted)", padding: "4px 2px", alignItems: "flex-start" }}>
        <span>Let go: {letGo.length ? letGo.map((w) => `${w.name} · ${formatMinor(w.amount_minor)}`).join(", ") : "none"}</span>
        <span style={{ textAlign: "right" }}>Bought: {bought.length ? bought.map((w) => w.name).join(", ") : "none"}</span>
      </div>

      <form className="mz-push mz-stack" onSubmit={add}>
        <ErrorLine text={error} />
        <div className="mz-row-center" style={{ gap: 8 }}>
          <label style={{ flex: 1, display: "flex", minWidth: 0 }}>
            <span className="mz-sr-only">New wish</span>
            <input className="mz-input" placeholder="Something you want…" value={name} maxLength={80} onChange={(e) => setName(e.target.value)} />
          </label>
          <label style={{ width: 104, display: "flex" }}>
            <span className="mz-sr-only">Price in Birr</span>
            <input className="mz-input mz-input--num" placeholder="Br" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </label>
          <button type="submit" className="mz-btn mz-btn--amber" style={{ width: "auto", height: 50, borderRadius: 14, padding: "0 18px", fontSize: 15 }} disabled={busy}>
            Wait
          </button>
        </div>
      </form>

      <Sheet open={buying !== null} title={buying ? `Buy ${buying.name}` : ""} onClose={() => setBuying(null)}>
        {buying && (
          <BuyWishForm
            wish={buying}
            onDone={async () => {
              setBuying(null);
              await reload();
              toast("Purchase recorded.");
            }}
          />
        )}
      </Sheet>
    </main>
  );
}

function BuyWishForm({ wish, onDone }: { wish: Wish; onDone: () => Promise<void> }) {
  const { data } = useMz();
  const accounts = (data?.accounts ?? []).filter((a) => !a.is_archived);
  const cats = (data?.categories ?? []).filter((c) => c.kind === "expense" && !c.is_archived);
  const [accountId, setAccountId] = useState(accounts.find((a) => a.role === "spending")?.id ?? accounts[0]?.id ?? "");
  const [categoryId, setCategoryId] = useState(cats.find((c) => !c.is_need)?.id ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!data) return null;
  return (
    <form
      className="mz-form"
      onSubmit={async (e) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        try {
          await rpc("mz_buy_wish", { p_wish_id: wish.id, p_account_id: accountId, p_category_id: categoryId || null });
          await onDone();
        } catch (err) {
          setError(friendlyError(err));
        } finally {
          setSaving(false);
        }
      }}
    >
      <p className="mz-muted" style={{ fontSize: 14 }}>
        Records an expense of {formatMinor(wish.amount_minor)} as a want.
      </p>
      <label className="mz-field">
        Paid from
        <select className="mz-select" value={accountId} onChange={(e) => setAccountId(e.target.value)}>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {accountLabel(a, data.institutions)}
            </option>
          ))}
        </select>
      </label>
      <label className="mz-field">
        Category
        <select className="mz-select" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
          <option value="">None</option>
          {cats.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>
      <ErrorLine text={error} />
      <button type="submit" className="mz-btn" disabled={saving}>
        {saving ? "Saving…" : "Record purchase"}
      </button>
    </form>
  );
}
