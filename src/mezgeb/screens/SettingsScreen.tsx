"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { CategoryForm, CityForm, ItemForm } from "../components/forms";
import { RulesManager } from "../components/RulesManager";
import { SecuritySection, SignOutEverywhereButton } from "../components/SecuritySection";
import { AmountField, BackHeader, DataFallback, ErrorLine, FormActions, SelectField, Sheet, SwitchRow, Tabs, TextField, useToast } from "../components/ui";
import { ThemeChoice } from "../components/Theme";
import { computeInsights } from "../lib/insights";
import { BackupSection, InstallHint } from "../components/BackupSection";
import { DangerZone } from "../components/DangerZone";
import { deleteOrArchive, deleteRow, insertRow, saveRow, updateRow } from "../lib/db";
import { formatBp, formatMinor, hourlyRate, minorToInput, parseAmount, parsePercentToBp, percentNumberToBp } from "../lib/money";
import { rememberLockMinutes } from "../lib/session";
import { useMz } from "../lib/store";
import { friendlyError } from "../lib/supabase";
import { GROUP_LABEL, type Category, type City, type FxRate, type TradeItem } from "../lib/types";

type Panel = "income" | "saving" | "categories" | "rules" | "trade" | "fx" | null;

export function SettingsScreen() {
  const { data, error, reload } = useMz();
  const toast = useToast();
  const [panel, setPanel] = useState<Panel>(null);
  if (!data?.settings) return <DataFallback error={error} onRetry={reload} />;
  const s = data.settings;
  const insights = computeInsights(data);
  const limitText =
    s.daily_spend_limit_minor === 0
      ? "off"
      : insights?.pulse.limit
        ? `${formatMinor(insights.pulse.limit, s.base_currency)}${insights.limitSource === "auto" ? " (auto)" : ""}`
        : "no budget yet";
  // hourly rate rounded to whole Birr, like the design ("176 h → 114 Br/h")
  const rate = hourlyRate(s.net_salary_minor, s.work_hours_per_month * 100) * 100;

  async function patch(values: Record<string, unknown>, message = "Saved.") {
    try {
      await updateRow("settings", s.id, values);
      await reload();
      toast(message);
    } catch (e) {
      toast(friendlyError(e), true);
    }
  }

  const row = (label: string, value: string, onClick: () => void, last = false) => (
    <button type="button" className="mz-row" style={last ? { borderBottom: 0 } : undefined} onClick={onClick}>
      <span className="mz-grow" style={{ fontSize: 14 }}>
        {label}
      </span>
      <span className="mz-muted mz-num" style={{ fontSize: 14 }}>
        {value}
      </span>
    </button>
  );

  return (
    <main className="mz-page mz-page--full mz-page--tight">
      <BackHeader title="Settings" />

      <Link href="/mezgeb/help" className="mz-card mz-card--sm mz-card--row">
        <span className="mz-row__main" style={{ gap: 2 }}>
          <span className="mz-row__title">Help and how-to guides</span>
          <span className="mz-row__sub">What every screen does, and step by step how to add things</span>
        </span>
        <span className="mz-dim">›</span>
      </Link>

      <span className="mz-section-label">Income and giving</span>
      <div className="mz-list mz-list--16">
        {row("Net salary", formatMinor(s.net_salary_minor, s.base_currency), () => setPanel("income"))}
        {row("Work hours per month", `${s.work_hours_per_month} h → ${formatMinor(rate, s.base_currency)}/h`, () => setPanel("income"))}
        {row("Payday", `day ${s.payday_day} of the month`, () => setPanel("income"))}
        {row("Tithe", `${formatBp(percentNumberToBp(s.tithe_percent))} of net salary`, () => setPanel("income"))}
        {row("Trading loss limit", formatMinor(s.trading_loss_limit_minor, s.base_currency), () => setPanel("income"), true)}
      </div>

      <span className="mz-section-label">Spending and savings</span>
      <div className="mz-list mz-list--16">
        {row("Daily spending limit", limitText, () => setPanel("saving"))}
        {row("Savings target for this year", s.year_savings_target_minor ? formatMinor(s.year_savings_target_minor, s.year_savings_currency) : "not set", () => setPanel("saving"))}
        {row("Stored goods count as savings", s.savings_include_goods ? "yes" : "no", () => setPanel("saving"), true)}
      </div>

      <span className="mz-section-label">Appearance</span>
      <ThemeChoice />

      <span className="mz-section-label">Manage</span>
      <div className="mz-list mz-list--16">
        <Link href="/mezgeb/accounts" className="mz-row">
          <span className="mz-grow">Institutions and accounts</span>
          <span className="mz-dim">
            {data.institutions.length} · {data.accounts.length} ›
          </span>
        </Link>
        <button type="button" className="mz-row" onClick={() => setPanel("categories")}>
          <span className="mz-grow">Categories</span>
          <span className="mz-dim">{data.categories.filter((c) => !c.is_archived).length} ›</span>
        </button>
        <button type="button" className="mz-row" onClick={() => setPanel("rules")}>
          <span className="mz-grow">Payday rules</span>
          <span className="mz-dim">{data.rules.filter((r) => r.is_active).length} ›</span>
        </button>
        <button type="button" className="mz-row" onClick={() => setPanel("trade")}>
          <span className="mz-grow">Cities and trade items</span>
          <span className="mz-dim">
            {data.cities.filter((c) => !c.is_archived).length} · {data.items.filter((i) => !i.is_archived).length} ›
          </span>
        </button>
        <button type="button" className="mz-row" onClick={() => setPanel("fx")}>
          <span className="mz-grow">Exchange rates</span>
          <span className="mz-dim">{data.fxRates.length} ›</span>
        </button>
      </div>

      <SecuritySection
        lockMinutes={s.lock_minutes}
        onLockMinutes={(m) => {
          rememberLockMinutes(m);
          void patch({ lock_minutes: m }, `Locks after ${m} ${m === 1 ? "minute" : "minutes"}.`);
        }}
        hideBalances={s.hide_balances}
        onHideBalances={(h) => void patch({ hide_balances: h }, h ? "Balances are hidden until tapped." : "Balances are shown.")}
      />

      <BackupSection />
      <InstallHint />

      <div style={{ marginTop: 12 }}>
        <SignOutEverywhereButton />
      </div>

      <DangerZone />

      <Sheet open={panel === "income"} title="Income and giving" onClose={() => setPanel(null)}>
        <IncomeForm
          onDone={async (values) => {
            await updateRow("settings", s.id, values);
            await reload();
            setPanel(null);
            toast("Saved.");
          }}
        />
      </Sheet>
      <Sheet open={panel === "saving"} title="Spending and savings" onClose={() => setPanel(null)}>
        <SavingForm
          autoLimit={insights?.limitSource === "auto" || insights?.limitSource === "none" ? insights.pulse.limit : null}
          budget={insights?.budget ?? 0}
          onDone={async (values) => {
            await updateRow("settings", s.id, values);
            await reload();
            setPanel(null);
            toast("Saved.");
          }}
        />
      </Sheet>
      <Sheet open={panel === "categories"} title="Categories" onClose={() => setPanel(null)}>
        <CategoriesManager />
      </Sheet>
      <Sheet open={panel === "rules"} title="Payday rules" onClose={() => setPanel(null)}>
        <RulesManager />
      </Sheet>
      <Sheet open={panel === "trade"} title="Cities and trade items" onClose={() => setPanel(null)}>
        <TradeListsManager />
      </Sheet>
      <Sheet open={panel === "fx"} title="Exchange rates" onClose={() => setPanel(null)}>
        <FxManager />
      </Sheet>
    </main>
  );
}

