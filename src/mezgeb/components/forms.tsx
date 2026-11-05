"use client";

// Entity forms shared by the first-run wizard (saves into local drafts) and the
// management screens (saves to the database). Each form keeps the typed text
// and hands back column values with money already in minor units.

import { useState, type FormEvent } from "react";
import { accountLabel } from "../lib/derive";
import { formatBp, formatMinor, minorToInput, parseAmount, parsePercentToBp, percentNumberToBp, type Minor } from "../lib/money";
import { SELF_NAME, isSelfLoan, openingForRealBalance } from "../lib/position";
import { friendlyError } from "../lib/supabase";
import {
  DIRECTION_LABEL,
  GROUP_LABEL,
  INSTITUTION_KIND_LABEL,
  PROTECTED_ROLES,
  ROLE_LABEL,
  SAVING_ROLES,
  type Account,
  type AccountRole,
  type Category,
  type CategoryGroup,
  type City,
  type Debt,
  type DebtDirection,
  type Goal,
  type GoalKind,
  type GoalStatus,
  type Institution,
  type InstitutionKind,
  type PaydayRule,
  type RuleKind,
  type TradeItem,
} from "../lib/types";
import { AmountField, ErrorLine, FormActions, SelectField, SwitchRow, Tabs, TextField } from "./ui";

type Common<T> = {
  initial?: Partial<T>;
  onSubmit: (values: Partial<T>) => Promise<void> | void;
  onArchive?: () => void;
  onDelete?: () => void;
  archiveLabel?: string;
};

function useSubmit<T>(onSubmit: Common<T>["onSubmit"]) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function run(e: FormEvent, build: () => Partial<T> | string) {
    e.preventDefault();
    const values = build();
    if (typeof values === "string") {
      setError(values);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSubmit(values);
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setSaving(false);
    }
  }
  return { saving, error, setError, run };
}

const CURRENCY_OPTIONS = ["ETB", "USD", "EUR"];

/* ── Institution (bank, wallet) ── */

export const BADGE_COLORS = [
  { value: "#E6CCFF", label: "Lilac" },
  { value: "#A9DBFF", label: "Sky" },
  { value: "#9FE7F0", label: "Teal" },
  { value: "#B8F0C8", label: "Mint" },
  { value: "#FFD991", label: "Gold" },
  { value: "#FFB8A8", label: "Coral" },
  { value: "#C4F06A", label: "Lime" },
  { value: "#A3B1AA", label: "Grey" },
];

export function InstitutionForm({ initial, onSubmit, onArchive, onDelete, archiveLabel }: Common<Institution>) {
  const [name, setName] = useState(initial?.name ?? "");
  const [label, setLabel] = useState(initial?.short_label ?? "");
  const [kind, setKind] = useState<InstitutionKind>(initial?.kind ?? "bank");
  const [color, setColor] = useState(initial?.color ?? BADGE_COLORS[0].value);
  const { saving, error, run } = useSubmit(onSubmit);
  return (
    <form
      className="mz-form"
      onSubmit={(e) =>
        run(e, () => {
          if (!name.trim()) return "Give it a name.";
          const short = (label.trim() || name.trim().slice(0, 4)).slice(0, 6);
          return { name: name.trim(), short_label: short, kind, color };
        })
      }
    >
      <TextField label="Name" value={name} onChange={setName} placeholder="Commercial Bank of Ethiopia" maxLength={80} />
      <TextField label="Short label (badge)" value={label} onChange={setLabel} placeholder="CBE" maxLength={6} hint="Up to 6 letters, shown on the badge." />
      <SelectField
        label="Kind"
        value={kind}
        onChange={setKind}
        options={(Object.keys(INSTITUTION_KIND_LABEL) as InstitutionKind[]).map((k) => ({ value: k, label: INSTITUTION_KIND_LABEL[k] }))}
      />
      <fieldset className="mz-field" style={{ border: 0, padding: 0, margin: 0 }}>
        <legend style={{ marginBottom: 6 }}>Badge colour</legend>
        <div className="mz-chips" role="radiogroup" aria-label="Badge colour">
          {BADGE_COLORS.map((c) => (
            <button
              key={c.value}
              type="button"
              role="radio"
              aria-checked={color === c.value}
              aria-label={c.label}
              className="mz-chip"
              onClick={() => setColor(c.value)}
            >
              <span className="mz-badge" style={{ ["--badge" as string]: c.value, width: 22, height: 22, borderRadius: 7, fontSize: 9 }}>
                {(label || name || "Ab").slice(0, 3)}
              </span>
              {c.label}
            </button>
          ))}
        </div>
      </fieldset>
      <ErrorLine text={error} />
      <FormActions saving={saving} onArchive={onArchive} archiveLabel={archiveLabel} onDelete={onDelete} />
    </form>
  );
}

