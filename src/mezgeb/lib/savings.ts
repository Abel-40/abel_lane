// What the year's savings are now, how they grew since 1 January, and where they end at this pace. Pure functions.

import { daysBetween, parseISO, type ISODate } from "./dates";
import { convertBetween, isSavingAccount } from "./derive";
import { divCeil, divRound, sharePercent, sumMinor, type Minor } from "./money";
import type { Account, AccountMonthlyFlow, FxRate } from "./types";

export type YearSavings = {
  currency: string;
  /** saving accounts (without money kept for others) + stored goods when they count */
  saved: Minor;
  goods: Minor;
  /** money of other people sitting in saving accounts, left out of `saved` */
  heldInSavings: Minor;
  /** own growth of the saving accounts since 1 January (deposits from people left out) */
  growth: Minor;
  /** savings on 31 December if the year continues at this pace; null in the first week */
  projected: Minor | null;
  target: Minor | null;
  /** what is still missing to reach the target (0 when reached) */
  gap: Minor | null;
  /** months left, this one included */
  monthsLeft: number;
  perMonthNeeded: Minor | null;
  percent: number;
  onTrack: boolean | null;
  /** currencies without an exchange rate, left out */
  skippedCurrencies: string[];
  yearEnd: ISODate;
};

export type YearSavingsInput = {
  accounts: Account[];
  balances: Record<string, Minor>;
  heldByAccount: Record<string, Minor>;
  /** account_monthly_flows rows of this year */
  flows: AccountMonthlyFlow[];
  /** value of stored goods at cost, in the base currency */
  goodsMinor: Minor;
  includeGoods: boolean;
  target: Minor | null;
  currency: string;
  baseCurrency: string;
  rates: FxRate[];
  today: ISODate;
};

export function yearSavings(input: YearSavingsInput): YearSavings {
  const { accounts, balances, heldByAccount, flows, goodsMinor, includeGoods, target, currency, baseCurrency, rates, today } = input;
  const year = today.slice(0, 4);
  const yearStart = `${year}-01-01`;
  const yearEnd = `${year}-12-31`;
  const skipped = new Set<string>();
  const convert = (minor: Minor, from: string): Minor => {
    const v = convertBetween(minor, from, currency, rates);
    if (v === null) {
      skipped.add(from);
      return 0;
    }
    return v;
  };

  const own: Minor[] = [];
  const held: Minor[] = [];
  const growth: Minor[] = [];
  for (const a of accounts.filter(isSavingAccount)) {
    const balance = balances[a.id] ?? a.opening_balance_minor;
    const heldHere = Math.min(Math.max(heldByAccount[a.id] ?? 0, 0), Math.max(balance, 0));
    own.push(convert(balance - heldHere, a.currency));
    held.push(convert(heldHere, a.currency));
    const grew = sumMinor(flows.filter((f) => f.account_id === a.id && f.month.slice(0, 4) === year).map((f) => f.own_net_minor ?? f.net_minor));
    growth.push(convert(grew, a.currency));
  }
  const goods = includeGoods && goodsMinor > 0 ? convert(goodsMinor, baseCurrency) : 0;
  const saved = sumMinor(own) + goods;
  const grew = sumMinor(growth);

  const elapsed = daysBetween(yearStart, today) + 1;
  const total = daysBetween(yearStart, yearEnd) + 1;
  const projected = elapsed >= 7 ? saved + Number(divRound(BigInt(grew) * BigInt(total - elapsed), BigInt(elapsed))) : null;

  const monthsLeft = 12 - parseISO(today).getMonth();
  const gap = target ? Math.max(target - saved, 0) : null;
  return {
    currency,
    saved,
    goods,
    heldInSavings: sumMinor(held),
    growth: grew,
    projected,
    target,
    gap,
    monthsLeft,
    perMonthNeeded: gap === null ? null : gap === 0 ? 0 : divCeil(gap, monthsLeft),
    percent: target ? sharePercent(saved, target) : 0,
    onTrack: target ? (projected ?? saved) >= target : null,
    skippedCurrencies: Array.from(skipped),
    yearEnd,
  };
}
