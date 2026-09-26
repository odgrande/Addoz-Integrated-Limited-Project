import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { company } from "@/lib/db/schema"
import { AdminAuthError, recordAdminAction, requireAdmin } from "@/features/admin/queries"

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try { await requireAdmin(request.headers); const id = (await context.params).id; const body = await request.json().catch(() => null) as { active?: boolean; description?: string; industry?: string } | null; if (!body || (typeof body.active !== "boolean" && typeof body.description !== "string" && typeof body.industry !== "string")) return Response.json({ error: "No supported company change supplied." }, { status: 400 }); const [updated] = await db.update(company).set({ active: typeof body.active === "boolean" ? body.active : undefined, description: typeof body.description === "string" ? body.description.trim() : undefined, industry: typeof body.industry === "string" ? body.industry.trim() : undefined, updatedAt: new Date() }).where(eq(company.id, id)).returning({ id: company.id, active: company.active }); if (!updated) return Response.json({ error: "Company not found." }, { status: 404 }); await recordAdminAction(request.headers, "company.updated", "company", id); return Response.json(updated) } catch (error) { if (error instanceof AdminAuthError) return Response.json({ error: "Admin authentication required." }, { status: 401 }); return Response.json({ error: "Unable to update company." }, { status: 500 }) }
}
