"use client"

import { useEffect, useLayoutEffect, useRef, useState } from "react"
import Link from "next/link"
import { ArrowUpRight, BriefcaseBusiness, CalendarClock, Clock3, GraduationCap, Layers, Link2, MapPin, Wallet } from "lucide-react"
import { gsap, reducedMotion } from "@/lib/motion"
import { formatDate, formatSalary, formatSalaryCompact } from "@/lib/format"
import { Breadcrumbs, useToast } from "@/components/patterns"
import { getCompany } from "@/features/companies/data"
import { getCategoryByName } from "@/features/categories/data"
import { getArea, getState } from "@/features/locations/data"
import type { Job } from "../data"
import { playJobArrival } from "../transition"
import { JobCard } from "./job-card"
import { SaveJobButton } from "./save-job-button"
import { ApplyFlow } from "@/features/applications/components/apply-flow"
import type { Viewer } from "../public-data"
import { CompanyMark } from "@/features/companies/components/company-mark"

/**
 * Job detail (Directive 008): editorial header, scannable facts, calm reading column.
 * Arriving from a card, the mark and title fly in from where they were (Flip).
 */
export function JobDetail({ job, viewer, related, companyOverride, locationOverride, categoryOverride, previewStatus }: { job: Job; viewer: Viewer; related: Job[]; previewStatus?: string; companyOverride?: { name: string; industry?: string | null; overview?: string | null; mark?: string | null; tone?: string | null; logo?: string | null }; locationOverride?: { name: string; stateName?: string | null }; categoryOverride?: { name: string; slug: string } }) {
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
    { icon: MapPin, label: "Location", value: [locationOverride?.name ?? area?.name, locationOverride?.stateName ?? state?.name].filter(Boolean).join(", ") },
    { icon: BriefcaseBusiness, label: "Workplace", value: job.workplace },
    { icon: Clock3, label: "Job type", value: job.type },
    { icon: Layers, label: "Career level", value: job.level },
    { icon: GraduationCap, label: "Experience", value: job.experience },
  ]

  return <article className="job-detail" ref={root}>
    {previewStatus && <p className="job-preview-banner" role="status"><strong>Preview</strong> — this job is <strong>{previewStatus === "Pending" ? "awaiting review" : previewStatus.toLowerCase()}</strong> and isn&apos;t visible to the public.</p>}
    <header className="job-hero">
      <Breadcrumbs items={[{ label: "Jobs", href: "/jobs" }, ...(category ? [{ label: category.name, href: `/jobs?category=${category.slug}` }] : []), { label: job.title }]} />
      <div className="job-hero-grid">
        <div className="job-hero-main">
          <div className="job-hero-id">
            <CompanyMark className="job-mark job-mark-large" mark={job.mark} tone={job.tone ?? (job.color === "blue" ? "purple" : job.color)} logo={job.logo} flipId={`job-mark-${job.slug}`} />
            <p><strong>{company?.name}</strong><span>{[company?.industry, locationOverride?.name ?? area?.name].filter(Boolean).join(" · ")}</span></p>
          </div>
          <h1 data-flip-id={`job-title-${job.slug}`}>{job.title}</h1>
          <ul className="job-hero-facts" aria-label="Key facts">
            {facts.map(fact => <li key={fact.label}><fact.icon size={15} aria-hidden="true" /><span className="sr-only">{fact.label}: </span>{fact.value}</li>)}
          </ul>
        </div>
        <div className="job-hero-side" data-arrive>
          <p className="job-hero-salary tabular"><Wallet size={16} aria-hidden="true" />{formatSalaryCompact(job.salary)}</p>
          <div className="job-hero-actions">
            <ApplyFlow jobSlug={job.slug} applied={Boolean(job.applied)} jobTitle={job.title} companyName={company?.name ?? job.company} viewer={viewer} autoOpen />
            <SaveJobButton slug={job.slug} title={job.title} saved={job.saved} variant="button" />
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
          <CompanyMark className="company-mark" mark={company.mark ?? ""} tone={company.tone} logo={"logo" in company ? company.logo : undefined} />
          <h2 id="company-title">{company.name}</h2>
          <p>{company.overview}</p>
          {job.sample && <span className="sample-tag">Sample employer</span>}
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
      <ApplyFlow jobSlug={job.slug} applied={Boolean(job.applied)} jobTitle={job.title} companyName={company?.name ?? job.company} viewer={viewer} />
    </div>

  </article>
}
