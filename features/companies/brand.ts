/** How an employer is shown when space is small: their logo, or initials on a brand colour. */

export type CompanyTone = "purple" | "yellow" | "orange" | "black"
const tones: CompanyTone[] = ["purple", "yellow", "orange", "black"]

/** Same company → same colour; different companies spread across the palette. */
export function toneFor(key: string): CompanyTone {
  let hash = 0
  for (const char of key) hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  return tones[hash % tones.length]!
}

/** "QA Tech Ltd" → "QT", "Flowline" → "FL". */
export function markFor(name: string) {
  const words = name.replace(/[^\p{L}\p{N}\s]/gu, " ").split(/\s+/).filter(Boolean)
  return (words.length > 1 ? `${words[0]![0]}${words[1]![0]}` : (words[0] ?? "?").slice(0, 2)).toUpperCase()
}

/** Only our own uploaded logos or https images are rendered. */
export function safeLogo(logo: string | null | undefined) {
  const value = logo?.trim()
  if (!value) return undefined
  return /^\/api\/company-logo\/[\w-]+\/\d+$/.test(value) || /^https:\/\/[^\s"'<>]+$/i.test(value) ? value : undefined
}
