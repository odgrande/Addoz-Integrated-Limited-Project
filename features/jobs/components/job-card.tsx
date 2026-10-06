"use client"

import type { MouseEvent } from "react"
import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatSalaryCompact, postedOn } from "@/lib/format"
import { getCompany } from "@/features/companies/data"
import { getArea } from "@/features/locations/data"
import type { Job } from "../data"
import { captureJobCard } from "../transition"
import { SaveJobButton } from "./save-job-button"

/**
 * Job card (Directive 008 card level 2 — "frame"): identity → title → meta → salary.
 * The whole card opens the job (stretched title link); the bookmark sits above it.
 * Opening records the mark + title so the job page can fly them into place.
 */
export function JobCard({ job, flip = true, className }: { job: Job; flip?: boolean; className?: string }) {
  const company = getCompany(job.company)
  const area = getArea(job.location)
  const open = (event: MouseEvent<HTMLAnchorElement>) => {
    const card = event.currentTarget.closest(".job-card")
    if (card) captureJobCard(card, job.slug)
  }
  return <article className={cn("job-card", className)} data-flip-id={flip ? `card-${job.slug}` : undefined}>
    <div className="job-card-head">
      <span className={cn("job-mark", `mark-${job.color}`)} data-flip-id={`job-mark-${job.slug}`} aria-hidden="true">{job.mark}</span>
      <p className="job-card-company"><span>{job.companyName ?? company?.name ?? "Employer"}</span><span>{[job.locationName ?? area?.name, job.workplace].filter(Boolean).join(" · ")}</span></p>
      <SaveJobButton slug={job.slug} title={job.title} saved={job.saved} />
    </div>
    <h3 className="job-card-title" data-flip-id={`job-title-${job.slug}`}><Link href={`/jobs/${job.slug}`} className="job-title-link" onClick={open}>{job.title}</Link></h3>
    <p className="job-card-meta">{job.featured && <span className="job-tag-featured">Featured</span>}<span>{job.type}</span><span>{job.level}</span><span>{job.experience}</span></p>
    <div className="job-card-foot">
      <p className="job-card-pay"><span className="job-salary tabular">{formatSalaryCompact(job.salary)}</span><span className="job-posted">{postedOn(job.postedAt)}</span></p>
      <ArrowUpRight className="job-card-arrow" size={18} aria-hidden="true" />
    </div>
  </article>
}

/** Compact row for lists (company, category, location and app pages). Wrap in <ul className="job-list">. */
export function JobRow({ job }: { job: Job }) {
  const company = getCompany(job.company)
  const area = getArea(job.location)
  const open = (event: MouseEvent<HTMLAnchorElement>) => {
    const row = event.currentTarget.closest(".job-row")
    if (row) captureJobCard(row, job.slug)
  }
  return <li className="job-row">
    <span className={cn("job-mark", `mark-${job.color}`)} data-flip-id={`job-mark-${job.slug}`} aria-hidden="true">{job.mark}</span>
    <div className="job-row-main">
      <Link href={`/jobs/${job.slug}`} onClick={open} className="job-row-title"><strong data-flip-id={`job-title-${job.slug}`}>{job.title}</strong></Link>
      <span className="job-row-meta">{[job.companyName ?? company?.name, job.locationName ?? area?.name, job.type, job.workplace].filter(Boolean).join(" · ")}</span>
    </div>
    <span className="job-row-salary tabular">{formatSalaryCompact(job.salary)}</span>
    <SaveJobButton slug={job.slug} title={job.title} saved={job.saved} />
  </li>
}
