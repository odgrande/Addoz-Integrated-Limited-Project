"use client"

import { useEffect, useLayoutEffect, useRef, useState, type FormEvent } from "react"
import Link from "next/link"
import { ArrowUpRight, BriefcaseBusiness, CalendarClock, CircleCheck, Clock3, GraduationCap, Layers, Link2, MapPin, Wallet } from "lucide-react"
import { gsap, reducedMotion } from "@/lib/motion"
import { formatDate, formatSalary, formatSalaryCompact } from "@/lib/format"
import { ActionButton, Breadcrumbs, Checkbox, FileDrop, FormField, Input, Modal, Textarea, useToast } from "@/components/patterns"
import { getCompany } from "@/features/companies/data"
import { getCategoryByName } from "@/features/categories/data"
import { getArea, getState } from "@/features/locations/data"
import type { Job } from "../data"
import { playJobArrival } from "../transition"
import { JobCard } from "./job-card"
import { SaveJobButton } from "./save-job-button"
import { CandidateApplyButton } from "@/features/candidates/components/candidate-ui"

/**
 * Job detail (Directive 008): editorial header, scannable facts, calm reading column.
 * Arriving from a card, the mark and title fly in from where they were (Flip).
 */
export function JobDetail({ job, related, companyOverride, locationOverride, categoryOverride }: { job: Job; related: Job[]; companyOverride?: { name: string; industry?: string | null; overview?: string | null; mark?: string | null; tone?: string | null }; locationOverride?: { name: string; stateName?: string | null }; categoryOverride?: { name: string; slug: string } }) {
  const root = useRef<HTMLElement>(null)
  const [barVisible, setBarVisible] = useState(false)
  const toast = useToast()
  const company = companyOverride ?? getCompany(job.company)
  const area = getArea(job.location)
  const state = area ? getState(area.state) : undefined
  const category = categoryOverride ?? getCategoryByName(job.category)

  useLayoutEffect(() => {
    const scope = root.current
    if (!scope) return
    if (playJobArrival(scope, job.slug) || reducedMotion()) return
    const ctx = gsap.context(() => {
      gsap.timeline({ defaults: { ease: "power3.out" } })
        .from(".job-hero-id, .job-hero h1, .job-hero-facts", { y: 18, opacity: 0, duration: 0.7, stagger: 0.07, clearProps: "opacity,transform" })
        .from("[data-arrive]", { y: 18, opacity: 0, duration: 0.6, stagger: 0.06, clearProps: "opacity,transform" }, 0.2)
    }, scope)
    return () => ctx.revert()
  }, [job.slug])

  // Phones: the bottom apply bar only appears once the header's apply box is out of view
  useEffect(() => {
    const box = root.current?.querySelector(".job-hero-side")
    if (!box) return
    const observer = new IntersectionObserver(([entry]) => setBarVisible(!entry!.isIntersecting && entry!.boundingClientRect.top < 0))
    observer.observe(box)
    return () => observer.disconnect()
  }, [])

  async function share() {
    const url = window.location.href
    try {
      if (navigator.share) { await navigator.share({ title: job.title, url }); return }
      await navigator.clipboard.writeText(url)
      toast({ title: "Link copied", body: "Share it with someone who'd be great for this role." })
    } catch { /* share sheet dismissed */ }
  }

  const facts = [
    { icon: MapPin, label: "Location", value: `${locationOverride?.name ?? area?.name ?? ""}, ${locationOverride?.stateName ?? state?.name ?? ""}` },
    { icon: BriefcaseBusiness, label: "Workplace", value: job.workplace },
    { icon: Clock3, label: "Job type", value: job.type },
    { icon: Layers, label: "Career level", value: job.level },
    { icon: GraduationCap, label: "Experience", value: job.experience },
  ]

  return <article className="job-detail" ref={root}>
    <header className="job-hero">
      <Breadcrumbs items={[{ label: "Jobs", href: "/jobs" }, ...(category ? [{ label: category.name, href: `/jobs?category=${category.slug}` }] : []), { label: job.title }]} />
      <div className="job-hero-grid">
        <div className="job-hero-main">
          <div className="job-hero-id">
            <span className={`job-mark mark-${job.color} job-mark-large`} data-flip-id={`job-mark-${job.slug}`} aria-hidden="true">{job.mark}</span>
            <p><strong>{company?.name}</strong><span>{company?.industry} · {area?.name}</span></p>
          </div>
          <h1 data-flip-id={`job-title-${job.slug}`}>{job.title}</h1>
          <ul className="job-hero-facts" aria-label="Key facts">
            {facts.map(fact => <li key={fact.label}><fact.icon size={15} aria-hidden="true" /><span className="sr-only">{fact.label}: </span>{fact.value}</li>)}
          </ul>
        </div>
        <div className="job-hero-side" data-arrive>
          <p className="job-hero-salary tabular"><Wallet size={16} aria-hidden="true" />{formatSalaryCompact(job.salary)}</p>
          <div className="job-hero-actions">
            <CandidateApplyButton jobSlug={job.slug} applied={Boolean(job.applied)} jobTitle={job.title} companyName={company?.name ?? job.company} />
            <SaveJobButton slug={job.slug} title={job.title} variant="button" />
            <button type="button" className="action-button action-ghost job-share" onClick={share} aria-label="Share this role"><Link2 size={18} aria-hidden="true" /></button>
          </div>
          <p className="job-hero-dates"><CalendarClock size={14} aria-hidden="true" />Posted {formatDate(job.postedAt)} · Closes {formatDate(job.deadline)}</p>
        </div>
      </div>
      {job.sample && <p className="job-sample-note"><span className="sample-tag">Sample role</span> Illustrative listing — not a live vacancy.</p>}
    </header>

    <div className="job-body">
      <div className="job-main" data-arrive>
        <section aria-labelledby="about-role"><h2 id="about-role">About the role</h2><p className="job-summary">{job.summary}</p></section>
        <section aria-labelledby="role-do"><h2 id="role-do">What you&apos;ll do</h2><ul className="job-points">{job.responsibilities.map(item => <li key={item}>{item}</li>)}</ul></section>
        <section aria-labelledby="role-bring"><h2 id="role-bring">What you&apos;ll bring</h2><ul className="job-points">{job.requirements.map(item => <li key={item}>{item}</li>)}</ul></section>
        <section aria-labelledby="role-skills"><h2 id="role-skills">Skills</h2><ul className="job-skills">{job.skills.map(skill => <li key={skill}>{skill}</li>)}</ul></section>
      </div>

      <aside className="job-aside" data-arrive>
        <section className="job-glance" aria-labelledby="glance-title">
          <h2 id="glance-title">Role at a glance</h2>
          <dl>
            <div><dt>Salary</dt><dd className="tabular">{formatSalary(job.salary)}</dd></div>
            {facts.map(fact => <div key={fact.label}><dt>{fact.label}</dt><dd>{fact.value}</dd></div>)}
            <div><dt>Category</dt><dd>{job.category}</dd></div>
            <div><dt>Closes</dt><dd>{formatDate(job.deadline)}</dd></div>
          </dl>
        </section>
        {company && <section className="job-company" aria-labelledby="company-title">
          <span className={`company-mark tone-${company.tone}`} aria-hidden="true">{company.mark}</span>
          <h2 id="company-title">{company.name}</h2>
          <p>{company.overview}</p>
          <span className="sample-tag">Sample employer</span>
        </section>}
        <section className="job-ready" aria-labelledby="ready-title">
          <h2 id="ready-title">Get application-ready</h2>
          <Link href="/career-tools/resume-scanner"><strong>Resume Scanner</strong><span>Get your CV past the first look.</span><ArrowUpRight size={16} aria-hidden="true" /></Link>
          <Link href="/career-tools/cover-letter"><strong>Cover Letter</strong><span>Your story. Well told.</span><ArrowUpRight size={16} aria-hidden="true" /></Link>
        </section>
      </aside>
    </div>

    {related.length > 0 && <section className="job-related" aria-labelledby="related-title">
      <div className="job-related-head"><h2 id="related-title">Related roles</h2><Link href="/jobs" className="text-link">Browse all jobs <ArrowUpRight size={15} aria-hidden="true" /></Link></div>
      <div className="job-grid">{related.map(item => <JobCard key={item.slug} job={item} flip={false} />)}</div>
    </section>}

    <div className={`job-applybar${barVisible ? " is-visible" : ""}`} aria-hidden={!barVisible}>
      <span className="tabular">{formatSalaryCompact(job.salary)}</span>
      <CandidateApplyButton jobSlug={job.slug} />
    </div>

  </article>
}

