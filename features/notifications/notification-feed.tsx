import Link from "next/link"
import { Bell, BriefcaseBusiness, ChevronRight, Lightbulb, Megaphone, MessageSquare, UserRound } from "lucide-react"

const icons = { application: BriefcaseBusiness, message: MessageSquare, announcement: Megaphone, alert: Bell, tip: Lightbulb, account: UserRound } as const

type Item = { id: string; kind: string | null; title: string; body: string; read: boolean | null; href: string | null; createdAt: Date | string | null }

function when(value: Date | string | null) {
  if (!value) return ""
  const date = new Date(value)
  return date.toDateString() === new Date().toDateString()
    ? date.toLocaleTimeString("en-NG", { hour: "numeric", minute: "2-digit" })
    : date.toLocaleDateString("en-NG", { day: "numeric", month: "short" })
}

/** Candidate and employer notification list: unread highlighted, linked items open their page. */
export function NotificationFeed({ items }: { items: Item[] }) {
  return <ul className="notification-feed">{items.map(item => {
    const Icon = icons[(item.kind ?? "") as keyof typeof icons] ?? Bell
    const body = <><span className="notification-feed-icon" aria-hidden="true"><Icon size={18} /></span><span className="notification-feed-main"><strong>{item.title}</strong><span>{item.body}</span></span><time dateTime={item.createdAt ? new Date(item.createdAt).toISOString() : undefined}>{when(item.createdAt)}</time>{item.href && <ChevronRight className="notification-feed-go" size={16} aria-hidden="true" />}</>
    return <li key={item.id} className={item.read ? "is-read" : "is-unread"}>{!item.read && <span className="sr-only">Unread: </span>}{item.href ? <Link href={item.href}>{body}</Link> : <div>{body}</div>}</li>
  })}</ul>
}
