// Backup file: every table of this user as one JSON document.

import { TABLES, type Table } from "./db";
import { supabase } from "./supabase";

// 2: people (held_for_other, account_id), stored goods (trips.kind), savings and daily-limit settings. Version 1 backups still import.
export const BACKUP_SCHEMA_VERSION = 2;

export type Backup = {
  app: "mezgeb";
  schema_version: number;
  exported_at: string;
  tables: Partial<Record<Table, Record<string, unknown>[]>>;
};

const PAGE = 1000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function fetchAllRows(table: Table): Promise<Record<string, unknown>[]> {
  const rows: Record<string, unknown>[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase().from(table).select("*").order("id").range(from, from + PAGE - 1);
    if (error) throw error;
    rows.push(...((data ?? []) as Record<string, unknown>[]));
    if (!data || data.length < PAGE) break;
  }
  // user_id is implied by whoever imports the file
  return rows.map((r) => {
    const copy = { ...r };
    delete copy.user_id;
    return copy;
  });
}

export async function buildBackup(): Promise<Backup> {
  const tables: Backup["tables"] = {};
  for (const t of TABLES) tables[t] = await fetchAllRows(t);
  return { app: "mezgeb", schema_version: BACKUP_SCHEMA_VERSION, exported_at: new Date().toISOString(), tables };
}

export function downloadJson(name: string, value: unknown) {
  const blob = new Blob([JSON.stringify(value, null, 1)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/** Checks the shape of a backup file. Returns the problem, or null when it looks right. */
export function validateBackup(value: unknown): string | null {
  const b = value as Partial<Backup> | null;
  if (!b || typeof b !== "object") return "This is not a Mezgeb backup file.";
  if (b.app !== "mezgeb") return "This is not a Mezgeb backup file.";
  if (typeof b.schema_version !== "number") return "The backup has no schema version.";
  if (b.schema_version > BACKUP_SCHEMA_VERSION) return "This backup comes from a newer version of Mezgeb.";
  if (!b.tables || typeof b.tables !== "object") return "The backup has no tables.";
  for (const [name, rows] of Object.entries(b.tables)) {
    if (!TABLES.includes(name as Table)) return `Unknown table in backup: ${name}.`;
    if (!Array.isArray(rows)) return `Table ${name} is not a list.`;
    for (const r of rows) {
      if (!r || typeof r !== "object") return `A row in ${name} is not valid.`;
      if (name !== "settings" && (typeof (r as { id?: unknown }).id !== "string" || !UUID.test((r as { id: string }).id))) return `A row in ${name} has no valid id.`;
    }
  }
  return null;
}

export type ImportPlan = { table: Table; total: number; added: number; updated: number }[];

/** What an import would do: per table, how many rows are new and how many replace existing ones. */
export async function planImport(backup: Backup): Promise<ImportPlan> {
  const plan: ImportPlan = [];
  for (const t of TABLES) {
    const rows = backup.tables[t] ?? [];
    if (rows.length === 0) continue;
    if (t === "settings") {
      const { count } = await supabase().from("settings").select("id", { count: "exact", head: true });
      plan.push({ table: t, total: rows.length, added: count ? 0 : 1, updated: count ? 1 : 0 });
      continue;
    }
    const existing = new Set<string>();
    for (let from = 0; ; from += PAGE) {
      const { data, error } = await supabase().from(t).select("id").order("id").range(from, from + PAGE - 1);
      if (error) throw error;
      for (const r of data ?? []) existing.add((r as { id: string }).id);
      if (!data || data.length < PAGE) break;
    }
    const updated = rows.filter((r) => existing.has(String(r.id))).length;
    plan.push({ table: t, total: rows.length, added: rows.length - updated, updated });
  }
  return plan;
}

/** The payload mz_import expects: server-managed columns removed. */
export function importPayload(backup: Backup): Record<string, unknown[]> {
  const out: Record<string, unknown[]> = {};
  for (const t of TABLES) {
    const rows = backup.tables[t];
    if (!rows || rows.length === 0) continue;
    out[t] = rows.map((r) => {
      const copy: Record<string, unknown> = { ...r };
      delete copy.user_id;
      delete copy.updated_at;
      if (t === "settings") delete copy.id;
      return copy;
    });
  }
  return out;
}
