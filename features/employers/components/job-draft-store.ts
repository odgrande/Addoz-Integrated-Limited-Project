"use client"

import { useCallback, useSyncExternalStore } from "react"
import type { JobDraft } from "./job-post-form"

/**
 * Autosaved draft for the public "Post a job" form — kept in this browser
 * only (localStorage), same useSyncExternalStore + localStorage shape as
 * features/jobs/saved-jobs.ts. Production replaces this with a real draft
 * saved against the employer's account.
 */
const KEY = "addoz:job-draft"

export type SavedDraft = { draft: JobDraft; step: number; savedAt: string }

const listeners = new Set<() => void>()
let cache: SavedDraft | null | undefined

function read(): SavedDraft | null {
  if (cache !== undefined) return cache
  try {
    const raw = window.localStorage.getItem(KEY)
    cache = raw ? (JSON.parse(raw) as SavedDraft) : null
  } catch {
    cache = null
  }
  return cache
}

function write(next: SavedDraft | null) {
  cache = next
  try {
    if (next) window.localStorage.setItem(KEY, JSON.stringify(next))
    else window.localStorage.removeItem(KEY)
  } catch { /* private mode: keep in memory only */ }
  listeners.forEach(listener => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  const onStorage = (event: StorageEvent) => { if (event.key === KEY) { cache = undefined; listener() } }
  window.addEventListener("storage", onStorage)
  return () => { listeners.delete(listener); window.removeEventListener("storage", onStorage) }
}

export function useJobDraftStore() {
  const saved = useSyncExternalStore(subscribe, read, () => null)
  const save = useCallback((draft: JobDraft, step: number) => write({ draft, step, savedAt: new Date().toISOString() }), [])
  const discard = useCallback(() => write(null), [])
  return { saved, save, discard }
}

/** Does this draft hold anything worth offering to restore or resume? */
export function draftHasContent(draft: JobDraft): boolean {
  return Boolean(draft.title.trim() || draft.company.trim() || draft.description.trim() || draft.requirements.trim() || draft.skills.length)
}
