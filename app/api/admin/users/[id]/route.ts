import { and, eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { user } from "@/lib/db/schema"
import { AdminAuthError, recordAdminAction, requireAdmin } from "@/features/admin/queries"

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdmin(request.headers); const id = (await context.params).id; const body = await request.json().catch(() => null) as { banned?: boolean; banReason?: string } | null
    if (typeof body?.banned !== "boolean") return Response.json({ error: "Only account suspension state can be changed here." }, { status: 400 })
    if (id === session.user.id) return Response.json({ error: "You cannot suspend your own admin account." }, { status: 400 })
    const [updated] = await db.update(user).set({ banned: body.banned, banReason: body.banned ? (body.banReason?.trim() || "Administrative suspension") : null, updatedAt: new Date() }).where(eq(user.id, id)).returning({ id: user.id, banned: user.banned })
    if (!updated) return Response.json({ error: "User not found." }, { status: 404 })
    await recordAdminAction(request.headers, body.banned ? "user.suspended" : "user.reactivated", "user", id)
    return Response.json(updated)
  } catch (error) { if (error instanceof AdminAuthError) return Response.json({ error: "Admin authentication required." }, { status: 401 }); return Response.json({ error: "Unable to update user." }, { status: 500 }) }
}
