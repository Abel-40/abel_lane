"use client";

import { accountLabel, entryTitle, initials } from "../lib/derive";
import { formatMinor } from "../lib/money";
import { useMz } from "../lib/store";
import type { Transaction } from "../lib/types";
import { Money } from "./ui";

/** One transaction: initials badge, title, account line, signed amount. */
export function EntryRow({ tx, compact, onOpen, signFor }: { tx: Transaction; compact?: boolean; onOpen?: () => void; signFor?: string }) {
  const { data } = useMz();
  if (!data) return null;
  const { accounts, institutions, categories } = data;
  const title = entryTitle(tx, categories);
  const from = accounts.find((a) => a.id === tx.account_id);
  const to = accounts.find((a) => a.id === tx.to_account_id);
  const sub =
    tx.kind === "transfer" ? `${accountLabel(from, institutions)} → ${accountLabel(to, institutions)}` : accountLabel(from, institutions);
  const currency = from?.currency ?? "ETB";

  // Seen from one account (account detail), a transfer is in or out.
  let signed = tx.kind === "expense" ? -tx.amount_minor : tx.amount_minor;
  if (signFor && tx.kind === "transfer") signed = tx.to_account_id === signFor ? tx.amount_minor : -tx.amount_minor;
  const positive = tx.kind === "income" || (signFor !== undefined && signed > 0);
  const label = tx.kind === "transfer" && !signFor ? "Transfer" : signed < 0 ? "Out" : "In";

  const body = (
    <>
      <span className={`mz-entry-icon${positive ? " mz-entry-icon--pos" : ""}`} aria-hidden="true">
        {tx.kind === "transfer" ? "→" : initials(title)}
      </span>
      <span className="mz-row__main">
        <span style={{ fontSize: 14 }} className="mz-truncate">
          {title}
          {tx.is_want && <span className="mz-dim"> · want</span>}
        </span>
        <span className="mz-row__sub mz-row__sub--dim mz-truncate">{compact ? sub : `${tx.occurred_on.slice(5).replace("-", "/")} · ${sub}`}</span>
      </span>
      <span className={`mz-row__value${positive ? " mz-pos" : ""}`} aria-label={`${label} ${formatMinor(tx.amount_minor, currency)}`}>
        {tx.kind === "transfer" && !signFor ? (
          <Money minor={tx.amount_minor} currency={currency} symbol={false} />
        ) : (
          <Money minor={signed} currency={currency} symbol={false} sign />
        )}
      </span>
    </>
  );

  if (onOpen) {
    return (
      <button type="button" className="mz-row" style={{ borderBottom: 0, padding: "6px 0" }} onClick={onOpen}>
        {body}
      </button>
    );
  }
  return (
    <div className="mz-row-center" style={{ gap: 12 }}>
      {body}
    </div>
  );
}
