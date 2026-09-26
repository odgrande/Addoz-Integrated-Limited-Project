import { Mail } from "lucide-react"

export default function AdminNewsletterPage() { return <main className="admin-page"><header className="app-page-header"><div><p className="app-eyebrow">Audience</p><h1>Newsletter</h1><p className="app-page-lead">Subscriber records and delivery are not connected yet.</p></div></header><section className="admin-panel admin-empty"><Mail size={34} aria-hidden="true" /><h2>No subscribers to manage</h2><p>Mass email delivery is intentionally outside this release. A subscriber table will be added with the newsletter contract.</p></section></main> }