function IncomeForm({ onDone }: { onDone: (values: Record<string, unknown>) => Promise<void> }) {
  const { data } = useMz();
  const s = data!.settings!;
  const [salary, setSalary] = useState(minorToInput(s.net_salary_minor));
  const [hours, setHours] = useState(String(s.work_hours_per_month));
  const [payday, setPayday] = useState(String(s.payday_day));
  const [tithe, setTithe] = useState(formatBp(percentNumberToBp(s.tithe_percent)).replace("%", ""));
  const [limit, setLimit] = useState(minorToInput(s.trading_loss_limit_minor));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const sal = parseAmount(salary);
    const h = Number(hours);
    const p = Number(payday);
    const t = parsePercentToBp(tithe);
    const l = limit.trim() ? parseAmount(limit) : 0;
    if (sal === null) return setError("Enter your net salary.");
    if (!Number.isInteger(h) || h < 1 || h > 744) return setError("Work hours is a whole number.");
    if (!Number.isInteger(p) || p < 1 || p > 31) return setError("Payday is a day from 1 to 31.");
    if (t === null) return setError("Tithe is a percent from 0 to 100.");
    if (l === null) return setError("The loss limit is not a valid amount.");
    setSaving(true);
    setError(null);
    try {
      await onDone({ net_salary_minor: sal, work_hours_per_month: h, payday_day: p, tithe_percent: t / 100, trading_loss_limit_minor: l });
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setSaving(false);
    }
  }

  const sal = parseAmount(salary);
  return (
    <form className="mz-form" onSubmit={submit}>
      <AmountField label="Net salary per month" value={salary} onChange={(v) => setSalary(v)} />
      <TextField
        label="Work hours per month"
        value={hours}
        onChange={setHours}
        inputMode="numeric"
        hint={sal && Number(hours) > 0 ? `${formatMinor(hourlyRate(sal, Number(hours)))} per hour of work` : undefined}
      />
      <TextField label="Payday (day of the month)" value={payday} onChange={setPayday} inputMode="numeric" />
      <TextField label="Tithe (% of net salary)" value={tithe} onChange={setTithe} inputMode="decimal" hint="Change the Tithe payday rule too if it should follow." />
      <AmountField label="Trading loss limit" value={limit} onChange={(v) => setLimit(v)} hint="Trading warns when capital falls below this." />
      <ErrorLine text={error} />
      <FormActions saving={saving} />
    </form>
  );
}

