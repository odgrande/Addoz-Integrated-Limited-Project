"use client"

import Image from "next/image"
import { createContext, useContext, useMemo, useState, type ReactNode } from "react"
import { ArrowLeft } from "lucide-react"
import { Logo } from "@/components/addoz/site-header"
import { TransitionLink } from "@/components/addoz/page-transition"
import { LinkModeProvider } from "@/components/patterns/app-link"
import { employerProposition } from "@/features/content/testimonials"
import { site } from "@/lib/site"
import type { AuthRole } from "./auth-role"

type AuthRoleState = { role: AuthRole; setRole: (role: AuthRole) => void }

const AuthRoleContext = createContext<AuthRoleState>({ role: "candidate", setRole: () => {} })

/** The role the auth screens are shown for. Register's role toggle calls setRole to switch the shell live. */
export function useAuthRole() {
  return useContext(AuthRoleContext)
}

const variants = {
  candidate: {
    kicker: "Your next chapter",
    statement: <>Good people.<br />Great possibilities.</>,
    body: site.mission,
    photoLabel: "Smiling Nigerian professional in an orange blazer",
    points: [] as string[],
  },
  employer: {
    kicker: "For employers",
    statement: <>{employerProposition.heading}</>,
    body: employerProposition.sub,
    photoLabel: "Nigerian professionals sharing ideas around a studio table",
    points: employerProposition.benefits.map(benefit => benefit.title) as string[],
  },
  admin: {
    kicker: "Administrator access",
    statement: <>System oversight.<br />Secure controls.</>,
    body: "Manage users, jobs, companies, and marketplace health from a protected admin workspace.",
    photoLabel: "Secure dashboard view with moderation controls",
    points: ["Review activity", "Moderate jobs", "Manage accounts"] as string[],
  },
} satisfies Record<AuthRole, unknown>

/**
 * Authentication layout. Desktop (≥1024): a brand panel beside the form column.
 * Below 1024 the panel collapses into a compact band (logo, back link, short
 * headline, small thumbnail) so the form starts near the top of the screen.
 * The panel follows the role: purple + an individual portrait for candidates,
 * ink + a team photo for employers. Pages pass the role from `?role=`; the
 * register toggle switches it client-side through useAuthRole().
 */
export function AuthShell({ role: initialRole = "candidate", children }: { role?: AuthRole; children: ReactNode }) {
  const [role, setRole] = useState<AuthRole>(initialRole)
  const value = useMemo(() => ({ role, setRole }), [role])
  const copy = variants[role]
  const photoSrc = role === "employer" ? "/images/team-editorial.png" : "/images/talent-editorial-brand.png"

  return <AuthRoleContext.Provider value={value}>
    <LinkModeProvider mode="instant">
      <div className="auth-shell" data-auth-role={role}>
        <aside className="auth-brand" aria-label={role === "employer" ? "ADDOZ for employers" : "ADDOZ"}>
          <div className="auth-brand-top">
            <TransitionLink href="/" aria-label="ADDOZ home" className="auth-logo"><Logo /></TransitionLink>
            <TransitionLink href={role === "employer" ? "/for-employers" : role === "admin" ? "/admin" : "/"} className="auth-back"><ArrowLeft size={16} aria-hidden="true" /> {role === "admin" ? "Back to admin" : "Back to ADDOZ"}</TransitionLink>
          </div>
          <div className="auth-brand-body">
            <div className="auth-brand-copy">
              <p className="auth-kicker t-label">{copy.kicker}</p>
              <p className="auth-statement">{copy.statement}</p>
              <p className="auth-mission t-body">{copy.body}</p>
              {copy.points.length > 0 && <ul className="auth-points">
                {copy.points.map(point => <li key={point}>{point}</li>)}
              </ul>}
            </div>
            <div className="auth-portrait" aria-label={copy.photoLabel}>
              <Image src={photoSrc} alt={copy.photoLabel} fill sizes="(max-width: 1023px) 120px, (max-width: 1280px) 32vw, 30vw" priority />
            </div>
          </div>
        </aside>
        <main id="main" className="auth-main">
          <div className="auth-main-inner">{children}</div>
          <p className="auth-legal t-small">© {new Date().getFullYear()} {site.legalName} · <TransitionLink href="/privacy" className="text-link">Privacy</TransitionLink> · <TransitionLink href="/terms" className="text-link">Terms</TransitionLink></p>
        </main>
      </div>
    </LinkModeProvider>
  </AuthRoleContext.Provider>
}
