import { headers } from "next/headers"
import { SettingsForm } from "@/features/employers/components/employer-ui"
import { getEmployerProfile } from "@/features/employers/queries"

export default async function EmployerSettingsPage() { const data = await getEmployerProfile(await headers()); return <main className="employer-page"><header className="app-page-header"><div><p className="app-eyebrow">Account</p><h1>Settings</h1><p className="app-page-lead">Keep your account details current. Password and verification controls remain with Better Auth.</p></div></header><section className="employer-panel employer-form-panel"><SettingsForm initial={{ name: data.account.name, email: data.account.email }} /></section></main> }
