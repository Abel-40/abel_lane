// What trading money is made of, and what all assets are made of. Pure functions.
//
// Trading capital is not only the cash on trading accounts: goods bought with that money (in store or on a
// trip, at cost) and money lent from it (still owed) are the same capital in another form. Buying goods or
// lending money therefore never looks like a loss.

import { sumMinor, type Minor } from "./money";
import type { Account, Debt, DebtProgress, Trip, TripSummary } from "./types";

/** Name stored for money I took from my own (trading) money and will put back. */
export const SELF_NAME = "Myself";

/** A loan to myself: owed back to my trading money, but not an asset of mine (it is my own money). */
export function isSelfLoan(d: Pick<Debt, "direction" | "counterparty">): boolean {
  if (d.direction !== "owed_to_me") return false;
  const n = d.counterparty.trim().toLowerCase();
  return n === "myself" || n === "me";
}

export type TradingPart = { cash: Minor; goods: Minor; lent: Minor; worth: Minor };
export type TradingCapital = TradingPart & { byAccount: Record<string, TradingPart> };

/** Goods not sold yet, per paying account (open trips and stores, at cost). */
export function goodsByAccount(trips: Trip[], summaries: Record<string, TripSummary>): Record<string, Minor> {
  const out: Record<string, Minor> = {};
  for (const t of trips) {
    if (t.status !== "open") continue;
    const unsold = summaries[t.id]?.unsold_stock_minor ?? 0;
    if (unsold) out[t.capital_account_id] = (out[t.capital_account_id] ?? 0) + unsold;
  }
  return out;
}

/** Credit given and still owed, per account it came from (the person's "Usually from" account). */
export function lentByAccount(debts: Debt[], progress: Record<string, DebtProgress>): Record<string, Minor> {
  const out: Record<string, Minor> = {};
  for (const d of debts) {
    if (d.direction !== "owed_to_me" || d.status !== "active" || !d.account_id) continue;
    const left = progress[d.id]?.remaining_minor ?? d.principal_minor;
    if (left) out[d.account_id] = (out[d.account_id] ?? 0) + left;
  }
  return out;
}

export function tradingCapital(
  accounts: Account[],
  balances: Record<string, Minor>,
  trips: Trip[],
  summaries: Record<string, TripSummary>,
  debts: Debt[],
  progress: Record<string, DebtProgress>,
  currency: string,
): TradingCapital {
  const goods = goodsByAccount(trips, summaries);
  const lent = lentByAccount(debts, progress);
  const byAccount: Record<string, TradingPart> = {};
  for (const a of accounts) {
    if (a.role !== "trading") continue;
    const part = { cash: balances[a.id] ?? a.opening_balance_minor, goods: goods[a.id] ?? 0, lent: lent[a.id] ?? 0, worth: 0 };
    part.worth = part.cash + part.goods + part.lent;
    // archived trading accounts only matter while they still hold something
    if (a.is_archived && part.worth === 0) continue;
    byAccount[a.id] = part;
  }
  const own = accounts.filter((a) => byAccount[a.id] && a.currency === currency).map((a) => byAccount[a.id]);
  const cash = sumMinor(own.map((p) => p.cash));
  const g = sumMinor(own.map((p) => p.goods));
  const l = sumMinor(own.map((p) => p.lent));
  return { cash, goods: g, lent: l, worth: cash + g + l, byAccount };
}

/** A balance below zero almost always means the opening balance and older entries count the same money twice. */
export function negativeAccounts(accounts: Account[], balances: Record<string, Minor>): Account[] {
  return accounts.filter((a) => !a.is_archived && (balances[a.id] ?? a.opening_balance_minor) < 0);
}

/** The opening balance that makes the account show `real` now, keeping every recorded entry. */
export function openingForRealBalance(opening: Minor, current: Minor, real: Minor): Minor {
  return opening + (real - current);
}