/* ── Account ── */

export function AccountForm({
  initial,
  institutions,
  currentBalance,
  onSubmit,
  onArchive,
  onDelete,
  archiveLabel,
}: Common<Account> & {
  institutions: Institution[];
  /** balance Mezgeb shows now (existing accounts): enables "Real balance now", which corrects the opening balance */
  currentBalance?: Minor;
}) {
  const [institutionId, setInstitutionId] = useState(initial?.institution_id ?? institutions[0]?.id ?? "");
  const [name, setName] = useState(initial?.name ?? "");
  const [role, setRole] = useState<AccountRole>(initial?.role ?? "spending");
  const [currency, setCurrency] = useState(initial?.currency ?? "ETB");
  const [opening, setOpening] = useState(initial?.opening_balance_minor !== undefined ? minorToInput(initial.opening_balance_minor) : "0");
  const [openingMinor, setOpeningMinor] = useState<Minor | null>(initial?.opening_balance_minor ?? 0);
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [realText, setRealText] = useState("");
  const [realMinor, setRealMinor] = useState<Minor | null>(null);
  // "Real balance now": keep every entry and move the opening balance so the account shows the real amount
  const fixedOpening =
    currentBalance !== undefined && realText.trim() && realMinor !== null ? openingForRealBalance(initial?.opening_balance_minor ?? 0, currentBalance, realMinor) : null;
  const [isProtected, setProtected] = useState(initial?.is_protected ?? false);
  const [archived, setArchived] = useState(initial?.is_archived ?? false);
  // null = follow the role; true / false once chosen here
  const [savingFlag, setSavingFlag] = useState<boolean | null>(initial?.counts_as_saving ?? null);
  const countsAsSaving = savingFlag ?? SAVING_ROLES.includes(role);
  const { saving, error, run } = useSubmit(onSubmit);
  const currencies = Array.from(new Set([...CURRENCY_OPTIONS, currency]));
  return (
    <form
      className="mz-form"
      onSubmit={(e) =>
        run(e, () => {
          if (!name.trim()) return "Give the account a name.";
          if (openingMinor === null) return "The opening balance is not a valid amount.";
          if (realText.trim() && realMinor === null) return "The real balance is not a valid amount.";
          return {
            institution_id: institutionId || null,
            name: name.trim(),
            role,
            currency,
            opening_balance_minor: fixedOpening ?? openingMinor,
            notes: notes.trim() || null,
            is_protected: isProtected || PROTECTED_ROLES.includes(role),
            is_archived: archived,
            ...(savingFlag !== null ? { counts_as_saving: savingFlag } : {}),
          };
        })
      }
    >
      <SelectField
        label="Bank or wallet"
        value={institutionId}
        onChange={setInstitutionId}
        options={[...institutions.filter((i) => !i.is_archived || i.id === institutionId).map((i) => ({ value: i.id, label: i.name })), { value: "", label: "None (cash, other)" }]}
      />
      <TextField label="Account name" value={name} onChange={setName} placeholder="Salary inbox" maxLength={80} hint="Never put account numbers here." />
      <SelectField
        label="Role"
        value={role}
        onChange={(r) => {
          setRole(r);
          if (PROTECTED_ROLES.includes(r)) setProtected(true);
          if (r === "usd") setCurrency("USD");
        }}
        options={(Object.keys(ROLE_LABEL) as AccountRole[]).map((r) => ({ value: r, label: ROLE_LABEL[r] }))}
      />
      <SelectField label="Currency" value={currency} onChange={setCurrency} options={currencies.map((c) => ({ value: c, label: c }))} />
      <AmountField
        label="Opening balance"
        value={opening}
        signed
        currency={currency}
        onChange={(t, m) => {
          setOpening(t);
          setOpeningMinor(t.trim() === "" ? 0 : m);
        }}
        hint="What the account held before the first entry you recorded in Mezgeb."
      />
      {currentBalance !== undefined && (
        <AmountField
          label="Real balance now (optional)"
          value={realText}
          signed
          currency={currency}
          onChange={(t, m) => {
            setRealText(t);
            setRealMinor(t.trim() === "" ? null : m);
          }}
          hint={
            fixedOpening !== null
              ? `Mezgeb shows ${formatMinor(currentBalance, currency)}. Saving sets the opening balance to ${formatMinor(fixedOpening, currency)}, so it shows ${formatMinor(realMinor ?? 0, currency)}. Every entry stays.`
              : "What your bank or wallet app shows right now. Mezgeb corrects the opening balance to match and keeps every entry."
          }
        />
      )}
      <TextField label="Purpose line" value={notes} onChange={setNotes} placeholder="Taxi, airtime, fun · topped up weekly" maxLength={200} />
      <SwitchRow
        label="Protected"
        checked={isProtected || PROTECTED_ROLES.includes(role)}
        onChange={(v) => setProtected(v)}
        hint={PROTECTED_ROLES.includes(role) ? "Debt fund, emergency and savings accounts are always protected." : "The balance stays hidden until you tap it."}
      />
      <SwitchRow
        label="Counts as savings"
        checked={countsAsSaving}
        onChange={(v) => setSavingFlag(v)}
        hint="Its balance counts toward this year's savings. Emergency, savings and USD accounts count unless you turn it off."
      />
      <SwitchRow label="Archived (inactive or planned)" checked={archived} onChange={setArchived} />
      <ErrorLine text={error} />
      <FormActions saving={saving} onArchive={onArchive} archiveLabel={archiveLabel} onDelete={onDelete} />
    </form>
  );
}

