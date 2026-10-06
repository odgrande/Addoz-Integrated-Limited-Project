import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { areas, getArea, getState } from "@/features/locations/data"
import { LocationDetail } from "@/features/locations/components/location-detail"
import { searchMarketplace } from "@/features/jobs/public-data"

type Params = Promise<{ slug: string }>

export function generateStaticParams() {
  return areas.map(area => ({ slug: area.slug }))
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params
  const area = getArea(slug)
  if (!area) return { title: "Location not found" }
  const state = getState(area.state)
  return { title: `Jobs in ${area.name}`, description: `Browse open roles in ${area.name}${state ? `, ${state.name} State` : ""} on ADDOZ.` }
}

export default async function LocationPage({ params }: { params: Params }) {
  const { slug } = await params
  const area = getArea(slug)
  if (!area) notFound()
  const result = await searchMarketplace({ location: slug, page: 1 })
  return <LocationDetail area={area} jobs={result.jobs} />
}
