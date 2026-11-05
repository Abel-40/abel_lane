"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { AlertIcon } from "../components/Icons";
import { AmountField, DataFallback, ErrorLine, Money, Sheet, TextField, useToast } from "../components/ui";
import { deleteRow, insertRow, saveRow, updateRow } from "../lib/db";
import { daysBetween, monthShort, shortDay, todayISO } from "../lib/dates";
import { accountLabel } from "../lib/derive";
import { formatMinor, formatTenths, minorToInput, parseAmount, parseQuantityMilli, percentNumberToBp, quantityTimes } from "../lib/money";
import { useMz } from "../lib/store";
import { friendlyError, supabase } from "../lib/supabase";
import { tradingCapital } from "../lib/position";
import { priceVerdict, usualCostRatioTenths, type Verdict } from "../lib/trading";
import { COST_KIND_LABEL, type PriceLog, type Trip, type TripCost, type TripCostKind, type TripLine, type TripSummary } from "../lib/types";

const VERDICT_CLASS: Record<Verdict, string> = { go: "mz-pos", ok: "", skip: "mz-warn" };

function tenthsFromPercent(p: number | null | undefined): number | null {
  if (p === null || p === undefined) return null;
  return Math.round(Number(p) * 10);
}

export function TradingScreen() {
  const { data, error, reload } = useMz();
  const toast = useToast();
  const [openTrip, setOpenTrip] = useState<string | null>(null);
  const [newTrip, setNewTrip] = useState<"trip" | "stock" | null>(null);
  const [logPrice, setLogPrice] = useState(false);
  const [prices, setPrices] = useState<PriceLog[]>([]);
  const [pair, setPair] = useState<{ from: string; to: string } | null>(null);

  const loadPrices = useCallback(async () => {
    const since = new Date(Date.now() - 120 * 86400_000).toISOString().slice(0, 10);
    const { data: rows } = await supabase().from("price_logs").select("*").gte("observed_on", since).order("observed_on", { ascending: false });
    setPrices((rows ?? []) as PriceLog[]);
  }, []);
  useEffect(() => {
    void loadPrices();
  }, [loadPrices]);

  const cities = useMemo(() => (data?.cities ?? []).filter((c) => !c.is_archived), [data]);
  useEffect(() => {
    if (pair || cities.length < 2 || !data) return;
    const last = data.trips.find((t) => t.kind === "trip" && t.to_city_id);
    setPair(last?.to_city_id ? { from: last.from_city_id, to: last.to_city_id } : { from: cities[0].id, to: cities[1].id });
  }, [cities, data, pair]);

  if (!data?.settings) return <DataFallback error={error} onRetry={reload} />;
  const { settings: s, trips, tripSummaries, accounts, balances, items } = data;
  const ccy = s.base_currency;
  const summaries = Object.values(tripSummaries);
  const tradingAccounts = accounts.filter((a) => a.role === "trading" && !a.is_archived);
  // Trading capital = cash on trading accounts + goods bought with it (store and trips) + money lent from it.
  // Goods paid from savings are not trading capital.
  const tc = tradingCapital(accounts, balances, trips, tripSummaries, data.debts, data.debtProgress, ccy);
  const capital = tc.worth;
  const below = s.trading_loss_limit_minor > 0 && capital < s.trading_loss_limit_minor;
  const net = data.thisMonth?.trading_net_minor ?? 0;
  const margin = tenthsFromPercent(data.thisMonth?.trading_margin_percent);
  const activeItems = items.filter((i) => !i.is_archived);
  const targetTenths = activeItems.length ? Math.round(activeItems.reduce((a, i) => a + percentNumberToBp(i.target_margin_percent), 0) / activeItems.length / 10) : 100;
  const costRatio = usualCostRatioTenths(summaries);
  const cityName = (id: string) => {
    const c = data.cities.find((x) => x.id === id);
    return c?.short_label || c?.name || "?";
  };
  const cityFull = (id: string) => data.cities.find((x) => x.id === id)?.name ?? "?";
  const route = (t: Trip) => (t.to_city_id ? `${cityName(t.from_city_id)} → ${cityName(t.to_city_id)}` : `kept in ${cityName(t.from_city_id)}`);

  const stored = trips.filter((t) => t.status === "open" && t.kind === "stock");
  const openTrips = trips.filter((t) => t.status === "open" && t.kind === "trip");
  const closedTrips = trips.filter((t) => t.status === "closed").sort((a, b) => ((a.closed_on ?? "") < (b.closed_on ?? "") ? 1 : -1));

  // latest price per item per city
  const latest = (itemId: string, cityId: string) => prices.find((p) => p.item_id === itemId && p.city_id === cityId);

  return (
    <main className="mz-page mz-page--tight">
      <header className="mz-head">
        <h1 className="mz-title">Trading</h1>
        <div className="mz-row-center" style={{ gap: 8 }}>
          <button type="button" className="mz-btn mz-btn--sm mz-btn--secondary" onClick={() => setNewTrip("stock")} disabled={cities.length < 1}>
            + Store goods
          </button>
          <button type="button" className="mz-btn mz-btn--sm" onClick={() => setNewTrip("trip")} disabled={tradingAccounts.length === 0 || cities.length < 2}>
            + New trip
          </button>
        </div>
      </header>
      {(tradingAccounts.length === 0 || cities.length < 2) && (
        <p className="mz-note">To start a trip, add a trading account (role: Trading capital) and at least two cities in Settings.</p>
      )}

      <section className="mz-grid-3" aria-label="Trading this month">
        <div className="mz-stat">
          <span className="mz-stat__label">Capital</span>
          <span className="mz-stat__value">
            <Money minor={capital} currency={ccy} symbol={false} />
          </span>
          <span className="mz-stat__note">cash + goods + lent</span>
        </div>
        <div className="mz-stat">
          <span className="mz-stat__label">Net, {monthShort(todayISO())}</span>
          <span className={`mz-stat__value${net > 0 ? " mz-pos" : net < 0 ? " mz-warn" : ""}`}>
            <Money minor={net} currency={ccy} symbol={false} sign />
          </span>
          <span className="mz-stat__note">after all costs</span>
        </div>
        <div className="mz-stat">
          <span className="mz-stat__label">Margin</span>
          <span className={`mz-stat__value${margin !== null && margin < targetTenths ? " mz-warn" : ""}`}>{margin === null ? "—" : formatTenths(margin)}</span>
          <span className="mz-stat__note">target {formatTenths(targetTenths)}</span>
        </div>
      </section>

      <section aria-label="What trading capital is made of" className="mz-card mz-card--sm">
        <div className="mz-kv">
          <span>Cash on trading accounts</span>
          <span className={tc.cash < 0 ? "mz-warn" : undefined}>
            <Money minor={tc.cash} currency={ccy} symbol={false} />
          </span>
          <span>Goods bought (store and trips)</span>
          <span>
            <Money minor={tc.goods} currency={ccy} symbol={false} />
          </span>
          <span>Lent from trading money</span>
          <span>
            <Money minor={tc.lent} currency={ccy} symbol={false} />
          </span>
          <span className="mz-strong" style={{ color: "var(--mz-text)" }}>
            Trading capital
          </span>
          <span className="mz-strong">
            <Money minor={capital} currency={ccy} />
          </span>
        </div>
        {tc.cash < 0 && (
          <span className="mz-small mz-warn">
            Cash below zero usually means the opening balance and older entries count the same money twice. Fix it in Accounts › the trading account › Real balance now.
          </span>
        )}
      </section>

      {below && (
        <div className="mz-card mz-card--amber mz-card--sm" role="alert">
          <span className="mz-row-center mz-warn mz-strong" style={{ fontSize: 14 }}>
            <AlertIcon /> Capital is below your loss limit
          </span>
          <span className="mz-small mz-muted">
            {formatMinor(capital, ccy)} including goods and money lent, limit {formatMinor(s.trading_loss_limit_minor, ccy)}. Pause new trips and review what went wrong.
          </span>
        </div>
      )}

      {stored.length > 0 && <span className="mz-section-label">Goods in store</span>}
      {stored.map((t) => {
        const sum = tripSummaries[t.id];
        return (
          <button key={t.id} type="button" className="mz-card mz-card--sm mz-card--row" onClick={() => setOpenTrip(t.id)}>
            <span className="mz-row__main" style={{ gap: 2 }}>
              <span className="mz-row__title">
                {t.name} · {route(t)}
              </span>
              <span className="mz-row__sub">
                {sum && sum.line_count > 0 ? `${formatMinor(sum.unsold_stock_minor, ccy, { symbol: false })} of goods kept · since ${shortDay(t.started_on)}` : "empty · add the goods you bought"}
              </span>
            </span>
            <span className="mz-muted mz-strong" style={{ fontSize: 13 }}>
              Open
            </span>
          </button>
        );
      })}
      {stored.length > 0 && trips.some((t) => t.kind === "trip") && <span className="mz-section-label">Trips</span>}

      {openTrips.map((t) => {
        const sum = tripSummaries[t.id];
        return (
          <button key={t.id} type="button" className="mz-card mz-card--sm mz-card--row mz-card--amber" onClick={() => setOpenTrip(t.id)}>
            <span className="mz-row__main" style={{ gap: 2 }}>
              <span className="mz-row__title">
                {t.name} · {route(t)}
              </span>
              <span className="mz-small mz-warn">
                {sum && sum.line_count > 0 ? `${formatMinor(sum.unsold_stock_minor, ccy, { symbol: false })} of stock still unsold` : "in progress · add the goods you bought"}
              </span>
            </span>
            <span className="mz-warn mz-strong" style={{ fontSize: 13 }}>
              {sum && sum.unsold_count > 0 ? "Record sale" : "Open"}
            </span>
          </button>
        );
      })}

      {closedTrips.slice(0, 6).map((t, i) => {
        const sum = tripSummaries[t.id];
        if (!sum) return null;
        const m = tenthsFromPercent(sum.net_margin_percent);
        if (i === 0) {
          return (
            <button key={t.id} type="button" className="mz-card" onClick={() => setOpenTrip(t.id)}>
              <div className="mz-row-between">
                <span className="mz-section-title">
                  {t.name} · {route(t)}
                </span>
                <span className={`mz-num mz-strong ${sum.net_minor >= 0 ? "mz-pos" : "mz-warn"}`}>{formatMinor(sum.net_minor, ccy, { symbol: false, sign: true })}</span>
              </div>
              <div className="mz-kv">
                <span>Goods bought</span>
                <span>{formatMinor(sum.purchases_minor, ccy, { symbol: false })}</span>
                <span>Transport · food · lodging</span>
                <span>
                  {[sum.transport_minor, sum.food_minor, sum.lodging_minor].map((v) => formatMinor(v, ccy, { symbol: false })).join(" · ")}
                </span>
                {sum.other_costs_minor > 0 && (
                  <>
                    <span>Other costs</span>
                    <span>{formatMinor(sum.other_costs_minor, ccy, { symbol: false })}</span>
                  </>
                )}
                <span>Sold for</span>
                <span>{formatMinor(sum.sales_minor, ccy, { symbol: false })}</span>
              </div>
              <div className="mz-chips" style={{ gap: 8 }}>
                {m !== null && <span className={`mz-pill${m < 0 ? " mz-pill--amber" : ""}`}>{formatTenths(m)} net</span>}
                {sum.days_to_sell !== null && <span className="mz-pill mz-pill--muted">sold in {sum.days_to_sell} {sum.days_to_sell === 1 ? "day" : "days"}</span>}
              </div>
            </button>
          );
        }
        return (
          <button key={t.id} type="button" className="mz-card mz-card--sm mz-card--row" onClick={() => setOpenTrip(t.id)}>
            <span className="mz-row__main" style={{ gap: 2 }}>
              <span className="mz-row__title">
                {t.name} · {route(t)}
              </span>
              <span className="mz-row__sub">
                {m !== null ? `${formatTenths(m)} net` : ""}
                {sum.days_to_sell !== null ? ` · sold in ${sum.days_to_sell} days` : ""}
              </span>
            </span>
            <span className={`mz-num mz-strong ${sum.net_minor >= 0 ? "mz-pos" : "mz-warn"}`}>{formatMinor(sum.net_minor, ccy, { symbol: false, sign: true })}</span>
          </button>
        );
      })}
      {trips.length === 0 && <div className="mz-empty">No trips yet. Start one with + New trip, then add the goods you buy, the costs on the way and the sales.</div>}

      <section aria-label="Price log" className="mz-stack" style={{ marginTop: 4 }}>
        <div className="mz-row-between">
          <span className="mz-section-title">Price gaps</span>
          <button type="button" className="mz-link-btn" onClick={() => setLogPrice(true)} disabled={activeItems.length === 0 || cities.length === 0}>
            Log a price
          </button>
        </div>
        {pair && cities.length >= 2 && (
          <div className="mz-grid-2">
            <label className="mz-field">
              <span className="mz-sr-only">Buy in</span>
              <select className="mz-select" style={{ height: 40, fontSize: 13 }} value={pair.from} onChange={(e) => setPair({ ...pair, from: e.target.value })}>
                {cities.map((c) => (
                  <option key={c.id} value={c.id}>
                    Buy in {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="mz-field">
              <span className="mz-sr-only">Sell in</span>
              <select className="mz-select" style={{ height: 40, fontSize: 13 }} value={pair.to} onChange={(e) => setPair({ ...pair, to: e.target.value })}>
                {cities.map((c) => (
                  <option key={c.id} value={c.id}>
                    Sell in {c.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}
        {activeItems.length === 0 ? (
          <p className="mz-note">Add trade items in Settings › Cities and trade items, then log prices in each city.</p>
        ) : pair ? (
          <div className="mz-card" style={{ padding: "4px 14px", gap: 0 }}>
            <div className="mz-table" role="table" aria-label="Price gaps">
              <span className="mz-table__head" role="columnheader">Item</span>
              <span className="mz-table__head mz-right" role="columnheader">
                Buy · {cityName(pair.from)}
              </span>
              <span className="mz-table__head mz-right" role="columnheader">
                Sell · {cityName(pair.to)}
              </span>
              <span className="mz-table__head mz-right" role="columnheader">
                Gap
              </span>
              {activeItems.map((it, i) => {
                const b = latest(it.id, pair.from);
                const sl = latest(it.id, pair.to);
                const last = i === activeItems.length - 1 ? " is-last" : "";
                const v = b && sl ? priceVerdict(b.price_minor, sl.price_minor, Math.round(percentNumberToBp(it.target_margin_percent) / 10), costRatio) : null;
                return (
                  <div key={it.id} role="row" style={{ display: "contents" }}>
                    <span className={`mz-truncate${last}`} role="cell">
                      {it.name}
                    </span>
                    <span className={`mz-right mz-num${last}`} role="cell">
                      {b ? formatMinor(b.price_minor, ccy, { symbol: false }) : "—"}
                    </span>
                    <span className={`mz-right mz-num${last}`} role="cell">
                      {sl ? formatMinor(sl.price_minor, ccy, { symbol: false }) : "—"}
                    </span>
                    <span className={`mz-right mz-strong ${v ? VERDICT_CLASS[v.verdict] : "mz-dim"}${last}`} role="cell">
                      {v ? `${formatTenths(v.gapTenths)} ${v.verdict}` : "no data"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}
        {activeItems.length > 0 && (
          <p className="mz-note">
            go: the gap beats usual trip costs ({formatTenths(costRatio)}) by the item&apos;s target margin · ok: it covers the costs · skip: it does not.
          </p>
        )}
      </section>

      <Sheet open={newTrip !== null} title={newTrip === "stock" ? "Store goods" : "New trip"} onClose={() => setNewTrip(null)}>
        {newTrip && (
          <NewTripForm
            kind={newTrip}
            defaultName={newTrip === "stock" ? `Store ${trips.filter((t) => t.kind === "stock").length + 1}` : `Trip ${trips.filter((t) => t.kind === "trip").length + 1}`}
            onDone={async (id) => {
              setNewTrip(null);
              await reload();
              setOpenTrip(id);
            }}
          />
        )}
      </Sheet>

      <Sheet open={openTrip !== null} full title={trips.find((t) => t.id === openTrip)?.name ?? "Trip"} onClose={() => setOpenTrip(null)}>
        {openTrip && trips.find((t) => t.id === openTrip) && (
          <TripDetail
            trip={trips.find((t) => t.id === openTrip) as Trip}
            summary={tripSummaries[openTrip]}
            cityFull={cityFull}
            onDeleted={async () => {
              setOpenTrip(null);
              await reload();
              toast("Trip deleted.");
            }}
          />
        )}
      </Sheet>

      <Sheet open={logPrice} title="Log a price" onClose={() => setLogPrice(false)}>
        {logPrice && (
          <PriceForm
            defaultCity={pair?.from}
            onDone={async () => {
              setLogPrice(false);
              await loadPrices();
              toast("Price logged.");
            }}
          />
        )}
      </Sheet>
    </main>
  );
}

function NewTripForm({ kind, defaultName, onDone }: { kind: "trip" | "stock"; defaultName: string; onDone: (id: string) => Promise<void> }) {
  const { data } = useMz();
  const cities = (data?.cities ?? []).filter((c) => !c.is_archived);
  const active = (data?.accounts ?? []).filter((a) => !a.is_archived);
  // a trip runs on trading capital; goods kept as a store of value can be paid from any account
  const capitalAccounts = kind === "trip" ? active.filter((a) => a.role === "trading") : [...active.filter((a) => a.role === "trading"), ...active.filter((a) => a.role !== "trading")];
  const last = data?.trips.find((t) => t.kind === "trip" && t.to_city_id);
  const [name, setName] = useState(defaultName);
  const [from, setFrom] = useState(last?.from_city_id ?? cities[0]?.id ?? "");
  const [to, setTo] = useState(last?.to_city_id ?? cities[1]?.id ?? "");
  const [accountId, setAccountId] = useState(capitalAccounts[0]?.id ?? "");
  const [date, setDate] = useState(todayISO());
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  if (!data) return null;
  return (
    <form
      className="mz-form"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!name.trim()) return setError(kind === "stock" ? "Name what you are storing." : "Name the trip.");
        if (kind === "trip" && from === to) return setError("Pick two different cities.");
        if (!accountId) return setError("Choose the account that pays.");
        setSaving(true);
        try {
          const row = await insertRow<Trip>("trips", {
            name: name.trim(),
            kind,
            from_city_id: from,
            to_city_id: kind === "trip" ? to : null,
            capital_account_id: accountId,
            started_on: date,
          });
          await onDone(row.id);
        } catch (err) {
          setError(friendlyError(err));
        } finally {
          setSaving(false);
        }
      }}
    >
      {kind === "stock" && <p className="mz-note">Goods you buy and keep as a store of value. Sell them where they are, or take them on a trip later.</p>}
      <TextField label="Name" value={name} onChange={setName} maxLength={80} placeholder={kind === "stock" ? "Coffee in store" : undefined} />
      <div className={kind === "trip" ? "mz-grid-2" : undefined}>
        <label className="mz-field">
          {kind === "stock" ? "Kept in" : "From"}
          <select className="mz-select" value={from} onChange={(e) => setFrom(e.target.value)}>
            {cities.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        {kind === "trip" && (
          <label className="mz-field">
            To
            <select className="mz-select" value={to} onChange={(e) => setTo(e.target.value)}>
              {cities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
      <label className="mz-field">
        {kind === "stock" ? "Paid from" : "Capital from"}
        <select className="mz-select" value={accountId} onChange={(e) => setAccountId(e.target.value)}>
          {capitalAccounts.map((a) => (
            <option key={a.id} value={a.id}>
              {accountLabel(a, data.institutions)}
            </option>
          ))}
        </select>
      </label>
      <label className="mz-field">
        Started
        <input className="mz-input" type="date" value={date} max={todayISO()} onChange={(e) => setDate(e.target.value || todayISO())} />
      </label>
      <ErrorLine text={error} />
      <button type="submit" className="mz-btn" disabled={saving}>
        {saving ? "Saving…" : kind === "stock" ? "Store goods" : "Start trip"}
      </button>
    </form>
  );
}

function TripDetail({ trip, summary, cityFull, onDeleted }: { trip: Trip; summary?: TripSummary; cityFull: (id: string) => string; onDeleted: () => Promise<void> }) {
  const { data, reload } = useMz();
  const toast = useToast();
  const [lines, setLines] = useState<TripLine[]>([]);
  const [costs, setCosts] = useState<TripCost[]>([]);
  const [mode, setMode] = useState<
    { kind: "line"; row: TripLine | null } | { kind: "sale"; row: TripLine } | { kind: "cost"; row: TripCost | null } | { kind: "go" } | null
  >(null);
  const isStock = trip.kind === "stock";
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [l, c] = await Promise.all([
      supabase().from("trip_lines").select("*").eq("trip_id", trip.id).order("created_at"),
      supabase().from("trip_costs").select("*").eq("trip_id", trip.id).order("created_at"),
    ]);
    if (l.error || c.error) return setError(friendlyError(l.error ?? c.error));
    setLines((l.data ?? []) as TripLine[]);
    setCosts((c.data ?? []) as TripCost[]);
  }, [trip.id]);
  useEffect(() => {
    void load();
  }, [load]);

  if (!data) return null;
  const ccy = data.accounts.find((a) => a.id === trip.capital_account_id)?.currency ?? "ETB";
  const itemName = (id: string) => data.items.find((i) => i.id === id)?.name ?? "Item";
  const itemUnit = (id: string) => data.items.find((i) => i.id === id)?.unit ?? "";
  const allSold = lines.length > 0 && lines.every((l) => l.sell_unit_minor !== null);
  const m = summary?.net_margin_percent != null ? Math.round(Number(summary.net_margin_percent) * 10) : null;

  async function refresh() {
    setMode(null);
    await Promise.all([load(), reload()]);
  }

  async function closeOrReopen() {
    try {
      if (trip.status === "open") {
        const lastSold = lines.reduce((acc, l) => (l.sold_on && l.sold_on > acc ? l.sold_on : acc), trip.started_on);
        await updateRow("trips", trip.id, { status: "closed", closed_on: lastSold });
        toast("Trip closed.");
      } else {
        await updateRow("trips", trip.id, { status: "open", closed_on: null });
      }
      await reload();
    } catch (e) {
      setError(friendlyError(e));
    }
  }

  async function removeTrip() {
    if (!window.confirm(`Delete ${trip.name}? Its goods, costs, sales and their entries are removed too.`)) return;
    // (a stored-goods holding is deleted the same way)
    try {
      await deleteRow("trips", trip.id);
      await onDeleted();
    } catch (e) {
      setError(friendlyError(e));
    }
  }

  return (
    <div className="mz-stack" style={{ gap: 14 }}>
      <p className="mz-muted" style={{ fontSize: 14 }}>
        {trip.to_city_id ? `${cityFull(trip.from_city_id)} → ${cityFull(trip.to_city_id)}` : `Kept in ${cityFull(trip.from_city_id)}`} · from {shortDay(trip.started_on)} ·{" "}
        {accountLabel(data.accounts.find((a) => a.id === trip.capital_account_id), data.institutions)}
      </p>
      {isStock && trip.status === "open" && (
        <button type="button" className="mz-btn mz-btn--md mz-btn--secondary" onClick={() => setMode({ kind: "go" })} disabled={data.cities.filter((c) => !c.is_archived && c.id !== trip.from_city_id).length === 0}>
          Take these goods on a trip
        </button>
      )}

      {summary && (
        <div className="mz-card">
          <div className="mz-kv">
            <span>Goods bought</span>
            <span>{formatMinor(summary.purchases_minor, ccy, { symbol: false })}</span>
            <span>Costs</span>
            <span>{formatMinor(summary.costs_minor, ccy, { symbol: false })}</span>
            <span>Sold for</span>
            <span>{formatMinor(summary.sales_minor, ccy, { symbol: false })}</span>
            {summary.unsold_stock_minor > 0 && (
              <>
                <span>Unsold stock</span>
                <span className="mz-warn">{formatMinor(summary.unsold_stock_minor, ccy, { symbol: false })}</span>
              </>
            )}
            <span className="mz-strong" style={{ color: "var(--mz-text)" }}>
              Net
            </span>
            <span className={`mz-strong ${summary.net_minor >= 0 ? "mz-pos" : "mz-warn"}`}>{formatMinor(summary.net_minor, ccy, { sign: true })}</span>
          </div>
          <div className="mz-chips" style={{ gap: 8 }}>
            {m !== null && <span className={`mz-pill${m < 0 ? " mz-pill--amber" : ""}`}>{formatTenths(m)} net</span>}
            {summary.days_to_sell !== null && <span className="mz-pill mz-pill--muted">sold in {summary.days_to_sell} days</span>}
            {trip.status === "open" && (
              <span className={`mz-pill ${isStock ? "mz-pill--muted" : "mz-pill--amber"}`}>
                {isStock ? "in store" : "open"} · {daysBetween(trip.started_on, todayISO())} days
              </span>
            )}
          </div>
        </div>
      )}

      <div className="mz-row-between">
        <span className="mz-section-label">Goods</span>
        <button type="button" className="mz-link-btn mz-link-btn--accent" onClick={() => setMode({ kind: "line", row: null })}>
          + Add goods
        </button>
      </div>
      {lines.length === 0 ? (
        <p className="mz-note">Add what you bought: item, quantity and price per unit.</p>
      ) : (
        <div className="mz-list">
          {lines.map((l) => (
            <div key={l.id} className="mz-row">
              <button type="button" className="mz-row__main" style={{ background: "none", border: 0, padding: 0, textAlign: "left", color: "inherit" }} onClick={() => setMode({ kind: "line", row: l })}>
                <span className="mz-row__title">{itemName(l.item_id)}</span>
                <span className="mz-row__sub">
                  {String(l.quantity)} {itemUnit(l.item_id)} × {formatMinor(l.buy_unit_minor, ccy, { symbol: false })} = {formatMinor(quantityTimes(l.quantity, l.buy_unit_minor), ccy, { symbol: false })}
                </span>
                {l.sell_unit_minor !== null && (
                  <span className="mz-row__sub mz-pos">
                    sold at {formatMinor(l.sell_unit_minor, ccy, { symbol: false })} = {formatMinor(quantityTimes(l.quantity, l.sell_unit_minor), ccy, { symbol: false })} · {shortDay(l.sold_on as string)}
                  </span>
                )}
              </button>
              <button type="button" className={`mz-btn mz-btn--sm ${l.sell_unit_minor === null ? "mz-btn--amber-outline" : "mz-btn--dark"}`} style={{ height: 40 }} onClick={() => setMode({ kind: "sale", row: l })}>
                {l.sell_unit_minor === null ? "Record sale" : "Edit sale"}
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="mz-row-between">
        <span className="mz-section-label">{isStock ? "Storage and other costs" : "Costs on the way"}</span>
        <button type="button" className="mz-link-btn mz-link-btn--accent" onClick={() => setMode({ kind: "cost", row: null })}>
          + Add cost
        </button>
      </div>
      {costs.length === 0 ? (
        <p className="mz-note">Transport, food, lodging, phone, losses. They come out of the capital account.</p>
      ) : (
        <div className="mz-list">
          {costs.map((c) => (
            <button key={c.id} type="button" className="mz-row" onClick={() => setMode({ kind: "cost", row: c })}>
              <span className="mz-row__main">
                <span className="mz-row__title mz-row__title--plain">{COST_KIND_LABEL[c.kind]}</span>
                <span className="mz-row__sub">
                  {shortDay(c.incurred_on)}
                  {c.note ? ` · ${c.note}` : ""}
                </span>
              </span>
              <span className="mz-row__value">−{formatMinor(c.amount_minor, ccy, { symbol: false })}</span>
            </button>
          ))}
        </div>
      )}

      <ErrorLine text={error} />
      <div className="mz-grid-2">
        <button type="button" className="mz-btn mz-btn--md" onClick={closeOrReopen} disabled={trip.status === "open" && !allSold}>
          {trip.status === "open" ? (isStock ? "Close (all sold)" : "Close trip") : isStock ? "Reopen" : "Reopen trip"}
        </button>
        <button type="button" className="mz-btn mz-btn--md mz-btn--amber-quiet" onClick={removeTrip}>
          {isStock ? "Delete" : "Delete trip"}
        </button>
      </div>
      {trip.status === "open" && !allSold && lines.length > 0 && (
        <p className="mz-note">{isStock ? "Sell the goods here, or take them on a trip. Close once everything is sold." : "Close the trip once every item is sold."}</p>
      )}

      <Sheet open={mode?.kind === "line"} title={mode?.kind === "line" && mode.row ? "Edit goods" : "Add goods"} onClose={() => setMode(null)}>
        {mode?.kind === "line" && <LineForm trip={trip} row={mode.row} onDone={refresh} />}
      </Sheet>
      <Sheet open={mode?.kind === "sale"} title="Record sale" onClose={() => setMode(null)}>
        {mode?.kind === "sale" && <SaleForm row={mode.row} unit={itemUnit(mode.row.item_id)} onDone={refresh} />}
      </Sheet>
      <Sheet open={mode?.kind === "cost"} title={mode?.kind === "cost" && mode.row ? "Edit cost" : "Add cost"} onClose={() => setMode(null)}>
        {mode?.kind === "cost" && <CostForm trip={trip} row={mode.row} onDone={refresh} />}
      </Sheet>
      <Sheet open={mode?.kind === "go"} title="Take on a trip" onClose={() => setMode(null)}>
        {mode?.kind === "go" && (
          <GoOnTripForm
            trip={trip}
            onDone={async () => {
              setMode(null);
              await reload();
              toast("The goods are on a trip now.");
            }}
          />
        )}
      </Sheet>
    </div>
  );
}

function LineForm({ trip, row, onDone }: { trip: Trip; row: TripLine | null; onDone: () => Promise<void> }) {
  const { data } = useMz();
  const items = (data?.items ?? []).filter((i) => !i.is_archived || i.id === row?.item_id);
  const [itemId, setItemId] = useState(row?.item_id ?? items[0]?.id ?? "");
  const [qty, setQty] = useState(row ? String(row.quantity) : "");
  const [unit, setUnit] = useState(row ? minorToInput(row.buy_unit_minor) : "");
  const [date, setDate] = useState(row?.bought_on ?? todayISO());
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const qtyOk = parseQuantityMilli(qty) !== null;
  const unitMinor = parseAmount(unit);
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!itemId) return setError("Add trade items in Settings first.");
    if (!qtyOk) return setError("Quantity is a positive number with up to three decimals.");
    if (!unitMinor) return setError("Enter the price per unit.");
    setSaving(true);
    try {
      await saveRow("trip_lines", row?.id, { trip_id: trip.id, item_id: itemId, quantity: qty.trim(), buy_unit_minor: unitMinor, bought_on: date });
      await onDone();
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setSaving(false);
    }
  }
  async function remove() {
    if (!row || !window.confirm("Remove these goods and their purchase entry?")) return;
    await deleteRow("trip_lines", row.id);
    await onDone();
  }
  if (!data) return null;
  return (
    <form className="mz-form" onSubmit={submit}>
      <label className="mz-field">
        Item
        <select className="mz-select" value={itemId} onChange={(e) => setItemId(e.target.value)}>
          {items.map((i) => (
            <option key={i.id} value={i.id}>
              {i.name} (per {i.unit})
            </option>
          ))}
        </select>
      </label>
      <div className="mz-grid-2">
        <TextField label="Quantity" value={qty} onChange={setQty} inputMode="decimal" />
        <AmountField label="Price per unit" value={unit} onChange={(t) => setUnit(t)} />
      </div>
      {qtyOk && unitMinor ? <p className="mz-note">Total {formatMinor(quantityTimes(qty.trim(), unitMinor))}, taken from the capital account.</p> : null}
      <label className="mz-field">
        Bought on
        <input className="mz-input" type="date" value={date} max={todayISO()} onChange={(e) => setDate(e.target.value || todayISO())} />
      </label>
      <ErrorLine text={error} />
      <button type="submit" className="mz-btn" disabled={saving}>
        {saving ? "Saving…" : "Save goods"}
      </button>
      {row && (
        <button type="button" className="mz-btn mz-btn--md mz-btn--amber-quiet" onClick={remove}>
          Remove
        </button>
      )}
    </form>
  );
}

function SaleForm({ row, unit, onDone }: { row: TripLine; unit: string; onDone: () => Promise<void> }) {
  const [price, setPrice] = useState(row.sell_unit_minor ? minorToInput(row.sell_unit_minor) : "");
  const [date, setDate] = useState(row.sold_on ?? todayISO());
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const priceMinor = parseAmount(price);
  async function save(clear = false) {
    if (!clear && !priceMinor) return setError("Enter the selling price per unit.");
    setSaving(true);
    try {
      await updateRow("trip_lines", row.id, clear ? { sell_unit_minor: null, sold_on: null } : { sell_unit_minor: priceMinor, sold_on: date });
      await onDone();
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setSaving(false);
    }
  }
  return (
    <form
      className="mz-form"
      onSubmit={(e) => {
        e.preventDefault();
        void save();
      }}
    >
      <p className="mz-muted" style={{ fontSize: 14 }}>
        {String(row.quantity)} {unit} bought at {formatMinor(row.buy_unit_minor)} each.
      </p>
      <AmountField label={`Sold at, per ${unit || "unit"}`} value={price} onChange={(t) => setPrice(t)} />
      {priceMinor ? (
        <p className="mz-note">
          Sale {formatMinor(quantityTimes(row.quantity, priceMinor))}, gain on goods {formatMinor(quantityTimes(row.quantity, priceMinor) - quantityTimes(row.quantity, row.buy_unit_minor), "ETB", { sign: true })} before costs.
        </p>
      ) : null}
      <label className="mz-field">
        Sold on
        <input className="mz-input" type="date" value={date} max={todayISO()} onChange={(e) => setDate(e.target.value || todayISO())} />
      </label>
      <ErrorLine text={error} />
      <button type="submit" className="mz-btn" disabled={saving}>
        {saving ? "Saving…" : "Save sale"}
      </button>
      {row.sell_unit_minor !== null && (
        <button type="button" className="mz-btn mz-btn--md mz-btn--amber-quiet" onClick={() => save(true)}>
          Mark as unsold
        </button>
      )}
    </form>
  );
}

function CostForm({ trip, row, onDone }: { trip: Trip; row: TripCost | null; onDone: () => Promise<void> }) {
  const [kind, setKind] = useState<TripCostKind>(row?.kind ?? "transport");
  const [amount, setAmount] = useState(row ? minorToInput(row.amount_minor) : "");
  const [date, setDate] = useState(row?.incurred_on ?? todayISO());
  const [note, setNote] = useState(row?.note ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault();
    const m = parseAmount(amount);
    if (!m) return setError("Enter the amount.");
    setSaving(true);
    try {
      await saveRow("trip_costs", row?.id, { trip_id: trip.id, kind, amount_minor: m, incurred_on: date, note: note.trim() || null });
      await onDone();
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setSaving(false);
    }
  }
  async function remove() {
    if (!row || !window.confirm("Remove this cost and its entry?")) return;
    await deleteRow("trip_costs", row.id);
    await onDone();
  }
  return (
    <form className="mz-form" onSubmit={submit}>
      <div className="mz-chips" role="radiogroup" aria-label="Kind of cost">
        {(Object.keys(COST_KIND_LABEL) as TripCostKind[]).map((k) => (
          <button key={k} type="button" role="radio" aria-checked={kind === k} className="mz-chip" onClick={() => setKind(k)}>
            {COST_KIND_LABEL[k]}
          </button>
        ))}
      </div>
      <AmountField label="Amount" value={amount} onChange={(t) => setAmount(t)} />
      <label className="mz-field">
        Date
        <input className="mz-input" type="date" value={date} max={todayISO()} onChange={(e) => setDate(e.target.value || todayISO())} />
      </label>
      <TextField label="Note" value={note} onChange={setNote} maxLength={200} />
      <ErrorLine text={error} />
      <button type="submit" className="mz-btn" disabled={saving}>
        {saving ? "Saving…" : "Save cost"}
      </button>
      {row && (
        <button type="button" className="mz-btn mz-btn--md mz-btn--amber-quiet" onClick={remove}>
          Remove
        </button>
      )}
    </form>
  );
}

function PriceForm({ defaultCity, onDone }: { defaultCity?: string; onDone: () => Promise<void> }) {
  const { data } = useMz();
  const items = (data?.items ?? []).filter((i) => !i.is_archived);
  const cities = (data?.cities ?? []).filter((c) => !c.is_archived);
  const [itemId, setItemId] = useState(items[0]?.id ?? "");
  const [cityId, setCityId] = useState(defaultCity ?? cities[0]?.id ?? "");
  const [price, setPrice] = useState("");
  const [date, setDate] = useState(todayISO());
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  return (
    <form
      className="mz-form"
      onSubmit={async (e) => {
        e.preventDefault();
        const m = parseAmount(price);
        if (!m) return setError("Enter the price per unit.");
        setSaving(true);
        try {
          await insertRow("price_logs", { item_id: itemId, city_id: cityId, price_minor: m, observed_on: date, note: note.trim() || null });
          await onDone();
        } catch (err) {
          setError(friendlyError(err));
        } finally {
          setSaving(false);
        }
      }}
    >
      <label className="mz-field">
        Item
        <select className="mz-select" value={itemId} onChange={(e) => setItemId(e.target.value)}>
          {items.map((i) => (
            <option key={i.id} value={i.id}>
              {i.name} (per {i.unit})
            </option>
          ))}
        </select>
      </label>
      <label className="mz-field">
        City
        <select className="mz-select" value={cityId} onChange={(e) => setCityId(e.target.value)}>
          {cities.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>
      <AmountField label="Price per unit" value={price} onChange={(t) => setPrice(t)} />
      <label className="mz-field">
        Seen on
        <input className="mz-input" type="date" value={date} max={todayISO()} onChange={(e) => setDate(e.target.value || todayISO())} />
      </label>
      <TextField label="Note" value={note} onChange={setNote} maxLength={200} placeholder="Market, seller…" />
      <ErrorLine text={error} />
      <button type="submit" className="mz-btn" disabled={saving}>
        {saving ? "Saving…" : "Log price"}
      </button>
    </form>
  );
}

/** Turns goods kept in store into a trip: the same goods, purchase entries and account, now with a destination. */
function GoOnTripForm({ trip, onDone }: { trip: Trip; onDone: () => Promise<void> }) {
  const { data } = useMz();
  const destinations = (data?.cities ?? []).filter((c) => !c.is_archived && c.id !== trip.from_city_id);
  const [to, setTo] = useState(destinations[0]?.id ?? "");
  const [name, setName] = useState(`Trip ${(data?.trips ?? []).filter((t) => t.kind === "trip").length + 1}`);
  const [date, setDate] = useState(todayISO());
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  return (
    <form
      className="mz-form"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!to) return setError("Choose where you are taking the goods.");
        if (!name.trim()) return setError("Name the trip.");
        setSaving(true);
        try {
          await updateRow("trips", trip.id, { kind: "trip", to_city_id: to, name: name.trim(), started_on: date < trip.started_on ? trip.started_on : date });
          await onDone();
        } catch (err) {
          setError(friendlyError(err));
        } finally {
          setSaving(false);
        }
      }}
    >
      <p className="mz-note">All goods and their purchase entries move with it. Add the costs on the way and the sales as usual.</p>
      <TextField label="Trip name" value={name} onChange={setName} maxLength={80} />
      <label className="mz-field">
        To
        <select className="mz-select" value={to} onChange={(e) => setTo(e.target.value)}>
          {destinations.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>
      <label className="mz-field">
        Leaving on
        <input className="mz-input" type="date" value={date} min={trip.started_on} onChange={(e) => setDate(e.target.value || todayISO())} />
      </label>
      <ErrorLine text={error} />
      <button type="submit" className="mz-btn" disabled={saving}>
        {saving ? "Saving…" : "Start the trip"}
      </button>
    </form>
  );
}
