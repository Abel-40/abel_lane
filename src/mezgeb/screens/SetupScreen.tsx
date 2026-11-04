"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { AccountForm, CategoryForm, CityForm, DebtForm, GoalForm, InstitutionForm, RuleForm } from "../components/forms";
import { AmountField, ErrorLine, Sheet, TextField, useToast } from "../components/ui";
import { rpc } from "../lib/db";
import { defaultPlan, newId, planToImport, type Plan } from "../lib/defaults";
import { accountLabel } from "../lib/derive";
import { formatBp, formatMinor, hourlyRate, minorToInput, parseAmount, parsePercentToBp, percentNumberToBp, sharePercent } from "../lib/money";
import { computeSplit } from "../lib/payday";
import { useMz } from "../lib/store";
import { friendlyError } from "../lib/supabase";
import { GROUP_LABEL, ROLE_LABEL, type Account, type Institution } from "../lib/types";

const STEPS = ["Income", "Banks and wallets", "Accounts", "Payday rules", "Debts and goals", "Categories and cities", "Review"];
const SPLIT_COLORS = ["var(--mz-series-1)", "var(--mz-text)", "var(--mz-muted)", "var(--mz-amber)", "var(--mz-accent)", "var(--mz-series-2)"];

type Editing =
  | { table: "institutions" | "accounts" | "categories" | "debts" | "goals" | "payday_rules" | "cities"; id: string | null }
  | null;

// Drafts are full rows minus the server columns; cast helpers keep the forms typed.
type AnyRow = Record<string, unknown> & { id: string };

