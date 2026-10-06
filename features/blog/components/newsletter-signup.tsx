"use client"

import { useState, type FormEvent } from "react"
import { CircleCheck } from "lucide-react"
import { ActionButton, FormField, Input } from "@/components/patterns"

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Newsletter signup (blog): subscribes the address to ADDOZ job updates. */
export function NewsletterSignup() {
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle")
  const [touched, setTouched] = useState(false)
  const [failure, setFailure] = useState("")

  const error = touched && !EMAIL_PATTERN.test(email) ? "Enter a valid email address." : null

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setTouched(true)
    setFailure("")
    if (!EMAIL_PATTERN.test(email)) return
    setStatus("loading")
    const response = await fetch("/api/newsletter", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, source: "blog" }) }).catch(() => null)
    if (response?.ok) { setStatus("done"); return }
    setStatus("idle")
    setFailure("We couldn't subscribe you just now. Please try again.")
  }

  if (status === "done") {
    return (
      <p className="bl-newsletter-success" role="status">
        <CircleCheck size={20} aria-hidden="true" />
        <span>Thanks — you&apos;re subscribed to ADDOZ job updates.</span>
      </p>
    )
  }

  return (
    <form className="bl-newsletter-form" onSubmit={handleSubmit} noValidate>
      <FormField label="Email address" className="bl-newsletter-field" error={error ?? (failure || null)} required>
        <Input type="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="you@example.com" autoComplete="email" />
      </FormField>
      <ActionButton type="submit" variant="dark" loading={status === "loading"}>Subscribe</ActionButton>
    </form>
  )
}
