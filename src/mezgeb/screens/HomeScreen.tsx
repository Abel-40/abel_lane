"use client";

import Link from "next/link";
import { CheckIcon, ClockIcon, HelpIcon, SettingsIcon } from "../components/Icons";
import { EntryRow } from "../components/EntryRow";
import { TodayCard, YearSavingsCard } from "../components/Insights";
import { ThemeToggleButton } from "../components/Theme";
import { DataFallback, Money, ProgressBar } from "../components/ui";
import { daysBetween, daysUntilPayday, longDay, monthShort, monthStart, targetLabel, todayISO } from "../lib/dates";
import { monthlyFromSalary, netPosition } from "../lib/derive";
import { computeInsights } from "../lib/insights";
import { applyBasisPoints, formatMinor, formatTenths, hoursPhrase, percentNumberToBp, sharePercent } from "../lib/money";
import { useMz } from "../lib/store";

export function HomeScreen() {
  const { data, error, reload } = useMz();
  if (!data?.settings) return <DataFallback error={error} onRetry={reload} />;
  const { settings: s, accounts, balances, debts, debtProgress, goals, goalProgress, rules, wishes, thisMonth, fxRates } = data;
  const today = todayISO();
  const ccy = s.base_currency;

  const position = netPosition(accounts, balances, debts, debtProgress, Object.values(data.tripSummaries), fxRates, ccy);
  const insights = computeInsights(data, today);
  const payday = daysUntilPayday(s.payday_day, today);
  const spent = thisMonth?.personal_spent_minor ?? 0;
  const spentHours = hoursPhrase(spent, s.net_salary_minor, s.work_hours_per_month);
  const tradingNet = thisMonth?.trading_net_minor ?? 0;
  const tripsClosed = thisMonth?.trips_closed ?? 0;

  const loan = debts.find((d) => d.direction === "i_owe" && d.status === "active");
  const loanProgress = loan ? debtProgress[loan.id] : undefined;
  const loanTotal = loan ? loan.principal_minor + (loanProgress?.added_minor ?? 0) : 0;
  const loanMonthly = loan ? monthlyFromSalary(s, rules, "debt_id", loan.id) : 0;

  const titheExpected = applyBasisPoints(s.net_salary_minor, percentNumberToBp(s.tithe_percent));
  const titheSet = thisMonth?.tithe_set_aside_minor ?? 0;
  const emergency = goals.find((g) => g.kind === "emergency" && g.status !== "archived");
  const emergencySaved = emergency ? goalProgress[emergency.id]?.saved_minor ?? 0 : 0;
  const waiting = wishes.filter((w) => w.status === "waiting");
  // Reading the clock here is intended: Home re-renders on every data reload and visit (like todayISO() above)
  // eslint-disable-next-line react-hooks/purity
  const ready = waiting.filter((w) => new Date(w.ready_at).getTime() <= Date.now());

  const backupAge = s.last_backup_at ? daysBetween(s.last_backup_at.slice(0, 10), today) : null;
  const needsBackup = backupAge === null ? daysBetween(s.created_at.slice(0, 10), today) >= 7 : backupAge >= 30;

  return (
    <main className="mz-page">
      <header className="mz-head">
        <div className="mz-head__text">
          <span className="mz-subtitle">{longDay(today)}</span>
          <h1 className="mz-title">Mezgeb</h1>
        </div>
        <div className="mz-row-center" style={{ gap: 6 }}>
          <Link href="/mezgeb/help" aria-label="Help" className="mz-icon-btn">
            <HelpIcon />
          </Link>
          <ThemeToggleButton />
          <Link href="/mezgeb/settings" aria-label="Settings" className="mz-icon-btn">
            <SettingsIcon />
          </Link>
        </div>
      </header>

      <section aria-label="Net position" className="mz-hero">
        <div className="mz-row-between">
          <span className="mz-hero__label">Net position</span>
          <span style={{ fontSize: 12, fontWeight: 500 }}>{position.heldForOthers > 0 ? "assets − debts − kept for others" : "assets − debts"}</span>
        </div>
        <div className="mz-hero__value">
          <Money minor={position.net} currency={ccy} symbol={false} /> <small>Br</small>
        </div>
        <div className="mz-hero__stats">
          <div>
            <span>Assets</span>
            <span>
              <Money minor={position.assets} currency={ccy} symbol={false} />
            </span>
          </div>
          <div>
            <span>{position.heldForOthers > 0 ? "Owed" : "Debts"}</span>
            <span>
              <Money minor={position.debts} currency={ccy} symbol={false} />
            </span>
          </div>
          <div>
            <span>Payday in</span>
            <span>{payday === 0 ? "today" : `${payday} ${payday === 1 ? "day" : "days"}`}</span>
          </div>
        </div>
      </section>
      <section aria-label="What you own and owe" className="mz-card mz-card--sm">
        <div className="mz-kv">
          <span>Cash in accounts</span>
          <span>
            <Money minor={position.cash} currency={ccy} symbol={false} />
          </span>
          <span>Goods (in store and on trips)</span>
          <span>
            <Money minor={position.unsoldStock} currency={ccy} symbol={false} />
          </span>
          <span>Owed to you</span>
          <span>
            <Money minor={position.owedToMe} currency={ccy} symbol={false} />
          </span>
          <span className="mz-strong" style={{ color: "var(--mz-text)" }}>
            Total assets
          </span>
          <span className="mz-strong">
            <Money minor={position.assets} currency={ccy} />
          </span>
          {position.debts - position.heldForOthers > 0 && (
            <>
              <span>Debts I owe</span>
              <span className="mz-warn">
                −<Money minor={position.debts - position.heldForOthers} currency={ccy} symbol={false} />
              </span>
            </>
          )}
          {position.selfOwed > 0 && (
            <>
              <span>To put back in trading</span>
              <span className="mz-muted">
                <Money minor={position.selfOwed} currency={ccy} symbol={false} />
              </span>
            </>
          )}
          {position.heldForOthers > 0 && (
            <>
              <span>Kept for others</span>
              <span className="mz-warn">
                −<Money minor={position.heldForOthers} currency={ccy} symbol={false} />
              </span>
            </>
          )}
        </div>
      </section>
      {position.skippedCurrencies.length > 0 && (
        <p className="mz-note">
          {position.skippedCurrencies.join(", ")} accounts are left out until you add an exchange rate in Settings.
        </p>
      )}

      {insights && <TodayCard pulse={insights.pulse} source={insights.limitSource} message={insights.message} currency={ccy} />}

      <section aria-label="This month" className="mz-grid-2">
        <Link href="/mezgeb/transactions" className="mz-tile">
          <span className="mz-tile__label">Spent this month</span>
          <span className="mz-tile__value">
            <Money minor={spent} currency={ccy} />
          </span>
          {spentHours && <span className="mz-tile__note mz-tile__note--hours">= {spentHours} of work</span>}
        </Link>
        <Link href="/mezgeb/trading" className="mz-tile">
          <span className="mz-tile__label">Trading net, {monthShort(today)}</span>
          <span className={`mz-tile__value${tradingNet > 0 ? " mz-pos" : tradingNet < 0 ? " mz-warn" : ""}`}>
            <Money minor={tradingNet} currency={ccy} sign />
          </span>
          <span className="mz-tile__note">
            {tripsClosed} {tripsClosed === 1 ? "trip" : "trips"}
            {thisMonth?.trading_margin_percent != null ? ` · ${formatTenths(Math.round(Number(thisMonth.trading_margin_percent) * 10))} avg margin` : ""}
          </span>
        </Link>
      </section>

      {loan && loanProgress && (
        <Link href="/mezgeb/plan" className="mz-card" aria-label={`${loan.counterparty}: paid ${formatMinor(loanProgress.paid_minor)} of ${formatMinor(loanTotal)}`}>
          <div className="mz-row-between">
            <span className="mz-section-title">{loan.counterparty}</span>
            <span className="mz-num mz-muted" style={{ fontSize: 13 }}>
              <Money minor={loanProgress.paid_minor} symbol={false} /> / <Money minor={loanTotal} />
            </span>
          </div>
          <ProgressBar percent={sharePercent(loanProgress.paid_minor, loanTotal)} color="var(--mz-amber)" label="Paid so far" />
          <span className="mz-small mz-muted">
            {loan.target_on ? `Target: paid off by ${targetLabel(loan.target_on, today).replace(/^End of /, "")}` : "No target date"}
            {loanMonthly > 0 ? ` · next payment ${formatMinor(loanMonthly)} on payday` : ""}
          </span>
        </Link>
      )}

      {insights && <YearSavingsCard year={insights.year} compact />}

      <section aria-label="This month's checks" className="mz-list" style={{ padding: "6px 14px" }}>
        <Link href="/mezgeb/payday" className="mz-row">
          <Check done={data.months.length > 0 && titheSet >= titheExpected && titheExpected > 0} />
          <span className="mz-grow">Tithe set aside</span>
          <span className="mz-row__value mz-row__value--sm">
            <Money minor={titheSet} />
          </span>
        </Link>
        {emergency && (
          <Link href="/mezgeb/plan" className="mz-row">
            <Check done={Boolean(emergency.target_minor && emergencySaved >= emergency.target_minor)} />
            <span className="mz-grow">{emergency.name}</span>
            <span className="mz-row__value mz-row__value--sm">
              <Money minor={emergencySaved} symbol={false} protect={false} />
              {emergency.target_minor ? ` / ${formatMinor(emergency.target_minor, ccy, { symbol: false })}` : ""}
            </span>
          </Link>
        )}
        <Link href="/mezgeb/wishlist" className="mz-row">
          <span className="mz-check mz-check--wait" aria-hidden="true">
            <ClockIcon size={14} weight={2.4} />
          </span>
          <span className="mz-grow">
            {waiting.length === 0
              ? "No wishes waiting"
              : ready.length > 0
                ? `${ready.length} ${ready.length === 1 ? "wish is" : "wishes are"} ready to decide`
                : `${waiting.length} ${waiting.length === 1 ? "wish" : "wishes"} waiting out 48 hours`}
          </span>
          <span className="mz-pos mz-strong" style={{ fontSize: 13 }}>
            View
          </span>
        </Link>
      </section>

      {needsBackup && (
        <Link href="/mezgeb/settings#data" className="mz-card mz-card--amber mz-card--sm">
          <span className="mz-warn mz-strong" style={{ fontSize: 14 }}>
            Time for a backup
          </span>
          <span className="mz-small mz-muted">
            {backupAge === null ? "You have not exported a backup yet." : `Last backup ${backupAge} days ago.`} Export one in Settings › Your data.
          </span>
        </Link>
      )}

      <section aria-label="Recent entries" className="mz-stack">
        <div className="mz-row-between">
          <span className="mz-section-title">Recent</span>
          <Link href="/mezgeb/transactions" className="mz-muted" style={{ fontSize: 13, padding: "10px 0", margin: "-10px 0" }}>
            See all
          </Link>
        </div>
        {data.recent.length === 0 ? (
          <div className="mz-empty">
            Nothing recorded yet. Tap + to add your first expense or income
            {monthStart(today) === today ? ", or record today's payday." : "."}
          </div>
        ) : (
          data.recent.map((tx) => <EntryRow key={tx.id} tx={tx} compact />)
        )}
      </section>
    </main>
  );
}

function Check({ done }: { done: boolean }) {
  return done ? (
    <span className="mz-check mz-check--done" aria-label="Done">
      <CheckIcon />
    </span>
  ) : (
    <span className="mz-check mz-check--todo" aria-label="Not yet" />
  );
}
