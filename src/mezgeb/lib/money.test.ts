import { describe, expect, it } from "vitest";
import {
  applyBasisPoints,
  convertMinor,
  divRound,
  formatBp,
  formatMinor,
  formatTenths,
  hourlyRate,
  hoursOfWorkTenths,
  hoursPhrase,
  minorToInput,
  parseAmount,
  parsePercentToBp,
  parseQuantityMilli,
  parseSignedAmount,
  percentNumberToBp,
  percentTenths,
  quantityTimes,
  sharePercent,
  sumMinor,
} from "./money";

describe("parseAmount", () => {
  it("parses whole amounts into minor units", () => {
    expect(parseAmount("650")).toBe(65000);
    expect(parseAmount("0")).toBe(0);
  });
  it("parses decimals with integer math", () => {
    expect(parseAmount("0.1")).toBe(10);
    expect(parseAmount("0.29")).toBe(29); // 0.29 * 100 is 28.999… in floats
    expect(parseAmount("1234.5")).toBe(123450);
    expect(parseAmount(".5")).toBe(50);
    expect(parseAmount("12.")).toBe(1200);
  });
  it("accepts thousands separators and spaces", () => {
    expect(parseAmount("20,000")).toBe(2000000);
    expect(parseAmount(" 1 000.25 ")).toBe(100025);
  });
  it("rejects anything else", () => {
    for (const bad of ["", ".", "abc", "1.234", "-5", "1e3", "1.2.3", "Br 5"]) expect(parseAmount(bad)).toBeNull();
  });
  it("rejects amounts beyond the safe integer range", () => {
    expect(parseAmount("999999999999999999")).toBeNull();
  });
  it("parses signed opening balances", () => {
    expect(parseSignedAmount("-120.5")).toBe(-12050);
    expect(parseSignedAmount("−5")).toBe(-500);
    expect(parseSignedAmount("5")).toBe(500);
  });
  it("round-trips through minorToInput", () => {
    for (const v of [0, 5, 50, 123450, 100, -12050, 2000000]) expect(parseSignedAmount(minorToInput(v))).toBe(v);
    expect(minorToInput(123450)).toBe("1234.5");
  });
});

describe("formatMinor", () => {
  it("adds separators and the Birr symbol after the number", () => {
    expect(formatMinor(7824000)).toBe("78,240 Br");
    expect(formatMinor(99)).toBe("0.99 Br");
    expect(formatMinor(123450)).toBe("1,234.50 Br");
  });
  it("puts the dollar sign first", () => {
    expect(formatMinor(250000, "USD")).toBe("$2,500");
  });
  it("shows signs with a real minus", () => {
    expect(formatMinor(-12000)).toBe("−120 Br");
    expect(formatMinor(395000, "ETB", { sign: true })).toBe("+3,950 Br");
    expect(formatMinor(0, "ETB", { sign: true })).toBe("0 Br");
  });
  it("can drop the symbol or force cents", () => {
    expect(formatMinor(1324000, "ETB", { symbol: false })).toBe("13,240");
    expect(formatMinor(100, "ETB", { cents: "always" })).toBe("1.00 Br");
  });
});

describe("hours of work", () => {
  it("matches the design examples (20,000 Br over 176 h)", () => {
    expect(hoursOfWorkTenths(65000, 2000000, 176)).toBe(57); // 650 Br = 5.7 h
    expect(hoursOfWorkTenths(286000, 2000000, 176)).toBe(252); // 2,860 Br = 25.2 h
    expect(hoursPhrase(65000, 2000000, 176)).toBe("5.7 hours");
  });
  it("rounds to one decimal, half up", () => {
    // 1 h of work = 113.636… Br; 56.82 Br = 0.50002 h
    expect(hoursOfWorkTenths(5682, 2000000, 176)).toBe(5);
  });
  it("is null without a salary", () => {
    expect(hoursOfWorkTenths(100, 0, 176)).toBeNull();
    expect(hoursPhrase(100, 0, 176)).toBeNull();
  });
  it("gives the hourly rate", () => {
    expect(hourlyRate(2000000, 176)).toBe(11364); // 113.64 Br/h
  });
});

describe("percent helpers", () => {
  it("parses percents into basis points", () => {
    expect(parsePercentToBp("10")).toBe(1000);
    expect(parsePercentToBp("12.5")).toBe(1250);
    expect(parsePercentToBp("12.5%")).toBe(1250);
    expect(parsePercentToBp("100")).toBe(10000);
    expect(parsePercentToBp("101")).toBeNull();
    expect(parsePercentToBp("1.234")).toBeNull();
    expect(percentNumberToBp(10)).toBe(1000);
    expect(percentNumberToBp("7.25")).toBe(725);
  });
  it("formats basis points and tenths", () => {
    expect(formatBp(1000)).toBe("10%");
    expect(formatBp(1250)).toBe("12.5%");
    expect(formatBp(725)).toBe("7.25%");
    expect(formatTenths(98)).toBe("9.8%");
    expect(formatTenths(-55)).toBe("−5.5%");
    expect(formatTenths(100)).toBe("10%");
  });
  it("applies basis points with half-up rounding to whole santim", () => {
    expect(applyBasisPoints(2000000, 1000)).toBe(200000);
    expect(applyBasisPoints(333, 1000)).toBe(33); // 33.3
    expect(applyBasisPoints(335, 1000)).toBe(34); // 33.5 → 34
  });
  it("computes ratios like Postgres round()", () => {
    expect(percentTenths(395000, 4030000)).toBe(98); // 9.80 %
    expect(percentTenths(60000, 265000)).toBe(226);
    expect(percentTenths(-5, 1000)).toBe(-5);
    expect(percentTenths(1, 0)).toBeNull();
  });
  it("clamps bar widths", () => {
    expect(sharePercent(800000, 6000000)).toBe(13);
    expect(sharePercent(-1, 10)).toBe(0);
    expect(sharePercent(20, 10)).toBe(100);
  });
});

describe("quantities and rounding", () => {
  it("parses quantities to thousandths", () => {
    expect(parseQuantityMilli("2.5")).toBe(2500);
    expect(parseQuantityMilli("0.125")).toBe(125);
    expect(parseQuantityMilli("0")).toBeNull();
    expect(parseQuantityMilli("1.2345")).toBeNull();
  });
  it("multiplies quantity × unit price exactly", () => {
    expect(quantityTimes(2.5, 100000)).toBe(250000);
    expect(quantityTimes("0.333", 100)).toBe(33); // 33.3
    expect(quantityTimes("0.335", 100)).toBe(34); // 33.5 → 34, like Postgres
    expect(quantityTimes("1.1", 3)).toBe(3); // 3.3
  });
  it("rounds division half away from zero", () => {
    expect(divRound(BigInt(5), BigInt(2))).toBe(BigInt(3));
    expect(divRound(BigInt(-5), BigInt(2))).toBe(BigInt(-3));
    expect(divRound(BigInt(4), BigInt(3))).toBe(BigInt(1));
  });
  it("sums safely", () => {
    expect(sumMinor([1, 2, 3])).toBe(6);
    expect(() => sumMinor([Number.MAX_SAFE_INTEGER, 1])).toThrow();
  });
  it("converts with a decimal rate without floats", () => {
    expect(convertMinor(10000, "125.5")).toBe(1255000); // $100 → 12,550 Br
    expect(convertMinor(1, "0.5")).toBe(1); // 0.5 → 1 (half up)
  });
});
