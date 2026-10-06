"use client"

import { useMemo, useRef, useState } from "react"
import { flushSync } from "react-dom"
import Link from "next/link"
import { ArrowUpRight, Bookmark } from "lucide-react"
import { Flip, gsap, reducedMotion, useGSAP } from "@/lib/motion"
import { cn } from "@/lib/utils"
import type { Job } from "@/features/jobs/data"
import { JobCard } from "@/features/jobs/components/job-card"
import { ScrambleLabel } from "./scramble-label"

const tabs: { id: string; label: string; noun: string; test?: (job: Job) => boolean }[] = [
  { id: "all", label: "All roles", noun: "roles" },
  { id: "full-time", label: "Full-time", noun: "full-time roles", test: job => job.type === "Full-time" },
  { id: "remote", label: "Remote", noun: "remote roles", test: job => job.workplace === "Remote" },
  { id: "entry", label: "Entry level", noun: "entry-level roles", test: job => job.level === "Fresher" || job.level === "Junior" },
  { id: "saved", label: "Saved", noun: "saved roles" },
]
const LIMIT = 6

/**
 * The opportunity board: a calm preview of the jobs browser. Tabs reflow the grid
 * with Flip; everything else (search, filters, paging) lives on /jobs.
 */
export function JobDiscovery({ jobs }: { jobs: Job[] }) {
  const root = useRef<HTMLElement>(null)
  const [tab, setTab] = useState("all")
  const active = tabs.find(item => item.id === tab)!
  // Live roles from the marketplace; "Saved" reflects the signed-in candidate's saved jobs
  const matching = useMemo(() => {
    if (tab === "saved") return jobs.filter(job => job.saved)
    return active.test ? jobs.filter(active.test) : jobs
  }, [tab, active, jobs])
  const visible = matching.slice(0, LIMIT)
  const savedCount = jobs.filter(job => job.saved).length

  const { contextSafe } = useGSAP(() => {
    const mm = gsap.matchMedia()
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      // The grid arrives as one group — the cards themselves don't each perform
      gsap.from(".board-grid", { y: 28, opacity: 0, duration: 0.8, ease: "power3.out", clearProps: "opacity,transform", scrollTrigger: { trigger: ".board-grid", start: "top 90%", once: true } })
    })
    return () => mm.revert()
  }, { scope: root })

  const change = (next: string) => contextSafe(() => {
    if (next === tab) return
    const state = Flip.getState(root.current!.querySelectorAll(".board-grid .job-card"))
    flushSync(() => setTab(next))
    if (reducedMotion()) return
    Flip.from(state, {
      targets: root.current!.querySelectorAll(".board-grid .job-card"),
      duration: 0.5, ease: "power3.inOut", absoluteOnLeave: true,
      onEnter: cards => gsap.fromTo(cards, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.35, delay: 0.12, clearProps: "opacity,transform" }),
      onLeave: cards => gsap.to(cards, { opacity: 0, duration: 0.2 }),
    })
  })()

  return <section ref={root} id="jobs" className="board section-pad" aria-labelledby="jobs-title">
    <div className="section-heading">
      <div>
        <p className="eyebrow"><span className="eyebrow-line" /><ScrambleLabel text="THE OPPORTUNITY BOARD" /></p>
        <h2 id="jobs-title" data-reveal>Your next “I got the job.” <br className="desktop-break" />starts right here.</h2>
      </div>
      <div className="section-heading-aside">
        <p>Find a role that fits your skills. And the life you want to build.</p>
        <Link href="/jobs" className="text-link">Browse all jobs <ArrowUpRight size={16} aria-hidden="true" /></Link>
      </div>
    </div>

    <div className="board-toolbar">
      <div className="board-tabs" role="group" aria-label="Show roles">
        {tabs.map(item => <button key={item.id} type="button" className={cn("board-tab", tab === item.id && "is-active")} aria-pressed={tab === item.id} onClick={() => change(item.id)}>
          {item.label}{item.id === "saved" && savedCount > 0 && <span className="board-tab-count">{savedCount}</span>}
        </button>)}
      </div>
      <p className="board-count" aria-live="polite"><strong className="tabular">{visible.length}</strong> of {matching.length} {active.noun}</p>
    </div>

    {visible.length > 0
      ? <div className="job-grid board-grid">{visible.map(job => <JobCard key={job.slug} job={job} />)}</div>
      : <div className="board-empty">
          <Bookmark size={22} aria-hidden="true" />
          <h3>{tab === "saved" ? "Nothing saved yet." : "No roles here yet."}</h3>
          <p>{tab === "saved" ? "Sign in as a candidate and tap the bookmark on any role to keep it here." : "Check back soon, or browse every live role."}</p>
          <button type="button" className="action-button action-light action-sm" onClick={() => change("all")}>Show all roles</button>
        </div>}

    <div className="board-foot">
      <p>{jobs.length ? "The newest roles on ADDOZ." : "New roles are added every day — check back soon."}</p>
      <Link href="/jobs" className="action-button action-dark">Browse all jobs <ArrowUpRight size={17} aria-hidden="true" /></Link>
    </div>
  </section>
}
