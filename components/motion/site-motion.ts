"use client"

import type { RefObject } from "react"
import { gsap, ScrollTrigger, SplitText, useGSAP, drawIcons, redrawIcon } from "@/lib/motion"

/**
 * The public-site motion layer (homepage + every marketing/marketplace page).
 * Moved here unchanged from the homepage (Directive 004–006 behaviour) so all
 * public pages share it:
 *  - [data-reveal] headlines rise line by line (SplitText masks, reverted after)
 *  - [data-scramble="view"] labels decode as they arrive (ScrambleText)
 *  - intro copy beside headlines fades up
 *  - career tools grid: cards rise, icons trace in, resume sketch builds
 *  - fine pointers: magnetic CTAs + one delegated hover layer (arrows out-and-back,
 *    icon re-trace, tool label re-decode, job-card mark tip, logo spark turn)
 * Everything sits behind prefers-reduced-motion: no-preference.
 * Pass the pathname as a dependency so each new page gets its own pass.
 */

// Arrow icons and the direction each one travels on hover
const ARROWS: [string, number, number][] = [
  ["lucide-arrow-up-right", 1, -1], ["lucide-move-up-right", 1, -1], ["lucide-arrow-right", 1, 0],
  ["lucide-arrow-left", -1, 0], ["lucide-arrow-up", 0, -1], ["lucide-arrow-down", 0, 1],
]
// The arrow leaves in its own direction and slides back in from the opposite side
function nudge(svg: SVGElement, dx: number, dy: number) {
  if (gsap.isTweening(svg)) return
  const distance = Math.max(4, svg.getBoundingClientRect().width * 0.45)
  gsap.timeline()
    .to(svg, { x: dx * distance, y: dy * distance, opacity: 0, duration: 0.16, ease: "power2.in" })
    .set(svg, { x: -dx * distance, y: -dy * distance })
    .to(svg, { x: 0, y: 0, opacity: 1, duration: 0.34, ease: "power3.out", clearProps: "transform,opacity" })
}
function nudgeArrows(host: Element) {
  host.querySelectorAll<SVGElement>("svg").forEach(svg => {
    const arrow = ARROWS.find(([name]) => svg.classList.contains(name))
    if (arrow && !svg.classList.contains("category-arrow")) nudge(svg, arrow[1], arrow[2]) // category arrows rotate via CSS
  })
}

