"use client"

import { useEffect, useRef, useState, type FormEvent } from "react"
import { Bookmark, FileText, LoaderCircle, Trash2, UploadCloud } from "lucide-react"
import { useRouter } from "next/navigation"
import { gsap, reducedMotion } from "@/lib/motion"
import { formatFileSize } from "@/lib/format"

const MAX_RESUME_BYTES = 4 * 1024 * 1024
const ACCEPTED_RESUME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/rtf",
  "text/plain",
]

async function request(resource: string, method: string, body?: Record<string, unknown>) {
  const response = await fetch(`/api/candidate/${resource}`, {
    method,
    headers: { "content-type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(payload.error || "Something went wrong.")
  return payload
}


function SubmitButton({ busy, children, disabled = false }: { busy: boolean; children: React.ReactNode; disabled?: boolean }) {
  return <button type="submit" className="action-button action-primary" disabled={busy || disabled}>{busy && <LoaderCircle className="spin" size={16} aria-hidden="true" />}{children}</button>
}

export function CandidateReveal({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!ref.current || reducedMotion()) return
    const context = gsap.context(() => gsap.fromTo(ref.current, { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.55, ease: "power3.out" }), ref)
    return () => context.revert()
  }, [])
  return <div ref={ref} className={className}>{children}</div>
}

export function CandidateSaveButton({ jobSlug, jobId, title, initialSaved = false }: { jobSlug: string; jobId?: string; title: string; initialSaved?: boolean }) {
  const [saved, setSaved] = useState(initialSaved)
  const [busy, setBusy] = useState(false)
  const router = useRouter()
  async function toggle() {
    if (busy) return
    const before = saved
    setSaved(!before)
    setBusy(true)
    try {
      await request("saved-jobs", before ? "DELETE" : "POST", before ? { jobId } : { jobSlug })
      router.refresh()
    } catch (error) {
      setSaved(before)
      if (error instanceof Error && error.message === "Authentication required.") window.location.href = "/auth/login?role=candidate&redirect=/candidate/saved-jobs"
    } finally { setBusy(false) }
  }
  return <button type="button" className={`candidate-save ${saved ? "is-saved" : ""}`} aria-pressed={saved} aria-label={saved ? `Remove ${title} from saved jobs` : `Save ${title}`} onClick={toggle} disabled={busy}><Bookmark size={18} fill={saved ? "currentColor" : "none"} aria-hidden="true" /><span>{saved ? "Saved" : "Save"}</span></button>
}

export function ProfileForm({ initial }: { initial: { name: string; headline: string | null; experience: string | null; locationId: string | null; locations: { id: string; name: string }[] } }) {
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState("")
  const router = useRouter()
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage("")
    const form = new FormData(event.currentTarget)
    try { await request("profile", "PUT", { name: form.get("name"), headline: form.get("headline"), experience: form.get("experience"), locationId: form.get("locationId") }); setMessage("Profile updated."); router.refresh() }
    catch (error) { setMessage(error instanceof Error ? error.message : "Unable to update profile.") }
    finally { setBusy(false) }
  }
  return <form className="app-form" onSubmit={submit}>
    <div className="candidate-form-grid">
      <label className="field"><span className="field-label">Full name</span><input className="input" name="name" defaultValue={initial.name} required /></label>
      <label className="field"><span className="field-label">Location</span><select className="input" name="locationId" defaultValue={initial.locationId ?? ""}><option value="">Choose a location</option>{initial.locations.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
    </div>
    <label className="field"><span className="field-label">Professional headline</span><input className="input" name="headline" defaultValue={initial.headline ?? ""} placeholder="Product designer focused on useful, accessible tools" /></label>
    <label className="field"><span className="field-label">Experience</span><textarea className="input" name="experience" rows={4} defaultValue={initial.experience ?? ""} placeholder="A short summary of the work you have done and the problems you solve." /></label>
    {message && <p className="form-message" role="status">{message}</p>}
    <div className="app-form-actions"><SubmitButton busy={busy}>Save profile</SubmitButton></div>
  </form>
}

export function ResumeForm({ initial, storageConfigured, returnTo }: { initial: { id?: string; fileName: string; fileSize: string | null; url: string; storageKey?: string | null } | null; storageConfigured: boolean; /** Where to continue after uploading (an application that needed a CV). */ returnTo?: string }) {
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState("")
  const [status, setStatus] = useState<"idle" | "uploading" | "success" | "error">("idle")
  const [selectedFileName, setSelectedFileName] = useState(initial?.fileName ?? "")
  const router = useRouter()

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const file = form.get("resume")
    if (!(file instanceof File)) {
      setStatus("error")
      setMessage("Choose a PDF, DOC, DOCX, RTF, or TXT resume file.")
      return
    }

    const accepted = ACCEPTED_RESUME_TYPES.includes(file.type) || /\.(pdf|doc|docx|rtf|txt)$/i.test(file.name)
    if (!accepted) {
      setStatus("error")
      setMessage("Upload a PDF, DOC, DOCX, RTF, or TXT resume.")
      return
    }
    if (file.size <= 0) {
      setStatus("error")
      setMessage("The resume file is empty.")
      return
    }
    if (file.size > MAX_RESUME_BYTES) {
      setStatus("error")
      setMessage("Resume files must be 4 MB or smaller.")
      return
    }

    setBusy(true)
    setStatus("uploading")
    setMessage("")

    try {
      const formData = new FormData()
      formData.append("resume", file)
      const response = await fetch("/api/candidate/resume", {
        method: "POST",
        body: formData,
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload.error || "Unable to upload resume.")
      setStatus("success")
      setSelectedFileName(file.name)
      if (returnTo) {
        setMessage("CV saved. Taking you back to your application…")
        router.push(returnTo)
        return
      }
      setMessage("Resume uploaded successfully.")
      router.refresh()
    } catch (error) {
      setStatus("error")
      setMessage(error instanceof Error ? error.message : "Unable to upload resume.")
    } finally {
      setBusy(false)
    }
  }

  async function remove() {
    setBusy(true)
    setMessage("")
    try {
      const response = await fetch("/api/candidate/resume", { method: "DELETE" })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload.error || "Unable to remove resume.")
      setSelectedFileName("")
      setStatus("success")
      setMessage("Resume removed.")
      router.refresh()
    } catch (error) {
      setStatus("error")
      setMessage(error instanceof Error ? error.message : "Unable to remove resume.")
    } finally {
      setBusy(false)
    }
  }

  const fileName = selectedFileName || initial?.fileName || ""
  const fileUrl = initial?.id ? `/api/candidate/resume/download?id=${initial.id}` : initial?.url ?? ""

  return <form className="app-form" onSubmit={submit}>
    <div className="resume-upload-mark"><FileText size={28} aria-hidden="true" /><span>{initial ? "Resume on file" : "No resume added yet"}</span></div>
    {!storageConfigured && <p className="form-message" role="status">Resume uploads are temporarily unavailable. Please try again later.</p>}
    <label className="field">
      <span className="field-label">Upload resume</span>
      <input className="input" name="resume" type="file" accept=".pdf,.doc,.docx,.rtf,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/rtf,text/plain" disabled={busy || !storageConfigured} onChange={event => setSelectedFileName(event.target.files?.[0]?.name ?? initial?.fileName ?? "")} />
      <small className="field-hint">Accepted: PDF, DOC, DOCX, RTF, TXT — max {formatFileSize(MAX_RESUME_BYTES)}.</small>
    </label>
    <div className="candidate-form-grid">
      <label className="field"><span className="field-label">Current file</span><input className="input" value={fileName} readOnly /></label>
      <label className="field"><span className="field-label">File size</span><input className="input" value={initial ? formatFileSize(initial.fileSize) : "—"} readOnly /></label>
    </div>
    {initial && fileUrl && <div className="field"><span className="field-label">Resume access</span><a className="text-link" href={fileUrl} target="_blank" rel="noreferrer">Download current resume</a></div>}
    {message && <p className="form-message" role="status">{message}</p>}
    <div className="app-form-actions">
      <SubmitButton busy={busy || status === "uploading"} disabled={!storageConfigured || busy}> {status === "uploading" ? <><UploadCloud size={16} aria-hidden="true" /> Uploading…</> : "Upload resume"}</SubmitButton>
      {initial && <button type="button" className="action-button action-ghost" onClick={remove} disabled={busy || !storageConfigured}><Trash2 size={16} aria-hidden="true" />Remove</button>}
    </div>
  </form>
}

