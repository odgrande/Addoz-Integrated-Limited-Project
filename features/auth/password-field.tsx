"use client"

import { useId, useState } from "react"
import { CircleAlert, Eye, EyeOff } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * A password input with a show/hide toggle. Hand-rolled rather than built on
 * FormField, because FormField clones its single control and expects that
 * control to be the actual <input> — a wrapped input+button pair would put
 * the id/aria-invalid on the wrong element. Markup mirrors FormField's
 * output exactly (.field, .field-label, .field-input, .field-error) so it
 * looks identical alongside real FormFields.
 */
export function PasswordField({ label, value, onChange, error, hint, required, autoComplete = "new-password", id: givenId, className }: {
  label: string
  value: string
  onChange: (value: string) => void
  error?: string | null
  hint?: string
  required?: boolean
  autoComplete?: "new-password" | "current-password"
  id?: string
  className?: string
}) {
  const autoId = useId()
  const id = givenId ?? `pw-${autoId}`
  const [show, setShow] = useState(false)
  const describedBy = [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean).join(" ") || undefined
  return <div className={cn("field", error && "is-invalid", className)}>
    <label className="field-label" htmlFor={id}>
      {label}
      {required && <span className="field-required" aria-hidden="true">*</span>}
    </label>
    <span className="au-password-wrap">
      <input
        id={id}
        type={show ? "text" : "password"}
        className="field-input au-password-input"
        value={value}
        onChange={event => onChange(event.target.value)}
        autoComplete={autoComplete}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        required={required}
      />
      <button type="button" className="au-password-toggle" onClick={() => setShow(current => !current)} aria-label={show ? "Hide password" : "Show password"} aria-pressed={show}>
        {show ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
      </button>
    </span>
    {hint && !error && <p className="field-hint" id={`${id}-hint`}>{hint}</p>}
    {error && <p className="field-error" id={`${id}-error`} role="alert"><CircleAlert size={14} aria-hidden="true" />{error}</p>}
  </div>
}
