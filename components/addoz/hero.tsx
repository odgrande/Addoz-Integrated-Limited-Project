"use client"

import { useRef, useState, type FormEvent } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowUpRight, Asterisk, ChevronDown, MapPin, Pause, Play, Search } from "lucide-react"
import { gsap, SplitText, useGSAP, motion } from "@/lib/motion"
import { areasInState, states } from "@/features/locations/data"
import { ScrambleLabel } from "./scramble-label"

const popular = [
  { label: "Development & IT", href: "/jobs?category=development-it" },
  { label: "Design & Creative", href: "/jobs?category=design-creative" },
  { label: "Remote", href: "/jobs?remote=1" },
]

const portraits = [
  { id: "creative", caption: "The creators.", alt: "Nigerian creative professional holding a laptop" },
  { id: "builder", caption: "The builders.", alt: "Nigerian software developer in a purple shirt" },
  { id: "leader", caption: "The game changers.", alt: "Nigerian strategist wearing an orange blazer" },
] as const

/**
 * Hero (Directive 008): one statement, one search, three portraits.
 * Search goes straight to the jobs browser with the query in the URL.
 */
export function Hero() {
  const root = useRef<HTMLElement>(null)
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [location, setLocation] = useState("")

  useGSAP(() => {
    const mm = gsap.matchMedia()
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const split = SplitText.create(".hero-line", { type: "words", mask: "words" })
      gsap.timeline({ defaults: { ease: motion.ease } })
        .from(".hero-eyebrow", { opacity: 0, y: 8, duration: 0.45 })
        .from(split.words, { yPercent: 110, duration: 0.9, stagger: 0.07, ease: "expo.out" }, 0.05)
        .from(".hero-spark", { scale: 0, rotation: -90, duration: 0.7, ease: "back.out(2)" }, 0.45)
        .from(".hero-lead, .hero-search, .hero-popular", { y: 16, opacity: 0, stagger: 0.07, duration: 0.6, clearProps: "opacity,transform" }, 0.35)
        .from(".portrait", { y: 40, opacity: 0, stagger: 0.09, duration: 0.9, ease: "expo.out", clearProps: "opacity" }, 0.4)
        .from(".chapter-sticker", { scale: 0.8, rotation: 6, opacity: 0, duration: 0.55, ease: "back.out(2)" }, 0.95)
      // As the hero scrolls away the spark turns and each portrait's crop drifts upward
      gsap.to(".hero-spark", { rotation: 90, ease: "none", scrollTrigger: { trigger: root.current, start: "top top", end: "bottom top", scrub: 1 } })
      gsap.to(".portrait-photo", { "--crop-y": "22%", ease: "none", scrollTrigger: { trigger: root.current, start: "top top", end: "bottom top", scrub: true } })
      return () => split.revert()
    })
    // Fine pointers: the portraits drift with the pointer, nearer frames travel further
    mm.add("(min-width: 900px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)", () => {
      const hero = root.current!
      const layers = ([[".portrait-creative", 6], [".portrait-builder", 11], [".portrait-leader", 8], [".chapter-sticker", 16]] as const).map(([selector, depth]) => ({
        depth, x: gsap.quickTo(selector, "x", { duration: 1, ease: "power3.out" }), y: gsap.quickTo(selector, "y", { duration: 1, ease: "power3.out" }),
      }))
      const move = (event: PointerEvent) => {
        const box = hero.getBoundingClientRect()
        const px = (event.clientX - box.left) / box.width - 0.5, py = (event.clientY - box.top) / box.height - 0.5
        layers.forEach(layer => { layer.x(px * 2 * layer.depth); layer.y(py * 2 * layer.depth) })
      }
      const settle = () => layers.forEach(layer => { layer.x(0); layer.y(0) })
      const start = gsap.delayedCall(1.6, () => { hero.addEventListener("pointermove", move); hero.addEventListener("pointerleave", settle) })
      return () => { start.kill(); hero.removeEventListener("pointermove", move); hero.removeEventListener("pointerleave", settle) }
    })
    return () => mm.revert()
  }, { scope: root })

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const params = new URLSearchParams()
    if (query.trim()) params.set("q", query.trim())
    if (location) params.set("location", location)
    const search = params.toString()
    router.push(search ? `/jobs?${search}` : "/jobs")
  }

  return <section className="hero" ref={root} aria-labelledby="hero-title">
    <div className="hero-copy">
      <p className="hero-eyebrow"><span className="status-dot" aria-hidden="true" /><ScrambleLabel text="BIG AMBITIONS. REAL OPPORTUNITIES." /></p>
      <div className="hero-heading">
        <h1 id="hero-title" className="hero-title"><span className="hero-line">FIND YOUR</span> <span className="hero-line hero-line-accent">NEXT MOVE.</span></h1>
        <Asterisk className="hero-spark" strokeWidth={2.75} aria-hidden="true" />
      </div>
      <p className="hero-lead">Good people. Great possibilities. Connecting African talent to what&apos;s next.</p>
      <form className="hero-search" role="search" aria-label="Search jobs" onSubmit={submit}>
        <label className="hero-field hero-field-keyword">
          <Search size={20} aria-hidden="true" />
          <span className="sr-only">Job title, skills or keywords</span>
          <input name="q" placeholder="Job title, skills or keywords" autoComplete="off" value={query} onChange={event => setQuery(event.target.value)} />
        </label>
        <label className="hero-field hero-field-location">
          <MapPin size={18} aria-hidden="true" />
          <span className="sr-only">Location</span>
          <select name="location" value={location} onChange={event => setLocation(event.target.value)}>
            <option value="">All locations</option>
            {states.map(state => <optgroup key={state.slug} label={`${state.name} State`}>{areasInState(state.slug).map(area => <option key={area.slug} value={area.slug}>{area.name}</option>)}</optgroup>)}
          </select>
          <ChevronDown className="hero-field-chevron" size={16} aria-hidden="true" />
        </label>
        <button type="submit" className="action-button action-primary hero-submit" data-magnetic>Find jobs <ArrowUpRight size={18} aria-hidden="true" /></button>
      </form>
      <div className="hero-popular">
        <span className="hero-popular-label">Popular</span>
        <ul>{popular.map(item => <li key={item.label}><Link href={item.href}>{item.label}</Link></li>)}</ul>
      </div>
    </div>

    <div className="hero-visual" role="group" aria-label="A new chapter for African talent">
      {portraits.map(portrait => <figure key={portrait.id} className={`portrait portrait-${portrait.id}`}>
        <div className="portrait-photo" role="img" aria-label={portrait.alt} />
        <figcaption>{portrait.caption}</figcaption>
      </figure>)}
      <p className="chapter-sticker"><Asterisk size={20} strokeWidth={2.5} aria-hidden="true" /><span>Made for your <strong>next chapter.</strong></span></p>
    </div>
  </section>
}

