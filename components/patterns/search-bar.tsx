"use client"

import type { FormEvent } from "react"
import { MapPin, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { areas, states } from "@/features/locations/data"

type SearchLocation = { slug: string; name: string; state?: string }

/**
 * The big ADDOZ search (keyword + location + go), same language as the hero search.
 * Controlled: the page owns the state, so it can sync filters and the URL.
 */
export function SearchBar({ query, location, onQueryChange, onLocationChange, onSubmit, size = "large", label = "Search jobs", placeholder = "Job title, skills or keywords", submitLabel = "Search", className, locations }: {
  query: string
  location: string
  onQueryChange: (value: string) => void
  onLocationChange: (value: string) => void
  onSubmit?: () => void
  size?: "large" | "compact"
  label?: string
  placeholder?: string
  submitLabel?: string
  className?: string
  locations?: SearchLocation[]
}) {
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); onSubmit?.() }
  return <form role="search" aria-label={label} className={cn("search-bar", `search-${size}`, className)} onSubmit={submit}>
    <label className="search-field search-keyword-field">
      <span className="sr-only">Keywords</span>
      <Search size={size === "large" ? 22 : 18} aria-hidden="true" />
      <input type="search" value={query} placeholder={placeholder} onChange={event => onQueryChange(event.target.value)} enterKeyHint="search" />
    </label>
    <label className="search-field search-location-field">
      <span className="sr-only">Location</span>
      <MapPin size={size === "large" ? 20 : 17} aria-hidden="true" />
      <select value={location} onChange={event => onLocationChange(event.target.value)}>
        <option value="">All locations</option>
        {locations ? locations.map(item => <option key={item.slug} value={item.slug}>{item.name}</option>) : states.map(state => <optgroup key={state.slug} label={`${state.name} State`}>
          {areas.filter(area => area.state === state.slug).map(area => <option key={area.slug} value={area.slug}>{area.name}</option>)}
        </optgroup>)}
      </select>
    </label>
    <button type="submit" className="action-button action-blue search-submit">{submitLabel}</button>
  </form>
}
