import { headers } from "next/headers"
import { JobForm } from "@/features/employers/components/employer-ui"
import { CompanyIncompleteNotice } from "@/features/employers/components/company-incomplete-notice"
import { getCompanyProfileMissing, getEmployerContext, getEmployerTaxonomy } from "@/features/employers/queries"

export default async function EmployerNewJobPage() {
  const requestHeaders = await headers()
  const [taxonomy, context] = await Promise.all([getEmployerTaxonomy(requestHeaders), getEmployerContext(requestHeaders)])
  const missing = await getCompanyProfileMissing(context.profile.companyId)
  return <main className="employer-page"><header className="app-page-header"><div><p className="app-eyebrow">New listing</p><h1>Write a role worth applying to.</h1><p className="app-page-lead">Save a draft as you shape the brief. Publish only when the details are ready.</p></div></header><CompanyIncompleteNotice missing={missing} /><section className="employer-panel employer-form-panel"><JobForm categories={taxonomy.categories} locations={taxonomy.locations} companyIncomplete={missing.length > 0} /></section></main>
}
