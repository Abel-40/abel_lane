import { describe, expect, it } from "vitest";
import { addDays } from "./dates";
import { convertBetween, isSavingAccount, netPosition } from "./derive";
import { pickMessage, PRAISE, WARNINGS } from "./messages";
import { convertMinorInverse } from "./money";
import { yearSavings } from "./savings";
import { autoDailyLimit, dailyLimit, dayVerdict, monthlyPersonalBudget, spendingPulse } from "./spending";
import type { Account, Debt, DebtProgress, FxRate } from "./types";

const rules = [
  { name: "Tithe", kind: "percent_of_salary" as const, value: 1000, target_account_id: "tithe" },
  { name: "Taxi and airtime", kind: "fixed" as const, value: 250000, target_account_id: "spend" },
  { name: "Personal", kind: "fixed" as const, value: 150000, target_account_id: "spend" },
  { name: "Friend loan", kind: "fixed" as const, value: 800000, target_account_id: "debt" },
  { name: "Savings", kind: "remainder" as const, value: 0, target_account_id: "save" },
];

const rate = (base: string, quote: string, r: number, on = "2026-01-01"): FxRate =>
  ({ id: `${base}${quote}`, user_id: "u", created_at: on, updated_at: on, base, quote, rate: r, rated_on: on }) as FxRate;

function account(id: string, role: Account["role"], currency = "ETB", extra: Partial<Account> = {}): Account {
  return {
    id,
    user_id: "u",
    created_at: "",
    updated_at: "",
    institution_id: null,
    name: id,
    role,
    currency,
    opening_balance_minor: 0,
    is_protected: false,
    is_archived: false,
    sort_order: 0,
    notes: null,
    counts_as_saving: null,
    ...extra,
  };
}

describe("daily spending limit", () => {
  it("budgets only what payday sends to spending accounts", () => {
    expect(monthlyPersonalBudget(2000000, rules, ["spend"])).toBe(400000);
    expect(monthlyPersonalBudget(2000000, rules, [])).toBe(0);
  });
  it("divides the monthly budget by the days of this month, rounding down", () => {
    expect(autoDailyLimit(400000, "2026-11-04")).toBe(13333); // 4,000 Br / 30 days
    expect(autoDailyLimit(400000, "2026-02-10")).toBe(14285); // 28 days
    expect(autoDailyLimit(0, "2026-11-04")).toBeNull();
  });
  it("is automatic when unset, off at 0, fixed when set", () => {
    expect(dailyLimit(null, 400000, "2026-11-04")).toEqual({ limit: 13333, source: "auto" });
    expect(dailyLimit(0, 400000, "2026-11-04")).toEqual({ limit: null, source: "off" });
    expect(dailyLimit(20000, 400000, "2026-11-04")).toEqual({ limit: 20000, source: "set" });
    expect(dailyLimit(null, 0, "2026-11-04")).toEqual({ limit: null, source: "none" });
  });
  it("judges a day: over, near (80 %), under, none", () => {
    expect(dayVerdict(14000, 13333)).toBe("over");
    expect(dayVerdict(13333, 13333)).toBe("near");
    expect(dayVerdict(10667, 13333)).toBe("near");
    expect(dayVerdict(10000, 13333)).toBe("under");
    expect(dayVerdict(99999, null)).toBe("none");
  });
  it("counts the week, the streak and the days over this month", () => {
    const today = "2026-11-04";
    const spent = { [today]: 15000, [addDays(today, -1)]: 10000, [addDays(today, -2)]: 9000, [addDays(today, -3)]: 20000, [addDays(today, -4)]: 1000 };
    const p = spendingPulse(spent, 13333, today, "2026-01-01");
    expect(p.verdict).toBe("over");
    expect(p.today).toBe(15000);
    expect(p.week).toBe(55000);
    expect(p.weekLimit).toBe(93331);
    expect(p.weekOver).toBe(false);
    expect(p.streak).toBe(2); // 3 and 2 Nov under, 1 Nov over
    expect(p.overDaysThisMonth).toBe(2); // 4 and 1 Nov (31 Oct is last month)
    expect(spendingPulse(spent, 13333, today, addDays(today, -1)).streak).toBe(1); // nothing counts before set-up
    expect(spendingPulse(spent, null, today, "2026-01-01").streak).toBe(0);
  });
});

describe("currency conversion", () => {
  const rates = [rate("USD", "ETB", 125.5)];
  it("multiplies with a direct rate and divides with the inverse one", () => {
    expect(convertBetween(10000, "USD", "ETB", rates)).toBe(1255000); // $100 → 12,550 Br
    expect(convertBetween(1255000, "ETB", "USD", rates)).toBe(10000);
    expect(convertBetween(1000000, "ETB", "USD", rates)).toBe(7968); // 10,000 Br → $79.68
    expect(convertBetween(5, "ETB", "ETB", rates)).toBe(5);
    expect(convertBetween(5, "EUR", "ETB", rates)).toBeNull();
  });
  it("rejects a zero or malformed rate", () => {
    expect(convertMinorInverse(100, "0")).toBeNull();
    expect(convertMinorInverse(100, "abc")).toBeNull();
  });
});

describe("savings accounts", () => {
  it("follow the role unless chosen per account", () => {
    expect(isSavingAccount(account("a", "savings"))).toBe(true);
    expect(isSavingAccount(account("a", "emergency"))).toBe(true);
    expect(isSavingAccount(account("a", "usd", "USD"))).toBe(true);
    expect(isSavingAccount(account("a", "spending"))).toBe(false);
    expect(isSavingAccount(account("a", "spending", "ETB", { counts_as_saving: true }))).toBe(true);
    expect(isSavingAccount(account("a", "savings", "ETB", { counts_as_saving: false }))).toBe(false);
    expect(isSavingAccount(account("a", "savings", "ETB", { is_archived: true }))).toBe(false);
  });
});

