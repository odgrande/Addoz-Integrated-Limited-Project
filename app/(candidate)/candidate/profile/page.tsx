import { headers } from "next/headers"
import { ProfileForm } from "@/features/candidates/components/candidate-ui"
import { getCandidateProfile } from "@/features/candidates/queries"

export default async function CandidateProfilePage() {
  const data = await getCandidateProfile(await headers())
  return <main className="candidate-page"><header className="app-page-header"><div><p className="app-eyebrow">Your profile</p><h1>Make your work easy to understand.</h1><p className="app-page-lead">A clear profile gives employers the context they need before they open your resume.</p></div></header><section className="candidate-panel candidate-form-panel"><ProfileForm initial={{ name: data.user.name, headline: data.profile.headline, experience: data.profile.experience, locationId: data.profile.locationId, locations: data.locations }} /></section></main>
}
