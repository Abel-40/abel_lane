"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckIcon } from "../components/Icons";
import { RulesManager, SPLIT_COLORS } from "../components/RulesManager";
import { AmountField, BackHeader, DataFallback, ErrorLine, Sheet, useToast } from "../components/ui";
import { rpc } from "../lib/db";
import { monthStart, shortDay, todayISO } from "../lib/dates";
import { accountLabel } from "../lib/derive";
import { formatBp, formatMinor, minorToInput, parseAmount, sharePercent, sumMinor } from "../lib/money";
import { computeSplit } from "../lib/payday";
import { useMz } from "../lib/store";
import { friendlyError, supabase } from "../lib/supabase";
import type { Payday, PaydayAllocation } from "../lib/types";

export function PaydayScreen() {
  const { data, error: loadError, reload } = useMz();
  const toast = useToast();
  const [paydays, setPaydays] = useState<Payday[] | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [allocations, setAllocations] = useState<PaydayAllocation[]>([]);
  const [recording, setRecording] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadPaydays = useCallback(async () => {
    const { data: list, error: e } = await supabase().from("paydays").select("*").order("received_on", { ascending: false }).order("created_at", { ascending: false }).limit(12);
    if (e) return setError(friendlyError(e));
    const rows = (list ?? []) as Payday[];
    setPaydays(rows);
    setSelected((cur) => cur ?? rows[0]?.id ?? null);
  }, []);

  const loadAllocations = useCallback(async (id: string) => {
    const { data: list, error: e } = await supabase().from("payday_allocations").select("*").eq("payday_id", id).order("sort_order");
    if (e) return setError(friendlyError(e));
    setAllocations((list ?? []) as PaydayAllocation[]);
  }, []);

  useEffect(() => {
    void loadPaydays();
  }, [loadPaydays]);
  useEffect(() => {
    if (selected) void loadAllocations(selected);
    else setAllocations([]);
  }, [selected, loadAllocations]);

  if (!data?.settings || paydays === null) return <DataFallback error={loadError ?? error} onRetry={reload} />;
  const { accounts, institutions, settings } = data;
  const payday = paydays.find((p) => p.id === selected) ?? null;
  const thisMonthRecorded = paydays.some((p) => p.received_on >= monthStart());
  const moved = allocations.filter((a) => a.moved_at).length;
  const remaining = allocations.filter((a) => !a.moved_at);
  const total = sumMinor(allocations.map((a) => a.amount_minor));
  const salaryAccount = payday ? accounts.find((a) => a.id === payday.account_id) : undefined;

  async function tick(a: PaydayAllocation) {
    setBusy(a.id);
    setError(null);
    try {
      await rpc(a.moved_at ? "mz_unmove_allocation" : "mz_move_allocation", { p_allocation_id: a.id });
      await Promise.all([loadAllocations(a.payday_id), reload()]);
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setBusy(null);
    }
  }

  async function moveAll() {
    setBusy("all");
    setError(null);
    try {
      for (const a of remaining) await rpc("mz_move_allocation", { p_allocation_id: a.id });
      if (payday) await loadAllocations(payday.id);
      await reload();
      toast("All transfers recorded.");
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setBusy(null);
    }
  }

  return (
    <main className="mz-page mz-page--full">
      <BackHeader title="Payday split" subtitle={payday ? `Salary arrived in ${accountLabel(salaryAccount, institutions)}` : "Split your salary by your rules"} />

      {(!payday || !thisMonthRecorded) && (
        <button type="button" className="mz-btn" onClick={() => setRecording(true)}>
          Record {thisMonthRecorded ? "another" : "this month's"} payday
        </button>
      )}

      {payday && (
        <>
          <section className="mz-card mz-card--lg">
            <div className="mz-row-between">
              <span className="mz-muted" style={{ fontSize: 13 }}>
                Net salary · {shortDay(payday.received_on)}
              </span>
              <span className="mz-num" style={{ fontWeight: 700, fontSize: 28 }}>
                {formatMinor(payday.amount_minor, salaryAccount?.currency)}
              </span>
            </div>
            <div className="mz-split" aria-label="Split bar" role="img">
              {allocations.map((a, i) => (
                <span key={a.id} style={{ width: `${sharePercent(a.amount_minor, payday.amount_minor)}%`, background: SPLIT_COLORS[i % SPLIT_COLORS.length] }} />
              ))}
            </div>
            <div className="mz-row-between" style={{ fontSize: 13 }}>
              <span className="mz-muted">
                {moved} of {allocations.length} moved
              </span>
              <span className={`mz-strong ${total === payday.amount_minor ? "mz-pos" : "mz-warn"}`}>
                {formatMinor(payday.amount_minor - total, salaryAccount?.currency)} left to assign
              </span>
            </div>
          </section>

          <ul className="mz-stack">
            {allocations.map((a, i) => (
              <li key={a.id} className="mz-card mz-card--sm mz-card--row" style={{ borderRadius: 16 }}>
                <span className="mz-swatch" style={{ background: SPLIT_COLORS[i % SPLIT_COLORS.length] }} aria-hidden="true" />
                <span className="mz-row__main" style={{ gap: 2 }}>
                  <span className="mz-row__title">{a.name}</span>
                  <span className="mz-row__sub">→ {accountLabel(accounts.find((x) => x.id === a.target_account_id), institutions)}</span>
                </span>
                <span className="mz-row__value">{formatMinor(a.amount_minor, salaryAccount?.currency, { symbol: false })}</span>
                <button
                  type="button"
                  className="mz-tick"
                  aria-pressed={Boolean(a.moved_at)}
                  aria-label={a.moved_at ? `${a.name}: moved. Tap to undo` : `${a.name}: not moved yet. Tap when done`}
                  disabled={busy !== null}
                  onClick={() => tick(a)}
                >
                  <span>{a.moved_at && <CheckIcon />}</span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      {!payday && <div className="mz-empty">No payday recorded yet. When your salary arrives, record it here and Mezgeb splits it by your rules.</div>}

      <ErrorLine text={error} />

      <p className="mz-note">
        Each row records a real transfer between your accounts when you tick it.{" "}
        <button type="button" className="mz-link-btn" style={{ fontSize: 12, padding: 0, margin: 0, textDecoration: "underline" }} onClick={() => setRulesOpen(true)}>
          Edit payday rules
        </button>
      </p>

      {paydays.length > 1 && (
        <details className="mz-details">
          <summary className="mz-section-label">Earlier paydays</summary>
          <div className="mz-chips">
            {paydays.map((p) => (
              <button key={p.id} type="button" className="mz-chip" aria-pressed={p.id === selected} onClick={() => setSelected(p.id)}>
                {shortDay(p.received_on)} · {formatMinor(p.amount_minor, "ETB", { symbol: false })}
              </button>
            ))}
          </div>
        </details>
      )}

      {payday && remaining.length > 0 && (
        <button type="button" className="mz-btn mz-btn--tall mz-push" onClick={moveAll} disabled={busy !== null}>
          {busy === "all" ? "Recording…" : `Mark remaining ${remaining.length} as moved`}
        </button>
      )}

      <Sheet open={recording} title="Record payday" onClose={() => setRecording(false)}>
        <RecordPayday
          defaultAmount={settings.net_salary_minor}
          onDone={async (id) => {
            setRecording(false);
            setSelected(id);
            await Promise.all([loadPaydays(), reload()]);
            await loadAllocations(id);
            toast("Payday recorded. Tick each transfer as you make it.");
          }}
        />
      </Sheet>
      <Sheet open={rulesOpen} title="Payday rules" onClose={() => setRulesOpen(false)}>
        <RulesManager />
      </Sheet>
    </main>
  );
}

function RecordPayday({ defaultAmount, onDone }: { defaultAmount: number; onDone: (paydayId: string) => Promise<void> }) {
  const { data } = useMz();
  const accounts = useMemo(() => (data?.accounts ?? []).filter((a) => !a.is_archived), [data]);
  const [amountText, setAmountText] = useState(minorToInput(defaultAmount));
  const [date, setDate] = useState(todayISO());
  const [accountId, setAccountId] = useState(accounts.find((a) => a.role === "salary_inbox")?.id ?? accounts[0]?.id ?? "");
  const incomeCats = (data?.categories ?? []).filter((c) => c.kind === "income" && !c.is_archived);
  const [categoryId, setCategoryId] = useState(incomeCats.find((c) => /salary/i.test(c.name))?.id ?? "");
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const amount = parseAmount(amountText) ?? 0;
  const split = computeSplit(amount, data?.rules ?? []);
  const lines = split.lines.map((l) => {
    const o = overrides[l.rule.id];
    return { ...l, amount_minor: o !== undefined ? parseAmount(o) ?? -1 : l.amount_minor };
  });
  const bad = lines.some((l) => l.amount_minor < 0);
  const total = bad ? 0 : sumMinor(lines.map((l) => l.amount_minor));
  const leftover = amount - total;

  async function submit() {
    if (amount <= 0) return setError("Enter the salary that arrived.");
    if (!accountId) return setError("Choose the account it arrived in.");
    if (bad) return setError("One of the amounts is not valid.");
    if (leftover !== 0) return setError(`The split must equal the salary exactly: ${formatMinor(Math.abs(leftover))} ${leftover > 0 ? "left to assign" : "too much"}.`);
    setSaving(true);
    setError(null);
    try {
      const id = await rpc<string>("mz_record_payday", {
        p_received_on: date,
        p_amount_minor: amount,
        p_account_id: accountId,
        p_category_id: categoryId || null,
        p_allocations: lines.map((l) => ({
          rule_id: l.rule.id,
          name: l.rule.name,
          target_account_id: l.rule.target_account_id,
          goal_id: l.rule.goal_id,
          debt_id: l.rule.debt_id,
          amount_minor: l.amount_minor,
        })),
      });
      await onDone(id);
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setSaving(false);
    }
  }

  if (!data) return null;
  return (
    <div className="mz-form">
      <AmountField label="Salary that arrived" value={amountText} onChange={(t) => setAmountText(t)} />
      <div className="mz-grid-2">
        <label className="mz-field">
          Date
          <input className="mz-input" type="date" value={date} max={todayISO()} onChange={(e) => setDate(e.target.value || todayISO())} />
        </label>
        <label className="mz-field">
          Category
          <select className="mz-select" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">None</option>
            {incomeCats.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="mz-field">
        Arrived in
        <select className="mz-select" value={accountId} onChange={(e) => setAccountId(e.target.value)}>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {accountLabel(a, data.institutions)}
            </option>
          ))}
        </select>
      </label>

      <span className="mz-section-label">Split</span>
      {lines.length === 0 ? (
        <p className="mz-note">No payday rules yet. Add them with “Edit payday rules”.</p>
      ) : (
        <div className="mz-list mz-list--16">
          {lines.map((l) => (
            <label key={l.rule.id} className="mz-check-row" style={{ borderBottom: "1px solid var(--mz-border)" }}>
              <span className="mz-row__main">
                <span>
                  {l.rule.name}
                  {l.rule.kind === "percent_of_salary" ? ` · ${formatBp(l.rule.value)}` : ""}
                </span>
                <span className="mz-row__sub">→ {accountLabel(data.accounts.find((a) => a.id === l.rule.target_account_id), data.institutions)}</span>
              </span>
              <input
                className="mz-input mz-input--num mz-input--dark"
                style={{ width: 110, height: 40, textAlign: "right", fontSize: 15 }}
                inputMode="decimal"
                aria-label={`${l.rule.name} amount`}
                value={overrides[l.rule.id] ?? minorToInput(l.amount_minor)}
                onChange={(e) => setOverrides((o) => ({ ...o, [l.rule.id]: e.target.value }))}
              />
            </label>
          ))}
        </div>
      )}
      <span className={`mz-small mz-strong ${leftover === 0 && !bad ? "mz-pos" : "mz-warn"}`}>
        {bad ? "Check the amounts." : `${formatMinor(Math.abs(leftover))} ${leftover >= 0 ? "left to assign" : "over the salary"}`}
      </span>
      <ErrorLine text={error} />
      <button type="button" className="mz-btn" onClick={submit} disabled={saving}>
        {saving ? "Saving…" : "Record payday"}
      </button>
    </div>
  );
}