/** A slim, pausable line of ADDOZ voice between the hero and the board. */
export function OpportunityTicker() {
  const root = useRef<HTMLDivElement>(null)
  const tween = useRef<gsap.core.Tween | null>(null)
  const [paused, setPaused] = useState(false)
  useGSAP(() => {
    const mm = gsap.matchMedia()
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      tween.current = gsap.to(".ticker-track", { xPercent: -50, duration: 40, ease: "none", repeat: -1 })
    })
    return () => mm.revert()
  }, { scope: root })
  const lines = ["Less searching. More finding.", "Real talent. Real opportunity.", "Your next chapter starts here."]
  return <div ref={root} className="opportunity-ticker">
    <div className="ticker-viewport" role="marquee" aria-label={lines.join(" ")}>
      <div className="ticker-track" aria-hidden="true">{[0, 1].map(copy => <div className="ticker-copy" key={copy}>{[...lines, ...lines].map((line, index) => <span key={index}>{line}<Asterisk size={14} strokeWidth={2.5} /></span>)}</div>)}</div>
    </div>
    <button type="button" className="ticker-toggle" aria-label={paused ? "Play the ticker" : "Pause the ticker"} onClick={() => { setPaused(!paused); tween.current?.paused(!paused) }}>{paused ? <Play size={13} /> : <Pause size={13} />}</button>
  </div>
}
