import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { companies, getCompany } from "@/features/companies/data"
import { CompanyDetail } from "@/features/companies/components/company-detail"

type Params = Promise<{ slug: string }>

export function generateStaticParams() {
  return companies.map(company => ({ slug: company.slug }))
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params
  const company = getCompany(slug)
  if (!company) return { title: "Company not found" }
  return {
    title: company.name,
    description: `${company.name} — a sample ${company.industry} employer profile on ADDOZ, previewing the company directory.`,
    // Sample profiles are illustrative, so they stay out of search results
    robots: { index: false, follow: true },
  }
}

export default async function CompanyPage({ params }: { params: Params }) {
  const { slug } = await params
  const company = getCompany(slug)
  if (!company) notFound()
  return <CompanyDetail company={company} />
}
