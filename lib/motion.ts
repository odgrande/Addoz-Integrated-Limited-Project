"use client"

import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { SplitText } from "gsap/SplitText"
import { Flip } from "gsap/Flip"
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin"
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin"
import { useGSAP } from "@gsap/react"

gsap.registerPlugin(ScrollTrigger, SplitText, Flip, DrawSVGPlugin, ScrambleTextPlugin, useGSAP)

export { gsap, ScrollTrigger, SplitText, Flip, DrawSVGPlugin, ScrambleTextPlugin, useGSAP }
export const motion = { ease: "power3.out", duration: 0.65, stagger: 0.065 }
export const reducedMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches

// Lucide icons are line drawings: DrawSVGPlugin traces every stroked shape inside them
const iconShapes = (icon: Element) => icon.querySelectorAll("path, line, polyline, polygon, rect, circle, ellipse")
// DrawSVGPlugin renders after CSSPlugin, so a clearProps inside the drawing tween gets
// written over; the dash styles are cleared once the stroke is complete instead
const clearStrokes = (shapes: NodeListOf<Element>) => gsap.set(shapes, { clearProps: "strokeDasharray,strokeDashoffset" })

/** Icons trace themselves in, one after another. Each icon stays invisible until its
 *  turn, so the round line caps never show as stray dots. Returns a timeline, so the
 *  caller can give it a scrollTrigger or nest it inside another timeline. */
export function drawIcons(icons: (Element | null)[], vars: gsap.TimelineVars = {}) {
  const timeline = gsap.timeline(vars)
  icons.filter((icon): icon is Element => !!icon).forEach((icon, index) => {
    const shapes = iconShapes(icon)
    timeline
      .from(icon, { opacity: 0, duration: 0.15, clearProps: "opacity" }, index * 0.08)
      .fromTo(shapes, { drawSVG: "0%" }, { drawSVG: "100%", duration: 0.9, ease: "power2.inOut", stagger: 0.06, onComplete: () => { clearStrokes(shapes) } }, index * 0.08)
  })
  return timeline
}

/** Hover feedback: an icon that is already visible re-traces itself. */
export function redrawIcon(icon: Element | null) {
  const shapes = icon ? iconShapes(icon) : null
  if (!shapes?.length || gsap.isTweening(shapes)) return
  gsap.fromTo(shapes, { drawSVG: "0%" }, { drawSVG: "100%", duration: 0.6, ease: "power2.inOut", stagger: 0.04, onComplete: () => { clearStrokes(shapes) } })
}
