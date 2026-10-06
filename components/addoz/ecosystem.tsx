"use client"

import Image from "next/image"
import Link from "next/link"
import { useRef } from "react"
import { ArrowUpRight, Asterisk, Check, FileSearch, MessagesSquare, PencilLine, ScanLine } from "lucide-react"
import { gsap, useGSAP } from "@/lib/motion"
import { cn } from "@/lib/utils"
import { employerProposition } from "@/features/content/testimonials"
import { ScrambleLabel } from "./scramble-label"

/** Employers — the yellow opportunity moment: statement, one photograph, three facts. */
export function EmployerSection() {
  const root = useRef<HTMLElement>(null)
  useGSAP(() => {
    const mm = gsap.matchMedia()
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.from(".employer-lead, .employer-actions", { y: 18, opacity: 0, duration: 0.7, ease: "power3.out", stagger: 0.08, clearProps: "opacity,transform", scrollTrigger: { trigger: ".employer-copy", start: "top 75%", once: true } })
      // The photograph unmasks upward while its crop settles; the note follows
      gsap.timeline({ defaults: { ease: "expo.out" }, scrollTrigger: { trigger: ".employer-visual", start: "top 80%", once: true } })
        .fromTo(".employer-photo", { clipPath: "inset(100% 0 0 0)" }, { clipPath: "inset(0% 0 0 0)", duration: 1.1, clearProps: "clipPath" })
        .fromTo(".employer-photo img", { scale: 1.2 }, { scale: 1.06, duration: 1.4 }, 0)
        .from(".employer-note", { y: 16, opacity: 0, duration: 0.6, clearProps: "opacity,transform" }, 0.5)
      gsap.from(".employer-benefits > li", { y: 16, opacity: 0, duration: 0.6, ease: "power3.out", stagger: 0.08, clearProps: "opacity,transform", scrollTrigger: { trigger: ".employer-benefits", start: "top 90%", once: true } })
    })
    mm.add("(min-width: 900px) and (prefers-reduced-motion: no-preference)", () => {
      // The crop drifts slower than the page
      gsap.fromTo(".employer-photo img", { yPercent: -3 }, { yPercent: 3, ease: "none", scrollTrigger: { trigger: ".employer-visual", start: "top bottom", end: "bottom top", scrub: true } })
    })
    return () => mm.revert()
  }, { scope: root })

  return <section ref={root} id="employers" className="employer section-pad" aria-labelledby="employer-title">
    <div className="employer-grid">
      <div className="employer-copy">
        <p className="eyebrow"><span className="eyebrow-line" /><ScrambleLabel text="GOOD PEOPLE CHANGE EVERYTHING." /></p>
        <h2 id="employer-title" className="employer-title" data-reveal>Your next great hire? <br className="desktop-break" />They&apos;re out there.</h2>
        <p className="employer-lead">Find professionals across skills and experience levels. Post a role, review applicants, and build your next chapter with the right people.</p>
        <div className="employer-actions">
          <Link href="/for-employers/post-a-job" className="action-button action-dark" data-magnetic>Post a job for free <ArrowUpRight size={17} aria-hidden="true" /></Link>
          <Link href="/for-employers" className="text-link">Explore the employer experience <ArrowUpRight size={15} aria-hidden="true" /></Link>
        </div>
      </div>
      <div className="employer-visual">
        <figure className="employer-photo"><Image src="/images/team-editorial.png" alt="Nigerian professionals sharing ideas around a studio table" fill sizes="(max-width: 899px) 92vw, 46vw" /></figure>
        <p className="employer-note"><Asterisk size={18} strokeWidth={2.5} aria-hidden="true" /><span>Great work. <strong>Starts with great people.</strong></span></p>
      </div>
    </div>
    <ul className="employer-benefits" aria-label="Posting on ADDOZ">
      {employerProposition.benefits.map((benefit, index) => <li key={benefit.title}>
        <span className="employer-benefit-number">{String(index + 1).padStart(2, "0")}</span>
        <h3>{benefit.title}</h3>
        <p>{benefit.body}</p>
      </li>)}
    </ul>
  </section>
}

const tools = [
  { name: "Resume Scanner", detail: "Get your CV past the first look.", body: "Check your resume against applicant tracking systems and see where it can work harder for you.", Icon: FileSearch, href: "/career-tools/resume-scanner", label: "CHECK MY RESUME" },
  { name: "Interview Prep", detail: "Walk in a little more ready.", body: "Explore interview questions tailored to a role, and turn preparation into confidence.", Icon: MessagesSquare, href: "/career-tools/interview-prep", label: "PREPARE FOR MY INTERVIEW" },
  { name: "Cover Letter", detail: "Your story. Well told.", body: "Find the words to show an employer why you and this opportunity belong together.", Icon: PencilLine, href: "/career-tools/cover-letter", label: "WRITE MY COVER LETTER" },
]

/** Career Intelligence — three tools as one bento: a feature card and two quieter ones. */
export function CareerIntelligence() {
  return <section id="intelligence" className="tools section-pad" aria-labelledby="tools-title">
    <div className="section-heading">
      <div>
        <p className="eyebrow"><Asterisk size={14} strokeWidth={2.5} aria-hidden="true" /><ScrambleLabel text="ADDOZ CAREER INTELLIGENCE" /></p>
        <h2 id="tools-title" data-reveal>A little extra edge. <br className="desktop-break" /><span className="text-purple">A lot more you.</span></h2>
      </div>
      <div className="section-heading-aside"><p>Your potential, with better tools. AI-powered support for the moments that move your career forward.</p></div>
    </div>
    <div className="tools-grid">
      {tools.map(({ name, detail, body, Icon, href, label }, index) => <Link key={name} data-tool-card className={cn("tool-card", index === 0 && "tool-feature")} href={href}>
        <div className="tool-card-top">
          <span className="tool-icon"><Icon size={22} strokeWidth={1.6} aria-hidden="true" /></span>
          <span className="tool-index">0{index + 1}</span>
        </div>
        {index === 0 && <div className="resume-visual" aria-hidden="true">
          <div className="resume-sheet"><span className="resume-avatar" /><div className="resume-name"><span /><span /></div><div className="resume-lines"><i /><i /><i /><i /></div><div className="resume-lines"><i /><i /></div></div>
          <div className="resume-check"><ScanLine size={15} /><span>A clearer picture of your CV</span><Check size={15} /></div>
        </div>}
        <div className="tool-copy">
          <h3>{name}</h3>
          <p className="tool-detail">{detail}</p>
          <p className="tool-body">{body}</p>
          <span className="tool-link"><ScrambleLabel text={label} trigger="hover" /><ArrowUpRight size={15} aria-hidden="true" /></span>
        </div>
      </Link>)}
    </div>
    <p className="tools-note">Instant checks work today — personalised AI analysis is coming soon. Your documents stay in your browser.</p>
  </section>
}
