import { supabase } from "./supabase";

// Thin helpers over supabase-js. Every call runs as the signed-in user, so RLS
// (owner + aal2) decides what is visible; nothing here can widen that.

export type Table =
  | "settings"
  | "institutions"
  | "accounts"
  | "categories"
  | "debts"
  | "goals"
  | "cities"
  | "trade_items"
  | "trips"
  | "transactions"
  | "payday_rules"
  | "paydays"
  | "payday_allocations"
  | "price_logs"
  | "trip_lines"
  | "trip_costs"
  | "wishes"
  | "fx_rates";

/** Every table, in an order where parents come before children. */
export const TABLES: Table[] = [
  "settings",
  "institutions",
  "accounts",
  "categories",
  "debts",
  "goals",
  "cities",
  "trade_items",
  "trips",
  "transactions",
  "payday_rules",
  "paydays",
  "payday_allocations",
  "price_logs",
  "trip_lines",
  "trip_costs",
  "wishes",
  "fx_rates",
];

export async function insertRow<T>(table: Table, values: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase().from(table).insert(values).select().single();
  if (error) throw error;
  return data as T;
}

export async function updateRow<T>(table: Table, id: string, patch: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase().from(table).update(patch).eq("id", id).select().single();
  if (error) throw error;
  return data as T;
}

/** Saves a row: update when it has an id, insert otherwise. */
export async function saveRow<T>(table: Table, id: string | null | undefined, values: Record<string, unknown>): Promise<T> {
  return id ? updateRow<T>(table, id, values) : insertRow<T>(table, values);
}

export async function deleteRow(table: Table, id: string): Promise<void> {
  const { error } = await supabase().from(table).delete().eq("id", id);
  if (error) throw error;
}

/**
 * Deletes a row, or archives it when other rows still point at it.
 * Returns what happened so the screen can say so.
 */
export async function deleteOrArchive(table: Table, id: string): Promise<"deleted" | "archived"> {
  const { error } = await supabase().from(table).delete().eq("id", id);
  if (!error) return "deleted";
  if (error.code !== "23503") throw error;
  await updateRow(table, id, { is_archived: true });
  return "archived";
}

export async function rpc<T>(fn: string, args: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase().rpc(fn, args);
  if (error) throw error;
  return data as T;
}

export async function selectAll<T>(table: string, order: { column: string; ascending?: boolean }[] = []): Promise<T[]> {
  let q = supabase().from(table).select("*");
  for (const o of order) q = q.order(o.column, { ascending: o.ascending ?? true });
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as T[];
}
