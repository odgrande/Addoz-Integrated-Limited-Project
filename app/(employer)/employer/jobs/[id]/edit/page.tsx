import Link from "next/link"
import { headers } from "next/headers"
import { ArrowUpRight } from "lucide-react"
import { JobForm } from "@/features/employers/components/employer-ui"
import { getEmployerJob, getEmployerTaxonomy } from "@/features/employers/queries"

export default async function EmployerEditJobPage({ params }: { params: Promise<{ id: string }> }) { const id = (await params).id; const requestHeaders = await headers(); const [record, taxonomy] = await Promise.all([getEmployerJob(requestHeaders, id), getEmployerTaxonomy(requestHeaders)]); return <main className="employer-page"><header className="app-page-header"><div><p className="app-eyebrow">Edit listing</p><h1>{record.job.title}</h1><p className="app-page-lead">Keep the brief accurate and the next step clear for candidates.</p></div><Link className="action-button action-ghost" href={`/employer/jobs/${id}/applicants`}>View applicants <ArrowUpRight size={15} aria-hidden="true" /></Link></header><section className="employer-panel employer-form-panel"><JobForm jobId={id} categories={taxonomy.categories} locations={taxonomy.locations} initial={record.job} /></section></main> }
