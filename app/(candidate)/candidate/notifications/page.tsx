import Link from "next/link"
import { headers } from "next/headers"
import { Bell, BriefcaseBusiness, ChevronRight, Lightbulb, MessageSquare, UserRound } from "lucide-react"
import { NotificationActions } from "@/features/candidates/components/candidate-ui"
import { getCandidateNotifications } from "@/features/candidates/queries"

const icons = { application: BriefcaseBusiness, message: MessageSquare, alert: Bell, tip: Lightbulb, account: UserRound } as const

function when(value: Date | string | null) {
  if (!value) return ""
  const date = new Date(value)
  const sameDay = date.toDateString() === new Date().toDateString()
  return sameDay ? date.toLocaleTimeString("en-NG", { hour: "numeric", minute: "2-digit" }) : date.toLocaleDateString("en-NG", { day: "numeric", month: "short" })
}

export default async function CandidateNotificationsPage() {
  const notifications = await getCandidateNotifications(await headers())
  const unread = notifications.filter(item => !item.read).length
  return <main className="candidate-page">
    <header className="app-page-header"><div><p className="app-eyebrow">Your signal</p><h1>Notifications</h1><p className="app-page-lead">{unread ? `${unread} unread · ` : ""}Application updates, reminders and account news.</p></div><NotificationActions unread={unread > 0} /></header>
    {notifications.length ? <section className="candidate-panel"><ul className="notification-feed">{notifications.map(item => {
      const Icon = icons[(item.kind ?? "") as keyof typeof icons] ?? Bell
      const body = <><span className="notification-feed-icon" aria-hidden="true"><Icon size={18} /></span><span className="notification-feed-main"><strong>{item.title}</strong><span>{item.body}</span></span><time dateTime={item.createdAt ? new Date(item.createdAt).toISOString() : undefined}>{when(item.createdAt)}</time>{item.href && <ChevronRight className="notification-feed-go" size={16} aria-hidden="true" />}</>
      return <li key={item.id} className={item.read ? "is-read" : "is-unread"}>{!item.read && <span className="sr-only">Unread: </span>}{item.href ? <Link href={item.href}>{body}</Link> : <div>{body}</div>}</li>
    })}</ul></section>
      : <section className="candidate-panel candidate-empty"><Bell size={32} aria-hidden="true" /><h2>Nothing new</h2><p>Updates about your applications will appear here.</p></section>}
  </main>
}
