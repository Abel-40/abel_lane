"use client";

import Link from "next/link";
import { targetLabel, todayISO } from "../lib/dates";
import { formatMinor } from "../lib/money";
import type { SpendingPulse, LimitSource } from "../lib/spending";
import type { YearSavings } from "../lib/savings";
import { Money, ProgressBar } from "./ui";

/** This year's savings: now, growth since 1 January, the year-end projection and what each month needs. */
export function YearSavingsCard({ year, compact = false }: { year: YearSavings; compact?: boolean }) {
  const ccy = year.currency;
  const sym = ccy === "ETB" ? "Br" : ccy;
  const status =
    year.target === null ? null : year.gap === 0 ? { text: "Reached", cls: "mz-pill" } : year.onTrack ? { text: "On track", cls: "mz-pill" } : { text: "Behind", cls: "mz-pill mz-pill--amber" };
  const body = (
    <>
      <div className="mz-row-between" style={{ alignItems: "flex-start" }}>
        <span className="mz-section-title">Savings this year</span>
        {status && <span className={status.cls}>{status.text}</span>}
      </div>
      <div className="mz-row-center" style={{ gap: 6, alignItems: "baseline" }}>
        <span className="mz-num" style={{ fontWeight: 700, fontSize: compact ? 26 : 30 }}>
          <Money minor={year.saved} currency={ccy} symbol={false} />
        </span>
        <span className="mz-muted" style={{ fontSize: 14 }}>
          {year.target ? `of ${formatMinor(year.target, ccy, { symbol: false })} ${sym}` : sym}
        </span>
      </div>
      {year.target && <ProgressBar percent={year.percent} size={10} label="Savings toward the year-end target" />}
      {!compact && (
        <div className="mz-grid-2" style={{ gap: 8 }}>
          <span className="mz-inset mz-inset--kv">
            <span>Since 1 Jan</span>
            <span className={year.growth >= 0 ? "mz-pos" : "mz-warn"}>{formatMinor(year.growth, ccy, { symbol: false, sign: true })}</span>
          </span>
          <span className="mz-inset mz-inset--kv">
            <span>31 Dec at this pace</span>
            <span>{year.projected === null ? "after week 1" : formatMinor(year.projected, ccy, { symbol: false })}</span>
          </span>
        </div>
      )}
      <span className="mz-small mz-muted">
        {year.target === null
          ? "Set a year-end target in Settings › Spending and savings."
          : year.gap === 0
            ? `Target reached for ${targetLabel(year.yearEnd, todayISO()).replace(/^End of /, "")}. Anything more is a bonus.`
            : `Needs ${formatMinor(year.perMonthNeeded ?? 0, ccy)} a month for ${year.monthsLeft} ${year.monthsLeft === 1 ? "month" : "months"}.`}
        {!compact && year.goods > 0 ? ` Includes ${formatMinor(year.goods, ccy)} of stored goods.` : ""}
        {!compact && year.heldInSavings > 0 ? ` Leaves out ${formatMinor(year.heldInSavings, ccy)} you keep for others.` : ""}
      </span>
      {year.skippedCurrencies.length > 0 && (
        <span className="mz-small mz-warn">{year.skippedCurrencies.join(", ")} savings are left out until you add an exchange rate in Settings.</span>
      )}
    </>
  );
  return compact ? (
    <Link href="/mezgeb/plan" className="mz-card">
      {body}
    </Link>
  ) : (
    <article className="mz-card mz-card--lg">{body}</article>
  );
}

/** Today against the daily limit, with a warning or a word of praise. */
export function TodayCard({ pulse, source, message, currency }: { pulse: SpendingPulse; source: LimitSource; message: string | null; currency: string }) {
  if (!pulse.limit) {
    return (
      <Link href="/mezgeb/settings" className="mz-card mz-card--sm">
        <span className="mz-section-title">Today</span>
        <span className="mz-small mz-muted">
          {source === "off" ? "Daily spending warnings are off." : "No daily limit yet: add a payday rule to a spending account, or set a limit in Settings."}
        </span>
      </Link>
    );
  }
  const warn = pulse.verdict === "over" || pulse.weekOver;
  return (
    <section aria-label="Spending today" className={`mz-card${warn ? " mz-card--amber" : ""}`}>
      <div className="mz-row-between">
        <span className="mz-section-title">Spent today</span>
        <span className={`mz-num mz-strong ${pulse.verdict === "over" ? "mz-warn" : ""}`} style={{ fontSize: 15 }}>
          <Money minor={pulse.today} currency={currency} symbol={false} /> / {formatMinor(pulse.limit, currency)}
        </span>
      </div>
      <ProgressBar
        percent={Math.min(100, Math.round((pulse.today * 100) / pulse.limit))}
        color={pulse.verdict === "over" || pulse.verdict === "near" ? "var(--mz-amber)" : undefined}
        label="Spent today against the daily limit"
      />
      {message && <p className={`mz-today__message ${warn ? "mz-warn" : "mz-pos"}`}>{message}</p>}
      <span className="mz-small mz-muted">
        {pulse.verdict === "over"
          ? `${formatMinor(pulse.today - pulse.limit, currency)} over the limit.`
          : `${formatMinor(pulse.limit - pulse.today, currency)} left today.`}
        {pulse.weekOver && pulse.weekLimit ? ` Last 7 days: ${formatMinor(pulse.week, currency)} of ${formatMinor(pulse.weekLimit, currency)}.` : ""}
        {pulse.streak > 1 ? ` ${pulse.streak} days in a row under the limit.` : ""}
        {pulse.overDaysThisMonth > 0 ? ` ${pulse.overDaysThisMonth} ${pulse.overDaysThisMonth === 1 ? "day" : "days"} over this month.` : ""}
      </span>
    </section>
  );
}
