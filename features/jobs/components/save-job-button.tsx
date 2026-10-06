"use client"

import { useEffect, useRef, useState } from "react"
import { Bookmark } from "lucide-react"
import { gsap, reducedMotion } from "@/lib/motion"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/patterns/toast"

// Pages without server-resolved saved state share one lookup per page load
// instead of one request per card.
let savedSlugs: Promise<Set<string>> | null = null
function loadSavedSlugs() {
  savedSlugs ??= fetch("/api/candidate/saved-jobs")
    .then(response => response.ok ? response.json() as Promise<{ slug: string }[]> : [])
    .then(items => new Set(items.map(item => item.slug)))
    .catch(() => new Set<string>())
  return savedSlugs
}

/** Save / unsave a job through the authenticated candidate API. */
export function SaveJobButton({ slug, title, saved: savedOnServer, variant = "icon", className }: { slug: string; title: string; saved?: boolean; variant?: "icon" | "button"; className?: string }) {
  const [saved, setSaved] = useState(Boolean(savedOnServer))
  const [busy, setBusy] = useState(false)
  const toast = useToast()
  const icon = useRef<SVGSVGElement>(null)
  useEffect(() => {
    if (savedOnServer !== undefined) { setSaved(savedOnServer); return }
    let active = true
    loadSavedSlugs().then(slugs => { if (active) setSaved(slugs.has(slug)) })
    return () => { active = false }
  }, [slug, savedOnServer])
  async function onClick() {
    if (busy) return
    const before = saved
    setSaved(!before)
    setBusy(true)
    try {
      const response = await fetch("/api/candidate/saved-jobs", { method: before ? "DELETE" : "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(before ? { jobSlug: slug } : { jobSlug: slug }) })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) {
        if (response.status === 401) { window.location.href = `/auth/login?role=candidate&redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`; return }
        throw new Error(payload.error || "Unable to save this job.")
      }
      const nowSaved = Boolean(payload.saved)
      setSaved(nowSaved)
      savedSlugs = null
      toast(nowSaved ? { title: "Saved for later", body: `${title} is in your saved jobs.` } : { title: "Removed from saved jobs", body: title, tone: "info" })
    } catch {
      setSaved(before)
      toast({ title: "Could not update saved jobs", body: "Please try again.", tone: "info" })
    } finally { setBusy(false) }
    if (icon.current && !reducedMotion()) gsap.fromTo(icon.current, { scale: 0.55 }, { scale: 1, duration: 0.5, ease: "back.out(3)", clearProps: "transform" })
  }
  if (variant === "button") return <button type="button" className={cn("action-button action-light save-cta", saved && "is-saved", className)} aria-pressed={saved} onClick={onClick}>
    <Bookmark ref={icon} size={18} fill={saved ? "currentColor" : "none"} aria-hidden="true" /><span>{saved ? "Saved" : "Save job"}</span>
  </button>
  return <button type="button" className={cn("save-button", className)} aria-pressed={saved} aria-label={saved ? `Unsave ${title}` : `Save ${title}`} onClick={onClick}>
    <Bookmark ref={icon} size={19} fill={saved ? "currentColor" : "none"} />
  </button>
}
