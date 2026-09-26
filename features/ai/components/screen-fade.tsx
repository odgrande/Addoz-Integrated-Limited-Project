"use client"

import { useRef, type ReactNode } from "react"
import { gsap, useGSAP, reducedMotion } from "@/lib/motion"

/**
 * Restrained stage-screen crossfade: children rise and fade in whenever `id`
 * changes (a tab switch, or idle → results). Used across Career Intelligence
 * so switching "screens" always reads the same quiet way.
 */
export function ScreenFade({ id, className, children }: { id: string | number; className?: string; children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null)
  useGSAP(() => {
    if (reducedMotion() || !root.current) return
    gsap.fromTo(root.current, { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.4, ease: "power2.out" })
  }, { scope: root, dependencies: [id], revertOnUpdate: true })
  return <div ref={root} className={className}>{children}</div>
}
