import { and, eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { savedApplicant } from "@/lib/db/schema"
import { EmployerAuthError, EmployerOwnershipError, getEmployerApplicant, isMissingTable, requireEmployer } from "@/features/employers/queries"

async function handle(request: Request, context: { params: Promise<{ id: string }> }, save: boolean) {
  try {
    const id = (await context.params).id
    const { session } = await requireEmployer(request.headers)
    await getEmployerApplicant(request.headers, id) // ownership
    if (save) await db.insert(savedApplicant).values({ employerUserId: session.user.id, applicationId: id }).onConflictDoNothing()
    else await db.delete(savedApplicant).where(and(eq(savedApplicant.employerUserId, session.user.id), eq(savedApplicant.applicationId, id)))
    return Response.json({ ok: true, saved: save })
  } catch (error) {
    if (error instanceof EmployerAuthError) return Response.json({ error: "Authentication required." }, { status: 401 })
    if (error instanceof EmployerOwnershipError) return Response.json({ error: "Applicant not found." }, { status: 404 })
    if (isMissingTable(error)) return Response.json({ error: "Saving applicants needs a one-time database update. Please contact ADDOZ support." }, { status: 503 })
    console.error("[employer] saving applicant failed", error)
    return Response.json({ error: "Unable to update saved applicants." }, { status: 500 })
  }
}

/** Save an applicant to come back to later. */
export const PUT = (request: Request, context: { params: Promise<{ id: string }> }) => handle(request, context, true)
/** Remove an applicant from saved applicants. */
export const DELETE = (request: Request, context: { params: Promise<{ id: string }> }) => handle(request, context, false)
