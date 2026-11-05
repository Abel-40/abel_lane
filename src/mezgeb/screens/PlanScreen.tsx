"use client";

import Link from "next/link";
import { useState } from "react";
import { DebtForm, GoalForm, type DebtMove } from "../components/forms";
import { YearSavingsCard } from "../components/Insights";
import { AmountField, DataFallback, ErrorLine, Money, ProgressBar, Sheet, useToast } from "../components/ui";
import { useVerdict } from "../components/Verdict";
import { deleteRow, insertRow, saveRow } from "../lib/db";
import { targetLabel, todayISO } from "../lib/dates";
import { accountLabel, monthlyFromSalary } from "../lib/derive";
import { computeInsights, savingVerdict } from "../lib/insights";
import { isSelfLoan } from "../lib/position";
import { formatMinor, minorToInput, parseAmount, sharePercent } from "../lib/money";
import { debtOutlook, goalOutlook } from "../lib/plan";
import { useMz } from "../lib/store";
import { friendlyError } from "../lib/supabase";
import type { Debt, Goal } from "../lib/types";

/** One money movement for a person: which way it goes and how it is worded. */
type Move = {
  debt: Debt;
  kind: "expense" | "income";
  title: string;
  submit: string;
  done: string;
};

type Editing = { kind: "debt"; row: Debt | null } | { kind: "goal"; row: Goal | null } | { kind: "move"; move: Move } | { kind: "deposit"; goal: Goal } | null;

const MOVES = {
  pay: (d: Debt): Move => ({ debt: d, kind: "expense", title: "Record a payment", submit: "Record payment", done: "Payment recorded." }),
  borrow: (d: Debt): Move => ({ debt: d, kind: "income", title: `Borrowed more from ${d.counterparty}`, submit: "Record money borrowed", done: "Recorded." }),
  lend: (d: Debt): Move => ({ debt: d, kind: "expense", title: `Lend ${d.counterparty} more`, submit: "Record money lent", done: "Lending recorded." }),
  received: (d: Debt): Move => ({ debt: d, kind: "income", title: `Money back from ${d.counterparty}`, submit: "Record money received", done: "Money received." }),
  keep: (d: Debt): Move => ({ debt: d, kind: "income", title: `${d.counterparty} gave you more to keep`, submit: "Record money kept", done: "Recorded." }),
  giveBack: (d: Debt): Move => ({ debt: d, kind: "expense", title: `Give money back to ${d.counterparty}`, submit: "Record money given back", done: "Given back." }),
};