/* ── Category ── */

export function CategoryForm({ initial, onSubmit, onArchive, onDelete, archiveLabel, fixedKind }: Common<Category> & { fixedKind?: "expense" | "income" }) {
  const [name, setName] = useState(initial?.name ?? "");
  const [kind, setKind] = useState<"expense" | "income">(fixedKind ?? initial?.kind ?? "expense");
  const [group, setGroup] = useState<CategoryGroup>(initial?.category_group ?? (kind === "income" ? "work" : "personal"));
  const [isNeed, setNeed] = useState(initial?.is_need ?? true);
  const { saving, error, run } = useSubmit(onSubmit);
  return (
    <form
      className="mz-form"
      onSubmit={(e) =>
        run(e, () => {
          if (!name.trim()) return "Give the category a name.";
          return { name: name.trim(), kind, category_group: group, is_need: kind === "income" ? true : isNeed };
        })
      }
    >
      {!fixedKind && !initial?.id && (
        <Tabs
          label="Kind"
          value={kind}
          onChange={(k) => {
            setKind(k);
            setGroup(k === "income" ? "work" : "personal");
          }}
          options={[
            { value: "expense", label: "Expense" },
            { value: "income", label: "Income" },
          ]}
        />
      )}
      <TextField label="Name" value={name} onChange={setName} placeholder={kind === "income" ? "Freelance" : "Eating out"} maxLength={60} />
      <SelectField
        label="Group"
        value={group}
        onChange={setGroup}
        options={(Object.keys(GROUP_LABEL) as CategoryGroup[]).map((g) => ({ value: g, label: GROUP_LABEL[g] }))}
        hint="Giving, trading and debt are left out of personal spending."
      />
      {kind === "expense" && <SwitchRow label="Usually a need" checked={isNeed} onChange={setNeed} hint="Wants are offered the 48-hour wait." />}
      <ErrorLine text={error} />
      <FormActions saving={saving} onArchive={onArchive} archiveLabel={archiveLabel} onDelete={onDelete} />
    </form>
  );
}

