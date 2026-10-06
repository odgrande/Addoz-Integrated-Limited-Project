"use client"

import { useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { Megaphone } from "lucide-react"

type Audience = "candidates" | "employers" | "everyone" | "user"
export type BroadcastRecord = { id: string; createdAt: string; audience?: Audience; to?: string | null; title?: string; body?: string; recipients?: number; emailed?: number }

const audienceLabel: Record<Audience, string> = { candidates: "All candidates", employers: "All employers", everyone: "Everyone", user: "One person" }

/** Compose an announcement to candidates, employers, everyone, or one person. */
export function BroadcastForm({ counts }: { counts: { candidates: number; employers: number } }) {
  const router = useRouter()
  const [audience, setAudience] = useState<Audience>("everyone")
  const [email, setEmail] = useState("")
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [href, setHref] = useState("")
  const [alsoEmail, setAlsoEmail] = useState(false)
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState<{ tone: "ok" | "error"; text: string } | null>(null)
  const reach = audience === "candidates" ? counts.candidates : audience === "employers" ? counts.employers : audience === "everyone" ? counts.candidates + counts.employers : 1

  async function submit(event: FormEvent) {
    event.preventDefault()
    setBusy(true); setStatus(null)
    try {
      const response = await fetch("/api/admin/broadcast", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ audience, email: audience === "user" ? email : undefined, title, body, href, sendEmail: alsoEmail }) })
      const payload = await response.json().catch(() => ({})) as { error?: string; recipients?: number; emailed?: number }
      if (!response.ok) throw new Error(payload.error || "Unable to send the broadcast.")
      setStatus({ tone: "ok", text: `Sent to ${payload.recipients} ${payload.recipients === 1 ? "person" : "people"}${alsoEmail ? ` · ${payload.emailed} emailed` : ""}.` })
      setTitle(""); setBody(""); setHref("")
      router.refresh()
    } catch (error) {
      setStatus({ tone: "error", text: error instanceof Error ? error.message : "Unable to send the broadcast." })
    } finally { setBusy(false) }
  }

  return <form className="app-form broadcast-form" onSubmit={submit}>
    <fieldset className="field broadcast-audience"><legend className="field-label">Send to</legend>
      {(Object.keys(audienceLabel) as Audience[]).map(id => <label key={id} className={`broadcast-option${audience === id ? " is-active" : ""}`}>
        <input type="radio" name="audience" value={id} checked={audience === id} onChange={() => setAudience(id)} />
        <span>{audienceLabel[id]}</span>
        <small>{id === "candidates" ? counts.candidates : id === "employers" ? counts.employers : id === "everyone" ? counts.candidates + counts.employers : "by email"}</small>
      </label>)}
    </fieldset>
    {audience === "user" && <label className="field"><span className="field-label">Their account email</span><input className="input" type="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="name@example.com" required /></label>}
    <label className="field"><span className="field-label">Title</span><input className="input" value={title} onChange={event => setTitle(event.target.value)} maxLength={120} placeholder="New: save applicants for later" required /></label>
    <label className="field"><span className="field-label">Message</span><textarea className="input" rows={5} value={body} onChange={event => setBody(event.target.value)} maxLength={2000} required /></label>
    <label className="field"><span className="field-label">Link (optional)</span><input className="input" value={href} onChange={event => setHref(event.target.value)} placeholder="/jobs" /><span className="field-hint">A page on this site that opens when they tap the notification. Leave empty to open their notifications.</span></label>
    <label className="check"><input type="checkbox" checked={alsoEmail} onChange={event => setAlsoEmail(event.target.checked)} /><span className="check-box" aria-hidden="true" /><span>Also email it <small className="field-hint">(up to 250 people per send — the daily email allowance)</small></span></label>
    {status && <p className={status.tone === "ok" ? "form-message" : "field-error"} role={status.tone === "ok" ? "status" : "alert"}>{status.text}</p>}
    <div className="app-form-actions"><button type="submit" className="action-button action-primary" disabled={busy || reach === 0}><Megaphone size={16} aria-hidden="true" />{busy ? "Sending..." : audience === "user" ? "Send" : `Send to ${reach} ${reach === 1 ? "person" : "people"}`}</button></div>
  </form>
}

export function BroadcastHistory({ items }: { items: BroadcastRecord[] }) {
  if (!items.length) return <p className="field-hint">No broadcasts sent yet.</p>
  return <ul className="broadcast-history">{items.map(item => <li key={item.id}>
    <div><strong>{item.title}</strong><p>{item.body}</p></div>
    <small>{item.audience === "user" ? item.to : audienceLabel[item.audience ?? "everyone"]} · {item.recipients ?? 0} reached{item.emailed ? ` · ${item.emailed} emailed` : ""} · {new Date(item.createdAt).toLocaleString("en-NG", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}</small>
  </li>)}</ul>
}
