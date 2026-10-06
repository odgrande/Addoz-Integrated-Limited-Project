import { and, eq } from "drizzle-orm"
import { z } from "zod"
import { db } from "@/lib/db"
import { candidateProfile, company, jobApplication, job } from "@/lib/db/schema"
import { GUEST_ACCOUNT_FOOTER, notify } from "@/lib/notify"
import { EmployerAuthError, EmployerOwnershipError, getEmployerApplicants, requireEmployer } from "@/features/employers/queries"
import { employerStages } from "@/features/employers/stages"

const stageSchema = z.object({ stage: z.enum(employerStages) })

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { profile } = await requireEmployer(request.headers)
    const id = (await context.params).id
    const parsed = stageSchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) return Response.json({ error: "Choose a valid application stage." }, { status: 400 })
    const applications = await getEmployerApplicants(request.headers)
    const application = applications.find(item => item.id === id)
    if (!application) throw new EmployerOwnershipError()
    const [updated] = await db.update(jobApplication).set({ stage: parsed.data.stage }).from(job).where(and(eq(jobApplication.id, id), eq(jobApplication.jobId, job.id), eq(job.companyId, profile.companyId!))).returning()

    // Tell the candidate when their application moves (not for a reset back to "Applied")
    if (updated && parsed.data.stage !== application.stage && parsed.data.stage !== "Applied") {
      const [details] = await db.select({ userId: candidateProfile.userId, title: job.title, companyName: company.name })
        .from(jobApplication).innerJoin(job, eq(jobApplication.jobId, job.id)).innerJoin(company, eq(job.companyId, company.id))
        .innerJoin(candidateProfile, eq(jobApplication.candidateId, candidateProfile.id)).where(eq(jobApplication.id, id)).limit(1)
      if (details) await notify({
        userIds: [details.userId],
        kind: "application",
        title: `Application update: ${details.title}`,
        body: `Your application for ${details.title} at ${details.companyName} is now "${parsed.data.stage}".`,
        href: "/candidate/applications",
        email: { subject: `Update on your application — ${details.title}`, actionLabel: "View your applications", footer: GUEST_ACCOUNT_FOOTER },
      })
    }
    return Response.json(updated)
  } catch (error) {
    if (error instanceof EmployerAuthError) return Response.json({ error: "Authentication required." }, { status: 401 })
    if (error instanceof EmployerOwnershipError) return Response.json({ error: "You do not own this application." }, { status: 404 })
    console.error("Employer application update failed", error)
    return Response.json({ error: "Unable to update application stage." }, { status: 500 })
  }
}