/* ── Payday rule ── */

export function RuleForm({
  initial,
  accounts,
  institutions,
  goals,
  debts,
  hasRemainder,
  onSubmit,
  onDelete,
}: Common<PaydayRule> & { accounts: Account[]; institutions: Institution[]; goals: Goal[]; debts: Debt[]; hasRemainder: boolean }) {
  const [name, setName] = useState(initial?.name ?? "");
  const [kind, setKind] = useState<RuleKind>(initial?.kind ?? "fixed");
  const [text, setText] = useState(
    initial?.kind === "percent_of_salary" ? formatBp(initial.value ?? 0).replace("%", "") : initial?.kind === "fixed" ? minorToInput(initial.value ?? 0) : "",
  );
  const active = accounts.filter((a) => !a.is_archived || a.id === initial?.target_account_id);
  const [target, setTarget] = useState(initial?.target_account_id ?? active[0]?.id ?? "");
  const [goalId, setGoalId] = useState(initial?.goal_id ?? "");
  const [debtId, setDebtId] = useState(initial?.debt_id ?? "");
  const [isActive, setActive] = useState(initial?.is_active ?? true);
  const { saving, error, run } = useSubmit(onSubmit);
  const remainderTaken = hasRemainder && initial?.kind !== "remainder";
  return (
    <form
      className="mz-form"
      onSubmit={(e) =>
        run(e, () => {
          if (!name.trim()) return "Give the rule a name.";
          if (!target) return "Choose where the money goes.";
          let value = 0;
          if (kind === "percent_of_salary") {
            const bp = parsePercentToBp(text);
            if (bp === null || bp === 0) return "Enter a percent between 0 and 100.";
            value = bp;
          } else if (kind === "fixed") {
            const m = parseAmount(text);
            if (m === null || m === 0) return "Enter the amount.";
            value = m;
          } else if (remainderTaken && isActive) return "Another active rule already takes the remainder.";
          return { name: name.trim(), kind, value, target_account_id: target, goal_id: goalId || null, debt_id: debtId || null, is_active: isActive };
        })
      }
    >
      <TextField label="Name" value={name} onChange={setName} placeholder="Emergency fund" maxLength={60} />
      <Tabs
        label="Rule type"
        value={kind}
        onChange={(k) => {
          setKind(k);
          setText("");
        }}
        options={[
          { value: "percent_of_salary", label: "Percent" },
          { value: "fixed", label: "Fixed" },
          { value: "remainder", label: "Remainder" },
        ]}
      />
      {kind === "percent_of_salary" && <TextField label="Percent of salary" value={text} onChange={setText} inputMode="decimal" placeholder="10" />}
      {kind === "fixed" && <AmountField label="Amount (Br)" value={text} onChange={(t) => setText(t)} />}
      {kind === "remainder" && (
        <p className="mz-note">{remainderTaken ? "Another active rule already takes the remainder. Turn that one off first." : "Takes whatever is left after the other rules."}</p>
      )}
      <SelectField
        label="Moves to"
        value={target}
        onChange={setTarget}
        options={active.map((a) => ({ value: a.id, label: accountLabel(a, institutions) }))}
      />
      <SelectField
        label="Counts toward goal"
        value={goalId}
        onChange={setGoalId}
        options={[{ value: "", label: "No goal" }, ...goals.filter((g) => g.status !== "archived").map((g) => ({ value: g.id, label: g.name }))]}
      />
      <SelectField
        label="Saves for debt"
        value={debtId}
        onChange={setDebtId}
        options={[{ value: "", label: "No debt" }, ...debts.filter((d) => d.direction === "i_owe" && d.status === "active").map((d) => ({ value: d.id, label: d.counterparty }))]}
        hint="Shows as the monthly amount on the debt. Record the payment itself when you pay."
      />
      <SwitchRow label="Active" checked={isActive} onChange={setActive} />
      <ErrorLine text={error} />
      <FormActions saving={saving} onDelete={onDelete} />
    </form>
  );
}

