import { describe, expect, it } from "vitest";
import { daysUntilPayday, nextPayday, paydaysUntil, targetLabel, longDay, nextEndOf } from "./dates";
import { computeSplit, type SplitRule } from "./payday";
import { debtOutlook, debtRemaining, goalOutlook } from "./plan";
import { priceVerdict, tripResult, usualCostRatioTenths } from "./trading";

const plan: (SplitRule & { target: string })[] = [
  { name: "Tithe", kind: "percent_of_salary", value: 1000, target: "Telebirr · Tithe" },
  { name: "Taxi and airtime", kind: "fixed", value: 250000, target: "Telebirr · Spending" },
  { name: "Personal", kind: "fixed", value: 150000, target: "Telebirr · Spending" },
  { name: "Friend loan", kind: "fixed", value: 800000, target: "Dashen · Debt fund" },
  { name: "Emergency fund", kind: "fixed", value: 400000, target: "Awash" },
  { name: "Long-term savings", kind: "remainder", value: 0, target: "Awash" },
];

describe("payday split", () => {
  it("splits 20,000 Br exactly like the design", () => {
    const s = computeSplit(2000000, plan);
    expect(s.lines.map((l) => l.amount_minor)).toEqual([200000, 250000, 150000, 800000, 400000, 200000]);
    expect(s.assigned).toBe(2000000);
    expect(s.leftover).toBe(0);
    expect(s.ok).toBe(true);
  });
  it("rounds percent rules to whole santim and the remainder absorbs the rest", () => {
    const s = computeSplit(1000001, [
      { name: "A", kind: "percent_of_salary", value: 3333 },
      { name: "B", kind: "remainder", value: 0 },
    ]);
    expect(s.lines[0].amount_minor).toBe(333300); // 333,300.33 → 333,300
    expect(s.lines[0].amount_minor + s.lines[1].amount_minor).toBe(1000001);
    expect(s.ok).toBe(true);
  });
  it("always totals the salary when a remainder rule exists", () => {
    for (const salary of [1, 99, 12345, 2000000, 1999999, 777777777]) {
      const s = computeSplit(salary, [
        { name: "p1", kind: "percent_of_salary", value: 1250 },
        { name: "p2", kind: "percent_of_salary", value: 333 },
        { name: "r", kind: "remainder", value: 0 },
      ]);
      expect(s.assigned).toBe(salary);
      expect(s.ok).toBe(true);
    }
  });
  it("reports unassigned money without a remainder rule", () => {
    const s = computeSplit(2000000, plan.slice(0, 5));
    expect(s.leftover).toBe(200000);
    expect(s.ok).toBe(false);
  });
  it("reports an over-assigned salary", () => {
    const s = computeSplit(1000000, plan);
    expect(s.ok).toBe(false);
    expect(s.leftover).toBe(-700000); // 1,000 tithe + 16,000 fixed on a 10,000 salary
    expect(s.lines[5].amount_minor).toBe(0);
  });
  it("ignores inactive rules and respects sort order", () => {
    const s = computeSplit(1000, [
      { name: "b", kind: "fixed", value: 100, sort_order: 2 },
      { name: "a", kind: "fixed", value: 900, sort_order: 1 },
      { name: "off", kind: "fixed", value: 500, is_active: false },
    ]);
    expect(s.lines.map((l) => l.rule.name)).toEqual(["a", "b"]);
    expect(s.ok).toBe(true);
  });
  it("refuses two remainder rules", () => {
    const s = computeSplit(1000, [
      { name: "r1", kind: "remainder", value: 0 },
      { name: "r2", kind: "remainder", value: 0 },
    ]);
    expect(s.ok).toBe(false);
  });
});

