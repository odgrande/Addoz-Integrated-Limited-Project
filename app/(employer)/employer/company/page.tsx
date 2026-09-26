import { headers } from "next/headers"
import { db } from "@/lib/db"
import { location } from "@/lib/db/schema"
import { CompanyForm } from "@/features/employers/components/employer-ui"
import { getEmployerContext } from "@/features/employers/queries"

export default async function EmployerCompanyPage() { const requestHeaders = await headers(); const [context, locations] = await Promise.all([getEmployerContext(requestHeaders), db.select().from(location).orderBy(location.name)]); const company = context.company; return <main className="employer-page"><header className="app-page-header"><div><p className="app-eyebrow">Company profile</p><h1>Give good people a reason to look closer.</h1><p className="app-page-lead">A complete company profile gives every published role more context.</p></div></header><section className="employer-panel employer-form-panel"><CompanyForm locations={locations} initial={company ? { name: company.name, logo: company.logo, description: company.description, industry: company.industry, website: company.website, locationId: company.locationId, companySize: company.companySize, linkedin: company.linkedin, twitter: company.twitter } : null} /></section></main> }
