"use client"

import { useEffect, useRef, useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { Check, CircleCheck, FileUp } from "lucide-react"
import { ActionButton, Checkbox, FileDrop, FormField, Input, Modal, Radio, Textarea } from "@/components/patterns"
import { useSession } from "@/lib/auth-client"
import type { Viewer } from "@/features/jobs/public-data"

type Step = "choice" | "needs-cv" | "form" | "review" | "done"
type Draft = { name: string; email: string; phone: string; coverLetter: string; consent: boolean }
type Errors = Partial<Record<"name" | "email" | "phone" | "cv" | "consent" | "root", string>>
type Role = "candidate" | "employer" | "admin" | "guest" | "loading"

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MAX_CV_BYTES = 4 * 1024 * 1024
const CV_ACCEPT = ".pdf,.doc,.docx,.rtf,.txt"

function emptyDraft(name = "", email = ""): Draft {
  return { name, email, phone: "", coverLetter: "", consent: false }
}

/**
 * Apply CTA + application flow for one job.
 *
 * The server-resolved `viewer` decides the flow: a signed-in candidate goes
 * straight to their own application, a guest chooses between signing in and
 * applying as a guest, employers and admins cannot apply. The browser session
 * hook is only consulted when the server could not resolve the session.
 */
export function ApplyFlow({ jobSlug, jobTitle, companyName, applied: appliedOnServer, viewer, autoOpen = false }: {
  /** Reopen the application after "Sign in to apply" (?apply=1). One instance per page. */
  autoOpen?: boolean
  jobSlug: string
  jobTitle: string
  companyName: string
  applied: boolean
  viewer: Viewer
}) {
  const router = useRouter()
  const { data: clientSession, isPending } = useSession()
  const [applied, setApplied] = useState(appliedOnServer)
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<Step>("form")
  const [asGuest, setAsGuest] = useState(false)
  const [draft, setDraft] = useState<Draft>(emptyDraft())
  const [errors, setErrors] = useState<Errors>({})
  const [busy, setBusy] = useState(false)
  const [submittedOn, setSubmittedOn] = useState("")
  const [cv, setCv] = useState<File | null>(null)
  const [useProfileCv, setUseProfileCv] = useState(false)
  const autoOpened = useRef(false)

  useEffect(() => { setApplied(appliedOnServer) }, [appliedOnServer])

  const clientRole = clientSession?.user?.role
  const role: Role = viewer.role !== "unknown"
    ? viewer.role
    : isPending ? "loading" : clientRole === "candidate" || clientRole === "employer" || clientRole === "admin" ? clientRole : "guest"
  const account = viewer.role === "candidate"
    ? { name: viewer.name, email: viewer.email }
    : role === "candidate" ? { name: clientSession?.user?.name ?? "", email: clientSession?.user?.email ?? "" } : null
  const profileCv = viewer.role === "candidate" ? viewer.resume : null

  // Registered candidates apply with the CV on their profile; without one they add it first
  const needsProfileCv = viewer.role === "candidate" && !viewer.resume
  const addCvHref = `/candidate/resume?redirect=${encodeURIComponent(`/jobs/${jobSlug}?apply=1`)}`

  const signInHref = `/auth/login?role=candidate&redirect=${encodeURIComponent(`/jobs/${jobSlug}?apply=1`)}`
  const registerHref = `/auth/register?role=candidate&redirect=${encodeURIComponent(`/jobs/${jobSlug}?apply=1`)}`

  function startCandidate() {
    setAsGuest(false)
    if (needsProfileCv) { setErrors({}); setStep("needs-cv"); setOpen(true); return }
    setDraft(emptyDraft(account?.name ?? "", account?.email ?? ""))
    setCv(null)
    setUseProfileCv(Boolean(profileCv))
    setErrors({})
    setStep("form")
    setOpen(true)
  }

  function start() {
    if (role === "candidate") return startCandidate()
    if (role === "guest") { setErrors({}); setStep("choice"); setOpen(true) }
  }

  // Returning from "Sign in to apply": reopen the candidate application once.
  useEffect(() => {
    if (!autoOpen || autoOpened.current || role !== "candidate" || applied) return
    const params = new URLSearchParams(window.location.search)
    if (params.get("apply") !== "1") return
    autoOpened.current = true
    params.delete("apply")
    const query = params.toString()
    window.history.replaceState(null, "", `${window.location.pathname}${query ? `?${query}` : ""}`)
    startCandidate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoOpen, role, applied])

  function continueAsGuest() {
    setAsGuest(true)
    setDraft(emptyDraft())
    setCv(null)
    setUseProfileCv(false)
    setErrors({})
    setStep("form")
  }

  function validate(values: Draft): Errors {
    const found: Errors = {}
    if (values.name.trim().length < 2) found.name = "Enter your full name."
    if (!EMAIL.test(values.email.trim())) found.email = "Enter a valid email address."
    if (values.phone.trim() && values.phone.replace(/\D/g, "").length < 10) found.phone = "Enter a valid phone number."
    if (!(useProfileCv && profileCv)) {
      if (!cv) found.cv = "Attach your CV (PDF, Word, RTF or TXT)."
      else if (!/\.(pdf|doc|docx|rtf|txt)$/i.test(cv.name)) found.cv = "Upload your CV as a PDF, DOC, DOCX, RTF or TXT file."
      else if (cv.size > MAX_CV_BYTES) found.cv = "CV files must be 4 MB or smaller."
    }
    if (!values.consent) found.consent = `Confirm you're happy to share these details with ${companyName}.`
    return found
  }

  function review(event: FormEvent) {
    event.preventDefault()
    const found = validate(draft)
    setErrors(found)
    if (Object.keys(found).length === 0) setStep("review")
  }

  async function submit() {
    setBusy(true)
    setErrors({})
    try {
      const body = new FormData()
      body.set("name", draft.name)
      body.set("email", draft.email)
      body.set("phone", draft.phone)
      body.set("coverLetter", draft.coverLetter)
      body.set("consent", String(draft.consent))
      const reuseProfileCv = useProfileCv && Boolean(profileCv)
      body.set("useProfileResume", String(reuseProfileCv))
      if (!reuseProfileCv && cv) body.set("cv", cv)
      const response = await fetch(`/api/jobs/${encodeURIComponent(jobSlug)}/apply`, { method: "POST", body })
      const data = await response.json().catch(() => ({})) as { error?: string; code?: string }
      if (!response.ok) {
        if (data.code === "ALREADY_APPLIED") { setApplied(true); setOpen(false); router.refresh(); return }
        if (data.code === "PROFILE_CV_REQUIRED") { setStep("needs-cv"); return }
        setErrors({ root: data.error || "We couldn't submit your application. Please try again." })
        setStep(data.code === "ACCOUNT_EXISTS" || data.code === "INVALID" || data.code === "CV_REQUIRED" ? "form" : "review")
        return
      }
      setSubmittedOn(new Date().toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" }))
      setStep("done")
    } catch {
      setErrors({ root: "We couldn't reach ADDOZ. Check your connection and try again." })
    } finally {
      setBusy(false)
    }
  }

  function close(next: boolean) {
    if (next) return setOpen(true)
    setOpen(false)
    if (step === "done") {
      // Guests can apply again with another email; candidates are now applied
      if (!asGuest) setApplied(true)
      router.refresh()
    }
  }

  const cta = applied
    ? <span className="candidate-status success"><Check size={16} aria-hidden="true" />Applied</span>
    : role === "employer" || role === "admin"
      ? <span className="candidate-status muted" title="Sign in with a candidate account to apply">Candidates only</span>
      : <ActionButton variant="primary" onClick={start} disabled={role === "loading"} aria-busy={role === "loading" || undefined}>Apply now</ActionButton>

  const title = step === "done" ? "Application sent." : step === "choice" ? "How would you like to apply?" : step === "needs-cv" ? "Add your CV to continue" : step === "review" ? "Review your application" : jobTitle
  const eyebrow = step === "done" ? undefined : asGuest ? "Guest application" : step === "choice" ? "Apply on ADDOZ" : "Your application"

  return <>
    {cta}
    <Modal open={open} onOpenChange={close} size="md" eyebrow={eyebrow} title={title} description={step === "form" || step === "choice" ? `${jobTitle} · ${companyName}` : undefined}>
      {step === "choice" && <div className="apply-form">
        <p>Sign in to apply with your ADDOZ candidate account and track this application, or apply as a guest with just your contact details.</p>
        <ActionButton variant="primary" block href={signInHref}>Sign in to apply</ActionButton>
        <ActionButton variant="ghost" block onClick={continueAsGuest}>Continue as guest</ActionButton>
        <p className="apply-note">New to ADDOZ? <a className="text-link" href={registerHref}>Create a candidate account</a></p>
      </div>}

      {step === "needs-cv" && <div className="apply-form apply-needs-cv">
        <FileUp size={36} strokeWidth={1.75} aria-hidden="true" />
        <p>Employers review every application with a CV, so your profile needs one before you can apply. Upload it once — it&apos;s saved to your profile for every future application, and we&apos;ll bring you straight back to <strong>{jobTitle}</strong>.</p>
        <ActionButton variant="primary" block href={addCvHref}>Add my CV</ActionButton>
        <ActionButton variant="ghost" block onClick={() => close(false)}>Not now</ActionButton>
      </div>}

      {step === "form" && <form className="apply-form" onSubmit={review} noValidate>
        {errors.root && <p className="field-error" role="alert">{errors.root}</p>}
        <FormField label="Full name" required error={errors.name}>
          <Input value={draft.name} onChange={event => setDraft(current => ({ ...current, name: event.target.value }))} autoComplete="name" />
        </FormField>
        <FormField label="Email" required error={errors.email} hint={asGuest ? "We'll send updates about this application here." : "Your ADDOZ account email."}>
          <Input value={draft.email} onChange={event => setDraft(current => ({ ...current, email: event.target.value }))} type="email" autoComplete="email" readOnly={!asGuest} />
        </FormField>
        <FormField label="Phone number" optional error={errors.phone}>
          <Input value={draft.phone} onChange={event => setDraft(current => ({ ...current, phone: event.target.value }))} type="tel" autoComplete="tel" placeholder="+234" />
        </FormField>
        <div className="field">
          <span className="field-label">CV <span className="field-required" aria-hidden="true">*</span></span>
          {profileCv && !asGuest && <div className="apply-cv-choice" role="radiogroup" aria-label="Which CV to send">
            <Radio name="cv-source" checked={useProfileCv} onChange={() => { setUseProfileCv(true); setErrors(current => ({ ...current, cv: undefined })) }} label={<>Use my CV on file <small>({profileCv.fileName})</small></>} />
            <Radio name="cv-source" checked={!useProfileCv} onChange={() => setUseProfileCv(false)} label="Upload a different CV" />
          </div>}
          {!(useProfileCv && profileCv && !asGuest) && <FileDrop accept={CV_ACCEPT} label="Add your CV" hint="PDF, Word, RTF or TXT · up to 4 MB" onFile={file => { setCv(file); setErrors(current => ({ ...current, cv: undefined })) }} />}
          {errors.cv && <p className="field-error" role="alert">{errors.cv}</p>}
        </div>
        <FormField label="Cover note" optional hint="Why this role, in a few lines.">
          <Textarea value={draft.coverLetter} onChange={event => setDraft(current => ({ ...current, coverLetter: event.target.value }))} rows={4} maxLength={5000} />
        </FormField>
        <div className="field">
          <Checkbox checked={draft.consent} onChange={event => setDraft(current => ({ ...current, consent: event.target.checked }))} label={`Share my details with ${companyName} for this role.`} aria-invalid={errors.consent ? true : undefined} />
          {errors.consent && <p className="field-error" role="alert">{errors.consent}</p>}
          {asGuest && <p className="field-hint">Applying saves your details and CV to an ADDOZ candidate profile for this email, so your applications stay together.</p>}
        </div>
        <div className="cluster">
          <ActionButton type="button" variant="ghost" onClick={() => asGuest ? setStep("choice") : close(false)}>{asGuest ? "Back" : "Cancel"}</ActionButton>
          <ActionButton type="submit" variant="primary">Review application</ActionButton>
        </div>
      </form>}

      {step === "review" && <div className="apply-form">
        <dl className="apply-review">
          <div><dt>Full name</dt><dd>{draft.name}</dd></div>
          <div><dt>Email</dt><dd>{draft.email}</dd></div>
          <div><dt>Phone</dt><dd>{draft.phone || "Not provided"}</dd></div>
          <div><dt>CV</dt><dd>{useProfileCv && profileCv && !asGuest ? `${profileCv.fileName} (on file)` : cv?.name}</dd></div>
          <div><dt>Cover note</dt><dd>{draft.coverLetter || "No cover note added."}</dd></div>
        </dl>
        {errors.root && <p className="field-error" role="alert">{errors.root}</p>}
        <div className="cluster">
          <ActionButton type="button" variant="ghost" onClick={() => setStep("form")} disabled={busy}>Edit</ActionButton>
          <ActionButton type="button" variant="primary" onClick={submit} loading={busy}>Submit application</ActionButton>
        </div>
      </div>}

      {step === "done" && <div className="apply-done" role="status">
        <CircleCheck size={40} strokeWidth={1.75} aria-hidden="true" />
        <p><strong>{jobTitle}</strong> at {companyName} — sent on {submittedOn}. Your status is <strong>Applied</strong>.</p>
        <p>{asGuest
          ? <>Your application and CV are saved to the ADDOZ candidate profile for <strong>{draft.email}</strong>. Use the same email next time and your applications stay together.</>
          : <>Follow its progress any time in <a className="text-link" href="/candidate/applications">your applications</a>.</>}</p>
        <div className="cluster"><ActionButton variant="dark" onClick={() => close(false)}>Done</ActionButton><ActionButton variant="ghost" href="/jobs">Keep browsing</ActionButton></div>
      </div>}
    </Modal>
  </>
}
