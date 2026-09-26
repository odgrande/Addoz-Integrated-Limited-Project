import { and, eq } from "drizzle-orm"
import { CandidateAuthError, requireCandidate } from "@/features/candidates/queries"
import { db } from "@/lib/db"
import { resume } from "@/lib/db/schema"
import { getResumeFileFromStorage, getResumeStorageErrorMessage, isResumeStorageConfigured } from "@/lib/storage/r2"

async function toBuffer(body: unknown): Promise<Uint8Array> {
  if (!body) return new Uint8Array()
  if (typeof (body as { transformToByteArray?: () => Promise<Uint8Array> }).transformToByteArray === "function") {
    return new Uint8Array(await (body as { transformToByteArray: () => Promise<Uint8Array> }).transformToByteArray())
  }
  if (body instanceof Uint8Array) return body
  if (Buffer.isBuffer(body)) return new Uint8Array(body)
  if (typeof body === "string") return new TextEncoder().encode(body)

  const chunks: Uint8Array[] = []
  for await (const chunk of body as AsyncIterable<Buffer | Uint8Array | string>) {
    const next = Buffer.isBuffer(chunk) ? new Uint8Array(chunk) : typeof chunk === "string" ? new TextEncoder().encode(chunk) : new Uint8Array(chunk)
    chunks.push(next)
  }
  return Buffer.concat(chunks.map(chunk => Buffer.from(chunk)))
}

export async function GET(request: Request) {
  try {
    const { profile } = await requireCandidate(request.headers)
    const id = new URL(request.url).searchParams.get("id")
    if (!id) return Response.json({ error: "Resume id is required." }, { status: 400 })

    const [record] = await db.select().from(resume).where(and(eq(resume.id, id), eq(resume.candidateId, profile.id))).limit(1)
    if (!record || !record.storageKey) return Response.json({ error: "Resume not found." }, { status: 404 })
    if (!isResumeStorageConfigured()) return Response.json({ error: getResumeStorageErrorMessage() }, { status: 503 })

    const file = await getResumeFileFromStorage(record.storageKey)
    const bytes = await toBuffer(file.body)
    return new Response(bytes, {
      headers: {
        "Content-Type": record.mimeType || file.contentType || "application/octet-stream",
        "Content-Length": String(bytes.byteLength),
        "Content-Disposition": `attachment; filename="${encodeURIComponent(record.fileName)}"`,
      },
    })
  } catch (error) {
    if (error instanceof CandidateAuthError) return Response.json({ error: "Authentication required." }, { status: 401 })
    console.error("Resume download failed", error)
    return Response.json({ error: "Unable to download resume." }, { status: 500 })
  }
}