export function useSiteMotion(root: RefObject<HTMLElement | null>, dependencies: unknown[] = []) {
  useGSAP((context, contextSafe) => {
    const mm = gsap.matchMedia()
    // Uppercase labels (<ScrambleLabel>) decode into place. The box is locked and
    // clipped while the letters are scrambled, so random glyph widths can never reflow
    // the line or push the page sideways; React's own text node goes back afterwards.
    const decode = contextSafe!((label: HTMLElement | null, duration: number) => {
      if (!label || gsap.isTweening(label)) return
      const text = label.textContent ?? ""
      const original = [...label.childNodes]
      const { width, height } = label.getBoundingClientRect()
      gsap.set(label, { width, height, overflow: "hidden", whiteSpace: "nowrap", autoRound: false })
      gsap.timeline({ onComplete: () => { label.replaceChildren(...original); gsap.set(label, { clearProps: "width,height,overflow,whiteSpace,opacity" }) } })
        .to(label, { opacity: 1, duration: 0.2 }, 0)
        .to(label, { duration, ease: "none", scrambleText: { text, chars: [...new Set(text.replace(/[^A-Z]/g, ""))].join("") || "upperCase", revealDelay: duration * 0.25, speed: 0.45 } }, 0)
    })
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      // Headlines: masked line-by-line reveal (same language as the hero).
      // autoSplit re-measures lines on resize/font load; the split is reverted once
      // the lines land, so React's DOM is back to exactly what it rendered.
      gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach(heading => {
        SplitText.create(heading, {
          type: "lines", mask: "lines", linesClass: "reveal-line", autoSplit: true,
          onSplit: self => gsap.from(self.lines, {
            yPercent: 110, duration: 0.95, ease: "expo.out", stagger: 0.1,
            scrollTrigger: { trigger: heading, start: "top 88%", once: true },
            onComplete: () => { self.revert() },
          }),
        })
      })
      // Eyebrow labels decode as they arrive (after web fonts, so the locked box is measured right)
      gsap.utils.toArray<HTMLElement>('[data-scramble="view"]').forEach(label => {
        gsap.set(label, { opacity: 0 })
        ScrollTrigger.create({ trigger: label, start: "top 92%", once: true, onEnter: () => { document.fonts.ready.then(() => decode(label, 0.9)) } })
      })
      // The intro copy beside each headline follows it up
      gsap.utils.toArray<HTMLElement>(".section-heading-aside, .page-header-lead").forEach(copy => {
        gsap.from(copy, { y: 18, opacity: 0, duration: 0.8, delay: 0.15, ease: "power3.out", clearProps: "opacity,transform", scrollTrigger: { trigger: copy, start: "top 90%", once: true } })
      })
      // Career tools: the bento arrives as one group, its icons trace in and the resume
      // sketch builds line by line (Directive 008: groups, not every card)
      gsap.utils.toArray<HTMLElement>(".tools-grid").forEach(grid => {
        gsap.timeline({ scrollTrigger: { trigger: grid, start: "top 88%", once: true } })
          .from(grid, { y: 28, opacity: 0, duration: 0.8, ease: "power3.out", clearProps: "opacity,transform" })
          .add(drawIcons([...grid.querySelectorAll(".tool-icon svg")]), 0.3)
          .from(grid.querySelectorAll(".resume-lines > i"), { scaleX: 0, transformOrigin: "left center", duration: 0.5, ease: "power2.out", stagger: 0.05, clearProps: "transform,transformOrigin" }, 0.45)
          .add(drawIcons([...grid.querySelectorAll(".resume-check svg")]), 0.85)
      })
    })
    const cleanups: (() => void)[] = []
    mm.add("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)", () => {
      root.current?.querySelectorAll<HTMLElement>("[data-magnetic]").forEach(button => {
        const move = contextSafe!((event: PointerEvent) => { const rect = button.getBoundingClientRect(); gsap.to(button, { x: (event.clientX - rect.left - rect.width / 2) * 0.09, y: (event.clientY - rect.top - rect.height / 2) * 0.13, duration: 0.35, overwrite: true }) })
        const leave = contextSafe!(() => { gsap.to(button, { x: 0, y: 0, duration: 0.6, ease: "elastic.out(1, 0.4)", overwrite: true }) })
        button.addEventListener("pointermove", move)
        button.addEventListener("pointerleave", leave)
        cleanups.push(() => { button.removeEventListener("pointermove", move); button.removeEventListener("pointerleave", leave) })
      })
      // One delegated listener gives hover feedback across the page, including cards React
      // adds later: arrows leave and come back, tool and category icons re-trace, tool
      // labels re-decode, job cards tip their mark, and the logo spark turns
      const page = root.current
      const over = contextSafe!((event: PointerEvent) => {
        const target = event.target as Element
        const from = event.relatedTarget as Node | null
        // A job card reacts as a whole, however the pointer comes in; its inner links don't
        // react again on their own
        const card = target.closest(".job-card")
        if (card) {
          if (card.contains(from)) return
          nudgeArrows(card)
          const mark = card.querySelector(".job-mark")
          if (mark) gsap.to(mark, { rotation: -8, scale: 1.08, duration: 0.45, ease: "back.out(3)", overwrite: true })
          return
        }
        const host = target.closest<HTMLElement>("a, button")
        if (!host || host.contains(from)) return
        nudgeArrows(host)
        if (host.matches("[data-tool-card]")) { redrawIcon(host.querySelector(".tool-icon svg")); decode(host.querySelector<HTMLElement>('[data-scramble="hover"]'), 0.5) }
        if (host.matches(".category-trigger, .category-card")) redrawIcon(host.querySelector(".category-icon"))
        const spark = host.querySelector(".brand-spark")
        if (spark) gsap.to(spark, { rotation: "+=90", duration: 0.7, ease: "back.out(2)" })
      })
      const out = contextSafe!((event: PointerEvent) => {
        const card = (event.target as Element).closest(".job-card")
        const mark = card?.querySelector(".job-mark")
        if (mark && !card!.contains(event.relatedTarget as Node | null)) gsap.to(mark, { rotation: 0, scale: 1, duration: 0.5, ease: "power3.out", overwrite: true })
      })
      page?.addEventListener("pointerover", over)
      page?.addEventListener("pointerout", out)
      cleanups.push(() => { page?.removeEventListener("pointerover", over); page?.removeEventListener("pointerout", out) })
      return () => cleanups.splice(0).forEach(cleanup => cleanup())
    })
    const refresh = () => ScrollTrigger.refresh()
    document.fonts.ready.then(() => { if (root.current) refresh() })
    return () => { mm.revert(); cleanups.forEach(cleanup => cleanup()) }
  }, { scope: root, dependencies, revertOnUpdate: true })
}
