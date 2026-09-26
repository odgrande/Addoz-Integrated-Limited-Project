"use client"

import { useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from "react"
import { ArrowLeft, ArrowRight, Check, CircleCheck, Eye, MapPin, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatDate, formatSalaryCompact } from "@/lib/format"
import { ActionButton } from "@/components/patterns/action-button"
import { Checkbox, FieldRow, FormField, Input, Radio, Select, Textarea } from "@/components/patterns/form-field"
import { Modal } from "@/components/patterns/modal"
import { PrototypeNote } from "@/components/patterns/prototype-note"
import { categories } from "@/features/categories/data"
import { areas, states } from "@/features/locations/data"
import { careerLevels, experienceLevels, jobTypes, workplaces } from "@/features/jobs/data"
import { draftHasContent, useJobDraftStore } from "./job-draft-store"

/**
 * The job posting form (Directive 007 §12) — one component for the public
 * "Post a job" page, the employer dashboard's "Post a job" and "Edit job".
 * Three steps with a live preview. UI only: nothing is saved or published.
 * Directive 009: the public context also autosaves a draft to this browser
 * and shows a completion progress readout — both scoped to context==="public"
 * so the dashboard's own post/edit flows are unaffected.
 */
export type JobDraft = {
  title: string; company: string; category: string; location: string
  type: string; workplace: string; level: string; experience: string
  salaryMin: string; salaryMax: string; hideSalary: boolean
  description: string; responsibilities: string; requirements: string; skills: string[]
  deadline: string; apply: "addoz" | "email" | "website"; applyEmail: string; applyUrl: string; confirm: boolean
}

const today = () => new Date().toISOString().slice(0, 10)
const inDays = (days: number) => new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10)

export const emptyDraft = (company = ""): JobDraft => ({
  title: "", company, category: "", location: "", type: "Full-time", workplace: "On-site", level: "", experience: "",
  salaryMin: "", salaryMax: "", hideSalary: false, description: "", responsibilities: "", requirements: "", skills: [],
  deadline: inDays(30), apply: "addoz", applyEmail: "", applyUrl: "", confirm: false,
})

const steps = [
  { id: "role", label: "The role" },
  { id: "details", label: "The details" },
  { id: "apply", label: "Applications" },
] as const

type Errors = Partial<Record<keyof JobDraft, string>>

function validate(step: number, draft: JobDraft): Errors {
  const errors: Errors = {}
  if (step === 0) {
    if (draft.title.trim().length < 3) errors.title = "Add a job title (at least 3 characters)."
    if (!draft.company.trim()) errors.company = "Add the company name."
    if (!draft.category) errors.category = "Choose a category."
    if (!draft.location) errors.location = "Choose where the job is based."
    if (!draft.experience) errors.experience = "Choose the experience needed."
  }
  if (step === 1) {
    const min = Number(draft.salaryMin || 0), max = Number(draft.salaryMax || 0)
    if (!draft.hideSalary && (draft.salaryMin || draft.salaryMax) && min && max && max < min) errors.salaryMax = "The maximum must be higher than the minimum."
    if (draft.description.trim().length < 80) errors.description = `Describe the role in at least 80 characters (${draft.description.trim().length}/80).`
    if (!draft.requirements.trim()) errors.requirements = "List at least one requirement."
  }
  if (step === 2) {
    if (!draft.deadline || draft.deadline <= today()) errors.deadline = "Choose a closing date in the future."
    if (draft.apply === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.applyEmail)) errors.applyEmail = "Enter a valid email address for applications."
    if (draft.apply === "website" && !/^https?:\/\/\S+\.\S+/.test(draft.applyUrl)) errors.applyUrl = "Enter the full link, starting with https://"
    if (!draft.confirm) errors.confirm = "Please confirm this is a genuine vacancy."
  }
  return errors
}

