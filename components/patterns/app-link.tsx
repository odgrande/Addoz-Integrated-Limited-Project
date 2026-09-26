"use client"

import { createContext, useContext, type AnchorHTMLAttributes, type ReactNode } from "react"
import Link from "next/link"
import { TransitionLink } from "@/components/addoz/page-transition"

/**
 * Public pages navigate through the ADDOZ page curtain; the dashboards and auth
 * screens navigate instantly (Directive 007 §20: no marketing motion in app UX).
 * Shells set the mode once, so every pattern that renders a link behaves right.
 */
type LinkMode = "curtain" | "instant"
const LinkModeContext = createContext<LinkMode>("curtain")

export function LinkModeProvider({ mode, children }: { mode: LinkMode; children: ReactNode }) {
  return <LinkModeContext.Provider value={mode}>{children}</LinkModeContext.Provider>
}

export type AppLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }

export function AppLink({ href, children, ...props }: AppLinkProps) {
  const mode = useContext(LinkModeContext)
  const external = /^(https?:|mailto:|tel:)/.test(href)
  if (external) return <a href={href} {...props}>{children}</a>
  if (mode === "instant") return <Link href={href} {...props}>{children}</Link>
  return <TransitionLink href={href} {...props}>{children}</TransitionLink>
}
