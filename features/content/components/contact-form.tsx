"use client"

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react"
import { CircleAlert, CircleCheck } from "lucide-react"
import { ActionButton, FormField, Input, Select, Textarea } from "@/components/patterns"
import { site } from "@/lib/site"
import { plural } from "@/lib/format"

type Values = { name: string; email: string; phone: string; topic: string; message: string }
type Field = keyof Values
type Errors = Partial<Record<Field, string>>

const initialValues: Values = { name: "", email: "", phone: "", topic: "", message: "" }
const topics = ["I’m looking for work", "I’m hiring", "Career Intelligence tools", "Something else"]

function validate(values: Values): Errors {
  const errors: Errors = {}
  if (!values.name.trim()) errors.name = "Enter your full name."
  if (!values.email.trim()) errors.email = "Enter your email address."
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) errors.email = "That email address doesn’t look complete."
  if (!values.topic) errors.topic = "Choose what this is about."
  if (!values.message.trim()) errors.message = "Add a short message."
  else if (values.message.trim().length < 10) errors.message = "Say a little more — a sentence is enough."
  return errors
}

/**
 * The ADDOZ contact form (Directive 009 — editorial). This preview has no backend:
 * a valid submit "sends" locally, then the success state says so plainly and hands
 * off to a pre-filled mailto link — see PrototypeNote elsewhere for the same pattern.
 */
export function ContactForm() {
  const [values, setValues] = useState<Values>(initialValues)
  const [errors, setErrors] = useState<Errors>({})
  const [status, setStatus] = useState<"idle" | "submitting" | "sent">("idle")
  const [attempt, setAttempt] = useState(0)
  const summaryRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => { if (timeoutRef.current) clearTimeout(timeoutRef.current) }, [])
  useEffect(() => { if (attempt > 0) summaryRef.current?.focus() }, [attempt])

  const set = (field: Field) => (event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { value } = event.target
    setValues(current => ({ ...current, [field]: value }))
  }

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextErrors = validate(values)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) { setAttempt(count => count + 1); return }
    setStatus("submitting")
    timeoutRef.current = setTimeout(() => setStatus("sent"), 700)
  }

  const resetForm = () => { setValues(initialValues); setErrors({}); setStatus("idle") }

  if (status === "sent") {
    const firstName = values.name.trim().split(/\s+/)[0] || "there"
    const mailBody = `${values.message}\n\n— ${values.name}${values.phone ? ` · ${values.phone}` : ""} · ${values.email}`
    const mailtoHref = `mailto:${site.email}?subject=${encodeURIComponent(`ADDOZ — ${values.topic || "Message from the website"}`)}&body=${encodeURIComponent(mailBody)}`
    return <div className="ed-form-success" role="status">
      <CircleCheck size={28} aria-hidden="true" />
      <h3 className="t-h3">Thanks, {firstName}.</h3>
      <p className="t-body">
        This is a preview, so nothing was actually sent — ADDOZ hasn’t seen this yet. Please email us
        directly instead, and we’ll pick it up from there.
      </p>
      <div className="ed-form-success-actions">
        <ActionButton href={mailtoHref} variant="dark" arrow>Email {site.email}</ActionButton>
        <button type="button" className="ed-form-reset" onClick={resetForm}>Write another message</button>
      </div>
    </div>
  }

  const errorList = Object.entries(errors) as [Field, string][]

  return <form className="ed-contact-form" onSubmit={onSubmit} noValidate>
    {errorList.length > 0 && <div ref={summaryRef} tabIndex={-1} role="alert" className="ed-form-summary">
      <p className="ed-form-summary-title"><CircleAlert size={18} aria-hidden="true" /> Fix {plural(errorList.length, "field")} before sending</p>
      <ul>{errorList.map(([field, message]) => <li key={field}><a href={`#${field}`}>{message}</a></li>)}</ul>
    </div>}
    <FormField label="Full name" required error={errors.name} id="name">
      <Input name="name" autoComplete="name" value={values.name} onChange={set("name")} />
    </FormField>
    <FormField label="Email" required error={errors.email} id="email">
      <Input type="email" name="email" autoComplete="email" value={values.email} onChange={set("email")} />
    </FormField>
    <FormField label="Phone" optional hint="If you’d rather we called." error={errors.phone} id="phone">
      <Input type="tel" name="phone" autoComplete="tel" value={values.phone} onChange={set("phone")} />
    </FormField>
    <FormField label="What’s this about?" required error={errors.topic} id="topic">
      <Select name="topic" value={values.topic} onChange={set("topic")}>
        <option value="">Choose one…</option>
        {topics.map(topic => <option key={topic} value={topic}>{topic}</option>)}
      </Select>
    </FormField>
    <FormField label="Message" required error={errors.message} id="message">
      <Textarea name="message" rows={5} value={values.message} onChange={set("message")} />
    </FormField>
    <ActionButton type="submit" variant="dark" size="lg" loading={status === "submitting"} block>
      Send message
    </ActionButton>
  </form>
}
