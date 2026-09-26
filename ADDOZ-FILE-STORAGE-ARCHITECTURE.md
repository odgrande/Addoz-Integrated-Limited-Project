# ADDOZ File Storage Architecture

**Directive:** 015 — Production Resume & File Storage
**Status:** Implemented with explicit Cloudflare R2 configuration gating

## Storage foundation

Resume storage is implemented around a server-only abstraction in `lib/storage/r2.ts`. The application reads Cloudflare R2 settings from environment variables and refuses to upload unless the required runtime values are present:

- `R2_ACCOUNT_ID`
- `R2_BUCKET`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_PUBLIC_URL` (optional override for public object URL generation)
- `R2_ENDPOINT_URL` (optional override for custom R2 endpoints)
- `R2_MAX_FILE_SIZE` (optional override, defaults to 10 MB)

No storage credentials are exposed to the browser. The public URL is generated on the server side only when the storage config is available.

## Object naming and path layout

Candidate resumes are stored in a candidate-scoped path:

- `candidates/<candidateId>/resumes/<timestamp>-<safe-file-name>`

The object key is created server-side and written to the `resume.storage_key` column for later retrieval and deletion.

## Resume model

The existing `resume` entity in `lib/db/schema.ts` is extended rather than duplicated. It stores:

- `candidate_id` ownership
- `file_name`
- `file_size`
- `url`
- `storage_key`
- `mime_type`
- `status`
- `uploaded_at`
- `last_scan` (retained for future scanning hooks)

This preserves the existing candidate profile and application relationships without introducing a second resume table.

## Upload flow

The candidate resume page now submits a real multipart file upload to the candidate API route at `/api/candidate/resume`. The server validates:

- authenticated candidate ownership
- allowed file types (`PDF`, `DOC`, `DOCX`, `RTF`, `TXT`)
- non-empty file
- file size limit
- filename sanitization

Only after validation does the server send the file to Cloudflare R2 using the AWS S3 client for R2.

## Authorization and security

The server enforces candidate-owned access for every resume operation:

- upload: only the authenticated candidate may upload their own resume
- replace: previous candidate resume is removed before the new object is written
- delete: candidate must own the record before object deletion and DB deletion
- download: `/api/candidate/resume/download?id=...` verifies the record belongs to the authenticated candidate before returning bytes

No candidate can access another candidate’s resume because every database lookup is scoped by `resume.candidate_id = profile.id`.

## Failure handling

The implementation is explicit about availability:

- If the required R2 environment variables are not configured, upload endpoints return `503` and the UI shows a configuration message.
- If a file is invalid or oversized, the server returns `400` with a clear validation error.
- If R2 is misconfigured or the object cannot be fetched, the server returns an honest failure state instead of fabricating a successful upload.

## Current configuration status

The local workspace does not currently contain Cloudflare R2 credentials. The storage abstraction is implemented and ready for deployment, but live upload verification requires a valid `.env.local` with the R2 values populated.
