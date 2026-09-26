import type { Metadata } from "next"
import { PageHeader, Reveal, SectionHeading } from "@/components/patterns"
import { BrandShape } from "@/components/brand/brand-shape"
import { areasInState, featuredAreas, states } from "@/features/locations/data"
import { LocationCard } from "@/features/locations/components/location-card"

export const metadata: Metadata = {
  title: "Locations",
  description: "Browse ADDOZ jobs by location across Lagos and Ogun State, from popular areas to the complete list grouped by state.",
}

export default function LocationsPage() {
  return <>
    <PageHeader
      eyebrow="LOCATIONS"
      title="Jobs near you"
      lead="ADDOZ currently lists roles across these Lagos and Ogun State areas — honestly, we're just getting started. More of Nigeria is on the way."
    />
    <section className="page-section dc-locations-hero">
      <BrandShape name="target" colour="purple" className="dc-hero-shape" />
      <SectionHeading eyebrow="POPULAR" title="Where most candidates search" />
      <Reveal mode="scroll" className="location-grid">
        {featuredAreas.map((area, index) => <LocationCard key={area.slug} area={area} size="large" index={index} />)}
      </Reveal>
    </section>
    <section className="page-section tone-cream-dark">
      <SectionHeading title="Every area, by state" lead="This list grows as ADDOZ expands to more of Nigeria." />
      <div className="dc-location-groups">
        {states.map(state => <div key={state.slug} className="dc-location-group">
          <h3 className="t-h3">{state.name} State</h3>
          <div className="location-grid">
            {areasInState(state.slug).map((area, index) => <LocationCard key={area.slug} area={area} size="regular" index={index} />)}
          </div>
        </div>)}
      </div>
    </section>
  </>
}
