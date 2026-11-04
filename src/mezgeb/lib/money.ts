// All money in Mezgeb is integer minor units (santim / cents). Never floats:
// input is parsed as a string, and every multiplication or division goes
// through BigInt with explicit half-up rounding (matching Postgres round()).

export type Minor = number;

const CURRENCIES: Record<string, { symbol: string; before: boolean }> = {
  ETB: { symbol: "Br", before: false },
  USD: { symbol: "$", before: true },
};

const MAX = BigInt(Number.MAX_SAFE_INTEGER);
const B0 = BigInt(0);
const B2 = BigInt(2);
const B10 = BigInt(10);
const B100 = BigInt(100);

export function currencySymbol(code: string): string {
  return CURRENCIES[code]?.symbol ?? code;
}

function toSafe(value: bigint): number | null {
  if (value > MAX || value < -MAX) return null;
  return Number(value);
}

/** Rounded integer division, halves away from zero (Postgres numeric round). */
export function divRound(numerator: bigint, denominator: bigint): bigint {
  if (denominator === B0) throw new Error("Division by zero");
  const negative = numerator < B0 !== denominator < B0;
  const n = numerator < B0 ? -numerator : numerator;
  const d = denominator < B0 ? -denominator : denominator;
  const q = (n * B2 + d) / (d * B2);
  return negative ? -q : q;
}

/** Integer division of non-negative amounts, rounded down / up. */
export function divFloor(a: Minor, b: Minor): number {
  return Number(BigInt(a) / BigInt(b));
}
export function divCeil(a: Minor, b: Minor): number {
  return Number((BigInt(a) + BigInt(b) - BigInt(1)) / BigInt(b));
}

/** Share of `part` in `whole` as whole percent, clamped to 0–100 (for bars). */
export function sharePercent(part: Minor, whole: Minor): number {
  if (whole <= 0 || part <= 0) return 0;
  return Math.min(100, Number((BigInt(part) * B100) / BigInt(whole)));
}

/**
 * "1,234.5" → 123450. Accepts digits, optional thousands separators and up to
 * two decimals. Returns null for anything else (including negatives).
 */
export function parseAmount(input: string): Minor | null {
  const s = input.replace(/[\s,]/g, "");
  const m = /^(\d*)(?:\.(\d{0,2}))?$/.exec(s);
  if (!m || (m[1] === "" && !m[2])) return null;
  const whole = BigInt(m[1] || "0");
  const frac = BigInt(((m[2] ?? "") + "00").slice(0, 2));
  return toSafe(whole * B100 + frac);
}

/** Like parseAmount but allows a leading minus (opening balances can be negative). */
export function parseSignedAmount(input: string): Minor | null {
  const s = input.trim().replace(/^[−–]/, "-");
  if (s.startsWith("-")) {
    const v = parseAmount(s.slice(1));
    return v === null ? null : -v;
  }
  return parseAmount(s);
}

/** 123450 → "1234.5" (for prefilling inputs). */
export function minorToInput(minor: Minor): string {
  const neg = minor < 0;
  const abs = Math.abs(minor);
  const cents = abs % 100;
  const whole = (abs - cents) / 100;
  const frac = cents === 0 ? "" : "." + String(cents).padStart(2, "0").replace(/0$/, "");
  return (neg ? "-" : "") + whole + frac;
}

