"use client"

import { useRef, useState, type CSSProperties, type ReactNode } from "react"
import Link from "next/link"
import { ArrowUpRight, Bookmark, Check, ChevronDown, FileText, MapPin, MessagesSquare, Search } from "lucide-react"
import { gsap, ScrollTrigger, useGSAP, reducedMotion } from "@/lib/motion"
import { cn } from "@/lib/utils"
import { ScrambleLabel } from "./scramble-label"

const steps = [
  { label: "Search", title: "Find your possibilities.", body: "Search roles across Nigeria by title, skill or location. Start with what you know — or simply a little curiosity.", crumb: "Jobs · Search" },
  { label: "Discover", title: "Less noise. More you.", body: "Filter by category, job type, experience and salary. Save the roles worth a second look and skip the rest.", crumb: "Jobs · 3 matches" },
  { label: "Apply", title: "Make your move.", body: "Clear details on the role, the requirements and the employer. When it fits, apply through ADDOZ in a few steps.", crumb: "Product Designer · Apply" },
  { label: "Move forward", title: "Keep the next step in view.", body: "Follow each application from sent to interview, and walk in prepared with Career Intelligence.", crumb: "My applications" },
] as const

/**
 * Career journey (Directive 008): one product stage + one active step.
 * Desktop (≥1024 × ≥700, motion on): the section pins and scrolling moves through
 * the four steps — the stage, copy and progress follow. Everywhere else the steps
 * are tabs, so the story is the same without scroll-jacking.
 */
