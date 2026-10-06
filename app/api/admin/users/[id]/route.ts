import { z } from "zod"
import { AdminAuthError, recordAdminAction, requireAdmin } from "@/features/admin/queries"
import { ModerationError, deleteUserCompletely, setUserSuspended } from "@/features/admin/moderation"

function failure(error: unknown, fallback: string) {
  if (error instanceof AdminAuthError) return Response.json({ error: "Admin authentication required." }, { status: 401 })
  if (error instanceof ModerationError) return Response.json({ error: error.message }, { status: 400 })
  console.error("[admin] user action failed", error)
  return Response.json({ error: fallback }, { status: 500 })
}

const suspendSchema = z.object({ banned: z.boolean(), banReason: z.string().max(300).optional() })

/** Suspend (blocks sign-in and ends sessions) or reactivate an account. */
export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin(request.headers)
    const id = (await context.params).id
    const parsed = suspendSchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) return Response.json({ error: "Choose suspend or reactivate." }, { status: 400 })
    if (id === admin.user.id) return Response.json({ error: "You cannot suspend your own admin account." }, { status: 400 })
    await setUserSuspended(id, parsed.data.banned, parsed.data.banReason)
    await recordAdminAction(request.headers, parsed.data.banned ? "user.suspended" : "user.reactivated", "user", id, parsed.data.banReason ? { reason: parsed.data.banReason } : undefined)
    return Response.json({ id, banned: parsed.data.banned })
  } catch (error) { return failure(error, "Unable to update user.") }
}

/** Permanently delete a candidate or employer account (requires { confirm: "DELETE" }). */
export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin(request.headers)
    const id = (await context.params).id
    const body = await request.json().catch(() => null) as { confirm?: string } | null
    if (body?.confirm !== "DELETE") return Response.json({ error: "Type DELETE to confirm." }, { status: 400 })
    if (id === admin.user.id) return Response.json({ error: "You cannot delete your own admin account." }, { status: 400 })
    const deleted = await deleteUserCompletely(id)
    await recordAdminAction(request.headers, "user.deleted", "user", id, deleted)
    return Response.json({ ok: true })
  } catch (error) { return failure(error, "Unable to delete user.") }
}
