import { headers } from "next/headers"
import { Bell } from "lucide-react"
import { getCandidateNotifications } from "@/features/candidates/queries"
import { NotificationFeed } from "@/features/notifications/notification-feed"
import { MarkNotificationsSeen } from "@/features/notifications/mark-seen"

export default async function CandidateNotificationsPage() {
  const notifications = await getCandidateNotifications(await headers())
  const unread = notifications.filter(item => !item.read).length
  return <main className="candidate-page">
    <header className="app-page-header"><div><p className="app-eyebrow">Your signal</p><h1>Notifications</h1><p className="app-page-lead">{unread ? `${unread} unread · ` : ""}Application updates, messages and announcements.</p></div></header>
    {notifications.length ? <section className="candidate-panel"><NotificationFeed items={notifications} /><MarkNotificationsSeen area="candidate" unread={unread} /></section>
      : <section className="candidate-panel candidate-empty"><Bell size={32} aria-hidden="true" /><h2>Nothing new</h2><p>Updates about your applications will appear here.</p></section>}
  </main>
}