/** How many of a step's required fields are already filled — feeds the progress readout. */
function stepRequirement(step: number, draft: JobDraft): { done: number; total: number } {
  if (step === 0) {
    const checks = [draft.title.trim().length >= 3, Boolean(draft.company.trim()), Boolean(draft.category), Boolean(draft.location), Boolean(draft.experience)]
    return { done: checks.filter(Boolean).length, total: checks.length }
  }
  if (step === 1) {
    const checks = [draft.description.trim().length >= 80, Boolean(draft.requirements.trim())]
    return { done: checks.filter(Boolean).length, total: checks.length }
  }
  const checks = [Boolean(draft.deadline) && draft.deadline > today(), draft.confirm]
  if (draft.apply === "email") checks.push(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.applyEmail))
  if (draft.apply === "website") checks.push(/^https?:\/\/\S+\.\S+/.test(draft.applyUrl))
  return { done: checks.filter(Boolean).length, total: checks.length }
}

function formatSavedAt(iso: string): string {
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleString("en-NG", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })
}

export function JobPostForm({ initial, context = "public", onDone }: { initial?: Partial<JobDraft>; context?: "public" | "app" | "edit"; onDone?: () => void }) {
  const isDraftable = context === "public"
  const [draft, setDraft] = useState<JobDraft>({ ...emptyDraft(), ...initial })
  const [step, setStep] = useState(0)
  const [errors, setErrors] = useState<Errors>({})
  const [status, setStatus] = useState<"editing" | "submitting" | "done">("editing")
  const [previewOpen, setPreviewOpen] = useState(false)
  const [skillInput, setSkillInput] = useState("")
  const [hasEdited, setHasEdited] = useState(false)
  const formTop = useRef<HTMLDivElement>(null)
  const { saved, save, discard } = useJobDraftStore()

  const set = <K extends keyof JobDraft>(key: K, value: JobDraft[K]) => {
    setDraft(current => ({ ...current, [key]: value }))
    setErrors(current => ({ ...current, [key]: undefined }))
    setHasEdited(true)
  }

  // Autosave (debounced) while there's real content — public flow only.
  useEffect(() => {
    if (!isDraftable || status !== "editing" || !draftHasContent(draft)) return
    const id = setTimeout(() => save(draft, step), 600)
    return () => clearTimeout(id)
  }, [draft, step, isDraftable, status, save])

  const showRestoreBanner = Boolean(isDraftable && !hasEdited && saved && draftHasContent(saved.draft))
  const showDraftStatus = isDraftable && hasEdited && Boolean(saved)

  function restoreDraft() {
    if (!saved) return
    setDraft(saved.draft)
    setStep(saved.step)
    setHasEdited(true)
  }
  function discardDraft() {
    discard()
    setHasEdited(true)
  }

  const progress = useMemo(() => {
    const perStep = [0, 1, 2].map(index => stepRequirement(index, draft))
    const done = perStep.reduce((sum, item) => sum + item.done, 0)
    const total = perStep.reduce((sum, item) => sum + item.total, 0)
    return { perStep, done, total }
  }, [draft])

  function go(next: number) {
    if (next > step) {
      const found = validate(step, draft)
      setErrors(found)
      if (Object.keys(found).length) {
        requestAnimationFrame(() => formTop.current?.querySelector<HTMLElement>("[aria-invalid='true']")?.focus())
        return
      }
    }
    setStep(next)
    formTop.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    if (step < steps.length - 1) { go(step + 1); return }
    const found = validate(step, draft)
    setErrors(found)
    if (Object.keys(found).length) { requestAnimationFrame(() => formTop.current?.querySelector<HTMLElement>("[aria-invalid='true']")?.focus()); return }
    setStatus("submitting")
    setTimeout(() => {
      setStatus("done")
      if (isDraftable) discard()
      formTop.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    }, 1100)
  }

  function addSkill(raw: string) {
    const skill = raw.trim().replace(/,$/, "")
    if (!skill || draft.skills.includes(skill) || draft.skills.length >= 10) return
    set("skills", [...draft.skills, skill])
    setSkillInput("")
  }
  function onSkillKey(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === ",") { event.preventDefault(); addSkill(skillInput) }
    if (event.key === "Backspace" && !skillInput && draft.skills.length) set("skills", draft.skills.slice(0, -1))
  }

  const preview = useMemo(() => <JobPreview draft={draft} />, [draft])

  if (status === "done") {
    return <div className="post-done" ref={formTop} role="status">
      <span className="post-done-icon" aria-hidden="true"><CircleCheck size={34} /></span>
      <h2>{context === "edit" ? "Changes ready." : context === "app" ? "Listing ready to publish." : "Your listing is ready."}</h2>
      <p>{context === "public"
        ? "In the live platform this is where you would create your company account and publish. This prototype doesn't save or publish listings yet."
        : "In the live platform this saves to your jobs and goes live after review. This prototype doesn't save anything yet."}</p>
      <div className="post-done-preview">{preview}</div>
      <div className="cluster">
        {context === "public" ? <>
          <ActionButton href="/auth/register?role=employer" variant="primary" arrow>Create an employer account</ActionButton>
          <ActionButton variant="light" onClick={() => { setDraft(emptyDraft()); setStep(0); setStatus("editing"); setHasEdited(false) }}>Post another job</ActionButton>
        </> : <>
          <ActionButton href="/employer/jobs" variant="dark" arrow>Back to your jobs</ActionButton>
          {onDone && <ActionButton variant="light" onClick={onDone}>Close</ActionButton>}
        </>}
      </div>
    </div>
  }

  return <div className="post-layout" ref={formTop}>
    <form className="post-form" onSubmit={submit} noValidate aria-describedby="post-proto">
      {showRestoreBanner && saved && <div className="fe-draft-banner" role="status">
        <p className="fe-draft-banner-text"><strong>Unsaved draft found</strong> — saved {formatSavedAt(saved.savedAt)}. Restore it, or start fresh.</p>
        <div className="cluster">
          <ActionButton type="button" size="sm" variant="dark" onClick={restoreDraft}>Restore draft</ActionButton>
          <ActionButton type="button" size="sm" variant="ghost" onClick={discardDraft}>Discard</ActionButton>
        </div>
      </div>}

      {isDraftable && <div className="fe-progress" role="group" aria-label="Form progress">
        <div className="fe-progress-track"><div className="fe-progress-fill" style={{ width: `${progress.total ? Math.round((progress.done / progress.total) * 100) : 0}%` }} /></div>
        <p className="fe-progress-label">
          {progress.done}/{progress.total} required fields completed
          {showDraftStatus && saved && <span className="fe-draft-status"> · Draft saved {formatSavedAt(saved.savedAt)}</span>}
        </p>
      </div>}

      <ol className="post-steps" aria-label="Posting steps">
        {steps.map((item, index) => <li key={item.id} className={cn(index === step && "is-current", index < step && "is-done")} aria-current={index === step ? "step" : undefined}>
          <button type="button" onClick={() => index < step && go(index)} disabled={index > step}>
            <span className="post-step-num">{index < step ? <Check size={14} aria-hidden="true" /> : index + 1}</span>{item.label}
            {isDraftable && <span className="fe-step-count">{progress.perStep[index].done}/{progress.perStep[index].total}</span>}
          </button>
        </li>)}
      </ol>

      {step === 0 && <fieldset className="post-fieldset">
        <legend className="sr-only">The role</legend>
        <FormField label="Job title" required error={errors.title} hint="Keep it simple — the title people search for."><Input value={draft.title} onChange={event => set("title", event.target.value)} placeholder="e.g. Finance Officer" autoComplete="off" /></FormField>
        <FormField label="Company" required error={errors.company}><Input value={draft.company} onChange={event => set("company", event.target.value)} placeholder="Your company name" autoComplete="organization" /></FormField>
        <FieldRow>
          <FormField label="Category" required error={errors.category}><Select value={draft.category} onChange={event => set("category", event.target.value)}>
            <option value="">Choose a category</option>
            {[...categories].sort((a, b) => a.name.localeCompare(b.name)).map(category => <option key={category.slug} value={category.name}>{category.name}</option>)}
          </Select></FormField>
          <FormField label="Location" required error={errors.location}><Select value={draft.location} onChange={event => set("location", event.target.value)}>
            <option value="">Choose a location</option>
            {states.map(state => <optgroup key={state.slug} label={`${state.name} State`}>{areas.filter(area => area.state === state.slug).map(area => <option key={area.slug} value={area.slug}>{area.name}</option>)}</optgroup>)}
          </Select></FormField>
        </FieldRow>
        <FieldRow>
          <FormField label="Employment type" required><Select value={draft.type} onChange={event => set("type", event.target.value)}>{jobTypes.map(type => <option key={type}>{type}</option>)}</Select></FormField>
          <FormField label="Workplace"><Select value={draft.workplace} onChange={event => set("workplace", event.target.value)}>{workplaces.map(place => <option key={place}>{place}</option>)}</Select></FormField>
        </FieldRow>
        <FieldRow>
          <FormField label="Experience" required error={errors.experience}><Select value={draft.experience} onChange={event => set("experience", event.target.value)}><option value="">Choose experience</option>{experienceLevels.map(level => <option key={level}>{level}</option>)}</Select></FormField>
          <FormField label="Career level" optional><Select value={draft.level} onChange={event => set("level", event.target.value)}><option value="">Any level</option>{careerLevels.map(level => <option key={level}>{level}</option>)}</Select></FormField>
        </FieldRow>
      </fieldset>}

      {step === 1 && <fieldset className="post-fieldset">
        <legend className="sr-only">The details</legend>
        <div className="post-salary">
          <FieldRow>
            <FormField label="Salary from (₦ / month)" optional><Input inputMode="numeric" value={draft.salaryMin} onChange={event => set("salaryMin", event.target.value.replace(/\D/g, ""))} placeholder="120000" disabled={draft.hideSalary} /></FormField>
            <FormField label="Salary to (₦ / month)" optional error={errors.salaryMax}><Input inputMode="numeric" value={draft.salaryMax} onChange={event => set("salaryMax", event.target.value.replace(/\D/g, ""))} placeholder="250000" disabled={draft.hideSalary} /></FormField>
          </FieldRow>
          <Checkbox label="Don't show the salary" description="Listings with a salary range usually get more relevant applicants." checked={draft.hideSalary} onChange={event => set("hideSalary", event.target.checked)} />
        </div>
        <FormField label="Description" required error={errors.description} hint="What the role is for, who it works with, and why it matters."><Textarea rows={6} value={draft.description} onChange={event => set("description", event.target.value)} /></FormField>
        <FormField label="Responsibilities" optional hint="One per line."><Textarea rows={4} value={draft.responsibilities} onChange={event => set("responsibilities", event.target.value)} /></FormField>
        <FormField label="Requirements" required error={errors.requirements} hint="One per line — qualifications, experience, anything essential."><Textarea rows={4} value={draft.requirements} onChange={event => set("requirements", event.target.value)} /></FormField>
        <FormField label="Skills" optional hint={`Press Enter or comma to add. ${draft.skills.length}/10`}>
          <div className="skill-input">
            {draft.skills.map(skill => <span key={skill} className="skill-chip">{skill}<button type="button" onClick={() => set("skills", draft.skills.filter(item => item !== skill))} aria-label={`Remove ${skill}`}><X size={12} /></button></span>)}
            <input value={skillInput} onChange={event => setSkillInput(event.target.value)} onKeyDown={onSkillKey} onBlur={() => addSkill(skillInput)} placeholder={draft.skills.length ? "" : "e.g. Bookkeeping"} aria-label="Add a skill" />
          </div>
        </FormField>
      </fieldset>}

      {step === 2 && <fieldset className="post-fieldset">
        <legend className="sr-only">Applications</legend>
        <FormField label="Closing date" required error={errors.deadline} hint="Listings stay visible for up to 30 days."><Input type="date" min={inDays(1)} value={draft.deadline} onChange={event => set("deadline", event.target.value)} /></FormField>
        <fieldset className="post-apply">
          <legend className="field-label">How should people apply? <span className="field-required" aria-hidden="true">*</span></legend>
          <Radio name="apply" label={<><strong>Apply on ADDOZ</strong> — applications arrive in your employer dashboard</>} checked={draft.apply === "addoz"} onChange={() => set("apply", "addoz")} />
          <Radio name="apply" label={<><strong>By email</strong> — candidates send their CV to your inbox</>} checked={draft.apply === "email"} onChange={() => set("apply", "email")} />
          {draft.apply === "email" && <FormField label="Application email" required error={errors.applyEmail}><Input type="email" value={draft.applyEmail} onChange={event => set("applyEmail", event.target.value)} placeholder="careers@yourcompany.com" /></FormField>}
          <Radio name="apply" label={<><strong>On our website</strong> — link to your own application page</>} checked={draft.apply === "website"} onChange={() => set("apply", "website")} />
          {draft.apply === "website" && <FormField label="Application link" required error={errors.applyUrl}><Input type="url" value={draft.applyUrl} onChange={event => set("applyUrl", event.target.value)} placeholder="https://" /></FormField>}
        </fieldset>
        <div className={cn("field", errors.confirm && "is-invalid")}>
          <Checkbox label="I confirm this is a genuine vacancy and the details are accurate." checked={draft.confirm} onChange={event => set("confirm", event.target.checked)} aria-invalid={errors.confirm ? true : undefined} />
          {errors.confirm && <p className="field-error" role="alert">{errors.confirm}</p>}
        </div>
      </fieldset>}

      <PrototypeNote compact title="UI only"><span id="post-proto">Nothing is saved or published from this prototype.</span></PrototypeNote>

      <div className="post-nav">
        {step > 0 ? <ActionButton variant="ghost" onClick={() => go(step - 1)} icon={<ArrowLeft size={17} aria-hidden="true" />}>Back</ActionButton> : <span />}
        <button type="button" className="action-button action-light post-preview-button" onClick={() => setPreviewOpen(true)}><Eye size={17} aria-hidden="true" />Preview</button>
        <ActionButton type="submit" variant={step === steps.length - 1 ? "primary" : "dark"} loading={status === "submitting"}>
          {step === steps.length - 1 ? (context === "edit" ? "Save changes" : "Review & publish") : <>Continue <ArrowRight size={17} aria-hidden="true" /></>}
        </ActionButton>
      </div>
    </form>

    <aside className="post-aside" aria-label="Live preview">
      <p className="post-aside-label">Live preview</p>
      {preview}
      <p className="post-aside-note">This is how your listing will appear to candidates.</p>
    </aside>

    <Modal open={previewOpen} onOpenChange={setPreviewOpen} title="Listing preview" eyebrow="How candidates see it">{preview}</Modal>
  </div>
}

