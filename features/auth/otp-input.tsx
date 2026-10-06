"use client"

import { useRef, type ClipboardEvent, type KeyboardEvent } from "react"
import { cn } from "@/lib/utils"

/**
 * Six-digit verification code input: one box per digit, arrow-key and
 * backspace navigation, and paste support (pasting a full code fills every
 * box from the current one).
 */
export function OtpInput({ length = 6, values, onChange, error, disabled, label }: {
  length?: number
  values: string[]
  onChange: (next: string[]) => void
  error?: boolean
  disabled?: boolean
  label: string
}) {
  const inputs = useRef<(HTMLInputElement | null)[]>([])

  function setDigit(index: number, raw: string) {
    const digit = raw.replace(/\D/g, "").slice(-1)
    const next = [...values]
    next[index] = digit
    onChange(next)
    if (digit && index < length - 1) inputs.current[index + 1]?.focus()
  }

  function onKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace" && !values[index] && index > 0) inputs.current[index - 1]?.focus()
    if (event.key === "ArrowLeft" && index > 0) inputs.current[index - 1]?.focus()
    if (event.key === "ArrowRight" && index < length - 1) inputs.current[index + 1]?.focus()
  }

  function onPaste(index: number, event: ClipboardEvent<HTMLInputElement>) {
    const text = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, length)
    if (!text) return
    event.preventDefault()
    const next = Array.from({ length }, (_, i) => text[i] ?? values[i] ?? "")
    onChange(next)
    const lastFilled = Math.min(text.length, length) - 1
    inputs.current[Math.max(lastFilled, 0)]?.focus()
  }

  return <div className={cn("au-otp", error && "is-invalid")} role="group" aria-label={label}>
    {Array.from({ length }).map((_, index) => <input
      key={index}
      ref={element => { inputs.current[index] = element }}
      className="au-otp-box"
      value={values[index] ?? ""}
      onChange={event => setDigit(index, event.target.value)}
      onKeyDown={event => onKeyDown(index, event)}
      onPaste={event => onPaste(index, event)}
      inputMode="numeric"
      autoComplete="one-time-code"
      maxLength={1}
      aria-label={`Digit ${index + 1} of ${length}`}
      aria-invalid={error ? true : undefined}
      disabled={disabled}
    />)}
  </div>
}
