"use client"

import { useRef, useState, type FormEvent } from "react"
import { MailCheck } from "lucide-react"
import { ActionButton, AppLink, FormField, Input } from "@/components/patterns"
import { useAuthRole } from "@/components/layout/auth-shell"
import { roleHref } from "@/components/layout/auth-role"
import { authClient } from "@/lib/auth-client"
import { ErrorSummary } from "./error-summary"
import { focusFirstInvalid, isValidEmail } from "./form-helpers"

/**
 * Password reset request. The confirmation is deliberately non-revealing
 * (never confirms whether the address has an account). Also how guest
 * applicants set a password for the account created with their application.
 */
export function ForgotPasswordForm() {
  const { role } = useAuthRole()
  const [email, setEmail] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<"editing" | "submitting" | "done">("editing")
  const top = useRef<HTMLDivElement>(null)

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!isValidEmail(email)) { setError("Enter a valid email address."); focusFirstInvalid(top.current); return }
    setError(null)
    setStatus("submitting")
    const { error: requestError } = await authClient.requestPasswordReset({ email: email.trim(), redirectTo: roleHref("/auth/reset-password", role) })
    if (requestError && requestError.status !== 429) {
      setStatus("editing")
      setError("We couldn't send the reset link. Please try again in a moment.")
      return
    }
    if (requestError) {
      setStatus("editing")
      setError("Too many requests. Please wait a minute and try again.")
      return
    }
    setStatus("done")
    top.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  if (status === "done") {
    return <div className="au-result" ref={top} role="status">
      <span className="au-result-icon" aria-hidden="true"><MailCheck size={34} /></span>
      <h1 className="t-h2" data-reveal>Check your inbox</h1>
      <p className="au-lead">If an account exists for <strong>{email}</strong>, we&apos;ve sent a link to set a new password. It expires in 1 hour.</p>
      <div className="cluster">
        <ActionButton variant="light" onClick={() => { setStatus("editing"); setEmail("") }}>Try a different email</ActionButton>
        <ActionButton href={roleHref("/auth/login", role)} variant="dark" arrow>Back to sign in</ActionButton>
      </div>
    </div>
  }

  return <div ref={top}>
    <header className="au-head">
      <p className="eyebrow"><span className="eyebrow-line" />RESET YOUR PASSWORD</p>
      <h1 className="t-h2" data-reveal>Forgot your password?</h1>
      <p className="au-lead">Enter the email on your account and we&apos;ll send a link to reset it. Applied as a guest? Use the email you applied with to set your password.</p>
    </header>

    <ErrorSummary errors={error ? [error] : []} id="forgot-errors" />

    <form className="au-form" onSubmit={submit} noValidate>
      <FormField label="Email" required error={error}>
        <Input type="email" value={email} onChange={event => { setEmail(event.target.value); setError(null) }} autoComplete="email" placeholder="you@example.com" />
      </FormField>
      <ActionButton type="submit" variant="primary" block loading={status === "submitting"}>Send reset link</ActionButton>
    </form>

    <div className="au-links">
      <p className="au-switch">Remembered it? <AppLink className="text-link" href={roleHref("/auth/login", role)}>Sign in</AppLink></p>
      <p className="au-switch">Need an account? <AppLink className="text-link" href={roleHref("/auth/register", role)}>Create one</AppLink></p>
    </div>
  </div>
}