type LimitMode = "auto" | "own" | "off";

function SavingForm({ autoLimit, budget, onDone }: { autoLimit: number | null; budget: number; onDone: (values: Record<string, unknown>) => Promise<void> }) {
  const { data } = useMz();
  const s = data!.settings!;
  const [mode, setMode] = useState<LimitMode>(s.daily_spend_limit_minor === null ? "auto" : s.daily_spend_limit_minor === 0 ? "off" : "own");
  const [own, setOwn] = useState(s.daily_spend_limit_minor ? minorToInput(s.daily_spend_limit_minor) : "");
  const [target, setTarget] = useState(s.year_savings_target_minor ? minorToInput(s.year_savings_target_minor) : "");
  const [currency, setCurrency] = useState(s.year_savings_currency);
  const [goods, setGoods] = useState(s.savings_include_goods);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const currencies = Array.from(new Set([s.base_currency, "USD", currency]));
  const needsRate = currency !== s.base_currency && !data!.fxRates.some((r) => (r.base === currency && r.quote === s.base_currency) || (r.base === s.base_currency && r.quote === currency));

  async function submit(e: FormEvent) {
    e.preventDefault();
    const ownMinor = mode === "own" ? parseAmount(own) : null;
    if (mode === "own" && !ownMinor) return setError("Enter your daily limit.");
    const t = target.trim() ? parseAmount(target) : null;
    if (target.trim() && !t) return setError("The savings target is not a valid amount.");
    setSaving(true);
    setError(null);
    try {
      await onDone({
        daily_spend_limit_minor: mode === "auto" ? null : mode === "off" ? 0 : ownMinor,
        year_savings_target_minor: t || null,
        year_savings_currency: currency,
        savings_include_goods: goods,
      });
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="mz-form" onSubmit={submit}>
      <span className="mz-section-label">Daily spending limit</span>
      <Tabs
        label="Daily spending limit"
        value={mode}
        onChange={setMode}
        options={[
          { value: "auto", label: "Auto" },
          { value: "own", label: "My own" },
          { value: "off", label: "Off" },
        ]}
      />
      {mode === "auto" && (
        <p className="mz-note">
          {autoLimit
            ? `${formatMinor(autoLimit, s.base_currency)} a day: your ${formatMinor(budget, s.base_currency)} monthly spending budget (payday rules into spending accounts) ÷ the days of this month.`
            : "No spending budget yet: add a payday rule that sends money to a spending account, or set your own limit."}
        </p>
      )}
      {mode === "own" && <AmountField label="Limit per day" value={own} currency={s.base_currency} onChange={(t) => setOwn(t)} />}
      {mode === "off" && <p className="mz-note">No warnings and no daily verdicts.</p>}
      <p className="mz-note">Only personal spending counts. Tithe, giving, trading, debts and money for other people never do.</p>

      <span className="mz-section-label">Savings this year</span>
      <div className="mz-grid-2">
        <AmountField label="Target on 31 December" value={target} currency={currency} onChange={(t) => setTarget(t)} />
        <SelectField label="Currency" value={currency} onChange={setCurrency} options={currencies.map((c) => ({ value: c, label: c }))} />
      </div>
      {needsRate && <p className="mz-note mz-warn">Add a {currency} exchange rate in Settings › Exchange rates so your savings can be converted.</p>}
      <SwitchRow
        label="Stored goods count as savings"
        checked={goods}
        onChange={setGoods}
        hint="Goods you keep in store (Trading › Goods in store), valued at what you paid."
      />
      <p className="mz-note">Savings are the accounts marked “Counts as savings” (Accounts › edit), without money you keep for other people.</p>
      <ErrorLine text={error} />
      <FormActions saving={saving} />
    </form>
  );
}

function CategoriesManager() {
  const { data, reload } = useMz();
  const toast = useToast();
  const [editing, setEditing] = useState<Category | "new" | null>(null);
  const categories = data?.categories ?? [];

  async function save(values: Record<string, unknown>) {
    await saveRow("categories", editing && editing !== "new" ? editing.id : null, values);
    await reload();
    setEditing(null);
  }
  async function archive(c: Category) {
    await updateRow("categories", c.id, { is_archived: !c.is_archived });
    await reload();
    setEditing(null);
  }
  async function remove(c: Category) {
    try {
      const r = await deleteOrArchive("categories", c.id);
      await reload();
      setEditing(null);
      toast(r === "archived" ? "Entries use it, so it was archived." : "Deleted.");
    } catch (e) {
      toast(friendlyError(e), true);
    }
  }

  if (editing) {
    return (
      <CategoryForm
        key={editing === "new" ? "new" : editing.id}
        initial={editing === "new" ? undefined : editing}
        onSubmit={(v) => save(v as Record<string, unknown>)}
        onArchive={editing === "new" ? undefined : () => archive(editing)}
        archiveLabel={editing !== "new" && editing.is_archived ? "Restore" : "Archive"}
        onDelete={editing === "new" ? undefined : () => remove(editing)}
      />
    );
  }
  const section = (title: string, list: Category[]) =>
    list.length > 0 && (
      <div className="mz-stack">
        <span className="mz-section-label">{title}</span>
        <div className="mz-list">
          {list.map((c) => (
            <button key={c.id} type="button" className="mz-row" onClick={() => setEditing(c)}>
              <span className="mz-row__main">
                <span className="mz-row__title mz-row__title--plain">{c.name}</span>
                <span className="mz-row__sub">
                  {GROUP_LABEL[c.category_group]}
                  {c.kind === "expense" ? (c.is_need ? " · need" : " · want") : ""}
                </span>
              </span>
              <span className="mz-row__chev">›</span>
            </button>
          ))}
        </div>
      </div>
    );
  const archived = categories.filter((c) => c.is_archived);
  return (
    <div className="mz-stack" style={{ gap: 14 }}>
      {section("Expenses", categories.filter((c) => c.kind === "expense" && !c.is_archived))}
      {section("Income", categories.filter((c) => c.kind === "income" && !c.is_archived))}
      {archived.length > 0 && (
        <details className="mz-details">
          <summary className="mz-section-label">Archived ({archived.length})</summary>
          {section("", archived)}
        </details>
      )}
      <button type="button" className="mz-btn mz-btn--md mz-btn--ghost" onClick={() => setEditing("new")}>
        + Add category
      </button>
    </div>
  );
}

function TradeListsManager() {
  const { data, reload } = useMz();
  const toast = useToast();
  const [editing, setEditing] = useState<{ kind: "city"; row: City | null } | { kind: "item"; row: TradeItem | null } | null>(null);
  if (!data) return null;

  async function save(values: Record<string, unknown>) {
    if (!editing) return;
    await saveRow(editing.kind === "city" ? "cities" : "trade_items", editing.row?.id, values);
    await reload();
    setEditing(null);
  }
  async function toggleArchive() {
    if (!editing?.row) return;
    await updateRow(editing.kind === "city" ? "cities" : "trade_items", editing.row.id, { is_archived: !editing.row.is_archived });
    await reload();
    setEditing(null);
  }
  async function remove() {
    if (!editing?.row) return;
    try {
      const r = await deleteOrArchive(editing.kind === "city" ? "cities" : "trade_items", editing.row.id);
      await reload();
      setEditing(null);
      toast(r === "archived" ? "Trips use it, so it was archived." : "Deleted.");
    } catch (e) {
      toast(friendlyError(e), true);
    }
  }

  if (editing?.kind === "city") {
    return (
      <CityForm
        initial={editing.row ?? undefined}
        onSubmit={(v) => save(v as Record<string, unknown>)}
        onArchive={editing.row ? toggleArchive : undefined}
        archiveLabel={editing.row?.is_archived ? "Restore" : "Archive"}
        onDelete={editing.row ? remove : undefined}
      />
    );
  }
  if (editing?.kind === "item") {
    return (
      <ItemForm
        initial={editing.row ?? undefined}
        onSubmit={(v) => save(v as Record<string, unknown>)}
        onArchive={editing.row ? toggleArchive : undefined}
        archiveLabel={editing.row?.is_archived ? "Restore" : "Archive"}
        onDelete={editing.row ? remove : undefined}
      />
    );
  }
  return (
    <div className="mz-stack" style={{ gap: 14 }}>
      <span className="mz-section-label">Cities</span>
      <div className="mz-list">
        {data.cities.map((c) => (
          <button key={c.id} type="button" className="mz-row" onClick={() => setEditing({ kind: "city", row: c })}>
            <span className="mz-grow">
              {c.name}
              {c.is_archived ? <span className="mz-dim"> · archived</span> : null}
            </span>
            <span className="mz-row__chev">›</span>
          </button>
        ))}
      </div>
      <button type="button" className="mz-btn mz-btn--md mz-btn--ghost" onClick={() => setEditing({ kind: "city", row: null })}>
        + Add city
      </button>
      <span className="mz-section-label">Trade items</span>
      {data.items.length > 0 ? (
        <div className="mz-list">
          {data.items.map((i) => (
            <button key={i.id} type="button" className="mz-row" onClick={() => setEditing({ kind: "item", row: i })}>
              <span className="mz-row__main">
                <span className="mz-row__title mz-row__title--plain">
                  {i.name}
                  {i.is_archived ? <span className="mz-dim"> · archived</span> : null}
                </span>
                <span className="mz-row__sub">
                  per {i.unit} · target {formatBp(percentNumberToBp(i.target_margin_percent))}
                </span>
              </span>
              <span className="mz-row__chev">›</span>
            </button>
          ))}
        </div>
      ) : (
        <p className="mz-note">No items yet.</p>
      )}
      <button type="button" className="mz-btn mz-btn--md mz-btn--ghost" onClick={() => setEditing({ kind: "item", row: null })}>
        + Add item
      </button>
    </div>
  );
}

function FxManager() {
  const { data, reload } = useMz();
  const toast = useToast();
  const [base, setBase] = useState("USD");
  const [rate, setRate] = useState("");
  const [error, setError] = useState<string | null>(null);
  if (!data?.settings) return null;
  const quote = data.settings.base_currency;

  async function add(e: FormEvent) {
    e.preventDefault();
    if (!/^\d+(\.\d{1,8})?$/.test(rate.trim())) return setError("Enter the rate as a number, for example 125.5");
    if (base.toUpperCase() === quote) return setError(`Pick a currency other than ${quote}.`);
    try {
      await insertRow("fx_rates", { base: base.toUpperCase(), quote, rate: rate.trim() });
      await reload();
      setRate("");
      setError(null);
      toast("Rate saved.");
    } catch (err) {
      setError(friendlyError(err));
    }
  }
  async function remove(r: FxRate) {
    await deleteRow("fx_rates", r.id);
    await reload();
  }

  return (
    <div className="mz-stack" style={{ gap: 14 }}>
      <p className="mz-note">Manual rates, used to count accounts in other currencies in your net position. The newest rate wins.</p>
      {data.fxRates.length > 0 && (
        <div className="mz-list">
          {data.fxRates.map((r) => (
            <div key={r.id} className="mz-row">
              <span className="mz-row__main">
                <span className="mz-num">
                  1 {r.base} = {String(r.rate)} {r.quote}
                </span>
                <span className="mz-row__sub">{r.rated_on}</span>
              </span>
              <button type="button" className="mz-link-btn" onClick={() => remove(r)} aria-label={`Delete rate from ${r.rated_on}`}>
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
      <form className="mz-form" onSubmit={add}>
        <div className="mz-grid-2">
          <TextField label="From" value={base} onChange={(v) => setBase(v.toUpperCase())} maxLength={3} />
          <TextField label={`Rate in ${quote}`} value={rate} onChange={setRate} inputMode="decimal" placeholder="125.5" />
        </div>
        <ErrorLine text={error} />
        <button type="submit" className="mz-btn mz-btn--md">
          Save rate
        </button>
      </form>
    </div>
  );
}
