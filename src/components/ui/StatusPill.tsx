const TONE: Record<string, string> = {
  Published: "s-ok",
  "In writing": "s-dev",
  "In development": "s-dev",
  Planned: "s-soft",
};

export function StatusPill({ status }: { status: string | null | undefined }) {
  if (!status) return null;
  return <span className={`status ${TONE[status] ?? "s-ext"}`}>{status}</span>;
}
