"use client"

import { useEffect, useRef, useState, useSyncExternalStore, type PointerEvent as ReactPointerEvent } from "react"
import { usePathname } from "next/navigation"
import { ArrowUpRight, ChevronDown, LogOut, Menu, Plus, X } from "lucide-react"
import { gsap, useGSAP } from "@/lib/motion"
import { TransitionLink } from "./page-transition"
import { accountNav, primaryNav } from "@/components/layout/site-nav"
import { cn } from "@/lib/utils"
import { signOut, useSession } from "@/lib/auth-client"

export function Logo() {
  return <span className="brand-wordmark">addoz<span>.</span><span className="brand-spark" aria-hidden="true">✳</span></span>
}

// A hairline appears under the header once the page has moved
function subscribeScroll(callback: () => void) {
  window.addEventListener("scroll", callback, { passive: true })
  return () => window.removeEventListener("scroll", callback)
}

const isCurrent = (pathname: string, href: string) => (href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`))

/**
 * Public header (Directive 007 §19). Four primary groups:
 *  ≥1024px — disclosure buttons open a full-width panel (click, Enter/Space, or hover
 *            on fine pointers); Esc closes and returns focus; one panel at a time.
 *  <1024px — a menu button opens a drawer with the same groups as an accordion,
 *            plus Log in / Get started (the header hides them on phones).
 */
export function SiteHeader() {
  const root = useRef<HTMLElement>(null)
  const pathname = usePathname()
  const [panel, setPanel] = useState<string | null>(null)
  const [drawer, setDrawer] = useState(false)
  const [section, setSection] = useState<string | null>(null)
  const scrolled = useSyncExternalStore(subscribeScroll, () => window.scrollY > 8, () => false)
  const [lastPath, setLastPath] = useState(pathname)
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { data: session } = useSession()
  const user = session?.user
  const userRole = user?.role
  const accountDashboard = userRole === "candidate" ? "/candidate/dashboard" : userRole === "employer" ? "/employer/dashboard" : userRole === "admin" ? "/admin" : null
  const accountLabel = userRole === "candidate" ? "Candidate dashboard" : userRole === "employer" ? "Employer dashboard" : userRole === "admin" ? "Admin dashboard" : "Account"

  async function handleLogout() {
    await signOut({ fetchOptions: { credentials: "include" } })
    window.location.href = "/"
  }

  // Every navigation closes whatever is open (adjusted during render, not in an effect)
  if (lastPath !== pathname) { setLastPath(pathname); setPanel(null); setDrawer(false) }

  useEffect(() => {
    document.body.classList.toggle("nav-locked", drawer)
    return () => document.body.classList.remove("nav-locked")
  }, [drawer])

  function toggleDrawer() {
    // Opening the drawer expands the group that holds the current page
    if (!drawer) setSection(primaryNav.find(group => group.items.some(item => isCurrent(pathname, item.href)))?.id ?? primaryNav[0]!.id)
    setDrawer(!drawer)
  }

  useEffect(() => {
    if (!panel && !drawer) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return
      if (panel) { root.current?.querySelector<HTMLButtonElement>(`[data-nav-trigger="${panel}"]`)?.focus(); setPanel(null) }
      else { setDrawer(false); root.current?.querySelector<HTMLButtonElement>(".menu-toggle")?.focus() }
    }
    const onPointer = (event: PointerEvent) => { if (panel && !root.current?.contains(event.target as Node)) setPanel(null) }
    document.addEventListener("keydown", onKey)
    document.addEventListener("pointerdown", onPointer)
    return () => { document.removeEventListener("keydown", onKey); document.removeEventListener("pointerdown", onPointer) }
  }, [panel, drawer])

  useGSAP(() => {
    const mm = gsap.matchMedia()
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      if (panel) gsap.fromTo(`#nav-panel-${panel} .nav-panel-intro, #nav-panel-${panel} .nav-panel-link`, { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.32, stagger: 0.035, ease: "power2.out", clearProps: "opacity,transform" })
      if (drawer) gsap.fromTo(".drawer-group, .drawer-foot", { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.36, stagger: 0.05, ease: "power3.out", clearProps: "opacity,transform" })
    })
    return () => mm.revert()
  }, { scope: root, dependencies: [panel, drawer] })

  // Hover intent on mouse pointers only; touch and pen use click
  function hover(event: ReactPointerEvent, id: string | null, delay: number) {
    if (event.pointerType !== "mouse") return
    if (hoverTimer.current) clearTimeout(hoverTimer.current)
    hoverTimer.current = setTimeout(() => setPanel(id), delay)
  }

  return <header className={cn("site-header", panel && "has-panel", scrolled && "is-scrolled")} ref={root}>
    <a className="skip-link" href="#main">Skip to content</a>
    <TransitionLink href="/" aria-label="ADDOZ home" className="brand-link"><Logo /></TransitionLink>

    <nav className="primary-nav" aria-label="Primary navigation" onPointerLeave={event => hover(event, null, 180)}>
      <ul className="primary-nav-list">
        {primaryNav.map(group => {
          const current = isCurrent(pathname, group.href) || group.items.some(item => isCurrent(pathname, item.href))
          return <li key={group.id} onPointerEnter={event => hover(event, group.id, 70)}>
            <button type="button" className={cn("nav-trigger", current && "is-current")} data-nav-trigger={group.id} aria-expanded={panel === group.id} aria-controls={`nav-panel-${group.id}`} onClick={() => setPanel(panel === group.id ? null : group.id)}>
              {group.label}{group.badge && <span className="nav-ai">{group.badge}</span>}<ChevronDown className="nav-chevron" size={15} aria-hidden="true" />
            </button>
            <div id={`nav-panel-${group.id}`} className="nav-panel" hidden={panel !== group.id}>
              <div className="nav-panel-inner">
                <div className="nav-panel-intro">
                  <p className="nav-panel-kicker">{group.label}</p>
                  <p className="nav-panel-text">{group.intro}</p>
                  <TransitionLink href={group.cta.href} className="text-link">{group.cta.label} <ArrowUpRight size={15} aria-hidden="true" /></TransitionLink>
                </div>
                <ul className="nav-panel-links">
                  {group.items.map(item => <li key={item.href}>
                    <TransitionLink href={item.href} className="nav-panel-link" aria-current={isCurrent(pathname, item.href) ? "page" : undefined}>
                      <strong>{item.label}</strong>{item.description && <span>{item.description}</span>}<ArrowUpRight size={18} aria-hidden="true" />
                    </TransitionLink>
                  </li>)}
                </ul>
              </div>
            </div>
          </li>
        })}
      </ul>
    </nav>

    <div className="header-end">
      {user ? <div className="header-actions">
        {accountDashboard && <TransitionLink className="login-link" href={accountDashboard}>{user.name ? user.name.split(" ")[0] : accountLabel}</TransitionLink>}
        <button type="button" className="action-button action-dark nav-cta" onClick={handleLogout}><LogOut size={16} aria-hidden="true" /> Log out</button>
      </div> : <div className="header-actions">
        <TransitionLink className="login-link" href={accountNav.login.href}>{accountNav.login.label}</TransitionLink>
        <TransitionLink className="action-button action-dark nav-cta" href={accountNav.register.href}>{accountNav.register.label}</TransitionLink>
      </div>}
      <button type="button" className="menu-toggle" aria-label={drawer ? "Close navigation" : "Open navigation"} aria-expanded={drawer} aria-controls="mobile-nav" onClick={toggleDrawer}>{drawer ? <X size={22} /> : <Menu size={22} />}</button>
    </div>

    <nav id="mobile-nav" className="nav-drawer" aria-label="Mobile navigation" hidden={!drawer}>
      <div className="nav-drawer-inner">
        {primaryNav.map(group => <div className="drawer-group" key={group.id}>
          <button type="button" className="drawer-trigger" aria-expanded={section === group.id} aria-controls={`drawer-${group.id}`} onClick={() => setSection(section === group.id ? null : group.id)}>
            <span>{group.label}{group.badge && <span className="nav-ai">{group.badge}</span>}</span><Plus className="drawer-plus" size={22} aria-hidden="true" />
          </button>
          <ul id={`drawer-${group.id}`} className="drawer-links" hidden={section !== group.id}>
            {/* The desktop panel's CTA (e.g. the /career-tools hub) must be reachable on phones too. */}
            {(group.items.some(item => item.href === group.cta.href) ? group.items : [group.cta, ...group.items]).map(item => <li key={item.href}><TransitionLink href={item.href} aria-current={isCurrent(pathname, item.href) ? "page" : undefined}>{item.label}<ArrowUpRight size={18} aria-hidden="true" /></TransitionLink></li>)}
          </ul>
        </div>)}
        <div className="drawer-foot">
          {user ? <>
            {accountDashboard && <TransitionLink className="action-button action-light" href={accountDashboard}>{accountLabel}</TransitionLink>}
            <button type="button" className="action-button action-dark" onClick={handleLogout}><LogOut size={17} aria-hidden="true" /> Log out</button>
          </> : <>
            <TransitionLink className="action-button action-light" href={accountNav.login.href}>{accountNav.login.label}</TransitionLink>
            <TransitionLink className="action-button action-dark" href={accountNav.register.href}>{accountNav.register.label} <ArrowUpRight size={17} aria-hidden="true" /></TransitionLink>
          </>}
        </div>
      </div>
    </nav>
  </header>
}
