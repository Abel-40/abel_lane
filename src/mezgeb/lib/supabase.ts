import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Only the public project URL and the anon / publishable key live in the app.
// Security comes from Supabase Auth (password + TOTP) and Row-Level Security.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let client: SupabaseClient | null = null;

export function isConfigured(): boolean {
  return Boolean(url && anonKey);
}

/** The browser client, created on first use (never during server prerender). */
export function supabase(): SupabaseClient {
  if (!url || !anonKey) throw new Error("Mezgeb is not configured: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  if (!client) {
    client = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
        storageKey: "mezgeb-auth",
      },
    });
  }
  return client;
}

/** Turns a Supabase / Postgres error into a sentence for the screen. Never includes data. */
export function friendlyError(error: unknown): string {
  const e = error as { code?: string; message?: string } | null;
  const code = e?.code ?? "";
  const message = e?.message ?? "";
  if (code === "PGRST205" || code === "42P01" || code === "42703" || /daily_spending|account_monthly_flows|held_by_account|counts_as_saving/.test(message))
    return "The database needs the 0002 update: run supabase/migrations/0002_people_goods_savings.sql in the Supabase SQL editor.";
  if (code === "23503") return "It is still in use elsewhere. Archive it instead.";
  if (code === "23505") return "Something with that name already exists.";
  if (code === "23514") return message && !message.includes("violates check constraint") ? message : "Some values are not allowed. Check the form.";
  if (code === "42501" || code === "PGRST301" || /JWT|aal2|Two-step/i.test(message)) return "Your session has ended. Sign in again.";
  if (/Failed to fetch|NetworkError|Load failed/i.test(message)) return "No connection. Check your internet and try again.";
  if (code === "P0002") return "That item no longer exists.";
  return message || "Something went wrong. Try again.";
}
