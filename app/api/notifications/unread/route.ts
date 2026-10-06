import { and, count, eq, or, isNull } from "drizzle-orm"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { notification } from "@/lib/db/schema"

/** The signed-in user's unread notification count — polled by the dashboard bell. */
export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers }).catch(() => null)
  if (!session?.user) return Response.json({ unread: 0 }, { status: 401 })
  const [row] = await db.select({ value: count(notification.id) }).from(notification)
    .where(and(eq(notification.userId, session.user.id), or(eq(notification.read, false), isNull(notification.read))))
  return Response.json({ unread: Number(row?.value ?? 0) }, { headers: { "Cache-Control": "private, no-store" } })
}
