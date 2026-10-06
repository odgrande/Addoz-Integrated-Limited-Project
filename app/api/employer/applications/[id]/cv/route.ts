import { and, eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { job, jobApplication } from "@/lib/db/schema"
import { EmployerAuthError, EmployerOwnershipError, requireEmployer } from "@/features/employers/queries"
import { storedFileResponse } from "@/lib/storage/serve"

/** Download the CV attached to an application for one of the employer's own jobs. */
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { profile } = await requireEmployer(request.headers)
    if (!profile.companyId) throw new EmployerOwnershipError()
    const { id } = await context.params
    if (!/^[0-9a-f-]{36}$/i.test(id)) throw new EmployerOwnershipError()
    const [record] = await db.select({ storageKey: jobApplication.cvStorageKey, fileName: jobApplication.cvFileName, mimeType: jobApplication.cvMimeType })
      .from(jobApplication).innerJoin(job, eq(jobApplication.jobId, job.id))
      .where(and(eq(jobApplication.id, id), eq(job.companyId, profile.companyId))).limit(1)
    if (!record?.storageKey) return Response.json({ error: "CV not found." }, { status: 404 })
    return await storedFileResponse(record as { storageKey: string; fileName: string | null; mimeType: string | null })
  } catch (error) {
    if (error instanceof EmployerAuthError) return Response.json({ error: "Authentication required." }, { status: 401 })
    if (error instanceof EmployerOwnershipError) return Response.json({ error: "CV not found." }, { status: 404 })
    console.error("[employer] CV download failed", error)
    return Response.json({ error: "Unable to download this CV." }, { status: 500 })
  }
}
