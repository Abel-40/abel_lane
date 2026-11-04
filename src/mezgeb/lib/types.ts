// Row shapes of supabase/migrations/0001_init.sql and 0002_people_goods_savings.sql. Money is integer minor units.

import type { Minor } from "./money";

type Row = { id: string; user_id: string; created_at: string; updated_at: string };

export type Settings = Row & {
  net_salary_minor: Minor;
  work_hours_per_month: number;
  payday_day: number;
  tithe_percent: number;
  base_currency: string;
  lock_minutes: number;
  hide_balances: boolean;
  trading_loss_limit_minor: Minor;
  last_backup_at: string | null;
  /** null = worked out from the monthly budget; 0 = no daily warnings */
  daily_spend_limit_minor: Minor | null;
  /** savings the year should end with, in year_savings_currency; null = not set */
  year_savings_target_minor: Minor | null;
  year_savings_currency: string;
  /** stored goods (kept at cost) count toward the yearly savings */
  savings_include_goods: boolean;
};

export type InstitutionKind = "bank" | "mobile_wallet" | "cash" | "other";
export type Institution = Row & {
  name: string;
  short_label: string;
  kind: InstitutionKind;
  color: string;
  is_archived: boolean;
  sort_order: number;
};

export type AccountRole = "salary_inbox" | "spending" | "tithe" | "trading" | "debt_fund" | "emergency" | "savings" | "usd" | "other";
export type Account = Row & {
  institution_id: string | null;
  name: string;
  role: AccountRole;
  currency: string;
  opening_balance_minor: Minor;
  is_protected: boolean;
  is_archived: boolean;
  sort_order: number;
  notes: string | null;
  /** null = decided by the role (emergency, savings, USD count) */
  counts_as_saving: boolean | null;
};

export type CategoryGroup = "personal" | "giving" | "trading" | "debt" | "work" | "other";
export type Category = Row & {
  name: string;
  kind: "expense" | "income";
  category_group: CategoryGroup;
  is_need: boolean;
  is_archived: boolean;
  sort_order: number;
};

export type TxKind = "expense" | "income" | "transfer";
export type TxSource = "manual" | "payday" | "trading" | "debt" | "wish";
export type Transaction = Row & {
  occurred_on: string;
  kind: TxKind;
  account_id: string;
  to_account_id: string | null;
  amount_minor: Minor;
  category_id: string | null;
  note: string | null;
  is_want: boolean;
  goal_id: string | null;
  debt_id: string | null;
  trip_id: string | null;
  source: TxSource;
};

export type RuleKind = "percent_of_salary" | "fixed" | "remainder";
export type PaydayRule = Row & {
  name: string;
  kind: RuleKind;
  value: number;
  target_account_id: string;
  goal_id: string | null;
  debt_id: string | null;
  sort_order: number;
  is_active: boolean;
};

export type Payday = Row & {
  received_on: string;
  amount_minor: Minor;
  account_id: string;
  income_transaction_id: string | null;
  note: string | null;
};

export type PaydayAllocation = Row & {
  payday_id: string;
  rule_id: string | null;
  name: string;
  target_account_id: string;
  goal_id: string | null;
  debt_id: string | null;
  amount_minor: Minor;
  sort_order: number;
  transaction_id: string | null;
  moved_at: string | null;
};

/** i_owe: I borrowed · owed_to_me: credit I gave · held_for_other: money I keep for someone · gift_received: never owed */
export type DebtDirection = "i_owe" | "owed_to_me" | "held_for_other" | "gift_received";
export type Debt = Row & {
  counterparty: string;
  direction: DebtDirection;
  principal_minor: Minor;
  currency: string;
  started_on: string | null;
  target_on: string | null;
  priority: number;
  status: "active" | "paid";
  notes: string | null;
  /** where the money sits (held for others) or usually moves from / to */
  account_id: string | null;
};

export type GoalKind = "emergency" | "savings" | "usd" | "custom";
export type GoalStatus = "active" | "planned" | "reached" | "archived";
export type Goal = Row & {
  name: string;
  kind: GoalKind;
  target_minor: Minor | null;
  account_id: string | null;
  deadline: string | null;
  status: GoalStatus;
  notes: string | null;
  sort_order: number;
};

export type City = Row & { name: string; short_label: string | null; is_archived: boolean; sort_order: number };
export type TradeItem = Row & { name: string; unit: string; target_margin_percent: number; is_archived: boolean; sort_order: number };

export type PriceLog = Row & { item_id: string; city_id: string; price_minor: Minor; observed_on: string; note: string | null };