export function SettingsForm({ initial }: { initial: { name: string; email: string } }) {
  const [busy, setBusy] = useState(false); const [message, setMessage] = useState(""); const router = useRouter()
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setBusy(true); setMessage(""); const form = new FormData(event.currentTarget); try { await request("settings", "PATCH", { name: form.get("name") }); setMessage("Settings updated."); router.refresh() } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to update settings.") } finally { setBusy(false) } }
  return <form className="app-form" onSubmit={submit}><label className="field"><span className="field-label">Display name</span><input className="input" name="name" defaultValue={initial.name} required /></label><label className="field"><span className="field-label">Email</span><input className="input" value={initial.email} readOnly /></label><p className="field-hint">Email changes are handled through account verification and are not editable here.</p>{message && <p className="form-message" role="status">{message}</p>}<div className="app-form-actions"><SubmitButton busy={busy}>Save settings</SubmitButton></div></form>
}

export function AlertForm({ categories, locations }: { categories: { id: string; name: string }[]; locations: { id: string; name: string }[] }) {
  const [busy, setBusy] = useState(false); const [message, setMessage] = useState(""); const router = useRouter()
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setBusy(true); setMessage(""); const form = new FormData(event.currentTarget); try { await request("job-alerts", "POST", { name: form.get("name"), keywords: form.get("keywords"), categoryId: form.get("categoryId"), locationId: form.get("locationId"), workplace: form.get("workplace"), frequency: form.get("frequency") }); event.currentTarget.reset(); setMessage("Alert created."); router.refresh() } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to create alert.") } finally { setBusy(false) } }
  return <form className="app-form candidate-alert-form" onSubmit={submit}><div className="candidate-form-grid"><label className="field"><span className="field-label">Alert name</span><input className="input" name="name" placeholder="Remote product roles" required /></label><label className="field"><span className="field-label">Keywords</span><input className="input" name="keywords" placeholder="designer, product" /></label></div><div className="candidate-form-grid"><label className="field"><span className="field-label">Category</span><select className="input" name="categoryId"><option value="">Any category</option>{categories.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label className="field"><span className="field-label">Location</span><select className="input" name="locationId"><option value="">Any location</option>{locations.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label></div><div className="candidate-form-grid"><label className="field"><span className="field-label">Workplace</span><select className="input" name="workplace"><option value="">Any workplace</option><option>Remote</option><option>Hybrid</option><option>On-site</option></select></label><label className="field"><span className="field-label">Frequency</span><select className="input" name="frequency"><option>Daily</option><option>Instant</option><option>Weekly</option></select></label></div>{message && <p className="form-message" role="status">{message}</p>}<div className="app-form-actions"><SubmitButton busy={busy}>Create alert</SubmitButton></div></form>
}

export function AlertActions({ id, active }: { id: string; active: boolean | null }) { const [enabled, setEnabled] = useState(Boolean(active)); const [busy, setBusy] = useState(false); const router = useRouter(); async function toggle() { const next = !enabled; setEnabled(next); setBusy(true); try { await request("job-alerts", "PATCH", { id, active: next }); router.refresh() } catch { setEnabled(!next) } finally { setBusy(false) } } async function remove() { setBusy(true); await request("job-alerts", "DELETE", { id }); router.refresh() } return <div className="candidate-row-actions"><button type="button" className="action-button action-ghost" onClick={toggle} disabled={busy} aria-pressed={enabled}>{enabled ? "Active" : "Paused"}</button><button type="button" className="icon-action" onClick={remove} disabled={busy} aria-label="Delete alert"><Trash2 size={17} aria-hidden="true" /></button></div> }

export function NotificationActions({ unread }: { unread: boolean }) { const [read, setRead] = useState(!unread); const router = useRouter(); async function markRead() { setRead(true); await request("notifications", "PATCH", { id: "all" }); router.refresh() } return read ? <span className="candidate-status muted">All caught up</span> : <button type="button" className="action-button action-ghost" onClick={markRead}>Mark all read</button> }
