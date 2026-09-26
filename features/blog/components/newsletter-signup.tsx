"use client"

import { useState, type FormEvent } from "react"
import { CircleCheck } from "lucide-react"
import { ActionButton, FormField, Input } from "@/components/patterns"

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Prototype newsletter signup: real validation, honest (non-sending) success. */
export function NewsletterSignup() {
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle")
  const [touched, setTouched] = useState(false)

  const error = touched && !EMAIL_PATTERN.test(email) ? "Enter a valid email address." : null

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setTouched(true)
    if (!EMAIL_PATTERN.test(email)) return
    setStatus("loading")
    window.setTimeout(() => setStatus("done"), 500)
  }

  if (status === "done") {
    return (
      <p className="bl-newsletter-success" role="status">
        <CircleCheck size={20} aria-hidden="true" />
        <span>Thanks — you&apos;re set. This preview doesn&apos;t send real emails yet; on the live platform you&apos;d start getting job updates straight away.</span>
      </p>
    )
  }

  return (
    <form className="bl-newsletter-form" onSubmit={handleSubmit} noValidate>
      <FormField label="Email address" className="bl-newsletter-field" error={error} required>
        <Input type="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="you@example.com" autoComplete="email" />
      </FormField>
      <ActionButton type="submit" variant="dark" loading={status === "loading"}>Subscribe</ActionButton>
    </form>
  )
}
