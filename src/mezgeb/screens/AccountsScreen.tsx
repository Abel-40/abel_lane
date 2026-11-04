"use client";

import { useState } from "react";
import { AccountForm, InstitutionForm } from "../components/forms";
import { DataFallback, Money, Sheet, useToast } from "../components/ui";
import { deleteOrArchive, saveRow, updateRow } from "../lib/db";
import { accountGroup, GROUP_TITLE, isProtected, type AccountGroup } from "../lib/derive";
import { formatMinor, sumMinor } from "../lib/money";
import { useMz } from "../lib/store";
import { friendlyError } from "../lib/supabase";
import { INSTITUTION_KIND_LABEL, type Account, type Institution } from "../lib/types";

type Editing = { kind: "account"; row: Account | null } | { kind: "institution"; row: Institution | null } | { kind: "choose" } | null;

export function AccountsScreen() {
  const { data, error, reload } = useMz();
  const toast = useToast();
  const [editing, setEditing] = useState<Editing>(null);
  if (!data?.settings) return <DataFallback error={error} onRetry={reload} />;
  const { accounts, institutions, balances, settings } = data;
  const ccy = settings.base_currency;

  const open = Object.values(data.tripSummaries).filter((t) => t.status === "open");
  const stockFor = (accountId: string) =>
    sumMinor(open.filter((t) => data.trips.find((tr) => tr.id === t.trip_id)?.capital_account_id === accountId).map((t) => t.unsold_stock_minor));

  const active = accounts.filter((a) => !a.is_archived);
  const held = sumMinor(active.filter((a) => a.currency === ccy).map((a) => balances[a.id] ?? 0));
  const groups: AccountGroup[] = ["everyday", "business", "protected"];
  const inactive = accounts.filter((a) => a.is_archived);

  async function saveAccount(id: string | null, values: Record<string, unknown>) {
    await saveRow("accounts", id, values);
    await reload();
    setEditing(null);
    toast(id ? "Account updated." : "Account added.");
  }
  async function saveInstitution(id: string | null, values: Record<string, unknown>) {
    await saveRow("institutions", id, values);
    await reload();
    setEditing(null);
    toast(id ? "Saved." : "Bank or wallet added.");
  }
  async function removeAccount(a: Account) {
    if (!window.confirm(`Delete "${a.name}"? If it has entries it is archived instead.`)) return;
    try {
      const r = await deleteOrArchive("accounts", a.id);
      await reload();
      setEditing(null);
      toast(r === "archived" ? "It has entries, so it was archived." : "Account deleted.");
    } catch (e) {
      toast(friendlyError(e), true);
    }
  }
  async function toggleArchiveAccount(a: Account) {
    try {
      await updateRow("accounts", a.id, { is_archived: !a.is_archived });
      await reload();
      setEditing(null);
      toast(a.is_archived ? "Account restored." : "Account archived.");
    } catch (e) {
      toast(friendlyError(e), true);
    }
  }
  async function removeInstitution(i: Institution) {
    if (!window.confirm(`Delete "${i.name}"? If accounts use it, it is archived instead.`)) return;
    try {
      const r = await deleteOrArchive("institutions", i.id);
      await reload();
      setEditing(null);
      toast(r === "archived" ? "Accounts use it, so it was archived." : "Deleted.");
    } catch (e) {
      toast(friendlyError(e), true);
    }
  }

  const row = (a: Account, last: boolean) => {
    const inst = institutions.find((i) => i.id === a.institution_id);
    const balance = balances[a.id] ?? a.opening_balance_minor;
    return (
      <button
        key={a.id}
        type="button"
        className="mz-row"
        style={last ? { borderBottom: 0 } : undefined}
        onClick={() => setEditing({ kind: "account", row: a })}
        aria-label={`${a.name}${inst ? ", " + inst.name : ""}. Edit`}
      >
        <span className="mz-badge" style={{ ["--badge" as string]: inst?.color ?? "#A3B1AA" }} aria-hidden="true">
          {inst?.short_label ?? "—"}
        </span>
        <span className="mz-row__main">
          <span className="mz-row__title">{a.name}</span>
          {a.notes && <span className="mz-row__sub">{a.notes}</span>}
        </span>
        <span className="mz-row__value">
          <Money minor={balance} currency={a.currency} symbol={a.currency !== ccy} protect={isProtected(a)} />
        </span>
      </button>
    );
  };

  return (
    <main className="mz-page mz-page--tight">
      <header className="mz-head">
        <div className="mz-head__text">
          <h1 className="mz-title">Accounts</h1>
          <span className="mz-subtitle">
            {plural(active.length, "account")} ·{" "}
            <span className="mz-num" style={{ color: "var(--mz-text)" }}>
              <Money minor={held} currency={ccy} />
            </span>{" "}
            held
          </span>
        </div>
        <button type="button" className="mz-btn mz-btn--sm mz-btn--secondary" onClick={() => setEditing({ kind: "choose" })}>
          + Add
        </button>
      </header>

      {groups.map((g) => {
        const list = active.filter((a) => accountGroup(a) === g);
        if (list.length === 0) return null;
        if (g === "business") {
          return (
            <section key={g} className="mz-stack" aria-label={GROUP_TITLE[g]}>
              <span className="mz-section-label">{GROUP_TITLE[g]}</span>
              {list.map((a) => {
                const stock = stockFor(a.id);
                const capital = (balances[a.id] ?? 0) + stock;
                const limit = settings.trading_loss_limit_minor;
                const below = limit > 0 && capital < limit;
                return (
                  <div key={a.id} className="mz-card" style={{ padding: "4px 14px 10px", gap: 4 }}>
                    {row(a, true)}
                    <div className="mz-inset mz-row-between" style={below ? { color: "var(--mz-amber)" } : undefined}>
                      <span>+ {formatMinor(stock, a.currency, { symbol: false })} in unsold stock</span>
                      <span>
                        {below ? "Below loss limit " : "Loss limit "}
                        {formatMinor(limit, a.currency, { symbol: false })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </section>
          );
        }
        return (
          <section key={g} className="mz-stack" aria-label={GROUP_TITLE[g]}>
            <span className="mz-section-label">{g === "protected" ? "Protected · tap to reveal" : GROUP_TITLE[g]}</span>
            <div className="mz-list">{list.map((a, i) => row(a, i === list.length - 1))}</div>
          </section>
        );
      })}

      {active.length === 0 && <div className="mz-empty">No accounts yet. Tap + Add to create one.</div>}

      {inactive.length > 0 && (
        <section className="mz-stack" aria-label={GROUP_TITLE.inactive}>
          <span className="mz-section-label">{GROUP_TITLE.inactive}</span>
          <div className="mz-chips">
            {inactive.map((a) => {
              const inst = institutions.find((i) => i.id === a.institution_id);
              return (
                <button key={a.id} type="button" className="mz-chip mz-chip--dashed mz-chip--static" style={{ cursor: "pointer" }} onClick={() => setEditing({ kind: "account", row: a })}>
                  {inst ? `${inst.name.split(" ")[0]} · ` : ""}
                  {a.name}
                  {a.notes ? ` · ${a.notes}` : " · archived"}
                </button>
              );
            })}
          </div>
        </section>
      )}

      <section className="mz-stack" aria-label="Banks and wallets" style={{ marginTop: 10 }}>
        <span className="mz-section-label">Banks and wallets</span>
        <div className="mz-list">
          {institutions.map((i) => (
            <button key={i.id} type="button" className="mz-row" onClick={() => setEditing({ kind: "institution", row: i })}>
              <span className="mz-badge" style={{ ["--badge" as string]: i.color }} aria-hidden="true">
                {i.short_label}
              </span>
              <span className="mz-row__main">
                <span className="mz-row__title">{i.name}</span>
                <span className="mz-row__sub">
                  {INSTITUTION_KIND_LABEL[i.kind]} · {plural(accounts.filter((a) => a.institution_id === i.id).length, "account")}
                  {i.is_archived ? " · archived" : ""}
                </span>
              </span>
              <span className="mz-row__chev" aria-hidden="true">
                ›
              </span>
            </button>
          ))}
        </div>
      </section>

      <Sheet open={editing?.kind === "choose"} title="Add" onClose={() => setEditing(null)}>
        <div className="mz-stack">
          <button type="button" className="mz-btn" onClick={() => setEditing({ kind: "account", row: null })}>
            New account
          </button>
          <button type="button" className="mz-btn mz-btn--secondary" onClick={() => setEditing({ kind: "institution", row: null })}>
            New bank or wallet
          </button>
        </div>
      </Sheet>

      <Sheet open={editing?.kind === "account"} title={editing?.kind === "account" && editing.row ? "Edit account" : "New account"} onClose={() => setEditing(null)}>
        {editing?.kind === "account" && (
          <>
            {editing.row && (
              <div className="mz-inset mz-row-between" style={{ fontSize: 13 }}>
                <span>Balance now</span>
                <span className="mz-num" style={{ color: "var(--mz-text)" }}>
                  <Money minor={balances[editing.row.id] ?? 0} currency={editing.row.currency} protect={isProtected(editing.row)} />
                </span>
              </div>
            )}
            <AccountForm
              key={editing.row?.id ?? "new"}
              institutions={institutions}
              initial={editing.row ?? undefined}
              onSubmit={(v) => saveAccount(editing.row?.id ?? null, v as Record<string, unknown>)}
              onArchive={editing.row ? () => toggleArchiveAccount(editing.row as Account) : undefined}
              archiveLabel={editing.row?.is_archived ? "Restore" : "Archive"}
              onDelete={editing.row ? () => removeAccount(editing.row as Account) : undefined}
            />
          </>
        )}
      </Sheet>

      <Sheet open={editing?.kind === "institution"} title={editing?.kind === "institution" && editing.row ? "Edit bank or wallet" : "New bank or wallet"} onClose={() => setEditing(null)}>
        {editing?.kind === "institution" && (
          <InstitutionForm
            key={editing.row?.id ?? "new"}
            initial={editing.row ?? undefined}
            onSubmit={(v) => saveInstitution(editing.row?.id ?? null, v as Record<string, unknown>)}
            onDelete={editing.row ? () => removeInstitution(editing.row as Institution) : undefined}
          />
        )}
      </Sheet>
    </main>
  );
}

function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}
