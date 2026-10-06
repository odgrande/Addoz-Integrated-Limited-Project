import { z } from "zod"
import { employerEmail, isEmailConfigured, sendEmail } from "@/lib/email"
import { EmployerAuthError, EmployerOwnershipError, getEmployerApplicant, getEmployerContext } from "@/features/employers/queries"
import { MessagesAccessError, openApplicationConversation, sendMessage } from "@/features/messages/server"

const contactSchema = z.object({
  subject: z.string().trim().min(2, "Add a subject.").max(160, "Keep the subject under 160 characters."),
  body: z.string().trim().min(5, "Write a short message.").max(5000, "Keep the message under 5,000 characters."),
  email: z.boolean().default(true),
  message: z.boolean().default(false),
}).refine(value => value.email || value.message, { message: "Choose email, in-app message, or both." })

/**
 * Contact one applicant: an email sent by ADDOZ (replies go straight to the
 * employer), an in-app message on the application thread, or both.
 */
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const id = (await context.params).id
    const employer = await getEmployerContext(request.headers)
    const applicant = await getEmployerApplicant(request.headers, id)
    const parsed = contactSchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) return Response.json({ error: parsed.error.issues[0]?.message ?? "Check your message." }, { status: 400 })
    const input = parsed.data
    const sent: string[] = []

    if (input.email) {
      if (!isEmailConfigured()) return Response.json({ error: "Email isn't available right now. Send an in-app message instead." }, { status: 503 })
      await sendEmail(employerEmail({
        to: applicant.candidateEmail,
        subject: input.subject,
        candidateName: applicant.candidateName,
        employerName: employer.user.name,
        companyName: employer.company?.name ?? "the hiring team",
        jobTitle: applicant.jobTitle,
        body: input.body,
        replyTo: { email: employer.user.email, name: employer.user.name },
      }))
      sent.push("email")
    }
    if (input.message) {
      const viewer = { userId: employer.session.user.id, role: "employer" as const, name: employer.user.name, companyId: employer.profile.companyId }
      const conversationId = await openApplicationConversation(viewer, id)
      // When an email went out too, the in-app message doesn't send a second email
      await sendMessage(viewer, conversationId, `${input.subject}\n\n${input.body}`, { emailRecipients: !input.email })
      sent.push("message")
    }
    return Response.json({ ok: true, sent })
  } catch (error) {
    if (error instanceof EmployerAuthError) return Response.json({ error: "Authentication required." }, { status: 401 })
    if (error instanceof EmployerOwnershipError || error instanceof MessagesAccessError) return Response.json({ error: "Applicant not found." }, { status: 404 })
    console.error("[employer] contacting applicant failed", error)
    return Response.json({ error: "We couldn't send that. Please try again." }, { status: 500 })
  }
}