export function SetupScreen() {
  const [plan, setPlan] = useState<Plan>(() => defaultPlan());
  const [step, setStep] = useState(0);
  const [editing, setEditing] = useState<Editing>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { reload } = useMz();
  const router = useRouter();
  const toast = useToast();

  const s = plan.settings;
  const institutions = plan.institutions as unknown as Institution[];
  const accounts = plan.accounts as unknown as Account[];
  const split = useMemo(() => computeSplit(s.net_salary_minor, plan.payday_rules), [s.net_salary_minor, plan.payday_rules]);

  // Income step keeps text so typing is smooth.
  const [salaryText, setSalaryText] = useState(minorToInput(s.net_salary_minor));
  const [hoursText, setHoursText] = useState(String(s.work_hours_per_month));
  const [paydayText, setPaydayText] = useState(String(s.payday_day));
  const [titheText, setTitheText] = useState(String(s.tithe_percent));
  const [lockText, setLockText] = useState(String(s.lock_minutes));
  const [limitText, setLimitText] = useState(minorToInput(s.trading_loss_limit_minor));

  function patchSettings(p: Partial<Plan["settings"]>) {
    setPlan((cur) => ({ ...cur, settings: { ...cur.settings, ...p } }));
  }

  function list<K extends keyof Plan>(key: K) {
    return plan[key] as unknown as AnyRow[];
  }

  function upsertDraft(table: NonNullable<Editing>["table"], id: string | null, values: Record<string, unknown>) {
    setPlan((cur) => {
      const rows = cur[table] as unknown as AnyRow[];
      const next = id
        ? rows.map((r) => (r.id === id ? { ...r, ...values } : r))
        : [...rows, { id: newId(), sort_order: rows.length + 1, is_archived: false, ...defaultsFor(table), ...values }];
      return { ...cur, [table]: next };
    });
    setEditing(null);
  }

  function removeDraft(table: NonNullable<Editing>["table"], id: string) {
    const used =
      (table === "institutions" && plan.accounts.some((a) => a.institution_id === id)) ||
      (table === "accounts" && (plan.payday_rules.some((r) => r.target_account_id === id) || plan.goals.some((g) => g.account_id === id)));
    if (used) {
      setError(table === "institutions" ? "Accounts still use this bank. Change or remove them first." : "Payday rules or goals still use this account.");
      setEditing(null);
      return;
    }
    setPlan((cur) => {
      const next = { ...cur, [table]: (cur[table] as unknown as AnyRow[]).filter((r) => r.id !== id) } as Plan;
      if (table === "debts") next.payday_rules = next.payday_rules.map((r) => (r.debt_id === id ? { ...r, debt_id: null } : r));
      if (table === "goals") next.payday_rules = next.payday_rules.map((r) => (r.goal_id === id ? { ...r, goal_id: null } : r));
      return next;
    });
    setEditing(null);
  }

  function validateIncome(): string | null {
    const salary = parseAmount(salaryText);
    const hours = Number(hoursText);
    const payday = Number(paydayText);
    const titheBp = parsePercentToBp(titheText);
    const lock = Number(lockText);
    const limit = limitText.trim() ? parseAmount(limitText) : 0;
    if (salary === null) return "Enter your net salary.";
    if (!Number.isInteger(hours) || hours < 1 || hours > 744) return "Work hours per month is a whole number.";
    if (!Number.isInteger(payday) || payday < 1 || payday > 31) return "Payday is a day of the month from 1 to 31.";
    if (titheBp === null) return "Tithe is a percent from 0 to 100.";
    if (!Number.isInteger(lock) || lock < 1 || lock > 120) return "Lock after 1 to 120 minutes.";
    if (limit === null) return "The loss limit is not a valid amount.";
    const oldBp = percentNumberToBp(s.tithe_percent);
    patchSettings({ net_salary_minor: salary, work_hours_per_month: hours, payday_day: payday, tithe_percent: titheBp / 100, lock_minutes: lock, trading_loss_limit_minor: limit });
    // keep the tithe rule in line with the tithe percent
    setPlan((cur) => ({
      ...cur,
      payday_rules: cur.payday_rules.map((r) => (r.kind === "percent_of_salary" && /tithe/i.test(r.name) && r.value === oldBp ? { ...r, value: titheBp } : r)),
    }));
    return null;
  }

  function next() {
    setError(null);
    if (step === 0) {
      const e = validateIncome();
      if (e) return setError(e);
    }
    setStep((n) => Math.min(n + 1, STEPS.length - 1));
    window.scrollTo({ top: 0 });
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      await rpc("mz_import", { p: planToImport(plan), p_require_empty: true });
      await reload();
      toast("Mezgeb is ready.");
      router.replace("/mezgeb");
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setSaving(false);
    }
  }

  const editingRow = editing?.id ? list(editing.table).find((r) => r.id === editing.id) : undefined;
  const hasRemainder = plan.payday_rules.some((r) => r.kind === "remainder" && r.is_active);

  return (
    <main className="mz-page mz-page--full">
      <header className="mz-stack" style={{ gap: 10 }}>
        <div className="mz-steps" aria-hidden="true">
          {STEPS.map((_, i) => (
            <span key={i} className={i <= step ? "is-done" : undefined} />
          ))}
        </div>
        <span className="mz-subtitle">
          Set up Mezgeb · step {step + 1} of {STEPS.length}
        </span>
        <h1 className="mz-title">{STEPS[step]}</h1>
      </header>

      {step === 0 && (
        <div className="mz-form">
          <p className="mz-muted" style={{ fontSize: 14, lineHeight: 1.5 }}>
            These are suggestions from your plan. Change anything; you can edit all of it later in Settings.
          </p>
          <AmountField label="Net salary per month (Br)" value={salaryText} onChange={(t) => setSalaryText(t)} />
          <TextField
            label="Work hours per month"
            value={hoursText}
            onChange={setHoursText}
            inputMode="numeric"
            hint={(() => {
              const sal = parseAmount(salaryText);
              const h = Number(hoursText);
              return sal && h > 0 ? `${formatMinor(hourlyRate(sal, h))} per hour of work` : undefined;
            })()}
          />
          <TextField label="Payday (day of the month)" value={paydayText} onChange={setPaydayText} inputMode="numeric" hint="31 means the last day in shorter months." />
          <TextField label="Tithe (% of net salary)" value={titheText} onChange={setTitheText} inputMode="decimal" />
          <TextField label="Lock after inactivity (minutes)" value={lockText} onChange={setLockText} inputMode="numeric" />
          <AmountField label="Trading loss limit (Br)" value={limitText} onChange={(t) => setLimitText(t)} hint="Warns when trading capital falls below this." />
        </div>
      )}

      {step === 1 && (
        <DraftList
          intro="Banks and wallets you use. Add more any time."
          rows={plan.institutions.map((i) => ({ id: i.id, title: i.name, sub: i.short_label, badge: { text: i.short_label, color: i.color } }))}
          onEdit={(id) => setEditing({ table: "institutions", id })}
          onAdd={() => setEditing({ table: "institutions", id: null })}
          addLabel="Add bank or wallet"
        />
      )}

      {step === 2 && (
        <DraftList
          intro="Enter what each account holds today as its opening balance. Archived accounts are kept for later."
          rows={plan.accounts.map((a) => {
            const inst = plan.institutions.find((i) => i.id === a.institution_id);
            return {
              id: a.id,
              title: accountLabel(a as Account, institutions),
              sub: `${ROLE_LABEL[a.role]}${a.is_protected ? " · protected" : ""}${a.is_archived ? " · archived" : ""}`,
              value: formatMinor(a.opening_balance_minor, a.currency),
              badge: inst ? { text: inst.short_label, color: inst.color } : undefined,
            };
          })}
          onEdit={(id) => setEditing({ table: "accounts", id })}
          onAdd={() => setEditing({ table: "accounts", id: null })}
          addLabel="Add account"
        />
      )}

      {step === 3 && (
        <>
          <section className="mz-card mz-card--lg">
            <div className="mz-row-between">
              <span className="mz-muted" style={{ fontSize: 13 }}>
                Net salary
              </span>
              <span className="mz-num" style={{ fontWeight: 700, fontSize: 24 }}>
                {formatMinor(s.net_salary_minor)}
              </span>
            </div>
            <div className="mz-split" aria-hidden="true">
              {split.lines.map((l, i) => (
                <span key={i} style={{ width: `${sharePercent(l.amount_minor, s.net_salary_minor)}%`, background: SPLIT_COLORS[i % SPLIT_COLORS.length] }} />
              ))}
            </div>
            <span className={split.ok ? "mz-pos mz-strong" : "mz-warn mz-strong"} style={{ fontSize: 13 }}>
              {split.ok ? "0 Br left to assign" : `${split.error} ${formatMinor(Math.abs(split.leftover))} ${split.leftover > 0 ? "left" : "over"}.`}
            </span>
          </section>
          <DraftList
            rows={split.lines.map((l) => ({
              id: l.rule.id,
              title: `${l.rule.name}${l.rule.kind === "percent_of_salary" ? ` · ${formatBp(l.rule.value)}` : l.rule.kind === "remainder" ? " · remainder" : ""}`,
              sub: `→ ${accountLabel(accounts.find((a) => a.id === l.rule.target_account_id), institutions)}`,
              value: formatMinor(l.amount_minor, "ETB", { symbol: false }),
            }))}
            onEdit={(id) => setEditing({ table: "payday_rules", id })}
            onAdd={() => setEditing({ table: "payday_rules", id: null })}
            addLabel="Add rule"
          />
        </>
      )}

      {step === 4 && (
        <>
          <span className="mz-section-label">Debts</span>
          <DraftList
            rows={plan.debts.map((d) => ({
              id: d.id,
              title: d.counterparty,
              sub: d.direction === "gift_received" ? "a gift, not a debt" : d.direction === "i_owe" ? `I owe · priority ${d.priority}${d.target_on ? ` · by ${d.target_on}` : ""}` : "owed to me",
              value: formatMinor(d.principal_minor, d.currency, { symbol: false }),
            }))}
            onEdit={(id) => setEditing({ table: "debts", id })}
            onAdd={() => setEditing({ table: "debts", id: null })}
            addLabel="Add debt"
          />
          <span className="mz-section-label">Goals</span>
          <DraftList
            rows={plan.goals.map((g) => ({
              id: g.id,
              title: g.name,
              sub: g.status === "planned" ? "planned" : g.target_minor ? `target ${formatMinor(g.target_minor)}` : "no target yet",
            }))}
            onEdit={(id) => setEditing({ table: "goals", id })}
            onAdd={() => setEditing({ table: "goals", id: null })}
            addLabel="Add goal"
          />
        </>
      )}

      {step === 5 && (
        <>
          <span className="mz-section-label">Categories</span>
          <DraftList
            rows={plan.categories.map((c) => ({
              id: c.id,
              title: c.name,
              sub: `${c.kind === "income" ? "Income" : c.is_need ? "Expense · need" : "Expense · want"} · ${GROUP_LABEL[c.category_group]}`,
            }))}
            onEdit={(id) => setEditing({ table: "categories", id })}
            onAdd={() => setEditing({ table: "categories", id: null })}
            addLabel="Add category"
          />
          <span className="mz-section-label">Trading cities</span>
          <DraftList
            rows={plan.cities.map((c) => ({ id: c.id, title: c.name, sub: c.short_label ?? "" }))}
            onEdit={(id) => setEditing({ table: "cities", id })}
            onAdd={() => setEditing({ table: "cities", id: null })}
            addLabel="Add city"
          />
        </>
      )}

      {step === 6 && (
        <div className="mz-list mz-list--16">
          {[
            ["Net salary", formatMinor(s.net_salary_minor)],
            ["Hourly rate", `${formatMinor(hourlyRate(s.net_salary_minor, s.work_hours_per_month))} / h`],
            ["Payday", `day ${s.payday_day}`],
            ["Banks and wallets", String(plan.institutions.length)],
            ["Accounts", `${plan.accounts.filter((a) => !a.is_archived).length} active · ${plan.accounts.filter((a) => a.is_archived).length} archived`],
            ["Payday rules", split.ok ? `${plan.payday_rules.length} · adds up` : `${plan.payday_rules.length} · does not add up`],
            ["Debts and gifts", String(plan.debts.length)],
            ["Goals", String(plan.goals.length)],
            ["Categories", String(plan.categories.length)],
            ["Cities", String(plan.cities.length)],
          ].map(([k, v]) => (
            <div key={k} className="mz-check-row" style={{ borderBottom: "1px solid var(--mz-border)" }}>
              <span>{k}</span>
              <span className="mz-muted mz-num" style={{ fontSize: 14 }}>
                {v}
              </span>
            </div>
          ))}
        </div>
      )}

      <ErrorLine text={error} />

      <div className="mz-push mz-grid-2" style={{ paddingTop: 8 }}>
        <button type="button" className="mz-btn mz-btn--secondary" disabled={step === 0 || saving} onClick={() => setStep((n) => Math.max(0, n - 1))}>
          Back
        </button>
        {step < STEPS.length - 1 ? (
          <button type="button" className="mz-btn" onClick={next}>
            Next
          </button>
        ) : (
          <button type="button" className="mz-btn" onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save and start"}
          </button>
        )}
      </div>

      <Sheet open={editing !== null} title={sheetTitle(editing)} onClose={() => setEditing(null)}>
        {editing?.table === "institutions" && (
          <InstitutionForm
            key={editing.id ?? "new"}
            initial={editingRow as Partial<Institution>}
            onSubmit={(v) => upsertDraft("institutions", editing.id, v)}
            onDelete={editing.id ? () => removeDraft("institutions", editing.id as string) : undefined}
          />
        )}
        {editing?.table === "accounts" && (
          <AccountForm
            key={editing.id ?? "new"}
            institutions={institutions}
            initial={editingRow as Partial<Account>}
            onSubmit={(v) => upsertDraft("accounts", editing.id, v)}
            onDelete={editing.id ? () => removeDraft("accounts", editing.id as string) : undefined}
          />
        )}
        {editing?.table === "payday_rules" && (
          <RuleForm
            key={editing.id ?? "new"}
            accounts={accounts}
            institutions={institutions}
            goals={plan.goals as never}
            debts={plan.debts as never}
            hasRemainder={hasRemainder}
            initial={editingRow as never}
            onSubmit={(v) => upsertDraft("payday_rules", editing.id, v)}
            onDelete={editing.id ? () => removeDraft("payday_rules", editing.id as string) : undefined}
          />
        )}
        {editing?.table === "debts" && (
          <DebtForm
            key={editing.id ?? "new"}
            initial={editingRow as never}
            onSubmit={(v) => upsertDraft("debts", editing.id, v)}
            onDelete={editing.id ? () => removeDraft("debts", editing.id as string) : undefined}
          />
        )}
        {editing?.table === "goals" && (
          <GoalForm
            key={editing.id ?? "new"}
            accounts={accounts}
            institutions={institutions}
            initial={editingRow as never}
            onSubmit={(v) => upsertDraft("goals", editing.id, v)}
            onDelete={editing.id ? () => removeDraft("goals", editing.id as string) : undefined}
          />
        )}
        {editing?.table === "categories" && (
          <CategoryForm
            key={editing.id ?? "new"}
            initial={editingRow as never}
            onSubmit={(v) => upsertDraft("categories", editing.id, v)}
            onDelete={editing.id ? () => removeDraft("categories", editing.id as string) : undefined}
          />
        )}
        {editing?.table === "cities" && (
          <CityForm
            key={editing.id ?? "new"}
            initial={editingRow as never}
            onSubmit={(v) => upsertDraft("cities", editing.id, v)}
            onDelete={editing.id ? () => removeDraft("cities", editing.id as string) : undefined}
          />
        )}
      </Sheet>
    </main>
  );
}

