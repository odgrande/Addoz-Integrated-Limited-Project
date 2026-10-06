import type { Metadata } from "next"
import { cache } from "react"
import { notFound } from "next/navigation"
import { and, eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { location } from "@/lib/db/schema"
import { areas, getArea, getState, type Area } from "@/features/locations/data"
import { LocationDetail } from "@/features/locations/components/location-detail"
import { searchMarketplace } from "@/features/jobs/public-data"

type Params = Promise<{ slug: string }>

export function generateStaticParams() {
  return areas.map(area => ({ slug: area.slug }))
}

/** A curated area, or any other active location an admin added. */
const findArea = cache(async (slug: string): Promise<Area | null> => {
  const known = getArea(slug)
  if (known) return known
  const [row] = await db.select({ slug: location.slug, name: location.name }).from(location).where(and(eq(location.slug, slug), eq(location.active, true))).limit(1)
  return row ? { slug: row.slug, name: row.name, state: "", featured: false } : null
})

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params
  const area = await findArea(slug)
  if (!area) return { title: "Location not found" }
  const state = getState(area.state)
  return { title: `Jobs in ${area.name}`, description: `Browse open roles in ${area.name}${state ? `, ${state.name} State` : ""} on ADDOZ.` }
}

export default async function LocationPage({ params }: { params: Params }) {
  const { slug } = await params
  const area = await findArea(slug)
  if (!area) notFound()
  const result = await searchMarketplace({ location: slug, page: 1 })
  return <LocationDetail area={area} jobs={result.jobs} />
}