export function PlanScreen() {
  const { data, error, reload } = useMz();
  const toast = useToast();
  const showVerdict = useVerdict();
  const [editing, setEditing] = useState<Editing>(null);
  if (!data?.settings) return <DataFallback error={error} onRetry={reload} />;
  const { settings: s, debts, debtProgress, goals, goalProgress, rules, accounts, institutions } = data;
  const today = todayISO();
  const insights = computeInsights(data, today);

  const owe = debts.filter((d) => d.direction === "i_owe" && d.status === "active");
  const lent = debts.filter((d) => d.direction === "owed_to_me" && d.status === "active");
  const kept = debts.filter((d) => d.direction === "held_for_other" && d.status === "active");
  const gifts = debts.filter((d) => d.direction === "gift_received");
  const settled = debts.filter((d) => d.direction !== "gift_received" && d.status === "paid");
  const liveGoals = goals.filter((g) => g.status === "active" || g.status === "reached");
  const planned = goals.filter((g) => g.status === "planned");
  const archivedGoals = goals.filter((g) => g.status === "archived");

  /** principal + what was added (borrowed more, lent, deposited); never below what was paid */
  const totalOf = (d: Debt) => d.principal_minor + (debtProgress[d.id]?.added_minor ?? 0);
  const remainingOf = (d: Debt) => debtProgress[d.id]?.remaining_minor ?? d.principal_minor;
  const paidOf = (d: Debt) => debtProgress[d.id]?.paid_minor ?? 0;

  async function saveDebt(id: string | null, values: Partial<Debt>, move: DebtMove | null) {
    const row = await saveRow<Debt>("debts", id, values as Record<string, unknown>);
    if (move) {
      await insertRow("transactions", {
        kind: values.direction === "owed_to_me" ? "expense" : "income",
        account_id: move.accountId,
        amount_minor: move.amount,
        debt_id: row.id,
        occurred_on: move.date,
        note: row.counterparty,
        source: "debt",
      });
    }
    await reload();
    setEditing(null);
  }
  async function saveGoal(id: string | null, values: Record<string, unknown>) {
    await saveRow("goals", id, values);
    await reload();
    setEditing(null);
  }
  async function removeDebt(d: Debt) {
    if (!window.confirm(`Delete "${d.counterparty}"?`)) return;
    try {
      await deleteRow("debts", d.id);
      await reload();
      setEditing(null);
    } catch (e) {
      toast(e && (e as { code?: string }).code === "23503" ? "Money is recorded for this person. Mark it settled instead." : friendlyError(e), true);
    }
  }
  async function removeGoal(g: Goal) {
    if (!window.confirm(`Delete "${g.name}"?`)) return;
    try {
      await deleteRow("goals", g.id);
      await reload();
      setEditing(null);
    } catch (e) {
      toast(e && (e as { code?: string }).code === "23503" ? "Money is tagged to it. Archive it instead." : friendlyError(e), true);
    }
  }

  const editButton = (d: Debt, sub: string) => (
    <button type="button" className="mz-head__text" style={{ background: "none", border: 0, padding: 0, textAlign: "left", color: "inherit" }} onClick={() => setEditing({ kind: "debt", row: d })}>
      <span className="mz-strong" style={{ fontSize: 16 }}>
        {d.counterparty}
      </span>
      <span className="mz-small mz-muted">{sub}</span>
    </button>
  );
  const bigAmount = (d: Debt, minor: number, word: string) => (
    <div className="mz-row-center" style={{ gap: 6, alignItems: "baseline" }}>
      <span className="mz-num" style={{ fontWeight: 700, fontSize: 30 }}>
        <Money minor={minor} currency={d.currency} symbol={false} />
      </span>
      <span className="mz-muted" style={{ fontSize: 14 }}>
        {d.currency === "ETB" ? "Br" : d.currency} {word}
      </span>
    </div>
  );
  const where = (d: Debt) => (d.account_id ? accountLabel(accounts.find((a) => a.id === d.account_id), institutions) : null);

  return (
    <main className="mz-page mz-page--tight">
      <header className="mz-head">
        <h1 className="mz-title">Plan</h1>
        <div className="mz-row-center" style={{ gap: 8 }}>
          <Link href="/mezgeb/payday" className="mz-btn mz-btn--sm mz-btn--secondary">
            Payday
          </Link>
          <Link href="/mezgeb/wishlist" className="mz-btn mz-btn--sm mz-btn--secondary">
            Wishlist
          </Link>
        </div>
      </header>

      {insights && <YearSavingsCard year={insights.year} />}

      <span className="mz-section-label">Debts I owe</span>
      {owe.map((d, i) => {
        const remaining = remainingOf(d);
        const monthly = monthlyFromSalary(s, rules, "debt_id", d.id);
        const outlook = debtOutlook(remaining, monthly, d.target_on, s.payday_day, today);
        const status =
          remaining === 0 ? { text: "Paid off", cls: "mz-pill" } : outlook.onTrack === null ? { text: "No target", cls: "mz-pill mz-pill--muted" } : outlook.onTrack ? { text: "On track", cls: "mz-pill" } : { text: "Behind", cls: "mz-pill mz-pill--amber" };
        return (
          <article key={d.id} className="mz-card mz-card--lg">
            <div className="mz-row-between" style={{ alignItems: "flex-start" }}>
              {editButton(d, `${formatMinor(totalOf(d), d.currency)} · priority ${d.priority}${d.notes ? ` · ${d.notes.toLowerCase()}` : i === 0 ? " · pay first" : ""}`)}
              <span className={status.cls}>{status.text}</span>
            </div>
            {bigAmount(d, remaining, "left")}
            <ProgressBar percent={sharePercent(paidOf(d), totalOf(d))} color="var(--mz-amber)" size={10} label={`${d.counterparty} paid`} />
            <div className="mz-grid-2" style={{ gap: 8 }}>
              <span className="mz-inset mz-inset--kv">
                <span>From salary</span>
                <span>{monthly > 0 ? `${formatMinor(monthly, d.currency, { symbol: false })} / month` : "not planned"}</span>
              </span>
              <span className="mz-inset mz-inset--kv">
                <span>Target date</span>
                <span>{d.target_on ? targetLabel(d.target_on, today) : "none"}</span>
              </span>
            </div>
            {outlook.onTrack === false && outlook.paydaysNeeded !== null && (
              <span className="mz-small mz-warn">
                At this pace it takes {outlook.paydaysNeeded} more paydays; {outlook.paydaysLeft} are left before the target.
              </span>
            )}
            <div className="mz-grid-2">
              <button type="button" className="mz-btn mz-btn--sm mz-btn--amber-outline" onClick={() => setEditing({ kind: "move", move: MOVES.pay(d) })}>
                Record a payment
              </button>
              <button type="button" className="mz-btn mz-btn--sm mz-btn--ghost" onClick={() => setEditing({ kind: "move", move: MOVES.borrow(d) })}>
                Borrowed more
              </button>
            </div>
          </article>
        );
      })}
      {owe.length === 0 && <div className="mz-empty">No debts. Keep it that way.</div>}

      <span className="mz-section-label" style={{ marginTop: 6 }}>
        Credit I gave
      </span>
      {lent.map((d) => {
        const remaining = remainingOf(d);
        const late = d.target_on && d.target_on < today && remaining > 0;
        const mine = isSelfLoan(d);
        return (
          <article key={d.id} className="mz-card">
            <div className="mz-row-between" style={{ alignItems: "flex-start" }}>
              {editButton(d, `${mine ? "taken for my own use" : "lent"} ${formatMinor(totalOf(d), d.currency)}${d.target_on ? ` · back by ${targetLabel(d.target_on, today).replace(/^End of /, "")}` : ""}`)}
              <span className={late ? "mz-pill mz-pill--amber" : remaining === 0 ? "mz-pill" : "mz-pill mz-pill--muted"}>
                {late ? "Late" : remaining === 0 ? "Paid back" : mine ? "To put back" : "Owes you"}
              </span>
            </div>
            {bigAmount(d, remaining, mine ? "to put back" : "owed to you")}
            <ProgressBar percent={sharePercent(paidOf(d), totalOf(d))} label={`${d.counterparty} paid back`} />
            <div className="mz-grid-2">
              <button type="button" className="mz-btn mz-btn--sm mz-btn--secondary" onClick={() => setEditing({ kind: "move", move: MOVES.received(d) })}>
                {mine ? "Put money back" : "Money received"}
              </button>
              <button type="button" className="mz-btn mz-btn--sm mz-btn--ghost" onClick={() => setEditing({ kind: "move", move: MOVES.lend(d) })}>
                {mine ? "Take more" : "Lend more"}
              </button>
            </div>
          </article>
        );
      })}
      {lent.length === 0 && <div className="mz-empty">Nobody owes you money.</div>}

      <span className="mz-section-label" style={{ marginTop: 6 }}>
        Kept for others
      </span>
      {kept.map((d) => {
        const remaining = remainingOf(d);
        const place = where(d);
        return (
          <article key={d.id} className="mz-card">
            <div className="mz-row-between" style={{ alignItems: "flex-start" }}>
              {editButton(d, `${place ? `in ${place}` : "account not set"}${d.target_on ? ` · give back by ${targetLabel(d.target_on, today).replace(/^End of /, "")}` : ""}`)}
              <span className="mz-pill mz-pill--muted">not yours</span>
            </div>
            {bigAmount(d, remaining, `of ${d.counterparty}'s money`)}
            <span className="mz-small mz-muted">Left out of your net position and your savings.</span>
            <div className="mz-grid-2">
              <button type="button" className="mz-btn mz-btn--sm mz-btn--secondary" onClick={() => setEditing({ kind: "move", move: MOVES.keep(d) })}>
                They gave more
              </button>
              <button type="button" className="mz-btn mz-btn--sm mz-btn--ghost" onClick={() => setEditing({ kind: "move", move: MOVES.giveBack(d) })}>
                Give back
              </button>
            </div>
          </article>
        );
      })}
      {kept.length === 0 && <div className="mz-empty">You are not keeping money for anyone.</div>}

      {gifts.map((g) => (
        <button key={g.id} type="button" className="mz-card mz-card--sm mz-card--row" onClick={() => setEditing({ kind: "debt", row: g })}>
          <span className="mz-row__main" style={{ gap: 2 }}>
            <span className="mz-row__title">{g.counterparty}</span>
            <span className="mz-row__sub">{formatMinor(g.principal_minor, g.currency)} · a gift, not a debt</span>
          </span>
          <span className="mz-small mz-dim">no repayment</span>
        </button>
      ))}
      {settled.length > 0 && (
        <details className="mz-details">
          <summary className="mz-section-label">Settled ({settled.length})</summary>
          <div className="mz-stack">
            {settled.map((d) => (
              <button key={d.id} type="button" className="mz-card mz-card--sm mz-card--row mz-card--dashed" onClick={() => setEditing({ kind: "debt", row: d })}>
                <span className="mz-row__title">{d.counterparty}</span>
                <span className="mz-small mz-pos">settled</span>
              </button>
            ))}
          </div>
        </details>
      )}
      <button type="button" className="mz-btn mz-btn--md mz-btn--ghost" onClick={() => setEditing({ kind: "debt", row: null })}>
        + Add person: debt, credit, money kept or gift
      </button>

      <span className="mz-section-label" style={{ marginTop: 6 }}>
        Goals
      </span>
      {liveGoals.map((g) => {
        const saved = goalProgress[g.id]?.saved_minor ?? 0;
        const monthly = monthlyFromSalary(s, rules, "goal_id", g.id);
        const o = goalOutlook(saved, g.target_minor, monthly);
        return (
          <article key={g.id} className="mz-card">
            <button type="button" className="mz-row-between" style={{ background: "none", border: 0, padding: 0, color: "inherit", width: "100%" }} onClick={() => setEditing({ kind: "goal", row: g })}>
              <span className="mz-strong" style={{ fontSize: 14 }}>
                {g.name}
              </span>
              <span className="mz-num mz-muted" style={{ fontSize: 13 }}>
                <Money minor={saved} symbol={false} /> / {g.target_minor ? formatMinor(g.target_minor, "ETB", { symbol: false }) : "no target yet"}
              </span>
            </button>
            <ProgressBar percent={o.percent} label={`${g.name} progress`} />
            <span className="mz-small mz-muted">
              {o.reached
                ? "Reached."
                : o.paydaysRemaining !== null
                  ? `About ${o.paydaysRemaining} more ${o.paydaysRemaining === 1 ? "payday" : "paydays"} at ${formatMinor(monthly)}`
                  : g.notes ?? (monthly > 0 ? `${formatMinor(monthly)} per payday` : "No payday rule feeds it yet")}
            </span>
            {g.account_id && (
              <button type="button" className="mz-link-btn" style={{ alignSelf: "flex-start" }} onClick={() => setEditing({ kind: "deposit", goal: g })}>
                Add money
              </button>
            )}
          </article>
        );
      })}
      {planned.map((g) => (
        <button key={g.id} type="button" className="mz-card mz-card--sm mz-card--row mz-card--dashed" onClick={() => setEditing({ kind: "goal", row: g })}>
          <span className="mz-row__main" style={{ gap: 2 }}>
            <span className="mz-row__title">{g.name}</span>
            {g.notes && <span className="mz-row__sub">{g.notes}</span>}
          </span>
          <span className="mz-muted" style={{ fontSize: 13 }}>
            Planned
          </span>
        </button>
      ))}
      {archivedGoals.length > 0 && (
        <details className="mz-details">
          <summary className="mz-section-label">Archived ({archivedGoals.length})</summary>
          <div className="mz-stack">
            {archivedGoals.map((g) => (
              <button key={g.id} type="button" className="mz-card mz-card--sm mz-card--dashed" onClick={() => setEditing({ kind: "goal", row: g })}>
                {g.name}
              </button>
            ))}
          </div>
        </details>
      )}
      <button type="button" className="mz-btn mz-btn--md mz-btn--ghost" onClick={() => setEditing({ kind: "goal", row: null })}>
        + Add goal
      </button>

      <Sheet open={editing?.kind === "debt"} title={editing?.kind === "debt" && editing.row ? `Edit ${editing.row.counterparty}` : "New person"} onClose={() => setEditing(null)}>
        {editing?.kind === "debt" && (
          <DebtForm
            key={editing.row?.id ?? "new"}
            initial={editing.row ?? undefined}
            accounts={accounts}
            institutions={institutions}
            onSubmit={(v, move) => saveDebt(editing.row?.id ?? null, v, move)}
            onDelete={editing.row ? () => removeDebt(editing.row as Debt) : undefined}
          />
        )}
      </Sheet>
      <Sheet open={editing?.kind === "goal"} title={editing?.kind === "goal" && editing.row ? "Edit goal" : "New goal"} onClose={() => setEditing(null)}>
        {editing?.kind === "goal" && (
          <GoalForm
            key={editing.row?.id ?? "new"}
            accounts={accounts}
            institutions={institutions}
            initial={editing.row ?? undefined}
            onSubmit={(v) => saveGoal(editing.row?.id ?? null, v as Record<string, unknown>)}
            onDelete={editing.row ? () => removeGoal(editing.row as Goal) : undefined}
          />
        )}
      </Sheet>
      <Sheet open={editing?.kind === "move"} title={editing?.kind === "move" ? editing.move.title : ""} onClose={() => setEditing(null)}>
        {editing?.kind === "move" && (
          <MoneyMoveForm
            direction={editing.move.kind === "income" ? "in" : "out"}
            currency={editing.move.debt.currency}
            submitLabel={editing.move.submit}
            defaultAmount={editing.move.debt.direction === "i_owe" && editing.move.kind === "expense" ? monthlyFromSalary(s, rules, "debt_id", editing.move.debt.id) : 0}
            preferAccount={editing.move.debt.account_id}
            preferRole={editing.move.debt.direction === "i_owe" ? "debt_fund" : undefined}
            onSubmit={async ({ amount, accountId, date, note }) => {
              const { debt, kind } = editing.move;
              // repayments of my own debt keep the debt-payment category; other people's money stays uncategorised
              const cat = debt.direction === "i_owe" && kind === "expense" ? data.categories.find((c) => c.kind === "expense" && c.category_group === "debt" && !c.is_archived) : undefined;
              await insertRow("transactions", {
                kind,
                account_id: accountId,
                amount_minor: amount,
                category_id: cat?.id ?? null,
                debt_id: debt.id,
                occurred_on: date,
                note: note || debt.counterparty,
                source: "debt",
              });
              await reload();
              setEditing(null);
              toast(editing.move.done);
            }}
          />
        )}
      </Sheet>
      <Sheet open={editing?.kind === "deposit"} title={editing?.kind === "deposit" ? `Add to ${editing.goal.name}` : ""} onClose={() => setEditing(null)}>
        {editing?.kind === "deposit" && editing.goal.account_id && (
          <MoneyMoveForm
            direction="out"
            currency={accounts.find((a) => a.id === editing.goal.account_id)?.currency ?? s.base_currency}
            submitLabel="Move money"
            excludeAccount={editing.goal.account_id}
            toLabel={accountLabel(accounts.find((a) => a.id === editing.goal.account_id), institutions)}
            onSubmit={async ({ amount, accountId, date, note }) => {
              await insertRow("transactions", {
                kind: "transfer",
                account_id: accountId,
                to_account_id: editing.goal.account_id,
                amount_minor: amount,
                goal_id: editing.goal.id,
                occurred_on: date,
                note: note || editing.goal.name,
              });
              await reload();
              setEditing(null);
              showVerdict(savingVerdict("saved", amount, s.base_currency, `${editing.goal.id}|${amount}`));
            }}
          />
        )}
      </Sheet>
    </main>
  );
}