/** Column defaults for new draft rows, so every row of a table has the same keys for mz_import. */
function defaultsFor(table: NonNullable<Editing>["table"]): Record<string, unknown> {
  switch (table) {
    case "institutions":
      return { kind: "bank", color: "#A3B1AA" };
    case "accounts":
      return { institution_id: null, role: "other", currency: "ETB", opening_balance_minor: 0, is_protected: false, notes: null };
    case "categories":
      return { kind: "expense", category_group: "personal", is_need: true };
    case "debts":
      return { currency: "ETB", started_on: null, target_on: null, priority: 1, status: "active", notes: null };
    case "goals":
      return { kind: "custom", target_minor: null, account_id: null, deadline: null, status: "active", notes: null };
    case "payday_rules":
      return { value: 0, goal_id: null, debt_id: null, is_active: true };
    case "cities":
      return { short_label: null };
  }
}

function sheetTitle(editing: Editing): string {
  if (!editing) return "";
  const what: Record<NonNullable<Editing>["table"], string> = {
    institutions: "bank or wallet",
    accounts: "account",
    categories: "category",
    debts: "debt",
    goals: "goal",
    payday_rules: "payday rule",
    cities: "city",
  };
  return `${editing.id ? "Edit" : "New"} ${what[editing.table]}`;
}

