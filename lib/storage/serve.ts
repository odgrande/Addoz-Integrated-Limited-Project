import "server-only"

import { getResumeFileFromStorage, isResumeStorageConfigured } from "./r2"

/** Stream a stored private file as a download. Callers must check access first. */
export async function storedFileResponse({ storageKey, fileName, mimeType }: { storageKey: string; fileName: string | null; mimeType: string | null }) {
  if (!isResumeStorageConfigured()) return Response.json({ error: "File storage is not available." }, { status: 503 })
  const file = await getResumeFileFromStorage(storageKey)
  const name = fileName || "cv"
  return new Response(file.body as BodyInit, {
    headers: {
      "Content-Type": mimeType || file.contentType || "application/octet-stream",
      "Content-Length": String(file.contentLength),
      "Content-Disposition": `attachment; filename="${name.replace(/[^\x20-\x7e]/g, "_").replace(/"/g, "")}"; filename*=UTF-8''${encodeURIComponent(name)}`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  })
}