export function CareerJourney() {
  const root = useRef<HTMLElement>(null)
  const [active, setActive] = useState(0)
  const activeRef = useRef(0)
  const pin = useRef<ScrollTrigger | null>(null)

  const show = (index: number) => {
    if (index === activeRef.current) return
    activeRef.current = index
    setActive(index)
  }

  useGSAP(() => {
    const mm = gsap.matchMedia()
    mm.add("(min-width: 1024px) and (min-height: 700px) and (prefers-reduced-motion: no-preference)", () => {
      const section = root.current!
      const fill = section.querySelector(".journey-rail-fill")
      pin.current = ScrollTrigger.create({
        trigger: section,
        pin: section.querySelector<HTMLElement>(".journey-pin"),
        start: "top top",
        end: () => `+=${Math.round(window.innerHeight * 2.4)}`,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: self => {
          gsap.set(fill, { scaleY: self.progress })
          show(Math.min(steps.length - 1, Math.floor(self.progress * steps.length)))
        },
      })
      section.dataset.pinned = "true"
      return () => { pin.current = null; delete section.dataset.pinned }
    })
    return () => mm.revert()
  }, { scope: root })

  // Each state builds itself when it becomes the active one (reverted on change)
  useGSAP(() => {
    if (reducedMotion()) return
    const screen = root.current?.querySelector(`[data-screen="${active}"]`)
    if (!screen) return
    const q = gsap.utils.selector(screen)
    const tl = gsap.timeline({ delay: 0.2, defaults: { ease: "power3.out", duration: 0.45 } })
    if (active === 0) {
      tl.fromTo(q(".js-typed"), { clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)", duration: 0.9, ease: "steps(16)" })
        .from(q(".js-rise"), { y: 10, opacity: 0, stagger: 0.07 }, "-=0.1")
    } else if (active === 1) {
      tl.from(q(".js-chip"), { y: 6, opacity: 0, stagger: 0.06, duration: 0.3 })
        .from(q(".js-row"), { y: 14, opacity: 0, stagger: 0.08 }, "-=0.1")
        .from(q(".js-save"), { scale: 0.4, duration: 0.5, ease: "back.out(3)" }, "-=0.1")
    } else if (active === 2) {
      tl.from(q(".js-file"), { x: -14, opacity: 0 })
        .from(q(".js-tick"), { scale: 0, duration: 0.4, ease: "back.out(2.5)" }, "-=0.15")
        .from(q(".js-sent"), { y: 14, opacity: 0 }, "+=0.25")
    } else {
      tl.from(q(".js-fill"), { scaleX: 0, transformOrigin: "left center", duration: 0.9, ease: "power2.inOut" })
        .from(q(".js-dot"), { scale: 0, stagger: 0.14, duration: 0.35, ease: "back.out(2)" }, 0.05)
        .from(q(".js-nudge"), { y: 14, opacity: 0 }, "-=0.2")
    }
  }, { scope: root, dependencies: [active], revertOnUpdate: true })

  function go(index: number) {
    const trigger = pin.current
    if (!trigger) { show(index); return }
    const y = trigger.start + (trigger.end - trigger.start) * ((index + 0.5) / steps.length)
    window.scrollTo({ top: y, behavior: "smooth" })
  }

  const step = steps[active]
  return <section id="your-path" ref={root} className="journey" aria-labelledby="journey-title" style={{ "--journey-step": active } as CSSProperties}>
    <div className="journey-pin">
      <div className="journey-grid">
        <div className="journey-copy">
          <p className="eyebrow"><span className="eyebrow-line" /><ScrambleLabel text="A LITTLE DIRECTION. A BIG DIFFERENCE." /></p>
          <h2 id="journey-title" data-reveal>Big ambitions.<br />Simple next steps.</h2>

          <div className="journey-steps-wrap">
            <span className="journey-rail" aria-hidden="true"><span className="journey-rail-fill" /></span>
            <ol className="journey-steps">
              {steps.map((item, index) => <li key={item.label} className={cn("journey-step", index === active && "is-active", index < active && "is-done")}>
                <button type="button" className="journey-step-trigger" aria-current={index === active ? "step" : undefined} onClick={() => go(index)}>
                  <span className="journey-step-number">{String(index + 1).padStart(2, "0")}</span>
                  <span className="journey-step-label">{item.label}</span>
                </button>
                <div className="journey-step-body">
                  <div>
                    <h3>{item.title}</h3>
                    <p>{item.body}</p>
                  </div>
                </div>
              </li>)}
            </ol>
          </div>
        </div>

        <div className="journey-stage-col">
          <div className="journey-stage" aria-hidden="true">
            <div className="stage-bar">
              <span className="stage-brand">addoz<span>.</span></span>
              <span className="stage-crumb">{step.crumb}</span>
              <span className="stage-count tabular">{String(active + 1).padStart(2, "0")} / 04</span>
            </div>
            <div className="stage-screens">
              <SearchScreen active={active === 0} />
              <DiscoverScreen active={active === 1} />
              <ApplyScreen active={active === 2} />
              <ForwardScreen active={active === 3} />
            </div>
          </div>
          <p className="journey-caption" aria-live="polite"><strong>{step.title}</strong> {step.body}</p>
          <p className="stage-note">Illustrative product preview</p>
        </div>

        <div className="journey-cta-wrap">
          <Link href="/jobs" className="action-button action-dark">Let&apos;s find your fit <ArrowUpRight size={17} aria-hidden="true" /></Link>
        </div>
      </div>
    </div>
  </section>
}

function Screen({ index, active, className, children }: { index: number; active: boolean; className: string; children: ReactNode }) {
  return <div className={cn("stage-screen", className, active && "is-active")} data-screen={index}>{children}</div>
}

function SearchScreen({ active }: { active: boolean }) {
  return <Screen index={0} active={active} className="screen-search">
    <p className="screen-kicker">Find your next move</p>
    <div className="screen-searchbar">
      <span className="screen-field"><Search size={16} /><span className="js-typed">Product designer</span><i className="screen-caret" /></span>
      <span className="screen-field screen-field-location"><MapPin size={15} />Lagos<ChevronDown size={14} /></span>
      <span className="screen-button">Find jobs</span>
    </div>
    <div className="screen-chips js-rise"><span>Popular</span><em>Design &amp; Creative</em><em>Development &amp; IT</em><em>Remote</em></div>
    <div className="screen-results js-rise">
      <span className="screen-result"><i className="screen-mark mark-yellow">✳</i><span><b /><small /></span></span>
      <span className="screen-result"><i className="screen-mark mark-blue">&lt;/&gt;</i><span><b /><small /></span></span>
    </div>
  </Screen>
}

function DiscoverScreen({ active }: { active: boolean }) {
  const rows = [
    { mark: "✳", tone: "mark-yellow", title: "Product Designer", meta: "Sample Creative Studio · Victoria Island", pay: "₦350k – ₦600k", saved: true },
    { mark: "</>", tone: "mark-blue", title: "Frontend Developer", meta: "Sample Tech Employer · Ikeja · Remote", pay: "₦400k – ₦700k", saved: false },
    { mark: "Br", tone: "mark-orange", title: "Brand Designer", meta: "Sample Creative Studio · Lekki", pay: "₦300k – ₦450k", saved: false },
  ]
  return <Screen index={1} active={active} className="screen-discover">
    <div className="screen-filterbar">
      <span className="screen-count"><b>3</b> roles match</span>
      <span className="screen-chip is-on js-chip"><Check size={12} />Lagos</span>
      <span className="screen-chip is-on js-chip"><Check size={12} />3–5 years</span>
      <span className="screen-chip is-on js-chip"><Check size={12} />Hybrid &amp; remote</span>
    </div>
    <div className="screen-rows">
      {rows.map(row => <span key={row.title} className="screen-row js-row">
        <i className={cn("screen-mark", row.tone)}>{row.mark}</i>
        <span className="screen-row-main"><b>{row.title}</b><small>{row.meta}</small></span>
        <span className="screen-pay tabular">{row.pay}</span>
        <Bookmark className={cn("screen-bookmark", row.saved && "is-saved js-save")} size={16} fill={row.saved ? "currentColor" : "none"} />
      </span>)}
    </div>
  </Screen>
}

function ApplyScreen({ active }: { active: boolean }) {
  return <Screen index={2} active={active} className="screen-apply">
    <div className="screen-jobhead">
      <i className="screen-mark mark-yellow">✳</i>
      <span><b>Product Designer</b><small>Sample Creative Studio · Victoria Island · Hybrid</small></span>
    </div>
    <div className="screen-form">
      <span className="screen-label">Your CV</span>
      <span className="screen-file js-file"><FileText size={16} /><span>my-cv.pdf</span><i className="screen-tick js-tick"><Check size={12} strokeWidth={3} /></i></span>
      <span className="screen-label">A short note</span>
      <span className="screen-note"><b /><b /><b /></span>
      <span className="screen-submit">Submit application</span>
    </div>
    <div className="screen-sent js-sent"><i><Check size={16} strokeWidth={3} /></i><span><b>Application sent.</b><small>Your next team will be in touch.</small></span></div>
  </Screen>
}

function ForwardScreen({ active }: { active: boolean }) {
  const stages = ["Applied", "In review", "Interview", "Offer"]
  return <Screen index={3} active={active} className="screen-forward">
    <div className="screen-jobhead">
      <i className="screen-mark mark-yellow">✳</i>
      <span><b>Product Designer</b><small>Sample Creative Studio</small></span>
      <em className="screen-status">Interview stage</em>
    </div>
    <div className="screen-track">
      <span className="screen-track-line"><span className="screen-track-fill js-fill" /></span>
      {stages.map((stage, index) => <span key={stage} className={cn("screen-stage", index < 2 && "is-done", index === 2 && "is-now")}><i className="js-dot">{index < 2 ? <Check size={11} strokeWidth={3} /> : null}</i>{stage}</span>)}
    </div>
    <div className="screen-next js-nudge">
      <i className="screen-mark mark-blue">&lt;/&gt;</i>
      <span><b>Frontend Developer</b><small>Sample Tech Employer</small></span>
      <em>In review</em>
    </div>
    <div className="screen-nudge js-nudge">
      <i><MessagesSquare size={17} /></i>
      <span><b>Interview Prep</b><small>Walk in a little more ready.</small></span>
      <ArrowUpRight size={16} />
    </div>
  </Screen>
}
