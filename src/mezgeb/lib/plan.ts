import { paydaysUntil, todayISO, type ISODate } from "./dates";
import { divCeil, sharePercent, type Minor } from "./money";

export type DebtOutlook = {
  remaining: Minor;
  paydaysLeft: number | null;
  /** what the monthly payment covers by the target date */
  projected: Minor | null;
  onTrack: boolean | null;
  /** paydays needed at the current monthly amount */
  paydaysNeeded: number | null;
};

/** Remaining debt after payments; never below zero. */
export function debtRemaining(principal: Minor, paid: Minor): Minor {
  return Math.max(principal - paid, 0);
}

export function debtOutlook(
  remaining: Minor,
  monthly: Minor,
  targetOn: ISODate | null,
  paydayDay: number,
  today: ISODate = todayISO(),
): DebtOutlook {
  const paydaysNeeded = remaining === 0 ? 0 : monthly > 0 ? divCeil(remaining, monthly) : null;
  if (!targetOn) return { remaining, paydaysLeft: null, projected: null, onTrack: remaining === 0 ? true : null, paydaysNeeded };
  const paydaysLeft = paydaysUntil(targetOn, paydayDay, today);
  const projected = monthly * paydaysLeft;
  return { remaining, paydaysLeft, projected, onTrack: remaining === 0 || projected >= remaining, paydaysNeeded };
}

export type GoalOutlook = {
  saved: Minor;
  target: Minor | null;
  /** 0–100 for progress bars */
  percent: number;
  paydaysRemaining: number | null;
  reached: boolean;
};

export function goalOutlook(saved: Minor, target: Minor | null, monthly: Minor): GoalOutlook {
  if (!target) return { saved, target: null, percent: 0, paydaysRemaining: null, reached: false };
  const left = Math.max(target - saved, 0);
  return {
    saved,
    target,
    percent: sharePercent(saved, target),
    reached: left === 0,
    paydaysRemaining: left === 0 ? 0 : monthly > 0 ? divCeil(left, monthly) : null,
  };
}
