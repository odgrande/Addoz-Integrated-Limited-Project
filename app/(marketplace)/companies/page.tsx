import type { Metadata } from "next"
import { ActionButton, PageHeader, SectionHeading } from "@/components/patterns"
import { BrandShape } from "@/components/brand/brand-shape"
import { CompaniesBrowser } from "@/features/companies/components/companies-browser"

export const metadata: Metadata = {
  title: "Companies",
  description: "Meet sample employer profiles across Nigeria's industries and locations — a preview of the ADDOZ company directory.",
}

export default function CompaniesPage() {
  return <>
    <PageHeader
      eyebrow="COMPANIES"
      title="Companies hiring on ADDOZ"
      lead="These are sample employer profiles that preview what a company page looks like on ADDOZ. Real employer profiles will appear here as companies join the platform."
    />
    <CompaniesBrowser />
    <section className="page-section tone-yellow dc-employer-cta">
      <BrandShape name="starburst" colour="black" className="dc-cta-shape" />
      <SectionHeading
        eyebrow="FOR EMPLOYERS"
        title="Bring your vacancies to ADDOZ"
        lead="Create a free employer profile and start reaching candidates across Nigeria."
        action={<ActionButton href="/for-employers" variant="dark" arrow>Create your employer profile</ActionButton>}
      />
    </section>
  </>
}
