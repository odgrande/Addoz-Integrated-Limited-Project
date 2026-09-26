"use client"

import { useRef, useState, type FormEvent } from "react"
import { ActionButton, AppLink, Checkbox, FormField, Input } from "@/components/patterns"
import type { AuthRole } from "@/components/layout/auth-role"
import { PasswordField } from "./password-field"
import { ErrorSummary } from "./error-summary"
import { focusFirstInvalid } from "./form-helpers"
import { getSession, signIn, signOut } from "@/lib/auth-client"
import { useRouter } from "next/navigation"

type Errors = { account?: string; password?: string; root?: string }

function sanitizeRedirectPath(value: string | undefined, fallback: string) {
  if (!value) return fallback
  if (value.startsWith("//") || /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(value)) return fallback
  if (!value.startsWith("/")) return fallback
  return value
}

function roleMismatchMessage(expected: AuthRole, actual: string | undefined) {
  if (expected === "admin") {
    return "These login details are not valid for an admin account. Please use the appropriate sign-in."
  }

  if (expected === "employer") {
    if (actual === "candidate") return "These login details are not valid for an employer account. Please use the candidate sign-in."
    if (actual === "admin") return "These login details are not valid for an employer account. Please use the Admin sign-in."
    return "These login details are not valid for an employer account. Please use the candidate sign-in."
  }

  if (actual === "employer") return "These login details are not valid for a candidate account. Please use the employer sign-in."
  if (actual === "admin") return "These login details are not valid for a candidate account. Please use the Admin sign-in."
  return "These login details are not valid for a candidate account. Please use the employer sign-in."
}

export function LoginForm({ role, redirect }: { role: AuthRole; redirect?: string }) {
  const [account, setAccount] = useState("")
  const [password, setPassword] = useState("")
  const [remember, setRemember] = useState(false)
  const [errors, setErrors] = useState<Errors>({})
  const [status, setStatus] = useState<"editing" | "submitting">("editing")
  const top = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const employer = role === "employer"
  const admin = role === "admin"
  const destination = sanitizeRedirectPath(redirect, admin ? "/admin" : employer ? "/employer/dashboard" : "/candidate/dashboard")

  function validate(): Errors {
    const found: Errors = {}
    if (!account.trim()) found.account = "Enter your account name or email."
    if (!password) found.password = "Enter your password."
    return found
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    const found = validate()
    setErrors(found)
    if (Object.keys(found).length) { focusFirstInvalid(top.current); return }
    setStatus("submitting")

    await signIn.email({
      email: account,
      password: password,
      rememberMe: remember
    }, {
      onSuccess: async () => {
        const sessionResult = await getSession()
        const actualRole = sessionResult && "data" in sessionResult ? (sessionResult.data?.user?.role ?? undefined) : undefined

        if (actualRole !== role) {
          try {
            await signOut({ fetchOptions: { credentials: "include" } })
          } catch {
            // Ignore sign-out errors; the mismatch is the important result.
          }
          setStatus("editing")
          setErrors({ root: roleMismatchMessage(role, actualRole) })
          top.current?.scrollIntoView({ behavior: "smooth", block: "start" })
          return
        }
        router.push(destination)
        router.refresh()
      },
      onError: (ctx) => {
        setStatus("editing")
        setErrors({ root: ctx.error.message || "Failed to sign in. Please check your credentials." })
        top.current?.scrollIntoView({ behavior: "smooth", block: "start" })
      }
    })
  }

  return <div ref={top}>
    <header className="au-head">
      <p className="eyebrow"><span className="eyebrow-line" />{admin ? "ADMIN SIGN IN" : employer ? "EMPLOYER SIGN IN" : "SIGN IN"}</p>
      <h1 className="t-h2" data-reveal>{admin ? "Admin sign in" : employer ? "Sign in to hire" : "Welcome back"}</h1>
      <p className="au-lead">{admin ? "Access the ADDOZ administration workspace." : employer ? "Sign in to manage your job postings on ADDOZ." : "Sign in to continue your job search on ADDOZ."}</p>
    </header>

    <ErrorSummary errors={Object.values(errors).filter((message): message is string => Boolean(message))} id="login-errors" />

    <form className="au-form" onSubmit={submit} noValidate>
      <FormField label="Email" required error={errors.account}>
        <Input value={account} onChange={event => { setAccount(event.target.value); setErrors(current => ({ ...current, account: undefined })) }} autoComplete="username" type="email" placeholder={admin ? "admin@addoz.com" : employer ? "you@company.com" : "you@example.com"} />
      </FormField>
      <PasswordField label="Password" value={password} onChange={value => { setPassword(value); setErrors(current => ({ ...current, password: undefined })) }} error={errors.password} autoComplete="current-password" required />

      <div className="au-form-row">
        <Checkbox label="Remember me" checked={remember} onChange={event => setRemember(event.target.checked)} />
        <AppLink className="text-link au-inline-link" href={admin ? "/auth/forgot-password?role=admin" : employer ? "/auth/forgot-password?role=employer" : "/auth/forgot-password"}>Forgot your password?</AppLink>
      </div>

      <ActionButton type="submit" variant="primary" block loading={status === "submitting"}>Sign in</ActionButton>
    </form>

    <div className="au-links">
      <p className="au-switch">{admin ? "Need a different account? " : employer ? "Looking for work instead? " : "Hiring instead? "}<AppLink className="text-link" href={admin ? "/auth/login" : employer ? "/auth/login" : "/auth/login?role=employer"}>{admin ? "Candidate or employer sign in" : employer ? "Candidate sign in" : "Employer sign in"}</AppLink></p>
      <p className="au-switch">New to ADDOZ? <AppLink className="text-link" href={admin ? "/auth/register" : employer ? "/auth/register?role=employer" : "/auth/register"}>Create an account</AppLink></p>
    </div>
  </div>
}
