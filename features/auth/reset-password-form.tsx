"use client"

import { useRef, useState, type FormEvent } from "react"
import { CircleCheck } from "lucide-react"
import { ActionButton } from "@/components/patterns"
import { useAuthRole } from "@/components/layout/auth-shell"
import { roleHref } from "@/components/layout/auth-role"
import { PrototypeNote } from "@/components/patterns/prototype-note"
import { PasswordField } from "./password-field"
import { PasswordRequirements, getPasswordStrength } from "./password-strength"
import { ErrorSummary } from "./error-summary"
import { focusFirstInvalid } from "./form-helpers"

type Errors = { password?: string; confirm?: string }

/** Set a new password prototype — reachable from an emailed link once the backend exists. */
export function ResetPasswordForm() {
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

  function submit(event: FormEvent) {
    event.preventDefault()
    const found = validate()
    setErrors(found)
    if (Object.keys(found).length) { focusFirstInvalid(top.current); return }
    setStatus("submitting")
    setTimeout(() => { setStatus("done"); top.current?.scrollIntoView({ behavior: "smooth", block: "start" }) }, 900)
  }

  if (status === "done") {
    return <div className="au-result" ref={top} role="status">
      <span className="au-result-icon" aria-hidden="true"><CircleCheck size={34} /></span>
      <h1 className="t-h2" data-reveal>Password reset</h1>
      <p className="au-lead">Your password has been reset in this preview — nothing is stored, so sign in again whenever you like.</p>
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

    <form className="au-form" onSubmit={submit} noValidate aria-describedby="reset-proto">
      <PasswordField label="New password" value={password} onChange={value => { setPassword(value); setErrors(current => ({ ...current, password: undefined })) }} error={errors.password} required />
      <PasswordRequirements password={password} />
      <PasswordField label="Confirm password" value={confirm} onChange={value => { setConfirm(value); setErrors(current => ({ ...current, confirm: undefined })) }} error={errors.confirm} required />
      <PrototypeNote compact title="Preview only"><span id="reset-proto">Nothing is stored — this prototype has no accounts to update yet.</span></PrototypeNote>
      <ActionButton type="submit" variant="primary" block loading={status === "submitting"}>Reset password</ActionButton>
    </form>
  </div>
}
