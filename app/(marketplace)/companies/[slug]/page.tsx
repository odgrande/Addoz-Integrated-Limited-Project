import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getPublicCompany } from "@/features/companies/public-data"
import { CompanyDetail } from "@/features/companies/components/company-detail"

type Params = Promise<{ slug: string }>

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params
  const result = await getPublicCompany(slug)
  if (!result) return { title: "Company not found" }
  const { company } = result
  return {
    title: company.name,
    description: `${company.name} is hiring on ADDOZ — ${company.openRoles ?? 0} open ${company.openRoles === 1 ? "role" : "roles"} in ${company.industry}.`,
    // Illustrative sample profiles stay out of search results
    ...(company.sample ? { robots: { index: false, follow: true } } : {}),
  }
}

export default async function CompanyPage({ params }: { params: Params }) {
  const { slug } = await params
  const result = await getPublicCompany(slug)
  if (!result) notFound()
  return <CompanyDetail company={result.company} roles={result.roles} related={result.related} />
}
