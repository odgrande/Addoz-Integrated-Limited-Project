/**
 * How long a published job stays live. Employers pick a duration; the job's
 * `deadline` is set to go-live + duration. After the deadline the job drops off
 * the marketplace automatically (no cron needed — every public query checks it)
 * and shows as "Expired" in the employer's jobs, where it can be reinstated.
 */
export const LISTING_DURATIONS = [7, 14, 21, 30, 45, 60, 90] as const
export const DEFAULT_LISTING_DAYS = 30
const DAY = 86_400_000

/** A valid duration in days, or the default. */
export function listingDays(value: unknown): number {
  const days = Number(value)
  return (LISTING_DURATIONS as readonly number[]).includes(days) ? days : DEFAULT_LISTING_DAYS
}

export function deadlineFrom(start: Date, days: number) {
  return new Date(start.getTime() + days * DAY)
}

/** The duration a job was set up with (deadline − go-live), snapped to the nearest option. */
export function durationOf(postedAt: Date | string | null | undefined, deadline: Date | string | null | undefined) {
  if (!postedAt || !deadline) return DEFAULT_LISTING_DAYS
  const days = (new Date(deadline).getTime() - new Date(postedAt).getTime()) / DAY
  return LISTING_DURATIONS.reduce((best, option) => Math.abs(option - days) < Math.abs(best - days) ? option : best, DEFAULT_LISTING_DAYS)
}

export function isExpired(deadline: Date | string | null | undefined, now = new Date()) {
  return Boolean(deadline) && new Date(deadline!).getTime() <= now.getTime()
}

/** What the employer sees: an Active job past its deadline is "Expired". */
export function displayStatus(status: string | null | undefined, deadline: Date | string | null | undefined) {
  if (status === "Active" && isExpired(deadline)) return "Expired"
  if (status === "Pending") return "In review"
  return status ?? "Draft"
}
