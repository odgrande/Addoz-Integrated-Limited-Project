import { headers } from "next/headers"
import { Bell } from "lucide-react"
import { NotificationActions } from "@/features/candidates/components/candidate-ui"
import { getCandidateNotifications } from "@/features/candidates/queries"

export default async function CandidateNotificationsPage() {
  const notifications = await getCandidateNotifications(await headers())
  const unread = notifications.some(item => !item.read)
  return <main className="candidate-page"><header className="app-page-header"><div><p className="app-eyebrow">Your signal</p><h1>Notifications</h1><p className="app-page-lead">Application movement, useful reminders, and updates that deserve your attention.</p></div><NotificationActions unread={unread} /></header>{notifications.length ? <section className="candidate-panel"><ul className="candidate-detail-list candidate-notification-list">{notifications.map(item => <li key={item.id} className={item.read ? "is-read" : ""}><div className="candidate-list-icon"><Bell size={18} aria-hidden="true" /></div><div className="candidate-job-main"><strong>{item.title}</strong><p>{item.body}</p></div><time>{item.createdAt ? new Date(item.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short" }) : ""}</time></li>)}</ul></section> : <section className="candidate-panel candidate-empty"><Bell size={32} aria-hidden="true" /><h2>Nothing new</h2><p>We will keep useful updates here.</p></section>}</main>
}
