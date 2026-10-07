import "server-only"

import { promises as fs } from "node:fs"
import path from "node:path"
import { CopyObjectCommand, DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { storedFile } from "@/lib/db/schema"

/**
 * File storage for CVs and application files.
 *
 * Driver selection:
 * - Cloudflare R2 when the R2_* variables are set (recommended at scale).
 * - Otherwise the database (`stored_file` table) in production — free, no
 *   extra service, fine for launch volumes (Neon free tier: 0.5 GB).
 * - Local disk under `.data/uploads` in development (STORAGE_DRIVER=db to use
 *   the database locally too).
 *
 * Files are private. They are only served through authenticated route handlers
 * that check ownership; storage URLs are never handed to the browser.
 */

// 4 MB: Vercel functions accept request bodies up to ~4.5 MB, and CVs are rarely over 1 MB
export const MAX_RESUME_FILE_SIZE = Math.min(Number(process.env.R2_MAX_FILE_SIZE ?? 4 * 1024 * 1024), 4 * 1024 * 1024)

export const ACCEPTED_CV_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/rtf",
  "text/plain",
]
const ACCEPTED_CV_EXTENSIONS = /\.(pdf|doc|docx|rtf|txt)$/i

export type ResumeStorageConfig = {
  accountId: string
  bucket: string
  endpoint: string
  publicUrl: string
  accessKeyId: string
  secretAccessKey: string
  maxFileSize: number
  ready: boolean
}

type StoredFile = { body: Uint8Array; contentType: string; contentLength: number }

type StorageDriver = {
  name: "r2" | "local" | "database"
  put(key: string, file: File | Blob, contentType: string, metadata: Record<string, string>): Promise<void>
  get(key: string): Promise<StoredFile>
  remove(key: string): Promise<void>
  copy(fromKey: string, toKey: string): Promise<void>
}

export function getResumeStorageConfig(): ResumeStorageConfig | null {
  const accountId = process.env.R2_ACCOUNT_ID?.trim()
  const bucket = process.env.R2_BUCKET?.trim()
  const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim()
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim()
  if (!accountId || !bucket || !accessKeyId || !secretAccessKey) return null

  const endpoint = process.env.R2_ENDPOINT_URL?.trim() || `https://${accountId}.r2.cloudflarestorage.com`
  const publicUrl = process.env.R2_PUBLIC_URL?.trim() || `${endpoint.replace(/\/$/, "")}/${bucket}`
  return { accountId, bucket, endpoint, publicUrl, accessKeyId, secretAccessKey, maxFileSize: MAX_RESUME_FILE_SIZE, ready: true }
}

function r2Driver(config: ResumeStorageConfig): StorageDriver {
  const client = new S3Client({ region: "auto", endpoint: config.endpoint, credentials: { accessKeyId: config.accessKeyId, secretAccessKey: config.secretAccessKey } })
  return {
    name: "r2",
    async put(key, file, contentType, metadata) {
      await client.send(new PutObjectCommand({ Bucket: config.bucket, Key: key, Body: new Uint8Array(await file.arrayBuffer()), ContentType: contentType, ContentLength: file.size, Metadata: metadata }))
    },
    async get(key) {
      const response = await client.send(new GetObjectCommand({ Bucket: config.bucket, Key: key }))
      if (!response.Body) throw new Error("The file could not be read from storage.")
      const body = await response.Body.transformToByteArray()
      return { body, contentType: response.ContentType ?? "application/octet-stream", contentLength: body.byteLength }
    },
    async remove(key) {
      await client.send(new DeleteObjectCommand({ Bucket: config.bucket, Key: key }))
    },
    async copy(fromKey, toKey) {
      await client.send(new CopyObjectCommand({ Bucket: config.bucket, Key: toKey, CopySource: `${config.bucket}/${fromKey.split("/").map(encodeURIComponent).join("/")}` }))
    },
  }
}

function localDriver(): StorageDriver {
  const root = path.join(process.cwd(), ".data", "uploads")
  const resolve = (key: string) => {
    const target = path.resolve(root, key)
    if (!target.startsWith(root + path.sep)) throw new Error("Invalid storage key.")
    return target
  }
  return {
    name: "local",
    async put(key, file, contentType) {
      const target = resolve(key)
      await fs.mkdir(path.dirname(target), { recursive: true })
      await fs.writeFile(target, new Uint8Array(await file.arrayBuffer()))
      await fs.writeFile(`${target}.meta.json`, JSON.stringify({ contentType }))
    },
    async get(key) {
      const target = resolve(key)
      const body = new Uint8Array(await fs.readFile(target))
      const meta = JSON.parse(await fs.readFile(`${target}.meta.json`, "utf8").catch(() => "{}")) as { contentType?: string }
      return { body, contentType: meta.contentType ?? "application/octet-stream", contentLength: body.byteLength }
    },
    async remove(key) {
      const target = resolve(key)
      await fs.rm(target, { force: true })
      await fs.rm(`${target}.meta.json`, { force: true })
    },
    async copy(fromKey, toKey) {
      const from = resolve(fromKey), to = resolve(toKey)
      await fs.mkdir(path.dirname(to), { recursive: true })
      await fs.copyFile(from, to)
      await fs.copyFile(`${from}.meta.json`, `${to}.meta.json`).catch(() => undefined)
    },
  }
}

