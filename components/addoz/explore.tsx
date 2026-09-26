"use client"

import { useRef, useState } from "react"
import { flushSync } from "react-dom"
import Link from "next/link"
import { ArrowUpRight, Blocks, Code2, MapPin, Megaphone, MessagesSquare, PencilLine, PenTool, type LucideIcon } from "lucide-react"
import { drawIcons, Flip, gsap, reducedMotion, useGSAP } from "@/lib/motion"
import { cn } from "@/lib/utils"
import { featuredCategories } from "@/features/categories/data"
import { featuredAreas, getState } from "@/features/locations/data"
import { ScrambleLabel } from "./scramble-label"

const icons: Record<string, LucideIcon> = { code: Code2, pen: PenTool, megaphone: Megaphone, messages: MessagesSquare, blocks: Blocks, pencil: PencilLine }

/**
 * "What's your thing?" — the bold, near-black moment. Six fields as an accordion
 * (Flip keeps the open row anchored) beside the places ADDOZ lists roles.
 */
export function Explore() {
  const [active, setActive] = useState(0)
  const root = useRef<HTMLElement>(null)
  const { contextSafe } = useGSAP(() => {
    const mm = gsap.matchMedia()
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      // The list arrives as one piece; the six field icons trace themselves in
      gsap.timeline({ scrollTrigger: { trigger: ".category-accordion", start: "top 85%", once: true } })
        .from(".category-accordion", { y: 24, opacity: 0, duration: 0.8, ease: "power3.out", clearProps: "opacity,transform" })
        .add(drawIcons(gsap.utils.toArray<Element>(".category-icon")), 0.2)
      gsap.from(".explore-places", { y: 24, opacity: 0, duration: 0.8, ease: "power3.out", clearProps: "opacity,transform", scrollTrigger: { trigger: ".explore-places", start: "top 88%", once: true } })
    })
    return () => mm.revert()
  }, { scope: root })

  const expand = (index: number) => contextSafe(() => {
    if (active === index) return
    const state = Flip.getState(root.current!.querySelectorAll(".category-panel"))
    flushSync(() => setActive(index))
    if (reducedMotion()) return
    Flip.from(state, { duration: 0.55, ease: "power3.inOut" })
    gsap.from(".category-panel.is-active .category-content > *", { y: 10, opacity: 0, duration: 0.35, delay: 0.2, stagger: 0.05, clearProps: "opacity,transform" })
  })()

  return <section id="explore" className="explore section-pad" ref={root} aria-labelledby="explore-title">
    <div className="section-heading">
      <div>
        <p className="eyebrow"><span className="eyebrow-line" /><ScrambleLabel text="MANY PATHS. YOUR POSSIBILITY." /></p>
        <h2 id="explore-title" data-reveal>What&apos;s your thing?</h2>
      </div>
      <div className="section-heading-aside"><p>Find a space for your skills. Then make it your own.</p></div>
    </div>

    <div className="explore-grid">
      <div className="category-accordion">
        {featuredCategories.map((category, index) => {
          const Icon = icons[category.icon ?? "code"] ?? Code2
          const open = active === index
          return <article key={category.slug} className={cn("category-panel", open && "is-active")} data-flip-id={`category-${category.slug}`}>
            <h3 className="category-heading">
              <button type="button" className="category-trigger" onClick={() => expand(index)} aria-expanded={open} aria-controls={`category-content-${index}`} id={`category-trigger-${index}`}>
                <span className="category-number">{String(index + 1).padStart(2, "0")}</span>
                <Icon className="category-icon" strokeWidth={1.5} aria-hidden="true" />
                <span className="category-title">{category.name}</span>
                <ArrowUpRight className="category-arrow" size={20} aria-hidden="true" />
              </button>
            </h3>
            <div id={`category-content-${index}`} className="category-content" role="region" aria-labelledby={`category-trigger-${index}`} hidden={!open}>
              <p className="category-line">{category.line}</p>
              <p className="category-description">{category.description}</p>
              <Link href={`/jobs?category=${category.slug}`} className="category-link">Explore {category.name} roles <ArrowUpRight size={16} aria-hidden="true" /></Link>
            </div>
          </article>
        })}
      </div>

      <aside className="explore-places" aria-labelledby="places-title">
        <MapPin className="explore-places-icon" size={22} strokeWidth={1.75} aria-hidden="true" />
        <h3 id="places-title">Your next move.<br />Closer to home.</h3>
        <p>Browse roles by area across Lagos and Ogun State.</p>
        <ul className="place-links">
          {featuredAreas.map(area => <li key={area.slug}><Link href={`/jobs?location=${area.slug}`}><span>{area.name}</span><small>{getState(area.state)?.name}</small><ArrowUpRight size={15} aria-hidden="true" /></Link></li>)}
        </ul>
      </aside>
    </div>
  </section>
}