describe("dates", () => {
  it("finds the next payday, clamped to short months", () => {
    expect(nextPayday(28, "2026-11-03")).toBe("2026-11-28");
    expect(nextPayday(28, "2026-11-28")).toBe("2026-11-28");
    expect(nextPayday(28, "2026-11-29")).toBe("2026-12-28");
    expect(nextPayday(31, "2026-11-03")).toBe("2026-11-30");
    expect(nextPayday(31, "2027-02-01")).toBe("2027-02-28");
    expect(daysUntilPayday(30, "2026-11-03")).toBe(27);
  });
  it("counts paydays until a target date", () => {
    expect(paydaysUntil("2027-01-31", 28, "2026-11-03")).toBe(3); // Nov 28, Dec 28, Jan 28
    expect(paydaysUntil("2026-11-27", 28, "2026-11-03")).toBe(0);
  });
  it("labels dates the way the design does", () => {
    expect(longDay("2026-11-03")).toBe("Tuesday, 3 November");
    expect(targetLabel("2027-01-31", "2026-11-03")).toBe("End of January");
    expect(nextEndOf(0, "2026-11-03")).toBe("2027-01-31");
  });
});

describe("debts and goals", () => {
  it("never shows negative remaining debt", () => {
    expect(debtRemaining(6000000, 800000)).toBe(5200000);
    expect(debtRemaining(6000000, 7000000)).toBe(0);
  });
  it("is on track when the paydays left cover the rest", () => {
    // 52,000 left, 8,000 per payday, paydays on the 28th until end of January: 3 → 24,000
    const late = debtOutlook(5200000, 800000, "2027-01-31", 28, "2026-11-03");
    expect(late.paydaysLeft).toBe(3);
    expect(late.onTrack).toBe(false);
    expect(late.paydaysNeeded).toBe(7);
    const fine = debtOutlook(2400000, 800000, "2027-01-31", 28, "2026-11-03");
    expect(fine.onTrack).toBe(true);
  });
  it("estimates paydays remaining for a goal", () => {
    const g = goalOutlook(400000, 3000000, 400000);
    expect(g.percent).toBe(13);
    expect(g.paydaysRemaining).toBe(7); // "About 7 more paydays at 4,000 Br"
    expect(goalOutlook(3000000, 3000000, 400000).reached).toBe(true);
    expect(goalOutlook(0, null, 0).paydaysRemaining).toBeNull();
  });
});

describe("trading", () => {
  it("computes a trip like the design (Trip 3)", () => {
    const r = tripResult(
      [{ quantity: 1, buy_unit_minor: 3600000, sell_unit_minor: 4425000 }],
      [
        { kind: "transport", amount_minor: 240000 },
        { kind: "food", amount_minor: 90000 },
        { kind: "lodging", amount_minor: 100000 },
      ],
    );
    expect(r.net).toBe(395000);
    expect(r.marginTenths).toBe(98); // 9.8 % net
    expect(r.unsoldStock).toBe(0);
  });
  it("matches the database for fractional quantities and unsold stock", () => {
    const r = tripResult(
      [
        { quantity: "2.5", buy_unit_minor: 100000, sell_unit_minor: 130000 },
        { quantity: "0.335", buy_unit_minor: 100, sell_unit_minor: null },
      ],
      [{ kind: "transport", amount_minor: 15000 }],
    );
    expect(r.purchases).toBe(250034);
    expect(r.sales).toBe(325000);
    expect(r.unsoldStock).toBe(34);
    expect(r.net).toBe(325000 - 250034 - 15000);
  });
  it("gives a price-gap verdict against target and usual costs", () => {
    // target 10 %, usual costs 5 % of goods bought
    expect(priceVerdict(35000, 42000, 100, 50)).toEqual({ gapTenths: 200, verdict: "go" }); // 20 − 5 ≥ 10
    expect(priceVerdict(102000, 115000, 100, 50)).toEqual({ gapTenths: 127, verdict: "ok" }); // 12.7 − 5 < 10, but covers costs
    expect(priceVerdict(8000, 8300, 100, 50)).toEqual({ gapTenths: 38, verdict: "skip" }); // 3.8 < 5
    expect(priceVerdict(100, 90, 100, 0).verdict).toBe("skip");
  });
  it("derives usual costs from closed trips only", () => {
    expect(
      usualCostRatioTenths([
        { status: "closed", purchases_minor: 3600000, costs_minor: 430000 },
        { status: "open", purchases_minor: 1650000, costs_minor: 999999 },
      ]),
    ).toBe(119); // 11.9 %
    expect(usualCostRatioTenths([])).toBe(0);
  });
});
