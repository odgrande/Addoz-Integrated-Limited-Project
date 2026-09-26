// Formatting helpers. Dates are formatted in UTC with a fixed locale so the server
// render and the client hydrate to the same string.

const dateFormat = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })
const dayMonth = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" })
const naira = new Intl.NumberFormat("en-NG", { maximumFractionDigits: 0 })

export function formatDate(iso: string) {
  return dateFormat.format(new Date(iso))
}

/** "Posted 21 Sep" — absolute (never "2 days ago"), so static pages never go stale or mismatch. */
export function postedOn(iso: string) {
  return `Posted ${dayMonth.format(new Date(iso))}`
}

export function formatNaira(amount: number) {
  return `₦${naira.format(amount)}`
}

export type Salary = { min?: number; max?: number; period: "month" | "year" } | null

export function formatSalary(salary: Salary, short = false) {
  if (!salary) return "Not disclosed"
  const per = short ? "/mo" : ` / ${salary.period}`
  if (salary.min && salary.max) return `${formatNaira(salary.min)} – ${formatNaira(salary.max)}${per}`
  if (salary.min) return `From ${formatNaira(salary.min)}${per}`
  if (salary.max) return `Up to ${formatNaira(salary.max)}${per}`
  return "Not disclosed"
}

/** ₦350k, ₦1.2m — for cards, where the full figure slows scanning */
export function compactNaira(amount: number) {
  if (amount >= 1_000_000) return `₦${(amount / 1_000_000).toFixed(amount % 1_000_000 ? 1 : 0)}m`
  if (amount >= 1_000) return `₦${Math.round(amount / 1_000)}k`
  return formatNaira(amount)
}

export function formatSalaryCompact(salary: Salary) {
  if (!salary) return "Salary not disclosed"
  const per = salary.period === "month" ? " / month" : " / year"
  if (salary.min && salary.max) return `${compactNaira(salary.min)} – ${compactNaira(salary.max)}${per}`
  if (salary.min) return `From ${compactNaira(salary.min)}${per}`
  if (salary.max) return `Up to ${compactNaira(salary.max)}${per}`
  return "Salary not disclosed"
}

export function plural(count: number, one: string, many = `${one}s`) {
  return `${count} ${count === 1 ? one : many}`
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, " ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]!.toUpperCase())
    .join("")
}
