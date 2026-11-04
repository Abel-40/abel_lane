"use client";

import { useState } from "react";
import { deleteRow, saveRow } from "../lib/db";
import { accountLabel } from "../lib/derive";
import { formatBp, formatMinor, sharePercent } from "../lib/money";
import { computeSplit } from "../lib/payday";
import { useMz } from "../lib/store";
import { friendlyError } from "../lib/supabase";
import type { PaydayRule } from "../lib/types";
import { RuleForm } from "./forms";
import { Sheet, useToast } from "./ui";

// Theme variables, so the split bar adapts to light and dark mode.
export const SPLIT_COLORS = ["var(--mz-series-1)", "var(--mz-text)", "var(--mz-muted)", "var(--mz-amber)", "var(--mz-accent)", "var(--mz-series-2)"];

/** Payday rules with a live preview of how today's salary splits. */
export function RulesManager() {
  const { data, reload } = useMz();
  const toast = useToast();
  const [editing, setEditing] = useState<PaydayRule | "new" | null>(null);
  if (!data?.settings) return null;
  const { settings, rules, accounts, institutions, goals, debts } = data;
  const split = computeSplit(settings.net_salary_minor, rules);
  const inactive = rules.filter((r) => !r.is_active);

  async function save(values: Record<string, unknown>) {
    const id = editing && editing !== "new" ? editing.id : null;
    await saveRow("payday_rules", id, id ? values : { ...values, sort_order: rules.length + 1 });
    await reload();
    setEditing(null);
    toast(id ? "Rule updated." : "Rule added.");
  }
  async function remove(rule: PaydayRule) {
    if (!window.confirm(`Delete the rule "${rule.name}"? Past paydays keep their split.`)) return;
    try {
      await deleteRow("payday_rules", rule.id);
      await reload();
      setEditing(null);
    } catch (e) {
      toast(friendlyError(e), true);
    }
  }

  return (
    <div className="mz-stack" style={{ gap: 10 }}>
      <div className="mz-card">
        <div className="mz-row-between">
          <span className="mz-muted" style={{ fontSize: 13 }}>
            On a salary of
          </span>
          <span className="mz-num mz-strong">{formatMinor(settings.net_salary_minor, settings.base_currency)}</span>
        </div>
        <div className="mz-split" aria-hidden="true">
          {split.lines.map((l, i) => (
            <span key={l.rule.id} style={{ width: `${sharePercent(l.amount_minor, settings.net_salary_minor)}%`, background: SPLIT_COLORS[i % SPLIT_COLORS.length] }} />
          ))}
        </div>
        <span className={`mz-small mz-strong ${split.ok ? "mz-pos" : "mz-warn"}`}>
          {split.ok ? "Adds up: 0 Br left to assign" : `${split.error} ${formatMinor(Math.abs(split.leftover))} ${split.leftover > 0 ? "left" : "over"}.`}
        </span>
      </div>
      <ul className="mz-stack">
        {split.lines.map((l, i) => (
          <li key={l.rule.id}>
            <button type="button" className="mz-card mz-card--sm mz-card--row" onClick={() => setEditing(l.rule)}>
              <span className="mz-swatch" style={{ background: SPLIT_COLORS[i % SPLIT_COLORS.length] }} aria-hidden="true" />
              <span className="mz-row__main">
                <span className="mz-row__title">
                  {l.rule.name}
                  {l.rule.kind === "percent_of_salary" ? ` · ${formatBp(l.rule.value)}` : l.rule.kind === "remainder" ? " · remainder" : ""}
                </span>
                <span className="mz-row__sub">→ {accountLabel(accounts.find((a) => a.id === l.rule.target_account_id), institutions)}</span>
              </span>
              <span className="mz-row__value">{formatMinor(l.amount_minor, settings.base_currency, { symbol: false })}</span>
            </button>
          </li>
        ))}
        {inactive.map((r) => (
          <li key={r.id}>
            <button type="button" className="mz-card mz-card--sm mz-card--row mz-card--dashed" onClick={() => setEditing(r)}>
              <span className="mz-row__main">
                <span className="mz-row__title">{r.name}</span>
                <span className="mz-row__sub">Off</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
      <button type="button" className="mz-btn mz-btn--md mz-btn--ghost" onClick={() => setEditing("new")}>
        + Add rule
      </button>

      <Sheet open={editing !== null} title={editing === "new" ? "New payday rule" : "Edit payday rule"} onClose={() => setEditing(null)}>
        {editing !== null && (
          <RuleForm
            key={editing === "new" ? "new" : editing.id}
            initial={editing === "new" ? undefined : editing}
            accounts={accounts}
            institutions={institutions}
            goals={goals}
            debts={debts}
            hasRemainder={rules.some((r) => r.kind === "remainder" && r.is_active && (editing === "new" || r.id !== editing.id))}
            onSubmit={(v) => save(v as Record<string, unknown>)}
            onDelete={editing === "new" ? undefined : () => remove(editing)}
          />
        )}
      </Sheet>
    </div>
  );
}
