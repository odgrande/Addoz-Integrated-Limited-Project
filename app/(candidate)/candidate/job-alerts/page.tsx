import { headers } from "next/headers"
import { db } from "@/lib/db"
import { category, location } from "@/lib/db/schema"
import { AlertActions, AlertForm } from "@/features/candidates/components/candidate-ui"
import { getCandidateAlerts } from "@/features/candidates/queries"

export default async function CandidateJobAlertsPage() {
  const requestHeaders = await headers()
  const [alerts, categories, locations] = await Promise.all([getCandidateAlerts(requestHeaders), db.select().from(category).orderBy(category.name), db.select().from(location).orderBy(location.name)])
  return <main className="candidate-page"><header className="app-page-header"><div><p className="app-eyebrow">Stay close to the right roles</p><h1>Job alerts</h1><p className="app-page-lead">Set the signal once, then let ADDOZ help you notice useful opportunities.</p></div></header><section className="candidate-panel candidate-form-panel"><div className="panel-heading"><div><p className="app-eyebrow">New alert</p><h2>What should we watch for?</h2></div></div><AlertForm categories={categories} locations={locations} /></section><section className="candidate-panel"><div className="panel-heading"><div><p className="app-eyebrow">Your signals</p><h2>Saved alerts</h2></div></div>{alerts.length ? <ul className="candidate-detail-list">{alerts.map(item => <li key={item.id}><div className="candidate-job-main"><strong>{item.name}</strong><small>{[item.keywords, item.categoryName, item.locationName, item.workplace].filter(Boolean).join(" · ") || "Any matching role"} · {item.frequency}</small></div><AlertActions id={item.id} active={item.active} /></li>)}</ul> : <div className="candidate-empty"><p>No alerts yet. Add one above when you know what you want to hear about.</p></div>}</section></main>
}
