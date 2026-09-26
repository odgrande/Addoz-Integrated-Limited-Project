"use client"

import type { RefObject } from "react"
import { gsap, useGSAP } from "@/lib/motion"

/**
 * The application motion layer (candidate, employer, admin). Deliberately quiet
 * (Directive 007 §20): panels settle in, numbers count up, progress rings draw.
 * No SplitText, no scramble, no scroll choreography. Reduced motion: nothing moves
 * and every value is already correct in the markup.
 */
export function useAppMotion(root: RefObject<HTMLElement | null>, dependencies: unknown[] = []) {
  useGSAP(() => {
    const mm = gsap.matchMedia()
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const scope = root.current
      if (!scope) return
      const panels = scope.querySelectorAll("[data-panel]")
      if (panels.length) gsap.from(panels, { opacity: 0, y: 8, duration: 0.4, ease: "power2.out", stagger: 0.035, clearProps: "opacity,transform" })

      const settle: (() => void)[] = []
      scope.querySelectorAll<HTMLElement>("[data-count]").forEach(node => {
        const target = Number(node.dataset.count)
        if (!Number.isFinite(target) || target === 0) return
        // Write into React's own text node (nodeValue), never replace it, so later
        // React updates still land on the node that is on screen
        const text = node.firstChild
        if (!text || text.nodeType !== Node.TEXT_NODE) return
        const percent = node.dataset.countFormat === "percent"
        const show = (value: number) => { text.nodeValue = percent ? `${Math.round(value)}%` : Math.round(value).toLocaleString("en-GB") }
        const counter = { value: 0 }
        show(0)
        settle.push(() => show(target))
        gsap.to(counter, { value: target, duration: 0.9, ease: "power2.out", delay: 0.1, onUpdate: () => show(counter.value), onComplete: () => show(target) })
      })

      scope.querySelectorAll<SVGCircleElement>("[data-ring]").forEach(ring => {
        const circumference = Number(ring.getAttribute("stroke-dasharray"))
        gsap.from(ring, { attr: { "stroke-dashoffset": circumference }, duration: 1, ease: "power2.out", delay: 0.15 })
      })
      // If the layer is reverted mid-count (route change, motion setting change), numbers end on their real value
      return () => settle.forEach(finish => finish())
    })
    return () => mm.revert()
  }, { scope: root, dependencies, revertOnUpdate: true })
}