function MoneyMoveForm({
  direction,
  currency,
  submitLabel,
  defaultAmount = 0,
  preferAccount,
  preferRole,
  excludeAccount,
  toLabel,
  onSubmit,
}: {
  /** in: money arrives in the account · out: money leaves it */
  direction: "in" | "out";
  currency: string;
  submitLabel: string;
  defaultAmount?: number;
  preferAccount?: string | null;
  preferRole?: string;
  excludeAccount?: string;
  toLabel?: string;
  onSubmit: (v: { amount: number; accountId: string; date: string; note: string }) => Promise<void>;
}) {
  const { data } = useMz();
  const accounts = (data?.accounts ?? []).filter((a) => !a.is_archived && a.id !== excludeAccount && a.currency === currency);
  const [amount, setAmount] = useState(defaultAmount ? minorToInput(defaultAmount) : "");
  const [accountId, setAccountId] = useState(
    accounts.find((a) => a.id === preferAccount)?.id ?? accounts.find((a) => a.role === preferRole)?.id ?? accounts[0]?.id ?? "",
  );
  const [date, setDate] = useState(todayISO());
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!data) return null;
  return (
    <form
      className="mz-form"
      onSubmit={async (e) => {
        e.preventDefault();
        const m = parseAmount(amount);
        if (!m) return setError("Enter the amount.");
        if (!accountId) return setError(`Choose a ${currency} account.`);
        setSaving(true);
        setError(null);
        try {
          await onSubmit({ amount: m, accountId, date, note: note.trim() });
        } catch (err) {
          setError(friendlyError(err));
        } finally {
          setSaving(false);
        }
      }}
    >
      <AmountField label="Amount" value={amount} currency={currency} onChange={(t) => setAmount(t)} />
      <label className="mz-field">
        {direction === "in" ? "Into" : "From"}
        <select className="mz-select" value={accountId} onChange={(e) => setAccountId(e.target.value)}>
          {accounts.length === 0 && <option value="">No {currency} account</option>}
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {accountLabel(a, data.institutions)}
            </option>
          ))}
        </select>
      </label>
      {toLabel && <p className="mz-note">Moves to {toLabel}.</p>}
      <label className="mz-field">
        Date
        <input className="mz-input" type="date" value={date} max={todayISO()} onChange={(e) => setDate(e.target.value || todayISO())} />
      </label>
      <label className="mz-field">
        Note
        <input className="mz-input" value={note} maxLength={300} onChange={(e) => setNote(e.target.value)} />
      </label>
      <ErrorLine text={error} />
      <button type="submit" className="mz-btn" disabled={saving}>
        {saving ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}