/** "stock": goods kept in store (no destination yet); "trip": goods on the way to be sold */
export type TripKind = "trip" | "stock";
export type Trip = Row & {
  name: string;
  kind: TripKind;
  from_city_id: string;
  to_city_id: string | null;
  capital_account_id: string;
  started_on: string;
  closed_on: string | null;
  status: "open" | "closed";
  notes: string | null;
};

export type TripLine = Row & {
  trip_id: string;
  item_id: string;
  quantity: number;
  buy_unit_minor: Minor;
  sell_unit_minor: Minor | null;
  bought_on: string;
  sold_on: string | null;
  purchase_transaction_id: string | null;
  sale_transaction_id: string | null;
};

export type TripCostKind = "transport" | "food" | "lodging" | "phone" | "loss" | "other";
export type TripCost = Row & {
  trip_id: string;
  kind: TripCostKind;
  amount_minor: Minor;
  incurred_on: string;
  note: string | null;
  transaction_id: string | null;
};

export type Wish = Row & {
  name: string;
  amount_minor: Minor;
  ready_at: string;
  status: "waiting" | "bought" | "let_go";
  decided_at: string | null;
  transaction_id: string | null;
};

export type FxRate = Row & { base: string; quote: string; rate: number; rated_on: string };

export type AccountBalance = { account_id: string; user_id: string; currency: string; balance_minor: Minor };
/** added: what grew the amount (borrowed more, lent, deposited) · paid: what settled it */
export type DebtProgress = {
  debt_id: string;
  direction: DebtDirection;
  principal_minor: Minor;
  added_minor: Minor;
  paid_minor: Minor;
  remaining_minor: Minor;
  last_paid_on: string | null;
};
export type GoalProgress = { goal_id: string; target_minor: Minor | null; saved_minor: Minor };
export type TripSummary = {
  trip_id: string;
  kind: TripKind;
  status: "open" | "closed";
  started_on: string;
  closed_on: string | null;
  purchases_minor: Minor;
  costs_minor: Minor;
  transport_minor: Minor;
  food_minor: Minor;
  lodging_minor: Minor;
  other_costs_minor: Minor;
  sales_minor: Minor;
  net_minor: Minor;
  net_margin_percent: number | null;
  unsold_stock_minor: Minor;
  line_count: number;
  unsold_count: number;
  days_to_sell: number | null;
};
export type MonthlySummary = {
  month: string;
  personal_spent_minor: Minor;
  giving_spent_minor: Minor;
  income_minor: Minor;
  tithe_set_aside_minor: Minor;
  trading_net_minor: Minor;
  trips_closed: number;
  trading_margin_percent: number | null;
};

export type DailySpending = { day: string; currency: string; personal_spent_minor: Minor; entries: number };
export type AccountMonthlyFlow = { account_id: string; month: string; net_minor: Minor; own_net_minor: Minor | null };
export type HeldByAccount = { account_id: string; held_minor: Minor };

/** Labels shown in the UI for enum values. */
export const ROLE_LABEL: Record<AccountRole, string> = {
  salary_inbox: "Salary inbox",
  spending: "Spending",
  tithe: "Tithe",
  trading: "Trading capital",
  debt_fund: "Debt fund",
  emergency: "Emergency",
  savings: "Savings",
  usd: "USD",
  other: "Other",
};

export const INSTITUTION_KIND_LABEL: Record<InstitutionKind, string> = {
  bank: "Bank",
  mobile_wallet: "Mobile wallet",
  cash: "Cash",
  other: "Other",
};

export const GROUP_LABEL: Record<CategoryGroup, string> = {
  personal: "Personal",
  giving: "Giving",
  trading: "Trading",
  debt: "Debt",
  work: "Work",
  other: "Other",
};

export const COST_KIND_LABEL: Record<TripCostKind, string> = {
  transport: "Transport",
  food: "Food",
  lodging: "Lodging",
  phone: "Phone",
  loss: "Loss",
  other: "Other",
};

export const DIRECTION_LABEL: Record<DebtDirection, string> = {
  i_owe: "I owe",
  owed_to_me: "Credit I gave (owed to me)",
  held_for_other: "Money I keep for someone",
  gift_received: "Gift received (not a debt)",
};

/** Roles whose balances count as savings unless the account says otherwise. */
export const SAVING_ROLES: AccountRole[] = ["emergency", "savings", "usd"];

/** Roles whose balances always stay hidden until tapped. */
export const PROTECTED_ROLES: AccountRole[] = ["emergency", "savings", "debt_fund"];
