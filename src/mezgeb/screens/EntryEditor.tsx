"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CategoryForm } from "../components/forms";
import { BackspaceIcon, ClockIcon, CloseIcon } from "../components/Icons";
import { ErrorLine, Money, Sheet, Tabs, useToast } from "../components/ui";
import { useVerdict } from "../components/Verdict";
import { deleteRow, insertRow, saveRow } from "../lib/db";
import { todayISO } from "../lib/dates";
import { accountLabel, isSavingAccount } from "../lib/derive";
import { expenseVerdict, savingVerdict } from "../lib/insights";
import { currencySymbol, formatMinor, hoursPhrase, minorToInput, parseAmount } from "../lib/money";
import { useMz } from "../lib/store";
import { friendlyError } from "../lib/supabase";
import type { Account, Category, Transaction, TxKind } from "../lib/types";

type Props = {
  editing?: Transaction | null;
  onClose: () => void;
  onSaved?: (kind: "saved" | "wish" | "deleted") => void;
  /** title area: "page" shows the design's close button header */
  initialKind?: TxKind;
};

const MAX_WHOLE_DIGITS = 12;

function displayAmount(text: string): string {
  if (!text) return "0";
  const [whole, frac] = text.split(".");
  const grouped = (whole || "0").replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return frac === undefined ? grouped : `${grouped}.${frac}`;
}

function defaultAccount(accounts: Account[], kind: TxKind): string {
  const active = accounts.filter((a) => !a.is_archived);
  const pick = (role: Account["role"]) => active.find((a) => a.role === role)?.id;
  if (kind === "income") return pick("salary_inbox") ?? active[0]?.id ?? "";
  if (kind === "transfer") return pick("salary_inbox") ?? active[0]?.id ?? "";
  return pick("spending") ?? active[0]?.id ?? "";
}

