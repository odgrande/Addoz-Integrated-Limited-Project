"use client"

import { useEffect, useRef, useState, type FormEvent } from "react"
import { CircleCheck } from "lucide-react"
import { ActionButton, AppLink } from "@/components/patterns"
import { useAuthRole } from "@/components/layout/auth-shell"
import { roleHref } from "@/components/layout/auth-role"
import { PrototypeNote } from "@/components/patterns/prototype-note"
import { OtpInput } from "./otp-input"

const CODE_LENGTH = 6
const RESEND_SECONDS = 30

/**
 * Email verification prototype. No codes are sent or checked — any 6 digits
 * are accepted, so the only real validation is "did you fill every box".
 */
export function VerifyForm({ email }: { email?: string }) {
  const { role } = useAuthRole()
  const [digits, setDigits] = useState<string[]>(() => Array(CODE_LENGTH).fill(""))
  const [status, setStatus] = useState<"editing" | "submitting" | "success">("editing")
  const [error, setError] = useState<string | null>(null)
  const [cooldown, setCooldown] = useState(RESEND_SECONDS)
  const top = useRef<HTMLDivElement>(null)

  const cooldownDone = cooldown === 0
  useEffect(() => {
    if (cooldownDone) return
    const id = setInterval(() => setCooldown(current => (current <= 1 ? 0 : current - 1)), 1000)
    return () => clearInterval(id)
  }, [cooldownDone])

  function submitCode(code: string[]) {
    if (!code.every(Boolean)) { setError(`Enter all ${CODE_LENGTH} digits.`); return }
    setError(null)
    setStatus("submitting")
    setTimeout(() => { setStatus("success"); top.current?.scrollIntoView({ behavior: "smooth", block: "start" }) }, 800)
  }

  function onDigitsChange(next: string[]) {
    setDigits(next)
    if (error) setError(null)
    if (next.every(Boolean) && status === "editing") submitCode(next)
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    submitCode(digits)
  }

  function resend() {
    setCooldown(RESEND_SECONDS)
    setDigits(Array(CODE_LENGTH).fill(""))
    setError(null)
  }

  if (status === "success") {
    return <div className="au-result" ref={top} role="status">
      <span className="au-result-icon" aria-hidden="true"><CircleCheck size={34} /></span>
      <h1 className="t-h2" data-reveal>You&apos;re verified</h1>
      <p className="au-lead">No codes are actually sent in this preview — any {CODE_LENGTH} digits are accepted.</p>
      <div className="cluster">
        <ActionButton href={roleHref("/auth/login", role)} variant="dark" arrow>Continue to sign in</ActionButton>
        <ActionButton href="/" variant="light">Back to homepage</ActionButton>
      </div>
    </div>
  }

  return <div ref={top}>
    <header className="au-head">
      <p className="eyebrow"><span className="eyebrow-line" />VERIFY YOUR EMAIL</p>
      <h1 className="t-h2" data-reveal>Enter your code</h1>
      <p className="au-lead">{email ? <>We&apos;d send a 6-digit code to <strong>{email}</strong>.</> : "Enter the 6-digit code sent to your email."}</p>
    </header>

    {error && <div className="au-error-summary" role="alert"><p className="au-error-summary-title">{error}</p></div>}

    <form className="au-form" onSubmit={onSubmit} noValidate aria-describedby="verify-proto">
      <OtpInput values={digits} onChange={onDigitsChange} error={!!error} label="6-digit verification code" disabled={status === "submitting"} />
      <PrototypeNote compact title="Preview only"><span id="verify-proto">Codes aren&apos;t sent in this prototype — any {CODE_LENGTH} digits will verify.</span></PrototypeNote>
      <ActionButton type="submit" variant="primary" block loading={status === "submitting"}>Verify code</ActionButton>
    </form>

    <div className="au-links">
      <p className="au-switch">
        {cooldown > 0 ? <>Didn&apos;t get a code? Resend in {cooldown}s</> : <>Didn&apos;t get a code? <button type="button" className="text-link au-link-button" onClick={resend}>Resend code</button></>}
      </p>
      <p className="au-switch">Wrong email? <AppLink className="text-link" href={roleHref("/auth/register", role)}>Go back and register</AppLink></p>
    </div>
  </div>
}
