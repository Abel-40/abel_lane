import { describe, expect, it } from "vitest";
import { negativeAccounts, openingForRealBalance, tradingCapital } from "./position";
import type { Account, Debt, DebtProgress, Trip, TripSummary } from "./types";

function account(id: string, role: Account["role"], extra: Partial<Account> = {}): Account {
  return {
    id,
    user_id: "u",
    created_at: "",
    updated_at: "",
    institution_id: null,
    name: id,
    role,
    currency: "ETB",
    opening_balance_minor: 0,
    is_protected: false,
    is_archived: false,
    sort_order: 0,
    notes: null,
    counts_as_saving: null,
    ...extra,
  };
}
const trip = (id: string, accountId: string, kind: Trip["kind"], status: Trip["status"] = "open") =>
  ({ id, capital_account_id: accountId, kind, status }) as Trip;
const summary = (id: string, unsold: number) => ({ trip_id: id, unsold_stock_minor: unsold }) as TripSummary;
const lent = (id: string, accountId: string | null, status: Debt["status"] = "active") =>
  ({ id, direction: "owed_to_me", status, account_id: accountId, principal_minor: 0, currency: "ETB" }) as Debt;
const left = (id: string, remaining: number) => ({ debt_id: id, remaining_minor: remaining }) as DebtProgress;

describe("trading capital", () => {
  // The owner's case: 107,255 Br of trading money became 34,755 cash + 44,000 goods + 28,500 lent.
  const accounts = [account("trade", "trading"), account("save", "savings"), account("cash", "trading", { is_archived: true })];
  const balances = { trade: 3475500, save: 5000000, cash: 0 };
  const trips = [trip("store", "trade", "stock"), trip("savedGoods", "save", "stock"), trip("old", "trade", "trip", "closed")];
  const summaries = { store: summary("store", 4400000), savedGoods: summary("savedGoods", 700000), old: summary("old", 0) };
  const debts = [lent("mom", "trade"), lent("friend", "trade"), lent("soon", "trade"), lent("other", "save"), lent("paid", "trade", "paid")];
  const progress = { mom: left("mom", 1350000), friend: left("friend", 800000), soon: left("soon", 700000), other: left("other", 50000), paid: left("paid", 0) };

  it("adds goods and money lent from trading money to the cash", () => {
    const tc = tradingCapital(accounts, balances, trips, summaries, debts, progress, "ETB");
    expect(tc.cash).toBe(3475500);
    expect(tc.goods).toBe(4400000);
    expect(tc.lent).toBe(2850000);
    expect(tc.worth).toBe(10725500); // 107,255 Br: nothing was lost
    expect(tc.byAccount.trade.worth).toBe(10725500);
  });
  it("leaves out goods and loans paid from savings, closed trips and archived empty accounts", () => {
    const tc = tradingCapital(accounts, balances, trips, summaries, debts, progress, "ETB");
    expect(tc.byAccount.save).toBeUndefined();
    expect(tc.byAccount.cash).toBeUndefined();
  });
});

describe("fixing a balance", () => {
  it("moves the opening balance so the account shows the real amount, keeping every entry", () => {
    // opening set to today's 34,755 and the 72,500 of older entries also recorded → shows −37,745
    const opening = 3475500;
    const shown = opening - 7250000;
    expect(shown).toBe(-3774500);
    const fixed = openingForRealBalance(opening, shown, 3475500);
    expect(fixed).toBe(10725500); // the balance before those entries
    expect(fixed - 7250000).toBe(3475500);
  });
  it("finds accounts below zero", () => {
    const list = [account("a", "trading"), account("b", "spending"), account("c", "other", { is_archived: true })];
    expect(negativeAccounts(list, { a: -100, b: 50, c: -5 }).map((a) => a.id)).toEqual(["a"]);
  });
});
