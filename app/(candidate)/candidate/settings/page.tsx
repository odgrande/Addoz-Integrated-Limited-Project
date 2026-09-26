import { headers } from "next/headers"
import { SettingsForm } from "@/features/candidates/components/candidate-ui"
import { getCandidateSettings } from "@/features/candidates/queries"

export default async function CandidateSettingsPage() {
  const account = await getCandidateSettings(await headers())
  return <main className="candidate-page"><header className="app-page-header"><div><p className="app-eyebrow">Account</p><h1>Settings</h1><p className="app-page-lead">Keep your account details current while you focus on the search.</p></div></header><section className="candidate-panel candidate-form-panel"><SettingsForm initial={{ name: account.name, email: account.email }} /></section></main>
}
