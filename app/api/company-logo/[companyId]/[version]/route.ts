import { companyLogoKey, getResumeFileFromStorage, sniffLogoType } from "@/lib/storage/r2"

/**
 * A company's uploaded logo. Logos are public (shown on job cards), so this is
 * unauthenticated; each upload gets a new version in the URL, so it caches forever.
 */
export async function GET(_request: Request, context: { params: Promise<{ companyId: string; version: string }> }) {
  const { companyId, version } = await context.params
  if (!/^[0-9a-f-]{36}$/i.test(companyId) || !/^\d{10,16}$/.test(version)) return new Response("Not found", { status: 404 })
  try {
    const file = await getResumeFileFromStorage(companyLogoKey(companyId, version))
    // Only ever serve real images, whatever was stored
    const type = sniffLogoType(file.body)
    if (!type) return new Response("Not found", { status: 404 })
    return new Response(file.body as BodyInit, {
      headers: {
        "Content-Type": type,
        "Content-Length": String(file.contentLength),
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'none'",
      },
    })
  } catch {
    return new Response("Not found", { status: 404 })
  }
}
