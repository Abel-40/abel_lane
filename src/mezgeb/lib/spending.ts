// Daily spending limit and how today, this week and the recent days compare to it. Pure functions.

import { addDays, daysInMonth, parseISO, type ISODate } from "./dates";
import { computeSplit, type SplitRule } from "./payday";
import { divFloor, sumMinor, type Minor } from "./money";

type BudgetRule = SplitRule & { target_account_id: string };

/** What each salary sends to spending accounts under the active payday rules (taxi, airtime, personal…). */
export function monthlyPersonalBudget(salary: Minor, rules: BudgetRule[], spendingAccountIds: string[]): Minor {
  const spending = new Set(spendingAccountIds);
  const split = computeSplit(salary, rules);
  return sumMinor(split.lines.filter((l) => spending.has(l.rule.target_account_id)).map((l) => l.amount_minor));
}

/** Monthly budget ÷ days in this month, rounded down to whole santim. null when there is no budget. */
export function autoDailyLimit(monthlyBudget: Minor, today: ISODate): Minor | null {
  if (monthlyBudget <= 0) return null;
  const d = parseISO(today);
  return divFloor(monthlyBudget, daysInMonth(d.getFullYear(), d.getMonth()));
}

export type LimitSource = "auto" | "set" | "off" | "none";

/** Setting null = automatic from the budget, 0 = warnings off, more than 0 = a fixed daily amount. */
export function dailyLimit(setting: Minor | null, monthlyBudget: Minor, today: ISODate): { limit: Minor | null; source: LimitSource } {
  if (setting === 0) return { limit: null, source: "off" };
  if (setting !== null && setting > 0) return { limit: setting, source: "set" };
  const auto = autoDailyLimit(monthlyBudget, today);
  return auto ? { limit: auto, source: "auto" } : { limit: null, source: "none" };
}

export type DayVerdict = "over" | "near" | "under" | "none";

/** over the limit · near it (80 % or more) · under · none (no limit). */
export function dayVerdict(spent: Minor, limit: Minor | null): DayVerdict {
  if (!limit) return "none";
  if (spent > limit) return "over";
  if (spent * 5 >= limit * 4) return "near";
  return "under";
}

export type SpendingPulse = {
  today: Minor;
  limit: Minor | null;
  verdict: DayVerdict;
  /** the last 7 days including today */
  week: Minor;
  weekLimit: Minor | null;
  weekOver: boolean;
  /** days in a row before today at or under the limit (since `since`) */
  streak: number;
  /** days this month above the limit, today included */
  overDaysThisMonth: number;
};

/**
 * @param spentByDay personal spending per day in the base currency
 * @param since the first day that counts for streaks (when Mezgeb was set up)
 */
export function spendingPulse(spentByDay: Record<ISODate, Minor>, limit: Minor | null, today: ISODate, since: ISODate): SpendingPulse {
  const spent = (d: ISODate) => spentByDay[d] ?? 0;
  const todaySpent = spent(today);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(today, -i));
  const week = sumMinor(weekDays.map(spent));
  const weekLimit = limit ? limit * 7 : null;

  let streak = 0;
  if (limit) {
    for (let d = addDays(today, -1); d >= since && streak < 366; d = addDays(d, -1)) {
      if (spent(d) > limit) break;
      streak++;
    }
  }

  let overDaysThisMonth = 0;
  if (limit) {
    for (let d = today; d.slice(0, 7) === today.slice(0, 7) && d >= since; d = addDays(d, -1)) {
      if (spent(d) > limit) overDaysThisMonth++;
    }
  }

  return {
    today: todaySpent,
    limit,
    verdict: dayVerdict(todaySpent, limit),
    week,
    weekLimit,
    weekOver: weekLimit !== null && week > weekLimit,
    streak,
    overDaysThisMonth,
  };
}
