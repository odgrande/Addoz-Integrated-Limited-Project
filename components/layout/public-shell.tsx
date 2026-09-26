"use client"

import { useRef, type ReactNode } from "react"
import { usePathname } from "next/navigation"
import { SiteHeader } from "@/components/addoz/site-header"
import { SiteFooter } from "@/components/addoz/site-footer"
import { useSiteMotion } from "@/components/motion/site-motion"

/**
 * Chrome for every public page outside the homepage: header, main, footer and the
 * shared public motion layer (re-run on each navigation so new pages get their
 * headline reveals, label decode and hover layer).
 */
export function PublicShell({ children, variant = "marketing" }: { children: ReactNode; variant?: "marketing" | "marketplace" }) {
  const root = useRef<HTMLDivElement>(null)
  const pathname = usePathname()
  useSiteMotion(root, [pathname])
  return <div ref={root} className={`public-shell public-${variant}`}>
    <SiteHeader />
    <main id="main" className="public-main">{children}</main>
    <SiteFooter />
  </div>
}
