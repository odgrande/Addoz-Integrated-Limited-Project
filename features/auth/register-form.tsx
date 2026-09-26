"use client"

import { useRouter } from "next/navigation"
import { useRef, useState, type FormEvent } from "react"
import { Building2, UserRound } from "lucide-react"
import { ActionButton, AppLink, Checkbox, ChoiceCards, FieldRow, FormField, Input } from "@/components/patterns"
import { useAuthRole } from "@/components/layout/auth-shell"
import { roleHref } from "@/components/layout/auth-role"
import { PasswordField } from "./password-field"
import { PasswordStrengthMeter } from "./password-strength"
import { ErrorSummary } from "./error-summary"
import { focusFirstInvalid, isValidEmail, isValidPhone } from "./form-helpers"

type Errors = Partial<Record<"firstName" | "lastName" | "username" | "email" | "phone" | "password" | "company" | "accept" | "root", string>>

export function RegisterForm() {
  const router = useRouter()
  const { role, setRole } = useAuthRole()
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [company, setCompany] = useState("")
  const [accept, setAccept] = useState(false)
  const [errors, setErrors] = useState<Errors>({})
  const [status, setStatus] = useState<"editing" | "submitting">("editing")
  const top = useRef<HTMLDivElement>(null)

  const clear = (key: keyof Errors) => setErrors(current => ({ ...current, [key]: undefined }))

  function validate(): Errors {
    const found: Errors = {}
    if (!firstName.trim()) found.firstName = "Enter your first name."
    if (!lastName.trim()) found.lastName = "Enter your last name."
    if (username.trim().length < 3) found.username = "Choose a username of at least 3 characters."
    if (!isValidEmail(email)) found.email = "Enter a valid email address."
    if (!isValidPhone(phone)) found.phone = "Enter a valid phone number."
    if (password.length < 8) found.password = "Use at least 8 characters."
    if (role === "employer" && !company.trim()) found.company = "Enter your company name."
    if (!accept) found.accept = "Accept the Terms and Privacy Policy to continue."
    return found
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    const found = validate()
    setErrors(found)
    if (Object.keys(found).length) { focusFirstInvalid(top.current); return }
    setStatus("submitting")
    
    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
          name: `${firstName.trim()} ${lastName.trim()}`,
          role,
          companyName: role === "employer" ? company.trim() : undefined,
        }),
      })
      const payload = await response.json().catch(() => null) as { error?: string } | null
      if (!response.ok) throw new Error(payload?.error || "Unable to create your account.")
      router.push(roleHref(`/auth/verify?email=${encodeURIComponent(email.trim())}`, role))
    } catch (error) {
      setStatus("editing")
      setErrors({ root: error instanceof Error ? error.message : "Unable to create your account." })
      top.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }

  return <div ref={top}>
    <header className="au-head">
      <p className="eyebrow"><span className="eyebrow-line" />CREATE AN ACCOUNT</p>
      <h1 className="t-h2" data-reveal>Join ADDOZ</h1>
      <p className="au-lead">A few details and you&apos;re set.</p>
    </header>

    <ErrorSummary errors={Object.values(errors).filter((message): message is string => Boolean(message))} id="register-errors" />

    <form className="au-form" onSubmit={submit} noValidate>
      <ChoiceCards name="role" value={role} onChange={setRole} legend="I'm joining as a" options={[
        { value: "candidate", label: "Candidate", description: "Looking for work", icon: <UserRound size={20} aria-hidden="true" /> },
        { value: "employer", label: "Employer", description: "Looking to hire", icon: <Building2 size={20} aria-hidden="true" /> },
      ]} />

      <FieldRow>
        <FormField label="First Name" required error={errors.firstName}><Input value={firstName} onChange={event => { setFirstName(event.target.value); clear("firstName") }} autoComplete="given-name" /></FormField>
        <FormField label="Last Name" required error={errors.lastName}><Input value={lastName} onChange={event => { setLastName(event.target.value); clear("lastName") }} autoComplete="family-name" /></FormField>
      </FieldRow>

      {role === "employer" && <FormField label="Company name" required error={errors.company}><Input value={company} onChange={event => { setCompany(event.target.value); clear("company") }} autoComplete="organization" /></FormField>}

      <FormField label="Username" required error={errors.username} hint="What other people on ADDOZ will see."><Input value={username} onChange={event => { setUsername(event.target.value); clear("username") }} autoComplete="username" /></FormField>
      <FormField label="Email" required error={errors.email}><Input type="email" value={email} onChange={event => { setEmail(event.target.value); clear("email") }} autoComplete="email" /></FormField>
      <FormField label="Phone number" required error={errors.phone}><Input type="tel" value={phone} onChange={event => { setPhone(event.target.value); clear("phone") }} autoComplete="tel" placeholder="+234 800 000 0000" /></FormField>

      <PasswordField label="Password" value={password} onChange={value => { setPassword(value); clear("password") }} error={errors.password} required hint="At least 8 characters." />
      <PasswordStrengthMeter password={password} />

      <div className={errors.accept ? "field is-invalid" : "field"}>
        <Checkbox label={<>Accept the <AppLink className="text-link" href="/terms">Terms</AppLink> and <AppLink className="text-link" href="/privacy">Privacy Policy</AppLink></>} checked={accept} onChange={event => { setAccept(event.target.checked); clear("accept") }} aria-invalid={errors.accept ? true : undefined} />
        {errors.accept && <p className="field-error" role="alert">{errors.accept}</p>}
      </div>

      <ActionButton type="submit" variant="primary" block loading={status === "submitting"}>Create account</ActionButton>
    </form>

    <div className="au-links">
      <p className="au-switch">Already have an account? <AppLink className="text-link" href={roleHref("/auth/login", role)}>Sign in</AppLink></p>
    </div>
  </div>
}
