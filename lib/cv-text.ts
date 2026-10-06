import "server-only"

import { strFromU8, unzipSync } from "fflate"

const MAX_TEXT = 40_000

function tidy(text: string) {
  return text.replace(/\u0000/g, " ").replace(/[ \t\f\v]+/g, " ").replace(/\s*\n\s*/g, "\n").trim().slice(0, MAX_TEXT)
}

function decodeEntities(text: string) {
  return text.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'")
}

async function pdfText(bytes: Uint8Array) {
  const { extractText, getDocumentProxy } = await import("unpdf")
  const pdf = await getDocumentProxy(bytes)
  const { text } = await extractText(pdf, { mergePages: true })
  return text
}

function docxText(bytes: Uint8Array) {
  const files = unzipSync(bytes, { filter: file => file.name === "word/document.xml" })
  const xml = files["word/document.xml"]
  if (!xml) return ""
  return decodeEntities(strFromU8(xml).replace(/<\/w:p>/g, "\n").replace(/<w:tab\/>/g, " ").replace(/<[^>]+>/g, ""))
}

function rtfText(raw: string) {
  return raw.replace(/\\par[d]?/g, "\n").replace(/\{\\\*[^{}]*\}/g, "").replace(/\\'[0-9a-f]{2}/gi, " ").replace(/\\[a-z]+-?\d* ?/gi, "").replace(/[{}]/g, "")
}

/** Legacy .doc is binary; its text runs are stored as plain or UTF-16 characters. */
function docText(bytes: Uint8Array) {
  const utf16 = Buffer.from(bytes).toString("utf16le").match(/[\x20-\x7E -ɏ\n\r\t]{4,}/g) ?? []
  const latin = Buffer.from(bytes).toString("latin1").match(/[\x20-\x7E\n\r\t]{6,}/g) ?? []
  return (utf16.join(" ").length > latin.join(" ").length ? utf16 : latin).join("\n")
}

/**
 * Best-effort plain text of a CV (PDF, DOCX, DOC, RTF, TXT) for match scoring.
 * Never throws: an unreadable file just yields "" and the applicant is scored
 * from the rest of their application.
 */
export async function extractCvText(file: Blob | Uint8Array, fileName = "", mimeType = "") {
  try {
    const bytes = file instanceof Uint8Array ? file : new Uint8Array(await file.arrayBuffer())
    const name = fileName.toLowerCase()
    const type = mimeType.toLowerCase()
    let text = ""
    if (name.endsWith(".pdf") || type === "application/pdf") text = await pdfText(bytes)
    else if (name.endsWith(".docx") || type.includes("officedocument.wordprocessingml")) text = docxText(bytes)
    else if (name.endsWith(".rtf") || type.includes("rtf")) text = rtfText(Buffer.from(bytes).toString("latin1"))
    else if (name.endsWith(".doc") || type === "application/msword") text = docText(bytes)
    else text = Buffer.from(bytes).toString("utf8")
    return tidy(text)
  } catch (error) {
    console.error("[cv-text] could not read CV text", error instanceof Error ? error.message : error)
    return ""
  }
}
