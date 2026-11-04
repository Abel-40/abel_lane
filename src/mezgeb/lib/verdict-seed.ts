/** Seed for pickMessage: one stable message per kind and day, different across days. */
export function messageSeed(kind: string, day: string, extra = ""): string {
  return `${kind}|${day}|${extra}`;
}
