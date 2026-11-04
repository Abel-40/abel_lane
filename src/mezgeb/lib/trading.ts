import { percentTenths, quantityTimes, sumMinor, type Minor } from "./money";

export type TripLineInput = {
  quantity: number | string;
  buy_unit_minor: Minor;
  sell_unit_minor: Minor | null;
};

export type TripCostInput = { kind: string; amount_minor: Minor };

export type TripResult = {
  purchases: Minor;
  costs: Minor;
  sales: Minor;
  net: Minor;
  /** net / (purchases + costs), in tenths of a percent */
  marginTenths: number | null;
  unsoldStock: Minor;
};

/** Mirrors the trip_summaries view so the app and the database always agree. */
export function tripResult(lines: TripLineInput[], costs: TripCostInput[]): TripResult {
  const purchases = sumMinor(lines.map((l) => quantityTimes(l.quantity, l.buy_unit_minor)));
  const sales = sumMinor(lines.filter((l) => l.sell_unit_minor !== null).map((l) => quantityTimes(l.quantity, l.sell_unit_minor as Minor)));
  const unsoldStock = sumMinor(lines.filter((l) => l.sell_unit_minor === null).map((l) => quantityTimes(l.quantity, l.buy_unit_minor)));
  const costTotal = sumMinor(costs.map((c) => c.amount_minor));
  const net = sales - purchases - costTotal;
  return { purchases, costs: costTotal, sales, net, marginTenths: percentTenths(net, purchases + costTotal), unsoldStock };
}

export type Verdict = "go" | "ok" | "skip";

/**
 * Price gap between buying in one city and selling in another.
 * go: the gap covers the usual trip costs and still reaches the item's target margin;
 * ok: it at least covers the usual costs; skip: it does not.
 * Percentages are in tenths (100 = 10 %).
 */
export function priceVerdict(buy: Minor, sell: Minor, targetMarginTenths: number, costRatioTenths: number): { gapTenths: number; verdict: Verdict } {
  const gapTenths = percentTenths(sell - buy, buy) ?? 0;
  const afterCosts = gapTenths - costRatioTenths;
  const verdict: Verdict = afterCosts >= targetMarginTenths ? "go" : gapTenths >= costRatioTenths && gapTenths > 0 ? "ok" : "skip";
  return { gapTenths, verdict };
}

/** Usual costs as a share of goods bought, from closed trips (tenths of a percent). */
export function usualCostRatioTenths(trips: { purchases_minor: Minor; costs_minor: Minor; status: string }[]): number {
  const closed = trips.filter((t) => t.status === "closed" && t.purchases_minor > 0);
  if (closed.length === 0) return 0;
  return percentTenths(sumMinor(closed.map((t) => t.costs_minor)), sumMinor(closed.map((t) => t.purchases_minor))) ?? 0;
}
