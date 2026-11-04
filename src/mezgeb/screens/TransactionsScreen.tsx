"use client";

import { useCallback, useEffect, useState } from "react";
import { EntryRow } from "../components/EntryRow";
import { BackIcon } from "../components/Icons";
import { DataFallback, ErrorLine, Money } from "../components/ui";
import { monthName, parseISO, shortDay, toISO, todayISO } from "../lib/dates";
import { accountLabel } from "../lib/derive";
import { sumMinor } from "../lib/money";
import { useMz } from "../lib/store";
import { friendlyError, supabase } from "../lib/supabase";
import type { Transaction, TxKind } from "../lib/types";
import { EntryEditor } from "./EntryEditor";

function shiftMonth(month: string, by: number): string {
  const d = parseISO(month);
  return toISO(new Date(d.getFullYear(), d.getMonth() + by, 1));
}

export function TransactionsScreen() {
  const { data, error: loadError, reload } = useMz();
  const [month, setMonth] = useState(() => todayISO().slice(0, 7) + "-01");
  const [kind, setKind] = useState<TxKind | "all">("all");
  const [accountId, setAccountId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [rows, setRows] = useState<Transaction[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Transaction | null>(null);

  const load = useCallback(async () => {
    setError(null);
    let q = supabase()
      .from("transactions")
      .select("*")
      .gte("occurred_on", month)
      .lt("occurred_on", shiftMonth(month, 1))
      .order("occurred_on", { ascending: false })
      .order("created_at", { ascending: false });
    if (kind !== "all") q = q.eq("kind", kind);
    if (accountId) q = q.or(`account_id.eq.${accountId},to_account_id.eq.${accountId}`);
    if (categoryId) q = q.eq("category_id", categoryId);
    const { data: list, error: e } = await q;
    if (e) return setError(friendlyError(e));
    setRows((list ?? []) as Transaction[]);
  }, [month, kind, accountId, categoryId]);

  useEffect(() => {
    void load();
  }, [load, data]);

  if (!data) return <DataFallback error={loadError} onRetry={reload} />;

  if (editing) {
    return (
      <EntryEditor
        key={editing.id}
        editing={editing}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          void load();
        }}
      />
    );
  }

  const isCurrent = month === todayISO().slice(0, 7) + "-01";
  const groups: { day: string; items: Transaction[] }[] = [];
  for (const tx of rows ?? []) {
    const last = groups[groups.length - 1];
    if (last && last.day === tx.occurred_on) last.items.push(tx);
    else groups.push({ day: tx.occurred_on, items: [tx] });
  }
  const out = sumMinor((rows ?? []).filter((t) => t.kind === "expense").map((t) => t.amount_minor));
  const inn = sumMinor((rows ?? []).filter((t) => t.kind === "income").map((t) => t.amount_minor));

  return (
    <main className="mz-page">
      <header className="mz-head">
        <div className="mz-head__text">
          <h1 className="mz-title">Entries</h1>
          <span className="mz-subtitle">
            {monthName(month)} {month.slice(0, 4)}
          </span>
        </div>
        <div className="mz-row-center" style={{ gap: 8 }}>
          <button type="button" className="mz-icon-btn" aria-label="Previous month" onClick={() => setMonth((m) => shiftMonth(m, -1))}>
            <BackIcon />
          </button>
          <button type="button" className="mz-icon-btn" aria-label="Next month" disabled={isCurrent} onClick={() => setMonth((m) => shiftMonth(m, 1))}>
            <BackIcon style={{ transform: "rotate(180deg)" }} />
          </button>
        </div>
      </header>

      <div className="mz-chips" role="group" aria-label="Kind">
        {(["all", "expense", "income", "transfer"] as const).map((k) => (
          <button key={k} type="button" className="mz-chip" aria-pressed={kind === k} onClick={() => setKind(k)}>
            {k === "all" ? "All" : k[0].toUpperCase() + k.slice(1)}
          </button>
        ))}
      </div>
      <div className="mz-grid-2">
        <label className="mz-field">
          <span className="mz-sr-only">Account</span>
          <select className="mz-select" value={accountId} onChange={(e) => setAccountId(e.target.value)} style={{ height: 44, fontSize: 14 }}>
            <option value="">All accounts</option>
            {data.accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {accountLabel(a, data.institutions)}
              </option>
            ))}
          </select>
        </label>
        <label className="mz-field">
          <span className="mz-sr-only">Category</span>
          <select className="mz-select" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} style={{ height: 44, fontSize: 14 }}>
            <option value="">All categories</option>
            {data.categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mz-grid-2">
        <div className="mz-stat">
          <span className="mz-stat__label">Out</span>
          <span className="mz-stat__value">
            <Money minor={-out} />
          </span>
        </div>
        <div className="mz-stat">
          <span className="mz-stat__label">In</span>
          <span className="mz-stat__value mz-pos">
            <Money minor={inn} sign />
          </span>
        </div>
      </div>

      <ErrorLine text={error} />
      {rows === null ? (
        <div className="mz-row-center mz-muted">
          <span className="mz-spinner" aria-hidden="true" /> Loading…
        </div>
      ) : rows.length === 0 ? (
        <div className="mz-empty">No entries for these filters.</div>
      ) : (
        groups.map((g) => (
          <section key={g.day} className="mz-stack" aria-label={shortDay(g.day)}>
            <span className="mz-section-label">{shortDay(g.day)}</span>
            <div className="mz-stack" style={{ gap: 4 }}>
              {g.items.map((tx) => (
                <EntryRow key={tx.id} tx={tx} compact onOpen={() => setEditing(tx)} signFor={accountId || undefined} />
              ))}
            </div>
          </section>
        ))
      )}
    </main>
  );
}
