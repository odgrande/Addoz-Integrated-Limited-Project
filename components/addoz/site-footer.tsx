"use client"

import { useRef, useState, type FormEvent } from "react"
import { ArrowRight, ArrowUp, ArrowUpRight, Asterisk } from "lucide-react"
import { Logo } from "./site-header"
import { TransitionLink } from "./page-transition"
import { gsap, useGSAP, reducedMotion } from "@/lib/motion"
import { site } from "@/lib/site"
import { footerNav } from "@/components/layout/site-nav"

/** The quiet close: one line, one field — subscribes the address to ADDOZ job updates. */
export function Newsletter() {
  const [submitted, setSubmitted] = useState(false)
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)
  const root = useRef<HTMLElement>(null)
  const { contextSafe } = useGSAP(() => {}, { scope: root })
  const reveal = contextSafe(() => { if (!reducedMotion()) gsap.fromTo(".newsletter-status", { y: 6, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35 }) })
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const email = String(new FormData(event.currentTarget).get("email") ?? "").trim()
    setBusy(true)
    setFailed(false)
    const response = await fetch("/api/newsletter", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, source: "footer" }) }).catch(() => null)
    setBusy(false)
    if (response?.ok) setSubmitted(true)
    else setFailed(true)
    reveal()
  }
  return <section id="newsletter" ref={root} className="newsletter section-pad" aria-labelledby="newsletter-title">
    <div className="newsletter-copy">
      <p className="eyebrow"><Asterisk size={14} strokeWidth={2.5} aria-hidden="true" /> Right opportunities. Right to your inbox.</p>
      <h2 id="newsletter-title" data-reveal>Don&apos;t miss your next thing.</h2>
    </div>
    <div className="newsletter-side">
      <p>A little less searching. Get updated with the best new jobs on ADDOZ.</p>
      <form className="newsletter-form" onSubmit={submit}>
        <label htmlFor="newsletter-email" className="sr-only">Email address for job updates</label>
        <input id="newsletter-email" name="email" type="email" required placeholder="Your email address" autoComplete="email" disabled={submitted || busy} />
        <button type="submit" className="action-button action-primary" disabled={submitted || busy}>Keep me posted <ArrowRight size={17} aria-hidden="true" /></button>
      </form>
      <p className="newsletter-status" role="status">{submitted ? "Thanks — you’re on the list for new job updates." : failed ? "We couldn’t subscribe that address just now. Please try again." : "New roles, now and then. Unsubscribe any time."}</p>
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
