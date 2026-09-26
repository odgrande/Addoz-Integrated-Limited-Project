import "server-only"

import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3"

export const MAX_RESUME_FILE_SIZE = Number(process.env.R2_MAX_FILE_SIZE ?? 10 * 1024 * 1024)

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

export function getResumeStorageConfig(): ResumeStorageConfig | null {
  const accountId = process.env.R2_ACCOUNT_ID?.trim()
  const bucket = process.env.R2_BUCKET?.trim()
  const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim()
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim()
  if (!accountId || !bucket || !accessKeyId || !secretAccessKey) return null

  const endpoint = process.env.R2_ENDPOINT_URL?.trim() || `https://${accountId}.r2.cloudflarestorage.com`
  const publicUrl = process.env.R2_PUBLIC_URL?.trim() || `${endpoint.replace(/\/$/, "")}/${bucket}`
  return {
    accountId,
    bucket,
    endpoint,
    publicUrl,
    accessKeyId,
    secretAccessKey,
    maxFileSize: MAX_RESUME_FILE_SIZE,
    ready: true,
  }
}

export function isResumeStorageConfigured() {
  return getResumeStorageConfig() !== null
}

export function getResumeStorageErrorMessage() {
  return "Resume storage is not configured. Set R2_ACCOUNT_ID, R2_BUCKET, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY in the environment."
}

export function buildResumeStorageKey(candidateId: string, fileName: string) {
  const safeName = fileName
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120) || "resume"
  const stamp = Date.now()
  return `candidates/${candidateId}/resumes/${stamp}-${safeName}`
}

export function getPublicResumeUrl(storageKey: string) {
  const config = getResumeStorageConfig()
  if (!config) return null
  return `${config.publicUrl.replace(/\/$/, "")}/${storageKey.replace(/^\/+/, "")}`
}

export function createResumeClient() {
  const config = getResumeStorageConfig()
  if (!config) throw new Error(getResumeStorageErrorMessage())

  return new S3Client({
    region: "auto",
    endpoint: config.endpoint,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  })
}

export async function uploadResumeToStorage({ candidateId, fileName, file }: { candidateId: string; fileName: string; file: File | Blob }) {
  const config = getResumeStorageConfig()
  if (!config) throw new Error(getResumeStorageErrorMessage())

  const key = buildResumeStorageKey(candidateId, fileName)
  const client = createResumeClient()
  const mimeType = file.type || "application/octet-stream"

  await client.send(new PutObjectCommand({
    Bucket: config.bucket,
    Key: key,
    Body: file,
    ContentType: mimeType,
    ContentLength: file.size,
    Metadata: {
      candidateId,
      originalName: fileName,
    },
  }))

  return {
    key,
    url: getPublicResumeUrl(key) ?? `${config.endpoint.replace(/\/$/, "")}/${config.bucket}/${key}`,
    mimeType,
  }
}

export async function uploadApplicationFileToStorage({ applicationId, fileName, file, prefix = "applications" }: { applicationId: string; fileName: string; file: File | Blob; prefix?: string }) {
  const config = getResumeStorageConfig()
  if (!config) throw new Error(getResumeStorageErrorMessage())

  const safeName = fileName.trim().replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-").replace(/^-+|-+$/g, "").slice(0, 120) || "application-file"
  const key = `${prefix}/${applicationId}/${Date.now()}-${safeName}`
  const client = createResumeClient()
  const mimeType = file.type || "application/octet-stream"

  await client.send(new PutObjectCommand({
    Bucket: config.bucket,
    Key: key,
    Body: file,
    ContentType: mimeType,
    ContentLength: file.size,
    Metadata: {
      applicationId,
      originalName: fileName,
    },
  }))

  return {
    key,
    url: getPublicResumeUrl(key) ?? `${config.endpoint.replace(/\/$/, "")}/${config.bucket}/${key}`,
    mimeType,
  }
}

export async function deleteResumeFromStorage(key: string) {
  const config = getResumeStorageConfig()
  if (!config) return false

  const client = createResumeClient()
  await client.send(new DeleteObjectCommand({ Bucket: config.bucket, Key: key }))
  return true
}

export async function getResumeFileFromStorage(key: string) {
  const config = getResumeStorageConfig()
  if (!config) throw new Error(getResumeStorageErrorMessage())

  const client = createResumeClient()
  const response = await client.send(new GetObjectCommand({ Bucket: config.bucket, Key: key }))
  const body = response.Body
  if (!body) throw new Error("The resume file could not be read from storage.")

  return {
    body,
    contentType: response.ContentType ?? "application/octet-stream",
    contentLength: response.ContentLength ?? undefined,
    contentDisposition: response.ContentDisposition ?? undefined,
  }
}
