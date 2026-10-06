"use client"

import { ArrowUpRight, MapPin } from "lucide-react"
import { AppLink } from "@/components/patterns/app-link"
import { plural } from "@/lib/format"
import { useJobCount } from "@/features/jobs/job-counts"
import { getState, type Area } from "../data"

/** Location card: area, state, open roles. `large` for the six featured areas. */
export function LocationCard({ area, size = "regular", index }: { area: Area; size?: "large" | "regular"; index?: number }) {
  const count = useJobCount("locations", area.slug)
  const state = getState(area.state)
  return <AppLink href={`/locations/${area.slug}`} className={`location-card location-${size}`}>
    <span className="location-card-top">
      <MapPin size={size === "large" ? 22 : 18} aria-hidden="true" />
      {index !== undefined && <span className="location-card-index">{String(index + 1).padStart(2, "0")}</span>}
    </span>
    <span className="location-card-name">{area.name}</span>
    <span className="location-card-state">{state?.name} State, Nigeria</span>
    <span className="location-card-foot"><span>{count ? plural(count, "open role") : "No roles yet"}</span><ArrowUpRight size={20} aria-hidden="true" /></span>
  </AppLink>
}
