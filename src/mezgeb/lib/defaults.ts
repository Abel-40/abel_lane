// Suggested first-run plan. Nothing here is hard-wired into the app: the
// wizard shows every value for editing before anything is saved.

import { nextEndOf } from "./dates";
import type { Account, Category, City, Debt, Goal, Institution, PaydayRule, Settings } from "./types";

type Draft<T> = Omit<T, "user_id" | "created_at" | "updated_at">;

export type Plan = {
  settings: Omit<Draft<Settings>, "id" | "last_backup_at">;
  institutions: Draft<Institution>[];
  accounts: Draft<Account>[];
  categories: Draft<Category>[];
  debts: Draft<Debt>[];
  goals: Draft<Goal>[];
  payday_rules: Draft<PaydayRule>[];
  cities: Draft<City>[];
};

export function newId(): string {
  const c = globalThis.crypto;
  if (typeof c.randomUUID === "function") return c.randomUUID();
  // RFC 4122 v4 from getRandomValues
  const b = c.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

const Br = (amount: number) => amount * 100;

export function defaultPlan(today?: string): Plan {
  const inst = (name: string, short_label: string, kind: Institution["kind"], color: string, sort_order: number): Draft<Institution> => ({
    id: newId(),
    name,
    short_label,
    kind,
    color,
    is_archived: false,
    sort_order,
  });
  const cbe = inst("Commercial Bank of Ethiopia", "CBE", "bank", "#E6CCFF", 1);
  const telebirr = inst("Telebirr", "tele", "mobile_wallet", "#A9DBFF", 2);
  const ebirr = inst("ebirr", "ebirr", "mobile_wallet", "#B8F0C8", 3);
  const dashen = inst("Dashen Bank", "DSH", "bank", "#9FE7F0", 4);
  const awash = inst("Awash Bank", "AWS", "bank", "#FFD991", 5);

  const acc = (
    institution: Draft<Institution> | null,
    name: string,
    role: Account["role"],
    notes: string | null,
    sort_order: number,
    extra: Partial<Draft<Account>> = {},
  ): Draft<Account> => ({
    id: newId(),
    institution_id: institution?.id ?? null,
    name,
    role,
    currency: "ETB",
    opening_balance_minor: 0,
    is_protected: role === "debt_fund" || role === "emergency" || role === "savings",
    is_archived: false,
    sort_order,
    notes,
    counts_as_saving: null,
    ...extra,
  });
  const inbox = acc(cbe, "Salary inbox", "salary_inbox", "Empties every payday", 1);
  const capital = acc(cbe, "Trading capital", "trading", "Never for personal spending", 2);
  const spending = acc(telebirr, "Spending", "spending", "Taxi, airtime, fun · topped up weekly", 3);
  const tithe = acc(telebirr, "Tithe", "tithe", "Set aside first, given from here", 4);
  const debtFund = acc(dashen, "Debt fund", "debt_fund", "For the friend loan", 5);
  const awashSavings = acc(awash, "Emergency and savings", "emergency", "Emergency fund and long-term savings", 6);
  const ebirr1 = acc(ebirr, "Wallet 1", "other", null, 7, { is_archived: true });
  const ebirr2 = acc(ebirr, "Wallet 2", "other", null, 8, { is_archived: true });
  const usd = acc(null, "USD account", "usd", "When freelance income starts", 9, { currency: "USD", is_archived: true });

  const friendLoan: Draft<Debt> = {
    id: newId(),
    counterparty: "Friend loan",
    direction: "i_owe",
    principal_minor: Br(60000),
    currency: "ETB",
    started_on: null,
    target_on: nextEndOf(0, today),
    priority: 1,
    status: "active",
    notes: "Pay first",
    account_id: null,
  };
  const uncle: Draft<Debt> = {
    id: newId(),
    counterparty: "Uncle · start-up money",
    direction: "gift_received",
    principal_minor: Br(55000),
    currency: "ETB",
    started_on: null,
    target_on: null,
    priority: 2,
    status: "active",
    notes: "A gift, not a debt",
    account_id: null,
  };

  const goal = (name: string, kind: Goal["kind"], target: number | null, account: Draft<Account> | null, status: Goal["status"], sort_order: number, notes: string | null): Draft<Goal> => ({
    id: newId(),
    name,
    kind,
    target_minor: target === null ? null : Br(target),
    account_id: account?.id ?? null,
    deadline: null,
    status,
    notes,
    sort_order,
  });
  const emergency = goal("Emergency fund", "emergency", 30000, awashSavings, "active", 1, null);
  const longTerm = goal("Long-term savings", "savings", null, awashSavings, "active", 2, "Gets the debt payment once the loan is paid");
  const usdGoal = goal("USD savings", "usd", null, usd, "planned", 3, "Starts with your first freelance income");

  const rule = (name: string, kind: PaydayRule["kind"], value: number, target: Draft<Account>, sort_order: number, extra: Partial<Draft<PaydayRule>> = {}): Draft<PaydayRule> => ({
    id: newId(),
    name,
    kind,
    value,
    target_account_id: target.id,
    goal_id: null,
    debt_id: null,
    sort_order,
    is_active: true,
    ...extra,
  });

  const cat = (name: string, kind: Category["kind"], category_group: Category["category_group"], is_need: boolean, sort_order: number): Draft<Category> => ({
    id: newId(),
    name,
    kind,
    category_group,
    is_need,
    is_archived: false,
    sort_order,
  });

  const city = (name: string, short_label: string | null, sort_order: number): Draft<City> => ({ id: newId(), name, short_label, is_archived: false, sort_order });

  return {
    settings: {
      net_salary_minor: Br(20000),
      work_hours_per_month: 176,
      payday_day: 30,
      tithe_percent: 10,
      base_currency: "ETB",
      lock_minutes: 5,
      hide_balances: false,
      trading_loss_limit_minor: Br(100000),
      daily_spend_limit_minor: null,
      year_savings_target_minor: null,
      year_savings_currency: "ETB",
      savings_include_goods: true,
    },
    institutions: [cbe, telebirr, ebirr, dashen, awash],
    accounts: [inbox, capital, spending, tithe, debtFund, awashSavings, ebirr1, ebirr2, usd],
    debts: [friendLoan, uncle],
    goals: [emergency, longTerm, usdGoal],
    payday_rules: [
      rule("Tithe", "percent_of_salary", 1000, tithe, 1),
      rule("Taxi and airtime", "fixed", Br(2500), spending, 2),
      rule("Personal and fun", "fixed", Br(1500), spending, 3),
      rule("Friend loan", "fixed", Br(8000), debtFund, 4, { debt_id: friendLoan.id }),
      rule("Emergency fund", "fixed", Br(4000), awashSavings, 5, { goal_id: emergency.id }),
      rule("Long-term savings", "remainder", 0, awashSavings, 6, { goal_id: longTerm.id }),
    ],
    categories: [
      cat("Taxi", "expense", "personal", true, 1),
      cat("Airtime", "expense", "personal", true, 2),
      cat("Eating out", "expense", "personal", false, 3),
      cat("Clothes", "expense", "personal", false, 4),
      cat("Gifts", "expense", "personal", false, 5),
      cat("Family", "expense", "personal", true, 6),
      cat("Tithe", "expense", "giving", true, 7),
      cat("Trading stock", "expense", "trading", true, 8),
      cat("Trading costs", "expense", "trading", true, 9),
      cat("Debt payment", "expense", "debt", true, 10),
      cat("Salary", "income", "work", true, 11),
      cat("Contract work", "income", "work", true, 12),
      cat("Freelance", "income", "work", true, 13),
      cat("Trading sales", "income", "trading", true, 14),
    ],
    cities: [city("Arba Minch", "AM", 1), city("Addis Ababa", "Addis", 2), city("Adama", null, 3), city("Hawassa", null, 4)],
  };
}

/** The payload for mz_import(p_require_empty = true). Settings go in as one row. */
export function planToImport(plan: Plan): Record<string, unknown[]> {
  return {
    settings: [plan.settings],
    institutions: plan.institutions,
    accounts: plan.accounts,
    categories: plan.categories,
    debts: plan.debts,
    goals: plan.goals,
    cities: plan.cities,
    payday_rules: plan.payday_rules,
  };
}
