import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { company } from "@/lib/db/schema"
import { EmployerAuthError, EmployerOwnershipError, requireEmployer } from "@/features/employers/queries"
import { MAX_LOGO_FILE_SIZE, companyLogoKey, deleteResumeFromStorage, isResumeStorageConfigured, sniffLogoType, uploadCompanyLogo } from "@/lib/storage/r2"

function failure(error: unknown) {
  if (error instanceof EmployerAuthError) return Response.json({ error: "Authentication required." }, { status: 401 })
  if (error instanceof EmployerOwnershipError) return Response.json({ error: "Complete your company profile first." }, { status: 409 })
  console.error("[employer] logo update failed", error)
  return Response.json({ error: "We couldn't update the logo. Please try again." }, { status: 500 })
}

/** Our own uploaded logo's storage key, from the company's stored logo path. */
function ownKey(companyId: string, logo: string | null) {
  const match = logo?.match(/^\/api\/company-logo\/([\w-]+)\/(\d+)$/)
  return match && match[1] === companyId ? companyLogoKey(companyId, match[2]!) : null
}

async function currentLogo(companyId: string) {
  const [row] = await db.select({ logo: company.logo }).from(company).where(eq(company.id, companyId)).limit(1)
  return row?.logo ?? null
}

/** Upload or replace the company logo (multipart field "logo": PNG, JPG or WebP up to 1 MB). */
export async function POST(request: Request) {
  try {
    const { profile } = await requireEmployer(request.headers)
    if (!profile.companyId) throw new EmployerOwnershipError()
    if (!isResumeStorageConfigured()) return Response.json({ error: "Logo uploads are temporarily unavailable." }, { status: 503 })
    const form = await request.formData().catch(() => null)
    const file = form?.get("logo")
    if (!(file instanceof File) || file.size === 0) return Response.json({ error: "Choose a logo image to upload." }, { status: 400 })
    if (file.size > MAX_LOGO_FILE_SIZE) return Response.json({ error: "Logos must be 1 MB or smaller." }, { status: 400 })
    const bytes = new Uint8Array(await file.arrayBuffer())
    const type = sniffLogoType(bytes)
    if (!type) return Response.json({ error: "Upload a PNG, JPG or WebP image." }, { status: 400 })

    const previous = await currentLogo(profile.companyId)
    const version = String(Date.now())
    await uploadCompanyLogo({ companyId: profile.companyId, version, bytes, contentType: type })
    const logo = `/api/company-logo/${profile.companyId}/${version}`
    await db.update(company).set({ logo, updatedAt: new Date() }).where(eq(company.id, profile.companyId))
    const oldKey = ownKey(profile.companyId, previous)
    if (oldKey) await deleteResumeFromStorage(oldKey).catch(() => undefined)
    return Response.json({ ok: true, logo })
  } catch (error) { return failure(error) }
}

/** Remove the logo (cards fall back to the company's initials). */
export async function DELETE(request: Request) {
  try {
    const { profile } = await requireEmployer(request.headers)
    if (!profile.companyId) throw new EmployerOwnershipError()
    const previous = await currentLogo(profile.companyId)
    await db.update(company).set({ logo: null, updatedAt: new Date() }).where(eq(company.id, profile.companyId))
    const oldKey = ownKey(profile.companyId, previous)
    if (oldKey) await deleteResumeFromStorage(oldKey).catch(() => undefined)
    return Response.json({ ok: true })
  } catch (error) { return failure(error) }
}
