"use client"

import { Flip, gsap, reducedMotion } from "@/lib/motion"

/**
 * Card → detail → application continuity (Directive 007 §6).
 * When a job card is opened, its mark and title are recorded with Flip. The job
 * page then flies its own mark and title in from exactly where they were on the
 * card, while the rest of the page settles in. Elements are matched by
 * data-flip-id ("job-mark-<slug>", "job-title-<slug>").
 */
let pending: { slug: string; state: Flip.FlipState } | null = null

export function captureJobCard(card: Element, slug: string) {
  if (reducedMotion()) return
  const targets = card.querySelectorAll(`[data-flip-id="job-mark-${slug}"], [data-flip-id="job-title-${slug}"]`)
  if (targets.length) pending = { slug, state: Flip.getState(targets) }
}

/** Play the recorded transition on the job page. Returns true if it ran. */
export function playJobArrival(scope: Element, slug: string) {
  const record = pending
  pending = null
  if (!record || record.slug !== slug || reducedMotion()) return false
  const targets = scope.querySelectorAll(`[data-flip-id="job-mark-${slug}"], [data-flip-id="job-title-${slug}"]`)
  if (!targets.length) return false
  Flip.from(record.state, { targets, duration: 0.75, ease: "power3.inOut", absolute: true, scale: true, zIndex: 20 })
  gsap.from(scope.querySelectorAll("[data-arrive]"), { opacity: 0, y: 18, duration: 0.6, ease: "power3.out", stagger: 0.06, delay: 0.3, clearProps: "opacity,transform" })
  return true
}

/** Whether the page was reached from a card (lets the page skip its own entrance). */
export function hasPendingArrival(slug: string) {
  return pending?.slug === slug
}
