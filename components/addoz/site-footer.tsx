"use client"

import { useRef, useState, type FormEvent } from "react"
import { ArrowRight, ArrowUp, ArrowUpRight, Asterisk } from "lucide-react"
import { Logo } from "./site-header"
import { TransitionLink } from "./page-transition"
import { gsap, useGSAP, reducedMotion } from "@/lib/motion"
import { site } from "@/lib/site"
import { footerNav } from "@/components/layout/site-nav"

/** The quiet close: one line, one field. Prototype — nothing is stored or sent. */
export function Newsletter() {
  const [submitted, setSubmitted] = useState(false)
  const root = useRef<HTMLElement>(null)
  const { contextSafe } = useGSAP(() => {}, { scope: root })
  const submit = contextSafe((event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitted(true)
    if (!reducedMotion()) gsap.fromTo(".newsletter-status", { y: 6, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35 })
  })
  return <section id="newsletter" ref={root} className="newsletter section-pad" aria-labelledby="newsletter-title">
    <div className="newsletter-copy">
      <p className="eyebrow"><Asterisk size={14} strokeWidth={2.5} aria-hidden="true" /> Right opportunities. Right to your inbox.</p>
      <h2 id="newsletter-title" data-reveal>Don&apos;t miss your next thing.</h2>
    </div>
    <div className="newsletter-side">
      <p>A little less searching. Get updated with the best new jobs on ADDOZ.</p>
      <form className="newsletter-form" onSubmit={submit}>
        <label htmlFor="newsletter-email" className="sr-only">Email address for job updates</label>
        <input id="newsletter-email" name="email" type="email" required placeholder="Your email address" autoComplete="email" disabled={submitted} />
        <button type="submit" className="action-button action-primary" disabled={submitted}>Keep me posted <ArrowRight size={17} aria-hidden="true" /></button>
      </form>
      <p className="newsletter-status" role="status">{submitted ? "Thanks — this preview doesn’t store or send emails." : "Prototype form — no emails are collected or sent."}</p>
      {submitted && <button type="button" className="text-link" onClick={() => setSubmitted(false)}>Try another address</button>}
    </div>
  </section>
}

export function SiteFooter() {
  return <footer className="site-footer">
    <div className="footer-top">
      <div className="footer-brand">
        <TransitionLink href="/" aria-label="ADDOZ home"><Logo /></TransitionLink>
        <p>{site.description}</p>
        <a href={`mailto:${site.email}`}>Let&apos;s talk <ArrowUpRight size={15} aria-hidden="true" /></a>
      </div>
      {footerNav.map(column => <nav className="footer-link-column" key={column.title} aria-label={column.title}>
        <h3>{column.title}</h3>
        {column.items.map(item => <TransitionLink key={item.href} href={item.href}>{item.label}</TransitionLink>)}
      </nav>)}
      <div className="footer-link-column footer-contact">
        <h3>Stay connected</h3>
        <a href={`mailto:${site.email}`}>{site.email}</a>
        {site.phones.map(phone => <a key={phone.href} href={phone.href}>{phone.display}</a>)}
        <p className="footer-address">{site.office.lines.join(", ")}</p>
        <div className="footer-socials">{site.socials.map(social => <a key={social.href} href={social.href} target="_blank" rel="noreferrer">{social.label} ↗</a>)}</div>
        <a href="#main" className="back-top" aria-label="Back to top"><ArrowUp size={16} aria-hidden="true" /></a>
      </div>
    </div>
    <div className="footer-bottom">
      <p>© {new Date().getFullYear()} {site.legalName}.</p>
      <span>Built for what&apos;s next <Asterisk size={13} strokeWidth={2.5} aria-hidden="true" /></span>
    </div>
    <div className="footer-giant" aria-hidden="true"><span>YOUR NEXT</span><span>↗</span></div>
  </footer>
}
