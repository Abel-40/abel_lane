import { describe, expect, it } from "vitest";
import { TABLES } from "./db";
import { WIPE_ORDER } from "./wipe";

describe("delete all data", () => {
  it("covers every table exactly once", () => {
    expect([...WIPE_ORDER].sort()).toEqual([...TABLES].sort());
    expect(new Set(WIPE_ORDER).size).toBe(WIPE_ORDER.length);
  });
  it("deletes children before parents and settings last", () => {
    const at = (t: string) => WIPE_ORDER.indexOf(t as never);
    expect(at("trips")).toBe(0);
    expect(at("settings")).toBe(WIPE_ORDER.length - 1);
    for (const [child, parent] of [
      ["transactions", "accounts"],
      ["transactions", "categories"],
      ["transactions", "goals"],
      ["transactions", "debts"],
      ["payday_allocations", "paydays"],
      ["paydays", "transactions"],
      ["wishes", "transactions"],
      ["payday_rules", "accounts"],
      ["goals", "accounts"],
      ["debts", "accounts"],
      ["price_logs", "trade_items"],
      ["trips", "cities"],
      ["accounts", "institutions"],
    ]) {
      expect(at(child), `${child} before ${parent}`).toBeLessThan(at(parent));
    }
  });
});
