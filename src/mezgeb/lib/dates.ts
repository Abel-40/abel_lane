// Dates are plain local calendar days as "YYYY-MM-DD" strings, like Postgres `date`.

export type ISODate = string;

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export function toISO(d: Date): ISODate {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function todayISO(now = new Date()): ISODate {
  return toISO(now);
}

export function parseISO(iso: ISODate): Date {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function daysInMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate();
}

/** Whole days from a to b (b − a), ignoring daylight-saving shifts. */
export function daysBetween(a: ISODate, b: ISODate): number {
  const da = parseISO(a);
  const db = parseISO(b);
  return Math.round((Date.UTC(db.getFullYear(), db.getMonth(), db.getDate()) - Date.UTC(da.getFullYear(), da.getMonth(), da.getDate())) / 86400000);
}

export function addDays(iso: ISODate, days: number): ISODate {
  const d = parseISO(iso);
  d.setDate(d.getDate() + days);
  return toISO(d);
}

/** The payday in a given month, clamped to the month length (31 → 30 Nov). */
export function paydayInMonth(year: number, monthIndex: number, paydayDay: number): ISODate {
  const day = Math.min(paydayDay, daysInMonth(year, monthIndex));
  return toISO(new Date(year, monthIndex, day));
}

/** The next payday on or after today. */
export function nextPayday(paydayDay: number, today: ISODate = todayISO()): ISODate {
  const t = parseISO(today);
  const thisMonth = paydayInMonth(t.getFullYear(), t.getMonth(), paydayDay);
  if (thisMonth >= today) return thisMonth;
  return paydayInMonth(t.getFullYear(), t.getMonth() + 1, paydayDay);
}

export function daysUntilPayday(paydayDay: number, today: ISODate = todayISO()): number {
  return daysBetween(today, nextPayday(paydayDay, today));
}

/** How many paydays fall after today and on or before `until`. */
export function paydaysUntil(until: ISODate, paydayDay: number, today: ISODate = todayISO()): number {
  let count = 0;
  let next = nextPayday(paydayDay, addDays(today, 1));
  while (next <= until && count < 1200) {
    count += 1;
    next = nextPayday(paydayDay, addDays(next, 1));
  }
  return count;
}

export function monthStart(iso: ISODate = todayISO()): ISODate {
  return iso.slice(0, 7) + "-01";
}

export function monthName(iso: ISODate): string {
  return MONTHS[Number(iso.slice(5, 7)) - 1];
}

export function monthShort(iso: ISODate): string {
  return monthName(iso).slice(0, 3);
}

/** "Tuesday, 3 November" */
export function longDay(iso: ISODate = todayISO()): string {
  const d = parseISO(iso);
  return `${WEEKDAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

/** "3 Nov" (adds the year when it is not the current one) */
export function shortDay(iso: ISODate, today: ISODate = todayISO()): string {
  const d = parseISO(iso);
  const base = `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}`;
  return iso.slice(0, 4) === today.slice(0, 4) ? base : `${base} ${d.getFullYear()}`;
}

/** "End of January" when the date is the month's last day, else "31 Jan 2027" style. */
export function targetLabel(iso: ISODate, today: ISODate = todayISO()): string {
  const d = parseISO(iso);
  const last = daysInMonth(d.getFullYear(), d.getMonth()) === d.getDate();
  if (last) {
    const sameYear = iso.slice(0, 4) === today.slice(0, 4) || daysBetween(today, iso) < 330;
    return `End of ${MONTHS[d.getMonth()]}${sameYear ? "" : " " + d.getFullYear()}`;
  }
  return shortDay(iso, today);
}

/** Last day of the month that is `monthsAhead` months after today. */
export function endOfMonth(monthsAhead: number, today: ISODate = todayISO()): ISODate {
  const t = parseISO(today);
  return toISO(new Date(t.getFullYear(), t.getMonth() + monthsAhead + 1, 0));
}

/** The coming end of January (this year if still ahead, else next year). */
export function nextEndOf(monthIndex: number, today: ISODate = todayISO()): ISODate {
  const t = parseISO(today);
  let year = t.getFullYear();
  let candidate = toISO(new Date(year, monthIndex + 1, 0));
  if (candidate < today) {
    year += 1;
    candidate = toISO(new Date(year, monthIndex + 1, 0));
  }
  return candidate;
}