/* ── Person: debt I owe, credit I gave, money I keep, gift ── */

/** First money moving when a person is added (a loan given, money handed to me to keep). */
export type DebtMove = { amount: Minor; accountId: string; date: string };

export function DebtForm({
  initial,
  accounts,
  institutions = [],
  onSubmit,
  onDelete,
}: Omit<Common<Debt>, "onSubmit"> & {
  /** when given: pick where the money sits, and record the first amount moving now */
  accounts?: Account[];
  institutions?: Institution[];
  onSubmit: (values: Partial<Debt>, move: DebtMove | null) => Promise<void> | void;
}) {
  const [direction, setDirection] = useState<DebtDirection>(initial?.direction ?? "i_owe");
  const [self, setSelf] = useState(initial ? isSelfLoan({ direction: initial.direction ?? "i_owe", counterparty: initial.counterparty ?? "" }) : false);
  const [who, setWho] = useState(initial && !self ? (initial.counterparty ?? "") : "");
  const [amount, setAmount] = useState(initial?.principal_minor ? minorToInput(initial.principal_minor) : "");
  const [currency, setCurrency] = useState(initial?.currency ?? "ETB");
  const [accountId, setAccountId] = useState(initial?.account_id ?? "");
  const [moveAmount, setMoveAmount] = useState("");
  const [moveDate, setMoveDate] = useState(new Date().toISOString().slice(0, 10));
  const [started, setStarted] = useState(initial?.started_on ?? "");
  const [target, setTarget] = useState(initial?.target_on ?? "");
  const [priority, setPriority] = useState(String(initial?.priority ?? 1));
  const [paid, setPaid] = useState(initial?.status === "paid");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const flows = direction === "owed_to_me" || direction === "held_for_other";
  const forMe = self && direction === "owed_to_me";
  const isNew = !initial?.id;
  const usable = (accounts ?? []).filter((a) => (!a.is_archived || a.id === accountId) && a.currency === currency);
  const words = {
    i_owe: { amount: "Amount I borrowed", by: "Pay off by" },
    owed_to_me: self
      ? { amount: "Already taken (not recorded yet)", by: "Put back by" }
      : { amount: "Already lent before Mezgeb", by: "Pay back by" },
    held_for_other: { amount: "Already kept before Mezgeb", by: "Give back by" },
    gift_received: { amount: "Amount", by: "" },
  }[direction];

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!forMe && !who.trim()) return setError("Who is it with?");
    if (!forMe && isSelfLoan({ direction, counterparty: who })) return setError("For money you took yourself, turn on “I took it for myself”.");
    const principal = amount.trim() ? parseAmount(amount) : 0;
    if (principal === null) return setError("The amount is not valid.");
    let move: DebtMove | null = null;
    if (flows && isNew && accounts && moveAmount.trim()) {
      const m = parseAmount(moveAmount);
      if (!m) return setError("The amount moving now is not valid.");
      const from = accountId || usable[0]?.id;
      if (!from) return setError(`Add a ${currency} account first.`);
      move = { amount: m, accountId: from, date: moveDate };
    }
    if (!flows && !principal) return setError("Enter the amount.");
    if (flows && !principal && !move && isNew) return setError("Enter how much moves now, or what was already outstanding.");
    const p = Number(priority);
    if (!Number.isInteger(p) || p < 1 || p > 99) return setError("Priority is a number from 1 (first).");
    setSaving(true);
    setError(null);
    try {
      await onSubmit(
        {
          counterparty: forMe ? SELF_NAME : who.trim(),
          direction,
          principal_minor: principal,
          currency,
          account_id: accounts ? accountId || move?.accountId || null : (initial?.account_id ?? null),
          started_on: started || null,
          target_on: direction === "gift_received" ? null : target || null,
          priority: p,
          status: paid ? "paid" : "active",
          notes: notes.trim() || null,
        },
        move,
      );
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="mz-form" onSubmit={submit}>
      {!forMe && <TextField label="Person" value={who} onChange={setWho} placeholder="Friend" maxLength={80} />}
      <SelectField
        label="Kind"
        value={direction}
        onChange={setDirection}
        options={(["i_owe", "owed_to_me", "held_for_other", "gift_received"] as DebtDirection[]).map((d) => ({ value: d, label: DIRECTION_LABEL[d] }))}
        hint={
          direction === "gift_received"
            ? "Kept for memory only. It never counts as debt."
            : direction === "held_for_other"
              ? "Their money sits in your account, but it is not yours: it is left out of your net position and savings."
              : direction === "owed_to_me"
                ? "Money you lent leaves your account; what comes back is recorded as received."
                : undefined
        }
      />
      {direction === "owed_to_me" && (
        <SwitchRow
          label="I took it for myself"
          checked={self}
          onChange={setSelf}
          hint="Money you took from your own (trading) money and will put back. It stays in Trading › Capital, but is not counted as something you own twice."
        />
      )}
      <SelectField label="Currency" value={currency} onChange={setCurrency} options={CURRENCY_OPTIONS.map((c) => ({ value: c, label: c }))} />
      {flows && isNew && accounts && (
        <div className="mz-grid-2">
          <AmountField
            label={direction === "owed_to_me" ? (forMe ? "Taking now" : "Lending now") : "Given to me now"}
            value={moveAmount}
            currency={currency}
            onChange={(t) => setMoveAmount(t)}
          />
          <label className="mz-field">
            Date
            <input className="mz-input" type="date" value={moveDate} onChange={(e) => setMoveDate(e.target.value || moveDate)} />
          </label>
        </div>
      )}
      {flows && accounts && (
        <SelectField
          label={direction === "held_for_other" ? "Kept in" : "Usually from"}
          value={accountId}
          onChange={setAccountId}
          options={[{ value: "", label: usable.length ? "Choose an account" : `No ${currency} account` }, ...usable.map((a) => ({ value: a.id, label: accountLabel(a, institutions) }))]}
        />
      )}
      <AmountField
        label={words.amount}
        value={amount}
        currency={currency}
        onChange={(t) => setAmount(t)}
        hint={flows ? "Leave empty when everything is recorded in Mezgeb." : undefined}
      />
      <div className="mz-grid-2">
        <label className="mz-field">
          Started
          <input className="mz-input" type="date" value={started} onChange={(e) => setStarted(e.target.value)} />
        </label>
        {direction !== "gift_received" && (
          <label className="mz-field">
            {words.by}
            <input className="mz-input" type="date" value={target} onChange={(e) => setTarget(e.target.value)} />
          </label>
        )}
      </div>
      {direction === "i_owe" && <TextField label="Priority" value={priority} onChange={setPriority} inputMode="numeric" hint="1 is paid first." />}
      <TextField label="Note" value={notes} onChange={setNotes} maxLength={300} />
      {initial?.id && direction !== "gift_received" && <SwitchRow label="Fully settled" checked={paid} onChange={setPaid} />}
      <ErrorLine text={error} />
      <FormActions saving={saving} onDelete={onDelete} />
    </form>
  );
}

