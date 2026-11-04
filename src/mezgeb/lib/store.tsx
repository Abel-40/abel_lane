"use client";

import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { selectAll } from "./db";
import { sortAccounts } from "./derive";
import { addDays, monthStart, todayISO } from "./dates";
import { rememberLockMinutes } from "./session";
import { friendlyError, supabase } from "./supabase";
import type {
  Account,
  AccountBalance,
  AccountMonthlyFlow,
  DailySpending,
  HeldByAccount,
  Category,
  City,
  Debt,
  DebtProgress,
  FxRate,
  Goal,
  GoalProgress,
  Institution,
  MonthlySummary,
  PaydayRule,
  Settings,
  TradeItem,
  Transaction,
  Trip,
  TripSummary,
  Wish,
} from "./types";

export type MzData = {
  settings: Settings | null;
  institutions: Institution[];
  accounts: Account[];
  balances: Record<string, number>;
  categories: Category[];
  debts: Debt[];
  debtProgress: Record<string, DebtProgress>;
  goals: Goal[];
  goalProgress: Record<string, GoalProgress>;
  rules: PaydayRule[];
  wishes: Wish[];
  cities: City[];
  items: TradeItem[];
  trips: Trip[];
  tripSummaries: Record<string, TripSummary>;
  months: MonthlySummary[];
  thisMonth: MonthlySummary | null;
  recent: Transaction[];
  fxRates: FxRate[];
  /** personal spending per day, last 40 days, every currency */
  dailySpending: DailySpending[];
  /** net movement per account and month since 1 January */
  flows: AccountMonthlyFlow[];
  /** money of people I keep money for, per account */
  heldByAccount: Record<string, number>;
};

type Ctx = {
  data: MzData | null;
  error: string | null;
  reload: () => Promise<void>;
};

const DataCtx = createContext<Ctx>({ data: null, error: null, reload: async () => {} });

function byId<T extends Record<string, unknown>>(rows: T[], key: keyof T): Record<string, T> {
  const out: Record<string, T> = {};
  for (const r of rows) out[String(r[key])] = r;
  return out;
}

async function loadAll(): Promise<MzData> {
  const sb = supabase();
  const [
    settingsRows,
    institutions,
    accounts,
    balances,
    categories,
    debts,
    debtProgress,
    goals,
    goalProgress,
    rules,
    wishes,
    cities,
    items,
    trips,
    tripSummaries,
    months,
    recent,
    fxRates,
    dailySpending,
    flows,
    held,
  ] = await Promise.all([
    selectAll<Settings>("settings"),
    selectAll<Institution>("institutions", [{ column: "sort_order" }, { column: "created_at" }]),
    selectAll<Account>("accounts", [{ column: "sort_order" }, { column: "created_at" }]),
    selectAll<AccountBalance>("account_balances"),
    selectAll<Category>("categories", [{ column: "sort_order" }, { column: "created_at" }]),
    selectAll<Debt>("debts", [{ column: "priority" }, { column: "created_at" }]),
    selectAll<DebtProgress>("debt_progress"),
    selectAll<Goal>("goals", [{ column: "sort_order" }, { column: "created_at" }]),
    selectAll<GoalProgress>("goal_progress"),
    selectAll<PaydayRule>("payday_rules", [{ column: "sort_order" }, { column: "created_at" }]),
    selectAll<Wish>("wishes", [{ column: "created_at", ascending: false }]),
    selectAll<City>("cities", [{ column: "sort_order" }, { column: "created_at" }]),
    selectAll<TradeItem>("trade_items", [{ column: "sort_order" }, { column: "name" }]),
    selectAll<Trip>("trips", [{ column: "started_on", ascending: false }, { column: "created_at", ascending: false }]),
    selectAll<TripSummary>("trip_summaries"),
    selectAll<MonthlySummary>("monthly_summary", [{ column: "month", ascending: false }]),
    sb
      .from("transactions")
      .select("*")
      .order("occurred_on", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(8)
      .then(({ data, error }) => {
        if (error) throw error;
        return (data ?? []) as Transaction[];
      }),
    selectAll<FxRate>("fx_rates", [{ column: "rated_on", ascending: false }]),
    sb
      .from("daily_spending")
      .select("day, currency, personal_spent_minor, entries")
      .gte("day", addDays(todayISO(), -40))
      .then(({ data, error }) => {
        if (error) throw error;
        return (data ?? []) as DailySpending[];
      }),
    sb
      .from("account_monthly_flows")
      .select("account_id, month, net_minor, own_net_minor")
      .gte("month", `${todayISO().slice(0, 4)}-01-01`)
      .then(({ data, error }) => {
        if (error) throw error;
        return (data ?? []) as AccountMonthlyFlow[];
      }),
    selectAll<HeldByAccount>("held_by_account"),
  ]);

  const balanceMap: Record<string, number> = {};
  for (const b of balances) balanceMap[b.account_id] = b.balance_minor;
  const start = monthStart();
  return {
    settings: settingsRows[0] ?? null,
    institutions,
    accounts: sortAccounts(accounts),
    balances: balanceMap,
    categories,
    debts,
    debtProgress: byId(debtProgress, "debt_id"),
    goals,
    goalProgress: byId(goalProgress, "goal_id"),
    rules,
    wishes,
    cities,
    items,
    trips,
    tripSummaries: byId(tripSummaries, "trip_id"),
    months,
    thisMonth: months.find((m) => m.month.slice(0, 10) === start) ?? null,
    recent,
    fxRates,
    dailySpending,
    flows,
    heldByAccount: Object.fromEntries(held.map((h) => [h.account_id, h.held_minor])),
  };
}

/** Loads everything Mezgeb shows (one person's data is small) and keeps it fresh. */
export function DataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<MzData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const path = (usePathname() ?? "").replace(/\/$/, "");

  const reload = useCallback(async () => {
    try {
      const next = await loadAll();
      setData(next);
      setError(null);
      if (next.settings) rememberLockMinutes(next.settings.lock_minutes);
    } catch (e) {
      setError(friendlyError(e));
    }
  }, []);

  useEffect(() => {
    void reload();
    // refresh when the app comes back to the foreground
    const onVisible = () => {
      if (document.visibilityState === "visible") void reload();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [reload]);

  // First run: no settings row yet → setup wizard.
  useEffect(() => {
    if (!data) return;
    if (!data.settings && path !== "/mezgeb/setup") router.replace("/mezgeb/setup");
    if (data.settings && path === "/mezgeb/setup") router.replace("/mezgeb");
  }, [data, path, router]);

  const value = useMemo(() => ({ data, error, reload }), [data, error, reload]);
  return <DataCtx.Provider value={value}>{children}</DataCtx.Provider>;
}

export function useMz() {
  return useContext(DataCtx);
}