function groupThousands(digits: string): string {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export type FormatOptions = {
  /** show the currency symbol (default true) */
  symbol?: boolean;
  /** prefix "+" on positive amounts */
  sign?: boolean;
  /** "auto" hides .00 (default), "always" keeps it */
  cents?: "auto" | "always";
};

/** 7824000 → "78,240 Br"; −12000 → "−120 Br"; 99 → "0.99 Br". */
export function formatMinor(minor: Minor, currency = "ETB", opts: FormatOptions = {}): string {
  const { symbol = true, sign = false, cents = "auto" } = opts;
  const neg = minor < 0;
  const abs = Math.abs(minor);
  const c = abs % 100;
  const whole = (abs - c) / 100;
  let text = groupThousands(String(whole));
  if (c !== 0 || cents === "always") text += "." + String(c).padStart(2, "0");
  const prefix = neg ? "−" : sign && minor > 0 ? "+" : "";
  if (!symbol) return prefix + text;
  const cur = CURRENCIES[currency] ?? { symbol: currency, before: false };
  return cur.before ? `${prefix}${cur.symbol}${text}` : `${prefix}${text} ${cur.symbol}`;
}

/** Applies basis points (1000 = 10 %) to an amount, rounded to whole minor units. */
export function applyBasisPoints(minor: Minor, bp: number): Minor {
  return Number(divRound(BigInt(minor) * BigInt(bp), BigInt(10000)));
}

/** "10" → 1000, "12.5" → 1250. Up to two decimals, 0–100 % unless max is raised. */
export function parsePercentToBp(input: string, maxBp = 10000): number | null {
  const m = /^(\d{1,4})(?:\.(\d{0,2}))?$/.exec(input.trim().replace("%", "").trim());
  if (!m) return null;
  const bp = Number(m[1]) * 100 + Number(((m[2] ?? "") + "00").slice(0, 2));
  return bp > maxBp ? null : bp;
}

/** A numeric(5,2) percent that arrived as a JS number (10, 12.5) → basis points. */
export function percentNumberToBp(percent: number | string): number {
  return parsePercentToBp(String(percent), 100000) ?? 0;
}

/** 1250 → "12.5%". */
export function formatBp(bp: number): string {
  const cents = bp % 100;
  const whole = (bp - cents) / 100;
  if (cents === 0) return `${whole}%`;
  return `${whole}.${String(cents).padStart(2, "0").replace(/0$/, "")}%`;
}

/** Ratio as a percentage in tenths (226 = 22.6 %), rounded like Postgres. */
export function percentTenths(numerator: Minor, denominator: Minor): number | null {
  if (denominator === 0) return null;
  return Number(divRound(BigInt(numerator) * BigInt(1000), BigInt(denominator)));
}

/** 226 → "22.6%"; 100 → "10%"; −55 → "−5.5%". */
export function formatTenths(tenths: number, suffix = "%"): string {
  const neg = tenths < 0;
  const abs = Math.abs(tenths);
  const d = abs % 10;
  const whole = (abs - d) / 10;
  return `${neg ? "−" : ""}${whole}${d ? "." + d : ""}${suffix}`;
}

/**
 * Hours of work an amount costs: amount / (net_salary / work_hours_per_month),
 * in tenths of an hour (57 = 5.7 h). Null when no salary is set.
 */
export function hoursOfWorkTenths(amount: Minor, netSalary: Minor, hoursPerMonth: number): number | null {
  if (netSalary <= 0 || hoursPerMonth <= 0) return null;
  return Number(divRound(BigInt(amount) * BigInt(hoursPerMonth) * B10, BigInt(netSalary)));
}

/** 57 → "5.7", 250 → "25". */
export function formatHours(tenths: number): string {
  return formatTenths(tenths, "");
}

/** "N hours of work" phrase, or null when there is no salary to compare with. */
export function hoursPhrase(amount: Minor, netSalary: Minor, hoursPerMonth: number): string | null {
  const t = hoursOfWorkTenths(amount, netSalary, hoursPerMonth);
  if (t === null) return null;
  return `${formatHours(t)} ${t === 10 ? "hour" : "hours"}`;
}

/** Hourly rate in minor units (salary / hours), rounded. */
export function hourlyRate(netSalary: Minor, hoursPerMonth: number): Minor {
  if (hoursPerMonth <= 0) return 0;
  return Number(divRound(BigInt(netSalary), BigInt(hoursPerMonth)));
}

/**
 * Quantity (numeric(12,3)) × unit price, rounded to whole minor units exactly
 * like Postgres round(quantity * unit).
 */
export function quantityTimes(quantity: number | string, unitMinor: Minor): Minor {
  const milli = parseQuantityMilli(String(quantity));
  if (milli === null) throw new Error(`Bad quantity: ${quantity}`);
  return Number(divRound(BigInt(milli) * BigInt(unitMinor), BigInt(1000)));
}

/** "2.5" → 2500 (thousandths). Up to three decimals, must be positive. */
export function parseQuantityMilli(input: string): number | null {
  const m = /^(\d{1,9})(?:\.(\d{0,3}))?$/.exec(input.trim().replace(/,/g, ""));
  if (!m) return null;
  const v = Number(m[1]) * 1000 + Number(((m[2] ?? "") + "000").slice(0, 3));
  return v > 0 ? v : null;
}

/** Sum that refuses to leave the safe-integer range. */
export function sumMinor(values: Minor[]): Minor {
  let total = B0;
  for (const v of values) total += BigInt(v);
  const safe = toSafe(total);
  if (safe === null) throw new Error("Amount too large");
  return safe;
}

/** Converts using a decimal rate string ("125.5") without float multiplication. */
export function convertMinor(minor: Minor, rate: number | string): Minor | null {
  const m = /^(\d+)(?:\.(\d{0,8}))?$/.exec(String(rate));
  if (!m) return null;
  const scale = BigInt(100000000);
  const scaled = BigInt(m[1]) * scale + BigInt(((m[2] ?? "") + "00000000").slice(0, 8));
  return toSafe(divRound(BigInt(minor) * scaled, scale));
}

/** minor ÷ rate, rounded half away from zero (e.g. 12,550.00 ETB ÷ 125.5 = 100.00 USD). null for a bad or zero rate. */
export function convertMinorInverse(minor: Minor, rate: number | string): Minor | null {
  const m = /^(\d+)(?:\.(\d{0,8}))?$/.exec(String(rate));
  if (!m) return null;
  const scale = BigInt(100000000);
  const scaled = BigInt(m[1]) * scale + BigInt(((m[2] ?? "") + "00000000").slice(0, 8));
  if (scaled === BigInt(0)) return null;
  return toSafe(divRound(BigInt(minor) * scale, scaled));
}