/* ── Goal ── */

export function GoalForm({ initial, accounts, institutions, onSubmit, onDelete }: Common<Goal> & { accounts: Account[]; institutions: Institution[] }) {
  const [name, setName] = useState(initial?.name ?? "");
  const [kind, setKind] = useState<GoalKind>(initial?.kind ?? "custom");
  const [target, setTarget] = useState(initial?.target_minor ? minorToInput(initial.target_minor) : "");
  const [accountId, setAccountId] = useState(initial?.account_id ?? "");
  const [deadline, setDeadline] = useState(initial?.deadline ?? "");
  const [status, setStatus] = useState<GoalStatus>(initial?.status ?? "active");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const { saving, error, run } = useSubmit(onSubmit);
  return (
    <form
      className="mz-form"
      onSubmit={(e) =>
        run(e, () => {
          if (!name.trim()) return "Give the goal a name.";
          const t = target.trim() ? parseAmount(target) : null;
          if (target.trim() && !t) return "The target is not a valid amount.";
          return { name: name.trim(), kind, target_minor: t || null, account_id: accountId || null, deadline: deadline || null, status, notes: notes.trim() || null };
        })
      }
    >
      <TextField label="Name" value={name} onChange={setName} placeholder="Emergency fund" maxLength={80} />
      <SelectField
        label="Kind"
        value={kind}
        onChange={setKind}
        options={[
          { value: "emergency", label: "Emergency fund" },
          { value: "savings", label: "Savings" },
          { value: "usd", label: "USD savings" },
          { value: "custom", label: "Other" },
        ]}
      />
      <AmountField label="Target (optional)" value={target} onChange={(t) => setTarget(t)} hint="Leave empty when there is no target yet." />
      <SelectField
        label="Kept in"
        value={accountId}
        onChange={setAccountId}
        options={[{ value: "", label: "Any account" }, ...accounts.map((a) => ({ value: a.id, label: accountLabel(a, institutions) }))]}
      />
      <label className="mz-field">
        Deadline (optional)
        <input className="mz-input" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
      </label>
      <SelectField
        label="Status"
        value={status}
        onChange={setStatus}
        options={[
          { value: "active", label: "Active" },
          { value: "planned", label: "Planned" },
          { value: "reached", label: "Reached" },
          { value: "archived", label: "Archived" },
        ]}
      />
      <TextField label="Note" value={notes} onChange={setNotes} placeholder="Starts with your first freelance income" maxLength={300} />
      <ErrorLine text={error} />
      <FormActions saving={saving} onDelete={onDelete} />
    </form>
  );
}

