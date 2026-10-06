"use client"

import { useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { Bookmark, BookmarkCheck, Mail } from "lucide-react"
import { Checkbox, Modal } from "@/components/patterns"

async function send(url: string, method: string, body?: unknown) {
  const response = await fetch(url, { method, headers: { "content-type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) })
  const payload = await response.json().catch(() => ({})) as { error?: string }
  if (!response.ok) throw new Error(payload.error || "Something went wrong.")
  return payload
}

/** Save / unsave an applicant to the employer's Saved applicants list. */
export function SaveApplicantButton({ applicationId, initial, compact = false }: { applicationId: string; initial: boolean; compact?: boolean }) {
  const [saved, setSaved] = useState(initial)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  async function toggle() {
    setBusy(true); setError("")
    try { await send(`/api/employer/applications/${applicationId}/save`, saved ? "DELETE" : "PUT"); setSaved(!saved); router.refresh() }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to update saved applicants.") }
    finally { setBusy(false) }
  }
  const Icon = saved ? BookmarkCheck : Bookmark
  return <span className="save-applicant">
    <button type="button" className={`action-button action-ghost${saved ? " is-saved" : ""}${compact ? " action-sm" : ""}`} onClick={toggle} disabled={busy} aria-pressed={saved} title={saved ? "Remove from saved applicants" : "Save to come back later"}>
      <Icon size={15} aria-hidden="true" />{compact ? <span className="sr-only">{saved ? "Saved" : "Save"}</span> : saved ? "Saved" : "Save"}
    </button>
    {error && <small className="field-error" role="alert">{error}</small>}
  </span>
}

/** Email and/or in-app message one applicant. Email replies go straight to the employer. */
export function ContactApplicantButton({ applicationId, candidateName, jobTitle, companyName, compact = false }: { applicationId: string; candidateName: string; jobTitle: string; companyName: string; compact?: boolean }) {
  const [open, setOpen] = useState(false)
  const [subject, setSubject] = useState(`Your application for ${jobTitle}`)
  const [body, setBody] = useState("")
  const [viaEmail, setViaEmail] = useState(true)
  const [viaMessage, setViaMessage] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [done, setDone] = useState("")

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!viaEmail && !viaMessage) return setError("Choose email, in-app message, or both.")
    if (body.trim().length < 5) return setError("Write a short message.")
    setBusy(true); setError("")
    try {
      await send(`/api/employer/applications/${applicationId}/contact`, "POST", { subject, body, email: viaEmail, message: viaMessage })
      setDone(viaEmail && viaMessage ? "Sent by email and in-app message." : viaEmail ? "Email sent." : "Message sent.")
      setBody("")
    } catch (cause) { setError(cause instanceof Error ? cause.message : "We couldn't send that.") }
    finally { setBusy(false) }
  }

  return <>
    <button type="button" className={`action-button action-ghost${compact ? " action-sm" : ""}`} onClick={() => { setOpen(true); setDone(""); setError("") }}><Mail size={15} aria-hidden="true" />{compact ? <span className="sr-only">Contact {candidateName}</span> : "Email / message"}</button>
    <Modal open={open} onOpenChange={setOpen} size="md" eyebrow="Contact applicant" title={candidateName} description={`${jobTitle} · ${companyName}`}>
      {done ? <div className="apply-done" role="status"><p>{done}</p><div className="cluster"><button type="button" className="action-button action-dark" onClick={() => setOpen(false)}>Done</button><button type="button" className="action-button action-ghost" onClick={() => setDone("")}>Send another</button></div></div>
        : <form className="apply-form contact-applicant-form" onSubmit={submit} noValidate>
          {error && <p className="field-error" role="alert">{error}</p>}
          <label className="field"><span className="field-label">Subject</span><input className="input" value={subject} onChange={event => setSubject(event.target.value)} maxLength={160} required /></label>
          <label className="field"><span className="field-label">Message</span><textarea className="input" rows={7} value={body} onChange={event => setBody(event.target.value)} maxLength={5000} placeholder={`Hi ${candidateName.split(" ")[0]}, thanks for applying…`} required /></label>
          <fieldset className="field contact-channels"><legend className="field-label">Send as</legend>
            <Checkbox checked={viaEmail} onChange={event => setViaEmail(event.target.checked)} label="Email" description="Sent by ADDOZ; their reply comes straight to your inbox." />
            <Checkbox checked={viaMessage} onChange={event => setViaMessage(event.target.checked)} label="In-app message" description="Added to this application's message thread on ADDOZ." />
          </fieldset>
          <div className="cluster"><button type="button" className="action-button action-ghost" onClick={() => setOpen(false)} disabled={busy}>Cancel</button><button type="submit" className="action-button action-primary" disabled={busy}>{busy ? "Sending..." : "Send"}</button></div>
        </form>}
    </Modal>
  </>
}