type Errors = Partial<Record<"name" | "email" | "phone" | "cv" | "consent", string>>

function ApplyModal({ job, open, onOpenChange, companyName }: { job: Job; open: boolean; onOpenChange: (open: boolean) => void; companyName: string }) {
  const [status, setStatus] = useState<"form" | "sending" | "done">("form")
  const [errors, setErrors] = useState<Errors>({})
  const [cv, setCv] = useState<File | null>(null)
  const form = useRef<HTMLFormElement>(null)

  function close(next: boolean) {
    onOpenChange(next)
    if (!next) setTimeout(() => { setStatus("form"); setErrors({}); setCv(null) }, 250)
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const found: Errors = {}
    if (String(data.get("name") ?? "").trim().length < 2) found.name = "Add your full name."
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(data.get("email") ?? ""))) found.email = "Enter a valid email address."
    if (String(data.get("phone") ?? "").replace(/\D/g, "").length < 10) found.phone = "Enter a phone number we can reach you on."
    if (!cv) found.cv = "Attach your CV (PDF or Word)."
    if (!data.get("consent")) found.consent = "Please confirm you're happy to share these details."
    setErrors(found)
    if (Object.keys(found).length) { requestAnimationFrame(() => form.current?.querySelector<HTMLElement>("[aria-invalid='true'], .file-drop-button")?.focus()); return }
    setStatus("sending")
    setTimeout(() => setStatus("done"), 1000)
  }

  return <Modal open={open} onOpenChange={close} size="md" eyebrow={job.apply === "email" ? "Apply by email" : "Apply on ADDOZ"} title={status === "done" ? "Application ready." : job.title}
    description={status === "done" ? undefined : `${companyName} · Sample role`}>
    {status === "done"
      ? <div className="apply-done" role="status">
          <CircleCheck size={40} strokeWidth={1.75} aria-hidden="true" />
          <p>In the live platform this sends your application to {companyName} and adds it to your applications. <strong>This preview doesn&apos;t send anything.</strong></p>
          <div className="cluster"><ActionButton variant="dark" onClick={() => close(false)}>Done</ActionButton><ActionButton variant="ghost" href="/jobs">Keep browsing</ActionButton></div>
        </div>
      : <form ref={form} className="apply-form" onSubmit={submit} noValidate>
          <FormField label="Full name" required error={errors.name}><Input name="name" autoComplete="name" /></FormField>
          <FormField label="Email" required error={errors.email}><Input name="email" type="email" autoComplete="email" /></FormField>
          <FormField label="Phone number" required error={errors.phone}><Input name="phone" type="tel" autoComplete="tel" placeholder="+234" /></FormField>
          <div className="field">
            <span className="field-label">CV <span className="field-required" aria-hidden="true">*</span></span>
            <FileDrop accept=".pdf,.doc,.docx" label="Add your CV" hint="PDF or Word · stays on this device in the preview" onFile={file => { setCv(file); setErrors(current => ({ ...current, cv: undefined })) }} />
            {errors.cv && <p className="field-error" role="alert">{errors.cv}</p>}
          </div>
          <FormField label="A short note" optional hint="Why this role, in a line or two."><Textarea name="note" rows={3} /></FormField>
          <div className="field">
            <Checkbox name="consent" label={`Share my details with ${companyName} for this role.`} aria-invalid={errors.consent ? true : undefined} />
            {errors.consent && <p className="field-error" role="alert">{errors.consent}</p>}
          </div>
          <ActionButton type="submit" variant="primary" block loading={status === "sending"}>Submit application</ActionButton>
          <p className="apply-note">Prototype: applications aren&apos;t sent or stored.</p>
        </form>}
  </Modal>
}
