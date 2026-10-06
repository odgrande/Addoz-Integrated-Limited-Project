import { headers } from "next/headers"
import { desc, isNull } from "drizzle-orm"
import { Mail, MessageSquare } from "lucide-react"
import { db } from "@/lib/db"
import { contactMessage, newsletterSubscriber } from "@/lib/db/schema"
import { requireAdmin } from "@/features/admin/queries"

const date = (value: Date) => new Date(value).toLocaleDateString("en-NG", { dateStyle: "medium" })

export default async function AdminNewsletterPage() {
  await requireAdmin(await headers())
  const [subscribers, messages] = await Promise.all([
    db.select().from(newsletterSubscriber).where(isNull(newsletterSubscriber.unsubscribedAt)).orderBy(desc(newsletterSubscriber.createdAt)).limit(500),
    db.select().from(contactMessage).orderBy(desc(contactMessage.createdAt)).limit(100),
  ])

  return <main className="admin-page">
    <header className="app-page-header"><div><p className="app-eyebrow">Audience</p><h1>Newsletter &amp; messages</h1><p className="app-page-lead">Job-update subscribers and contact form messages from the public site.</p></div></header>

    <section className="admin-panel admin-table-wrap" aria-labelledby="messages-title">
      <h2 id="messages-title" className="admin-panel-heading">Contact messages ({messages.length})</h2>
      {messages.length ? <table className="admin-table"><thead><tr><th>From</th><th>Topic</th><th>Message</th><th>Received</th></tr></thead><tbody>
        {messages.map(item => <tr key={item.id}>
          <td data-label="From" className="cell-primary"><strong>{item.name}</strong><small><a className="inline-link" href={`mailto:${item.email}`}>{item.email}</a>{item.phone ? ` · ${item.phone}` : ""}</small></td>
          <td data-label="Topic">{item.topic}</td>
          <td data-label="Message" style={{ whiteSpace: "pre-wrap", maxWidth: "36rem" }}>{item.message}</td>
          <td data-label="Received">{date(item.createdAt)}</td>
        </tr>)}
      </tbody></table> : <div className="admin-empty"><MessageSquare size={30} aria-hidden="true" /><p>No contact messages yet.</p></div>}
    </section>

    <section className="admin-panel admin-table-wrap" aria-labelledby="subscribers-title">
      <h2 id="subscribers-title" className="admin-panel-heading">Subscribers ({subscribers.length})</h2>
      {subscribers.length ? <table className="admin-table"><thead><tr><th>Email</th><th>Signed up from</th><th>Joined</th></tr></thead><tbody>
        {subscribers.map(item => <tr key={item.id}><td data-label="Email" className="cell-primary"><strong>{item.email}</strong></td><td data-label="Signed up from">{item.source ?? "—"}</td><td data-label="Joined">{date(item.createdAt)}</td></tr>)}
      </tbody></table> : <div className="admin-empty"><Mail size={30} aria-hidden="true" /><p>No subscribers yet.</p></div>}
    </section>
  </main>
}
