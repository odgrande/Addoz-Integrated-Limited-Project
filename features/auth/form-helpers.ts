/**
 * Small shared helpers for the auth forms (Directive 009). No backend: these
 * only validate shapes client-side and move focus for accessibility.
 */
export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

/** Loose phone check — accepts Nigerian and international formats, digits only matter. */
export function isValidPhone(value: string): boolean {
  const digits = value.replace(/\D/g, "")
  return digits.length >= 7 && digits.length <= 15
}

/** After a failed validation, move focus to the first invalid control inside a container. */
export function focusFirstInvalid(container: HTMLElement | null) {
  requestAnimationFrame(() => container?.querySelector<HTMLElement>("[aria-invalid='true']")?.focus())
}

/** Absolute, deterministic "time saved" text — never relative phrasing (avoids hydration drift). */
export function formatSavedAt(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ""
  return date.toLocaleString("en-NG", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })
}

/** Only same-site relative paths are followed after sign-in or registration. */
export function sanitizeRedirectPath(value: string | undefined, fallback: string) {
  if (!value || !value.startsWith("/")) return fallback
  // "//host", "/\host" and embedded schemes would leave the site
  if (value.startsWith("//") || value.includes("\\") || /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(value)) return fallback
  return value
}