function JobPreview({ draft }: { draft: JobDraft }) {
  const area = areas.find(item => item.slug === draft.location)
  const salary = draft.hideSalary ? "Salary not shown" : formatSalaryCompact(draft.salaryMin || draft.salaryMax ? { min: Number(draft.salaryMin) || undefined, max: Number(draft.salaryMax) || undefined, period: "month" } : null)
  return <article className="job-card post-preview" aria-label="Preview of your listing">
    <div className="job-card-head">
      <span className="job-mark mark-yellow" aria-hidden="true">{(draft.title.trim()[0] ?? "✳").toUpperCase()}</span>
      <p className="job-card-company"><span>{draft.company || "Your company"}</span><span>{area?.name ?? "Location"} · {draft.workplace}</span></p>
    </div>
    <h3 className="job-card-title">{draft.title || "Your job title"}</h3>
    <p className="job-card-meta"><span>{draft.category || "Category"}</span><span>{draft.type}</span>{draft.experience && <span>{draft.experience}</span>}</p>
    {draft.skills.length > 0 && <p className="job-card-skills">{draft.skills.map(skill => <span key={skill}>{skill}</span>)}</p>}
    <div className="job-card-foot">
      <span className="job-salary tabular">{salary}</span>
      <span className="job-posted"><MapPin size={12} aria-hidden="true" /> Closes {draft.deadline ? formatDate(draft.deadline) : "—"}</span>
    </div>
  </article>
}
