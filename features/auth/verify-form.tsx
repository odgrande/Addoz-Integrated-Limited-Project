"use client"

import { useEffect, useRef, useState, type FormEvent } from "react"
import { CircleCheck } from "lucide-react"
import { ActionButton, AppLink } from "@/components/patterns"
import { useAuthRole } from "@/components/layout/auth-shell"
import { roleHref } from "@/components/layout/auth-role"
import { authClient } from "@/lib/auth-client"
import { OtpInput } from "./otp-input"
import { sanitizeRedirectPath } from "./form-helpers"
import { useHydrated } from "./use-hydrated"

const CODE_LENGTH = 6
const RESEND_SECONDS = 45

/**
 * Email verification: the 6-digit code ADDOZ emailed on registration (or on a
 * sign-in attempt before verifying). A correct code verifies the address and
 * signs the account in.
 */
export function VerifyForm({ email, redirect }: { email?: string; redirect?: string }) {
  const hydrated = useHydrated()
  const { role } = useAuthRole()
  const [digits, setDigits] = useState<string[]>(() => Array(CODE_LENGTH).fill(""))
  const [status, setStatus] = useState<"editing" | "submitting" | "success">("editing")
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [cooldown, setCooldown] = useState(RESEND_SECONDS)
  const top = useRef<HTMLDivElement>(null)

  const cooldownDone = cooldown === 0
  useEffect(() => {
    if (cooldownDone) return
    const id = setInterval(() => setCooldown(current => (current <= 1 ? 0 : current - 1)), 1000)
    return () => clearInterval(id)
  }, [cooldownDone])

  async function submitCode(code: string[]) {
    if (!email) return
    if (!code.every(Boolean)) { setError(`Enter all ${CODE_LENGTH} digits.`); return }
    setError(null)
    setNotice(null)
    setStatus("submitting")
    const { data, error: verifyError } = await authClient.emailOtp.verifyEmail({ email, otp: code.join("") })
    if (verifyError) {
      setStatus("editing")
      setDigits(Array(CODE_LENGTH).fill(""))
      setError(verifyError.code === "TOO_MANY_ATTEMPTS" ? "Too many attempts. Request a new code." : verifyError.code === "OTP_EXPIRED" ? "That code has expired. Request a new one." : "That code isn't right. Check the email and try again.")
      return
    }
    setStatus("success")
    const actual = (data as { user?: { role?: string } } | null)?.user?.role
    const home = actual === "employer" ? "/employer" : actual === "admin" ? "/admin" : "/candidate"
    const target = sanitizeRedirectPath(redirect, home === "/admin" ? "/admin" : `${home}/dashboard`)
    const allowed = !/^\/(candidate|employer|admin)(\/|$)/.test(target) || target.startsWith(home)
    // Full load (not router.push + refresh) so the new session is picked up reliably
    setTimeout(() => { window.location.assign(allowed ? target : home === "/admin" ? "/admin" : `${home}/dashboard`) }, 900)
  }

  function onDigitsChange(next: string[]) {
    setDigits(next)
    if (error) setError(null)
    if (next.every(Boolean) && status === "editing") void submitCode(next)
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    void submitCode(digits)
  }

  async function resend() {
    if (!email) return
    setCooldown(RESEND_SECONDS)
    setDigits(Array(CODE_LENGTH).fill(""))
    setError(null)
    const { error: sendError } = await authClient.emailOtp.sendVerificationOtp({ email, type: "email-verification" })
    if (sendError) { setError(sendError.status === 429 ? "Please wait a minute before asking for another code." : "We couldn't send a new code. Please try again."); return }
    setNotice(`A new code is on its way to ${email}.`)
  }

  if (!email) {
    return <div className="au-result" ref={top} role="alert">
      <h1 className="t-h2" data-reveal>Verify your email</h1>
      <p className="au-lead">Open the verification link from your registration, or sign in and we&apos;ll send a new code.</p>
      <ActionButton href={roleHref("/auth/login", role)} variant="primary" arrow>Sign in</ActionButton>
    </div>
  }

  if (status === "success") {
    return <div className="au-result" ref={top} role="status">
      <span className="au-result-icon" aria-hidden="true"><CircleCheck size={34} /></span>
      <h1 className="t-h2" data-reveal>You&apos;re verified</h1>
      <p className="au-lead">Thanks — your email is confirmed. Taking you to your account…</p>
    </div>
  }

  return <div ref={top}>
    <header className="au-head">
      <p className="eyebrow"><span className="eyebrow-line" />VERIFY YOUR EMAIL</p>
      <h1 className="t-h2" data-reveal>Check your inbox</h1>
      <p className="au-lead">We sent a {CODE_LENGTH}-digit code to <strong>{email}</strong>. Enter it below to activate your account. It expires in 10 minutes.</p>
    </header>

    <form className="au-form" onSubmit={onSubmit} noValidate>
      <OtpInput length={CODE_LENGTH} values={digits} onChange={onDigitsChange} error={Boolean(error)} disabled={status === "submitting"} label="Verification code" />
      {error && <p className="field-error" role="alert">{error}</p>}
      {notice && <p className="field-hint" role="status">{notice}</p>}
      <ActionButton type="submit" variant="primary" block loading={status === "submitting"} disabled={!hydrated}>Verify email</ActionButton>
    </form>

    <div className="au-links">
      <p className="au-switch">Didn&apos;t get it? Check spam, or {cooldownDone
        ? <button type="button" className="text-link" onClick={resend}>send a new code</button>
        : <span>request a new code in {cooldown}s</span>}.</p>
      <p className="au-switch">Wrong email? <AppLink className="text-link" href={roleHref("/auth/register", role)}>Register again</AppLink></p>
    </div>
  </div>
}
