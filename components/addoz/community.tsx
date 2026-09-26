"use client"

import { useRef, useState } from "react"
import { flushSync } from "react-dom"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { gsap, useGSAP, reducedMotion } from "@/lib/motion"
import { initials } from "@/lib/format"
import { sourceSite } from "@/lib/demo-jobs"
import { testimonials } from "@/features/content/testimonials"
import { ScrambleLabel } from "./scramble-label"

// Graduate first, then the job seeker, the HR specialist and the doctor — the four published stories
const order = ["Sarah Adebayo", "Anna Aderoju", "Grace Nwachukwu", "Adeolu David"]
const stories = order.map(name => testimonials.find(story => story.name === name)!).filter(Boolean)

/** Community — the editorial, purple moment: one voice at a time, set large. */
export function Community() {
  const [active, setActive] = useState(0)
  const root = useRef<HTMLElement>(null)
  const busy = useRef(false)
  const { contextSafe } = useGSAP(() => {
    const mm = gsap.matchMedia()
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      // The quote lights up word by word, once
      gsap.timeline({ scrollTrigger: { trigger: ".community-quote", start: "top 75%", once: true } })
        .from(".quote-mark", { scale: 0.5, opacity: 0, duration: 0.6, ease: "back.out(1.8)", clearProps: "transform,opacity" })
        .from(".quote-word", { opacity: 0.2, duration: 0.5, ease: "power1.out", stagger: 0.02 }, 0.1)
        .from(".story-person, .story-controls", { y: 12, opacity: 0, duration: 0.5, ease: "power3.out", stagger: 0.08, clearProps: "transform,opacity" }, "-=0.3")
    })
    return () => mm.revert()
  }, { scope: root })

  const next = (direction: number) => contextSafe(() => {
    if (busy.current) return
    const index = (active + direction + stories.length) % stories.length
    if (reducedMotion()) { setActive(index); return }
    busy.current = true
    gsap.timeline({ onComplete: () => { busy.current = false } })
      .to(".community-story", { y: -10, opacity: 0, duration: 0.18 })
      .call(() => flushSync(() => setActive(index)))
      .fromTo(".community-story", { y: 12 }, { y: 0, opacity: 1, duration: 0.35, clearProps: "transform" })
  })()

  const story = stories[active]!
  return <section className="community section-pad" ref={root} aria-labelledby="community-title">
    <div className="community-intro">
      <p className="eyebrow"><span className="eyebrow-line" /><ScrambleLabel text="THE PEOPLE BEHIND THE POSSIBILITIES" /></p>
      <h2 id="community-title" data-reveal>Real people.<br />New chapters.</h2>
      <a className="story-source" href={sourceSite} target="_blank" rel="noreferrer">Stories from the ADDOZ community <span aria-hidden="true">↗</span></a>
    </div>
    <figure className="community-quote">
      <span className="quote-mark" aria-hidden="true">“</span>
      <div className="community-story" aria-live="polite">
        <blockquote>{story.quote.split(" ").map((word, index) => <span className="quote-word" key={`${active}-${index}`}>{word} </span>)}</blockquote>
        <figcaption className="story-person"><span className="story-avatar" aria-hidden="true">{initials(story.name)}</span><span><strong>{story.name}</strong><small>{story.role}</small></span></figcaption>
      </div>
      <div className="story-controls">
        <span className="story-count tabular">{String(active + 1).padStart(2, "0")} <span>/ {String(stories.length).padStart(2, "0")}</span></span>
        <div>
          <button type="button" onClick={() => next(-1)} aria-label="Previous story"><ArrowLeft size={18} /></button>
          <button type="button" onClick={() => next(1)} aria-label="Next story"><ArrowRight size={18} /></button>
        </div>
      </div>
    </figure>
  </section>
}
