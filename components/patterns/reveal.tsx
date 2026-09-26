"use client"

import { useRef, type ElementType, type ReactNode } from "react"
import { gsap, useGSAP } from "@/lib/motion"

/**
 * Reveal: its direct children rise into place, staggered.
 *  mode "scroll" — once, as the group reaches the viewport (public pages)
 *  mode "mount"  — straight away, short and quiet (dashboard panels)
 * Props are cleared afterwards, so hover transforms in CSS keep working.
 */
export function Reveal({ children, as: Tag = "div", mode = "scroll", stagger = 0.08, y, className, ...rest }: {
  children: ReactNode
  as?: ElementType
  mode?: "scroll" | "mount"
  stagger?: number
  y?: number
  className?: string
} & Record<string, unknown>) {
  const root = useRef<HTMLElement>(null)
  useGSAP(() => {
    const mm = gsap.matchMedia()
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const items = root.current ? [...root.current.children] : []
      if (!items.length) return
      const distance = y ?? (mode === "mount" ? 10 : 28)
      gsap.from(items, {
        y: distance, opacity: 0, duration: mode === "mount" ? 0.45 : 0.75, ease: "power3.out", stagger,
        clearProps: "opacity,transform",
        scrollTrigger: mode === "scroll" ? { trigger: root.current, start: "top 88%", once: true } : undefined,
      })
    })
    return () => mm.revert()
  }, { scope: root })
  return <Tag ref={root} className={className} {...rest}>{children}</Tag>
}
