import { headers } from "next/headers"
import { Bell } from "lucide-react"
import { getEmployerNotifications } from "@/features/employers/queries"
import { NotificationFeed } from "@/features/notifications/notification-feed"
import { MarkNotificationsSeen } from "@/features/notifications/mark-seen"

export default async function EmployerNotificationsPage() {
  const notifications = await getEmployerNotifications(await headers())
  const unread = notifications.filter(item => !item.read).length
  return <main className="employer-page">
    <header className="app-page-header"><div><p className="app-eyebrow">Company signal</p><h1>Notifications</h1><p className="app-page-lead">{unread ? `${unread} unread · ` : ""}New applicants, messages, job reviews and announcements.</p></div></header>
    {notifications.length ? <section className="employer-panel"><NotificationFeed items={notifications} /><MarkNotificationsSeen area="employer" unread={unread} /></section>
      : <section className="employer-panel employer-empty"><Bell size={32} aria-hidden="true" /><h2>No notifications</h2><p>New applicant activity will appear here.</p></section>}
  </main>
}
