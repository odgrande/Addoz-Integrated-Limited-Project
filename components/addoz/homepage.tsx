"use client"

import { useRef } from "react"
import { Hero, OpportunityTicker } from "./hero"
import { JobDiscovery } from "./job-discovery"
import { Explore } from "./explore"
import { CareerJourney } from "./career-journey"
import { CareerIntelligence, EmployerSection } from "./ecosystem"
import { Community } from "./community"
import { Newsletter, SiteFooter } from "./site-footer"
import { SiteHeader } from "./site-header"
import { useSiteMotion } from "@/components/motion/site-motion"
import type { Job } from "@/features/jobs/data"

/**
 * Homepage rhythm (ADDOZ-SLEEK-DESIGN-SPEC §3): quiet hero → thin ticker → product
 * board → bold explore → product story → bold employer → quiet tools → editorial
 * community → quiet close → footer.
 */
export function Homepage({ jobs }: { jobs: Job[] }) {
  const root = useRef<HTMLDivElement>(null)
  // Headline reveals, label decode, magnetic CTAs and the hover layer — shared with
  // every public page (components/motion/site-motion.ts)
  useSiteMotion(root)
  return <div ref={root} className="home">
    <SiteHeader />
    <main id="main" className="home-main">
      <Hero />
      <OpportunityTicker />
      <JobDiscovery jobs={jobs} />
      <Explore />
      <CareerJourney />
      <EmployerSection />
      <CareerIntelligence />
      <Community />
      <Newsletter />
    </main>
    <SiteFooter />
  </div>
}
