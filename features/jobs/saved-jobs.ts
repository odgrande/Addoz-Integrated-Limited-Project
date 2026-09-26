"use client"

import { useCallback, useSyncExternalStore } from "react"

/**
 * Saved jobs for the prototype: kept in this browser only (localStorage), shared
 * by job cards, the job page and the candidate dashboard. Production replaces it
 * with the saved_jobs table behind a signed-in candidate.
 */
const KEY = "addoz:saved-jobs"
const listeners = new Set<() => void>()
let cache: string[] | null = null
const EMPTY: string[] = []

function read(): string[] {
  if (cache) return cache
  try { cache = JSON.parse(window.localStorage.getItem(KEY) ?? "[]") as string[] } catch { cache = [] }
  return cache
}

function write(next: string[]) {
  cache = next
  try { window.localStorage.setItem(KEY, JSON.stringify(next)) } catch { /* private mode: keep in memory */ }
  listeners.forEach(listener => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  const onStorage = (event: StorageEvent) => { if (event.key === KEY) { cache = null; listener() } }
  window.addEventListener("storage", onStorage)
  return () => { listeners.delete(listener); window.removeEventListener("storage", onStorage) }
}

export function useSavedJobs() {
  const saved = useSyncExternalStore(subscribe, read, () => EMPTY)
  const toggle = useCallback((slug: string) => {
    const current = read()
    const next = current.includes(slug) ? current.filter(item => item !== slug) : [...current, slug]
    write(next)
    return next.includes(slug)
  }, [])
  const isSaved = useCallback((slug: string) => saved.includes(slug), [saved])
  return { saved, toggle, isSaved }
}
