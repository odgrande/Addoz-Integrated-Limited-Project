import "server-only"

import { getResumeFileFromStorage, isResumeStorageConfigured } from "./r2"

/** Stream a stored private file as a download. Callers must check access first. */
// Types a browser can show safely in a tab/iframe; everything else downloads
const INLINE_TYPES = new Set(["application/pdf", "text/plain"])

/** Stream a stored private file (download, or `inline` for PDFs/text so it opens in the browser). */
export async function storedFileResponse({ storageKey, fileName, mimeType, inline = false }: { storageKey: string; fileName: string | null; mimeType: string | null; inline?: boolean }) {
  if (!isResumeStorageConfigured()) return Response.json({ error: "File storage is not available." }, { status: 503 })
  const file = await getResumeFileFromStorage(storageKey)
  const name = fileName || "cv"
  const type = mimeType || file.contentType || "application/octet-stream"
  const disposition = inline && INLINE_TYPES.has(type.split(";")[0]!.trim().toLowerCase()) ? "inline" : "attachment"
  return new Response(file.body as BodyInit, {
    headers: {
      "Content-Type": type,
      "Content-Length": String(file.contentLength),
      "Content-Disposition": `${disposition}; filename="${name.replace(/[^\x20-\x7e]/g, "_").replace(/"/g, "")}"; filename*=UTF-8''${encodeURIComponent(name)}`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  })
}
