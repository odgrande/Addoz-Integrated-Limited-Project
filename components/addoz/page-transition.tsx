"use client"

import { createContext, useContext, useEffect, useRef, type AnchorHTMLAttributes, type ReactNode } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { gsap, reducedMotion } from "@/lib/motion"

const TransitionContext = createContext<(href: string) => void>(() => {})

/**
 * Page transition: on a curtain navigation the purple curtain rises over the page,
 * the route changes underneath, then it lifts away. First loads, instant links,
 * browser back/forward and reduced motion never show it.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const curtain = useRef<HTMLDivElement>(null)
  const covering = useRef(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const router = useRouter()
  const pathname = usePathname()

  const lift = (duration: number) => {
    gsap.to(curtain.current, {
      yPercent: -100, duration, ease: "power3.inOut", delay: 0.05,
      onComplete: () => { covering.current = false; gsap.set(curtain.current, { yPercent: 100, visibility: "hidden" }) },
    })
  }

  useEffect(() => {
    if (!covering.current) return
    if (timer.current) clearTimeout(timer.current)
    lift(0.5)
    return () => { if (timer.current) clearTimeout(timer.current) }
  }, [pathname])

  function navigate(href: string) {
    if (covering.current) return
    const target = href.split("#")[0].split("?")[0]
    if (target === pathname || reducedMotion()) { router.push(href); return }
    covering.current = true
    timer.current = setTimeout(() => lift(0.3), 5000)
    gsap.fromTo(curtain.current, { yPercent: 100, visibility: "visible" }, { yPercent: 0, duration: 0.4, ease: "power3.inOut", onComplete: () => router.push(href) })
  }

  return <TransitionContext.Provider value={navigate}>{children}<div ref={curtain} className="page-curtain" aria-hidden="true"><span>addoz<span className="logo-period">.</span></span><span className="curtain-caption">Your next chapter</span></div></TransitionContext.Provider>
}

export function TransitionLink({ href, children, onClick, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  const navigate = useContext(TransitionContext)
  return <Link href={href} {...props} onClick={event => {
    onClick?.(event)
    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0 || props.target === "_blank") return
    event.preventDefault()
    navigate(href)
  }}>{children}</Link>
}
