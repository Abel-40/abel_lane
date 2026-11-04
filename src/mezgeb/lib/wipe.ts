// Danger zone: delete every row of the signed-in user, keep the login (Supabase Auth user and its
// authenticators). Runs as the user, so RLS (owner + aal2) limits it to their own rows.

import type { Table } from "./db";
import { supabase } from "./supabase";

/**
 * Children before parents, so no foreign key blocks a delete. Trips go first: their delete trigger removes
 * their goods, costs and mirrored entries. Settings go last: if a step fails, the app still works and the
 * wipe can simply run again. Without settings, Mezgeb opens the setup wizard.
 * Verified against 0001 + 0002 on Supabase Postgres 17 (another user's rows and the login stay).
 */
export const WIPE_ORDER: Table[] = [
  "trips",
  "trip_lines",
  "trip_costs",
  "payday_allocations",
  "paydays",
  "wishes",
  "transactions",
  "price_logs",
  "payday_rules",
  "goals",
  "debts",
  "trade_items",
  "cities",
  "accounts",
  "institutions",
  "categories",
  "fx_rates",
  "settings",
];

/** The words the owner must type to confirm. */
export const WIPE_CONFIRMATION = "DELETE ALL";

export async function wipeAllData(onStep?: (table: Table, done: number, total: number) => void): Promise<void> {
  const sb = supabase();
  for (const [i, table] of WIPE_ORDER.entries()) {
    onStep?.(table, i, WIPE_ORDER.length);
    // PostgREST refuses a DELETE without a filter; "id is not null" matches every row the user may see.
    const { error } = await sb.from(table).delete().not("id", "is", null);
    if (error) throw error;
  }
  onStep?.("settings", WIPE_ORDER.length, WIPE_ORDER.length);
}
