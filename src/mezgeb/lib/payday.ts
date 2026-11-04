import { applyBasisPoints, sumMinor, type Minor } from "./money";

export type RuleKind = "percent_of_salary" | "fixed" | "remainder";

export type SplitRule = {
  name: string;
  kind: RuleKind;
  /** basis points for percent rules, minor units for fixed, 0 for remainder */
  value: number;
  is_active?: boolean;
  sort_order?: number;
};

export type SplitLine<R extends SplitRule> = { rule: R; amount_minor: Minor };

export type SplitResult<R extends SplitRule> = {
  lines: SplitLine<R>[];
  assigned: Minor;
  /** salary − assigned; must be 0 for a valid split */
  leftover: Minor;
  ok: boolean;
  error: string | null;
};

/**
 * Splits a salary by rules: percent rules round to whole minor units, fixed
 * rules take their amount, and the single remainder rule takes what is left.
 * The split is only valid when the lines add up to the salary exactly.
 */
export function computeSplit<R extends SplitRule>(salary: Minor, rules: R[]): SplitResult<R> {
  const active = rules
    .filter((r) => r.is_active !== false)
    .map((r, i) => ({ r, i }))
    .sort((a, b) => (a.r.sort_order ?? 0) - (b.r.sort_order ?? 0) || a.i - b.i)
    .map(({ r }) => r);

  const remainders = active.filter((r) => r.kind === "remainder");
  if (remainders.length > 1) {
    return { lines: [], assigned: 0, leftover: salary, ok: false, error: "Only one rule can take the remainder." };
  }

  const fixedPart = active
    .filter((r) => r.kind !== "remainder")
    .map((r) => (r.kind === "percent_of_salary" ? applyBasisPoints(salary, r.value) : r.value));
  const fixedTotal = sumMinor(fixedPart);
  const rest = salary - fixedTotal;

  let k = 0;
  const lines: SplitLine<R>[] = active.map((rule) => {
    if (rule.kind === "remainder") return { rule, amount_minor: Math.max(rest, 0) };
    return { rule, amount_minor: fixedPart[k++] };
  });

  const assigned = sumMinor(lines.map((l) => l.amount_minor));
  const leftover = salary - assigned;
  let error: string | null = null;
  if (rest < 0) error = "The rules add up to more than the salary.";
  else if (leftover > 0) error = "Some of the salary is not assigned yet.";
  return { lines, assigned, leftover: rest < 0 ? rest : leftover, ok: error === null, error };
}