function databaseDriver(): StorageDriver {
  return {
    name: "database",
    async put(key, file, contentType) {
      const data = Buffer.from(await file.arrayBuffer()).toString("base64")
      await db.insert(storedFile).values({ key, contentType, size: file.size, data })
        .onConflictDoUpdate({ target: storedFile.key, set: { contentType, size: file.size, data } })
    },
    async get(key) {
      const [row] = await db.select().from(storedFile).where(eq(storedFile.key, key)).limit(1)
      if (!row) throw new Error("The file could not be found in storage.")
      const body = new Uint8Array(Buffer.from(row.data, "base64"))
      return { body, contentType: row.contentType, contentLength: body.byteLength }
    },
    async remove(key) {
      await db.delete(storedFile).where(eq(storedFile.key, key))
    },
    async copy(fromKey, toKey) {
      const [row] = await db.select().from(storedFile).where(eq(storedFile.key, fromKey)).limit(1)
      if (!row) throw new Error("The file could not be found in storage.")
      await db.insert(storedFile).values({ key: toKey, contentType: row.contentType, size: row.size, data: row.data })
        .onConflictDoUpdate({ target: storedFile.key, set: { contentType: row.contentType, size: row.size, data: row.data } })
    },
  }
}

let cachedDriver: StorageDriver | null | undefined
function getDriver(): StorageDriver | null {
  if (cachedDriver !== undefined) return cachedDriver
  const config = getResumeStorageConfig()
  const requested = process.env.STORAGE_DRIVER?.trim()
  cachedDriver = config ? r2Driver(config)
    : requested === "none" ? null
    : requested === "db" || process.env.NODE_ENV === "production" ? databaseDriver()
    : localDriver()
  return cachedDriver
}

function requireDriver() {
  const driver = getDriver()
  if (!driver) throw new Error(getResumeStorageErrorMessage())
  return driver
}

export function isResumeStorageConfigured() {
  return getDriver() !== null
}

export function getResumeStorageErrorMessage() {
  return "File storage is not configured. Set R2_ACCOUNT_ID, R2_BUCKET, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY in the environment."
}

function safeFileName(fileName: string, fallback: string) {
  return fileName.trim().replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-").replace(/^-+|-+$/g, "").slice(0, 120) || fallback
}

/** Validate a CV upload. Returns an error message, or null when acceptable. */
export function validateCvFile(file: unknown): string | null {
  if (!(file instanceof File) || file.size === 0) return "Attach your CV (PDF, Word, RTF or TXT)."
  if (!ACCEPTED_CV_TYPES.includes(file.type) && !ACCEPTED_CV_EXTENSIONS.test(file.name)) return "Upload your CV as a PDF, DOC, DOCX, RTF or TXT file."
  if (file.size > MAX_RESUME_FILE_SIZE) return `CV files must be ${Math.round(MAX_RESUME_FILE_SIZE / (1024 * 1024))} MB or smaller.`
  return null
}

export function buildResumeStorageKey(candidateId: string, fileName: string) {
  return `candidates/${candidateId}/resumes/${Date.now()}-${safeFileName(fileName, "resume")}`
}

export async function uploadResumeToStorage({ candidateId, fileName, file }: { candidateId: string; fileName: string; file: File | Blob }) {
  const key = buildResumeStorageKey(candidateId, fileName)
  const mimeType = file.type || "application/octet-stream"
  await requireDriver().put(key, file, mimeType, { candidateId, originalName: fileName })
  // Kept for the existing `url` column; files are only served through the download routes.
  return { key, url: `storage://${key}`, mimeType }
}

/** Store a CV that belongs to one application (its own copy, independent of the profile resume). */
export async function uploadApplicationFileToStorage({ applicationKey, fileName, file }: { applicationKey: string; fileName: string; file: File | Blob }) {
  const key = `applications/${applicationKey}/${Date.now()}-${safeFileName(fileName, "cv")}`
  const mimeType = file.type || "application/octet-stream"
  await requireDriver().put(key, file, mimeType, { applicationKey, originalName: fileName })
  return { key, mimeType }
}

/** Copy the candidate's profile resume into an application-owned file. */
export async function copyResumeToApplication({ applicationKey, storageKey, fileName }: { applicationKey: string; storageKey: string; fileName: string }) {
  const key = `applications/${applicationKey}/${Date.now()}-${safeFileName(fileName, "cv")}`
  await requireDriver().copy(storageKey, key)
  return { key }
}

export async function deleteResumeFromStorage(key: string) {
  const driver = getDriver()
  if (!driver) return false
  await driver.remove(key)
  return true
}

export async function getResumeFileFromStorage(key: string) {
  return requireDriver().get(key)
}

// --- Company logos (public images, served by /api/company-logo/<companyId>/<version>) ---

export const MAX_LOGO_FILE_SIZE = 1024 * 1024

/** The image type from the file's first bytes (PNG, JPEG, WebP), never trusting the name or browser. */
export function sniffLogoType(bytes: Uint8Array): "image/png" | "image/jpeg" | "image/webp" | null {
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "image/png"
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg"
  if (String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP") return "image/webp"
  return null
}

export function companyLogoKey(companyId: string, version: string) {
  return `logos/${companyId}/${version}`
}

export async function uploadCompanyLogo({ companyId, version, bytes, contentType }: { companyId: string; version: string; bytes: Uint8Array; contentType: string }) {
  const key = companyLogoKey(companyId, version)
  await requireDriver().put(key, new Blob([bytes as BlobPart], { type: contentType }), contentType, { companyId })
  return key
}
