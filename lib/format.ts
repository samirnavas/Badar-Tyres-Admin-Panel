export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);
}

export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

/**
 * True when the supplied ISO date is valid and falls in the future —
 * used to flag job cards that still carry an active warranty.
 */
export function isWarrantyActive(value: string | null | undefined): boolean {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  return date.getTime() > Date.now();
}

/**
 * Whole days from now until the supplied date (negative if already past),
 * or null if the value is missing/invalid.
 */
export function daysUntil(value: string | null | undefined): number | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.ceil((date.getTime() - Date.now()) / msPerDay);
}

/**
 * True when a date is overdue or coming up within `withinDays` (default 30) —
 * used to highlight vehicles needing service or expiring documents soon.
 */
export function isDueSoon(
  value: string | null | undefined,
  withinDays = 30,
): boolean {
  const days = daysUntil(value);
  return days !== null && days <= withinDays;
}
