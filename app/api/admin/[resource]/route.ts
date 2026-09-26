import { eq } from "drizzle-orm"
import { z } from "zod"
import { db } from "@/lib/db"
import { auditLog, category, company, location, notification, user } from "@/lib/db/schema"
import { getAdminApplications, getAdminCandidates, getAdminCompanies, getAdminEmployers, getAdminJobs, getAdminNotifications, getAdminUsers, getAdminTaxonomy, AdminAuthError, requireAdmin, recordAdminAction } from "@/features/admin/queries"

function errorResponse(error: unknown) { if (error instanceof AdminAuthError) return Response.json({ error: "Admin authentication required." }, { status: 401 }); return null }

export async function GET(request: Request, context: { params: Promise<{ resource: string }> }) {
  try {
    const resource = (await context.params).resource; const url = new URL(request.url)
    if (resource === "dashboard") return Response.json(await (await import("@/features/admin/queries")).getAdminDashboard(request.headers))
    if (resource === "jobs") return Response.json(await getAdminJobs(request.headers, { q: url.searchParams.get("q") ?? undefined, status: url.searchParams.get("status") ?? undefined, categoryId: url.searchParams.get("categoryId") ?? undefined, locationId: url.searchParams.get("locationId") ?? undefined }))
    if (resource === "applications") return Response.json(await getAdminApplications(request.headers, { q: url.searchParams.get("q") ?? undefined, stage: url.searchParams.get("stage") ?? undefined }))
    if (resource === "users") return Response.json(await getAdminUsers(request.headers, url.searchParams.get("q") ?? "", url.searchParams.get("role") ?? ""))
    if (resource === "candidates") return Response.json(await getAdminCandidates(request.headers))
    if (resource === "employers") return Response.json(await getAdminEmployers(request.headers))
    if (resource === "companies") return Response.json(await getAdminCompanies(request.headers, url.searchParams.get("q") ?? ""))
    if (resource === "categories" || resource === "locations") return Response.json(await getAdminTaxonomy(request.headers, resource))
    if (resource === "notifications") return Response.json(await getAdminNotifications(request.headers))
    if (resource === "audit") return Response.json(await (await import("@/features/admin/queries")).getAdminAudit(request.headers))
    return Response.json({ error: "Unknown admin resource." }, { status: 400 })
  } catch (error) { return errorResponse(error) ?? Response.json({ error: "Unable to load admin data." }, { status: 500 }) }
}

export async function POST(request: Request, context: { params: Promise<{ resource: string }> }) {
  try {
    const resource = (await context.params).resource; const body = await request.json().catch(() => null) as Record<string, unknown> | null; if (!body) return Response.json({ error: "Enter valid details." }, { status: 400 })
    const session = await requireAdmin(request.headers)
    if (resource === "categories" || resource === "locations") {
      const name = typeof body.name === "string" ? body.name.trim() : ""; const slug = typeof body.slug === "string" ? body.slug.trim() : name.toLowerCase().replace(/[^a-z0-9]+/g, "-")
      if (!name || !slug) return Response.json({ error: "Name and slug are required." }, { status: 400 })
      if (resource === "categories") { const [created] = await db.insert(category).values({ id: `cat_${Date.now()}`, name, slug, active: true }).returning(); await db.insert(auditLog).values({ actorUserId: session.user.id, action: "category.created", entityType: "category", entityId: created.id }); return Response.json(created, { status: 201 }) }
      const [created] = await db.insert(location).values({ id: `loc_${Date.now()}`, name, slug, active: true }).returning(); await db.insert(auditLog).values({ actorUserId: session.user.id, action: "location.created", entityType: "location", entityId: created.id }); return Response.json(created, { status: 201 })
    }
    return Response.json({ error: "Unknown admin resource." }, { status: 400 })
  } catch (error) { return errorResponse(error) ?? Response.json({ error: "Unable to create admin record." }, { status: 500 }) }
}

export async function PATCH(request: Request, context: { params: Promise<{ resource: string }> }) {
  try {
    const resource = (await context.params).resource; const body = await request.json().catch(() => null) as Record<string, unknown> | null; if (!body) return Response.json({ error: "Enter valid details." }, { status: 400 }); const session = await requireAdmin(request.headers)
    if (resource === "notifications" && typeof body.id === "string") { await db.update(notification).set({ read: true }).where(eq(notification.id, body.id)); return Response.json({ ok: true }) }
    if (resource === "settings") return Response.json({ ok: true, message: "No additional system settings are configured." })
    return Response.json({ error: "Use the resource-specific admin endpoint." }, { status: 400 })
  } catch (error) { return errorResponse(error) ?? Response.json({ error: "Unable to update admin data." }, { status: 500 }) }
}