export function EntryEditor({ editing, onClose, onSaved, initialKind = "expense" }: Props) {
  const { data, reload } = useMz();
  const toast = useToast();
  const showVerdict = useVerdict();
  const accounts = useMemo(() => data?.accounts ?? [], [data]);
  const categories = useMemo(() => data?.categories ?? [], [data]);
  const s = data?.settings;

  const [kind, setKind] = useState<TxKind>(editing?.kind ?? initialKind);
  const [text, setText] = useState(editing ? minorToInput(editing.amount_minor) : "");
  const [categoryId, setCategoryId] = useState<string | null>(editing?.category_id ?? null);
  const [accountId, setAccountId] = useState(editing?.account_id ?? defaultAccount(accounts, initialKind));
  const [toAccountId, setToAccountId] = useState(editing?.to_account_id ?? "");
  const [isWant, setWant] = useState(editing?.is_want ?? false);
  const [date, setDate] = useState(editing?.occurred_on ?? todayISO());
  const [note, setNote] = useState(editing?.note ?? "");
  const [goalId, setGoalId] = useState(editing?.goal_id ?? "");
  const [picking, setPicking] = useState<"from" | "to" | null>(null);
  const [newCategory, setNewCategory] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const readOnly = editing && (editing.source === "payday" || editing.source === "trading");
  const amount = parseAmount(text) ?? 0;
  const from = accounts.find((a) => a.id === accountId);
  const to = accounts.find((a) => a.id === toAccountId);
  const currency = from?.currency ?? "ETB";
  const hours = kind === "expense" && s ? hoursPhrase(amount, s.net_salary_minor, s.work_hours_per_month) : null;
  const chips = categories.filter((c) => c.kind === (kind === "income" ? "income" : "expense") && (!c.is_archived || c.id === categoryId));

  function switchKind(k: TxKind) {
    setKind(k);
    setCategoryId(null);
    setWant(false);
    setError(null);
    if (!editing) setAccountId(defaultAccount(accounts, k));
    if (k === "transfer" && !toAccountId) setToAccountId(accounts.find((a) => !a.is_archived && a.role === "spending")?.id ?? "");
  }

  function chooseCategory(c: Category) {
    const next = c.id === categoryId ? null : c.id;
    setCategoryId(next);
    if (next && kind === "expense") setWant(!c.is_need);
  }

  const press = useCallback((key: string) => {
    setError(null);
    setText((t) => {
      if (key === "back") return t.slice(0, -1);
      if (key === ".") return t.includes(".") ? t : (t || "0") + ".";
      const [whole, frac] = t.split(".");
      if (frac !== undefined && frac.length >= 2) return t;
      if (frac === undefined && whole.length >= MAX_WHOLE_DIGITS) return t;
      if (t === "0") return key;
      return t + key;
    });
  }, []);

  // A hardware keyboard works too (when no text field has focus).
  useEffect(() => {
    if (readOnly) return;
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (el.closest("input, textarea, select, [role=dialog]")) return;
      if (/^[0-9]$/.test(e.key)) press(e.key);
      else if (e.key === "." || e.key === ",") press(".");
      else if (e.key === "Backspace") press("back");
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [press, readOnly]);

  function validate(): string | null {
    if (amount <= 0) return "Enter an amount.";
    if (!from) return "Choose an account.";
    if (kind === "transfer") {
      if (!to) return "Choose where the money goes.";
      if (to.id === from.id) return "Pick two different accounts.";
      if (to.currency !== from.currency) return "A transfer must stay in one currency.";
    }
    return null;
  }

  async function save() {
    const problem = validate();
    if (problem) return setError(problem);
    setSaving(true);
    setError(null);
    // Judged on the data from before this entry, so "spent today" does not count it twice.
    const verdict =
      editing || !data
        ? null
        : kind === "expense"
          ? expenseVerdict(data, { amount, date, categoryId, accountId })
          : kind === "transfer" && to && isSavingAccount(to) && !(from && isSavingAccount(from))
            ? savingVerdict("saved", amount, currency, `${toAccountId}|${amount}`)
            : null;
    try {
      await saveRow<Transaction>("transactions", editing?.id, {
        kind,
        amount_minor: amount,
        account_id: accountId,
        to_account_id: kind === "transfer" ? toAccountId : null,
        category_id: kind === "transfer" ? null : categoryId,
        is_want: kind === "expense" ? isWant : false,
        occurred_on: date,
        note: note.trim() || null,
        goal_id: kind !== "expense" && goalId ? goalId : editing?.goal_id ?? null,
      });
      await reload();
      toast(editing ? "Entry updated." : `${kind === "expense" ? "Expense" : kind === "income" ? "Income" : "Transfer"} saved.`);
      if (verdict) showVerdict(verdict);
      onSaved?.("saved");
      if (!editing) {
        setText("");
        setNote("");
        setCategoryId(null);
        setWant(false);
      }
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setSaving(false);
    }
  }

  async function waitInstead() {
    if (amount <= 0) return setError("Enter an amount first.");
    const name = note.trim() || categories.find((c) => c.id === categoryId)?.name || "A want";
    setSaving(true);
    try {
      await insertRow("wishes", { name: name.slice(0, 80), amount_minor: amount });
      await reload();
      toast("Added to the wishlist. Decide in 48 hours.");
      onSaved?.("wish");
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!editing || !window.confirm("Delete this entry?")) return;
    setSaving(true);
    try {
      await deleteRow("transactions", editing.id);
      await reload();
      toast("Entry deleted.");
      onSaved?.("deleted");
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setSaving(false);
    }
  }

  if (!data || !s) return null;
  const pickable = accounts.filter((a) => !a.is_archived || a.id === accountId || a.id === toAccountId);
  const goals = data.goals.filter((g) => g.status !== "archived");

  return (
    <div className="mz-page mz-page--full" style={{ gap: 14 }}>
      <header className="mz-head">
        <button type="button" aria-label="Close" className="mz-icon-btn" onClick={onClose}>
          <CloseIcon />
        </button>
        <h1 className="mz-display" style={{ fontWeight: 600, fontSize: 17 }}>
          {editing ? "Edit entry" : "Add entry"}
        </h1>
        <span className="mz-head__spacer" />
      </header>

      {readOnly ? (
        <div className="mz-empty">
          {editing?.source === "payday"
            ? "This transfer was made by the payday split. Untick it on the payday screen to undo it."
            : "This entry belongs to a trip. Change the trip's goods, costs or sales on the Trading screen and it updates by itself."}
        </div>
      ) : (
        <Tabs
          label="Entry type"
          value={kind}
          onChange={switchKind}
          options={[
            { value: "expense", label: "Expense" },
            { value: "income", label: "Income" },
            { value: "transfer", label: "Transfer" },
          ]}
        />
      )}

      <div className="mz-amount" aria-live="polite">
        <div className={`mz-amount__value${text ? "" : " is-empty"}`} aria-label={`Amount ${formatMinor(amount, currency)}`}>
          {displayAmount(text)} <small>{currencySymbol(currency)}</small>
        </div>
        {hours && amount > 0 && <span className="mz-pill mz-pill--hours">= {hours} of your work</span>}
      </div>

      {kind !== "transfer" && !readOnly && (
        <div className="mz-chips" role="group" aria-label="Category">
          {chips.map((c) => (
            <button key={c.id} type="button" className="mz-chip" aria-pressed={c.id === categoryId} onClick={() => chooseCategory(c)}>
              {c.name}
            </button>
          ))}
          <button type="button" className="mz-chip mz-chip--dashed" onClick={() => setNewCategory(true)}>
            + New
          </button>
        </div>
      )}

      <div className="mz-picker">
        <button type="button" className="mz-picker__row" onClick={() => !readOnly && setPicking("from")} disabled={Boolean(readOnly)}>
          <span>{kind === "income" ? "Into" : "From"}</span>
          <span className="mz-truncate">
            {accountLabel(from, data.institutions)}{" "}
            {from && (
              <span className="mz-dim">
                (<Money minor={data.balances[from.id] ?? 0} currency={from.currency} symbol={false} protect={from.is_protected} /> left)
              </span>
            )}
          </span>
        </button>
        {kind === "transfer" && (
          <button type="button" className="mz-picker__row" onClick={() => !readOnly && setPicking("to")} disabled={Boolean(readOnly)}>
            <span>To</span>
            <span className="mz-truncate">{to ? accountLabel(to, data.institutions) : "Choose account"}</span>
          </button>
        )}
        {kind === "expense" && !readOnly && (
          <button type="button" className="mz-picker__row" onClick={() => setWant((w) => !w)} aria-label={`Kind: ${isWant ? "want" : "need"}. Tap to switch.`}>
            <span>Kind</span>
            <span>{isWant ? "Want, not need" : "Need"}</span>
          </button>
        )}
        <label className="mz-picker__row" style={{ cursor: "text" }}>
          <span>Date</span>
          <input
            type="date"
            value={date}
            max={todayISO()}
            disabled={Boolean(readOnly)}
            onChange={(e) => setDate(e.target.value || todayISO())}
            style={{ background: "transparent", border: 0, color: "var(--mz-text)", textAlign: "right", fontSize: 14, padding: 0 }}
          />
        </label>
        <label className="mz-picker__row" style={{ cursor: "text" }}>
          <span>Note</span>
          <input
            value={note}
            maxLength={300}
            placeholder="Optional"
            disabled={Boolean(readOnly)}
            onChange={(e) => setNote(e.target.value)}
            style={{ background: "transparent", border: 0, color: "var(--mz-text)", textAlign: "right", fontSize: 14, padding: 0, minWidth: 0, flex: 1 }}
          />
        </label>
        {kind !== "expense" && goals.length > 0 && !readOnly && (
          <label className="mz-picker__row">
            <span>For goal</span>
            <select
              value={goalId}
              onChange={(e) => setGoalId(e.target.value)}
              style={{ background: "transparent", border: 0, color: "var(--mz-text)", textAlign: "right", fontSize: 14 }}
            >
              <option value="">None</option>
              {goals.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      {kind === "expense" && isWant && !editing && (
        <button type="button" className="mz-want" onClick={waitInstead} disabled={saving}>
          <ClockIcon />
          It is a want. Wait 48 hours instead?
        </button>
      )}

      <ErrorLine text={error} />

      {!readOnly && (
        <div className="mz-keypad mz-push" aria-label="Keypad" role="group">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0"].map((k) => (
            <button key={k} type="button" onClick={() => press(k)} aria-label={k === "." ? "Decimal point" : k}>
              {k}
            </button>
          ))}
          <button type="button" aria-label="Delete digit" onClick={() => press("back")}>
            <BackspaceIcon />
          </button>
        </div>
      )}
      {!readOnly && (
        <button type="button" className="mz-btn mz-btn--tall" onClick={save} disabled={saving}>
          {saving ? "Saving…" : editing ? "Save changes" : `Save ${kind}`}
        </button>
      )}
      {editing && editing.source !== "payday" && editing.source !== "trading" && (
        <button type="button" className="mz-btn mz-btn--md mz-btn--amber-quiet" onClick={remove} disabled={saving}>
          Delete entry
        </button>
      )}

      <Sheet open={picking !== null} title={picking === "to" ? "Move to" : kind === "income" ? "Into account" : "From account"} onClose={() => setPicking(null)}>
        <div className="mz-list">
          {pickable.map((a) => (
            <button
              key={a.id}
              type="button"
              className="mz-row"
              aria-pressed={(picking === "to" ? toAccountId : accountId) === a.id}
              onClick={() => {
                if (picking === "to") setToAccountId(a.id);
                else setAccountId(a.id);
                setPicking(null);
              }}
            >
              <span className="mz-row__main">
                <span className="mz-row__title">{accountLabel(a, data.institutions)}</span>
                {a.notes && <span className="mz-row__sub">{a.notes}</span>}
              </span>
              <span className="mz-row__value mz-row__value--sm">
                <Money minor={data.balances[a.id] ?? 0} currency={a.currency} symbol={false} protect={a.is_protected} />
              </span>
            </button>
          ))}
        </div>
      </Sheet>

      <Sheet open={newCategory} title={`New ${kind === "income" ? "income" : "expense"} category`} onClose={() => setNewCategory(false)}>
        <CategoryForm
          fixedKind={kind === "income" ? "income" : "expense"}
          onSubmit={async (v) => {
            const row = await insertRow<Category>("categories", v as Record<string, unknown>);
            await reload();
            setCategoryId(row.id);
            if (kind === "expense") setWant(!row.is_need);
            setNewCategory(false);
          }}
        />
      </Sheet>
    </div>
  );
}