type DraftRow = { id: string; title: string; sub?: string; value?: string; badge?: { text: string; color: string } };

function DraftList({ rows, onEdit, onAdd, addLabel, intro }: { rows: DraftRow[]; onEdit: (id: string) => void; onAdd: () => void; addLabel: string; intro?: string }) {
  return (
    <div className="mz-stack" style={{ gap: 10 }}>
      {intro && <p className="mz-muted" style={{ fontSize: 14, lineHeight: 1.5 }}>{intro}</p>}
      {rows.length > 0 && (
        <div className="mz-list">
          {rows.map((r) => (
            <button key={r.id} type="button" className="mz-row" onClick={() => onEdit(r.id)}>
              {r.badge && (
                <span className="mz-badge" style={{ ["--badge" as string]: r.badge.color }}>
                  {r.badge.text}
                </span>
              )}
              <span className="mz-row__main">
                <span className="mz-row__title">{r.title}</span>
                {r.sub && <span className="mz-row__sub">{r.sub}</span>}
              </span>
              {r.value && <span className="mz-row__value">{r.value}</span>}
              <span className="mz-row__chev" aria-hidden="true">
                ›
              </span>
            </button>
          ))}
        </div>
      )}
      <button type="button" className="mz-btn mz-btn--md mz-btn--ghost" onClick={onAdd}>
        + {addLabel}
      </button>
    </div>
  );
}
