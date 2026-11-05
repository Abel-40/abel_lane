// Labels and totals derived from loaded rows. Pure functions, no I/O.

import { computeSplit } from "./payday";
import { convertMinor, convertMinorInverse, sumMinor, type Minor } from "./money";
import {
  PROTECTED_ROLES,
  SAVING_ROLES,
  type Account,
  type AccountRole,
  type Category,
  type Debt,
  type DebtProgress,
  type FxRate,
  type Institution,
  type PaydayRule,
  type Settings,
  type Transaction,
  type TripSummary,
} from "./types";

/** "Dashen Bank" → "Dashen"; "Commercial Bank of Ethiopia" → its short label "CBE". */
export function institutionShort(inst: Institution | undefined | null): string {
  if (!inst) return "";
  const words = inst.name.trim().split(/\s+/);
  return words.length <= 2 ? words[0] : inst.short_label;
}

export function accountLabel(account: Account | undefined, institutions: Institution[]): string {
  if (!account) return "Unknown account";
  const inst = institutions.find((i) => i.id === account.institution_id);
  const short = institutionShort(inst);
  return short ? `${short} · ${account.name}` : account.name;
}

/** Counts toward the yearly savings: chosen per account, otherwise emergency, savings and USD accounts. */
export function isSavingAccount(account: Account): boolean {
  if (account.is_archived && account.counts_as_saving !== true) return false;
  return account.counts_as_saving ?? SAVING_ROLES.includes(account.role);
}

export function isProtected(account: Account): boolean {
  return account.is_protected || PROTECTED_ROLES.includes(account.role);
}

export type AccountGroup = "everyday" | "business" | "protected" | "inactive";

export function accountGroup(account: Account): AccountGroup {
  if (account.is_archived) return "inactive";
  if (account.role === "trading") return "business";
  if (isProtected(account)) return "protected";
  return "everyday";
}

export const GROUP_TITLE: Record<AccountGroup, string> = {
  everyday: "Everyday",
  business: "Business",
  protected: "Protected",
  inactive: "Inactive and planned",
};

/** Two letters for a list icon: first letter + next consonant ("Taxi" → "TX", "Trip" → "TR"). */
export function initials(text: string): string {
  const s = text.replace(/[^A-Za-zሀ-፿]/g, "");
  if (!s) return "·";
  const rest = s.slice(1).match(/[^aeiouAEIOU]/);
  return (s[0] + (rest ? rest[0] : s[1] ?? "")).toUpperCase();
}

export function entryTitle(tx: Transaction, categories: Category[]): string {
  if (tx.source === "trading" && tx.note) {
    const trip = tx.note.split(" · ")[0];
    return tx.kind === "income" ? `${trip} sold` : tx.note;
  }
  const cat = categories.find((c) => c.id === tx.category_id);
  if (cat) return cat.name;
  if (tx.note) return tx.note;
  return tx.kind === "transfer" ? "Transfer" : tx.kind === "income" ? "Income" : "Expense";
}

/** Signed effect of a transaction on one account (for per-account lists). */
export function effectOn(tx: Transaction, accountId: string): Minor {
  if (tx.kind === "income" && tx.account_id === accountId) return tx.amount_minor;
  if (tx.kind === "expense" && tx.account_id === accountId) return -tx.amount_minor;
  if (tx.kind === "transfer" && tx.to_account_id === accountId) return tx.amount_minor;
  if (tx.kind === "transfer" && tx.account_id === accountId) return -tx.amount_minor;
  return 0;
}

/** Latest rate for base → quote, or the inverse if only that exists. */
export function latestRate(rates: FxRate[], from: string, to: string): string | null {
  const sorted = [...rates].sort((a, b) => (a.rated_on < b.rated_on ? 1 : -1));
  const direct = sorted.find((r) => r.base === from && r.quote === to);
  if (direct) return String(direct.rate);
  return null;
}

/**
 * Converts between currencies with the latest manual rate: a direct rate (from → to) multiplies,
 * an inverse one (to → from, e.g. USD → ETB when converting ETB to USD) divides. null without a rate.
 */
export function convertBetween(minor: Minor, from: string, to: string, rates: FxRate[]): Minor | null {
  if (from === to) return minor;
  const direct = latestRate(rates, from, to);
  if (direct) return convertMinor(minor, direct);
  const inverse = latestRate(rates, to, from);
  if (inverse) return convertMinorInverse(minor, inverse);
  return null;
}

export type NetPosition = {
  assets: Minor;
  /** what I owe plus money I keep for other people */
  debts: Minor;
  /** part of the balances that belongs to people I keep money for */
  heldForOthers: Minor;
  /** money in all accounts (converted to the base currency) */
  cash: Minor;
  /** credit given that is still owed to me */
  owedToMe: Minor;
  net: Minor;
  unsoldStock: Minor;
  /** accounts in another currency without a rate, left out of the totals */
  skippedCurrencies: string[];
};

export function netPosition(
  accounts: Account[],
  balances: Record<string, Minor>,
  debts: Debt[],
  debtProgress: Record<string, DebtProgress>,
  tripSummaries: TripSummary[],
  rates: FxRate[],
  baseCurrency: string,
): NetPosition {
  const skipped = new Set<string>();
  const parts: Minor[] = [];
  for (const a of accounts) {
    const bal = balances[a.id] ?? a.opening_balance_minor;
    if (bal === 0) continue;
    const converted = convertBetween(bal, a.currency, baseCurrency, rates);
    if (converted === null) skipped.add(a.currency);
    else parts.push(converted);
  }
  const unsoldStock = sumMinor(tripSummaries.filter((t) => t.status === "open").map((t) => t.unsold_stock_minor));
  const owedToMe = sumMinor(
    debts.filter((d) => d.direction === "owed_to_me" && d.status === "active" && d.currency === baseCurrency).map((d) => debtProgress[d.id]?.remaining_minor ?? d.principal_minor),
  );
  const iOwe = sumMinor(
    debts.filter((d) => d.direction === "i_owe" && d.status === "active" && d.currency === baseCurrency).map((d) => debtProgress[d.id]?.remaining_minor ?? d.principal_minor),
  );
  // Money people gave me to keep sits in my accounts (so it is in the assets) but is not mine.
  const heldForOthers = sumMinor(
    debts.filter((d) => d.direction === "held_for_other" && d.status === "active" && d.currency === baseCurrency).map((d) => debtProgress[d.id]?.remaining_minor ?? d.principal_minor),
  );
  const assets = sumMinor([...parts, unsoldStock, owedToMe]);
  const owed = iOwe + heldForOthers;
  return { assets, debts: owed, heldForOthers, cash: sumMinor(parts), owedToMe, net: assets - owed, unsoldStock, skippedCurrencies: Array.from(skipped) };
}

/** How much of each salary goes to a debt / goal under the current payday rules. */
export function monthlyFromSalary(settings: Settings | null, rules: PaydayRule[], key: "debt_id" | "goal_id", id: string): Minor {
  if (!settings) return 0;
  const split = computeSplit(settings.net_salary_minor, rules);
  return sumMinor(split.lines.filter((l) => l.rule[key] === id).map((l) => l.amount_minor));
}

export function roleOrder(role: AccountRole): number {
  return ["salary_inbox", "spending", "tithe", "other", "trading", "debt_fund", "emergency", "savings", "usd"].indexOf(role);
}

export function sortAccounts(accounts: Account[]): Account[] {
  return [...accounts].sort((a, b) => a.sort_order - b.sort_order || roleOrder(a.role) - roleOrder(b.role) || a.name.localeCompare(b.name));
}
