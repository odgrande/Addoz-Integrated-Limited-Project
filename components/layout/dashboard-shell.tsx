"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ArrowUpRight, Bell, LogOut, Menu, X } from "lucide-react"
import { Logo } from "@/components/addoz/site-header"
import { LinkModeProvider } from "@/components/patterns/app-link"
import { useAppMotion } from "@/components/motion/app-motion"
import { appConfigs, type AppConfig, type AppId, type AppNavItem } from "./app-nav"
import { cn } from "@/lib/utils"
import { signOut } from "@/lib/auth-client"

function useActiveHref(items: AppNavItem[]) {
  const pathname = usePathname()
  const matches = items.filter(item => (item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`)))
  return matches.sort((a, b) => b.href.length - a.href.length)[0]?.href
}

/**
 * The shared application frame for the candidate, employer and admin workspaces.
 * One structure, three temperaments (data-app): candidate is calm cream, employer
 * runs on a black sidebar, admin is compact and dense.
 *  ≥1024px  fixed sidebar + top bar
 *  768–1023 top bar + slide-over navigation
 *  <768     top bar + slide-over + bottom tab bar (candidate, employer)
 */
export function DashboardShell({ app, children, unread: initialUnread = 0, user }: { app: AppId; children: ReactNode; unread?: number; user?: AppConfig["user"] }) {
  const config = user ? { ...appConfigs[app], user } : appConfigs[app]
  const root = useRef<HTMLDivElement>(null)
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [lastPath, setLastPath] = useState(pathname)
  const allItems = config.sections.flatMap(section => section.items)
  const active = useActiveHref(allItems)
  useAppMotion(root, [pathname])

  // Keep the bell's unread badge current without a reload (new messages, broadcasts, application updates)
  const [unread, setUnread] = useState(initialUnread)
  useEffect(() => { setUnread(initialUnread) }, [initialUnread])
  useEffect(() => {
    let stopped = false
    const check = () => { if (document.visibilityState === "visible") fetch("/api/notifications/unread", { cache: "no-store" }).then(response => response.ok ? response.json() : null).then(data => { if (!stopped && data && typeof data.unread === "number") setUnread(data.unread) }).catch(() => undefined) }
    const timer = setInterval(check, 30_000)
    const seen = () => setUnread(0)
    window.addEventListener("focus", check)
    window.addEventListener("addoz:notifications-seen", seen)
    return () => { stopped = true; clearInterval(timer); window.removeEventListener("focus", check); window.removeEventListener("addoz:notifications-seen", seen) }
  }, [])

  async function handleLogout() {
    const redirectPath = app === "admin"
      ? "/auth/admin/login?redirect=/admin"
      : app === "employer"
        ? "/auth/login?role=employer&redirect=/employer/dashboard"
        : "/auth/login?role=candidate&redirect=/candidate/dashboard"
    try {
      await signOut({ fetchOptions: { credentials: "include" } })
    } finally {
      // Full load so no signed-in screen lingers in the client router cache
      window.location.assign(redirectPath)
    }
  }

  // Navigating closes the drawer (adjusted during render, not in an effect)
  if (lastPath !== pathname) { setLastPath(pathname); setOpen(false) }
  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false) }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [open])

  const nav = <nav className="app-nav" aria-label={`${config.name} navigation`}>
    {config.sections.map((section, index) => <div className="app-nav-section" key={section.title ?? index}>
      {section.title && <p className="app-nav-title">{section.title}</p>}
      <ul>
        {section.items.map(item => <li key={item.href}>
          <Link href={item.href} className={cn("app-nav-link", active === item.href && "is-active")} aria-current={active === item.href ? "page" : undefined}>
            <item.icon size={18} aria-hidden="true" /><span>{item.label}</span>
            {item.href.endsWith("/notifications") && unread > 0 && <span className="app-nav-count" aria-label={`${unread} unread`}>{unread}</span>}
          </Link>
        </li>)}
      </ul>
    </div>)}
    {config.shortcuts.length > 0 && <div className="app-nav-section app-nav-shortcuts">
      <p className="app-nav-title">ADDOZ</p>
      <ul>{config.shortcuts.map(item => <li key={item.href}><Link href={item.href} className="app-nav-link"><item.icon size={18} aria-hidden="true" /><span>{item.label}</span><ArrowUpRight className="app-nav-out" size={14} aria-hidden="true" /></Link></li>)}</ul>
    </div>}
  </nav>

  const tabs = allItems.filter(item => config.tabs.includes(item.href))

  return <LinkModeProvider mode="instant">
    <div ref={root} className="app-shell" data-app={app}>
      <a className="skip-link" href="#main">Skip to content</a>
      <aside className="app-sidebar" aria-label={`${config.name} workspace`}>
        <Link href={config.home} className="app-brand" aria-label={`ADDOZ ${config.name} home`}><Logo /><span className="app-badge">{config.name}</span></Link>
        {nav}
        <div className="app-sidebar-foot">
          <span className="app-avatar" aria-hidden="true">{config.user.initials}</span>
          <span className="app-user"><strong>{config.user.name}</strong><small>{config.user.role}</small></span>
          <button type="button" className="app-icon-button" aria-label="Log out" onClick={handleLogout}><LogOut size={17} /></button>
        </div>
      </aside>

      <div className={cn("app-drawer", open && "is-open")} hidden={!open}>
        <div className="app-drawer-backdrop" onClick={() => setOpen(false)} aria-hidden="true" />
        <div className="app-drawer-panel" role="dialog" aria-modal="true" aria-label={`${config.name} navigation`}>
          <div className="app-drawer-head">
            <Link href={config.home} className="app-brand"><Logo /><span className="app-badge">{config.name}</span></Link>
            <button type="button" className="app-icon-button" onClick={() => setOpen(false)} aria-label="Close navigation"><X size={20} /></button>
          </div>
          {nav}
        </div>
      </div>

      <div className="app-frame">
        <header className="app-topbar">
          <button type="button" className="app-icon-button app-menu" onClick={() => setOpen(true)} aria-label="Open navigation" aria-expanded={open}><Menu size={20} /></button>
          <Link href={config.home} className="app-topbar-brand" aria-label={`ADDOZ ${config.name} home`}><Logo /><span className="app-badge">{config.name}</span></Link>
          <div className="app-topbar-end">
            <Link href={`${config.home}/${app === "admin" ? "settings" : "notifications"}`} className="app-icon-button app-bell" aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}>
              <Bell size={18} />{unread > 0 && <span className="app-bell-dot" aria-hidden="true">{unread > 99 ? "99+" : unread}</span>}
            </Link>
            <span className="app-avatar app-avatar-top" title={config.user.name} aria-hidden="true">{config.user.initials}</span>
          </div>
        </header>
        <main id="main" className="app-main">{children}</main>
      </div>

      {tabs.length > 0 && <nav className="app-tabbar" aria-label={`${config.name} quick navigation`}>
        {tabs.map(item => <Link key={item.href} href={item.href} className={cn("app-tab", active === item.href && "is-active")} aria-current={active === item.href ? "page" : undefined}><item.icon size={20} aria-hidden="true" /><span>{item.label}</span></Link>)}
        <button type="button" className="app-tab" onClick={() => setOpen(true)} aria-label="More navigation"><Menu size={20} aria-hidden="true" /><span>More</span></button>
      </nav>}
    </div>
  </LinkModeProvider>
}
