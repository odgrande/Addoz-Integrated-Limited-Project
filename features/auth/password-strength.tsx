"use client"

import { Check, X } from "lucide-react"

export type PasswordCheck = { met: boolean; label: string }
export type PasswordStrength = { score: 0 | 1 | 2 | 3 | 4; label: string; checks: PasswordCheck[] }

const LABELS = ["Very weak", "Weak", "Fair", "Strong", "Very strong"] as const

/** Pure, deterministic — no external library. Used by both register and reset-password. */
export function getPasswordStrength(password: string): PasswordStrength {
  const checks: PasswordCheck[] = [
    { met: password.length >= 8, label: "At least 8 characters" },
    { met: /[A-Z]/.test(password), label: "One uppercase letter" },
    { met: /[0-9]/.test(password), label: "One number" },
    { met: /[^A-Za-z0-9]/.test(password), label: "One symbol" },
  ]
  const score = checks.filter(check => check.met).length as 0 | 1 | 2 | 3 | 4
  return { score, label: LABELS[score], checks }
}

/** Compact bar + label — shown while registering. */
export function PasswordStrengthMeter({ password }: { password: string }) {
  if (!password) return null
  const { score, label } = getPasswordStrength(password)
  return <div className="au-strength" aria-hidden="true">
    <div className="au-strength-track">
      {[0, 1, 2, 3].map(index => <span key={index} className={cnSeg(index < score, score)} />)}
    </div>
    <p className="au-strength-label">{label}</p>
  </div>
}

function cnSeg(filled: boolean, score: number) {
  const tone = score <= 1 ? "is-weak" : score <= 2 ? "is-fair" : "is-strong"
  return `au-strength-segment${filled ? ` is-filled ${tone}` : ""}`
}

/** Explicit requirements checklist — used on reset-password. */
export function PasswordRequirements({ password }: { password: string }) {
  const { checks } = getPasswordStrength(password)
  return <ul className="au-requirements">
    {checks.map(check => <li key={check.label} className={check.met ? "is-met" : undefined}>
      {check.met ? <Check size={14} aria-hidden="true" /> : <X size={14} aria-hidden="true" />} {check.label}
    </li>)}
  </ul>
}
