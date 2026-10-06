import type { Metadata } from "next"
import { ActionButton, PageHeader, SectionHeading } from "@/components/patterns"
import { BrandShape } from "@/components/brand/brand-shape"
import { CompaniesBrowser } from "@/features/companies/components/companies-browser"
import { listPublicCompanies } from "@/features/companies/public-data"

// Live counts and companies: rebuilt at most once a minute
export const revalidate = 60

export const metadata: Metadata = {
  title: "Companies",
  description: "Companies hiring on ADDOZ across Nigeria — browse employers by industry and location and see their open roles.",
}

export default async function CompaniesPage() {
  const companies = await listPublicCompanies().catch(error => {
    // A database hiccup during a deploy shouldn't fail the whole build: ship an
    // empty directory that refreshes within a minute. At runtime the error is
    // rethrown so the last good page keeps being served instead.
    if (process.env.NEXT_PHASE !== "phase-production-build") throw error
    console.error("[companies] directory unavailable during build", error instanceof Error ? error.message : error)
    return []
  })
  return <>
    <PageHeader
      eyebrow="COMPANIES"
      title="Companies hiring on ADDOZ"
      lead="Employers with open roles on ADDOZ right now. Browse by industry or location and see every role they are hiring for."
    />
    <CompaniesBrowser companies={companies} />
    <section className="page-section tone-yellow dc-employer-cta">
      <BrandShape name="starburst" colour="black" className="dc-cta-shape" />
      <SectionHeading
        eyebrow="FOR EMPLOYERS"
        title="Bring your vacancies to ADDOZ"
        lead="Create a free employer profile and start reaching candidates across Nigeria."
        action={<ActionButton href="/auth/register?role=employer" variant="dark" arrow>Create your employer profile</ActionButton>}
      />
    </section>
  </>
}