/* ── City and trade item ── */

export function CityForm({ initial, onSubmit, onArchive, onDelete, archiveLabel }: Common<City>) {
  const [name, setName] = useState(initial?.name ?? "");
  const [label, setLabel] = useState(initial?.short_label ?? "");
  const { saving, error, run } = useSubmit(onSubmit);
  return (
    <form className="mz-form" onSubmit={(e) => run(e, () => (name.trim() ? { name: name.trim(), short_label: label.trim() || null } : "Give the city a name."))}>
      <TextField label="City" value={name} onChange={setName} placeholder="Arba Minch" maxLength={60} />
      <TextField label="Short label (optional)" value={label} onChange={setLabel} placeholder="AM" maxLength={8} />
      <ErrorLine text={error} />
      <FormActions saving={saving} onArchive={onArchive} archiveLabel={archiveLabel} onDelete={onDelete} />
    </form>
  );
}

export function ItemForm({ initial, onSubmit, onArchive, onDelete, archiveLabel }: Common<TradeItem>) {
  const [name, setName] = useState(initial?.name ?? "");
  const [unit, setUnit] = useState(initial?.unit ?? "piece");
  const [margin, setMargin] = useState(initial?.target_margin_percent !== undefined ? formatBp(percentNumberToBp(initial.target_margin_percent)).replace("%", "") : "10");
  const { saving, error, run } = useSubmit(onSubmit);
  return (
    <form
      className="mz-form"
      onSubmit={(e) =>
        run(e, () => {
          if (!name.trim()) return "Give the item a name.";
          const bp = parsePercentToBp(margin, 100000);
          if (bp === null) return "Enter the target margin as a percent.";
          return { name: name.trim(), unit: unit.trim() || "piece", target_margin_percent: bp / 100 };
        })
      }
    >
      <TextField label="Item" value={name} onChange={setName} maxLength={60} />
      <TextField label="Unit" value={unit} onChange={setUnit} placeholder="kg, sack, piece" maxLength={20} />
      <TextField label="Target margin (%)" value={margin} onChange={setMargin} inputMode="decimal" hint="Net margin after costs that makes a trip worth it." />
      <ErrorLine text={error} />
      <FormActions saving={saving} onArchive={onArchive} archiveLabel={archiveLabel} onDelete={onDelete} />
    </form>
  );
}
