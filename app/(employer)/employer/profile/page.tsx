import { headers } from "next/headers"
import { EmployerProfileForm } from "@/features/employers/components/employer-ui"
import { getEmployerProfile } from "@/features/employers/queries"

export default async function EmployerProfilePage() { const data = await getEmployerProfile(await headers()); return <main className="employer-page"><header className="app-page-header"><div><p className="app-eyebrow">Your profile</p><h1>Be clear about who is hiring.</h1><p className="app-page-lead">Keep your contact details current for the people you are speaking with.</p></div></header><section className="employer-panel employer-form-panel"><EmployerProfileForm initial={{ name: data.account.name, email: data.account.email, contactName: data.profile.contactName, jobTitle: data.profile.jobTitle, phone: data.profile.phone }} /></section></main> }