describe("yearly savings", () => {
  const accounts = [account("save", "savings"), account("usd", "usd", "USD"), account("spend", "spending"), account("box", "other", "ETB", { counts_as_saving: true })];
  const balances = { save: 1400000, usd: 10000, spend: 50000, box: 0 };
  const base = {
    accounts,
    balances,
    heldByAccount: { save: 400000 },
    flows: [
      { account_id: "save", month: "2026-01-01", net_minor: 300000, own_net_minor: 300000 },
      { account_id: "save", month: "2026-06-01", net_minor: 700000, own_net_minor: 300000 },
      { account_id: "save", month: "2025-12-01", net_minor: 999999, own_net_minor: 999999 }, // last year: ignored
      { account_id: "spend", month: "2026-03-01", net_minor: 500000, own_net_minor: 500000 }, // not savings
    ],
    goodsMinor: 500000,
    includeGoods: true,
    target: 3000000,
    currency: "ETB",
    baseCurrency: "ETB",
    rates: [rate("USD", "ETB", 125.5)],
    today: "2026-07-02",
  };

  it("adds savings accounts, converts USD, adds goods and leaves out money kept for others", () => {
    const y = yearSavings(base);
    expect(y.heldInSavings).toBe(400000);
    expect(y.goods).toBe(500000);
    expect(y.saved).toBe(1000000 + 1255000 + 500000);
    expect(y.growth).toBe(600000);
  });
  it("projects 31 December at this year's pace and says what each month needs", () => {
    const y = yearSavings(base);
    // day 183 of 365: 2,755,000 + 600,000 × 182 / 183
    expect(y.projected).toBe(2755000 + 596721);
    expect(y.onTrack).toBe(true);
    expect(y.gap).toBe(245000);
    expect(y.monthsLeft).toBe(6);
    expect(y.perMonthNeeded).toBe(40834);
    expect(y.yearEnd).toBe("2026-12-31");
  });
  it("can leave goods out and works in USD", () => {
    expect(yearSavings({ ...base, includeGoods: false }).saved).toBe(2255000);
    const usd = yearSavings({ ...base, currency: "USD", target: 30000 });
    expect(usd.saved).toBe(7968 + 10000 + 3984);
    expect(usd.skippedCurrencies).toEqual([]);
  });
  it("reports currencies without a rate instead of guessing", () => {
    const y = yearSavings({ ...base, rates: [] });
    expect(y.saved).toBe(1000000 + 500000);
    expect(y.skippedCurrencies).toEqual(["USD"]);
  });
  it("has no projection in the first week and no plan without a target", () => {
    expect(yearSavings({ ...base, today: "2026-01-03" }).projected).toBeNull();
    const none = yearSavings({ ...base, target: null });
    expect(none.gap).toBeNull();
    expect(none.onTrack).toBeNull();
    expect(none.perMonthNeeded).toBeNull();
  });
  it("needs nothing more once the target is reached", () => {
    const y = yearSavings({ ...base, target: 1000000 });
    expect(y.gap).toBe(0);
    expect(y.perMonthNeeded).toBe(0);
    expect(y.onTrack).toBe(true);
  });
});

describe("net position with people", () => {
  const debt = (id: string, direction: Debt["direction"], principal: number): Debt =>
    ({ id, user_id: "u", created_at: "", updated_at: "", counterparty: id, direction, principal_minor: principal, currency: "ETB", started_on: null, target_on: null, priority: 1, status: "active", notes: null, account_id: null }) as Debt;
  const progress = (id: string, direction: Debt["direction"], remaining: number): DebtProgress => ({ debt_id: id, direction, principal_minor: 0, added_minor: 0, paid_minor: 0, remaining_minor: remaining, last_paid_on: null });

  it("treats money kept for others as owed, and credit given as an asset", () => {
    const debts = [debt("loan", "i_owe", 6000000), debt("sister", "held_for_other", 0), debt("neighbour", "owed_to_me", 0)];
    const p = netPosition(
      [account("save", "savings")],
      { save: 1400000 },
      debts,
      { loan: progress("loan", "i_owe", 5200000), sister: progress("sister", "held_for_other", 400000), neighbour: progress("neighbour", "owed_to_me", 200000) },
      [],
      [],
      "ETB",
    );
    expect(p.heldForOthers).toBe(400000);
    expect(p.assets).toBe(1400000 + 200000);
    expect(p.debts).toBe(5200000 + 400000);
    expect(p.net).toBe(1600000 - 5600000);
  });
});

describe("messages", () => {
  it("has 100 different warnings and 100 different words of praise", () => {
    expect(WARNINGS).toHaveLength(100);
    expect(PRAISE).toHaveLength(100);
    expect(new Set(WARNINGS).size).toBe(100);
    expect(new Set(PRAISE).size).toBe(100);
  });
  it("picks the same message for the same seed and varies across days", () => {
    expect(pickMessage(WARNINGS, "day-over|2026-11-04|")).toBe(pickMessage(WARNINGS, "day-over|2026-11-04|"));
    const days = Array.from({ length: 30 }, (_, i) => pickMessage(WARNINGS, `day-over|${addDays("2026-11-01", i)}|`));
    expect(new Set(days).size).toBeGreaterThan(15);
    expect(WARNINGS).toContain(days[0]);
  });
});
