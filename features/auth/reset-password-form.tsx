"use client"

import { useRef, useState, type FormEvent } from "react"
import { CircleCheck } from "lucide-react"
import { ActionButton } from "@/components/patterns"
import { useAuthRole } from "@/components/layout/auth-shell"
import { roleHref } from "@/components/layout/auth-role"
import { authClient } from "@/lib/auth-client"
import { PasswordField } from "./password-field"
import { PasswordRequirements, getPasswordStrength } from "./password-strength"
import { ErrorSummary } from "./error-summary"
import { focusFirstInvalid } from "./form-helpers"

type Errors = { password?: string; confirm?: string; root?: string }

/** Set a new password from the emailed reset link (`?token=`; `?error=INVALID_TOKEN` when expired). */
export function ResetPasswordForm({ token, linkError }: { token?: string; linkError?: string }) {
  const { role } = useAuthRole()
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [errors, setErrors] = useState<Errors>({})
  const [status, setStatus] = useState<"editing" | "submitting" | "done">("editing")
  const top = useRef<HTMLDivElement>(null)

  function validate(): Errors {
    const found: Errors = {}
    const strength = getPasswordStrength(password)
    if (strength.score < 2) found.password = "Choose a stronger password (at least 8 characters)."
    if (confirm !== password) found.confirm = "Passwords don't match."
    return found
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    const found = validate()
    setErrors(found)
    if (Object.keys(found).length) { focusFirstInvalid(top.current); return }
    setStatus("submitting")
    const { error } = await authClient.resetPassword({ newPassword: password, token: token! })
    if (error) {
      setStatus("editing")
      setErrors({ root: error.code === "INVALID_TOKEN" ? "This reset link has expired or was already used. Request a new one." : "We couldn't reset your password. Please try again." })
      return
    }
    setStatus("done")
    top.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  if (!token || linkError) {
    return <div className="au-result" ref={top} role="alert">
      <h1 className="t-h2" data-reveal>This link has expired</h1>
      <p className="au-lead">Password reset links work once and expire after an hour. Request a new one to continue.</p>
      <ActionButton href={roleHref("/auth/forgot-password", role)} variant="primary" arrow>Send a new link</ActionButton>
    </div>
  }

  if (status === "done") {
    return <div className="au-result" ref={top} role="status">
      <span className="au-result-icon" aria-hidden="true"><CircleCheck size={34} /></span>
      <h1 className="t-h2" data-reveal>Password reset</h1>
      <p className="au-lead">Your new password is set. Sign in with it to continue.</p>
      <ActionButton href={roleHref("/auth/login", role)} variant="primary" arrow>Continue to sign in</ActionButton>
    </div>
  }

  return <div ref={top}>
    <header className="au-head">
      <p className="eyebrow"><span className="eyebrow-line" />RESET YOUR PASSWORD</p>
      <h1 className="t-h2" data-reveal>Choose a new password</h1>
      <p className="au-lead">Make it something you haven&apos;t used before on ADDOZ.</p>
    </header>

    <ErrorSummary errors={Object.values(errors).filter((message): message is string => Boolean(message))} id="reset-errors" />

    <form className="au-form" onSubmit={submit} noValidate>
      <PasswordField label="New password" value={password} onChange={value => { setPassword(value); setErrors(current => ({ ...current, password: undefined })) }} error={errors.password} required />
      <PasswordRequirements password={password} />
      <PasswordField label="Confirm password" value={confirm} onChange={value => { setConfirm(value); setErrors(current => ({ ...current, confirm: undefined })) }} error={errors.confirm} required />
      <ActionButton type="submit" variant="primary" block loading={status === "submitting"}>Reset password</ActionButton>
    </form>
  </div>
}
