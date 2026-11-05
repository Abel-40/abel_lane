// Spending pulse and yearly savings computed from loaded data, shared by Home, Plan, Settings and the verdicts.

import { todayISO, type ISODate } from "./dates";
import { messageSeed } from "./verdict-seed";
import { pickMessage, PRAISE, WARNINGS } from "./messages";
import { dailyLimit, monthlyPersonalBudget, spendingPulse, type LimitSource, type SpendingPulse } from "./spending";
import { yearSavings, type YearSavings } from "./savings";
import { formatMinor, sumMinor, type Minor } from "./money";
import type { MzData } from "./store";

export type Insights = {
  budget: Minor;
  limitSource: LimitSource;
  pulse: SpendingPulse;
  /** message for today's verdict (stable for the day) */
  message: string | null;
  year: YearSavings;
};

export function spentByDay(data: MzData): Record<ISODate, Minor> {
  const ccy = data.settings?.base_currency ?? "ETB";
  const out: Record<ISODate, Minor> = {};
  for (const d of data.dailySpending) if (d.currency === ccy) out[d.day.slice(0, 10)] = d.personal_spent_minor;
  return out;
}

/**
 * Goods kept in store as savings, at cost, in the base currency. Goods paid with trading capital are trading
 * money (they count in Trading › Capital), so they are left out here.
 */
export function storedGoodsMinor(data: MzData): Minor {
  const trading = new Set(data.accounts.filter((a) => a.role === "trading").map((a) => a.id));
  return sumMinor(
    data.trips
      .filter((t) => t.kind === "stock" && t.status === "open" && !trading.has(t.capital_account_id))
      .map((t) => data.tripSummaries[t.id]?.unsold_stock_minor ?? 0),
  );
}

export function computeInsights(data: MzData, today: ISODate = todayISO()): Insights | null {
  const s = data.settings;
  if (!s) return null;
  const spendingIds = data.accounts.filter((a) => a.role === "spending" && !a.is_archived).map((a) => a.id);
  const budget = monthlyPersonalBudget(s.net_salary_minor, data.rules, spendingIds);
  const { limit, source } = dailyLimit(s.daily_spend_limit_minor, budget, today);
  const pulse = spendingPulse(spentByDay(data), limit, today, s.created_at.slice(0, 10));
  const message =
    pulse.verdict === "over" || pulse.weekOver
      ? pickMessage(WARNINGS, messageSeed("day-over", today))
      : pulse.verdict === "under" && (pulse.today > 0 || pulse.streak > 0)
        ? pickMessage(PRAISE, messageSeed("day-under", today))
        : null;
  const year = yearSavings({
    accounts: data.accounts,
    balances: data.balances,
    heldByAccount: data.heldByAccount,
    flows: data.flows,
    goodsMinor: storedGoodsMinor(data),
    includeGoods: s.savings_include_goods,
    target: s.year_savings_target_minor,
    currency: s.year_savings_currency,
    baseCurrency: s.base_currency,
    rates: data.fxRates,
    today,
  });
  return { budget, limitSource: source, pulse, message, year };
}

export type VerdictSpec = { tone: "warn" | "praise"; title: string; message: string; detail?: string };

/**
 * After a new expense: a warning when it pushes today's personal spending over the daily limit.
 * Giving, trading and debt categories, other days and other currencies never trigger it.
 */
export function expenseVerdict(
  data: MzData,
  entry: { amount: Minor; date: ISODate; categoryId: string | null; accountId: string },
  today: ISODate = todayISO(),
): VerdictSpec | null {
  const s = data.settings;
  if (!s || entry.date !== today) return null;
  const account = data.accounts.find((a) => a.id === entry.accountId);
  if (!account || account.currency !== s.base_currency) return null;
  const group = data.categories.find((c) => c.id === entry.categoryId)?.category_group ?? "personal";
  if (group === "giving" || group === "trading" || group === "debt") return null;
  const insights = computeInsights(data, today);
  const limit = insights?.pulse.limit;
  if (!limit) return null;
  const before = spentByDay(data)[today] ?? 0;
  const after = before + entry.amount;
  if (after <= limit) return null;
  const over = after - limit;
  return {
    tone: "warn",
    title: before > limit ? "Still over today's limit" : "Over today's limit",
    message: pickMessage(WARNINGS, messageSeed("expense", today, `${after}`)),
    detail: `Spent today ${fmt(after, s.base_currency)} of ${fmt(limit, s.base_currency)}: ${fmt(over, s.base_currency)} too much.`,
  };
}

/** After money moves into savings (a saving account or a goal) or a want is let go. */
export function savingVerdict(kind: "saved" | "let_go", amount: Minor, currency: string, seed: string): VerdictSpec {
  return {
    tone: "praise",
    title: kind === "let_go" ? "Let go. Well done." : "Saved. Well done.",
    message: pickMessage(PRAISE, messageSeed(kind, todayISO(), seed)),
    detail: kind === "let_go" ? `${fmt(amount, currency)} stays yours.` : `${fmt(amount, currency)} moved toward your future.`,
  };
}

function fmt(minor: Minor, currency: string): string {
  return formatMinor(minor, currency);
}
