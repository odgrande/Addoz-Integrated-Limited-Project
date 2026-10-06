import type { Metadata } from "next"
import { headers } from "next/headers"
import { and, count, desc, eq, isNull, or } from "drizzle-orm"
import { db } from "@/lib/db"
import { auditLog, user } from "@/lib/db/schema"
import { requireAdmin } from "@/features/admin/queries"
import { BroadcastForm, BroadcastHistory, type BroadcastRecord } from "@/features/admin/components/broadcast-ui"

export const metadata: Metadata = { title: "Broadcasts" }

export default async function AdminBroadcastsPage() {
  await requireAdmin(await headers())
  const active = or(isNull(user.banned), eq(user.banned, false))!
  const [[candidates], [employers], history] = await Promise.all([
    db.select({ value: count(user.id) }).from(user).where(and(eq(user.role, "candidate"), active)),
    db.select({ value: count(user.id) }).from(user).where(and(eq(user.role, "employer"), active)),
    db.select({ id: auditLog.id, metadata: auditLog.metadata, createdAt: auditLog.createdAt }).from(auditLog).where(eq(auditLog.action, "notification.broadcast")).orderBy(desc(auditLog.createdAt)).limit(30),
  ])
  const items: BroadcastRecord[] = history.map(row => ({ id: row.id, createdAt: row.createdAt.toISOString(), ...(JSON.parse(row.metadata ?? "{}") as Omit<BroadcastRecord, "id" | "createdAt">) }))
  return <main className="admin-page">
    <header className="app-page-header"><div><p className="app-eyebrow">Announcements</p><h1>Broadcasts</h1><p className="app-page-lead">Send a notification to candidates, employers, everyone, or one person. It appears in their notifications and the bell shows a red unread badge.</p></div></header>
    <div className="broadcast-layout">
      <section className="admin-panel"><BroadcastForm counts={{ candidates: Number(candidates?.value ?? 0), employers: Number(employers?.value ?? 0) }} /></section>
      <section className="admin-panel"><h2 className="broadcast-heading">Sent</h2><BroadcastHistory items={items} /></section>
    </div>
  </main>
}
